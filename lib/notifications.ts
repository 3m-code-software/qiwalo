import { CANCEL_POLICIES, SUPPORT_TELEGRAM, SUPPORT_WHATSAPP } from "@/lib/constants";
import type { Booking, Property } from "@/lib/types";

const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP || "201066094050";

export const bankDetails = {
  bank: process.env.BANK_NAME || "بنك مصر",
  account: process.env.BANK_ACCOUNT || "سيتم إرسال رقم الحساب عند التأكيد",
  iban: process.env.BANK_IBAN || "",
};

export function paymentMethodLabel(method: Booking["paymentMethod"]): string {
  return method === "BANK" ? "تحويل بنكي" : "كاش عند الوصول";
}

export function paymentDetailsText(method: Booking["paymentMethod"]): string {
  if (method === "CASH") {
    return "ادفع المبلغ كاملاً عند الوصول إلى الوحدة أو نقطة الاستلام.";
  }
  return `حوّل المبلغ إلى: ${bankDetails.bank} · الحساب: ${bankDetails.account}${bankDetails.iban ? ` · IBAN: ${bankDetails.iban}` : ""}. أرسل صورة الإيصال على واتساب الدعم مع رقم الحجز.`;
}

export function cancelPolicyText(policy: string): string {
  return CANCEL_POLICIES[policy as keyof typeof CANCEL_POLICIES] ?? policy;
}

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return `20${digits}`;
}

async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Qiwalo <onboarding@resend.dev>";
  if (!key) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    if (!response.ok) console.warn("[notify] Resend failed", await response.text());
    return response.ok;
  } catch (error) {
    console.warn("[notify] Resend unavailable", error);
    return false;
  }
}

async function sendWhatsApp(to: string, text: string): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const recipient = normalizePhone(to);
  if (!token || !phoneId || !recipient) return false;
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipient,
          type: "text",
          text: { body: text },
        }),
      },
    );
    if (!response.ok) console.warn("[notify] WhatsApp failed", await response.text());
    return response.ok;
  } catch (error) {
    console.warn("[notify] WhatsApp unavailable", error);
    return false;
  }
}

/** إرسال نص لأي chat_id — بيستخدمه الترحيب بعد تفعيل البوت وكمان إشعارات الأدمن. */
export async function sendTelegramToChat(chatId: string | number, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) {
      console.warn("[notify] Telegram failed", await response.text());
      return false;
    }
    const body = await response.json();
    console.info("[notify] Telegram text sent", body.result?.message_id);
    return true;
  } catch (error) {
    console.warn("[notify] Telegram unavailable", error);
    return false;
  }
}

export async function sendTelegram(text: string): Promise<boolean> {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!chatId) return false;
  return sendTelegramToChat(chatId, text);
}

async function sendTelegramPhoto(photoUrl: string, caption: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId || !photoUrl.startsWith("https://")) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: caption.slice(0, 1000),
      }),
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (!response.ok) {
      console.warn("[notify] Telegram photo failed", await response.text());
      return false;
    }
    const body = await response.json();
    console.info("[notify] Telegram photo sent", body.result?.message_id);
    return true;
  } catch (error) {
    console.warn("[notify] Telegram photo unavailable", error);
    return false;
  }
}

export interface BookingNotice {
  booking: Booking;
  property: Property;
  guestEmail: string;
  guestPhone?: string;
  ownerEmail?: string;
}

export async function sendBookingNotifications(notice: BookingNotice) {
  const { booking, property, guestEmail, guestPhone } = notice;
  const support = `الدعم: واتساب/تليجرام 01066094050\n${SUPPORT_WHATSAPP}\n${SUPPORT_TELEGRAM}`;

  const guestText = [
    `تم تأكيد حجزك في قيوالو ✓`,
    `رقم الحجز: ${booking.reference}`,
    `الوحدة: ${property.name} — ${property.address}`,
    `الوصول: ${booking.checkIn} | المغادرة: ${booking.checkOut} (${booking.nights} ليالي)`,
    `عدد الضيوف: ${booking.guests}`,
    `الإجمالي: ${booking.total} ج.م`,
    `طريقة الدفع: ${paymentMethodLabel(booking.paymentMethod)}`,
    paymentDetailsText(booking.paymentMethod),
    `الإلغاء: ${cancelPolicyText(property.cancelPolicy)}`,
    support,
  ].join("\n");

  const adminText = [
    `حجز جديد — قيوالو`,
    `رقم الحجز: ${booking.reference}`,
    `الضيف: ${booking.guestName}`,
    `الهاتف: ${guestPhone || "غير مذكور"}`,
    `البريد: ${guestEmail}`,
    `الجنسية: ${booking.nationality || "غير محددة"}`,
    `الوصول: ${booking.checkIn} | المغادرة: ${booking.checkOut}`,
    `عدد الضيوف: ${booking.guests}`,
    `الوحدة: ${property.name} (${property.city})`,
    `الإجمالي: ${booking.total} ج.م | العمولة: ${booking.commission} ج.م`,
    `الدفع: ${paymentMethodLabel(booking.paymentMethod)}`,
  ].join("\n");

  const ownerText = [
    `حجز جديد على وحدتك: ${property.name}`,
    `رقم الحجز: ${booking.reference}`,
    `الوصول: ${booking.checkIn} | المغادرة: ${booking.checkOut} · ${booking.guests} ضيوف`,
    `إجمالي الحجز: ${booking.total} ج.م`,
    `عمولة المنصة: ${booking.commission} ج.م`,
    `صافي المستحق: ${booking.total - booking.commission} ج.م`,
  ].join("\n");

  // Always leave an audit trail in Vercel logs even before channels are configured.
  console.info(`[booking-notice] ${booking.reference}\n${adminText}`);

  const results = await Promise.allSettled([
    sendEmail(guestEmail, `تأكيد حجز قيوالو ${booking.reference}`, guestText),
    sendEmail(process.env.ADMIN_EMAIL || "3mcodesoftwaresolutions@gmail.com", `حجز جديد ${booking.reference}`, adminText),
    guestPhone ? sendWhatsApp(guestPhone, guestText) : Promise.resolve(false),
    sendWhatsApp(ADMIN_WHATSAPP, adminText),
    notice.ownerEmail ? sendEmail(notice.ownerEmail, `حجز جديد ${booking.reference}`, ownerText) : Promise.resolve(false),
    sendTelegram(adminText),
  ]);

  return {
    emailed: results.slice(0, 2).some((r) => r.status === "fulfilled" && r.value === true),
    whatsapp: results.slice(2, 4).some((r) => r.status === "fulfilled" && r.value === true),
    telegram: results.slice(5).some((r) => r.status === "fulfilled" && r.value === true),
  };
}

