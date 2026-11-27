import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import { EXPERIENCE_CANCEL_POLICY, PACKAGE_CANCEL_POLICY, TRANSPORT_CANCEL_POLICY } from "@/lib/constants";
import { makePropertySlug, slugCandidates } from "@/lib/slug";
import type { Repo } from "./index";
import type {
  ActivityLog,
  Availability,
  Booking,
  CityKey,
  DriverProfile,
  DriverSubscriptionStatus,
  Experience,
  ExperienceCategory,
  NewActivityInput,
  NewDriverProfileInput,
  NewBookingInput,
  NewExperienceInput,
  NewPackageInput,
  NewPropertyInput,
  Package,
  NewReviewInput,
  NewTransportInput,
  NewVehicleInput,
  NewVerificationInput,
  OwnerVerification,
  PlatformStats,
  PriceRule,
  Property,
  Review,
  SearchFilter,
  Transport,
  UserRecord,
  Vehicle,
  VehicleUpdateInput,
} from "@/lib/types";

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

type StoredUser = UserRecord & { id: string };

interface MockState {
  users: StoredUser[];
  props: Property[];
  experiences: Experience[];
  transports: Transport[];
  packages: Package[];
  drivers: DriverProfile[];
  vehicles: Vehicle[];
  availability: Map<string, Availability[]>;
  priceRules: Map<string, PriceRule[]>;
  bookings: Booking[];
  reviews: Review[];
  verifications: Map<string, OwnerVerification>;
  activities: ActivityLog[];
}

function makeRules(base: number): PriceRule[] {
  const year = new Date().getFullYear();
  const rules: PriceRule[] = [];
  for (const y of [year, year + 1]) {
    rules.push(
      { id: `${y}-oct`, name: "موسم أكتوبر", startDate: `${y}-10-01`, endDate: `${y}-10-31`, price: Math.round(base * 1.15), minNights: 2 },
      { id: `${y}-winter`, name: "موسم الشتاء", startDate: `${y}-11-01`, endDate: `${y + 1}-03-31`, price: Math.round(base * 1.25), minNights: 2 },
      { id: `${y}-spring`, name: "الربيع", startDate: `${y}-04-01`, endDate: `${y}-06-15`, price: Math.round(base * 1.05), minNights: 1 },
      { id: `${y}-summer`, name: "الصيف", startDate: `${y}-06-16`, endDate: `${y}-09-30`, price: Math.round(base * 0.8), minNights: 1 },
    );
  }
  return rules;
}

function makeAvailability(seed: number): Availability[] {
  const today = startOfDay(new Date());
  return Array.from({ length: 180 }, (_, i) => ({
    date: format(addDays(today, i), "yyyy-MM-dd"),
    isBlocked: (i + seed) % 19 === 0 || i % 31 === 0,
    priceOverride: i % 41 === 0 ? 1000 + seed * 50 : null,
  }));
}

type SeedProperty = Omit<Property, "bathrooms" | "areaSqm" | "houseRules" | "pickupLat" | "pickupLng" | "commissionRate"> &
  Partial<Pick<Property, "bathrooms" | "areaSqm" | "houseRules" | "pickupLat" | "pickupLng" | "commissionRate">>;

