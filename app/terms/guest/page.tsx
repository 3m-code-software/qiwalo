import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import SupportLinks from "@/components/SupportLinks";
import { CANCEL_POLICIES, SITE_NAME_AR, SUPPORT_PHONE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "شروط الضيوف",
  description: "شروط حجز وإقامة الضيوف على قيوالو — مسودة للمراجعة النهائية.",
};

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-9 border-t border-line pt-6">
      <h2 className="text-lg font-extrabold text-navy">{title}</h2>
      <div className="muted mt-3 space-y-3 text-sm leading-8">{children}</div>
    </section>
  );
}

export default function GuestTermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className="soft-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="chip">شروط الضيوف</span>
          <span className="chip chip-gold">مسودة للمراجعة النهائية</span>
        </div>
        <h1 className="mt-5 text-3xl font-black text-navy">شروط استخدام {SITE_NAME_AR} للضيوف</h1>
        <div className="gold-rule my-5" />
        <p className="muted text-sm leading-8">
          تنظّم هذه الشروط استخدامك للموقع عند البحث عن إقامة أو حجزها في الأقصر وأسوان. هذه مسودة
          للمراجعة النهائية قبل النشر؛ نوضّح ما يخصّ الضيوف بوضوح، ولا نحتفظ بحقوق غامضة.
        </p>

        <div className="mt-6 rounded-xl border border-gold/30 bg-gold-soft px-4 py-3 text-xs font-bold leading-7 text-[#8a6a24]">
          نسخة مسودة للمراجعة النهائية — قد تُعدَّل الصياغة قبل الإصدار الرسمي دون تغيير الجوهر
          الموضح هنا.
        </div>

        <Section id="booking" title="١. الحجز والتأكيد">
          <p>
            عند اختيار وحدة وإدخال تواريخ الإقامة وعدد الضيوف، ينشئ الموقع طلب حجز برقم مرجعي
            فريد. يظهر الطلب في لوحة المالك، ويُعدّ الحجز مؤكداً فقط عند ظهور حالة التأكيد ووصول
            رسالة تحتوي على رقم الحجز وتفاصيل الوصول.
          </p>
          <p>
            بياناتك — الاسم، الجنسية، وتواريخ الوصول والمغادرة — تُستخدم لتأكيد الحجز والتواصل معك.
            يُرجى التأكد من صحتها قبل الإرسال، لأن تعديلها بعد التأكيد يعتمد على موافقة المالك.
          </p>
        </Section>

        <Section id="payment" title="٢. الدفع — تحويل بنكي أو كاش عند الوصول">
          <p>
            الدفع المتاح في هذه المرحلة هو <strong>تحويل بنكي أو كاش عند الوصول</strong> فقط. لا يوجد
            دفع إلكتروني أو بوابة دفع فورية داخل الموقع الآن، ولن يُطلب منك إدخال بيانات بطاقة
            ائتمان لإتمام الحجز.
          </p>
          <p>
            إذا اخترت التحويل البنكي، تُرسل بيانات الحوالة وتعليمات إرسال صورة الإيصال مع رقم الحجز
            إلى الدعم. إذا اخترت الكاش، تسدّد المبلغ كاملاً عند الوصول إلى الوحدة أو نقطة الاستلام
            المتفق عليها. لا تُعتبر أي مدفوعات لطرف خارج قيوالو مسؤولةً عنها المنصة.
          </p>
        </Section>

        <Section id="cancellation" title="٣. الإلغاء وعدم الحضور">
          <p>تخضع كل وحدة لإحدى السياسات التالية، وتُعرض سياسة الوحدة بوضوح قبل تأكيد الحجز:</p>
          <ul className="list-disc space-y-2 pr-5">
            {Object.values(CANCEL_POLICIES).map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
          <p>
            يجب إرسال طلب الإلغاء عبر الدعم أو القنوات المعلنة، ويُحتسب وقت الإلغاء وفق تاريخ
            الوصول المذكور في الحجز. استرداد المبلغ — إن وجد — يتم وفق سياسة الوحدة وبعد التحقق من
            الحجز.
          </p>
        </Section>

        <Section id="account" title="٤. حساب الضيف اختياري">
          <p>
            يمكنك تصفح الوحدات وحجزها دون إنشاء حساب. إنشاء حساب الضيف اختياري، ويوفّر سجلاً
            للحجوزات وتواصلًا أسهل مع الدعم. عند إنشاء حساب توافق على الشروط، ويُسجَّل وقت الموافقة
            في السجل.
          </p>
        </Section>

        <Section id="reviews" title="٥. التقييمات والمراجعات">
          <p>
            يمكن للضيف إضافة تقييم أو مراجعة بعد اكتمال الحجز فقط. تُراجع التقييمات قبل نشرها،
            ولا تُقبل المراجعات التي تحتوي على إساءة أو بيانات خاصة بطرف آخر. لا تشترط المنصة تقييماً
            إيجابياً مقابل أي خدمة أو خصم.
          </p>
        </Section>

        <Section id="availability" title="٦. التوفر ومحدودية المسؤولية">
          <p>
            عرض الوحدة أو ظهورها في نتائج البحث لا يضمن استمرار توفرها حتى يكتمل التأكيد. قد تتغير
            الأسعار أو التوفر أو سياسة الإلغاء قبل التأكيد؛ ويُعمل بالبيانات الظاهرة في رسالة التأكيد
            النهائية.
          </p>
          <p>
            قيوالو وسيط بين الضيف والمالك، ولا تملك الوحدة ولا تشغّلها مباشرة. لا تضمن المنصة تطابق
            كل تفصيلة مع الوصف، لكنها تتعهد بمراجعة الشكاوى الواردة عبر الدعم.
          </p>
        </Section>

        <Section id="support" title="٧. الدعم">
          <p>
            الدعم العربي متاح عبر واتساب أو تليجرام على الرقم{" "}
            <span dir="ltr" className="font-bold">{SUPPORT_PHONE}</span>. أرفق رقم الحجز عند التواصل
            لتسريع الرد.
          </p>
          <div className="rounded-xl bg-navy p-4">
            <SupportLinks />
          </div>
        </Section>

        <Section id="law" title="٨. القانون الحاكم">
          <p>
            تخضع هذه الشروط وأي نزاع يتعلق بها للقانون المصري، دون إخلال بحقوق المستهلك التي يكفلها
            القانون. إذا تعذّر الحل الودي عبر الدعم، يُحال النزاع إلى الجهات المختصة في جمهورية
            مصر العربية.
          </p>
        </Section>

        <div className="mt-9 flex flex-wrap gap-3 text-sm">
          <Link href="/terms" className="btn-ghost !px-4 !py-2 !text-xs">كل الشروط</Link>
          <Link href="/terms/owner" className="btn-ghost !px-4 !py-2 !text-xs">شروط المالكين</Link>
          <Link href="/terms/platform" className="btn-ghost !px-4 !py-2 !text-xs">شروط المنصة</Link>
          <Link href="/terms/units" className="btn-ghost !px-4 !py-2 !text-xs">شروط الوحدات</Link>
          <Link href="/privacy" className="btn-ghost !px-4 !py-2 !text-xs">سياسة الخصوصية</Link>
        </div>
      </div>
    </div>
  );
}
