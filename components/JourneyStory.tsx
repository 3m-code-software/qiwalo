"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toArabicDigits } from "@/lib/format";

type Stage = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  description: string;
  image: string;
  alt: string;
};

/** كل الصور من نفس مزود الصور المستخدم في باقي الموقع — لا حزم ولا خدمات جديدة. */
const STAGES: Stage[] = [
  {
    id: "arrival",
    title: "الوصول",
    subtitle: "مطار الأقصر أو أسوان",
    meta: "استقبال · مطار الأقصر أو أسوان",
    description: "طيارة، وخلاص وصلت. أول خطوة في رحلتك تبدأ من هنا.",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80",
    alt: "طائرة في السماء في طريقها إلى الأقصر أو أسوان",
  },
  {
    id: "transfer",
    title: "النقل",
    subtitle: "عربية أو أتوبيس من المطار",
    meta: "١٥–٤٥ دقيقة · سائق محلي",
    description: "من المطار لقلب المدينة، مع سائق بيعرف الطريق.",
    image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80",
    alt: "سيارة نقل تنتظر في الشارع بجوار المطار",
  },
  {
    id: "stay",
    title: "الإقامة",
    subtitle: "شقة · فيلا · فندق",
    meta: "٣ خيارات · شقة · فيلا · فندق",
    description: "اختار المكان اللي يناسبك: شقة، فيلا، أو فندق صغير.",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    alt: "غرفة إقامة مريحة في فندق صغير بالأقصر",
  },
  {
    id: "landmarks",
    title: "معالم أسوان",
    subtitle: "فيلة · أبو سمبل · النيل",
    meta: "٣ معالم · فيلة · أبو سمبل · النيل",
    description: "جزيرة فيلة، معبد أبو سمبل، والنيل اللي ما بيملّيش من الجمال.",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    alt: "إطلالة على النيل ومعالم أسوان التاريخية",
  },
  {
    id: "breakfast",
    title: "الفطار",
    subtitle: "بداية يوم على النيل",
    meta: "٧ صباحاً · شاي وفطار بلدي",
    description: "فطار هادي مع شاي، وبعدها تبدأ الحكاية.",
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1200&q=80",
    alt: "طاولة فطار صباحية مع قهوة وشاي",
  },
  {
    id: "explore",
    title: "جولة النيل",
    subtitle: "استكشاف واكتشاف",
    meta: "نصف يوم · دليل محلي",
    description: "جولة في النيل أو بين الشوارع القديمة مع دليل محلي.",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
    alt: "جولة استكشافية على ضفاف النيل",
  },
  {
    id: "dinner",
    title: "العشاء",
    subtitle: "نكهات الصعيد",
    meta: "بعد الغروب · نكهات الصعيد",
    description: "عشاء تحت النجوم، وأكل بلدي من قلب الصعيد.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    alt: "طاولة عشاء مضاءة في مطعم بالقرب من النيل",
  },
  {
    id: "return",
    title: "الرجوع والتقييم",
    subtitle: "ذكرى تحب تتكرر",
    meta: "٢ دقيقة · تقييمك يساعد غيرك",
    description: "ترجع بذكرى حلوة، وتقييمك يساعد ضيوف تانيين يختاروا.",
    image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=80",
    alt: "ذكريات رحلة في الأقصر وأسوان",
  },
];

