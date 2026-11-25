import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, FAKE_UPLOAD_URL, signInDemo, TEST_IMAGE } from "./helpers";

async function loginAdmin(page: Page): Promise<void> {
  await page.goto("/login?next=/admin");
  await signInDemo(page, /مدير تجريبي/);
  await page.waitForURL((url) => url.pathname === "/admin", { timeout: 30_000 });
}

test("إحصائيات ولوحات الإدارة بالعربية بدون قيم إنجليزية خام", async ({ page }) => {
  await loginAdmin(page);

  const statsCard = page.locator(".soft-card").filter({ hasText: "الوحدات" }).first();
  await expect(statsCard).toContainText(/[٠-٩]/);

  await page.locator("#bookings summary").click();
  const bookings = page.locator("#bookings");
  await expect(bookings).toContainText("مؤكدة");
  await expect(bookings).toContainText("مدفوع");
  await expect(bookings).not.toContainText(/CONFIRMED|COMPLETED|PAID/);
  await expect(bookings).toContainText("حجز مطابق");
});

test("حقل ملاحظة التوثيق ونسبة العمولة بمساحة وصول مناسبة", async ({ page, browser }) => {
  await loginAdmin(page);
  await page.locator("#verifications summary").click();

  // في التشغيل المنفرد المكتبة تبدأ فاضية؛ في الجولة الكاملة اختبار التوثيق سبق وأنشأ طلباً.
  if (await page.locator('#verifications input[aria-label="ملاحظة قرار التوثيق"]').count() === 0) {
    const ownerContext = await browser.newContext({ baseURL: BASE_URL, locale: "ar-EG" });
    try {
      const owner = await ownerContext.newPage();
      await owner.route("**/api/upload", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ url: FAKE_UPLOAD_URL, publicId: "qiwalo/units/e2e-id" }),
        });
      });
      await owner.goto("/login?next=/owner/profile");
      await signInDemo(owner, /مالك تجريبي/);
      await owner.locator("#birthDay").selectOption("1");
      await owner.locator("#birthMonth").selectOption("1");
      await owner.locator("#birthYear").selectOption("1990");
      for (const field of ["idFront", "idBack"]) {
        await owner.locator(`#${field}-file`).setInputFiles({
          name: `${field}.png`, mimeType: "image/png", buffer: TEST_IMAGE,
        });
        await owner.locator(`#${field}-file`).locator("..")
          .getByRole("button", { name: "ارفع الصورة" }).click();
        await expect(owner.locator(`input[name="${field}"]`)).toHaveValue(FAKE_UPLOAD_URL);
      }
      await owner.locator('input[name="terms"]').check();
      await owner.getByRole("button", { name: "إرسال بيانات التحقق" }).click();
      await expect(owner).toHaveURL(/verified=1/);
    } finally {
      await ownerContext.close();
    }
    await page.reload();
    await page.locator("#verifications summary").click();
  }

  const noteInputs = page.getByLabel("ملاحظة قرار التوثيق");
  expect(await noteInputs.count()).toBeGreaterThan(0);
  const noteBox = await noteInputs.first().boundingBox();
  expect(noteBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(noteBox?.width ?? 0).toBeGreaterThanOrEqual(128);

  await page.locator("#commissions summary").click();
  const rateInputs = page.getByLabel(/نسبة عمولة/);
  expect(await rateInputs.count()).toBeGreaterThan(0);
  await expect(page.locator("#commissions")).toContainText("٪");
});

test("الشريط اللاصق متجاوب وزر إكمال مخفي للحجز الملغي", async ({ page }) => {
  await loginAdmin(page);

  const searchBar = page.locator('section[aria-label="بحث وتصفية لوحة الإدارة"]');
  await expect(searchBar).toHaveCSS("position", "sticky");
  await expect(searchBar).toHaveCSS("top", "68px");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(searchBar).toHaveCSS("top", "64px");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator("#bookings summary").click();
  const confirmedRow = page.locator("#bookings tbody tr").filter({ hasText: "مؤكدة" }).first();
  await expect(confirmedRow).toBeVisible();
  const reference = (await confirmedRow.locator("td").first().innerText()).trim();

  page.once("dialog", (dialog) => dialog.accept());
  await confirmedRow.getByRole("button", { name: "إلغاء" }).click();
  const updatedRow = page.locator("#bookings tbody tr").filter({ hasText: reference });
  await expect(updatedRow).toContainText("ملغية");
  await expect(updatedRow.getByRole("button", { name: "إكمال" })).toHaveCount(0);
});
