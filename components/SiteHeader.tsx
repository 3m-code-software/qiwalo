import Link from "next/link";
import { logoutAction } from "@/app/actions";
import FavoritesNavLink from "@/components/FavoritesNavLink";
import SupportLinks from "@/components/SupportLinks";
import { getSession } from "@/lib/auth";

export default async function SiteHeader() {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-deep/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
        <Link href="/" className="group flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-gold/60 bg-gradient-to-br from-gold-bright/20 to-transparent text-lg font-black text-gold-bright transition group-hover:border-gold">
            ق
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-lg font-extrabold tracking-tight text-white">قيوالو</span>
            <span className="mt-1 text-[0.6rem] font-bold tracking-[0.3em] text-gold-bright/80">QIWALO</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-bold text-white/75 md:flex">
          <Link href="/search?city=LUXOR" className="transition hover:text-gold-bright">الأقصر</Link>
          <Link href="/search?city=ASWAN" className="transition hover:text-gold-bright">أسوان</Link>
          <Link href="/search" className="transition hover:text-gold-bright">كل الوحدات</Link>
          <FavoritesNavLink />
          <Link href="/owner" className="transition hover:text-gold-bright">للمالكين</Link>
          <Link href="/terms" className="transition hover:text-gold-bright">الشروط</Link>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <SupportLinks compact />
          </div>
          {session ? (
            <>
              <span className="hidden text-xs font-bold text-white/60 sm:inline">مرحباً، {session.name}</span>
              {session.role === "ADMIN" && (
                <Link href="/admin" className="btn-ghost !border-white/20 !bg-transparent !px-3 !py-2 !text-white !text-xs">
                  الإدارة
                </Link>
              )}
              {(session.role === "OWNER" || session.role === "ADMIN") && (
                <Link href="/owner" className="btn-gold !px-3 !py-2 !text-xs">لوحة المالك</Link>
              )}
              <form action={logoutAction}>
                <button type="submit" className="btn-ghost !border-white/20 !bg-transparent !px-3 !py-2 !text-white !text-xs">
                  خروج
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost !border-white/20 !bg-transparent !px-3 !py-2 !text-white !text-xs">
                دخول
              </Link>
              <Link href="/login?role=OWNER" className="btn-gold !px-3 !py-2 !text-xs">أضف وحدتك</Link>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2">
          <SupportLinks compact />
          <FavoritesNavLink compact />
          <Link href="/download" className="shrink-0 text-xs font-bold text-gold-bright transition hover:text-white">
            تحميل
          </Link>
          <Link href="/terms" className="shrink-0 text-xs font-bold text-white/70 transition hover:text-gold-bright">
            الشروط
          </Link>
        </div>
      </div>
    </header>
  );
}
