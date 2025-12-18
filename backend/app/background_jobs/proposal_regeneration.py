"""
Background job to regenerate stale time proposals.
Runs every 5-10 minutes to batch process events needing updates.
"""

import os
import logging
import time
from datetime import datetime
from ..services.time_proposal import TimeProposalService
from ..utils.supabase_client import get_supabase
from supabase import create_client


def regenerate_stale_proposals():
    """
    Find all events with proposals_needs_regeneration=TRUE
    and regenerate their proposals.

    This should be called periodically (e.g., every 5-10 minutes) by a scheduler.

    Rate limiting is applied to respect Gemini API limits:
    - Max events per run (configurable via PROPOSAL_REGEN_MAX_EVENTS_PER_RUN)
    - Delay between API calls (configurable via PROPOSAL_REGEN_DELAY_SECONDS)
    """
    try:
        logging.info("[PROPOSAL_REGEN_JOB] Starting stale proposal regeneration job")

        # Get rate limiting configuration
        max_events_per_run = int(os.getenv("PROPOSAL_REGEN_MAX_EVENTS_PER_RUN", "4"))
        delay_between_calls = int(os.getenv("PROPOSAL_REGEN_DELAY_SECONDS", "15"))

        logging.info(f"[PROPOSAL_REGEN_JOB] Rate limits: max {max_events_per_run} events per run, {delay_between_calls}s delay between calls")

        # Initialize service role client
        supabase_url = os.getenv("SUPABASE_URL")
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not service_role_key:
            logging.error("[PROPOSAL_REGEN_JOB] Missing Supabase credentials")
            return

        supabase = create_client(supabase_url, service_role_key)

        # Query events where proposals_needs_regeneration = TRUE
        # Only process active events (not finalized or cancelled)
        # Limit to max_events_per_run to respect rate limits
        response = supabase.table("events") \
            .select("id, uid, name, status") \
            .eq("proposals_needs_regeneration", True) \
            .in_("status", ["planning", "pending"]) \
            .limit(max_events_per_run) \
            .execute()

        if not response.data:
            logging.info("[PROPOSAL_REGEN_JOB] No stale proposals found")
            return

        events_to_process = response.data
        total_events = len(events_to_process)
        logging.info(f"[PROPOSAL_REGEN_JOB] Found {total_events} events to process (limited to {max_events_per_run})")

        # Initialize time proposal service
        time_proposal_service = TimeProposalService(access_token=None)

        success_count = 0
        error_count = 0

        # Process each event with rate limiting
        for idx, event in enumerate(events_to_process, 1):
            event_id = event["id"]
            event_uid = event.get("uid", "unknown")
            event_name = event.get("name", "Untitled")
            
            try:
                logging.info(f"[PROPOSAL_REGEN_JOB] Processing event {idx}/{total_events}: {event_uid} ({event_name})")

                # Check if event has participants
                participants_response = supabase.table("event_participants") \
                    .select("user_id") \
                    .eq("event_id", event_id) \
                    .execute()

                if not participants_response.data or len(participants_response.data) == 0:
                    logging.info(f"[PROPOSAL_REGEN_JOB] Skipping event {event_uid} - no participants")
                    # Mark as not needing regeneration since it has no participants
                    supabase.table("events") \
                        .update({"proposals_needs_regeneration": False}) \
                        .eq("id", event_id) \
                        .execute()
                    continue

                # Generate proposals with default 5 suggestions
                proposals = time_proposal_service.propose_times(event_id, num_suggestions=5)

                # Save to cache
                time_proposal_service.save_proposals_to_cache(event_id, proposals)

                logging.info(f"[PROPOSAL_REGEN_JOB] Successfully regenerated {len(proposals)} proposals for event {event_uid}")
                success_count += 1

                # Apply rate limiting delay (except after the last event)
                if idx < total_events:
                    logging.info(f"[PROPOSAL_REGEN_JOB] Waiting {delay_between_calls}s before next API call...")
                    time.sleep(delay_between_calls)

            except Exception as event_error:
                logging.error(f"[PROPOSAL_REGEN_JOB] Failed to regenerate proposals for event {event_uid}: {str(event_error)}")
                error_count += 1
                # Don't mark as not needing regeneration if it fails - let it retry next time

                # Still apply delay to avoid hammering the API on errors
                if idx < total_events:
                    time.sleep(delay_between_calls)
                continue
        
        logging.info(f"[PROPOSAL_REGEN_JOB] Job completed. Success: {success_count}, Errors: {error_count}")
        
    except Exception as e:
        logging.error(f"[PROPOSAL_REGEN_JOB] Error in proposal regeneration job: {str(e)}")


def schedule_proposal_regeneration():
    """
    Set up periodic execution of the proposal regeneration job.
    
    This is a helper function that can be called from the scheduler.
    You can configure the interval (default: 10 minutes) via environment variable.
    """
    interval_minutes = int(os.getenv("PROPOSAL_REGEN_INTERVAL_MINUTES", "10"))
    logging.info(f"[PROPOSAL_REGEN_JOB] Scheduling proposal regeneration every {interval_minutes} minutes")
    
    # Note: Actual scheduling should be done by your scheduler (e.g., APScheduler, Celery, etc.)
    # This is just a helper to document the intended interval
    return interval_minutes


if __name__ == "__main__":
    # For manual testing
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s:%(name)s:%(funcName)s: %(message)s"
    )
    regenerate_stale_proposals()





