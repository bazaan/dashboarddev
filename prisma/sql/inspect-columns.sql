SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('Project', 'Task', 'ProjectMember', 'Event', 'EventParticipant', 'Note', 'Report', 'ReportComment', 'TaskComment', 'TaskHistory', 'Notification', 'StarTransaction', 'Bonus', 'User')
ORDER BY table_name, ordinal_position;
