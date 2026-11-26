"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { CITIES, DEFAULT_COMMISSION_RATE, DRIVER_SUBSCRIPTION_NOTICE, EXPERIENCE_CANCEL_POLICY, PACKAGE_CANCEL_POLICY, TRANSPORT_CANCEL_POLICY, TRANSPORT_TYPES } from "@/lib/constants";
import { toArabicDigits } from "@/lib/format";
import { clearSession, createSession, getSession, requireRole, type Session } from "@/lib/auth";
import { sendBookingNotifications, sendReviewNotice, sendSignupNotice, sendVerificationNotice } from "@/lib/notifications";
import { quoteStay } from "@/lib/pricing";
import { getRepo } from "@/lib/repo";
import { createTelegramActivationToken } from "@/lib/telegram";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  BookingStatus, CityKey, DriverSubscriptionStatus, ExperienceBookingDetail, ExperienceCategory, ExperienceDifficulty,
  ModerationStatus, PackageBookingDetail, PaymentMethod, PropertyType, PropertyUpdateInput, ReviewStatus, Role,
  TransportBookingDetail, TransportType, VerificationStatus,
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

function landingForRole(role: Role): string {
  if (role === "ADMIN") return "/admin";
  if (role === "OWNER") return "/owner";
  if (role === "DRIVER") return "/driver";
  return "/";
}

function redirectForRole(next: string, role: Role): never {
  redirect(next || landingForRole(role));
}

/** بعد التسجيل: إشعار للأدمن + رابط تفعيل تليجرام للعميل، ثم دخوله للواجهة المناسبة. */
async function finishSignup(input: {
  email: string;
  name: string;
  role: Role;
  phone: string;
  next: FormDataEntryValue | null;
}): Promise<never> {
  await sendSignupNotice({ name: input.name, phone: input.phone });
  const token = await createTelegramActivationToken({ email: input.email, name: input.name });
  const destination = safeNext(input.next) || landingForRole(input.role);
  return redirect(
    `/telegram?token=${encodeURIComponent(token)}&next=${encodeURIComponent(destination)}`,
  );
}

function authError(message: string): FormState {
  if (message.includes("Invalid login credentials")) return { error: "البريد أو كلمة المرور غير صحيحة." };
  if (message.includes("User already registered")) return { error: "الحساب موجود بالفعل — سجّل الدخول بدلاً من ذلك." };
  if (message.includes("Password should be at least")) return { error: "كلمة المرور يجب ألا تقل عن 6 أحرف." };
  if (message.includes("Email not confirmed")) return { error: "لازم تأكيد البريد الإلكتروني أولاً." };
  if (message.includes("For security purposes")) return { error: "طلبت الاستعادة مؤخراً — استنى شوية وجرّب تاني." };
  if (message.toLowerCase().includes("redirect")) return { error: "رابط الاستعادة غير مسموح — تواصل مع الدعم." };
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

function normalizePhone(value: FormDataEntryValue | null): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("20")) return `0${digits.slice(2)}`;
  return digits;
}

export async function signUpAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const phone = normalizePhone(form.get("phone"));
  const requested = String(form.get("role") ?? "GUEST");
  const accepted = String(form.get("terms") ?? "") === "on";
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "أدخل بريداً إلكترونياً صحيحاً." };
  if (name.length < 2) return { error: "أدخل اسمك الكامل." };
  if (!/^01\d{9}$/.test(phone)) return { error: "أدخل رقم تليفون مصري صحيح يبدأ بـ ٠١." };
  if (password.length < 6) return { error: "كلمة المرور يجب ألا تقل عن 6 أحرف." };
  if (!accepted) return { error: "لازم توافق على شروط الاستخدام." };

  const role: Role = requested === "OWNER" ? "OWNER" : requested === "DRIVER" ? "DRIVER" : "GUEST";
  const termsAcceptedAt = new Date().toISOString();
  const repo = await getRepo();

  if (!isSupabaseConfigured()) {
    await repo.upsertUser({ email, name, role, phone, termsAcceptedAt });
    await createSession({ email, name, role });
    return finishSignup({ email, name, role, phone, next: form.get("next") });
  }

  if (await repo.getUserByEmail(email)) {
    return { error: "هذا البريد مسجّل بالفعل — سجّل الدخول بدلاً من ذلك." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role, phone } },
  });
  if (error) return authError(error.message);

  await repo.upsertUser({ email, name, role, phone, termsAcceptedAt });
  return finishSignup({ email, name, role, phone, next: form.get("next") });
}

