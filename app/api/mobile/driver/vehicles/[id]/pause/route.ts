import { authenticateMobile } from "@/lib/mobile-auth";
import { publicVehicle } from "@/lib/mobile-role-service";
import { getRepo } from "@/lib/repo";

const headers = { "Cache-Control": "no-store" };

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
    return Response.json(
      { ok: false, error: "not_found", note: "المركبة غير موجودة." },
      { status: 404, headers },
    );
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

  const paused = (body as Record<string, unknown>)?.paused;
  if (typeof paused !== "boolean") {
    return Response.json(
      { ok: false, error: "validation_error", note: "حدد حالة الإيقاف صحيحاً." },
      { status: 400, headers },
    );
  }

  const vehicle = await repo.setVehiclePaused(id, paused);
  if (!vehicle) {
    return Response.json(
      { ok: false, error: "not_found", note: "المركبة غير موجودة." },
      { status: 404, headers },
    );
  }

  return Response.json({ ok: true, vehicle: publicVehicle(vehicle) }, { headers });
}
