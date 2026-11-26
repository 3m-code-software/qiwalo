/** فحص قراءة فقط: هل في أرقام تليفون مكررة في جدول User؟ ما بيعدّل أي حاجة. */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const rows = await prisma.$queryRaw`
    SELECT phone, COUNT(*)::int AS n
    FROM "User"
    WHERE phone IS NOT NULL AND phone <> ''
    GROUP BY phone
    HAVING COUNT(*) > 1
    ORDER BY n DESC
  `;
  const total = await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM "User" WHERE phone IS NOT NULL AND phone <> ''`;
  const empty = await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM "User" WHERE phone = ''`;
  const normalized = await prisma.$queryRaw`
    SELECT normalized, COUNT(*)::int AS n
    FROM (
      SELECT CASE WHEN length(digits) = 12 AND digits LIKE '20%'
        THEN '0' || substring(digits from 3) ELSE digits END AS normalized
      FROM (SELECT regexp_replace(phone, '\D', '', 'g') AS digits FROM "User"
            WHERE phone IS NOT NULL AND phone <> '') AS d
    ) AS n
    GROUP BY normalized HAVING COUNT(*) > 1
  `;
  console.log(JSON.stringify({
    usersWithPhone: total[0]?.n ?? 0,
    emptyPhones: empty[0]?.n ?? 0,
    duplicateGroups: rows.length,
    duplicateUsers: rows.reduce((sum, row) => sum + (row.n ?? 0), 0),
    normalizedDuplicateGroups: normalized.length,
    normalizedMasked: normalized.map((row) => ({
      phone: `${String(row.normalized).slice(0, 4)}****${String(row.normalized).slice(-2)}`,
      count: row.n,
    })),
    masked: rows.map((row) => ({
      phone: `${String(row.phone).slice(0, 4)}****${String(row.phone).slice(-2)}`,
      count: row.n,
    })),
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