const seedProperties: SeedProperty[] = [
  {
    id: "p1", slug: "nile-view-dar-al-madina", ownerId: "owner@qiwalo.test", ownerName: "محمد مالك",
    name: "دار المدينة بإطلالة على النيل", type: "APARTMENT", city: "LUXOR",
    address: "شارع الكورنيش، الأقصر الشرقية",
    description: "شقة مريحة ومفروشة بالكامل في قلب الأقصر، دقائق من الكرنك ووادي الملوك، مع تراس بإطلالة مباشرة على النيل.",
    lat: 25.6872, lng: 32.6396,
    images: [img("photo-1566073771259-6a8506099945"), img("photo-1571896349842-33c89424de2d"), img("photo-1590490360182-c33d57733427")],
    videoUrl: null, amenities: ["واي فاي", "مكيف", "مطبخ", "تراس", "إطلالة على النيل", "موقف سيارة"],
    maxGuests: 5, bedrooms: 2, basePrice: 1450, cancelPolicy: "FREE_48H", status: "PUBLISHED", rating: 4.8, reviewCount: 34,
    bathrooms: 2, areaSqm: 110, houseRules: "لا تدخين داخل الوحدة · تسليم المفاتيح من 14:00 · المغادرة قبل 12:00",
    pickupLat: 25.6886, pickupLng: 32.6387,
  },
  {
    id: "p2", slug: "aswan-nubian-house", ownerId: "owner@qiwalo.test", ownerName: "محمد مالك",
    name: "بيت نوبى على ضفاف النيل", type: "GUEST_HOUSE", city: "ASWAN",
    address: "قرية النوبة، غرب النيل",
    description: "بيت ضيافة نوبى بألوانه التقليدية وإطلالته على النيل، مع إفطار نوبى وجولات بصحبة مرشد محلى.",
    lat: 24.0889, lng: 32.8998,
    images: [img("photo-1582719478250-c89cae4dc85b"), img("photo-1564501049412-61c2a3083791"), img("photo-1542314831-068cd1dbfeeb")],
    videoUrl: null, amenities: ["واي فاي", "مكيف", "إفطار", "إطلالة على النيل", "جولات سياحية", "تراس"],
    maxGuests: 4, bedrooms: 2, basePrice: 1200, cancelPolicy: "FREE_7D", status: "PUBLISHED", rating: 4.9, reviewCount: 58,
    bathrooms: 2, areaSqm: 95, houseRules: "إفطار يومي 8–10 صباحاً · لا حفلات · الأطفال مرحب بهم",
    pickupLat: 24.0912, pickupLng: 32.8971,
  },
  {
    id: "p3", slug: "luxor-west-bank-villa", ownerId: "owner@qiwalo.test", ownerName: "محمد مالك",
    name: "فيلا الضفة الغربية مع مسبح", type: "VILLA", city: "LUXOR",
    address: "الضفة الغربية، قرب مقبرة منحن",
    description: "فيلا مستقلة بمسبح خاص وحديقة، مثالية للعائلات التي تبحث عن الخصوصية بعد يوم من الزيارات الأثرية.",
    lat: 25.7402, lng: 32.6015,
    images: [img("photo-1520250497591-112f2f40a3f4"), img("photo-1551882547-ff40c63fe5fa"), img("photo-1445019980597-93fa8acb246c")],
    videoUrl: null, amenities: ["واي فاي", "مكيف", "مسبح", "مطبخ", "موقف سيارة", "تراس"],
    maxGuests: 8, bedrooms: 4, basePrice: 2600, cancelPolicy: "FREE_7D", status: "PUBLISHED", rating: 4.7, reviewCount: 21,
    bathrooms: 3, areaSqm: 240, houseRules: "مسبح للأطفال تحت إشراف الكبار · لا تدخين في غرف النوم · هدوء بعد 23:00",
    pickupLat: 25.7355, pickupLng: 32.6078,
  },
  {
    id: "p4", slug: "aswan-city-center-apartment", ownerId: "owner@qiwalo.test", ownerName: "محمد مالك",
    name: "شقة وسط مدينة أسوان", type: "APARTMENT", city: "ASWAN",
    address: "شارع الصداقة، وسط المدينة",
    description: "شقة عملية قرب محطة القطار والسوق، مناسبة لرجال الأعمال والمسافرين المستقلين.",
    lat: 24.0889, lng: 32.8998,
    images: [img("photo-1590490360182-c33d57733427"), img("photo-1566073771259-6a8506099945")],
    videoUrl: null, amenities: ["واي فاي", "مكيف", "مطبخ", "استقبال 24 ساعة"],
    maxGuests: 3, bedrooms: 1, basePrice: 850, cancelPolicy: "FREE_48H", status: "PUBLISHED", rating: 4.5, reviewCount: 16,
    bathrooms: 1, areaSqm: 65, houseRules: "لا تدخين · ممنوع إقامة ضيوف إضافيين غير مسجلين",
  },
  {
    id: "p5", slug: "nile-cruise-luxor-aswan", ownerId: "owner@qiwalo.test", ownerName: "محمد مالك",
    name: "رحلة نيلية الأقصر – أسوان", type: "NILE_CRUISE", city: "LUXOR",
    address: "ميناء الأقصر السياحي",
    description: "إقامة على متن مركب نيلي مع وجبات وبرنامج زيارات يومي بين الأقصر وأسوان، يشمل وادي الملوك وخزان أسوان.",
    lat: 25.685, lng: 32.64,
    images: [img("photo-1533105079780-92b9be482077"), img("photo-1572252009286-268acec5ca0a")],
    videoUrl: null, amenities: ["واي فاي", "مكيف", "إفطار", "جولات سياحية", "استقبال 24 ساعة"],
    maxGuests: 2, bedrooms: 1, basePrice: 3400, cancelPolicy: "FREE_7D", status: "PUBLISHED", rating: 4.6, reviewCount: 42,
    bathrooms: 1, areaSqm: 38, houseRules: "الصعود قبل موعد الإقلاع بساعة · الوجبات المجدولة مشمولة · البرنامج السياحي حسب حالة النيل",
    pickupLat: 25.6855, pickupLng: 32.6412,
  },
  {
    id: "p6", slug: "luxor-family-hotel", ownerId: "owner@qiwalo.test", ownerName: "محمد مالك",
    name: "فندق العائلة للأقصر", type: "HOTEL", city: "LUXOR",
    address: "ميدان المحطة، الأقصر",
    description: "فندق عائلي بغرف واسعة واستقبال على مدار الساعة، خطوة من محطة القطار.",
    lat: 25.6886, lng: 32.6387,
    images: [img("photo-1564501049412-61c2a3083791"), img("photo-1582719478250-c89cae4dc85b")],
    videoUrl: null, amenities: ["واي فاي", "مكيف", "استقبال 24 ساعة", "موقف سيارة"],
    maxGuests: 4, bedrooms: 2, basePrice: 1100, cancelPolicy: "FREE_48H", status: "PUBLISHED", rating: 4.3, reviewCount: 67,
    bathrooms: 2, areaSqm: 80, houseRules: "تسجيل الوصول بجواز السفر · هدوء بعد 23:00 · الإفطار مقابل رسوم إضافية",
  },
  {
    id: "p7", slug: "aswan-chalet-dam-view", ownerId: "owner@qiwalo.test", ownerName: "محمد مالك",
    name: "شاليه إطلالة الخزان", type: "CHALET", city: "ASWAN",
    address: "طريق الخزان، أسوان",
    description: "شاليه هادئ بإطلالة بانورامية على خزان أسوان مع تراس واسع.",
    lat: 24.13, lng: 32.88,
    images: [img("photo-1542314831-068cd1dbfeeb")],
    videoUrl: null, amenities: ["واي فاي", "مكيف", "تراس", "مطبخ", "موقف سيارة"],
    maxGuests: 6, bedrooms: 3, basePrice: 1600, cancelPolicy: "FREE_48H", status: "PENDING", rating: 0, reviewCount: 0,
    bathrooms: 2, areaSqm: 140, houseRules: "لا حفلات · التراس مغلق بعد منتصف الليل",
  },
  {
    id: "p8", slug: "aswan-nile-loft", ownerId: "owner@qiwalo.test", ownerName: "محمد مالك",
    name: "دور علوي بإطلالة على النيل", type: "APARTMENT", city: "ASWAN",
    address: "كورنيش النيل، أسوان",
    description: "وحدة علوية حديثة بإطلالة مفتوحة على النيل، مناسبة لزوجين.",
    lat: 24.0842, lng: 32.8945,
    images: [img("photo-1571896349842-33c89424de2d")],
    videoUrl: null, amenities: ["واي فاي", "مكيف", "مطبخ", "إطلالة على النيل", "تراس"],
    maxGuests: 2, bedrooms: 1, basePrice: 980, cancelPolicy: "FREE_48H", status: "DRAFT", rating: 0, reviewCount: 0,
    bathrooms: 1, areaSqm: 55, houseRules: "لا تدخين · ممنوع الحيوانات الأليفة",
  },
];

function normalizeProperty(seed: SeedProperty): Property {
  return {
    bathrooms: 1,
    areaSqm: null,
    houseRules: null,
    pickupLat: null,
    pickupLng: null,
    commissionRate: 12,
    ...seed,
  };
}

