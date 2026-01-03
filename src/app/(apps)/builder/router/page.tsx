'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function RouterPage() {
  const router = useRouter();

  const handleCreateRoute = () => {
    const id = `route_${Date.now()}`;

    const route = {
      id,
      name: 'New Route',
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(`route:${id}`, JSON.stringify(route));
    router.push(`/builder/router/${id}`);
  };

  return (
    <div className="page section">
      {/* ================= HEADER ================= */}
      <div className="row-between">
        <h1 className="text-xl font-semibold">Routes</h1>
        <Button onClick={handleCreateRoute}>
          + Create Route
        </Button>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="row">
        <div className="row">
          <label className="text-sm text-muted-foreground">View:</label>
          <select className="saltify-select">
            <option>All Routes</option>
          </select>
        </div>

        <div className="row">
          <label className="text-sm text-muted-foreground">Date:</label>
          <select className="saltify-select">
            <option>All Time</option>
          </select>
        </div>

        <div className="row">
          <label className="text-sm text-muted-foreground">Filter:</label>
          <input className="saltify-select w-48" />
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="card">
        <table className="table-saltify w-full text-sm">
          <thead>
            <tr>
              <th className="p-3 w-10">
                <input type="checkbox" />
              </th>
              <th className="p-3">Name</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td colSpan={5} className="p-10 text-center text-muted-foreground">
                No routes yet
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
