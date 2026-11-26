/** مقارنة تواريخ ISO نصية (yyyy-MM-dd) دون تحويل مناطق زمنية. */
export function overlapsBlockedDates(
  checkIn: string,
  checkOut: string,
  blockedDates: string[] = [],
): boolean {
  if (!checkIn || !checkOut || checkOut <= checkIn) return false;
  return blockedDates.some((date) => date >= checkIn && date < checkOut);
}

/** يقرأ الأيام المحجوزة من حقل نصي مفصول بفواصل أو أسطر، ويتجاهل القيم غير الصحيحة. */
export function parseBlockedDates(value: FormDataEntryValue | null): string[] {
  const raw = String(value ?? "");
  if (!raw.trim()) return [];
  return [...new Set(
    raw
      .split(/[\n,،]+/)
      .map((part) => part.trim())
      .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)),
  )].sort();
}
