import Link from "next/link";
import { notFound } from "next/navigation";
import { CITIES } from "@/lib/constants";
import { dateAr, money } from "@/lib/format";
import { getRepo } from "@/lib/repo";

export const instant = false;

export default async function BookingPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const booking = await (await getRepo()).getBookingByReference(reference);
  if (!booking) notFound();

  const confirmed = booking.status === "CONFIRMED";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="soft-card text-center">
        <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl ${confirmed ? "bg-nile-soft text-nile" : "bg-amber-50 text-amber-600"}`}>
          {confirmed ? "✓" : "…"}
        </div>
        <h1 className="mt-4 text-2xl font-black">
          {confirmed ? "تم تأكيد حجزك!" : "تم استلام طلب الحجز"}
        </h1>
        <p className="muted mt-2 text-sm">رقم الحجز المرجعي — احتفظ بيه.</p>
        <p dir="ltr" className="mt-3 inline-block rounded-xl bg-sand px-5 py-3 text-lg font-black text-nile">{booking.reference}</p>
      </div>

      <div className="soft-card mt-5">
        <h2 className="mb-4 text-lg font-extrabold">تفاصيل الإقامة</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="muted text-xs">الوحدة</p>
            <p className="font-bold">{booking.propertyName}</p>
            <p className="muted text-xs">{CITIES[booking.city].ar}</p>
          </div>
          <div>
            <p className="muted text-xs">المضيف</p>
            <p className="font-bold">{booking.guestName}</p>
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
          <div className="flex justify-between"><span className="muted">{booking.nights} ليالي · {booking.guests} ضيوف</span><span>{money(booking.subtotal)}</span></div>
          <div className="flex justify-between text-lg font-black text-nile"><span>الإجمالي</span><span>{money(booking.total)}</span></div>
        </div>
      </div>

      <div className="soft-card mt-5">
        <h2 className="mb-3 text-lg font-extrabold">الخطوات الجاية</h2>
        <ol className="space-y-2 text-sm leading-7">
          <li>1. هتوصلك رسالة تأكيد على البريد/واتساب لما نفعّل الإشعارات.</li>
          <li>2. المالك هيشوف الحجز في لوحته فوراً.</li>
          <li>3. الدفع الإلكتروني عبر Paymob هيتبدّل بالتأكيد التجريبي لاحقاً.</li>
        </ol>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/search" className="btn-primary text-sm">ابحث عن إقامة تانية</Link>
        <Link href="/" className="btn-ghost text-sm">الرئيسية</Link>
      </div>
    </div>
  );
}
