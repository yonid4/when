"""
Authentication decorators for protecting routes.
"""
from functools import wraps
from flask import request, jsonify
from ..utils.supabase_client import get_supabase

def require_auth(f):
    """
    Decorator to require authentication for a route.
    Verifies the JWT token with Supabase and adds the user to the request context.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            return jsonify({
                'error': 'No authorization header',
                'message': 'Authorization header is required'
            }), 401

        try:
            # Get the token from the Authorization header
            # Format: "Bearer <token>"
            token = auth_header.split(" ")[1]
            
            # Get Supabase client
            supabase = get_supabase()
            
            # Verify the token with Supabase
            user = supabase.auth.get_user(token)
            
            # Add the user to the request context
            request.user = user.user
            
            return f(*args, **kwargs)
            
        except IndexError:
            return jsonify({
                'error': 'Invalid authorization header',
                'message': 'Authorization header must be in the format: Bearer <token>'
            }), 401
            
        except Exception as e:
            return jsonify({
                'error': 'Authentication failed',
                'message': str(e)
            }), 401
            
    return decorated
