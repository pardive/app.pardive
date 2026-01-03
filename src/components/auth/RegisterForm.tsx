'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// ====== Config ======
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'saltifysaas.com';
// Local API by default (override with NEXT_PUBLIC_CHECK_SUBDOMAIN_URL)
const CHECK_URL = process.env.NEXT_PUBLIC_CHECK_SUBDOMAIN_URL || '/api/check-subdomain';
const ALLOW_OPTIMISTIC_CONTINUE = true; // allow continue when checker errors out

// ====== Helpers ======
const RESERVED = new Set([
  'www','app','api','cdn','static','assets','admin','edge','docs','help','status','support','blog','dev','stage','staging','prod','production','dashboard','mail','smtp','imap','ftp','sso','auth','login','logout','register','signup','files','media','images','img','video','portal','store','shop','billing','payments','ws','socket','graphql','rest','v1','v2'
]);

type Step = 1 | 2 | 3;

type Status = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'reserved' | 'error';

function isAlnum(c: string) {
  const code = c.charCodeAt(0);
  return (code >= 48 && code <= 57) || (code >= 97 && code <= 122);
}

function isValidSubdomain(s: string) {
  if (!s) return false;
  if (s.length < 3 || s.length > 63) return false;
  for (const ch of s) {
    const ok = ch === '-' || isAlnum(ch);
    if (!ok) return false;
  }
  return true;
}

function slugify(input: string) {
  let s = (input || '').toLowerCase();
  let out = '';
  let lastHyphen = false;
  for (const ch of s) {
    if (isAlnum(ch)) {
      out += ch;
      lastHyphen = false;
    } else {
      if (!lastHyphen) {
        out += '-';
        lastHyphen = true;
      }
    }
  }
  while (out.startsWith('-')) out = out.slice(1);
  while (out.endsWith('-')) out = out.slice(0, -1);
  return out;
}

function wordsLower(raw: string) {
  const lowered = (raw || '').toLowerCase();
  let buf = '';
  for (const ch of lowered) buf += isAlnum(ch) ? ch : ' ';
  return buf.split(' ').filter(Boolean);
}

function normalizeCompanyName(raw: string) {
  const stop = new Set(['private','pvt','limited','ltd','inc','corp','llp','llc','company','co','india','technologies','technology','solutions','labs','systems']);
  const words = wordsLower(raw).filter(w => !stop.has(w));
  return words.join(' ');
}

function baseFromCompany(company: string) {
  const clean = normalizeCompanyName(company);
  const base = slugify(clean) || 'workspace';
  const parts = base.split('-');
  return (parts.slice(0, 2).join('-')) || base;
}

