-- Create profiles table
-- This table stores user profile information including authentication and preferences

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255),
    avatar_url TEXT,
    google_auth_token JSONB,  -- For storing OAuth tokens securely
    google_calendar_id VARCHAR(255),
    timezone VARCHAR(50),
    email_address VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email_address);
CREATE INDEX IF NOT EXISTS idx_profiles_google_calendar_id ON profiles(google_calendar_id);

-- Add data validation constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_email_format' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT check_email_format 
        CHECK (email_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_full_name_length' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT check_full_name_length 
        CHECK (LENGTH(full_name) >= 2 AND LENGTH(full_name) <= 255);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_avatar_url_format' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT check_avatar_url_format 
        CHECK (avatar_url IS NULL OR avatar_url ~* '^https?://.*');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_timezone_valid' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT check_timezone_valid 
        CHECK (timezone IS NULL OR timezone ~* '^[A-Za-z_/]+$');
    END IF;
END $$;

-- Add unique constraint for email (business rule: one account per email)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_email' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT unique_email UNIQUE (email_address);
    END IF;
END $$;

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE profiles IS 'User profile information including authentication and preferences';
COMMENT ON COLUMN profiles.id IS 'Unique identifier for the user profile';
COMMENT ON COLUMN profiles.full_name IS 'User full name';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user avatar image';
COMMENT ON COLUMN profiles.google_auth_token IS 'Encrypted Google OAuth tokens';
COMMENT ON COLUMN profiles.google_calendar_id IS 'Google Calendar ID for calendar integration';
COMMENT ON COLUMN profiles.timezone IS 'User timezone for proper time handling';
COMMENT ON COLUMN profiles.email_address IS 'User email address (unique identifier)';
COMMENT ON COLUMN profiles.created_at IS 'Timestamp when profile was created';
COMMENT ON COLUMN profiles.updated_at IS 'Timestamp when profile was last updated';
