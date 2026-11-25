"use client";

import Link from "next/link";
import { useActionState } from "react";
import { confirmBookingAction, type FormState } from "@/app/actions";
import { money } from "@/lib/format";
import type { Quote } from "@/lib/pricing";
import type { Property } from "@/lib/types";

export default function CheckoutForm({
  property,
  checkIn,
  checkOut,
  guests,
  quote,
  experience,
  transport,
  package: pkg,
}: {
  property: Property;
  checkIn: string;
  checkOut: string;
  guests: number;
  quote: Quote;
  experience?: { id: string; name: string; total: number } | null;
  transport?: { id: string; name: string; total: number } | null;
  package?: { id: string; name: string; total: number } | null;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(confirmBookingAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="slug" value={property.slug} />
      <input type="hidden" name="checkIn" value={checkIn} />
      <input type="hidden" name="checkOut" value={checkOut} />
      <input type="hidden" name="guests" value={guests} />
      {experience && <input type="hidden" name="experienceId" value={experience.id} />}
      {transport && <input type="hidden" name="transportId" value={transport.id} />}
      {pkg && <input type="hidden" name="packageId" value={pkg.id} />}

      <h2 className="text-lg font-extrabold text-navy">بيانات الضيف</h2>
      <div>
        <label className="label" htmlFor="fullName">الاسم الكامل</label>
        <input id="fullName" name="fullName" className="input" required placeholder="مثال: أحمد محمد" autoComplete="name" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="email">البريد الإلكتروني</label>
          <input id="email" name="email" type="email" className="input" required placeholder="name@example.com" autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="phone">رقم الهاتف</label>
          <input id="phone" name="phone" type="tel" className="input" required placeholder="01xxxxxxxxx" autoComplete="tel" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="nationality">الجنسية</label>
          <input id="nationality" name="nationality" className="input" required placeholder="مثال: مصري" />
        </div>
        <div>
          <label className="label" htmlFor="paymentMethod">طريقة الدفع</label>
          <select id="paymentMethod" name="paymentMethod" className="input" defaultValue="CASH">
            <option value="CASH">كاش عند الوصول</option>
            <option value="BANK">تحويل بنكي</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-gold/30 bg-ivory p-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold text-muted">إجمالي الحجز ({quote.nights} ليالي)</span>
          <span className="text-lg font-black text-navy">{money(quote.total + (pkg?.total ?? 0) + (experience?.total ?? 0) + (transport?.total ?? 0))}</span>
        </div>
        {pkg && (
          <p className="muted mt-2 text-xs">
            شامل {pkg.name}: <span className="font-bold text-nile">{money(pkg.total)}</span>
          </p>
        )}
        {experience && (
          <p className="muted mt-2 text-xs">
            شامل {experience.name}: <span className="font-bold text-nile">{money(experience.total)}</span>
          </p>
        )}
        {transport && (
          <p className="muted mt-2 text-xs">
            شامل {transport.name}: <span className="font-bold text-nile">{money(transport.total)}</span>
          </p>
        )}
        <p className="mt-2 text-xs font-bold text-muted">تحويل بنكي أو كاش عند الوصول</p>
      </div>

      <label className="flex items-start gap-2 text-xs leading-6 text-muted">
        <input type="checkbox" name="terms" required className="mt-1 h-4 w-4 shrink-0 accent-[#c6a15b]" />
        <span>
          أوافق على <Link href="/terms/guest" target="_blank" className="font-bold text-navy underline decoration-gold underline-offset-2">شروط الضيوف</Link> وسياسة الإلغاء الخاصة بالوحدة.
        </span>
      </label>

      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="btn-gold w-full !py-3 disabled:opacity-60">
        {pending ? "جارٍ تأكيد الحجز..." : "تأكيد الحجز"}
      </button>
      <p className="muted text-center text-xs leading-6">
        هتستخدم البيانات دي لإرسال تأكيد الحجز، وتصلك تفاصيل الدفع كاملة بعد التأكيد.
      </p>
    </form>
  );
}
