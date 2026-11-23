/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=82`;

const photoPool = [
  "photo-1566073771259-6a8506099945",
  "photo-1571896349842-33c89424de2d",
  "photo-1590490360182-c33d57733427",
  "photo-1582719478250-c89cae4dc85b",
  "photo-1564501049412-61c2a3083791",
  "photo-1542314831-068cd1dbfeeb",
  "photo-1520250497591-112f2f40a3f4",
  "photo-1551882547-ff40c63fe5fa",
  "photo-1445019980597-93fa8acb246c",
  "photo-1533105079780-92b9be482077",
  "photo-1572252009286-268acec5ca0a",
  "photo-1611892440504-42a792e24d32",
  "photo-1560448204-e02f11c3d0e2",
  "photo-1600585154340-be6161a56a0c",
  "photo-1600607687939-ce8a6c25118c",
  "photo-1595576508898-0ad5c879a061",
  "photo-1522708323590-d24dbb6b0267",
  "photo-1505693416388-ac5ce068fe85",
];

const ownerNames = [
  "سارة العتيبي", "محمود عبد الحميد", "ليلى حسن", "كريم فتحي", "نورة القحطاني",
  "أحمد الشريف", "مريم صالح", "يوسف النجار", "هند السالم", "عمر بدر",
];

const guestNames = ["سارة مسافر", "خالد العتيبي", "منى عبد العزيز", "عبدالله سالم", "ريم حسن", "محمد رシュد"];

const units = [
  { slug: "demo-01-luxor-nile-terrace", name: "تراس النيل — شقة مضيئة في الأقصر", city: "LUXOR", type: "APARTMENT", price: 1350, beds: 2, baths: 2, area: 105, guests: 5, rating: 4.8, reviews: 31, policy: "FREE_48H", highlight: "تراس واسع بإطلالة مباشرة على النيل ودقائق قليلة من الكرنك" },
  { slug: "demo-02-luxor-westbank-garden", name: "بيت الحديقة على الضفة الغربية", city: "LUXOR", type: "GUEST_HOUSE", price: 1180, beds: 2, baths: 2, area: 120, guests: 4, rating: 4.7, reviews: 19, policy: "FREE_7D", highlight: "حديقة خاصة وظل واسع بعد زيارة وادي الملوك" },
  { slug: "demo-03-luxor-family-villa", name: "فيلا النخيل للعائلات", city: "LUXOR", type: "VILLA", price: 2350, beds: 4, baths: 3, area: 260, guests: 9, rating: 4.9, reviews: 44, policy: "FREE_7D", highlight: "مسبح خاص وحديقة نخيل مع مساحة كافية لعائلتين" },
  { slug: "demo-04-luxor-site-cycle", name: "شقة الدورة السياحية", city: "LUXOR", type: "APARTMENT", price: 980, beds: 1, baths: 1, area: 68, guests: 3, rating: 4.4, reviews: 12, policy: "FREE_48H", highlight: "موقع حيوي قرب المطاعم ومحطة القطار" },
  { slug: "demo-05-luxor-rooftop-suite", name: "جناح السطح بإطلالة المعابد", city: "LUXOR", type: "APARTMENT", price: 1780, beds: 2, baths: 2, area: 130, guests: 4, rating: 4.8, reviews: 27, policy: "FREE_48H", highlight: "سطح خاص يطل على أضواء الأقصر ليلاً" },
  { slug: "demo-06-luxor-boutique-room", name: "غرفة بوتيك في قلب المدينة", city: "LUXOR", type: "HOTEL", price: 760, beds: 1, baths: 1, area: 38, guests: 2, rating: 4.3, reviews: 16, policy: "NON_REFUNDABLE", highlight: "تصميم مختصر وأنيق مع استقبال على مدار الساعة" },
  { slug: "demo-07-luxor-nile-cruise-deluxe", name: "مركب النيل — كابينة ديلوكس", city: "LUXOR", type: "NILE_CRUISE", price: 3200, beds: 1, baths: 1, area: 42, guests: 2, rating: 4.7, reviews: 38, policy: "FREE_7D", highlight: "إقامة على متن مركب مع وجبات وبرنامج زيارات يومي" },
  { slug: "demo-08-luxor-courtyard-house", name: "بيت الفناء الأقصري", city: "LUXOR", type: "GUEST_HOUSE", price: 1420, beds: 3, baths: 2, area: 175, guests: 6, rating: 4.6, reviews: 23, policy: "FREE_48H", highlight: "فناء داخلي هادئ يجمع بين الطراز القديم والراحة الحديثة" },
  { slug: "demo-09-luxor-pool-loft", name: "دور علوي بمسبح مشترك", city: "LUXOR", type: "APARTMENT", price: 1250, beds: 1, baths: 1, area: 82, guests: 3, rating: 4.5, reviews: 14, policy: "FREE_48H", highlight: "مسبح مشترك هادئ ومطبخ مجهز بالكامل" },
  { slug: "demo-10-luxor-karnak-view", name: "شقة إطلالة الكرنك", city: "LUXOR", type: "APARTMENT", price: 1540, beds: 2, baths: 2, area: 112, guests: 4, rating: 4.7, reviews: 29, policy: "FREE_7D", highlight: "نوافذ مطلة على معبد الكرنك ومشى دقائق للوصول إليه" },
  { slug: "demo-11-luxor-family-suite", name: "جناح العائلة الشرقية", city: "LUXOR", type: "HOTEL", price: 1620, beds: 3, baths: 2, area: 145, guests: 6, rating: 4.5, reviews: 35, policy: "FREE_48H", highlight: "غرف متصلة مثالية للأسر مع وجبة إفطار يومية" },
  { slug: "demo-12-luxor-dates-chalet", name: "شاليه النخيل والظل", city: "LUXOR", type: "CHALET", price: 1100, beds: 2, baths: 1, area: 95, guests: 5, rating: 4.2, reviews: 8, policy: "FREE_48H", highlight: "ظل طبيعي ومساحة خارجية مناسبة للأطفال" },
  { slug: "demo-13-luxor-architect-loft", name: "لوفت معماري حديث", city: "LUXOR", type: "APARTMENT", price: 1980, beds: 2, baths: 2, area: 150, guests: 4, rating: 4.9, reviews: 52, policy: "FREE_7D", highlight: "تصميم داخلي بوتيكي وإضاءة طبيعية طوال اليوم" },
  { slug: "demo-14-luxor-nile-dock", name: "شقة بجانب ميناء النيل", city: "LUXOR", type: "APARTMENT", price: 890, beds: 1, baths: 1, area: 55, guests: 2, rating: 4.1, reviews: 11, policy: "NON_REFUNDABLE", highlight: "قريبة من ميناء الرحلات النيلية والمقاهي" },
  { slug: "demo-15-luxor-garden-flat", name: "شقة الحديقة الهادئة", city: "LUXOR", type: "APARTMENT", price: 1320, beds: 2, baths: 2, area: 118, guests: 5, rating: 4.6, reviews: 21, policy: "FREE_48H", highlight: "إطلالة خضراء وشقة بعيدة عن صوت الشارع" },
  { slug: "demo-16-luxor-royal-suite", name: "جناح الملكة نفرتيتي", city: "LUXOR", type: "HOTEL", price: 2450, beds: 3, baths: 3, area: 210, guests: 6, rating: 4.8, reviews: 47, policy: "FREE_7D", highlight: "جناح فاخر بغرفة معيشة منفصلة وخدمة استقبال مميزة" },
  { slug: "demo-17-luxor-mud-brick-house", name: "بيت الطين التقليدي", city: "LUXOR", type: "GUEST_HOUSE", price: 1050, beds: 2, baths: 1, area: 90, guests: 4, rating: 4.4, reviews: 18, policy: "FREE_48H", highlight: "تجربة إقامة في بيت تراثي مع لمسات عصرية" },
  { slug: "demo-18-luxor-sunset-villa", name: "فيلا غروب الضفة الغربية", city: "LUXOR", type: "VILLA", price: 2900, beds: 5, baths: 4, area: 310, guests: 11, rating: 4.9, reviews: 61, policy: "FREE_7D", highlight: "إطلالة غروب لا تُنسى ومسبح خاص كبير" },
  { slug: "demo-19-luxor-couple-nest", name: "عش الزوجين على النيل", city: "LUXOR", type: "APARTMENT", price: 1150, beds: 1, baths: 1, area: 60, guests: 2, rating: 4.7, reviews: 33, policy: "FREE_48H", highlight: "شقة هادئة لزوجين مع تراس صغير للإفطار" },
  { slug: "demo-20-luxor-tour-base", name: "قاعدة الجولات السياحية", city: "LUXOR", type: "GUEST_HOUSE", price: 940, beds: 2, baths: 2, area: 100, guests: 5, rating: 4.3, reviews: 15, policy: "NON_REFUNDABLE", highlight: "تنسيق جولات يومية إلى وادي الملوك والكرنك" },
  { slug: "demo-21-aswan-nubian-colour", name: "بيت النوبة الملون", city: "ASWAN", type: "GUEST_HOUSE", price: 1280, beds: 2, baths: 2, area: 110, guests: 5, rating: 4.8, reviews: 40, policy: "FREE_7D", highlight: "ألوان نوبية أصيلة وإطلالة على النيل من الشرفة" },
  { slug: "demo-22-aswan-dam-view-loft", name: "لوفت إطلالة الخزان", city: "ASWAN", type: "APARTMENT", price: 1450, beds: 2, baths: 2, area: 125, guests: 4, rating: 4.7, reviews: 26, policy: "FREE_48H", highlight: "إطلالة بانورامية على خزان أسوان" },
  { slug: "demo-23-aswan-filippa-island", name: "شقة جزيرة الفنتين", city: "ASWAN", type: "APARTMENT", price: 1180, beds: 2, baths: 1, area: 88, guests: 4, rating: 4.5, reviews: 17, policy: "FREE_48H", highlight: "خطوات من معبد إلفنتين والسوق المحلي" },
  { slug: "demo-24-aswan-nile-cruise", name: "مركب أسوان — كابينة بإطلالة", city: "ASWAN", type: "NILE_CRUISE", price: 3050, beds: 1, baths: 1, area: 45, guests: 2, rating: 4.6, reviews: 36, policy: "FREE_7D", highlight: "رحلة نيلية تشمل خزان أسوان وجزيرة فيلة" },
  { slug: "demo-25-aswan-city-flat", name: "شقة وسط أسوان", city: "ASWAN", type: "APARTMENT", price: 820, beds: 1, baths: 1, area: 62, guests: 3, rating: 4.2, reviews: 13, policy: "NON_REFUNDABLE", highlight: "قرب محطة القطار والأسواق، مناسبة للإقامة القصيرة" },
  { slug: "demo-26-aswan-family-villa", name: "فيلا العائلة في أسوان", city: "ASWAN", type: "VILLA", price: 2600, beds: 4, baths: 3, area: 240, guests: 10, rating: 4.8, reviews: 34, policy: "FREE_7D", highlight: "فيلا مستقلة بحديقة ومسبح خاص" },
  { slug: "demo-27-aswan-sunrise-room", name: "غرفة شروق النيل", city: "ASWAN", type: "HOTEL", price: 720, beds: 1, baths: 1, area: 40, guests: 2, rating: 4.3, reviews: 20, policy: "FREE_48H", highlight: "إطلالة شروق على النيل من النافذة" },
  { slug: "demo-28-aswan-nubian-courtyard", name: "فناء نوبى هادئ", city: "ASWAN", type: "GUEST_HOUSE", price: 1360, beds: 3, baths: 2, area: 160, guests: 7, rating: 4.7, reviews: 28, policy: "FREE_48H", highlight: "فناء واسع للجلوس مساءً مع إفطار نوبى" },
  { slug: "demo-29-aswan-dam-chalet", name: "شاليه الخزان بانوراما", city: "ASWAN", type: "CHALET", price: 1580, beds: 3, baths: 2, area: 135, guests: 6, rating: 4.6, reviews: 22, policy: "FREE_7D", highlight: "تراس كبير يطل على الخزان والمساء هادئ جداً" },
  { slug: "demo-30-aswan-corniche-loft", name: "دور علوي على الكورنيش", city: "ASWAN", type: "APARTMENT", price: 1120, beds: 2, baths: 2, area: 98, guests: 4, rating: 4.5, reviews: 24, policy: "FREE_48H", highlight: "مشي قصير إلى الكورنيش ومحلات القهوة" },
  { slug: "demo-31-aswan-temple-view", name: "شقة إطلالة معبد إيزيس", city: "ASWAN", type: "APARTMENT", price: 1520, beds: 2, baths: 2, area: 120, guests: 5, rating: 4.8, reviews: 39, policy: "FREE_7D", highlight: "قريبة من جزيرة فيلة ومشهد النيل" },
  { slug: "demo-32-aswan-cave-house", name: "بيت الصخرة الجرانيتي", city: "ASWAN", type: "GUEST_HOUSE", price: 990, beds: 1, baths: 1, area: 70, guests: 2, rating: 4.4, reviews: 14, policy: "NON_REFUNDABLE", highlight: "تجربة إقامة مميزة بين الصخور الجرانيتية" },
  { slug: "demo-33-aswan-sailors-house", name: "بيت الملاحين", city: "ASWAN", type: "GUEST_HOUSE", price: 1070, beds: 2, baths: 1, area: 85, guests: 4, rating: 4.3, reviews: 10, policy: "FREE_48H", highlight: "قريب من مرسى المراكب النيلية وجولات القوارب" },
  { slug: "demo-34-aswan-botanical-flat", name: "شقة الحديقة النباتية", city: "ASWAN", type: "APARTMENT", price: 1290, beds: 2, baths: 2, area: 108, guests: 5, rating: 4.6, reviews: 25, policy: "FREE_48H", highlight: "إطلالة خضراء قرب الحديقة النباتية" },
  { slug: "demo-35-aswan-honeymoon-suite", name: "جناح شهر العسل النيلي", city: "ASWAN", type: "HOTEL", price: 2180, beds: 1, baths: 1, area: 95, guests: 2, rating: 4.9, reviews: 48, policy: "FREE_7D", highlight: "جناح خاص بإطلالة النيل وزينة رومانسية" },
  { slug: "demo-36-aswan-dam-family-loft", name: "لوفت العائلة بإطلالة الخزان", city: "ASWAN", type: "APARTMENT", price: 1740, beds: 3, baths: 2, area: 155, guests: 7, rating: 4.7, reviews: 32, policy: "FREE_7D", highlight: "غرف متعددة ومطبخ كبير للعائلات" },
  { slug: "demo-37-aswan-market-apartment", name: "شقة السوق الشعبي", city: "ASWAN", type: "APARTMENT", price: 790, beds: 1, baths: 1, area: 52, guests: 2, rating: 4.1, reviews: 9, policy: "NON_REFUNDABLE", highlight: "في قلب السوق الشعبي لتجربة أسوان اليومية" },
  { slug: "demo-38-aswan-quiet-courtyard", name: "بيت الفناء الهادئ", city: "ASWAN", type: "GUEST_HOUSE", price: 1210, beds: 2, baths: 2, area: 105, guests: 4, rating: 4.5, reviews: 18, policy: "FREE_48H", highlight: "بعيد عن صوت الشارع مع فناء خاص للقراءة" },
  { slug: "demo-39-aswan-luxury-villa", name: "فيلا النخبة على النيل", city: "ASWAN", type: "VILLA", price: 3850, beds: 5, baths: 4, area: 340, guests: 12, rating: 4.9, reviews: 57, policy: "FREE_7D", highlight: "فيلا فاخرة بمسبح خاص وخدمة استقبال" },
  { slug: "demo-40-aswan-student-flat", name: "شقة الطلاب الاقتصادية", city: "ASWAN", type: "APARTMENT", price: 680, beds: 1, baths: 1, area: 48, guests: 2, rating: 4.0, reviews: 7, policy: "NON_REFUNDABLE", highlight: "إقامة اقتصادية نظيفة قرب المواصلات" },
];

const amenitySets = [
  ["واي فاي", "مكيف", "مطبخ", "تراس", "إطلالة على النيل"],
  ["واي فاي", "مكيف", "مسبح", "موقف سيارة", "تراس"],
  ["واي فاي", "مكيف", "إفطار", "جولات سياحية", "استقبال 24 ساعة"],
  ["واي فاي", "مكيف", "مطبخ", "موقف سيارة"],
  ["واي فاي", "مكيف", "إطلالة على النيل", "تراس", "إفطار"],
];

const ruleComments = [
  "الموقع كان ممتازاً والتعامل كان سريعاً من أول التواصل.",
  "الشقة نظيفة والصور مطابقة للواقع، وأنصح فيها بشدة.",
  "إقامة مريحة ومميزة، خصوصاً الإطلالة وقت الغروب.",
  "استقبال لطيف وكل التفاصيل كانت واضحة قبل الوصول.",
  "قرب المعالم السياحية وفّر علينا وقت كتير في اليوم.",
];

function dbDate(date) {
  return new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function main() {
  console.log(`Seeding ${units.length} demo units...`);

  const demoOwners = ownerNames.map((name, i) => ({
    id: `demo-owner-${String(i + 1).padStart(2, "0")}`,
    email: `demo-owner-${String(i + 1).padStart(2, "0")}@qiwalo.demo`,
    name,
    role: "OWNER",
    phone: `0106${String(100000 + i * 111).slice(0, 6)}`,
    nationality: i % 3 === 0 ? "سعودي" : "مصري",
    commissionRate: i % 4 === 1 ? 10 : i % 5 === 3 ? 15 : 12,
    termsAcceptedAt: new Date(),
  }));

  const demoGuests = guestNames.map((name, i) => ({
    id: `demo-guest-${String(i + 1).padStart(2, "0")}`,
    email: `demo-guest-${String(i + 1).padStart(2, "0")}@qiwalo.demo`,
    name,
    role: "GUEST",
    nationality: i % 2 ? "مصري" : "خليجي",
  }));

  for (const user of [...demoOwners, ...demoGuests]) {
    await prisma.user.upsert({ where: { email: user.email }, update: user, create: user });
  }

  for (const owner of demoOwners) {
    await prisma.ownerVerification.upsert({
      where: { userId: owner.id },
      update: {
        phoneAlt: `0107${String(200000 + owner.commissionRate).slice(0, 6)}`,
        birthDate: new Date("1988-04-12T00:00:00.000Z"),
        nationality: owner.nationality,
        idFront: img("photo-1589829545856-d10d557cf95f"),
        idBack: img("photo-1591696205602-2f950c417cb9"),
        selfie: img("photo-1500648767791-00dcc994a43e"),
        status: "APPROVED",
        commissionRate: owner.commissionRate,
        termsAcceptedAt: new Date(),
        reviewedAt: new Date(),
        note: "تم التحقق من بيانات العرض",
      },
      create: {
        userId: owner.id,
        phoneAlt: `0107${String(200000 + owner.commissionRate).slice(0, 6)}`,
        birthDate: new Date("1988-04-12T00:00:00.000Z"),
        nationality: owner.nationality,
        idFront: img("photo-1589829545856-d10d557cf95f"),
        idBack: img("photo-1591696205602-2f950c417cb9"),
        selfie: img("photo-1500648767791-00dcc994a43e"),
        status: "APPROVED",
        commissionRate: owner.commissionRate,
        termsAcceptedAt: new Date(),
        reviewedAt: new Date(),
        note: "تم التحقق من بيانات العرض",
      },
    });
  }

  const propertyIds = units.map((_, i) => `demo-${String(i + 1).padStart(2, "0")}`);
  await prisma.review.deleteMany({ where: { propertyId: { in: propertyIds } } });
  await prisma.availability.deleteMany({ where: { propertyId: { in: propertyIds } } });
  await prisma.priceRule.deleteMany({ where: { propertyId: { in: propertyIds } } });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const year = today.getUTCFullYear();

  for (let i = 0; i < units.length; i += 1) {
    const u = units[i];
    const owner = demoOwners[i % demoOwners.length];
    const id = propertyIds[i];
    const base = u.city === "LUXOR" ? { lat: 25.6872, lng: 32.6396 } : { lat: 24.0889, lng: 32.8998 };
    const offset = ((i % 7) - 3) * 0.0018;
    const lat = Math.round((base.lat + offset) * 100000) / 100000;
    const lng = Math.round((base.lng + offset * 1.4) * 100000) / 100000;
    const images = [0, 1, 2].map((j) => img(photoPool[(i * 3 + j) % photoPool.length]));
    const address = u.city === "LUXOR"
      ? `حي ${i % 2 ? "الأقصر الشرقية" : "الضفة الغربية"}، شارع ${u.name.includes("النيل") ? "الكورنيش" : "السياحي"}`
      : `حي ${i % 2 ? "وسط المدينة" : "النوبة"}، شارع ${u.name.includes("الخزان") ? "الخزان" : "الكورنيش"}`;
    const description = `${u.highlight}. الوحدة مجهزة بالكامل بمفروشات مريحة ومطبخ ومرافق حديثة، مع موقع مناسب للوصول إلى أهم المعالم في ${u.city === "LUXOR" ? "الأقصر" : "أسوان"}. مساحة الوحدة ${u.area} متر مربع وتستقبل حتى ${u.guests} ضيوف.`;
    const houseRules = [
      "لا تدخين داخل الوحدة · تسليم المفاتيح من 14:00 · المغادرة قبل 12:00",
      "لا حفلات بعد منتصف الليل · الأطفال مرحب بهم تحت إشراف الكبار",
      "يرجى احترام هدوء الجيران بعد 23:00 · لا ضيوف إضافيين غير مسجلين",
    ][i % 3];

    await prisma.property.upsert({
      where: { id },
      update: {
        ownerId: owner.id, name: u.name, slug: u.slug, type: u.type, city: u.city,
        address, description, lat, lng, images, videoUrl: null,
        amenities: amenitySets[i % amenitySets.length], maxGuests: u.guests,
        bedrooms: u.beds, bathrooms: u.baths, areaSqm: u.area, houseRules,
        pickupLat: Math.round((lat + 0.0015) * 100000) / 100000,
        pickupLng: Math.round((lng + 0.0012) * 100000) / 100000,
        basePrice: u.price, commissionRate: owner.commissionRate,
        cancelPolicy: u.policy, status: "PUBLISHED", rating: u.rating, reviewCount: u.reviews,
      },
      create: {
        id, ownerId: owner.id, name: u.name, slug: u.slug, type: u.type, city: u.city,
        address, description, lat, lng, images, videoUrl: null,
        amenities: amenitySets[i % amenitySets.length], maxGuests: u.guests,
        bedrooms: u.beds, bathrooms: u.baths, areaSqm: u.area, houseRules,
        pickupLat: Math.round((lat + 0.0015) * 100000) / 100000,
        pickupLng: Math.round((lng + 0.0012) * 100000) / 100000,
        basePrice: u.price, commissionRate: owner.commissionRate,
        cancelPolicy: u.policy, status: "PUBLISHED", rating: u.rating, reviewCount: u.reviews,
      },
    });

    const availability = [];
    for (let day = 0; day < 150; day += 1) {
      availability.push({
        propertyId: id,
        date: dbDate(addDays(today, day)),
        isBlocked: (day + i) % 17 === 0 || day % 29 === 0,
        priceOverride: day % 37 === 0 ? Math.round(u.price * 1.1) : null,
      });
    }
    await prisma.availability.createMany({ data: availability });

    const priceRules = [];
    for (const y of [year, year + 1]) {
      priceRules.push(
        { id: `${id}-${y}-winter`, propertyId: id, name: "موسم الشتاء", startDate: new Date(`${y}-11-01T00:00:00.000Z`), endDate: new Date(`${y + 1}-03-31T00:00:00.000Z`), price: Math.round(u.price * 1.2), minNights: 2 },
        { id: `${id}-${y}-spring`, propertyId: id, name: "الربيع", startDate: new Date(`${y}-04-01T00:00:00.000Z`), endDate: new Date(`${y}-06-15T00:00:00.000Z`), price: Math.round(u.price * 1.05), minNights: 1 },
        { id: `${id}-${y}-summer`, propertyId: id, name: "الصيف", startDate: new Date(`${y}-06-16T00:00:00.000Z`), endDate: new Date(`${y}-09-30T00:00:00.000Z`), price: Math.round(u.price * 0.82), minNights: 1 },
      );
    }
    await prisma.priceRule.createMany({ data: priceRules });

    const reviewCount = i % 3 === 0 ? 3 : 2;
    const reviewRows = [];
    for (let r = 0; r < reviewCount; r += 1) {
      const guest = demoGuests[(i + r) % demoGuests.length];
      reviewRows.push({
        id: `${id}-review-${r + 1}`,
        propertyId: id,
        guestId: guest.id,
        bookingId: null,
        rating: Math.min(5, Math.max(4, Math.round(u.rating + (r === 0 ? 0 : r === 1 ? -1 : 1)))),
        comment: ruleComments[(i + r) % ruleComments.length],
        isDemo: true,
        status: "PUBLISHED",
        createdAt: addDays(today, -(10 + i + r * 3)),
      });
    }
    await prisma.review.createMany({ data: reviewRows });
  }

  console.log("Demo seed complete:");
  console.log(`  demo owners:  ${demoOwners.length}`);
  console.log(`  demo units:   ${units.length}`);
  console.log(`  demo reviews: ${units.reduce((s, _, i) => s + (i % 3 === 0 ? 3 : 2), 0)}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
