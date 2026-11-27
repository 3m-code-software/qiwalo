import { authenticateMobile } from "@/lib/mobile-auth";
import { publicDriverTrip } from "@/lib/mobile-role-service";
import { getRepo } from "@/lib/repo";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateMobile(request, ["DRIVER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const bookings = await (await getRepo()).listBookingsForDriver(auth.session.email);
  const booking = bookings.find((item) => item.id === id || item.reference === id);
  const trip = booking ? publicDriverTrip(booking) : null;

  if (!trip) {
    return Response.json(
      { ok: false, error: "not_found", note: "الرحلة غير موجودة." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    { ok: true, trip },
    { headers: { "Cache-Control": "no-store" } },
  );
}
