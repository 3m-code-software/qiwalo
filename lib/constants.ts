import type { CityKey, DriverSubscriptionStatus, ExperienceCategory, ExperienceDifficulty, PropertyType, TransportType } from "./types";

export const SITE_NAME = "Qiwalo";
export const SITE_NAME_AR = "قيوالو";
export const COMMISSION_RATE = 0.12;
export const DEFAULT_COMMISSION_RATE = 12;
export const GUEST_SERVICE_FEE_RATE = 0;

// تاريخ النسخة القانونية المعتمدة — يُغيَّر من مكان واحد عند أي تحديث لاحق.
export const LEGAL_VERSION_DATE = "2026-11-25";
export const LEGAL_VERSION_DATE_AR = "٢٥ نوفمبر ٢٠٢٦";

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

export const EXPERIENCE_CATEGORIES: Record<ExperienceCategory, { ar: string; en: string }> = {
  MOUNTAIN_SAFARI: { ar: "سفاري جبال", en: "Mountain safari" },
  MOTORCYCLE_TOUR: { ar: "جولات موتوسيكلات", en: "Motorcycle tour" },
};

/** حقل `mountain` بيُستخدم كمسار/منطقة في جولات الموتوسيكلات. */
export const EXPERIENCE_PLACE_LABELS: Record<ExperienceCategory, string> = {
  MOUNTAIN_SAFARI: "الجبل / المنطقة",
  MOTORCYCLE_TOUR: "المسار / المنطقة",
};

export const EXPERIENCE_DIFFICULTIES: Record<ExperienceDifficulty, { ar: string }> = {
  EASY: { ar: "سهل" },
  MODERATE: { ar: "متوسط" },
  HARD: { ar: "صعب" },
};

export const EXPERIENCE_CANCEL_POLICY =
  "إلغاء مجاني قبل موعد الرحلة بـ 24 ساعة أو أكثر. بعدها تُحتسب رسوم المورد، وفي حال اعتذار المورد يُعاد المبلغ كاملاً ويُبلَّغ الضيف فوراً.";

export const TRANSPORT_TYPES: Record<TransportType, { ar: string; en: string }> = {
  CAR: { ar: "سيارة خاصة", en: "Private car" },
  COASTER: { ar: "كوستر", en: "Coaster" },
  BUS: { ar: "باص", en: "Bus" },
  MOTORCYCLE: { ar: "موتوسيكل", en: "Motorcycle" },
};

export const TRANSPORT_CANCEL_POLICY =
  "إلغاء مجاني قبل موعد الرحلة بـ 24 ساعة أو أكثر. بعدها تُحتسب رسوم المورد، وفي حال اعتذار المورد يُعاد المبلغ كاملاً ويُبلَّغ الضيف فوراً.";

export const PACKAGE_CANCEL_POLICY =
  "إلغاء الباقة مجاني قبل الوصول بـ 48 ساعة أو أكثر. بعدها تُحتسب رسوم الوحدة والنقل والتجربة حسب سياسة كل مورّد، ويُبلَّغ الضيف فوراً.";

export const DRIVER_SUBSCRIPTION_LABELS: Record<DriverSubscriptionStatus, { ar: string }> = {
  NONE: { ar: "غير مشترك" },
  PENDING: { ar: "قيد التفعيل" },
  ACTIVE: { ar: "نشط" },
  EXPIRED: { ar: "منتهي" },
};

export const DRIVER_SUBSCRIPTION_NOTICE =
  "حالة الاشتراك إدارية على Mock فقط، ومفيش تحصيل أو checkout مدفوع للسائقين في هذه النسخة.";

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
