import Link from "next/link";
import { CITIES } from "@/lib/constants";
import { money, toArabicDigits } from "@/lib/format";
import type { Package } from "@/lib/types";

type Props = {
  packages: Package[];
  propertySlug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  experienceId?: string;
  transportId?: string;
};

/** باقة واحدة تجمع الوحدة + النقل + التجربة بسعر لكل ليلة، وتتجمع مع باقي الإضافات. */
export default function PackageAddOn({
  packages,
  propertySlug,
  checkIn,
  checkOut,
  guests,
  experienceId,
  transportId,
}: Props) {
  if (packages.length === 0) return null;
  const ready = Boolean(checkIn && checkOut);

  return (
    <section className="mt-10" data-testid="package-section" aria-labelledby="package-title">
      <div className="mb-4">
        <span className="eyebrow !text-gold">باقة كاملة</span>
        <h2 id="package-title" className="section-title mt-2">وحدة + نقل + جولة بسعر واحد</h2>
        <p className="muted mt-1 text-sm">
          سعر الباقة لكل ليلة، ويُضرب في عدد ليالي إقامتك. تقدر تضيف سفاري أو نقل زيادة كمان.
        </p>
      </div>

      {!ready && (
        <p className="soft-card mb-4 text-sm font-bold text-navy">
          اختر تاريخ الوصول والمغادرة أولاً، وبعدين تقدر تضيف الباقة لحجزك.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {packages.map((pkg) => (
          <article key={pkg.id} data-testid="package-card" className="soft-card flex flex-col">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="chip chip-gold">باقة موفّرة</span>
              <span className="muted text-xs">{CITIES[pkg.city].ar}</span>
            </div>
            <h3 className="text-lg font-extrabold text-navy">{pkg.name}</h3>
            <p className="muted mt-1 text-xs">الوحدة: {pkg.propertyName}</p>
            <ul className="muted mt-3 space-y-1 text-xs leading-6">
              <li>• التجربة: {pkg.experienceName}</li>
              <li>• النقل: {pkg.transportName}</li>
              <li>• السعة: {toArabicDigits(pkg.capacity)} ضيوف</li>
              <li>• مشمول: {pkg.includes.join(" · ")}</li>
            </ul>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
              <div>
                <p className="muted text-xs">السعر لكل ليلة</p>
                <p className="text-xl font-black text-nile">{money(pkg.pricePerNight)}</p>
              </div>
              {ready ? (
                <form action="/checkout" method="get">
                  <input type="hidden" name="slug" value={propertySlug} />
                  <input type="hidden" name="checkIn" value={checkIn} />
                  <input type="hidden" name="checkOut" value={checkOut} />
                  <input type="hidden" name="guests" value={guests} />
                  {experienceId && <input type="hidden" name="experience" value={experienceId} />}
                  {transportId && <input type="hidden" name="transport" value={transportId} />}
                  <input type="hidden" name="package" value={pkg.id} />
                  <button type="submit" className="btn-gold !px-4 !py-2 text-sm">أضف الباقة وأكمل الحجز ←</button>
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
