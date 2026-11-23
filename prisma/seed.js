/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const users = [
  { id: "guest@qiwalo.test", email: "guest@qiwalo.test", name: "أحمد المسافر", role: "GUEST" },
  { id: "owner@qiwalo.test", email: "owner@qiwalo.test", name: "محمد مالك", role: "OWNER" },
  { id: "admin@qiwalo.test", email: "admin@qiwalo.test", name: "إدارة قيوالو", role: "ADMIN" },
];

const ownerId = "owner@qiwalo.test";
const guestId = "guest@qiwalo.test";

const properties = [
  {
    id: "p1", slug: "nile-view-dar-al-madina",
    name: "دار المدينة بإطلالة على النيل", type: "APARTMENT", city: "LUXOR",
    address: "شارع الكورنيش، الأقصر الشرقية",
    description: "شقة مريحة ومفروشة بالكامل في قلب الأقصر، دقائق من الكرنك ووادي الملوك، مع تراس بإطلالة مباشرة على النيل.",
    lat: 25.6872, lng: 32.6396,
    images: [img("photo-1566073771259-6a8506099945"), img("photo-1571896349842-33c89424de2d"), img("photo-1590490360182-c33d57733427")],
    videoUrl: null, amenities: ["واي فاي", "مكيف", "مطبخ", "تراس", "إطلالة على النيل", "موقف سيارة"],
    maxGuests: 5, bedrooms: 2, basePrice: 1450, cancelPolicy: "FREE_48H", status: "PUBLISHED", rating: 4.8, reviewCount: 34,
  },
  {
    id: "p2", slug: "aswan-nubian-house",
    name: "بيت نوبى على ضفاف النيل", type: "GUEST_HOUSE", city: "ASWAN",
    address: "قرية النوبة، غرب النيل",
    description: "بيت ضيافة نوبى بألوانه التقليدية وإطلالته على النيل، مع إفطار نوبى وجولات بصحبة مرشد محلى.",
    lat: 24.0889, lng: 32.8998,
    images: [img("photo-1582719478250-c89cae4dc85b"), img("photo-1564501049412-61c2a3083791"), img("photo-1542314831-068cd1dbfeeb")],
    videoUrl: null, amenities: ["واي فاي", "مكيف", "إفطار", "إطلالة على النيل", "جولات سياحية", "تراس"],
    maxGuests: 4, bedrooms: 2, basePrice: 1200, cancelPolicy: "FREE_7D", status: "PUBLISHED", rating: 4.9, reviewCount: 58,
  },
  {
    id: "p3", slug: "luxor-west-bank-villa",
    name: "فيلا الضفة الغربية مع مسبح", type: "VILLA", city: "LUXOR",
    address: "الضفة الغربية، قرب مقبرة منحن",
    description: "فيلا مستقلة بمسبح خاص وحديقة، مثالية للعائلات التي تبحث عن الخصوصية بعد يوم من الزيارات الأثرية.",
    lat: 25.7402, lng: 32.6015,
    images: [img("photo-1520250497591-112f2f40a3f4"), img("photo-1551882547-ff40c63fe5fa"), img("photo-1445019980597-93fa8acb246c")],
    videoUrl: null, amenities: ["واي فاي", "مكيف", "مسبح", "مطبخ", "موقف سيارة", "تراس"],
    maxGuests: 8, bedrooms: 4, basePrice: 2600, cancelPolicy: "FREE_7D", status: "PUBLISHED", rating: 4.7, reviewCount: 21,
  },
  {
    id: "p4", slug: "aswan-city-center-apartment",
    name: "شقة وسط مدينة أسوان", type: "APARTMENT", city: "ASWAN",
    address: "شارع الصداقة، وسط المدينة",
    description: "شقة عملية قرب محطة القطار والسوق، مناسبة لرجال الأعمال والمسافرين المستقلين.",
    lat: 24.0889, lng: 32.8998,
    images: [img("photo-1590490360182-c33d57733427"), img("photo-1566073771259-6a8506099945")],
    videoUrl: null, amenities: ["واي فاي", "مكيف", "مطبخ", "استقبال 24 ساعة"],
    maxGuests: 3, bedrooms: 1, basePrice: 850, cancelPolicy: "FREE_48H", status: "PUBLISHED", rating: 4.5, reviewCount: 16,
  },
  {
    id: "p5", slug: "nile-cruise-luxor-aswan",
    name: "رحلة نيلية الأقصر – أسوان", type: "NILE_CRUISE", city: "LUXOR",
    address: "ميناء الأقصر السياحي",
    description: "إقامة على متن مركب نيلي مع وجبات وبرنامج زيارات يومي بين الأقصر وأسوان، يشمل وادي الملوك وخزان أسوان.",
    lat: 25.685, lng: 32.64,
    images: [img("photo-1533105079780-92b9be482077"), img("photo-1572252009286-268acec5ca0a")],
    videoUrl: null, amenities: ["واي فاي", "مكيف", "إفطار", "جولات سياحية", "استقبال 24 ساعة"],
    maxGuests: 2, bedrooms: 1, basePrice: 3400, cancelPolicy: "FREE_7D", status: "PUBLISHED", rating: 4.6, reviewCount: 42,
  },
  {
    id: "p6", slug: "luxor-family-hotel",
    name: "فندق العائلة للأقصر", type: "HOTEL", city: "LUXOR",
    address: "ميدان المحطة، الأقصر",
    description: "فندق عائلي بغرف واسعة واستقبال على مدار الساعة، خطوة من محطة القطار.",
    lat: 25.6886, lng: 32.6387,
    images: [img("photo-1564501049412-61c2a3083791"), img("photo-1582719478250-c89cae4dc85b")],
    videoUrl: null, amenities: ["واي فاي", "مكيف", "استقبال 24 ساعة", "موقف سيارة"],
    maxGuests: 4, bedrooms: 2, basePrice: 1100, cancelPolicy: "FREE_48H", status: "PUBLISHED", rating: 4.3, reviewCount: 67,
  },
  {
    id: "p7", slug: "aswan-chalet-dam-view",
    name: "شاليه إطلالة الخزان", type: "CHALET", city: "ASWAN",
    address: "طريق الخزان، أسوان",
    description: "شاليه هادئ بإطلالة بانورامية على خزان أسوان مع تراس واسع.",
    lat: 24.13, lng: 32.88,
    images: [img("photo-1542314831-068cd1dbfeeb")],
    videoUrl: null, amenities: ["واي فاي", "مكيف", "تراس", "مطبخ", "موقف سيارة"],
    maxGuests: 6, bedrooms: 3, basePrice: 1600, cancelPolicy: "FREE_48H", status: "PENDING", rating: 0, reviewCount: 0,
  },
  {
    id: "p8", slug: "aswan-nile-loft",
    name: "دور علوي بإطلالة على النيل", type: "APARTMENT", city: "ASWAN",
    address: "كورنيش النيل، أسوان",
    description: "وحدة علوية حديثة بإطلالة مفتوحة على النيل، مناسبة لزوجين.",
    lat: 24.0842, lng: 32.8945,
    images: [img("photo-1571896349842-33c89424de2d")],
    videoUrl: null, amenities: ["واي فاي", "مكيف", "مطبخ", "إطلالة على النيل", "تراس"],
    maxGuests: 2, bedrooms: 1, basePrice: 980, cancelPolicy: "FREE_48H", status: "DRAFT", rating: 0, reviewCount: 0,
  },
];

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

