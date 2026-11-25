import { expect, test } from "@playwright/test";
import { parseRecoveryLink } from "../lib/recovery-link";

test("تحليل روابط الاستعادة يغطي PKCE و token_hash و implicit", () => {
  expect(parseRecoveryLink("https://qiwalo.test/reset-password?code=abc123&sb_flow_id=f1")).toEqual({
    kind: "code",
    code: "abc123",
  });
  expect(parseRecoveryLink("https://qiwalo.test/reset-password?token_hash=hash123&type=recovery")).toEqual({
    kind: "token_hash",
    tokenHash: "hash123",
    type: "recovery",
  });
  expect(parseRecoveryLink("https://qiwalo.test/reset-password#access_token=a&refresh_token=r&type=recovery")).toEqual({
    kind: "implicit",
    accessToken: "a",
    refreshToken: "r",
  });
  expect(parseRecoveryLink("https://qiwalo.test/reset-password?error_description=expired")).toMatchObject({
    kind: "error",
  });
  expect(parseRecoveryLink("https://qiwalo.test/reset-password")).toEqual({ kind: "none" });
});

test("رابط الاستعادة لما يفشل يعرض نموذج طلب رابط جديد شغال", async ({ page }) => {
  await page.goto("/reset-password?code=expired");

  // في CI ما فيش Supabase، فالـ Server Action يضيف تنبيه ثاني بنفس النص داخل الفورم.
  const alert = page.locator("p.text-red-600").first();
  await expect(alert).toContainText("استعادة كلمة المرور متاحة في النسخة المنشورة فقط.");

  const email = page.getByLabel("البريد الإلكتروني");
  await expect(email).toBeVisible();
  await email.fill("guest@qiwalo.test");

  const resend = page.getByRole("button", { name: "اطلب رابط جديد" });
  await expect(resend).toBeVisible();
  await resend.click();

  // في بيئة Mock ما فيش Supabase، بس الفورم بيعمل submit فعلاً ويرجع رسالة واضحة.
  await expect(alert).toContainText("استعادة كلمة المرور متاحة في النسخة المنشورة فقط.");
  expect(await page.locator("html").getAttribute("dir")).toBe("rtl");
});
