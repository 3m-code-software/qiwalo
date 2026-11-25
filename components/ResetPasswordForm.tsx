"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { requestPasswordResetAction, type FormState } from "@/app/actions";
import { parseRecoveryLink } from "@/lib/recovery-link";

/** نموذج طلب رابط جديد — نفس الـ Server Action المستخدم في صفحة forgot-password. */
function ResendResetLink() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    requestPasswordResetAction,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="resend-reset-email">البريد الإلكتروني</label>
        <input
          id="resend-reset-email"
          name="email"
          type="email"
          autoComplete="email"
          className="input"
          placeholder="name@example.com"
          required
        />
      </div>
      {state.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}
      {state.ok && <p className="text-sm font-bold text-emerald-700">{state.ok}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "جارٍ الإرسال..." : "اطلب رابط جديد"}
      </button>
      <p className="muted text-center text-xs">
        افتح الرابط الجديد من نفس المتصفح اللي طلبته.
      </p>
    </form>
  );
}

function friendlyRecoveryError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("verifier") || text.includes("code") || text.includes("different")) {
    return "رابط الاستعادة صالح لمرة واحدة في نفس المتصفح اللي طلبته. اطلب رابط جديد وجرّب من نفس الجهاز.";
  }
  if (text.includes("expired") || text.includes("invalid") || text.includes("not found")) {
    return "انتهت صلاحية رابط الاستعادة. اطلب رابط جديد.";
  }
  return "رابط الاستعادة غير صالح. اطلب رابط جديد.";
}

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  // StrictMode في dev ينفّذ الـ effect مرتين؛ الرابط يُستبدل مرة واحدة فقط.
  const attempted = useRef(false);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = useMemo(() => {
    if (!url || !key) return null;
    // @supabase/ssr يفرض PKCE دائماً. نوقف الالتقاط التلقائي عشان ما نستبدلش
    // كود الاستعادة مرتين (المرة التانية كانت بتطلع خطأ "انتهت الصلاحية").
    return createBrowserClient(url, key, {
      auth: { detectSessionInUrl: false, flowType: "pkce" },
    });
  }, [url, key]);

  useEffect(() => {
    // StrictMode ينفّذ الـ effect مرتين في dev؛ الرابط لازم يُستبدل مرة واحدة بس.
    if (attempted.current) return;
    attempted.current = true;

    async function verify() {
      if (!supabase) {
        setError("استعادة كلمة المرور متاحة في النسخة المنشورة فقط.");
        return;
      }

      const link = parseRecoveryLink(window.location.href);
      let verifyError: string | null = null;
      let verified = false;

      if (link.kind === "error") {
        verifyError = friendlyRecoveryError(link.message);
      } else if (link.kind === "implicit") {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: link.accessToken,
          refresh_token: link.refreshToken,
        });
        verifyError = sessionError ? friendlyRecoveryError(sessionError.message) : null;
        verified = !sessionError;
      } else if (link.kind === "token_hash") {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: link.tokenHash,
          type: link.type || "recovery",
        });
        verifyError = otpError ? friendlyRecoveryError(otpError.message) : null;
        verified = !otpError;
      } else if (link.kind === "code") {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(link.code);
        verifyError = exchangeError ? friendlyRecoveryError(exchangeError.message) : null;
        verified = !exchangeError;
      } else {
        const { data } = await supabase.auth.getSession();
        verified = Boolean(data.session);
        if (!verified) verifyError = "افتح رابط الاستعادة من الإيميل أولاً، أو اطلب رابط جديد.";
      }

      if (verified) {
        // امسح التوكن من العنوان والـ history عشان ما يتستخدمش تاني بالغلط.
        window.history.replaceState(null, "", window.location.pathname);
        setReady(true);
      } else {
        setError(verifyError ?? "رابط الاستعادة غير صالح. اطلب رابط جديد.");
      }
    }

    void verify();
  }, [supabase]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    if (password.length < 6) {
      setError("كلمة المرور يجب ألا تقل عن ٦ أحرف.");
      return;
    }
    setBusy(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setBusy(false);
      setError("تعذّر تحديث كلمة المرور. اطلب رابط جديد وحاول مرة تانية.");
      return;
    }
    // الجلسة المؤقتة للاستعادة ما ينبغيش يفضل عليها بعد تغيير كلمة المرور.
    await supabase.auth.signOut();
    router.replace("/login?reset=1");
  }

  if (error) {
    return (
      <div className="space-y-4" aria-live="polite">
        <p className="text-sm text-red-600" role="alert">{error}</p>
        <ResendResetLink />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="new-password">كلمة المرور الجديدة</label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          className="input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={busy || !ready} className="btn-primary w-full">
        {busy ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
      </button>
      {!ready && <p className="muted text-center text-xs">جارٍ التحقق من رابط الاستعادة...</p>}
    </form>
  );
}
