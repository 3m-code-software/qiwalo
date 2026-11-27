import { authenticateMobile } from "@/lib/mobile-auth";
import { publicOwnerBooking } from "@/lib/mobile-role-service";
import { getRepo } from "@/lib/repo";

/**
 * طلبات حجز المالك للقراءة فقط في هذه النسخة: الحجوزات بتتأكد تلقائياً،
 * فمفيش قبول/رفض يدوي لحد ما نتفق على حالة PENDING فعلية.
 */
export async function GET(request: Request) {
  const auth = await authenticateMobile(request, ["OWNER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const bookings = await (await getRepo()).listBookingsForOwner(auth.session.email);
  return Response.json(
    { ok: true, bookings: bookings.map(publicOwnerBooking), readOnly: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
