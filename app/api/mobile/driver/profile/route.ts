import { authenticateMobile } from "@/lib/mobile-auth";
import { publicDriverProfile } from "@/lib/mobile-role-service";
import { getRepo } from "@/lib/repo";

const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const auth = await authenticateMobile(request, ["DRIVER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const profile = await (await getRepo()).getDriverProfile(auth.session.email);
  if (!profile) {
    return Response.json(
      { ok: false, error: "not_found", note: "ملف السائق غير موجود." },
      { status: 404, headers },
    );
  }

  return Response.json({ ok: true, profile: publicDriverProfile(profile) }, { headers });
}
