-- قيوالو — رد المالك على تقييمات الضيوف (البند ٩)
-- نفّذ مرة واحدة في Supabase SQL Editor قبل نشر النسخة التي تعرض الردود.
-- لا يوجد أي تغيير تلقائي على قاعدة البيانات الإنتاجية من داخل الكود.

ALTER TABLE "Review"
  ADD COLUMN IF NOT EXISTS "ownerReply" TEXT,
  ADD COLUMN IF NOT EXISTS "ownerReplyAt" TIMESTAMP(3);

-- للتحقق بعد التنفيذ:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'Review' AND column_name IN ('ownerReply', 'ownerReplyAt');
