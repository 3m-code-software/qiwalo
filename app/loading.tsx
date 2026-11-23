export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10" aria-label="جارٍ التحميل">
      <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-line" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card">
            <div className="aspect-[4/3] animate-pulse bg-nile-soft" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-line" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-line" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
