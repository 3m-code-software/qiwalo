export const FAVORITES_KEY = "qiwalo:favorites";
export const FAVORITES_EVENT = "qiwalo:favorites-changed";
export const EMPTY_FAVORITES_SNAPSHOT = "[]";

export function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id): id is string => typeof id === "string" && id.length > 0))];
  } catch {
    return [];
  }
}

export function writeFavorites(ids: string[]): boolean {
  if (typeof window === "undefined") return false;
  const clean = [...new Set(ids)];
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent<string[]>(FAVORITES_EVENT, { detail: clean }));
    return true;
  } catch {
    return false;
  }
}

export function toggleFavorite(id: string): boolean {
  const current = readFavorites();
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  writeFavorites(next);
  return next.includes(id);
}

export function subscribeFavorites(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(FAVORITES_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(FAVORITES_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getFavoritesSnapshot(): string {
  return JSON.stringify(readFavorites());
}

export function getServerFavoritesSnapshot(): string {
  return EMPTY_FAVORITES_SNAPSHOT;
}

export function parseFavoritesSnapshot(snapshot: string): string[] {
  try {
    const parsed: unknown = JSON.parse(snapshot);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id): id is string => typeof id === "string" && id.length > 0))];
  } catch {
    return [];
  }
}
