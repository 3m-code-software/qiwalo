import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import ExperienceAddOn from "@/components/ExperienceAddOn";
import PackageAddOn from "@/components/PackageAddOn";
import TransportAddOn from "@/components/TransportAddOn";
import FavoriteButton from "@/components/FavoriteButton";
import PropertyGallery from "@/components/PropertyGallery";
import MapView from "@/components/MapView";
import MobileBookingBar from "@/components/MobileBookingBar";
import PriceBreakdown from "@/components/PriceBreakdown";
import ReviewsTab from "@/components/ReviewsTab";
import { CITIES, COMMISSION_RATE, PROPERTY_TYPES, SUPPORT_PHONE, SUPPORT_TELEGRAM, SUPPORT_WHATSAPP } from "@/lib/constants";
import { dateAr, money, toArabicDigits } from "@/lib/format";
import { propertyImageAlt, socialImageUrl } from "@/lib/image-assets";
import { cancelPolicyText } from "@/lib/notifications";
import { priceForDate, quoteStay } from "@/lib/pricing";
import { getRepo } from "@/lib/repo";

export const instant = false;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-3 text-xl font-extrabold text-navy">
      <span className="h-5 w-1 rounded-full bg-gold" />
      {children}
    </h2>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await (await getRepo()).getPropertyBySlug(slug);
  if (!property || property.status !== "PUBLISHED") {
    return { title: "وحدة غير موجودة", robots: { index: false, follow: false } };
  }

  const city = CITIES[property.city].ar;
  const type = PROPERTY_TYPES[property.type].ar;
  const highlights = property.amenities.slice(0, 3).join("، ");
  const raw = `${property.name} — ${type} في ${city} بسعر ${money(property.basePrice)} للليلة${highlights ? `، وتشمل ${highlights}` : ""}.`;
  const description = raw.length <= 160 ? raw : `${raw.slice(0, 157).trimEnd()}…`;
  const title = `${property.name} | ${city}`;
  const image = socialImageUrl(property.images[0]);

  return {
    title,
    description,
    alternates: { canonical: `/stay/${property.slug}` },
    openGraph: {
      type: "website",
      locale: "ar_EG",
      siteName: "قيوالو",
      title,
      description,
      url: `/stay/${property.slug}`,
      images: [{ url: image, width: 1200, height: 630, alt: propertyImageAlt(property) }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function StayPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const repo = await getRepo();
  const property = await repo.getPropertyBySlug(slug);
  if (!property || property.status !== "PUBLISHED") notFound();

  const [rules, availability, reviews, safaris, motorcycleTours, transports, packages] = await Promise.all([
    repo.getPriceRules(property.id),
    repo.getAvailability(property.id),
    repo.listReviewsForProperty(property.id),
    repo.listPublishedExperiences(property.city, "MOUNTAIN_SAFARI"),
    repo.listPublishedExperiences(property.city, "MOTORCYCLE_TOUR"),
    repo.listPublishedTransports(property.city),
    repo.listPublishedPackages(property.city, property.id),
  ]);
  const checkIn = /^\d{4}-\d{2}-\d{2}$/.test(one(sp.checkIn)) ? one(sp.checkIn) : "";
  const checkOut = /^\d{4}-\d{2}-\d{2}$/.test(one(sp.checkOut)) ? one(sp.checkOut) : "";
  const guests = Math.max(1, Number(one(sp.guests)) || 1);
  const experienceId = one(sp.experience);
  const transportId = one(sp.transport);
  const packageId = one(sp.package);
  const quote = checkIn && checkOut ? quoteStay(property, rules, availability, checkIn, checkOut) : null;
  const calendarDays = availability.map((day) => ({
    date: day.date,
    isBlocked: day.isBlocked,
    price: priceForDate(day.date, property, rules, availability),
  }));
  const galleryImages = property.images.map((src, i) => ({ src, alt: propertyImageAlt(property, i) }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: property.name,
    description: property.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: CITIES[property.city].ar,
      addressCountry: "EG",
    },
    telephone: SUPPORT_PHONE,
    priceRange: money(property.basePrice),
    ...(property.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: property.rating,
            reviewCount: property.reviewCount,
            bestRating: 5,
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-8 lg:pb-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {/* ===== Breadcrumb ===== */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-bold text-muted">
        <Link href="/" className="transition hover:text-gold">الرئيسية</Link>
        <span className="text-gold">/</span>
        <Link href={`/search?city=${property.city}`} className="transition hover:text-gold">{CITIES[property.city].ar}</Link>
        <span className="text-gold">/</span>
        <span className="text-navy">{property.name}</span>
      </div>

      {/* ===== Gallery ===== */}
      <PropertyGallery images={galleryImages} />

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* ===== Details ===== */}
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="chip">{PROPERTY_TYPES[property.type].ar}</span>
            <span className="chip">{CITIES[property.city].ar}</span>
            {property.reviewCount > 0 && <span className="chip chip-gold">★ {property.rating} ({property.reviewCount} تقييم)</span>}
            <FavoriteButton propertyId={property.id} name={property.name} inline showText />
          </div>
          <span className="eyebrow !text-gold">إقامة مميزة</span>
          <h1 className="mt-3 text-3xl font-black leading-tight text-navy md:text-4xl">{property.name}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm font-bold text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {property.address}
          </p>
          <div className="gold-rule my-6" />
          <p className="leading-9 text-foreground/85">{property.description}</p>

          {/* Unit facts */}
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="stat"><p className="text-xl font-extrabold text-navy">{toArabicDigits(property.maxGuests)}</p><p className="mt-1 text-xs font-bold text-muted">ضيوف</p></div>
            <div className="stat"><p className="text-xl font-extrabold text-navy">{toArabicDigits(property.bedrooms)}</p><p className="mt-1 text-xs font-bold text-muted">غرف نوم</p></div>
            <div className="stat"><p className="text-xl font-extrabold text-navy">{toArabicDigits(property.bathrooms)}</p><p className="mt-1 text-xs font-bold text-muted">حمامات</p></div>
            <div className="stat"><p className="text-xl font-extrabold text-navy">{property.areaSqm ? `${toArabicDigits(property.areaSqm)} م²` : "—"}</p><p className="mt-1 text-xs font-bold text-muted">المساحة</p></div>
            <div className="stat"><p className="text-xl font-extrabold text-navy">{money(property.basePrice)}</p><p className="mt-1 text-xs font-bold text-muted">من الليلة</p></div>
          </div>

          <div className="mt-10">
            <SectionHeading>التوافر والأسعار</SectionHeading>
            <AvailabilityCalendar days={calendarDays} initialCheckIn={checkIn} initialCheckOut={checkOut} />
          </div>

          <div className="mt-10">
            <SectionHeading>المرافق</SectionHeading>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((a) => (
                <span key={a} className="chip chip-gold">✦ {a}</span>
              ))}
              {property.amenities.length === 0 && <p className="text-sm text-muted">لا توجد مرافق مضافة.</p>}
            </div>
          </div>

          <div className="mt-10">
            <SectionHeading>قواعد الوحدة</SectionHeading>
            <p className="soft-card border-gold/30 text-sm leading-7">
              {property.houseRules ?? "لا توجد قواعد خاصة مضافة لهذه الوحدة. يُرجى احترام الهدوء والممتلكات أثناء الإقامة."}
            </p>
          </div>

          <div className="mt-10">
            <SectionHeading>سياسة الإلغاء</SectionHeading>
            <p className="soft-card border-gold/30 text-sm leading-7">{cancelPolicyText(property.cancelPolicy)}</p>
            <p className="muted mt-2 text-xs leading-6">راجع السياسة قبل تأكيد الحجز، وتواصل مع الدعم إذا احتجت مساعدة.</p>
          </div>

          <div className="mt-10">
            <SectionHeading>الموقع ونقطة الاستلام</SectionHeading>
            <div className="overflow-hidden rounded-2xl border border-line">
              <MapView
                lat={property.lat}
                lng={property.lng}
                pickupLat={property.pickupLat}
                pickupLng={property.pickupLng}
                label={`${property.name} — ${property.address}`}
                pickupLabel="نقطة الاستلام"
              />
            </div>
          </div>

          {property.videoUrl && (
            <div className="mt-10">
              <SectionHeading>فيديو الوحدة</SectionHeading>
              <a href={property.videoUrl} target="_blank" rel="noreferrer" className="btn-ghost text-sm">شاهد الفيديو ↗</a>
            </div>
          )}

          <ReviewsTab reviews={reviews} />

          <ExperienceAddOn
            experiences={safaris}
            propertySlug={property.slug}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
            transportId={transportId}
            packageId={packageId}
            category="MOUNTAIN_SAFARI"
          />

          <ExperienceAddOn
            experiences={motorcycleTours}
            propertySlug={property.slug}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
            transportId={transportId}
            packageId={packageId}
            category="MOTORCYCLE_TOUR"
          />

          <TransportAddOn
            transports={transports}
            propertySlug={property.slug}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
            experienceId={experienceId}
            packageId={packageId}
          />

          <PackageAddOn
            packages={packages}
            propertySlug={property.slug}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
            experienceId={experienceId}
            transportId={transportId}
          />
        </div>

        {/* ===== Booking card ===== */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="soft-card !rounded-2xl !p-6 !shadow-xl !shadow-navy/10">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold text-muted">السعر الأساسي</p>
                <p className="mt-1 text-3xl font-black text-navy">{money(property.basePrice)}</p>
              </div>
              <span className="text-sm font-bold text-muted">/ الليلة</span>
            </div>
            <div className="gold-rule mb-6" />

            <form action="/checkout" method="get" className="space-y-4">
              <input type="hidden" name="slug" value={property.slug} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="checkIn">الوصول</label>
                  <input id="checkIn" name="checkIn" type="date" className="input" defaultValue={checkIn} required />
                </div>
                <div>
                  <label className="label" htmlFor="checkOut">المغادرة</label>
                  <input id="checkOut" name="checkOut" type="date" className="input" defaultValue={checkOut} required />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="guests">عدد الضيوف</label>
                <input id="guests" name="guests" type="number" min={1} max={property.maxGuests} className="input" defaultValue={guests} />
              </div>
              <button className="btn-gold w-full !py-3">احجز الآن ←</button>
            </form>

            {quote && (
              <div className="mt-6 rounded-xl border border-line bg-ivory p-4 text-sm">
                {quote.ok ? (
                  <>
                    <p className="mb-3 font-extrabold text-navy">{quote.quote.nights} ليالي · {dateAr(checkIn)} – {dateAr(checkOut)}</p>
                    <PriceBreakdown quote={quote.quote} openNights />
                  </>
                ) : (
                  <p className="font-bold text-red-600">
                    {quote.reason === "unavailable" && "الوحدة محجوزة في هذه التواريخ."}
                    {quote.reason === "min_nights" && `أقل إقامة ${quote.minNights} ليالي.`}
                    {quote.reason === "invalid_dates" && "اختار تواريخ صحيحة."}
                  </p>
                )}
              </div>
            )}

            <div className="mt-5 border-t border-line pt-4 text-xs leading-7 text-muted">
              <p className="font-extrabold text-navy">تحويل بنكي أو كاش عند الوصول</p>
              <p>
                بالحجز توافق على <Link href="/terms/guest" className="font-bold text-navy underline decoration-gold underline-offset-2">شروط الضيوف</Link>. للمساعدة: {" "}
                <a href={SUPPORT_WHATSAPP} target="_blank" rel="noreferrer" className="font-bold text-navy hover:text-gold">واتساب</a> · {" "}
                <a href={SUPPORT_TELEGRAM} target="_blank" rel="noreferrer" className="font-bold text-navy hover:text-gold">تليجرام</a> · {" "}
                <a href={`tel:${SUPPORT_PHONE}`} dir="ltr" className="font-bold text-navy hover:text-gold">{SUPPORT_PHONE}</a>
              </p>
            </div>
            <p className="mt-1 text-xs leading-6 text-muted">
              عمولة المنصة {Math.round(COMMISSION_RATE * 100)}% تُقتطع من المالك بعد التأكيد.
            </p>
          </div>
        </aside>
      </div>

      <MobileBookingBar price={money(property.basePrice)} />
    </div>
  );
}
