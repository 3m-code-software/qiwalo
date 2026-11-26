-- يُنفَّذ مرة واحدة في Supabase SQL Editor عند تفعيل النقل في الإنتاج.
-- يفترض تنفيذ add-mountain-safari.sql أولاً. Mock لا يحتاجه؛ البيانات في الذاكرة فقط.

DO $$ BEGIN
  CREATE TYPE "TransportType" AS ENUM ('CAR', 'COASTER', 'BUS', 'MOTORCYCLE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Transport" (
  "id"              TEXT            NOT NULL DEFAULT gen_random_uuid()::text,
  "ownerId"         TEXT            NOT NULL,
  "name"            TEXT            NOT NULL,
  "type"            "TransportType" NOT NULL DEFAULT 'CAR',
  "city"            "City"          NOT NULL,
  "routeFrom"       TEXT            NOT NULL,
  "routeTo"         TEXT            NOT NULL,
  "meetingPoint"    TEXT            NOT NULL,
  "durationHours"   INTEGER         NOT NULL,
  "capacity"        INTEGER         NOT NULL,
  "pricePerTrip"    INTEGER         NOT NULL,
  "includes"        JSONB           NOT NULL DEFAULT '[]'::jsonb,
  "cancelPolicy"    TEXT            NOT NULL,
  "licenseDocUrl"   TEXT            NOT NULL,
  "status"          "ModerationStatus" NOT NULL DEFAULT 'PENDING',
  "commissionRate"  INTEGER         NOT NULL DEFAULT 12,
  "createdAt"       TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Transport_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Transport_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Transport_city_status_idx" ON "Transport"("city", "status");
CREATE INDEX IF NOT EXISTS "Transport_ownerId_status_idx" ON "Transport"("ownerId", "status");

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "transport" JSONB;
