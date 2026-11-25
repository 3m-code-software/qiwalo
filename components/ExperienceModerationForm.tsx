"use client";

import { useActionState } from "react";
import { moderateExperienceAction, type FormState } from "@/app/actions";

type Props = {
  experienceId: string;
  status: "PUBLISHED" | "REJECTED" | "DRAFT" | "PENDING";
  label: string;
  className?: string;
};

export default function ExperienceModerationForm({ experienceId, status, label, className = "btn-ghost !px-3 !py-1.5 text-xs" }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(moderateExperienceAction, {});

  return (
    <form action={action} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="id" value={experienceId} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" disabled={pending} className={className} aria-label={`${label} التجربة`}>
        {pending ? "..." : label}
      </button>
      {state.error && <span role="alert" className="text-xs font-bold text-red-600">{state.error}</span>}
      {state.ok && <span role="status" className="text-xs font-bold text-nile">{state.ok}</span>}
    </form>
  );
}
