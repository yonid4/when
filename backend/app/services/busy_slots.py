"""
Busy slots service.

Key behaviors:
- All times are treated as UTC ISO strings when stored/fetched from Supabase.
- Google Calendar sync skips all-day events and upserts by (user_id, google_event_id).
- Merged-busy computation prefers a Supabase RPC; falls back to Python if RPC fails.
"""

import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from supabase import create_client

from ..models.busy_slot import BusySlot
from ..utils.supabase_client import get_supabase


class BusySlotService:
    """Service for managing busy slots."""

    def __init__(self):
        self.supabase = get_supabase()

        supabase_url = os.getenv("SUPABASE_URL")
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if supabase_url and service_role_key:
            self.service_role_client = create_client(supabase_url, service_role_key)
        else:
            print("[WARNING] SUPABASE_SERVICE_ROLE_KEY not found, falling back to anon client")
            self.service_role_client = self.supabase

    def get_user_busy_slots(self, user_id: str, start_date: datetime, end_date: datetime) -> List[dict]:
        """Get busy slots for a user within a date range."""
        try:
            result = (
                self.supabase.table("busy_slots")
                .select("*")
                .eq("user_id", user_id)
                .gte("start_time_utc", start_date.isoformat())
                .lte("end_time_utc", end_date.isoformat())
                .order("start_time_utc")
                .execute()
            )
            return result.data or []
        except Exception as e:
            print(f"Error getting busy slots for user {user_id}: {str(e)}")
            return []

    def get_busy_slots(self, start_date: datetime, end_date: datetime) -> List[dict]:
        """Get all busy slots between dates, sorted by start time."""
        try:
            result = (
                self.supabase.table("busy_slots")
                .select("*")
                .gte("start_time_utc", start_date.isoformat())
                .lte("end_time_utc", end_date.isoformat())
                .order("start_time_utc")
                .execute()
            )
            return result.data or []
        except Exception as e:
            print(f"Error getting busy slots: {str(e)}")
            return []

    def store_busy_slot(self, busy_slot: BusySlot) -> Optional[dict]:
        """Store a single busy slot in the database."""
        try:
            result = (
                self.service_role_client.table("busy_slots")
                .insert(busy_slot.to_dict())
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error storing busy slot: {str(e)}")
            return None

    def upsert_busy_slot(self, busy_slot: BusySlot) -> Optional[dict]:
        """Upsert a busy slot (update if exists, insert if new)."""
        try:
            if busy_slot.google_event_id:
                existing = (
                    self.service_role_client.table("busy_slots")
                    .select("*")
                    .eq("user_id", busy_slot.user_id)
                    .eq("google_event_id", busy_slot.google_event_id)
                    .execute()
                )

                if existing.data:
                    busy_slot.updated_at = datetime.utcnow()
                    result = (
                        self.service_role_client.table("busy_slots")
                        .update(busy_slot.to_dict())
                        .eq("id", existing.data[0]["id"])
                        .execute()
                    )
                    return result.data[0] if result.data else None

            return self.store_busy_slot(busy_slot)

        except Exception as e:
            print(f"Error upserting busy slot: {str(e)}")
            return None

    def delete_user_busy_slots_in_range(self, user_id: str, start_date: datetime, end_date: datetime) -> bool:
        """Delete all busy slots for a user within a date range."""
        try:
            self.service_role_client.table("busy_slots").delete().eq(
                "user_id", user_id
            ).gte("start_time_utc", start_date.isoformat()).lte(
                "end_time_utc", end_date.isoformat()
            ).execute()

            return True
        except Exception as e:
            print(f"Error deleting busy slots for user {user_id}: {str(e)}")
            return False

    def delete_busy_slot(self, busy_slot: BusySlot) -> bool:
        """Delete a busy slot."""
        try:
            self.supabase.table("busy_slots").delete().eq(
                "google_event_id", busy_slot.google_event_id
            ).execute()
            return True
        except Exception as e:
            print(f"Error deleting busy slot for slot id {busy_slot.id}")
            return False

    def get_participants_busy_slots(
        self, participant_ids: List[str], start_date: datetime, end_date: datetime
    ) -> List[dict]:
        """Get busy slots for multiple participants within a date range."""
        try:
            result = (
                self.supabase.table("busy_slots")
                .select("*, profiles(*)")
                .in_("user_id", participant_ids)
                .gte("start_time_utc", start_date.isoformat())
                .lte("end_time_utc", end_date.isoformat())
                .order("start_time_utc")
                .execute()
            )
            return result.data or []
        except Exception as e:
            print(f"Error getting busy slots for participants: {str(e)}")
            return []

    def get_event_participants_busy_slots(
        self, event_id: str, start_date: datetime, end_date: datetime
    ) -> List[dict]:
        """Get busy slots for all participants of a specific event."""
        try:
            participants_result = (
                self.service_role_client.table("event_participants")
                .select("user_id")
                .eq("event_id", event_id)
                .execute()
            )

            if not participants_result.data:
                return []

            participant_ids = [p["user_id"] for p in participants_result.data]

            return self.get_participants_busy_slots(participant_ids, start_date, end_date)

        except Exception as e:
            print(f"Error getting busy slots for event participants: {str(e)}")
            return []

    def bulk_store_busy_slots(self, busy_slots: List[BusySlot]) -> List[dict]:
        """Store multiple busy slots efficiently."""
        try:
            slots_data = [slot.to_dict() for slot in busy_slots]
            result = self.service_role_client.table("busy_slots").insert(slots_data).execute()
            return result.data or []
        except Exception as e:
            print(f"Error bulk storing busy slots: {str(e)}")
            return []

    def sync_user_google_calendar(self, user_id: str, start_date: datetime, end_date: datetime) -> bool:
        """
        Sync busy slots from user's Google Calendar using differential logic.

        Supports multi-calendar: syncs from all enabled calendar sources.
        Falls back to legacy behavior (primary calendar only) if no sources found.
        """
        try:
            from .calendar_accounts import CalendarAccountsService

            calendar_accounts_service = CalendarAccountsService()

            enabled_sources = []
            try:
                enabled_sources = calendar_accounts_service.get_enabled_sources(user_id)
            except Exception as e:
                print(f"[SYNC] Could not get enabled sources (may not be migrated): {e}")

            if enabled_sources:
                return self._sync_multi_calendar(user_id, start_date, end_date, enabled_sources)

            return self._sync_legacy_primary_calendar(user_id, start_date, end_date)

        except Exception as e:
            print(f"Error syncing Google Calendar for user {user_id}: {str(e)}")
            return False

    def _sync_legacy_primary_calendar(self, user_id: str, start_date: datetime, end_date: datetime) -> bool:
        """Legacy sync method: sync only from the primary calendar."""
        from . import google_calendar

        credentials = google_calendar.get_stored_credentials(user_id)
        if not credentials:
            print(f"No Google credentials found for user {user_id}")
            return False

        service = google_calendar.get_calendar_service(credentials=credentials, user_id=user_id)

        events_result = service.events().list(
            calendarId='primary',
            timeMin=start_date.isoformat(),
            timeMax=end_date.isoformat(),
            singleEvents=True,
            orderBy='startTime'
        ).execute()

        google_events = events_result.get('items', [])

        google_event_map = {
            event.get('id'): event
            for event in google_events
            if event.get('id')
        }

        db_slots_result = (
            self.service_role_client.table("busy_slots")
            .select("id, google_event_id")
            .eq("user_id", user_id)
            .gte("start_time_utc", start_date.isoformat())
            .lte("end_time_utc", end_date.isoformat())
            .not_.is_("google_event_id", "null")
            .execute()
        )
        db_slots = db_slots_result.data or []
        db_event_ids = {slot["google_event_id"] for slot in db_slots}

        google_ids = set(google_event_map.keys())
        ids_to_add = google_ids - db_event_ids
        ids_to_delete = db_event_ids - google_ids

        print(f"[SYNC] User {user_id} (legacy): Adding {len(ids_to_add)}, Deleting {len(ids_to_delete)}")

        if ids_to_delete:
            self.service_role_client.table("busy_slots").delete().eq(
                "user_id", user_id
            ).in_("google_event_id", list(ids_to_delete)).execute()

        slots_to_add = []
        for event_id in ids_to_add:
            event = google_event_map[event_id]
            try:
                busy_slot = BusySlot.from_google_event(user_id, event)
                slots_to_add.append(busy_slot.to_dict())
            except ValueError:
                continue

        if slots_to_add:
            self.service_role_client.table("busy_slots").insert(slots_to_add).execute()

        return True

    def _sync_multi_calendar(
        self, user_id: str, start_date: datetime, end_date: datetime, enabled_sources: List[dict]
    ) -> bool:
        """Multi-calendar sync: sync from all enabled calendar sources."""
        from googleapiclient.discovery import build

        from . import google_calendar

        total_added = 0
        total_deleted = 0

        for source in enabled_sources:
            try:
                added, deleted = self._sync_single_source(
                    user_id, start_date, end_date, source
                )
                total_added += added
                total_deleted += deleted
            except Exception as e:
                print(f"[SYNC] Error syncing source {source.get('id')}: {e}")

        print(f"[SYNC] User {user_id} multi-calendar total: Added {total_added}, Deleted {total_deleted}")
        return True

    def _sync_single_source(
        self, user_id: str, start_date: datetime, end_date: datetime, source: dict
    ) -> Tuple[int, int]:
        """Sync a single calendar source. Returns (added_count, deleted_count)."""
        from googleapiclient.discovery import build

        from . import google_calendar

        source_id = source["id"]
        calendar_id = source["calendar_id"]
        account = source.get("account", {})
        creds_dict = account.get("credentials")

        if not creds_dict:
            print(f"[SYNC] No credentials for source {source_id}")
            return 0, 0

        credentials = google_calendar.get_credentials_from_dict(creds_dict)
        credentials = google_calendar.refresh_credentials_if_needed(credentials)

        service = build("calendar", "v3", credentials=credentials)

        events_result = service.events().list(
            calendarId=calendar_id,
            timeMin=start_date.isoformat(),
            timeMax=end_date.isoformat(),
            singleEvents=True,
            orderBy='startTime'
        ).execute()

        google_events = events_result.get('items', [])

        google_event_map = {
            f"{calendar_id}:{event.get('id')}": event
            for event in google_events
            if event.get('id')
        }

        db_slots_result = (
            self.service_role_client.table("busy_slots")
            .select("id, google_event_id, google_calendar_id")
            .eq("user_id", user_id)
            .eq("google_calendar_id", calendar_id)
            .gte("start_time_utc", start_date.isoformat())
            .lte("end_time_utc", end_date.isoformat())
            .not_.is_("google_event_id", "null")
            .execute()
        )
        db_slots = db_slots_result.data or []
        db_event_keys = {
            f"{slot['google_calendar_id']}:{slot['google_event_id']}"
            for slot in db_slots
        }

        google_keys = set(google_event_map.keys())
        keys_to_add = google_keys - db_event_keys
        keys_to_delete = db_event_keys - google_keys

        print(f"[SYNC] User {user_id}, Calendar {calendar_id}: Adding {len(keys_to_add)}, Deleting {len(keys_to_delete)}")

        deleted_count = 0
        if keys_to_delete:
            event_ids_to_delete = [k.split(":")[1] for k in keys_to_delete]
            self.service_role_client.table("busy_slots").delete().eq(
                "user_id", user_id
            ).eq("google_calendar_id", calendar_id).in_(
                "google_event_id", event_ids_to_delete
            ).execute()
            deleted_count = len(keys_to_delete)

        slots_to_add = []
        for composite_key in keys_to_add:
            event = google_event_map[composite_key]
            try:
                busy_slot = BusySlot.from_google_event(user_id, event, google_calendar_id=calendar_id)
                slot_dict = busy_slot.to_dict()
                slot_dict["calendar_source_id"] = source_id
                slots_to_add.append(slot_dict)
            except ValueError:
                continue

        added_count = 0
        if slots_to_add:
            self.service_role_client.table("busy_slots").insert(slots_to_add).execute()
            added_count = len(slots_to_add)

        if credentials.token != creds_dict.get("token"):
            from .calendar_accounts import CalendarAccountsService
            calendar_accounts_service = CalendarAccountsService()
            calendar_accounts_service.update_account_credentials(
                account["id"],
                {
                    "token": credentials.token,
                    "refresh_token": credentials.refresh_token,
                    "token_uri": credentials.token_uri,
                    "client_id": credentials.client_id,
                    "client_secret": credentials.client_secret,
                    "scopes": list(credentials.scopes) if credentials.scopes else [],
                }
            )

        return added_count, deleted_count

    def delete_user_google_events(self, user_id: str) -> bool:
        """Delete all Google Calendar synced events for a user."""
        try:
            self.service_role_client.table("busy_slots").delete().eq(
                "user_id", user_id
            ).not_.is_("google_event_id", "null").execute()
            return True
        except Exception as e:
            print(f"Error deleting Google events for user {user_id}: {str(e)}")
            return False

    def get_merged_busy_slots_for_event(
        self, event_id: str, start_date: datetime, end_date: datetime
    ) -> List[dict]:
        """Get merged busy time slots for all participants using PostgreSQL RPC."""
        try:
            result = self.service_role_client.rpc(
                'get_merged_busy_slots_for_event',
                {
                    'event_uuid': event_id,
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat()
                }
            ).execute()

            return [
                {
                    "start_time": slot["start_time"],
                    "end_time": slot["end_time"],
                    "busy_participants_count": slot["busy_participants_count"]
                }
                for slot in result.data
            ]

        except Exception as e:
            print(f"Error calling RPC function for event {event_id}: {str(e)}")
            return self._get_merged_busy_slots_fallback(event_id, start_date, end_date)

    def _get_merged_busy_slots_fallback(
        self, event_id: str, start_date: datetime, end_date: datetime
    ) -> List[dict]:
        """Fallback method using Python logic if RPC fails."""
        try:
            participants_result = (
                self.service_role_client.table("event_participants")
                .select("user_id")
                .eq("event_id", event_id)
                .execute()
            )

            if not participants_result.data:
                return []

            participant_ids = [p["user_id"] for p in participants_result.data]

            busy_slots_result = (
                self.service_role_client.table("busy_slots")
                .select("start_time_utc, end_time_utc, user_id")
                .in_("user_id", participant_ids)
                .gte("start_time_utc", start_date.isoformat())
                .lte("end_time_utc", end_date.isoformat())
                .order("start_time_utc")
                .execute()
            )

            busy_slots = [
                {
                    "start_time_utc": datetime.fromisoformat(slot["start_time_utc"].replace('Z', '+00:00')),
                    "end_time_utc": datetime.fromisoformat(slot["end_time_utc"].replace('Z', '+00:00')),
                    "user_id": slot["user_id"]
                }
                for slot in busy_slots_result.data
            ]

            return self._merge_overlapping_slots_python(busy_slots)

        except Exception as e:
            print(f"Error in fallback method: {str(e)}")
            return []

    def _merge_overlapping_slots_python(self, busy_slots: List[dict]) -> List[dict]:
        """Merge overlapping busy slots and count participants."""
        if not busy_slots:
            return []

        events = []
        for slot in busy_slots:
            events.append({
                "event_time": slot["start_time_utc"],
                "event_type": 1,
                "user_id": slot["user_id"]
            })
            events.append({
                "event_time": slot["end_time_utc"],
                "event_type": -1,
                "user_id": slot["user_id"]
            })

        events.sort(key=lambda x: (x["event_time"], x["event_type"]))

        merged_slots = []
        active_users = set()
        prev_time = None

        for event in events:
            current_time = event["event_time"]

            if prev_time is not None and prev_time < current_time and active_users:
                merged_slots.append({
                    "start_time": prev_time.isoformat(),
                    "end_time": current_time.isoformat(),
                    "busy_participants_count": len(active_users)
                })

            if event["event_type"] == 1:
                active_users.add(event["user_id"])
            else:
                active_users.discard(event["user_id"])

            prev_time = current_time

        return merged_slots

    def validate_busy_slot_data(self, slot_data: dict) -> bool:
        """Validate busy slot data has required fields and valid times."""
        required_fields = ['user_id', 'start_time_utc', 'end_time_utc']

        for field in required_fields:
            if field not in slot_data:
                print(f"Validation error: Missing field '{field}'")
                return False

        try:
            start = datetime.fromisoformat(slot_data['start_time_utc'].replace('Z', '+00:00'))
            end = datetime.fromisoformat(slot_data['end_time_utc'].replace('Z', '+00:00'))
            if start >= end:
                print("Validation error: start_time must be before end_time")
                return False
        except Exception as e:
            print(f"Validation error: Invalid datetime format - {str(e)}")
            return False

        return True

    def get_user_calendar_sync_status(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get the Google Calendar sync status and last sync time for a user."""
        response = self.supabase.table("profiles").select(
            "google_calendar_sync"
        ).eq("id", user_id).execute()

        if not response.data or not response.data[0].get("google_calendar_sync"):
            return None

        sync_info = response.data[0]["google_calendar_sync"]

        last_synced_at = None
        if sync_info.get("last_synced_at"):
            try:
                last_synced_at = datetime.fromisoformat(
                    sync_info["last_synced_at"].replace('Z', '+00:00')
                )
            except Exception:
                pass

        return {
            "last_synced_at": last_synced_at,
            "sync_status": sync_info.get("sync_status"),
            "sync_error": sync_info.get("sync_error")
        }

    def cleanup_old_busy_slots(self, user_id: str, days_old: int) -> int:
        """Remove old busy slots for a user based on ongoing events or age."""
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)

        try:
            participant_events = (
                self.service_role_client.table("event_participants")
                .select("event_id")
                .eq("user_id", user_id)
                .execute()
            )

            deletion_cutoff = cutoff_date

            if participant_events.data:
                event_ids = [p["event_id"] for p in participant_events.data]
                ongoing_events_resp = (
                    self.supabase.table("events")
                    .select("start_time")
                    .gte("end_time", datetime.utcnow().isoformat())
                    .in_("id", event_ids)
                    .order("start_time", ascending=True)
                    .limit(1)
                    .execute()
                )

                if ongoing_events_resp.data:
                    min_start_time_str = ongoing_events_resp.data[0]["start_time"]
                    deletion_cutoff = datetime.fromisoformat(
                        min_start_time_str.replace('Z', '+00:00')
                    )

            response = (
                self.supabase.table("busy_slots")
                .delete()
                .eq("user_id", user_id)
                .lt("end_time_utc", deletion_cutoff.isoformat())
                .execute()
            )

            return response.count if response and hasattr(response, 'count') else 0

        except Exception as e:
            print(f"Error cleaning up busy slots for user {user_id}: {str(e)}")
            return 0

    def get_busy_slots_summary(
        self, user_id: str, date_range: Tuple[datetime, datetime]
    ) -> Optional[Dict[str, Any]]:
        """Placeholder for generating summary statistics of busy slots."""
        pass

