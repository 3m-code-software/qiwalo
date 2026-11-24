"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { clearSession, createSession, getSession, requireRole, type Session } from "@/lib/auth";
import { sendBookingNotifications, sendReviewNotice } from "@/lib/notifications";
import { quoteStay } from "@/lib/pricing";
import { getRepo } from "@/lib/repo";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  BookingStatus, CityKey, ModerationStatus, PaymentMethod, PropertyType,
  ReviewStatus, Role, VerificationStatus,
} from "@/lib/types";

export interface FormState { error?: string; ok?: string }

const COORDS: Record<CityKey, { lat: number; lng: number }> = {
  LUXOR: { lat: 25.6872, lng: 32.6396 },
  ASWAN: { lat: 24.0889, lng: 32.8998 },
};

function safeNext(value: FormDataEntryValue | null): string {
  const path = String(value ?? "");
  return path.startsWith("/") && !path.startsWith("//") ? path : "";
}

function redirectForRole(next: string, role: Role): never {
  redirect(next || (role === "ADMIN" ? "/admin" : role === "OWNER" ? "/owner" : "/"));
}

function authError(message: string): FormState {
  if (message.includes("Invalid login credentials")) return { error: "البريد أو كلمة المرور غير صحيحة." };
  if (message.includes("User already registered")) return { error: "الحساب موجود بالفعل — سجّل الدخول بدلاً من ذلك." };
  if (message.includes("Password should be at least")) return { error: "كلمة المرور يجب ألا تقل عن 6 أحرف." };
  if (message.includes("Email not confirmed")) return { error: "لازم تأكيد البريد الإلكتروني أولاً." };
  if (message.includes("fetch failed") || message.includes("fetch")) return { error: "تعذّر الاتصال بخدمة الدخول. حاول مرة ثانية." };
  return { error: "حصل خطأ في الدخول. حاول مرة ثانية." };
}

async function assertOwnerOf(session: Session, propertyId: string) {
  const repo = await getRepo();
  const property = await repo.getPropertyById(propertyId);
  if (!property) return null;
  if (session.role !== "ADMIN" && property.ownerId !== session.email) return null;
  return property;
}

function isoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

// ===== Auth =====

export async function signInAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "أدخل بريداً إلكترونياً صحيحاً." };
  if (!password) return { error: "أدخل كلمة المرور." };

  const repo = await getRepo();

  if (!isSupabaseConfigured()) {
    const user = await repo.getUserByEmail(email);
    if (!user) return { error: "هذا الحساب غير موجود. أنشئ حساباً أولاً." };
    await createSession({ email: user.email, name: user.name, role: user.role });
    redirectForRole(safeNext(form.get("next")), user.role);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return authError(error.message);

  const user = await repo.getUserByEmail(email);
  if (!user) {
    await supabase.auth.signOut();
    return { error: "هذا الحساب غير مسجّل في قيوالو. تواصل مع الدعم." };
  }
  redirectForRole(safeNext(form.get("next")), user.role);
}

export async function signUpAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const requested = String(form.get("role") ?? "GUEST");
  const accepted = String(form.get("terms") ?? "") === "on";
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "أدخل بريداً إلكترونياً صحيحاً." };
  if (name.length < 2) return { error: "أدخل اسمك الكامل." };
  if (password.length < 6) return { error: "كلمة المرور يجب ألا تقل عن 6 أحرف." };
  if (!accepted) return { error: "لازم توافق على شروط الاستخدام." };

  const role: Role = requested === "OWNER" ? "OWNER" : "GUEST";
  const termsAcceptedAt = new Date().toISOString();
  const repo = await getRepo();

  if (!isSupabaseConfigured()) {
    await repo.upsertUser({ email, name, role, termsAcceptedAt });
    await createSession({ email, name, role });
    redirectForRole(safeNext(form.get("next")), role);
  }

  if (await repo.getUserByEmail(email)) {
    return { error: "هذا البريد مسجّل بالفعل — سجّل الدخول بدلاً من ذلك." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });
  if (error) return authError(error.message);

  await repo.upsertUser({ email, name, role, termsAcceptedAt });
  redirectForRole(safeNext(form.get("next")), role);
}

