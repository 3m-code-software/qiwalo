import { LEGAL_VERSION_DATE, LEGAL_VERSION_DATE_AR } from "@/lib/constants";

/**
 * شارة المستند القانوني المعتمد + تاريخ آخر تحديث.
 * مكوّن خادم بسيط: لا يوجد جديد وقت التصيير، حتى يظل متوافقاً مع cacheComponents.
 */
export default function LegalStamp() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="chip chip-gold">نسخة معتمدة</span>
      <span
        className="text-[0.72rem] font-bold text-muted"
        title={`آخر تحديث: ${LEGAL_VERSION_DATE}`}
      >
        آخر تحديث: {LEGAL_VERSION_DATE_AR}
      </span>
    </div>
  );
}
