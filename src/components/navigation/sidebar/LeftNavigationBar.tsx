'use client';

import {
  Moon,
  Sun,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu as MenuIcon,
  ChevronDown,
  Search,
} from 'lucide-react';

import clsx from 'clsx';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

import { SidebarWrapper } from './index';
import { APPS } from '@/config/apps';
import type { ModuleNode, ModuleGroup } from '@/config/modules';

/* --------------------- Edge handle ------------------- */
function EdgeHandlePortal({
  anchorRef,
  collapsed,
  toggle,
  suppress,
}: {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  collapsed: boolean;
  toggle: () => void;
  suppress?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);
  const [posY, setPosY] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const node = anchorRef.current;
    if (!node) return;
    const update = () => setRect(node.getBoundingClientRect());
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchorRef]);

  if (!mounted || !rect) return null;

  const BTN = 20;
  const half = BTN / 2;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: rect.top,
        left: rect.right - 6,
        width: 6,
        height: rect.height,
        zIndex: 1110,
        ...(suppress ? { opacity: 0, pointerEvents: 'none' } : {}),
      }}
      onMouseEnter={() => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setVisible(true);
      }}
      onMouseMove={(e) => {
        const y = e.clientY;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => setPosY(y));
      }}
      onMouseLeave={() => {
        hideTimer.current = window.setTimeout(() => setVisible(false), 120);
      }}
    >
      <button
        type="button"
        onClick={toggle}
        className="rounded-full shadow-sm bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:scale-110 transition-transform"
        style={{
          position: 'absolute',
          top: posY == null ? rect.height / 2 - half : Math.max(0, Math.min(posY - rect.top - half, rect.height - BTN)),
          left: -half + 4,
          width: BTN,
          height: BTN,
          transform: visible ? 'translateX(0)' : 'translateX(8px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity .12s ease, transform .12s ease',
        }}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>,
    document.body
  );
}

