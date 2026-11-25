/** رابط الموقع المستخدم في الـ metadata والـ sitemap والـ robots. */
const FALLBACK_SITE_URL = "https://qiwalo-ygzh.vercel.app";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL).replace(/\/$/, "");

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
