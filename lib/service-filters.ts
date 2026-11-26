import { TRANSPORT_TYPES } from "@/lib/constants";
import type { Experience, Package, Transport, TransportType } from "@/lib/types";

type SearchParams = Record<string, string | string[] | undefined>;
type Changes = Record<string, string | undefined>;

/** فلاتر الخدمات في صفحة الوحدة؛ تُقرأ من الرابط عشان تفضل قابلة للمشاركة والصفحة Server Component. */
export const SERVICE_FILTER_KEYS = ["expMax", "transportType", "transportMax", "packageMax"] as const;

export interface ServiceFilter {
  expMax?: number;
  transportType?: TransportType;
  transportMax?: number;
  packageMax?: number;
}

const one = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value) ?? "";

function positive(value: string): number | undefined {
  const number = Number(value);
  return value && Number.isFinite(number) && number > 0 ? Math.floor(number) : undefined;
}

export function parseServiceFilter(searchParams: SearchParams): ServiceFilter {
  const transportType = one(searchParams.transportType);
  return {
    expMax: positive(one(searchParams.expMax)),
    transportType: transportType in TRANSPORT_TYPES ? (transportType as TransportType) : undefined,
    transportMax: positive(one(searchParams.transportMax)),
    packageMax: positive(one(searchParams.packageMax)),
  };
}

export function hasServiceFilter(filter: ServiceFilter): boolean {
  return Boolean(filter.expMax || filter.transportType || filter.transportMax || filter.packageMax);
}

/** السعة بتاعت عدد ضيوف الحجز؛ الخدمة اللي مش هتسعهم مش معروضة أصلاً. */
export function filterExperiences(items: Experience[], filter: ServiceFilter, guests: number): Experience[] {
  return items.filter(
    (item) =>
      (filter.expMax == null || item.pricePerPerson <= filter.expMax) &&
      item.capacity >= guests,
  );
}

export function filterTransports(items: Transport[], filter: ServiceFilter, guests: number): Transport[] {
  return items.filter(
    (item) =>
      (filter.transportType == null || item.type === filter.transportType) &&
      (filter.transportMax == null || item.pricePerTrip <= filter.transportMax) &&
      item.capacity >= guests,
  );
}

export function filterPackages(items: Package[], filter: ServiceFilter, guests: number): Package[] {
  return items.filter(
    (item) =>
      (filter.packageMax == null || item.pricePerNight <= filter.packageMax) &&
      item.capacity >= guests,
  );
}

/** يبني رابط صفحة الوحدة مع تغيير/حذف مفاتيح الفلاتر بس، ويحتفظ بالتواريخ والضيوف والاختيارات. */
export function stayFilterHref(slug: string, searchParams: SearchParams, changes: Changes): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key in changes) continue;
    const text = one(value);
    if (text) params.set(key, text);
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `/stay/${slug}${query ? `?${query}` : ""}`;
}

export function clearServiceFiltersHref(slug: string, searchParams: SearchParams): string {
  const changes: Changes = {};
  for (const key of SERVICE_FILTER_KEYS) changes[key] = undefined;
  return stayFilterHref(slug, searchParams, changes);
}
