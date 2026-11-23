import type { CityKey, PropertyType } from "./types";

export const SITE_NAME = "Qiwalo";
export const SITE_NAME_AR = "قيوالو";
export const COMMISSION_RATE = 0.12;
export const DEFAULT_COMMISSION_RATE = 12;
export const GUEST_SERVICE_FEE_RATE = 0;

export const SUPPORT_PHONE = "01066094050";
export const SUPPORT_WHATSAPP = "https://wa.me/201066094050";
export const SUPPORT_TELEGRAM = "https://t.me/+201066094050";

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
  FREE_48H:
    "إلغاء مجاني قبل الوصول بـ 48 ساعة أو أكثر. بعد ذلك تُحتسب ليلة واحدة كغرامة إلغاء. عدم الحضور يُعامل كإلغاء في يوم الوصول.",
  FREE_7D:
    "إلغاء مجاني قبل الوصول بـ 7 أيام أو أكثر. من 3 إلى 6 أيام تُحتسب ليلة واحدة، وأقل من 3 أيام تُحتسب 3 ليالي. عدم الحضور يُعامل كإلغاء في يوم الوصول.",
  NON_REFUNDABLE:
    "هذا الحجز غير قابل للاسترداد أو التعديل بعد التأكيد. في حال الإلغاء أو عدم الحضور لا يُرد أي مبلغ.",
} as const;
