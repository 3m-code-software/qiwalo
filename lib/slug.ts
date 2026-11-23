const ARABIC_LATIN: Record<string, string> = {
  ا: "a",
  أ: "a",
  إ: "i",
  آ: "aa",
  ب: "b",
  ت: "t",
  ث: "th",
  ج: "j",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "dh",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "d",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "q",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  و: "w",
  ي: "y",
  ى: "a",
  ة: "a",
  ء: "",
  ئ: "i",
  ؤ: "u",
  لا: "la",
};

/**
 * روابط الوحدات تفضل ASCII دايمًا:
 * - المتصفحات وNext.js بيتعاملوا مع slugs العربية بشكل غير متوقع في بعض الحالات.
 * - الروابط اللاتينية أسهل في المشاركة والـ SEO.
 */
export function slugifyName(name: string): string {
  const transliterated = Array.from(name.normalize("NFKC"))
    .map((char) => ARABIC_LATIN[char] ?? char)
    .join("")
    .toLowerCase();

  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export function makePropertySlug(name: string): string {
  const base = slugifyName(name) || "unit";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

/** لو الرابط وصل مُرمّز (%D8%...) نحاول نفكّه قبل المقارنة. */
export function slugCandidates(slug: string): string[] {
  const candidates = new Set<string>([slug, slug.normalize("NFC")]);
  try {
    const decoded = decodeURIComponent(slug);
    candidates.add(decoded);
    candidates.add(decoded.normalize("NFC"));
  } catch {
    // مش رابط مُرمّز — نتجاهل
  }
  return [...candidates];
}
