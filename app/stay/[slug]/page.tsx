import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CANCEL_POLICIES, CITIES, COMMISSION_RATE, PROPERTY_TYPES } from "@/lib/constants";
import { dateAr, money } from "@/lib/format";
import { quoteStay } from "@/lib/pricing";
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
  if (!property) return { title: "وحدة غير موجودة" };
  return { title: property.name, description: property.description.slice(0, 155) };
}

export default async function StayPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const repo = await getRepo();
  const property = await repo.getPropertyBySlug(slug);
  if (!property || property.status !== "PUBLISHED") notFound();

  const [rules, availability] = await Promise.all([repo.getPriceRules(property.id), repo.getAvailability(property.id)]);
  const checkIn = /^\d{4}-\d{2}-\d{2}$/.test(one(sp.checkIn)) ? one(sp.checkIn) : "";
  const checkOut = /^\d{4}-\d{2}-\d{2}$/.test(one(sp.checkOut)) ? one(sp.checkOut) : "";
  const guests = Math.max(1, Number(one(sp.guests)) || 1);
  const quote = checkIn && checkOut ? quoteStay(property, rules, availability, checkIn, checkOut) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* ===== Breadcrumb ===== */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-bold text-muted">
        <Link href="/" className="transition hover:text-gold">الرئيسية</Link>
        <span className="text-gold">/</span>
        <Link href={`/search?city=${property.city}`} className="transition hover:text-gold">{CITIES[property.city].ar}</Link>
        <span className="text-gold">/</span>
        <span className="text-navy">{property.name}</span>
      </div>

      {/* ===== Gallery ===== */}
      <div className="mb-8 grid gap-3 sm:grid-cols-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl sm:col-span-2 sm:row-span-2">
          {property.images[0] && (
            <Image src={property.images[0]} alt={property.name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" preload />
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy-deep/45 to-transparent" />
        </div>
        {property.images.slice(1, 5).map((src, i) => (
          <div key={src + i} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-navy-soft">
            <Image src={src} alt={`${property.name} ${i + 2}`} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
          </div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* ===== Details ===== */}
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="chip">{PROPERTY_TYPES[property.type].ar}</span>
            <span className="chip">{CITIES[property.city].ar}</span>
            {property.reviewCount > 0 && <span className="chip chip-gold">★ {property.rating} ({property.reviewCount} تقييم)</span>}
          </div>
          <span className="eyebrow !text-gold">إقامة مميزة</span>
          <h1 className="mt-3 text-3xl font-black leading-tight text-navy md:text-4xl">{property.name}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm font-bold text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {property.address}
          </p>
          <div className="gold-rule my-6" />
          <p className="leading-9 text-foreground/85">{property.description}</p>

          <div className="mt-7 grid grid-cols-3 gap-3">
            <div className="stat"><p className="text-xl font-extrabold text-navy">{property.maxGuests}</p><p className="mt-1 text-xs font-bold text-muted">ضيوف</p></div>
            <div className="stat"><p className="text-xl font-extrabold text-navy">{property.bedrooms}</p><p className="mt-1 text-xs font-bold text-muted">غرف نوم</p></div>
            <div className="stat"><p className="text-xl font-extrabold text-navy">{money(property.basePrice)}</p><p className="mt-1 text-xs font-bold text-muted">من الليلة</p></div>
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
            <SectionHeading>سياسة الإلغاء</SectionHeading>
            <p className="soft-card border-gold/30 text-sm leading-7">
              {CANCEL_POLICIES[property.cancelPolicy as keyof typeof CANCEL_POLICIES] ?? property.cancelPolicy}
            </p>
          </div>

          {property.videoUrl && (
            <div className="mt-10">
              <SectionHeading>فيديو الوحدة</SectionHeading>
              <a href={property.videoUrl} target="_blank" rel="noreferrer" className="btn-ghost text-sm">شاهد الفيديو ↗</a>
            </div>
          )}
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
                    <div className="space-y-2 text-muted">
                      {quote.quote.nightly.map((n) => (
                        <div key={n.date} className="flex justify-between gap-3">
                          <span>{dateAr(n.date)}{n.ruleName ? ` · ${n.ruleName}` : ""}</span>
                          <span className="font-bold">{money(n.price)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between gap-3 border-t border-line pt-3 font-extrabold text-navy">
                        <span>الإجمالي</span>
                        <span>{money(quote.quote.total)}</span>
                      </div>
                    </div>
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

            <p className="mt-5 text-xs leading-6 text-muted">
              لا يتم تحويل أي مبلغ في هذه النسخة التجريبية — التأكيد فوري بعد إرسال بيانات التواصل.
            </p>
            <p className="mt-1 text-xs leading-6 text-muted">
              عمولة المنصة {Math.round(COMMISSION_RATE * 100)}% تُقتطع من المالك بعد التأكيد.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
