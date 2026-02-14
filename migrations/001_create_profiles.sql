-- Table: profiles
-- User profiles, linked to Supabase auth.users

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255),
    avatar_url TEXT,
    google_auth_token JSONB,
    primary_calendar_provider VARCHAR(50),
    timezone VARCHAR(50),
    email_address VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    microsoft_auth_token JSONB,

    CONSTRAINT unique_email UNIQUE (email_address)
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email_address);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_authenticated_profiles"
    ON profiles FOR ALL
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_delete"
    ON profiles FOR DELETE
    USING (auth.uid() = id);

CREATE POLICY "profiles_insert"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_select"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "profiles_select_own"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "profiles_update"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
