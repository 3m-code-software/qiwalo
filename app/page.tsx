import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import SearchForm from "@/components/SearchForm";
import { CITIES } from "@/lib/constants";
import { toArabicDigits } from "@/lib/format";
import { getRepo } from "@/lib/repo";
import type { CityKey } from "@/lib/types";

export const instant = false;

export default async function HomePage() {
  await connection();
  const repo = await getRepo();
  const properties = await repo.listProperties();
  const featured = properties.slice(0, 6);

  return (
    <>
      <section className="hero-gradient relative overflow-hidden text-white">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full border border-white/10" />
        <div className="absolute -bottom-32 right-10 h-96 w-96 rounded-full border border-white/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
          <span className="chip !bg-white/15 !text-white">الأقصر · أسوان · النيل</span>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            إقامتك في صعيد مصر<span className="text-[#ffd79a]">.</span> ببساطة ووضوح
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-white/85">
            شقق، شاليهات، فنادق صغيرة ومراكب نيلية بأسعار شفافة وتأكيد فوري — من ملاك معروفين في الأقصر وأسوان.
          </p>
          <div className="mt-8">
            <SearchForm />
          </div>
          <div className="mt-6 flex flex-wrap gap-5 text-sm font-bold text-white/85">
            <span>✓ أسعار بالجنيه المصري</span>
            <span>✓ صور حقيقية</span>
            <span>✓ دعم عربي</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">وجهاتنا</h2>
            <p className="muted mt-1 text-sm">اختر مدينتك وابدأ الرحلة.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {(Object.keys(CITIES) as CityKey[]).map((key, i) => (
            <Link key={key} href={`/search?city=${key}`} className="card group relative min-h-44 overflow-hidden">
              <Image
                src={i === 0 ? "https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?auto=format&fit=crop&w=1200&q=80" : "https://images.unsplash.com/photo-1584224741213-276f3be15a83?auto=format&fit=crop&w=1200&q=80"}
                alt={CITIES[key].ar}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
              <div className="absolute bottom-0 right-0 p-5 text-white">
                <h3 className="text-2xl font-extrabold">{CITIES[key].ar}</h3>
                <p className="text-sm text-white/80">{CITIES[key].hint}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">إقامات مختارة</h2>
            <p className="muted mt-1 text-sm">{toArabicDigits(properties.length)} وحدة متاحة حالياً.</p>
          </div>
          <Link href="/search" className="btn-ghost text-sm">عرض الكل</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
        {featured.length === 0 && (
          <div className="soft-card text-center muted">لا توجد وحدات منشورة بعد.</div>
        )}
      </section>

      <section className="mx-auto mt-14 max-w-7xl px-4">
        <div className="hero-gradient rounded-3xl p-8 text-white md:p-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <span className="chip !bg-white/15 !text-white">لأصحاب الوحدات</span>
              <h2 className="mt-4 text-2xl font-extrabold">عندك وحدة في الأقصر أو أسوان؟</h2>
              <p className="mt-2 text-sm text-white/80">أضفها في دقائق، إحنا نتولى العرض والحجوزات مقابل 12% على الحجز المؤكد بس.</p>
              <Link href="/owner/units/new" className="btn-primary mt-5 !bg-white !text-nile">أضف وحدتك</Link>
            </div>
            <div className="soft-card !bg-white/10 !border-white/20 !text-white">
              <p className="text-3xl font-black">12%</p>
              <p className="mt-1 text-sm text-white/80">عمولة على الحجز المؤكد فقط</p>
            </div>
            <div className="soft-card !bg-white/10 !border-white/20 !text-white">
              <p className="text-3xl font-black">0 ج.م</p>
              <p className="mt-1 text-sm text-white/80">رسوم اشتراك أو عرض</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
