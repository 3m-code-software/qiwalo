import { prisma } from "@/lib/db";
import { makePropertySlug, slugCandidates } from "@/lib/slug";
import type { Repo } from "./index";
import type {
  Availability, Booking, NewBookingInput, NewPropertyInput, PlatformStats,
  PriceRule, Property, SearchFilter,
} from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const iso = (d: Date) => d.toISOString().slice(0, 10);

function mapProperty(p: any): Property {
  return {
    id: p.id, slug: p.slug, ownerId: p.ownerId, ownerName: p.owner?.name ?? "مالك",
    name: p.name, type: p.type, city: p.city, address: p.address, description: p.description,
    lat: p.lat, lng: p.lng, images: Array.isArray(p.images) ? (p.images as string[]) : [],
    videoUrl: p.videoUrl ?? null, amenities: p.amenities ?? [], maxGuests: p.maxGuests,
    bedrooms: p.bedrooms, basePrice: p.basePrice, cancelPolicy: p.cancelPolicy, status: p.status,
    rating: p.rating, reviewCount: p.reviewCount,
  };
}

function mapBooking(b: any): Booking {
  return {
    id: b.id, reference: b.reference, propertyId: b.propertyId,
    propertyName: b.property?.name ?? "", propertySlug: b.property?.slug ?? "",
    city: b.property?.city ?? "LUXOR", guestId: b.guestId, guestName: b.guest?.name ?? "",
    checkIn: iso(b.checkIn), checkOut: iso(b.checkOut), nights: b.nights, guests: b.guests,
    subtotal: b.subtotal, serviceFee: b.serviceFee, commission: b.commission, total: b.total,
    status: b.status, paymentStatus: b.paymentStatus, provider: b.provider,
    createdAt: b.createdAt.toISOString(),
  };
}

const include = { property: true, guest: true };

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
    if (filter.guests) where.maxGuests = { gte: filter.guests };
    if (filter.amenities?.length) where.amenities = { hasEvery: filter.amenities };
    if (filter.checkIn && filter.checkOut) {
      where.availability = { none: { isBlocked: true, date: {
        gte: new Date(`${filter.checkIn}T00:00:00Z`),
        lt: new Date(`${filter.checkOut}T00:00:00Z`),
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
    const slug = makePropertySlug(input.name);
    const row = await prisma.property.create({
      data: {
        ownerId: input.ownerId, name: input.name, slug, type: input.type as any, city: input.city as any,
        address: input.address, description: input.description, lat: input.lat, lng: input.lng,
        images: input.images, videoUrl: input.videoUrl ?? null, amenities: input.amenities,
        maxGuests: input.maxGuests, bedrooms: input.bedrooms, basePrice: input.basePrice,
        cancelPolicy: input.cancelPolicy ?? "FREE_48H", status: "PENDING" as any,
      },
      include: { owner: true },
    });
    return mapProperty(row);
  },
  async moderateProperty(id, status) {
    await prisma.property.update({ where: { id }, data: { status: status as any } });
  },
  async getAvailability(propertyId) {
    const rows = await prisma.availability.findMany({ where: { propertyId } });
    return rows.map((r): Availability => ({ date: iso(r.date), isBlocked: r.isBlocked, priceOverride: r.priceOverride }));
  },
  async getPriceRules(propertyId) {
    const rows = await prisma.priceRule.findMany({ where: { propertyId } });
    return rows.map((r): PriceRule => ({
      id: r.id, name: r.name, startDate: iso(r.startDate), endDate: iso(r.endDate), price: r.price, minNights: r.minNights,
    }));
  },
  async createBooking(input: NewBookingInput) {
    const nights = Math.max(0, Math.round((new Date(input.checkOut).getTime() - new Date(input.checkIn).getTime()) / 86400000));
    const row = await prisma.booking.create({
      data: {
        reference: `QW-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        propertyId: input.propertyId, guestId: input.guestId,
        checkIn: new Date(`${input.checkIn}T00:00:00Z`), checkOut: new Date(`${input.checkOut}T00:00:00Z`),
        nights, guests: input.guests, subtotal: input.subtotal, serviceFee: input.serviceFee,
        commission: input.commission, total: input.total, provider: input.provider as any,
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
      },
      include,
    });
    if (patch.status === "CONFIRMED") {
      await prisma.availability.updateMany({
        where: { propertyId: row.propertyId, date: {
          gte: new Date(`${iso(row.checkIn)}T00:00:00Z`),
          lt: new Date(`${iso(row.checkOut)}T00:00:00Z`),
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
    const rows = await prisma.booking.findMany({ where: { property: { ownerId } }, include, orderBy: { createdAt: "desc" } });
    return rows.map(mapBooking);
  },
  async listBookingsForGuest(guestId) {
    const rows = await prisma.booking.findMany({ where: { guestId }, include, orderBy: { createdAt: "desc" } });
    return rows.map(mapBooking);
  },
  async listPropertiesForOwner(ownerId) {
    const rows = await prisma.property.findMany({ where: { ownerId }, include: { owner: true }, orderBy: { createdAt: "desc" } });
    return rows.map(mapProperty);
  },
  async getUserByEmail(email) {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? { email: row.email, name: row.name, role: row.role } : null;
  },
  async upsertUser(input) {
    await prisma.user.upsert({
      where: { email: input.email },
      create: { id: input.email, email: input.email, name: input.name, role: input.role as any, phone: input.phone },
      // Never overwrite an existing role here — roles are assigned at first
      // creation or promoted explicitly by an admin seed/script.
      update: { name: input.name, phone: input.phone },
    });
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
