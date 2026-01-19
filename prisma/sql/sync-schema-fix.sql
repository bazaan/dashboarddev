-- Ensure Project table exists with text ownerId
CREATE TABLE IF NOT EXISTS "Project" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "brief" TEXT,
  "detailedBrief" TEXT,
  "drivePromptsUrl" TEXT,
  "driveN8nFlowUrl" TEXT,
  "driveDashboardUrl" TEXT,
  "ownerId" TEXT NOT NULL,
  "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fix ownerId type if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Project'
      AND column_name = 'ownerId'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE "Project"
      ALTER COLUMN "ownerId" TYPE TEXT USING "ownerId"::text;
  END IF;
END $$;

-- Task table adjustments (projectId as text)
ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "projectId" TEXT,
  ADD COLUMN IF NOT EXISTS "recurrenceType" "RecurrenceType";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Task'
      AND column_name = 'projectId'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE "Task"
      ALTER COLUMN "projectId" TYPE TEXT USING "projectId"::text;
  END IF;
END $$;

-- Event table adjustments (projectId as text)
ALTER TABLE "Event"
  ADD COLUMN IF NOT EXISTS "progress" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "projectId" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Event'
      AND column_name = 'projectId'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE "Event"
      ALTER COLUMN "projectId" TYPE TEXT USING "projectId"::text;
  END IF;
END $$;

-- Foreign keys with text ids
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
