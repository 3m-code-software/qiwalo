"use client";

import { useActionState } from "react";
import { requestPasswordResetAction, type FormState } from "@/app/actions";

export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    requestPasswordResetAction,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="reset-email">البريد الإلكتروني</label>
        <input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          className="input"
          placeholder="name@example.com"
          required
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm font-bold text-emerald-700">{state.ok}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
      </button>
    </form>
  );
}
