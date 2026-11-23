import type { CityKey, PropertyType } from "./types";

export const SITE_NAME = "Qiwalo";
export const SITE_NAME_AR = "قيوالو";
export const COMMISSION_RATE = 0.12;
export const GUEST_SERVICE_FEE_RATE = 0;

export const CITIES: Record<CityKey, { ar: string; en: string; hint: string }> = {
  LUXOR: { ar: "الأقصر", en: "Luxor", hint: "وادي الملوك، الكرنك، نيل الأقصر" },
  ASWAN: { ar: "أسوان", en: "Aswan", hint: "جزيرة الفنتين، خزان أسوان، النوبة" },
};

export const PROPERTY_TYPES: Record<PropertyType, { ar: string; en: string }> = {
  APARTMENT: { ar: "شقة", en: "Apartment" },
  CHALET: { ar: "شاليه", en: "Chalet" },
  VILLA: { ar: "فيلا", en: "Villa" },
  HOTEL: { ar: "فندق", en: "Hotel" },
  GUEST_HOUSE: { ar: "بيت ضيافة", en: "Guest house" },
  NILE_CRUISE: { ar: "مركب نيلي", en: "Nile cruise" },
};

export const AMENITIES = [
  "واي فاي",
  "مكيف",
  "مسبح",
  "مطبخ",
  "موقف سيارة",
  "إطلالة على النيل",
  "تراس",
  "إفطار",
  "جولات سياحية",
  "استقبال 24 ساعة",
] as const;

export const CANCEL_POLICIES = {
  FREE_48H: "إلغاء مجاني قبل 48 ساعة",
  FREE_7D: "إلغاء مجاني قبل 7 أيام",
  NON_REFUNDABLE: "غير قابل للاسترداد",
} as const;
