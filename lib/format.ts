const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toArabicDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => arabicDigits[Number(d)]);
}

export function money(value: number, withCurrency = true): string {
  const formatted = new Intl.NumberFormat("en-US").format(value);
  return withCurrency ? `${toArabicDigits(formatted)} ج.م` : toArabicDigits(formatted);
}

export function dateAr(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(d);
}

export function fileSizeAr(bytes: number): string {
  const size = bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`
    : `${Math.max(1, Math.round(bytes / 1024))} كيلوبايت`;
  return toArabicDigits(size);
}
