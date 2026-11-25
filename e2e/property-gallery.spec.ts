import { expect, test } from "@playwright/test";

const STAY_URL = "/stay/nile-view-dar-al-madina";

test("المعرض: صورة كبيرة ومصغرات تفتح لايت بوكس أصلي بالعدّاد والأسهم", async ({ page }) => {
  await page.goto(STAY_URL);
  await expect(page.getByTestId("gallery-main")).toBeVisible();
  await expect(page.getByTestId("gallery-thumb-1")).toBeVisible();
  await expect(page.getByTestId("gallery-thumb-2")).toBeVisible();

  const mainAlt = await page.getByTestId("gallery-main").locator("img").getAttribute("alt");
  expect(mainAlt).toContain("صورة لوحدة");

  await page.getByTestId("gallery-main").click();
  const dialog = page.getByTestId("gallery-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId("gallery-counter")).toHaveText("١ / ٣");
  await expect(dialog.getByTestId("gallery-stage").locator("img")).toHaveAttribute("alt", /صورة لوحدة/);

  await dialog.getByRole("button", { name: "الصورة التالية" }).click();
  await expect(dialog.getByTestId("gallery-counter")).toHaveText("٢ / ٣");
  await expect(dialog.getByTestId("gallery-stage").locator("img")).toHaveAttribute("alt", /صورة رقم ٢/);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("المصغرات تفتح عند الصورة المطلوبة والأسهم تلتفّ للطرف التاني", async ({ page }) => {
  await page.goto(STAY_URL);
  await page.getByTestId("gallery-thumb-2").click();
  const dialog = page.getByTestId("gallery-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId("gallery-counter")).toHaveText("٣ / ٣");

  await dialog.getByRole("button", { name: "الصورة التالية" }).click();
  await expect(dialog.getByTestId("gallery-counter")).toHaveText("١ / ٣");
  await dialog.getByRole("button", { name: "الصورة السابقة" }).click();
  await expect(dialog.getByTestId("gallery-counter")).toHaveText("٣ / ٣");

  await page.keyboard.press("ArrowLeft");
  await expect(dialog.getByTestId("gallery-counter")).toHaveText("١ / ٣");
  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByTestId("gallery-counter")).toHaveText("٣ / ٣");

  await dialog.getByRole("button", { name: "إغلاق المعرض" }).click();
  await expect(dialog).toBeHidden();
});

test("على Pixel 7: اللابت بوكس جوه الشاشة والسحب يغيّر الصورة", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto(STAY_URL);
  await page.getByTestId("gallery-main").click();
  const dialog = page.getByTestId("gallery-dialog");
  await expect(dialog).toBeVisible();

  const fits = await dialog.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return box.width <= window.innerWidth && element.scrollWidth <= element.clientWidth + 1;
  });
  expect(fits).toBeTruthy();
  const closeBox = await dialog.getByRole("button", { name: "إغلاق المعرض" }).boundingBox();
  expect(closeBox?.width).toBeGreaterThanOrEqual(44);
  expect(closeBox?.height).toBeGreaterThanOrEqual(44);

  const swipe = async (fromX: number, toX: number) => {
    await page.evaluate(
      ({ fromX, toX }) => {
        const stage = document.querySelector('[data-testid="gallery-stage"]')!;
        const touch = (x: number) => new Touch({ identifier: 1, target: stage, clientX: x, clientY: 300 });
        stage.dispatchEvent(
          new TouchEvent("touchstart", { bubbles: true, touches: [touch(fromX)], changedTouches: [touch(fromX)] }),
        );
        stage.dispatchEvent(
          new TouchEvent("touchend", { bubbles: true, touches: [], changedTouches: [touch(toX)] }),
        );
      },
      { fromX, toX },
    );
  };

  const counter = dialog.getByTestId("gallery-counter");
  await swipe(300, 150);
  await expect(counter).toHaveText("٢ / ٣");
  await swipe(150, 300);
  await expect(counter).toHaveText("١ / ٣");
});
