-- Schema Documentation and Constraints
-- This migration adds comprehensive documentation and constraints
-- to prevent architectural issues like the missing user profile bug

-- ============================================================================
-- DOCUMENTATION: Data Integrity Architecture
-- ============================================================================

COMMENT ON TABLE public.users IS
  'User profiles table. MUST be kept in sync with auth.users.

   CRITICAL: This table is automatically populated by the on_auth_user_created trigger.
   DO NOT manually insert into this table from application code.

   Relationship:
   - auth.users (1) -> public.users (1) [via trigger]
   - public.users (1) -> outfits (many)
   - public.users (1) -> wear_history (many)

   The trigger ensures referential integrity for all downstream tables.';

COMMENT ON TABLE public.outfits IS
  'User outfit collections.

   DEPENDS ON: public.users (via foreign key)

   This table requires a valid user_id that exists in public.users.
   The user profile is automatically created by database trigger,
   so no special handling is needed in application code.';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'CRITICAL: Auto-creates user profile in public.users when auth user is created.

   This trigger is the SINGLE SOURCE OF TRUTH for user profile creation.

   Flow:
   1. User signs up (any method: email, OAuth, magic link, etc.)
   2. Supabase creates record in auth.users
   3. This trigger automatically creates matching record in public.users
   4. Application can now safely create outfits, wear_history, etc.

   DO NOT remove or modify this trigger without understanding the full impact.
   Removing this trigger will break the user profile creation flow.';

-- ============================================================================
-- ADDITIONAL CONSTRAINTS: Defensive Programming
-- ============================================================================

-- Ensure email is always present and valid in public.users
ALTER TABLE public.users
  ADD CONSTRAINT users_email_not_empty
  CHECK (email IS NOT NULL AND LENGTH(TRIM(email)) > 0);

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ============================================================================
-- VALIDATION FUNCTION: Check Data Integrity
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_user_data_integrity()
RETURNS TABLE(
  issue_type TEXT,
  auth_user_id UUID,
  auth_email TEXT,
  public_user_exists BOOLEAN,
  details TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check for auth.users without corresponding public.users
  RETURN QUERY
  SELECT
    'MISSING_PUBLIC_USER'::TEXT as issue_type,
    au.id as auth_user_id,
    au.email as auth_email,
    (pu.id IS NOT NULL) as public_user_exists,
    'Auth user exists but no corresponding public.users record. This should never happen with the trigger in place.'::TEXT as details
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL;

  -- Check for public.users without corresponding auth.users (orphaned records)
  RETURN QUERY
  SELECT
    'ORPHANED_PUBLIC_USER'::TEXT as issue_type,
    pu.id as auth_user_id,
    pu.email as auth_email,
    TRUE as public_user_exists,
    'Public user exists but no corresponding auth.users record. This indicates data corruption.'::TEXT as details
  FROM public.users pu
  LEFT JOIN auth.users au ON pu.id = au.id
  WHERE au.id IS NULL;
END;
$$;

COMMENT ON FUNCTION public.validate_user_data_integrity() IS
  'Diagnostic function to check for data integrity issues between auth.users and public.users.

   Usage:
     SELECT * FROM validate_user_data_integrity();

   Expected result: No rows (empty table) means everything is healthy.
   If rows are returned, it indicates a data integrity problem that needs investigation.';

-- ============================================================================
-- HEALTH CHECK: Run validation immediately
-- ============================================================================

-- Run validation and store result
DO $$
DECLARE
  issue_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO issue_count
  FROM public.validate_user_data_integrity();

  IF issue_count > 0 THEN
    RAISE WARNING 'Data integrity issues detected. Run: SELECT * FROM validate_user_data_integrity();';
  ELSE
    RAISE NOTICE 'Data integrity check passed. All users are properly synchronized.';
  END IF;
END $$;
