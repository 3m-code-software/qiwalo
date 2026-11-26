import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, FAKE_UPLOAD_URL, TEST_IMAGE, dateAfter, signInDemo } from "./helpers";

const STAY_SLUG = "nile-view-dar-al-madina";
// تواريخ منفصلة عن باقي المواصفات عشان حجوزات الاختبار ما تقفلش تواريخ الباقة القديمة.
const checkIn = dateAfter(110);
const checkOut = dateAfter(113);
const stayUrl = `/stay/${STAY_SLUG}?checkIn=${checkIn}&checkOut=${checkOut}&guests=2`;
// آخر اختبار يحجز في نطاق تاريخ مختلف عشان ما يتقاطعش مع حجز اختبار النقل.
const packageCheckIn = dateAfter(120);
const packageCheckOut = dateAfter(123);
const checkoutUrl = (params: string, dates = { checkIn, checkOut }) =>
  `/checkout?slug=${STAY_SLUG}&checkIn=${dates.checkIn}&checkOut=${dates.checkOut}&guests=2&${params}`;
const docUrl = "https://res.cloudinary.com/demo/raw/upload/v1/qiwalo/drivers/e2e-license.pdf";

function newEmail(): string {
  return `driver-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@qiwalo.test`;
}

async function signUpDriver(page: Page, email: string, name: string, next: string): Promise<void> {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByRole("button", { name: "إنشاء حساب", exact: true }).click();
  await page.locator("#signup-role").selectOption("DRIVER");
  await expect(page.getByRole("link", { name: /شروط السائقين/ })).toHaveAttribute("href", "/terms/driver");
  await page.locator("#signup-name").fill(name);
  await page.locator("#signup-email").fill(email);
  await page.locator("#signup-phone").fill("01012345678");
  await page.locator("#signup-password").fill("demo123");
  await page.locator("#signup-terms").check();
  await page.locator("form").getByRole("button", { name: "إنشاء حساب" }).click();
  await page.waitForURL((url) => url.pathname === "/telegram", { timeout: 30_000 });
  await page.getByRole("link", { name: /تخطي/ }).click();
  await page.waitForURL((url) => url.pathname === next, { timeout: 30_000 });
}

async function uploadIdImage(page: Page, field: "idFront" | "idBack"): Promise<void> {
  await page.locator(`#${field}-file`).setInputFiles({
    name: `${field}.png`,
    mimeType: "image/png",
    buffer: TEST_IMAGE,
  });
  await page.locator(`#${field}-file`).locator("..")
    .getByRole("button", { name: "ارفع الصورة" }).click();
  await expect(page.locator(`input[name="${field}"]`)).toHaveValue(FAKE_UPLOAD_URL);
}

test("صفحة الوحدة: مركبة السائق بتظهر بمقاس Pixel 7 من غير تمرير أفقي", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto(stayUrl);

  const card = page.getByTestId("transport-card").filter({ hasText: "سيارة السائق — جولات الأقصر" });
  await expect(card).toBeVisible();
  await expect(card).toContainText("سائق:");
  await expect(card).toContainText("سائق قيوالو");
  await expect(card).toContainText("LXR-1234");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBeTruthy();
});

test("التسجيل كسائق يفتح لوحة السائق ويمنع إضافة مركبة قبل التحقق", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await signUpDriver(page, newEmail(), "سائق جديد", "/driver");

  await expect(page.getByTestId("driver-dashboard")).toBeVisible();
  await expect(page.getByTestId("driver-status")).toContainText("غير مشترك");
  await expect(page.getByRole("link", { name: /شروط السائقين/ })).toHaveCount(0);

  await page.goto("/driver/vehicles/new");
  await expect(page.getByText("لازم الإدارة تعتمد تحققك الأول")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBeTruthy();
});

