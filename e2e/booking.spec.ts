import { expect, test } from "@playwright/test";
import { dateAfter, signInDemo } from "./helpers";

test("حجز كامل: دخول ضيف → بحث → وحدة → تأكيد → رقم مرجعي", async ({ page }) => {
  const checkIn = dateAfter(40);
  const checkOut = dateAfter(43);

  await page.goto("/login?next=/search");
  await signInDemo(page, /ضيف تجريبي/);
  await expect(page).toHaveURL(/\/search/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  await page.locator("#checkIn").fill(checkIn);
  await page.locator("#checkOut").fill(checkOut);
  await page.locator("#guests").fill("2");
  await page.getByRole("button", { name: "ابحث عن إقامتك" }).click();
  await expect(page).toHaveURL(new RegExp(`checkIn=${checkIn}`));

  const card = page.locator("a.card", { hasText: "دار المدينة بإطلالة على النيل" });
  await expect(card).toBeVisible();
  const alts = await page.locator("a.card img").evaluateAll((images) =>
    images.map((image) => image.getAttribute("alt") ?? ""),
  );
  expect(alts.length).toBeGreaterThan(0);
  expect(alts.every((alt) => alt.trim().length > 0)).toBeTruthy();

  await card.click();
  await expect(page).toHaveURL(/\/stay\/nile-view-dar-al-madina/);

  // التواريخ والضيوف وصلت من رابط البطاقة؛ نتأكد إن النموذج استلمها ثم نرسل.
  const bookingForm = page.locator('form[action="/checkout"]');
  await expect(bookingForm.locator("#checkIn")).toHaveValue(checkIn);
  await expect(bookingForm.locator("#checkOut")).toHaveValue(checkOut);
  await expect(bookingForm.locator("#guests")).toHaveValue("2");
  await bookingForm.getByRole("button", { name: /احجز الآن/ }).click();
  await expect(page).toHaveURL(/\/checkout/);
  // النص نفسه موجود في النموذج والشريط الجانبي ولوحة التفاصيل — نتحقق من النسخة داخل النموذج.
  await expect(page.locator("form").getByText("تحويل بنكي أو كاش عند الوصول").first()).toBeVisible();

  await page.locator("#fullName").fill("أحمد محمد");
  await page.locator("#email").fill("guest@qiwalo.test");
  await page.locator("#phone").fill("01066094050");
  await page.locator("#nationality").fill("مصري");
  await page.locator('input[name="terms"]').check();
  await page.getByRole("button", { name: "تأكيد الحجز" }).click();

  // أول توجيه لـ /booking/[reference] في وضع dev يحتاج تجميع الصفحة.
  await expect(page).toHaveURL(/\/booking\/QW-/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "تم تأكيد حجزك!" })).toBeVisible({ timeout: 15_000 });

  const reference = page.locator('p[dir="ltr"]').filter({ hasText: /^QW-/ }).first();
  await expect(reference).toBeVisible();
  expect(await reference.textContent()).toMatch(/^QW-/);
  expect(await reference.getAttribute("dir")).toBe("ltr");
});
