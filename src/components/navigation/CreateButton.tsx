// file: components/navigation/CreateButton.tsx
'use client';

import { Plus } from 'lucide-react';

export default function CreateButton() {
  return (
    <button className="bg-[#00332D] dark:bg-white text-white font-semibold text-sm px-4 py-2 rounded-md flex items-center gap-2 shadow-sm hover:bg-gray-100 transition dark:text-[#00332d]">
      <Plus size={16} /> Create
    </button>
  );
}
