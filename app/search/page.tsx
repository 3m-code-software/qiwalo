import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import ResultsMap from "@/components/ResultsMap";
import SearchForm from "@/components/SearchForm";
import { AMENITIES, CITIES, PROPERTY_TYPES } from "@/lib/constants";
import { money, toArabicDigits } from "@/lib/format";
import { quoteStay } from "@/lib/pricing";
import { getRepo } from "@/lib/repo";
import type { CityKey, PropertyType, SearchFilter } from "@/lib/types";

export const instant = false;

type SP = Record<string, string | string[] | undefined>;
type Changes = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function values(v: string | string[] | undefined): string[] {
  return (Array.isArray(v) ? v : v === undefined ? [] : [v])
    .map((s) => String(s).trim())
    .filter(Boolean);
}

/** Amenities may arrive repeated (?amenities=a&amenities=b) or comma-separated (?amenities=a,b). */
function amenitiesFrom(v: string | string[] | undefined): string[] {
  return [...new Set(values(v).flatMap((s) => s.split(",")).map((s) => s.trim()).filter(Boolean))];
}

function parseFilter(sp: SP): SearchFilter {
  const city = one(sp.city);
  const type = one(sp.type);
  const num = (k: string) => {
    const v = Number(one(sp[k]));
    return Number.isFinite(v) && v > 0 ? v : undefined;
  };
  const rating = Number(one(sp.minRating));
  const sort = one(sp.sort);
  return {
    city: city in CITIES ? (city as CityKey) : undefined,
    type: type in PROPERTY_TYPES ? (type as PropertyType) : undefined,
    q: one(sp.q) || undefined,
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    minRating: Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : undefined,
    guests: num("guests"),
    checkIn: /^\d{4}-\d{2}-\d{2}$/.test(one(sp.checkIn)) ? one(sp.checkIn) : undefined,
    checkOut: /^\d{4}-\d{2}-\d{2}$/.test(one(sp.checkOut)) ? one(sp.checkOut) : undefined,
    amenities: amenitiesFrom(sp.amenities).filter((a) => (AMENITIES as readonly string[]).includes(a)),
    sort: ["recommended", "price_asc", "price_desc", "rating"].includes(sort) ? sort as SearchFilter["sort"] : "recommended",
  };
}

