import { authenticateMobile } from "@/lib/mobile-auth";
import { ownerSummary } from "@/lib/mobile-role-service";
import { getRepo } from "@/lib/repo";

export async function GET(request: Request) {
  const auth = await authenticateMobile(request, ["OWNER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const repo = await getRepo();
  const [properties, bookings] = await Promise.all([
    repo.listPropertiesForOwner(auth.session.email),
    repo.listBookingsForOwner(auth.session.email),
  ]);

  return Response.json(
    {
      ok: true,
      user: auth.session,
      summary: ownerSummary(properties, bookings),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
