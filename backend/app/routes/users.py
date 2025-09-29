"""
User routes for managing user profiles and settings.
"""

from flask import Blueprint, request, jsonify
from ..utils.auth import get_user_with_profile
from ..utils.decorators import require_auth
from ..utils.supabase_client import get_supabase
import logging

user_bp = Blueprint("users", __name__, url_prefix="/api/users")

@user_bp.route('/', methods=['POST'])
@require_auth
def create_user():
    """
    Create a new user profile.
    The user must be authenticated with Supabase Auth first.
    """
    user_id = request.user.id
    data = request.get_json() or {}
    try:
        # Get Supabase client
        supabase = get_supabase()
        
        # Create profile using the authenticated user's ID
        profile = (
            supabase.table("profiles")
            .insert({
                "id": user_id,
                "email_address": data.get("email_address"),
                "full_name": data.get("full_name"),
                "avatar_url": data.get("avatar_url"),
                "google_auth_token": data.get("google_auth_token"),
                "google_calendar_id": data.get("google_calendar_id"),
                "timezone": data.get("timezone", "UTC")  # Default to UTC if not provided
            })
            .execute()
        )
        logging.info(f"[USER] Created profile for user {user_id}")
        return jsonify(profile.data[0]), 201

    except Exception as e:
        logging.error(f"[USER] Failed to create profile: {e}")
        return jsonify({
            'error': 'Failed to create profile',
            'message': str(e)
        }), 400
    
@user_bp.route('/<string:user_id>', methods=['GET'])
@require_auth
def get_user(user_id):
    """
    Get user profile with email from Supabase Auth.
    """
    token = request.headers.get('Authorization').split(' ')[1]
    user_data = get_user_with_profile(user_id, token)
    
    if not user_data:
        logging.info(f"[USER] Profile not found for user {user_id}")
        return jsonify({
            'error': 'User not found',
            'message': f'No profile found for user {user_id}'
        }), 404
    logging.info(f"[USER] Fetched profile for user {user_id}")
    return jsonify(user_data), 200
    
@user_bp.route('/<string:user_id>', methods=['PUT'])
@require_auth
def update_user(user_id):
    # TODO: check if the user is allowed to update the user
    return 201

@user_bp.route('/<string:user_id>', methods=['DELETE'])
@require_auth
def delete_user(user_id):
    # TODO: check if the user is allowed to delete the user
    return 201