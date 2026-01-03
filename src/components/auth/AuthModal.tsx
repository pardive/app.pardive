'use client';

import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { X, ExternalLink } from 'lucide-react';

import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';

type AuthView = 'login' | 'register';

type Ctx = {
  open: (view: AuthView) => void;
  close: () => void;
};

const AuthModalCtx = createContext<Ctx | null>(null);

export function useAuthModal() {
  const ctx = useContext(AuthModalCtx);
  if (!ctx) throw new Error('useAuthModal must be used within <AuthModalProvider>');
  return ctx;
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AuthView>('login');

  const api = useMemo<Ctx>(
    () => ({
      open: (v) => {
        setView(v);
        setOpen(true);
      },
      close: () => setOpen(false),
    }),
    []
  );

  // CAPTURE PHASE: intercept auth links inside modal and switch views
  const interceptAuthLinks = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const anchor = target.closest('a') as HTMLAnchorElement | null;
    if (!anchor) return;

    // Respect modifier keys (user explicitly wants a new tab/window)
    const me = e.nativeEvent as MouseEvent;
    if (me && (me.metaKey || me.ctrlKey || me.shiftKey || me.altKey || me.button !== 0)) return;

    const hrefAttr = anchor.getAttribute('href') || '';
    // Normalize to absolute then read pathname (handles basePath/locales)
    let pathname = hrefAttr;
    try {
      pathname = new URL(hrefAttr, window.location.origin).pathname;
    } catch {
      /* no-op */
    }

    if (pathname === '/auth/login' || pathname === '/auth/register') {
      e.preventDefault();
      e.stopPropagation();
      setView(pathname.endsWith('/login') ? 'login' : 'register');
    }
  }, []);

  return (
    <AuthModalCtx.Provider value={api}>
      {children}
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-[1px] flex items-center justify-center"
            onClick={() => api.close()}
            aria-modal="true"
            role="dialog"
          >
            {/* Card (centered). Stop bubbling clicks so overlay doesn't close */}
            <div
              className="
                relative
                w-[92vw] max-w-[92vw] sm:w-[420px] sm:max-w-[420px]
                rounded-md bg-white dark:bg-ui-navigationDark text-[#00332D] shadow-2xl
                max-h-[90vh] overflow-auto
              "
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top controls */}
              <div className="absolute top-2 right-2 flex items-center gap-2">
                {/* Open full page in a new tab (icon only) */}
                <Link
                  href={view === 'login' ? '/auth/login' : '/auth/register'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open in new page"
                  title="Open in new page"
                  className="
                    w-8 h-8 grid place-items-center rounded-md
                    text-[#00332D] hover:text-[#006699]
                    dark:text-gray-200 dark:hover:text-white
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006699]/40
                  "
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>

                {/* Close */}
                <button
                  aria-label="Close"
                  onClick={api.close}
                  className="w-8 h-8 grid place-items-center rounded-md hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inner: attach onClickCapture so we intercept BEFORE Next.js Link */}
              <div className="px-7 py-6" onClickCapture={interceptAuthLinks}>
                {/* Logo + divider */}
                <div className="flex items-center justify-center">
                  <img src="/logo/logo-green.svg" alt="Saltify Logo" width={160} height={40} />
                </div>
                <div className="w-full h-px bg-gray-200 my-4" />

                {/* Field block (same sizing as full page) */}
                <div
                  className="
                    mx-auto w-full
                    max-w-[300px] sm:max-w-[320px] md:max-w-[340px]
                    px-2 sm:px-3
                    flex flex-col gap-3 text-[14px]
                    [&_label]:text-[13px] [&_label]:mb-1
                    [&_input]:h-9 [&_input]:px-3 [&_input]:text-[14px] [&_input]:w-full
                    [&_select]:h-9 [&_select]:px-3 [&_select]:text-[14px] [&_select]:w-full
                    [&_textarea]:text-[14px] [&_textarea]:p-3 [&_textarea]:w-full
                    [&_button]:h-9 [&_button]:w-full
                  "
                >
                  {view === 'login' ? <LoginForm /> : <RegisterForm />}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </AuthModalCtx.Provider>
  );
}
