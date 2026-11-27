import { authenticateMobile } from "@/lib/mobile-auth";
import { parseNewProperty, publicOwnerProperty } from "@/lib/mobile-role-service";
import { getRepo } from "@/lib/repo";

const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const auth = await authenticateMobile(request, ["OWNER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const properties = await (await getRepo()).listPropertiesForOwner(auth.session.email);
  return Response.json(
    { ok: true, properties: properties.map(publicOwnerProperty) },
    { headers },
  );
}

export async function POST(request: Request) {
  const auth = await authenticateMobile(request, ["OWNER", "ADMIN"]);
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

  const parsed = parseNewProperty(body, auth.session.email);
  if (!parsed.ok) {
    return Response.json(
      { ok: false, error: "validation_error", note: parsed.error },
      { status: 400, headers },
    );
  }

  const property = await (await getRepo()).createProperty(parsed.value);
  return Response.json(
    { ok: true, property: publicOwnerProperty(property) },
    { status: 201, headers },
  );
}
