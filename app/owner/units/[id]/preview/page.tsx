import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { submitPropertyForReviewAction } from "@/app/actions";
import MapView from "@/components/MapView";
import { getSession } from "@/lib/auth";
import { CANCEL_POLICIES, CITIES, PROPERTY_TYPES } from "@/lib/constants";
import { dateAr, money, toArabicDigits } from "@/lib/format";
import { cloudinaryDeliveryUrl, propertyImageAlt } from "@/lib/image-assets";
import { getRepo } from "@/lib/repo";

export const instant = false;

const statusLabel: Record<string, string> = {
  DRAFT: "مسودة — معاينة",
  PENDING: "قيد المراجعة",
  PUBLISHED: "منشورة",
  REJECTED: "مرفوضة",
};

function isoDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default async function PropertyPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const copied = Array.isArray(sp.copied) ? sp.copied[0] : sp.copied;
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/owner/units/${id}/preview`)}`);
  if (session.role !== "OWNER" && session.role !== "ADMIN") redirect("/");

  const repo = await getRepo();
  const property = await repo.getPropertyById(id);
  if (!property) notFound();
  if (session.role !== "ADMIN" && property.ownerId !== session.email) notFound();

  const [rules, availability] = await Promise.all([
    repo.getPriceRules(property.id),
    repo.getAvailability(property.id),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = isoDay(today);
  const next30Iso = isoDay(new Date(today.getTime() + 30 * 86400000));
  const upcoming = (date: string) => date >= todayIso && date < next30Iso;
  const blocked = availability.filter((a) => a.isBlocked && upcoming(a.date)).slice(0, 12);
  const overrides = availability.filter((a) => a.priceOverride && upcoming(a.date)).slice(0, 8);
  const hasCoords = Number.isFinite(property.lat) && Number.isFinite(property.lng);
  const hasPickup = property.pickupLat != null && property.pickupLng != null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/owner" className="text-sm font-bold text-nile">← رجوع للوحة المالك</Link>
          <h1 className="mt-3 text-3xl font-black">معاينة الوحدة</h1>
          <p className="muted mt-1 text-sm">راجع كل التفاصيل قبل إرسال الوحدة للمراجعة.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="chip chip-gold">{statusLabel[property.status] ?? property.status}</span>
          <Link href="/owner/calendar" className="btn-ghost !py-2 text-sm">التقويم والأسعار</Link>
        </div>
      </div>

      {copied === "1" && (
        <p className="mb-6 rounded-xl bg-nile-soft p-4 text-sm font-bold text-nile-dark">
          ✅ تم نسخ الوحدة كمسودة جديدة بالتفاصيل والصور والسعر. راجعها ثم أرسلها للمراجعة.
        </p>
      )}
      {sp.updated === "1" && (
        <p className="mb-6 rounded-xl bg-nile-soft p-4 text-sm font-bold text-nile-dark">
          ✅ تم حفظ التعديلات على نفس الوحدة.
        </p>
      )}
      {sp.updated === "review" && (
        <p className="mb-6 rounded-xl border border-gold/50 bg-gold-soft p-4 text-sm font-bold text-navy">
          ✅ تم حفظ التعديلات. الوحدة بقت قيد المراجعة وهتظهر في البحث بعد موافقة الإدارة.
        </p>
      )}

      {/* ===== Gallery ===== */}
      <div className="mb-8 grid gap-2 sm:grid-cols-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-navy-soft sm:col-span-2 sm:row-span-2">
          {property.images[0] && (
            <Image src={cloudinaryDeliveryUrl(property.images[0], 1400)} alt={propertyImageAlt(property)} fill sizes="(max-width: 640px) 100vw, 50vw" loading="lazy" decoding="async" className="object-cover" />
          )}
        </div>
        {property.images.slice(1, 5).map((src, i) => (
          <div key={src + i} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-navy-soft">
            <Image
              src={cloudinaryDeliveryUrl(src, 600)}
              alt={propertyImageAlt(property, i + 1)}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              loading="lazy"
              decoding="async"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* ===== Core details ===== */}
          <section className="soft-card">
            <div className="flex flex-wrap gap-2">
              <span className="chip">{PROPERTY_TYPES[property.type].ar}</span>
              <span className="chip">{CITIES[property.city].ar}</span>
              <span className="chip chip-gold">عمولة {property.commissionRate}%</span>
            </div>
            <h2 className="mt-4 text-2xl font-black text-navy">{property.name}</h2>
            <p className="muted mt-1 text-sm">{property.address}</p>
            <div className="gold-rule my-5" />
            <p className="leading-8">{property.description}</p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="stat"><p className="text-lg font-extrabold text-navy">{money(property.basePrice)}</p><p className="muted mt-1 text-xs">الليلة</p></div>
              <div className="stat"><p className="text-lg font-extrabold text-navy">{toArabicDigits(property.maxGuests)}</p><p className="muted mt-1 text-xs">ضيوف</p></div>
              <div className="stat"><p className="text-lg font-extrabold text-navy">{toArabicDigits(property.bedrooms)}</p><p className="muted mt-1 text-xs">غرف نوم</p></div>
              <div className="stat"><p className="text-lg font-extrabold text-navy">{toArabicDigits(property.bathrooms)}</p><p className="muted mt-1 text-xs">حمامات</p></div>
            </div>

            <dl className="mt-6 grid gap-3 border-t border-line pt-5 text-sm sm:grid-cols-2">
              <div><dt className="muted text-xs">المساحة</dt><dd className="font-bold">{property.areaSqm ? `${toArabicDigits(property.areaSqm)} م²` : "غير محددة"}</dd></div>
              <div><dt className="muted text-xs">موقع الوحدة</dt><dd dir="ltr" className="font-bold">{property.lat}, {property.lng}</dd></div>
              <div><dt className="muted text-xs">نقطة الاستلام</dt><dd dir="ltr" className="font-bold">
                {property.pickupLat != null && property.pickupLng != null
                  ? `${property.pickupLat}, ${property.pickupLng}`
                  : "غير محددة"}
              </dd></div>
              <div><dt className="muted text-xs">الحالة</dt><dd className="font-bold">{statusLabel[property.status] ?? property.status}</dd></div>
            </dl>
          </section>

          {/* ===== Amenities, rules and policy ===== */}
          <section className="soft-card">
            <h2 className="mb-4 text-lg font-extrabold text-navy">المرافق</h2>
            <div className="flex flex-wrap gap-2">
              {property.amenities.length > 0
                ? property.amenities.map((a) => <span key={a} className="chip chip-gold">✦ {a}</span>)
                : <p className="muted text-sm">لا توجد مرافق مضافة.</p>}
            </div>

            <h2 className="mb-2 mt-6 text-lg font-extrabold text-navy">قواعد الوحدة</h2>
            <p className="muted text-sm leading-7">{property.houseRules || "لم يتم إضافة قواعد خاصة."}</p>

            <h2 className="mb-2 mt-6 text-lg font-extrabold text-navy">سياسة الإلغاء</h2>
            <p className="muted text-sm leading-7">
              {CANCEL_POLICIES[property.cancelPolicy as keyof typeof CANCEL_POLICIES] ?? property.cancelPolicy}
            </p>

            {property.videoUrl && (
              <a href={property.videoUrl} target="_blank" rel="noreferrer" className="btn-ghost mt-6 text-sm">
                شاهد فيديو الوحدة ↗
              </a>
            )}
          </section>

          {/* ===== Availability & rules ===== */}
          <section className="soft-card">
            <h2 className="mb-4 text-lg font-extrabold text-navy">ملخص التقويم والأسعار</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="label">أيام محجوزة خلال 30 يوم</p>
                {blocked.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {blocked.map((a) => <li key={a.date}>{dateAr(a.date)}</li>)}
                  </ul>
                ) : <p className="muted text-sm">لا توجد أيام محجوزة.</p>}
              </div>
              <div>
                <p className="label">أسعار خاصة خلال 30 يوم</p>
                {overrides.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {overrides.map((a) => (
                      <li key={a.date}>{dateAr(a.date)} — {money(a.priceOverride ?? 0)}</li>
                    ))}
                  </ul>
                ) : <p className="muted text-sm">لا توجد أسعار خاصة.</p>}
              </div>
            </div>

            <h3 className="mt-6 text-sm font-extrabold text-navy">قواعد الأسعار</h3>
            {rules.length > 0 ? (
              <div className="card table-wrap mt-2">
                <table className="w-full text-sm">
                  <thead><tr><th>القاعدة</th><th>من</th><th>إلى</th><th>السعر</th><th>أقل إقامة</th></tr></thead>
                  <tbody>
                    {rules.map((r) => (
                      <tr key={r.id}>
                        <td className="font-bold">{r.name}</td>
                        <td>{dateAr(r.startDate)}</td>
                        <td>{dateAr(r.endDate)}</td>
                        <td>{money(r.price)}</td>
                        <td>{toArabicDigits(r.minNights)} ليالي</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="muted mt-2 text-sm">لا توجد قواعد أسعار.</p>}
            <Link href="/owner/calendar" className="mt-4 inline-block text-sm font-bold text-nile">تعديل التقويم والأسعار ↗</Link>
          </section>
        </div>

        {/* ===== Sidebar: map + submit ===== */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {hasCoords && (
            <section className="soft-card">
              <h2 className="mb-4 text-lg font-extrabold text-navy">موقع الوحدة</h2>
              <MapView
                lat={property.lat}
                lng={property.lng}
                pickupLat={hasPickup ? property.pickupLat! : undefined}
                pickupLng={hasPickup ? property.pickupLng! : undefined}
                label={property.name}
                pickupLabel="نقطة الاستلام"
              />
            </section>
          )}

          <section className="soft-card border-gold/40">
            <h2 className="mb-2 text-lg font-extrabold text-navy">إرسال للمراجعة</h2>
            <p className="muted text-sm leading-7">
              {property.status === "DRAFT" && "المعاينة جاهزة. أرسل الوحدة للإدارة لنشرها بعد المراجعة."}
              {property.status === "PENDING" && "تم إرسال الوحدة وهي بانتظار مراجعة الإدارة."}
              {property.status === "PUBLISHED" && "الوحدة منشورة ومتاحة للضيوف."}
              {property.status === "REJECTED" && "تم رفض الوحدة. راجع البيانات ثم أعد الإرسال."}
            </p>
            {(property.status === "DRAFT" || property.status === "REJECTED") && (
              <form action={submitPropertyForReviewAction} className="mt-5">
                <input type="hidden" name="id" value={property.id} />
                <button type="submit" className="btn-gold w-full">
                  {property.status === "DRAFT" ? "إرسال للمراجعة" : "إعادة الإرسال للمراجعة"}
                </button>
              </form>
            )}
            {property.status === "PENDING" && <span className="chip mt-5">قيد المراجعة</span>}
            <Link href={`/owner/units/${property.id}/edit`} className="btn-ghost mt-5 w-full text-sm">تعديل الوحدة ✎</Link>
            {property.status === "PUBLISHED" && (
              <Link href={`/stay/${property.slug}`} className="btn-ghost mt-2 w-full text-sm">عرض الوحدة المنشورة ↗</Link>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
