import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { confirmBookingAction } from "@/app/actions";
import { CITIES } from "@/lib/constants";
import { dateAr, money } from "@/lib/format";
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
        <h1 className="section-title">تأكيد الحجز</h1>
        <p className="muted mt-1 text-sm">خطوة واحدة فقط، بدون دفع إلكتروني في هذه المرحلة.</p>
      </div>

      {one(sp.error) === "contact" && (
        <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">الاسم والبريد الإلكتروني مطلوبان.</p>
      )}

      {!result.ok ? (
        <div className="soft-card text-center">
          <p className="font-bold">التواريخ غير متاحة أو غير صحيحة.</p>
          <Link href={`/stay/${property.slug}`} className="btn-ghost mt-4 text-sm">رجوع للوحدة</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_340px]">
          <div className="soft-card">
            <form action={confirmBookingAction} className="space-y-4">
              <input type="hidden" name="slug" value={property.slug} />
              <input type="hidden" name="checkIn" value={checkIn} />
              <input type="hidden" name="checkOut" value={checkOut} />
              <input type="hidden" name="guests" value={guests} />

              <h2 className="text-lg font-extrabold">بيانات التواصل</h2>
              <div>
                <label className="label" htmlFor="fullName">الاسم الكامل</label>
                <input id="fullName" name="fullName" className="input" required placeholder="مثال: أحمد محمد" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="email">البريد الإلكتروني</label>
                  <input id="email" name="email" type="email" className="input" required placeholder="name@example.com" />
                </div>
                <div>
                  <label className="label" htmlFor="phone">رقم الهاتف (اختياري)</label>
                  <input id="phone" name="phone" type="tel" className="input" placeholder="01xxxxxxxxx" />
                </div>
              </div>
              <p className="muted text-xs leading-6">
                هتستخدم البيانات دي لإرسال تأكيد الحجز لاحقاً عبر البريد/واتساب. في النسخة الحالية بيظهر التأكيد على الموقع مباشرة.
              </p>
              <button className="btn-primary w-full">تأكيد الحجز مجاناً</button>
            </form>
          </div>

          <aside className="soft-card h-fit">
            <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-xl">
              {property.images[0] && <Image src={property.images[0]} alt={property.name} fill sizes="340px" className="object-cover" />}
            </div>
            <h2 className="font-extrabold">{property.name}</h2>
            <p className="muted text-xs">{CITIES[property.city].ar} · {property.address}</p>
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><span className="muted">الوصول</span><span className="font-bold">{dateAr(checkIn)}</span></div>
              <div className="flex justify-between"><span className="muted">المغادرة</span><span className="font-bold">{dateAr(checkOut)}</span></div>
              <div className="flex justify-between"><span className="muted">الليالي</span><span className="font-bold">{result.quote.nights}</span></div>
              <div className="flex justify-between"><span className="muted">الضيوف</span><span className="font-bold">{guests}</span></div>
            </div>
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><span className="muted">المجموع الفرعي</span><span>{money(result.quote.subtotal)}</span></div>
              <div className="flex justify-between"><span className="muted">رسوم الخدمة</span><span>{money(result.quote.serviceFee)}</span></div>
              <div className="flex justify-between text-lg font-black text-nile"><span>الإجمالي</span><span>{money(result.quote.total)}</span></div>
            </div>
            <p className="muted mt-4 text-xs">الدفع الفعلي هيتم لاحقاً عبر Paymob. الحجز الحالي تجريبي ومؤكد.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
