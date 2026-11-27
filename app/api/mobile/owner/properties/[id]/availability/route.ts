import { authenticateMobile } from "@/lib/mobile-auth";
import { parseAvailability } from "@/lib/mobile-role-service";
import { getRepo } from "@/lib/repo";

const headers = { "Cache-Control": "no-store" };

async function ownedProperty(request: Request, id: string) {
  const auth = await authenticateMobile(request, ["OWNER", "ADMIN"]);
  if (!auth.ok) return { auth };
  const property = await (await getRepo()).getPropertyById(id);
  if (!property || (property.ownerId !== auth.session.email && auth.session.role !== "ADMIN")) {
    return { response: Response.json(
      { ok: false, error: "not_found", note: "الوحدة غير موجودة." },
      { status: 404, headers },
    ) };
  }
  return { auth, property };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await ownedProperty(request, id);
  if (result.response) return result.response;

  const availability = await (await getRepo()).getAvailability(id);
  return Response.json({ ok: true, availability }, { headers });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await ownedProperty(request, id);
  if (result.response) return result.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "invalid_json", note: "بيانات الطلب غير صالحة." },
      { status: 400, headers },
    );
  }

  const parsed = parseAvailability(body);
  if (!parsed.ok) {
    return Response.json(
      { ok: false, error: "validation_error", note: parsed.error },
      { status: 400, headers },
    );
  }

  await (await getRepo()).saveAvailability(id, parsed.value);
  const availability = await (await getRepo()).getAvailability(id);
  return Response.json({ ok: true, availability }, { headers });
}
