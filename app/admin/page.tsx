import Link from "next/link";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { AdminNoticeProvider } from "@/components/AdminNoticeProvider";
import PropertyModerationForm from "@/components/PropertyModerationForm";
import {
  moderateReviewAction, moderateVerificationAction,
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

const activityLabel: Record<string, string> = {
  PROPERTY_PUBLISHED: "نشر وحدة",
  PROPERTY_REJECTED: "رفض وحدة",
  PROPERTY_DRAFT: "إرجاع وحدة لمسودة",
  PROPERTY_PENDING: "إعادة وحدة للمراجعة",
  EXPERIENCE_PUBLISHED: "نشر تجربة سفاري",
  EXPERIENCE_REJECTED: "رفض تجربة سفاري",
  COMMISSION_CHANGED: "تغيير عمولة",
  VERIFICATION_APPROVED: "موافقة على توثيق مالك",
  VERIFICATION_REJECTED: "رفض توثيق مالك",
  SELFIE_REQUESTED: "طلب سيلفي من مالك",
};

function activityTime(iso: string): string {
  return new Intl.DateTimeFormat("ar-EG-u-nu-arab", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
    timeZone: "Africa/Cairo",
  }).format(new Date(iso));
}

const bookingStatusLabel: Record<string, string> = {
  PENDING: "قيد الانتظار", CONFIRMED: "مؤكدة", COMPLETED: "مكتملة", CANCELLED: "ملغية",
};

const paymentStatusLabel: Record<string, string> = {
  PENDING: "بانتظار الدفع", PAID: "مدفوع", FAILED: "فشل", REFUNDED: "مسترد",
};

type AdminSP = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function pickStatus(v: string | string[] | undefined, allowed: readonly string[]): string {
  const value = one(v);
  return allowed.includes(value) ? value : "";
}

function matches(q: string, values: Array<string | null | undefined>): boolean {
  return !q || values.some((value) => String(value ?? "").toLowerCase().includes(q));
}

/** Keep the current filters when toggling "expand all" or jumping between sections. */
function adminHref(sp: AdminSP, changes: Record<string, string | undefined> = {}, hash = ""): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key in changes) continue;
    const v = Array.isArray(value) ? value[0] : value;
    if (v) params.set(key, v);
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `/admin${query ? `?${query}` : ""}${hash}`;
}

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

function VerificationActions({ userId, ownerName }: { userId: string; ownerName: string }) {
  // ملاحظة واحدة تكفي كل القرارات، فلا تضيع كتابة المستخدم بين النماذج الثلاثة.
  return (
    <form action={moderateVerificationAction} className="flex min-w-40 flex-col items-start gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input name="note" aria-label="ملاحظة قرار التوثيق" className="input min-h-11 !w-full !px-2 text-xs" placeholder="ملاحظة مشتركة" />
      <div className="flex flex-wrap gap-2">
        <button type="submit" name="status" value="SELFIE_REQUIRED" className="btn-ghost !px-2 !py-1 text-xs">طلب سيلفي</button>
        <button type="submit" name="status" value="APPROVED" className="btn-primary !px-2 !py-1 text-xs">موافقة</button>
        <ConfirmSubmitButton
          name="status"
          value="REJECTED"
          confirmText={`ترفض توثيق «${ownerName}»؟`}
          className="btn-ghost !px-2 !py-1 text-xs"
        >
          رفض
        </ConfirmSubmitButton>
      </div>
    </form>
  );
}

