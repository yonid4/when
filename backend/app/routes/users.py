"""
User routes for managing user profiles and settings.
"""

import logging

from flask import Blueprint, request, jsonify

from ..models.profile import Profile
from ..services.users import UsersService
from ..utils.decorators import require_auth

user_bp = Blueprint("users", __name__, url_prefix="/api/users")


def _get_users_service() -> UsersService:
    """Get UsersService with access token from request."""
    return UsersService(getattr(request, "access_token", None))


@user_bp.route('/', methods=['POST'])
@require_auth
def create_user(user_id):
    """Create a new user profile. User must be authenticated with Supabase Auth first."""
    data = request.get_json() or {}

    try:
        users_service = _get_users_service()
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


# Static routes MUST come BEFORE dynamic routes in Flask
@user_bp.route('/search', methods=['GET'])
@require_auth
def search_users(user_id):
    """Search users by email."""
    email = request.args.get('email')
    if not email:
        return jsonify({"error": "Email parameter required"}), 400

    users_service = _get_users_service()
    results = users_service.search_users(email)
    return jsonify(results), 200


@user_bp.route('/<string:target_user_id>', methods=['GET'])
@require_auth
def get_user(target_user_id, user_id):
    """Get user profile from profiles table."""
    users_service = _get_users_service()
    profile = users_service.get_profile(target_user_id)

    if not profile:
        logging.info(f"[USER] Profile not found for user {target_user_id}")
        return jsonify({
            'error': 'User not found',
            'message': f'No profile found for user {target_user_id}'
        }), 404

    return jsonify(profile), 200


@user_bp.route('/<string:target_user_id>', methods=['PUT'])
@require_auth
def update_user(target_user_id, user_id):
    """Update a user's profile. Only the user themselves can update their profile."""
    if user_id != target_user_id:
        return jsonify({
            'error': 'Unauthorized',
            'message': 'You can only update your own profile'
        }), 403

    data = request.get_json() or {}
    users_service = _get_users_service()
    updated = users_service.update_profile(target_user_id, data)

    if not updated:
        return jsonify({
            'error': 'Failed to update profile',
            'message': 'Update unsuccessful'
        }), 400

    return jsonify(updated), 200


@user_bp.route('/<string:target_user_id>', methods=['DELETE'])
@require_auth
def delete_user(target_user_id, user_id):
    """Delete a user's profile. Only the user themselves can delete."""
    if user_id != target_user_id:
        return jsonify({
            'error': 'Unauthorized',
            'message': 'You can only delete your own profile'
        }), 403

    users_service = _get_users_service()
    ok = users_service.delete_profile(target_user_id)

    if not ok:
        return jsonify({
            'error': 'Failed to delete profile',
            'message': 'Delete unsuccessful'
        }), 400

    return jsonify({'message': 'Profile deleted successfully'}), 200
