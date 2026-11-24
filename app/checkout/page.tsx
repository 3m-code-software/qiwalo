import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import PriceBreakdown from "@/components/PriceBreakdown";
import { CITIES } from "@/lib/constants";
import { dateAr } from "@/lib/format";
import { quoteStay } from "@/lib/pricing";
import { getRepo } from "@/lib/repo";

export const instant = false;

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const slug = one(sp.slug);
  const checkIn = one(sp.checkIn);
  const checkOut = one(sp.checkOut);
  const guests = Math.max(1, Number(one(sp.guests)) || 1);
  const repo = await getRepo();
  const property = await repo.getPropertyBySlug(slug);
  if (!property || property.status !== "PUBLISHED") notFound();

  const [rules, availability] = await Promise.all([repo.getPriceRules(property.id), repo.getAvailability(property.id)]);
  const result = quoteStay(property, rules, availability, checkIn, checkOut);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <span className="eyebrow !text-gold">خطوة واحدة</span>
        <h1 className="section-title mt-3">تأكيد الحجز</h1>
        <p className="muted mt-1 text-sm">تحويل بنكي أو كاش عند الوصول</p>
      </div>

      {!result.ok ? (
        <div className="soft-card text-center">
          <p className="font-bold">التواريخ غير متاحة أو غير صحيحة.</p>
          <Link href={`/stay/${property.slug}`} className="btn-ghost mt-4 text-sm">رجوع للوحدة</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_340px]">
          <div className="soft-card">
            <CheckoutForm
              property={property}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              quote={result.quote}
            />
          </div>

          <aside className="soft-card h-fit">
            <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-xl">
              {property.images[0] && <Image src={property.images[0]} alt={property.name} fill sizes="340px" className="object-cover" />}
            </div>
            <h2 className="font-extrabold text-navy">{property.name}</h2>
            <p className="muted text-xs">{CITIES[property.city].ar} · {property.address}</p>
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><span className="muted">الوصول</span><span className="font-bold">{dateAr(checkIn)}</span></div>
              <div className="flex justify-between"><span className="muted">المغادرة</span><span className="font-bold">{dateAr(checkOut)}</span></div>
              <div className="flex justify-between"><span className="muted">الليالي</span><span className="font-bold">{result.quote.nights}</span></div>
              <div className="flex justify-between"><span className="muted">الضيوف</span><span className="font-bold">{guests}</span></div>
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <PriceBreakdown quote={result.quote} commissionRate={property.commissionRate} />
            </div>
            <p className="mt-4 border-t border-line pt-4 text-xs font-bold leading-6 text-muted">تحويل بنكي أو كاش عند الوصول</p>
          </aside>
        </div>
      )}
    </div>
  );
}
