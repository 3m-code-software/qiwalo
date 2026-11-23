"use client";

import { useState } from "react";
import { useActionState } from "react";
import { signInAction, signUpAction, type FormState } from "@/app/actions";

type Mode = "signin" | "signup";

const demos = [
  { email: "guest@qiwalo.test", label: "ضيف تجريبي" },
  { email: "owner@qiwalo.test", label: "مالك تجريبي" },
  { email: "admin@qiwalo.test", label: "مدير تجريبي" },
];

export default function LoginForm({
  next,
  role,
  showDemo = false,
}: {
  next?: string;
  role?: string;
  showDemo?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("signin");
  const [signInState, signIn, signInPending] = useActionState<FormState, FormData>(signInAction, {});
  const [signUpState, signUp, signUpPending] = useActionState<FormState, FormData>(signUpAction, {});
  const defaultRole = role === "OWNER" ? "OWNER" : "GUEST";

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-line bg-ivory p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`rounded-lg py-2 text-sm font-bold transition ${
            mode === "signin" ? "bg-navy text-white shadow-sm" : "muted hover:text-navy"
          }`}
        >
          دخول
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-lg py-2 text-sm font-bold transition ${
            mode === "signup" ? "bg-navy text-white shadow-sm" : "muted hover:text-navy"
          }`}
        >
          إنشاء حساب
        </button>
      </div>

      {mode === "signin" ? (
        <form action={signIn} className="space-y-4">
          <input type="hidden" name="next" value={next ?? ""} />
          <div>
            <label className="label" htmlFor="signin-email">البريد الإلكتروني</label>
            <input id="signin-email" name="email" type="email" autoComplete="email" className="input" placeholder="name@example.com" required />
          </div>
          <div>
            <label className="label" htmlFor="signin-password">كلمة المرور</label>
            <input id="signin-password" name="password" type="password" autoComplete="current-password" className="input" placeholder="••••••••" required minLength={6} />
          </div>
          {signInState.error && <p className="text-sm text-red-600">{signInState.error}</p>}
          <button type="submit" disabled={signInPending} className="btn-primary w-full">
            {signInPending ? "جارٍ الدخول..." : "دخول"}
          </button>
        </form>
      ) : (
        <form action={signUp} className="space-y-4">
          <input type="hidden" name="next" value={next ?? ""} />
          <div>
            <label className="label" htmlFor="signup-name">الاسم الكامل</label>
            <input id="signup-name" name="name" className="input" placeholder="اسمك" required minLength={2} />
          </div>
          <div>
            <label className="label" htmlFor="signup-email">البريد الإلكتروني</label>
            <input id="signup-email" name="email" type="email" autoComplete="email" className="input" placeholder="name@example.com" required />
          </div>
          <div>
            <label className="label" htmlFor="signup-password">كلمة المرور</label>
            <input id="signup-password" name="password" type="password" autoComplete="new-password" className="input" placeholder="6 أحرف على الأقل" required minLength={6} />
          </div>
          <div>
            <label className="label" htmlFor="signup-role">نوع الحساب</label>
            <select id="signup-role" name="role" className="input" defaultValue={defaultRole}>
              <option value="GUEST">ضيف — أحجز إقامات</option>
              <option value="OWNER">صاحب وحدة — أضف وحداتك</option>
            </select>
          </div>
          {signUpState.error && <p className="text-sm text-red-600">{signUpState.error}</p>}
          <button type="submit" disabled={signUpPending} className="btn-primary w-full">
            {signUpPending ? "جارٍ إنشاء الحساب..." : "إنشاء حساب"}
          </button>
        </form>
      )}

      {showDemo && (
        <div className="my-6 border-t border-line pt-5">
          <p className="muted mb-3 text-center text-xs">حسابات تجريبية للاختبار ( locally )</p>
          <div className="grid gap-2">
            {demos.map((d) => (
              <form key={d.email} action={signIn}>
                <input type="hidden" name="email" value={d.email} />
                <input type="hidden" name="password" value="demo" />
                <input type="hidden" name="next" value={next ?? ""} />
                <button className="btn-ghost w-full !justify-between text-xs">
                  <span>{d.label}</span><span dir="ltr" className="muted">{d.email}</span>
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
