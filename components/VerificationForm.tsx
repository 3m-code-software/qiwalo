"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { submitVerificationAction, type FormState } from "@/app/actions";
import { DEFAULT_COMMISSION_RATE } from "@/lib/constants";
import { toArabicDigits } from "@/lib/format";
import DocumentUpload from "./DocumentUpload";

interface VerificationDefaults {
  phoneAlt?: string | null;
  nationality?: string | null;
  birthDate?: string | null;
  idFront?: string;
  idBack?: string;
  commissionRate?: number;
}

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => THIS_YEAR - i);

function splitBirthDate(value?: string | null) {
  const parts = (value ?? "").split("-");
  return {
    day: Number(parts[2]) || 0,
    month: Number(parts[1]) || 0,
    year: Number(parts[0]) || 0,
  };
}

function calculateAge(day: number, month: number, year: number): number | null {
  if (!day || !month || !year) return null;
  const birth = new Date(Date.UTC(year, month - 1, day));
  if (
    birth.getUTCFullYear() !== year ||
    birth.getUTCMonth() !== month - 1 ||
    birth.getUTCDate() !== day
  ) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - year;
  const currentMonth = now.getUTCMonth() + 1;
  if (currentMonth < month || (currentMonth === month && now.getUTCDate() < day)) age -= 1;
  return age;
}

export default function VerificationForm({ defaults }: { defaults?: VerificationDefaults }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitVerificationAction, {});
  const initialBirth = splitBirthDate(defaults?.birthDate);
  const [day, setDay] = useState(initialBirth.day);
  const [month, setMonth] = useState(initialBirth.month);
  const [year, setYear] = useState(initialBirth.year);
  const [front, setFront] = useState(defaults?.idFront ?? "");
  const [back, setBack] = useState(defaults?.idBack ?? "");

  const age = calculateAge(day, month, year);
  const ageInvalid = Boolean(day && month && year && (age === null || age < 18 || age > 100));

  return (
    <form action={action} className="space-y-5">
      <p className="rounded-xl border border-gold/40 bg-gold-soft p-3 text-sm leading-7 text-navy">
        بيانات التحقق مطلوبة قبل نشر وحداتك. راجع{" "}
        <Link href="/terms/owner" target="_blank" className="font-bold underline">شروط المالك</Link>{" "}
        قبل الإرسال.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="phoneAlt">رقم هاتف بديل (اختياري)</label>
          <input id="phoneAlt" name="phoneAlt" type="tel" className="input" dir="ltr" defaultValue={defaults?.phoneAlt ?? ""} placeholder="01xxxxxxxxx" />
        </div>
        <div>
          <label className="label" htmlFor="nationality">الجنسية</label>
          <input id="nationality" name="nationality" className="input" defaultValue={defaults?.nationality ?? ""} placeholder="مصرية" />
        </div>
      </div>

      <fieldset>
        <legend className="label">تاريخ الميلاد</legend>
        <div className="grid grid-cols-3 gap-3">
          <select id="birthDay" name="birthDay" className="input" value={day} onChange={(e) => setDay(Number(e.target.value))} required>
            <option value={0}>اليوم</option>
            {Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{toArabicDigits(i + 1)}</option>)}
          </select>
          <select id="birthMonth" name="birthMonth" className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))} required>
            <option value={0}>الشهر</option>
            {MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
          <select id="birthYear" name="birthYear" className="input" value={year} onChange={(e) => setYear(Number(e.target.value))} required>
            <option value={0}>السنة</option>
            {YEARS.map((y) => <option key={y} value={y}>{toArabicDigits(y)}</option>)}
          </select>
        </div>
        <p className={`mt-2 text-xs ${ageInvalid ? "text-red-600" : "muted"}`}>
          {age !== null && !ageInvalid && `العمر المحسوب: ${toArabicDigits(age)} سنة`}
          {ageInvalid && "العمر لازم يكون 18 سنة أو أكثر وأقل من 100 سنة. راجع تاريخ الميلاد."}
          {age === null && "اختار يوم وشهر وسنة الميلاد."}
        </p>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <DocumentUpload name="idFront" label="صورة وجه البطاقة" defaultUrl={defaults?.idFront} onUrlChange={setFront} hint="صورة واضحة للوجه الأمامي من البطاقة." />
        <DocumentUpload name="idBack" label="صورة ظهر البطاقة" defaultUrl={defaults?.idBack} onUrlChange={setBack} hint="صورة واضحة للوجه الخلفي من البطاقة." />
      </div>

      <div>
        <label className="label" htmlFor="commissionRate">نسبة العمولة المقترحة (٪ — اختياري)</label>
        <input
          id="commissionRate"
          name="commissionRate"
          type="number"
          min={0}
          max={50}
          step={1}
          className="input max-w-xs"
          defaultValue={defaults?.commissionRate ?? DEFAULT_COMMISSION_RATE}
        />
        <p className="muted mt-1 text-xs">تقدر الإدارة تعديل النسبة بعد المراجعة.</p>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="terms" required className="mt-1" />
        <span>
          أوافق على{" "}
          <Link href="/terms/owner" target="_blank" className="font-bold text-nile underline">شروط خدمة المالك</Link>{" "}
          وأقر بصحة البيانات والوثائق المرفقة.
        </span>
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {(ageInvalid || !front || !back) && (
        <p className="text-xs text-red-600">أكمل تاريخ الميلاد وارفع صورتي البطاقة قبل الإرسال.</p>
      )}
      <button
        type="submit"
        disabled={pending || ageInvalid || !front || !back}
        className="btn-primary w-full"
      >
        {pending ? "جارٍ الإرسال..." : "إرسال بيانات التحقق"}
      </button>
    </form>
  );
}
