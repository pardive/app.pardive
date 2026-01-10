export default function WorkspacePage() {
  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Workspace
        </h1>
        <p className="text-sm text-gray-500">
          Your default workspace overview
        </p>
      </div>

      {/* Empty State */}
      <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center bg-white">
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Welcome to your workspace
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          This is where your apps, routes, and configurations will live.
        </p>

        <div className="flex justify-center gap-3">
          <button className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700">
            Create App
          </button>

          <button className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-gray-50">
            Learn more
          </button>
        </div>
      </div>
    </div>
  );
}
