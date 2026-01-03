'use client';

import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

/* ----------------------------- Types & Defaults ---------------------------- */
type CustomTheme = {
  accent: string;
  background: string;
  foreground: string;
  card: string;
  radius: number;
  density: 'compact' | 'comfortable' | 'spacious';
};

const STORAGE_KEY = 'ui:theme:custom';
const DEFAULTS: CustomTheme = {
  accent: '#3B82F6',
  background: '#111827',
  foreground: '#F9FAFB',
  card: '#1F2937',
  radius: 12,
  density: 'comfortable',
};

/* --------------------------------- Helpers -------------------------------- */
function applyVars(t: CustomTheme) {
  const r = document.documentElement;
  r.style.setProperty('--accent-hex', t.accent);
  r.style.setProperty('--background-hex', t.background);
  r.style.setProperty('--foreground-hex', t.foreground);
  r.style.setProperty('--card-hex', t.card);
  r.style.setProperty('--radius', `${t.radius}px`);
  r.style.setProperty('--density-scale', String(t.density === 'compact' ? 0.9 : t.density === 'spacious' ? 1.15 : 1));
}
function loadTheme(): CustomTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

/* ------------------------------ Preview Pieces ----------------------------- */
function NavItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div
      className={clsx(
        'mb-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs',
        active ? 'font-semibold' : 'opacity-80'
      )}
      style={{ background: active ? 'color-mix(in oklab, var(--accent-hex) 18%, transparent)' : undefined }}
    >
      <div
        className="h-4 w-4 rounded-sm border"
        style={{ background: active ? 'var(--accent-hex)' : 'transparent', borderColor: 'rgba(255,255,255,0.12)' }}
      />
      {label}
    </div>
  );
}

function Widget({ title, kpi, trend }: { title: string; kpi: string; trend: string }) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{ background: 'var(--card-hex)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius)' }}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs opacity-70">{title}</div>
        <div className="h-2 w-2 rounded-full" style={{ background: 'var(--accent-hex)' }} />
      </div>
      <div className="mt-2 text-xl font-semibold">{kpi}</div>
      <div className="mt-1 text-[11px] opacity-70" style={{ color: 'color-mix(in oklab, var(--accent-hex) 80%, var(--foreground-hex))' }}>
        {trend}
      </div>
      <div className="mt-3 h-10 w-full overflow-hidden rounded-sm" style={{ background: 'linear-gradient(0deg, rgba(255,255,255,0.04), transparent)' }}>
        <div className="h-full w-full" style={{ background: `repeating-linear-gradient(90deg, color-mix(in oklab, var(--accent-hex) 14%, transparent) 0 8px, transparent 8px 16px)` }} />
      </div>
    </div>
  );
}

