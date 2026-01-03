'use client';

import { useSyncExternalStore } from 'react';
import {
  MODULES,
  computeDefaultMap,
  flattenIds,
  type EnabledMap,
} from '@/config/modules';

const STORAGE_KEY = 'enabledModules';

type StoreState = { map: EnabledMap };

function loadInitial(): EnabledMap {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as
      | EnabledMap
      | null;

    const defaults = computeDefaultMap(MODULES);

    // Keep only valid ids; fill missing ids from defaults
    const validIds = new Set(flattenIds(MODULES));
    const merged: EnabledMap = { ...defaults };

    if (saved && typeof saved === 'object') {
      for (const [k, v] of Object.entries(saved)) {
        if (validIds.has(k)) merged[k] = v !== false;
      }
    }

    return merged;
  } catch {
    return computeDefaultMap(MODULES);
  }
}

function persist(map: EnabledMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

function createStore() {
  let state: StoreState = { map: computeDefaultMap(MODULES) }; // SSR-safe
  const listeners = new Set<() => void>();

  // Hydrate on client
  if (typeof window !== 'undefined') {
    state = { map: loadInitial() };
  }

  const getSnapshot = () => state.map;

  const setState = (updater: (prev: EnabledMap) => EnabledMap) => {
    const next = updater(state.map);
    if (next === state.map) return;
    state = { map: next };
    persist(state.map);
    listeners.forEach((l) => l());
  };

  return {
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    getSnapshot,

    /** Set a single id */
    setEnabled(id: string, on: boolean) {
      setState((prev) =>
        prev[id] === on ? prev : { ...prev, [id]: on }
      );
    },

    /** Set many ids atomically (merge, filter undefined) */
setEnabledMany(
  patch:
    | Partial<EnabledMap>
    | ((prev: EnabledMap) => Partial<EnabledMap>)
) {
  setState((prev) => {
    const delta =
      typeof patch === 'function' ? patch(prev) : patch;

    const cleaned = Object.keys(delta).reduce<EnabledMap>(
      (acc, key) => {
        const val = delta[key];
        if (typeof val === 'boolean') {
          acc[key] = val;
        }
        return acc;
      },
      {}
    );

    return { ...prev, ...cleaned };
  });
},


    /** Reset to registry defaults */
    reset() {
      setState(() => computeDefaultMap(MODULES));
    },
  };
}

const store = createStore();

export function useModuleFlags() {
  const map = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );

  const enabledIds = Object.keys(map).filter(
    (k) => map[k] !== false
  );

  return {
    map,
    enabledIds,
    setEnabled: store.setEnabled,
    setEnabledMany: store.setEnabledMany,
    reset: store.reset,
  };
}
