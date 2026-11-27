import {
  CANCEL_POLICIES,
  CITIES,
  DRIVER_SUBSCRIPTION_LABELS,
  PAYMENT_COPY,
  PROPERTY_TYPES,
  TRANSPORT_TYPES,
} from "./constants";
import type {
  Availability,
  Booking,
  CityKey,
  DriverProfile,
  NewPropertyInput,
  NewVehicleInput,
  Property,
  PropertyType,
  TransportType,
  Vehicle,
  VehicleUpdateInput,
} from "./types";

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const str = (value: unknown, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;
const num = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const nullableNum = (value: unknown) =>
  value == null ? null : num(value);
const strArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];

const cityAr = (city: CityKey) => CITIES[city]?.ar ?? city;
const moderationAr = (status: string) =>
  ({ DRAFT: "مسودة", PENDING: "قيد المراجعة", PUBLISHED: "منشور", REJECTED: "مرفوض" })[status] ?? status;

/** بيانات المالك: بتشمل اسم الضيف لأنه صاحب الوحدة، لكن مش الإيميل أو التليفون. */
export function publicOwnerProperty(property: Property) {
  return {
    id: property.id,
    slug: property.slug,
    name: property.name,
    type: property.type,
    typeAr: PROPERTY_TYPES[property.type]?.ar ?? property.type,
    city: property.city,
    cityAr: cityAr(property.city),
    address: property.address,
    description: property.description,
    images: property.images,
    amenities: property.amenities,
    maxGuests: property.maxGuests,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    basePrice: property.basePrice,
    commissionRate: property.commissionRate,
    status: property.status,
    statusAr: moderationAr(property.status),
    rating: property.rating,
    reviewCount: property.reviewCount,
  };
}

export function publicOwnerBooking(booking: Booking) {
  return {
    reference: booking.reference,
    propertyName: booking.propertyName,
    propertySlug: booking.propertySlug,
    cityAr: cityAr(booking.city),
    guestName: booking.guestName,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    guests: booking.guests,
    total: booking.total,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod,
    createdAt: booking.createdAt,
    paymentCopy: PAYMENT_COPY,
  };
}

export function ownerSummary(properties: Property[], bookings: Booking[]) {
  const rated = properties.filter((property) => property.rating > 0);
  return {
    properties: properties.length,
    published: properties.filter((property) => property.status === "PUBLISHED").length,
    draft: properties.filter((property) => property.status === "DRAFT").length,
    bookings: bookings.length,
    activeBookings: bookings.filter(
      (booking) => booking.status === "CONFIRMED" || booking.status === "PENDING",
    ).length,
    newRequests: bookings.filter((booking) => booking.status === "PENDING").length,
    rating: rated.length
      ? Math.round((rated.reduce((sum, property) => sum + property.rating, 0) / rated.length) * 10) / 10
      : 0,
    reviews: properties.reduce((sum, property) => sum + property.reviewCount, 0),
  };
}

export function publicVehicle(vehicle: Vehicle) {
  return {
    id: vehicle.id,
    name: vehicle.name,
    type: vehicle.type,
    typeAr: TRANSPORT_TYPES[vehicle.type]?.ar ?? vehicle.type,
    city: vehicle.city,
    cityAr: cityAr(vehicle.city),
    plateNumber: vehicle.plateNumber,
    model: vehicle.model,
    capacity: vehicle.capacity,
    pricePerTrip: vehicle.pricePerTrip,
    routeFrom: vehicle.routeFrom,
    routeTo: vehicle.routeTo,
    meetingPoint: vehicle.meetingPoint,
    durationHours: vehicle.durationHours,
    includes: vehicle.includes,
    licenseDocUrl: vehicle.licenseDocUrl,
    status: vehicle.status,
    statusAr: moderationAr(vehicle.status),
    isPaused: Boolean(vehicle.isPaused),
    blockedDates: vehicle.blockedDates ?? [],
    createdAt: vehicle.createdAt,
  };
}

export function publicDriverProfile(profile: DriverProfile) {
  return {
    userId: profile.userId,
    name: profile.name,
    phone: profile.phone,
    city: profile.city,
    cityAr: cityAr(profile.city),
    subscriptionStatus: profile.subscriptionStatus,
    subscriptionAr:
      DRIVER_SUBSCRIPTION_LABELS[profile.subscriptionStatus]?.ar ?? profile.subscriptionStatus,
    verificationStatus: profile.verificationStatus,
    note: profile.note,
    submittedAt: profile.submittedAt,
    reviewedAt: profile.reviewedAt,
    idFront: profile.idFront,
    idBack: profile.idBack,
    licenseDocUrl: profile.licenseDocUrl,
  };
}

