// components/help/HelpSidebar.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search, X, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { HELP_TREE, type HelpNode } from './helpTree';

type FlatItem = { title: string; href: string; keywords?: string[] };
function flattenTree(nodes: HelpNode[]): FlatItem[] {
  const out: FlatItem[] = [];
  const walk = (n: HelpNode) => { out.push({ title: n.title, href: n.href, keywords: n.keywords }); n.children?.forEach(walk); };
  nodes.forEach(walk);
  return out;
}
const isExactActive = (p: string, h: string) => p === h;
const branchHasActive = (n: HelpNode, p: string): boolean => isExactActive(p, n.href) || !!n.children?.some(c => branchHasActive(c, p));

/** --------- HARD-STICKY: fixed-on-scroll polyfill (works even if sticky is broken) ---------- */
function useHardSticky(sideRef: React.RefObject<HTMLDivElement>, containerRef: React.RefObject<HTMLElement>) {
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [spacerH, setSpacerH] = useState<number>(0);

  useEffect(() => {
    const el = sideRef.current;
    const box = containerRef.current;
    if (!el || !box) return;

    const readTop = (): number => {
      // header height from HelpShell; fallback 88
      const shell = el.closest('[style*="--help-sticky-top"]') as HTMLElement | null;
      const fromShell = shell ? parseInt(getComputedStyle(shell).getPropertyValue('--help-sticky-top')) : NaN;
      return Number.isFinite(fromShell) ? fromShell : 88;
    };

    let topOffset = readTop() + 8; // small gap below header

    const measure = () => {
      // current sizes
      const sideRect = el.getBoundingClientRect();
      const sideHeight = el.offsetHeight;
      setSpacerH(sideHeight); // keep grid width when we switch to fixed

      // container rect relative to document
      const scrollY = window.scrollY || window.pageYOffset;
      const cRect = box.getBoundingClientRect();
      const cTop = cRect.top + scrollY;
      const cLeft = cRect.left;
      const cWidth = cRect.width;
      const cBottom = cTop + box.offsetHeight;

      const maxY = cBottom - sideHeight - topOffset; // last scrollY where we are still fixed

      const now = window.scrollY || window.pageYOffset;
      if (now <= cTop - topOffset) {
        // before pin
        setStyle({ position: 'static' });
        return;
      }
      if (now >= maxY) {
        // clamp to bottom of container
        setStyle({
          position: 'absolute',
          top: box.offsetHeight - sideHeight,
          left: 0,
          right: 'auto',
          width: '100%',
        });
        return;
      }
      // fixed to viewport
      setStyle({
        position: 'fixed',
        top: topOffset,
        left: cLeft,
        width: cWidth,
        maxHeight: `calc(100vh - ${topOffset}px - 12px)`,
        overflow: 'auto',
      });
    };

    // initial & listeners
    measure();
    const onScroll = () => measure();
    const onResize = () => { topOffset = readTop() + 8; measure(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const ro1 = new ResizeObserver(measure);
    const ro2 = new ResizeObserver(measure);
    ro1.observe(box);
    ro2.observe(el);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro1.disconnect();
      ro2.disconnect();
    };
  }, [sideRef, containerRef]);

  return { style, spacerH };
}

export default function HelpSidebar({
  className,
  containerId = 'help-sidebar-container',
}: {
  className?: string;
  /** id of the relative container (see layout). Used to clamp at bottom. */
  containerId?: string;
}) {
  const pathname = usePathname() ?? '';
  const [q, setQ] = useState('');
  const ALL = useMemo(() => flattenTree(HELP_TREE), []);
  const searching = q.trim().length >= 3;

  const filtered = useMemo(() => {
    if (!searching) return ALL;
    const term = q.trim().toLowerCase();
    return ALL.filter((i) => [i.title, i.href, ...(i.keywords ?? [])].join(' ').toLowerCase().includes(term));
  }, [ALL, q, searching]);

  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    containerRef.current = document.getElementById(containerId) as HTMLElement | null;
  }, [containerId]);

  const { style, spacerH } = useHardSticky(outerRef, containerRef);

  return (
    // Spacer keeps layout width when we switch to fixed
    <div className={clsx('w-80 shrink-0', className)} style={{ height: spacerH || undefined }}>
      <div ref={outerRef} style={style} aria-label="Help navigation">
        <div
          className={clsx(
            'rounded-md border shadow-md',
            'bg-white/70 backdrop-blur-md border-gray-200/70',
            'dark:bg-white/5 dark:border-white/10'
          )}
        >
          <div className="p-4">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search topics… (type 3+)"
                aria-label="Search help topics"
                className={clsx(
                  'w-full rounded-md border bg-white pl-9 pr-8 py-2 text-sm outline-none transition',
                  'border-gray-300 placeholder:text-gray-400 text-gray-900',
                  'focus:border-gray-400 focus:ring-2 focus:ring-gray-200',
                  'dark:border-white/15 dark:bg-[#0F172A] dark:text-gray-100 dark:placeholder:text-gray-400',
                  'dark:focus:border-gray-400 dark:focus:ring-gray-400/20'
                )}
              />
              {q && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-gray-100 dark:hover:bg-white/10"
                  onClick={() => setQ('')}
                  aria-label="Clear search"
                  title="Clear"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>

            <div className="my-3 h-px bg-gray-200 dark:bg-white/10" />

            {/* Results or tree */}
            {searching ? <SearchResults items={filtered} /> : <Browse tree={HELP_TREE} pathname={pathname} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- subcomponents (unchanged) ----------------------- */
function Browse({ tree, pathname }: { tree: HelpNode[]; pathname: string }) {
  return (
    <nav className="space-y-3">
      <div className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Documentation
      </div>
      <ul className="space-y-0.5">
        {tree.map((n) => (
          <TreeItem key={n.href} node={n} pathname={pathname} depth={0} />
        ))}
      </ul>
    </nav>
  );
}

function TreeItem({ node, pathname, depth }: { node: HelpNode; pathname: string; depth: number }) {
  const exactActive = isExactActive(pathname, node.href);
  const [open, setOpen] = useState(branchHasActive(node, pathname));
  useEffect(() => { setOpen(branchHasActive(node, pathname)); }, [pathname, node.href]);
  const hasKids = !!node.children?.length;

  return (
    <li>
      <div
        className={clsx(
          'flex items-center rounded-md text-sm transition',
          exactActive
            ? 'bg-gray-100 font-semibold text-gray-900 dark:bg-white/10 dark:text-gray-100'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10'
        )}
        style={{ paddingLeft: `calc(${depth} * 12px + 4px)` }}
      >
        {hasKids && (
          <button
            aria-label={open ? 'Collapse section' : 'Expand section'}
            aria-expanded={open}
            onClick={(e) => { e.preventDefault(); setOpen((v) => !v); }}
            className="mr-1 grid h-6 w-6 place-items-center rounded hover:bg-black/5 dark:hover:bg-white/10"
          >
            <ChevronRight className={clsx('h-4 w-4 transition-transform', open && 'rotate-90')} />
          </button>
        )}

        <Link href={node.href} className="flex-1 px-2 py-1.5" aria-current={exactActive ? 'page' : undefined}>
          <span className="truncate">{node.title}</span>
        </Link>
      </div>

      {hasKids && open && (
        <ul className="mt-0.5">
          {node.children!.map((c) => (
            <TreeItem key={c.href} node={c} pathname={pathname} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function SearchResults({ items }: { items: FlatItem[] }) {
  return items.length === 0 ? (
    <div className="rounded-md border border-dashed border-gray-300 p-3 text-xs text-gray-500 dark:border-white/15 dark:text-gray-400">
      No matches. Try another term.
    </div>
  ) : (
    <ul className="space-y-0.5">
      {items.map((it) => (
        <li key={it.href}>
          <Link
            href={it.href}
            className="block rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
          >
            {it.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
