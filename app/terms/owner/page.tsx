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
  title: "شروط المالكين",
  description: "شروط توثيق المالكين وعرض الوحدات والعمولة على قيوالو — مسودة للمراجعة النهائية.",
};

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-9 border-t border-line pt-6">
      <h2 className="text-lg font-extrabold text-navy">{title}</h2>
      <div className="muted mt-3 space-y-3 text-sm leading-8">{children}</div>
    </section>
  );
}

export default function OwnerTermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className="soft-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="chip">شروط المالكين</span>
          <span className="chip chip-gold">مسودة للمراجعة النهائية</span>
        </div>
        <h1 className="mt-5 text-3xl font-black text-navy">شروط استخدام {SITE_NAME_AR} لأصحاب الوحدات</h1>
        <div className="gold-rule my-5" />
        <p className="muted text-sm leading-8">
          تنظّم هذه الشروط عرض وحدتك وإدارة حجوزاتك على {SITE_NAME_AR}. هذه نسخة مسودة للمراجعة
          النهائية قبل النشر. نهدف إلى علاقة واضحة: بيانات صحيحة، حجوزات مؤكدة، وعمولة معلومة.
        </p>
        <div className="mt-6 rounded-xl border border-gold/30 bg-gold-soft px-4 py-3 text-xs font-bold leading-7 text-[#8a6a24]">
          مسودة للمراجعة النهائية — الصياغة قابلة للتحسين، لكن الالتزامات الجوهرية أدناه هي المعتمدة
          للتنفيذ.
        </div>

        <Section id="verification" title="١. توثيق المالك">
          <p>قبل نشر أي وحدة، يُطلب توثيق الحساب بالبيانات والمستندات التالية:</p>
          <ul className="list-disc space-y-2 pr-5">
            <li>رقم الهاتف الأساسي ورقم هاتف بديل للطوارئ.</li>
            <li>تاريخ الميلاد والجنسية.</li>
            <li>صورة واضحة لوجه الهوية الأمامية وصورة لوجهها الخلفي.</li>
            <li>صورة سيلفي تُطلب بعد اعتماد المستندات الأولية، وليس قبل الموافقة المبدئية.</li>
            <li>تسجيل وقت الموافقة على هذه الشروط في سجل الحساب.</li>
          </ul>
          <p>
            تُستخدم هذه البيانات للتحقق من هوية المالك وحماية الضيوف فقط، ولا تُعرض علناً. قد ترفض
            المنصة طلب النشر إذا كانت المستندات غير واضحة أو غير متطابقة، مع إمكانية إعادة الإرسال
            بعد التصحيح.
          </p>
        </Section>

        <Section id="listing" title="٢. عرض الوحدة ومسؤوليتك">
          <p>
            تلتزم بإدخال بيانات صحيحة للوحدة: الاسم، العنوان، المدينة، الإحداثيات، نقطة الاستلام،
            السعر، عدد الضيوف، المرافق، وسياسة الإلغاء. أي تغيير في السعر أو التوفر بعد نشر الوحدة
            يجب تحديثه في لوحة المالك فوراً.
          </p>
          <p>
            عرض الوحدة في الموقع لا يضمن استمرار توفرها حتى يكتمل التأكيد. لا يجوز بيع الوحدة خارج
            المنصة لضيف حجزها عبر قيوالو بعد التأكيد، ويجب إبلاغ الدعم فوراً لأي ظرف يمنع الاستقبال.
          </p>
        </Section>

        <Section id="booking" title="٣. الحجز والتأكيد">
          <p>
            تظهر طلبات الحجز في لوحة المالك برقم مرجعي وتفاصيل الوصول والمغادرة وعدد الضيوف. يُعدّ
            الحجز ملزماً بعد التأكيد، ويجب تجهيز الوحدة أو نقطة الاستلام في الموعد المحدد. تأكيدك
            للحجز يعني موافقتك على السعر وسياسة الإلغاء الظاهرة للضيف.
          </p>
        </Section>

        <Section id="payment" title="٤. الدفع — تحويل بنكي أو كاش عند الوصول">
          <p>
            الدفع المتاح حالياً هو <strong>تحويل بنكي أو كاش عند الوصول</strong> فقط، ولا يوجد دفع
            إلكتروني داخل المنصة في هذه المرحلة. إذا اختر الضيف التحويل، تابع استلام الإيصال عبر الدعم
            قبل التأكيد النهائي حسب الحاجة. إذا اختار الكاش، تستلم المبلغ عند الوصول.
          </p>
          <p>
            لا تُطلب من الضيف أي مدفوعات إضافية خارج القيم الظاهرة في الحجز إلا بموافقته الصريحة
            وبعد إبلاغ الدعم. أي اتفاق جانبي بينك وبين الضيف خارج قيوالو لا يُلزم المنصة.
          </p>
        </Section>

        <Section id="commission" title="٥. العمولة">
          <p>
            العمولة الافتراضية للمنصة هي <strong>{DEFAULT_COMMISSION_RATE}%</strong> من قيمة الحجز،
            وتُحتسب قبل تحويل صافي المستحق إلى المالك. يجوز للمنصة الاتفاق على نسبة مختلفة مع
            شركائها، وتُثبت النسبة المطبقة على الوحدة أو الحساب في لوحة المالك.
          </p>
          <p>
            يُظهر الحجز قيمة الإجمالي وقيمة العمولة وصافي المستحق. لا تُخصم رسوم أخرى غير معلنة،
            وأي تعديل في النسبة يُبلَّغ به مسبقاً ولا يُطبّق بأثر رجعي على حجز مؤكد.
          </p>
        </Section>

        <Section id="cancellation" title="٦. الإلغاء">
          <p>تُطبَّق سياسة الوحدة المعلنة عند الحجز، وهي إحدى السياسات التالية:</p>
          <ul className="list-disc space-y-2 pr-5">
            {Object.values(CANCEL_POLICIES).map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
          <p>
            لا يجوز إلغاء حجز مؤكد من طرف المالك إلا لسبب قهري، ويجب إبلاغ الدعم فوراً. تُحدَّد
            المبالغ المستردة أو المحجوزة وفق السياسة المعلنة وبعد مراجعة الحالة.
          </p>
        </Section>

        <Section id="support" title="٧. الدعم والقانون الحاكم">
          <p>
            الدعم العربي متاح عبر واتساب أو تليجرام على الرقم{" "}
            <span dir="ltr" className="font-bold">{SUPPORT_PHONE}</span>. أرفق رقم الحجز أو رقم الوحدة
            عند التواصل. تخضع هذه الشروط للقانون المصري، وتُحل الخلافات ودياً عبر الدعم قبل اللجوء
            إلى الجهات المختصة.
          </p>
          <div className="rounded-xl bg-navy p-4">
            <SupportLinks />
          </div>
        </Section>

        <div className="mt-9 flex flex-wrap gap-3 text-sm">
          <Link href="/terms" className="btn-ghost !px-4 !py-2 !text-xs">كل الشروط</Link>
          <Link href="/terms/guest" className="btn-ghost !px-4 !py-2 !text-xs">شروط الضيوف</Link>
          <Link href="/terms/platform" className="btn-ghost !px-4 !py-2 !text-xs">شروط المنصة</Link>
          <Link href="/terms/units" className="btn-ghost !px-4 !py-2 !text-xs">شروط الوحدات</Link>
          <Link href="/privacy" className="btn-ghost !px-4 !py-2 !text-xs">سياسة الخصوصية</Link>
        </div>
      </div>
    </div>
  );
}
