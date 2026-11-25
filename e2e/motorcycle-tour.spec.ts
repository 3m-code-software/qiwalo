import { expect, test } from "@playwright/test";
import { BASE_URL, dateAfter, signInDemo } from "./helpers";

const STAY_SLUG = "nile-view-dar-al-madina";
const checkIn = dateAfter(90);
const checkOut = dateAfter(93);
const stayUrl = `/stay/${STAY_SLUG}?checkIn=${checkIn}&checkOut=${checkOut}&guests=2`;
const checkoutUrl = (experience = "e3") =>
  `/checkout?slug=${STAY_SLUG}&checkIn=${checkIn}&checkOut=${checkOut}&guests=2&experience=${experience}`;
const tourName = "جولة موتوسيكلات غروب الأقصر";

test("صفحة الوحدة: جولات الموتوسيكلات تظهر بمقاس Pixel 7 من غير تمرير أفقي", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto(stayUrl);

  await expect(page.getByTestId("motorcycle-tour-section")).toBeVisible();
  const card = page.getByTestId("motorcycle-tour-card").filter({ hasText: tourName });
  await expect(card).toBeVisible();
  await expect(card).toContainText("المسار");
  await expect(card).toContainText("٣ ساعات");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBeTruthy();
});

test("إضافة الجولة مع النقل تنقل للدفع وتحفظ الإضافتين مع نص الدفع الثابت", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${stayUrl}&transport=t1`);

  const card = page.getByTestId("motorcycle-tour-card").filter({ hasText: tourName });
  await card.getByRole("button", { name: /أضف الجولة وأكمل الحجز/ }).click();

  await expect(page).toHaveURL(/\/checkout/);
  await expect(page).toHaveURL(/transport=t1/);
  const summary = page.getByTestId("checkout-experience");
  await expect(summary).toContainText("جولات الموتوسيكلات");
  await expect(summary).toContainText(tourName);
  await expect(page.getByTestId("checkout-transport")).toBeVisible();
  await expect(page.getByTestId("price-addon").filter({ hasText: "جولات الموتوسيكلات" })).toContainText("٩٠٠ ج.م");
  await expect(page.getByTestId("price-addon").filter({ hasText: "النقل" })).toContainText("٦٠٠ ج.م");
  await expect(page.locator("form").getByText("تحويل بنكي أو كاش عند الوصول").first()).toBeVisible();
});

test("حجز مؤكد بجولة موتوسيكلات يظهر تفاصيلها وسعرها في صفحة الحجز", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/login");
  await signInDemo(page, /ضيف تجريبي/);
  await page.goto(checkoutUrl());

  await expect(page.getByTestId("checkout-experience")).toContainText(tourName);
  await page.locator("#fullName").fill("أحمد محمد");
  await page.locator("#email").fill("guest@qiwalo.test");
  await page.locator("#phone").fill("01066094050");
  await page.locator("#nationality").fill("مصري");
  await page.locator('input[name="terms"]').check();
  await page.getByRole("button", { name: "تأكيد الحجز" }).click();

  await expect(page).toHaveURL(/\/booking\/QW-/, { timeout: 30_000 });
  const experience = page.getByTestId("booking-experience");
  await expect(experience).toContainText("جولات الموتوسيكلات");
  await expect(experience).toContainText(tourName);
  await expect(experience).toContainText("بعد مراجعة الإدارة للمستندات");
  await expect(page.getByTestId("booking-experience-line")).toContainText("٩٠٠ ج.م");
});

test("المالك يضيف جولة موتوسيكلات قيد المراجعة ثم الإدارة تنشرها للضيوف", async ({ browser }) => {
  const name = `جولة موتوسيكلات اختبار ${Date.now()}`;

  const ownerContext = await browser.newContext({ baseURL: BASE_URL, locale: "ar-EG" });
  try {
    const owner = await ownerContext.newPage();
    await owner.goto("/login?next=/owner/experiences/new");
    await signInDemo(owner, /مالك تجريبي/);
    await owner.waitForURL((url) => url.pathname === "/owner/experiences/new", { timeout: 30_000 });
    await owner.locator('select[name="category"]').selectOption("MOTORCYCLE_TOUR");
    await owner.locator('input[name="name"]').fill(name);
    await owner.locator('input[name="mountain"]').fill("الكورنيش ← معبد حابو");
    await owner.locator('input[name="meetingPoint"]').fill("نقطة اللقاء التجريبية");
    await owner.locator('input[name="pricePerPerson"]').fill("275");
    await owner.locator('input[name="bestSeason"]').fill("أكتوبر — أبريل");
    await owner.locator('textarea[name="includes"]').fill("دراجة للإيجار\nخوذة واقية");
    await owner.locator('input[name="licenseDocUrl"]').fill("https://res.cloudinary.com/demo/raw/upload/v1/qiwalo/docs/motorcycle-test.pdf");
    await owner.getByRole("button", { name: /إرسال التجربة للمراجعة/ }).click();

    await expect(owner).toHaveURL(/owner\?experience=1/, { timeout: 30_000 });
    const ownerRow = owner.getByTestId("owner-experience-row").filter({ hasText: name });
    await expect(ownerRow).toContainText("قيد المراجعة");
    await expect(ownerRow).toContainText(/جولات/);
  } finally {
    await ownerContext.close();
  }

  const adminContext = await browser.newContext({ baseURL: BASE_URL, locale: "ar-EG" });
  try {
    const admin = await adminContext.newPage();
    await admin.goto("/login?next=/admin/experiences");
    await signInDemo(admin, /مدير تجريبي/);
    await admin.waitForURL((url) => url.pathname === "/admin/experiences", { timeout: 30_000 });

    const row = admin.getByTestId("admin-experience-row").filter({ hasText: name });
    await expect(row).toContainText("قيد المراجعة");
    await row.getByRole("button", { name: /نشر/ }).click();
    await expect(row).toContainText("منشورة");

    await admin.setViewportSize({ width: 1440, height: 900 });
    await admin.goto(stayUrl);
    await expect(admin.getByTestId("motorcycle-tour-card").filter({ hasText: name })).toBeVisible();
  } finally {
    await adminContext.close();
  }
});
