"""
User preferences routes for managing event preferences.
"""

from flask import Blueprint, request, jsonify
from ..utils.decorators import require_auth
from ..utils.supabase_client import get_supabase
from datetime import datetime

preferences_bp = Blueprint("preferences", __name__, url_prefix="/api/preferences")

@preferences_bp.route('/<string:event_id>', methods=['POST'])
@require_auth
def add_preference(event_id):
    """
    Add a preference for an event.
    Requires authentication.
    """
    user_id = request.user.id
    data = request.get_json()

    try:
        # Get Supabase client
        supabase = get_supabase()
        
        # Add preference
        preference_data = {
            "event_id": event_id,
            "user_id": user_id,
            "availability_slot_id": data.get("availability_slot_id"),
            "preferred_start_time_utc": data.get("preferred_start_time_utc"),
            "preferred_end_time_utc": data.get("preferred_end_time_utc"),
            "preference_strength": data.get("preference_strength", 1)
        }
        
        result = (
            supabase.table("user_event_preferences")
            .insert(preference_data)
            .execute()
        )

        return jsonify(result.data[0]), 201

    except Exception as e:
        return jsonify({
            'error': 'Failed to add preference',
            'message': str(e)
        }), 400

@preferences_bp.route('/<string:event_id>', methods=['GET'])
@require_auth
def get_preferences(event_id):
    """
    Get all preferences for an event.
    Requires authentication.
    """
    try:
        # Get Supabase client
        supabase = get_supabase()
        
        # Get preferences
        preferences = (
            supabase.table("user_event_preferences")
            .select("*, profiles(*)")
            .eq("event_id", event_id)
            .execute()
        )

        return jsonify(preferences.data), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to get preferences',
            'message': str(e)
        }), 400

@preferences_bp.route('/<string:event_id>/<string:user_id>', methods=['GET'])
@require_auth
def get_user_preferences(event_id, user_id):
    """
    Get a specific user's preferences for an event.
    Requires authentication.
    """
    try:
        # Get Supabase client
        supabase = get_supabase()
        
        # Get user's preferences
        preferences = (
            supabase.table("user_event_preferences")
            .select("*")
            .eq("event_id", event_id)
            .eq("user_id", user_id)
            .execute()
        )

        return jsonify(preferences.data), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to get user preferences',
            'message': str(e)
        }), 400

@preferences_bp.route('/<string:preference_id>', methods=['DELETE'])
@require_auth
def delete_user_preferences(preference_id):
    """
    Delete all preferences for a user in an event.
    Requires authentication.
    """
    try:
        # Get Supabase client
        supabase = get_supabase()
        
        # Delete user's preferences
        supabase.table("user_event_preferences").delete().eq("id", preference_id).execute()

        return jsonify({
            'message': 'Preferences deleted successfully'
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to delete preferences',
            'message': str(e)
        }), 400