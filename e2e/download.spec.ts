import { expect, test } from "@playwright/test";

test("صفحة التحميل تظهر بعد الضغط على رابط التحميل فقط", async ({ page }) => {
  // تسخين المسار في سيرفر التطوير حتى لا يتجاوز التنقل مهلة الاختبار أثناء التجميع الأول.
  const warmup = await page.request.get("/download");
  expect(warmup.status()).toBe(200);

  await page.goto("/");

  const footerLink = page.getByRole("contentinfo").getByRole("link", { name: "تحميل تطبيق أندرويد" });
  await expect(footerLink).toBeVisible();
  await footerLink.click();
  await expect(page).toHaveURL(/\/download$/);
  await expect(page.getByRole("heading", { level: 1, name: /قيوالو في جيبك/ })).toBeVisible();

  const downloadLink = page.getByRole("link", { name: /تحميل ملف قيوالو للاندرويد/ });
  await expect(downloadLink).toBeVisible();
  expect(await downloadLink.getAttribute("href")).toBe("/downloads/qiwalo.apk");
  expect(await downloadLink.getAttribute("download")).toBe("qiwalo.apk");

  const steps = page.locator("article img");
  await expect(steps).toHaveCount(4);
  const loaded = await steps.evaluateAll((images) =>
    images.every((img) => img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0),
  );
  expect(loaded).toBe(true);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("ملف APK متاح للتحميل والصفحة مخفية عن محركات البحث", async ({ page }) => {
  const apk = await page.request.get("/downloads/qiwalo.apk");
  expect(apk.status()).toBe(200);
  expect(Number(apk.headers()["content-length"] || 0)).toBeGreaterThan(8_000_000);

  const robots = await page.request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /download");

  const sitemap = await page.request.get("/sitemap.xml");
  expect(await sitemap.text()).not.toContain("/download");

  await page.goto("/download");
  const metaRobots = await page.locator('meta[name="robots"]').getAttribute("content");
  expect(metaRobots).toContain("noindex");
});

test("صفحة التحميل على موبايل أندرويد بدون تمرير أفقي", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/download");

  await expect(page.getByRole("heading", { level: 1, name: /قيوالو في جيبك/ })).toBeVisible();
  const downloadLink = page.getByRole("link", { name: /تحميل ملف قيوالو للاندرويد/ });
  await expect(downloadLink).toBeVisible();
  expect((await downloadLink.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);

  await expect(page.getByRole("heading", { level: 2, name: /كيف تثبّت التطبيق؟/ })).toBeVisible();
  await expect(page.locator("article img")).toHaveCount(4);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(await page.locator("html").getAttribute("dir")).toBe("rtl");
});
