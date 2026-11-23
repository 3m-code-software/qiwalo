import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import type { Repo } from "./index";
import type {
  Availability,
  Booking,
  NewBookingInput,
  NewPropertyInput,
  PlatformStats,
  PriceRule,
  Property,
  SearchFilter,
} from "@/lib/types";

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

type StoredUser = { email: string; name: string; role: "GUEST" | "OWNER" | "ADMIN"; phone?: string };

const users: StoredUser[] = [
  { email: "guest@qiwalo.test", name: "أحمد المسافر", role: "GUEST" },
  { email: "owner@qiwalo.test", name: "محمد مالك", role: "OWNER" },
  { email: "admin@qiwalo.test", name: "إدارة قيوالو", role: "ADMIN" },
];

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

const seedProperties: Property[] = [
  {
    id: "p1", slug: "nile-view-dar-al-madina", ownerId: "owner@qiwalo.test", ownerName: "محمد مالك",
    name: "دار المدينة بإطلالة على النيل", type: "APARTMENT", city: "LUXOR",
    address: "شارع الكورنيش، الأقصر الشرقية",
    description: "شقة مريحة ومفروشة بالكامل في قلب الأقصر، دقائق من الكرنك ووادي الملوك، مع تراس بإطلالة مباشرة على النيل.",
    lat: 25.6872, lng: 32.6396,
    images: [img("photo-1566073771259-6a8506099945"), img("photo-1571896349842-33c89424de2d"), img("photo-1590490360182-c33d57733427")],
    videoUrl: null, amenities: ["واي فاي", "مكيف", "مطبخ", "تراس", "إطلالة على النيل", "موقف سيارة"],
    maxGuests: 5, bedrooms: 2, basePrice: 1450, cancelPolicy: "FREE_48H", status: "PUBLISHED", rating: 4.8, reviewCount: 34,
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
  },
];

const props = seedProperties.map((p) => ({ ...p }));
const availability = new Map<string, Availability[]>();
const priceRules = new Map<string, PriceRule[]>();
for (const p of props) {
  availability.set(p.id, makeAvailability(Number(p.id.slice(1))));
  priceRules.set(p.id, makeRules(p.basePrice));
}

const bookings: Booking[] = [];
function seedBooking(index: number, days: number, nights: number, status: Booking["status"], payment: Booking["paymentStatus"], guest: string) {
  const p = props[index];
  const checkIn = format(addDays(startOfDay(new Date()), days), "yyyy-MM-dd");
  const checkOut = format(addDays(startOfDay(new Date()), days + nights), "yyyy-MM-dd");
  const subtotal = p.basePrice * nights;
  bookings.push({
    id: `b${bookings.length + 1}`, reference: `QW-SEED-${bookings.length + 1}`,
    propertyId: p.id, propertyName: p.name, propertySlug: p.slug, city: p.city,
    guestId: "guest@qiwalo.test", guestName: guest, checkIn, checkOut, nights, guests: 2,
    subtotal, serviceFee: 0, commission: Math.round(subtotal * 0.12), total: subtotal,
    status, paymentStatus: payment, provider: "PAYMOB", createdAt: new Date().toISOString(),
  });
}
seedBooking(0, 12, 3, "CONFIRMED", "PAID", "سارة مسافر");
seedBooking(1, 26, 4, "CONFIRMED", "PAID", "منى عبد العزيز");
seedBooking(2, -8, 2, "COMPLETED", "PAID", "خالد حجز");

const clone = <T,>(v: T): T => structuredClone(v);

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
  async getPropertyBySlug(slug) { const p = props.find((x) => x.slug === slug); return p ? clone(p) : null; },
  async getPropertyById(id) { const p = props.find((x) => x.id === id); return p ? clone(p) : null; },
  async createProperty(input: NewPropertyInput) {
    const slug = `${input.name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "unit"}-${Math.random().toString(36).slice(2, 6)}`;
    const p: Property = {
      id: `p${props.length + 1}`, slug, ownerId: input.ownerId,
      ownerName: users.find((u) => u.email === input.ownerId)?.name ?? "مالك جديد",
      name: input.name, type: input.type, city: input.city, address: input.address, description: input.description,
      lat: input.lat, lng: input.lng, images: input.images, videoUrl: input.videoUrl ?? null, amenities: input.amenities,
      maxGuests: input.maxGuests, bedrooms: input.bedrooms, basePrice: input.basePrice,
      cancelPolicy: input.cancelPolicy ?? "FREE_48H", status: "PENDING", rating: 0, reviewCount: 0,
    };
    props.push(p);
    availability.set(p.id, makeAvailability(props.length));
    priceRules.set(p.id, makeRules(p.basePrice));
    return clone(p);
  },
  async moderateProperty(id, status) { const p = props.find((x) => x.id === id); if (p) p.status = status; },
  async getAvailability(propertyId) { return clone(availability.get(propertyId) ?? []); },
  async getPriceRules(propertyId) { return clone(priceRules.get(propertyId) ?? []); },
  async createBooking(input: NewBookingInput) {
    const p = props.find((x) => x.id === input.propertyId)!;
    const b: Booking = {
      id: `b${bookings.length + 1}`,
      reference: `QW-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      propertyId: p.id, propertyName: p.name, propertySlug: p.slug, city: p.city,
      guestId: input.guestId, guestName: input.guestName, checkIn: input.checkIn, checkOut: input.checkOut,
      nights: Math.max(0, differenceInCalendarDays(parseISO(input.checkOut), parseISO(input.checkIn))),
      guests: input.guests, subtotal: input.subtotal, serviceFee: input.serviceFee, commission: input.commission,
      total: input.total, status: "PENDING", paymentStatus: "PENDING", provider: input.provider,
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
  async listPropertiesForOwner(ownerId) { return clone(props.filter((p) => p.ownerId === ownerId)); },
  async getUserByEmail(email) { const u = users.find((x) => x.email === email); return u ? { email: u.email, name: u.name, role: u.role } : null; },
  async upsertUser(input) {
    const u = users.find((x) => x.email === input.email);
    if (u) Object.assign(u, input); else users.push(input);
  },
  async stats(): Promise<PlatformStats> {
    const confirmed = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED");
    return {
      properties: props.length, published: props.filter((p) => p.status === "PUBLISHED").length,
      pending: props.filter((p) => p.status === "PENDING").length, bookings: bookings.length,
      confirmed: confirmed.length, revenue: confirmed.reduce((s, b) => s + b.total, 0),
      commission: confirmed.reduce((s, b) => s + b.commission, 0),
      guests: new Set(bookings.map((b) => b.guestId)).size,
    };
  },
};
