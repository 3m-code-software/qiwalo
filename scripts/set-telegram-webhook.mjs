/**
 * ربط بوت تليجرام بالـ webhook مرة واحدة بعد النشر.
 * التشغيل: npm run telegram:webhook
 * القيم تُقرأ من .env.local / متغيرات Vercel، ولا تُطبع في الأ output.
 */
const token = process.env.TELEGRAM_BOT_TOKEN;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token || !siteUrl || !secret) {
  console.error("لازم TELEGRAM_BOT_TOKEN وNEXT_PUBLIC_SITE_URL وTELEGRAM_WEBHOOK_SECRET تكون موجودة في البيئة.");
  process.exit(1);
}

const url = `${siteUrl.replace(/\/$/, "")}/api/telegram/webhook?secret=${encodeURIComponent(secret)}`;

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url, drop_pending_updates: true }),
});
const data = await response.json();

console.log(
  JSON.stringify(
    { ok: data.ok, description: data.description, webhookHost: new URL(url).host },
    null,
    2,
  ),
);
if (!data.ok) process.exit(1);
