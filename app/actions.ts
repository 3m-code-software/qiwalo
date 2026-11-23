"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, createSession, getSession, requireRole } from "@/lib/auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { quoteStay } from "@/lib/pricing";
import { getRepo } from "@/lib/repo";
import type { CityKey, PropertyType, Role } from "@/lib/types";

export interface FormState { error?: string }

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

export async function signInAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "أدخل بريداً إلكترونياً صحيحاً." };
  if (!password) return { error: "أدخل كلمة المرور." };

  const repo = await getRepo();

  // Local mock mode: no Supabase, keep the simple dev login working.
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
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "أدخل بريداً إلكترونياً صحيحاً." };
  if (name.length < 2) return { error: "أدخل اسمك الكامل." };
  if (password.length < 6) return { error: "كلمة المرور يجب ألا تقل عن 6 أحرف." };

  const role: Role = requested === "OWNER" ? "OWNER" : "GUEST";
  const repo = await getRepo();

  // Local mock mode: no Supabase, create the user in mock state directly.
  if (!isSupabaseConfigured()) {
    await repo.upsertUser({ email, name, role });
    await createSession({ email, name, role });
    redirectForRole(safeNext(form.get("next")), role);
  }

  // Don't let a signup claim an email that already exists in our user table
  // (e.g. seeded owner/admin accounts) — that could hijack their role/data.
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

  await repo.upsertUser({ email, name, role });
  redirectForRole(safeNext(form.get("next")), role);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  await clearSession();
  redirect("/");
}

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

  const repo = await getRepo();
  await repo.createProperty({
    ownerId: session.email, name, city, type, address, description,
    lat: Number(form.get("lat")) || COORDS[city].lat,
    lng: Number(form.get("lng")) || COORDS[city].lng,
    images, videoUrl: String(form.get("videoUrl") ?? "").trim() || null,
    amenities, maxGuests, bedrooms, basePrice,
    cancelPolicy: String(form.get("cancelPolicy") ?? "FREE_48H"),
  });
  revalidatePath("/owner");
  revalidatePath("/admin");
  redirect("/owner?created=1");
}

export async function moderatePropertyAction(form: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as "PUBLISHED" | "REJECTED";
  if (!id || !["PUBLISHED", "REJECTED"].includes(status)) return;
  const repo = await getRepo();
  await repo.moderateProperty(id, status);
  revalidatePath("/admin");
  revalidatePath("/search");
}

export async function confirmBookingAction(form: FormData): Promise<void> {
  const slug = String(form.get("slug") ?? "");
  const checkIn = String(form.get("checkIn") ?? "");
  const checkOut = String(form.get("checkOut") ?? "");
  const guests = Number(form.get("guests") ?? 1);
  const fullName = String(form.get("fullName") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const phone = String(form.get("phone") ?? "").trim();
  if (!fullName || !/^\S+@\S+\.\S+$/.test(email)) redirect(`/checkout?slug=${slug}&error=contact`);

  const repo = await getRepo();
  const property = await repo.getPropertyBySlug(slug);
  if (!property) redirect("/search");
  const [availability, rules] = await Promise.all([repo.getAvailability(property.id), repo.getPriceRules(property.id)]);
  const result = quoteStay(property, rules, availability, checkIn, checkOut);
  if (!result.ok) redirect(`/stay/${slug}?error=dates`);

  // Guests can book without an account. Never create an authenticated session here.
  const session = await getSession();
  const guestEmail = session?.email ?? email;
  if (!session) {
    await repo.upsertUser({ email, name: fullName, role: "GUEST", phone });
  }

  const booking = await repo.createBooking({
    propertyId: property.id, guestId: guestEmail, guestName: fullName,
    checkIn, checkOut, guests,
    subtotal: result.quote.subtotal, serviceFee: result.quote.serviceFee,
    commission: result.quote.commission, total: result.quote.total, provider: "MANUAL",
  });
  await repo.updateBooking(booking.reference, { status: "CONFIRMED", paymentStatus: "PAID" });
  console.info(`[booking] confirmed ${booking.reference} for ${email}${phone ? ` / ${phone}` : ""}`);
  revalidatePath("/owner");
  revalidatePath("/admin");
  redirect(`/booking/${booking.reference}`);
}
