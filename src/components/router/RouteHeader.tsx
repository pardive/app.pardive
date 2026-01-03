'use client';

export default function RouteHeader() {
  return (
    <div className="w-full bg-gray-100 border-b">
      <div className="px-6 py-3 space-y-2">
        {/* Object name */}
        <div className="text-xs text-gray-500">Router</div>

        {/* Route name + status */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">New Route</h1>

          {/* Status pill */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
            ● Draft
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 text-sm pt-2">
          <button className="font-medium text-blue-600 border-b-2 border-blue-600 pb-1">
            Build
          </button>
          <button className="text-gray-400 cursor-not-allowed">
            Test
          </button>
          <button className="text-gray-400 cursor-not-allowed">
            Report
          </button>
          <button className="text-gray-400 cursor-not-allowed">
            Log
          </button>
        </div>
      </div>
    </div>
  );
}
