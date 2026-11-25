import { expect, test, type Browser, type Page } from "@playwright/test";
import { BASE_URL, FAKE_UPLOAD_URL, signInDemo, TEST_IMAGE } from "./helpers";

async function loginAdmin(page: Page): Promise<void> {
  await page.goto("/login?next=/admin");
  await signInDemo(page, /مدير تجريبي/);
  await page.waitForURL((url) => url.pathname === "/admin", { timeout: 30_000 });
}

async function ensureVerification(page: Page, browser: Browser): Promise<void> {
  if (await page.locator('#verifications tbody tr', { hasText: "owner@qiwalo.test" }).count() > 0) return;
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
}

test("الوحدة تنتظر ← مرفوضة ← إعادة للمراجعة ← منشورة ← مسودة مع سجل العمليات", async ({ page }) => {
  await loginAdmin(page);
  page.on("dialog", (dialog) => dialog.accept());
  // قسم الوحدات مفتوح افتراضياً؛ الضغط على summary هنا كان بيقفله ويخفي الأزرار.

  const row = page.locator("#properties tbody tr").filter({ hasText: "شاليه إطلالة الخزان" });
  await expect(row).toContainText("قيد المراجعة");

  await row.getByRole("button", { name: "رفض", exact: true }).click();
  await expect(row).toContainText("مرفوضة");
  await expect(row.getByRole("button", { name: "إعادة للمراجعة" })).toBeVisible();

  await row.getByRole("button", { name: "إعادة للمراجعة" }).click();
  await expect(row).toContainText("قيد المراجعة");
  await expect(row.getByRole("button", { name: "نشر", exact: true })).toBeVisible();

  await row.getByRole("button", { name: "نشر", exact: true }).click();
  await expect(row).toContainText("منشورة");
  await expect(row.getByRole("button", { name: "إرجاع لمسودة" })).toBeVisible();

  await row.getByRole("button", { name: "إرجاع لمسودة" }).click();
  await expect(row).toContainText("مسودة");

  await page.locator("#activity summary").click();
  const activity = page.locator("#activity");
  await expect(activity).toContainText("إعادة وحدة للمراجعة");
  await expect(activity).toContainText("إرجاع وحدة لمسودة");
});

test("التقييم المنشور يرجع لحالة قيد المراجعة", async ({ page }) => {
  await loginAdmin(page);
  await page.locator("#reviews summary").click();
  const row = page.locator("#reviews tbody tr").filter({ hasText: "سارة مسافر" });
  await expect(row).toContainText("منشور");
  await row.getByRole("button", { name: "إعادة للمراجعة" }).click();
  await expect(row).toContainText("قيد المراجعة");
  await expect(row.getByRole("button", { name: "نشر", exact: true })).toBeVisible();
});

test("ملاحظة توثيق واحدة للقرارات الثلاثة مع تأكيد قبل الرفض", async ({ page, browser }) => {
  await loginAdmin(page);
  await ensureVerification(page, browser);
  await page.locator("#verifications summary").click();
  const row = page.locator("#verifications tbody tr").filter({ hasText: "owner@qiwalo.test" });
  await expect(row).toBeVisible();

  const note = row.getByLabel("ملاحظة قرار التوثيق");
  await expect(note).toHaveCount(1);
  await note.fill("ملاحظة موحّدة للاختبار");
  await row.getByRole("button", { name: "طلب سيلفي" }).click();
  await expect(row).toContainText("مطلوب سيلفي");
  await expect(row).toContainText("ملاحظة موحّدة للاختبار");

  await note.fill("سبب الرفض");
  page.once("dialog", (dialog) => dialog.dismiss());
  await row.getByRole("button", { name: "رفض", exact: true }).click();
  await expect(row).toContainText("مطلوب سيلفي");

  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "رفض", exact: true }).click();
  await expect(row).toContainText("مرفوض");
  await expect(row).toContainText("سبب الرفض");

  await page.locator("#activity summary").click();
  await expect(page.locator("#activity")).toContainText("رفض توثيق مالك");
});

test("إلغاء الحجز لا يحدث إلا بعد تأكيد المستخدم", async ({ page }) => {
  await loginAdmin(page);
  await page.locator("#bookings summary").click();
  const firstRow = page.locator("#bookings tbody tr").filter({ hasText: "مؤكدة" }).first();
  await expect(firstRow).toBeVisible();
  // ثبّت المرجع قبل الإلغاء، لأن الـ first() بيتحرك لصف تاني بعد ما الصف الأول يتلغي.
  const reference = (await firstRow.locator("td").first().innerText()).trim();
  const row = page.locator("#bookings tbody tr").filter({ hasText: reference });

  page.once("dialog", (dialog) => dialog.dismiss());
  await row.getByRole("button", { name: "إلغاء" }).click();
  await expect(row).toContainText("مؤكدة");

  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "إلغاء" }).click();
  await expect(row).toContainText("ملغية");
});
