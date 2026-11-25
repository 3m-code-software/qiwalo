import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SupportLinks from "@/components/SupportLinks";

export const metadata: Metadata = {
  title: "تحميل تطبيق أندرويد",
  description: "حمّل ملف APK لقيوالو على أندرويد واتبع خطوات التثبيت البسيطة.",
  robots: { index: false, follow: false },
};

const APK_HREF = "/downloads/qiwalo.apk";
const APK_SIZE = "٨٫٤MB";

const steps = [
  {
    n: "١",
    title: "افتح ملف التحميل",
    body: "بعد ما التحميل ينتهي، افتح ملف qiwalo.apk من مجلد «التحميلات» على جوالك.",
    image: "/download/step-1.svg",
    alt: "رسم توضيحي لفتح ملف APK من مجلد التحميلات",
  },
  {
    n: "٢",
    title: "اسمح بالتثبيت",
    body: "لو ظهر تنبيه «مصدر غير معروف»، فعّل السماح لهذا المصدر من إعدادات الأمان ثم ارجع للملف.",
    image: "/download/step-2.svg",
    alt: "رسم توضيحي لتفعيل السماح بتثبيت تطبيقات من مصدر غير معروف",
  },
  {
    n: "٣",
    title: "اضغط «تثبيت»",
    body: "اضغط زر تثبيت وانتظر ثوانٍ حتى يظهر التطبيق في قائمة التطبيقات.",
    image: "/download/step-3.svg",
    alt: "رسم توضيحي لزر التثبيت وشريط التقدم",
  },
  {
    n: "٤",
    title: "افتح قيوالو",
    body: "افتح التطبيق وابحث عن إقامتك في الأقصر أو أسوان — نفس تجربة الموقع على جوالك.",
    image: "/download/step-4.svg",
    alt: "رسم توضيحي لصفحة البحث داخل تطبيق قيوالو",
  },
];

export default function DownloadPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
      <div className="soft-card overflow-hidden">
        <div className="grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="chip">نسخة أندرويد</span>
            <h1 className="mt-4 text-3xl font-black leading-tight text-navy md:text-4xl">
              قيوالو في جيبك
            </h1>
            <p className="muted mt-3 max-w-xl text-sm leading-8">
              صفحة تحميل مستقلة لأندرويد فقط. الملف هو نسخة تجريبية من تجربة الويب نفسها —
              ما فيش دفع إلكتروني ولا رابط متجر، والدفع لسه «تحويل بنكي أو كاش عند الوصول».
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={APK_HREF}
                download="qiwalo.apk"
                aria-label={`تحميل ملف قيوالو للاندرويد بحجم ${APK_SIZE}`}
                className="btn-gold min-h-12 px-6"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                تحميل ملف APK
              </a>
              <Link href="/search" className="btn-ghost min-h-12 px-6">
                تصفح الإقامات على الويب
              </Link>
            </div>

            <ul className="mt-7 grid gap-2 text-sm text-navy/80">
              <li>✓ يعمل على أجهزة أندرويد فقط — ملف بصيغة APK.</li>
              <li>✓ الحجم {APK_SIZE} — التحميل من موقنا الرسمي.</li>
              <li>✓ لا يطلب صلاحيات دفع أو حساب بنكي.</li>
              <li>✓ الدعم عبر واتساب أو تليجرام لو احتجت مساعدة.</li>
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-xs rounded-3xl bg-navy-deep p-5 text-white shadow-xl">
            <div className="mx-auto h-1.5 w-16 rounded-full bg-white/25" />
            <div className="mt-5 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-gold/60 bg-gold/10 text-xl font-black text-gold-bright">
                ق
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-lg font-extrabold">قيوالو</span>
                <span className="mt-1 text-[0.6rem] font-bold tracking-[0.3em] text-gold-bright/80">QIWALO</span>
              </span>
            </div>
            <div className="gold-rule my-5" />
            <p className="text-sm leading-7 text-white/70">
              الأقصر وأسوان · وحدات موثّقة · حجز معتمد
            </p>
            <div className="mt-5 rounded-xl border border-white/15 bg-white/5 p-3 text-center text-xs font-bold text-gold-bright">
              جاهز للتثبيت على أندرويد
            </div>
          </div>
        </div>
      </div>

      <section aria-labelledby="install-title" className="mt-12">
        <span className="eyebrow !text-gold">خطوات بسيطة</span>
        <h2 id="install-title" className="mt-2 text-2xl font-black text-navy md:text-3xl">
          كيف تثبّت التطبيق؟
        </h2>
        <p className="muted mt-2 max-w-2xl text-sm leading-7">
          أربع خطوات فقط. الصور أدناه توضيحية ومطابقة لإعدادات أندرويد الأكثر شيوعاً؛
          قد تختلف التسمية قليلاً بين الشركات.
        </p>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          {steps.map((step) => (
            <article key={step.n} className="soft-card">
              <Image
                src={step.image}
                alt={step.alt}
                width={640}
                height={400}
                className="aspect-[8/5] w-full rounded-xl border border-line object-cover"
              />
              <h3 className="mt-5 flex items-center gap-2 text-lg font-black text-navy">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold-soft text-sm font-black text-navy">
                  {step.n}
                </span>
                {step.title}
              </h3>
              <p className="muted mt-2 text-sm leading-7">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="soft-card">
          <h2 className="text-lg font-black text-navy">قبل ما تبدأ</h2>
          <p className="muted mt-3 text-sm leading-7">
            تأكد إن المساحة متاحة على الجوال، وإنك حملت الملف من هذه الصفحة. لو ظهر تنبيه
            من متصفح الأندرويد، اختر «السماح» ثم افتح الملف من مجلد التحميلات.
          </p>
          <p className="mt-4 text-xs font-bold text-navy/70">
            الصفحة دي مخصصة للتحميل فقط، ومخفية من نتائج البحث.
          </p>
        </div>
        <div className="soft-card">
          <h2 className="text-lg font-black text-navy">محتاج مساعدة؟</h2>
          <p className="muted mt-3 text-sm leading-7">
            أبلغنا بأي مشكلة في التثبيت وهنرسل لك الخطوات المناسبة لجهازك.
          </p>
          <div className="mt-4">
            <SupportLinks />
          </div>
          <Link href="/" className="mt-5 inline-block text-sm font-bold text-navy underline decoration-gold underline-offset-4">
            الرجوع للرئيسية
          </Link>
        </div>
      </section>
    </div>
  );
}
