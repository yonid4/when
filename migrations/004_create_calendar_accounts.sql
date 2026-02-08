-- Table: calendar_accounts
-- OAuth credentials per provider account (Google, Microsoft, etc.)
-- Depends on: profiles

CREATE TABLE IF NOT EXISTS calendar_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'google',
    provider_email VARCHAR(255) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    credentials JSONB NOT NULL,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,

    CONSTRAINT unique_user_provider_account UNIQUE (user_id, provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_accounts_user_id ON calendar_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_accounts_provider ON calendar_accounts(provider);

ALTER TABLE calendar_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calendar accounts"
    ON calendar_accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar accounts"
    ON calendar_accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar accounts"
    ON calendar_accounts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar accounts"
    ON calendar_accounts FOR DELETE
    USING (auth.uid() = user_id);
