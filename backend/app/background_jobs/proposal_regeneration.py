"""Background job to regenerate stale time proposals."""

import logging
import os
import time

from supabase import create_client

from ..services.time_proposal import TimeProposalService

LOG_PREFIX = "[PROPOSAL_REGEN_JOB]"
DEFAULT_MAX_EVENTS = 4
DEFAULT_DELAY_SECONDS = 15
DEFAULT_NUM_SUGGESTIONS = 5
DEFAULT_INTERVAL_MINUTES = 10


def _get_supabase_client():
    """Create and return a Supabase client with service role credentials."""
    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_role_key:
        logging.error(f"{LOG_PREFIX} Missing Supabase credentials")
        return None

    return create_client(supabase_url, service_role_key)


def _process_event(
    event: dict,
    supabase,
    time_proposal_service: TimeProposalService,
) -> bool:
    """
    Process a single event for proposal regeneration.
    Returns True on success, False on failure.
    """
    event_id = event["id"]
    event_uid = event.get("uid", "unknown")

    participants = (
        supabase.table("event_participants")
        .select("user_id")
        .eq("event_id", event_id)
        .execute()
    )

    if not participants.data:
        logging.info(f"{LOG_PREFIX} Skipping event {event_uid} - no participants")
        supabase.table("events").update(
            {"proposals_needs_regeneration": False}
        ).eq("id", event_id).execute()
        return True

    proposals = time_proposal_service.propose_times(
        event_id, num_suggestions=DEFAULT_NUM_SUGGESTIONS
    )
    time_proposal_service.save_proposals_to_cache(event_id, proposals)

    logging.info(
        f"{LOG_PREFIX} Successfully regenerated {len(proposals)} proposals for event {event_uid}"
    )
    return True


def regenerate_stale_proposals() -> None:
    """
    Find all events with proposals_needs_regeneration=TRUE and regenerate their proposals.

    Rate limiting is applied to respect Gemini API limits.
    Configuration via environment variables:
    - PROPOSAL_REGEN_MAX_EVENTS_PER_RUN (default: 4)
    - PROPOSAL_REGEN_DELAY_SECONDS (default: 15)
    """
    logging.info(f"{LOG_PREFIX} Starting stale proposal regeneration job")

    max_events = int(os.getenv("PROPOSAL_REGEN_MAX_EVENTS_PER_RUN", DEFAULT_MAX_EVENTS))
    delay_seconds = int(os.getenv("PROPOSAL_REGEN_DELAY_SECONDS", DEFAULT_DELAY_SECONDS))

    logging.info(
        f"{LOG_PREFIX} Rate limits: max {max_events} events per run, {delay_seconds}s delay"
    )

    supabase = _get_supabase_client()
    if not supabase:
        return

    response = (
        supabase.table("events")
        .select("id, uid, name, status")
        .eq("proposals_needs_regeneration", True)
        .in_("status", ["planning", "pending"])
        .limit(max_events)
        .execute()
    )

    if not response.data:
        logging.info(f"{LOG_PREFIX} No stale proposals found")
        return

    events = response.data
    total = len(events)
    logging.info(f"{LOG_PREFIX} Found {total} events to process (limited to {max_events})")

    time_proposal_service = TimeProposalService(access_token=None)
    success_count = 0
    error_count = 0

    for idx, event in enumerate(events, 1):
        event_uid = event.get("uid", "unknown")
        event_name = event.get("name", "Untitled")

        logging.info(f"{LOG_PREFIX} Processing event {idx}/{total}: {event_uid} ({event_name})")

        try:
            if _process_event(event, supabase, time_proposal_service):
                success_count += 1
        except Exception as e:
            logging.error(f"{LOG_PREFIX} Failed to regenerate proposals for event {event_uid}: {e}")
            error_count += 1

        if idx < total:
            logging.info(f"{LOG_PREFIX} Waiting {delay_seconds}s before next API call...")
            time.sleep(delay_seconds)

    logging.info(f"{LOG_PREFIX} Job completed. Success: {success_count}, Errors: {error_count}")


def schedule_proposal_regeneration() -> int:
    """
    Return the configured interval for proposal regeneration scheduling.
    Configure via PROPOSAL_REGEN_INTERVAL_MINUTES environment variable (default: 10).
    """
    interval_minutes = int(os.getenv("PROPOSAL_REGEN_INTERVAL_MINUTES", DEFAULT_INTERVAL_MINUTES))
    logging.info(f"{LOG_PREFIX} Scheduling proposal regeneration every {interval_minutes} minutes")
    return interval_minutes


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s:%(name)s:%(funcName)s: %(message)s",
    )
    regenerate_stale_proposals()

