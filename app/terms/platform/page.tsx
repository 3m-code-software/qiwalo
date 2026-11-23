import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import SupportLinks from "@/components/SupportLinks";
import {
  CANCEL_POLICIES,
  DEFAULT_COMMISSION_RATE,
  SITE_NAME_AR,
  SUPPORT_PHONE,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "شروط المنصة",
  description: "دور قيوالو كوسيط، حدود المسؤولية، والقانون الحاكم — نسخة معتمدة.",
};

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-9 border-t border-line pt-6">
      <h2 className="text-lg font-extrabold text-navy">{title}</h2>
      <div className="muted mt-3 space-y-3 text-sm leading-8">{children}</div>
    </section>
  );
}

export default function PlatformTermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className="soft-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="chip">شروط المنصة</span>
          <span className="chip chip-gold">نسخة معتمدة</span>
        </div>
        <h1 className="mt-5 text-3xl font-black text-navy">شروط استخدام منصة {SITE_NAME_AR}</h1>
        <div className="gold-rule my-5" />
        <p className="muted text-sm leading-8">
          {SITE_NAME_AR} سوق عربي يربط المسافرين بأصحاب الوحدات في الأقصر وأسوان. هذه نسخة معتمدة
          للاستخدام، وتوضّح دور المنصة وحدود مسؤوليتها تجاه الضيوف والمالكين.
        </p>
        <div className="mt-6 rounded-xl border border-gold/30 bg-gold-soft px-4 py-3 text-xs font-bold leading-7 text-[#8a6a24]">
          نسخة معتمدة — المعاني الأساسية المعلنة هنا قابلة للتنفيذ، وأي تحديث لاحق يُعلَن في الموقع.
        </div>

        <Section id="role" title="١. دورنا كوسيط">
          <p>
            لا تملك {SITE_NAME_AR} الوحدات المعروضة ولا تشغّلها مباشرة. توفّر المنصة واجهة للبحث
            والحجز والتواصل، وتساعد في توثيق المالكين وتنظيم الحجوزات والمدفوعات اليدوية. المسؤولية
            عن جودة الإقامة وصحة الوصف تقع على المالك، مع التزام المنصة بمراجعة البلاغات.
          </p>
        </Section>

        <Section id="accounts" title="٢. الحسابات والوصول">
          <p>
            حساب الضيف اختياري، بينما يحتاج المالك إلى حساب موثّق قبل نشر الوحدات. يُطلب من المالك
            الهاتف الأساسي والبديل وتاريخ الميلاد وصورتي الهوية من الأمام والخلف، ثم سيلفي بعد
            اعتماد المستندات، مع تسجيل وقت قبول الشروط. تُستخدم هذه البيانات للتحقق فقط.
          </p>
        </Section>

        <Section id="booking" title="٣. الحجز والتأكيد">
          <p>
            يُنشأ رقم مرجعي لكل طلب حجز، ويظهر للمالك في لوحته. لا يكتمل الحجز إلا تأكيده من الطرف
            المختص وإرسال تفاصيل الوصول للضيف. يحق للمنصة تعليق أو إلغاء أي حجز يخالف الشروط أو
            يحتوي على بيانات غير صحيحة، مع إبلاغ الأطراف.
          </p>
        </Section>

        <Section id="payment" title="٤. الدفع">
          <p>
            الدفع المتاح هو <strong>تحويل بنكي أو كاش عند الوصول</strong> فقط. لا توفّر المنصة حالياً
            دفعاً إلكترونياً أو بوابة بطاقات، ولا تضمن استرداد أي مبلغ دُفع خارج القنوات التي تعلنها
            المنصة. تفاصيل الدفع الكاملة تظهر في صفحة تفاصيل الدفع الخاصة بكل حجز.
          </p>
        </Section>

        <Section id="cancellation" title="٥. الإلغاء">
          <p>تعتمد المنصة السياسات التالية وتُلزم الوحدات المعلنة بها:</p>
          <ul className="list-disc space-y-2 pr-5">
            {Object.values(CANCEL_POLICIES).map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </Section>

        <Section id="commission" title="٦. العمولة">
          <p>
            تتقاضى المنصة عمولة افتراضية قدرها <strong>{DEFAULT_COMMISSION_RATE}%</strong> من الحجز
            المؤكد، مع إمكانية اتفاق نسبة مختلفة مع الشركاء. تُعرض قيمة العمولة وصافي المستحق للمالك
            بوضوح، ولا تُطبَّق أي نسبة جديدة بأثر رجعي على حجز مؤكد.
          </p>
        </Section>

        <Section id="availability" title="٧. التوفر وحدود المسؤولية">
          <p>
            عرض الوحدة في نتائج البحث لا يضمن استمرار توفرها حتى يكتمل التأكيد. لا تضمن المنصة
            حصول الحجز على الترتيبات القانونية أو التراخيص الخاصة بالمالك، ولا تتحمل مسؤولية الظروف
            التي تقع خارج سيطرتها بعد التأكيد، دون إخلال بواجبها في مراجعة الشكاوى.
          </p>
        </Section>

        <Section id="support" title="٨. الدعم والقانون الحاكم">
          <p>
            الدعم العربي متاح عبر واتساب أو تليجرام على الرقم{" "}
            <span dir="ltr" className="font-bold">{SUPPORT_PHONE}</span>. نسعى للرد خلال وقت معقول،
            ويفضّل إرفاق رقم الحجز. تخضع هذه الشروط للقانون المصري، وتُحل الخلافات ودياً في البداية،
            ثم أمام الجهات المختصة في جمهورية مصر العربية إن لزم الأمر.
          </p>
          <div className="rounded-xl bg-navy p-4">
            <SupportLinks />
          </div>
        </Section>

        <div className="mt-9 flex flex-wrap gap-3 text-sm">
          <Link href="/terms" className="btn-ghost !px-4 !py-2 !text-xs">كل الشروط</Link>
          <Link href="/terms/guest" className="btn-ghost !px-4 !py-2 !text-xs">شروط الضيوف</Link>
          <Link href="/terms/owner" className="btn-ghost !px-4 !py-2 !text-xs">شروط المالكين</Link>
          <Link href="/terms/units" className="btn-ghost !px-4 !py-2 !text-xs">شروط الوحدات</Link>
          <Link href="/privacy" className="btn-ghost !px-4 !py-2 !text-xs">سياسة الخصوصية</Link>
        </div>
      </div>
    </div>
  );
}