// Prisma DateTime columns require a full ISO-8601 timestamp, not a bare date.
function dbDate(date) {
  return new Date(`${isoDate(date)}T00:00:00.000Z`);
}

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function buildAvailability() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const rows = [];

  for (const property of properties) {
    const seed = Number(property.id.slice(1));
    for (let day = 0; day < 180; day += 1) {
      rows.push({
        propertyId: property.id,
        date: dbDate(addDays(today, day)),
        isBlocked: (day + seed) % 19 === 0 || day % 31 === 0,
        priceOverride: day % 41 === 0 ? 1000 + seed * 50 : null,
      });
    }
  }
  return rows;
}

function buildPriceRules() {
  const year = new Date().getUTCFullYear();
  const rows = [];

  for (const property of properties) {
    for (const y of [year, year + 1]) {
      const rules = [
        { key: "oct", name: "موسم أكتوبر", startDate: `${y}-10-01`, endDate: `${y}-10-31`, price: Math.round(property.basePrice * 1.15), minNights: 2 },
        { key: "winter", name: "موسم الشتاء", startDate: `${y}-11-01`, endDate: `${y + 1}-03-31`, price: Math.round(property.basePrice * 1.25), minNights: 2 },
        { key: "spring", name: "الربيع", startDate: `${y}-04-01`, endDate: `${y}-06-15`, price: Math.round(property.basePrice * 1.05), minNights: 1 },
        { key: "summer", name: "الصيف", startDate: `${y}-06-16`, endDate: `${y}-09-30`, price: Math.round(property.basePrice * 0.8), minNights: 1 },
      ];
      for (const rule of rules) {
        rows.push({
          id: `${property.id}-${y}-${rule.key}`,
          propertyId: property.id,
          name: rule.name,
          startDate: new Date(`${rule.startDate}T00:00:00.000Z`),
          endDate: new Date(`${rule.endDate}T00:00:00.000Z`),
          price: rule.price,
          minNights: rule.minNights,
        });
      }
    }
  }
  return rows;
}

