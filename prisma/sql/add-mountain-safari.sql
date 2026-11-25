-- يُنفَّذ مرة واحدة في Supabase SQL Editor عند تفعيل سفاري الجبال في الإنتاج.
-- Mock لا يحتاجه؛ البيانات في الذاكرة فقط.

DO $$ BEGIN
  CREATE TYPE "ExperienceCategory" AS ENUM ('MOUNTAIN_SAFARI');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ExperienceDifficulty" AS ENUM ('EASY', 'MODERATE', 'HARD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Experience" (
  "id"             TEXT        NOT NULL DEFAULT cuid(),
  "ownerId"        TEXT        NOT NULL,
  "name"           TEXT        NOT NULL,
  "category"       "ExperienceCategory" NOT NULL DEFAULT 'MOUNTAIN_SAFARI',
  "city"           "City"      NOT NULL,
  "mountain"       TEXT        NOT NULL,
  "meetingPoint"   TEXT        NOT NULL,
  "durationHours"  INTEGER     NOT NULL,
  "capacity"       INTEGER     NOT NULL,
  "pricePerPerson" INTEGER     NOT NULL,
  "includes"       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  "difficulty"     "ExperienceDifficulty" NOT NULL DEFAULT 'MODERATE',
  "bestSeason"     TEXT        NOT NULL,
  "cancelPolicy"   TEXT        NOT NULL,
  "licenseDocUrl"  TEXT        NOT NULL,
  "status"         "ModerationStatus" NOT NULL DEFAULT 'PENDING',
  "commissionRate" INTEGER     NOT NULL DEFAULT 12,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Experience_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Experience_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Experience_city_status_idx" ON "Experience"("city", "status");
CREATE INDEX IF NOT EXISTS "Experience_ownerId_status_idx" ON "Experience"("ownerId", "status");

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "experience" JSONB;
