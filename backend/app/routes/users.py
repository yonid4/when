"""
User routes for managing user profiles and settings.
"""

from flask import Blueprint, request, jsonify
from ..utils.decorators import require_auth
from ..models.profile import Profile
from ..services.users import UsersService
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
        users_service = UsersService(getattr(request, "access_token", None))
        # Build Profile model, then persist via service
        profile_model = Profile(
            id=user_id,
            email_address=data.get("email_address"),
            full_name=data.get("full_name"),
            avatar_url=data.get("avatar_url"),
            google_auth_token=data.get("google_auth_token"),
            google_calendar_id=data.get("google_calendar_id"),
            timezone=data.get("timezone", "UTC"),
        )
        profile = users_service.create_profile(user_id, profile_model.to_dict())
        if not profile:
            return jsonify({
                'error': 'Failed to create profile',
                'message': 'Validation or insert error'
            }), 400
        logging.info(f"[USER] Created profile for user {user_id}")
        return jsonify(profile), 201

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
    Get user profile from profiles table.
    """
    users_service = UsersService(getattr(request, "access_token", None))
    profile = users_service.get_profile(user_id)
    if not profile:
        logging.info(f"[USER] Profile not found for user {user_id}")
        return jsonify({
            'error': 'User not found',
            'message': f'No profile found for user {user_id}'
        }), 404
    logging.info(f"[USER] Fetched profile for user {user_id}")
    return jsonify(profile), 200
    
@user_bp.route('/<string:user_id>', methods=['PUT'])
@require_auth
def update_user(user_id):
    """
    Update a user's profile. Only the user themselves can update their profile.
    """
    auth_user_id = request.user.id
    if auth_user_id != user_id:
        return jsonify({
            'error': 'Unauthorized',
            'message': 'You can only update your own profile'
        }), 403
    data = request.get_json() or {}
    users_service = UsersService(getattr(request, "access_token", None))
    updated = users_service.update_profile(user_id, data)
    if not updated:
        return jsonify({
            'error': 'Failed to update profile',
            'message': 'Update unsuccessful'
        }), 400
    return jsonify(updated), 200

@user_bp.route('/<string:user_id>', methods=['DELETE'])
@require_auth
def delete_user(user_id):
    """
    Delete a user's profile. Only the user themselves can delete.
    """
    auth_user_id = request.user.id
    if auth_user_id != user_id:
        return jsonify({
            'error': 'Unauthorized',
            'message': 'You can only delete your own profile'
        }), 403
    users_service = UsersService(getattr(request, "access_token", None))
    ok = users_service.delete_profile(user_id)
    if not ok:
        return jsonify({
            'error': 'Failed to delete profile',
            'message': 'Delete unsuccessful'
        }), 400
    return jsonify({'message': 'Profile deleted successfully'}), 200