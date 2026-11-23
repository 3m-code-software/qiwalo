import { timingSafeEqual } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  CANCEL_POLICIES,
  CITIES,
  COMMISSION_RATE,
  PROPERTY_TYPES,
  SUPPORT_PHONE,
  SUPPORT_TELEGRAM,
  SUPPORT_WHATSAPP,
} from "@/lib/constants";
import { getRepo } from "@/lib/repo";
import type { Booking, Property, Review } from "@/lib/types";

const PAYMENT_COPY = "تحويل بنكي أو كاش عند الوصول";
const MAX_SEARCH_RESULTS = 20;
const MAX_REVIEWS = 10;

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const citySchema = z.enum(["LUXOR", "ASWAN"]);
const propertyTypeSchema = z.enum([
  "APARTMENT",
  "CHALET",
  "VILLA",
  "HOTEL",
  "GUEST_HOUSE",
  "NILE_CRUISE",
]);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const sortSchema = z.enum(["recommended", "price_asc", "price_desc", "rating"]);

const searchUnitsSchema = z
  .object({
    city: citySchema.optional(),
    type: propertyTypeSchema.optional(),
    q: z.string().trim().min(1).max(120).optional(),
    minPrice: z.number().int().nonnegative().optional(),
    maxPrice: z.number().int().positive().optional(),
    minRating: z.number().min(0).max(5).optional(),
    guests: z.number().int().positive().max(30).optional(),
    checkIn: dateSchema.optional(),
    checkOut: dateSchema.optional(),
    amenities: z.array(z.string().min(1).max(80)).max(20).optional(),
    sort: sortSchema.optional(),
  })
  .strict();

const unitDetailsSchema = z
  .object({ slug: z.string().trim().min(1).max(160) })
  .strict();

const bookingStatusSchema = z
  .object({
    reference: z
      .string()
      .trim()
      .min(4)
      .max(64)
      .regex(/^[A-Za-z0-9-]+$/, "Invalid booking reference")
      .transform((value) => value.toUpperCase()),
  })
  .strict();

const policiesSchema = z
  .object({
    topic: z.enum(["all", "payment", "cancellation", "owner", "privacy"]).default("all"),
  })
  .strict();

type SearchUnitsInput = z.infer<typeof searchUnitsSchema>;
type PoliciesTopic = z.infer<typeof policiesSchema>["topic"];

function textResult(value: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
  };
}

function policyText(key: string): string {
  return CANCEL_POLICIES[key as keyof typeof CANCEL_POLICIES] ?? key;
}

function publicProperty(property: Property) {
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
    images: property.images.slice(0, 4),
    amenities: property.amenities,
    maxGuests: property.maxGuests,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqm: property.areaSqm,
    basePrice: property.basePrice,
    currency: "EGP",
    rating: property.rating,
    reviewCount: property.reviewCount,
    cancellation: policyText(property.cancelPolicy),
    houseRules: property.houseRules,
    lat: property.lat,
    lng: property.lng,
    pickupLat: property.pickupLat,
    pickupLng: property.pickupLng,
    pagePath: `/stay/${property.slug}`,
  };
}

function publicReview(review: Review) {
  return {
    rating: review.rating,
    comment: review.comment,
    guestName: review.guestName,
    createdAt: review.createdAt,
  };
}

function publicBooking(booking: Booking) {
  return {
    reference: booking.reference,
    propertyName: booking.propertyName,
    city: CITIES[booking.city].ar,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    guests: booking.guests,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    paymentMethod:
      booking.paymentMethod === "CASH" ? "كاش عند الوصول" : "تحويل بنكي",
    createdAt: booking.createdAt,
    paymentCopy: PAYMENT_COPY,
    supportPhone: SUPPORT_PHONE,
    note: "ملخص محدود للدعم فقط؛ لا يتضمن اسم الضيف أو جنسيته أو ملاحظات الدفع.",
  };
}

function policiesPayload(topic: PoliciesTopic) {
  const base = {
    site: "قيوالو — Qiwalo",
    support: {
      phone: SUPPORT_PHONE,
      whatsapp: SUPPORT_WHATSAPP,
      telegram: SUPPORT_TELEGRAM,
    },
    paymentCopy: PAYMENT_COPY,
    pages: {
      privacy: "/privacy",
      guestTerms: "/terms/guest",
      ownerTerms: "/terms/owner",
      platformTerms: "/terms/platform",
      unitTerms: "/terms/units",
    },
    draftNotice:
      "الصفحات القانونية موسومة «مسودة للمراجعة النهائية»؛ لا تؤكد صياغة نهائية لم تعتمدها الإدارة.",
  };

  if (topic === "payment") {
    return { ...base, topic, payment: PAYMENT_COPY };
  }
  if (topic === "cancellation") {
    return { ...base, topic, cancellation: Object.values(CANCEL_POLICIES) };
  }
  if (topic === "owner") {
    return {
      ...base,
      topic,
      commission: `عمولة ${Math.round(COMMISSION_RATE * 100)}% على الحجز المؤكد فقط، وقابلة للتعديل للشركاء باتفاق.`,
      listing: "لا يوجد اشتراك أو رسوم نشر حالياً. التوثيق مطلوب قبل نشر الوحدة، حتى 8 صور لكل وحدة.",
      verification: "الهاتف الأساسي والبديل، تاريخ الميلاد، وجه الهوية، ثم سيلفي بعد الاعتماد المبدئي.",
    };
  }
  if (topic === "privacy") {
    return {
      ...base,
      topic,
      summary:
        "تُجمع بيانات التواصل وبيانات الحجز والبيانات التقنية اللازمة لتشغيل المنصة. للضيف حق الاطلاع والتصحيح والحذف وسحب الموافقة عبر رقم الدعم. لا تطلب كلمات مرور أو بيانات حساسة في الشات.",
    };
  }
  return {
    ...base,
    topic,
    booking:
      "رقم الحجز ينشأ فور إرسال الطلب، لكن التأكيد يعني ظهور حالة التأكيد ووصول تفاصيل الوصول للضيف.",
    payment: PAYMENT_COPY,
    cancellation: Object.values(CANCEL_POLICIES),
    commission: `عمولة ${Math.round(COMMISSION_RATE * 100)}% على الحجز المؤكد فقط.`,
    reviews: "التقييمات بعد إتمام الإقامة فقط، وتراجعها الإدارة قبل الظهور.",
  };
}

function createMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: "qiwalo-support",
      version: "1.0.0",
    },
    {
      instructions:
        "Qiwalo read-only support data. Search public units, read public unit details, check limited booking status, and read policies. Never write data, process payments, or ask customers for passwords or card details.",
    },
  );

  server.registerTool(
    "search_units",
    {
      title: "Search Qiwalo units",
      description:
        "Search published Qiwalo properties in Luxor and Aswan. Returns public listing data only. No booking or writing.",
      inputSchema: searchUnitsSchema,
      annotations: READ_ONLY,
    },
    async (input: SearchUnitsInput) => {
      const repo = await getRepo();
      const filter = {
        ...(input.city ? { city: input.city } : {}),
        ...(input.type ? { type: input.type } : {}),
        ...(input.q ? { q: input.q } : {}),
        ...(input.minPrice != null ? { minPrice: input.minPrice } : {}),
        ...(input.maxPrice != null ? { maxPrice: input.maxPrice } : {}),
        ...(input.minRating != null ? { minRating: input.minRating } : {}),
        ...(input.guests != null ? { guests: input.guests } : {}),
        ...(input.checkIn ? { checkIn: input.checkIn } : {}),
        ...(input.checkOut ? { checkOut: input.checkOut } : {}),
        ...(input.amenities?.length ? { amenities: input.amenities } : {}),
        ...(input.sort ? { sort: input.sort } : {}),
      };
      const units = await repo.listProperties(filter);
      return textResult({
        count: units.length,
        returned: Math.min(units.length, MAX_SEARCH_RESULTS),
        units: units.slice(0, MAX_SEARCH_RESULTS).map(publicProperty),
      });
    },
  );

  server.registerTool(
    "get_unit_details",
    {
      title: "Get Qiwalo unit details",
      description:
        "Get public details and published reviews for one published Qiwalo unit by its page slug. No owner documents or private data.",
      inputSchema: unitDetailsSchema,
      annotations: READ_ONLY,
    },
    async ({ slug }) => {
      const repo = await getRepo();
      const property = await repo.getPropertyBySlug(slug);
      if (!property || property.status !== "PUBLISHED") {
        return textResult({ found: false, note: "الوحدة غير موجودة أو غير منشورة." });
      }
      const reviews = await repo.listReviewsForProperty(property.id);
      return textResult({
        found: true,
        unit: publicProperty(property),
        reviews: reviews.slice(0, MAX_REVIEWS).map(publicReview),
      });
    },
  );

  server.registerTool(
    "get_booking_status",
    {
      title: "Get limited Qiwalo booking status",
      description:
        "Look up a booking by reference and return a minimal support summary. Never returns guest identity, nationality, payment notes, or amounts.",
      inputSchema: bookingStatusSchema,
      annotations: READ_ONLY,
    },
    async ({ reference }) => {
      const repo = await getRepo();
      const booking = await repo.getBookingByReference(reference);
      if (!booking) {
        return textResult({ found: false, note: "لم يتم العثور على رقم الحجز." });
      }
      return textResult({ found: true, booking: publicBooking(booking) });
    },
  );

  server.registerTool(
    "get_policies",
    {
      title: "Get Qiwalo policies",
      description:
        "Read approved support policies, payment wording, cancellation rules, legal page links, and support channels. Static read-only text.",
      inputSchema: policiesSchema,
      annotations: READ_ONLY,
    },
    async ({ topic }) => textResult(policiesPayload(topic)),
  );

  return server;
}

function jsonResponse(body: unknown, status: number, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function providedToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim() || null;
  }
  return (
    request.headers.get("x-api-key")?.trim() ||
    request.headers.get("mcp-api-key")?.trim() ||
    null
  );
}

function isAuthorized(request: Request): boolean {
  const expected = process.env.MCP_API_TOKEN;
  const supplied = providedToken(request);
  if (!expected || !supplied) return false;

  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  if (expectedBuffer.length !== suppliedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, suppliedBuffer);
}

async function handleMcp(request: Request): Promise<Response> {
  if (!process.env.MCP_API_TOKEN) {
    return jsonResponse(
      { ok: false, error: "mcp_not_configured" },
      503,
    );
  }
  if (!isAuthorized(request)) {
    return jsonResponse(
      { ok: false, error: "unauthorized" },
      401,
      { "WWW-Authenticate": "Bearer" },
    );
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        jsonrpc: "2.0",
        error: { code: -32605, message: "Method not allowed. Use POST for MCP messages." },
        id: null,
      },
      405,
      { Allow: "POST" },
    );
  }

  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    return await transport.handleRequest(request);
  } catch (error) {
    console.error("[mcp] request failed:", error);
    return jsonResponse(
      {
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal MCP error" },
        id: null,
      },
      500,
    );
  } finally {
    await server.close().catch(() => undefined);
  }
}

export const GET = handleMcp;
export const POST = handleMcp;
