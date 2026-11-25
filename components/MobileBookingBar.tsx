"use client";

type Props = { price: string };

/** شريط حجز لاصق للموبايل فقط: السعر + زر يوصل لنموذج الحجز في نفس الصفحة. */
export default function MobileBookingBar({ price }: Props) {
  const goToBooking = () => {
    const input = document.getElementById("checkIn");
    if (!input) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    input.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    input.focus({ preventScroll: true });
  };

  return (
    <div
      data-testid="mobile-booking-bar"
      dir="rtl"
      role="region"
      aria-label="شريط الحجز السريع"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pt-3 shadow-[0_-10px_30px_-20px_rgba(6,25,46,0.6)] backdrop-blur lg:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold text-muted">السعر الأساسي / الليلة</p>
          <p data-testid="mobile-bar-price" className="text-lg font-black text-navy">{price}</p>
        </div>
        <button
          type="button"
          data-testid="mobile-book-button"
          onClick={goToBooking}
          className="btn-gold shrink-0 !px-6 !py-3"
        >
          احجز الآن ←
        </button>
      </div>
    </div>
  );
}
