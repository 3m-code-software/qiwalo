import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, dateAfter, signInDemo } from "./helpers";

const STAY_SLUG = "nile-view-dar-al-madina";
const noOverflow = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();

async function loginDemo(page: Page, label: RegExp, next: string): Promise<void> {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await signInDemo(page, label);
  await page.waitForURL((url) => url.pathname === next, { timeout: 30_000 });
}

test("لوحة السائق تعرض طلبات النقل، والإدارة تعرض مؤشرات السائقين والمركبات", async ({ page }) => {
  // أنشئ طلب النقل من Checkout بدل الاعتماد على بذرة ثابتة، عشان الاختبار يشتغل بعد أي إعادة تشغيل للسيرفر.
  // بعيد عن تواريخ باقي المواصفات (١٠٠–١٢٣) عشان ما يقفلش حجوزاتهم.
  const checkIn = dateAfter(140);
  const checkOut = dateAfter(143);
  await loginDemo(page, /ضيف تجريبي/, "/");
  await page.goto(
    `/checkout?slug=${STAY_SLUG}&checkIn=${checkIn}&checkOut=${checkOut}&guests=2&transport=v1`,
  );
  await page.locator("#fullName").fill("نورة حجز النقل");
  await page.locator("#email").fill("guest@qiwalo.test");
  await page.locator("#phone").fill("01066094050");
  await page.locator("#nationality").fill("مصري");
  await page.locator('input[name="terms"]').check();
  await page.getByRole("button", { name: "تأكيد الحجز" }).click();
  await expect(page).toHaveURL(/\/booking\/QW-/, { timeout: 30_000 });
  const reference = page.url().split("/").pop()!;

  await loginDemo(page, /سائق تجريبي/, "/driver");
  const trip = page.getByTestId("driver-trip-row").filter({ hasText: reference });
  await expect(trip).toBeVisible();
  await expect(trip).toContainText("نورة حجز النقل");
  await expect(trip).toContainText("سيارة السائق — جولات الأقصر");
  await expect(trip).toContainText("٦٥٠ ج.م");

  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "لوحة السائق" })).toHaveAttribute("href", "/driver");
  await expect(footer.getByRole("link", { name: "شروط السائقين" })).toHaveAttribute("href", "/terms/driver");

  await loginDemo(page, /مدير تجريبي/, "/admin");
  const stats = page.getByTestId("admin-driver-stats");
  await expect(stats).toContainText("السائقون");
  await expect(stats).toContainText("المركبات");
  await expect(stats).toContainText("المركبات الموقوفة");
  await expect(stats).toContainText("طلبات النقل");
  await expect(stats).toContainText(/[٠-٩]/);
});

