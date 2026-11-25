import Link from "next/link";
import ExperienceModerationForm from "@/components/ExperienceModerationForm";
import { requireRole } from "@/lib/auth";
import { CITIES, EXPERIENCE_CATEGORIES, EXPERIENCE_DIFFICULTIES } from "@/lib/constants";
import { money, toArabicDigits } from "@/lib/format";
import { getRepo } from "@/lib/repo";

export const instant = false;

const statusLabel: Record<string, string> = {
  DRAFT: "مسودة", PENDING: "قيد المراجعة", PUBLISHED: "منشورة", REJECTED: "مرفوضة",
};

export default async function AdminExperiencesPage() {
  await requireRole("ADMIN");
  const experiences = await (await getRepo()).listAllExperiences();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="chip">لوحة الإدارة</span>
          <h1 className="section-title mt-2">مراجعة التجارب والجولات</h1>
          <p className="muted mt-1 text-sm">سفاري الجبال وجولات الموتوسيكلات. لا تُنشر أي تجربة قبل مراجعة مستندها، والمستند لا يُعرض للضيوف.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="btn-ghost text-sm">لوحة الإدارة</Link>
          <Link href="/owner/experiences/new" className="btn-primary text-sm">+ تجربة جديدة</Link>
        </div>
      </div>

      <div className="card table-wrap" data-testid="admin-experiences">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>التجربة</th><th>المالك</th><th>المدينة</th><th>النوع</th>
              <th>الصعوبة</th><th>السعر</th><th>المستند</th><th>الحالة</th><th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {experiences.map((experience) => (
              <tr key={experience.id} data-testid="admin-experience-row">
                <td className="font-bold">{experience.name}<span className="muted block text-xs">{experience.mountain}</span></td>
                <td>{experience.ownerName}</td>
                <td>{CITIES[experience.city].ar}</td>
                <td>{EXPERIENCE_CATEGORIES[experience.category].ar}</td>
                <td>{EXPERIENCE_DIFFICULTIES[experience.difficulty].ar}</td>
                <td>{money(experience.pricePerPerson)}</td>
                <td>
                  <a href={experience.licenseDocUrl} target="_blank" rel="noreferrer" dir="ltr" className="font-bold text-nile hover:text-gold">
                    مستند المراجعة ↗
                  </a>
                </td>
                <td>{statusLabel[experience.status] ?? experience.status}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    {experience.status === "PENDING" && (
                      <>
                        <ExperienceModerationForm experienceId={experience.id} status="PUBLISHED" label="نشر" className="btn-primary !px-3 !py-1.5 text-xs" />
                        <ExperienceModerationForm experienceId={experience.id} status="REJECTED" label="رفض" />
                      </>
                    )}
                    {experience.status === "PUBLISHED" && (
                      <ExperienceModerationForm experienceId={experience.id} status="DRAFT" label="إرجاع لمسودة" />
                    )}
                    {experience.status === "REJECTED" && (
                      <ExperienceModerationForm experienceId={experience.id} status="PENDING" label="إعادة للمراجعة" />
                    )}
                    {experience.status === "DRAFT" && <span className="muted text-xs">مسودة</span>}
                  </div>
                </td>
              </tr>
            ))}
            {experiences.length === 0 && (
              <tr><td colSpan={9} className="py-6 text-center muted">لا توجد تجارب بعد.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="muted mt-4 text-xs leading-6">
        إجمالي التجارب: {toArabicDigits(experiences.length)}. العمولة ١٢٪ بعد التأكيد، مع إمكانية تجاوز الإدارة حسب سياسة المالك.
      </p>
    </div>
  );
}
