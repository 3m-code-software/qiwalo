"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, createSession, getSession, requireRole, type Session } from "@/lib/auth";
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

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("name") ?? "").trim();
  const requested = String(form.get("role") ?? "GUEST");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "أدخل بريداً إلكترونياً صحيحاً." };

  const repo = await getRepo();
  let user = await repo.getUserByEmail(email);
  if (!user) {
    const role: Role = requested === "OWNER" ? "OWNER" : "GUEST";
    const displayName = name || email.split("@")[0];
    await repo.upsertUser({ email, name: displayName, role });
    user = { email, name: displayName, role };
  }
  await createSession({ email: user.email, name: user.name, role: user.role });
  redirect(safeNext(form.get("next")) || (user.role === "ADMIN" ? "/admin" : user.role === "OWNER" ? "/owner" : "/"));
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/");
}

export async function createPropertyAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session: Session | null = await getSession();
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

  const images = String(form.get("images") ?? "").split(/[\n,]+/).map((s) => s.trim()).filter(Boolean).slice(0, 8);
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

  let session: Session | null = await getSession();
  if (!session) {
    await repo.upsertUser({ email, name: fullName, role: "GUEST", phone });
    await createSession({ email, name: fullName, role: "GUEST" });
    session = { email, name: fullName, role: "GUEST" };
  }

  const booking = await repo.createBooking({
    propertyId: property.id, guestId: session.email, guestName: fullName,
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
