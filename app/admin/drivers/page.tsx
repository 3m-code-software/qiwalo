import Link from "next/link";
import DriverModerationForm from "@/components/DriverModerationForm";
import DriverSubscriptionForm from "@/components/DriverSubscriptionForm";
import VehicleModerationForm from "@/components/VehicleModerationForm";
import { requireRole } from "@/lib/auth";
import { CITIES, DRIVER_SUBSCRIPTION_LABELS, TRANSPORT_TYPES } from "@/lib/constants";
import { money, toArabicDigits } from "@/lib/format";
import { getRepo } from "@/lib/repo";

export const instant = false;

export const metadata = { title: "مراجعة السائقين | قيوالو" };

const verificationLabel: Record<string, string> = {
  PENDING: "قيد المراجعة", SELFIE_REQUIRED: "مطلوب سيلفي", SELFIE_PENDING: "السيلفي قيد المراجعة",
  APPROVED: "معتمد", REJECTED: "مرفوض",
};

const vehicleStatusLabel: Record<string, string> = {
  DRAFT: "مسودة", PENDING: "قيد المراجعة", PUBLISHED: "منشورة", REJECTED: "مرفوضة",
};

export default async function AdminDriversPage() {
  await requireRole("ADMIN");
  const repo = await getRepo();
  const [profiles, vehicles] = await Promise.all([repo.listDriverProfiles(), repo.listAllVehicles()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="chip">لوحة الإدارة</span>
          <h1 className="section-title mt-2">مراجعة السائقين والمركبات</h1>
          <p className="muted mt-1 text-sm">لا تُنشر مركبة قبل اعتماد تحقق السائق وتفعيل اشتراكه. المستندات لا تُعرض للضيوف.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="btn-ghost text-sm">لوحة الإدارة</Link>
          <Link href="/driver/verify" className="btn-primary text-sm">تحقق سائق</Link>
        </div>
      </div>

      <section data-testid="admin-drivers">
        <h2 className="mb-4 text-xl font-extrabold">السائقون</h2>
        <div className="card table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>السائق</th><th>المدينة</th><th>التحقق</th><th>الاشتراك</th>
                <th>الهوية</th><th>الرخصة</th><th>إجراء التحقق</th><th>إجراء الاشتراك</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.userId} data-testid="admin-driver-row">
                  <td className="font-bold">{profile.name}<span className="muted block text-xs" dir="ltr">{profile.userId}</span></td>
                  <td>{CITIES[profile.city].ar}</td>
                  <td>{verificationLabel[profile.verificationStatus] ?? profile.verificationStatus}</td>
                  <td>{DRIVER_SUBSCRIPTION_LABELS[profile.subscriptionStatus].ar}</td>
                  <td>
                    <a href={profile.idFront} target="_blank" rel="noreferrer" dir="ltr" className="font-bold text-nile hover:text-gold">الوجه ↗</a>
                    {" · "}
                    <a href={profile.idBack} target="_blank" rel="noreferrer" dir="ltr" className="font-bold text-nile hover:text-gold">الظهر ↗</a>
                  </td>
                  <td>
                    <a href={profile.licenseDocUrl} target="_blank" rel="noreferrer" dir="ltr" className="font-bold text-nile hover:text-gold">رخصة القيادة ↗</a>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {profile.verificationStatus === "PENDING" && (
                        <>
                          <DriverModerationForm userId={profile.userId} status="APPROVED" label="اعتماد" className="btn-primary !px-3 !py-1.5 text-xs" />
                          <DriverModerationForm userId={profile.userId} status="REJECTED" label="رفض" />
                        </>
                      )}
                      {profile.verificationStatus === "APPROVED" && (
                        <DriverModerationForm userId={profile.userId} status="PENDING" label="إعادة للمراجعة" />
                      )}
                      {profile.verificationStatus === "REJECTED" && (
                        <DriverModerationForm userId={profile.userId} status="PENDING" label="إعادة للمراجعة" />
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {profile.subscriptionStatus !== "ACTIVE" && (
                        <DriverSubscriptionForm userId={profile.userId} status="ACTIVE" label="تفعيل" className="btn-primary !px-3 !py-1.5 text-xs" />
                      )}
                      {profile.subscriptionStatus === "ACTIVE" && (
                        <DriverSubscriptionForm userId={profile.userId} status="EXPIRED" label="إنهاء" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr><td colSpan={8} className="py-6 text-center muted">لا يوجد سائقون بعد.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10" data-testid="admin-vehicles">
        <h2 className="mb-4 text-xl font-extrabold">المركبات</h2>
        <div className="card table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>المركبة</th><th>السائق</th><th>المدينة</th><th>اللوحة</th>
                <th>السعة</th><th>السعر</th><th>المستند</th><th>الحالة</th><th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} data-testid="admin-vehicle-row">
                  <td className="font-bold">{vehicle.name}<span className="muted block text-xs">{TRANSPORT_TYPES[vehicle.type].ar} · {vehicle.model}</span></td>
                  <td>{vehicle.driverName}</td>
                  <td>{CITIES[vehicle.city].ar}</td>
                  <td dir="ltr" className="text-xs">{vehicle.plateNumber}</td>
                  <td>{toArabicDigits(vehicle.capacity)}</td>
                  <td>{money(vehicle.pricePerTrip)}</td>
                  <td>
                    <a href={vehicle.licenseDocUrl} target="_blank" rel="noreferrer" dir="ltr" className="font-bold text-nile hover:text-gold">مستند المراجعة ↗</a>
                  </td>
                  <td>{vehicleStatusLabel[vehicle.status] ?? vehicle.status}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {vehicle.status === "PENDING" && (
                        <>
                          <VehicleModerationForm vehicleId={vehicle.id} status="PUBLISHED" label="نشر" className="btn-primary !px-3 !py-1.5 text-xs" />
                          <VehicleModerationForm vehicleId={vehicle.id} status="REJECTED" label="رفض" />
                        </>
                      )}
                      {vehicle.status === "PUBLISHED" && (
                        <VehicleModerationForm vehicleId={vehicle.id} status="DRAFT" label="إرجاع لمسودة" />
                      )}
                      {vehicle.status === "REJECTED" && (
                        <VehicleModerationForm vehicleId={vehicle.id} status="PENDING" label="إعادة للمراجعة" />
                      )}
                      {vehicle.status === "DRAFT" && <span className="muted text-xs">مسودة</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr><td colSpan={9} className="py-6 text-center muted">لا توجد مركبات بعد.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="muted mt-4 text-xs leading-6">
        السائقون: {toArabicDigits(profiles.length)} · المركبات: {toArabicDigits(vehicles.length)}. العمولة ١٢٪ بعد التأكيد، مع إمكانية تجاوز الإدارة.
      </p>
    </div>
  );
}
