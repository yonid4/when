"""
Routes for AI-powered time proposal generation.
"""

from flask import Blueprint, request, jsonify
import logging
from ..utils.decorators import require_auth
from ..services.time_proposal import TimeProposalService
from ..services.events import EventsService

time_proposal_bp = Blueprint("time_proposal", __name__)

@time_proposal_bp.route("/api/events/<event_uid>/propose-times", methods=["POST"])
@require_auth
def propose_times(event_uid, user_id):
    """
    Get time proposals for an event (cached or generate).
    
    Request body:
    {
        "num_suggestions": 5,  // optional, defaults to 5
        "force_refresh": false  // optional, coordinator only
    }
    
    Returns:
    {
        "success": true,
        "proposals": [...],
        "cached": true/false,
        "generated_at": "timestamp",
        "needs_update": true/false
    }
    """
    try:
        # Parse request data
        data = request.get_json() or {}
        num_suggestions = data.get("num_suggestions", 5)
        force_refresh = data.get("force_refresh", False)
        
        # Validate num_suggestions
        if not isinstance(num_suggestions, int) or num_suggestions < 1 or num_suggestions > 20:
            return jsonify({
                "error": "Invalid parameter",
                "message": "num_suggestions must be an integer between 1 and 20"
            }), 400
        
        logging.info(f"[TIME_PROPOSAL] Request for {num_suggestions} proposals for event {event_uid} by user {user_id}, force_refresh={force_refresh}")
        
        # Get event by UID
        events_service = EventsService()
        event = events_service.get_event_by_uid(event_uid)
        
        if not event:
            logging.error(f"[TIME_PROPOSAL] Event not found: {event_uid}")
            return jsonify({
                "error": "Event not found",
                "message": f"Event with UID '{event_uid}' not found"
            }), 404
        
        db_event_id = event["id"]
        
        # Check if user is a participant or coordinator
        is_coordinator = event.get("coordinator_id") == user_id
        is_participant = events_service.is_user_participant(db_event_id, user_id)
        
        if not is_coordinator and not is_participant:
            logging.warning(f"[TIME_PROPOSAL] User {user_id} is not authorized for event {event_uid}")
            return jsonify({
                "error": "Access denied",
                "message": "You must be a participant or coordinator to view time proposals"
            }), 403
        
        # Only coordinators can force refresh
        if force_refresh and not is_coordinator:
            return jsonify({
                "error": "Access denied",
                "message": "Only coordinators can force refresh proposals"
            }), 403
        
        # Check if event is already finalized
        if event.get("status") == "finalized":
            logging.info(f"[TIME_PROPOSAL] Event {event_uid} is already finalized")
            return jsonify({
                "error": "Event finalized",
                "message": "This event has already been finalized"
            }), 400
        
        # Initialize service
        access_token = getattr(request, "access_token", None)
        time_proposal_service = TimeProposalService(access_token)
        
        try:
            # Check regeneration status
            regen_status = time_proposal_service.should_regenerate(db_event_id)

            # Force refresh: regenerate immediately
            if force_refresh:
                logging.info(f"[TIME_PROPOSAL] Force refresh requested for event {event_uid}")
                proposals = time_proposal_service.regenerate_proposals_immediately(db_event_id, num_suggestions)

                return jsonify({
                    "success": True,
                    "proposals": proposals,
                    "cached": False,
                    "generated_at": regen_status.get("last_generated_at"),
                    "needs_update": False,
                    "all_expired": False
                }), 200

            # Has cache and not stale: return cached
            if regen_status["has_proposals"] and not regen_status["needs_regeneration"]:
                logging.info(f"[TIME_PROPOSAL] Returning cached proposals for event {event_uid}")
                cache_result = time_proposal_service.get_cached_proposals(db_event_id)
                proposals = cache_result.get("proposals")

                if proposals:
                    return jsonify({
                        "success": True,
                        "proposals": proposals,
                        "cached": True,
                        "generated_at": regen_status.get("last_generated_at"),
                        "needs_update": False,
                        "all_expired": False
                    }), 200

            # No cache (first view): generate and cache
            if not regen_status["has_proposals"]:
                logging.info(f"[TIME_PROPOSAL] No cache found, generating proposals for event {event_uid}")
                proposals = time_proposal_service.propose_times(db_event_id, num_suggestions)
                time_proposal_service.save_proposals_to_cache(db_event_id, proposals)

                return jsonify({
                    "success": True,
                    "proposals": proposals,
                    "cached": False,
                    "generated_at": None,
                    "needs_update": False,
                    "all_expired": False
                }), 200

            # All cached proposals are expired: indicate regeneration needed
            if regen_status.get("all_expired"):
                logging.info(f"[TIME_PROPOSAL] All proposals expired for event {event_uid}, indicating regeneration needed")
                return jsonify({
                    "success": True,
                    "proposals": [],
                    "cached": True,
                    "generated_at": regen_status.get("last_generated_at"),
                    "needs_update": True,
                    "all_expired": True,
                    "message": "All proposed times have passed. Please refresh to generate new proposals."
                }), 200

            # Has cache but stale: return cached with needs_update flag
            logging.info(f"[TIME_PROPOSAL] Returning stale cached proposals for event {event_uid}")
            cache_result = time_proposal_service.get_cached_proposals(db_event_id)
            proposals = cache_result.get("proposals")
            all_expired = cache_result.get("all_expired", False)

            if proposals:
                return jsonify({
                    "success": True,
                    "proposals": proposals,
                    "cached": True,
                    "generated_at": regen_status.get("last_generated_at"),
                    "needs_update": True,
                    "all_expired": False
                }), 200

            # All proposals filtered out (expired) after getting cache
            if all_expired:
                return jsonify({
                    "success": True,
                    "proposals": [],
                    "cached": True,
                    "generated_at": regen_status.get("last_generated_at"),
                    "needs_update": True,
                    "all_expired": True,
                    "message": "All proposed times have passed. Please refresh to generate new proposals."
                }), 200

            # Fallback: generate fresh proposals
            logging.info(f"[TIME_PROPOSAL] Fallback: generating fresh proposals for event {event_uid}")
            proposals = time_proposal_service.propose_times(db_event_id, num_suggestions)
            time_proposal_service.save_proposals_to_cache(db_event_id, proposals)

            return jsonify({
                "success": True,
                "proposals": proposals,
                "cached": False,
                "generated_at": None,
                "needs_update": False,
                "all_expired": False
            }), 200
            
        except Exception as service_error:
            error_message = str(service_error)
            logging.error(f"[TIME_PROPOSAL] Service error: {error_message}")
            
            # Handle specific error cases
            if "not installed" in error_message.lower():
                return jsonify({
                    "error": "Configuration error",
                    "message": "AI service is not properly configured"
                }), 500
            
            if "api key" in error_message.lower() or "not configured" in error_message.lower():
                return jsonify({
                    "error": "Configuration error",
                    "message": "AI service is not available. Please contact support."
                }), 500
            
            if "no participants" in error_message.lower():
                return jsonify({
                    "error": "No participants",
                    "message": "Event must have participants to generate time proposals"
                }), 400
            
            if "no available" in error_message.lower():
                return jsonify({
                    "error": "No availability",
                    "message": "Could not find any time slots when all participants are available. Try adjusting event constraints or participant availability."
                }), 400
            
            if "rate limit" in error_message.lower() or "quota" in error_message.lower():
                return jsonify({
                    "error": "Rate limit",
                    "message": "AI service is temporarily unavailable due to rate limits. Please try again in a few moments."
                }), 429
            
            # Generic error
            return jsonify({
                "error": "Failed to generate proposals",
                "message": error_message
            }), 500
    
    except Exception as e:
        error_message = str(e)
        logging.error(f"[TIME_PROPOSAL] Unexpected error: {error_message}")
        return jsonify({
            "error": "Internal server error",
            "message": "An unexpected error occurred while generating time proposals"
        }), 500


@time_proposal_bp.route("/api/events/<event_uid>/propose-times/test", methods=["GET"])
@require_auth
def test_proposal_endpoint(event_uid, user_id):
    """Test endpoint to verify the blueprint is registered."""
    return jsonify({
        "message": "Time proposal endpoint is working",
        "event_uid": event_uid,
        "user_id": user_id
    }), 200
