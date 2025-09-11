'use client';

import { useEffect, useRef } from 'react';
import MarketingNavbar from '@/components/marketing/navigation/MarketingNavbar';
import HelpNavigationBar from '@/components/help/HelpNavigationBar';
import HelpSidebar from '@/components/help/HelpSidebar';

export default function HelpShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);

  // Measure the combined header (MarketingNavbar + HelpNavigationBar)
  // and expose it as a CSS var we can use in sticky top.
  useEffect(() => {
    const root = rootRef.current;
    const header = headerRef.current;
    if (!root || !header) return;

    const setTop = () => {
      const h = Math.round(header.getBoundingClientRect().height || 88);
      root.style.setProperty('--help-header-h', `${h}px`);
    };
    setTop();

    const ro = new ResizeObserver(setTop);
    ro.observe(header);
    window.addEventListener('resize', setTop);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', setTop);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      // Important: NO overflow hidden on the vertical axis anywhere above sticky
      className="min-h-screen w-full bg-background text-foreground overflow-x-hidden [--help-header-h:88px]"
    >
      {/* Top bars */}
      <MarketingNavbar />
      <div
        ref={headerRef}
        className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm [&>header]:bg-transparent [&>header]:shadow-none [&>header]:border-0"
      >
        <HelpNavigationBar />
      </div>

      {/* Help grid with sidebar */}
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-6">
        <div
          className="
            grid gap-x-4 overflow-visible
            grid-cols-1 lg:[grid-template-columns:320px_1fr]
          "
        >
          {/* LEFT: Sidebar (sticky) */}
          <aside className="hidden lg:block">
            <div className="sticky top-[calc(var(--help-header-h)+12px)]">
              <HelpSidebar />
            </div>
          </aside>

          {/* RIGHT: Route content */}
         <main className="min-w-0">
  <div className="h-[calc(100vh-var(--help-header-h)-24px)] overflow-y-auto rounded-lg border border-border bg-card text-card-foreground shadow-sm">
    <article className="prose prose-slate dark:prose-invert max-w-none p-5 sm:p-6">
      {children}
    </article>
  </div>
</main>
        </div>
      </div>
    </div>
  );
}
