import { money, toArabicDigits } from "@/lib/format";
import type { OwnerStatsData } from "@/lib/owner-stats";

function StatCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="soft-card">
      <p className="muted text-xs">{label}</p>
      <p className={`mt-1 text-2xl font-black ${accent ? "text-nile" : ""}`}>{value}</p>
    </div>
  );
}

export default function OwnerStats({ stats }: { stats: OwnerStatsData }) {
  const max = Math.max(1, ...stats.chart.map((point) => point.count));
  const summary = stats.chart
    .map((point) => `${point.label} ${toArabicDigits(point.count)}`)
    .join("، ");

  return (
    <section className="mt-10">
      <h2 className="mb-1 text-xl font-extrabold">إحصاءات الأداء</h2>
      <p className="muted mb-4 text-xs">مبنية على حجوزاتك وتقييماتك المنشورة، من غير أي إعداد إضافي.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="حجوزات هذا الشهر" value={toArabicDigits(stats.monthBookings)} />
        <StatCard label="صافي هذا الشهر" value={money(stats.monthNet)} accent />
        <StatCard
          label="متوسط التقييم"
          value={stats.avgRating === null ? "—" : `★ ${toArabicDigits(stats.avgRating.toFixed(1))}`}
        />
        <StatCard label="إشغال الشهر" value={`${toArabicDigits(stats.occupancyPct)}٪`} />
      </div>

      <div className="soft-card mt-4">
        <h3 className="text-sm font-extrabold text-navy">الحجوزات في آخر ٦ أشهر</h3>
        <div
          className="mt-5 flex h-44 items-end gap-2 sm:gap-4"
          dir="ltr"
          role="img"
          aria-label={`الحجوزات في آخر ٦ أشهر: ${summary}`}
        >
          {stats.chart.map((point, index) => (
            <div key={point.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[0.7rem] font-black text-navy">{toArabicDigits(point.count)}</span>
              <div
                className={`w-full max-w-12 rounded-t-lg ${index === stats.chart.length - 1 ? "bg-gold" : "bg-nile"}`}
                style={{ height: `${Math.max(4, Math.round((point.count / max) * 100))}%` }}
              />
              <span className="text-[0.7rem] font-bold text-muted">{point.label}</span>
            </div>
          ))}
        </div>
        <p className="muted mt-3 text-xs">
          العمود الذهبي هو الشهر الحالي. نسبة الإشغال بتقسّم ليالي الحجوزات على أيام الشهر مضروبة في عدد الوحدات المنشورة.
        </p>
      </div>
    </section>
  );
}
