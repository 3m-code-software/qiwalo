import Link from "next/link";
import { TRANSPORT_TYPES } from "@/lib/constants";
import { toArabicDigits } from "@/lib/format";
import type { TransportType } from "@/lib/types";
import { clearServiceFiltersHref, hasServiceFilter, type ServiceFilter } from "@/lib/service-filters";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  slug: string;
  searchParams: SearchParams;
  filter: ServiceFilter;
  guests: number;
  available: { experiences: number; transports: number; packages: number };
  visible: { experiences: number; transports: number; packages: number };
};

const one = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value) ?? "";

/** فلاتر الخدمات في صفحة الوحدة: GET عادي يحفظ التواريخ والضيوف والاختيارات الحالية. */
export default function ServiceFilters({
  slug,
  searchParams,
  filter,
  guests,
  available,
  visible,
}: Props) {
  const active = hasServiceFilter(filter);
  const clearHref = clearServiceFiltersHref(slug, searchParams);
  const totalVisible = visible.experiences + visible.transports + visible.packages;
  const totalAvailable = available.experiences + available.transports + available.packages;
  if (totalAvailable === 0) return null;
  const hidden = (key: string) => {
    const value = one(searchParams[key]);
    return value ? <input type="hidden" name={key} value={value} /> : null;
  };

  return (
    <section className="mt-10" data-testid="service-filters" aria-labelledby="service-filters-title">
      <div className="soft-card !p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="eyebrow !text-gold">تصفية الخدمات</span>
            <h2 id="service-filters-title" className="section-title mt-2">صفّي الإضافات على مزاجك</h2>
            <p className="muted mt-1 text-sm">
              السعر الأقصى للتجربة للفرد، وللنقل للرحلة، وللباقة للليلة. بنعرض بس الخدمات اللي تتسع {toArabicDigits(guests)} ضيوف.
            </p>
          </div>
          {active && (
            <Link href={clearHref} className="btn-ghost !px-3 !py-2 text-sm" data-testid="service-filter-clear">
              مسح فلاتر الخدمات ✕
            </Link>
          )}
        </div>

        <form action={`/stay/${slug}`} method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="service-filter-form">
          {hidden("checkIn")}
          {hidden("checkOut")}
          {hidden("guests")}
          {hidden("experience")}
          {hidden("transport")}
          {hidden("package")}

          <label className="min-w-0">
            <span className="label">أقصى سعر للتجربة (ج.م)</span>
            <input
              id="expMax"
              name="expMax"
              type="number"
              min={1}
              inputMode="numeric"
              className="input w-full min-w-0"
              placeholder="أي سعر"
              defaultValue={filter.expMax ?? ""}
            />
          </label>

          <label className="min-w-0">
            <span className="label">نوع النقل</span>
            <select id="transportType" name="transportType" className="input w-full min-w-0" defaultValue={filter.transportType ?? ""}>
              <option value="">كل الأنواع</option>
              {(Object.keys(TRANSPORT_TYPES) as TransportType[]).map((type) => (
                <option key={type} value={type}>{TRANSPORT_TYPES[type].ar}</option>
              ))}
            </select>
          </label>

          <label className="min-w-0">
            <span className="label">أقصى سعر للنقل (ج.م)</span>
            <input
              id="transportMax"
              name="transportMax"
              type="number"
              min={1}
              inputMode="numeric"
              className="input w-full min-w-0"
              placeholder="أي سعر"
              defaultValue={filter.transportMax ?? ""}
            />
          </label>

          <label className="min-w-0">
            <span className="label">أقصى سعر للباقة لليلة (ج.م)</span>
            <input
              id="packageMax"
              name="packageMax"
              type="number"
              min={1}
              inputMode="numeric"
              className="input w-full min-w-0"
              placeholder="أي سعر"
              defaultValue={filter.packageMax ?? ""}
            />
          </label>

          <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
            <button type="submit" className="btn-gold !px-4 !py-2 text-sm">تطبيق الفلاتر</button>
            {active && (
              <p className="muted text-xs leading-6" data-testid="service-filter-count">
                عرض {toArabicDigits(totalVisible)} من {toArabicDigits(totalAvailable)} خدمة متاحة.
              </p>
            )}
          </div>
        </form>

        {active && totalVisible === 0 && totalAvailable > 0 && (
          <p className="mt-4 rounded-xl border border-line bg-ivory p-3 text-sm font-bold text-navy" data-testid="service-empty">
            مفيش خدمات مطابقة للفلاتر دي. جرّب ترفع السعر أو تمسح الفلاتر.
          </p>
        )}
      </div>
    </section>
  );
}
