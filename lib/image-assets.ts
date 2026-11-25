import { CITIES } from "@/lib/constants";
import { toArabicDigits } from "@/lib/format";
import type { Property } from "@/lib/types";

const CLOUDINARY_HOST = "res.cloudinary.com";
const UPLOAD_MARKER = "/image/upload/";

/**
 * وصف عربي تلقائي لكل صورة وحدة، بدون أي حقل إضافي في قاعدة البيانات.
 * الترقيم يبدأ من ١ للغلاف و٢ لما بعده.
 */
export function propertyImageAlt(property: Pick<Property, "name" | "city">, index = 0): string {
  const city = CITIES[property.city]?.ar;
  const place = city ? ` في ${city}` : "";
  if (index <= 0) return `صورة لوحدة «${property.name}»${place}`;
  return `صورة رقم ${toArabicDigits(index + 1)} لوحدة «${property.name}»${place}`;
}

/** وصف مختصر لصور الشريط التي لا تتبع وحدة بعينها (محرر ترتيب الصور). */
export function imageOrderAlt(index: number): string {
  return `صورة رقم ${toArabicDigits(index + 1)} للوحدة`;
}

/**
 * يطلب من Cloudinary أفضل صيغة مدعومة (WebP/AVIF) بأقل جودة مقبولة،
 * ويمرّر روابط المواقع الأخرى كما هي. الدالة idempotent: لا تضيف تحويلين.
 */
/** صورة مشاركة بقياس ١٢٠٠×٦٣٠؛ ترجع شارة قيوالو المحلية لو مفيش مصدر صالح. */
export function socialImageUrl(src: string | undefined): string {
  const fallback = "/og-default.svg";
  if (!src || !src.startsWith("https://")) return fallback;

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return fallback;
  }

  if (url.hostname === CLOUDINARY_HOST) {
    const at = url.pathname.indexOf(UPLOAD_MARKER);
    if (at === -1) return fallback;
    const prefix = url.pathname.slice(0, at + UPLOAD_MARKER.length);
    const tail = url.pathname.slice(at + UPLOAD_MARKER.length);
    if (!tail.includes("f_auto") && !tail.includes("c_fill")) {
      url.pathname = `${prefix}f_auto,q_auto,c_fill,g_auto,w_1200,h_630/${tail}`;
    }
    return url.toString();
  }

  if (url.hostname === "images.unsplash.com") {
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", "1200");
    url.searchParams.set("h", "630");
    url.searchParams.set("q", "80");
    return url.toString();
  }

  return fallback;
}

export function cloudinaryDeliveryUrl(src: string, width?: number): string {
  if (!src.startsWith("https://")) return src;

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }
  if (url.hostname !== CLOUDINARY_HOST) return src;

  const at = url.pathname.indexOf(UPLOAD_MARKER);
  if (at === -1) return src;

  const prefix = url.pathname.slice(0, at + UPLOAD_MARKER.length);
  const tail = url.pathname.slice(at + UPLOAD_MARKER.length);
  if (tail.includes("f_auto") || tail.includes("q_auto")) return src;

  const transformation = width && Number.isFinite(width) && width > 0
    ? `f_auto,q_auto,w_${Math.round(width)}`
    : "f_auto,q_auto";
  url.pathname = `${prefix}${transformation}/${tail}`;
  return url.toString();
}
