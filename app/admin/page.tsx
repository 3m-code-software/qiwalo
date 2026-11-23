import { moderatePropertyAction } from "@/app/actions";
import { requireRole } from "@/lib/auth";
import { CITIES, PROPERTY_TYPES } from "@/lib/constants";
import { money } from "@/lib/format";
import { getRepo } from "@/lib/repo";

export const instant = false;

const statusLabel: Record<string, string> = {
  DRAFT: "مسودة", PENDING: "قيد المراجعة", PUBLISHED: "منشورة", REJECTED: "مرفوضة",
};

export default async function AdminPage() {
  await requireRole("ADMIN");
  const repo = await getRepo();
  const [stats, properties, bookings] = await Promise.all([
    repo.stats(), repo.listAllProperties(), repo.listAllBookings(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <span className="chip">لوحة الإدارة</span>
      <h1 className="mt-3 text-3xl font-black">نظرة عامة</h1>
      <p className="muted mt-1 text-sm">بيانات المنصة والتحكم في نشر الوحدات.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="soft-card"><p className="muted text-xs">الوحدات</p><p className="mt-1 text-2xl font-black">{stats.properties}</p><p className="muted text-xs">{stats.published} منشورة · {stats.pending} بانتظار المراجعة</p></div>
        <div className="soft-card"><p className="muted text-xs">الحجوزات</p><p className="mt-1 text-2xl font-black">{stats.bookings}</p><p className="muted text-xs">{stats.confirmed} مؤكدة</p></div>
        <div className="soft-card"><p className="muted text-xs">إجمالي الحجوزات</p><p className="mt-1 text-2xl font-black text-nile">{money(stats.revenue)}</p></div>
        <div className="soft-card"><p className="muted text-xs">عمولة المنصة (12%)</p><p className="mt-1 text-2xl font-black text-nile">{money(stats.commission)}</p><p className="muted text-xs">{stats.guests} ضيوف</p></div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-extrabold">مراجعة الوحدات</h2>
        <div className="card table-wrap">
          <table className="w-full text-sm">
            <thead><tr><th>الوحدة</th><th>المالك</th><th>المدينة</th><th>النوع</th><th>السعر</th><th>الحالة</th><th>إجراء</th></tr></thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id}>
                  <td className="font-bold">{p.name}</td>
                  <td>{p.ownerName}</td>
                  <td>{CITIES[p.city].ar}</td>
                  <td>{PROPERTY_TYPES[p.type].ar}</td>
                  <td>{money(p.basePrice)}</td>
                  <td>{statusLabel[p.status] ?? p.status}</td>
                  <td>
                    {p.status === "PENDING" && (
                      <div className="flex gap-2">
                        <form action={moderatePropertyAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="status" value="PUBLISHED" />
                          <button className="btn-primary !px-3 !py-1.5 text-xs">نشر</button>
                        </form>
                        <form action={moderatePropertyAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="status" value="REJECTED" />
                          <button className="btn-ghost !px-3 !py-1.5 text-xs">رفض</button>
                        </form>
                      </div>
                    )}
                    {p.status === "PUBLISHED" && <span className="muted text-xs">منشورة</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-extrabold">أحدث الحجوزات</h2>
        <div className="card table-wrap">
          <table className="w-full text-sm">
            <thead><tr><th>المرجع</th><th>الضيف</th><th>الوحدة</th><th>الإجمالي</th><th>العمولة</th><th>الحالة</th><th>الدفع</th></tr></thead>
            <tbody>
              {bookings.slice(0, 20).map((b) => (
                <tr key={b.id}>
                  <td dir="ltr" className="font-bold text-nile">{b.reference}</td>
                  <td>{b.guestName}</td>
                  <td>{b.propertyName}</td>
                  <td>{money(b.total)}</td>
                  <td>{money(b.commission)}</td>
                  <td>{b.status}</td>
                  <td>{b.paymentStatus}</td>
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
