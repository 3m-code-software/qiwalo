import { expect, test } from "@playwright/test";
import { BASE_URL, dateAfter, newPhone, signInDemo } from "./helpers";

const STAY_SLUG = "nile-view-dar-al-madina";
const checkIn = dateAfter(70);
const checkOut = dateAfter(73);
const stayUrl = `/stay/${STAY_SLUG}?checkIn=${checkIn}&checkOut=${checkOut}&guests=2`;
const checkoutUrl = (experience = "e1") =>
  `/checkout?slug=${STAY_SLUG}&checkIn=${checkIn}&checkOut=${checkOut}&guests=2&experience=${experience}`;
const safariName = "سفاري جبل السلسلة عند الغروب";

test("صفحة الوحدة: سفاري الجبال يظهر بمقاس Pixel 7 من غير تمرير أفقي", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto(stayUrl);

  await expect(page.getByTestId("mountain-safari-section")).toBeVisible();
  const card = page.getByTestId("mountain-safari-card").filter({ hasText: safariName });
  await expect(card).toBeVisible();
  await expect(card).toContainText("جبل السلسلة");
  await expect(card).toContainText("٤ ساعات");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBeTruthy();
});

test("إضافة السفاري تنقل للدفع مع سعر التجربة ونص الدفع الثابت", async ({ page }) => {
  await page.goto(stayUrl);
  const card = page.getByTestId("mountain-safari-card").filter({ hasText: safariName });
  await card.getByRole("button", { name: /أضفها وأكمل الحجز/ }).click();

  await expect(page).toHaveURL(/\/checkout/);
  const summary = page.getByTestId("checkout-experience");
  await expect(summary).toContainText(safariName);
  await expect(summary).toContainText("نقطة اللقاء");
  await expect(page.getByTestId("price-addon")).toContainText("٧٠٠ ج.م");
  await expect(page.locator("form").getByText("تحويل بنكي أو كاش عند الوصول").first()).toBeVisible();
});

test("حجز مؤكد بالسفاري يظهر التجربة وسعرها في صفحة الحجز", async ({ page }) => {
  await page.goto("/login");
  await signInDemo(page, /ضيف تجريبي/);
  await page.goto(checkoutUrl());

  await expect(page.getByTestId("checkout-experience")).toBeVisible();
  await page.locator("#fullName").fill("أحمد محمد");
  await page.locator("#email").fill("guest@qiwalo.test");
  await page.locator("#phone").fill(newPhone());
  await page.locator("#nationality").fill("مصري");
  await page.locator('input[name="terms"]').check();
  await page.getByRole("button", { name: "تأكيد الحجز" }).click();

  await expect(page).toHaveURL(/\/booking\/QW-/, { timeout: 30_000 });
  const experience = page.getByTestId("booking-experience");
  await expect(experience).toContainText(safariName);
  await expect(experience).toContainText("بعد مراجعة الإدارة للمستندات");
  await expect(page.getByTestId("booking-experience-line")).toContainText("٧٠٠ ج.م");
});

test("المالك يضيف تجربة قيد المراجعة ثم الإدارة تنشرها للضيوف", async ({ browser }) => {
  const name = `سفاري جبل اختبار ${Date.now()}`;
  const ownerContext = await browser.newContext({ baseURL: BASE_URL, locale: "ar-EG" });
  try {
    const owner = await ownerContext.newPage();
    await owner.goto("/login?next=/owner/experiences/new");
    await signInDemo(owner, /مالك تجريبي/);
    await owner.waitForURL((url) => url.pathname === "/owner/experiences/new", { timeout: 30_000 });
    await owner.locator('input[name="name"]').fill(name);
    await owner.locator('input[name="mountain"]').fill("جبل اختبار");
    await owner.locator('input[name="meetingPoint"]').fill("نقطة اللقاء التجريبية");
    await owner.locator('input[name="pricePerPerson"]').fill("250");
    await owner.locator('input[name="bestSeason"]').fill("نوفمبر — مارس");
    await owner.locator('textarea[name="includes"]').fill("دليل مرافق\nنقل محلي");
    await owner.locator('input[name="licenseDocUrl"]').fill("https://res.cloudinary.com/demo/raw/upload/v1/qiwalo/docs/test.pdf");
    await owner.getByRole("button", { name: /إرسال التجربة للمراجعة/ }).click();

    await expect(owner).toHaveURL(/owner\?experience=1/, { timeout: 30_000 });
    const ownerRow = owner.getByTestId("owner-experience-row").filter({ hasText: name });
    await expect(ownerRow).toContainText("قيد المراجعة");
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

    await admin.goto(stayUrl);
    await expect(admin.getByTestId("mountain-safari-card").filter({ hasText: name })).toBeVisible();
  } finally {
    await adminContext.close();
  }
});