/** الرحلة مشتركة من الحجز الموجود؛ مفيش جدول Trip جديد. */
export function publicDriverTrip(booking: Booking) {
  const detail = booking.transport;
  if (!detail) return null;
  return {
    id: booking.id,
    reference: booking.reference,
    name: detail.transportName,
    type: detail.type,
    typeAr: TRANSPORT_TYPES[detail.type]?.ar ?? detail.type,
    cityAr: cityAr(booking.city),
    from: detail.routeFrom,
    to: detail.routeTo,
    meetingPoint: detail.meetingPoint,
    date: booking.checkIn,
    durationHours: detail.durationHours,
    guests: detail.guests,
    capacity: detail.capacity,
    pricePerTrip: detail.pricePerTrip,
    total: detail.total,
    plateNumber: detail.plateNumber ?? null,
    driverName: detail.driverName ?? null,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    createdAt: booking.createdAt,
    paymentCopy: PAYMENT_COPY,
  };
}

export function driverSummary(
  profile: DriverProfile | null,
  vehicles: Vehicle[],
  trips: Booking[],
  today: string,
) {
  return {
    subscriptionStatus: profile?.subscriptionStatus ?? "NONE",
    subscriptionAr: profile
      ? DRIVER_SUBSCRIPTION_LABELS[profile.subscriptionStatus]?.ar ?? profile.subscriptionStatus
      : "غير مشترك",
    verified: profile?.verificationStatus === "APPROVED",
    vehicles: vehicles.length,
    available: vehicles.filter((vehicle) => !vehicle.isPaused && vehicle.status === "PUBLISHED").length,
    trips: trips.length,
    todayTrips: trips.filter((booking) => booking.checkIn === today).length,
    upcomingTrips: trips.filter(
      (booking) => booking.status === "CONFIRMED" || booking.status === "PENDING",
    ).length,
  };
}

export function parseNewProperty(body: unknown, ownerId: string): ParseResult<NewPropertyInput> {
  if (!isRecord(body)) return { ok: false, error: "بيانات الوحدة غير صالحة." };

  const name = str(body.name);
  const type = str(body.type);
  const city = str(body.city);
  const address = str(body.address);
  const cancelPolicy = str(body.cancelPolicy, "FREE_48H");
  const basePrice = num(body.basePrice);
  const maxGuests = num(body.maxGuests);
  const bedrooms = num(body.bedrooms);

  if (name.length < 2) return { ok: false, error: "أدخل اسم الوحدة." };
  if (!(type in PROPERTY_TYPES)) return { ok: false, error: "نوع الوحدة غير صالح." };
  if (!(city in CITIES)) return { ok: false, error: "المدينة غير صالحة." };
  if (address.length < 2) return { ok: false, error: "أدخل عنوان الوحدة." };
  if (basePrice <= 0) return { ok: false, error: "أدخل سعراً صحيحاً." };
  if (maxGuests < 1 || maxGuests > 50) return { ok: false, error: "عدد الضيوف غير صالح." };
  if (bedrooms < 1) return { ok: false, error: "عدد غرف النوم غير صالح." };
  if (!(cancelPolicy in CANCEL_POLICIES)) return { ok: false, error: "سياسة الإلغاء غير صالحة." };

  return {
    ok: true,
    value: {
      ownerId,
      name,
      type: type as PropertyType,
      city: city as CityKey,
      address,
      description: str(body.description),
      lat: num(body.lat),
      lng: num(body.lng),
      images: strArray(body.images),
      videoUrl: nullableStr(body.videoUrl),
      amenities: strArray(body.amenities),
      maxGuests,
      bedrooms,
      bathrooms: Math.max(1, num(body.bathrooms, 1)),
      areaSqm: nullableNum(body.areaSqm),
      houseRules: nullableStr(body.houseRules),
      pickupLat: nullableNum(body.pickupLat),
      pickupLng: nullableNum(body.pickupLng),
      basePrice,
      cancelPolicy,
    },
  };
}

export function parsePropertyPatch(body: unknown, existing: Property): ParseResult<Omit<NewPropertyInput, "ownerId">> {
  const parsed = parseNewProperty({ ...existing, ...(isRecord(body) ? body : {}) }, existing.ownerId);
  if (!parsed.ok) return parsed;
  const { ownerId: _ownerId, ...patch } = parsed.value;
  void _ownerId;
  return { ok: true, value: patch };
}

