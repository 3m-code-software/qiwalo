import type {
  Availability,
  Booking,
  BookingStatus,
  ModerationStatus,
  NewBookingInput,
  NewPropertyInput,
  NewReviewInput,
  NewVerificationInput,
  OwnerVerification,
  PropertyUpdateInput,
  PaymentProvider,
  PaymentStatus,
  PlatformStats,
  PriceRule,
  Property,
  Review,
  ReviewStatus,
  SearchFilter,
  UserRecord,
  VerificationStatus,
} from "@/lib/types";

export interface Repo {
  listProperties(filter?: SearchFilter): Promise<Property[]>;
  listAllProperties(): Promise<Property[]>;
  getPropertyBySlug(slug: string): Promise<Property | null>;
  getPropertyById(id: string): Promise<Property | null>;
  createProperty(input: NewPropertyInput): Promise<Property>;
  updateProperty(id: string, patch: PropertyUpdateInput): Promise<Property | null>;
  moderateProperty(id: string, status: ModerationStatus): Promise<void>;
  getAvailability(propertyId: string): Promise<Availability[]>;
  getPriceRules(propertyId: string): Promise<PriceRule[]>;
  saveAvailability(propertyId: string, rows: Availability[]): Promise<void>;
  createPriceRule(propertyId: string, rule: Omit<PriceRule, "id">): Promise<void>;
  deletePriceRule(propertyId: string, ruleId: string): Promise<void>;
  createBooking(input: NewBookingInput): Promise<Booking>;
  getBookingByReference(reference: string): Promise<Booking | null>;
  updateBooking(
    reference: string,
    patch: {
      status?: BookingStatus;
      paymentStatus?: PaymentStatus;
      provider?: PaymentProvider;
      paymentNote?: string | null;
      termsAcceptedAt?: string | null;
      adminNotifiedAt?: string | null;
    },
  ): Promise<Booking>;
  listAllBookings(): Promise<Booking[]>;
  listBookingsForOwner(ownerId: string): Promise<Booking[]>;
  listBookingsForGuest(guestId: string): Promise<Booking[]>;
  listPropertiesForOwner(ownerId: string): Promise<Property[]>;
  getUserById(id: string): Promise<UserRecord | null>;
  getUserByEmail(email: string): Promise<UserRecord | null>;
  upsertUser(input: {
    email: string;
    name: string;
    role: "GUEST" | "OWNER" | "ADMIN";
    phone?: string | null;
    nationality?: string | null;
    commissionRate?: number;
    termsAcceptedAt?: string | null;
  }): Promise<void>;
  setTermsAccepted(email: string, acceptedAt: string): Promise<void>;
  setOwnerCommissionRate(email: string, rate: number): Promise<void>;
  listReviewsForProperty(propertyId: string): Promise<Review[]>;
  listAllReviews(): Promise<Review[]>;
  createReview(input: NewReviewInput): Promise<Review>;
  moderateReview(id: string, status: ReviewStatus): Promise<void>;
  replyToReview(id: string, ownerId: string, text: string): Promise<void>;
  hasCompletedBooking(guestId: string, propertyId: string): Promise<boolean>;
  getVerification(userId: string): Promise<OwnerVerification | null>;
  listVerifications(): Promise<OwnerVerification[]>;
  createVerification(input: NewVerificationInput): Promise<OwnerVerification>;
  setSelfie(userId: string, url: string): Promise<void>;
  moderateVerification(userId: string, status: VerificationStatus, note?: string | null): Promise<void>;
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