function ReviewActions({ id, status }: { id: string; status: string }) {
  const options = status === "PENDING"
    ? [{ status: "PUBLISHED", label: "نشر" }, { status: "HIDDEN", label: "إخفاء" }]
    : status === "HIDDEN"
      ? [{ status: "PUBLISHED", label: "نشر" }, { status: "PENDING", label: "إعادة للمراجعة" }]
      : [{ status: "HIDDEN", label: "إخفاء" }, { status: "PENDING", label: "إعادة للمراجعة" }];
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

export default async function AdminPage({ searchParams }: { searchParams: Promise<AdminSP> }) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const q = one(sp.q).trim().toLowerCase();
  const propertyStatus = pickStatus(sp.propertyStatus, ["DRAFT", "PENDING", "PUBLISHED", "REJECTED"]);
  const bookingStatus = pickStatus(sp.bookingStatus, ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]);
  const verificationStatus = pickStatus(sp.verificationStatus, ["PENDING", "SELFIE_REQUIRED", "SELFIE_PENDING", "APPROVED", "REJECTED"]);
  const reviewStatus = pickStatus(sp.reviewStatus, ["PENDING", "PUBLISHED", "HIDDEN"]);
  const hasFilter = Boolean(q || propertyStatus || bookingStatus || verificationStatus || reviewStatus);
  const expandAll = one(sp.open) === "all";

  const repo = await getRepo();
  const [stats, properties, bookings, verifications, reviews, activities] = await Promise.all([
    repo.stats(), repo.listAllProperties(), repo.listAllBookings(),
    repo.listVerifications(), repo.listAllReviews(), repo.listActivities(30),
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

  const filteredProperties = properties.filter((p) =>
    (!propertyStatus || p.status === propertyStatus) &&
    matches(q, [p.name, p.ownerName, p.address, CITIES[p.city]?.ar, PROPERTY_TYPES[p.type]?.ar, statusLabel[p.status], p.id]),
  );
  const filteredBookings = bookings.filter((b) =>
    (!bookingStatus || b.status === bookingStatus) &&
    matches(q, [b.reference, b.guestName, b.propertyName, bookingStatusLabel[b.status], b.status, b.paymentStatus]),
  );
  const filteredVerifications = verificationRows.filter(({ verification: v, user }) =>
    (!verificationStatus || v.status === verificationStatus) &&
    matches(q, [user?.name, v.userId, v.phoneAlt, v.nationality, v.note, verificationStatusLabel[v.status], v.status]),
  );
  const filteredReviews = reviews.filter((r) =>
    (!reviewStatus || r.status === reviewStatus) &&
    matches(q, [propertyNames.get(r.propertyId), r.guestName, r.comment, reviewStatusLabel[r.status], r.status]),
  );
  const filteredOwners = ownerRows.filter((o) => matches(q, [o.name, o.email]));
  const filteredActivities = activities.filter((a) =>
    matches(q, [activityLabel[a.action], a.action, a.actorName, a.actorEmail, a.target, a.detail]),
  );
  const openSection = (id: string) => expandAll || hasFilter || id === "properties";
  const emptyMessage = hasFilter ? "لا توجد نتائج مطابقة للبحث أو الفلتر." : undefined;

  return (
    <AdminNoticeProvider>
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="chip">لوحة الإدارة</span>
          <h1 className="mt-3 text-3xl font-black">نظرة عامة</h1>
          <p className="muted mt-1 text-sm">بيانات المنصة والتحكم في نشر الوحدات والتحقق والتقييمات.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/experiences" className="btn-ghost !py-2 text-sm">مراجعة التجارب والجولات ↗</Link>
          <Link href="/admin/transport" className="btn-ghost !py-2 text-sm">مراجعة النقل ↗</Link>
          <Link href="/owner" className="btn-ghost !py-2 text-sm">لوحة المالك ↗</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="soft-card"><p className="muted text-xs">الوحدات</p><p className="mt-1 text-2xl font-black">{toArabicDigits(stats.properties)}</p><p className="muted text-xs">{toArabicDigits(stats.published)} منشورة · {toArabicDigits(stats.pending)} بانتظار المراجعة</p></div>
        <div className="soft-card"><p className="muted text-xs">الحجوزات</p><p className="mt-1 text-2xl font-black">{toArabicDigits(stats.bookings)}</p><p className="muted text-xs">{toArabicDigits(stats.confirmed)} مؤكدة</p></div>
        <div className="soft-card"><p className="muted text-xs">إجمالي الحجوزات</p><p className="mt-1 text-2xl font-black text-nile">{money(stats.revenue)}</p></div>
        <div className="soft-card"><p className="muted text-xs">عمولة المنصة</p><p className="mt-1 text-2xl font-black text-nile">{money(stats.commission)}</p><p className="muted text-xs">{toArabicDigits(stats.guests)} ضيوف</p></div>
      </div>

      <section className="soft-card sticky top-16 z-30 mt-6 !p-3 md:top-[68px]" aria-label="بحث وتصفية لوحة الإدارة">
        <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-[var(--line)] pb-3">
          <span className="muted text-xs">انتقال سريع:</span>
          {[
            { id: "properties", label: "الوحدات", count: filteredProperties.length, total: properties.length },
            { id: "bookings", label: "الحجوزات", count: filteredBookings.length, total: bookings.length },
            { id: "verifications", label: "التوثيق", count: filteredVerifications.length, total: verificationRows.length },
            { id: "reviews", label: "التقييمات", count: filteredReviews.length, total: reviews.length },
            { id: "commissions", label: "العمولة", count: filteredOwners.length, total: ownerRows.length },
            { id: "activity", label: "السجل", count: filteredActivities.length, total: activities.length },
          ].map((item) => (
            <a key={item.id} href={`#${item.id}`} className="chip transition hover:border-gold">
              {item.label} <span className="muted">{toArabicDigits(item.count)}/{toArabicDigits(item.total)}</span>
            </a>
          ))}
          <Link href={adminHref(sp, { open: expandAll ? undefined : "all" })} className="chip chip-gold transition hover:border-gold">
            {expandAll ? "طي الأقسام" : "فتح كل الأقسام"}
          </Link>
          {hasFilter && <Link href="/admin" className="chip transition hover:border-gold">مسح الفلتر ✕</Link>}
        </div>
        <form method="get" className="flex flex-wrap items-end gap-2">
          <label className="min-w-[200px] flex-1 text-xs font-bold">
            <span className="muted block pb-1">بحث شامل</span>
            <input name="q" defaultValue={one(sp.q)} className="input !w-full !py-2 text-sm" placeholder="اسم وحدة، مالك، مرجع حجز، بريد، تعليق..." />
          </label>
          <label className="min-w-[140px] text-xs font-bold">
            <span className="muted block pb-1">حالة الوحدة</span>
            <select name="propertyStatus" defaultValue={propertyStatus} className="input !w-full !py-2 text-sm">
              <option value="">كل الحالات</option>
              {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="min-w-[140px] text-xs font-bold">
            <span className="muted block pb-1">حالة الحجز</span>
            <select name="bookingStatus" defaultValue={bookingStatus} className="input !w-full !py-2 text-sm">
              <option value="">كل الحالات</option>
              {Object.entries(bookingStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="min-w-[140px] text-xs font-bold">
            <span className="muted block pb-1">حالة التوثيق</span>
            <select name="verificationStatus" defaultValue={verificationStatus} className="input !w-full !py-2 text-sm">
              <option value="">كل الحالات</option>
              {Object.entries(verificationStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="min-w-[140px] text-xs font-bold">
            <span className="muted block pb-1">حالة التقييم</span>
            <select name="reviewStatus" defaultValue={reviewStatus} className="input !w-full !py-2 text-sm">
              <option value="">كل الحالات</option>
              {Object.entries(reviewStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button type="submit" className="btn-primary !py-2 text-sm">بحث</button>
        </form>
      </section>

      <details id="properties" className="mt-6 scroll-mt-[240px] md:scroll-mt-[290px]" open={openSection("properties")}>
        <summary className="mb-4 cursor-pointer list-none text-xl font-extrabold [&::-webkit-details-marker]:hidden">
          مراجعة الوحدات <span className="chip">{toArabicDigits(filteredProperties.length)}/{toArabicDigits(properties.length)}</span>
        </summary>
        <div className="card table-wrap">
          <table className="w-full text-sm">
            <thead><tr><th>الوحدة</th><th>المالك</th><th>المدينة</th><th>النوع</th><th>السعر</th><th>الحالة</th><th>إجراء</th></tr></thead>
            <tbody>
              {filteredProperties.map((p) => (
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
                        <PropertyModerationForm
                          propertyId={p.id}
                          propertyName={p.name}
                          status="PUBLISHED"
                          label="نشر"
                          className="btn-primary !px-3 !py-1.5 text-xs"
                        />
                        <PropertyModerationForm
                          propertyId={p.id}
                          propertyName={p.name}
                          status="REJECTED"
                          label="رفض"
                          className="btn-ghost !px-3 !py-1.5 text-xs"
                        />
                      </div>
                    )}
                    {p.status === "PUBLISHED" && (
                      <PropertyModerationForm
                        propertyId={p.id}
                        propertyName={p.name}
                        status="DRAFT"
                        label="إرجاع لمسودة"
                        className="btn-ghost !px-3 !py-1.5 text-xs"
                      />
                    )}
                    {p.status === "REJECTED" && (
                      <PropertyModerationForm
                        propertyId={p.id}
                        propertyName={p.name}
                        status="PENDING"
                        label="إعادة للمراجعة"
                        className="btn-ghost !px-3 !py-1.5 text-xs"
                      />
                    )}
                    {p.status === "DRAFT" && <span className="muted text-xs">مسودة</span>}
                  </td>
                </tr>
              ))}
              {filteredProperties.length === 0 && <tr><td colSpan={7} className="py-6 text-center muted">{emptyMessage ?? "لا توجد وحدات بعد."}</td></tr>}
            </tbody>
          </table>
        </div>
      </details>

      <details id="bookings" className="mt-6 scroll-mt-[240px] md:scroll-mt-[290px]" open={openSection("bookings")}>
        <summary className="mb-4 cursor-pointer list-none text-xl font-extrabold [&::-webkit-details-marker]:hidden">
          أحدث الحجوزات <span className="chip">{toArabicDigits(filteredBookings.length)}/{toArabicDigits(bookings.length)}</span>
        </summary>
        <div className="card table-wrap">
          <table className="w-full text-sm">
            <thead><tr><th>المرجع</th><th>الضيف</th><th>الوحدة</th><th>الوصول</th><th>الإجمالي</th><th>العمولة</th><th>الحالة</th><th>الدفع</th><th>إجراء</th></tr></thead>
            <tbody>
              {filteredBookings.slice(0, 20).map((b) => (
                <tr key={b.id}>
                  <td dir="ltr" className="font-bold text-nile">{b.reference}</td>
                  <td>{b.guestName}</td>
                  <td>{b.propertyName}</td>
                  <td>{dateAr(b.checkIn)}</td>
                  <td>{money(b.total)}</td>
                  <td>{money(b.commission)}</td>
                  <td>{bookingStatusLabel[b.status] ?? b.status}</td>
                  <td>{paymentStatusLabel[b.paymentStatus] ?? b.paymentStatus}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {(b.status === "PENDING" || b.status === "CONFIRMED") && (
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
                          <ConfirmSubmitButton
                            confirmText={`تلغي الحجز «${b.reference}»؟`}
                            className="btn-ghost !px-2 !py-1 text-xs"
                          >
                            إلغاء
                          </ConfirmSubmitButton>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && <tr><td colSpan={9} className="py-6 text-center muted">{emptyMessage ?? "لا توجد حجوزات بعد."}</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="muted mt-2 text-xs">
          عرض {toArabicDigits(Math.min(filteredBookings.length, 20))} من {toArabicDigits(filteredBookings.length)} حجز مطابق.
          يمكن للضيف تقييم إقامته بعد تحويل الحجز إلى حالة «مكتمل».
        </p>
      </details>

      <details id="verifications" className="mt-6 scroll-mt-[240px] md:scroll-mt-[290px]" open={openSection("verifications")}>
        <summary className="mb-4 cursor-pointer list-none text-xl font-extrabold [&::-webkit-details-marker]:hidden">
          طلبات توثيق الملاك <span className="chip">{toArabicDigits(filteredVerifications.length)}/{toArabicDigits(verificationRows.length)}</span>
        </summary>
        <div className="card table-wrap hidden sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>المالك</th><th>البريد</th><th>الهاتف</th><th>البديل</th><th>العمر</th>
                <th>المستندات</th><th>السيلفي</th><th>الحالة</th><th>الملاحظة</th><th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredVerifications.map(({ verification: v, user }) => {
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
                    <td><VerificationActions userId={v.userId} ownerName={user?.name ?? v.userId} /></td>
                  </tr>
                );
              })}
              {filteredVerifications.length === 0 && (
                <tr><td colSpan={10} className="py-6 text-center muted">{emptyMessage ?? "لا توجد طلبات تحقق بعد."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid gap-3 sm:hidden">
          {filteredVerifications.map(({ verification: v, user }) => {
            const age = ageFromBirthDate(v.birthDate);
            const name = user?.name ?? v.userId;
            return (
              <details key={v.userId} className="card !p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 break-words">{name}</span>
                  <span className="chip shrink-0">{verificationStatusLabel[v.status] ?? v.status}</span>
                </summary>
                <dl className="mt-3 space-y-2 border-t border-[var(--line)] pt-3 text-xs">
                  <div className="flex flex-wrap items-baseline gap-x-2"><dt className="muted">البريد:</dt><dd dir="ltr" className="min-w-0 break-all">{v.userId}</dd></div>
                  <div className="flex flex-wrap items-baseline gap-x-2"><dt className="muted">الهاتف:</dt><dd dir="ltr" className="break-all">{user?.phone ?? "—"}</dd></div>
                  <div className="flex flex-wrap items-baseline gap-x-2"><dt className="muted">البديل:</dt><dd dir="ltr" className="break-all">{v.phoneAlt ?? "—"}</dd></div>
                  <div className="flex flex-wrap items-baseline gap-x-2"><dt className="muted">العمر:</dt><dd>{age !== null ? toArabicDigits(age) : "—"}</dd></div>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <dt className="muted">المستندات:</dt>
                    <dd className="flex flex-wrap gap-3 font-bold text-nile">
                      <a href={v.idFront} target="_blank" rel="noreferrer">الوجه ↗</a>
                      <a href={v.idBack} target="_blank" rel="noreferrer">الظهر ↗</a>
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <dt className="muted">السيلفي:</dt>
                    <dd>
                      {v.selfie
                        ? <a href={v.selfie} target="_blank" rel="noreferrer" className="font-bold text-nile">عرض ↗</a>
                        : <span className="muted">—</span>}
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-2"><dt className="muted">الملاحظة:</dt><dd className="min-w-0 break-words">{v.note ?? "—"}</dd></div>
                </dl>
                <div className="mt-3 border-t border-[var(--line)] pt-3">
                  <VerificationActions userId={v.userId} ownerName={name} />
                </div>
              </details>
            );
          })}
          {filteredVerifications.length === 0 && (
            <p className="card p-4 text-center muted">{emptyMessage ?? "لا توجد طلبات تحقق بعد."}</p>
          )}
        </div>
      </details>

      <details id="reviews" className="mt-6 scroll-mt-[240px] md:scroll-mt-[290px]" open={openSection("reviews")}>
        <summary className="mb-4 cursor-pointer list-none text-xl font-extrabold [&::-webkit-details-marker]:hidden">
          مراجعة التقييمات <span className="chip">{toArabicDigits(filteredReviews.length)}/{toArabicDigits(reviews.length)}</span>
        </summary>
        <div className="card table-wrap">
          <table className="w-full text-sm">
            <thead><tr><th>الوحدة</th><th>الضيف</th><th>التقييم</th><th>التعليق</th><th>النوع</th><th>الحالة</th><th>إجراء</th></tr></thead>
            <tbody>
              {filteredReviews.map((review) => (
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
              {filteredReviews.length === 0 && <tr><td colSpan={7} className="py-6 text-center muted">{emptyMessage ?? "لا توجد تقييمات بعد."}</td></tr>}
            </tbody>
          </table>
        </div>
      </details>

      <details id="commissions" className="mt-6 scroll-mt-[240px] md:scroll-mt-[290px]" open={openSection("commissions")}>
        <summary className="mb-4 cursor-pointer list-none text-xl font-extrabold [&::-webkit-details-marker]:hidden">
          نسب العمولة <span className="chip">{toArabicDigits(filteredOwners.length)}/{toArabicDigits(ownerRows.length)}</span>
        </summary>
        <div className="card table-wrap">
          <table className="w-full text-sm">
            <thead><tr><th>المالك</th><th>البريد</th><th>النسبة الحالية</th><th>تعديل</th></tr></thead>
            <tbody>
              {filteredOwners.map((owner) => (
                <tr key={owner.email}>
                  <td className="font-bold">{owner.name}</td>
                  <td dir="ltr" className="text-xs">{owner.email}</td>
                  <td>{toArabicDigits(owner.rate)}٪</td>
                  <td>
                    <form action={setCommissionRateAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="email" value={owner.email} />
                      <input name="rate" type="number" min={0} max={100} step={1} defaultValue={owner.rate} aria-label={`نسبة عمولة ${owner.name}`} className="input !w-20 !py-1 text-sm" />
                      <span className="muted text-xs" aria-hidden>٪</span>
                      <button type="submit" className="btn-ghost !px-3 !py-1.5 text-xs">حفظ</button>
                    </form>
                  </td>
                </tr>
              ))}
              {filteredOwners.length === 0 && <tr><td colSpan={4} className="py-6 text-center muted">{emptyMessage ?? "لا يوجد ملاك بعد."}</td></tr>}
            </tbody>
          </table>
        </div>
      </details>

      <details id="activity" className="mt-6 scroll-mt-[240px] md:scroll-mt-[290px]" open={openSection("activity")}>
        <summary className="mb-1 cursor-pointer list-none text-xl font-extrabold [&::-webkit-details-marker]:hidden">
          سجل العمليات <span className="chip">{toArabicDigits(filteredActivities.length)}/{toArabicDigits(activities.length)}</span>
        </summary>
        <p className="muted mb-4 text-xs">آخر ٣٠ عملية: نشر أو رفض الوحدات، تغيير العمولة، وقرارات توثيق الملاك.</p>
        <div className="card table-wrap">
          <table className="w-full text-sm">
            <thead><tr><th>التاريخ</th><th>الإجراء</th><th>التفصيل</th><th>بواسطة</th></tr></thead>
            <tbody>
              {filteredActivities.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap text-xs">{activityTime(entry.createdAt)}</td>
                  <td className="font-bold">{activityLabel[entry.action] ?? entry.action}</td>
                  <td>
                    <span className="font-medium">{entry.target}</span>
                    {entry.detail && <span className="muted block text-xs">{entry.detail}</span>}
                  </td>
                  <td>
                    <span>{entry.actorName}</span>
                    <span dir="ltr" className="muted block text-xs">{entry.actorEmail}</span>
                  </td>
                </tr>
              ))}
              {filteredActivities.length === 0 && <tr><td colSpan={4} className="py-6 text-center muted">{emptyMessage ?? "لا توجد عمليات مسجّلة بعد."}</td></tr>}
            </tbody>
          </table>
        </div>
      </details>
    </div>
    </AdminNoticeProvider>
  );
}