export async function sendReviewNotice(propertyName: string, rating: number, comment: string) {
  const text = `تقييم جديد بانتظار المراجعة: ${propertyName} — ${rating}/5\n${comment}`;
  console.info(`[review-notice] ${text}`);
  await Promise.allSettled([
    sendEmail(process.env.ADMIN_EMAIL || "3mcodesoftwaresolutions@gmail.com", "تقييم جديد في قيوالو", text),
    sendWhatsApp(ADMIN_WHATSAPP, text),
    sendTelegram(text),
  ]);
}

export interface VerificationNotice {
  stage: "submitted" | "selfie" | "selfie_required" | "approved" | "rejected";
  email: string;
  name?: string;
  phoneAlt?: string | null;
  nationality?: string | null;
  birthDate?: string | null;
  commissionRate?: number;
  note?: string | null;
  idFront?: string | null;
  idBack?: string | null;
  selfie?: string | null;
}

const VERIFICATION_LABELS: Record<VerificationNotice["stage"], string> = {
  submitted: "بيانات تحقق جديدة",
  selfie: "صورة شخصية جديدة",
  selfie_required: "طلب سيلفي",
  approved: "تمت الموافقة على التحقق",
  rejected: "تم رفض التحقق",
};

const ADMIN_URL = `${(process.env.NEXT_PUBLIC_SITE_URL || "https://qiwalo-ygzh.vercel.app").replace(/\/$/, "")}/admin`;

// Only send the document that is new at each stage. ID photos go once on
// submission, the selfie goes once when uploaded; decisions stay text-only.
const VERIFICATION_PHOTOS: Record<VerificationNotice["stage"], { id: boolean; selfie: boolean }> = {
  submitted: { id: true, selfie: false },
  selfie: { id: false, selfie: true },
  selfie_required: { id: false, selfie: false },
  approved: { id: false, selfie: false },
  rejected: { id: false, selfie: false },
};

export async function sendVerificationNotice(notice: VerificationNotice) {
  const label = VERIFICATION_LABELS[notice.stage];
  const withDocuments = VERIFICATION_PHOTOS[notice.stage].id || VERIFICATION_PHOTOS[notice.stage].selfie;
  const text = [
    `${label} — قيوالو`,
    `المالك: ${notice.name || notice.email}`,
    `البريد: ${notice.email}`,
    `الهاتف البديل: ${notice.phoneAlt || "غير مذكور"}`,
    `الجنسية: ${notice.nationality || "غير محددة"}`,
    `تاريخ الميلاد: ${notice.birthDate || "غير مذكور"}`,
    `العمولة: ${notice.commissionRate ?? 12}%`,
    notice.note ? `ملاحظة الإدارة: ${notice.note}` : "",
    withDocuments ? "" : `رابط المراجعة: ${ADMIN_URL}`,
  ].filter(Boolean).join("\n");

  // Audit trail in Vercel logs even if no channel is configured.
  console.info(`[verification-notice] ${label}\n${text}`);

  await Promise.allSettled([
    sendEmail(process.env.ADMIN_EMAIL || "3mcodesoftwaresolutions@gmail.com", `${label} — قيوالو`, text),
    sendWhatsApp(ADMIN_WHATSAPP, text),
    sendTelegram(text),
  ]);

  const include = VERIFICATION_PHOTOS[notice.stage];
  const photos = [
    include.id ? { url: notice.idFront, caption: "بطاقة الهوية — الوجه" } : null,
    include.id ? { url: notice.idBack, caption: "بطاقة الهوية — الظهر" } : null,
    include.selfie ? { url: notice.selfie, caption: "الصورة الشخصية (سيلفي)" } : null,
  ].filter((photo): photo is { url: string; caption: string } => Boolean(photo?.url));
  for (const photo of photos) {
    await sendTelegramPhoto(photo.url!, `${label} — ${photo.caption}\n${notice.name || notice.email}`);
  }
}

/** إشعار التسجيل للأدمن: الاسم ورقم التليفون فقط، من غير بريد أو أي بيانات تانية. */
export async function sendSignupNotice(notice: {
  name: string;
  phone: string;
}): Promise<void> {
  const text = [
    "تسجيل جديد في قيوالو",
    `الاسم: ${notice.name}`,
    `رقم التليفون: ${notice.phone}`,
  ].join("\n");
  console.info(`[signup-notice] ${text}`);
  await sendTelegram(text);
}
