import { authenticateMobile } from "@/lib/mobile-auth";
import { parsePropertyPatch, publicOwnerProperty } from "@/lib/mobile-role-service";
import { getRepo } from "@/lib/repo";

const headers = { "Cache-Control": "no-store" };

function notFound() {
  return Response.json(
    { ok: false, error: "not_found", note: "الوحدة غير موجودة." },
    { status: 404, headers },
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateMobile(request, ["OWNER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const property = await (await getRepo()).getPropertyById(id);
  if (!property || (property.ownerId !== auth.session.email && auth.session.role !== "ADMIN")) {
    return notFound();
  }

  return Response.json({ ok: true, property: publicOwnerProperty(property) }, { headers });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateMobile(request, ["OWNER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const repo = await getRepo();
  const existing = await repo.getPropertyById(id);
  if (!existing || (existing.ownerId !== auth.session.email && auth.session.role !== "ADMIN")) {
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

  const parsed = parsePropertyPatch(body, existing);
  if (!parsed.ok) {
    return Response.json(
      { ok: false, error: "validation_error", note: parsed.error },
      { status: 400, headers },
    );
  }

  const property = await repo.updateProperty(id, parsed.value);
  if (!property) return notFound();

  return Response.json({ ok: true, property: publicOwnerProperty(property) }, { headers });
}
