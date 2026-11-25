import { expect, test } from "@playwright/test";
import { signInDemo } from "./helpers";

test("جلسة تجريبية على صفحة الوحدة من غير خطأ prerender للوقت", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/login?next=/stay/nile-view-dar-al-madina");
  await signInDemo(page, /مدير تجريبي/);
  await page.waitForURL((url) => url.pathname === "/stay/nile-view-dar-al-madina", { timeout: 30_000 });

  // الكوكيز موجود فعلاً: الهيدر بيوضح الجلسة، والتحقق منها بيحصل وقت الطلب لا وقت الـ prerender.
  await expect(page.getByText("خروج", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "التوافر والأسعار" })).toBeVisible();
  expect(errors.filter((text) => text.includes("unstable value `new Date()`"))).toEqual([]);
});
