"use client";

import { useActionState, useState } from "react";
import ImageOrderEditor, { type EditableImage } from "@/components/ImageOrderEditor";
import UploadProgress from "@/components/UploadProgress";
import { createPropertyAction, updatePropertyAction, type FormState } from "@/app/actions";
import { uploadImage, UploadError } from "@/lib/client-upload";
import { AMENITIES, CITIES, PROPERTY_TYPES } from "@/lib/constants";
import { fileSizeAr } from "@/lib/format";
import type { CityKey, Property, PropertyType } from "@/lib/types";

export default function PropertyForm({ property }: { property?: Property }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    property ? updatePropertyAction : createPropertyAction,
    {},
  );
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<EditableImage[]>(
    property ? property.images.map((url) => ({ url, source: "link" as const })) : [],
  );
  const [externalText, setExternalText] = useState(property ? property.images.join("\n") : "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [progress, setProgress] = useState(0);
  const [lastUpload, setLastUpload] = useState<{ originalSize: number; compressedSize: number } | null>(null);

  async function handleUpload() {
    if (!file || uploading || images.length >= 8) return;
    setUploading(true);
    setUploadError("");
    setProgress(0);
    try {
      const result = await uploadImage(file, setProgress);
      setImages((prev) => (
        prev.some((item) => item.url === result.url) || prev.length >= 8
          ? prev
          : [...prev, { url: result.url, source: "upload" }]
      ));
      setLastUpload({ originalSize: result.originalSize, compressedSize: result.compressedSize });
      setFile(null);
    } catch (error) {
      setUploadError(error instanceof UploadError ? error.message : "الرفع فشل. تأكد من الاتصال وحاول مرة تانية.");
    } finally {
      setUploading(false);
    }
  }

  function handleExternalChange(value: string) {
    setExternalText(value);
    const links = [...new Set(value.split(/[\n,]+/).map((s) => s.trim()).filter((s) => s.startsWith("https://")))].slice(0, 8);
    setImages((prev) => {
      const uploads = prev.filter((item) => item.source === "upload");
      return [
        ...uploads,
        ...links.map((url) => prev.find((item) => item.url === url && item.source === "link") ?? { url, source: "link" as const }),
      ].slice(0, 8);
    });
  }

  function syncImages(next: EditableImage[]) {
    setImages(next);
    setExternalText(next.filter((item) => item.source === "link").map((item) => item.url).join("\n"));
  }

  return (
    <form action={action} className="space-y-5">
      {property && <input type="hidden" name="id" value={property.id} />}
      <p className="rounded-xl border border-gold/40 bg-gold-soft p-3 text-sm leading-7 text-navy">
        {property ? (
          property.status === "PUBLISHED" ? (
            <>عدّل تفاصيل الوحدة في مكانها. بعد الحفظ هترجع <strong>قيد المراجعة</strong> وهتختفي من البحث لحد موافقة الإدارة.</>
          ) : (
            <>عدّل تفاصيل الوحدة في مكانها من غير إنشاء نسخة جديدة. الحالة الحالية هتفضل زي ما هي.</>
          )
        ) : (
          <>سيتم حفظ الوحدة أولاً كـ <strong>معاينة (مسودة)</strong> لتتمكن من مراجعة كل التفاصيل، وبعدها تقدر تتابع المعاينة وترسلها للمراجعة.</>
        )}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">اسم الوحدة</label>
          <input id="name" name="name" className="input" placeholder="شقة بإطلالة على النيل" defaultValue={property?.name} required />
        </div>
        <div>
          <label className="label" htmlFor="city">المدينة</label>
          <select id="city" name="city" className="input" defaultValue={property?.city ?? "LUXOR"}>
            {(Object.keys(CITIES) as CityKey[]).map((k) => <option key={k} value={k}>{CITIES[k].ar}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="type">نوع الوحدة</label>
          <select id="type" name="type" className="input" defaultValue={property?.type ?? "APARTMENT"}>
            {(Object.keys(PROPERTY_TYPES) as PropertyType[]).map((k) => <option key={k} value={k}>{PROPERTY_TYPES[k].ar}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="address">العنوان</label>
          <input id="address" name="address" className="input" placeholder="الشارع، الحي" defaultValue={property?.address} required />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="description">الوصف</label>
          <textarea id="description" name="description" rows={4} className="input" defaultValue={property?.description} required />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="houseRules">قواعد الوحدة (اختياري)</label>
          <textarea id="houseRules" name="houseRules" rows={3} className="input" placeholder="مثال: لا تدخين · تسليم المفاتيح من 14:00 · هدوء بعد 23:00" defaultValue={property?.houseRules ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="basePrice">سعر الليلة (ج.م)</label>
          <input id="basePrice" name="basePrice" type="number" min={100} className="input" defaultValue={property?.basePrice ?? 1000} required />
        </div>
        <div>
          <label className="label" htmlFor="maxGuests">أقصى عدد ضيوف</label>
          <input id="maxGuests" name="maxGuests" type="number" min={1} className="input" defaultValue={property?.maxGuests ?? 4} required />
        </div>
        <div>
          <label className="label" htmlFor="bedrooms">غرف النوم</label>
          <input id="bedrooms" name="bedrooms" type="number" min={1} className="input" defaultValue={property?.bedrooms ?? 2} required />
        </div>
        <div>
          <label className="label" htmlFor="bathrooms">الحمامات</label>
          <input id="bathrooms" name="bathrooms" type="number" min={1} className="input" defaultValue={property?.bathrooms ?? 1} required />
        </div>
        <div>
          <label className="label" htmlFor="areaSqm">المساحة (م² — اختياري)</label>
          <input id="areaSqm" name="areaSqm" type="number" min={0} className="input" placeholder="مثال: 110" defaultValue={property?.areaSqm ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="cancelPolicy">سياسة الإلغاء</label>
          <select id="cancelPolicy" name="cancelPolicy" className="input" defaultValue={property?.cancelPolicy ?? "FREE_48H"}>
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
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setUploadError("");
                setProgress(0);
                setLastUpload(null);
              }}
            />
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading || images.length >= 8}
              className="btn-ghost !py-2 text-sm disabled:opacity-50"
            >
              ارفع الصورة
            </button>
            <span className="muted text-xs">{images.length} / 8 صور</span>
          </div>
          {uploading && (
            <div className="mt-2">
              <UploadProgress value={progress} />
            </div>
          )}
          <p className="muted mt-1 text-xs">JPG أو PNG أو WebP، لحد 4 ميجابايت. الصورة بتتضغط تلقائياً قبل الرفع، والتوقيع بيتم على السيرفر.</p>
          {file && !uploading && <p className="muted mt-1 text-xs">الحجم قبل الضغط: {fileSizeAr(file.size)}</p>}
          {lastUpload && (
            <p className="muted mt-1 text-xs">
              آخر صورة: {fileSizeAr(lastUpload.originalSize)} ← {fileSizeAr(lastUpload.compressedSize)} بعد الضغط
            </p>
          )}
          {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}

          <ImageOrderEditor images={images} onChange={syncImages} />
          {images.length > 0 && (
            <p className="muted mt-1 text-xs">اسحب الصور لتغيير ترتيبها، أو اضغط «الغلاف» على أي صورة لتجعلها أول صورة تظهر في البحث.</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="externalImages">أو روابط صور خارجية (رابط في كل سطر)</label>
          <textarea
            id="externalImages"
            rows={3}
            className="input"
            placeholder="https://..."
            value={externalText}
            onChange={(event) => handleExternalChange(event.target.value)}
          />
          <p className="muted mt-1 text-xs">اتركه فارغاً لاستخدام صورة افتراضية. الترتيب هنا بيتبع ترتيب الصور في المعرض.</p>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="videoUrl">رابط فيديو (اختياري)</label>
          <input id="videoUrl" name="videoUrl" className="input" placeholder="https://..." defaultValue={property?.videoUrl ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="lat">خط العرض</label>
          <input id="lat" name="lat" type="number" step="any" className="input" defaultValue={property?.lat ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="lng">خط الطول</label>
          <input id="lng" name="lng" type="number" step="any" className="input" defaultValue={property?.lng ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="pickupLat">خط عرض نقطة الاستلام (اختياري)</label>
          <input id="pickupLat" name="pickupLat" type="number" step="any" className="input" defaultValue={property?.pickupLat ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="pickupLng">خط طول نقطة الاستلام (اختياري)</label>
          <input id="pickupLng" name="pickupLng" type="number" step="any" className="input" defaultValue={property?.pickupLng ?? ""} />
        </div>
      </div>

      <fieldset>
        <legend className="label">المرافق</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {AMENITIES.map((a) => (
            <label key={a} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="amenities" value={a} defaultChecked={property?.amenities.includes(a) ?? false} /> {a}
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending || uploading} className="btn-primary w-full">
        {pending ? "جارٍ الحفظ..." : property ? "حفظ التعديلات" : "حفظ المعاينة"}
      </button>
      <p className="muted text-center text-xs">
        {property
          ? "تُحفظ التعديلات على نفس الوحدة. راجع الحالة في صفحة المعاينة."
          : "تُحفظ الوحدة كمسودة أولاً، ثم تراجعها وترسلها للمراجعة من صفحة المعاينة."}
      </p>
    </form>
  );
}
