import Link from "next/link";
import { SUPPORT_PHONE, SUPPORT_TELEGRAM, SUPPORT_WHATSAPP } from "@/lib/constants";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="eyebrow !text-gold">قيوالو · الأقصر وأسوان</span>
      <p aria-hidden className="mt-8 text-8xl font-black leading-none text-navy/10 md:text-9xl">
        ٤٠٤
      </p>
      <h1 className="mt-4 text-3xl font-black leading-snug text-navy md:text-4xl">
        الصفحة دي مش موجودة (أو اتغيرت)
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-8 text-muted md:text-base">
        يمكن يكون الرابط غلط، أو الصفحة اتنقلت. خليك معانا: جرّب تبحث عن إقامة أو ارجع للرئيسية.
      </p>

      <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/" className="btn-primary">
          الرئيسية
        </Link>
        <Link href="/search" className="btn-gold">
          ابحث عن إقامة
        </Link>
      </div>

      <div className="gold-rule mt-12 w-16" />
      <p className="mt-5 text-xs leading-7 text-muted">
        محتاج مساعدة؟ الدعم:{" "}
        <a dir="ltr" href={SUPPORT_WHATSAPP} className="font-bold text-navy underline decoration-gold underline-offset-2">
          واتساب
        </a>
        {" · "}
        <a dir="ltr" href={SUPPORT_TELEGRAM} className="font-bold text-navy underline decoration-gold underline-offset-2">
          تليجرام
        </a>
        {" · "}
        <a dir="ltr" href={`tel:${SUPPORT_PHONE}`} className="font-bold text-navy underline decoration-gold underline-offset-2">
          {SUPPORT_PHONE}
        </a>
      </p>
    </section>
  );
}
