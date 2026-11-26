import {
  CANCEL_POLICIES,
  CITIES,
  PROPERTY_TYPES,
  PAYMENT_COPY,
  SUPPORT_PHONE,
  SUPPORT_TELEGRAM,
  SUPPORT_WHATSAPP,
} from "@/lib/constants";
import { getRepo } from "@/lib/repo";
import type { Availability, PriceRule, Property, Review } from "@/lib/types";

const MAX_REVIEWS = 10;
const AVAILABILITY_DAYS = 60;

function serializeProperty(property: Property) {
  const cancellation =
    CANCEL_POLICIES[property.cancelPolicy as keyof typeof CANCEL_POLICIES] ??
    property.cancelPolicy;

  return {
    slug: property.slug,
    name: property.name,
    host: property.ownerName,
    type: property.type,
    typeAr: PROPERTY_TYPES[property.type].ar,
    city: property.city,
    cityAr: CITIES[property.city].ar,
    address: property.address,
    description: property.description,
    images: property.images,
    amenities: property.amenities,
    maxGuests: property.maxGuests,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqm: property.areaSqm,
    basePrice: property.basePrice,
    currency: "EGP",
    rating: property.rating,
    reviewCount: property.reviewCount,
    cancellation,
    houseRules: property.houseRules,
    lat: property.lat,
    lng: property.lng,
    pickupLat: property.pickupLat,
    pickupLng: property.pickupLng,
  };
}

function serializeReview(review: Review) {
  return {
    rating: review.rating,
    comment: review.comment,
    guestName: review.guestName,
    createdAt: review.createdAt,
    ownerReply: review.ownerReply,
  };
}

function serializeAvailability(rows: Availability[]) {
  return rows.slice(0, AVAILABILITY_DAYS).map((row) => ({
    date: row.date,
    isBlocked: row.isBlocked,
    priceOverride: row.priceOverride ?? null,
  }));
}

function serializePriceRule(rule: PriceRule) {
  return {
    id: rule.id,
    name: rule.name,
    startDate: rule.startDate,
    endDate: rule.endDate,
    price: rule.price,
    minNights: rule.minNights,
  };
}

/**
 * BFF للقارئ فقط: تفاصيل وحدة منشورة لتطبيق أندرويد.
 * لا يتطلب تسجيل دخول، ولا يكشف بيانات المالك أو الضيوف أو الأسعار الداخلية.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug || slug.length > 160) {
    return Response.json(
      { ok: false, error: "invalid_slug", note: "رابط الوحدة غير صالح." },
      { status: 400 },
    );
  }

  try {
    const repo = await getRepo();
    const property = await repo.getPropertyBySlug(slug);

    if (!property || property.status !== "PUBLISHED") {
      return Response.json(
        {
          ok: false,
          error: "unit_not_found",
          note: "الوحدة غير موجودة أو غير منشورة.",
        },
        { status: 404 },
      );
    }

    const [availability, priceRules, reviews] = await Promise.all([
      repo.getAvailability(property.id),
      repo.getPriceRules(property.id),
      repo.listReviewsForProperty(property.id),
    ]);

    return Response.json(
      {
        ok: true,
        unit: serializeProperty(property),
        reviews: reviews.slice(0, MAX_REVIEWS).map(serializeReview),
        availability: serializeAvailability(availability),
        priceRules: priceRules.map(serializePriceRule),
        pagePath: `/stay/${property.slug}`,
        support: {
          phone: SUPPORT_PHONE,
          whatsapp: SUPPORT_WHATSAPP,
          telegram: SUPPORT_TELEGRAM,
        },
        paymentCopy: PAYMENT_COPY,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطأ غير متوقع";
    return Response.json(
      { ok: false, error: "unit_details_failed", note: message },
      { status: 500 },
    );
  }
}
