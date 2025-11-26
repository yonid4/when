"""
Authentication decorators for protecting routes.
"""
from functools import wraps
from flask import request, jsonify, make_response
import logging
from ..utils.supabase_client import get_supabase

def require_auth(f):
    """
    Decorator to require authentication for a route.
    Verifies the JWT token with Supabase and adds the user to the request context.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Allow CORS preflight without auth and include CORS headers explicitly
        if request.method == "OPTIONS":
            origin = request.headers.get("Origin", "*")
            acrm = request.headers.get("Access-Control-Request-Method", "GET")
            acrh = request.headers.get("Access-Control-Request-Headers", "Authorization, Content-Type")
            resp = make_response("", 204)
            resp.headers["Access-Control-Allow-Origin"] = origin
            resp.headers["Vary"] = "Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
            resp.headers["Access-Control-Allow-Credentials"] = "true"
            resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            resp.headers["Access-Control-Allow-Headers"] = acrh
            return resp
        auth_header = request.headers.get("Authorization")
        
        # Debug logging
        logging.getLogger(__name__).info(
            f"require_auth: Method={request.method}, Path={request.path}, "
            f"Auth header present={bool(auth_header)}"
        )
        
        if not auth_header:
            logging.getLogger(__name__).warning(
                f"require_auth: No authorization header for {request.method} {request.path}"
            )
            return jsonify({
                'error': 'No authorization header',
                'message': 'Authorization header is required'
            }), 401

        try:
            # Get the token from the Authorization header
            # Format: "Bearer <token>"
            token = auth_header.split(" ")[1]
            logging.getLogger(__name__).info(
                f"require_auth: Token extracted (length={len(token)})"
            )
            
            # Get Supabase client
            supabase = get_supabase()
            
            # Verify the token with Supabase
            logging.getLogger(__name__).info("require_auth: Verifying token with Supabase...")
            user = supabase.auth.get_user(token)
            logging.getLogger(__name__).info(
                f"require_auth: Token verified, user_id={user.user.id if user.user else 'None'}"
            )
            
            # Add the user to the request context
            request.user = user.user
            request.access_token = token
            
            logging.getLogger(__name__).info(
                f"Authenticated user id: {getattr(request.user, 'id', 'unknown')}"
            )
            return f(*args, user_id=user.user.id, **kwargs)
            
        except IndexError as e:
            logging.getLogger(__name__).error(
                f"require_auth: Invalid authorization header format: {auth_header[:20]}..."
            )
            return jsonify({
                'error': 'Invalid authorization header',
                'message': 'Authorization header must be in the format: Bearer <token>'
            }), 401
            
        except Exception as e:
            logging.getLogger(__name__).error(
                f"require_auth: Authentication failed for {request.method} {request.path}: {str(e)}",
                exc_info=True
            )
            return jsonify({
                'error': 'Authentication failed',
                'message': str(e)
            }), 401
            
    return decorated
