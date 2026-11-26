import Link from "next/link";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { deleteVehicleAction, setVehiclePausedAction } from "@/app/actions";
import { requireRole } from "@/lib/auth";
import { CITIES, DRIVER_SUBSCRIPTION_LABELS, DRIVER_SUBSCRIPTION_NOTICE, TRANSPORT_TYPES } from "@/lib/constants";
import { dateAr, money, toArabicDigits } from "@/lib/format";
import { getRepo } from "@/lib/repo";

export const instant = false;

export const metadata = { title: "لوحة السائق | قيوالو" };

const verificationLabel: Record<string, string> = {
  PENDING: "قيد المراجعة", SELFIE_REQUIRED: "مطلوب سيلفي", SELFIE_PENDING: "السيلفي قيد المراجعة",
  APPROVED: "معتمد", REJECTED: "مرفوض",
};

const vehicleStatusLabel: Record<string, string> = {
  DRAFT: "مسودة", PENDING: "قيد المراجعة", PUBLISHED: "منشورة", REJECTED: "مرفوضة",
};

const bookingStatusLabel: Record<string, string> = {
  PENDING: "قيد الانتظار", CONFIRMED: "مؤكدة", CANCELLED: "ملغاة", COMPLETED: "مكتملة",
};

const paymentStatusLabel: Record<string, string> = {
  PENDING: "بانتظار الدفع", PAID: "مدفوع", FAILED: "فشل", REFUNDED: "مسترد",
};

