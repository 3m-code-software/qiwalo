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
export type Role = "GUEST" | "OWNER" | "DRIVER" | "ADMIN";
export type PaymentMethod = "CASH" | "BANK";
export type ReviewStatus = "PENDING" | "PUBLISHED" | "HIDDEN";
export type VerificationStatus = "PENDING" | "SELFIE_REQUIRED" | "SELFIE_PENDING" | "APPROVED" | "REJECTED";

/** السفاري في قيوالو يعني رحلات الصحراء والجبال، مش سفاري حيوانات. */
export type ExperienceCategory = "MOUNTAIN_SAFARI" | "MOTORCYCLE_TOUR";
export type ExperienceDifficulty = "EASY" | "MODERATE" | "HARD";

/** النقل كيان مستقل عن الوحدات والتجارب: سيارة، كوستر، باص أو موتوسيكل. */
export type TransportType = "CAR" | "COASTER" | "BUS" | "MOTORCYCLE";

export type ActivityAction =
  | "PROPERTY_PUBLISHED"
  | "PROPERTY_REJECTED"
  | "PROPERTY_DRAFT"
  | "PROPERTY_PENDING"
  | "EXPERIENCE_PUBLISHED"
  | "EXPERIENCE_REJECTED"
  | "TRANSPORT_PUBLISHED"
  | "TRANSPORT_REJECTED"
  | "PACKAGE_PUBLISHED"
  | "PACKAGE_REJECTED"
  | "DRIVER_VERIFIED"
  | "DRIVER_REJECTED"
  | "DRIVER_SUBSCRIPTION_ACTIVE"
  | "VEHICLE_PUBLISHED"
  | "VEHICLE_REJECTED"
  | "COMMISSION_CHANGED"
  | "VERIFICATION_APPROVED"
  | "VERIFICATION_REJECTED"
  | "SELFIE_REQUESTED";

export interface ActivityLog {
  id: string;
  actorEmail: string;
  actorName: string;
  action: ActivityAction;
  target: string;
  detail: string | null;
  createdAt: string;
}

export interface NewActivityInput {
  actorEmail: string;
  actorName: string;
  action: ActivityAction;
  target: string;
  detail?: string | null;
}

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
  experience: ExperienceBookingDetail | null;
  transport: TransportBookingDetail | null;
  package: PackageBookingDetail | null;
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

/** الحقول القابلة للتعديل من النموذج؛ السلوج والحالة والتقييم والعمولة مش من ضمنها. */
export type PropertyUpdateInput = Omit<NewPropertyInput, "ownerId" | "commissionRate">;

export interface Experience {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  category: ExperienceCategory;
  city: CityKey;
  mountain: string;
  meetingPoint: string;
  durationHours: number;
  capacity: number;
  pricePerPerson: number;
  includes: string[];
  difficulty: ExperienceDifficulty;
  bestSeason: string;
  cancelPolicy: string;
  licenseDocUrl: string;
  status: ModerationStatus;
  commissionRate: number;
  createdAt: string;
}

export interface NewExperienceInput {
  ownerId: string;
  name: string;
  category: ExperienceCategory;
  city: CityKey;
  mountain: string;
  meetingPoint: string;
  durationHours: number;
  capacity: number;
  pricePerPerson: number;
  includes: string[];
  difficulty: ExperienceDifficulty;
  bestSeason: string;
  cancelPolicy: string;
  licenseDocUrl: string;
}

export interface ExperienceBookingDetail {
  experienceId: string;
  experienceName: string;
  category: ExperienceCategory;
  city: CityKey;
  mountain: string;
  meetingPoint: string;
  durationHours: number;
  pricePerPerson: number;
  guests: number;
  total: number;
  commission: number;
}

export interface Transport {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  type: TransportType;
  city: CityKey;
  routeFrom: string;
  routeTo: string;
  meetingPoint: string;
  durationHours: number;
  capacity: number;
  pricePerTrip: number;
  includes: string[];
  cancelPolicy: string;
  licenseDocUrl: string;
  status: ModerationStatus;
  commissionRate: number;
  createdAt: string;
  /** السائقين بيوفّروا النقل كمركبة مستقلة، والخدمات القديمة اللي بيضيفها المالك لسه موجودة جنبهم. */
  driverId?: string | null;
  vehicleId?: string | null;
  driverName?: string | null;
  plateNumber?: string | null;
  /** أيام محددة لا تُتاح فيها المركبة؛ تُحفظ على Mock لحين توفير عمود في قاعدة البيانات. */
  blockedDates?: string[];
}

export interface NewTransportInput {
  ownerId: string;
  name: string;
  type: TransportType;
  city: CityKey;
  routeFrom: string;
  routeTo: string;
  meetingPoint: string;
  durationHours: number;
  capacity: number;
  pricePerTrip: number;
  includes: string[];
  cancelPolicy: string;
  licenseDocUrl: string;
}

