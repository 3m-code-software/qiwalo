"use client";

import { useActionState } from "react";
import { createGuestAccountAction, type FormState } from "@/app/actions";

export default function GuestAccountForm({
  reference,
  email,
  name,
}: {
  reference: string;
  email: string;
  name: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createGuestAccountAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="reference" value={reference} />
      <input type="hidden" name="email" value={email} />

      <div>
        <label className="label" htmlFor="guest-account-email">البريد المرتبط بالحجز</label>
        <input id="guest-account-email" value={email} dir="ltr" readOnly className="input opacity-70" />
      </div>
      <div>
        <label className="label" htmlFor="guest-account-name">الاسم</label>
        <input id="guest-account-name" name="name" className="input" defaultValue={name} autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="guest-account-password">كلمة المرور</label>
        <input
          id="guest-account-password"
          name="password"
          type="password"
          className="input"
          required
          minLength={6}
          placeholder="6 أحرف على الأقل"
          autoComplete="new-password"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
        {pending ? "جارٍ إنشاء الحساب..." : "إنشاء حساب ضيف"}
      </button>
    </form>
  );
}
