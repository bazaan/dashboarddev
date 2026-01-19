-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RecurrenceType') THEN
    CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'DAILY', 'WEEKLY');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProjectStatus') THEN
    CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'Status' AND e.enumlabel = 'NOT_STARTED'
  ) THEN
    ALTER TYPE "Status" ADD VALUE 'NOT_STARTED';
  END IF;
END $$;

-- Project table
CREATE TABLE IF NOT EXISTS "Project" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "brief" TEXT,
  "detailedBrief" TEXT,
  "drivePromptsUrl" TEXT,
  "driveN8nFlowUrl" TEXT,
  "driveDashboardUrl" TEXT,
  "ownerId" UUID NOT NULL,
  "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Project_ownerId_fkey'
  ) THEN
    ALTER TABLE "Project"
      ADD CONSTRAINT "Project_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Task table adjustments
ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "projectId" UUID,
  ADD COLUMN IF NOT EXISTS "recurrenceType" "RecurrenceType";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Task_projectId_fkey'
  ) THEN
    ALTER TABLE "Task"
      ADD CONSTRAINT "Task_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Task"
  ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';

-- Event table adjustments
ALTER TABLE "Event"
  ADD COLUMN IF NOT EXISTS "progress" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "projectId" UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Event_projectId_fkey'
  ) THEN
    ALTER TABLE "Event"
      ADD CONSTRAINT "Event_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