/** السعر للمركبة/الرحلة مش للفرد; عدد الضيوف بيُستخدم للتحقق من السعة فقط. */
export interface TransportBookingDetail {
  transportId: string;
  transportName: string;
  type: TransportType;
  city: CityKey;
  routeFrom: string;
  routeTo: string;
  meetingPoint: string;
  durationHours: number;
  capacity: number;
  pricePerTrip: number;
  guests: number;
  total: number;
  commission: number;
  driverName?: string | null;
  plateNumber?: string | null;
  driverId?: string | null;
  vehicleId?: string | null;
}

/** الباقة تجمع وحدة + نقل + تجربة بسعر واحد لكل ليلة، وتُضاف للحجز مع باقي الإضافات. */
export interface Package {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  city: CityKey;
  propertyId: string;
  propertyName: string;
  experienceId: string;
  experienceName: string;
  transportId: string;
  transportName: string;
  capacity: number;
  pricePerNight: number;
  includes: string[];
  cancelPolicy: string;
  licenseDocUrl: string;
  status: ModerationStatus;
  commissionRate: number;
  createdAt: string;
}

export interface NewPackageInput {
  ownerId: string;
  name: string;
  city: CityKey;
  propertyId: string;
  experienceId: string;
  transportId: string;
  capacity: number;
  pricePerNight: number;
  includes: string[];
  cancelPolicy: string;
  licenseDocUrl: string;
}

export interface PackageBookingDetail {
  packageId: string;
  packageName: string;
  city: CityKey;
  propertyId: string;
  propertyName: string;
  experienceId: string;
  experienceName: string;
  transportId: string;
  transportName: string;
  capacity: number;
  pricePerNight: number;
  nights: number;
  guests: number;
  total: number;
  commission: number;
}

export interface Review {
  id: string;
  propertyId: string;
  guestId: string;
  guestName: string;
  bookingId: string | null;
  rating: number;
  comment: string;
  ownerReply: string | null;
  ownerReplyAt: string | null;
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

/** اشتراك السائق حالة إدارية على Mock؛ مفيش تحصيل حقيقي ولا checkout مدفوع. */
export type DriverSubscriptionStatus = "NONE" | "PENDING" | "ACTIVE" | "EXPIRED";

/** تحقق السائق زي تحقق المالك تماماً: مستندات + مراجعة إدارية قبل نشر أي مركبة. */
export interface DriverProfile {
  userId: string;
  name: string;
  phone: string | null;
  city: CityKey;
  subscriptionStatus: DriverSubscriptionStatus;
  verificationStatus: VerificationStatus;
  idFront: string;
  idBack: string;
  licenseDocUrl: string;
  note: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface NewDriverProfileInput {
  userId: string;
  city: CityKey;
  idFront: string;
  idBack: string;
  licenseDocUrl: string;
}

/** المركبة كيان مستقل عن خدمة النقل القديمة، والسائق بيقدر يضيف أكتر من مركبة. */
export interface Vehicle {
  id: string;
  driverId: string;
  driverName: string;
  name: string;
  type: TransportType;
  city: CityKey;
  plateNumber: string;
  model: string;
  capacity: number;
  pricePerTrip: number;
  routeFrom: string;
  routeTo: string;
  meetingPoint: string;
  durationHours: number;
  includes: string[];
  cancelPolicy: string;
  licenseDocUrl: string;
  status: ModerationStatus;
  commissionRate: number;
  createdAt: string;
  /** جدول التوافر الخاص بالسائق على Mock؛ لا يوجد له عمود في الإنتاج بعد. */
  blockedDates?: string[];
  /** إيقاف السائق للمركبة بدون إزالتها؛ تُخفى عن الضيوف مع بقاء الحالة في سجل الإدارة. */
  isPaused?: boolean;
}

export interface NewVehicleInput {
  driverId: string;
  name: string;
  type: TransportType;
  city: CityKey;
  plateNumber: string;
  model: string;
  capacity: number;
  pricePerTrip: number;
  routeFrom: string;
  routeTo: string;
  meetingPoint: string;
  durationHours: number;
  includes: string[];
  cancelPolicy: string;
  licenseDocUrl: string;
}

/** تعديلات السائق المسموحة على مركبته؛ المستند والحالة الإدارية لا يُعدّلان من هنا. */
export interface VehicleUpdateInput {
  name: string;
  type: TransportType;
  city: CityKey;
  plateNumber: string;
  model: string;
  capacity: number;
  pricePerTrip: number;
  routeFrom: string;
  routeTo: string;
  meetingPoint: string;
  durationHours: number;
  includes: string[];
  cancelPolicy: string;
  licenseDocUrl: string;
  blockedDates: string[];
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
  experience?: ExperienceBookingDetail | null;
  transport?: TransportBookingDetail | null;
  package?: PackageBookingDetail | null;
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
  drivers: number;
  approvedDrivers: number;
  vehicles: number;
  pendingVehicles: number;
  pausedVehicles: number;
}
