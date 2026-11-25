import { prisma } from "@/lib/db";
import { makePropertySlug, slugCandidates } from "@/lib/slug";
import type { Repo } from "./index";
import type {
  ActivityLog, Availability, Booking, CityKey, Experience, ExperienceCategory, NewActivityInput, NewBookingInput, NewExperienceInput, NewPropertyInput,
  NewReviewInput, NewTransportInput, NewVerificationInput, OwnerVerification, PlatformStats, PriceRule, Property,
  Review, SearchFilter, Transport, UserRecord, VerificationStatus,
} from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const iso = (d: Date) => d.toISOString().slice(0, 10);
const dbDate = (date: string) => new Date(`${date}T00:00:00.000Z`);

async function resolveUserId(idOrEmail: string): Promise<string> {
  const byId = await prisma.user.findUnique({ where: { id: idOrEmail }, select: { id: true } });
  if (byId) return byId.id;
  const byEmail = await prisma.user.findUnique({ where: { email: idOrEmail.toLowerCase() }, select: { id: true } });
  if (byEmail) return byEmail.id;
  return idOrEmail;
}

function mapUser(row: any): UserRecord {
  return {
    email: row.email, name: row.name, role: row.role, phone: row.phone ?? null,
    nationality: row.nationality ?? null, commissionRate: row.commissionRate ?? 12,
    termsAcceptedAt: row.termsAcceptedAt ? row.termsAcceptedAt.toISOString() : null,
  };
}

function mapProperty(p: any): Property {
  return {
    id: p.id, slug: p.slug, ownerId: p.owner?.email ?? p.ownerId, ownerName: p.owner?.name ?? "مالك",
    name: p.name, type: p.type, city: p.city, address: p.address, description: p.description,
    lat: p.lat, lng: p.lng, images: Array.isArray(p.images) ? (p.images as string[]) : [],
    videoUrl: p.videoUrl ?? null, amenities: p.amenities ?? [], maxGuests: p.maxGuests,
    bedrooms: p.bedrooms, bathrooms: p.bathrooms ?? 1, areaSqm: p.areaSqm ?? null,
    houseRules: p.houseRules ?? null, pickupLat: p.pickupLat ?? null, pickupLng: p.pickupLng ?? null,
    basePrice: p.basePrice, commissionRate: p.commissionRate ?? 12,
    cancelPolicy: p.cancelPolicy, status: p.status, rating: p.rating, reviewCount: p.reviewCount,
  };
}

function mapExperience(e: any): Experience {
  return {
    id: e.id, ownerId: e.owner?.email ?? e.ownerId, ownerName: e.owner?.name ?? "مالك",
    name: e.name, category: e.category, city: e.city, mountain: e.mountain,
    meetingPoint: e.meetingPoint, durationHours: e.durationHours, capacity: e.capacity,
    pricePerPerson: e.pricePerPerson, includes: Array.isArray(e.includes) ? e.includes : [],
    difficulty: e.difficulty, bestSeason: e.bestSeason, cancelPolicy: e.cancelPolicy,
    licenseDocUrl: e.licenseDocUrl, status: e.status, commissionRate: e.commissionRate ?? 12,
    createdAt: e.createdAt.toISOString(),
  };
}

function mapTransport(t: any): Transport {
  return {
    id: t.id, ownerId: t.owner?.email ?? t.ownerId, ownerName: t.owner?.name ?? "مالك",
    name: t.name, type: t.type, city: t.city, routeFrom: t.routeFrom, routeTo: t.routeTo,
    meetingPoint: t.meetingPoint, durationHours: t.durationHours, capacity: t.capacity,
    pricePerTrip: t.pricePerTrip, includes: Array.isArray(t.includes) ? t.includes : [],
    cancelPolicy: t.cancelPolicy, licenseDocUrl: t.licenseDocUrl, status: t.status,
    commissionRate: t.commissionRate ?? 12, createdAt: t.createdAt.toISOString(),
  };
}

