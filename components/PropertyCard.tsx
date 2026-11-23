import Image from "next/image";
import Link from "next/link";
import { CITIES, PROPERTY_TYPES } from "@/lib/constants";
import { money } from "@/lib/format";
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
    <Link href={`/stay/${property.slug}${suffix}`} className="card group block h-full transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-nile-soft">
        {property.images[0] && (
          <Image src={property.images[0]} alt={property.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
        )}
        <span className="absolute right-3 top-3 chip !bg-white/95">{PROPERTY_TYPES[property.type].ar}</span>
      </div>
      <div className="p-4">
        <div className="mb-1 flex items-center justify-between gap-2 text-xs muted">
          <span>{CITIES[property.city].ar}</span>
          {property.reviewCount > 0 && <span className="font-bold text-gold">★ {property.rating} ({property.reviewCount})</span>}
        </div>
        <h3 className="mb-1 line-clamp-1 font-extrabold">{property.name}</h3>
        <p className="mb-3 line-clamp-1 text-xs muted">{property.address}</p>
        <div className="flex items-end justify-between border-t border-line pt-3">
          <span className="text-xs muted">الليلة</span>
          <span className="font-extrabold text-nile">{money(price ?? property.basePrice)}</span>
        </div>
      </div>
    </Link>
  );
}