export async function requestPasswordResetAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "أدخل بريداً إلكترونياً صحيحاً." };
  if (!isSupabaseConfigured()) return { error: "استعادة كلمة المرور متاحة في النسخة المنشورة فقط." };

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "qiwalo-ygzh.vercel.app";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${protocol}://${host}/reset-password`,
  });
  if (error) return authError(error.message);
  return { ok: "لو البريد مسجّل، هتوصلك رسالة استعادة كلمة المرور." };
}

export async function acceptTermsAction(form: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login?next=" + encodeURIComponent(safeNext(form.get("next")) || "/"));
  await getRepo().then((repo) => repo.setTermsAccepted(session.email, new Date().toISOString()));
  revalidatePath("/", "layout");
  redirect(safeNext(form.get("next")) || "/");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  await clearSession();
  redirect("/");
}

// ===== Owner units =====

export async function createPropertyAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    return { error: "سجّل الدخول كصاحب وحدة أولاً." };
  }

  const name = String(form.get("name") ?? "").trim();
  const city = String(form.get("city") ?? "LUXOR") as CityKey;
  const type = String(form.get("type") ?? "APARTMENT") as PropertyType;
  const address = String(form.get("address") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const basePrice = Number(form.get("basePrice"));
  const maxGuests = Number(form.get("maxGuests"));
  const bedrooms = Number(form.get("bedrooms"));
  const bathrooms = Number(form.get("bathrooms")) || 1;
  const areaSqm = Number(form.get("areaSqm")) || null;
  const houseRules = String(form.get("houseRules") ?? "").trim() || null;
  const amenities = form.getAll("amenities").map(String);

  if (name.length < 3) return { error: "اسم الوحدة قصير جداً." };
  if (!address || !description) return { error: "العنوان والوصف مطلوبان." };
  if (!Number.isFinite(basePrice) || basePrice < 100) return { error: "أدخل سعر ليلة صحيحاً." };
  if (!Number.isFinite(maxGuests) || maxGuests < 1) return { error: "عدد الضيوف غير صحيح." };
  if (!Number.isFinite(bedrooms) || bedrooms < 1) return { error: "عدد غرف النوم غير صحيح." };

  const images = [...new Set(
    form.getAll("images")
      .flatMap((value) => String(value).split(/[\n,]+/))
      .map((s) => s.trim())
      .filter((s) => s.startsWith("https://")),
  )].slice(0, 8);
  if (images.length === 0) images.push("https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80");

  const pickupLatRaw = String(form.get("pickupLat") ?? "").trim();
  const pickupLngRaw = String(form.get("pickupLng") ?? "").trim();
  const repo = await getRepo();
  const property = await repo.createProperty({
    ownerId: session.email, name, city, type, address, description,
    lat: Number(form.get("lat")) || COORDS[city].lat,
    lng: Number(form.get("lng")) || COORDS[city].lng,
    pickupLat: pickupLatRaw ? Number(pickupLatRaw) : null,
    pickupLng: pickupLngRaw ? Number(pickupLngRaw) : null,
    images, videoUrl: String(form.get("videoUrl") ?? "").trim() || null,
    amenities, maxGuests, bedrooms, bathrooms, areaSqm, houseRules, basePrice,
    cancelPolicy: String(form.get("cancelPolicy") ?? "FREE_48H"),
  });
  revalidatePath("/owner");
  redirect(`/owner/units/${property.id}/preview`);
}

