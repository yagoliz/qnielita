-- API role grants.
--
-- The Supabase CLI applies migrations as the `postgres` role. The default
-- privileges attached to `postgres` in the `public` schema only grant
-- TRUNCATE/REFERENCES/TRIGGER to the API roles (anon, authenticated,
-- service_role) -- not SELECT/INSERT/UPDATE/DELETE. As a result, every table
-- created by a migration is unreadable/unwritable through PostgREST, which
-- runs as those roles. This surfaces as "permission denied for table ..."
-- (SQLSTATE 42501) for both the app and admin scripts.
--
-- On hosted Supabase these privileges come from the `supabase_admin` default
-- ACL, so this migration is idempotent there. RLS remains the security
-- boundary: anon/authenticated still only see/modify rows their policies allow;
-- service_role intentionally bypasses RLS.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Existing objects (created by migrations 00001-00006).
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Future objects created by `postgres` (the migration runner).
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
