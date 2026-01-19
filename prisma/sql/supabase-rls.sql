-- Helper functions for RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() ->> 'role') = 'ADMIN';
$$;

CREATE OR REPLACE FUNCTION public.is_active()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'status') = 'ACTIVE';
$$;

-- Users (app table, not auth.users)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_select_self_or_admin"
  ON "User" FOR SELECT
  USING (public.is_admin() OR id = auth.uid()::text);

CREATE POLICY "user_update_self_or_admin"
  ON "User" FOR UPDATE
  USING (public.is_admin() OR id = auth.uid()::text)
  WITH CHECK (public.is_admin() OR id = auth.uid()::text);

CREATE POLICY "user_insert_admin_only"
  ON "User" FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "user_delete_admin_only"
  ON "User" FOR DELETE
  USING (public.is_admin());

-- Projects
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_select_member_or_admin"
  ON "Project" FOR SELECT
  USING (
    public.is_admin()
    OR "ownerId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM "ProjectMember" pm
      WHERE pm."projectId" = "Project".id AND pm."userId" = auth.uid()::text
    )
  );

CREATE POLICY "project_write_admin_only"
  ON "Project" FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Project members
ALTER TABLE "ProjectMember" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_member_select"
  ON "ProjectMember" FOR SELECT
  USING (
    public.is_admin()
    OR "userId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM "Project" p
      WHERE p.id = "ProjectMember"."projectId" AND p."ownerId" = auth.uid()::text
    )
  );

CREATE POLICY "project_member_write_admin_or_owner"
  ON "ProjectMember" FOR ALL
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM "Project" p
      WHERE p.id = "ProjectMember"."projectId" AND p."ownerId" = auth.uid()::text
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM "Project" p
      WHERE p.id = "ProjectMember"."projectId" AND p."ownerId" = auth.uid()::text
    )
  );

-- Tasks
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_select_assignee_or_admin"
  ON "Task" FOR SELECT
  USING (
    public.is_admin()
    OR "assigneeId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM "Project" p
      WHERE p.id = "Task"."projectId" AND p."ownerId" = auth.uid()::text
    )
  );

CREATE POLICY "task_write_admin_only"
  ON "Task" FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Task comments
ALTER TABLE "TaskComment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_comment_select"
  ON "TaskComment" FOR SELECT
  USING (
    public.is_admin()
    OR "authorId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM "Task" t
      WHERE t.id = "TaskComment"."taskId" AND t."assigneeId" = auth.uid()::text
    )
  );

CREATE POLICY "task_comment_write"
  ON "TaskComment" FOR INSERT
  WITH CHECK (public.is_admin() OR "authorId" = auth.uid()::text);

CREATE POLICY "task_comment_update"
  ON "TaskComment" FOR UPDATE
  USING (public.is_admin() OR "authorId" = auth.uid()::text)
  WITH CHECK (public.is_admin() OR "authorId" = auth.uid()::text);

-- Task history
ALTER TABLE "TaskHistory" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_history_select"
  ON "TaskHistory" FOR SELECT
  USING (
    public.is_admin()
    OR "actorId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM "Task" t
      WHERE t.id = "TaskHistory"."taskId" AND t."assigneeId" = auth.uid()::text
    )
  );

CREATE POLICY "task_history_insert_admin_only"
  ON "TaskHistory" FOR INSERT
  WITH CHECK (public.is_admin());

-- Events
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_select_participant_or_admin"
  ON "Event" FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM "EventParticipant" ep
      WHERE ep."eventId" = "Event".id AND ep."userId" = auth.uid()::text
    )
  );

CREATE POLICY "event_write_admin_only"
  ON "Event" FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Event participants
ALTER TABLE "EventParticipant" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_participant_select"
  ON "EventParticipant" FOR SELECT
  USING (public.is_admin() OR "userId" = auth.uid()::text);

CREATE POLICY "event_participant_write_admin_only"
  ON "EventParticipant" FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Notes
ALTER TABLE "Note" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "note_select"
  ON "Note" FOR SELECT
  USING (
    public.is_admin()
    OR "authorId" = auth.uid()::text
    OR (scope = 'SHARED')
    OR EXISTS (
      SELECT 1 FROM "Project" p
      WHERE p.id = "Note"."projectId" AND p."ownerId" = auth.uid()::text
    )
  );

CREATE POLICY "note_write_self_or_admin"
  ON "Note" FOR ALL
  USING (public.is_admin() OR "authorId" = auth.uid()::text)
  WITH CHECK (public.is_admin() OR "authorId" = auth.uid()::text);

-- Reports
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report_select_author_or_admin"
  ON "Report" FOR SELECT
  USING (public.is_admin() OR "authorId" = auth.uid()::text);

CREATE POLICY "report_write_author_or_admin"
  ON "Report" FOR ALL
  USING (public.is_admin() OR "authorId" = auth.uid()::text)
  WITH CHECK (public.is_admin() OR "authorId" = auth.uid()::text);

-- Report comments
ALTER TABLE "ReportComment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report_comment_select"
  ON "ReportComment" FOR SELECT
  USING (public.is_admin() OR "authorId" = auth.uid()::text);

CREATE POLICY "report_comment_write"
  ON "ReportComment" FOR ALL
  USING (public.is_admin() OR "authorId" = auth.uid()::text)
  WITH CHECK (public.is_admin() OR "authorId" = auth.uid()::text);

-- Notifications
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_select_self"
  ON "Notification" FOR SELECT
  USING (public.is_admin() OR "userId" = auth.uid()::text);

CREATE POLICY "notification_write_admin_only"
  ON "Notification" FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Stars & bonuses
ALTER TABLE "StarTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bonus" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "star_select_self_or_admin"
  ON "StarTransaction" FOR SELECT
  USING (public.is_admin() OR "userId" = auth.uid()::text);

CREATE POLICY "star_write_admin_only"
  ON "StarTransaction" FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "bonus_select_self_or_admin"
  ON "Bonus" FOR SELECT
  USING (public.is_admin() OR "userId" = auth.uid()::text);

CREATE POLICY "bonus_write_admin_only"
  ON "Bonus" FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Work sessions (horarios)
ALTER TABLE "WorkSession" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_session_select_self_or_admin"
  ON "WorkSession" FOR SELECT
  USING (public.is_admin() OR "userId" = auth.uid()::text);

CREATE POLICY "work_session_write_self_or_admin"
  ON "WorkSession" FOR ALL
  USING (public.is_admin() OR "userId" = auth.uid()::text)
  WITH CHECK (public.is_admin() OR "userId" = auth.uid()::text);

-- Audit logs (admin only)
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_admin_only"
  ON "AuditLog" FOR SELECT
  USING (public.is_admin());
