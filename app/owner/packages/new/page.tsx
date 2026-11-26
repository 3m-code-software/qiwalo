import Link from "next/link";
import PackageForm from "@/components/PackageForm";
import { requireRole } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import type { CityKey } from "@/lib/types";

export const instant = false;

export const metadata = { title: "إضافة باقة | قيوالو" };

export default async function NewPackagePage() {
  const session = await requireRole("OWNER");
  const repo = await getRepo();
  const [properties, experiences, transports] = await Promise.all([
    repo.listPropertiesForOwner(session.email),
    repo.listPublishedExperiences(),
    repo.listPublishedTransports(),
  ]);
  const toOption = (items: Array<{ id: string; name: string; city: CityKey }>) =>
    items.map(({ id, name, city }) => ({ id, name, city }));
  // مركبات السائقين المنشورة متاحة للباقة جنب نقل المالك، بعد مراجعة الإدارة وتفعيل الاشتراك.

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link href="/owner" className="text-sm font-bold text-nile">← رجوع للوحة المالك</Link>
        <h1 className="mt-3 text-3xl font-black">إضافة باقة كاملة</h1>
        <p className="muted mt-1 text-sm">وحدة + نقل + جولة بسعر واحد لكل ليلة، بعد مراجعة الإدارة.</p>
      </div>
      <div className="soft-card !p-6">
        <PackageForm
          properties={toOption(properties)}
          experiences={toOption(experiences.filter((item) => item.ownerId === session.email))}
          transports={toOption(transports.filter((item) => item.ownerId === session.email || Boolean(item.driverId)))}
        />
      </div>
    </main>
  );
}