function seedExperiences(): Experience[] {
  const now = new Date().toISOString();
  return [
    {
      id: "e1", ownerId: "owner@qiwalo.test", ownerName: "محمد مالك", name: "سفاري جبل السلسلة عند الغروب",
      category: "MOUNTAIN_SAFARI", city: "LUXOR", mountain: "جبل السلسلة",
      meetingPoint: "أمام الكرنك — بوابة الأقصر", durationHours: 4, capacity: 6, pricePerPerson: 350,
      includes: ["مرشد مرافق", "عربية ٤×٤", "مياه معدنية", "العودة لنقطة اللقاء"],
      difficulty: "MODERATE", bestSeason: "أكتوبر — أبريل", cancelPolicy: EXPERIENCE_CANCEL_POLICY,
      licenseDocUrl: "https://res.cloudinary.com/demo/raw/upload/v1/qiwalo/docs/luxor-mountain-review.pdf",
      status: "PUBLISHED", commissionRate: 12, createdAt: now,
    },
    {
      id: "e2", ownerId: "owner@qiwalo.test", ownerName: "محمد مالك", name: "غروب الجبل النوبي في أسوان",
      category: "MOUNTAIN_SAFARI", city: "ASWAN", mountain: "جبل السلسلة النوبي",
      meetingPoint: "مينا أسوان السياحي", durationHours: 3, capacity: 8, pricePerPerson: 300,
      includes: ["دليل محلي", "نقل من المينا", "شاي نوبي", "العودة لنقطة اللقاء"],
      difficulty: "EASY", bestSeason: "نوفمبر — مارس", cancelPolicy: EXPERIENCE_CANCEL_POLICY,
      licenseDocUrl: "https://res.cloudinary.com/demo/raw/upload/v1/qiwalo/docs/aswan-mountain-review.pdf",
      status: "PUBLISHED", commissionRate: 12, createdAt: now,
    },
    {
      id: "e3", ownerId: "owner@qiwalo.test", ownerName: "محمد مالك", name: "جولة موتوسيكلات غروب الأقصر",
      category: "MOTORCYCLE_TOUR", city: "LUXOR", mountain: "الكورنيش ← وادي الملوك",
      meetingPoint: "أمام فندق نيل فيو — الكورنيش", durationHours: 3, capacity: 4, pricePerPerson: 450,
      includes: ["دراجة للإيجار", "خوذة واقية", "مرشد مرافق", "مياه معدنية"],
      difficulty: "MODERATE", bestSeason: "أكتوبر — أبريل", cancelPolicy: EXPERIENCE_CANCEL_POLICY,
      licenseDocUrl: "https://res.cloudinary.com/demo/raw/upload/v1/qiwalo/docs/luxor-motorcycle-review.pdf",
      status: "PUBLISHED", commissionRate: 12, createdAt: now,
    },
    {
      id: "e4", ownerId: "owner@qiwalo.test", ownerName: "محمد مالك", name: "جولة موتوسيكلات جزيرة أسوان",
      category: "MOTORCYCLE_TOUR", city: "ASWAN", mountain: "مينا أسوان ← جزيرة الفنتين",
      meetingPoint: "بوابة مينا أسوان السياحي", durationHours: 4, capacity: 6, pricePerPerson: 400,
      includes: ["دراجة للإيجار", "خوذة واقية", "مرشد محلي", "العودة للمينا"],
      difficulty: "EASY", bestSeason: "نوفمبر — مارس", cancelPolicy: EXPERIENCE_CANCEL_POLICY,
      licenseDocUrl: "https://res.cloudinary.com/demo/raw/upload/v1/qiwalo/docs/aswan-motorcycle-review.pdf",
      status: "PUBLISHED", commissionRate: 12, createdAt: now,
    },
  ];
}

function seedTransports(): Transport[] {
  const now = new Date().toISOString();
  return [
    {
      id: "t1", ownerId: "owner@qiwalo.test", ownerName: "محمد مالك", name: "سيارة خاصة لجولات الأقصر",
      type: "CAR", city: "LUXOR", routeFrom: "الأقصر الشرقية", routeTo: "وادي الملوك",
      meetingPoint: "استقبال الفندق — الكورنيش", durationHours: 5, capacity: 4, pricePerTrip: 600,
      includes: ["سائق مرافق", "مياه معدنية", "العودة لنقطة اللقاء"],
      cancelPolicy: TRANSPORT_CANCEL_POLICY,
      licenseDocUrl: "https://res.cloudinary.com/demo/raw/upload/v1/qiwalo/docs/luxor-car-review.pdf",
      status: "PUBLISHED", commissionRate: 12, createdAt: now,
    },
    {
      id: "t2", ownerId: "owner@qiwalo.test", ownerName: "محمد مالك", name: "كوستر أسوان السياحي",
      type: "COASTER", city: "ASWAN", routeFrom: "مينا أسوان", routeTo: "السد العالي",
      meetingPoint: "بوابة مينا أسوان السياحي", durationHours: 4, capacity: 14, pricePerTrip: 900,
      includes: ["سائق", "تكييف", "مرشد محلي", "العودة للمينا"],
      cancelPolicy: TRANSPORT_CANCEL_POLICY,
      licenseDocUrl: "https://res.cloudinary.com/demo/raw/upload/v1/qiwalo/docs/aswan-coaster-review.pdf",
      status: "PUBLISHED", commissionRate: 12, createdAt: now,
    },
  ];
}

function seedPackages(): Package[] {
  const now = new Date().toISOString();
  return [
    {
      id: "pk1", ownerId: "owner@qiwalo.test", ownerName: "محمد مالك", name: "باقة الأقصر: إقامة + سفاري + نقل",
      city: "LUXOR", propertyId: "p1", propertyName: "دار المدينة بإطلالة على النيل",
      experienceId: "e1", experienceName: "سفاري جبل السلسلة عند الغروب",
      transportId: "t1", transportName: "سيارة خاصة لجولات الأقصر",
      capacity: 4, pricePerNight: 1900,
      includes: ["إقامة في الوحدة", "سفاري جبل السلسلة", "نقل سيارة خاص", "مرشد مرافق"],
      cancelPolicy: PACKAGE_CANCEL_POLICY,
      licenseDocUrl: "https://res.cloudinary.com/demo/raw/upload/v1/qiwalo/docs/luxor-package-review.pdf",
      status: "PUBLISHED", commissionRate: 12, createdAt: now,
    },
    {
      id: "pk2", ownerId: "owner@qiwalo.test", ownerName: "محمد مالك", name: "باقة موتوسيكلات الأقصر",
      city: "LUXOR", propertyId: "p1", propertyName: "دار المدينة بإطلالة على النيل",
      experienceId: "e3", experienceName: "جولة موتوسيكلات غروب الأقصر",
      transportId: "t1", transportName: "سيارة خاصة لجولات الأقصر",
      capacity: 4, pricePerNight: 1950,
      includes: ["إقامة في الوحدة", "جولة موتوسيكلات", "نقل سيارة خاص", "خوذة واقية"],
      cancelPolicy: PACKAGE_CANCEL_POLICY,
      licenseDocUrl: "https://res.cloudinary.com/demo/raw/upload/v1/qiwalo/docs/luxor-moto-package-review.pdf",
      status: "PUBLISHED", commissionRate: 12, createdAt: now,
    },
  ];
}

function seedDriverProfiles(): DriverProfile[] {
  const now = new Date().toISOString();
  return [{
    userId: "driver@qiwalo.test", name: "سائق قيوالو", phone: "01066094050", city: "LUXOR",
    subscriptionStatus: "ACTIVE", verificationStatus: "APPROVED",
    idFront: "https://res.cloudinary.com/demo/image/upload/v1/qiwalo/drivers/demo-front.jpg",
    idBack: "https://res.cloudinary.com/demo/image/upload/v1/qiwalo/drivers/demo-back.jpg",
    licenseDocUrl: "https://res.cloudinary.com/demo/raw/upload/v1/qiwalo/drivers/demo-license.pdf",
    note: null, submittedAt: now, reviewedAt: now,
  }];
}

