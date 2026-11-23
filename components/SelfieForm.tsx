"use client";

import { useActionState, useState } from "react";
import { submitSelfieAction, type FormState } from "@/app/actions";
import DocumentUpload from "./DocumentUpload";

export default function SelfieForm({ defaultUrl }: { defaultUrl?: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitSelfieAction, {});
  const [selfie, setSelfie] = useState(defaultUrl ?? "");

  return (
    <form action={action} className="space-y-4">
      <p className="rounded-xl border border-gold/40 bg-gold-soft p-3 text-sm leading-7 text-navy">
        تمت الموافقة المبدئية على مستنداتك. ارفع صورة شخصية واضحة لك لإتمام التحقق.
      </p>
      <DocumentUpload
        name="selfie"
        label="الصورة الشخصية (سيلفي)"
        defaultUrl={defaultUrl}
        onUrlChange={setSelfie}
        hint="وجهك ظاهر بالكامل، بدون نظارات شمسية، وإضاءة واضحة."
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending || !selfie} className="btn-primary w-full">
        {pending ? "جارٍ الإرسال..." : "إرسال الصورة الشخصية"}
      </button>
    </form>
  );
}
