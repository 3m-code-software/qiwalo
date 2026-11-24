"use client";

import { useActionState } from "react";
import { moderatePropertyAction, type FormState } from "@/app/actions";
import { useAdminNotice } from "@/components/AdminNoticeProvider";

export default function PropertyModerationForm({
  propertyId,
  propertyName,
  status,
  label,
  className,
}: {
  propertyId: string;
  propertyName: string;
  status: "PUBLISHED" | "REJECTED";
  label: string;
  className: string;
}) {
  const { showNotice } = useAdminNotice();
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (previous, formData) => {
      const result = await moderatePropertyAction(previous, formData);
      if (result.ok) showNotice(result.ok);
      return result;
    },
    {},
  );
  const confirmText = status === "PUBLISHED"
    ? `تنشر الوحدة «${propertyName}»؟`
    : `ترفض الوحدة «${propertyName}»؟`;

  return (
    <form
      action={formAction}
      className="flex flex-col items-start gap-1"
      onSubmit={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={propertyId} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" disabled={pending} className={className}>
        {pending ? "جارٍ..." : label}
      </button>
      {state.error && <span role="alert" className="text-xs font-bold text-red-600">{state.error}</span>}
    </form>
  );
}
