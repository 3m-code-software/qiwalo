import { expect, test, type APIRequestContext } from "@playwright/test";

const OWNER = "owner@qiwalo.test";
const DRIVER = "driver@qiwalo.test";
const GUEST = "guest@qiwalo.test";
const PASSWORD = "Qiwalo123";

async function login(request: APIRequestContext, email: string, password = PASSWORD): Promise<string> {
  const response = await request.post("/api/mobile/auth/login", {
    data: { email, password },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.user.email).toBe(email);
  return body.token as string;
}

function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// يعمل على Mock فقط: مفيش Supabase ولا كتابة في قاعدة الإنتاج.
test("BFF الأدوار: الدخول يرفض الباسورد القصير والضيف ويمنح توكن للمالك والسائق", async ({ request }) => {
  const short = await request.post("/api/mobile/auth/login", {
    data: { email: OWNER, password: "123" },
  });
  expect(short.status()).toBe(400);
  expect((await short.json()).error).toBe("invalid_request");

  const bad = await request.post("/api/mobile/auth/login", {
    data: { email: OWNER, password: "WrongPassword1" },
  });
  expect(bad.status()).toBe(401);

  const guest = await request.post("/api/mobile/auth/login", {
    data: { email: GUEST, password: PASSWORD },
  });
  expect(guest.status()).toBe(403);
  expect((await guest.json()).error).toBe("forbidden");

  expect((await login(request, OWNER)).length).toBeGreaterThan(20);
  expect((await login(request, DRIVER)).length).toBeGreaterThan(20);
});

test("BFF الأدوار: المالك يقرأ ملخصه ووحداته وحجوزاته، والوصول بدون توكن أو بدور آخر مرفوض", async ({ request }) => {
  const ownerToken = await login(request, OWNER);

  const summary = await request.get("/api/mobile/owner/summary", { headers: bearer(ownerToken) });
  expect(summary.status()).toBe(200);
  const summaryBody = await summary.json();
  expect(summaryBody.ok).toBe(true);
  expect(summaryBody.user.role).toBe("OWNER");
  expect(summaryBody.summary.published).toBeGreaterThan(0);

  const properties = await request.get("/api/mobile/owner/properties", { headers: bearer(ownerToken) });
  expect(properties.status()).toBe(200);
  expect((await properties.json()).properties.length).toBeGreaterThan(0);

  const bookings = await request.get("/api/mobile/owner/bookings", { headers: bearer(ownerToken) });
  expect(bookings.status()).toBe(200);
  const bookingsBody = await bookings.json();
  expect(bookingsBody.readOnly).toBe(true);
  expect(bookingsBody.bookings.length).toBeGreaterThan(0);
  expect(bookingsBody.bookings[0].guestName).toBeTruthy();
  expect(bookingsBody.bookings[0].guestPhone).toBeUndefined();

  const anonymous = await request.get("/api/mobile/owner/properties");
  expect(anonymous.status()).toBe(401);
  expect((await anonymous.json()).error).toBe("unauthorized");

  const driverToken = await login(request, DRIVER);
  const forbidden = await request.get("/api/mobile/owner/summary", { headers: bearer(driverToken) });
  expect(forbidden.status()).toBe(403);
  expect((await forbidden.json()).error).toBe("forbidden");
});

test("BFF الأدوار: المالك ينشئ وحدة ويعدّلها ويتحقق من التوافر مع رفض البيانات الناقصة", async ({ request }) => {
  const token = await login(request, OWNER);
  const name = `وحدة اختبار ${Date.now()}`;

  const invalid = await request.post("/api/mobile/owner/properties", {
    headers: bearer(token),
    data: { name: "س", city: "CAIRO", basePrice: -1 },
  });
  expect(invalid.status()).toBe(400);
  expect((await invalid.json()).error).toBe("validation_error");

  const created = await request.post("/api/mobile/owner/properties", {
    headers: bearer(token),
    data: {
      name, type: "APARTMENT", city: "LUXOR", address: "الكورنيش", description: "وحدة اختبار",
      lat: 25.7, lng: 32.6, images: [], amenities: ["واي فاي"], maxGuests: 3,
      bedrooms: 1, bathrooms: 1, basePrice: 900, cancelPolicy: "FREE_48H",
    },
  });
  expect(created.status()).toBe(201);
  const property = (await created.json()).property;
  expect(property.name).toBe(name);
  expect(property.statusAr).toBeTruthy();

  const patched = await request.patch(`/api/mobile/owner/properties/${property.id}`, {
    headers: bearer(token),
    data: { basePrice: 1050 },
  });
  expect(patched.status()).toBe(200);
  expect((await patched.json()).property.basePrice).toBe(1050);

  const availability = await request.patch(`/api/mobile/owner/properties/${property.id}/availability`, {
    headers: bearer(token),
    data: { rows: [{ date: "2027-01-10", isBlocked: true, priceOverride: 1200 }] },
  });
  expect(availability.status()).toBe(200);
  const rows = (await availability.json()).availability;
  expect(rows.find((row: { date: string }) => row.date === "2027-01-10").isBlocked).toBe(true);

  const detail = await request.get(`/api/mobile/owner/properties/${property.id}`, { headers: bearer(token) });
  expect(detail.status()).toBe(200);
});

test("BFF الأدوار: السائق يقرأ ملفه ومركبته ورحلته، ويوقف المركبة مع منع دور المالك", async ({ request }) => {
  const driverToken = await login(request, DRIVER);

  const summary = await request.get("/api/mobile/driver/summary", { headers: bearer(driverToken) });
  expect(summary.status()).toBe(200);
  const summaryBody = await summary.json();
  expect(summaryBody.summary.trips).toBeGreaterThan(0);

  const profile = await request.get("/api/mobile/driver/profile", { headers: bearer(driverToken) });
  expect(profile.status()).toBe(200);
  expect((await profile.json()).profile.cityAr).toBe("الأقصر");

  const vehicles = await request.get("/api/mobile/driver/vehicles", { headers: bearer(driverToken) });
  expect(vehicles.status()).toBe(200);
  const vehicle = (await vehicles.json()).vehicles[0];
  expect(vehicle.plateNumber).toBe("LXR-1234");

  const trips = await request.get("/api/mobile/driver/trips", { headers: bearer(driverToken) });
  expect(trips.status()).toBe(200);
  const trip = (await trips.json()).trips[0];
  expect(trip.from).toBe("الأقصر الشرقية");
  expect(trip.to).toBe("وادي الملوك");

  const detail = await request.get(`/api/mobile/driver/trips/${trip.id}`, { headers: bearer(driverToken) });
  expect(detail.status()).toBe(200);
  expect((await detail.json()).trip.reference).toBe(trip.reference);

  const paused = await request.patch(`/api/mobile/driver/vehicles/${vehicle.id}/pause`, {
    headers: bearer(driverToken),
    data: { paused: true },
  });
  expect(paused.status()).toBe(200);
  expect((await paused.json()).vehicle.isPaused).toBe(true);

  const resumed = await request.patch(`/api/mobile/driver/vehicles/${vehicle.id}/pause`, {
    headers: bearer(driverToken),
    data: { paused: false },
  });
  expect(resumed.status()).toBe(200);
  expect((await resumed.json()).vehicle.isPaused).toBe(false);

  const ownerToken = await login(request, OWNER);
  const forbidden = await request.get("/api/mobile/driver/trips", { headers: bearer(ownerToken) });
  expect(forbidden.status()).toBe(403);
});