function CardWide() {
  return (
    <div
      className="col-span-3 rounded-lg border p-4"
      style={{ background: 'var(--card-hex)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium opacity-90">Recent Activity</div>
        <button
          className="rounded-md border px-2 py-1 text-xs"
          style={{ background: 'var(--accent-hex)', color: 'var(--background-hex)', borderColor: 'transparent' }}
        >
          View All
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-3 text-xs opacity-85">
        {['Created contact • John', 'Updated form • LeadGen-7', 'New submission • LP-Home'].map((t) => (
          <div key={t} className="rounded-md border px-2 py-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

function CardTall() {
  return (
    <div
      className="rounded-lg border p-4"
      style={{ background: 'var(--card-hex)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius)' }}
    >
      <div className="mb-2 text-sm font-medium opacity-90">Campaigns</div>
      <div className="space-y-2 text-xs opacity-85">
        {['Summer Push', 'BFCM 2025', 'Re-Engage'].map((t, i) => (
          <div key={t} className="flex items-center justify-between rounded-md border px-2 py-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <span>{t}</span>
            <div className="h-2 w-16 rounded-full" style={{ background: i === 0 ? 'var(--accent-hex)' : 'rgba(255,255,255,0.12)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AppShellMock() {
  return (
    <div className="grid grid-cols-[220px,1fr] h-full">
      {/* Sidebar */}
      <aside className="h-full border-r" style={{ background: 'color-mix(in oklab, var(--card-hex) 88%, black 8%)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="px-3 py-3">
          <div className="mb-3 flex items-center gap-2 rounded-lg px-2 py-2" style={{ background: 'color-mix(in oklab, var(--accent-hex) 22%, transparent)', borderRadius: 'var(--radius)' }}>
            <div className="h-6 w-6 rounded-md" style={{ background: 'var(--accent-hex)' }} />
            <div className="text-sm font-semibold">Saltify</div>
          </div>
          <NavItem label="Dashboard" active />
          <NavItem label="Contacts" />
          <NavItem label="Data Tables" />
          <NavItem label="Forms" />
          <NavItem label="Automations" />
          <div className="mt-3 border-t border-white/10 pt-3">
            <NavItem label="Settings" />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-2" style={{ background: 'color-mix(in oklab, var(--card-hex) 80%, transparent)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="text-sm font-medium opacity-90">Dashboard</div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-40 rounded-md border px-2 text-xs opacity-80" style={{ background: 'var(--background-hex)', borderColor: 'rgba(255,255,255,0.08)' }}>
              Search…
            </div>
            <div className="h-8 w-8 rounded-md" style={{ background: 'var(--accent-hex)' }} />
          </div>
        </header>

        <div className="grid flex-1 grid-cols-3 gap-3 p-4 overflow-hidden">
          <Widget title="Leads" kpi="1,248" trend="+8.2%" />
          <Widget title="Conversions" kpi="312" trend="+2.1%" />
          <Widget title="Revenue" kpi="$42.8k" trend="+5.4%" />
          <CardWide />
          <CardTall />
          <CardTall />
        </div>
      </div>
    </div>
  );
}

/* ------------------------- iMac-style Screen Frame ------------------------- */
function IMacScreen({ className }: { className?: string }) {
  return (
    <div className={clsx('w-full h-full', className)}>
      {/* Bezel as absolute fill inside aspect-ratio box */}
      <div className="relative w-full h-full">
        {/* Black bezel */}
        <div className="absolute inset-0 rounded-[26px] bg-black shadow-2xl overflow-hidden">
          {/* camera */}
          <div className="relative h-[5%] min-h-[14px]">
            <div className="absolute left-1/2 top-2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-black/60 ring-2 ring-black/30" />
          </div>

          {/* Screen area */}
          <div className="absolute left-[1%] right-[1%] top-[6%] bottom-[18%] rounded-[18px] overflow-hidden" style={{ background: 'var(--background-hex)', color: 'var(--foreground-hex)' }}>
            <AppShellMock />
          </div>

          {/* Silver chin */}
          <div
            className="absolute left-0 right-0 bottom-0 h-[18%] border-t"
            style={{
              background: 'linear-gradient(180deg, #E7EAEE 0%, #C8CDD2 70%, #B6BBC1 100%)',
              borderColor: '#9AA1A8',
            }}
          >
            <div className="mx-auto mt-[6%] h-5 w-5 rounded-full" style={{ background: 'linear-gradient(180deg, #9AA1A8 0%, #7F888F 100%)' }} />
          </div>
        </div>

        {/* Stand */}
        <div className="absolute left-1/2 -bottom-6 h-2 w-24 -translate-x-1/2 rounded-full bg-black/20" />
        <div className="absolute left-1/2 -bottom-10 h-4 w-40 -translate-x-1/2 rounded-b-[14px]" style={{ background: 'linear-gradient(180deg, #CDD2D8 0%, #B8BFC6 60%, #AAB1B9 100%)' }} />
      </div>
    </div>
  );
}

/* -------------------------------- Main Panel ------------------------------- */
export default function CustomThemePanel({ className }: { className?: string }) {
  const [t, setT] = useState<CustomTheme>(DEFAULTS);
  const [dirty, setDirty] = useState(false);

  useEffect(() => setT(loadTheme()), []);
  useEffect(() => { if (dirty) { applyVars(t); localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } }, [t, dirty]);
  useEffect(() => { applyVars(t); }, []);

  const set = <K extends keyof CustomTheme>(k: K, v: CustomTheme[K]) => {
    setDirty(true);
    setT((s) => ({ ...s, [k]: v }));
  };

  const padCls = useMemo(
    () => (t.density === 'compact' ? 'p-3' : t.density === 'spacious' ? 'p-6' : 'p-4'),
    [t.density]
  );

  return (
    <section className={clsx('rounded-lg border p-4', className)}>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium">Custom Theme</h4>
        <button
          className="rounded-md border px-2 py-1 text-xs hover:bg-muted/50"
          onClick={() => { setDirty(true); setT(DEFAULTS); }}
        >
          Reset
        </button>
      </div>

      {/* OPTIONS (top) */}
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <label className="text-sm">
            <div className="mb-1 text-muted-foreground">Accent</div>
            <input type="color" className="h-9 w-full rounded-md border bg-background px-2 py-1" value={t.accent} onChange={(e) => set('accent', e.target.value)} />
          </label>
          <label className="text-sm">
            <div className="mb-1 text-muted-foreground">Background</div>
            <input type="color" className="h-9 w-full rounded-md border bg-background px-2 py-1" value={t.background} onChange={(e) => set('background', e.target.value)} />
          </label>
          <label className="text-sm">
            <div className="mb-1 text-muted-foreground">Foreground</div>
            <input type="color" className="h-9 w-full rounded-md border bg-background px-2 py-1" value={t.foreground} onChange={(e) => set('foreground', e.target.value)} />
          </label>
          <label className="text-sm">
            <div className="mb-1 text-muted-foreground">Card</div>
            <input type="color" className="h-9 w-full rounded-md border bg-background px-2 py-1" value={t.card} onChange={(e) => set('card', e.target.value)} />
          </label>
        </div>

        <label className="text-sm block">
          <div className="mb-1 text-muted-foreground">Border Radius</div>
          <input type="range" min={0} max={24} value={t.radius} onChange={(e) => set('radius', Number(e.target.value))} className="w-full" />
          <div className="mt-1 text-xs text-muted-foreground">{t.radius}px</div>
        </label>

        <label className="text-sm block">
          <div className="mb-1 text-muted-foreground">Density</div>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={t.density}
            onChange={(e) => set('density', e.target.value as CustomTheme['density'])}
          >
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
            <option value="spacious">Spacious</option>
          </select>
        </label>
      </div>

      {/* PREVIEW (bottom) — full width, fixed aspect */}
      <div className={clsx('mt-5 rounded-lg border p-2 md:p-3', padCls)} style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {/* Aspect-ratio box (16:10); modern browsers support CSS aspect-ratio */}
        <div className="relative w-full" style={{ aspectRatio: '16 / 10' }}>
          <IMacScreen className="absolute inset-0" />
        </div>
      </div>
    </section>
  );
}
