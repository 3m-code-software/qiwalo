"use client";

import { useActionState, useState } from "react";
import { createPackageAction, type FormState } from "@/app/actions";
import { CITIES, PACKAGE_CANCEL_POLICY } from "@/lib/constants";
import type { CityKey } from "@/lib/types";

type Option = { id: string; name: string; city: CityKey };

type Props = {
  properties: Option[];
  experiences: Option[];
  transports: Option[];
};

export default function PackageForm({ properties, experiences, transports }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(createPackageAction, {});
  const [city, setCity] = useState<CityKey>("LUXOR");
  const inCity = (items: Option[]) => items.filter((item) => item.city === city);

  return (
    <form action={action} className="space-y-5">
      <p className="rounded-xl border border-gold/40 bg-gold-soft p-4 text-sm leading-7 text-navy">
        الباقة هتتحفظ <strong>قيد المراجعة</strong>، وسعرها لكل ليلة يُضرب في عدد ليالي الضيف.
        الضيف يقدر يضيف معاها سفاري أو نقل منفصل كمان. مش بنكتب «مرخّص» إلا بعد المراجعة.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="label">اسم الباقة</span>
          <input name="name" className="input" required minLength={3} placeholder="مثال: باقة الأقصر: إقامة + سفاري + نقل" />
        </label>
        <label>
          <span className="label">المدينة</span>
          <select
            name="city"
            className="input"
            value={city}
            onChange={(event) => setCity(event.target.value as CityKey)}
          >
            {Object.entries(CITIES).map(([key, value]) => <option key={key} value={key}>{value.ar}</option>)}
          </select>
        </label>
        <label>
          <span className="label">الوحدة</span>
          <select name="propertyId" className="input" required defaultValue="">
            <option value="" disabled>اختر وحدة منشورة تخصك</option>
            {inCity(properties).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>
          <span className="label">التجربة</span>
          <select name="experienceId" className="input" required defaultValue="">
            <option value="" disabled>اختر تجربة منشورة</option>
            {inCity(experiences).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>
          <span className="label">النقل</span>
          <select name="transportId" className="input" required defaultValue="">
            <option value="" disabled>اختر خدمة نقل منشورة</option>
            {inCity(transports).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>
          <span className="label">السعة القصوى للباقة</span>
          <input name="capacity" type="number" min={1} max={100} className="input" defaultValue={4} required />
        </label>
        <label>
          <span className="label">السعر لكل ليلة (ج.م)</span>
          <input name="pricePerNight" type="number" min={100} className="input" required />
        </label>
        <label className="sm:col-span-2">
          <span className="label">المشمولات (سطر لكل بند)</span>
          <textarea
            name="includes"
            rows={4}
            className="input"
            required
            defaultValue={"إقامة في الوحدة\nنقل سيارة خاص\nسفاري مع مرشد"}
          />
        </label>
        <label className="sm:col-span-2">
          <span className="label">رابط مستند المراجعة (https)</span>
          <input name="licenseDocUrl" type="url" className="input" required dir="ltr" placeholder="https://..." />
          <span className="muted mt-1 block text-xs">يظهر للإدارة فقط، ولا يُعرض للضيف.</span>
        </label>
        <label className="sm:col-span-2">
          <span className="label">سياسة الإلغاء</span>
          <textarea name="cancelPolicy" rows={3} className="input" defaultValue={PACKAGE_CANCEL_POLICY} />
        </label>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="btn-gold !py-3 disabled:opacity-60">
        {pending ? "جارٍ الإرسال..." : "إرسال الباقة للمراجعة ←"}
      </button>
    </form>
  );
}
