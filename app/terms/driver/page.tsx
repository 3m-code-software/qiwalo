import type { Metadata } from "next";
import Link from "next/link";
import LegalStamp from "@/components/LegalStamp";
import SupportLinks from "@/components/SupportLinks";
import { CITIES, DRIVER_SUBSCRIPTION_NOTICE, SITE_NAME_AR } from "@/lib/constants";

export const metadata: Metadata = {
  title: "شروط السائقين",
  description: "شروط توثيق السائقين واشتراكهم وعرض مركباتهم على قيوالو — نسخة معتمدة.",
};

export default function DriverTermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <div className="soft-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="chip">شروط السائقين</span>
          <LegalStamp />
        </div>
        <h1 className="mt-5 text-3xl font-black text-navy">شروط استخدام {SITE_NAME_AR} للسائقين</h1>
        <div className="gold-rule my-5" />
        <p className="muted text-sm leading-8">
          تنظّم هذه الشروط تسجيل السائق، وتحقق هويته، وإضافة مركباته التي تُعرض للضيوف كخدمات نقل
          أو داخل الباقات. هذه نسخة معتمدة للاستخدام، ولا تُضاف أي صفة قانونية للحساب قبل مراجعة الإدارة.
        </p>
        <div className="mt-6 rounded-xl border border-gold/30 bg-gold-soft px-4 py-3 text-xs font-bold leading-7 text-[#8a6a24]">
          نسخة معتمدة — الالتزامات الجوهرية أدناه قابلة للتنفيذ، وأي تحديث لاحق يُعلَن في الموقع.
        </div>

        <section className="mt-9 border-t border-line pt-6">
          <h2 className="text-lg font-extrabold text-navy">١. التحقق والاشتراك</h2>
          <div className="muted mt-3 space-y-3 text-sm leading-8">
            <p>يلزم رقم هاتف مصري صحيح وصورتا الهوية ورخصة القيادة، ثم مراجعة الإدارة قبل نشر أي مركبة.</p>
            <p>حالة الاشتراك تُدار من لوحة الإدارة، ولا يظهر السائق للضيوف قبل تفعيلها. مفيش تحصيل إلكتروني في هذه النسخة.</p>
            <p className="font-bold text-nile">{DRIVER_SUBSCRIPTION_NOTICE}</p>
          </div>
        </section>

        <section className="mt-9 border-t border-line pt-6">
          <h2 className="text-lg font-extrabold text-navy">٢. بيانات المركبة</h2>
          <div className="muted mt-3 space-y-3 text-sm leading-8">
            <p>تُسجَّل المركبة باسمها ونوعها ورقمها وطرازها ومدينتها وسعتها وسعر الرحلة، مع مستند مراجعة لا يُعرض للضيوف.</p>
            <p>المدينة الوحيدة المتاحة حالياً: {Object.values(CITIES).map((city) => city.ar).join(" و")}.</p>
            <p>السعر للمركبة أو الرحلة مرة واحدة، وليس للفرد. عدد الضيوف يُستخدم للتحقق من السعة فقط.</p>
          </div>
        </section>

        <section className="mt-9 border-t border-line pt-6">
          <h2 className="text-lg font-extrabold text-navy">٣. الحجوزات والإلغاء</h2>
          <div className="muted mt-3 space-y-3 text-sm leading-8">
            <p>تظهر طلبات النقل المرتبطة بالحجز في لوحة السائق، ويجب الالتزام بنقطة اللقاء والموعد والسعة المعلنة.</p>
            <p>سياسة الإلغاء الظاهرة وقت إضافة المركبة هي المرجع عند أي نزاع، مع إخطار الدعم فوراً عند تعذّر التنفيذ.</p>
          </div>
        </section>

        <div className="mt-9 flex flex-wrap gap-3 border-t border-line pt-6 text-sm font-bold text-nile">
          <Link href="/login" className="underline decoration-gold underline-offset-2">تسجيل الدخول ↔</Link>
          <SupportLinks />
        </div>
      </div>
    </main>
  );
}
