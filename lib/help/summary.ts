// lib/help/summary.ts
// server-only: do not import into client components
import 'server-only';

import { load } from 'cheerio';          // npm i cheerio
import OpenAI from 'openai';             // npm i openai
import { unstable_cache } from 'next/cache';

export type HelpSummary = { title: string; bullets: string[] };

const BASE = process.env.HELP_BASE_URL ?? 'https://help.saltifysaas.com';

function extractMain(html: string): { title: string; text: string } {
  const $ = load(html);
  const title = $('h1').first().text().trim() || 'Settings';
  const main = $('main, article').first();
  const text = (main.length ? main : $('body'))
    .text()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000); // guardrail
  return { title, text };
}

async function summarize(title: string, text: string): Promise<HelpSummary> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const prompt = `
Return ONLY valid JSON: {"title": "...", "bullets": ["..."]}

Summarize for an in-app help rail:
- 5–8 concise, actionable bullets (<= 18 words)
- No fluff; focus on what/why/how

PAGE TITLE: ${title}
PAGE TEXT:
${text}
  `.trim();

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });

  const content = resp.choices[0]?.message?.content || '{}';
  const json = JSON.parse(content);
  const bullets = Array.isArray(json.bullets) ? json.bullets.slice(0, 8) : [];
  return { title: String(json.title || title || 'Settings').trim(), bullets };
}

export function helpUrlForPath(pathname: string): string {
  const clean = pathname.replace(/^\/+/, '');
  return `${BASE}/${clean}`;
}

/** Cached public entry point (24h). Call only from server. */
export const getHelpSummaryFor = unstable_cache(
  async (pathname: string): Promise<HelpSummary> => {
    const url = helpUrlForPath(pathname);
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } }); // 24h
    if (!res.ok) {
      return {
        title: 'Settings',
        bullets: [
          'Open the full help page from the link at right.',
          'Use help search to find specific topics.',
          'Contact support for guided setup.',
        ],
      };
    }
    const html = await res.text();
    const { title, text } = extractMain(html);

    // For very short pages, extract key lines without calling the model
    if (text.length < 400) {
      const bullets = text
        .split(/[•\-\n]/g)
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 6);
      return { title, bullets: bullets.length ? bullets : [text] };
    }

    try {
      return await summarize(title, text);
    } catch {
      return { title, bullets: ['Summary temporarily unavailable. Open the full page for details.'] };
    }
  },
  (pathname: string) => ['help-summary', pathname],
  { revalidate: 60 * 60 * 24 }
);
