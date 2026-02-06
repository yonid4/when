"""
Authentication decorators for protecting routes.
"""

import logging
from functools import wraps

from flask import jsonify, make_response, request

from .supabase_client import get_supabase

logger = logging.getLogger(__name__)


def require_auth(f):
    """
    Decorator to require authentication for a route.
    Verifies the JWT token with Supabase and adds the user to the request context.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return _handle_cors_preflight()

        auth_header = request.headers.get("Authorization")
        logger.info(
            f"require_auth: Method={request.method}, Path={request.path}, "
            f"Auth header present={bool(auth_header)}"
        )

        if not auth_header:
            logger.warning(f"require_auth: No authorization header for {request.method} {request.path}")
            return jsonify({
                'error': 'No authorization header',
                'message': 'Authorization header is required'
            }), 401

        try:
            token = auth_header.split(" ")[1]
            logger.info(f"require_auth: Token extracted (length={len(token)})")

            supabase = get_supabase()
            logger.info("require_auth: Verifying token with Supabase...")
            user = supabase.auth.get_user(token)
            logger.info(f"require_auth: Token verified, user_id={user.user.id if user.user else 'None'}")

            request.user = user.user
            request.access_token = token
            logger.info(f"Authenticated user id: {getattr(request.user, 'id', 'unknown')}")

            return f(*args, user_id=user.user.id, **kwargs)

        except IndexError:
            logger.error(f"require_auth: Invalid authorization header format: {auth_header[:20]}...")
            return jsonify({
                'error': 'Invalid authorization header',
                'message': 'Authorization header must be in the format: Bearer <token>'
            }), 401

        except Exception as e:
            logger.error(
                f"require_auth: Authentication failed for {request.method} {request.path}: {e}",
                exc_info=True
            )
            return jsonify({
                'error': 'Authentication failed',
                'message': str(e)
            }), 401

    return decorated


def _handle_cors_preflight():
    """Handle CORS preflight OPTIONS request."""
    origin = request.headers.get("Origin", "*")
    allowed_headers = request.headers.get("Access-Control-Request-Headers", "Authorization, Content-Type")
    resp = make_response("", 204)
    resp.headers["Access-Control-Allow-Origin"] = origin
    resp.headers["Vary"] = "Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
    resp.headers["Access-Control-Allow-Credentials"] = "true"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = allowed_headers
    return resp
