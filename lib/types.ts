export type CityKey = "LUXOR" | "ASWAN";

export type PropertyType =
  | "APARTMENT"
  | "CHALET"
  | "VILLA"
  | "HOTEL"
  | "GUEST_HOUSE"
  | "NILE_CRUISE";

export type ModerationStatus = "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentProvider = "PAYMOB" | "MANUAL";
export type Role = "GUEST" | "OWNER" | "ADMIN";
export type PaymentMethod = "CASH" | "BANK";
export type ReviewStatus = "PENDING" | "PUBLISHED" | "HIDDEN";
export type VerificationStatus = "PENDING" | "SELFIE_REQUIRED" | "SELFIE_PENDING" | "APPROVED" | "REJECTED";

export interface Property {
  id: string;
  slug: string;
  ownerId: string;
  ownerName: string;
  name: string;
  type: PropertyType;
  city: CityKey;
  address: string;
  description: string;
  lat: number;
  lng: number;
  images: string[];
  videoUrl: string | null;
  amenities: string[];
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number | null;
  houseRules: string | null;
  pickupLat: number | null;
  pickupLng: number | null;
  basePrice: number;
  commissionRate: number;
  cancelPolicy: string;
  status: ModerationStatus;
  rating: number;
  reviewCount: number;
}

export interface Availability {
  date: string;
  isBlocked: boolean;
  priceOverride?: number | null;
}

export interface PriceRule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  price: number;
  minNights: number;
}

export interface Booking {
  id: string;
  reference: string;
  propertyId: string;
  propertyName: string;
  propertySlug: string;
  city: CityKey;
  guestId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  subtotal: number;
  serviceFee: number;
  commission: number;
  total: number;
  nationality: string | null;
  paymentMethod: PaymentMethod;
  paymentNote: string | null;
  termsAcceptedAt: string | null;
  adminNotifiedAt: string | null;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  provider: PaymentProvider;
  createdAt: string;
}

export interface SearchFilter {
  city?: CityKey;
  type?: PropertyType;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  guests?: number;
  checkIn?: string;
  checkOut?: string;
  amenities?: string[];
  sort?: "recommended" | "price_asc" | "price_desc" | "rating";
}

export interface NewPropertyInput {
  ownerId: string;
  name: string;
  type: PropertyType;
  city: CityKey;
  address: string;
  description: string;
  lat: number;
  lng: number;
  pickupLat?: number | null;
  pickupLng?: number | null;
  images: string[];
  videoUrl?: string | null;
  amenities: string[];
  maxGuests: number;
  bedrooms: number;
  bathrooms?: number;
  areaSqm?: number | null;
  houseRules?: string | null;
  basePrice: number;
  commissionRate?: number;
  cancelPolicy?: string;
}

export interface Review {
  id: string;
  propertyId: string;
  guestId: string;
  guestName: string;
  bookingId: string | null;
  rating: number;
  comment: string;
  isDemo: boolean;
  status: ReviewStatus;
  createdAt: string;
}

export interface UserRecord {
  email: string;
  name: string;
  role: Role;
  phone: string | null;
  nationality: string | null;
  commissionRate: number;
  termsAcceptedAt: string | null;
}

export interface NewReviewInput {
  propertyId: string;
  guestId: string;
  guestName: string;
  bookingId?: string | null;
  rating: number;
  comment: string;
  isDemo?: boolean;
}

export interface OwnerVerification {
  userId: string;
  phoneAlt: string | null;
  birthDate: string | null;
  nationality: string | null;
  idFront: string;
  idBack: string;
  selfie: string | null;
  status: VerificationStatus;
  note: string | null;
  commissionRate: number;
  termsAcceptedAt: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface NewVerificationInput {
  userId: string;
  phoneAlt?: string | null;
  birthDate?: string | null;
  nationality?: string | null;
  idFront: string;
  idBack: string;
  commissionRate?: number;
  termsAcceptedAt?: string | null;
}

export interface NewBookingInput {
  propertyId: string;
  guestId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  subtotal: number;
  serviceFee: number;
  commission: number;
  total: number;
  provider: PaymentProvider;
  nationality?: string | null;
  paymentMethod?: PaymentMethod;
  paymentNote?: string | null;
  termsAcceptedAt?: string | null;
}

export interface PlatformStats {
  properties: number;
  published: number;
  pending: number;
  bookings: number;
  confirmed: number;
  revenue: number;
  commission: number;
  guests: number;
}
