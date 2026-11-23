import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-nile font-black text-white">ق</span>
            <span className="font-extrabold">قيوالو</span>
          </div>
          <p className="text-sm leading-7 muted">سوق إقامة عربي يربط المسافرين بأصحاب الوحدات في الأقصر وأسوان.</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-extrabold">وجهات</h3>
          <ul className="space-y-2 text-sm muted">
            <li><Link href="/search?city=LUXOR" className="hover:text-nile">الأقصر</Link></li>
            <li><Link href="/search?city=ASWAN" className="hover:text-nile">أسوان</Link></li>
            <li><Link href="/search?type=NILE_CRUISE" className="hover:text-nile">رحلات نيلية</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-extrabold">للمزودين</h3>
          <ul className="space-y-2 text-sm muted">
            <li><Link href="/owner/units/new" className="hover:text-nile">أضف وحدتك</Link></li>
            <li><Link href="/owner" className="hover:text-nile">لوحة المالك</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-extrabold">الدعم</h3>
          <ul className="space-y-2 text-sm muted">
            <li>دعم عربي</li><li>تأكيد فوري</li><li>سياسة إلغاء واضحة</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs muted">
        © 2026 قيوالو. صُنع للمسافر العربي.
      </div>
    </footer>
  );
}
