import { defineConfig, devices } from "@playwright/test";

/**
 * بيئة منفصلة لاختبار مسار استعادة كلمة المرور بـ Supabase وهمي.
 * المتغيرات هنا وهمية تماماً وما بتوصل لأي خدمة حقيقية — كل الطلبات متاعترضة في الـ spec.
 */
const port = Number(process.env.PLAYWRIGHT_RECOVERY_PORT || 3131);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /recovery-flow\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  timeout: 60_000,
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
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_URL: "https://mock-supabase.test",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "mock-anon-key-for-tests-only",
      NEXT_PUBLIC_SITE_URL: baseURL,
      TELEGRAM_BOT_TOKEN: "",
      TELEGRAM_ADMIN_CHAT_ID: "",
      RESEND_API_KEY: "",
      WHATSAPP_TOKEN: "",
    },
  },
});