test("سائق جديد: تحقق + تفعيل إدارة + مركبة + نشر، ثم تظهر للضيوف", async ({ browser }) => {
  test.setTimeout(120_000);
  const email = newEmail();
  const vehicleName = `مركبة سائق ${Date.now()}`;
  const driverContext = await browser.newContext({ baseURL: BASE_URL, locale: "ar-EG" });
  try {
    const driver = await driverContext.newPage();
    await driver.route("**/api/upload", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: FAKE_UPLOAD_URL, publicId: "qiwalo/drivers/e2e-id" }),
      });
    });
    await driver.setViewportSize({ width: 412, height: 915 });
    await signUpDriver(driver, email, "سائق التجربة", "/driver/verify");

    await uploadIdImage(driver, "idFront");
    await uploadIdImage(driver, "idBack");
    await driver.locator('input[name="licenseDocUrl"]').fill(docUrl);
    await driver.locator('input[name="terms"]').check();
    await driver.getByRole("button", { name: /إرسال التحقق للمراجعة/ }).click();
    await expect(driver.getByText("تم إرسال بيانات التحقق للمراجعة")).toBeVisible();

    await driver.goto("/driver");
    await expect(driver.getByTestId("driver-status")).toContainText("قيد المراجعة");

    const adminContext = await browser.newContext({ baseURL: BASE_URL, locale: "ar-EG" });
    try {
      const admin = await adminContext.newPage();
      await admin.goto("/login?next=/admin/drivers");
      await signInDemo(admin, /مدير تجريبي/);
      await admin.waitForURL((url) => url.pathname === "/admin/drivers", { timeout: 30_000 });

      const driverRow = admin.getByTestId("admin-driver-row").filter({ hasText: email });
      await expect(driverRow).toContainText("قيد المراجعة");
      await driverRow.getByRole("button", { name: "اعتماد السائق" }).click();
      await expect(driverRow).toContainText("معتمد");
      await driverRow.getByRole("button", { name: "تفعيل اشتراك السائق" }).click();
      await expect(driverRow).toContainText("نشط");

      await driver.goto("/driver/vehicles/new");
      await driver.locator('input[name="name"]').fill(vehicleName);
      await driver.locator('input[name="plateNumber"]').fill("LXR-9090");
      await driver.locator('input[name="model"]').fill("نيسان باترول ٢٠٢٤");
      await driver.locator('input[name="capacity"]').fill("5");
      await driver.locator('input[name="pricePerTrip"]').fill("700");
      await driver.locator('input[name="routeFrom"]').fill("الأقصر الشرقية");
      await driver.locator('input[name="routeTo"]').fill("معبد حابو");
      await driver.locator('input[name="meetingPoint"]').fill("استقبال الفندق");
      await driver.locator('textarea[name="includes"]').fill("سائق مرافق\nمياه معدنية");
      await driver.locator('input[name="licenseDocUrl"]').fill(docUrl);
      await driver.getByRole("button", { name: /إرسال المركبة للمراجعة/ }).click();
      await expect(driver).toHaveURL(/driver\?vehicle=1/, { timeout: 30_000 });
      await expect(driver.getByTestId("driver-vehicle-row").filter({ hasText: vehicleName }))
        .toContainText("قيد المراجعة");

      await admin.goto("/admin/drivers");
      const vehicleRow = admin.getByTestId("admin-vehicle-row").filter({ hasText: vehicleName });
      await expect(vehicleRow).toContainText("قيد المراجعة");
      await expect(vehicleRow).toContainText("LXR-9090");
      await vehicleRow.getByRole("button", { name: "نشر المركبة" }).click();
      await expect(vehicleRow).toContainText("منشورة");

      await admin.setViewportSize({ width: 1440, height: 900 });
      await admin.goto(stayUrl);
      const card = admin.getByTestId("transport-card").filter({ hasText: vehicleName });
      await expect(card).toBeVisible();
      await expect(card).toContainText("سائق التجربة");
      await expect(card).toContainText("LXR-9090");
    } finally {
      await adminContext.close();
    }
  } finally {
    await driverContext.close();
  }
});

