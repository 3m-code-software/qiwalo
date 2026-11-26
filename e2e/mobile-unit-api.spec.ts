import { expect, test } from "@playwright/test";

// يعمل في وضع Mock (DATABASE_URL فارغ في playwright.config.ts) — لا بيانات حقيقية ولا أسرار.
test("BFF الموبايل: تفاصيل وحدة منشورة كاملة للعرض في التطبيق", async ({ request }) => {
  const response = await request.get("/api/mobile/units/nile-view-dar-al-madina");
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.unit).toMatchObject({
    slug: "nile-view-dar-al-madina",
    name: "دار المدينة بإطلالة على النيل",
    cityAr: "الأقصر",
    typeAr: "شقة",
    currency: "EGP",
    host: "محمد مالك",
  });

  // اللي كان مفقود في معاينة التصميم: صور حقيقية، مرافق، وصف، تقييمات، توافر.
  expect(body.unit.images.length).toBeGreaterThan(0);
  expect(body.unit.images[0]).toMatch(/^https:\/\/images\.unsplash\.com\//);
  expect(body.unit.amenities).toContain("إطلالة على النيل");
  expect(body.unit.description).toContain("الكرنك");
  expect(body.unit.basePrice).toBe(1450);
  expect(body.reviews).toBeInstanceOf(Array);
  expect(body.availability.length).toBeGreaterThan(0);
  expect(body.priceRules).toBeInstanceOf(Array);
  expect(body.paymentCopy).toBe("تحويل بنكي أو كاش عند الوصول");
  expect(body.support.phone).toBe("01066094050");
  expect(body.pagePath).toBe("/stay/nile-view-dar-al-madina");
});

test("BFF الموبايل: الوحدة غير المنشورة وغير الموجودة لا تُكشف", async ({ request }) => {
  const pending = await request.get("/api/mobile/units/aswan-chalet-dam-view");
  expect(pending.status()).toBe(404);
  await expect.poll(async () => (await pending.json()).error).toBe("unit_not_found");

  const missing = await request.get("/api/mobile/units/unit-does-not-exist");
  expect(missing.status()).toBe(404);
  expect((await missing.json()).error).toBe("unit_not_found");
});
