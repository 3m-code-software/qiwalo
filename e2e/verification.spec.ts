import { expect, test } from "@playwright/test";
import { BASE_URL, FAKE_UPLOAD_URL, signInDemo, TEST_IMAGE } from "./helpers";

// مكتبة Mock في الذاكرة مشتركة بين السياقين → لازم تسلسل داخل الملف.
test.describe.serial("توثيق المالك من طرف الإدارة", () => {
  test("إرسال الهوية → طلب سيلفي → موافقة نهائية + سجل العمليات", async ({ browser }) => {
    const ownerContext = await browser.newContext({ baseURL: BASE_URL, locale: "ar-EG" });
    const adminContext = await browser.newContext({ baseURL: BASE_URL, locale: "ar-EG" });
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
      await expect(owner).toHaveURL(/\/owner\/profile/);

      await owner.locator("#birthDay").selectOption("1");
      await owner.locator("#birthMonth").selectOption("1");
      await owner.locator("#birthYear").selectOption("1990");

      for (const field of ["idFront", "idBack"]) {
        await owner.locator(`#${field}-file`).setInputFiles({
          name: `${field}.png`,
          mimeType: "image/png",
          buffer: TEST_IMAGE,
        });
        await owner.locator(`#${field}-file`).locator("..")
          .getByRole("button", { name: "ارفع الصورة" }).click();
        await expect(owner.locator(`input[name="${field}"]`)).toHaveValue(FAKE_UPLOAD_URL);
      }

      await owner.locator('input[name="terms"]').check();
      await owner.getByRole("button", { name: "إرسال بيانات التحقق" }).click();
      await expect(owner).toHaveURL(/verified=1/);
      await expect(owner.getByText("المستندات قيد المراجعة. تقدر تعديل البيانات")).toBeVisible();

      const admin = await adminContext.newPage();
      await admin.goto("/login?next=/admin");
      await signInDemo(admin, /مدير تجريبي/);
      await expect(admin).toHaveURL(/\/admin/);

      await admin.locator("#verifications > summary").click();
      const row = admin.locator("#verifications tr", { hasText: "owner@qiwalo.test" });
      await expect(row).toContainText("بانتظار المستندات");

      await row.getByRole("button", { name: "طلب سيلفي" }).click();
      await expect(row).toContainText("مطلوب سيلفي");

      await admin.locator("#activity summary").click();
      const selfieEvent = admin.locator("#activity").getByText("طلب سيلفي من مالك");
      expect(await selfieEvent.count()).toBeGreaterThan(0);

      // المالك يشوف طلب السيلفي بعد تحديث الصفحة.
      await owner.reload();
      await expect(owner.getByText("تمت الموافقة المبدئية على مستنداتك")).toBeVisible();

      await row.getByRole("button", { name: "موافقة" }).click();
      await expect(row).toContainText("موثّق");
      const approveEvent = admin.locator("#activity").getByText("موافقة على توثيق مالك");
      expect(await approveEvent.count()).toBeGreaterThan(0);

      await owner.reload();
      await expect(owner.getByText("تم توثيق حسابك بالكامل")).toBeVisible();
    } finally {
      await ownerContext.close();
      await adminContext.close();
    }
  });
});
