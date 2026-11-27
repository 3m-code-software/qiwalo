import { authenticateMobile } from "@/lib/mobile-auth";
import { parseVehiclePatch, publicVehicle } from "@/lib/mobile-role-service";
import { getRepo } from "@/lib/repo";

const headers = { "Cache-Control": "no-store" };

function notFound() {
  return Response.json(
    { ok: false, error: "not_found", note: "المركبة غير موجودة." },
    { status: 404, headers },
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateMobile(request, ["DRIVER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const vehicle = await (await getRepo()).getVehicleById(id);
  if (!vehicle || (vehicle.driverId !== auth.session.email && auth.session.role !== "ADMIN")) {
    return notFound();
  }

  return Response.json({ ok: true, vehicle: publicVehicle(vehicle) }, { headers });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateMobile(request, ["DRIVER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const repo = await getRepo();
  const existing = await repo.getVehicleById(id);
  if (!existing || (existing.driverId !== auth.session.email && auth.session.role !== "ADMIN")) {
    return notFound();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "invalid_json", note: "بيانات الطلب غير صالحة." },
      { status: 400, headers },
    );
  }

  const parsed = parseVehiclePatch(body, existing);
  if (!parsed.ok) {
    return Response.json(
      { ok: false, error: "validation_error", note: parsed.error },
      { status: 400, headers },
    );
  }

  const vehicle = await repo.updateVehicle(id, parsed.value);
  if (!vehicle) return notFound();

  return Response.json({ ok: true, vehicle: publicVehicle(vehicle) }, { headers });
}
