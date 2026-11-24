import Link from "next/link";
import OwnerReviewReplyForm from "@/components/OwnerReviewReplyForm";
import OwnerStats from "@/components/OwnerStats";
import { requireRole } from "@/lib/auth";
import { CITIES, DEFAULT_COMMISSION_RATE, PROPERTY_TYPES } from "@/lib/constants";
import { dateAr, money, toArabicDigits } from "@/lib/format";
import { buildOwnerStats } from "@/lib/owner-stats";
import { getRepo } from "@/lib/repo";

export const instant = false;

const statusLabel: Record<string, { ar: string; cls: string }> = {
  DRAFT: { ar: "مسودة", cls: "bg-slate-100 text-slate-700" },
  PENDING: { ar: "قيد المراجعة", cls: "bg-amber-50 text-amber-700" },
  PUBLISHED: { ar: "منشورة", cls: "bg-nile-soft text-nile-dark" },
  REJECTED: { ar: "مرفوضة", cls: "bg-red-50 text-red-700" },
};

const verificationLabel: Record<string, string> = {
  PENDING: "بانتظار مراجعة المستندات",
  SELFIE_REQUIRED: "مطلوب صورة شخصية (سيلفي)",
  SELFIE_PENDING: "الصورة الشخصية قيد المراجعة",
  APPROVED: "موثّق ✓",
  REJECTED: "مرفوض — راجع الملاحظات",
};

export default async function OwnerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireRole("OWNER");
  const sp = await searchParams;
  const created = Array.isArray(sp.created) ? sp.created[0] : sp.created;
  const repo = await getRepo();
  const [properties, bookings, verification, user] = await Promise.all([
    repo.listPropertiesForOwner(session.email),
    repo.listBookingsForOwner(session.email),
    repo.getVerification(session.email),
    repo.getUserByEmail(session.email),
  ]);
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED");
  const commissionRate = verification?.commissionRate ?? user?.commissionRate ?? DEFAULT_COMMISSION_RATE;
  const ownerPropertyIds = new Set(properties.map((p) => p.id));
  const reviews = (await repo.listAllReviews())
    .filter((r) => r.status === "PUBLISHED" && ownerPropertyIds.has(r.propertyId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const propertyNames = new Map(properties.map((p) => [p.id, p.name]));
  const publishedCount = properties.filter((p) => p.status === "PUBLISHED").length;
  const stats = buildOwnerStats({ bookings, reviews, publishedCount });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="chip">لوحة المالك</span>
          <h1 className="mt-3 text-3xl font-black">مرحباً، {session.name}</h1>
          <p className="muted mt-1 text-sm">إدارة وحداتك وحجوزاتك في مكان واحد.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/owner/profile" className="btn-ghost text-sm">الملف والتحقق</Link>
          <Link href="/owner/calendar" className="btn-ghost text-sm">تقويم التواريخ والأسعار</Link>
          <Link href="/owner/units/new" className="btn-primary text-sm">+ إضافة وحدة</Link>
        </div>
      </div>

      <div className="soft-card mb-6 flex flex-wrap items-center justify-between gap-4 border-gold/40">
        <div>
          <p className="muted text-xs">حالة التحقق</p>
          <p className="mt-1 font-extrabold">
            {verification
              ? (verificationLabel[verification.status] ?? verification.status)
              : "لم تقدم بيانات التحقق بعد"}
          </p>
          <p className="muted mt-1 text-xs">
            نسبة العمولة الحالية: <span className="font-bold text-nile">{commissionRate}%</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/owner/profile" className="btn-ghost !py-2 text-sm">عرض الملف الشخصي</Link>
          {(!verification || verification.status !== "APPROVED") && (
            <Link href="/owner/profile?verify=1" className="btn-primary !py-2 text-sm">
              {verification ? "متابعة التحقق" : "ابدأ التحقق"}
            </Link>
          )}
        </div>
      </div>

      {created === "1" && (
        <p className="mb-5 rounded-xl bg-nile-soft p-4 text-sm font-bold text-nile-dark">
          ✅ تم إرسال الوحدة للمراجعة. هتظهر في البحث بعد موافقة الإدارة.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="soft-card"><p className="muted text-xs">وحداتي</p><p className="mt-1 text-2xl font-black">{properties.length}</p></div>
        <div className="soft-card"><p className="muted text-xs">منشورة</p><p className="mt-1 text-2xl font-black">{publishedCount}</p></div>
        <div className="soft-card"><p className="muted text-xs">حجوزات مؤكدة</p><p className="mt-1 text-2xl font-black">{confirmed.length}</p></div>
        <div className="soft-card"><p className="muted text-xs">إجمالي المستحق</p><p className="mt-1 text-2xl font-black text-nile">{money(confirmed.reduce((s, b) => s + b.total - b.commission, 0))}</p></div>
      </div>

      <OwnerStats stats={stats} />

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
                    {p.status === "DRAFT" && (
                      <Link href={`/owner/units/${p.id}/preview`} className="text-xs font-bold text-gold hover:text-nile">
                        متابعة المعاينة ↗
                      </Link>
                    )}
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

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-extrabold">آراء ضيوفك</h2>
        {reviews.length === 0 ? (
          <div className="soft-card text-center">
            <p className="muted">لا توجد تقييمات منشورة على وحداتك بعد.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="soft-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold text-navy">{r.guestName}</span>
                  <span className="chip chip-gold">★ {toArabicDigits(r.rating)}</span>
                </div>
                <p className="muted mt-1 text-xs">
                  {propertyNames.get(r.propertyId)} · {dateAr(r.createdAt.slice(0, 10))}
                </p>
                <p className="mt-3 text-sm leading-7">{r.comment}</p>
                {r.ownerReply && (
                  <p className="mt-3 rounded-xl border border-gold/40 bg-gold-soft p-3 text-sm leading-7 text-navy">
                    <span className="font-extrabold">ردك: </span>{r.ownerReply}
                  </p>
                )}
                <OwnerReviewReplyForm reviewId={r.id} reply={r.ownerReply} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
