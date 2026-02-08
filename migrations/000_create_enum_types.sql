-- Enum types used across the schema

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type_enum') THEN
    CREATE TYPE event_type_enum AS ENUM ('meeting', 'social', 'birthday', 'other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'participant_rsvp_status_enum') THEN
    CREATE TYPE participant_rsvp_status_enum AS ENUM ('going', 'maybe', 'not_going');
  END IF;
END $$;