// Deterministic shuffle so the refresh icon reorders suggestions
function seededShuffle<T>(arr: T[], seed: number) {
  const out = [...arr];
  let s = seed || 1;
  function rnd() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildSuggestions(company: string, seed = 1): string[] {
  if (!company.trim()) return [];
  const root = baseFromCompany(company);
  const ts = new Date();
  const year = String(ts.getFullYear()).slice(-2);
  const short = root.replace(/-/g, '');
  const variants = [
    root,
    `${root}hq`,
    `${root}app`,
    `${root}-forms`,
    `${root}-pages`,
    `${root}-team`,
    `${root}-studio`,
    `use-${root}`,
    `go-${root}`,
    `${short}${year}`,
    `${root}-alpha`,
    `${root}-beta`,
  ];
  const seen = new Set<string>();
  const filtered: string[] = [];
  for (const vRaw of variants) {
    const v = vRaw.toLowerCase();
    if (!seen.has(v) && isValidSubdomain(v) && !RESERVED.has(v)) {
      seen.add(v);
      filtered.push(v);
    }
  }
  return seededShuffle(filtered, seed).slice(0, 10);
}

// ===== Email/Phone helpers =====
const isEmail = (v: string) => /@/.test(v);
const normalizePhone = (v: string) => {
  const s = v.replace(/[^\d+]/g, '');
  return s.startsWith('+') ? s : '+91' + s.replace(/^0+/, '');
};

// Safer parse — throws readable text if server returned HTML
async function readJsonOrText(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  const text = await res.text();
  throw new Error(text || `${res.status} ${res.statusText}`);
}

export default function RegisterForm() {
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [identifier, setIdentifier] = useState('');
  // Phone OTP mini-state (used only if identifier is a phone)
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [phoneToken, setPhoneToken] = useState<string | null>(null);

  useEffect(() => {
    if (otpCooldown > 0) {
      const t = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpCooldown]);

  // Step 2
  const [company, setCompany] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggSeed, setSuggSeed] = useState(1);
  const [showAllSugg, setShowAllSugg] = useState(false);

  // Step 3
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Build suggestions dynamically as company or seed changes
  useEffect(() => {
    setSuggestions(buildSuggestions(company, suggSeed));
  }, [company, suggSeed]);

  // Debounced availability checker for subdomain input
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!subdomain) {
      setStatus('idle');
      setStatusMsg('');
      return;
    }

    if (!isValidSubdomain(subdomain)) {
      setStatus('invalid');
      setStatusMsg('3–63 chars, lowercase a–z, 0–9, hyphen only');
      return;
    }
    if (RESERVED.has(subdomain)) {
      setStatus('reserved');
      setStatusMsg('This name is reserved');
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setStatus('checking');
        setStatusMsg('Checking availability…');
        if (inflightRef.current) inflightRef.current.abort();
        const ac = new AbortController();
        inflightRef.current = ac;
        const res = await fetch(`${CHECK_URL}?subdomain=${encodeURIComponent(subdomain)}`, { signal: ac.signal, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('Failed to check');
        const json = await res.json() as { available: boolean; reason?: string };
        if (json.available) {
          setStatus('available');
          setStatusMsg(`${subdomain}.${APP_DOMAIN} is available`);
        } else {
          setStatus('taken');
          setStatusMsg(json.reason || 'Already taken');
        }
      } catch (e: any) {
        if (e && e.name === 'AbortError') return;
        setStatus('error');
        setStatusMsg(ALLOW_OPTIMISTIC_CONTINUE ? 'Could not check right now — you can continue; we will verify on submit.' : 'Could not check right now');
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [subdomain]);

  // ===== Step 1 handlers (email vs phone) =====
  function goStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier) return;

    if (isEmail(identifier)) {
      // Email path → go straight to Step 2 (workspace)
      setStep(2);
      return;
    }

    // Phone path → send OTP, stay on Step 1 but show OTP UI
    (async () => {
      try {
        const res = await fetch('/api/register/phone/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: normalizePhone(identifier) })
        });
        const j = await readJsonOrText(res);
        if (!res.ok) throw new Error(j.error || 'Failed to send code');
        setOtpSent(true);
        setOtpCooldown(45);
      } catch (err: any) {
        const msg = String(err?.message || '');
        if (msg.toLowerCase().includes('unsupported phone provider')) {
          alert('Phone sign-in isn’t enabled yet. Please use email for now.');
        } else {
          alert(msg || 'Could not send code');
        }
      }
    })();
  }

  async function verifyOtp() {
    try {
      const res = await fetch('/api/register/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizePhone(identifier), code: otp })
      });
      const j = await readJsonOrText(res);
      if (!res.ok) throw new Error(j.error || 'Invalid code');
      setPhoneToken(j.verification_token); // short-lived token
      setStep(2); // proceed to workspace
    } catch (err: any) {
      alert(err.message || 'Could not verify code');
    }
  }

  async function resendOtp() {
    if (otpCooldown > 0) return;
    setOtp('');
    try {
      const res = await fetch('/api/register/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizePhone(identifier) })
      });
      if (res.ok) setOtpCooldown(45);
    } catch {}
  }

  // ===== Step 2 & 3 helpers =====
  function canProceedStep2(): boolean {
    if (!isValidSubdomain(subdomain) || RESERVED.has(subdomain)) return false;
    if (status === 'available') return true;
    if (ALLOW_OPTIMISTIC_CONTINUE && (status === 'error' || status === 'idle')) return true;
    return false;
  }

  function goStep2Next() {
    if (!canProceedStep2()) return;
    setStep(3);
  }

  async function onRegisterClick() {
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    if (!canProceedStep2()) {
      alert('Please choose a valid subdomain.');
      return;
    }

    setLoading(true);
    try {
      // EMAIL PATH
      if (isEmail(identifier)) {
        const res = await fetch('/api/register/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: identifier,
            password,
            company,
            subdomain,
          }),
        });
        const j = await readJsonOrText(res);
        if (!res.ok) throw new Error(j.error || 'Failed to register');
        if (j.workspace_url) {
          window.location.href = j.workspace_url;
        } else {
          alert('Registered. Check your inbox to verify your email.');
        }
        return;
      }

      // PHONE PATH
      if (!phoneToken) {
        alert('Verify your phone number first.');
        return;
      }
      const res = await fetch('/api/register/phone/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_token: phoneToken,
          company,
          subdomain,
          password,
        }),
      });
      const j = await readJsonOrText(res);
      if (!res.ok) throw new Error(j.error || 'Failed to create workspace');

      // success → redirect to the tenant URL we just provisioned
      window.location.href = j.workspace_url;
    } catch (e: any) {
      alert(e.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  // badge helper
  function badgeBy(s: Status) {
    return ({
      idle: { text: '—', class: 'text-gray-400 border-gray-200' },
      checking: { text: 'Checking…', class: 'text-amber-600 border-amber-300' },
      available: { text: 'Available', class: 'text-emerald-700 border-emerald-400' },
      taken: { text: 'Taken', class: 'text-rose-700 border-rose-400' },
      invalid: { text: 'Invalid', class: 'text-rose-700 border-rose-400' },
      reserved: { text: 'Reserved', class: 'text-rose-700 border-rose-400' },
      error: { text: ALLOW_OPTIMISTIC_CONTINUE ? 'Will verify later' : 'Error', class: 'text-orange-700 border-orange-400' },
    } as const)[s];
  }

  const mainBadge = badgeBy(status);
  const visibleSuggestions = company.trim() ? (showAllSugg ? suggestions : suggestions.slice(0, 2)) : [];

  return (
    <div className="space-y-4 text-[#00380e]">
      {/* Intro */}
      <div className="text-center">
        <p className="text-lg text-gray-500">Create your Account</p>
        <p className="text-xs text-gray-400 mt-1">Step {step} of 3</p>
      </div>

      {/* STEP 1: identifier (with phone OTP inline when needed) */}
      {step === 1 && (
        <form onSubmit={goStep1Submit} className="space-y-4">
          <input
            name="identifier"
            type="text"
            placeholder="Enter your email or mobile number"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="w-full p-3 rounded-md bg-transparent border border-[#00380e] placeholder-gray-400 text-[#00380e] focus:outline-none"
          />

          {!otpSent ? (
            <>
              <button
                type="submit"
                className="inline-flex w-full h-11 items-center justify-center rounded-md border bg-ui-buttonPrimaryBg text-ui-buttonPrimaryText border-ui-buttonPrimaryBorder hover:bg-ui-buttonPrimaryHover focus:outline-none focus:ring-2 focus:ring-ui-buttonPrimaryBorder transition"
              >
                <span className="font-semibold leading-none">Continue</span>
              </button>

              {/* Divider */}
              <div className="flex items-center my-4">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="px-2 text-sm text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>

              {/* Third-party */}
              <div className="space-y-2">
                {[
                  { name: 'Google', icon: '/icons/google.png' },
                  { name: 'Microsoft', icon: '/icons/microsoft.png' },
                  { name: 'LinkedIn', icon: '/icons/linkedin.png' },
                ].map((provider) => (
                  <button
                    key={provider.name}
                    type="button"
                    onClick={() => console.log(`Continue with ${provider.name}`)}
                    className="w-full flex items-center justify-center border border-gray-300 rounded-md py-2 hover:bg-gray-100 transition"
                  >
                    <Image src={provider.icon} alt={provider.name} width={20} height={20} className="mr-2" />
                    Continue with {provider.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* OTP UI replaces the buttons when identifier is a phone */}
              <label className="text-sm text-gray-600">Enter the 6-digit code</label>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full p-3 rounded-md bg-transparent border border-[#00380e] placeholder-gray-400 text-[#00380e] focus:outline-none"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={verifyOtp}
                  className="inline-flex h-10 px-4 items-center justify-center rounded-md border bg-ui-buttonPrimaryBg text-ui-buttonPrimaryText border-ui-buttonPrimaryBorder hover:bg-ui-buttonPrimaryHover"
                >
                  Verify
                </button>
                <button
                  type="button"
                  disabled={otpCooldown > 0}
                  onClick={resendOtp}
                  className="text-sm underline disabled:opacity-50"
                >
                  Resend {otpCooldown > 0 ? `(${otpCooldown}s)` : ''}
                </button>
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(''); }}
                  className="text-sm underline"
                >
                  Change number
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {/* STEP 2: workspace (company + subdomain) */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Company Name */}
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Company</label>
            <input
              name="company"
              type="text"
              placeholder="Your company name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full p-3 rounded-md bg-transparent border border-[#00380e] placeholder-gray-400 text-[#00380e] focus:outline-none"
            />
          </div>

          {/* Subdomain chooser */}
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Choose your workspace subdomain</label>
            <div className="flex items-stretch gap-2">
              <div className="flex-1 flex items-center rounded-md border border-[#00380e] focus-within:ring-2 focus-within:ring-ui-buttonPrimaryBorder">
                <input
                  name="workspaceSubdomain"
                  placeholder="e.g. alpha"
                  value={subdomain}
                  onChange={(e) => setSubdomain(slugify(e.target.value))}
                  className="flex-1 p-3 rounded-md bg-transparent placeholder-gray-400 text-[#00380e] focus:outline-none"
                />
                <div className="px-3 text-gray-500 select-none">.{APP_DOMAIN}</div>
              </div>
              <div
                className={`min-w-[130px] text-xs rounded-md border px-3 grid place-items-center ${mainBadge.class}`}
                title={statusMsg}
              >
                {mainBadge.text}
              </div>
            </div>
            {statusMsg && (
              <p className="text-xs text-gray-500 mt-1">{statusMsg}</p>
            )}
          </div>

          {/* Suggestions */}
          {company.trim() && suggestions.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-600">Suggestions</p>
                <div className="flex items-center gap-2">
                  {suggestions.length > 2 && (
                    <button
                      type="button"
                      aria-label={showAllSugg ? 'Collapse suggestions' : 'Expand suggestions'}
                      title={showAllSugg ? 'Show fewer suggestions' : 'Show more suggestions'}
                      className="w-6 h-6 grid place-items-center rounded hover:bg-gray-100"
                      onClick={() => setShowAllSugg(v => !v)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 transition-transform ${showAllSugg ? 'rotate-180' : ''}`}>
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Regenerate suggestions"
                    title="Regenerate suggestions"
                    className="w-6 h-6 grid place-items-center rounded hover:bg-gray-100"
                    onClick={() => setSuggSeed(s => s + 1)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="M21 12a9 9 0 1 1-3-6.7"/>
                      <polyline points="21 3 21 9 15 9"/>
                    </svg>
                  </button>
                </div>
              </div>
              <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
                {(showAllSugg ? suggestions : suggestions.slice(0, 2)).map((s) => (
                  <li
                    key={s}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${subdomain === s ? 'bg-emerald-50' : ''}`}
                    onClick={() => setSubdomain(s)}
                    title={`${s}.${APP_DOMAIN}`}
                  >
                    {s}.{APP_DOMAIN}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm underline"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goStep2Next}
              disabled={!canProceedStep2()}
              className={`inline-flex h-11 px-4 items-center justify-center rounded-md border bg-ui-buttonPrimaryBg text-ui-buttonPrimaryText border-ui-buttonPrimaryBorder hover:bg-ui-buttonPrimaryHover focus:outline-none focus:ring-2 focus:ring-ui-buttonPrimaryBorder transition ${
                !canProceedStep2() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: password */}
      {step === 3 && (
        <div className="space-y-4">
          <input
            name="password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 rounded-md bg-transparent border border-[#00380e] placeholder-gray-400 text-[#00380e] focus:outline-none"
          />

          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full p-3 rounded-md bg-transparent border border-[#00380e] placeholder-gray-400 text-[#00380e] focus:outline-none"
          />

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm underline"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onRegisterClick}
              disabled={loading}
              className="inline-flex h-11 px-4 items-center justify-center rounded-md border bg-ui-buttonPrimaryBg text-ui-buttonPrimaryText border-ui-buttonPrimaryBorder hover:bg-ui-buttonPrimaryHover focus:outline-none focus:ring-2 focus:ring-ui-buttonPrimaryBorder transition disabled:opacity-50"
            >
              <span className="font-semibold leading-none">{loading ? 'Creating workspace…' : 'Register'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-sm mt-6">
        Already have an account? <Link href="/auth/login" className="underline">Login</Link>
      </p>
    </div>
  );
}
