import Link from "next/link";
import {
  moderatePropertyAction, moderateReviewAction, moderateVerificationAction,
  setCommissionRateAction, updateBookingStatusAction,
} from "@/app/actions";
import { requireRole } from "@/lib/auth";
import { CITIES, DEFAULT_COMMISSION_RATE, PROPERTY_TYPES } from "@/lib/constants";
import { dateAr, money, toArabicDigits } from "@/lib/format";
import { getRepo } from "@/lib/repo";

export const instant = false;

const statusLabel: Record<string, string> = {
  DRAFT: "مسودة", PENDING: "قيد المراجعة", PUBLISHED: "منشورة", REJECTED: "مرفوضة",
};

const verificationStatusLabel: Record<string, string> = {
  PENDING: "بانتظار المستندات",
  SELFIE_REQUIRED: "مطلوب سيلفي",
  SELFIE_PENDING: "السيلفي قيد المراجعة",
  APPROVED: "موثّق",
  REJECTED: "مرفوض",
};

const reviewStatusLabel: Record<string, string> = {
  PENDING: "قيد المراجعة", PUBLISHED: "منشور", HIDDEN: "مخفي",
};

function ageFromBirthDate(value: string | null): number | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const birth = new Date(Date.UTC(year, month - 1, day));
  if (
    birth.getUTCFullYear() !== year ||
    birth.getUTCMonth() !== month - 1 ||
    birth.getUTCDate() !== day
  ) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - year;
  const currentMonth = now.getUTCMonth() + 1;
  if (currentMonth < month || (currentMonth === month && now.getUTCDate() < day)) age -= 1;
  return age;
}

function VerificationActions({ userId }: { userId: string }) {
  const options = [
    { status: "SELFIE_REQUIRED", label: "طلب سيلفي", primary: false },
    { status: "APPROVED", label: "موافقة", primary: true },
    { status: "REJECTED", label: "رفض", primary: false },
  ] as const;
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <form key={option.status} action={moderateVerificationAction} className="flex items-center gap-1">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="status" value={option.status} />
          <input name="note" className="input !w-20 !px-2 !py-1 text-xs" placeholder="ملاحظة" />
          <button type="submit" className={option.primary ? "btn-primary !px-2 !py-1 text-xs" : "btn-ghost !px-2 !py-1 text-xs"}>
            {option.label}
          </button>
        </form>
      ))}
    </div>
  );
}

function ReviewActions({ id, status }: { id: string; status: string }) {
  const options = status === "HIDDEN"
    ? [{ status: "PUBLISHED", label: "نشر" }]
    : [{ status: "PUBLISHED", label: "نشر" }, { status: "HIDDEN", label: "إخفاء" }];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <form key={option.status} action={moderateReviewAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={option.status} />
          <button type="submit" className={option.status === "PUBLISHED" ? "btn-primary !px-2 !py-1 text-xs" : "btn-ghost !px-2 !py-1 text-xs"}>
            {option.label}
          </button>
        </form>
      ))}
    </div>
  );
}