function mapBooking(b: any): Booking {
  return {
    id: b.id, reference: b.reference, propertyId: b.propertyId,
    propertyName: b.property?.name ?? "", propertySlug: b.property?.slug ?? "",
    city: b.property?.city ?? "LUXOR", guestId: b.guest?.email ?? b.guestId, guestName: b.guest?.name ?? "",
    checkIn: iso(b.checkIn), checkOut: iso(b.checkOut), nights: b.nights, guests: b.guests,
    subtotal: b.subtotal, serviceFee: b.serviceFee, commission: b.commission, total: b.total,
    nationality: b.nationality ?? null, paymentMethod: (b.paymentMethod ?? "CASH") as Booking["paymentMethod"],
    paymentNote: b.paymentNote ?? null,
    termsAcceptedAt: b.termsAcceptedAt ? b.termsAcceptedAt.toISOString() : null,
    adminNotifiedAt: b.adminNotifiedAt ? b.adminNotifiedAt.toISOString() : null,
    status: b.status, paymentStatus: b.paymentStatus, provider: b.provider,
    experience: (b.experience as Booking["experience"]) ?? null,
    transport: (b.transport as Booking["transport"]) ?? null,
    createdAt: b.createdAt.toISOString(),
  };
}

function mapReview(r: any): Review {
  return {
    id: r.id, propertyId: r.propertyId, guestId: r.guest?.email ?? r.guestId, guestName: r.guest?.name ?? "",
    bookingId: r.bookingId ?? null, rating: r.rating, comment: r.comment,
    ownerReply: r.ownerReply ?? null,
    ownerReplyAt: r.ownerReplyAt ? r.ownerReplyAt.toISOString() : null,
    isDemo: r.isDemo, status: r.status, createdAt: r.createdAt.toISOString(),
  };
}

function mapVerification(v: any): OwnerVerification {
  return {
    userId: v.user?.email ?? v.userId, phoneAlt: v.phoneAlt ?? null,
    birthDate: v.birthDate ? iso(v.birthDate) : null, nationality: v.nationality ?? null,
    idFront: v.idFront, idBack: v.idBack, selfie: v.selfie ?? null, status: v.status,
    note: v.note ?? null, commissionRate: v.commissionRate ?? 12,
    termsAcceptedAt: v.termsAcceptedAt ? v.termsAcceptedAt.toISOString() : null,
    submittedAt: v.submittedAt.toISOString(), reviewedAt: v.reviewedAt ? v.reviewedAt.toISOString() : null,
  };
}

const include = { property: true, guest: true };
const verificationInclude = { user: true };

function mapActivity(a: any): ActivityLog {
  return {
    id: a.id, actorEmail: a.actorEmail, actorName: a.actorName,
    action: a.action as ActivityLog["action"], target: a.target,
    detail: a.detail ?? null, createdAt: a.createdAt.toISOString(),
  };
}

async function refreshRating(propertyId: string) {
  const published = await prisma.review.findMany({ where: { propertyId, status: "PUBLISHED" as any } });
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      reviewCount: published.length,
      rating: published.length ? Math.round((published.reduce((s, r) => s + r.rating, 0) / published.length) * 10) / 10 : 0,
    },
  });
}

