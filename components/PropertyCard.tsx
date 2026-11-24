import Image from "next/image";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import { CITIES, PROPERTY_TYPES } from "@/lib/constants";
import { money, toArabicDigits } from "@/lib/format";
import type { Property, SearchFilter } from "@/lib/types";

export default function PropertyCard({ property, filter = {}, price }: {
  property: Property;
  filter?: SearchFilter;
  price?: number;
}) {
  const params = new URLSearchParams();
  if (filter.checkIn) params.set("checkIn", filter.checkIn);
  if (filter.checkOut) params.set("checkOut", filter.checkOut);
  if (filter.guests) params.set("guests", String(filter.guests));
  const suffix = params.toString() ? `?${params}` : "";

  return (
    <div className="relative h-full">
      <Link href={`/stay/${property.slug}${suffix}`} className="card group block h-full transition hover:-translate-y-1">
        <div className="relative aspect-[4/3] overflow-hidden bg-navy-soft">
          {property.images[0] && (
            <Image
              src={property.images[0]}
              alt={property.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-navy-deep/40 to-transparent" />
          <span className="absolute right-3 top-3 rounded-full border border-gold/50 bg-white/95 px-3 py-1 text-[0.72rem] font-bold text-navy shadow-sm backdrop-blur">
            {PROPERTY_TYPES[property.type].ar}
          </span>
        </div>

        <div className="p-5">
          <div className="mb-2 flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {CITIES[property.city].ar}
            </span>
            {property.reviewCount > 0 && (
              <span className="font-extrabold text-gold">★ {property.rating} <span className="font-medium text-muted">({property.reviewCount})</span></span>
            )}
          </div>
          <h3 className="mb-1 line-clamp-1 text-lg font-extrabold text-navy">{property.name}</h3>
          <p className="mb-2 line-clamp-1 text-xs text-muted">{property.address}</p>
          <p className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
            <span>🛁 {toArabicDigits(property.bathrooms)} حمام</span>
            <span className="h-1 w-1 rounded-full bg-gold" />
            <span>{property.areaSqm ? `${toArabicDigits(property.areaSqm)} م²` : "مساحة غير محددة"}</span>
          </p>
          <div className="flex items-end justify-between border-t border-line pt-3">
            <span className="text-xs font-bold text-muted">الليلة</span>
            <span className="text-lg font-extrabold text-navy">{money(price ?? property.basePrice)}</span>
          </div>
        </div>
      </Link>
      <FavoriteButton
        propertyId={property.id}
        name={property.name}
        className="absolute left-3 top-3 z-10"
      />
    </div>
  );
}
