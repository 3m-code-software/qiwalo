import Link from "next/link";
import PackageModerationForm from "@/components/PackageModerationForm";
import { requireRole } from "@/lib/auth";
import { CITIES } from "@/lib/constants";
import { money, toArabicDigits } from "@/lib/format";
import { getRepo } from "@/lib/repo";

export const instant = false;

const statusLabel: Record<string, string> = {
  DRAFT: "مسودة", PENDING: "قيد المراجعة", PUBLISHED: "منشورة", REJECTED: "مرفوضة",
};

export default async function AdminPackagesPage() {
  await requireRole("ADMIN");
  const packages = await (await getRepo()).listAllPackages();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="chip">لوحة الإدارة</span>
          <h1 className="section-title mt-2">مراجعة الباقات</h1>
          <p className="muted mt-1 text-sm">الباقة تجمع وحدة + نقل + جولة بسعر واحد للليلة. لا تُنشر قبل مراجعة مستندها.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="btn-ghost text-sm">لوحة الإدارة</Link>
          <Link href="/owner/packages/new" className="btn-primary text-sm">+ باقة جديدة</Link>
        </div>
      </div>

      <div className="card table-wrap" data-testid="admin-packages">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>الباقة</th><th>المالك</th><th>المدينة</th><th>الوحدة</th><th>التجربة</th>
              <th>النقل</th><th>السعر / ليلة</th><th>المستند</th><th>الحالة</th><th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg.id} data-testid="admin-package-row">
                <td className="font-bold">{pkg.name}<span className="muted block text-xs">سعة {toArabicDigits(pkg.capacity)}</span></td>
                <td>{pkg.ownerName}</td>
                <td>{CITIES[pkg.city].ar}</td>
                <td>{pkg.propertyName}</td>
                <td>{pkg.experienceName}</td>
                <td>{pkg.transportName}</td>
                <td>{money(pkg.pricePerNight)}</td>
                <td>
                  <a href={pkg.licenseDocUrl} target="_blank" rel="noreferrer" dir="ltr" className="font-bold text-nile hover:text-gold">
                    مستند المراجعة ↗
                  </a>
                </td>
                <td>{statusLabel[pkg.status] ?? pkg.status}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    {pkg.status === "PENDING" && (
                      <>
                        <PackageModerationForm packageId={pkg.id} status="PUBLISHED" label="نشر" className="btn-primary !px-3 !py-1.5 text-xs" />
                        <PackageModerationForm packageId={pkg.id} status="REJECTED" label="رفض" />
                      </>
                    )}
                    {pkg.status === "PUBLISHED" && (
                      <PackageModerationForm packageId={pkg.id} status="DRAFT" label="إرجاع لمسودة" />
                    )}
                    {pkg.status === "REJECTED" && (
                      <PackageModerationForm packageId={pkg.id} status="PENDING" label="إعادة للمراجعة" />
                    )}
                    {pkg.status === "DRAFT" && <span className="muted text-xs">مسودة</span>}
                  </div>
                </td>
              </tr>
            ))}
            {packages.length === 0 && (
              <tr><td colSpan={10} className="py-6 text-center muted">لا توجد باقات بعد.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="muted mt-4 text-xs leading-6">
        إجمالي الباقات: {toArabicDigits(packages.length)}. العمولة ١٢٪ بعد التأكيد، مع إمكانية تجاوز الإدارة حسب سياسة المالك.
      </p>
    </div>
  );
}
