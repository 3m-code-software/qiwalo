import Link from "next/link";
import { notFound } from "next/navigation";
import VehicleForm from "@/components/VehicleForm";
import { requireRole } from "@/lib/auth";
import { CITIES, TRANSPORT_TYPES } from "@/lib/constants";
import { getRepo } from "@/lib/repo";

export const instant = false;

export const metadata = { title: "تعديل مركبة | قيوالو" };

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("DRIVER");
  const { id } = await params;
  const vehicle = await (await getRepo()).getVehicleById(id);
  if (!vehicle || vehicle.driverId !== session.email) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link href="/driver" className="text-sm font-bold text-nile">← رجوع للوحة السائق</Link>
        <h1 className="mt-3 text-3xl font-black">تعديل المركبة</h1>
        <p className="muted mt-1 text-sm">
          {vehicle.name} · {TRANSPORT_TYPES[vehicle.type].ar} · {CITIES[vehicle.city].ar}
        </p>
      </div>
      <div className="soft-card !p-6">
        <VehicleForm vehicle={vehicle} />
      </div>
    </main>
  );
}
