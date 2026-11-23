"use client";

import { useActionState } from "react";
import { createPropertyAction, type FormState } from "@/app/actions";
import { AMENITIES, CITIES, PROPERTY_TYPES } from "@/lib/constants";
import type { CityKey, PropertyType } from "@/lib/types";

export default function PropertyForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createPropertyAction, {});

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">اسم الوحدة</label>
          <input id="name" name="name" className="input" placeholder="شقة بإطلالة على النيل" required />
        </div>
        <div>
          <label className="label" htmlFor="city">المدينة</label>
          <select id="city" name="city" className="input" defaultValue="LUXOR">
            {(Object.keys(CITIES) as CityKey[]).map((k) => <option key={k} value={k}>{CITIES[k].ar}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="type">نوع الوحدة</label>
          <select id="type" name="type" className="input" defaultValue="APARTMENT">
            {(Object.keys(PROPERTY_TYPES) as PropertyType[]).map((k) => <option key={k} value={k}>{PROPERTY_TYPES[k].ar}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="address">العنوان</label>
          <input id="address" name="address" className="input" placeholder="الشارع، الحي" required />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="description">الوصف</label>
          <textarea id="description" name="description" rows={4} className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="basePrice">سعر الليلة (ج.م)</label>
          <input id="basePrice" name="basePrice" type="number" min={100} className="input" defaultValue={1000} required />
        </div>
        <div>
          <label className="label" htmlFor="maxGuests">أقصى عدد ضيوف</label>
          <input id="maxGuests" name="maxGuests" type="number" min={1} className="input" defaultValue={4} required />
        </div>
        <div>
          <label className="label" htmlFor="bedrooms">غرف النوم</label>
          <input id="bedrooms" name="bedrooms" type="number" min={1} className="input" defaultValue={2} required />
        </div>
        <div>
          <label className="label" htmlFor="cancelPolicy">سياسة الإلغاء</label>
          <select id="cancelPolicy" name="cancelPolicy" className="input" defaultValue="FREE_48H">
            <option value="FREE_48H">إلغاء مجاني قبل 48 ساعة</option>
            <option value="FREE_7D">إلغاء مجاني قبل 7 أيام</option>
            <option value="NON_REFUNDABLE">غير قابل للاسترداد</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="images">روابط الصور (رابط في كل سطر)</label>
          <textarea id="images" name="images" rows={3} className="input" placeholder="https://..." />
          <p className="muted mt-1 text-xs">اتركه فارغاً لاستخدام صورة افتراضية.</p>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="videoUrl">رابط فيديو (اختياري)</label>
          <input id="videoUrl" name="videoUrl" className="input" placeholder="https://..." />
        </div>
        <div>
          <label className="label" htmlFor="lat">خط العرض</label>
          <input id="lat" name="lat" type="number" step="any" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="lng">خط الطول</label>
          <input id="lng" name="lng" type="number" step="any" className="input" />
        </div>
      </div>

      <fieldset>
        <legend className="label">المرافق</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {AMENITIES.map((a) => (
            <label key={a} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="amenities" value={a} /> {a}
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "جارٍ الإرسال..." : "إرسال الوحدة للمراجعة"}
      </button>
      <p className="muted text-center text-xs">تظهر الوحدة بعد موافقة الإدارة.</p>
    </form>
  );
}