export async function requestPasswordResetAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "أدخل بريداً إلكترونياً صحيحاً." };
  if (!isSupabaseConfigured()) return { error: "استعادة كلمة المرور متاحة في النسخة المنشورة فقط." };

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "qiwalo-ygzh.vercel.app";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const supabase = await createSupabaseServerClient();
  // PKCE: الـ verifier اتبعت في كوكي من نفس المتصفح، فالصفحة تستبدل الكود مرة واحدة.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${protocol}://${host}/reset-password`,
  });
  if (error) return authError(error.message);
  return { ok: "لو البريد مسجّل، هتوصلك رسالة استعادة كلمة المرور. دور كمان في Spam / Promotions." };
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

type ParsedProperty = { error: string } | { input: PropertyUpdateInput };

/** قراءة وتحقق نموذج الوحدة، مشتركة بين الإنشاء والتعديل. */
function parsePropertyForm(form: FormData): ParsedProperty {
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

  return {
    input: {
      name, city, type, address, description,
      lat: Number(form.get("lat")) || COORDS[city].lat,
      lng: Number(form.get("lng")) || COORDS[city].lng,
      pickupLat: pickupLatRaw ? Number(pickupLatRaw) : null,
      pickupLng: pickupLngRaw ? Number(pickupLngRaw) : null,
      images, videoUrl: String(form.get("videoUrl") ?? "").trim() || null,
      amenities, maxGuests, bedrooms, bathrooms, areaSqm, houseRules, basePrice,
      cancelPolicy: String(form.get("cancelPolicy") ?? "FREE_48H"),
    },
  };
}

export async function createPropertyAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    return { error: "سجّل الدخول كصاحب وحدة أولاً." };
  }

  const parsed = parsePropertyForm(form);
  if ("error" in parsed) return { error: parsed.error };

  const repo = await getRepo();
  const property = await repo.createProperty({ ownerId: session.email, ...parsed.input });
  revalidatePath("/owner");
  redirect(`/owner/units/${property.id}/preview`);
}

/** ينسخ تفاصيل الوحدة في مسودة جديدة، من غير التوفر أو الحجوزات أو التقييمات. */
export async function duplicatePropertyAction(form: FormData): Promise<void> {
  const session = await requireRole("OWNER");
  const id = String(form.get("id") ?? "");
  const source = await assertOwnerOf(session, id);
  if (!source) redirect("/owner");

  const repo = await getRepo();
  const copy = await repo.createProperty({
    ownerId: source.ownerId,
    name: `${source.name} (نسخة)`,
    type: source.type,
    city: source.city,
    address: source.address,
    description: source.description,
    lat: source.lat,
    lng: source.lng,
    pickupLat: source.pickupLat,
    pickupLng: source.pickupLng,
    images: [...source.images],
    videoUrl: source.videoUrl,
    amenities: [...source.amenities],
    maxGuests: source.maxGuests,
    bedrooms: source.bedrooms,
    bathrooms: source.bathrooms,
    areaSqm: source.areaSqm,
    houseRules: source.houseRules,
    basePrice: source.basePrice,
    commissionRate: source.commissionRate,
    cancelPolicy: source.cancelPolicy,
  });
  revalidatePath("/owner");
  revalidatePath(`/owner/units/${copy.id}/preview`);
  redirect(`/owner/units/${copy.id}/preview?copied=1`);
}

/** تعديل وحدة موجودة في مكانها؛ السلوج والحالة والعمولة مش بيتغيروا هنا. */
export async function updatePropertyAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    return { error: "سجّل الدخول كصاحب وحدة أولاً." };
  }

  const id = String(form.get("id") ?? "");
  const source = await assertOwnerOf(session, id);
  if (!source) return { error: "الوحدة مش موجودة أو مش ملكك." };

  const parsed = parsePropertyForm(form);
  if ("error" in parsed) return { error: parsed.error };

  const repo = await getRepo();
  const updated = await repo.updateProperty(id, parsed.input);
  if (!updated) return { error: "تعذّر حفظ التعديلات. حاول مرة تانية." };

  // الوحدة المنشورة لازم ترجع للمراجعة بعد أي تعديل جوهرية.
  if (source.status === "PUBLISHED") await repo.moderateProperty(id, "PENDING" as ModerationStatus);

  revalidatePath("/owner");
  revalidatePath(`/owner/units/${id}/preview`);
  revalidatePath("/search");
  revalidatePath(`/stay/${updated.slug}`);
  redirect(`/owner/units/${id}/preview?updated=${source.status === "PUBLISHED" ? "review" : "1"}`);
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

