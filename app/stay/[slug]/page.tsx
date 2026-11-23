import type { Metadata } from "next";
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
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm muted">
        <Link href="/" className="hover:text-nile">الرئيسية</Link><span>/</span>
        <Link href={`/search?city=${property.city}`} className="hover:text-nile">{CITIES[property.city].ar}</Link><span>/</span>
        <span>{property.name}</span>
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl sm:col-span-2 sm:row-span-2">
          {property.images[0] && <Image src={property.images[0]} alt={property.name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" preload />}
        </div>
        {property.images.slice(1, 5).map((src, i) => (
          <div key={src + i} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-nile-soft">
            <Image src={src} alt={`${property.name} ${i + 2}`} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="chip">{PROPERTY_TYPES[property.type].ar}</span>
            <span className="chip">{CITIES[property.city].ar}</span>
            {property.reviewCount > 0 && <span className="chip">★ {property.rating} ({property.reviewCount} تقييم)</span>}
          </div>
          <h1 className="text-3xl font-black md:text-4xl">{property.name}</h1>
          <p className="muted mt-2">{property.address}</p>
          <p className="mt-5 leading-8">{property.description}</p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="soft-card !p-4 text-center"><p className="text-xl font-extrabold">{property.maxGuests}</p><p className="muted text-xs">ضيوف</p></div>
            <div className="soft-card !p-4 text-center"><p className="text-xl font-extrabold">{property.bedrooms}</p><p className="muted text-xs">غرف نوم</p></div>
            <div className="soft-card !p-4 text-center"><p className="text-xl font-extrabold">{money(property.basePrice)}</p><p className="muted text-xs">من الليلة</p></div>
          </div>

          <div className="mt-8">
            <h2 className="mb-3 text-xl font-extrabold">المرافق</h2>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((a) => <span key={a} className="chip">✓ {a}</span>)}
              {property.amenities.length === 0 && <p className="muted text-sm">لا توجد مرافق مضافة.</p>}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="mb-3 text-xl font-extrabold">سياسة الإلغاء</h2>
            <p className="soft-card text-sm">{CANCEL_POLICIES[property.cancelPolicy as keyof typeof CANCEL_POLICIES] ?? property.cancelPolicy}</p>
          </div>

          {property.videoUrl && (
            <div className="mt-8">
              <h2 className="mb-3 text-xl font-extrabold">فيديو الوحدة</h2>
              <a href={property.videoUrl} target="_blank" rel="noreferrer" className="btn-ghost text-sm">شاهد الفيديو ↗</a>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="soft-card">
            <p className="mb-1 text-sm muted">السعر الأساسي</p>
            <p className="text-3xl font-black text-nile">{money(property.basePrice)} <span className="text-base font-bold muted">/ الليلة</span></p>

            <form action="/checkout" method="get" className="mt-5 space-y-3">
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
              <button className="btn-primary w-full">احجز الآن</button>
            </form>

            {quote && (
              <div className="mt-5 border-t border-line pt-4 text-sm">
                {quote.ok ? (
                  <>
                    <p className="mb-2 font-bold">{quote.quote.nights} ليالي · {dateAr(checkIn)} – {dateAr(checkOut)}</p>
                    <div className="space-y-1 muted">
                      {quote.quote.nightly.map((n) => (
                        <div key={n.date} className="flex justify-between"><span>{dateAr(n.date)}{n.ruleName ? ` · ${n.ruleName}` : ""}</span><span>{money(n.price)}</span></div>
                      ))}
                      <div className="flex justify-between pt-2 font-bold text-foreground"><span>الإجمالي</span><span>{money(quote.quote.total)}</span></div>
                    </div>
                  </>
                ) : (
                  <p className="text-red-600">
                    {quote.reason === "unavailable" && "الوحدة محجوزة في هذه التواريخ."}
                    {quote.reason === "min_nights" && `أقل إقامة ${quote.minNights} ليالي.`}
                    {quote.reason === "invalid_dates" && "اختار تواريخ صحيحة."}
                  </p>
                )}
              </div>
            )}

            <p className="muted mt-4 text-xs">لا يتم تحويل أي مبلغ في هذه النسخة التجريبية — التأكيد فوري بعد إرسال بيانات التواصل.</p>
            <p className="muted mt-1 text-xs">عمولة المنصة {Math.round(COMMISSION_RATE * 100)}% تُقتطع من المالك بعد التأكيد.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
