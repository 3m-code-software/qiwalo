"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  getFavoritesSnapshot,
  getServerFavoritesSnapshot,
  parseFavoritesSnapshot,
  subscribeFavorites,
} from "@/lib/favorites";

export function useFavorites(): string[] {
  const snapshot = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    getServerFavoritesSnapshot,
  );
  return useMemo(() => parseFavoritesSnapshot(snapshot), [snapshot]);
}
