import "server-only";

import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "qiwalo-local-dev-secret-change-before-production",
);

export interface TelegramActivation {
  email: string;
  name: string;
}

/** يوقّع رابط التفعيل؛ الرابط نفسه ما بيحتويش على رقم التليفون أو أي بيانات حساسة. */
export async function createTelegramActivationToken(
  activation: TelegramActivation,
): Promise<string> {
  return new SignJWT({
    email: activation.email,
    name: activation.name,
    purpose: "telegram-activate",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyTelegramActivationToken(
  token: string,
): Promise<TelegramActivation | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.purpose !== "telegram-activate") return null;
    if (typeof payload.email !== "string" || typeof payload.name !== "string") return null;
    return { email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

export function telegramBotLink(token: string): string {
  const username = (process.env.TELEGRAM_BOT_USERNAME || "qiwalo_notify_bot").replace(/^@/, "");
  return `https://t.me/${username}?start=${encodeURIComponent(token)}`;
}

/** الترحيب بيستخدم اسم العميل فقط، من غير رقم التليفون أو البريد. */
export function telegramWelcomeText(name: string): string {
  return [
    `أهلاً يا ${name} 👋`,
    "تم تسجيلك في قيوالو بنجاح. نتمنى لك تجربة راقية في الأقصر وأسوان.",
    "لو احتجت أي مساعدة: واتساب/تليجرام 01066094050.",
  ].join("\n");
}
