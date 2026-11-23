import { createHmac } from "node:crypto";

/** Webhook signature verification only. Full checkout integration comes later. */
export function verifyPaymobHmac(payload: Record<string, unknown>, secretKey?: string): boolean {
  if (!secretKey) return false;
  const body = ((payload.obj ?? payload) ?? {}) as Record<string, unknown>;
  const fields = [
    "amount_cents", "created_at", "currency", "error_occured", "has_parent_transaction",
    "id", "integration_id", "is_3d_secure", "is_auth", "is_capture", "is_refunded",
    "is_standalone_payment", "is_voided", "order", "owner", "pending",
    "source_data.pan", "source_data.sub_type", "source_data.type", "success",
  ];
  let value = "";
  for (const field of fields) {
    let v: unknown = body;
    for (const part of field.split(".")) v = (v as Record<string, unknown>)?.[part];
    if (v == null) continue;
    if (typeof v === "object") {
      const id = (v as Record<string, unknown>).id;
      value += id == null ? "" : String(id);
    } else {
      value += String(v);
    }
  }
  const digest = createHmac("sha512", secretKey).update(value).digest("hex");
  const incoming = String(payload.hmac ?? body.hmac ?? "");
  return digest.length === incoming.length && digest === incoming;
}