/* --------------------------- Sidebar ------------------------ */
export default function LeftNavigationBar({
  collapsed,
  setCollapsed,
  style,
}: {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [dark, setDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [hoveredGroup, setHoveredGroup] = useState<{ id: string; label: string; rect: DOMRect; children: any[] } | null>(null);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  // Keyboard shortcut listener (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (collapsed) setCollapsed(false);
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [collapsed, setCollapsed]);

  useEffect(() => {
    const el = document.documentElement;
    const isDark = el.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    setDark(isDark);
  }, []);

  const toggleTheme = () => {
    const el = document.documentElement;
    const next = !dark;
    el.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setDark(next);
  };

  const toggleGroup = (groupId: string) => {
    if (collapsed) {
      setCollapsed(false);
      setExpandedGroupId(groupId);
    } else {
      setExpandedGroupId((prev) => (prev === groupId ? null : groupId));
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, group: ModuleGroup) => {
    if (!collapsed) return;
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredGroup({ id: group.id, label: group.label, rect, children: group.children });
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => setHoveredGroup(null), 150);
  };

  type AppId = keyof typeof APPS;
  const appId = pathname.split('/')[1] as AppId | undefined;
  const appConfig = appId ? APPS[appId] : undefined;
  const rawModules: ModuleNode[] = appConfig?.modules ?? [];

  // Filter logic
  const visibleModules = useMemo(() => {
    if (!searchQuery.trim()) return rawModules;
    const query = searchQuery.toLowerCase();

    return rawModules.filter((m) => {
      if (m.label.toLowerCase().includes(query)) return true;
      if (m.kind === 'group') {
        return m.children.some((c: any) => c.label.toLowerCase().includes(query));
      }
      return false;
    });
  }, [rawModules, searchQuery]);

  return (
    <>
      <div ref={anchorRef} className="relative h-full" style={style}>
        <SidebarWrapper className="h-full flex flex-col">
          {/* Header & Quick Find */}
          <div className={clsx('mt-2 mb-3 px-4', collapsed && 'hidden')}>
            <div className="flex items-center justify-between w-full gap-2">
              <div className="relative flex-1 group">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick find..."
                  className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-md py-1.5 pl-8 pr-10 text-xs focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-500"
                />
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-4 select-none items-center gap-1 rounded border bg-white dark:bg-gray-900 px-1.5 font-mono text-[10px] font-medium text-gray-400 opacity-100">
                  <span className="text-[10px]">⌘</span>K
                </kbd>
              </div>
              <button onClick={() => setCollapsed(true)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-500">
                <MenuIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Collapsed Menu Trigger */}
          {collapsed && (
            <div className="mt-2 mb-3 flex justify-center">
               <button onClick={() => setCollapsed(false)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">
                <MenuIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Navigation Items */}
          <div className={clsx('flex-1 flex flex-col gap-1 py-1 overflow-y-auto overflow-x-hidden', collapsed ? 'items-center px-0' : 'items-stretch px-2')}>
            {visibleModules.length === 0 && searchQuery && (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-gray-400">No results for "{searchQuery}"</p>
              </div>
            )}

            {visibleModules.map((m) => {
              const isActive = pathname === (m.kind === 'leaf' ? m.href : '');
              
              if (m.kind === 'leaf') {
                return (
                  <button
                    key={m.id}
                    onClick={() => router.push(m.href)}
                    className={clsx(
                      'relative h-10 rounded-md flex items-center gap-3 transition-all group',
                      collapsed ? 'w-10 justify-center' : 'px-3',
                      isActive ? 'bg-gray-100 dark:bg-[#2a2a2a] font-medium' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                    )}
                  >
                    {!collapsed && isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-[#24A77B]" />
                    )}
                    
                    {m.icon ? <m.icon className={clsx("w-5 h-5 flex-shrink-0", isActive ? "text-[#24A77B]" : "text-gray-500")} /> : <img src="/favicon.ico" alt="" className="w-5 h-5 opacity-70" />}
                    {!collapsed && <span className={clsx("text-sm truncate", isActive ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400")}>{m.label}</span>}
                  </button>
                );
              }

              const g = m as ModuleGroup;
              const isExpanded = expandedGroupId === g.id || (searchQuery.length > 0);

              return (
                <div key={g.id} className="flex flex-col gap-1" onMouseEnter={(e) => handleMouseEnter(e, g)} onMouseLeave={handleMouseLeave}>
                  <button
                    onClick={() => toggleGroup(g.id)}
                    className={clsx(
                      'h-10 rounded-md flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors',
                      collapsed ? 'w-10 justify-center' : 'px-3'
                    )}
                  >
                    {g.icon ? <g.icon className="w-5 h-5 flex-shrink-0 text-gray-500" /> : <img src="/favicon.ico" alt="" className="w-5 h-5 opacity-70" />}
                    {!collapsed && (
                      <>
                        <span className="text-sm font-medium flex-1 text-left truncate text-gray-700 dark:text-gray-300">{g.label}</span>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                      </>
                    )}
                  </button>

                  {!collapsed && isExpanded && (
                    <div className="flex flex-col gap-1 ml-4 border-l border-gray-100 dark:border-gray-800 pl-2">
                      {g.children.map((c: any) => {
                        if (searchQuery && !c.label.toLowerCase().includes(searchQuery.toLowerCase())) return null;
                        const isChildActive = pathname === c.href;
                        
                        return (
                          <button
                            key={c.id}
                            onClick={() => router.push(c.href)}
                            className={clsx(
                              'relative h-9 px-3 rounded-md flex items-center gap-3 transition-colors',
                              isChildActive ? 'text-[#24A77B] font-medium bg-[#24A77B]/5' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                            )}
                          >
                            {isChildActive && (
                              <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[#24A77B]" />
                            )}
                            {c.icon ? (
                              <c.icon className="w-4 h-4 flex-shrink-0" />
                            ) : (
                              <img src="/favicon.ico" alt="" className="w-4 h-4 opacity-50" />
                            )}
                            <span className="text-sm truncate">{c.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Items */}
          <div className={clsx("mt-auto px-2 pb-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-0.5", collapsed && "items-center")}>
            <button onClick={toggleTheme} className={clsx("rounded-md flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5", collapsed ? "w-10 h-10 justify-center" : "h-9 px-3")}>
              {dark ? <Sun className="w-4 h-4 text-gray-500" /> : <Moon className="w-4 h-4 text-gray-500" />}
              {!collapsed && <span className="text-xs text-gray-600 dark:text-gray-400">{dark ? 'Light' : 'Dark'} Mode</span>}
            </button>
            <button onClick={() => router.push('/settings')} className={clsx("rounded-md flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5", collapsed ? "w-10 h-10 justify-center" : "h-9 px-3")}>
              <Settings className="w-4 h-4 text-gray-500" />
              {!collapsed && <span className="text-xs text-gray-600 dark:text-gray-400">Settings</span>}
            </button>
          </div>
        </SidebarWrapper>
      </div>

      <EdgeHandlePortal anchorRef={anchorRef} collapsed={collapsed} toggle={() => setCollapsed((c) => !c)} />

      {/* Popover Portal */}
      {collapsed && hoveredGroup && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed z-[2000] ml-2 p-1.5 bg-white dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-lg shadow-2xl flex flex-col gap-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-150"
          style={{ top: hoveredGroup.rect.top, left: hoveredGroup.rect.right }}
          onMouseEnter={() => { if(hoverTimeout.current) clearTimeout(hoverTimeout.current); }}
          onMouseLeave={handleMouseLeave}
        >
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{hoveredGroup.label}</span>
          </div>
          {hoveredGroup.children.map((c: any) => (
            <button
              key={c.id}
              onClick={() => { router.push(c.href); setHoveredGroup(null); }}
              className={clsx(
                'h-9 px-3 rounded-md flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-full text-left',
                pathname === c.href && 'text-[#24A77B] font-medium bg-[#24A77B]/5'
              )}
            >
              {c.icon ? <c.icon className="w-4 h-4 text-[#24A77B]" /> : <img src="/favicon.ico" alt="" className="w-4 h-4 opacity-60" />}
              <span className="text-sm truncate">{c.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}