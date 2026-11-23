import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import SearchForm from "@/components/SearchForm";
import { CITIES, PROPERTY_TYPES } from "@/lib/constants";
import { toArabicDigits } from "@/lib/format";
import { quoteStay } from "@/lib/pricing";
import { getRepo } from "@/lib/repo";
import type { CityKey, PropertyType, SearchFilter } from "@/lib/types";

export const instant = false;

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function parseFilter(sp: SP): SearchFilter {
  const city = one(sp.city);
  const type = one(sp.type);
  const num = (k: string) => { const v = Number(one(sp[k])); return Number.isFinite(v) && v > 0 ? v : undefined; };
  const sort = one(sp.sort);
  return {
    city: city in CITIES ? (city as CityKey) : undefined,
    type: type in PROPERTY_TYPES ? (type as PropertyType) : undefined,
    q: one(sp.q) || undefined,
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    guests: num("guests"),
    checkIn: /^\d{4}-\d{2}-\d{2}$/.test(one(sp.checkIn)) ? one(sp.checkIn) : undefined,
    checkOut: /^\d{4}-\d{2}-\d{2}$/.test(one(sp.checkOut)) ? one(sp.checkOut) : undefined,
    sort: ["recommended", "price_asc", "price_desc", "rating"].includes(sort) ? sort as SearchFilter["sort"] : "recommended",
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const filter = parseFilter(await searchParams);
  const repo = await getRepo();
  const properties = await repo.listProperties(filter);
  const pricing = new Map<string, number>();
  if (filter.checkIn && filter.checkOut) {
    await Promise.all(properties.map(async (p) => {
      const [rules, availability] = await Promise.all([repo.getPriceRules(p.id), repo.getAvailability(p.id)]);
      const q = quoteStay(p, rules, availability, filter.checkIn!, filter.checkOut!);
      if (q.ok) pricing.set(p.id, Math.round(q.quote.subtotal / q.quote.nights));
    }));
  }

  return (
    <>
      {/* ===== Search header ===== */}
      <section className="hero-lux relative overflow-hidden text-white">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full border border-gold/15" />
        <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full border border-white/10" />
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-12 md:pb-28 md:pt-16">
          <span className="eyebrow">قيوالو · الأقصر وأسوان</span>
          <h1 className="section-title mt-4 !text-white">ابحث عن إقامتك</h1>
          <p className="mt-2 text-sm text-white/70">وحدات موثّقة بأسعار واضحة وتأكيد فوري.</p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-16 max-w-7xl px-4 md:-mt-20">
        <SearchForm initial={filter} />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* ===== Filters ===== */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="ml-1 text-sm font-extrabold text-navy">تصفية:</span>
          {(Object.keys(CITIES) as CityKey[]).map((k) => (
            <Link key={k} href={`/search?city=${k}`} className={`chip transition hover:border-gold ${filter.city === k ? "!bg-navy !text-white ring-1 ring-gold" : ""}`}>
              {CITIES[k].ar}
            </Link>
          ))}
          <Link href="/search" className={`chip transition hover:border-gold ${!filter.city ? "!bg-navy !text-white" : ""}`}>كل المدن</Link>
          <span className="mx-1 h-5 w-px bg-line" />
          {(Object.keys(PROPERTY_TYPES) as PropertyType[]).map((k) => (
            <Link key={k} href={`/search?type=${k}`} className={`chip transition hover:border-gold ${filter.type === k ? "!bg-navy !text-white ring-1 ring-gold" : ""}`}>
              {PROPERTY_TYPES[k].ar}
            </Link>
          ))}
        </div>

        {/* ===== Results bar ===== */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
          <p className="text-sm font-bold text-muted">
            <span className="text-lg font-extrabold text-navy">{toArabicDigits(properties.length)}</span> نتيجة
          </p>
          <form action="/search" method="get" className="flex gap-2">
            {Object.entries(filter).map(([k, v]) =>
              v && typeof v !== "object" ? <input key={k} type="hidden" name={k} value={String(v)} /> : null,
            )}
            <select name="sort" className="input !w-auto !py-2 text-sm" defaultValue={filter.sort}>
              <option value="recommended">الأنسب</option>
              <option value="price_asc">السعر: الأقل أولاً</option>
              <option value="price_desc">السعر: الأعلى أولاً</option>
              <option value="rating">الأعلى تقييماً</option>
            </select>
            <button className="btn-ghost !py-2 text-sm">ترتيب</button>
          </form>
        </div>

        {/* ===== Results ===== */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} filter={filter} price={pricing.get(p.id)} />
          ))}
        </div>
        {properties.length === 0 && (
          <div className="soft-card mt-6 text-center">
            <p className="text-lg font-extrabold text-navy">مفيش نتائج مطابقة.</p>
            <p className="muted mt-1 text-sm">جرّب توسيع البحث أو شيل بعض الفلاتر.</p>
            <Link href="/search" className="btn-ghost mt-5 text-sm">مسح الفلاتر</Link>
          </div>
        )}
      </div>
    </>
  );
}
