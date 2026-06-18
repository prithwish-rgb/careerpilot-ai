export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-48 rounded-3xl bg-gray-200/80" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 rounded-xl bg-gray-200/80" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 rounded-xl bg-gray-200/80" />
        <div className="h-64 rounded-xl bg-gray-200/80" />
      </div>
    </div>
  );
}
