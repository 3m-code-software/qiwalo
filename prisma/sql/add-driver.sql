-- Batches/السائقين: يُنفَّذ يدوياً في Supabase عند طلب النشر الإنتاجي فقط.
-- لا يُنفَّذ في Mock، ولا يغيّر أي بيانات حالية.

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DRIVER';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DriverSubscriptionStatus') THEN
    CREATE TYPE "DriverSubscriptionStatus" AS ENUM ('NONE', 'PENDING', 'ACTIVE', 'EXPIRED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "DriverProfile" (
  "id"                   TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "userId"               TEXT        NOT NULL UNIQUE,
  "city"                 "City"      NOT NULL,
  "subscriptionStatus"   "DriverSubscriptionStatus" NOT NULL DEFAULT 'PENDING',
  "verificationStatus"   "VerificationStatus"       NOT NULL DEFAULT 'PENDING',
  "idFront"              TEXT        NOT NULL,
  "idBack"               TEXT        NOT NULL,
  "licenseDocUrl"        TEXT        NOT NULL,
  "note"                 TEXT,
  "submittedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt"           TIMESTAMP(3),
  CONSTRAINT "DriverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Vehicle" (
  "id"             TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "driverId"       TEXT        NOT NULL,
  "name"           TEXT        NOT NULL,
  "type"           "TransportType" NOT NULL DEFAULT 'CAR',
  "city"           "City"      NOT NULL,
  "plateNumber"    TEXT        NOT NULL,
  "model"          TEXT        NOT NULL,
  "capacity"       INTEGER     NOT NULL,
  "pricePerTrip"   INTEGER     NOT NULL,
  "routeFrom"      TEXT        NOT NULL,
  "routeTo"        TEXT        NOT NULL,
  "meetingPoint"   TEXT        NOT NULL,
  "durationHours"  INTEGER     NOT NULL,
  "includes"       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  "cancelPolicy"   TEXT        NOT NULL,
  "licenseDocUrl"  TEXT        NOT NULL,
  "status"         "ModerationStatus" NOT NULL DEFAULT 'PENDING',
  "commissionRate" INTEGER     NOT NULL DEFAULT 12,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "blockedDates"   JSONB       NOT NULL DEFAULT '[]'::jsonb,
  "isPaused"       BOOLEAN     NOT NULL DEFAULT false,
  CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "DriverProfile_verificationStatus_subscriptionStatus_idx"
  ON "DriverProfile"("verificationStatus", "subscriptionStatus");
CREATE INDEX IF NOT EXISTS "Vehicle_driverId_status_idx" ON "Vehicle"("driverId", "status");
CREATE INDEX IF NOT EXISTS "Vehicle_city_status_idx" ON "Vehicle"("city", "status");
