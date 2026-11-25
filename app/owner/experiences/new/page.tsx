import Link from "next/link";
import ExperienceForm from "@/components/ExperienceForm";
import { requireRole } from "@/lib/auth";

export const instant = false;

export default async function NewExperiencePage() {
  await requireRole("OWNER");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow !text-gold">خدمات المالك</span>
          <h1 className="section-title mt-2">أضف تجربة سفاري جبال</h1>
          <p className="muted mt-1 text-sm">السفاري هنا رحلات صحراء وجبال، مش سفاري حيوانات.</p>
        </div>
        <Link href="/owner" className="btn-ghost text-sm">رجوع للوحة المالك</Link>
      </div>

      <div className="soft-card !p-6">
        <ExperienceForm />
      </div>
    </div>
  );
}
