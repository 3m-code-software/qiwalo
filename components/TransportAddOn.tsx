import Link from "next/link";
import { CITIES, TRANSPORT_TYPES } from "@/lib/constants";
import { money, toArabicDigits } from "@/lib/format";
import type { Transport } from "@/lib/types";

type Props = {
  transports: Transport[];
  propertySlug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  experienceId?: string;
  packageId?: string;
};

/** النقل كيان منفصل عن الوحدة والتجربة، ويُضاف لنفس الحجز بعد مراجعة الإدارة. */
export default function TransportAddOn({ transports, propertySlug, checkIn, checkOut, guests, experienceId, packageId }: Props) {
  if (transports.length === 0) return null;
  const ready = Boolean(checkIn && checkOut);

  return (
    <section className="mt-10" data-testid="transport-section" aria-labelledby="transport-title">
      <div className="mb-4">
        <span className="eyebrow !text-gold">وصلك للوجهة</span>
        <h2 id="transport-title" className="section-title mt-2">النقل السياحي</h2>
        <p className="muted mt-1 text-sm">سيارة أو كوستر أو باص أو موتوسيكل بنفس تواريخ إقامتك، بعد مراجعة الإدارة.</p>
      </div>

      {!ready && (
        <p className="soft-card mb-4 text-sm font-bold text-navy">
          اختر تاريخ الوصول والمغادرة أولاً، وبعدين تقدر تضيف النقل لحجزك.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {transports.map((transport) => (
          <article key={transport.id} data-testid="transport-card" className="soft-card flex flex-col">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="chip chip-gold">{TRANSPORT_TYPES[transport.type].ar}</span>
              <span className="muted text-xs">{CITIES[transport.city].ar}</span>
            </div>
            <h3 className="text-lg font-extrabold text-navy">{transport.name}</h3>
            <p className="muted mt-1 text-xs" dir="rtl">{transport.routeFrom} ← {transport.routeTo}</p>
            {(transport.driverName || transport.plateNumber) && (
              <p className="muted mt-1 text-xs" data-testid="transport-driver">
                سائق: <span className="font-bold text-navy">{transport.driverName ?? "سائق قيوالو"}</span>
                {transport.plateNumber && <span dir="ltr" className="ms-1">({transport.plateNumber})</span>}
              </p>
            )}
            <ul className="muted mt-3 space-y-1 text-xs leading-6">
              <li>• نقطة اللقاء: {transport.meetingPoint}</li>
              <li>• المدة: {toArabicDigits(transport.durationHours)} ساعات · السعة: {toArabicDigits(transport.capacity)}</li>
              <li>• مشمول: {transport.includes.join(" · ")}</li>
            </ul>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
              <div>
                <p className="muted text-xs">سعر الرحلة للمركبة</p>
                <p className="text-xl font-black text-nile">{money(transport.pricePerTrip)}</p>
              </div>
              {ready ? (
                <form action="/checkout" method="get">
                  <input type="hidden" name="slug" value={propertySlug} />
                  <input type="hidden" name="checkIn" value={checkIn} />
                  <input type="hidden" name="checkOut" value={checkOut} />
                  <input type="hidden" name="guests" value={guests} />
                  {experienceId && <input type="hidden" name="experience" value={experienceId} />}
                  {packageId && <input type="hidden" name="package" value={packageId} />}
                  <input type="hidden" name="transport" value={transport.id} />
                  <button type="submit" className="btn-gold !px-4 !py-2 text-sm">أضف النقل وأكمل الحجز ←</button>
                </form>
              ) : (
                <Link href={`/stay/${propertySlug}`} className="btn-ghost !px-4 !py-2 text-sm">حدّد التواريخ أولاً</Link>
              )}
            </div>
          </article>
        ))}
      </div>
      <p className="muted mt-3 text-xs leading-6">
        الدفع كما هو دائماً: تحويل بنكي أو كاش عند الوصول. للاستفسار: واتساب / تليجرام / 01066094050.
      </p>
    </section>
  );
}