export const prismaRepo: Repo = {
  async listProperties(filter: SearchFilter = {}) {
    const where: any = { status: "PUBLISHED" };
    if (filter.city) where.city = filter.city;
    if (filter.type) where.type = filter.type;
    if (filter.q) where.OR = [
      { name: { contains: filter.q, mode: "insensitive" } },
      { address: { contains: filter.q, mode: "insensitive" } },
      { description: { contains: filter.q, mode: "insensitive" } },
    ];
    if (filter.minPrice != null || filter.maxPrice != null) {
      where.basePrice = {
        ...(filter.minPrice != null ? { gte: filter.minPrice } : {}),
        ...(filter.maxPrice != null ? { lte: filter.maxPrice } : {}),
      };
    }
    if (filter.minRating != null) where.rating = { gte: filter.minRating };
    if (filter.guests) where.maxGuests = { gte: filter.guests };
    if (filter.amenities?.length) where.amenities = { hasEvery: filter.amenities };
    if (filter.checkIn && filter.checkOut) {
      where.availability = { none: { isBlocked: true, date: {
        gte: dbDate(filter.checkIn),
        lt: dbDate(filter.checkOut),
      } } };
    }
    const orderBy: any = filter.sort === "price_asc" ? { basePrice: "asc" }
      : filter.sort === "price_desc" ? { basePrice: "desc" }
      : filter.sort === "rating" ? { rating: "desc" } : { createdAt: "desc" };
    const rows = await prisma.property.findMany({ where, include: { owner: true }, orderBy });
    return rows.map(mapProperty);
  },
  async listAllProperties() {
    const rows = await prisma.property.findMany({ include: { owner: true }, orderBy: { createdAt: "desc" } });
    return rows.map(mapProperty);
  },
  async getPropertyBySlug(slug) {
    const candidates = slugCandidates(slug);
    const row = await prisma.property.findFirst({ where: { slug: { in: candidates } }, include: { owner: true } });
    return row ? mapProperty(row) : null;
  },
  async getPropertyById(id) {
    const row = await prisma.property.findUnique({ where: { id }, include: { owner: true } });
    return row ? mapProperty(row) : null;
  },
  async createProperty(input: NewPropertyInput) {
    const ownerId = await resolveUserId(input.ownerId);
    const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { commissionRate: true } });
    const slug = makePropertySlug(input.name);
    const row = await prisma.property.create({
      data: {
        ownerId, name: input.name, slug, type: input.type as any, city: input.city as any,
        address: input.address, description: input.description, lat: input.lat, lng: input.lng,
        images: input.images, videoUrl: input.videoUrl ?? null, amenities: input.amenities,
        maxGuests: input.maxGuests, bedrooms: input.bedrooms, bathrooms: input.bathrooms ?? 1,
        areaSqm: input.areaSqm ?? null, houseRules: input.houseRules ?? null,
        pickupLat: input.pickupLat ?? null, pickupLng: input.pickupLng ?? null,
        basePrice: input.basePrice, commissionRate: input.commissionRate ?? owner?.commissionRate ?? 12,
        cancelPolicy: input.cancelPolicy ?? "FREE_48H", status: "DRAFT" as any,
      },
      include: { owner: true },
    });
    return mapProperty(row);
  },
  async updateProperty(id, patch) {
    const row = await prisma.property.update({
      where: { id },
      data: {
        name: patch.name, type: patch.type as any, city: patch.city as any,
        address: patch.address, description: patch.description, lat: patch.lat, lng: patch.lng,
        pickupLat: patch.pickupLat ?? null, pickupLng: patch.pickupLng ?? null,
        images: patch.images, videoUrl: patch.videoUrl ?? null, amenities: patch.amenities,
        maxGuests: patch.maxGuests, bedrooms: patch.bedrooms, bathrooms: patch.bathrooms ?? 1,
        areaSqm: patch.areaSqm ?? null, houseRules: patch.houseRules ?? null,
        basePrice: patch.basePrice, cancelPolicy: patch.cancelPolicy ?? "FREE_48H",
      },
      include: { owner: true },
    });
    return mapProperty(row);
  },
  async moderateProperty(id, status) {
    await prisma.property.update({ where: { id }, data: { status: status as any } });
  },
  async listPublishedExperiences(city?: CityKey, category?: ExperienceCategory) {
    // Flتر الفئة هنا في الذاكرة، مش في استعلام Prisma: قيمة MOTORCYCLE_TOUR لسه
    // مش موجودة في enum الإنتاج لحد ما يتنفّذ add-motorcycle-tour.sql، وتمريرها
    // كـ where قد يرفضها Postgres ويوقف كل صفحات الوحدات.
    const rows = await prisma.experience.findMany({
      where: {
        status: "PUBLISHED" as any,
        ...(city ? { city: city as any } : {}),
      },
      include: { owner: true }, orderBy: { createdAt: "desc" },
    });
    return rows.map(mapExperience).filter((experience) => !category || experience.category === category);
  },
  async listAllExperiences() {
    const rows = await prisma.experience.findMany({ include: { owner: true }, orderBy: { createdAt: "desc" } });
    return rows.map(mapExperience);
  },
  async listExperiencesForOwner(ownerId) {
    const id = await resolveUserId(ownerId);
    const rows = await prisma.experience.findMany({
      where: { ownerId: id }, include: { owner: true }, orderBy: { createdAt: "desc" },
    });
    return rows.map(mapExperience);
  },
  async getExperienceById(id) {
    const row = await prisma.experience.findUnique({ where: { id }, include: { owner: true } });
    return row ? mapExperience(row) : null;
  },
  async createExperience(input: NewExperienceInput) {
    const ownerId = await resolveUserId(input.ownerId);
    const row = await prisma.experience.create({
      data: {
        ownerId, name: input.name, category: input.category as any, city: input.city as any,
        mountain: input.mountain, meetingPoint: input.meetingPoint, durationHours: input.durationHours,
        capacity: input.capacity, pricePerPerson: input.pricePerPerson, includes: input.includes,
        difficulty: input.difficulty as any, bestSeason: input.bestSeason, cancelPolicy: input.cancelPolicy,
        licenseDocUrl: input.licenseDocUrl,
      },
      include: { owner: true },
    });
    return mapExperience(row);
  },
  async moderateExperience(id, status) {
    await prisma.experience.update({ where: { id }, data: { status: status as any } });
  },
  async listPublishedTransports(city) {
    const rows = await prisma.transport.findMany({
      where: { status: "PUBLISHED" as any, ...(city ? { city: city as any } : {}) },
      include: { owner: true }, orderBy: { createdAt: "desc" },
    });
    return rows.map(mapTransport);
  },
  async listAllTransports() {
    const rows = await prisma.transport.findMany({ include: { owner: true }, orderBy: { createdAt: "desc" } });
    return rows.map(mapTransport);
  },
  async listTransportsForOwner(ownerId) {
    const id = await resolveUserId(ownerId);
    const rows = await prisma.transport.findMany({
      where: { ownerId: id }, include: { owner: true }, orderBy: { createdAt: "desc" },
    });
    return rows.map(mapTransport);
  },
  async getTransportById(id) {
    const row = await prisma.transport.findUnique({ where: { id }, include: { owner: true } });
    return row ? mapTransport(row) : null;
  },
  async createTransport(input: NewTransportInput) {
    const ownerId = await resolveUserId(input.ownerId);
    const row = await prisma.transport.create({
      data: {
        ownerId, name: input.name, type: input.type as any, city: input.city as any,
        routeFrom: input.routeFrom, routeTo: input.routeTo, meetingPoint: input.meetingPoint,
        durationHours: input.durationHours, capacity: input.capacity, pricePerTrip: input.pricePerTrip,
        includes: input.includes, cancelPolicy: input.cancelPolicy, licenseDocUrl: input.licenseDocUrl,
      },
      include: { owner: true },
    });
    return mapTransport(row);
  },
  async moderateTransport(id, status) {
    await prisma.transport.update({ where: { id }, data: { status: status as any } });
  },
  async getAvailability(propertyId) {
    const rows = await prisma.availability.findMany({ where: { propertyId }, orderBy: { date: "asc" } });
    return rows.map((r): Availability => ({ date: iso(r.date), isBlocked: r.isBlocked, priceOverride: r.priceOverride }));
  },
  async getPriceRules(propertyId) {
    const rows = await prisma.priceRule.findMany({ where: { propertyId }, orderBy: { startDate: "asc" } });
    return rows.map((r): PriceRule => ({
      id: r.id, name: r.name, startDate: iso(r.startDate), endDate: iso(r.endDate), price: r.price, minNights: r.minNights,
    }));
  },
  async saveAvailability(propertyId, rows) {
    await Promise.all(rows.map((row) => prisma.availability.upsert({
      where: { propertyId_date: { propertyId, date: dbDate(row.date) } },
      create: { propertyId, date: dbDate(row.date), isBlocked: row.isBlocked, priceOverride: row.priceOverride ?? null },
      update: { isBlocked: row.isBlocked, priceOverride: row.priceOverride ?? null },
    })));
  },
  async createPriceRule(propertyId, rule) {
    await prisma.priceRule.create({
      data: {
        propertyId, name: rule.name, startDate: dbDate(rule.startDate), endDate: dbDate(rule.endDate),
        price: rule.price, minNights: rule.minNights,
      },
    });
  },
  async deletePriceRule(propertyId, ruleId) {
    await prisma.priceRule.deleteMany({ where: { id: ruleId, propertyId } });
  },
  async createBooking(input: NewBookingInput) {
    const nights = Math.max(0, Math.round((new Date(input.checkOut).getTime() - new Date(input.checkIn).getTime()) / 86400000));
    const guestId = await resolveUserId(input.guestId);
    const row = await prisma.booking.create({
      data: {
        reference: `QW-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        propertyId: input.propertyId, guestId,
        checkIn: dbDate(input.checkIn), checkOut: dbDate(input.checkOut),
        nights, guests: input.guests, subtotal: input.subtotal, serviceFee: input.serviceFee,
        commission: input.commission, total: input.total, provider: input.provider as any,
        nationality: input.nationality ?? null, paymentMethod: input.paymentMethod ?? "CASH",
        paymentNote: input.paymentNote ?? null, termsAcceptedAt: input.termsAcceptedAt ? new Date(input.termsAcceptedAt) : null,
        experience: (input.experience ?? undefined) as any,
        transport: (input.transport ?? undefined) as any,
      },
      include,
    });
    return mapBooking(row);
  },
  async getBookingByReference(reference) {
    const row = await prisma.booking.findUnique({ where: { reference }, include });
    return row ? mapBooking(row) : null;
  },
  async updateBooking(reference, patch) {
    const row = await prisma.booking.update({
      where: { reference },
      data: {
        ...(patch.status ? { status: patch.status as any } : {}),
        ...(patch.paymentStatus ? { paymentStatus: patch.paymentStatus as any } : {}),
        ...(patch.provider ? { provider: patch.provider as any } : {}),
        ...(patch.paymentNote !== undefined ? { paymentNote: patch.paymentNote } : {}),
        ...(patch.termsAcceptedAt !== undefined ? { termsAcceptedAt: patch.termsAcceptedAt ? new Date(patch.termsAcceptedAt) : null } : {}),
        ...(patch.adminNotifiedAt !== undefined ? { adminNotifiedAt: patch.adminNotifiedAt ? new Date(patch.adminNotifiedAt) : null } : {}),
      },
      include,
    });
    if (patch.status === "CONFIRMED") {
      await prisma.availability.updateMany({
        where: { propertyId: row.propertyId, date: {
          gte: dbDate(iso(row.checkIn)),
          lt: dbDate(iso(row.checkOut)),
        } },
        data: { isBlocked: true },
      });
    }
    return mapBooking(row);
  },
  async listAllBookings() {
    const rows = await prisma.booking.findMany({ include, orderBy: { createdAt: "desc" } });
    return rows.map(mapBooking);
  },
  async listBookingsForOwner(ownerId) {
    const id = await resolveUserId(ownerId);
    const rows = await prisma.booking.findMany({ where: { property: { ownerId: id } }, include, orderBy: { createdAt: "desc" } });
    return rows.map(mapBooking);
  },
  async listBookingsForGuest(guestId) {
    const id = await resolveUserId(guestId);
    const rows = await prisma.booking.findMany({ where: { guestId: id }, include, orderBy: { createdAt: "desc" } });
    return rows.map(mapBooking);
  },
  async listPropertiesForOwner(ownerId) {
    const id = await resolveUserId(ownerId);
    const rows = await prisma.property.findMany({ where: { ownerId: id }, include: { owner: true }, orderBy: { createdAt: "desc" } });
    return rows.map(mapProperty);
  },
  async getUserById(id) {
    const row = await prisma.user.findUnique({ where: { id } });
    if (row) return mapUser(row);
    const byEmail = await prisma.user.findUnique({ where: { email: id } });
    return byEmail ? mapUser(byEmail) : null;
  },
  async getUserByEmail(email) {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? mapUser(row) : null;
  },
  async upsertUser(input) {
    await prisma.user.upsert({
      where: { email: input.email },
      create: {
        id: input.email, email: input.email, name: input.name, role: input.role as any,
        phone: input.phone ?? null, nationality: input.nationality ?? null,
        commissionRate: input.commissionRate ?? 12, termsAcceptedAt: input.termsAcceptedAt ? new Date(input.termsAcceptedAt) : null,
      },
      // Never overwrite an existing role here — roles are assigned at first
      // creation or promoted explicitly by an admin seed/script.
      update: {
        name: input.name,
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.nationality ? { nationality: input.nationality } : {}),
        ...(input.commissionRate != null ? { commissionRate: input.commissionRate } : {}),
        ...(input.termsAcceptedAt ? { termsAcceptedAt: new Date(input.termsAcceptedAt) } : {}),
      },
    });
  },
  async setTermsAccepted(email, acceptedAt) {
    await prisma.user.update({ where: { email }, data: { termsAcceptedAt: new Date(acceptedAt) } });
  },
  async setOwnerCommissionRate(email, rate) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return;
    await prisma.user.update({ where: { email }, data: { commissionRate: rate } });
    await prisma.property.updateMany({ where: { ownerId: { in: [user.id, email] } }, data: { commissionRate: rate } });
  },
  async listReviewsForProperty(propertyId) {
    const rows = await prisma.review.findMany({ where: { propertyId, status: "PUBLISHED" as any }, include: { guest: true }, orderBy: { createdAt: "desc" } });
    return rows.map(mapReview);
  },
  async listAllReviews() {
    const rows = await prisma.review.findMany({ include: { guest: true }, orderBy: { createdAt: "desc" } });
    return rows.map(mapReview);
  },
  async createReview(input: NewReviewInput) {
    const guestId = await resolveUserId(input.guestId);
    const row = await prisma.review.create({
      data: {
        propertyId: input.propertyId, guestId, bookingId: input.bookingId ?? null,
        rating: input.rating, comment: input.comment, isDemo: input.isDemo ?? false,
        status: (input.isDemo ? "PUBLISHED" : "PENDING") as any,
      },
      include: { guest: true },
    });
    if (input.isDemo) await refreshRating(input.propertyId);
    return mapReview(row);
  },
  async moderateReview(id, status) {
    const row = await prisma.review.update({ where: { id }, data: { status: status as any }, include: { guest: true } });
    await refreshRating(row.propertyId);
  },
  async replyToReview(id, ownerId, text) {
    const row = await prisma.review.findUnique({ where: { id } });
    if (!row || row.status !== ("PUBLISHED" as any)) return;
    const ownerKey = await resolveUserId(ownerId);
    const property = await prisma.property.findUnique({
      where: { id: row.propertyId }, include: { owner: { select: { email: true } } },
    });
    const allowed = property?.ownerId === ownerKey || property?.owner?.email === ownerId.toLowerCase();
    if (!allowed) return;
    await prisma.review.update({
      where: { id },
      data: { ownerReply: text, ownerReplyAt: new Date() },
    });
  },
  async hasCompletedBooking(guestId, propertyId) {
    const id = await resolveUserId(guestId);
    const count = await prisma.booking.count({ where: { guestId: id, propertyId, status: "COMPLETED" as any } });
    return count > 0;
  },
  async getVerification(userId) {
    const id = await resolveUserId(userId);
    const row = await prisma.ownerVerification.findUnique({ where: { userId: id }, include: verificationInclude });
    return row ? mapVerification(row) : null;
  },
  async listVerifications() {
    const rows = await prisma.ownerVerification.findMany({ include: verificationInclude, orderBy: { submittedAt: "desc" } });
    return rows.map(mapVerification);
  },
  async createVerification(input: NewVerificationInput) {
    const userId = await resolveUserId(input.userId);
    const row = await prisma.ownerVerification.upsert({
      where: { userId },
      create: {
        userId, phoneAlt: input.phoneAlt ?? null,
        birthDate: input.birthDate ? dbDate(input.birthDate) : null,
        nationality: input.nationality ?? null, idFront: input.idFront, idBack: input.idBack,
        commissionRate: input.commissionRate ?? 12,
        termsAcceptedAt: input.termsAcceptedAt ? new Date(input.termsAcceptedAt) : null,
        status: "PENDING" as any,
      },
      update: {
        phoneAlt: input.phoneAlt ?? null,
        birthDate: input.birthDate ? dbDate(input.birthDate) : null,
        nationality: input.nationality ?? null, idFront: input.idFront, idBack: input.idBack,
        commissionRate: input.commissionRate ?? 12,
        termsAcceptedAt: input.termsAcceptedAt ? new Date(input.termsAcceptedAt) : null,
        status: "PENDING" as any, note: null, reviewedAt: null, selfie: null,
      },
      include: verificationInclude,
    });
    return mapVerification(row);
  },
  async setSelfie(userId, url) {
    const id = await resolveUserId(userId);
    await prisma.ownerVerification.update({ where: { userId: id }, data: { selfie: url, status: "SELFIE_PENDING" as any } });
  },
  async moderateVerification(userId, status: VerificationStatus, note) {
    const id = await resolveUserId(userId);
    const row = await prisma.ownerVerification.update({
      where: { userId: id },
      data: { status: status as any, note: note ?? null, reviewedAt: new Date() },
      include: verificationInclude,
    });
    if (status === "APPROVED") {
      await prisma.user.update({ where: { id }, data: { commissionRate: row.commissionRate } });
      await prisma.property.updateMany({ where: { ownerId: { in: [id, row.user.email] } }, data: { commissionRate: row.commissionRate } });
    }
  },
  async logActivity(input: NewActivityInput) {
    await prisma.activityLog.create({ data: { ...input, detail: input.detail ?? null } });
  },
  async listActivities(limit = 30) {
    const rows = await prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
    return rows.map(mapActivity);
  },
  async stats(): Promise<PlatformStats> {
    const [properties, published, pending, bookings, confirmed, guests, money] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { status: "PUBLISHED" as any } }),
      prisma.property.count({ where: { status: "PENDING" as any } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: { in: ["CONFIRMED", "COMPLETED"] as any } } }),
      prisma.booking.groupBy({ by: ["guestId"] }),
      prisma.booking.aggregate({
        where: { status: { in: ["CONFIRMED", "COMPLETED"] as any } },
        _sum: { total: true, commission: true },
      }),
    ]);
    return {
      properties, published, pending, bookings, confirmed,
      revenue: money._sum.total ?? 0, commission: money._sum.commission ?? 0, guests: guests.length,
    };
  },
};
