import { expect, test } from "@playwright/test";

const STAY_URL = "/stay/nile-view-dar-al-madina";

test("الديسكتوب: الشريط اللاصق مخفي وبطاقة الحجز الجانبية هي الظاهرة", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(STAY_URL);
  await expect(page.getByTestId("mobile-booking-bar")).toBeHidden();
  await expect(page.locator('form[action="/checkout"]')).toBeVisible();
});

test("Pixel 7: شريط الحجز ثابت أسفل الشاشة بالسعر من غير تمرير أفقي", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto(STAY_URL);
  const bar = page.getByTestId("mobile-booking-bar");
  await expect(bar).toBeVisible();
  await expect(bar.getByTestId("mobile-bar-price")).toHaveText("١,٤٥٠ ج.م");

  const box = await bar.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { bottom: rect.bottom, width: rect.width, height: rect.height, position: getComputedStyle(element).position };
  });
  expect(box.position).toBe("fixed");
  expect(box.bottom).toBeGreaterThanOrEqual(910);
  expect(box.width).toBeLessThanOrEqual(412);
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(await bar.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBeTruthy();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBeTruthy();

  const buttonBox = await bar.getByTestId("mobile-book-button").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { height: rect.height, width: rect.width };
  });
  expect(buttonBox.height).toBeGreaterThanOrEqual(44);
  expect(buttonBox.width).toBeGreaterThanOrEqual(44);
});

test("Pixel 7: زر احجز الآن يوصل لنموذج الحجز ويهيّئ حقل الوصول", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto(STAY_URL);
  const bar = page.getByTestId("mobile-booking-bar");
  await expect(bar).toBeVisible();

  await bar.getByTestId("mobile-book-button").click();
  const checkIn = page.locator("#checkIn");
  await expect(checkIn).toBeInViewport();
  await expect(checkIn).toBeFocused();
  await expect(page.locator('form[action="/checkout"]')).toBeVisible();
  await expect(bar).toBeVisible();
});