export async function moderatePropertyAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await requireRole("ADMIN");
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as ModerationStatus;
  if (!id || !["PUBLISHED", "REJECTED", "DRAFT", "PENDING"].includes(status)) {
    return { error: "تعذّر تحديث الوحدة. حاول مرة أخرى." };
  }
  const repo = await getRepo();
  const property = await repo.getPropertyById(id);
  await repo.moderateProperty(id, status);
  await repo.logActivity({
    actorEmail: session.email,
    actorName: session.name,
    action: status === "PUBLISHED" ? "PROPERTY_PUBLISHED"
      : status === "REJECTED" ? "PROPERTY_REJECTED"
      : status === "DRAFT" ? "PROPERTY_DRAFT" : "PROPERTY_PENDING",
    target: id,
    detail: property?.name ?? id,
  });
  revalidatePath("/admin");
  revalidatePath("/owner");
  revalidatePath("/search");
  return {
    ok: status === "PUBLISHED"
      ? "تم نشر الوحدة بنجاح ✅"
      : status === "REJECTED"
        ? "تم رفض الوحدة ✅"
        : status === "PENDING"
          ? "تمت إعادة الوحدة للمراجعة ✅"
          : "تم تحديث الوحدة ✅",
  };
}

// ===== Mountain safari experiences =====

export async function createExperienceAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await requireRole("OWNER");
  const name = String(form.get("name") ?? "").trim();
  const category = String(form.get("category") ?? "MOUNTAIN_SAFARI") as ExperienceCategory;
  const city = String(form.get("city") ?? "") as CityKey;
  const mountain = String(form.get("mountain") ?? "").trim();
  const meetingPoint = String(form.get("meetingPoint") ?? "").trim();
  const durationHours = Number(form.get("durationHours"));
  const capacity = Number(form.get("capacity"));
  const pricePerPerson = Number(form.get("pricePerPerson"));
  const difficulty = String(form.get("difficulty") ?? "MODERATE") as ExperienceDifficulty;
  const bestSeason = String(form.get("bestSeason") ?? "").trim();
  const licenseDocUrl = String(form.get("licenseDocUrl") ?? "").trim();
  const includes = [...new Set(
    form.getAll("includes").flatMap((value) => String(value).split(/[\n,]+/)).map((s) => s.trim()).filter(Boolean),
  )].slice(0, 8);

  if (name.length < 3 || !mountain || !meetingPoint || !bestSeason) {
    return { error: "اسم التجربة والمسار أو الجبل ونقطة اللقاء والموسم مطلوبة." };
  }
  if (category !== "MOUNTAIN_SAFARI" && category !== "MOTORCYCLE_TOUR") {
    return { error: "نوع التجربة غير صحيح." };
  }
  if (city !== "LUXOR" && city !== "ASWAN") return { error: "اختر مدينة صحيحة." };
  if (!Number.isFinite(durationHours) || durationHours < 1 || durationHours > 24) {
    return { error: "مدة الرحلة لازم تكون بين ١ و٢٤ ساعة." };
  }
  if (!Number.isFinite(capacity) || capacity < 1 || capacity > 100) return { error: "السعة غير صحيحة." };
  if (!Number.isFinite(pricePerPerson) || pricePerPerson < 50) return { error: "أدخل سعر صحيحاً للفرد." };
  if (!["EASY", "MODERATE", "HARD"].includes(difficulty)) return { error: "مستوى الصعوبة غير صحيح." };
  if (!licenseDocUrl.startsWith("https://")) return { error: "لازم رابط مستند المراجعة يبدأ بـ https://." };
  if (includes.length === 0) return { error: "اكتب على الأقل مشمول واحد للرحلة." };

  const repo = await getRepo();
  await repo.createExperience({
    ownerId: session.email, name, category, city, mountain, meetingPoint, durationHours, capacity,
    pricePerPerson, includes, difficulty, bestSeason, licenseDocUrl,
    cancelPolicy: String(form.get("cancelPolicy") ?? "").trim() || EXPERIENCE_CANCEL_POLICY,
  });
  revalidatePath("/owner");
  revalidatePath("/admin");
  redirect("/owner?experience=1");
}

