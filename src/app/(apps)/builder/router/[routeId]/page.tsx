'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import PageScaffold from '@/components/layout/PageScaffold';
import RouteCanvas from '@/components/router/RouteCanvas';

type RouteStatus = 'draft' | 'active' | 'paused';

type Route = {
  id: string;
  name: string;
  status: RouteStatus;
};

const MAX_NAME_LENGTH = 55;
const sanitizeName = (v: string) => v.trim().slice(0, MAX_NAME_LENGTH);

export default function Page() {
  const { routeId } = useParams<{ routeId: string }>();

  const [route, setRoute] = useState<Route | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  /* ---------------- load ---------------- */
  useEffect(() => {
    const raw = localStorage.getItem(`route:${routeId}`);
    if (!raw) return;

    const data = JSON.parse(raw) as Route;
    setRoute(data);
    setName(data.name);
  }, [routeId]);

  /* ---------------- autosave ---------------- */
  useEffect(() => {
    if (!route || !name.trim()) return;

    const t = setTimeout(() => {
      const updated = { ...route, name };
      localStorage.setItem(`route:${routeId}`, JSON.stringify(updated));
      setRoute(updated);
    }, 400);

    return () => clearTimeout(t);
  }, [name, route, routeId]);

  if (!route) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Route not found
      </div>
    );
  }

  const commitName = () => {
    if (!name.trim()) setName(route.name);
    setEditing(false);
  };

  return (
    <PageScaffold
      header={
        <div
          className="
            bg-gray-50 dark:bg-ui-headerDark
            border-b border-border
          "
        >
          <div className="px-6 py-4 space-y-2">
            <div className="text-xs text-muted-foreground">
              Router
            </div>

            <div className="flex items-center gap-3">
              {editing ? (
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(sanitizeName(e.target.value))}
                  onBlur={commitName}
                  onKeyDown={(e) => e.key === 'Enter' && commitName()}
                  className="
                    text-lg font-semibold bg-transparent
                    border-b border-border
                    focus:outline-none
                    text-foreground
                  "
                />
              ) : (
                <h1
                  onClick={() => setEditing(true)}
                  className="text-lg font-semibold cursor-text text-foreground"
                >
                  {route.name}
                </h1>
              )}

              <span
                className="
                  px-2 py-0.5 text-xs rounded-full capitalize
                  bg-muted text-muted-foreground
                "
              >
                {route.status}
              </span>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 text-sm pt-2">
              <button className="font-medium border-b-2 border-foreground pb-1">
                Build
              </button>
              <button className="text-muted-foreground cursor-not-allowed">
                Test
              </button>
              <button className="text-muted-foreground cursor-not-allowed">
                Report
              </button>
              <button className="text-muted-foreground cursor-not-allowed">
                Log
              </button>
            </div>
          </div>
        </div>
      }
    >
      <RouteCanvas />
    </PageScaffold>
  );
}
