-- RLS for WorkSession with conditional policy creation
ALTER TABLE "WorkSession" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'WorkSession' AND policyname = 'work_session_select_self_or_admin'
  ) THEN
    EXECUTE 'CREATE POLICY "work_session_select_self_or_admin" ON "WorkSession" FOR SELECT USING (public.is_admin() OR "userId" = auth.uid()::text)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'WorkSession' AND policyname = 'work_session_write_self_or_admin'
  ) THEN
    EXECUTE 'CREATE POLICY "work_session_write_self_or_admin" ON "WorkSession" FOR ALL USING (public.is_admin() OR "userId" = auth.uid()::text) WITH CHECK (public.is_admin() OR "userId" = auth.uid()::text)';
  END IF;
END $$;
