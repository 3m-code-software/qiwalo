import { revalidatePath } from "next/cache";
import {
  createPublishedBooking,
  parseBookingBody,
  publicMobileBooking,
  recallBookingReference,
  rememberBooking,
} from "@/lib/booking-service";
import { getRepo } from "@/lib/repo";

/**
 * BFF لإنشاء حجز مؤكد من تطبيق أندرويد (ضيف بدون جلسة).
 * يستخدم نفس خدمة الحجز التي يستخدمها الويب، فمفيش قواعد مكررة.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "invalid_json", note: "بيانات الطلب غير صالحة." },
      { status: 400 },
    );
  }

  const parsed = parseBookingBody(body);
  if (!parsed.ok) {
    return Response.json(
      { ok: false, error: "invalid_request", note: parsed.error },
      { status: 400 },
    );
  }

  const rawKey = request.headers.get("idempotency-key") ?? "";
  const idempotencyKey = /^[A-Za-z0-9_-]{8,80}$/.test(rawKey)
    ? `${parsed.request.email}:${rawKey}`
    : "";
  const recalled = recallBookingReference(idempotencyKey);
  if (recalled) {
    try {
      const existing = await (await getRepo()).getBookingByReference(recalled);
      if (existing) {
        return Response.json(
          {
            ok: true,
            booking: publicMobileBooking(existing),
            reused: true,
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
    } catch {
      // لو التعريف القديم مش موجود، نكمل الحجز العادي.
    }
  }

  try {
    const result = await createPublishedBooking(parsed.request);
    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error: result.code ?? "booking_failed",
          note: result.error,
        },
        { status: result.code === "phone_taken" ? 409 : 400 },
      );
    }

    rememberBooking(idempotencyKey, result.booking.reference);
    revalidatePath("/owner");
    revalidatePath("/admin");

    return Response.json(
      { ok: true, booking: publicMobileBooking(result.booking) },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const note = error instanceof Error ? error.message : "خطأ غير متوقع";
    return Response.json(
      { ok: false, error: "booking_failed", note },
      { status: 500 },
    );
  }
}