export function parseNewVehicle(body: unknown, driverId: string): ParseResult<NewVehicleInput> {
  if (!isRecord(body)) return { ok: false, error: "بيانات المركبة غير صالحة." };

  const name = str(body.name);
  const type = str(body.type);
  const city = str(body.city);
  const cancelPolicy = str(body.cancelPolicy, "FREE_24H");
  const plateNumber = str(body.plateNumber);
  const model = str(body.model);
  const capacity = num(body.capacity);
  const pricePerTrip = num(body.pricePerTrip);
  const durationHours = num(body.durationHours);
  const licenseDocUrl = str(body.licenseDocUrl);

  if (name.length < 2) return { ok: false, error: "أدخل اسم المركبة." };
  if (!(type in TRANSPORT_TYPES)) return { ok: false, error: "نوع المركبة غير صالح." };
  if (!(city in CITIES)) return { ok: false, error: "المدينة غير صالحة." };
  if (plateNumber.length < 2) return { ok: false, error: "أدخل رقم اللوحة." };
  if (model.length < 2) return { ok: false, error: "أدخل طراز المركبة." };
  if (capacity < 1 || capacity > 60) return { ok: false, error: "عدد المقاعد غير صالح." };
  if (pricePerTrip <= 0) return { ok: false, error: "أدخل أجرة صحيحة." };
  if (durationHours < 1 || durationHours > 48) return { ok: false, error: "مدة الرحلة غير صالحة." };
  if (!licenseDocUrl) return { ok: false, error: "أدخل رابط مستند المركبة." };

  return {
    ok: true,
    value: {
      driverId,
      name,
      type: type as TransportType,
      city: city as CityKey,
      plateNumber,
      model,
      capacity,
      pricePerTrip,
      routeFrom: str(body.routeFrom),
      routeTo: str(body.routeTo),
      meetingPoint: str(body.meetingPoint),
      durationHours,
      includes: strArray(body.includes),
      cancelPolicy,
      licenseDocUrl,
    },
  };
}

export function parseVehiclePatch(body: unknown, existing: Vehicle): ParseResult<VehicleUpdateInput> {
  const patch: VehicleUpdateInput = {
    name: existing.name,
    type: existing.type,
    city: existing.city,
    plateNumber: existing.plateNumber,
    model: existing.model,
    capacity: existing.capacity,
    pricePerTrip: existing.pricePerTrip,
    routeFrom: existing.routeFrom,
    routeTo: existing.routeTo,
    meetingPoint: existing.meetingPoint,
    durationHours: existing.durationHours,
    includes: [...existing.includes],
    cancelPolicy: existing.cancelPolicy,
    licenseDocUrl: existing.licenseDocUrl,
    blockedDates: [...(existing.blockedDates ?? [])],
  };

  if (!isRecord(body)) return { ok: true, value: patch };

  const parsed = parseNewVehicle({ ...existing, ...body }, existing.driverId);
  if (!parsed.ok) return parsed;
  const value = parsed.value;
  return {
    ok: true,
    value: {
      ...patch,
      name: value.name,
      type: value.type,
      city: value.city,
      plateNumber: value.plateNumber,
      model: value.model,
      capacity: value.capacity,
      pricePerTrip: value.pricePerTrip,
      routeFrom: value.routeFrom,
      routeTo: value.routeTo,
      meetingPoint: value.meetingPoint,
      durationHours: value.durationHours,
      includes: value.includes,
      cancelPolicy: value.cancelPolicy,
      licenseDocUrl: value.licenseDocUrl,
      blockedDates: Array.isArray(body.blockedDates)
        ? strArray(body.blockedDates).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)).slice(0, 180)
        : patch.blockedDates,
    },
  };
}

export function parseAvailability(body: unknown): ParseResult<Availability[]> {
  const rows = isRecord(body) && Array.isArray(body.rows) ? body.rows : body;
  if (!Array.isArray(rows) || rows.length > 180) {
    return { ok: false, error: "جدول التوافر غير صالح." };
  }

  const result: Availability[] = [];
  for (const row of rows) {
    if (!isRecord(row)) return { ok: false, error: "جدول التوافر غير صالح." };
    const date = str(row.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { ok: false, error: "صيغة التاريخ غير صالحة." };
    }
    result.push({
      date,
      isBlocked: Boolean(row.isBlocked),
      priceOverride: row.priceOverride == null ? null : num(row.priceOverride),
    });
  }
  return { ok: true, value: result };
}

function nullableStr(value: unknown): string | null {
  return value == null ? null : str(value) || null;
}
