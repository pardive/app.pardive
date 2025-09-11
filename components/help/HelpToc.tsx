'use client';
import { useEffect, useState } from 'react';
type Item = { id: string; text: string; level: number };

export default function HelpToc() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    const hs = Array.from(document.querySelectorAll('article.prose h2, article.prose h3')) as HTMLElement[];
    setItems(hs.map(h => ({ id: h.id, text: h.innerText, level: h.tagName === 'H2' ? 2 : 3 })));
  }, []);
  if (!items.length) return null;
  return (
    <aside className="hidden xl:block w-64 shrink-0 pl-6">
      <div className="sticky top-24">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">On this page</div>
        <ul className="space-y-1 text-sm">
          {items.map(i => (
            <li key={i.id} className={i.level === 3 ? 'pl-3' : ''}>
              <a href={`#${i.id}`} className="text-gray-600 hover:text-gray-900">{i.text}</a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