test("حجز مؤكد بمركبة السائق يعرض اسم السائق ولوحته في صفحة الحجز", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/login");
  await signInDemo(page, /ضيف تجريبي/);
  await page.goto(checkoutUrl("experience=e1&transport=v1"));

  await expect(page.getByTestId("checkout-transport")).toContainText("سيارة السائق — جولات الأقصر");
  await expect(page.getByTestId("checkout-driver")).toContainText("سائق قيوالو");
  await expect(page.getByTestId("checkout-driver")).toContainText("LXR-1234");

  await page.locator("#fullName").fill("أحمد محمد");
  await page.locator("#email").fill("guest@qiwalo.test");
  await page.locator("#phone").fill("01066094050");
  await page.locator("#nationality").fill("مصري");
  await page.locator('input[name="terms"]').check();
  await page.getByRole("button", { name: "تأكيد الحجز" }).click();

  await expect(page).toHaveURL(/\/booking\/QW-/, { timeout: 30_000 });
  const driverInfo = page.getByTestId("booking-driver");
  await expect(driverInfo).toContainText("سائق قيوالو");
  await expect(driverInfo).toContainText("LXR-1234");
  await expect(page.getByTestId("booking-transport-line")).toContainText("٦٥٠ ج.م");
});

test("الباقة تقدر تستخدم مركبة السائق بعد نشرها", async ({ browser }) => {
  test.setTimeout(120_000);
  const name = `باقة بمركبة سائق ${Date.now()}`;
  let packageId = "";

  const ownerContext = await browser.newContext({ baseURL: BASE_URL, locale: "ar-EG" });
  try {
    const owner = await ownerContext.newPage();
    await owner.goto("/login?next=/owner/packages/new");
    await signInDemo(owner, /مالك تجريبي/);
    await owner.waitForURL((url) => url.pathname === "/owner/packages/new", { timeout: 30_000 });
    await expect(owner.locator('select[name="transportId"] option[value="v1"]'))
      .toHaveText("سيارة السائق — جولات الأقصر");
    await owner.locator('input[name="name"]').fill(name);
    await owner.locator('select[name="propertyId"]').selectOption("p1");
    await owner.locator('select[name="experienceId"]').selectOption("e1");
    await owner.locator('select[name="transportId"]').selectOption("v1");
    await owner.locator('input[name="pricePerNight"]').fill("2200");
    await owner.locator('input[name="licenseDocUrl"]').fill(docUrl);
    await owner.getByRole("button", { name: /إرسال الباقة للمراجعة/ }).click();
    await expect(owner).toHaveURL(/owner\?package=1/, { timeout: 30_000 });
    await expect(owner.getByTestId("owner-package-row").filter({ hasText: name }))
      .toContainText("قيد المراجعة");
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
    await expect(row).toContainText("سيارة السائق — جولات الأقصر");
    packageId = await row.locator('input[name="id"]').first().inputValue();
    await row.getByRole("button", { name: /نشر/ }).click();
    await expect(row).toContainText("منشورة");
  } finally {
    await adminContext.close();
  }

  expect(packageId).toBeTruthy();
  const guestContext = await browser.newContext({ baseURL: BASE_URL, locale: "ar-EG" });
  try {
    const guest = await guestContext.newPage();
    await guest.setViewportSize({ width: 1440, height: 900 });
    await guest.goto(checkoutUrl(`package=${packageId}`, { checkIn: packageCheckIn, checkOut: packageCheckOut }));
    await expect(guest.getByTestId("checkout-package")).toContainText(name);
    await expect(guest.getByTestId("checkout-package")).toContainText("سيارة السائق — جولات الأقصر");
    await expect(guest.getByTestId("price-addon").filter({ hasText: "الباقة" }))
      .toContainText("٦,٦٠٠ ج.م");
    await expect(guest.locator("form").getByText("تحويل بنكي أو كاش عند الوصول").first()).toBeVisible();
  } finally {
    await guestContext.close();
  }
});
