import { expect, test } from "@playwright/test";

const STAY_URL = "/stay/nile-view-dar-al-madina";

test("تقويم التوافر: سبعة أيام بأسعارهم والتحديد يقلّ التواريخ لنموذج الحجز", async ({ page }) => {
  await page.goto(STAY_URL);
  const cal = page.getByTestId("availability-calendar");
  await expect(cal).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(cal.locator("button[data-date]")).toHaveCount(7);

  const labels = await cal.locator("button[data-date]").evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute("aria-label") ?? ""),
  );
  expect(labels.every((label) => label.includes("ج.م"))).toBeTruthy();

  const enabled = cal.locator("button[data-date]:not([disabled])");
  const checkIn = await enabled.nth(0).getAttribute("data-date");
  const checkOut = await enabled.nth(2).getAttribute("data-date");
  expect(checkIn).toBeTruthy();
  expect(checkOut).toBeTruthy();

  await enabled.nth(0).click();
  await expect(cal.getByRole("status")).toContainText("اختر تاريخ المغادرة");
  await enabled.nth(2).click();
  await expect(cal.getByRole("status")).toContainText("ليالي");

  const form = page.locator('form[action="/checkout"]');
  await expect(form.locator("#checkIn")).toHaveValue(checkIn!);
  await expect(form.locator("#checkOut")).toHaveValue(checkOut!);
});

test("التنقل بين الأسابيع والأيام المحجوزة ما بيتقفلش حجز عبرها", async ({ page }) => {
  await page.goto(STAY_URL);
  const cal = page.getByTestId("availability-calendar");
  const firstDate = await cal.locator("button[data-date]").first().getAttribute("data-date");

  await expect(cal.getByRole("button", { name: "الأسبوع السابق" })).toBeDisabled();
  await cal.getByRole("button", { name: "الأسبوع التالي" }).click();
  expect(await cal.locator("button[data-date]").first().getAttribute("data-date")).not.toBe(firstDate);

  await cal.getByRole("button", { name: "الأسبوع التالي" }).click();
  const blocked = cal.locator("button[data-date][disabled]");
  expect(await blocked.count()).toBeGreaterThan(0);
  await expect(blocked.first()).toHaveAttribute("aria-label", /محجوز/);
  const blockedDate = (await blocked.first().getAttribute("data-date"))!;

  const cells = await cal.locator("button[data-date]").evaluateAll((buttons) =>
    buttons.map((button) => ({
      date: button.getAttribute("data-date") ?? "",
      disabled: button.hasAttribute("disabled"),
    })),
  );
  const before = cells.filter((cell) => !cell.disabled && cell.date < blockedDate).at(-1)!;
  const after = cells.find((cell) => !cell.disabled && cell.date > blockedDate)!;
  expect(before).toBeTruthy();
  expect(after).toBeTruthy();

  await cal.locator(`button[data-date="${before.date}"]`).click();
  await cal.locator(`button[data-date="${after.date}"]`).click();
  await expect(cal.getByRole("status")).toContainText("محجوز");
  const form = page.locator('form[action="/checkout"]');
  // عبور يوم محجوز يبدأ تحديد جديد من اليوم اللي بعده، وما يحددش المغادرة.
  await expect(form.locator("#checkIn")).toHaveValue(after.date);
  await expect(form.locator("#checkOut")).toHaveValue("");

  await cal.getByRole("button", { name: "الأسبوع السابق" }).click();
  await cal.getByRole("button", { name: "الأسبوع السابق" }).click();
  await expect(cal.locator("button[data-date]").first()).toHaveAttribute("data-date", firstDate!);
});

test("التقويم على Pixel 7: سبعة أعمدة من غير تمرير أفقي", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto(STAY_URL);
  const cal = page.getByTestId("availability-calendar");
  await expect(cal).toBeVisible();
  await expect(cal.locator("button[data-date]")).toHaveCount(7);
  expect(await cal.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBeTruthy();

  const box = await cal.locator("button[data-date]").first().boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(40);
  expect(box?.height).toBeGreaterThanOrEqual(44);
});