function seedVehicles(): Vehicle[] {
  const now = new Date().toISOString();
  return [{
    id: "v1", driverId: "driver@qiwalo.test", driverName: "سائق قيوالو",
    name: "سيارة السائق — جولات الأقصر", type: "CAR", city: "LUXOR",
    plateNumber: "LXR-1234", model: "تويوتا كامري ٢٠٢٢", capacity: 6, pricePerTrip: 650,
    routeFrom: "الأقصر الشرقية", routeTo: "وادي الملوك",
    meetingPoint: "استقبال الفندق — الكورنيش", durationHours: 5,
    includes: ["سائق مرافق", "مياه معدنية", "العودة لنقطة اللقاء"],
    cancelPolicy: TRANSPORT_CANCEL_POLICY,
    licenseDocUrl: "https://res.cloudinary.com/demo/raw/upload/v1/qiwalo/drivers/demo-vehicle.pdf",
    status: "PUBLISHED", commissionRate: 12, createdAt: now,
    blockedDates: [], isPaused: false,
  }];
}

function createMockState(): MockState {
  const users: StoredUser[] = [
    { id: "guest@qiwalo.test", email: "guest@qiwalo.test", name: "أحمد المسافر", role: "GUEST", phone: null, nationality: "مصري", commissionRate: 12, termsAcceptedAt: null },
    { id: "owner@qiwalo.test", email: "owner@qiwalo.test", name: "محمد مالك", role: "OWNER", phone: null, nationality: "مصري", commissionRate: 12, termsAcceptedAt: null },
    { id: "driver@qiwalo.test", email: "driver@qiwalo.test", name: "سائق قيوالو", role: "DRIVER", phone: "01066094050", nationality: "مصري", commissionRate: 12, termsAcceptedAt: null },
    { id: "admin@qiwalo.test", email: "admin@qiwalo.test", name: "إدارة قيوالو", role: "ADMIN", phone: null, nationality: null, commissionRate: 12, termsAcceptedAt: null },
  ];

  const props = seedProperties.map(normalizeProperty);
  const availability = new Map<string, Availability[]>();
  const priceRules = new Map<string, PriceRule[]>();
  for (const p of props) {
    availability.set(p.id, makeAvailability(Number(p.id.slice(1))));
    priceRules.set(p.id, makeRules(p.basePrice));
  }

  const today = startOfDay(new Date());
  const dateStr = (days: number) => format(addDays(today, days), "yyyy-MM-dd");
  const bookings: Booking[] = [
    {
      id: "b1", reference: "QW-SEED-1", propertyId: "p1", propertyName: props[0].name, propertySlug: props[0].slug, city: props[0].city,
      guestId: "guest@qiwalo.test", guestName: "سارة مسافر", checkIn: dateStr(12), checkOut: dateStr(15), nights: 3, guests: 2,
      subtotal: props[0].basePrice * 3, serviceFee: 0, commission: Math.round(props[0].basePrice * 3 * 0.12), total: props[0].basePrice * 3,
      nationality: "سعودي", paymentMethod: "BANK", paymentNote: null, termsAcceptedAt: new Date().toISOString(), adminNotifiedAt: new Date().toISOString(),
      status: "CONFIRMED", paymentStatus: "PAID", provider: "MANUAL", experience: null, transport: null, package: null, createdAt: new Date().toISOString(),
    },
    {
      id: "b2", reference: "QW-SEED-2", propertyId: "p2", propertyName: props[1].name, propertySlug: props[1].slug, city: props[1].city,
      guestId: "guest@qiwalo.test", guestName: "منى عبد العزيز", checkIn: dateStr(26), checkOut: dateStr(30), nights: 4, guests: 2,
      subtotal: props[1].basePrice * 4, serviceFee: 0, commission: Math.round(props[1].basePrice * 4 * 0.12), total: props[1].basePrice * 4,
      nationality: "مصري", paymentMethod: "CASH", paymentNote: null, termsAcceptedAt: new Date().toISOString(), adminNotifiedAt: new Date().toISOString(),
      status: "CONFIRMED", paymentStatus: "PAID", provider: "MANUAL", experience: null, transport: null, package: null, createdAt: new Date().toISOString(),
    },
    {
      id: "b3", reference: "QW-SEED-3", propertyId: "p3", propertyName: props[2].name, propertySlug: props[2].slug, city: props[2].city,
      guestId: "guest@qiwalo.test", guestName: "خالد حجز", checkIn: dateStr(-8), checkOut: dateStr(-6), nights: 2, guests: 2,
      subtotal: props[2].basePrice * 2, serviceFee: 0, commission: Math.round(props[2].basePrice * 2 * 0.12), total: props[2].basePrice * 2,
      nationality: "إماراتي", paymentMethod: "BANK", paymentNote: null, termsAcceptedAt: new Date().toISOString(), adminNotifiedAt: new Date().toISOString(),
      status: "COMPLETED", paymentStatus: "PAID", provider: "MANUAL", experience: null, transport: null, package: null, createdAt: new Date().toISOString(),
    },
    {
      // رحلة سائق مشتقّة من حجز حقيقي؛ بتغذّي شاشات السائق على Mock من غير جدول Trip جديد.
      id: "b4", reference: "QW-SEED-4", propertyId: props[0].id, propertyName: props[0].name, propertySlug: props[0].slug, city: props[0].city,
      guestId: "guest@qiwalo.test", guestName: "نورة ضيف", checkIn: dateStr(5), checkOut: dateStr(5), nights: 0, guests: 4,
      subtotal: 650, serviceFee: 0, commission: 78, total: 650,
      nationality: "مصري", paymentMethod: "CASH", paymentNote: null, termsAcceptedAt: new Date().toISOString(), adminNotifiedAt: new Date().toISOString(),
      status: "CONFIRMED", paymentStatus: "PENDING", provider: "MANUAL", experience: null, package: null, createdAt: new Date().toISOString(),
      transport: {
        transportId: "v1", transportName: "سيارة السائق — جولات الأقصر", type: "CAR", city: "LUXOR",
        routeFrom: "الأقصر الشرقية", routeTo: "وادي الملوك", meetingPoint: "استقبال الفندق — الكورنيش",
        durationHours: 5, capacity: 6, pricePerTrip: 650, guests: 4, total: 650, commission: 78,
        driverName: "سائق قيوالو", plateNumber: "LXR-1234", driverId: "driver@qiwalo.test", vehicleId: "v1",
      },
    },
  ];

  const now = new Date().toISOString();
  const reviews: Review[] = [
    { id: "r1", propertyId: "p1", guestId: "guest@qiwalo.test", guestName: "سارة مسافر", bookingId: null, rating: 5, comment: "الإطلالة على النيل رائعة والشقة نظيفة جداً. تعامل المالك كان سلساً من أول لحظة.", ownerReply: "شكراً لثقتكم، ويسعدنا استقبالكم مجدداً في أي وقت.", ownerReplyAt: now, isDemo: true, status: "PUBLISHED", createdAt: now },
    { id: "r2", propertyId: "p2", guestId: "guest@qiwalo.test", guestName: "منى عبد العزيز", bookingId: null, rating: 5, comment: "بيت نوبى أصيل والإفطار كان لذيذاً. أنصح فيه بشدة لعائلات.", ownerReply: null, ownerReplyAt: null, isDemo: true, status: "PUBLISHED", createdAt: now },
    { id: "r3", propertyId: "p3", guestId: "guest@qiwalo.test", guestName: "خالد حجز", bookingId: "b3", rating: 4, comment: "مسبح وخصوصية ممتازة، والموقع مناسب للضفة الغربية.", ownerReply: null, ownerReplyAt: null, isDemo: true, status: "PUBLISHED", createdAt: now },
  ];

  return {
    users, props, experiences: seedExperiences(), transports: seedTransports(), packages: seedPackages(),
    drivers: seedDriverProfiles(), vehicles: seedVehicles(),
    availability, priceRules, bookings, reviews, verifications: new Map(), activities: [],
  };
}

