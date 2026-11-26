import Link from "next/link";
import DriverVerificationForm from "@/components/DriverVerificationForm";
import { requireRole } from "@/lib/auth";
import { getRepo } from "@/lib/repo";

export const instant = false;

export const metadata = { title: "تحقق السائق | قيوالو" };

export default async function DriverVerifyPage() {
  const session = await requireRole("DRIVER");
  const profile = await (await getRepo()).getDriverProfile(session.email);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link href="/driver" className="text-sm font-bold text-nile">← رجوع للوحة السائق</Link>
        <h1 className="mt-3 text-3xl font-black">تحقق حساب السائق</h1>
        <p className="muted mt-1 text-sm">نفس مسار تحقق المالك: مستندات، مراجعة إدارية، ثم تفعيل الاشتراك.</p>
      </div>
      <div className="soft-card !p-6">
        <DriverVerificationForm defaultCity={profile?.city ?? "LUXOR"} />
      </div>
    </main>
  );
}
