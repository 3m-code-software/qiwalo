import { expect, test } from "@playwright/test";
import { BASE_URL, dateAfter, newPhone, signInDemo } from "./helpers";

const STAY_SLUG = "nile-view-dar-al-madina";
const checkIn = dateAfter(100);
const checkOut = dateAfter(103);
const stayUrl = `/stay/${STAY_SLUG}?checkIn=${checkIn}&checkOut=${checkOut}&guests=2`;
const checkoutUrl = (pkg = "pk1") =>
  `/checkout?slug=${STAY_SLUG}&checkIn=${checkIn}&checkOut=${checkOut}&guests=2&package=${pkg}`;
const packageName = "باقة الأقصر: إقامة + سفاري + نقل";
const packageLine = "٥,٧٠٠ ج.م";

test("صفحة الوحدة: الباقة تظهر بمقاس Pixel 7 من غير تمرير أفقي", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto(stayUrl);

  await expect(page.getByTestId("package-section")).toBeVisible();
  const card = page.getByTestId("package-card").filter({ hasText: packageName });
  await expect(card).toBeVisible();
  await expect(card).toContainText("السعر لكل ليلة");
  await expect(card).toContainText("١,٩٠٠ ج.م");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBeTruthy();
});

test("إضافة الباقة مع السفاري والنقل تنقل للدفع وتحفظ الثلاث اختيارات مع نص الدفع الثابت", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${stayUrl}&experience=e1&transport=t1`);

  const card = page.getByTestId("package-card").filter({ hasText: packageName });
  await card.getByRole("button", { name: /أضف الباقة وأكمل الحجز/ }).click();

  await expect(page).toHaveURL(/\/checkout/);
  await expect(page).toHaveURL(/experience=e1/);
  await expect(page).toHaveURL(/transport=t1/);
  await expect(page).toHaveURL(/package=pk1/);
  const summary = page.getByTestId("checkout-package");
  await expect(summary).toContainText(packageName);
  await expect(summary).toContainText("٣ ليالي");
  await expect(summary).toContainText(packageLine);
  await expect(page.getByTestId("checkout-experience")).toBeVisible();
  await expect(page.getByTestId("checkout-transport")).toBeVisible();
  await expect(page.getByTestId("price-addon").filter({ hasText: "الباقة" })).toContainText(packageLine);
  await expect(page.getByTestId("price-addon").filter({ hasText: "سفاري الجبال" })).toContainText("٧٠٠ ج.م");
  await expect(page.getByTestId("price-addon").filter({ hasText: "النقل" })).toContainText("٦٠٠ ج.م");
  await expect(page.locator("form").getByText("تحويل بنكي أو كاش عند الوصول").first()).toBeVisible();
});

test("حجز مؤكد بالباقة يظهر تفاصيلها وسعر الليالي في صفحة الحجز", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/login");
  await signInDemo(page, /ضيف تجريبي/);
  await page.goto(checkoutUrl());

  await expect(page.getByTestId("checkout-package")).toContainText(packageName);
  await page.locator("#fullName").fill("أحمد محمد");
  await page.locator("#email").fill("guest@qiwalo.test");
  await page.locator("#phone").fill(newPhone());
  await page.locator("#nationality").fill("مصري");
  await page.locator('input[name="terms"]').check();
  await page.getByRole("button", { name: "تأكيد الحجز" }).click();

  await expect(page).toHaveURL(/\/booking\/QW-/, { timeout: 30_000 });
  const pkg = page.getByTestId("booking-package");
  await expect(pkg).toContainText(packageName);
  await expect(pkg).toContainText("سفاري جبل السلسلة عند الغروب");
  await expect(pkg).toContainText("سيارة خاصة لجولات الأقصر");
  await expect(pkg).toContainText("بعد مراجعة الإدارة للمستندات");
  await expect(page.getByTestId("booking-package-line")).toContainText(packageLine);
});

test("المالك يضيف باقة قيد المراجعة ثم الإدارة تنشرها للضيوف", async ({ browser }) => {
  const name = `باقة اختبار ${Date.now()}`;

  const ownerContext = await browser.newContext({ baseURL: BASE_URL, locale: "ar-EG" });
  try {
    const owner = await ownerContext.newPage();
    await owner.goto("/login?next=/owner/packages/new");
    await signInDemo(owner, /مالك تجريبي/);
    await owner.waitForURL((url) => url.pathname === "/owner/packages/new", { timeout: 30_000 });
    await owner.locator('input[name="name"]').fill(name);
    await owner.locator('select[name="propertyId"]').selectOption("p1");
    await owner.locator('select[name="experienceId"]').selectOption("e1");
    await owner.locator('select[name="transportId"]').selectOption("t1");
    await owner.locator('input[name="pricePerNight"]').fill("2100");
    await owner.locator('input[name="licenseDocUrl"]').fill("https://res.cloudinary.com/demo/raw/upload/v1/qiwalo/docs/package-test.pdf");
    await owner.getByRole("button", { name: /إرسال الباقة للمراجعة/ }).click();

    await expect(owner).toHaveURL(/owner\?package=1/, { timeout: 30_000 });
    const ownerRow = owner.getByTestId("owner-package-row").filter({ hasText: name });
    await expect(ownerRow).toContainText("قيد المراجعة");
    await expect(ownerRow).toContainText("٢,١٠٠ ج.م");
  } finally {
    await ownerContext.close();
  }

  const adminContext = await browser.newContext({ baseURL: BASE_URL, locale: "ar-EG" });
  try {
    const admin = await adminContext.newPage();
    await admin.goto("/login?next=/admin/packages");
    await signInDemo(admin, /مدير تجريبي/);
    await admin.waitForURL((url) => url.pathname === "/admin/packages", { timeout: 30_000 });

    const row = admin.getByTestId("admin-package-row").filter({ hasText: name });
    await expect(row).toContainText("قيد المراجعة");
    await row.getByRole("button", { name: /نشر/ }).click();
    await expect(row).toContainText("منشورة");

    await admin.setViewportSize({ width: 1440, height: 900 });
    await admin.goto(stayUrl);
    await expect(admin.getByTestId("package-card").filter({ hasText: name })).toBeVisible();
  } finally {
    await adminContext.close();
  }
});
