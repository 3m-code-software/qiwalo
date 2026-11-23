import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { CITIES, PROPERTY_TYPES } from "@/lib/constants";
import { dateAr, money } from "@/lib/format";
import { getRepo } from "@/lib/repo";

export const instant = false;

const statusLabel: Record<string, { ar: string; cls: string }> = {
  DRAFT: { ar: "مسودة", cls: "bg-slate-100 text-slate-700" },
  PENDING: { ar: "قيد المراجعة", cls: "bg-amber-50 text-amber-700" },
  PUBLISHED: { ar: "منشورة", cls: "bg-nile-soft text-nile-dark" },
  REJECTED: { ar: "مرفوضة", cls: "bg-red-50 text-red-700" },
};

export default async function OwnerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireRole("OWNER");
  const sp = await searchParams;
  const created = Array.isArray(sp.created) ? sp.created[0] : sp.created;
  const repo = await getRepo();
  const [properties, bookings] = await Promise.all([
    repo.listPropertiesForOwner(session.email),
    repo.listBookingsForOwner(session.email),
  ]);
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="chip">لوحة المالك</span>
          <h1 className="mt-3 text-3xl font-black">مرحباً، {session.name}</h1>
          <p className="muted mt-1 text-sm">إدارة وحداتك وحجوزاتك في مكان واحد.</p>
        </div>
        <Link href="/owner/units/new" className="btn-primary text-sm">+ إضافة وحدة</Link>
      </div>

      {created === "1" && (
        <p className="mb-5 rounded-xl bg-nile-soft p-4 text-sm font-bold text-nile-dark">
          ✅ تم إرسال الوحدة للمراجعة. هتظهر في البحث بعد موافقة الإدارة.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="soft-card"><p className="muted text-xs">وحداتي</p><p className="mt-1 text-2xl font-black">{properties.length}</p></div>
        <div className="soft-card"><p className="muted text-xs">منشورة</p><p className="mt-1 text-2xl font-black">{properties.filter((p) => p.status === "PUBLISHED").length}</p></div>
        <div className="soft-card"><p className="muted text-xs">حجوزات مؤكدة</p><p className="mt-1 text-2xl font-black">{confirmed.length}</p></div>
        <div className="soft-card"><p className="muted text-xs">إجمالي المستحق</p><p className="mt-1 text-2xl font-black text-nile">{money(confirmed.reduce((s, b) => s + b.total - b.commission, 0))}</p></div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-extrabold">وحداتي</h2>
        {properties.length === 0 ? (
          <div className="soft-card text-center">
            <p className="muted">لسه مضيفتش أي وحدة.</p>
            <Link href="/owner/units/new" className="btn-primary mt-4 text-sm">أضف أول وحدة</Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => {
              const s = statusLabel[p.status];
              return (
                <div key={p.id} className="soft-card">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className={`chip !bg-transparent ${s.cls}`}>{s.ar}</span>
                    <span className="muted text-xs">{PROPERTY_TYPES[p.type].ar}</span>
                  </div>
                  <h3 className="font-extrabold">{p.name}</h3>
                  <p className="muted mt-1 text-xs">{CITIES[p.city].ar} · {p.address}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
                    <span className="font-bold text-nile">{money(p.basePrice)} / ليلة</span>
                    {p.status === "PUBLISHED" && <Link href={`/stay/${p.slug}`} className="text-xs font-bold hover:text-nile">معاينة ↗</Link>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-extrabold">الحجوزات</h2>
        <div className="card table-wrap">
          <table className="w-full text-sm">
            <thead><tr><th>المرجع</th><th>الضيف</th><th>الوحدة</th><th>الوصول</th><th>المغادرة</th><th>الإجمالي</th><th>الحالة</th></tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td dir="ltr" className="font-bold text-nile">{b.reference}</td>
                  <td>{b.guestName}</td>
                  <td>{b.propertyName}</td>
                  <td>{dateAr(b.checkIn)}</td>
                  <td>{dateAr(b.checkOut)}</td>
                  <td>{money(b.total)}</td>
                  <td>{b.status === "CONFIRMED" ? "مؤكد" : b.status === "COMPLETED" ? "مكتمل" : b.status}</td>
                </tr>
              ))}
              {bookings.length === 0 && <tr><td colSpan={7} className="py-6 text-center muted">لا توجد حجوزات بعد.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
