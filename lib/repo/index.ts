import type {
  Availability,
  Booking,
  BookingStatus,
  ModerationStatus,
  NewBookingInput,
  NewPropertyInput,
  PaymentProvider,
  PaymentStatus,
  PlatformStats,
  PriceRule,
  Property,
  SearchFilter,
} from "@/lib/types";

export interface Repo {
  listProperties(filter?: SearchFilter): Promise<Property[]>;
  listAllProperties(): Promise<Property[]>;
  getPropertyBySlug(slug: string): Promise<Property | null>;
  getPropertyById(id: string): Promise<Property | null>;
  createProperty(input: NewPropertyInput): Promise<Property>;
  moderateProperty(id: string, status: ModerationStatus): Promise<void>;
  getAvailability(propertyId: string): Promise<Availability[]>;
  getPriceRules(propertyId: string): Promise<PriceRule[]>;
  createBooking(input: NewBookingInput): Promise<Booking>;
  getBookingByReference(reference: string): Promise<Booking | null>;
  updateBooking(
    reference: string,
    patch: { status?: BookingStatus; paymentStatus?: PaymentStatus; provider?: PaymentProvider },
  ): Promise<Booking>;
  listAllBookings(): Promise<Booking[]>;
  listBookingsForOwner(ownerId: string): Promise<Booking[]>;
  listBookingsForGuest(guestId: string): Promise<Booking[]>;
  listPropertiesForOwner(ownerId: string): Promise<Property[]>;
  getUserByEmail(email: string): Promise<{ email: string; name: string; role: "GUEST" | "OWNER" | "ADMIN" } | null>;
  upsertUser(input: { email: string; name: string; role: "GUEST" | "OWNER" | "ADMIN"; phone?: string }): Promise<void>;
  stats(): Promise<PlatformStats>;
}

let instance: Repo | null = null;

export async function getRepo(): Promise<Repo> {
  if (instance) return instance;
  if (process.env.DATABASE_URL) {
    const { prismaRepo } = await import("./prisma");
    instance = prismaRepo;
  } else {
    const { mockRepo } = await import("./mock");
    instance = mockRepo;
  }
  return instance;
}
