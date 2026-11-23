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
  title: "شروط وأحكام الوحدات",
  description: "قواعد عرض الوحدات على قيوالو: الوصف والصور والأسعار والتوفر والإلغاء — نسخة معتمدة.",
};

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-9 border-t border-line pt-6">
      <h2 className="text-lg font-extrabold text-navy">{title}</h2>
      <div className="muted mt-3 space-y-3 text-sm leading-8">{children}</div>
    </section>
  );
}

export default function UnitTermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className="soft-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="chip">شروط الوحدات</span>
          <span className="chip chip-gold">نسخة معتمدة</span>
        </div>
        <h1 className="mt-5 text-3xl font-black text-navy">شروط وأحكام عرض الوحدات على {SITE_NAME_AR}</h1>
        <div className="gold-rule my-5" />
        <p className="muted text-sm leading-8">
          تنظّم هذه الشروط طريقة عرض الوحدات في {SITE_NAME_AR} وإدارتها، وما يلتزم به المالك تجاه
          الضيف والمنصة. هذه نسخة معتمدة للاستخدام، وتُكمّل{" "}
          <Link href="/terms/owner" className="font-bold text-navy underline decoration-gold underline-offset-2">شروط المالكين</Link>{" "}
          ولا تُغني عنها.
        </p>

        <div className="mt-6 rounded-xl border border-gold/30 bg-gold-soft px-4 py-3 text-xs font-bold leading-7 text-[#8a6a24]">
          نسخة معتمدة — المعاني الأساسية الموضحة هنا قابلة للتنفيذ، وأي تحديث لاحق يُعلَن في الموقع.
        </div>

        <Section id="scope" title="١. ما المقصود بالوحدة">
          <p>
            الوحدة هي مكان الإقامة المعروض للحجز في الأقصر أو أسوان: شقة، شاليه، فيلا، فندق، بيت
            ضيافة، أو مركب نيلي. تلتزم كل وحدة بالشروط العامة للمنصة وبالقواعد المعلنة في صفحتها،
            بما في ذلك سياسة الإلغاء وقواعد الإقامة.
          </p>
          <p>
            لا تملك {SITE_NAME_AR} الوحدات ولا تشغّلها مباشرة؛ المالك مسؤول عن صحة ما يعرضه وعن
            توفير الإقامة كما وصفها، مع التزام المنصة بمراجعة الوحدة قبل نشرها والرد على البلاغات.
          </p>
        </Section>

        <Section id="accuracy" title="٢. صحة الوصف والمعلومات">
          <ul className="list-disc space-y-2 pr-5">
            <li>يُكتب العنوان والوصف بالعربية بوضوح، ويحددان المدينة والمنطقة ونوع الوحدة بدقة.</li>
            <li>تُذكر السعة القصوى للضيوف وعدد الغرف والأسرة والمرافق المتاحة فعلياً.</li>
            <li>لا تُستخدم أوصاف مضللة أو مبالغ فيها، ولا يُوعد بمرافق أو إطلالات غير موجودة.</li>
            <li>تُحدَّث المعلومات عند أي تغيير، ويُبلَّغ الدعم إذا طرأ ما يؤثر على حجز مؤكد.</li>
          </ul>
        </Section>

        <Section id="photos" title="٣. الصور والمحتوى">
          <p>
            يُرفع حتى 8 صور لكل وحدة، ويُفضَّل أن تكون حقيقية وحديثة وتُظهر المكان كما يستقبله الضيف.
            يجب أن يكون المالك مالكاً لحق استخدام الصور، ولا تُستخدم صور الغير أو صور تحمل علامات
            تجارية دون إذن، ولا صور تحتوي على بيانات خاصة بأشخاص آخرين.
          </p>
          <p>
            تُرفع الصور عبر رابط موقّع من السيرفر إلى Cloudinary، ويمكن معاينتها وإزالتها قبل إرسال
            الوحدة للمراجعة. للمنصة أن تطلب استبدال أي صورة غير واضحة أو غير لائقة أو مضللة.
          </p>
        </Section>

        <Section id="pricing" title="٤. الأسعار والعمولة">
          <p>
            تُعرض الأسعار بالجنيه المصري وبصورة واضحة، وتشمل ما تعلنه الوحدة من مرافق وخدمات. لا
            تُضاف رسوم مخفية على الضيف بعد التأكيد، وأي رسوم اختيارية يجب إعلانها في صفحة الوحدة قبل
            الحجز.
          </p>
          <p>
            تتقاضى المنصة عمولة افتراضية قدرها <strong>{DEFAULT_COMMISSION_RATE}%</strong> من الحجز
            المؤكد فقط، مع إمكانية اتفاق نسبة مختلفة مع الشركاء. لا يوجد اشتراك أو رسوم نشر حالياً.
            والدفع المتاح للضيف هو <strong>تحويل بنكي أو كاش عند الوصول</strong>، ولا تُطلب بيانات
            بطاقة ائتمان عبر الموقع.
          </p>
        </Section>

        <Section id="availability" title="٥. التوفر والتقويم">
          <p>
            يلتزم المالك بتحديث تقويم التوفر فور أي تغيير، وإغلاق الأيام المحجوزة أو غير المتاحة،
            لتجنّب الحجز المزدوج. عرض الوحدة في نتائج البحث لا يضمن استمرار توفرها حتى يكتمل التأكيد،
            ويُعمل بالبيانات الظاهرة في رسالة التأكيد النهائية.
          </p>
          <p>
            تُظهر صفحة الوحدة خريطة بدبّوسين: أحدهما للوحدة والآخر لنقطة الاستلام، مع زر اتجاهات
            Google Maps. يجب أن تكون نقطة الاستلام صحيحة ومتفقاً عليها مع الضيف.
          </p>
        </Section>

        <Section id="cancellation" title="٦. سياسة الإلغاء">
          <p>تخضع كل وحدة لإحدى السياسات المعتمدة التالية، وتُعرض سياستها بوضوح قبل تأكيد الحجز:</p>
          <ul className="list-disc space-y-2 pr-5">
            {Object.values(CANCEL_POLICIES).map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
          <p>
            لا تُغيَّر سياسة الإلغاء لتطبيقها بأثر رجعي على حجز مؤكد. أي استثناء أو اتفاق خاص يجب
            توثيقه عبر الدعم قبل التأكيد.
          </p>
        </Section>

        <Section id="rules" title="٧. قواعد الإقامة والضيوف">
          <p>
            تُعلَن قواعد الوحدة في صفحتها، مثل موعد الوصول والمغادرة، التدخين، الحيوانات الأليفة،
            الأطفال، أوقات الهدوء، والزيارات. تُطبَّق القواعد المعلنة على جميع الضيوف بعدالة ودون
            تمييز، ولا تُضاف قواعد جديدة بعد الحجز إلا باتفاق مع الضيف.
          </p>
          <p>
            يتعامل المالك مع الضيف باحترام، ويلتزم بتسليم الوحدة في الحالة المتفق عليها، ويسلّمه
            مفاتيح الوصول أو تعليمات الدخول في موعده. وأي خلاف يُحال أولاً إلى الدعم قبل أي إجراء.
          </p>
        </Section>

        <Section id="safety" title="٨. السلامة والتراخيص">
          <p>
            المالك مسؤول عن التراخيص والتصاريح اللازمة لتشغيل الوحدة واستقبال الضيوف، وعن سلامة
            المكان من حيث الكهرباء والغاز والسلامة من الحريق ومخارج الطوارئ، وعن صحة معلومات العنوان
            والتواصل. لا تضمن المنصة حصول الوحدة على هذه التراخيص، لكنها تحتفظ بحق طلب إثباتها أو
            إيقاف الوحدة عند وجود بلاغ جاد.
          </p>
        </Section>

        <Section id="reviews" title="٩. التقييمات">
          <p>
            تُقبل التقييمات من الضيوف بعد اكتمال الإقامة فقط، وتُراجع قبل النشر. لا تُقبل تقييمات
            مزيفة أو مدفوعة أو تحتوي على إساءة أو بيانات خاصة بطرف آخر. للمالك الرد على التقييم
            بأدب عبر الدعم، ولا يجوز تعديله أو حذفه إلا وفق قواعد المراجعة.
          </p>
        </Section>

        <Section id="moderation" title="١٠. المراجعة والتعديل والإيقاف">
          <p>
            تُراجع الوحدة قبل نشرها، وللمنصة أن تطلب تعديل الوصف أو الصور أو الأسعار، أو أن تؤجّل
            النشر إلى حين استكمال البيانات. كما يجوز إيقاف وحدة أو إزالتها إذا ثبت أنها مضللة، أو
            تحتوي محتوى غير لائق، أو تخالف الشروط، أو تلقّت بلاغات جادة لم تُعالَج، مع إبلاغ المالك
            بالسبب عبر الدعم.
          </p>
        </Section>

        <Section id="support" title="١١. الدعم">
          <p>
            لأي استفسار عن وحدة أو تعديل بياناتها، تواصل معنا عبر واتساب أو تليجرام على الرقم{" "}
            <span dir="ltr" className="font-bold">{SUPPORT_PHONE}</span>، أو اضغط زر الشات في أي صفحة،
            وأرفق رقم الوحدة أو رقم الحجز لتسريع الرد.
          </p>
          <div className="rounded-xl bg-navy p-4">
            <SupportLinks />
          </div>
        </Section>

        <div className="mt-9 flex flex-wrap gap-3 text-sm">
          <Link href="/terms" className="btn-ghost !px-4 !py-2 !text-xs">كل الشروط</Link>
          <Link href="/terms/owner" className="btn-ghost !px-4 !py-2 !text-xs">شروط المالكين</Link>
          <Link href="/terms/guest" className="btn-ghost !px-4 !py-2 !text-xs">شروط الضيوف</Link>
          <Link href="/privacy" className="btn-ghost !px-4 !py-2 !text-xs">سياسة الخصوصية</Link>
        </div>
      </div>
    </div>
  );
}
