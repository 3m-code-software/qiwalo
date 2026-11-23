import Link from "next/link";
import SupportLinks from "@/components/SupportLinks";
import { SUPPORT_PHONE } from "@/lib/constants";

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-navy-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-gold/60 text-lg font-black text-gold-bright">ق</span>
            <span className="flex flex-col leading-none">
              <span className="text-lg font-extrabold">قيوالو</span>
              <span className="mt-1 text-[0.6rem] font-bold tracking-[0.3em] text-gold-bright/80">QIWALO</span>
            </span>
          </div>
          <div className="gold-rule mb-4" />
          <p className="text-sm leading-7 text-white/60">
            سوق إقامة عربي يربط المسافرين بأصحاب الوحدات في الأقصر وأسوان، بأسعار واضحة وتجربة راقية.
          </p>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-extrabold text-gold-bright">وجهات</h3>
          <ul className="space-y-2.5 text-sm text-white/65">
            <li><Link href="/search?city=LUXOR" className="transition hover:text-gold-bright">الأقصر</Link></li>
            <li><Link href="/search?city=ASWAN" className="transition hover:text-gold-bright">أسوان</Link></li>
            <li><Link href="/search?type=NILE_CRUISE" className="transition hover:text-gold-bright">رحلات نيلية</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-extrabold text-gold-bright">للمزودين</h3>
          <ul className="space-y-2.5 text-sm text-white/65">
            <li><Link href="/owner/units/new" className="transition hover:text-gold-bright">أضف وحدتك</Link></li>
            <li><Link href="/owner" className="transition hover:text-gold-bright">لوحة المالك</Link></li>
            <li><Link href="/terms/owner" className="transition hover:text-gold-bright">شروط المالكين</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-extrabold text-gold-bright">الدعم</h3>
          <SupportLinks />
          <p className="mt-3 text-sm text-white/65">
            اتصل بنا:{" "}
            <a href={`tel:${SUPPORT_PHONE}`} dir="ltr" className="font-bold transition hover:text-gold-bright">
              {SUPPORT_PHONE}
            </a>
          </p>
          <h4 className="mb-2 mt-6 text-sm font-extrabold text-gold-bright">الشروط</h4>
          <ul className="space-y-2.5 text-sm text-white/65">
            <li><Link href="/terms/guest" className="transition hover:text-gold-bright">شروط الضيوف</Link></li>
            <li><Link href="/terms/owner" className="transition hover:text-gold-bright">شروط المالكين</Link></li>
            <li><Link href="/terms/platform" className="transition hover:text-gold-bright">شروط المنصة</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/45">
        © 2026 قيوالو. صُنع للمسافر العربي.
      </div>
    </footer>
  );
}