test("إدارة المركبة: تعديل السعر والسعة والأيام المحجوزة ثم إيقافها وإعادة نشرها وحذفها", async ({ page, browser }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 412, height: 915 });
  await loginDemo(page, /سائق تجريبي/, "/driver");
  await expect(page.getByTestId("driver-dashboard")).toBeVisible();
  await noOverflow(page);

  const suffix = Date.now().toString().slice(-7);
  const vehicleName = `مركبة إدارة ${suffix}`;
  const plate = `OPR-${suffix}`;
  const blocked1 = dateAfter(80);
  const blocked2 = dateAfter(81);

  await page.goto("/driver/vehicles/new");
  await page.locator('input[name="name"]').fill(vehicleName);
  await page.locator('input[name="plateNumber"]').fill(plate);
  await page.locator('input[name="model"]').fill("نيسان باترول ٢٠٢٤");
  await page.locator('input[name="capacity"]').fill("5");
  await page.locator('input[name="pricePerTrip"]').fill("700");
  await page.locator('input[name="routeFrom"]').fill("الأقصر الشرقية");
  await page.locator('input[name="routeTo"]').fill("معبد حابو");
  await page.locator('input[name="meetingPoint"]').fill("استقبال الفندق");
  await page.locator('textarea[name="includes"]').fill("سائق مرافق\nمياه معدنية");
  await page.locator('input[name="licenseDocUrl"]').fill("https://res.cloudinary.com/demo/raw/upload/v1/qiwalo/drivers/ops.pdf");
  await page.getByRole("button", { name: /إرسال المركبة للمراجعة/ }).click();
  await expect(page).toHaveURL(/driver\?vehicle=1/, { timeout: 30_000 });

  const createdRow = page.getByTestId("driver-vehicle-row").filter({ hasText: vehicleName });
  const editHref = await createdRow.getByTestId("driver-vehicle-edit").getAttribute("href");
  expect(editHref).toBeTruthy();
  const vehicleId = editHref!.split("/").pop()!;

  await page.goto(`/driver/vehicles/${vehicleId}`);
  await page.locator('input[name="pricePerTrip"]').fill("777");
  await page.locator('input[name="capacity"]').fill("8");
  await page.locator('input[name="blockedDates"]').fill(`${blocked1}, ${blocked2}`);
  await page.getByRole("button", { name: /حفظ التعديلات/ }).click();
  await expect(page).toHaveURL(/driver\?updated=1/, { timeout: 30_000 });
  await expect(page.getByTestId("driver-vehicle-row").filter({ hasText: vehicleName })).toContainText("٧٧٧ ج.م / رحلة");
  await expect(page.getByTestId("driver-vehicle-row").filter({ hasText: vehicleName })).toContainText("السعة: ٨ أفراد");
  await expect(page.getByTestId("driver-vehicle-row").filter({ hasText: vehicleName })).toContainText("أيام محجوزة: ٢");
  await noOverflow(page);

  const adminContext = await browser.newContext({ baseURL: BASE_URL, locale: "ar-EG" });
  try {
    const admin = await adminContext.newPage();
    await loginDemo(admin, /مدير تجريبي/, "/admin/drivers");
    const adminRow = admin.getByTestId("admin-vehicle-row").filter({ hasText: vehicleName });
    await expect(adminRow).toContainText("قيد المراجعة");
    await adminRow.getByRole("button", { name: "نشر المركبة" }).click();
    await expect(adminRow).toContainText("منشورة");
  } finally {
    await adminContext.close();
  }

  const blockedCheckout = `/checkout?slug=${STAY_SLUG}&checkIn=${blocked1}&checkOut=${dateAfter(82)}&guests=2&transport=${vehicleId}`;
  await page.goto(blockedCheckout);
  // Next يضيف role="alert" لعنصر الإعلان عن المسار؛ نقيّد النطاق للمحتوى الأساسي.
  await expect(page.getByRole("main").getByRole("alert")).toContainText("النقل المحدد محجوز");
  await expect(page.getByTestId("checkout-transport")).toHaveCount(0);

  const stayUrl = `/stay/${STAY_SLUG}?checkIn=${dateAfter(90)}&checkOut=${dateAfter(93)}&guests=2`;
  await page.goto(stayUrl);
  await expect(page.getByTestId("transport-card").filter({ hasText: vehicleName })).toBeVisible();

  await page.goto("/driver");
  const row = page.getByTestId("driver-vehicle-row").filter({ hasText: vehicleName });
  await row.getByTestId("driver-vehicle-pause").click();
  await expect(page.getByTestId("driver-vehicle-row").filter({ hasText: vehicleName })).toContainText("موقوفة");
  await page.goto(stayUrl);
  await expect(page.getByTestId("transport-card").filter({ hasText: vehicleName })).toHaveCount(0);

  await page.goto("/driver");
  await page.getByTestId("driver-vehicle-row").filter({ hasText: vehicleName }).getByTestId("driver-vehicle-pause").click();
  await expect(page.getByTestId("driver-vehicle-row").filter({ hasText: vehicleName })).toContainText("منشورة");
  await page.goto(stayUrl);
  await expect(page.getByTestId("transport-card").filter({ hasText: vehicleName })).toBeVisible();

  await page.goto("/driver");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByTestId("driver-vehicle-row").filter({ hasText: vehicleName }).getByTestId("driver-vehicle-delete").click();
  await expect(page.getByTestId("driver-vehicle-row").filter({ hasText: vehicleName })).toHaveCount(0);
});
