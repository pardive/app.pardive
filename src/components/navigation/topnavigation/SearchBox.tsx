'use client';

import { Search } from 'lucide-react';

export default function SearchBox({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        <Search className="w-4 h-4" />
      </span>
      <input
        type="text"
        placeholder="Search your asset or feature here"
        className="w-full h-[39px] pl-10 pr-4 py-1.5 text-sm rounded-lg border 
          bg-white text-[#00332D] placeholder:text-gray-400 
          focus:outline-none 
          border-[#00332d]
          dark:bg-ui-navigationDark dark:text-white dark:placeholder:text-gray-400 dark:border-gray-500"
      />
    </div>
  );
}