// Next.js قد يحمّل ملفات الـ route في module graphs مختلفة داخل نفس العملية.
// تخزين البيانات على globalThis يضمن إن كل الصفحات تشوف نفس وحدات المالك الجديدة.
const globalStore = globalThis as unknown as { __qiwaloMockState?: MockState };
const state = (globalStore.__qiwaloMockState ??= createMockState());
const { users, props, experiences, transports, packages, drivers, vehicles, availability, priceRules, bookings, reviews, verifications, activities } = state;

const clone = <T,>(v: T): T => structuredClone(v);
const toUserRecord = (u: StoredUser): UserRecord => ({
  email: u.email, name: u.name, role: u.role, phone: u.phone ?? null,
  nationality: u.nationality ?? null, commissionRate: u.commissionRate ?? 12,
  termsAcceptedAt: u.termsAcceptedAt ?? null,
});

/** المركبة المنشورة بتظهر للضيوف كخيار نقل عادي، مع حفظ بيانات السائق واللوحة. */
const vehicleToTransport = (v: Vehicle): Transport => ({
  id: v.id, ownerId: v.driverId, ownerName: v.driverName, name: v.name, type: v.type, city: v.city,
  routeFrom: v.routeFrom, routeTo: v.routeTo, meetingPoint: v.meetingPoint,
  durationHours: v.durationHours, capacity: v.capacity, pricePerTrip: v.pricePerTrip,
  includes: [...v.includes], cancelPolicy: v.cancelPolicy, licenseDocUrl: v.licenseDocUrl,
  status: v.status, commissionRate: v.commissionRate, createdAt: v.createdAt,
  driverId: v.driverId, vehicleId: v.id, driverName: v.driverName, plateNumber: v.plateNumber,
  blockedDates: [...(v.blockedDates ?? [])],
});

const publishedDriverIds = () => new Set(
  drivers
    .filter((d) => d.verificationStatus === "APPROVED" && d.subscriptionStatus === "ACTIVE")
    .map((d) => d.userId),
);

function refreshRating(propertyId: string) {
  const p = props.find((x) => x.id === propertyId);
  if (!p) return;
  const published = reviews.filter((r) => r.propertyId === propertyId && r.status === "PUBLISHED");
  p.reviewCount = published.length ? Math.max(p.reviewCount, published.length) : p.reviewCount;
  p.rating = published.length ? Math.round((published.reduce((s, r) => s + r.rating, 0) / published.length) * 10) / 10 : p.rating;
}