function buildBookings() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const seeds = [
    { reference: "QW-SEED-1", propertyId: "p1", guestName: "سارة مسافر", startDays: 12, nights: 3, status: "CONFIRMED", paymentStatus: "PAID" },
    { reference: "QW-SEED-2", propertyId: "p2", guestName: "منى عبد العزيز", startDays: 26, nights: 4, status: "CONFIRMED", paymentStatus: "PAID" },
    { reference: "QW-SEED-3", propertyId: "p3", guestName: "خالد حجز", startDays: -8, nights: 2, status: "COMPLETED", paymentStatus: "PAID" },
  ];

  return seeds.map((seed, index) => {
    const property = properties.find((p) => p.id === seed.propertyId);
    const subtotal = property.basePrice * seed.nights;
    return {
      id: `b${index + 1}`,
      reference: seed.reference,
      propertyId: seed.propertyId,
      guestId,
      guestName: seed.guestName,
      checkIn: dbDate(addDays(today, seed.startDays)),
      checkOut: dbDate(addDays(today, seed.startDays + seed.nights)),
      nights: seed.nights,
      guests: 2,
      subtotal,
      serviceFee: 0,
      commission: Math.round(subtotal * 0.12),
      total: subtotal,
      status: seed.status,
      paymentStatus: seed.paymentStatus,
      provider: "PAYMOB",
      createdAt: new Date(),
    };
  });
}

async function main() {
  console.log("Seeding Qiwalo demo data...");

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role },
      create: user,
    });
  }

  for (const property of properties) {
    const { ownerName, ...data } = property;
    void ownerName;
    await prisma.property.upsert({
      where: { id: property.id },
      update: data,
      create: { ...data, ownerId },
    });
  }

  const seededIds = properties.map((p) => p.id);
  await prisma.availability.deleteMany({ where: { propertyId: { in: seededIds } } });
  await prisma.availability.createMany({ data: buildAvailability() });

  await prisma.priceRule.deleteMany({ where: { propertyId: { in: seededIds } } });
  await prisma.priceRule.createMany({ data: buildPriceRules() });

  const bookings = buildBookings();
  for (const booking of bookings) {
    const { guestName, ...data } = booking;
    void guestName;
    await prisma.booking.upsert({
      where: { reference: booking.reference },
      update: data,
      create: data,
    });
  }

  console.log("Seed complete:");
  console.log(`  users:      ${users.length}`);
  console.log(`  properties: ${properties.length}`);
  console.log(`  bookings:   ${bookings.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
