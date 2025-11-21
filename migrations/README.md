# Database Migrations

This folder contains SQL migration files for the When event coordination app.

## How to Run Migrations

### Using Supabase Dashboard (Recommended)

1. Log in to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration file you want to run
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

### Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Run a specific migration file
supabase db execute < migrations/001_create_preferred_slots_table.sql
```

## Migration Files

### 001_create_preferred_slots_table.sql
- **Purpose**: Creates the `preferred_slots` table for storing user-selected preferred time slots
- **Date**: 2025-11-07
- **Dependencies**: Requires `profiles` and `events` tables to exist
- **Features**:
  - UUID primary key
  - Foreign keys with CASCADE deletion
  - CHECK constraint for valid time ranges
  - Indexes for performance
  - Row Level Security policies

## Migration Best Practices

1. **Always backup your database** before running migrations in production
2. **Test migrations** on a development database first
3. **Run migrations in order** (001, 002, 003, etc.)
4. **Document changes** in this README when adding new migrations
5. **Never modify existing migration files** after they've been run in production

## Rollback

To rollback the preferred_slots table migration:

```sql
-- Drop policies first
DROP POLICY IF EXISTS "Users can delete their own slots" ON preferred_slots;
DROP POLICY IF EXISTS "Users can update their own slots" ON preferred_slots;
DROP POLICY IF EXISTS "Users can insert their own slots" ON preferred_slots;
DROP POLICY IF EXISTS "Users can view slots for their events" ON preferred_slots;

-- Drop indexes
DROP INDEX IF EXISTS idx_preferred_slots_event;
DROP INDEX IF EXISTS idx_preferred_slots_user_event;

-- Drop table
DROP TABLE IF EXISTS preferred_slots;
```

## Troubleshooting

### Error: relation "profiles" does not exist
Make sure the `profiles` table exists before running this migration.

### Error: relation "events" does not exist
Make sure the `events` table exists before running this migration.

### Permission denied
Ensure you're running the migration with sufficient database privileges (postgres role or service_role).



