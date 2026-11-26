/**
 * حلّ تكرار رقم واحد بعد قرار إداري صريح: حساب واحد يحتفظ بالرقم، والباقي يتشال منه الرقم فقط.
 * لا يحذف أي حساب أو حجز. بعدين ينفّذ prisma/sql/add-unique-phone.sql.
 * التشغيل: node --env-file=.env.local scripts/resolve-phone-duplicates.mjs
 */
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const PHONE = "01066094050";
const KEEP_EMAIL = "dev-mustafa-hussin@hotmail.com";
const CLEAR_EMAILS = ["live-qa@qiwalo.test", "dilmando@gmail.com"];

const prisma = new PrismaClient();
try {
  const before = await prisma.user.findMany({ where: { phone: PHONE }, select: { email: true } });
  if (!before.some((row) => row.email === KEEP_EMAIL)) {
    console.error("الحساب المقرر الاحتفاظ بالرقم غير موجود — توقف بدون أي تعديل.");
    process.exit(1);
  }
  console.log(`قبل: ${before.length} حسابات بنفس الرقم`);

  for (const email of CLEAR_EMAILS) {
    const result = await prisma.user.updateMany({ where: { email, phone: PHONE }, data: { phone: null } });
    console.log(`${email}: اتمسح الرقم من ${result.count} حساب`);
  }

  const remaining = await prisma.user.findMany({ where: { phone: PHONE }, select: { email: true } });
  if (remaining.length !== 1 || remaining[0].email !== KEEP_EMAIL) {
    console.error("النتيجة مش زي المتوقع — توقف قبل إنشاء القيد.");
    process.exit(1);
  }

  const sql = (await readFile("prisma/sql/add-unique-phone.sql", "utf8"))
    .replace(/^\s*--.*$/gm, "");
  for (const statement of sql.split(";").map((part) => part.trim()).filter(Boolean)) {
    await prisma.$executeRawUnsafe(statement);
  }
  console.log(`بعد: حساب واحد فقط يحتفظ بالرقم (${KEEP_EMAIL})`);
  console.log("تم إنشاء User_phone_key بنجاح.");
} finally {
  await prisma.$disconnect();
}
