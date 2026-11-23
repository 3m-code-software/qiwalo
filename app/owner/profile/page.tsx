import Link from "next/link";
import SelfieForm from "@/components/SelfieForm";
import VerificationForm from "@/components/VerificationForm";
import { requireRole } from "@/lib/auth";
import { DEFAULT_COMMISSION_RATE } from "@/lib/constants";
import { toArabicDigits } from "@/lib/format";
import { getRepo } from "@/lib/repo";

export const instant = false;

const statusLabel: Record<string, string> = {
  PENDING: "قيد المراجعة",
  SELFIE_REQUIRED: "مطلوب صورة شخصية (سيلفي)",
  SELFIE_PENDING: "الصورة الشخصية قيد المراجعة",
  APPROVED: "موثّق ✓",
  REJECTED: "مرفوض",
};

function ageFromBirthDate(value: string | null): number | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const birth = new Date(Date.UTC(year, month - 1, day));
  if (
    birth.getUTCFullYear() !== year ||
    birth.getUTCMonth() !== month - 1 ||
    birth.getUTCDate() !== day
  ) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - year;
  const currentMonth = now.getUTCMonth() + 1;
  if (currentMonth < month || (currentMonth === month && now.getUTCDate() < day)) age -= 1;
  return age;
}

function formatTimestamp(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function DocumentThumb({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={href} alt={label} className="h-24 w-32 rounded-lg border border-line object-cover" />
      <span className="text-xs font-bold text-nile">{label} ↗</span>
    </a>
  );
}

export default async function OwnerProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireRole("OWNER");
  const sp = await searchParams;
  const notice = Array.isArray(sp.verified) ? sp.verified[0] : sp.verified;
  const selfieNotice = Array.isArray(sp.selfie) ? sp.selfie[0] : sp.selfie;
  const repo = await getRepo();
  const [user, verification] = await Promise.all([
    repo.getUserByEmail(session.email),
    repo.getVerification(session.email),
  ]);
  const age = ageFromBirthDate(verification?.birthDate ?? null);
  const commissionRate = verification?.commissionRate ?? user?.commissionRate ?? DEFAULT_COMMISSION_RATE;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/owner" className="text-sm font-bold text-nile">← رجوع للوحة المالك</Link>
          <h1 className="mt-3 text-3xl font-black">الملف الشخصي والتحقق</h1>
          <p className="muted mt-1 text-sm">بياناتك ومستندات التحقق التي تراجعها الإدارة.</p>
        </div>
        <Link href="/owner/calendar" className="btn-ghost !py-2 text-sm">تقويم التواريخ والأسعار</Link>
      </div>

      {notice === "1" && (
        <p className="mb-5 rounded-xl bg-navy-soft p-4 text-sm font-bold text-navy">✅ تم إرسال بيانات التحقق للمراجعة.</p>
      )}
      {selfieNotice === "1" && (
        <p className="mb-5 rounded-xl bg-navy-soft p-4 text-sm font-bold text-navy">✅ تم إرسال الصورة الشخصية للمراجعة.</p>
      )}

      <section className="soft-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="chip">بيانات الحساب</span>
            <h2 className="mt-3 text-xl font-extrabold text-navy">{user?.name ?? session.name}</h2>
            <p dir="ltr" className="muted mt-1 text-sm">{session.email}</p>
          </div>
          <span className={`chip ${verification?.status === "APPROVED" ? "bg-navy-soft text-navy" : "chip-gold"}`}>
            {verification ? (statusLabel[verification.status] ?? verification.status) : "غير موثّق"}
          </span>
        </div>
        <dl className="mt-6 grid gap-4 border-t border-line pt-5 text-sm sm:grid-cols-2">
          <div><dt className="muted text-xs">الهاتف المسجّل</dt><dd dir="ltr" className="font-bold">{user?.phone ?? "—"}</dd></div>
          <div><dt className="muted text-xs">الجنسية المسجّلة</dt><dd className="font-bold">{user?.nationality ?? "—"}</dd></div>
          <div><dt className="muted text-xs">نسبة العمولة</dt><dd className="font-bold text-navy">{commissionRate}%</dd></div>
          <div><dt className="muted text-xs">موافقة على شروط الحساب</dt><dd className="font-bold">{formatTimestamp(user?.termsAcceptedAt ?? null)}</dd></div>
        </dl>
      </section>

      {verification && (
        <section className="soft-card mt-6">
          <h2 className="mb-5 text-xl font-extrabold text-navy">بيانات التحقق</h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="muted text-xs">هاتف بديل</dt><dd dir="ltr" className="font-bold">{verification.phoneAlt ?? "—"}</dd></div>
            <div><dt className="muted text-xs">الجنسية</dt><dd className="font-bold">{verification.nationality ?? "—"}</dd></div>
            <div>
              <dt className="muted text-xs">تاريخ الميلاد والعمر</dt>
              <dd className="font-bold">
                {verification.birthDate ? verification.birthDate : "—"}
                {age !== null && <span className="mr-2">({toArabicDigits(age)} سنة)</span>}
              </dd>
            </div>
            <div><dt className="muted text-xs">الحالة</dt><dd className="font-bold">{statusLabel[verification.status] ?? verification.status}</dd></div>
            <div><dt className="muted text-xs">العمولة المتفق عليها</dt><dd className="font-bold">{verification.commissionRate}%</dd></div>
            <div><dt className="muted text-xs">تاريخ الإرسال</dt><dd className="font-bold">{formatTimestamp(verification.submittedAt)}</dd></div>
            <div><dt className="muted text-xs">آخر مراجعة</dt><dd className="font-bold">{formatTimestamp(verification.reviewedAt)}</dd></div>
            <div><dt className="muted text-xs">قبول شروط المالك</dt><dd className="font-bold">{formatTimestamp(verification.termsAcceptedAt)}</dd></div>
            <div className="sm:col-span-2">
              <dt className="muted text-xs">ملاحظة الإدارة</dt>
              <dd className="font-bold">{verification.note ?? "لا توجد ملاحظات."}</dd>
            </div>
          </dl>

          <div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
            <DocumentThumb href={verification.idFront} label="وجه البطاقة" />
            <DocumentThumb href={verification.idBack} label="ظهر البطاقة" />
            {verification.selfie
              ? <DocumentThumb href={verification.selfie} label="الصورة الشخصية" />
              : <p className="muted text-xs">لم يتم رفع الصورة الشخصية بعد.</p>}
          </div>
        </section>
      )}

      <section className="soft-card mt-6">
        <h2 className="mb-4 text-xl font-extrabold text-navy">إكمال التحقق</h2>
        {(!verification || verification.status === "PENDING" || verification.status === "REJECTED") && (
          <>
            {verification?.status === "REJECTED" && verification.note && (
              <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                سبب الرفض: {verification.note}
              </p>
            )}
            {verification?.status === "PENDING" && (
              <p className="mb-4 rounded-xl bg-gold-soft p-3 text-sm font-bold text-navy">
                المستندات قيد المراجعة. تقدر تعديل البيانات وإعادة الإرسال إذا لزم الأمر.
              </p>
            )}
            <VerificationForm
              defaults={verification ? {
                phoneAlt: verification.phoneAlt,
                nationality: verification.nationality,
                birthDate: verification.birthDate,
                idFront: verification.idFront,
                idBack: verification.idBack,
                commissionRate: verification.commissionRate,
              } : undefined}
            />
          </>
        )}
        {verification?.status === "SELFIE_REQUIRED" && <SelfieForm defaultUrl={verification.selfie} />}
        {(verification?.status === "SELFIE_PENDING" || verification?.status === "APPROVED") && (
          <p className="rounded-xl bg-navy-soft p-4 text-sm leading-7 text-navy">
            {verification?.status === "SELFIE_PENDING"
              ? "الصورة الشخصية قيد المراجعة. لا يلزم أي إجراء منك حالياً."
              : "تم توثيق حسابك بالكامل. يمكنك إدارة وحداتك وحجوزاتك بشكل طبيعي."}
          </p>
        )}
        <p className="muted mt-5 text-xs">
          بالتقديم أنت توافق على <Link href="/terms/owner" target="_blank" className="font-bold text-nile underline">شروط المالك</Link>.
        </p>
      </section>
    </div>
  );
}
