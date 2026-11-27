import { authenticateMobile } from "@/lib/mobile-auth";
import { publicDriverTrip } from "@/lib/mobile-role-service";
import { getRepo } from "@/lib/repo";

/** الرحلات مشتقّة من الحجوزات اللي فيها تفاصيل نقل — مفيش جدول Trip مستقل. */
export async function GET(request: Request) {
  const auth = await authenticateMobile(request, ["DRIVER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const bookings = await (await getRepo()).listBookingsForDriver(auth.session.email);
  const trips = bookings
    .map(publicDriverTrip)
    .filter((trip): trip is NonNullable<ReturnType<typeof publicDriverTrip>> => trip !== null);

  return Response.json({ ok: true, trips }, { headers: { "Cache-Control": "no-store" } });
}
