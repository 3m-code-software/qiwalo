"use client";

import { useActionState } from "react";
import { moderateVehicleAction, type FormState } from "@/app/actions";

type Props = {
  vehicleId: string;
  status: "PUBLISHED" | "REJECTED" | "DRAFT" | "PENDING";
  label: string;
  className?: string;
};

export default function VehicleModerationForm({ vehicleId, status, label, className = "btn-ghost !px-3 !py-1.5 text-xs" }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(moderateVehicleAction, {});

  return (
    <form action={action} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="id" value={vehicleId} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" disabled={pending} className={className} aria-label={`${label} المركبة`}>
        {pending ? "..." : label}
      </button>
      {state.error && <span role="alert" className="text-xs font-bold text-red-600">{state.error}</span>}
      {state.ok && <span role="status" className="text-xs font-bold text-nile">{state.ok}</span>}
    </form>
  );
}