export default function JourneyStory() {
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const stepRefs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion || typeof IntersectionObserver === "undefined") return;
    const nodes = stepRefs.current.filter((node): node is HTMLLIElement => Boolean(node));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = nodes.indexOf(entry.target as HTMLLIElement);
          if (index >= 0) setActive(index);
        });
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [reducedMotion]);

  const current = STAGES[active];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24" aria-labelledby="journey-title">
      <div className="mb-10 md:mb-14">
        <span className="eyebrow !text-gold">من اللحظة الأولى للعودة</span>
        <h2 id="journey-title" className="section-title mt-3">رحلتك مع قيوالو</h2>
        <p className="section-sub">ثماني خطوات بسيطة، من الطيارة لحد التقييم.</p>
        <div className="mt-5 flex flex-wrap gap-2" aria-label="ملخص الرحلة">
          <span className="rounded-full border border-gold/25 bg-navy-soft/40 px-3 py-1 text-xs font-bold text-navy/70">
            {toArabicDigits(STAGES.length)} مراحل
          </span>
          <span className="rounded-full border border-gold/25 bg-navy-soft/40 px-3 py-1 text-xs font-bold text-navy/70">
            الأقصر وأسوان
          </span>
          <span className="rounded-full border border-gold/25 bg-navy-soft/40 px-3 py-1 text-xs font-bold text-navy/70">
            من الطيارة للتقييم
          </span>
        </div>
      </div>

      {reducedMotion ? (
        /* وضع تقليل الحركة: كل المراحل ثابتة، بدون لاصق ولا انتقالات. */
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage, i) => (
            <article key={stage.id} className="card overflow-hidden">
              <div className="relative aspect-[4/3]">
                <Image
                  src={stage.image}
                  alt={stage.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  loading="lazy"
                  decoding="async"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-bold text-gold">{toArabicDigits(i + 1)}</p>
                <h3 className="mt-1 text-lg font-black text-navy">{stage.title}</h3>
                <p className="muted mt-1 text-sm leading-6">{stage.subtitle}</p>
                <p className="mt-2 text-xs font-bold text-gold">{stage.meta}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-8 md:grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-16">
          <div className="sticky top-16 z-20 self-start bg-ivory pb-2 md:top-24 md:bg-transparent md:pb-0">
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-gold/25 bg-navy-soft shadow-2xl shadow-navy/15 md:aspect-[4/3]">
              {STAGES.map((stage, i) => (
                <div
                  key={stage.id}
                  aria-hidden={i !== active}
                  className={`absolute inset-0 transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}
                >
                  <Image
                    src={stage.image}
                    alt={stage.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 45vw"
                    loading="lazy"
                    decoding="async"
                    className="object-cover"
                  />
                </div>
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/95 via-navy-deep/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-8">
                <span className="eyebrow !text-gold-bright">
                  المرحلة {toArabicDigits(active + 1)} من {toArabicDigits(STAGES.length)}
                </span>
                <h3 className="mt-2 text-2xl font-black text-white md:mt-3 md:text-4xl">{current.title}</h3>
                <p className="mt-1 text-xs font-bold text-white/80 md:text-sm">{current.subtitle}</p>
                <p className="mt-1 text-[11px] font-bold text-gold-bright md:mt-2 md:text-xs">{current.meta}</p>
              </div>
            </div>
            <p className="muted mt-3 text-xs leading-6 md:mt-5 md:min-h-14 md:text-sm md:leading-7">{current.description}</p>
            <Link href="/search" className="btn-gold mt-2 text-sm">ابحث عن إقامة ←</Link>
          </div>

          <ol className="border-r-2 border-gold/30 pr-6 md:pr-8">
            {STAGES.map((stage, i) => (
              <li
                key={stage.id}
                ref={(node) => { stepRefs.current[i] = node; }}
                className="relative flex min-h-[48vh] items-center md:min-h-[56vh]"
              >
                <span className="absolute -right-[calc(1.5rem+7px)] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-gold bg-ivory md:-right-[calc(2rem+7px)]" aria-hidden />
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-current={active === i ? "step" : undefined}
                  className={`text-right transition-opacity duration-300 ${active === i ? "opacity-100" : "opacity-50 hover:opacity-80"}`}
                >
                  <span className="text-xs font-black text-gold">{toArabicDigits(i + 1)}</span>
                  <h3 className={`mt-2 text-2xl font-black md:text-3xl ${active === i ? "text-navy" : "text-navy/70"}`}>
                    {stage.title}
                  </h3>
                  <p className="muted mt-2 text-sm leading-7">{stage.subtitle}</p>
                  <p className="mt-1 text-xs font-bold text-gold">{stage.meta}</p>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
