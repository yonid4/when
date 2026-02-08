-- Add Microsoft calendar event columns to events table for multi-provider finalization support

ALTER TABLE events ADD COLUMN IF NOT EXISTS microsoft_calendar_event_id TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS microsoft_calendar_html_link TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS calendar_provider VARCHAR(50);

-- Back-fill existing finalized events that used Google Calendar
UPDATE events SET calendar_provider = 'google'
WHERE status = 'finalized' AND google_calendar_event_id IS NOT NULL AND calendar_provider IS NULL;
