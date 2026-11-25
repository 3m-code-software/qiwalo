import { expect, test, type Page } from "@playwright/test";

const ORIGIN = "https://mock-supabase.test";

const USER = {
  id: "mock-user",
  aud: "authenticated",
  role: "authenticated",
  email: "guest@qiwalo.test",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
};

function fakeJwt(): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
    sub: USER.id,
    email: USER.email,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })}.mock-signature`;
}

function fakeSession() {
  return {
    access_token: fakeJwt(),
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "mock-refresh-token",
    user: USER,
  };
}

type Calls = { token: number; verify: number; userGet: number; userPut: number };

async function mockSupabase(page: Page): Promise<Calls> {
  const calls: Calls = { token: 0, verify: 0, userGet: 0, userPut: 0 };
  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    "content-type": "application/json",
  };

  await page.route(`${ORIGIN}/auth/v1/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: cors, body: "" });
      return;
    }
    if (path.endsWith("/token") && request.method() === "POST") {
      calls.token += 1;
      await route.fulfill({ status: 200, headers: cors, body: JSON.stringify(fakeSession()) });
      return;
    }
    if (path.endsWith("/verify") && request.method() === "POST") {
      calls.verify += 1;
      await route.fulfill({ status: 200, headers: cors, body: JSON.stringify(fakeSession()) });
      return;
    }
    if (path.endsWith("/user") && request.method() === "GET") {
      calls.userGet += 1;
      await route.fulfill({ status: 200, headers: cors, body: JSON.stringify(USER) });
      return;
    }
    if (path.endsWith("/user") && request.method() === "PUT") {
      calls.userPut += 1;
      await route.fulfill({ status: 200, headers: cors, body: JSON.stringify(USER) });
      return;
    }
    if (path.endsWith("/logout")) {
      await route.fulfill({ status: 204, headers: cors, body: "" });
      return;
    }
    await route.fulfill({ status: 200, headers: cors, body: "{}" });
  });

  return calls;
}

async function finishPasswordReset(page: Page) {
  const save = page.getByRole("button", { name: "حفظ كلمة المرور" });
  await expect(save).toBeEnabled({ timeout: 10_000 });
  await page.getByLabel("كلمة المرور الجديدة").fill("NewPass123");
  await save.click();
  await expect(page).toHaveURL(/\/login\?reset=1/);
  await expect(page.getByText("تم تحديث كلمة المرور")).toBeVisible();
}

test("رابط PKCE يُستبدل مرة واحدة ثم تُحدَّث كلمة المرور", async ({ page }) => {
  const calls = await mockSupabase(page);
  // الـ verifier بيتبعت في كوكي من نفس المتصفح وقت طلب الرابط.
  await page.addInitScript(() => {
    document.cookie = `sb-mock-supabase-auth-token-code-verifier=${JSON.stringify("mock-verifier")}; path=/; max-age=600`;
  });

  await page.goto("/reset-password?code=mock-auth-code");
  await finishPasswordReset(page);

  expect(calls.token).toBe(1); // قبل الإصلاح كان بيحصل exchange مرتين فاللينك "ينتهي" فوراً.
  expect(calls.userPut).toBe(1);
  expect(new URL(page.url()).search).not.toContain("code=");
});

test("رابط token_hash يعمل على جهاز مختلف بدون كوكي الـ PKCE", async ({ page }) => {
  const calls = await mockSupabase(page);

  await page.goto("/reset-password?token_hash=mock-token-hash&type=recovery");
  await finishPasswordReset(page);

  expect(calls.verify).toBe(1);
  expect(calls.userPut).toBe(1);
});

test("رابط implicit (التوكن في الـ fragment) يعمل بدون استبدال كود", async ({ page }) => {
  const calls = await mockSupabase(page);
  const tokens = new URLSearchParams({
    access_token: fakeJwt(),
    refresh_token: "mock-refresh-token",
    type: "recovery",
    expires_in: "3600",
  });

  await page.goto(`/reset-password#${tokens.toString()}`);
  await finishPasswordReset(page);

  expect(calls.userGet).toBeGreaterThan(0);
  expect(calls.token).toBe(0);
  expect(calls.userPut).toBe(1);
});
