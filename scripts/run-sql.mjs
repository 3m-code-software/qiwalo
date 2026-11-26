/**
 * تشغيل ملفات SQL الإنتاجية على DATABASE_URL، statement ب statement، مع إيقاف فوري عند أول خطأ.
 * الاستخدام: node --env-file=.env.local scripts/run-sql.mjs [--dry]
 * --dry يطبع عدد الـ statements فقط من غير تنفيذ.
 */
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const files = [
  "prisma/sql/add-mountain-safari.sql",
  "prisma/sql/add-transport.sql",
  "prisma/sql/add-motorcycle-tour.sql",
  "prisma/sql/add-package.sql",
  "prisma/sql/add-driver.sql",
];

function statementsOf(sql) {
  const clean = sql.split(/\r?\n/).filter((line) => !line.trimStart().startsWith("--")).join("\n");
  const out = [];
  let current = "";
  let inDollar = false;
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (ch === "$" && clean[i + 1] === "$") {
      inDollar = !inDollar;
      current += "$$";
      i += 1;
      continue;
    }
    if (ch === ";" && !inDollar) {
      if (current.trim()) out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

const dry = process.argv.includes("--dry");
const prisma = new PrismaClient();
try {
  for (const file of files) {
    const statements = statementsOf(await readFile(file, "utf8"));
    console.log(`\n${file}: ${statements.length} statements`);
    if (dry) continue;
    for (let i = 0; i < statements.length; i += 1) {
      try {
        await prisma.$executeRawUnsafe(statements[i]);
        console.log(`  ✓ ${i + 1}/${statements.length}`);
      } catch (error) {
        console.error(`  ✗ ${i + 1}/${statements.length}: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    }
  }
  console.log("\nكل الملفات اتنفّذت.");
} finally {
  await prisma.$disconnect();
}
