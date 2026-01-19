SELECT
  c.table_name,
  c.column_name,
  c.data_type,
  c.udt_name
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN ('Task', 'Project')
ORDER BY c.table_name, c.ordinal_position;

SELECT
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('Status', 'Priority', 'RecurrenceType', 'ProjectStatus', 'EventType', 'Role', 'AuditAction')
ORDER BY t.typname, e.enumsortorder;
