import { expect, test } from "@playwright/test";

test("صفحة ٤٠٤ عربية لمسار غير موجود", async ({ page }) => {
  const response = await page.goto("/هذا-الرابط-غير-موجود");
  expect(response?.status()).toBe(404);

  await expect(page.getByRole("heading", { name: /الصفحة دي مش موجودة/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "الرئيسية" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ابحث عن إقامة" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "واتساب" })).toBeVisible();
  expect(await page.locator("html").getAttribute("dir")).toBe("rtl");
});

test("صفحة ٤٠٤ على موبايل بدون تمرير أفقي", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/هذا-الرابط-غير-موجود");
  await expect(page.getByRole("heading", { name: /الصفحة دي مش موجودة/ })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