export default async function DriverDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string | string[]; updated?: string | string[]; verified?: string | string[] }>;
}) {
  const session = await requireRole("DRIVER");
  const sp = await searchParams;
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const vehicleCreated = one(sp.vehicle);
  const vehicleUpdated = one(sp.updated);
  const verifiedSent = one(sp.verified);
  const repo = await getRepo();
  const [profile, vehicles, trips] = await Promise.all([
    repo.getDriverProfile(session.email),
    repo.listVehiclesForDriver(session.email),
    repo.listBookingsForDriver(session.email),
  ]);
  const verified = profile?.verificationStatus === "APPROVED";
  const active = profile?.subscriptionStatus === "ACTIVE";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10" data-testid="driver-dashboard">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="chip">لوحة السائق</span>
          <h1 className="section-title mt-2">مرحباً {session.name}</h1>
          <p className="muted mt-1 text-sm">الطلبات والتحقق والاشتراك والمركبات في مكان واحد.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/" className="btn-ghost text-sm">الرئيسية</Link>
          <Link href="/driver/verify" className="btn-ghost text-sm">{profile ? "تحديث التحقق" : "إرسال التحقق"}</Link>
          <Link href="/driver/vehicles/new" className="btn-primary text-sm">+ إضافة مركبة</Link>
        </div>
      </div>

      {vehicleCreated === "1" && (
        <p className="mb-5 rounded-xl bg-nile-soft p-4 text-sm font-bold text-nile-dark" role="status">
          ✅ تم إرسال المركبة للمراجعة. هتظهر للضيوف بعد موافقة الإدارة.
        </p>
      )}
      {vehicleUpdated === "1" && (
        <p className="mb-5 rounded-xl bg-nile-soft p-4 text-sm font-bold text-nile-dark" role="status">
          ✅ تم حفظ تعديلات المركبة.
        </p>
      )}
      {verifiedSent === "1" && (
        <p className="mb-5 rounded-xl bg-nile-soft p-4 text-sm font-bold text-nile-dark" role="status">
          ✅ تم إرسال بيانات التحقق للمراجعة.
        </p>
      )}

      <section className="soft-card" data-testid="driver-status">
        <h2 className="text-lg font-extrabold text-navy">حالة الحساب</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="muted text-xs">التحقق</p>
            <p className="mt-1 font-bold">{verificationLabel[profile?.verificationStatus ?? "PENDING"]}</p>
          </div>
          <div>
            <p className="muted text-xs">الاشتراك</p>
            <p className="mt-1 font-bold">{DRIVER_SUBSCRIPTION_LABELS[profile?.subscriptionStatus ?? "NONE"].ar}</p>
          </div>
          <div>
            <p className="muted text-xs">المدينة</p>
            <p className="mt-1 font-bold">{profile ? CITIES[profile.city].ar : "—"}</p>
          </div>
        </div>
        <p className="muted mt-4 text-xs leading-6">{DRIVER_SUBSCRIPTION_NOTICE}</p>
        {!verified && (
          <p className="mt-3 text-sm font-bold text-navy">لازم تعتمد الإدارة تحققك قبل إضافة أي مركبة.</p>
        )}
        {verified && !active && (
          <p className="mt-3 text-sm font-bold text-navy">التحقق معتمد. استنى تفعيل الإدارة للاشتراك عشان تنشر مركبتك.</p>
        )}
      </section>

      <section className="mt-10" data-testid="driver-trip-requests">
        <h2 className="mb-4 text-xl font-extrabold">طلبات الرحلات</h2>
        <p className="muted mb-4 text-xs leading-6">
          كل طلبات النقل المرتبطة بحجوزاتك بتظهر هنا. الحجز نفسه بتأكده الإدارة، ومفيش تحصيل للسائق من قيوالو في النسخة دي.
        </p>
        {trips.length === 0 ? (
          <div className="soft-card text-center">
            <p className="muted">لسه ما وصلكش أي طلب نقل.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {trips.map((trip) => (
              <article key={trip.id} className="soft-card" data-testid="driver-trip-row">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="chip !bg-transparent">{bookingStatusLabel[trip.status] ?? trip.status}</span>
                  <span className="muted text-xs" dir="ltr">{trip.reference}</span>
                </div>
                <h3 className="font-extrabold">{trip.guestName}</h3>
                <p className="muted mt-1 text-xs">{trip.propertyName} · {dateAr(trip.checkIn)} ← {dateAr(trip.checkOut)}</p>
                {trip.transport && (
                  <>
                    <p className="mt-3 text-sm font-bold text-navy">{trip.transport.transportName}</p>
                    <p className="muted mt-1 text-xs" dir="ltr">
                      {trip.transport.routeFrom} ← {trip.transport.routeTo}
                    </p>
                    <p className="muted mt-1 text-xs">
                      السعة: {toArabicDigits(trip.transport.guests)} من {toArabicDigits(trip.transport.capacity)} · {toArabicDigits(trip.transport.durationHours)} ساعات
                    </p>
                    <p className="mt-3 font-bold text-nile">{money(trip.transport.total)} للرحلة</p>
                  </>
                )}
                <p className="muted mt-2 text-xs">حالة الدفع: {paymentStatusLabel[trip.paymentStatus] ?? trip.paymentStatus}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10" data-testid="driver-vehicles">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold">مركباتك</h2>
          <Link href="/driver/vehicles/new" className="btn-ghost text-sm">+ مركبة جديدة</Link>
        </div>
        {vehicles.length === 0 ? (
          <div className="soft-card text-center">
            <p className="muted">لسه مضفتش أي مركبة.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {vehicles.map((vehicle) => (
              <article key={vehicle.id} data-testid="driver-vehicle-row" className="soft-card">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="chip !bg-transparent">
                    {vehicle.isPaused ? "موقوفة" : vehicleStatusLabel[vehicle.status] ?? vehicle.status}
                  </span>
                  <span className="muted text-xs" dir="ltr">{vehicle.plateNumber}</span>
                </div>
                <h3 className="font-extrabold">{vehicle.name}</h3>
                <p className="muted mt-1 text-xs">
                  {TRANSPORT_TYPES[vehicle.type].ar} · {CITIES[vehicle.city].ar} · {vehicle.model}
                </p>
                <p className="muted mt-2 text-xs">السعة: {toArabicDigits(vehicle.capacity)} أفراد · {toArabicDigits(vehicle.durationHours)} ساعات</p>
                <p className="muted mt-1 text-xs">أيام محجوزة: {toArabicDigits((vehicle.blockedDates ?? []).length)}</p>
                <p className="mt-3 font-bold text-nile">{money(vehicle.pricePerTrip)} / رحلة</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/driver/vehicles/${vehicle.id}`} data-testid="driver-vehicle-edit" className="btn-ghost !px-3 !py-1.5 text-xs">
                    تعديل المركبة
                  </Link>
                  {(vehicle.status === "PUBLISHED" || vehicle.isPaused) && (
                    <form action={setVehiclePausedAction}>
                      <input type="hidden" name="id" value={vehicle.id} />
                      <input type="hidden" name="paused" value={vehicle.isPaused ? "0" : "1"} />
                      <button
                        type="submit"
                        data-testid="driver-vehicle-pause"
                        className="btn-ghost !px-3 !py-1.5 text-xs"
                      >
                        {vehicle.isPaused ? "إعادة النشر" : "إيقاف المركبة"}
                      </button>
                    </form>
                  )}
                  <form action={deleteVehicleAction}>
                    <input type="hidden" name="id" value={vehicle.id} />
                    <ConfirmSubmitButton
                      confirmText="هيتم حذف المركبة نهائياً. متأكد؟"
                      data-testid="driver-vehicle-delete"
                      className="btn-ghost !px-3 !py-1.5 text-xs !text-red-600"
                    >
                      حذف المركبة
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
