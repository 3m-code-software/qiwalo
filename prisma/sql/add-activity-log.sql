-- قيوالو — سجل عمليات الأدمن (البند ١٥)
-- نفّذ مرة واحدة في Supabase SQL Editor قبل نشر النسخة التي تعرض السجل.
-- لا يوجد أي تغيير تلقائي على قاعدة البيانات الإنتاجية من داخل الكود.

CREATE TABLE IF NOT EXISTS "ActivityLog" (
  "id"         TEXT        NOT NULL PRIMARY KEY,
  "actorEmail" TEXT        NOT NULL,
  "actorName"  TEXT        NOT NULL,
  "action"     TEXT        NOT NULL,
  "target"     TEXT        NOT NULL,
  "detail"     TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt" DESC);

-- للتحقق بعد التنفيذ:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'ActivityLog' ORDER BY ordinal_position;
