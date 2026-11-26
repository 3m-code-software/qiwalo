import { expect, test } from "@playwright/test";
import { dateAfter } from "./helpers";

const STAY_SLUG = "nile-view-dar-al-madina";
const checkIn = dateAfter(160);
const checkOut = dateAfter(163);
const stayUrl = `/stay/${STAY_SLUG}?checkIn=${checkIn}&checkOut=${checkOut}&guests=2`;
const safariName = "سفاري جبل السلسلة عند الغروب";
const motoTourName = "جولة موتوسيكلات غروب الأقصر";
const transportName = "سيارة خاصة لجولات الأقصر";
const packageName = "باقة الأقصر: إقامة + سفاري + نقل";

test("صفحة الوحدة: فلتر سعر التجارب يخفي الجولة الأغلى والمسح يرجّعها", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(stayUrl);

  await expect(page.getByTestId("service-filters")).toBeVisible();
  await page.getByLabel("أقصى سعر للتجربة (ج.م)").fill("400");
  await page.getByRole("button", { name: "تطبيق الفلاتر" }).click();

  await expect(page).toHaveURL(/expMax=400/);
  await expect(page.getByTestId("service-filter-count")).toBeVisible();
  await expect(page.getByTestId("mountain-safari-card").filter({ hasText: safariName })).toBeVisible();
  await expect(page.getByTestId("motorcycle-tour-card").filter({ hasText: motoTourName })).toHaveCount(0);

  await page.getByTestId("service-filter-clear").click();
  await expect(page).not.toHaveURL(/expMax/);
  await expect(page).toHaveURL(new RegExp(`checkIn=${checkIn}`));
  await expect(page.getByTestId("motorcycle-tour-card").filter({ hasText: motoTourName })).toBeVisible();
});

test("صفحة الوحدة: فلتر النقل والباقة يعرض رسالة عدم وجود نتائج ويحفظ التواريخ", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(stayUrl);

  await page.getByLabel("أقصى سعر للتجربة (ج.م)").fill("1");
  await page.getByLabel("نوع النقل").selectOption("COASTER");
  await page.getByLabel("أقصى سعر للنقل (ج.م)").fill("1");
  await page.getByLabel("أقصى سعر للباقة لليلة (ج.م)").fill("1");
  await page.getByRole("button", { name: "تطبيق الفلاتر" }).click();

  await expect(page).toHaveURL(/expMax=1/);
  await expect(page).toHaveURL(/transportType=COASTER/);
  await expect(page).toHaveURL(/transportMax=1/);
  await expect(page).toHaveURL(/packageMax=1/);
  await expect(page).toHaveURL(new RegExp(`checkIn=${checkIn}`));
  await expect(page).toHaveURL(/guests=2/);
  await expect(page.getByTestId("transport-card").filter({ hasText: transportName })).toHaveCount(0);
  await expect(page.getByTestId("package-card").filter({ hasText: packageName })).toHaveCount(0);
  await expect(page.getByTestId("service-empty")).toBeVisible();
});

test("Pixel 7: الفلاتر والسعة تخفي الخدمات اللي مش هتسع الضيوف من غير تمرير أفقي", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto(`/stay/${STAY_SLUG}?checkIn=${checkIn}&checkOut=${checkOut}&guests=5`);

  await expect(page.getByTestId("service-filters")).toBeVisible();
  await expect(page.getByLabel("أقصى سعر للتجربة (ج.م)")).toBeVisible();
  await expect(page.getByTestId("mountain-safari-card").filter({ hasText: safariName })).toBeVisible();
  await expect(page.getByTestId("transport-card").filter({ hasText: transportName })).toHaveCount(0);
  await expect(page.getByTestId("package-card").filter({ hasText: packageName })).toHaveCount(0);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBeTruthy();
});