export async function submitPropertyForReviewAction(form: FormData): Promise<void> {
  const session = await requireRole("OWNER");
  const id = String(form.get("id") ?? "");
  if (!await assertOwnerOf(session, id)) return;
  const repo = await getRepo();
  await repo.moderateProperty(id, "PENDING" as ModerationStatus);
  revalidatePath("/owner");
  revalidatePath("/admin");
  redirect("/owner?created=1");
}

export async function moderatePropertyAction(form: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as ModerationStatus;
  if (!id || !["PUBLISHED", "REJECTED", "DRAFT"].includes(status)) return;
  await (await getRepo()).moderateProperty(id, status);
  revalidatePath("/admin");
  revalidatePath("/owner");
  revalidatePath("/search");
}

// ===== Availability & price rules =====

export async function saveAvailabilityAction(form: FormData): Promise<void> {
  const session = await requireRole("OWNER");
  const propertyId = String(form.get("propertyId") ?? "");
  const startDate = String(form.get("startDate") ?? "");
  const endDate = String(form.get("endDate") ?? "");
  if (!await assertOwnerOf(session, propertyId)) return;
  if (!isoDate(startDate) || !isoDate(endDate) || endDate < startDate) return;
  const priceOverride = Number(form.get("priceOverride"));
  const rows = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) }).map((day) => ({
    date: format(day, "yyyy-MM-dd"),
    isBlocked: String(form.get("isBlocked") ?? "") === "on",
    priceOverride: Number.isFinite(priceOverride) && priceOverride > 0 ? priceOverride : null,
  }));
  await (await getRepo()).saveAvailability(propertyId, rows);
  revalidatePath("/owner/calendar");
  revalidatePath("/search");
}

export async function createPriceRuleAction(form: FormData): Promise<void> {
  const session = await requireRole("OWNER");
  const propertyId = String(form.get("propertyId") ?? "");
  if (!await assertOwnerOf(session, propertyId)) return;
  const name = String(form.get("name") ?? "").trim();
  const startDate = String(form.get("startDate") ?? "");
  const endDate = String(form.get("endDate") ?? "");
  const price = Number(form.get("price"));
  const minNights = Number(form.get("minNights")) || 1;
  if (!name || !isoDate(startDate) || !isoDate(endDate) || endDate < startDate || price < 100) return;
  await (await getRepo()).createPriceRule(propertyId, { name, startDate, endDate, price, minNights });
  revalidatePath("/owner/calendar");
}

export async function deletePriceRuleAction(form: FormData): Promise<void> {
  const session = await requireRole("OWNER");
  const propertyId = String(form.get("propertyId") ?? "");
  if (!await assertOwnerOf(session, propertyId)) return;
  await (await getRepo()).deletePriceRule(propertyId, String(form.get("ruleId") ?? ""));
  revalidatePath("/owner/calendar");
}

// ===== Booking =====

