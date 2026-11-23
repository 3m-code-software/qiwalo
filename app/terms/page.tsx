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
  title: "الشروط والسياسات",
  description: "شروط استخدام قيوالو للضيوف والمالكين والمنصة — نسخة مسودة للمراجعة النهائية.",
};

const documents = [
  {
    href: "/terms/guest",
    title: "شروط الضيوف",
    description: "الحجز والتأكيد، الدفع، الإلغاء، الحساب الاختياري، والتقييمات بعد إتمام الإقامة.",
  },
  {
    href: "/terms/owner",
    title: "شروط المالكين",
    description: "التوثيق، نسبة العمولة الافتراضية، إدارة الوحدات، والالتزامات تجاه الضيوف.",
  },
  {
    href: "/terms/platform",
    title: "شروط المنصة",
    description: "دور قيوالو كوسيط، حدود المسؤولية، الدعم، والقانون الحاكم.",
  },
  {
    href: "/terms/units",
    title: "شروط وأحكام الوحدات",
    description: "قواعد عرض الوحدة: الوصف والصور والأسعار والتوفر والإلغاء والسلامة.",
  },
  {
    href: "/privacy",
    title: "سياسة الخصوصية",
    description: "ما نجمعه من بيانات ولماذا، ومن يصل إليها، وكيف تطلب مراجعتها أو حذفها.",
  },
];

export default function TermsIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <div className="soft-card relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-gold via-gold-bright to-transparent" />
        <div className="flex flex-wrap items-center gap-3">
          <span className="chip">شروط {SITE_NAME_AR}</span>
          <span className="chip chip-gold">مسودة للمراجعة النهائية</span>
        </div>
        <h1 className="mt-5 text-3xl font-black text-navy">الشروط والسياسات</h1>
        <div className="gold-rule my-5" />
        <p className="muted max-w-2xl text-sm leading-8">
          هذه نسخة مسودة أعدّها فريق {SITE_NAME_AR} لمراجعتها قبل النشر النهائي. الهدف أن تكون القواعد
          واضحة ومكتوبة بالعربية: كيف يتم الحجز والتأكيد، كيف يُدفع، متى يُسمح بالإلغاء، وما الذي
          تلتزم به المنصة والمالكون والضيوف. يرجى قراءة المستند الخاص بدورك قبل استخدام الموقع.
        </p>

        <div className="mt-9 grid gap-4 sm:grid-cols-3">
          {documents.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              className="group rounded-xl border border-line bg-ivory p-4 transition hover:border-gold hover:shadow-sm"
            >
              <h2 className="text-sm font-extrabold text-navy transition group-hover:text-gold">{doc.title}</h2>
              <p className="muted mt-2 text-xs leading-6">{doc.description}</p>
              <span className="mt-3 inline-block text-xs font-extrabold text-gold">اقرأ التفاصيل</span>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-xl bg-navy p-5 text-white">
          <h2 className="text-lg font-extrabold text-gold-bright">ملخص سريع</h2>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-white/75">
            <li>• الحجز يُؤكَّد برقم مرجعي ورسالة تأكيد بعد مراجعة المالك / المنصة.</li>
            <li>• الدفع المتاح الآن: تحويل بنكي أو كاش عند الوصول — لا يوجد دفع إلكتروني في هذه المرحلة.</li>
            <li>• الإلغاء يخضع لسياسة الوحدة المعلنة؛ القواعد مفصّلة أدناه وفي صفحة كل وحدة.</li>
            <li>• إنشاء حساب الضيف اختياري، لكنه يساعد في تتبع الحجوزات والتقييمات.</li>
            <li>• التقييم متاح بعد اكتمال الحجز فقط.</li>
            <li>• توثيق المالك يشمل الهاتف والهاتف البديل، تاريخ الميلاد، وجه الهوية، والسيلفي بعد الاعتماد.</li>
            <li>• العمولة الافتراضية {DEFAULT_COMMISSION_RATE}% مع إمكانية تعديلها لشركاء المنصة.</li>
            <li>• عرض الوحدة لا يضمن استمرار توفرها حتى يكتمل التأكيد.</li>
            <li>• الدعم عبر واتساب / تليجرام على الرقم {SUPPORT_PHONE}، والقانون الحاكم هو القانون المصري.</li>
          </ul>
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="mb-3 text-xs font-bold text-white/70">تواصل مع الدعم العربي</p>
            <SupportLinks />
          </div>
        </div>

        <div className="mt-9 border-t border-line pt-6">
          <h2 className="text-lg font-extrabold text-navy">سياسات الإلغاء المعتمدة</h2>
          <ul className="muted mt-3 space-y-2 text-sm leading-8">
            {Object.values(CANCEL_POLICIES).map((text) => (
              <li key={text}>• {text}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
