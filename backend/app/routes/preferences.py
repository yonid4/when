"""
User preferences routes for managing event preferences.
"""

from flask import Blueprint, request, jsonify
from ..utils.decorators import require_auth
from ..services.preference import PreferencesService
from ..models.preference import UserEventPreference
from datetime import datetime

preferences_bp = Blueprint("preferences", __name__, url_prefix="/api/preferences")
preferences_service = PreferencesService()

@preferences_bp.route('/<string:event_id>', methods=['POST'])
@require_auth
def add_preference(event_id, user_id):
    """
    Add a preference for an event.
    Requires authentication.
    """
    user_id = request.user.id
    data = request.get_json()

    try:
        # Build model then persist via service
        user_pref = UserEventPreference(
            event_id=event_id,
            user_id=user_id,
            availability_slot_id=data.get("availability_slot_id"),
            preferred_start_time_utc=data.get("preferred_start_time_utc"),
            preferred_end_time_utc=data.get("preferred_end_time_utc"),
            preference_strength=data.get("preference_strength", 1)
        )

        created = preferences_service.add_preference(user_pref.to_dict())
        if not created:
            return jsonify({
                'error': 'Failed to add preference',
                'message': 'Validation failed or insert error'
            }), 400

        return jsonify(created), 201

    except Exception as e:
        return jsonify({
            'error': 'Failed to add preference',
            'message': str(e)
        }), 400

@preferences_bp.route('/<string:event_id>', methods=['GET'])
@require_auth
def get_preferences(event_id, user_id):
    """
    Get all preferences for an event.
    Requires authentication.
    """
    try:
        prefs = preferences_service.get_event_preferences(event_id)
        return jsonify(prefs), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to get preferences',
            'message': str(e)
        }), 400

@preferences_bp.route('/<string:event_id>/<string:target_user_id>', methods=['GET'])
@require_auth
def get_user_preferences(event_id, target_user_id, user_id):
    """
    Get a specific user's preferences for an event.
    Requires authentication.
    """
    try:
        prefs = preferences_service.get_user_preferences(event_id, target_user_id)
        return jsonify(prefs), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to get user preferences',
            'message': str(e)
        }), 400

@preferences_bp.route('/<string:preference_id>', methods=['DELETE'])
@require_auth
def delete_user_preferences(preference_id, user_id):
    """
    Delete all preferences for a user in an event.
    Requires authentication.
    """
    try:
        ok = preferences_service.delete_preference(preference_id)
        if not ok:
            return jsonify({
                'error': 'Failed to delete preferences',
                'message': 'Delete unsuccessful'
            }), 400
        return jsonify({'message': 'Preferences deleted successfully'}), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to delete preferences',
            'message': str(e)
        }), 400