-- Migration: Create calendar_accounts and calendar_sources tables
-- Description: Multi-calendar support - store OAuth credentials per provider account and individual calendars
-- Date: 2025-01-31

-- =============================================================================
-- TABLE: calendar_accounts
-- Stores OAuth credentials per provider account (e.g., Google)
-- =============================================================================
CREATE TABLE IF NOT EXISTS calendar_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'google',
    provider_email VARCHAR(255) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    credentials JSONB NOT NULL,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_synced_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT unique_user_provider_account UNIQUE (user_id, provider, provider_account_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_accounts_user_id ON calendar_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_accounts_provider ON calendar_accounts(provider);

-- Enable Row Level Security
ALTER TABLE calendar_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own accounts
CREATE POLICY "Users can view their own calendar accounts"
    ON calendar_accounts FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own accounts
CREATE POLICY "Users can insert their own calendar accounts"
    ON calendar_accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own accounts
CREATE POLICY "Users can update their own calendar accounts"
    ON calendar_accounts FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own accounts
CREATE POLICY "Users can delete their own calendar accounts"
    ON calendar_accounts FOR DELETE
    USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE calendar_accounts IS 'Stores OAuth credentials for each connected calendar provider account';
COMMENT ON COLUMN calendar_accounts.user_id IS 'Reference to the user who owns this account';
COMMENT ON COLUMN calendar_accounts.provider IS 'Calendar provider (google, outlook, etc.)';
COMMENT ON COLUMN calendar_accounts.provider_email IS 'Email address associated with the provider account';
COMMENT ON COLUMN calendar_accounts.provider_account_id IS 'Unique identifier from the provider';
COMMENT ON COLUMN calendar_accounts.credentials IS 'OAuth credentials stored as JSONB';
COMMENT ON COLUMN calendar_accounts.connected_at IS 'When the account was first connected';
COMMENT ON COLUMN calendar_accounts.last_synced_at IS 'When calendars were last synced from provider';

-- =============================================================================
-- TABLE: calendar_sources
-- Individual calendars within each account
-- =============================================================================
CREATE TABLE IF NOT EXISTS calendar_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES calendar_accounts(id) ON DELETE CASCADE,
    calendar_id VARCHAR(255) NOT NULL,
    calendar_name VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    is_write_calendar BOOLEAN DEFAULT FALSE,
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_account_calendar UNIQUE (account_id, calendar_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_sources_account_id ON calendar_sources(account_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sources_enabled ON calendar_sources(is_enabled) WHERE is_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_calendar_sources_write ON calendar_sources(is_write_calendar) WHERE is_write_calendar = TRUE;

-- Enable Row Level Security
ALTER TABLE calendar_sources ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view sources for their own accounts
CREATE POLICY "Users can view their own calendar sources"
    ON calendar_sources FOR SELECT
    USING (
        account_id IN (
            SELECT id FROM calendar_accounts WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can insert sources for their own accounts
CREATE POLICY "Users can insert their own calendar sources"
    ON calendar_sources FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT id FROM calendar_accounts WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update sources for their own accounts
CREATE POLICY "Users can update their own calendar sources"
    ON calendar_sources FOR UPDATE
    USING (
        account_id IN (
            SELECT id FROM calendar_accounts WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can delete sources for their own accounts
CREATE POLICY "Users can delete their own calendar sources"
    ON calendar_sources FOR DELETE
    USING (
        account_id IN (
            SELECT id FROM calendar_accounts WHERE user_id = auth.uid()
        )
    );

-- Comments for documentation
COMMENT ON TABLE calendar_sources IS 'Individual calendars within each connected provider account';
COMMENT ON COLUMN calendar_sources.account_id IS 'Reference to the calendar account';
COMMENT ON COLUMN calendar_sources.calendar_id IS 'Calendar ID from the provider (e.g., primary, email@gmail.com)';
COMMENT ON COLUMN calendar_sources.calendar_name IS 'Display name of the calendar';
COMMENT ON COLUMN calendar_sources.is_enabled IS 'Whether to sync busy times from this calendar';
COMMENT ON COLUMN calendar_sources.is_write_calendar IS 'Whether to create events on this calendar when finalizing';
COMMENT ON COLUMN calendar_sources.color IS 'Calendar color from provider';

-- =============================================================================
-- ALTER TABLE: busy_slots
-- Add calendar_source_id to track which calendar source a busy slot came from
-- =============================================================================
ALTER TABLE busy_slots
ADD COLUMN IF NOT EXISTS calendar_source_id UUID REFERENCES calendar_sources(id) ON DELETE SET NULL;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_busy_slots_calendar_source ON busy_slots(calendar_source_id);

-- Comment for documentation
COMMENT ON COLUMN busy_slots.calendar_source_id IS 'Reference to the calendar source this busy slot was synced from';

-- =============================================================================
-- TRIGGER: Update updated_at on calendar_sources
-- =============================================================================
CREATE OR REPLACE FUNCTION update_calendar_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_calendar_sources_updated_at
    BEFORE UPDATE ON calendar_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_sources_updated_at();
