import Link from "next/link";
import { EXPERIENCE_CATEGORIES, EXPERIENCE_DIFFICULTIES } from "@/lib/constants";
import { money, toArabicDigits } from "@/lib/format";
import type { Experience, ExperienceCategory } from "@/lib/types";

type Props = {
  experiences: Experience[];
  propertySlug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  transportId?: string;
  category?: ExperienceCategory;
};

/** كروت التجارب المرتبطة بنفس الوحدة ونفس تواريخ الإقامة، بعد مراجعة الإدارة. */
export default function ExperienceAddOn({
  experiences,
  propertySlug,
  checkIn,
  checkOut,
  guests,
  transportId,
  category = "MOUNTAIN_SAFARI",
}: Props) {
  const visible = experiences.filter((experience) => experience.category === category);
  if (visible.length === 0) return null;
  const ready = Boolean(checkIn && checkOut);
  const motorcycle = category === "MOTORCYCLE_TOUR";
  const sectionTestId = motorcycle ? "motorcycle-tour-section" : "mountain-safari-section";
  const cardTestId = motorcycle ? "motorcycle-tour-card" : "mountain-safari-card";
  const titleId = motorcycle ? "motorcycle-tours-title" : "experiences-title";
  const title = motorcycle ? "جولات الموتوسيكلات" : "سفاري الجبال";
  const hint = motorcycle ? "المسار ونقطة اللقاء والخوذات واضحة بعد مراجعة الإدارة." : "نفس تواريخ إقامتك، مع مرشد ونقطة لقاء واضحة بعد مراجعة الإدارة.";
  const placeLabel = motorcycle ? "المسار" : "الجبل";
  const cta = motorcycle ? "أضف الجولة وأكمل الحجز ←" : "أضفها وأكمل الحجز ←";

  return (
    <section className="mt-10" data-testid={sectionTestId} data-category={category} aria-labelledby={titleId}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow !text-gold">كمّل رحلتك</span>
          <h2 id={titleId} className="section-title mt-2">{title}</h2>
          <p className="muted mt-1 text-sm">{hint}</p>
        </div>
      </div>

      {!ready && (
        <p className="soft-card mb-4 text-sm font-bold text-navy">
          اختر تاريخ الوصول والمغادرة أولاً، وبعدين تقدر تضيف {title} لحجزك.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((experience) => (
          <article key={experience.id} data-testid={cardTestId} className="soft-card flex flex-col">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="chip chip-gold">{EXPERIENCE_CATEGORIES[experience.category].ar}</span>
              <span className="muted text-xs">{EXPERIENCE_DIFFICULTIES[experience.difficulty].ar}</span>
            </div>
            <h3 className="text-lg font-extrabold text-navy">{experience.name}</h3>
            <p className="muted mt-1 text-xs">{placeLabel}: {experience.mountain} · {experience.bestSeason}</p>
            <ul className="muted mt-3 space-y-1 text-xs leading-6">
              <li>• نقطة اللقاء: {experience.meetingPoint}</li>
              <li>• المدة: {toArabicDigits(experience.durationHours)} ساعات · السعة: {toArabicDigits(experience.capacity)}</li>
              <li>• مشمول: {experience.includes.join(" · ")}</li>
            </ul>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
              <div>
                <p className="muted text-xs">السعر للفرد</p>
                <p className="text-xl font-black text-nile">{money(experience.pricePerPerson)}</p>
              </div>
              {ready ? (
                <form action="/checkout" method="get">
                  <input type="hidden" name="slug" value={propertySlug} />
                  <input type="hidden" name="checkIn" value={checkIn} />
                  <input type="hidden" name="checkOut" value={checkOut} />
                  <input type="hidden" name="guests" value={guests} />
                  {transportId && <input type="hidden" name="transport" value={transportId} />}
                  <input type="hidden" name="experience" value={experience.id} />
                  <button type="submit" className="btn-gold !px-4 !py-2 text-sm">{cta}</button>
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
