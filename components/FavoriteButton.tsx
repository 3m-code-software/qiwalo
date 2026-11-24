"use client";

import type { MouseEvent } from "react";
import { toggleFavorite } from "@/lib/favorites";
import { useFavorites } from "@/lib/useFavorites";

export default function FavoriteButton({
  propertyId,
  name,
  className = "",
  inline = false,
  showText = false,
}: {
  propertyId: string;
  name: string;
  className?: string;
  inline?: boolean;
  showText?: boolean;
}) {
  const saved = useFavorites().includes(propertyId);

  const label = saved ? `إزالة ${name} من المفضلة` : `إضافة ${name} إلى المفضلة`;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(propertyId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={[
        "favorite-button",
        saved ? "favorite-button--saved" : "",
        inline ? "favorite-button--inline" : "",
        className,
      ].filter(Boolean).join(" ")}
    >
      <span aria-hidden="true">{saved ? "♥" : "♡"}</span>
      {showText && <span className="text-xs font-bold">{saved ? "في المفضلة" : "مفضلة"}</span>}
    </button>
  );
}