export async function moderateExperienceAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await requireRole("ADMIN");
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as ModerationStatus;
  if (!id || !["PUBLISHED", "REJECTED", "DRAFT", "PENDING"].includes(status)) {
    return { error: "تعذّر تحديث التجربة. حاول مرة أخرى." };
  }
  const repo = await getRepo();
  const experience = await repo.getExperienceById(id);
  await repo.moderateExperience(id, status);
  await repo.logActivity({
    actorEmail: session.email,
    actorName: session.name,
    action: status === "PUBLISHED" ? "EXPERIENCE_PUBLISHED" : "EXPERIENCE_REJECTED",
    target: id,
    detail: experience?.name ?? id,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/experiences");
  revalidatePath("/owner");
  revalidatePath("/search");
  revalidatePath("/");
  const label = experience?.category === "MOTORCYCLE_TOUR" ? "جولة الموتوسيكلات" : "تجربة سفاري الجبال";
  return { ok: status === "PUBLISHED" ? `تم نشر ${label} ✅` : "تم تحديث التجربة ✅" };
}

// ===== Transport =====

export async function createTransportAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await requireRole("OWNER");
  const name = String(form.get("name") ?? "").trim();
  const type = String(form.get("type") ?? "") as TransportType;
  const city = String(form.get("city") ?? "") as CityKey;
  const routeFrom = String(form.get("routeFrom") ?? "").trim();
  const routeTo = String(form.get("routeTo") ?? "").trim();
  const meetingPoint = String(form.get("meetingPoint") ?? "").trim();
  const durationHours = Number(form.get("durationHours"));
  const capacity = Number(form.get("capacity"));
  const pricePerTrip = Number(form.get("pricePerTrip"));
  const licenseDocUrl = String(form.get("licenseDocUrl") ?? "").trim();
  const includes = [...new Set(
    form.getAll("includes").flatMap((value) => String(value).split(/[\n,]+/)).map((s) => s.trim()).filter(Boolean),
  )].slice(0, 8);

  if (name.length < 3 || !routeFrom || !routeTo || !meetingPoint) {
    return { error: "اسم الخدمة ونقطة الانطلاق والوصول ونقطة اللقاء مطلوبة." };
  }
  if (city !== "LUXOR" && city !== "ASWAN") return { error: "اختر مدينة صحيحة." };
  if (!["CAR", "COASTER", "BUS", "MOTORCYCLE"].includes(type)) return { error: "نوع النقل غير صحيح." };
  if (!Number.isFinite(durationHours) || durationHours < 1 || durationHours > 24) {
    return { error: "مدة الرحلة لازم تكون بين ١ و٢٤ ساعة." };
  }
  if (!Number.isFinite(capacity) || capacity < 1 || capacity > 100) return { error: "السعة غير صحيحة." };
  if (!Number.isFinite(pricePerTrip) || pricePerTrip < 50) return { error: "أدخل سعر صحيحاً للرحلة." };
  if (!licenseDocUrl.startsWith("https://")) return { error: "لازم رابط مستند المراجعة يبدأ بـ https://." };
  if (includes.length === 0) return { error: "اكتب على الأقل مشمول واحد للرحلة." };

  const repo = await getRepo();
  await repo.createTransport({
    ownerId: session.email, name, type, city, routeFrom, routeTo, meetingPoint,
    durationHours, capacity, pricePerTrip, includes, licenseDocUrl,
    cancelPolicy: String(form.get("cancelPolicy") ?? "").trim() || TRANSPORT_CANCEL_POLICY,
  });
  revalidatePath("/owner");
  revalidatePath("/admin");
  redirect("/owner?transport=1");
}

export async function moderateTransportAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await requireRole("ADMIN");
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as ModerationStatus;
  if (!id || !["PUBLISHED", "REJECTED", "DRAFT", "PENDING"].includes(status)) {
    return { error: "تعذّر تحديث النقل. حاول مرة أخرى." };
  }
  const repo = await getRepo();
  const transport = await repo.getTransportById(id);
  await repo.moderateTransport(id, status);
  await repo.logActivity({
    actorEmail: session.email,
    actorName: session.name,
    action: status === "PUBLISHED" ? "TRANSPORT_PUBLISHED" : "TRANSPORT_REJECTED",
    target: id,
    detail: transport?.name ?? id,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/transport");
  revalidatePath("/owner");
  revalidatePath("/search");
  revalidatePath("/");
  return { ok: status === "PUBLISHED" ? "تم نشر خدمة النقل ✅" : "تم تحديث النقل ✅" };
}

// ===== الباقات: وحدة + نقل + تجربة بسعر واحد للليلة =====

export async function createPackageAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await requireRole("OWNER");
  const name = String(form.get("name") ?? "").trim();
  const propertyId = String(form.get("propertyId") ?? "").trim();
  const experienceId = String(form.get("experienceId") ?? "").trim();
  const transportId = String(form.get("transportId") ?? "").trim();
  const capacity = Number(form.get("capacity"));
  const pricePerNight = Number(form.get("pricePerNight"));
  const licenseDocUrl = String(form.get("licenseDocUrl") ?? "").trim();
  const includes = [...new Set(
    form.getAll("includes").flatMap((value) => String(value).split(/[\n,]+/)).map((s) => s.trim()).filter(Boolean),
  )].slice(0, 8);

  if (name.length < 3) return { error: "اكتب اسم للباقة (٣ حروف على الأقل)." };
  if (includes.length === 0) return { error: "اكتب على الأقل مشمول واحد للباقة." };
  if (!licenseDocUrl.startsWith("https://")) return { error: "لازم رابط مستند المراجعة يبدأ بـ https://." };
  if (!Number.isFinite(capacity) || capacity < 1 || capacity > 100) return { error: "السعة غير صحيحة." };
  if (!Number.isFinite(pricePerNight) || pricePerNight < 100) return { error: "أدخل سعر صحيحاً للليلة." };

  const repo = await getRepo();
  const [property, experience, transport] = await Promise.all([
    repo.getPropertyById(propertyId), repo.getExperienceById(experienceId), repo.getTransportById(transportId),
  ]);
  if (!property || property.ownerId !== session.email || property.status !== "PUBLISHED") {
    return { error: "اختر وحدة منشورة تخصك أنت." };
  }
  if (!experience || experience.status !== "PUBLISHED" || experience.city !== property.city) {
    return { error: "التجربة المختارة غير متاحة لنفس مدينة الوحدة." };
  }
  if (!transport || transport.status !== "PUBLISHED" || transport.city !== property.city) {
    return { error: "خدمة النقل المختارة غير متاحة لنفس مدينة الوحدة." };
  }
  if (capacity > Math.min(property.maxGuests, experience.capacity, transport.capacity)) {
    return { error: "سعة الباقة أكبر من سعة الوحدة أو التجربة أو النقل المختارة." };
  }

  await repo.createPackage({
    ownerId: session.email, name, city: property.city, propertyId, experienceId, transportId,
    capacity, pricePerNight, includes, licenseDocUrl,
    cancelPolicy: String(form.get("cancelPolicy") ?? "").trim() || PACKAGE_CANCEL_POLICY,
  });
  revalidatePath("/owner");
  revalidatePath("/admin");
  redirect("/owner?package=1");
}

