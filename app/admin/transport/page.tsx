import Link from "next/link";
import TransportModerationForm from "@/components/TransportModerationForm";
import { requireRole } from "@/lib/auth";
import { CITIES, TRANSPORT_TYPES } from "@/lib/constants";
import { money, toArabicDigits } from "@/lib/format";
import { getRepo } from "@/lib/repo";

export const instant = false;

const statusLabel: Record<string, string> = {
  DRAFT: "مسودة", PENDING: "قيد المراجعة", PUBLISHED: "منشورة", REJECTED: "مرفوضة",
};

export default async function AdminTransportPage() {
  await requireRole("ADMIN");
  const transports = await (await getRepo()).listAllTransports();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="chip">لوحة الإدارة</span>
          <h1 className="section-title mt-2">مراجعة النقل السياحي</h1>
          <p className="muted mt-1 text-sm">لا تُنشر أي خدمة قبل مراجعة مستندها. المستند لا يُعرض للضيوف.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="btn-ghost text-sm">لوحة الإدارة</Link>
          <Link href="/owner/transport/new" className="btn-primary text-sm">+ خدمة جديدة</Link>
        </div>
      </div>

      <div className="card table-wrap" data-testid="admin-transports">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>الخدمة</th><th>المالك</th><th>المدينة</th><th>النوع</th>
              <th>المسار</th><th>السعر</th><th>المستند</th><th>الحالة</th><th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {transports.map((transport) => (
              <tr key={transport.id} data-testid="admin-transport-row">
                <td className="font-bold">{transport.name}<span className="muted block text-xs">{toArabicDigits(transport.durationHours)} ساعات · سعة {toArabicDigits(transport.capacity)}</span></td>
                <td>{transport.ownerName}</td>
                <td>{CITIES[transport.city].ar}</td>
                <td>{TRANSPORT_TYPES[transport.type].ar}</td>
                <td>{transport.routeFrom} ← {transport.routeTo}</td>
                <td>{money(transport.pricePerTrip)}</td>
                <td>
                  <a href={transport.licenseDocUrl} target="_blank" rel="noreferrer" dir="ltr" className="font-bold text-nile hover:text-gold">
                    مستند المراجعة ↗
                  </a>
                </td>
                <td>{statusLabel[transport.status] ?? transport.status}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    {transport.status === "PENDING" && (
                      <>
                        <TransportModerationForm transportId={transport.id} status="PUBLISHED" label="نشر" className="btn-primary !px-3 !py-1.5 text-xs" />
                        <TransportModerationForm transportId={transport.id} status="REJECTED" label="رفض" />
                      </>
                    )}
                    {transport.status === "PUBLISHED" && (
                      <TransportModerationForm transportId={transport.id} status="DRAFT" label="إرجاع لمسودة" />
                    )}
                    {transport.status === "REJECTED" && (
                      <TransportModerationForm transportId={transport.id} status="PENDING" label="إعادة للمراجعة" />
                    )}
                    {transport.status === "DRAFT" && <span className="muted text-xs">مسودة</span>}
                  </div>
                </td>
              </tr>
            ))}
            {transports.length === 0 && (
              <tr><td colSpan={9} className="py-6 text-center muted">لا توجد خدمات نقل بعد.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="muted mt-4 text-xs leading-6">
        إجمالي خدمات النقل: {toArabicDigits(transports.length)}. العمولة ١٢٪ بعد التأكيد، مع إمكانية تجاوز الإدارة حسب سياسة المالك.
      </p>
    </div>
  );
}
