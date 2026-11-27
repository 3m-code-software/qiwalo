import { overlapsBlockedDates } from "@/lib/availability";
import {
  CITIES,
  PAYMENT_COPY,
  SUPPORT_PHONE,
  SUPPORT_TELEGRAM,
  SUPPORT_WHATSAPP,
} from "@/lib/constants";
import { toArabicDigits } from "@/lib/format";
import { sendBookingNotifications } from "@/lib/notifications";
import { quoteStay, type NightPrice, type Quote } from "@/lib/pricing";
import { getRepo } from "@/lib/repo";
import type {
  Booking,
  ExperienceBookingDetail,
  PackageBookingDetail,
  PaymentMethod,
  Property,
  TransportBookingDetail,
} from "@/lib/types";

export interface StaySelection {
  slug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  packageId?: string;
  experienceId?: string;
  transportId?: string;
}

export interface BookingRequest extends StaySelection {
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  paymentMethod: PaymentMethod;
  termsAccepted: boolean;
  /** الويب فقط: الجلسة موجودة؛ الموبايل ضيف بدون جلسة فيبعت undefined. */
  sessionEmail?: string;
}

export type ServiceError = { ok: false; error: string; code?: string };
export type BookingResult = ServiceError | { ok: true; booking: Booking; quote: Quote };
export type QuoteResult = ServiceError | { ok: true; quote: PublicQuote };

export interface PublicQuote {
  nights: number;
  nightly: NightPrice[];
  subtotal: number;
  serviceFee: number;
  commission: number;
  total: number;
  addOns: Array<{ id: string; label: string; amount: number }>;
  grandTotal: number;
  paymentCopy: string;
}

export const PHONE_TAKEN =
  "رقم التليفون مسجّل بحساب تاني. استخدم رقم غير أو سجّل الدخول بالبريد المرتبط بيه.";
const DATES_ERROR = "التواريخ غير متاحة. اختار مواعيد تانية.";

/** رقم واحد لحساب واحد — نفس الدالة للويب والموبايل. */
export function normalizePhoneInput(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("20")) {
    return `0${digits.slice(2)}`;
  }
  return digits;
}

export async function phoneInUseError(
  phone: string,
  email: string,
): Promise<string | null> {
  const owner = await (await getRepo()).getUserByPhone(phone);
  return owner && owner.email !== email ? PHONE_TAKEN : null;
}

/** الحاجز الأخير عند التزامن هو الـ unique index في قاعدة البيانات. */
export function isPhoneConflict(error: unknown): boolean {
  if (error instanceof Error && error.message === "PHONE_TAKEN") return true;
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }
  if ((error as { code?: unknown }).code !== "P2002") return false;
  const meta = (error as { meta?: unknown }).meta;
  return /phone/i.test(JSON.stringify(meta ?? ""));
}

/** منع تكرار الحجز لو الموبايل أعاد إرسال نفس الطلب بعد انقطاع الشبكة. */
const recentBookings = new Map<string, { reference: string; expiresAt: number }>();

export function rememberBooking(idempotencyKey: string, reference: string): void {
  if (!idempotencyKey) return;
  recentBookings.set(idempotencyKey, {
    reference,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });
  for (const [key, value] of recentBookings) {
    if (value.expiresAt < Date.now()) recentBookings.delete(key);
  }
}

export function recallBookingReference(idempotencyKey: string): string | null {
  if (!idempotencyKey) return null;
  const hit = recentBookings.get(idempotencyKey);
  if (!hit || hit.expiresAt < Date.now()) {
    recentBookings.delete(idempotencyKey);
    return null;
  }
  return hit.reference;
}

interface PreparedStay {
  property: Property;
  guests: number;
  quote: Quote;
  packageDetail: PackageBookingDetail | null;
  experienceDetail: ExperienceBookingDetail | null;
  transportDetail: TransportBookingDetail | null;
}

/**
 * التحقق والتسعير من جانب الخادم فقط. العميل يرسل تواريخ وعدد ضيوف ومعرّفات
 * إضافات، ولا يرسل أي أسعار — الأسعار تحسب هنا دائماً.
 */
async function prepareStay(selection: StaySelection): Promise<
  { ok: true; stay: PreparedStay } | ServiceError
