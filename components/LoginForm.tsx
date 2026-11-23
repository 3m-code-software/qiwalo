"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "@/app/actions";

const demos = [
  { email: "guest@qiwalo.test", label: "ضيف تجريبي" },
  { email: "owner@qiwalo.test", label: "مالك تجريبي" },
  { email: "admin@qiwalo.test", label: "مدير تجريبي" },
];

export default function LoginForm({ next, role }: { next?: string; role?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});

  return (
    <div>
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <input type="hidden" name="role" value={role ?? "GUEST"} />
        <div>
          <label className="label" htmlFor="email">البريد الإلكتروني</label>
          <input id="email" name="email" type="email" className="input" placeholder="name@example.com" required />
        </div>
        <div>
          <label className="label" htmlFor="name">الاسم (للمستخدم الجديد)</label>
          <input id="name" name="name" className="input" placeholder="اسمك" />
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "جارٍ الدخول..." : "دخول / إنشاء حساب"}
        </button>
      </form>

      <div className="my-6 border-t border-line pt-5">
        <p className="muted mb-3 text-center text-xs">حسابات تجريبية للاختبار</p>
        <div className="grid gap-2">
          {demos.map((d) => (
            <form key={d.email} action={action}>
              <input type="hidden" name="email" value={d.email} />
              <input type="hidden" name="role" value={d.email.startsWith("admin") ? "ADMIN" : d.email.startsWith("owner") ? "OWNER" : "GUEST"} />
              <input type="hidden" name="next" value={next ?? ""} />
              <button className="btn-ghost w-full !justify-between text-xs">
                <span>{d.label}</span><span dir="ltr" className="muted">{d.email}</span>
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
