-- Create WorkStatus enum if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkStatus') THEN
    CREATE TYPE "WorkStatus" AS ENUM ('ACTIVE', 'BREAK', 'ENDED');
  END IF;
END $$;

-- Create WorkSession table if missing
CREATE TABLE IF NOT EXISTS "WorkSession" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "status" "WorkStatus" NOT NULL DEFAULT 'ACTIVE',
  "startedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "breakStart" TIMESTAMPTZ,
  "breakEnd" TIMESTAMPTZ,
  "endedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'WorkSession_userId_fkey'
  ) THEN
    ALTER TABLE "WorkSession"
      ADD CONSTRAINT "WorkSession_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
