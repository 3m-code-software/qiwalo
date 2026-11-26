import { expect, test } from "@playwright/test";
import { BASE_URL, dateAfter, newPhone, signInDemo } from "./helpers";

const STAY_SLUG = "nile-view-dar-al-madina";
const checkIn = dateAfter(80);
const checkOut = dateAfter(83);
const stayUrl = `/stay/${STAY_SLUG}?checkIn=${checkIn}&checkOut=${checkOut}&guests=2`;
const checkoutUrl = (transport = "t1") =>
  `/checkout?slug=${STAY_SLUG}&checkIn=${checkIn}&checkOut=${checkOut}&guests=2&experience=e1&transport=${transport}`;
const transportName = "سيارة خاصة لجولات الأقصر";

test("صفحة الوحدة: النقل يظهر بمقاس Pixel 7 من غير تمرير أفقي", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto(stayUrl);

  await expect(page.getByTestId("transport-section")).toBeVisible();
  const card = page.getByTestId("transport-card").filter({ hasText: transportName });
  await expect(card).toBeVisible();
  await expect(card).toContainText("سيارة خاصة");
  await expect(card).toContainText("٥ ساعات");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBeTruthy();
});

test("إضافة النقل مع السفاري تنقل للدفع وتحفظ الإضافتين مع نص الدفع الثابت", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${stayUrl}&experience=e1`);

  const card = page.getByTestId("transport-card").filter({ hasText: transportName });
  await card.getByRole("button", { name: /أضف النقل وأكمل الحجز/ }).click();

  await expect(page).toHaveURL(/\/checkout/);
  await expect(page).toHaveURL(/experience=e1/);
  const transportSummary = page.getByTestId("checkout-transport");
  await expect(transportSummary).toContainText(transportName);
  await expect(transportSummary).toContainText("سعر الرحلة للمركبة");
  await expect(page.getByTestId("checkout-experience")).toBeVisible();
  await expect(page.getByTestId("price-addon").filter({ hasText: "سفاري الجبال" })).toContainText("٧٠٠ ج.م");
  await expect(page.getByTestId("price-addon").filter({ hasText: "النقل" })).toContainText("٦٠٠ ج.م");
  await expect(page.locator("form").getByText("تحويل بنكي أو كاش عند الوصول").first()).toBeVisible();
});

test("حجز مؤكد بالنقل يظهر تفاصيله وسعر الرحلة في صفحة الحجز", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/login");
  await signInDemo(page, /ضيف تجريبي/);
  await page.goto(checkoutUrl());

  await expect(page.getByTestId("checkout-transport")).toBeVisible();
  await page.locator("#fullName").fill("أحمد محمد");
  await page.locator("#email").fill("guest@qiwalo.test");
  await page.locator("#phone").fill(newPhone());
  await page.locator("#nationality").fill("مصري");
  await page.locator('input[name="terms"]').check();
  await page.getByRole("button", { name: "تأكيد الحجز" }).click();

  await expect(page).toHaveURL(/\/booking\/QW-/, { timeout: 30_000 });
  const transport = page.getByTestId("booking-transport");
  await expect(transport).toContainText(transportName);
  await expect(transport).toContainText("سيارة خاصة");
  await expect(transport).toContainText("بعد مراجعة الإدارة للمستندات");
  await expect(page.getByTestId("booking-transport-line")).toContainText("٦٠٠ ج.م");
  await expect(page.getByTestId("booking-experience-line")).toContainText("٧٠٠ ج.م");
});

test("المالك يضيف نقل قيد المراجعة ثم الإدارة تنشره للضيوف", async ({ browser }) => {
  const name = `نقل اختبار ${Date.now()}`;

  const ownerContext = await browser.newContext({ baseURL: BASE_URL, locale: "ar-EG" });
  try {
    const owner = await ownerContext.newPage();
    await owner.goto("/login?next=/owner/transport/new");
    await signInDemo(owner, /مالك تجريبي/);
    await owner.waitForURL((url) => url.pathname === "/owner/transport/new", { timeout: 30_000 });
    await owner.locator('input[name="name"]').fill(name);
    await owner.locator('input[name="routeFrom"]').fill("الأقصر الشرقية");
    await owner.locator('input[name="routeTo"]').fill("معبد حابو");
    await owner.locator('input[name="meetingPoint"]').fill("نقطة اللقاء التجريبية");
    await owner.locator('input[name="pricePerTrip"]').fill("450");
    await owner.locator('textarea[name="includes"]').fill("سائق مرافق\nمياه معدنية");
    await owner.locator('input[name="licenseDocUrl"]').fill("https://res.cloudinary.com/demo/raw/upload/v1/qiwalo/docs/transport-test.pdf");
    await owner.getByRole("button", { name: /إرسال النقل للمراجعة/ }).click();

    await expect(owner).toHaveURL(/owner\?transport=1/);
    const ownerRow = owner.getByTestId("owner-transport-row").filter({ hasText: name });
    await expect(ownerRow).toContainText("قيد المراجعة");
  } finally {
    await ownerContext.close();
  }

  const adminContext = await browser.newContext({ baseURL: BASE_URL, locale: "ar-EG" });
  try {
    const admin = await adminContext.newPage();
    await admin.goto("/login?next=/admin/transport");
    await signInDemo(admin, /مدير تجريبي/);
    await admin.waitForURL((url) => url.pathname === "/admin/transport", { timeout: 30_000 });

    const row = admin.getByTestId("admin-transport-row").filter({ hasText: name });
    await expect(row).toContainText("قيد المراجعة");
    await row.getByRole("button", { name: /نشر/ }).click();
    await expect(row).toContainText("منشورة");

    await admin.setViewportSize({ width: 1440, height: 900 });
    await admin.goto(stayUrl);
    await expect(admin.getByTestId("transport-card").filter({ hasText: name })).toBeVisible();
  } finally {
    await adminContext.close();
  }
});