export async function confirmBookingAction(_prev: FormState, form: FormData): Promise<FormState> {
  const slug = String(form.get("slug") ?? "");
  const checkIn = String(form.get("checkIn") ?? "");
  const checkOut = String(form.get("checkOut") ?? "");
  const guests = Number(form.get("guests") ?? 1);
  const fullName = String(form.get("fullName") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const phone = String(form.get("phone") ?? "").trim();
  const nationality = String(form.get("nationality") ?? "").trim();
  const paymentMethod: PaymentMethod = String(form.get("paymentMethod") ?? "CASH") === "BANK" ? "BANK" : "CASH";
  const accepted = String(form.get("terms") ?? "") === "on";
  if (!fullName || !/^\S+@\S+\.\S+$/.test(email)) return { error: "الاسم والبريد الإلكتروني مطلوبان." };
  if (!nationality) return { error: "أدخل الجنسية." };
  if (!accepted) return { error: "لازم توافق على شروط الضيوف قبل الحجز." };

  const repo = await getRepo();
  const property = await repo.getPropertyBySlug(slug);
  if (!property) return { error: "الوحدة غير موجودة." };
  const [availability, rules] = await Promise.all([repo.getAvailability(property.id), repo.getPriceRules(property.id)]);
  const result = quoteStay(property, rules, availability, checkIn, checkOut);
  if (!result.ok) return { error: "التواريخ غير متاحة. اختار مواعيد تانية." };

  const session = await getSession();
  const guestEmail = session?.email ?? email;
  const termsAcceptedAt = new Date().toISOString();
  if (!session) {
    await repo.upsertUser({
      email, name: fullName, role: "GUEST", phone, nationality, termsAcceptedAt,
    });
  } else {
    await repo.setTermsAccepted(guestEmail, termsAcceptedAt);
  }

  const booking = await repo.createBooking({
    propertyId: property.id, guestId: guestEmail, guestName: fullName,
    checkIn, checkOut, guests,
    subtotal: result.quote.subtotal, serviceFee: result.quote.serviceFee,
    commission: result.quote.commission, total: result.quote.total, provider: "MANUAL",
    nationality, paymentMethod, termsAcceptedAt,
  });
  await repo.updateBooking(booking.reference, { status: "CONFIRMED", paymentStatus: "PENDING" });

  const owner = await repo.getUserByEmail(property.ownerId);
  await sendBookingNotifications({
    booking, property, guestEmail, guestPhone: phone, ownerEmail: owner?.email,
  });
  await repo.updateBooking(booking.reference, { adminNotifiedAt: new Date().toISOString() });

  revalidatePath("/owner");
  revalidatePath("/admin");
  redirect(`/booking/${booking.reference}`);
}

export async function createGuestAccountAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const reference = String(form.get("reference") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const repo = await getRepo();
  const booking = await repo.getBookingByReference(reference);
  if (!booking || booking.guestId !== email) return { error: "البريد لا يطابق بيانات الحجز." };
  if (password.length < 6) return { error: "كلمة المرور يجب ألا تقل عن 6 أحرف." };
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email, password, options: { data: { name: name || booking.guestName, role: "GUEST" } },
    });
    if (error && !error.message.includes("User already registered")) return authError(error.message);
    if (error) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) return { error: "الحساب موجود. سجّل الدخول بكلمة المرور الصحيحة." };
    }
    await repo.upsertUser({ email, name: name || booking.guestName, role: "GUEST" });
  }
  await createSession({ email, name: name || booking.guestName, role: "GUEST" });
  redirect(`/booking/${reference}?account=1`);
}

export async function updateBookingStatusAction(form: FormData): Promise<void> {
  await requireRole("ADMIN");
  const reference = String(form.get("reference") ?? "");
  const status = String(form.get("status") ?? "") as BookingStatus;
  if (!["CONFIRMED", "CANCELLED", "COMPLETED"].includes(status)) return;
  await (await getRepo()).updateBooking(reference, { status });
  revalidatePath("/admin");
  revalidatePath("/owner");
  revalidatePath(`/booking/${reference}`);
}

// ===== Reviews =====

export async function submitReviewAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "سجّل الدخول لتقييم إقامتك." };
  const reference = String(form.get("reference") ?? "");
  const rating = Number(form.get("rating"));
  const comment = String(form.get("comment") ?? "").trim();
  const repo = await getRepo();
  const booking = await repo.getBookingByReference(reference);
  if (!booking || booking.guestId !== session.email) return { error: "هذا الحجز ليس مرتبطاً بحسابك." };
  if (booking.status !== "COMPLETED") return { error: "يمكن التقييم بعد اكتمال الإقامة فقط." };
  if (rating < 1 || rating > 5 || comment.length < 5) return { error: "اختر تقييماً واكتب تعليقاً من 5 حروف على الأقل." };
  const existing = (await repo.listAllReviews()).find((r) => r.bookingId === booking.id);
  if (existing) return { error: "تم تقييم هذا الحجز بالفعل." };

  await repo.createReview({
    propertyId: booking.propertyId, guestId: session.email, guestName: booking.guestName,
    bookingId: booking.id, rating, comment,
  });
  await sendReviewNotice(booking.propertyName, rating, comment);
  revalidatePath(`/stay/${booking.propertySlug}`);
  revalidatePath("/admin");
  redirect(`/booking/${reference}?review=1`);
}

