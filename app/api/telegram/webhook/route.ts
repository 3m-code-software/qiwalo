import { timingSafeEqual } from "node:crypto";
import { sendTelegram, sendTelegramToChat } from "@/lib/notifications";
import { telegramWelcomeText, verifyTelegramActivationToken } from "@/lib/telegram";

interface TelegramUpdate {
  message?: {
    chat?: { id?: number | string };
    text?: string;
  };
}

function secretMatches(supplied: string, expected: string): boolean {
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function webhookSecret(): string {
  // الإنتاج لازم يضبط TELEGRAM_WEBHOOK_SECRET؛ في التطوير/Mock ثابت محلي للاختبار.
  return (
    process.env.TELEGRAM_WEBHOOK_SECRET ??
    (process.env.NODE_ENV === "production" ? "" : "qiwalo-local-webhook-secret")
  );
}

export async function POST(request: Request) {
  const expected = webhookSecret();
  if (!expected) {
    return Response.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  const supplied = new URL(request.url).searchParams.get("secret") ?? "";
  if (!secretMatches(supplied, expected)) {
    return Response.json({ ok: false, error: "invalid_secret" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const chatId = update.message?.chat?.id;
  const text = update.message?.text ?? "";
  if (!chatId || !text.startsWith("/start")) {
    return Response.json({ ok: true, note: "ignored" });
  }

  const token = text.match(/^\/start(?:@[\w_]+)?[\s_]+(\S+)/)?.[1] ?? "";
  const activation = token ? await verifyTelegramActivationToken(token) : null;
  if (!activation) {
    await sendTelegramToChat(chatId, "رابط التفعيل غير صالح أو منتهي. افتح رابط التفعيل من موقع قيوالو وجرّب مرة تانية.");
    return Response.json({ ok: true, note: "invalid_token" });
  }

  await sendTelegramToChat(chatId, telegramWelcomeText(activation.name));
  await sendTelegram(`تفعّل تليجرام جديد: ${activation.name}`);
  return Response.json({ ok: true, note: "welcomed" });
}

export function GET() {
  return Response.json({ ok: true, service: "qiwalo-telegram-webhook" });
}
