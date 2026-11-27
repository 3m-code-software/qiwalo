import { expect, test } from "@playwright/test";
import { dateAfter, newPhone } from "./helpers";

const SLUG = "nile-view-dar-al-madina";

function payload(overrides: Record<string, unknown> = {}) {
  return {
    slug: SLUG,
    checkIn: dateAfter(165),
    checkOut: dateAfter(168),
    guests: 2,
    fullName: "أحمد محمد",
    email: "mobile-guest@qiwalo.test",
    phone: newPhone(),
    nationality: "مصري",
    paymentMethod: "CASH",
    termsAccepted: true,
    ...overrides,
  };
}

// يعمل في وضع Mock (DATABASE_URL فارغ في playwright.config.ts) — لا بيانات حقيقية ولا أسرار.
test("BFF الموبايل: التسعير من الخادم قبل الحجز", async ({ request }) => {
  const response = await request.post("/api/mobile/bookings/quote", {
    data: payload(),
  });
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.quote.nights).toBe(3);
  expect(body.quote.nightly).toHaveLength(3);
  expect(body.quote.subtotal).toBe(body.quote.nightly.reduce((sum: number, row: { price: number }) => sum + row.price, 0));
  expect(body.quote.serviceFee).toBe(0);
  expect(body.quote.total).toBe(body.quote.subtotal);
  expect(body.quote.grandTotal).toBe(body.quote.total);
  expect(body.quote.addOns).toEqual([]);
  expect(body.quote.paymentCopy).toBe("تحويل بنكي أو كاش عند الوصول");

  const badDates = await request.post("/api/mobile/bookings/quote", {
    data: payload({ checkIn: dateAfter(165), checkOut: dateAfter(164) }),
  });
  expect(badDates.status()).toBe(400);
  expect((await badDates.json()).error).toBe("invalid_dates");
});

test("BFF الموبايل: إنشاء حجز مؤكد ثم قراءته برقم المرجع", async ({ request }) => {
  const idempotencyKey = `qw-e2e-${Date.now()}`;
  const data = payload({ checkIn: dateAfter(171), checkOut: dateAfter(174) });

  // التسعير قبل التأكيد لازم يساوي إجمالي الحجز اللي هيترجع بعد الإنشاء.
  const quoted = await request.post("/api/mobile/bookings/quote", { data });
  expect(quoted.status()).toBe(200);
  const expectedTotal = (await quoted.json()).quote.grandTotal;

  const created = await request.post("/api/mobile/bookings", {
    data,
    headers: { "idempotency-key": idempotencyKey },
  });
  expect(created.status()).toBe(201);
  const createdBody = await created.json();
  expect(createdBody.ok).toBe(true);
  expect(createdBody.booking.reference).toMatch(/^QW-[A-Z0-9]+-[A-Z0-9]{4}$/);
  expect(createdBody.booking).toMatchObject({
    propertyName: "دار المدينة بإطلالة على النيل",
    cityAr: "الأقصر",
    nights: 3,
    guests: 2,
    status: "CONFIRMED",
    paymentStatus: "PENDING",
    paymentMethod: "CASH",
    paymentCopy: "تحويل بنكي أو كاش عند الوصول",
    support: { phone: "01066094050" },
    pagePath: `/booking/${createdBody.booking.reference}`,
  });
  // بيانات الضيف الشخصية لا تخرج في استجابة الموبايل.
  expect(createdBody.booking).not.toHaveProperty("guestName");
  expect(createdBody.booking).not.toHaveProperty("guestEmail");
  expect(JSON.stringify(createdBody)).not.toContain(data.phone);

  expect(expectedTotal).toBe(createdBody.booking.total);

  const lookup = await request.get(`/api/mobile/bookings/${createdBody.booking.reference}`);
  expect(lookup.status()).toBe(200);
  expect((await lookup.json()).booking.reference).toBe(createdBody.booking.reference);

  const replay = await request.post("/api/mobile/bookings", {
    data,
    headers: { "idempotency-key": idempotencyKey },
  });
  expect(replay.status()).toBe(200);
  const replayBody = await replay.json();
  expect(replayBody.reused).toBe(true);
  expect(replayBody.booking.reference).toBe(createdBody.booking.reference);

  const missing = await request.get("/api/mobile/bookings/QW-DOES-NOT-EXIST");
  expect(missing.status()).toBe(404);
});

test("BFF الموبايل: رفض البيانات الناقصة ورقم التليفون المستعمل", async ({ request }) => {
  const takenPhone = newPhone();
  const first = await request.post("/api/mobile/bookings", {
    data: payload({
      checkIn: dateAfter(175),
      checkOut: dateAfter(178),
      email: "mobile-owner-of-phone@qiwalo.test",
      phone: takenPhone,
    }),
  });
  expect(first.status()).toBe(201);

  const duplicate = await request.post("/api/mobile/bookings", {
    data: payload({
      checkIn: dateAfter(165),
      checkOut: dateAfter(168),
      email: "mobile-other@qiwalo.test",
      phone: takenPhone,
    }),
  });
  expect(duplicate.status()).toBe(409);
  expect((await duplicate.json()).error).toBe("phone_taken");

  const invalid = await request.post("/api/mobile/bookings", {
    data: payload({
      checkIn: dateAfter(165),
      checkOut: dateAfter(168),
      phone: "123",
      termsAccepted: false,
    }),
  });
  expect(invalid.status()).toBe(400);
  expect((await invalid.json()).note).toBe("أدخل رقم هاتف صحيحاً.");
});