> {
  const guests = Number.isFinite(selection.guests)
    ? Math.floor(selection.guests)
    : 0;
  if (!Number.isInteger(guests) || guests < 1) {
    return { ok: false, error: "عدد الضيوف غير صالح." };
  }

  const repo = await getRepo();
  const property = await repo.getPropertyBySlug(selection.slug.trim());
  if (!property || property.status !== "PUBLISHED") {
    return { ok: false, error: "الوحدة غير موجودة." };
  }
  if (guests > property.maxGuests) {
    return {
      ok: false,
      error: `عدد الضيوف أكبر من سعة الوحدة (${toArabicDigits(property.maxGuests)}).`,
    };
  }

  const [availability, rules] = await Promise.all([
    repo.getAvailability(property.id),
    repo.getPriceRules(property.id),
  ]);
  const priced = quoteStay(
    property,
    rules,
    availability,
    selection.checkIn,
    selection.checkOut,
  );
  if (!priced.ok) {
    if (priced.reason === "min_nights") {
      return {
        ok: false,
        code: priced.reason,
        error: `الحد الأدنى للحجز في هذه الفترة ${toArabicDigits(priced.minNights ?? 1)} ليالٍ.`,
      };
    }
    return { ok: false, code: priced.reason, error: DATES_ERROR };
  }
  const { quote } = priced;

  let packageDetail: PackageBookingDetail | null = null;
  const packageId = selection.packageId?.trim() ?? "";
  if (packageId) {
    const pkg = await repo.getPackageById(packageId);
    if (
      !pkg ||
      pkg.status !== "PUBLISHED" ||
      pkg.city !== property.city ||
      pkg.propertyId !== property.id
    ) {
      return { ok: false, error: "الباقة غير متاحة لهذه الوحدة." };
    }
    if (guests > pkg.capacity) {
      return {
        ok: false,
        error: `عدد الضيوف أكبر من سعة الباقة (${toArabicDigits(pkg.capacity)}).`,
      };
    }
    const packageTransport = await repo.getTransportById(pkg.transportId);
    if (
      packageTransport &&
      overlapsBlockedDates(
        selection.checkIn,
        selection.checkOut,
        packageTransport.blockedDates,
      )
    ) {
      return {
        ok: false,
        error: "الباقة غير متاحة: النقل المحدد محجوز في أحد الأيام.",
      };
    }
    const packageTotal = pkg.pricePerNight * quote.nights;
    packageDetail = {
      packageId: pkg.id,
      packageName: pkg.name,
      city: pkg.city,
      propertyId: pkg.propertyId,
      propertyName: pkg.propertyName,
      experienceId: pkg.experienceId,
      experienceName: pkg.experienceName,
      transportId: pkg.transportId,
      transportName: pkg.transportName,
      capacity: pkg.capacity,
      pricePerNight: pkg.pricePerNight,
      nights: quote.nights,
      guests,
      total: packageTotal,
      commission: Math.round(packageTotal * (pkg.commissionRate / 100)),
    };
  }

  let experienceDetail: ExperienceBookingDetail | null = null;
  const experienceId = selection.experienceId?.trim() ?? "";
  if (experienceId) {
    const experience = await repo.getExperienceById(experienceId);
    if (
      !experience ||
      experience.status !== "PUBLISHED" ||
      experience.city !== property.city
    ) {
      return { ok: false, error: "تجربة السفاري غير متاحة لهذه الوحدة." };
    }
    if (guests > experience.capacity) {
      return {
        ok: false,
        error: `عدد الضيوف أكبر من سعة تجربة السفاري (${toArabicDigits(experience.capacity)}).`,
      };
    }
    const experienceTotal = experience.pricePerPerson * guests;
    experienceDetail = {
      experienceId: experience.id,
      experienceName: experience.name,
      category: experience.category,
      city: experience.city,
      mountain: experience.mountain,
      meetingPoint: experience.meetingPoint,
      durationHours: experience.durationHours,
      pricePerPerson: experience.pricePerPerson,
      guests,
      total: experienceTotal,
      commission: Math.round(experienceTotal * (experience.commissionRate / 100)),
    };
  }

  let transportDetail: TransportBookingDetail | null = null;
  const transportId = selection.transportId?.trim() ?? "";
  if (transportId) {
    const transport = await repo.getTransportById(transportId);
    if (
      !transport ||
      transport.status !== "PUBLISHED" ||
      transport.city !== property.city
    ) {
      return { ok: false, error: "خدمة النقل غير متاحة لهذه الوحدة." };
    }
    if (guests > transport.capacity) {
      return {
        ok: false,
        error: `عدد الضيوف أكبر من سعة النقل (${toArabicDigits(transport.capacity)}).`,
      };
    }
    if (
      overlapsBlockedDates(
        selection.checkIn,
        selection.checkOut,
        transport.blockedDates,
      )
    ) {
      return {
        ok: false,
        error: "المركبة غير متاحة: أحد الأيام محجوز في جدول السائق.",
      };
    }
    transportDetail = {
      transportId: transport.id,
      transportName: transport.name,
      type: transport.type,
      city: transport.city,
      routeFrom: transport.routeFrom,
      routeTo: transport.routeTo,
      meetingPoint: transport.meetingPoint,
      durationHours: transport.durationHours,
      capacity: transport.capacity,
      pricePerTrip: transport.pricePerTrip,
      guests,
      total: transport.pricePerTrip,
      commission: Math.round(transport.pricePerTrip * (transport.commissionRate / 100)),
      driverName: transport.driverName ?? null,
      plateNumber: transport.plateNumber ?? null,
      driverId: transport.driverId ?? null,
      vehicleId: transport.vehicleId ?? null,
    };
  }

  return {
    ok: true,
    stay: { property, guests, quote, packageDetail, experienceDetail, transportDetail },
  };
}