export async function moderatePackageAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await requireRole("ADMIN");
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as ModerationStatus;
  if (!id || !["PUBLISHED", "REJECTED", "DRAFT", "PENDING"].includes(status)) {
    return { error: "تعذّر تحديث الباقة. حاول مرة أخرى." };
  }
  const repo = await getRepo();
  const pkg = await repo.getPackageById(id);
  await repo.moderatePackage(id, status);
  await repo.logActivity({
    actorEmail: session.email,
    actorName: session.name,
    action: status === "PUBLISHED" ? "PACKAGE_PUBLISHED" : "PACKAGE_REJECTED",
    target: id,
    detail: pkg?.name ?? id,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/packages");
  revalidatePath("/owner");
  revalidatePath("/search");
  revalidatePath("/");
  return { ok: status === "PUBLISHED" ? "تم نشر الباقة ✅" : "تم تحديث الباقة ✅" };
}

// ===== السائقون والمركبات =====

export async function submitDriverVerificationAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session || session.role !== "DRIVER") return { error: "سجّل الدخول كسائق أولاً." };

  const city = String(form.get("city") ?? "") as CityKey;
  const idFront = String(form.get("idFront") ?? "").trim();
  const idBack = String(form.get("idBack") ?? "").trim();
  const licenseDocUrl = String(form.get("licenseDocUrl") ?? "").trim();
  if (!(city in CITIES)) return { error: "اختر مدينة صحيحة." };
  if (!idFront.startsWith("https://") || !idBack.startsWith("https://") || !licenseDocUrl.startsWith("https://")) {
    return { error: "ارفع صورتي الهوية ورابط رخصة القيادة بروابط https صحيحة." };
  }
  if (String(form.get("terms") ?? "") !== "on") return { error: "لازم توافق على شروط السائقين." };

  const repo = await getRepo();
  await repo.createDriverProfile({ userId: session.email, city, idFront, idBack, licenseDocUrl });
  revalidatePath("/driver");
  revalidatePath("/admin/drivers");
  return { ok: "تم إرسال بيانات التحقق للمراجعة. هتقدر تضيف مركبتك بعد الاعتماد وتفعيل الاشتراك." };
}

export async function moderateDriverAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await requireRole("ADMIN");
  const userId = String(form.get("userId") ?? "").trim();
  const status = String(form.get("status") ?? "") as VerificationStatus;
  if (!userId || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
    return { error: "تعذّر تحديث تحقق السائق." };
  }
  const repo = await getRepo();
  const profile = await repo.getDriverProfile(userId);
  await repo.moderateDriver(userId, status, String(form.get("note") ?? "").trim() || null);
  await repo.logActivity({
    actorEmail: session.email, actorName: session.name,
    action: status === "APPROVED" ? "DRIVER_VERIFIED" : "DRIVER_REJECTED",
    target: userId, detail: profile?.name ?? userId,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/drivers");
  revalidatePath("/driver");
  return { ok: status === "APPROVED" ? "تم اعتماد تحقق السائق ✅" : "تم تحديث حالة السائق ✅" };
}

export async function setDriverSubscriptionAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await requireRole("ADMIN");
  const userId = String(form.get("userId") ?? "").trim();
  const status = String(form.get("status") ?? "") as DriverSubscriptionStatus;
  if (!userId || !["PENDING", "ACTIVE", "EXPIRED"].includes(status)) {
    return { error: "حالة الاشتراك غير صحيحة." };
  }
  const repo = await getRepo();
  const profile = await repo.getDriverProfile(userId);
  if (!profile) return { error: "السائق غير موجود." };
  await repo.setDriverSubscription(userId, status);
  if (status === "ACTIVE") {
    await repo.logActivity({
      actorEmail: session.email, actorName: session.name,
      action: "DRIVER_SUBSCRIPTION_ACTIVE", target: userId, detail: profile.name,
    });
  }
  revalidatePath("/admin");
  revalidatePath("/admin/drivers");
  revalidatePath("/driver");
  revalidatePath("/search");
  revalidatePath("/");
  return { ok: `حالة الاشتراك: ${status === "ACTIVE" ? "نشط" : status === "EXPIRED" ? "منتهي" : "قيد التفعيل"}. ${DRIVER_SUBSCRIPTION_NOTICE}` };
}

