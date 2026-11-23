import Link from "next/link";
import { getSession } from "@/lib/auth";

export default async function SiteHeader() {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-nile text-xl font-black text-white">ق</span>
          <span className="text-lg font-extrabold">قيوالو <span className="muted">Qiwalo</span></span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-bold md:flex">
          <Link href="/search?city=LUXOR" className="hover:text-nile">الأقصر</Link>
          <Link href="/search?city=ASWAN" className="hover:text-nile">أسوان</Link>
          <Link href="/search" className="hover:text-nile">كل الوحدات</Link>
          <Link href="/owner" className="hover:text-nile">للمالكين</Link>
        </nav>
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <span className="hidden text-xs font-bold muted sm:inline">مرحباً، {session.name}</span>
              {session.role === "ADMIN" && <Link href="/admin" className="btn-ghost !px-3 !py-2 text-xs">الإدارة</Link>}
              <Link href="/owner" className="btn-primary !px-3 !py-2 text-xs">لوحة المالك</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost !px-3 !py-2 text-xs">دخول</Link>
              <Link href="/login?role=OWNER" className="btn-primary !px-3 !py-2 text-xs">أضف وحدتك</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
