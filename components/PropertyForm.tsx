"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { createPropertyAction, type FormState } from "@/app/actions";
import { AMENITIES, CITIES, PROPERTY_TYPES } from "@/lib/constants";
import type { CityKey, PropertyType } from "@/lib/types";

export default function PropertyForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createPropertyAction, {});
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleUpload() {
    if (!file || uploading || uploaded.length >= 8) return;
    setUploading(true);
    setUploadError("");
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const json = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !json.url) {
        setUploadError(json.error ?? "الرفع فشل. حاول مرة تانية.");
      } else {
        setUploaded((prev) => (prev.includes(json.url!) || prev.length >= 8 ? prev : [...prev, json.url!]));
        setFile(null);
      }
    } catch {
      setUploadError("الرفع فشل. تأكد من الاتصال وحاول مرة تانية.");
    } finally {
      setUploading(false);
    }
  }

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
          <span className="label">صور الوحدة</span>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="unitImage"
              type="file"
              accept="image/*"
              className="input max-w-xs"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setUploadError(""); }}
            />
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading || uploaded.length >= 8}
              className="btn-ghost !py-2 text-sm disabled:opacity-50"
            >
              {uploading ? "جارٍ الرفع..." : "ارفع الصورة"}
            </button>
            <span className="muted text-xs">{uploaded.length} / 8 صور</span>
          </div>
          <p className="muted mt-1 text-xs">JPG أو PNG أو WebP، لحد 5 ميجابايت للصورة. التوقيع بيتم على السيرفر.</p>
          {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}

          {uploaded.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {uploaded.map((url) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-line">
                  <Image src={url} alt="صورة الوحدة" fill sizes="120px" className="object-cover" />
                  <button
                    type="button"
                    aria-label="حذف الصورة"
                    onClick={() => setUploaded((prev) => prev.filter((u) => u !== url))}
                    className="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
                  >
                    ×
                  </button>
                  <input type="hidden" name="images" value={url} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="images">أو روابط صور خارجية (رابط في كل سطر)</label>
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
      <button type="submit" disabled={pending || uploading} className="btn-primary w-full">
        {pending ? "جارٍ الإرسال..." : "إرسال الوحدة للمراجعة"}
      </button>
      <p className="muted text-center text-xs">تظهر الوحدة بعد موافقة الإدارة.</p>
    </form>
  );
}
