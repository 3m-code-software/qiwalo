import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { connection } from "next/server";
import { getRepo } from "./repo";
import type { Role } from "./types";

/** جلسة موبايل مستقلة عن كوكي الويب؛ التطبيق بيبعته كـ Bearer token. */
export interface MobileSession {
  email: string;
  name: string;
  role: Role;
}

const secret = new TextEncoder().encode(
  process.env.MOBILE_JWT_SECRET ??
    process.env.SESSION_SECRET ??
    "qiwalo-mobile-local-dev-secret-change-before-production",
);

export const MOBILE_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export type MobileAuthResult =
  | { ok: true; session: MobileSession }
  | { ok: false; response: Response };

function fail(status: number, error: string, note: string): MobileAuthResult {
  return {
    ok: false,
    response: Response.json(
      { ok: false, error, note },
      { status, headers: { "Cache-Control": "no-store" } },
    ),
  };
}

export async function issueMobileToken(session: MobileSession): Promise<string> {
  return new SignJWT({ name: session.name, role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.email)
    .setIssuedAt()
    .setExpirationTime(`${MOBILE_TOKEN_TTL_SECONDS}s`)
    .sign(secret);
}

/**
 * التحقق من التوكن ثم إعادة قراءة الدور من قاعدة البيانات في كل طلب،
 * فتغيير دور المستخدم أو تعطيله ينعكس فوراً بدون انتظار انتهاء التوكن.
 */
export async function authenticateMobile(
  request: Request,
  allowed: readonly Role[] = ["OWNER", "DRIVER", "ADMIN"],
): Promise<MobileAuthResult> {
  // jwtVerify بيقرأ الوقت الحالي؛ الخروج من prerender مطلوب مع Cache Components.
  await connection();

  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  if (!match) return fail(401, "unauthorized", "سجّل الدخول أولاً.");

  try {
    const { payload } = await jwtVerify(match[1], secret);
    const email = String(payload.sub ?? "").toLowerCase();
    if (!email) return fail(401, "unauthorized", "التوكن غير صالح.");

    const user = await (await getRepo()).getUserByEmail(email);
    if (!user) return fail(401, "unauthorized", "الحساب غير موجود.");
    if (!allowed.includes(user.role)) {
      return fail(403, "forbidden", "هذا الحساب غير مسموح له بهذا القسم.");
    }

    return {
      ok: true,
      session: { email: user.email, name: user.name, role: user.role },
    };
  } catch {
    return fail(401, "unauthorized", "التوكن غير صالح أو منتهي.");
  }
}
