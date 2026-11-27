import { authenticateMobile } from "@/lib/mobile-auth";
import { driverSummary } from "@/lib/mobile-role-service";
import { getRepo } from "@/lib/repo";

export async function GET(request: Request) {
  const auth = await authenticateMobile(request, ["DRIVER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const repo = await getRepo();
  const [profile, vehicles, bookings] = await Promise.all([
    repo.getDriverProfile(auth.session.email),
    repo.listVehiclesForDriver(auth.session.email),
    repo.listBookingsForDriver(auth.session.email),
  ]);
  const trips = bookings.filter((booking) => booking.transport !== null);

  return Response.json(
    {
      ok: true,
      user: auth.session,
      summary: driverSummary(
        profile,
        vehicles,
        trips,
        new Date().toISOString().slice(0, 10),
      ),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
