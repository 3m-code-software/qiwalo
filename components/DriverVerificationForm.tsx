"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitDriverVerificationAction, type FormState } from "@/app/actions";
import { CITIES, DRIVER_SUBSCRIPTION_NOTICE } from "@/lib/constants";
import type { CityKey } from "@/lib/types";
import DocumentUpload from "./DocumentUpload";

export default function DriverVerificationForm({ defaultCity = "LUXOR" }: { defaultCity?: CityKey }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitDriverVerificationAction, {});
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  return (
    <form action={action} className="space-y-5">
      <p className="rounded-xl border border-gold/40 bg-gold-soft p-4 text-sm leading-7 text-navy">
        بياناتك هتتحفظ <strong>قيد المراجعة</strong>. بعد اعتماد الإدارة وتفعيل الاشتراك هتقدر تضيف مركبتك.
        مش بنكتب «مرخّص» إلا بعد مراجعة المستندات.
      </p>

      <label>
        <span className="label">مدينة العمل</span>
        <select name="city" className="input" defaultValue={defaultCity}>
          {Object.entries(CITIES).map(([key, value]) => <option key={key} value={key}>{value.ar}</option>)}
        </select>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <DocumentUpload name="idFront" label="صورة وجه البطاقة" onUrlChange={setFront} hint="صورة واضحة للوجه الأمامي." />
        <DocumentUpload name="idBack" label="صورة ظهر البطاقة" onUrlChange={setBack} hint="صورة واضحة للوجه الخلفي." />
      </div>

      <label className="block">
        <span className="label">رابط رخصة القيادة (https)</span>
        <input name="licenseDocUrl" type="url" required dir="ltr" className="input" placeholder="https://..." />
        <span className="muted mt-1 block text-xs">يظهر للإدارة فقط، ولا يُعرض للضيوف.</span>
      </label>

      <p className="muted text-xs leading-6">{DRIVER_SUBSCRIPTION_NOTICE}</p>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="terms" required className="mt-1" />
        <span>
          أوافق على{" "}
          <Link href="/terms/driver" target="_blank" className="font-bold text-nile underline">شروط السائقين</Link>
          {" "}وأقر بصحة البيانات والوثائق المرفقة.
        </span>
      </label>

      {state.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-xl bg-nile-soft p-3 text-sm font-bold text-nile-dark">{state.ok}</p>}
      {(!front || !back) && <p className="text-xs text-red-600">ارفع صورتي البطاقة قبل الإرسال.</p>}

      <button type="submit" disabled={pending || !front || !back} className="btn-gold !py-3 disabled:opacity-60">
        {pending ? "جارٍ الإرسال..." : "إرسال التحقق للمراجعة ←"}
      </button>
    </form>
  );
}
