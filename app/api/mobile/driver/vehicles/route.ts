import { authenticateMobile } from "@/lib/mobile-auth";
import { parseNewVehicle, publicVehicle } from "@/lib/mobile-role-service";
import { getRepo } from "@/lib/repo";

const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const auth = await authenticateMobile(request, ["DRIVER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const vehicles = await (await getRepo()).listVehiclesForDriver(auth.session.email);
  return Response.json({ ok: true, vehicles: vehicles.map(publicVehicle) }, { headers });
}

export async function POST(request: Request) {
  const auth = await authenticateMobile(request, ["DRIVER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "invalid_json", note: "بيانات الطلب غير صالحة." },
      { status: 400, headers },
    );
  }

  const parsed = parseNewVehicle(body, auth.session.email);
  if (!parsed.ok) {
    return Response.json(
      { ok: false, error: "validation_error", note: parsed.error },
      { status: 400, headers },
    );
  }

  const vehicle = await (await getRepo()).createVehicle(parsed.value);
  return Response.json(
    { ok: true, vehicle: publicVehicle(vehicle) },
    { status: 201, headers },
  );
}