function publicQuote(stay: PreparedStay): PublicQuote {
  const addOns: PublicQuote["addOns"] = [];
  if (stay.packageDetail) {
    addOns.push({
      id: stay.packageDetail.packageId,
      label: stay.packageDetail.packageName,
      amount: stay.packageDetail.total,
    });
  }
  if (stay.experienceDetail) {
    addOns.push({
      id: stay.experienceDetail.experienceId,
      label: stay.experienceDetail.experienceName,
      amount: stay.experienceDetail.total,
    });
  }
  if (stay.transportDetail) {
    addOns.push({
      id: stay.transportDetail.transportId,
      label: stay.transportDetail.transportName,
      amount: stay.transportDetail.total,
    });
  }
  return {
    nights: stay.quote.nights,
    nightly: stay.quote.nightly,
    subtotal: stay.quote.subtotal,
    serviceFee: stay.quote.serviceFee,
    commission: stay.quote.commission,
    total: stay.quote.total,
    addOns,
    grandTotal:
      stay.quote.total +
      addOns.reduce((sum, item) => sum + item.amount, 0),
    paymentCopy: PAYMENT_COPY,
  };
}

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function textField(
  obj: Record<string, unknown>,
  key: string,
  maxLength: number,
): string {
  const value = obj[key];
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

/** قراءة آمنة لبيانات الموبايل — الأسعار لا تُقرأ من الطلب إطلاقاً. */
export function parseStayBody(
  value: unknown,
): { ok: true; selection: StaySelection } | ServiceError {
  const obj = asObject(value);
  if (!obj) return { ok: false, error: "بيانات الطلب غير صالحة." };
  return {
    ok: true,
    selection: {
      slug: textField(obj, "slug", 160),
      checkIn: textField(obj, "checkIn", 10),
      checkOut: textField(obj, "checkOut", 10),
      guests: Number(obj.guests ?? 1),
      packageId: textField(obj, "packageId", 100),
      experienceId: textField(obj, "experienceId", 100),
      transportId: textField(obj, "transportId", 100),
    },
  };
}

export function parseBookingBody(
  value: unknown,
  sessionEmail?: string,
): { ok: true; request: BookingRequest } | ServiceError {
  const parsed = parseStayBody(value);
  if (!parsed.ok) return parsed;
  const obj = asObject(value)!;
  return {
    ok: true,
    request: {
      ...parsed.selection,
      fullName: textField(obj, "fullName", 120),
      email: textField(obj, "email", 200).toLowerCase(),
      phone: textField(obj, "phone", 30),
      nationality: textField(obj, "nationality", 80),
      paymentMethod:
        textField(obj, "paymentMethod", 10) === "BANK" ? "BANK" : "CASH",
      termsAccepted: obj.termsAccepted === true,
      sessionEmail,
    },
  };
}

/** تسعير للقراءة فقط — يستخدمه BFF الموبايل قبل تأكيد الحجز. */
export async function quoteStayForMobile(
  selection: StaySelection,
): Promise<QuoteResult> {
  const prepared = await prepareStay(selection);
  if (!prepared.ok) return prepared;
  return { ok: true, quote: publicQuote(prepared.stay) };
}

/**
 * المنطق الوحيد لإنشاء حجز مؤكد. بتستخدمه_pages الويب Server Action والموبايل BFF،
 * فمفيش قواعد مكررة في Dart ولا في route منفصل. الأسعار متحسبش من أي مدخل عميل.
 */
export async function createPublishedBooking(
  input: BookingRequest,
): Promise<BookingResult> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = normalizePhoneInput(input.phone);
  const nationality = input.nationality.trim();
  const paymentMethod: PaymentMethod =
    input.paymentMethod === "BANK" ? "BANK" : "CASH";

  if (!fullName || !/^\S+@\S+\.\S+$/.test(email)) {
    return { ok: false, error: "الاسم والبريد الإلكتروني مطلوبان." };
  }
  if (!/^01\d{9}$/.test(phone)) {
    return { ok: false, error: "أدخل رقم هاتف صحيحاً." };
  }
  if (!nationality) return { ok: false, error: "أدخل الجنسية." };
  if (!input.termsAccepted) {
    return { ok: false, error: "لازم توافق على شروط الضيوف قبل الحجز." };
  }

  const stayResult = await prepareStay(input);
  if (!stayResult.ok) return stayResult;
  const { stay } = stayResult;
  const { quote, property, guests } = stay;

  const guestEmail = input.sessionEmail || email;
  const termsAcceptedAt = new Date().toISOString();
  if (!input.sessionEmail) {
    const duplicate = await phoneInUseError(phone, email);
    if (duplicate) return { ok: false, error: duplicate, code: "phone_taken" };
    try {
      await (await getRepo()).upsertUser({
        email,
        name: fullName,
        role: "GUEST",
        phone,
        nationality,
        termsAcceptedAt,
      });
    } catch (error) {
      if (isPhoneConflict(error)) {
        return { ok: false, error: PHONE_TAKEN, code: "phone_taken" };
      }
      throw error;
    }
  } else {
    await (await getRepo()).setTermsAccepted(guestEmail, termsAcceptedAt);
  }

  const repo = await getRepo();
  let booking = await repo.createBooking({
    propertyId: property.id,
    guestId: guestEmail,
    guestName: fullName,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests,
    subtotal: quote.subtotal,
    serviceFee: quote.serviceFee,
    commission:
      quote.commission +
      (stay.packageDetail?.commission ?? 0) +
      (stay.experienceDetail?.commission ?? 0) +
      (stay.transportDetail?.commission ?? 0),
    total:
      quote.total +
      (stay.packageDetail?.total ?? 0) +
      (stay.experienceDetail?.total ?? 0) +
      (stay.transportDetail?.total ?? 0),
    provider: "MANUAL",
    nationality,
    paymentMethod,
    termsAcceptedAt,
    experience: stay.experienceDetail,
    transport: stay.transportDetail,
    package: stay.packageDetail,
  });
  booking = await repo.updateBooking(booking.reference, {
    status: "CONFIRMED",
    paymentStatus: "PENDING",
  });

  const owner = await repo.getUserByEmail(property.ownerId);
  await sendBookingNotifications({
    booking,
    property,
    guestEmail,
    guestPhone: phone,
    ownerEmail: owner?.email,
  });
  booking = await repo.updateBooking(booking.reference, {
    adminNotifiedAt: new Date().toISOString(),
  });

  return { ok: true, booking, quote };
}

/** الشكل العام للحجز في BFF الموبايل — بدون هوية الضيف أو بياناته الشخصية. */
export function publicMobileBooking(booking: Booking) {
  return {
    reference: booking.reference,
    propertyName: booking.propertyName,
    cityAr: CITIES[booking.city].ar,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    guests: booking.guests,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod,
    total: booking.total,
    createdAt: booking.createdAt,
    paymentCopy: PAYMENT_COPY,
    support: {
      phone: SUPPORT_PHONE,
      whatsapp: SUPPORT_WHATSAPP,
      telegram: SUPPORT_TELEGRAM,
    },
    pagePath: `/booking/${booking.reference}`,
  };
}
