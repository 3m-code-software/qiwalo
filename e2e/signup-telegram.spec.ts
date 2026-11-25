import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const DEV_WEBHOOK_SECRET = "qiwalo-local-webhook-secret";

function newEmail(): string {
  return `signup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@qiwalo.test`;
}

async function signUp(
  page: Page,
  options: {
    email: string;
    name: string;
    role?: "GUEST" | "OWNER";
    next?: string;
    onForm?: (page: Page) => Promise<void>;
  },
): Promise<string> {
  await page.goto(options.next ? `/login?next=${encodeURIComponent(options.next)}` : "/login");
  await page.getByRole("button", { name: "إنشاء حساب", exact: true }).click();
  if (options.onForm) await options.onForm(page);
  await page.locator("#signup-name").fill(options.name);
  await page.locator("#signup-email").fill(options.email);
  await page.locator("#signup-phone").fill("01012345678");
  await page.locator("#signup-password").fill("demo123");
  if (options.role === "OWNER") await page.locator("#signup-role").selectOption("OWNER");
  await page.locator("#signup-terms").check();
  await page.locator("form").getByRole("button", { name: "إنشاء حساب" }).click();
  await page.waitForURL((url) => url.pathname === "/telegram", { timeout: 30_000 });
  const href = await page.getByRole("link", { name: /بوت قيوالو/ }).getAttribute("href");
  expect(href).toMatch(/^https:\/\/t\.me\/qiwalo_notify_bot\?start=/);
  return new URL(href!).searchParams.get("start") ?? "";
}

test("إنشاء حساب ضيف يطلب رقم التليفون ويعرض رابط تفعيل تليجرام", async ({ page }) => {
  const token = await signUp(page, {
    email: newEmail(),
    name: "تجربة ضيف",
    onForm: async (formPage) => {
      await expect(formPage.locator("#signup-phone")).toHaveAttribute("required", "");
      await expect(formPage.locator("#signup-phone")).toHaveAttribute("type", "tel");
    },
  });
  expect(token.length).toBeGreaterThan(20);
  await expect(page.getByText("تم إنشاء حسابك يا تجربة ضيف")).toBeVisible();
  await expect(page.getByRole("link", { name: /تخطي/ })).toHaveAttribute("href", "/");
});

test("إنشاء حساب مالك يحفظ وجهة next بعد التفعيل", async ({ page }) => {
  await signUp(page, {
    email: newEmail(),
    name: "تجربة مالك",
    role: "OWNER",
    next: "/owner/profile",
  });
  await expect(page.getByRole("link", { name: /تخطي/ })).toHaveAttribute("href", "/owner/profile");
});

test("webhook التليجرام يرفض السر الغلط ويرحّب بالتوكن الموقّع فقط", async ({ page, request }) => {
  const token = await signUp(page, { email: newEmail(), name: "تجربة ترحيب" });

  const wrongSecret = await postWebhook(request, DEV_WEBHOOK_SECRET + "x", "/start " + token);
  expect(wrongSecret.status()).toBe(401);

  const ignored = await postWebhook(request, DEV_WEBHOOK_SECRET, "مرحباً");
  expect(ignored.status()).toBe(200);
  expect((await ignored.json()).note).toBe("ignored");

  const tampered = await postWebhook(request, DEV_WEBHOOK_SECRET, "/start " + token + "x");
  expect(tampered.status()).toBe(200);
  expect((await tampered.json()).note).toBe("invalid_token");

  const welcomed = await postWebhook(request, DEV_WEBHOOK_SECRET, `/start@qiwalo_notify_bot ${token}`);
  expect(welcomed.status()).toBe(200);
  expect((await welcomed.json()).note).toBe("welcomed");

  const health = await request.get("/api/telegram/webhook");
  expect(health.status()).toBe(200);
  expect((await health.json()).service).toBe("qiwalo-telegram-webhook");
});

function postWebhook(request: APIRequestContext, secret: string, text: string) {
  return request.post(`/api/telegram/webhook?secret=${encodeURIComponent(secret)}`, {
    data: { message: { chat: { id: 123456789 }, text } },
  });
}
