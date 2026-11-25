-- يُنفَّذ مرة واحدة في Supabase SQL Editor عند تفعيل الباقات في الإنتاج.
-- يفترض تنفيذ add-mountain-safari.sql و add-transport.sql أولاً. Mock لا يحتاجه؛ البيانات في الذاكرة فقط.
-- الباقة تجمع وحدة + نقل + تجربة بسعر واحد لكل ليلة.

CREATE TABLE IF NOT EXISTS "Package" (
  "id"              TEXT               NOT NULL DEFAULT cuid(),
  "ownerId"         TEXT               NOT NULL,
  "name"            TEXT               NOT NULL,
  "city"            "City"             NOT NULL,
  "propertyId"      TEXT               NOT NULL,
  "experienceId"    TEXT               NOT NULL,
  "transportId"     TEXT               NOT NULL,
  "capacity"        INTEGER            NOT NULL,
  "pricePerNight"   INTEGER            NOT NULL,
  "includes"        JSONB              NOT NULL DEFAULT '[]'::jsonb,
  "cancelPolicy"    TEXT               NOT NULL,
  "licenseDocUrl"   TEXT               NOT NULL,
  "status"          "ModerationStatus" NOT NULL DEFAULT 'PENDING',
  "commissionRate"  INTEGER            NOT NULL DEFAULT 12,
  "createdAt"       TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Package_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Package_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Package_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Package_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Package_transportId_fkey" FOREIGN KEY ("transportId") REFERENCES "Transport"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Package_city_status_idx" ON "Package"("city", "status");
CREATE INDEX IF NOT EXISTS "Package_ownerId_status_idx" ON "Package"("ownerId", "status");

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "packageDetail" JSONB;
