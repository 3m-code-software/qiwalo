"use client";

import { useActionState } from "react";
import { setDriverSubscriptionAction, type FormState } from "@/app/actions";
import type { DriverSubscriptionStatus } from "@/lib/types";

type Props = {
  userId: string;
  status: DriverSubscriptionStatus;
  label: string;
  className?: string;
};

export default function DriverSubscriptionForm({ userId, status, label, className = "btn-ghost !px-3 !py-1.5 text-xs" }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(setDriverSubscriptionAction, {});

  return (
    <form action={action} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" disabled={pending} className={className} aria-label={`${label} اشتراك السائق`}>
        {pending ? "..." : label}
      </button>
      {state.error && <span role="alert" className="text-xs font-bold text-red-600">{state.error}</span>}
      {state.ok && <span role="status" className="text-xs font-bold text-nile">{state.ok}</span>}
    </form>
  );
}
