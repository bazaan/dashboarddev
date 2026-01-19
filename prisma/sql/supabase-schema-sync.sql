-- Base extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums (create if missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
    CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'BLOCKED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TaskCadence') THEN
    CREATE TYPE "TaskCadence" AS ENUM ('DAILY', 'WEEKLY');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TaskHistoryAction') THEN
    CREATE TYPE "TaskHistoryAction" AS ENUM ('CREATE', 'UPDATE', 'UPDATE_STATUS', 'UPDATE_PRIORITY', 'ASSIGN', 'COMPLETE', 'APPROVE');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NoteScope') THEN
    CREATE TYPE "NoteScope" AS ENUM ('PERSONAL', 'PROJECT', 'SHARED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReportType') THEN
    CREATE TYPE "ReportType" AS ENUM ('DAILY', 'WEEKLY');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReportStatus') THEN
    CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationLevel') THEN
    CREATE TYPE "NotificationLevel" AS ENUM ('INFO', 'WARNING', 'CRITICAL');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BonusStatus') THEN
    CREATE TYPE "BonusStatus" AS ENUM ('PENDING', 'ACTIVE', 'CLAIMED', 'EXPIRED');
  END IF;
END $$;

-- Ensure NOT_STARTED exists in Status enum
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

-- User additions
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "approvedById" TEXT,
  ADD COLUMN IF NOT EXISTS "blockedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "starsBalance" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "bonusesBalance" INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'User_approvedById_fkey'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_approvedById_fkey"
      FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Task additions
ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "cadence" "TaskCadence",
  ADD COLUMN IF NOT EXISTS "timeEstimateMins" INTEGER,
  ADD COLUMN IF NOT EXISTS "timeSpentMins" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "starsAwarded" INTEGER,
  ADD COLUMN IF NOT EXISTS "approvedById" TEXT,
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Task_approvedById_fkey'
  ) THEN
    ALTER TABLE "Task"
      ADD CONSTRAINT "Task_approvedById_fkey"
      FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Project additions
ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "progress" INTEGER NOT NULL DEFAULT 0;

-- ProjectMember
CREATE TABLE IF NOT EXISTS "ProjectMember" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ProjectMember_projectId_fkey'
  ) THEN
    ALTER TABLE "ProjectMember"
      ADD CONSTRAINT "ProjectMember_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ProjectMember_userId_fkey'
  ) THEN
    ALTER TABLE "ProjectMember"
      ADD CONSTRAINT "ProjectMember_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- EventParticipant
CREATE TABLE IF NOT EXISTS "EventParticipant" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'EventParticipant_eventId_fkey'
  ) THEN
    ALTER TABLE "EventParticipant"
      ADD CONSTRAINT "EventParticipant_eventId_fkey"
      FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'EventParticipant_userId_fkey'
  ) THEN
    ALTER TABLE "EventParticipant"
      ADD CONSTRAINT "EventParticipant_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- TaskComment
CREATE TABLE IF NOT EXISTS "TaskComment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "taskId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TaskComment_taskId_fkey'
  ) THEN
    ALTER TABLE "TaskComment"
      ADD CONSTRAINT "TaskComment_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TaskComment_authorId_fkey'
  ) THEN
    ALTER TABLE "TaskComment"
      ADD CONSTRAINT "TaskComment_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- TaskHistory
CREATE TABLE IF NOT EXISTS "TaskHistory" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "taskId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" "TaskHistoryAction" NOT NULL,
  "fromStatus" "Status",
  "toStatus" "Status",
  "details" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TaskHistory_taskId_fkey'
  ) THEN
    ALTER TABLE "TaskHistory"
      ADD CONSTRAINT "TaskHistory_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TaskHistory_actorId_fkey'
  ) THEN
    ALTER TABLE "TaskHistory"
      ADD CONSTRAINT "TaskHistory_actorId_fkey"
      FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Note
CREATE TABLE IF NOT EXISTS "Note" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "scope" "NoteScope" NOT NULL DEFAULT 'PERSONAL',
  "projectId" TEXT,
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Note_projectId_fkey'
  ) THEN
    ALTER TABLE "Note"
      ADD CONSTRAINT "Note_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Note_authorId_fkey'
  ) THEN
    ALTER TABLE "Note"
      ADD CONSTRAINT "Note_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Report
CREATE TABLE IF NOT EXISTS "Report" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "type" "ReportType" NOT NULL DEFAULT 'DAILY',
  "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
  "authorId" TEXT NOT NULL,
  "resolverId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Report_authorId_fkey'
  ) THEN
    ALTER TABLE "Report"
      ADD CONSTRAINT "Report_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Report_resolverId_fkey'
  ) THEN
    ALTER TABLE "Report"
      ADD CONSTRAINT "Report_resolverId_fkey"
      FOREIGN KEY ("resolverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ReportComment
CREATE TABLE IF NOT EXISTS "ReportComment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "reportId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ReportComment_reportId_fkey'
  ) THEN
    ALTER TABLE "ReportComment"
      ADD CONSTRAINT "ReportComment_reportId_fkey"
      FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ReportComment_authorId_fkey'
  ) THEN
    ALTER TABLE "ReportComment"
      ADD CONSTRAINT "ReportComment_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Notification
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "level" "NotificationLevel" NOT NULL DEFAULT 'INFO',
  "readAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Notification_userId_fkey'
  ) THEN
    ALTER TABLE "Notification"
      ADD CONSTRAINT "Notification_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- StarTransaction
CREATE TABLE IF NOT EXISTS "StarTransaction" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "taskId" TEXT,
  "stars" INTEGER NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'StarTransaction_userId_fkey'
  ) THEN
    ALTER TABLE "StarTransaction"
      ADD CONSTRAINT "StarTransaction_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'StarTransaction_taskId_fkey'
  ) THEN
    ALTER TABLE "StarTransaction"
      ADD CONSTRAINT "StarTransaction_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Bonus
CREATE TABLE IF NOT EXISTS "Bonus" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" "BonusStatus" NOT NULL DEFAULT 'PENDING',
  "earnedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "claimedAt" TIMESTAMPTZ
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Bonus_userId_fkey'
  ) THEN
    ALTER TABLE "Bonus"
      ADD CONSTRAINT "Bonus_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
