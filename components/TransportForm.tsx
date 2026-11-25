"use client";

import { useActionState } from "react";
import { createTransportAction, type FormState } from "@/app/actions";
import { CITIES, TRANSPORT_CANCEL_POLICY, TRANSPORT_TYPES } from "@/lib/constants";

export default function TransportForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createTransportAction, {});

  return (
    <form action={action} className="space-y-5">
      <p className="rounded-xl border border-gold/40 bg-gold-soft p-4 text-sm leading-7 text-navy">
        الخدمة هتتحفظ <strong>قيد المراجعة</strong>. بعد ما الإدارة تراجع مستندها هتظهر على وحدات المدينة دي.
        مش بنكتب «مرخّص» إلا بعد المراجعة.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="label">اسم خدمة النقل</span>
          <input name="name" className="input" required minLength={3} placeholder="مثال: سيارة خاصة لجولات الأقصر" />
        </label>
        <label>
          <span className="label">نوع النقل</span>
          <select name="type" className="input" defaultValue="CAR">
            {Object.entries(TRANSPORT_TYPES).map(([key, value]) => <option key={key} value={key}>{value.ar}</option>)}
          </select>
        </label>
        <label>
          <span className="label">المدينة</span>
          <select name="city" className="input" defaultValue="LUXOR">
            {Object.entries(CITIES).map(([key, value]) => <option key={key} value={key}>{value.ar}</option>)}
          </select>
        </label>
        <label>
          <span className="label">نقطة الانطلاق</span>
          <input name="routeFrom" className="input" required placeholder="الأقصر الشرقية" />
        </label>
        <label>
          <span className="label">الوجهة</span>
          <input name="routeTo" className="input" required placeholder="وادي الملوك" />
        </label>
        <label className="sm:col-span-2">
          <span className="label">نقطة اللقاء</span>
          <input name="meetingPoint" className="input" required placeholder="استقبال الفندق — الكورنيش" />
        </label>
        <label>
          <span className="label">المدة (ساعات)</span>
          <input name="durationHours" type="number" min={1} max={24} className="input" defaultValue={5} required />
        </label>
        <label>
          <span className="label">السعة القصوى</span>
          <input name="capacity" type="number" min={1} max={100} className="input" defaultValue={4} required />
        </label>
        <label>
          <span className="label">سعر الرحلة للمركبة (ج.م)</span>
          <input name="pricePerTrip" type="number" min={50} className="input" required />
          <span className="muted mt-1 block text-xs">الضيوف بيدفعوا سعر الرحلة مرة واحدة، مش سعر لكل فرد.</span>
        </label>
        <label className="sm:col-span-2">
          <span className="label">المشمولات (سطر لكل بند)</span>
          <textarea name="includes" rows={4} className="input" required placeholder={"سائق مرافق\nمياه معدنية\nالعودة لنقطة اللقاء"} />
        </label>
        <label className="sm:col-span-2">
          <span className="label">رابط مستند المراجعة (https)</span>
          <input name="licenseDocUrl" type="url" className="input" required dir="ltr" placeholder="https://..." />
          <span className="muted mt-1 block text-xs">يظهر للإدارة فقط، ولا يُعرض للضيف.</span>
        </label>
        <label className="sm:col-span-2">
          <span className="label">سياسة الإلغاء</span>
          <textarea name="cancelPolicy" rows={3} className="input" defaultValue={TRANSPORT_CANCEL_POLICY} />
        </label>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="btn-gold !py-3 disabled:opacity-60">
        {pending ? "جارٍ الإرسال..." : "إرسال النقل للمراجعة ←"}
      </button>
    </form>
  );
}
