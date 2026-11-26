import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import PriceBreakdown from "@/components/PriceBreakdown";
import { overlapsBlockedDates } from "@/lib/availability";
import { CITIES, TRANSPORT_TYPES } from "@/lib/constants";
import { dateAr, money, toArabicDigits } from "@/lib/format";
import { cloudinaryDeliveryUrl, propertyImageAlt } from "@/lib/image-assets";
import { quoteStay } from "@/lib/pricing";
import { getRepo } from "@/lib/repo";

export const instant = false;

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const slug = one(sp.slug);
  const checkIn = one(sp.checkIn);
  const checkOut = one(sp.checkOut);
  const guests = Math.max(1, Number(one(sp.guests)) || 1);
  const repo = await getRepo();
  const property = await repo.getPropertyBySlug(slug);
  if (!property || property.status !== "PUBLISHED") notFound();

  const [rules, availability] = await Promise.all([repo.getPriceRules(property.id), repo.getAvailability(property.id)]);
  const result = quoteStay(property, rules, availability, checkIn, checkOut);

  const experienceId = one(sp.experience);
  const transportId = one(sp.transport);
  const packageId = one(sp.package);
  const [requestedExperience, requestedTransport, requestedPackage] = await Promise.all([
    experienceId ? repo.getExperienceById(experienceId) : Promise.resolve(null),
    transportId ? repo.getTransportById(transportId) : Promise.resolve(null),
    packageId ? repo.getPackageById(packageId) : Promise.resolve(null),
  ]);
  const experience = requestedExperience
    && requestedExperience.status === "PUBLISHED"
    && requestedExperience.city === property.city
    && guests <= requestedExperience.capacity
    ? requestedExperience
    : null;
  const experienceTotal = experience ? experience.pricePerPerson * guests : 0;
  const experienceCommission = experience ? Math.round(experienceTotal * (experience.commissionRate / 100)) : 0;
  const experienceLabel = experience?.category === "MOTORCYCLE_TOUR" ? "جولات الموتوسيكلات" : "سفاري الجبال";
  const transportBlocked = Boolean(
    requestedTransport && overlapsBlockedDates(checkIn, checkOut, requestedTransport.blockedDates),
  );
  const transport = requestedTransport
    && !transportBlocked
    && requestedTransport.status === "PUBLISHED"
    && requestedTransport.city === property.city
    && guests <= requestedTransport.capacity
    ? requestedTransport
    : null;
  const transportTotal = transport?.pricePerTrip ?? 0;
  const transportCommission = transport ? Math.round(transportTotal * (transport.commissionRate / 100)) : 0;
  let pkg = requestedPackage
    && requestedPackage.status === "PUBLISHED"
    && requestedPackage.city === property.city
    && requestedPackage.propertyId === property.id
    && guests <= requestedPackage.capacity
    ? requestedPackage
    : null;
  const packageTransport = pkg ? await repo.getTransportById(pkg.transportId) : null;
  const packageTransportBlocked = Boolean(
    packageTransport && overlapsBlockedDates(checkIn, checkOut, packageTransport.blockedDates),
  );
  if (packageTransportBlocked) pkg = null;
  const nights = result.ok ? result.quote.nights : 0;
  const packageTotal = pkg ? pkg.pricePerNight * nights : 0;
  const packageCommission = pkg ? Math.round(packageTotal * (pkg.commissionRate / 100)) : 0;
  const baseParams = new URLSearchParams({ slug, checkIn, checkOut, guests: String(guests) });
  if (experience) baseParams.set("experience", experience.id);
  if (transport) baseParams.set("transport", transport.id);
  if (pkg) baseParams.set("package", pkg.id);
  const withoutExperience = new URLSearchParams(baseParams);
  withoutExperience.delete("experience");
  const withoutTransport = new URLSearchParams(baseParams);
  withoutTransport.delete("transport");
  const withoutPackage = new URLSearchParams(baseParams);
  withoutPackage.delete("package");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <span className="eyebrow !text-gold">خطوة واحدة</span>
        <h1 className="section-title mt-3">تأكيد الحجز</h1>
        <p className="muted mt-1 text-sm">تحويل بنكي أو كاش عند الوصول</p>
      </div>

      {!result.ok ? (
        <div className="soft-card text-center">
          <p className="font-bold">التواريخ غير متاحة أو غير صحيحة.</p>
          <Link href={`/stay/${property.slug}`} className="btn-ghost mt-4 text-sm">رجوع للوحدة</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_340px]">
          <div className="soft-card">
            {(transportBlocked || packageTransportBlocked) && (
              <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700" role="alert">
                النقل المحدد محجوز في أحد التواريخ؛ اختر مواعيد تانية أو شيل النقل من الحجز.
              </p>
            )}
            <CheckoutForm
              property={property}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              quote={result.quote}
              experience={experience ? { id: experience.id, name: experience.name, total: experienceTotal } : null}
              transport={transport ? { id: transport.id, name: transport.name, total: transportTotal } : null}
              package={pkg ? { id: pkg.id, name: pkg.name, total: packageTotal } : null}
            />
          </div>

          <aside className="soft-card h-fit">
            <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-xl">
              {property.images[0] && <Image src={cloudinaryDeliveryUrl(property.images[0], 700)} alt={propertyImageAlt(property)} fill sizes="340px" loading="lazy" decoding="async" className="object-cover" />}
            </div>
            <h2 className="font-extrabold text-navy">{property.name}</h2>
            <p className="muted text-xs">{CITIES[property.city].ar} · {property.address}</p>
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><span className="muted">الوصول</span><span className="font-bold">{dateAr(checkIn)}</span></div>
              <div className="flex justify-between"><span className="muted">المغادرة</span><span className="font-bold">{dateAr(checkOut)}</span></div>
              <div className="flex justify-between"><span className="muted">الليالي</span><span className="font-bold">{result.quote.nights}</span></div>
              <div className="flex justify-between"><span className="muted">الضيوف</span><span className="font-bold">{guests}</span></div>
            </div>
            {experience && (
              <div className="mt-4 rounded-xl border border-gold/40 bg-gold-soft p-4" data-testid="checkout-experience">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-extrabold text-navy">{experienceLabel}</p>
                  <Link href={`/checkout?${withoutExperience.toString()}`} className="text-xs font-bold text-nile hover:text-gold">إزالة ✕</Link>
                </div>
                <p className="text-sm font-bold">{experience.name}</p>
                <p className="muted mt-1 text-xs">{experience.mountain} · {toArabicDigits(experience.durationHours)} ساعات · نقطة اللقاء: {experience.meetingPoint}</p>
                <p className="muted mt-2 text-xs">بعد مراجعة الإدارة للمستندات. المشمولات: {experience.includes.join(" · ")}</p>
              </div>
            )}
            {transport && (
              <div className="mt-4 rounded-xl border border-gold/40 bg-gold-soft p-4" data-testid="checkout-transport">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-extrabold text-navy">النقل السياحي · {TRANSPORT_TYPES[transport.type].ar}</p>
                  <Link href={`/checkout?${withoutTransport.toString()}`} className="text-xs font-bold text-nile hover:text-gold">إزالة ✕</Link>
                </div>
                <p className="text-sm font-bold">{transport.name}</p>
                {(transport.driverName || transport.plateNumber) && (
                  <p className="muted mt-1 text-xs" data-testid="checkout-driver">
                    السائق: <span className="font-bold text-navy">{transport.driverName ?? "سائق قيوالو"}</span>
                    {transport.plateNumber && <> <span dir="ltr">({transport.plateNumber})</span></>}
                  </p>
                )}
                <p className="muted mt-1 text-xs">{transport.routeFrom} ← {transport.routeTo} · {toArabicDigits(transport.durationHours)} ساعات · نقطة اللقاء: {transport.meetingPoint}</p>
                <p className="muted mt-2 text-xs">سعر الرحلة للمركبة، وليس للفرد. المشمولات: {transport.includes.join(" · ")}</p>
              </div>
            )}
            {pkg && (
              <div className="mt-4 rounded-xl border border-gold/40 bg-gold-soft p-4" data-testid="checkout-package">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-extrabold text-navy">الباقة: وحدة + نقل + جولة</p>
                  <Link href={`/checkout?${withoutPackage.toString()}`} className="text-xs font-bold text-nile hover:text-gold">إزالة ✕</Link>
                </div>
                <p className="text-sm font-bold">{pkg.name}</p>
                <p className="muted mt-1 text-xs">{pkg.propertyName} · {pkg.transportName} · {pkg.experienceName}</p>
                <p className="muted mt-2 text-xs">
                  {money(pkg.pricePerNight)} لكل ليلة × {toArabicDigits(nights)} ليالي = <span className="font-bold text-nile">{money(packageTotal)}</span>
                </p>
                <p className="muted mt-2 text-xs">المشمولات: {pkg.includes.join(" · ")} · بعد مراجعة الإدارة للمستندات.</p>
              </div>
            )}
            <div className="mt-4 border-t border-line pt-4">
              <PriceBreakdown
                quote={result.quote}
                commissionRate={property.commissionRate}
                addOns={[
                  ...(pkg ? [{
                    label: `الباقة (${pkg.name})`,
                    amount: packageTotal,
                    commission: packageCommission,
                  }] : []),
                  ...(experience ? [{
                    label: `${experienceLabel} (${experience.name})`,
                    amount: experienceTotal,
                    commission: experienceCommission,
                  }] : []),
                  ...(transport ? [{
                    label: `النقل (${transport.name})`,
                    amount: transportTotal,
                    commission: transportCommission,
                  }] : []),
                ]}
              />
            </div>
            <p className="mt-4 border-t border-line pt-4 text-xs font-bold leading-6 text-muted">تحويل بنكي أو كاش عند الوصول</p>
          </aside>
        </div>
      )}
    </div>
  );
}
