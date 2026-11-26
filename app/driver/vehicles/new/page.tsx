import Link from "next/link";
import VehicleForm from "@/components/VehicleForm";
import { requireRole } from "@/lib/auth";
import { getRepo } from "@/lib/repo";

export const instant = false;

export const metadata = { title: "إضافة مركبة | قيوالو" };

export default async function NewVehiclePage() {
  const session = await requireRole("DRIVER");
  const profile = await (await getRepo()).getDriverProfile(session.email);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link href="/driver" className="text-sm font-bold text-nile">← رجوع للوحة السائق</Link>
        <h1 className="mt-3 text-3xl font-black">إضافة مركبة</h1>
        <p className="muted mt-1 text-sm">تقدر تضيف أكتر من مركبة. النوع والسعة وسعر الرحلة بتاع المركبة مش لكل فرد.</p>
      </div>
      {profile?.verificationStatus !== "APPROVED" && (
        <p className="mb-5 rounded-xl bg-gold-soft p-4 text-sm font-bold text-navy" role="status">
          لازم الإدارة تعتمد تحققك الأول. <Link href="/driver/verify" className="underline">أرسل التحقق ↗</Link>
        </p>
      )}
      {profile?.verificationStatus === "APPROVED" && profile.subscriptionStatus !== "ACTIVE" && (
        <p className="mb-5 rounded-xl bg-gold-soft p-4 text-sm font-bold text-navy" role="status">
          التحقق معتمد. استنى الإدارة تفعّل الاشتراك قبل ما المركبة تظهر للضيوف.
        </p>
      )}
      <div className="soft-card !p-6">
        <VehicleForm defaultCity={profile?.city ?? "LUXOR"} />
      </div>
    </main>
  );
}
