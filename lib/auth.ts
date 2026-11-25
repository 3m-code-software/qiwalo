import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getRepo } from "./repo";
import type { Role } from "./types";
import { createSupabaseServerClient, isSupabaseConfigured } from "./supabase/server";

export interface Session {
  email: string;
  name: string;
  role: Role;
}

/* Legacy local-dev session. Supabase Auth replaces this when configured. */
const COOKIE = "qiwalo_session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "qiwalo-local-dev-secret-change-before-production",
);

async function createLegacySession(session: Session): Promise<void> {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

async function getLegacySession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

/** Kept for local development only. Production uses Supabase Auth. */
export async function createSession(session: Session): Promise<void> {
  if (isSupabaseConfigured()) return;
  await createLegacySession(session);
}

export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") return null;
    // جلسة التطوير المحلية تتحقّق وقت الطلب: jwtVerify بيقرأ الوقت الحالي،
    // فلا بد نخرج من الـ prerender عشان ما يظهرش خطأ new Date() مع Cache Components.
    await connection();
    return getLegacySession();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const email = user.email.toLowerCase();
  const repo = await getRepo();
  const dbUser = await repo.getUserByEmail(email);
  if (!dbUser) return null;

  return { email: dbUser.email, name: dbUser.name, role: dbUser.role };
}

export async function requireRole(role: Role): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login?next=" + encodeURIComponent("/" + role.toLowerCase()));
  if (session.role !== role && session.role !== "ADMIN") redirect("/");
  return session;
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
