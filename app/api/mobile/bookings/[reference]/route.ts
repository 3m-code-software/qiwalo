import { publicMobileBooking } from "@/lib/booking-service";
import { getRepo } from "@/lib/repo";

/**
 * BFF للقراءة فقط: حالة حجز برقم المرجع، بدون تسجيل دخول.
 * نفس فكرة صفحة /booking/[reference] على الويب، لكن بلا أي بيانات شخصية.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const { reference } = await params;
  if (!/^[A-Za-z0-9-]{4,64}$/.test(reference)) {
    return Response.json(
      { ok: false, error: "invalid_reference", note: "رقم الحجز غير صالح." },
      { status: 400 },
    );
  }

  try {
    const booking = await (await getRepo()).getBookingByReference(
      reference.toUpperCase(),
    );
    if (!booking) {
      return Response.json(
        { ok: false, error: "booking_not_found", note: "الحجز غير موجود." },
        { status: 404 },
      );
    }
    return Response.json(
      { ok: true, booking: publicMobileBooking(booking) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const note = error instanceof Error ? error.message : "خطأ غير متوقع";
    return Response.json(
      { ok: false, error: "booking_lookup_failed", note },
      { status: 500 },
    );
  }
}
