import { expect, test } from "@playwright/test";

const TITLES = [
  "الوصول",
  "النقل",
  "الإقامة",
  "معالم أسوان",
  "الفطار",
  "جولة النيل",
  "العشاء",
  "الرجوع والتقييم",
];

const journey = (page: import("@playwright/test").Page) =>
  page.locator("section[aria-labelledby='journey-title']");

test("رحلتك مع قيوالو: ٨ مراحل بالترتيب ووصف عربي لكل صورة", async ({ page }) => {
  await page.goto("/");
  const section = journey(page);

  await expect(section.getByRole("heading", { level: 2, name: "رحلتك مع قيوالو" })).toBeVisible();
  const steps = section.locator("ol > li");
  await expect(steps).toHaveCount(8);
  for (const [i, title] of TITLES.entries()) {
    await expect(steps.nth(i).getByRole("heading")).toHaveText(title);
  }

  const alts = await section.locator("img").evaluateAll((images) =>
    images.map((image) => image.getAttribute("alt") ?? ""),
  );
  expect(alts).toHaveLength(8);
  alts.forEach((alt) => expect(alt.trim().length).toBeGreaterThan(3));

  await expect(section.getByRole("link", { name: /ابحث عن إقامة/ })).toHaveAttribute("href", "/search");
  expect(await page.locator("html").getAttribute("dir")).toBe("rtl");
});

test("المرحلة النشطة تتغير مع السكرول", async ({ page }) => {
  await page.goto("/");
  const section = journey(page);
  const steps = section.locator("ol > li");

  await steps.nth(3).evaluate((node) => node.scrollIntoView({ block: "center" }));
  await expect(section.locator("h3").first()).toHaveText("معالم أسوان", { timeout: 10_000 });

  await steps.nth(6).evaluate((node) => node.scrollIntoView({ block: "center" }));
  await expect(section.locator("h3").first()).toHaveText("العشاء", { timeout: 10_000 });
});

test("تقليل الحركة يعرض كل المراحل ثابتة بدون لاصق", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const section = journey(page);

  await expect(section.locator("article")).toHaveCount(8);
  await expect(section.locator("ol")).toHaveCount(0);
  const alts = await section.locator("img").evaluateAll((images) =>
    images.map((image) => image.getAttribute("alt") ?? ""),
  );
  expect(alts).toHaveLength(8);
  await expect(section.getByRole("heading", { level: 3, name: "معالم أسوان" })).toBeVisible();
});

test("ملخص الرحلة وبيانات كل مرحلة + صورة لاصقة على الموبايل", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const section = journey(page);

  await expect(section.getByText("٨ مراحل")).toBeVisible();
  await expect(section.getByText("الأقصر وأسوان")).toBeVisible();
  await expect(section.getByText("من الطيارة للتقييم")).toBeVisible();

  await section.locator("ol > li").nth(3).evaluate((node) =>
    node.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await expect(section.locator("h3").first()).toHaveText("معالم أسوان", { timeout: 10_000 });
  await expect(section.getByText("٣ معالم · فيلة · أبو سمبل · النيل").first()).toBeVisible();

  const sticky = section.locator('[class*="sticky"]').first();
  expect(await sticky.evaluate((el) => getComputedStyle(el).position)).toBe("sticky");
  const stickyBox = await sticky.boundingBox();
  const sectionBox = await section.boundingBox();
  expect(stickyBox!.width).toBeGreaterThan(sectionBox!.width - 40); // يجب ألا ينكمش العمود على الموبايل

  const box = await section.locator('[class*="aspect-"]').first().boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeLessThan(140);

  const progress = section.getByRole("img", { name: /تقدم الرحلة/ });
  await expect(progress).toBeVisible();
  await expect(progress.locator("span")).toHaveCount(8);
});
