import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "./types";

export interface Session {
  email: string;
  name: string;
  role: Role;
}

const COOKIE = "qiwalo_session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "qiwalo-local-dev-secret-change-before-production",
);

export async function createSession(session: Session): Promise<void> {
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

export async function getSession(): Promise<Session | null> {
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