export const mockRepo: Repo = {
  async listProperties(filter: SearchFilter = {}) {
    let out = props.filter((p) => p.status === "PUBLISHED");
    if (filter.city) out = out.filter((p) => p.city === filter.city);
    if (filter.type) out = out.filter((p) => p.type === filter.type);
    if (filter.q) {
      const q = filter.q.trim().toLowerCase();
      out = out.filter((p) => [p.name, p.address, p.description].some((v) => v.toLowerCase().includes(q)));
    }
    if (filter.minPrice != null) out = out.filter((p) => p.basePrice >= filter.minPrice!);
    if (filter.maxPrice != null) out = out.filter((p) => p.basePrice <= filter.maxPrice!);
    if (filter.minRating != null) out = out.filter((p) => p.rating >= filter.minRating!);
    if (filter.guests) out = out.filter((p) => p.maxGuests >= filter.guests!);
    if (filter.amenities?.length) out = out.filter((p) => filter.amenities!.every((a) => p.amenities.includes(a)));
    if (filter.checkIn && filter.checkOut) {
      out = out.filter((p) => !(availability.get(p.id) ?? []).some(
        (a) => a.isBlocked && a.date >= filter.checkIn! && a.date < filter.checkOut!,
      ));
    }
    if (filter.sort === "price_asc") out = [...out].sort((a, b) => a.basePrice - b.basePrice);
    if (filter.sort === "price_desc") out = [...out].sort((a, b) => b.basePrice - a.basePrice);
    if (filter.sort === "rating") out = [...out].sort((a, b) => b.rating - a.rating);
    return clone(out);
  },
  async listAllProperties() { return clone(props); },
  async getPropertyBySlug(slug) {
    const candidates = slugCandidates(slug);
    const p = props.find((x) => candidates.includes(x.slug));
    return p ? clone(p) : null;
  },
  async getPropertyById(id) { const p = props.find((x) => x.id === id); return p ? clone(p) : null; },
  async createProperty(input: NewPropertyInput) {
    const slug = makePropertySlug(input.name);
    const p: Property = normalizeProperty({
      id: `p${props.length + 1}`, slug, ownerId: input.ownerId,
      ownerName: users.find((u) => u.email === input.ownerId)?.name ?? "مالك جديد",
      name: input.name, type: input.type, city: input.city, address: input.address, description: input.description,
      lat: input.lat, lng: input.lng, images: input.images, videoUrl: input.videoUrl ?? null, amenities: input.amenities,
      maxGuests: input.maxGuests, bedrooms: input.bedrooms, bathrooms: input.bathrooms ?? 1,
      areaSqm: input.areaSqm ?? null, houseRules: input.houseRules ?? null,
      pickupLat: input.pickupLat ?? null, pickupLng: input.pickupLng ?? null,
      commissionRate: input.commissionRate ?? users.find((u) => u.email === input.ownerId)?.commissionRate ?? 12,
      basePrice: input.basePrice, cancelPolicy: input.cancelPolicy ?? "FREE_48H", status: "DRAFT", rating: 0, reviewCount: 0,
    });
    props.push(p);
    availability.set(p.id, makeAvailability(props.length));
    priceRules.set(p.id, makeRules(p.basePrice));
    return clone(p);
  },
  async updateProperty(id, patch) {
    const p = props.find((x) => x.id === id);
    if (!p) return null;
    Object.assign(p, {
      name: patch.name, type: patch.type, city: patch.city, address: patch.address,
      description: patch.description, lat: patch.lat, lng: patch.lng,
      pickupLat: patch.pickupLat ?? null, pickupLng: patch.pickupLng ?? null,
      images: [...patch.images], videoUrl: patch.videoUrl ?? null,
      amenities: [...patch.amenities], maxGuests: patch.maxGuests,
      bedrooms: patch.bedrooms, bathrooms: patch.bathrooms ?? 1,
      areaSqm: patch.areaSqm ?? null, houseRules: patch.houseRules ?? null,
      basePrice: patch.basePrice, cancelPolicy: patch.cancelPolicy ?? "FREE_48H",
    });
    return clone(p);
  },
  async moderateProperty(id, status) { const p = props.find((x) => x.id === id); if (p) p.status = status; },
  async listPublishedExperiences(city?: CityKey, category?: ExperienceCategory) {
    return clone(experiences.filter((e) => e.status === "PUBLISHED"
      && (!city || e.city === city)
      && (!category || e.category === category)));
  },
  async listAllExperiences() { return clone(experiences); },
  async listExperiencesForOwner(ownerId) {
    return clone(experiences.filter((e) => e.ownerId === ownerId));
  },
  async getExperienceById(id) {
    const e = experiences.find((x) => x.id === id);
    return e ? clone(e) : null;
  },
  async createExperience(input: NewExperienceInput) {
    const e: Experience = {
      id: `e${experiences.length + 1}`,
      ownerId: input.ownerId,
      ownerName: users.find((u) => u.email === input.ownerId)?.name ?? "مالك جديد",
      name: input.name, category: input.category, city: input.city, mountain: input.mountain,
      meetingPoint: input.meetingPoint, durationHours: input.durationHours, capacity: input.capacity,
      pricePerPerson: input.pricePerPerson, includes: [...input.includes], difficulty: input.difficulty,
      bestSeason: input.bestSeason, cancelPolicy: input.cancelPolicy, licenseDocUrl: input.licenseDocUrl,
      status: "PENDING",
      commissionRate: users.find((u) => u.email === input.ownerId)?.commissionRate ?? 12,
      createdAt: new Date().toISOString(),
    };
    experiences.push(e);
    return clone(e);
  },
  async moderateExperience(id, status) {
    const e = experiences.find((x) => x.id === id);
    if (e) e.status = status;
  },
  async listPublishedTransports(city) {
    const approvedDrivers = publishedDriverIds();
    return clone([
      ...transports.filter((t) => t.status === "PUBLISHED" && (!city || t.city === city)),
      ...vehicles
        .filter((v) => v.status === "PUBLISHED" && !v.isPaused && approvedDrivers.has(v.driverId) && (!city || v.city === city))
        .map(vehicleToTransport),
    ]);
  },
  async listAllTransports() { return clone(transports); },
  async listTransportsForOwner(ownerId) {
    return clone(transports.filter((t) => t.ownerId === ownerId));
  },
  async getTransportById(id) {
    const t = transports.find((x) => x.id === id);
    if (t) return clone(t);
    const v = vehicles.find((x) => x.id === id);
    if (!v) return null;
    const driver = drivers.find((d) => d.userId === v.driverId);
    if (v.status !== "PUBLISHED" || v.isPaused || driver?.verificationStatus !== "APPROVED" || driver?.subscriptionStatus !== "ACTIVE") return null;
    return clone(vehicleToTransport(v));
  },
  async createTransport(input: NewTransportInput) {
    const t: Transport = {
      id: `t${transports.length + 1}`,
      ownerId: input.ownerId,
      ownerName: users.find((u) => u.email === input.ownerId)?.name ?? "مالك جديد",
      name: input.name, type: input.type, city: input.city, routeFrom: input.routeFrom, routeTo: input.routeTo,
      meetingPoint: input.meetingPoint, durationHours: input.durationHours, capacity: input.capacity,
      pricePerTrip: input.pricePerTrip, includes: [...input.includes], cancelPolicy: input.cancelPolicy,
      licenseDocUrl: input.licenseDocUrl, status: "PENDING",
      commissionRate: users.find((u) => u.email === input.ownerId)?.commissionRate ?? 12,
      createdAt: new Date().toISOString(),
    };
    transports.push(t);
    return clone(t);
  },
  async moderateTransport(id, status) {
    const t = transports.find((x) => x.id === id);
    if (t) t.status = status;
  },
  async listPublishedPackages(city?: CityKey, propertyId?: string) {
    return clone(packages.filter((pkg) => pkg.status === "PUBLISHED"
      && (!city || pkg.city === city)
      && (!propertyId || pkg.propertyId === propertyId)));
  },
  async listAllPackages() { return clone(packages); },
  async listPackagesForOwner(ownerId) {
    return clone(packages.filter((pkg) => pkg.ownerId === ownerId));
  },
  async getPackageById(id) {
    const pkg = packages.find((x) => x.id === id);
    return pkg ? clone(pkg) : null;
  },
  async createPackage(input: NewPackageInput) {
    const owner = users.find((u) => u.email === input.ownerId);
    const pkg: Package = {
      id: `pkg${packages.length + 1}`,
      ownerId: input.ownerId,
      ownerName: owner?.name ?? "مالك جديد",
      name: input.name, city: input.city,
      propertyId: input.propertyId, propertyName: props.find((p) => p.id === input.propertyId)?.name ?? "",
      experienceId: input.experienceId, experienceName: experiences.find((e) => e.id === input.experienceId)?.name ?? "",
      transportId: input.transportId,
      transportName: transports.find((t) => t.id === input.transportId)?.name
        ?? vehicles.find((v) => v.id === input.transportId)?.name ?? "",
      capacity: input.capacity, pricePerNight: input.pricePerNight, includes: [...input.includes],
      cancelPolicy: input.cancelPolicy, licenseDocUrl: input.licenseDocUrl,
      status: "PENDING", commissionRate: owner?.commissionRate ?? 12,
      createdAt: new Date().toISOString(),
    };
    packages.push(pkg);
    return clone(pkg);
  },
  async moderatePackage(id, status) {
    const pkg = packages.find((x) => x.id === id);
    if (pkg) pkg.status = status;
  },
  async getDriverProfile(userId) {
    const profile = drivers.find((d) => d.userId === userId);
    return profile ? clone(profile) : null;
  },
  async listDriverProfiles() { return clone(drivers); },
  async createDriverProfile(input: NewDriverProfileInput) {
    const user = users.find((u) => u.email === input.userId);
    const now = new Date().toISOString();
    const existing = drivers.find((d) => d.userId === input.userId);
    if (existing) {
      existing.city = input.city;
      existing.idFront = input.idFront;
      existing.idBack = input.idBack;
      existing.licenseDocUrl = input.licenseDocUrl;
      existing.verificationStatus = "PENDING";
      existing.note = null;
      existing.submittedAt = now;
      existing.reviewedAt = null;
      return clone(existing);
    }
    const profile: DriverProfile = {
      userId: input.userId, name: user?.name ?? "سائق جديد", phone: user?.phone ?? null,
      city: input.city, subscriptionStatus: "PENDING", verificationStatus: "PENDING",
      idFront: input.idFront, idBack: input.idBack, licenseDocUrl: input.licenseDocUrl,
      note: null, submittedAt: now, reviewedAt: null,
    };
    drivers.push(profile);
    return clone(profile);
  },
  async moderateDriver(userId, status, note) {
    const profile = drivers.find((d) => d.userId === userId);
    if (profile) {
      profile.verificationStatus = status;
      profile.note = note ?? null;
      profile.reviewedAt = new Date().toISOString();
    }
  },
  async setDriverSubscription(userId, status: DriverSubscriptionStatus) {
    const profile = drivers.find((d) => d.userId === userId);
    if (profile) profile.subscriptionStatus = status;
  },
  async listVehiclesForDriver(driverId) {
    return clone(vehicles.filter((v) => v.driverId === driverId));
  },
  async listAllVehicles() { return clone(vehicles); },
  async getVehicleById(id) {
    const vehicle = vehicles.find((v) => v.id === id);
    return vehicle ? clone(vehicle) : null;
  },
  async createVehicle(input: NewVehicleInput) {
    const user = users.find((u) => u.email === input.driverId);
    const vehicle: Vehicle = {
      id: `v${vehicles.length + 1}`, driverId: input.driverId,
      driverName: user?.name ?? "سائق جديد", name: input.name, type: input.type, city: input.city,
      plateNumber: input.plateNumber, model: input.model, capacity: input.capacity,
      pricePerTrip: input.pricePerTrip, routeFrom: input.routeFrom, routeTo: input.routeTo,
      meetingPoint: input.meetingPoint, durationHours: input.durationHours,
      includes: [...input.includes], cancelPolicy: input.cancelPolicy, licenseDocUrl: input.licenseDocUrl,
      status: "PENDING", commissionRate: user?.commissionRate ?? 12, createdAt: new Date().toISOString(),
      blockedDates: [], isPaused: false,
    };
    vehicles.push(vehicle);
    return clone(vehicle);
  },
  async updateVehicle(id, patch: VehicleUpdateInput) {
    const vehicle = vehicles.find((v) => v.id === id);
    if (!vehicle) return null;
    Object.assign(vehicle, patch, { blockedDates: [...patch.blockedDates].sort() });
    return clone(vehicle);
  },
  async setVehiclePaused(id, paused) {
    const vehicle = vehicles.find((v) => v.id === id);
    if (!vehicle) return null;
    vehicle.isPaused = paused;
    if (paused) vehicle.status = "DRAFT";
    else if (vehicle.status === "DRAFT") vehicle.status = "PUBLISHED";
    return clone(vehicle);
  },
  async deleteVehicle(id) {
    const index = vehicles.findIndex((v) => v.id === id);
    if (index >= 0) vehicles.splice(index, 1);
  },
  async moderateVehicle(id, status) {
    const vehicle = vehicles.find((v) => v.id === id);
    if (vehicle) {
      vehicle.status = status;
      if (status === "PUBLISHED") vehicle.isPaused = false;
    }
  },
  async getAvailability(propertyId) { return clone(availability.get(propertyId) ?? []); },
  async getPriceRules(propertyId) { return clone(priceRules.get(propertyId) ?? []); },
  async saveAvailability(propertyId, rows) {
    const current = availability.get(propertyId) ?? [];
    for (const row of rows) {
      const index = current.findIndex((a) => a.date === row.date);
      if (index >= 0) current[index] = { ...row, priceOverride: row.priceOverride ?? null };
      else current.push({ ...row, priceOverride: row.priceOverride ?? null });
    }
    current.sort((a, b) => a.date.localeCompare(b.date));
    availability.set(propertyId, current);
  },
  async createPriceRule(propertyId, rule) {
    const rows = priceRules.get(propertyId) ?? [];
    rows.push({ ...rule, id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` });
    priceRules.set(propertyId, rows);
  },
  async deletePriceRule(propertyId, ruleId) {
    priceRules.set(propertyId, (priceRules.get(propertyId) ?? []).filter((r) => r.id !== ruleId));
  },
  async createBooking(input: NewBookingInput) {
    const p = props.find((x) => x.id === input.propertyId)!;
    const b: Booking = {
      id: `b${bookings.length + 1}`,
      reference: `QW-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      propertyId: p.id, propertyName: p.name, propertySlug: p.slug, city: p.city,
      guestId: input.guestId, guestName: input.guestName, checkIn: input.checkIn, checkOut: input.checkOut,
      nights: Math.max(0, differenceInCalendarDays(parseISO(input.checkOut), parseISO(input.checkIn))),
      guests: input.guests, subtotal: input.subtotal, serviceFee: input.serviceFee, commission: input.commission,
      total: input.total, nationality: input.nationality ?? null,
      paymentMethod: input.paymentMethod ?? "CASH", paymentNote: input.paymentNote ?? null,
      termsAcceptedAt: input.termsAcceptedAt ?? null, adminNotifiedAt: null,
      status: "PENDING", paymentStatus: "PENDING", provider: input.provider,
      experience: input.experience ? clone(input.experience) : null,
      transport: input.transport ? clone(input.transport) : null,
      package: input.package ? clone(input.package) : null,
      createdAt: new Date().toISOString(),
    };
    bookings.unshift(b);
    return clone(b);
  },
  async getBookingByReference(reference) { const b = bookings.find((x) => x.reference === reference); return b ? clone(b) : null; },
  async updateBooking(reference, patch) {
    const b = bookings.find((x) => x.reference === reference)!;
    Object.assign(b, patch);
    if (patch.status === "CONFIRMED") {
      for (const a of availability.get(b.propertyId) ?? []) {
        if (a.date >= b.checkIn && a.date < b.checkOut) a.isBlocked = true;
      }
    }
    return clone(b);
  },
  async listAllBookings() { return clone(bookings); },
  async listBookingsForOwner(ownerId) {
    const ids = new Set(props.filter((p) => p.ownerId === ownerId).map((p) => p.id));
    return clone(bookings.filter((b) => ids.has(b.propertyId)));
  },
  async listBookingsForGuest(guestId) { return clone(bookings.filter((b) => b.guestId === guestId)); },
  async listBookingsForDriver(driverId) {
    const vehicleIds = new Set(vehicles.filter((v) => v.driverId === driverId).map((v) => v.id));
    const plateNumbers = new Set(vehicles.filter((v) => v.driverId === driverId).map((v) => v.plateNumber));
    return clone(bookings.filter((b) => {
      const detail = b.transport;
      if (!detail) return false;
      return detail.driverId === driverId
        || vehicleIds.has(detail.transportId)
        || (detail.vehicleId != null && vehicleIds.has(detail.vehicleId))
        || (detail.plateNumber != null && plateNumbers.has(detail.plateNumber));
    }));
  },
  async listPropertiesForOwner(ownerId) { return clone(props.filter((p) => p.ownerId === ownerId)); },
  async getUserById(id) {
    const u = users.find((x) => x.id === id || x.email === id);
    return u ? toUserRecord(u) : null;
  },
  async getUserByEmail(email) {
    const u = users.find((x) => x.email === email);
    return u ? toUserRecord(u) : null;
  },
  async getUserByPhone(phone) {
    const u = users.find((x) => x.phone === phone);
    return u ? toUserRecord(u) : null;
  },
  async upsertUser(input) {
    if (input.phone && users.some((x) => x.phone === input.phone && x.email !== input.email)) {
      throw new Error("PHONE_TAKEN");
    }
    const u = users.find((x) => x.email === input.email);
    if (u) {
      u.name = input.name;
      if (input.phone) u.phone = input.phone;
      if (input.nationality) u.nationality = input.nationality;
      if (input.commissionRate != null) u.commissionRate = input.commissionRate;
      if (input.termsAcceptedAt) u.termsAcceptedAt = input.termsAcceptedAt;
    } else {
      users.push({
        id: input.email, email: input.email, name: input.name, role: input.role,
        phone: input.phone ?? null, nationality: input.nationality ?? null,
        commissionRate: input.commissionRate ?? 12, termsAcceptedAt: input.termsAcceptedAt ?? null,
      });
    }
  },
  async setTermsAccepted(email, acceptedAt) {
    const u = users.find((x) => x.email === email);
    if (u) u.termsAcceptedAt = acceptedAt;
  },
  async setOwnerCommissionRate(email, rate) {
    const u = users.find((x) => x.email === email);
    if (u) u.commissionRate = rate;
    for (const p of props.filter((x) => x.ownerId === email)) p.commissionRate = rate;
  },
  async listReviewsForProperty(propertyId) {
    return clone(reviews.filter((r) => r.propertyId === propertyId && r.status === "PUBLISHED"));
  },
  async listAllReviews() { return clone(reviews); },
  async createReview(input: NewReviewInput) {
    const review: Review = {
      id: `r${reviews.length + 1}`, propertyId: input.propertyId, guestId: input.guestId, guestName: input.guestName,
      bookingId: input.bookingId ?? null, rating: input.rating, comment: input.comment,
      isDemo: input.isDemo ?? false, status: input.isDemo ? "PUBLISHED" : "PENDING",
      ownerReply: null, ownerReplyAt: null,
      createdAt: new Date().toISOString(),
    };
    reviews.unshift(review);
    if (review.status === "PUBLISHED") refreshRating(review.propertyId);
    return clone(review);
  },
  async moderateReview(id, status) {
    const review = reviews.find((r) => r.id === id);
    if (!review) return;
    review.status = status;
    refreshRating(review.propertyId);
  },
  async replyToReview(id, ownerId, text) {
    const review = reviews.find((r) => r.id === id);
    if (!review || review.status !== "PUBLISHED") return;
    if (!props.some((p) => p.id === review.propertyId && p.ownerId === ownerId)) return;
    review.ownerReply = text;
    review.ownerReplyAt = new Date().toISOString();
  },
  async hasCompletedBooking(guestId, propertyId) {
    return bookings.some((b) => b.guestId === guestId && b.propertyId === propertyId && b.status === "COMPLETED");
  },
  async getVerification(userId) { const v = verifications.get(userId); return v ? clone(v) : null; },
  async listVerifications() { return clone([...verifications.values()]); },
  async createVerification(input: NewVerificationInput) {
    const record: OwnerVerification = {
      userId: input.userId, phoneAlt: input.phoneAlt ?? null, birthDate: input.birthDate ?? null,
      nationality: input.nationality ?? null, idFront: input.idFront, idBack: input.idBack,
      selfie: null, status: "PENDING", note: null, commissionRate: input.commissionRate ?? 12,
      termsAcceptedAt: input.termsAcceptedAt ?? null, submittedAt: new Date().toISOString(), reviewedAt: null,
    };
    verifications.set(input.userId, record);
    return clone(record);
  },
  async setSelfie(userId, url) {
    const v = verifications.get(userId);
    if (v) { v.selfie = url; v.status = "SELFIE_PENDING"; }
  },
  async moderateVerification(userId, status, note) {
    const v = verifications.get(userId);
    if (v) { v.status = status; v.note = note ?? null; v.reviewedAt = new Date().toISOString(); }
    if (status === "APPROVED") {
      const u = users.find((x) => x.email === userId || x.id === userId);
      if (u) u.commissionRate = v?.commissionRate ?? u.commissionRate;
    }
  },
  async logActivity(input: NewActivityInput) {
    activities.unshift({
      id: `a${activities.length + 1}`,
      actorEmail: input.actorEmail, actorName: input.actorName,
      action: input.action, target: input.target, detail: input.detail ?? null,
      createdAt: new Date().toISOString(),
    });
  },
  async listActivities(limit = 30) { return clone(activities.slice(0, limit)); },
  async stats(): Promise<PlatformStats> {
    const confirmed = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED");
    return {
      properties: props.length, published: props.filter((p) => p.status === "PUBLISHED").length,
      pending: props.filter((p) => p.status === "PENDING").length, bookings: bookings.length,
      confirmed: confirmed.length, revenue: confirmed.reduce((s, b) => s + b.total, 0),
      commission: confirmed.reduce((s, b) => s + b.commission, 0),
      guests: new Set(bookings.map((b) => b.guestId)).size,
      drivers: drivers.length,
      approvedDrivers: drivers.filter((d) => d.verificationStatus === "APPROVED").length,
      vehicles: vehicles.length,
      pendingVehicles: vehicles.filter((v) => v.status === "PENDING").length,
      pausedVehicles: vehicles.filter((v) => v.isPaused).length,
    };
  },
};