export default async function AdminPage() {
  await requireRole("ADMIN");
  const repo = await getRepo();
  const [stats, properties, bookings, verifications, reviews] = await Promise.all([
    repo.stats(), repo.listAllProperties(), repo.listAllBookings(),
    repo.listVerifications(), repo.listAllReviews(),
  ]);
  const verificationRows = await Promise.all(verifications.map(async (verification) => ({
    verification,
    user: await repo.getUserByEmail(verification.userId),
  })));

  const owners = new Map<string, string>();
  for (const property of properties) owners.set(property.ownerId, property.ownerName);
  verificationRows.forEach(({ verification, user }) => {
    if (!owners.has(verification.userId)) owners.set(verification.userId, user?.name ?? verification.userId);
  });
  const ownerRows = await Promise.all([...owners.entries()].map(async ([email, name]) => ({
    email,
    name,
    rate: (await repo.getUserByEmail(email))?.commissionRate ?? DEFAULT_COMMISSION_RATE,
  })));
  const propertyNames = new Map(properties.map((p) => [p.id, p.name]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="chip">لوحة الإدارة</span>
          <h1 className="mt-3 text-3xl font-black">نظرة عامة</h1>
          <p className="muted mt-1 text-sm">بيانات المنصة والتحكم في نشر الوحدات والتحقق والتقييمات.</p>
        </div>
        <Link href="/owner" className="btn-ghost !py-2 text-sm">لوحة المالك ↗</Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="soft-card"><p className="muted text-xs">الوحدات</p><p className="mt-1 text-2xl font-black">{stats.properties}</p><p className="muted text-xs">{stats.published} منشورة · {stats.pending} بانتظار المراجعة</p></div>
        <div className="soft-card"><p className="muted text-xs">الحجوزات</p><p className="mt-1 text-2xl font-black">{stats.bookings}</p><p className="muted text-xs">{stats.confirmed} مؤكدة</p></div>
        <div className="soft-card"><p className="muted text-xs">إجمالي الحجوزات</p><p className="mt-1 text-2xl font-black text-nile">{money(stats.revenue)}</p></div>
        <div className="soft-card"><p className="muted text-xs">عمولة المنصة</p><p className="mt-1 text-2xl font-black text-nile">{money(stats.commission)}</p><p className="muted text-xs">{stats.guests} ضيوف</p></div>
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
            <thead><tr><th>المرجع</th><th>الضيف</th><th>الوحدة</th><th>الوصول</th><th>الإجمالي</th><th>العمولة</th><th>الحالة</th><th>الدفع</th><th>إجراء</th></tr></thead>
            <tbody>
              {bookings.slice(0, 20).map((b) => (
                <tr key={b.id}>
                  <td dir="ltr" className="font-bold text-nile">{b.reference}</td>
                  <td>{b.guestName}</td>
                  <td>{b.propertyName}</td>
                  <td>{dateAr(b.checkIn)}</td>
                  <td>{money(b.total)}</td>
                  <td>{money(b.commission)}</td>
                  <td>{b.status}</td>
                  <td>{b.paymentStatus}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {b.status !== "COMPLETED" && (
                        <form action={updateBookingStatusAction}>
                          <input type="hidden" name="reference" value={b.reference} />
                          <input type="hidden" name="status" value="COMPLETED" />
                          <button type="submit" className="btn-primary !px-2 !py-1 text-xs">إكمال</button>
                        </form>
                      )}
                      {b.status !== "CANCELLED" && (
                        <form action={updateBookingStatusAction}>
                          <input type="hidden" name="reference" value={b.reference} />
                          <input type="hidden" name="status" value="CANCELLED" />
                          <button type="submit" className="btn-ghost !px-2 !py-1 text-xs">إلغاء</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && <tr><td colSpan={9} className="py-6 text-center muted">لا توجد حجوزات بعد.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="muted mt-2 text-xs">يمكن للضيف تقييم إقامته بعد تحويل الحجز إلى حالة «مكتمل».</p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-extrabold">طلبات توثيق الملاك</h2>
        <div className="card table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>المالك</th><th>البريد</th><th>الهاتف</th><th>البديل</th><th>العمر</th>
                <th>المستندات</th><th>السيلفي</th><th>الحالة</th><th>الملاحظة</th><th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {verificationRows.map(({ verification: v, user }) => {
                const age = ageFromBirthDate(v.birthDate);
                return (
                  <tr key={v.userId}>
                    <td className="font-bold">{user?.name ?? v.userId}</td>
                    <td dir="ltr" className="text-xs">{v.userId}</td>
                    <td dir="ltr" className="text-xs">{user?.phone ?? "—"}</td>
                    <td dir="ltr" className="text-xs">{v.phoneAlt ?? "—"}</td>
                    <td>{age !== null ? toArabicDigits(age) : "—"}</td>
                    <td>
                      <div className="flex flex-wrap gap-2 text-xs font-bold text-nile">
                        <a href={v.idFront} target="_blank" rel="noreferrer">الوجه ↗</a>
                        <a href={v.idBack} target="_blank" rel="noreferrer">الظهر ↗</a>
                      </div>
                    </td>
                    <td>
                      {v.selfie
                        ? <a href={v.selfie} target="_blank" rel="noreferrer" className="text-xs font-bold text-nile">عرض ↗</a>
                        : <span className="muted text-xs">—</span>}
                    </td>
                    <td>{verificationStatusLabel[v.status] ?? v.status}</td>
                    <td className="max-w-52 whitespace-normal text-xs">{v.note ?? "—"}</td>
                    <td><VerificationActions userId={v.userId} /></td>
                  </tr>
                );
              })}
              {verificationRows.length === 0 && (
                <tr><td colSpan={10} className="py-6 text-center muted">لا توجد طلبات تحقق بعد.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-extrabold">مراجعة التقييمات</h2>
        <div className="card table-wrap">
          <table className="w-full text-sm">
            <thead><tr><th>الوحدة</th><th>الضيف</th><th>التقييم</th><th>التعليق</th><th>النوع</th><th>الحالة</th><th>إجراء</th></tr></thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td className="font-bold">{propertyNames.get(review.propertyId) ?? review.propertyId}</td>
                  <td>{review.guestName}</td>
                  <td>{toArabicDigits(review.rating)} ★</td>
                  <td className="max-w-72 whitespace-normal text-xs">{review.comment}</td>
                  <td>{review.isDemo ? <span className="chip chip-gold">تجريبي</span> : "حقيقي"}</td>
                  <td>{reviewStatusLabel[review.status] ?? review.status}</td>
                  <td><ReviewActions id={review.id} status={review.status} /></td>
                </tr>
              ))}
              {reviews.length === 0 && <tr><td colSpan={7} className="py-6 text-center muted">لا توجد تقييمات بعد.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-extrabold">نسب العمولة</h2>
        <div className="card table-wrap">
          <table className="w-full text-sm">
            <thead><tr><th>المالك</th><th>البريد</th><th>النسبة الحالية</th><th>تعديل</th></tr></thead>
            <tbody>
              {ownerRows.map((owner) => (
                <tr key={owner.email}>
                  <td className="font-bold">{owner.name}</td>
                  <td dir="ltr" className="text-xs">{owner.email}</td>
                  <td>{owner.rate}%</td>
                  <td>
                    <form action={setCommissionRateAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="email" value={owner.email} />
                      <input name="rate" type="number" min={0} max={100} step={1} defaultValue={owner.rate} className="input !w-20 !py-1 text-sm" />
                      <button type="submit" className="btn-ghost !px-3 !py-1.5 text-xs">حفظ</button>
                    </form>
                  </td>
                </tr>
              ))}
              {ownerRows.length === 0 && <tr><td colSpan={4} className="py-6 text-center muted">لا يوجد ملاك بعد.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
