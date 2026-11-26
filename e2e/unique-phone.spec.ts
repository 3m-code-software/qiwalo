import { expect, test, type Page } from "@playwright/test";
import { dateAfter, newPhone } from "./helpers";

const firstIn = dateAfter(145);
const firstOut = dateAfter(148);
const secondIn = dateAfter(125);
const secondOut = dateAfter(128);
const checkoutUrl = (checkIn: string, checkOut: string) =>
  `/checkout?slug=nile-view-dar-al-madina&checkIn=${checkIn}&checkOut=${checkOut}&guests=2`;

async function fillGuest(page: Page, email: string, phone: string): Promise<void> {
  await expect(page.getByRole("heading", { name: "بيانات الضيف" })).toBeVisible();
  await page.locator("#fullName").fill("ضيف قيوالو");
  await page.locator("#email").fill(email);
  await page.locator("#phone").fill(phone);
  await page.locator("#nationality").fill("مصري");
  await page.locator('input[name="terms"]').check();
}

test("نفس رقم التليفون ما يتستخدمش في حجز بحساب مختلف", async ({ page }) => {
  const phone = newPhone();
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  await page.goto(checkoutUrl(firstIn, firstOut));
  await fillGuest(page, `phone-a-${suffix}@qiwalo.test`, phone);
  await page.getByRole("button", { name: "تأكيد الحجز" }).click();
  await expect(page).toHaveURL(/\/booking\/QW-/, { timeout: 30_000 });

  await page.goto(checkoutUrl(secondIn, secondOut));
  await fillGuest(page, `phone-b-${suffix}@qiwalo.test`, phone);
  await page.getByRole("button", { name: "تأكيد الحجز" }).click();

  await expect(page.getByText(/رقم التليفون مسجّل بحساب تاني/)).toBeVisible();
  await expect(page).toHaveURL(/\/checkout/);
});
