-- Migration: Migrate existing Google auth data to calendar_accounts
-- Description: Moves existing profiles.google_auth_token to calendar_accounts and creates initial calendar_sources
-- Date: 2025-01-31
-- Note: profiles.google_auth_token is kept for rollback safety

-- =============================================================================
-- MIGRATION: Move existing Google credentials to calendar_accounts
-- =============================================================================

-- Insert existing Google auth tokens into calendar_accounts
-- Only for users who have google_auth_token set
INSERT INTO calendar_accounts (
    user_id,
    provider,
    provider_email,
    provider_account_id,
    credentials,
    connected_at,
    last_synced_at
)
SELECT
    p.id AS user_id,
    'google' AS provider,
    -- Use google_calendar_id as email if available, otherwise use a placeholder
    COALESCE(p.google_calendar_id, p.email, 'unknown@gmail.com') AS provider_email,
    -- Use google_calendar_id as account ID (typically the primary calendar email)
    COALESCE(p.google_calendar_id, p.email, p.id::text) AS provider_account_id,
    p.google_auth_token AS credentials,
    p.updated_at AS connected_at,
    NOW() AS last_synced_at
FROM profiles p
WHERE p.google_auth_token IS NOT NULL
  AND p.google_auth_token != 'null'::jsonb
  AND NOT EXISTS (
    -- Don't duplicate if already migrated
    SELECT 1 FROM calendar_accounts ca
    WHERE ca.user_id = p.id AND ca.provider = 'google'
  );

-- =============================================================================
-- Create primary calendar source for each migrated account
-- =============================================================================

INSERT INTO calendar_sources (
    account_id,
    calendar_id,
    calendar_name,
    is_enabled,
    is_write_calendar,
    color
)
SELECT
    ca.id AS account_id,
    'primary' AS calendar_id,
    'Primary Calendar' AS calendar_name,
    TRUE AS is_enabled,
    TRUE AS is_write_calendar,
    '#4285F4' AS color  -- Google blue
FROM calendar_accounts ca
WHERE NOT EXISTS (
    -- Don't duplicate if already has a primary calendar source
    SELECT 1 FROM calendar_sources cs
    WHERE cs.account_id = ca.id AND cs.calendar_id = 'primary'
);

-- =============================================================================
-- ROLLBACK INSTRUCTIONS (manual):
-- =============================================================================
-- To rollback this migration:
-- 1. DELETE FROM calendar_sources WHERE calendar_id = 'primary';
-- 2. DELETE FROM calendar_accounts WHERE provider = 'google';
-- Note: The profiles.google_auth_token column is intentionally NOT dropped
--       to allow rollback. It can be dropped in a future migration once
--       the new system is verified working.
