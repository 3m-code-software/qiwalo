import Link from "next/link";
import { notFound } from "next/navigation";
import GuestAccountForm from "@/components/GuestAccountForm";
import ReviewForm from "@/components/ReviewForm";
import { getSession } from "@/lib/auth";
import { CITIES, SUPPORT_PHONE, SUPPORT_TELEGRAM, SUPPORT_WHATSAPP } from "@/lib/constants";
import { dateAr, money, toArabicDigits } from "@/lib/format";
import { paymentDetailsText, paymentMethodLabel } from "@/lib/notifications";
import { getRepo } from "@/lib/repo";

export const instant = false;

type Props = {
  params: Promise<{ reference: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function BookingPage({ params, searchParams }: Props) {
  const [{ reference }, sp] = await Promise.all([params, searchParams]);
  const repo = await getRepo();
  const [booking, session] = await Promise.all([
    repo.getBookingByReference(reference),
    getSession(),
  ]);
  if (!booking) notFound();

  const reviews = await repo.listAllReviews();
  const alreadyReviewed = reviews.some((r) => r.bookingId === booking.id);
  const confirmed = booking.status === "CONFIRMED" || booking.status === "COMPLETED";
  const showAccountForm = !session && booking.status === "CONFIRMED";
  const showReviewForm = Boolean(
    session && session.email === booking.guestId && booking.status === "COMPLETED" && !alreadyReviewed,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {one(sp.review) === "1" && (
        <p role="status" className="mb-4 rounded-xl border border-gold/40 bg-gold-soft p-4 text-sm font-bold text-navy">
          شكراً لتقييمك! سيظهر بعد مراجعة الإدارة.
        </p>
      )}
      {one(sp.account) === "1" && (
        <p role="status" className="mb-4 rounded-xl border border-gold/40 bg-gold-soft p-4 text-sm font-bold text-navy">
          تم إنشاء حسابك بنجاح. أهلاً بك في قيوالو.
        </p>
      )}

      <div className="soft-card text-center">
        <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl ${confirmed ? "bg-nile-soft text-nile" : "bg-amber-50 text-amber-600"}`}>
          {confirmed ? "✓" : "…"}
        </div>
        <h1 className="mt-4 text-2xl font-black text-navy">
          {booking.status === "COMPLETED" ? "اكتملت إقامتك!" : confirmed ? "تم تأكيد حجزك!" : "تم استلام طلب الحجز"}
        </h1>
        <p className="muted mt-2 text-sm">رقم الحجز المرجعي — احتفظ بيه.</p>
        <p dir="ltr" className="mt-3 inline-block rounded-xl bg-sand px-5 py-3 text-lg font-black text-nile">{booking.reference}</p>
      </div>

      <div className="soft-card mt-5">
        <h2 className="mb-4 text-lg font-extrabold text-navy">تفاصيل الإقامة</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="muted text-xs">الوحدة</p>
            <p className="font-bold">{booking.propertyName}</p>
            <p className="muted text-xs">{CITIES[booking.city].ar}</p>
          </div>
          <div>
            <p className="muted text-xs">الضيف</p>
            <p className="font-bold">{booking.guestName}</p>
            {booking.nationality && <p className="muted text-xs">الجنسية: {booking.nationality}</p>}
          </div>
          <div>
            <p className="muted text-xs">الوصول</p>
            <p className="font-bold">{dateAr(booking.checkIn)}</p>
          </div>
          <div>
            <p className="muted text-xs">المغادرة</p>
            <p className="font-bold">{dateAr(booking.checkOut)}</p>
          </div>
        </div>
        <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><span className="muted">{toArabicDigits(booking.nights)} ليالي · {toArabicDigits(booking.guests)} ضيوف</span><span>{money(booking.subtotal)}</span></div>
          <div className="flex justify-between"><span className="muted">رسوم الخدمة</span><span>{money(booking.serviceFee)}</span></div>
          <div className="flex justify-between text-lg font-black text-nile"><span>الإجمالي</span><span>{money(booking.total)}</span></div>
        </div>
      </div>

      <div className="soft-card mt-5">
        <h2 className="mb-4 text-lg font-extrabold text-navy">الدفع</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="muted text-xs">طريقة الدفع</p>
            <p className="font-bold">{paymentMethodLabel(booking.paymentMethod)}</p>
          </div>
          <div>
            <p className="muted text-xs">حالة الدفع</p>
            <p className="font-bold">{booking.paymentStatus === "PAID" ? "مدفوع" : "قيد الانتظار"}</p>
          </div>
        </div>
        <p className="mt-4 rounded-xl border border-line bg-ivory p-4 text-sm leading-7">{paymentDetailsText(booking.paymentMethod)}</p>
        {booking.paymentNote && (
          <p className="muted mt-2 text-xs leading-6">ملاحظة الدفع: {booking.paymentNote}</p>
        )}
        <Link href={`/payment/${booking.reference}`} className="btn-gold mt-5 w-full !py-3">
          تفاصيل الدفع والبنك
        </Link>
      </div>

      <div className="soft-card mt-5">
        <h2 className="mb-3 text-lg font-extrabold text-navy">الخطوات الجاية</h2>
        <ol className="space-y-2 text-sm leading-7 text-foreground/85">
          <li>1. تم إرسال تأكيد الحجز لرقم بريدك المسجل.</li>
          <li>2. المالك هيشوف الحجز في لوحته فوراً.</li>
          <li>3. يسّر الدفع حسب طريقته المختارة: تحويل بنكي أو كاش عند الوصول.</li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-3 border-t border-line pt-4">
          <a href={SUPPORT_WHATSAPP} target="_blank" rel="noreferrer" className="btn-ghost text-sm">واتساب</a>
          <a href={SUPPORT_TELEGRAM} target="_blank" rel="noreferrer" className="btn-ghost text-sm">تليجرام</a>
          <a href={`tel:${SUPPORT_PHONE}`} dir="ltr" className="btn-ghost text-sm">{SUPPORT_PHONE}</a>
          <Link href="/terms/guest" className="btn-ghost text-sm">شروط الضيوف</Link>
        </div>
      </div>

      {showAccountForm && (
        <div className="soft-card mt-5">
          <h2 className="text-lg font-extrabold text-navy">أنشئ حساب ضيف (اختياري)</h2>
          <p className="muted mb-5 mt-1 text-sm">احفظ حجوزرك وقيّم إقامتك بسهولة بعد انتهاء الزيارة.</p>
          <GuestAccountForm reference={booking.reference} email={booking.guestId} name={booking.guestName} />
        </div>
      )}

      {showReviewForm && (
        <div className="soft-card mt-5">
          <h2 className="mb-5 text-lg font-extrabold text-navy">قيّم إقامتك</h2>
          <ReviewForm reference={booking.reference} propertyName={booking.propertyName} />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/stay/${booking.propertySlug}`} className="btn-primary text-sm">عرض الوحدة</Link>
        <Link href="/search" className="btn-ghost text-sm">ابحث عن إقامة تانية</Link>
        <Link href="/" className="btn-ghost text-sm">الرئيسية</Link>
      </div>
    </div>
  );
}
