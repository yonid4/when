import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

print(f"URL: {SUPABASE_URL}")
print(f"Service Key Present: {bool(SUPABASE_SERVICE_ROLE_KEY)}")
print(f"Anon Key Present: {bool(SUPABASE_ANON_KEY)}")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Missing credentials")
    exit(1)

# Create service role client
service_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Create anon client
anon_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

USER_ID = "c380463a-b093-4959-b3b6-e585f500f39d"

print("\n--- Testing Service Role Client ---")
try:
    result = (
        service_client.table("event_participants")
        .select("event_id")
        .eq("user_id", USER_ID)
        .execute()
    )
    print("Success!")
    print(f"Data: {result.data}")
except Exception as e:
    print(f"Failed: {e}")

print("\n--- Testing Anon Client (should fail if RLS blocks or recurse) ---")
try:
    # Note: Anon client without auth usually sees nothing or fails RLS
    result = (
        anon_client.table("event_participants")
        .select("event_id")
        .eq("user_id", USER_ID)
        .execute()
    )
    print("Success (Unexpected if RLS is strict)!")
    print(f"Data: {result.data}")
except Exception as e:
    print(f"Failed (Expected): {e}")
