import { revalidatePath } from "next/cache";
import { verifyPaymobHmac } from "@/lib/paymob";
import { getRepo } from "@/lib/repo";

interface PaymobWebhook {
  hmac?: string;
  obj?: {
    success?: boolean;
    amount_cents?: number;
    order?: { merchant_order_id?: string; id?: number };
    id?: number;
  };
  success?: boolean;
  amount_cents?: number;
  order?: { merchant_order_id?: string; id?: number };
  id?: number;
}

export async function POST(request: Request) {
  let payload: PaymobWebhook;
  try {
    payload = (await request.json()) as PaymobWebhook;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const secret = process.env.PAYMOB_SECRET_KEY;
  if (!secret) {
    console.error("[paymob] PAYMOB_SECRET_KEY is not configured");
    return Response.json({ ok: false, error: "not_configured" }, { status: 500 });
  }
  if (!verifyPaymobHmac(payload as Record<string, unknown>, secret)) {
    return Response.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  const txn = payload.obj ?? payload;
  const reference = txn.order?.merchant_order_id;
  if (!reference) {
    return Response.json({ ok: true, note: "no_merchant_order_id" });
  }

  const repo = await getRepo();
  const booking = await repo.getBookingByReference(reference);
  if (!booking) {
    console.warn(`[paymob] no booking for reference ${reference}`);
    return Response.json({ ok: true, note: "booking_not_found" });
  }

  const paid = Boolean(txn.success);
  if (paid) {
    if (booking.status !== "CONFIRMED") {
      await repo.updateBooking(reference, { status: "CONFIRMED", paymentStatus: "PAID", provider: "PAYMOB" });
      revalidatePath("/admin");
      revalidatePath("/owner");
      revalidatePath(`/booking/${reference}`);
    }
  } else if (booking.paymentStatus === "PENDING") {
    await repo.updateBooking(reference, { paymentStatus: "FAILED", provider: "PAYMOB" });
    revalidatePath("/admin");
    revalidatePath("/owner");
  }

  return Response.json({ ok: true, reference, status: paid ? "PAID" : "FAILED" });
}

export async function GET() {
  return Response.json({ ok: true, service: "qiwalo-paymob-webhook" });
}
