export default function LoadingState({
  title = "جارٍ تجهيز البيانات...",
  description = "لحظة بسيطة وبتظهر النتائج.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10" role="status" aria-live="polite" aria-label={title}>
      <div className="mb-6 flex items-center gap-3">
        <span className="h-3 w-3 animate-ping rounded-full bg-gold" />
        <div>
          <p className="text-lg font-black text-navy">{title}</p>
          <p className="muted text-sm">{description}</p>
        </div>
      </div>

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

      <div className="loading-delay mt-6 rounded-xl border border-gold/40 bg-gold-soft p-4 text-sm leading-7 text-navy">
        لو استمر التحميل أكثر من المتوقع،{" "}
        <a href="" className="font-black underline decoration-gold underline-offset-2">
          حدّث الصفحة
        </a>{" "}
        أو جرّب مرة أخرى بعد قليل.
      </div>
    </div>
  );
}
