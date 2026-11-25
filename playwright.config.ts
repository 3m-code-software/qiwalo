import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 3130);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${port}`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  // مكتبة Mock في الذاكرة مشتركة بين كل الاختبارات → تشغيل متسلسل.
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  timeout: 60_000,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL,
    locale: "ar-EG",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // اختبارات على Mock محلي فقط — مفيش أي طلب على الإنتاج.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npx next dev -p ${port}`,
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 120_000,
        env: {
          DATABASE_URL: "",
          NEXT_PUBLIC_SUPABASE_URL: "",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
          NEXT_PUBLIC_SITE_URL: baseURL,
          // منع أي اتصال خارجي أثناء الاختبار؛ الإشعارات تروح للـ logs.
          TELEGRAM_BOT_TOKEN: "",
          TELEGRAM_ADMIN_CHAT_ID: "",
          RESEND_API_KEY: "",
          WHATSAPP_TOKEN: "",
        },
      },
});
