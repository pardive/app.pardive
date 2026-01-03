'use client';

import Link from 'next/link';
import { Wrench } from 'lucide-react';

export default function WorkspaceManager() {
  return (
    <Link
      href="/admin"
      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
      title="Workspace Manager"
    >
      <Wrench className="h-5 w-5" />
    </Link>
  );
}
