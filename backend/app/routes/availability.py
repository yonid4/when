"""
Not used anymore with current arcitechture
"""




"""
Availability routes for managing user availability slots.
"""

from flask import Blueprint, request, jsonify
from ..utils.decorators import require_auth
from ..utils.supabase_client import get_supabase
from datetime import datetime

availability_bp = Blueprint("availability", __name__, url_prefix="/api/availability")

@availability_bp.route('/<string:event_id>', methods=['POST'])
@require_auth
def add_availability(event_id):
    """
    Add availability slots for an event.
    Requires authentication.
    """
    user_id = request.user.id
    data = request.get_json()
    slots = data.get("slots", [])

    try:
        # Get Supabase client
        supabase = get_supabase()
        
        # Add availability slots
        availability_slots = []
        for slot in slots:
            slot_data = {
                "event_id": event_id,
                "user_id": user_id,
                "start_time_utc": slot.get("start_time_utc"),
                "end_time_utc": slot.get("end_time_utc")
            }
            result = (
                supabase.table("availability_slots")
                .insert(slot_data)
                .execute()
            )
            availability_slots.append(result.data[0])

        return jsonify(availability_slots), 201

    except Exception as e:
        return jsonify({
            'error': 'Failed to add availability slots',
            'message': str(e)
        }), 400

@availability_bp.route('/<string:event_id>', methods=['GET'])
@require_auth
def get_availability(event_id):
    """
    Get all availability slots for an event.
    Requires authentication.
    """
    try:
        # Get Supabase client
        supabase = get_supabase()
        
        # Get availability slots
        slots = (
            supabase.table("availability_slots")
            .select("*, profiles(*)")
            .eq("event_id", event_id)
            .execute()
        )

        return jsonify(slots.data), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to get availability slots',
            'message': str(e)
        }), 400

@availability_bp.route('/<string:availability_id>', methods=['GET'])
@require_auth
def get_user_availability(availability_id):
    """
    Get a specific user's availability slots for an event.
    Requires authentication.
    """
    try:
        # Get Supabase client
        supabase = get_supabase()
        
        # Get user's availability slots
        slots = (
            supabase.table("availability_slots")
            .select("*")
            .eq("id", availability_id)
            .execute()
        )

        return jsonify(slots.data), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to get user availability slots',
            'message': str(e)
        }), 400

@availability_bp.route('/<string:event_id>/<string:user_id>', methods=['DELETE'])
@require_auth
def delete_user_availability(event_id, user_id):
    """
    Delete all availability slots for a user in an event.
    Requires authentication.
    """
    try:
        # Get Supabase client
        supabase = get_supabase()
        
        # Delete user's availability slots
        supabase.table("availability_slots").delete().eq("event_id", event_id).eq("user_id", user_id).execute()

        return jsonify({
            'message': 'Availability slots deleted successfully'
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to delete availability slots',
            'message': str(e)
        }), 400