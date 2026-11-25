import type { Page } from "@playwright/test";

/** نفس المنفذ الافتراضي في playwright.config.ts — يُستخدم للسياقات الإضافية. */
export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${process.env.PLAYWRIGHT_PORT || 3130}`;

/** صورة PNG صغيرة جداً (١×١) تكفي لاختبار ضغط العميل ورفعه. */
export const TEST_IMAGE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

export const FAKE_UPLOAD_URL = "https://res.cloudinary.com/demo/image/upload/v1/qiwalo/units/e2e.jpg";

/** تواريخ محلية بنفس طريقة مكتبة Mock (date-fns addDays من بداية اليوم). */
export function dateAfter(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** أزرار الحسابات التجريبية بتظهر فقط في وضع Mock. */
export async function signInDemo(page: Page, label: RegExp): Promise<void> {
  await page.getByRole("button", { name: label }).click();
}
