"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/useFavorites";

export default function FavoritesNavLink({ compact = false }: { compact?: boolean }) {
  const count = useFavorites().length;

  return (
    <Link
      href="/favorites"
      aria-label={count > 0 ? `المفضلة، ${count} وحدة` : "المفضلة"}
      className={compact
        ? "flex shrink-0 items-center gap-1 text-xs font-bold text-white/70 transition hover:text-gold-bright"
        : "flex items-center gap-1.5 transition hover:text-gold-bright"}
    >
      <span aria-hidden="true" className={count > 0 ? "text-gold-bright" : ""}>{count > 0 ? "♥" : "♡"}</span>
      <span>المفضلة</span>
      {count > 0 && (
        <span className="rounded-full bg-gold px-1.5 text-[0.65rem] font-black leading-5 text-navy">
          {count}
        </span>
      )}
    </Link>
  );
}
