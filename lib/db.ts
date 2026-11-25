import { PrismaClient } from "@prisma/client";

/**
 * Supabase Session pooler على الخطة المجانية يسمح بـ ١٥ عميل بس في نفس الوقت.
 * Prisma بيفتح بال default عدة اتصالات لكل نسخة (CPU*2+1)، ومع دوال Vercel
 * المتوازية بيحصل FATAL EMAXCONNSESSION وتظهر شاشة الخطأ في الصفحات اللي بتقرأ DB.
 * نثبّت اتصال واحد لكل نسخة ونلغي الـ prepared statements على البولر، من غير ما
 * نلمس DATABASE_URL نفسه ولا نحط أي secret في الكود.
 */
function poolerSafeUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    if (!url.hostname.includes("pooler.supabase.com")) return raw;
    url.searchParams.set("pgbouncer", "true");
    url.searchParams.set("connection_limit", "1");
    // مهلة أطول عشان زخمة لحظية على نفس النسخة ما تتحولش لـ P2024 فوراً.
    url.searchParams.set("pool_timeout", "30");
    return url.toString();
  } catch {
    return raw;
  }
}

const datasourceUrl = poolerSafeUrl(process.env.DATABASE_URL);
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
