// components/profile/Editable.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Option = { value: string; label: string };

type Props = {
  label: string;
  value: string;
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  options?: Option[];
  onSave: (v: string) => void | Promise<void>;
  editing: boolean;                // <- controls read-only vs editable
  placeholder?: string;            // shown when empty in read-only mode
  instant?: boolean;               // autosave while typing (default true)
  labelWidthClass?: string;        // optional override for label width
};

export default function Editable({
  label,
  value,
  type = 'text',
  options = [],
  onSave,
  editing,
  placeholder = '—',
  instant = true,
  labelWidthClass = 'min-w-[160px]',
}: Props) {
  const [val, setVal] = useState(value ?? '');
  const debTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setVal(value ?? ''), [value]);

  // Convert stored value to display label for selects in read-only mode
  const display = useMemo(() => {
    if (!value?.trim()) return placeholder;
    if (type === 'select') {
      const found = options.find((o) => o.value === value);
      return found?.label ?? value;
    }
    return value;
  }, [value, type, options, placeholder]);

  // Debounced autosave while editing for text/textarea/email/tel
  useEffect(() => {
    if (!editing) return;
    if (type === 'select') return;
    if (!instant) return;

    if (debTimer.current) clearTimeout(debTimer.current);
    debTimer.current = setTimeout(() => {
      void onSave(val.trim());
    }, 500);

    return () => {
      if (debTimer.current) clearTimeout(debTimer.current);
    };
  }, [val, editing, type, instant, onSave]);

  function commit() {
    if (debTimer.current) clearTimeout(debTimer.current);
    if (type !== 'select') void onSave(val.trim());
  }

  return (
    <div className="flex items-center gap-4">
      {/* Left: label */}
      <div className={`text-xs font-medium text-neutral-500 ${labelWidthClass}`}>{label}</div>

      {/* Right: value or editor */}
      <div className="flex-1">
        {!editing && (
          <div className={display === placeholder ? 'text-neutral-400' : 'text-neutral-900 dark:text-neutral-100'}>
            {display}
          </div>
        )}

        {editing && type !== 'select' && type !== 'textarea' && (
          <input
            autoFocus={false}
            type={type}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={commit}
            className="w-full bg-transparent border border-neutral-200 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        )}

        {editing && type === 'textarea' && (
          <textarea
            rows={3}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={commit}
            className="w-full bg-transparent border border-neutral-200 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        )}

        {editing && type === 'select' && (
          <select
            className="w-full bg-transparent border border-neutral-200 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            value={val}
            onChange={(e) => {
              setVal(e.target.value);
              void onSave(e.target.value);
            }}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