export async function moderateReviewAction(form: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as ReviewStatus;
  if (!["PUBLISHED", "HIDDEN"].includes(status)) return;
  await (await getRepo()).moderateReview(id, status);
  revalidatePath("/admin");
  revalidatePath("/search");
}

// ===== Owner verification & commission =====

export async function submitVerificationAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    return { error: "سجّل الدخول كصاحب وحدة أولاً." };
  }
  const phoneAlt = String(form.get("phoneAlt") ?? "").trim() || null;
  const nationality = String(form.get("nationality") ?? "").trim() || null;
  const day = Number(form.get("birthDay"));
  const month = Number(form.get("birthMonth"));
  const year = Number(form.get("birthYear"));
  const idFront = String(form.get("idFront") ?? "").trim();
  const idBack = String(form.get("idBack") ?? "").trim();
  const termsAcceptedAt = String(form.get("terms") ?? "") === "on" ? new Date().toISOString() : null;
  if (!idFront.startsWith("https://") || !idBack.startsWith("https://")) {
    return { error: "ارفع صورتي وجه وظهر البطاقة." };
  }
  if (!termsAcceptedAt) return { error: "لازم توافق على شروط المالك." };
  let birthDate: string | null = null;
  if (day && month && year) {
    birthDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const age = Math.floor((Date.now() - new Date(`${birthDate}T00:00:00Z`).getTime()) / (365.25 * 86400000));
    if (age < 18 || age > 100) return { error: "تاريخ الميلاد غير صحيح (العمر لازم يكون 18 سنة أو أكثر)." };
  }
  const requestedRate = Number(form.get("commissionRate"));
  const commissionRate = Number.isFinite(requestedRate) && requestedRate >= 0 && requestedRate <= 50 ? requestedRate : 12;

  await (await getRepo()).createVerification({
    userId: session.email, phoneAlt, nationality, birthDate, idFront, idBack,
    commissionRate, termsAcceptedAt,
  });
  revalidatePath("/owner");
  revalidatePath("/admin");
  redirect("/owner/profile?verified=1");
}

export async function submitSelfieAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "سجّل الدخول أولاً." };
  const selfie = String(form.get("selfie") ?? "").trim();
  if (!selfie.startsWith("https://")) return { error: "ارفع صورة شخصية واضحة." };
  const verification = await (await getRepo()).getVerification(session.email);
  if (!verification || verification.status !== "SELFIE_REQUIRED") {
    return { error: "السيلفي مطلوب بعد الموافقة المبدئية فقط." };
  }
  await (await getRepo()).setSelfie(session.email, selfie);
  revalidatePath("/owner/profile");
  revalidatePath("/admin");
  redirect("/owner/profile?selfie=1");
}

export async function moderateVerificationAction(form: FormData): Promise<void> {
  await requireRole("ADMIN");
  const userId = String(form.get("userId") ?? "");
  const status = String(form.get("status") ?? "") as VerificationStatus;
  if (!["SELFIE_REQUIRED", "SELFIE_PENDING", "APPROVED", "REJECTED"].includes(status)) return;
  await (await getRepo()).moderateVerification(userId, status, String(form.get("note") ?? "").trim() || null);
  revalidatePath("/admin");
  revalidatePath("/owner/profile");
}

export async function setCommissionRateAction(form: FormData): Promise<void> {
  await requireRole("ADMIN");
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const rate = Number(form.get("rate"));
  if (!email || !Number.isFinite(rate) || rate < 0 || rate > 100) return;
  await (await getRepo()).setOwnerCommissionRate(email, rate);
  revalidatePath("/admin");
  revalidatePath("/owner");
  revalidatePath("/search");
}
