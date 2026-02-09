"""
Routes for AI-powered time proposal generation.
"""
from __future__ import annotations

import logging

from flask import Blueprint, request, jsonify

from ..services.events import EventsService
from ..services.time_proposal import TimeProposalService
from ..utils.decorators import require_auth

time_proposal_bp = Blueprint("time_proposal", __name__)


def _get_access_token():
    """Get access token from request."""
    return getattr(request, "access_token", None)


def _build_proposal_response(
    proposals: list,
    cached: bool,
    generated_at: str | None,
    needs_update: bool,
    all_expired: bool,
    message: str | None = None
) -> dict:
    """Build a standardized proposal response."""
    response = {
        "success": True,
        "proposals": proposals,
        "cached": cached,
        "generated_at": generated_at,
        "needs_update": needs_update,
        "all_expired": all_expired
    }
    if message:
        response["message"] = message
    return response


def _handle_service_error(error_message: str) -> tuple[dict, int]:
    """Map service errors to appropriate HTTP responses."""
    error_lower = error_message.lower()

    if "not installed" in error_lower:
        return {"error": "Configuration error", "message": "AI service is not properly configured"}, 500

    if "api key" in error_lower or "not configured" in error_lower:
        return {"error": "Configuration error", "message": "AI service is not available. Please contact support."}, 500

    if "no participants" in error_lower:
        return {"error": "No participants", "message": "Event must have participants to generate time proposals"}, 400

    if "no available" in error_lower:
        return {
            "error": "No availability",
            "message": "Could not find any time slots when all participants are available. Try adjusting event constraints or participant availability."
        }, 400

    if "date range has passed" in error_lower:
        return {
            "error": "Event dates expired",
            "message": "The event's date range has passed. Please update the event to include future dates."
        }, 400

    if "rate limit" in error_lower or "quota" in error_lower:
        return {
            "error": "Rate limit",
            "message": "AI service is temporarily unavailable due to rate limits. Please try again in a few moments."
        }, 429

    return {"error": "Failed to generate proposals", "message": error_message}, 500

@time_proposal_bp.route("/api/events/<event_uid>/propose-times", methods=["POST"])
@require_auth
def propose_times(event_uid, user_id):
    """Get time proposals for an event (cached or generate)."""
    data = request.get_json() or {}
    num_suggestions = data.get("num_suggestions", 5)
    force_refresh = data.get("force_refresh", False)

    if not isinstance(num_suggestions, int) or num_suggestions < 1 or num_suggestions > 20:
        return jsonify({
            "error": "Invalid parameter",
            "message": "num_suggestions must be an integer between 1 and 20"
        }), 400

    events_service = EventsService()
    event = events_service.get_event_by_uid(event_uid)

    if not event:
        return jsonify({
            "error": "Event not found",
            "message": f"Event with UID '{event_uid}' not found"
        }), 404

    db_event_id = event["id"]
    is_coordinator = event.get("coordinator_id") == user_id
    is_participant = events_service.is_user_participant(db_event_id, user_id)

    if not is_coordinator and not is_participant:
        return jsonify({
            "error": "Access denied",
            "message": "You must be a participant or coordinator to view time proposals"
        }), 403

    if force_refresh and not is_coordinator:
        return jsonify({
            "error": "Access denied",
            "message": "Only coordinators can force refresh proposals"
        }), 403

    if event.get("status") == "finalized":
        return jsonify({
            "error": "Event finalized",
            "message": "This event has already been finalized"
        }), 400

    time_proposal_service = TimeProposalService(_get_access_token())

    try:
        regen_status = time_proposal_service.should_regenerate(db_event_id)
        generated_at = regen_status.get("last_generated_at")
        expired_message = "All proposed times have passed. Please refresh to generate new proposals."

        # Force refresh: regenerate immediately
        if force_refresh:
            proposals = time_proposal_service.regenerate_proposals_immediately(db_event_id, num_suggestions)
            return jsonify(_build_proposal_response(proposals, False, generated_at, False, False)), 200

        # Has cache and not stale: return cached
        if regen_status["has_proposals"] and not regen_status["needs_regeneration"]:
            cache_result = time_proposal_service.get_cached_proposals(db_event_id)
            proposals = cache_result.get("proposals")
            if proposals:
                return jsonify(_build_proposal_response(proposals, True, generated_at, False, False)), 200

        # No cache (first view): generate and cache
        if not regen_status["has_proposals"]:
            proposals = time_proposal_service.propose_times(db_event_id, num_suggestions)
            time_proposal_service.save_proposals_to_cache(db_event_id, proposals)
            return jsonify(_build_proposal_response(proposals, False, None, False, False)), 200

        # All cached proposals are expired
        if regen_status.get("all_expired"):
            return jsonify(_build_proposal_response([], True, generated_at, True, True, expired_message)), 200

        # Has cache but stale: return cached with needs_update flag
        cache_result = time_proposal_service.get_cached_proposals(db_event_id)
        proposals = cache_result.get("proposals")
        all_expired = cache_result.get("all_expired", False)

        if proposals:
            return jsonify(_build_proposal_response(proposals, True, generated_at, True, False)), 200

        if all_expired:
            return jsonify(_build_proposal_response([], True, generated_at, True, True, expired_message)), 200

        # Fallback: generate fresh proposals
        proposals = time_proposal_service.propose_times(db_event_id, num_suggestions)
        time_proposal_service.save_proposals_to_cache(db_event_id, proposals)
        return jsonify(_build_proposal_response(proposals, False, None, False, False)), 200

    except Exception as service_error:
        error_message = str(service_error)
        logging.error(f"[TIME_PROPOSAL] Service error: {error_message}")
        response, status_code = _handle_service_error(error_message)
        return jsonify(response), status_code


@time_proposal_bp.route("/api/events/<event_uid>/propose-times/test", methods=["GET"])
@require_auth
def test_proposal_endpoint(event_uid, user_id):
    """Test endpoint to verify the blueprint is registered."""
    return jsonify({
        "message": "Time proposal endpoint is working",
        "event_uid": event_uid,
        "user_id": user_id
    }), 200
