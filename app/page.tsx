import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import JourneyStory from "@/components/JourneyStory";
import PropertyCard from "@/components/PropertyCard";
import SearchForm from "@/components/SearchForm";
import { CITIES } from "@/lib/constants";
import { toArabicDigits } from "@/lib/format";
import { getRepo } from "@/lib/repo";
import type { CityKey } from "@/lib/types";

export const instant = false;

const DESTINATION_IMAGES: Record<CityKey, string> = {
  LUXOR: "https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?auto=format&fit=crop&w=1200&q=80",
  ASWAN: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
};

export default async function HomePage() {
  await connection();
  const repo = await getRepo();
  const properties = await repo.listProperties();
  const featured = properties.slice(0, 6);

  return (
    <>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-navy-deep text-white">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2000&q=85"
            alt="إطلالة على النيل"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="hero-overlay absolute inset-0" />
        <div className="absolute -right-32 -top-24 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full border border-gold/20" />

        <div className="relative mx-auto max-w-7xl px-4 pb-32 pt-20 md:pb-40 md:pt-28">
          <span className="eyebrow">الأقصر · أسوان · النيل</span>
          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.18] md:text-6xl">
            إقامات استثنائية<br className="hidden md:block" /> على ضفاف <span className="text-gold-bright">النيل</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/75 md:text-lg">
            شقق، شاليهات، فنادق صغيرة ومراكب نيلية بأسعار شفافة وتأكيد فوري — من ملاك معروفين في الأقصر وأسوان.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-white/80">
            <span className="flex items-center gap-2"><span className="text-gold-bright">✦</span> أسعار بالجنيه المصري</span>
            <span className="flex items-center gap-2"><span className="text-gold-bright">✦</span> صور حقيقية</span>
            <span className="flex items-center gap-2"><span className="text-gold-bright">✦</span> دعم عربي</span>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-20 max-w-7xl px-4 md:-mt-24">
        <SearchForm />
      </div>

      {/* ===== Journey story ===== */}
      <JourneyStory />

      {/* ===== Destinations ===== */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <div className="mb-8">
          <span className="eyebrow !text-gold">اكتشف مصر</span>
          <h2 className="section-title mt-3">وجهاتنا</h2>
          <p className="section-sub">اختر مدينتك وابدأ رحلتك.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {(Object.keys(CITIES) as CityKey[]).map((key) => (
            <Link key={key} href={`/search?city=${key}`} className="card group relative min-h-64 overflow-hidden sm:min-h-80">
              <Image
                src={DESTINATION_IMAGES[key]}
                alt={`صورة لمدينة ${CITIES[key].ar}`}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                loading="lazy"
                decoding="async"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/90 via-navy-deep/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
                <div className="gold-rule mb-4" />
                <h3 className="text-3xl font-extrabold">{CITIES[key].ar}</h3>
                <p className="mt-1 text-sm text-white/75">{CITIES[key].hint}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== Featured stays ===== */}
      <section className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow !text-gold">مختارة بعناية</span>
            <h2 className="section-title mt-3">إقامات مختارة</h2>
            <p className="section-sub">{toArabicDigits(properties.length)} وحدة متاحة حالياً.</p>
          </div>
          <Link href="/search" className="btn-ghost text-sm">عرض كل الوحدات ←</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => <PropertyCard key={p.id} property={p} eager={i === 0} />)}
        </div>
        {featured.length === 0 && (
          <div className="soft-card text-center muted">لا توجد وحدات منشورة بعد.</div>
        )}
      </section>

      {/* ===== Owner CTA ===== */}
      <section className="mx-auto mt-16 max-w-7xl px-4">
        <div className="hero-lux relative overflow-hidden rounded-3xl border border-gold/25 p-8 text-white shadow-2xl shadow-navy/20 md:p-12">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full border border-gold/15" />
          <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full border border-white/10" />
          <div className="relative grid gap-8 md:grid-cols-3 md:items-center">
            <div className="md:col-span-1">
              <span className="eyebrow">لأصحاب الوحدات</span>
              <h2 className="mt-4 text-2xl font-extrabold leading-snug md:text-3xl">عندك وحدة في الأقصر أو أسوان؟</h2>
              <p className="mt-3 text-sm leading-7 text-white/70">
                أضفها في دقائق، وإحنا نتولى العرض والحجوزات مقابل 12% على الحجز المؤكد بس.
              </p>
              <Link href="/owner/units/new" className="btn-gold mt-6">أضف وحدتك ←</Link>
            </div>
            <div className="rounded-2xl border border-gold/25 bg-white/5 p-6 text-center backdrop-blur">
              <p className="text-4xl font-black text-gold-bright">12%</p>
              <p className="mt-2 text-sm text-white/70">عمولة على الحجز المؤكد فقط</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-center backdrop-blur">
              <p className="text-4xl font-black text-white">0 ج.م</p>
              <p className="mt-2 text-sm text-white/70">رسوم اشتراك أو عرض</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
