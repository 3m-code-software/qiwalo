import { defineConfig, devices } from "@playwright/test";

/**
 * بيئة مخصّصة للوضع الجديد (السائقون والمركبات) على منفذ مستقل.
 * reuseExistingServer = false عمداً: كل تشغيل يبدأ بحالة Mock نظيفة،
 * فما يتأثرش اختبار الحجوزات والأيام المحجوزة بـ state قديم من hot reload.
 */
const port = Number(process.env.PLAYWRIGHT_DRIVER_PORT || 3141);
const baseURL = `http://localhost:${port}`;
// helpers.ts يقرأ BASE_URL من env للسياقات الإضافية؛ لازم يشير لنفس منفذ الوضع الجديد.
process.env.PLAYWRIGHT_BASE_URL = baseURL;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /driver(?:-ops)?\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  timeout: 120_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    locale: "ar-EG",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev -p ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      DATABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      NEXT_PUBLIC_SITE_URL: baseURL,
      // منع أي اتصال خارجي؛ الإشعارات تروح للسجلات فقط.
      TELEGRAM_BOT_TOKEN: "",
      TELEGRAM_ADMIN_CHAT_ID: "",
      RESEND_API_KEY: "",
      WHATSAPP_TOKEN: "",
    },
  },
});
