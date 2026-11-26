/** فحص قراءة فقط: أصحاب الأرقام المكررة (الإيميلات وتاريخ الإنشاء وعدد الحجوزات فقط). */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const rows = await prisma.$queryRaw`
    SELECT u.email, u.role, u."createdAt", COUNT(b.id)::int AS bookings
    FROM "User" u LEFT JOIN "Booking" b ON b."guestId" = u.email
    WHERE u.phone = '01066094050'
    GROUP BY u.email, u.role, u."createdAt"
    ORDER BY u."createdAt" ASC
  `;
  console.log(JSON.stringify(rows, null, 2));
} finally {
  await prisma.$disconnect();
}