export async function createVehicleAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session || session.role !== "DRIVER") return { error: "سجّل الدخول كسائق أولاً." };

  const repo = await getRepo();
  const profile = await repo.getDriverProfile(session.email);
  if (!profile || profile.verificationStatus !== "APPROVED") {
    return { error: "لازم الإدارة تعتمد تحققك أولاً قبل إضافة المركبة." };
  }
  if (profile.subscriptionStatus !== "ACTIVE") {
    return { error: "اشتراكك لسه غير مفعّل. برجاء انتظار تفعيل الإدارة." };
  }

  const name = String(form.get("name") ?? "").trim();
  const type = String(form.get("type") ?? "") as TransportType;
  const city = String(form.get("city") ?? "") as CityKey;
  const plateNumber = String(form.get("plateNumber") ?? "").trim();
  const model = String(form.get("model") ?? "").trim();
  const capacity = Number(form.get("capacity"));
  const pricePerTrip = Number(form.get("pricePerTrip"));
  const durationHours = Number(form.get("durationHours"));
  const licenseDocUrl = String(form.get("licenseDocUrl") ?? "").trim();
  const includes = [...new Set(
    form.getAll("includes").flatMap((value) => String(value).split(/[\n,]+/)).map((s) => s.trim()).filter(Boolean),
  )].slice(0, 8);

  if (name.length < 3) return { error: "اكتب اسم للمركبة (٣ حروف على الأقل)." };
  if (!(type in TRANSPORT_TYPES)) return { error: "نوع المركبة غير صحيح." };
  if (!(city in CITIES)) return { error: "المدينة غير صحيحة." };
  if (plateNumber.length < 3 || model.length < 2) return { error: "أدخل رقم المركبة والموديل." };
  if (!Number.isFinite(capacity) || capacity < 1 || capacity > 100) return { error: "عدد الأفراد اللي المركبة تشيلهم غير صحيح." };
  if (!Number.isFinite(pricePerTrip) || pricePerTrip < 50) return { error: "أدخل سعر رحلة صحيحاً." };
  if (!Number.isFinite(durationHours) || durationHours < 1 || durationHours > 24) return { error: "مدة الرحلة غير صحيحة." };
  if (includes.length === 0) return { error: "اكتب على الأقل مشمول واحد." };
  if (!licenseDocUrl.startsWith("https://")) return { error: "رابط مستند المركبة لازم يبدأ بـ https://." };

  await repo.createVehicle({
    driverId: session.email, name, type, city, plateNumber, model, capacity, pricePerTrip,
    routeFrom: String(form.get("routeFrom") ?? "").trim(),
    routeTo: String(form.get("routeTo") ?? "").trim(),
    meetingPoint: String(form.get("meetingPoint") ?? "").trim(),
    durationHours, includes, licenseDocUrl,
    cancelPolicy: String(form.get("cancelPolicy") ?? "").trim() || TRANSPORT_CANCEL_POLICY,
  });
  revalidatePath("/driver");
  revalidatePath("/admin/drivers");
  redirect("/driver?vehicle=1");
}

