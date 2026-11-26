/**
 * قراءة فقط: فحص جاهزية قاعدة بيانات الإنتاج قبل تنفيذ أي ملف SQL.
 * التشغيل: node --env-file=.env.local scripts/preflight.mjs
 * لا يطبع أي قيمة سرية أو رابط اتصال، ولا ينفّذ أي تعديل.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const q = (sql) => prisma.$queryRawUnsafe(sql);

const bool = (value) => Boolean(value);

try {
  const tables = await q(`
    SELECT table_name AS name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN
      ('User','Property','Experience','Transport','Package','DriverProfile','Vehicle','Booking')
    ORDER BY table_name
  `);
  const existing = new Set(tables.map((row) => row.name));
  console.log("\n== الجداول ==");
  for (const name of ["User", "Property", "Experience", "Transport", "Package", "DriverProfile", "Vehicle", "Booking"]) {
    console.log(`${name}: ${existing.has(name) ? "موجود" : "مفقود"}`);
  }

  console.log("\n== الأعمدة المطلوبة ==");
  const wanted = {
    Experience: ["category", "difficulty", "status", "commissionRate"],
    Transport: ["type", "status", "commissionRate"],
    Package: ["propertyId", "experienceId", "transportId", "pricePerNight", "capacity"],
    Vehicle: ["driverId", "capacity", "pricePerTrip", "blockedDates", "isPaused", "status"],
    DriverProfile: ["subscriptionStatus", "verificationStatus"],
    Booking: ["experience", "transport", "packageDetail"],
  };
  for (const [table, columns] of Object.entries(wanted)) {
    if (!existing.has(table)) {
      console.log(`${table}: الجدول مفقود → كل الأعمدة مفقودة`);
      continue;
    }
    const rows = await q(`
      SELECT column_name AS name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${table}'
    `);
    const found = new Set(rows.map((row) => row.name));
    for (const column of columns) {
      console.log(`${table}.${column}: ${found.has(column) ? "موجود" : "مفقود"}`);
    }
  }

  console.log("\n== الأنواع والقيم ==");
  const types = await q(`
    SELECT typname AS name FROM pg_type
    WHERE typname IN ('Role','DriverSubscriptionStatus','TransportType','ExperienceCategory','ExperienceDifficulty','City','ModerationStatus')
    ORDER BY typname
  `);
  const foundTypes = new Set(types.map((row) => row.name));
  for (const name of ["Role", "DriverSubscriptionStatus", "TransportType", "ExperienceCategory", "ExperienceDifficulty", "City", "ModerationStatus"]) {
    console.log(`${name}: ${foundTypes.has(name) ? "موجود" : "مفقود"}`);
  }
  if (foundTypes.has("Role")) {
    const labels = await q(`SELECT enumlabel AS label FROM pg_enum WHERE enumtypid = 'public."Role"'::regtype`);
    console.log(`Role.DRIVER: ${bool(labels.some((row) => row.label === "DRIVER")) ? "موجود" : "مفقود"}`);
  }
  const crypto = await q(`SELECT extname AS name FROM pg_extension WHERE extname = 'pgcrypto'`);
  console.log(`pgcrypto (gen_random_uuid): ${bool(crypto.length) ? "مفعّل" : "غير مفعّل"}`);
  const index = await q(`SELECT indexname AS name FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'User' AND indexname = 'User_phone_key'`);
  console.log(`User_phone_key (رقم واحد لحساب واحد): ${bool(index.length) ? "موجود" : "مفقود"}`);

  console.log("\n== عدد الصفوف ==");
  for (const table of ["User", "Property", "Experience", "Transport", "Package", "DriverProfile", "Vehicle", "Booking"]) {
    if (!existing.has(table)) continue;
    const rows = await q(`SELECT COUNT(*)::int AS total FROM public."${table}"`);
    console.log(`${table}: ${rows[0].total}`);
  }
  console.log("\nالفحص انتهى بدون أي تعديل.");
} catch (error) {
  console.error("فشل الفحص:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
