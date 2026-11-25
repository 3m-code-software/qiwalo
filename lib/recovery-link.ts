/**
 * تحليل رابط استعادة كلمة المرور القادم من Supabase Auth.
 * بيغطّي الثلاث صيغ اللي بترجع من بريد Supabase:
 *  - implicit: `#access_token=...&refresh_token=...&type=recovery`
 *  - token_hash: `?token_hash=...&type=recovery` (آمن عبر أجهزة مختلفة)
 *  - pkce: `?code=...` (ومعاه `sb_flow_id` الاختياري)
 * الدالة نقية عشان تتختبر بدون Supabase أو متصفح.
 */
export type RecoveryLink =
  | { kind: "implicit"; accessToken: string; refreshToken: string }
  | { kind: "token_hash"; tokenHash: string; type: string }
  | { kind: "code"; code: string }
  | { kind: "error"; message: string }
  | { kind: "none" };

export function parseRecoveryLink(href: string): RecoveryLink {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return { kind: "none" };
  }

  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const query = url.searchParams;

  const errorMessage =
    query.get("error_description") ||
    hash.get("error_description") ||
    query.get("error") ||
    hash.get("error");
  if (errorMessage) return { kind: "error", message: errorMessage };

  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    return { kind: "implicit", accessToken, refreshToken };
  }

  const tokenHash = query.get("token_hash") ?? hash.get("token_hash");
  if (tokenHash) {
    return { kind: "token_hash", tokenHash, type: query.get("type") ?? hash.get("type") ?? "" };
  }

  const code = query.get("code");
  if (code) return { kind: "code", code };

  return { kind: "none" };
}
