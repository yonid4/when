-- Master script to create all database tables
-- Run this script to set up the complete database schema
-- Tables are created in dependency order to avoid foreign key constraint issues

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create all tables in dependency order
\i 01_create_profiles_table.sql
\i 02_create_events_table.sql
\i 03_create_event_participants_table.sql
\i 04_create_availability_slots_table.sql
\i 05_create_user_event_preferences_table.sql

-- Display completion message
SELECT 'All database tables created successfully!' as status;
