-- Table: calendar_sources
-- Individual calendars within each connected provider account
-- Depends on: calendar_accounts

CREATE TABLE IF NOT EXISTS calendar_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES calendar_accounts(id) ON DELETE CASCADE,
    calendar_id VARCHAR(255) NOT NULL,
    calendar_name VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    is_write_calendar BOOLEAN DEFAULT FALSE,
    color VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_account_calendar UNIQUE (account_id, calendar_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_sources_account_id ON calendar_sources(account_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sources_enabled ON calendar_sources(is_enabled) WHERE is_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_calendar_sources_write ON calendar_sources(is_write_calendar) WHERE is_write_calendar = TRUE;

ALTER TABLE calendar_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calendar sources"
    ON calendar_sources FOR SELECT
    USING (account_id IN (SELECT id FROM calendar_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own calendar sources"
    ON calendar_sources FOR INSERT
    WITH CHECK (account_id IN (SELECT id FROM calendar_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own calendar sources"
    ON calendar_sources FOR UPDATE
    USING (account_id IN (SELECT id FROM calendar_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own calendar sources"
    ON calendar_sources FOR DELETE
    USING (account_id IN (SELECT id FROM calendar_accounts WHERE user_id = auth.uid()));

-- Trigger: auto-update updated_at
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
