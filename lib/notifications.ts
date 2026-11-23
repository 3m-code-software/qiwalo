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
  ]);

  return {
    emailed: results.slice(0, 2).some((r) => r.status === "fulfilled" && r.value === true),
    whatsapp: results.slice(2, 4).some((r) => r.status === "fulfilled" && r.value === true),
  };
}

export async function sendReviewNotice(propertyName: string, rating: number, comment: string) {
  const text = `تقييم جديد بانتظار المراجعة: ${propertyName} — ${rating}/5\n${comment}`;
  console.info(`[review-notice] ${text}`);
  await Promise.allSettled([
    sendEmail(process.env.ADMIN_EMAIL || "3mcodesoftwaresolutions@gmail.com", "تقييم جديد في قيوالو", text),
    sendWhatsApp(ADMIN_WHATSAPP, text),
  ]);
}
