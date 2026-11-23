import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SupportLinks from "@/components/SupportLinks";
import { money } from "@/lib/format";
import {
  bankDetails,
  cancelPolicyText,
  paymentDetailsText,
  paymentMethodLabel,
} from "@/lib/notifications";
import { getRepo } from "@/lib/repo";

export const instant = false;

export const metadata: Metadata = {
  title: "تفاصيل الدفع",
  description: "تفاصيل الدفع وطريقة التحويل البنكي أو الكاش لحجز قيوالو.",
};

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const repo = await getRepo();
  const booking = await repo.getBookingByReference(reference);
  if (!booking) notFound();

  const property = await repo.getPropertyById(booking.propertyId);
  const propertyName = property?.name || booking.propertyName;
  const policyText =
    cancelPolicyText(property?.cancelPolicy ?? "") || "حسب سياسة الوحدة المعلنة.";
  const backHref = `/booking/${encodeURIComponent(booking.reference)}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-center gap-3">
        <span className="chip">دفع آمن ويدوي</span>
        <span className="chip chip-gold">مسودة للمراجعة النهائية</span>
      </div>
      <h1 className="mt-5 text-3xl font-black text-navy">تفاصيل الدفع</h1>
      <p className="muted mt-2 text-sm leading-7">
        هذه هي الطريقة المعتمدة حالياً لإتمام دفع حجزك. احتفظ برقم الحجز عند التواصل مع الدعم.
      </p>
      <div className="gold-rule my-6" />

      <div className="soft-card">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="muted text-xs">رقم الحجز</p>
            <p dir="ltr" className="mt-1 inline-block rounded-lg bg-sand px-3 py-1.5 text-base font-black text-navy">
              {booking.reference}
            </p>
          </div>
          <div>
            <p className="muted text-xs">الوحدة</p>
            <p className="mt-1 font-bold text-navy">{propertyName}</p>
          </div>
          <div>
            <p className="muted text-xs">الإجمالي المستحق</p>
            <p className="mt-1 text-xl font-black text-navy">{money(booking.total)}</p>
          </div>
          <div>
            <p className="muted text-xs">طريقة الدفع</p>
            <p className="mt-1 font-bold text-navy">{paymentMethodLabel(booking.paymentMethod)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-gold/30 bg-gold-soft px-4 py-3 text-sm font-bold leading-8 text-[#8a6a24]">
          لا يوجد دفع إلكتروني في هذه المرحلة — التحويل البنكي أو الكاش عند الوصول فقط
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <h2 className="text-lg font-extrabold text-navy">تعليمات الدفع</h2>
          <p className="muted mt-2 text-sm leading-8">{paymentDetailsText(booking.paymentMethod)}</p>
        </div>

        <div className="mt-6 rounded-xl bg-navy p-5 text-white">
          <h2 className="text-sm font-extrabold text-gold-bright">بيانات التحويل البنكي</h2>
          <dl className="mt-3 grid gap-2 text-sm text-white/75">
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-white/55">البنك</dt>
              <dd className="font-bold">{bankDetails.bank}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-white/55">رقم الحساب</dt>
              <dd dir="auto" className="font-bold">{bankDetails.account}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-white/55">IBAN</dt>
              <dd dir="ltr" className="font-bold">{bankDetails.iban || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <h2 className="text-lg font-extrabold text-navy">الإلغاء</h2>
          <p className="muted mt-2 text-sm leading-8">{policyText}</p>
          <Link
            href="/terms/guest#cancellation"
            className="mt-2 inline-block text-sm font-bold text-navy underline decoration-gold underline-offset-4 transition hover:text-gold"
          >
            اقرأ سياسة الإلغاء كاملة
          </Link>
        </div>

        <div className="mt-6 rounded-xl bg-navy p-5 text-white">
          <h2 className="mb-3 text-sm font-extrabold text-gold-bright">تحتاج مساعدة في الدفع؟</h2>
          <SupportLinks />
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link href={backHref} className="btn-primary !px-4 !py-2 !text-xs">العودة إلى الحجز</Link>
          <Link href="/terms/guest" className="btn-ghost !px-4 !py-2 !text-xs">شروط الضيوف</Link>
        </div>
      </div>
    </div>
  );
}