/** Build a search URL from the live query, replacing (or removing) only the given keys. */
function chipHref(sp: SP, changes: Changes = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key in changes) continue;
    for (const v of key === "amenities" ? amenitiesFrom(value) : values(value)) params.append(key, v);
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) continue;
    for (const v of values(value)) params.append(key, v);
  }
  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const filter = parseFilter(sp);
  const repo = await getRepo();
  const priced = Boolean(filter.checkIn && filter.checkOut);

  // With dates, the card shows the quoted nightly price, so price filters must
  // use that value instead of the property's base price.
  let properties = await repo.listProperties(priced
    ? { ...filter, minPrice: undefined, maxPrice: undefined }
    : filter);
  const pricing = new Map<string, number>();
  if (priced) {
    await Promise.all(properties.map(async (p) => {
      const [rules, availability] = await Promise.all([repo.getPriceRules(p.id), repo.getAvailability(p.id)]);
      const q = quoteStay(p, rules, availability, filter.checkIn!, filter.checkOut!);
      if (q.ok) pricing.set(p.id, Math.round(q.quote.subtotal / q.quote.nights));
    }));
    properties = properties
      .filter((p) => {
        const price = pricing.get(p.id);
        if (price === undefined) return false;
        return (filter.minPrice == null || price >= filter.minPrice)
          && (filter.maxPrice == null || price <= filter.maxPrice);
      })
      .sort((a, b) => {
        if (filter.sort === "price_asc") return pricing.get(a.id)! - pricing.get(b.id)!;
        if (filter.sort === "price_desc") return pricing.get(b.id)! - pricing.get(a.id)!;
        return 0;
      });
  }

  const activeAmenities = filter.amenities ?? [];
  const toggleAmenity = (amenity: string): string[] =>
    activeAmenities.includes(amenity)
      ? activeAmenities.filter((a) => a !== amenity)
      : [...activeAmenities, amenity];

  const hasFilters = Boolean(
    filter.city || filter.type || filter.q || filter.minPrice || filter.maxPrice ||
    filter.minRating || filter.guests || filter.checkIn || filter.checkOut ||
    activeAmenities.length || filter.sort !== "recommended",
  );

  const stayParams = new URLSearchParams();
  if (filter.checkIn) stayParams.set("checkIn", filter.checkIn);
  if (filter.checkOut) stayParams.set("checkOut", filter.checkOut);
  if (filter.guests) stayParams.set("guests", String(filter.guests));
  const staySuffix = stayParams.toString() ? `?${stayParams}` : "";
  const mapUnits = properties.map((p) => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    label: money(pricing.get(p.id) ?? p.basePrice),
    href: `/stay/${p.slug}${staySuffix}`,
  }));

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
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="ml-1 text-sm font-extrabold text-navy">المدينة:</span>
            {(Object.keys(CITIES) as CityKey[]).map((k) => (
              <Link key={k} href={chipHref(sp, { city: k })} className={`chip transition hover:border-gold ${filter.city === k ? "!bg-navy !text-white ring-1 ring-gold" : ""}`}>
                {CITIES[k].ar}
              </Link>
            ))}
            <Link href={chipHref(sp, { city: undefined })} className={`chip transition hover:border-gold ${!filter.city ? "!bg-navy !text-white" : ""}`}>كل المدن</Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="ml-1 text-sm font-extrabold text-navy">النوع:</span>
            {(Object.keys(PROPERTY_TYPES) as PropertyType[]).map((k) => (
              <Link key={k} href={chipHref(sp, { type: k })} className={`chip transition hover:border-gold ${filter.type === k ? "!bg-navy !text-white ring-1 ring-gold" : ""}`}>
                {PROPERTY_TYPES[k].ar}
              </Link>
            ))}
            <Link href={chipHref(sp, { type: undefined })} className={`chip transition hover:border-gold ${!filter.type ? "!bg-navy !text-white" : ""}`}>كل الأنواع</Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="ml-1 text-sm font-extrabold text-navy">التقييم:</span>
            {[undefined, 3, 4, 5].map((r) => (
              <Link
                key={r ?? "all"}
                href={chipHref(sp, { minRating: r === undefined ? undefined : String(r) })}
                className={`chip transition hover:border-gold ${filter.minRating === r ? "!bg-navy !text-white ring-1 ring-gold" : ""}`}
              >
                {r === undefined ? "كل التقييمات" : `★ ${toArabicDigits(r)} فأكثر`}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="ml-1 text-sm font-extrabold text-navy">المرافق:</span>
            {AMENITIES.map((amenity) => {
              const active = activeAmenities.includes(amenity);
              return (
                <Link
                  key={amenity}
                  href={chipHref(sp, { amenities: toggleAmenity(amenity) })}
                  className={`chip transition hover:border-gold ${active ? "chip-gold ring-1 ring-gold" : ""}`}
                  aria-pressed={active}
                >
                  {active ? "✓ " : "+ "}{amenity}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ===== Results bar ===== */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
          <p className="text-sm font-bold text-muted">
            <span className="text-lg font-extrabold text-navy">{toArabicDigits(properties.length)}</span> نتيجة
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {hasFilters && (
              <Link href="/search" className="text-xs font-bold text-muted underline decoration-gold underline-offset-4 transition hover:text-navy">
                مسح الفلاتر
              </Link>
            )}
            <form action="/search" method="get" className="flex gap-2">
              {/* Keep every current filter when changing the sort order. */}
              {Object.entries(sp).flatMap(([key, value]) =>
                key === "sort"
                  ? []
                  : (key === "amenities" ? amenitiesFrom(value) : values(value)).map((v, i) => (
                      <input key={`${key}-${i}`} type="hidden" name={key} value={v} />
                    )),
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
        </div>

        {/* ===== Mini map of visible results ===== */}
        <ResultsMap unitsJson={JSON.stringify(mapUnits)} />

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
