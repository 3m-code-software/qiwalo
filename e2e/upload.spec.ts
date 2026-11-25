import { expect, test } from "@playwright/test";
import { FAKE_UPLOAD_URL, signInDemo, TEST_IMAGE } from "./helpers";

test("رفع صورة وحدة: ضغط في المتصفح + رد وهمي من /api/upload", async ({ page }) => {
  // لا Cloudinary ولا أسرار في CI — نعترض الطلب ونرجع رابطاً وهمياً.
  await page.route("**/api/upload", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: FAKE_UPLOAD_URL, publicId: "qiwalo/units/e2e" }),
    });
  });

  await page.goto("/login?next=/owner/units/new");
  await signInDemo(page, /مالك تجريبي/);
  await expect(page).toHaveURL(/\/owner\/units\/new/);

  await page.locator("#name").fill("وحدة اختبار Playwright");
  await page.locator("#address").fill("شارع الكورنيش، الأقصر");
  await page.locator("#description").fill("وحدة تجريبية لاختبار رفع الصور بدون بيانات حقيقية.");
  await page.locator("#basePrice").fill("1000");
  await page.locator("#maxGuests").fill("4");
  await page.locator("#bedrooms").fill("2");
  await page.locator("#bathrooms").fill("1");

  await page.locator("#unitImage").setInputFiles({
    name: "e2e.png",
    mimeType: "image/png",
    buffer: TEST_IMAGE,
  });
  await page.getByRole("button", { name: "ارفع الصورة" }).click();

  await expect(page.getByText("1 / 8 صور")).toBeVisible();
  await expect(page.getByText(/آخر صورة:/)).toBeVisible();
  const preview = page.locator('img[alt="صورة رقم ١ للوحدة"]');
  await expect(preview).toHaveCount(1);
  expect(await preview.getAttribute("loading")).toBe("lazy");
});
