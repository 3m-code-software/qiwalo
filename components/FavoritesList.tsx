"use client";

import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import { useFavorites } from "@/lib/useFavorites";
import type { Property } from "@/lib/types";

export default function FavoritesList({ properties }: { properties: Property[] }) {
  const ids = useFavorites();
  const favorites = properties.filter((property) => ids.includes(property.id));

  if (favorites.length === 0) {
    return (
      <div className="soft-card py-14 text-center">
        <div className="text-4xl text-gold" aria-hidden="true">♡</div>
        <h2 className="mt-3 text-lg font-extrabold text-navy">مفيش وحدات محفوظة دلوقتي</h2>
        <p className="muted mx-auto mt-2 max-w-md text-sm leading-7">
          اضغط على القلب في أي وحدة لتحفظها هنا على هذا الجهاز. المفضلة بتاعتك مش محتاجة تسجيل دخول.
        </p>
        <Link href="/search" className="btn-primary mt-5 inline-flex text-sm">تصفح الوحدات ←</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {favorites.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
