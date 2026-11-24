"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

export default function ResetPasswordForm({ code }: { code: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  useEffect(() => {
    let active = true;
    async function verify() {
      if (window.location.hash.includes("access_token")) {
        const { data } = await supabase.auth.getSession();
        if (active) setReady(Boolean(data.session));
        return;
      }
      if (!code) {
        if (active) setError("رابط الاستعادة غير صالح. اطلب رابط جديد.");
        return;
      }
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (active) {
        if (exchangeError) setError("انتهت صلاحية رابط الاستعادة. اطلب رابط جديد.");
        else setReady(true);
      }
    }
    void verify();
    return () => { active = false; };
  }, [code, supabase]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 6) {
      setError("كلمة المرور يجب ألا تقل عن 6 أحرف.");
      return;
    }
    setBusy(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError("تعذّر تحديث كلمة المرور. اطلب رابط جديد.");
      return;
    }
    router.push("/login?reset=1");
    router.refresh();
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">{error}</p>
        <a href="/forgot-password" className="btn-ghost w-full !justify-center">اطلب رابط جديد</a>
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
