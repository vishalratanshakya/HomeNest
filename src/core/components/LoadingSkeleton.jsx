export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="skeleton h-48 w-full"></div>
      <div className="p-4 space-y-3">
        <div className="skeleton h-6 w-3/4 rounded"></div>
        <div className="skeleton h-4 w-1/2 rounded"></div>
        <div className="skeleton h-4 w-1/3 rounded"></div>
        <div className="flex justify-between pt-3">
          <div className="skeleton h-8 w-24 rounded"></div>
          <div className="skeleton h-8 w-24 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="skeleton h-6 w-48 rounded"></div>
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-6 flex items-center space-x-4">
            <div className="skeleton h-10 w-10 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-1/3 rounded"></div>
              <div className="skeleton h-4 w-1/4 rounded"></div>
            </div>
            <div className="skeleton h-8 w-20 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-4 w-24 rounded"></div>
          <div className="skeleton h-8 w-16 rounded"></div>
          <div className="skeleton h-4 w-32 rounded"></div>
        </div>
        <div className="skeleton h-12 w-12 rounded-lg"></div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="skeleton h-8 w-48 rounded"></div>
            <div className="skeleton h-8 w-8 rounded-full"></div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={5} />
      </div>
    </div>
  );
}
