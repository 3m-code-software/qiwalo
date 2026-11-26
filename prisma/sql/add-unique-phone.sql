-- رقم التليفون يخص حساب واحد فقط.
-- فحص قراءة-only (scripts/check-duplicate-phones.mjs) أكّد: لا تكرارات ولا قيم فارغة قبل التنفيذ.
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
