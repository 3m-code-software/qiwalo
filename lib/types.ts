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
  basePrice: number;
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
  images: string[];
  videoUrl?: string | null;
  amenities: string[];
  maxGuests: number;
  bedrooms: number;
  basePrice: number;
  cancelPolicy?: string;
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