export async function moderateVehicleAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await requireRole("ADMIN");
  const id = String(form.get("id") ?? "").trim();
  const status = String(form.get("status") ?? "") as ModerationStatus;
  if (!id || !["PUBLISHED", "REJECTED", "DRAFT", "PENDING"].includes(status)) {
    return { error: "تعذّر تحديث المركبة." };
  }
  const repo = await getRepo();
  const vehicle = await repo.getVehicleById(id);
  if (!vehicle) return { error: "المركبة غير موجودة." };
  if (status === "PUBLISHED") {
    const profile = await repo.getDriverProfile(vehicle.driverId);
    if (!profile || profile.verificationStatus !== "APPROVED" || profile.subscriptionStatus !== "ACTIVE") {
      return { error: "ما ينشرش المركبة قبل اعتماد تحقق السائق وتفعيل اشتراكه." };
    }
  }
  await repo.moderateVehicle(id, status);
  await repo.logActivity({
    actorEmail: session.email, actorName: session.name,
    action: status === "PUBLISHED" ? "VEHICLE_PUBLISHED" : "VEHICLE_REJECTED",
    target: id, detail: vehicle.name,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/drivers");
  revalidatePath("/driver");
  revalidatePath("/search");
  revalidatePath("/");
  return { ok: status === "PUBLISHED" ? "تم نشر المركبة ✅" : "تم تحديث المركبة ✅" };
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
  if (!/^01\d{9}$/.test(phone.replace(/[\s-]/g, ""))) return { error: "أدخل رقم هاتف صحيحاً." };
  if (!nationality) return { error: "أدخل الجنسية." };
  if (!accepted) return { error: "لازم توافق على شروط الضيوف قبل الحجز." };

  const repo = await getRepo();
  const property = await repo.getPropertyBySlug(slug);
  if (!property) return { error: "الوحدة غير موجودة." };
  const [availability, rules] = await Promise.all([repo.getAvailability(property.id), repo.getPriceRules(property.id)]);
  const result = quoteStay(property, rules, availability, checkIn, checkOut);
  if (!result.ok) return { error: "التواريخ غير متاحة. اختار مواعيد تانية." };

  const packageId = String(form.get("packageId") ?? "").trim();
  let packageDetail: PackageBookingDetail | null = null;
  if (packageId) {
    const pkg = await repo.getPackageById(packageId);
    if (!pkg || pkg.status !== "PUBLISHED" || pkg.city !== property.city || pkg.propertyId !== property.id) {
      return { error: "الباقة غير متاحة لهذه الوحدة." };
    }
    if (guests > pkg.capacity) {
      return { error: `عدد الضيوف أكبر من سعة الباقة (${toArabicDigits(pkg.capacity)}).` };
    }
    const packageTotal = pkg.pricePerNight * result.quote.nights;
    packageDetail = {
      packageId: pkg.id, packageName: pkg.name, city: pkg.city,
      propertyId: pkg.propertyId, propertyName: pkg.propertyName,
      experienceId: pkg.experienceId, experienceName: pkg.experienceName,
      transportId: pkg.transportId, transportName: pkg.transportName,
      capacity: pkg.capacity, pricePerNight: pkg.pricePerNight, nights: result.quote.nights,
      guests, total: packageTotal,
      commission: Math.round(packageTotal * (pkg.commissionRate / 100)),
    };
  }

  const experienceId = String(form.get("experienceId") ?? "").trim();
  let experienceDetail: ExperienceBookingDetail | null = null;
  if (experienceId) {
    const experience = await repo.getExperienceById(experienceId);
    if (!experience || experience.status !== "PUBLISHED" || experience.city !== property.city) {
      return { error: "تجربة السفاري غير متاحة لهذه الوحدة." };
    }
    if (guests > experience.capacity) {
      return { error: `عدد الضيوف أكبر من سعة تجربة السفاري (${toArabicDigits(experience.capacity)}).` };
    }
    const experienceTotal = experience.pricePerPerson * guests;
    experienceDetail = {
      experienceId: experience.id, experienceName: experience.name, category: experience.category, city: experience.city,
      mountain: experience.mountain, meetingPoint: experience.meetingPoint,
      durationHours: experience.durationHours, pricePerPerson: experience.pricePerPerson,
      guests, total: experienceTotal,
      commission: Math.round(experienceTotal * (experience.commissionRate / 100)),
    };
  }

  const transportId = String(form.get("transportId") ?? "").trim();
  let transportDetail: TransportBookingDetail | null = null;
  if (transportId) {
    const transport = await repo.getTransportById(transportId);
    if (!transport || transport.status !== "PUBLISHED" || transport.city !== property.city) {
      return { error: "خدمة النقل غير متاحة لهذه الوحدة." };
    }
    if (guests > transport.capacity) {
      return { error: `عدد الضيوف أكبر من سعة النقل (${toArabicDigits(transport.capacity)}).` };
    }
    transportDetail = {
      transportId: transport.id, transportName: transport.name, type: transport.type,
      city: transport.city, routeFrom: transport.routeFrom, routeTo: transport.routeTo,
      meetingPoint: transport.meetingPoint, durationHours: transport.durationHours,
      capacity: transport.capacity, pricePerTrip: transport.pricePerTrip, guests,
      total: transport.pricePerTrip,
      commission: Math.round(transport.pricePerTrip * (transport.commissionRate / 100)),
      driverName: transport.driverName ?? null,
      plateNumber: transport.plateNumber ?? null,
    };
  }

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
    commission: result.quote.commission + (packageDetail?.commission ?? 0) + (experienceDetail?.commission ?? 0) + (transportDetail?.commission ?? 0),
    total: result.quote.total + (packageDetail?.total ?? 0) + (experienceDetail?.total ?? 0) + (transportDetail?.total ?? 0), provider: "MANUAL",
    nationality, paymentMethod, termsAcceptedAt, experience: experienceDetail, transport: transportDetail,
    package: packageDetail,
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
  if (!["PENDING", "PUBLISHED", "HIDDEN"].includes(status)) return;
  await (await getRepo()).moderateReview(id, status);
  revalidatePath("/admin");
  revalidatePath("/search");
}

export async function replyToReviewAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session || session.role !== "OWNER") return { error: "فقط المالك يقدر يرد على التقييمات." };
  const id = String(form.get("reviewId") ?? "");
  const text = String(form.get("reply") ?? "").trim();
  if (text.length < 5 || text.length > 600) return { error: "اكتب رداً بين ٥ و٦٠٠ حرف." };

  const repo = await getRepo();
  const review = (await repo.listAllReviews()).find((r) => r.id === id);
  if (!review || review.status !== "PUBLISHED") return { error: "هذا التقييم غير متاح للرد." };
  const property = await repo.getPropertyById(review.propertyId);
  if (!property || property.ownerId !== session.email) return { error: "هذا التقييم ليس لوحدة تملكها." };

  await repo.replyToReview(id, session.email, text);
  revalidatePath("/owner");
  revalidatePath(`/stay/${property.slug}`);
  return { ok: "تم نشر ردك على التقييم." };
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
  await sendVerificationNotice({
    stage: "submitted", email: session.email, name: session.name,
    phoneAlt, nationality, birthDate, commissionRate, idFront, idBack,
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
  await sendVerificationNotice({
    stage: "selfie", email: session.email, name: session.name,
    phoneAlt: verification.phoneAlt, nationality: verification.nationality,
    birthDate: verification.birthDate, commissionRate: verification.commissionRate,
    idFront: verification.idFront, idBack: verification.idBack, selfie,
  });
  revalidatePath("/owner/profile");
  revalidatePath("/admin");
  redirect("/owner/profile?selfie=1");
}

export async function moderateVerificationAction(form: FormData): Promise<void> {
  const session = await requireRole("ADMIN");
  const userId = String(form.get("userId") ?? "");
  const status = String(form.get("status") ?? "") as VerificationStatus;
  if (!["SELFIE_REQUIRED", "SELFIE_PENDING", "APPROVED", "REJECTED"].includes(status)) return;
  const note = String(form.get("note") ?? "").trim() || null;
  const repo = await getRepo();
  await repo.moderateVerification(userId, status, note);
  const verification = await repo.getVerification(userId);
  const user = await repo.getUserByEmail(userId);
  const action = status === "APPROVED" ? "VERIFICATION_APPROVED"
    : status === "REJECTED" ? "VERIFICATION_REJECTED"
    : status === "SELFIE_REQUIRED" ? "SELFIE_REQUESTED" : null;
  if (action) {
    await repo.logActivity({
      actorEmail: session.email, actorName: session.name,
      action, target: userId,
      detail: [user?.name ?? userId, note].filter(Boolean).join(" — ") || null,
    });
  }
  const stage = status === "APPROVED" ? "approved" : status === "REJECTED" ? "rejected" : status === "SELFIE_REQUIRED" ? "selfie_required" : "submitted";
  await sendVerificationNotice({
    stage, email: userId, name: user?.name,
    phoneAlt: verification?.phoneAlt, nationality: verification?.nationality,
    birthDate: verification?.birthDate, commissionRate: verification?.commissionRate ?? 12,
    note: verification?.note,
    idFront: verification?.idFront, idBack: verification?.idBack, selfie: verification?.selfie,
  });
  revalidatePath("/admin");
  revalidatePath("/owner/profile");
}

export async function setCommissionRateAction(form: FormData): Promise<void> {
  const session = await requireRole("ADMIN");
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const rate = Number(form.get("rate"));
  if (!email || !Number.isFinite(rate) || rate < 0 || rate > 100) return;
  const repo = await getRepo();
  const owner = await repo.getUserByEmail(email);
  const previous = owner?.commissionRate ?? DEFAULT_COMMISSION_RATE;
  await repo.setOwnerCommissionRate(email, rate);
  if (previous !== rate) {
    await repo.logActivity({
      actorEmail: session.email, actorName: session.name,
      action: "COMMISSION_CHANGED", target: email,
      detail: `${owner?.name ?? email}: ${toArabicDigits(previous)}٪ ← ${toArabicDigits(rate)}٪`,
    });
  }
  revalidatePath("/admin");
  revalidatePath("/owner");
  revalidatePath("/search");
}
