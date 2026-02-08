"""
Initialize the Flask application.
"""

import os
import logging
import sys
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

# Load environment variables from .env file only in development
# Docker Compose provides env vars directly, so we skip load_dotenv() when running via Gunicorn
if 'gunicorn' not in sys.argv[0] and not os.getenv("RUNNING_IN_DOCKER"):
    load_dotenv()

from .config import config
from .routes.users import user_bp
from .routes.events import event_bp
from .routes.auth import auth_bp
from .routes.availability import availability_bp
from .routes.preferences import preferences_bp
from .routes.calendar import calendar_bp
from .routes.busy_slots import busy_slots_bp
from .routes.preferred_slots import preferred_slots_bp
from .routes.event_finalization import event_finalization_bp
from .routes.notifications import notifications_bp
from .routes.invitations import invitations_bp
from .routes.time_proposal import time_proposal_bp
from .routes.calendar_accounts import calendar_accounts_bp
from .utils.supabase_client import init_supabase

def create_app(config_name="development"):
    """
    Create and configure the Flask application.
    
    Args:
        config_name (str): The configuration to use (development, testing, production)
        
    Returns:
        Flask: The configured Flask application
    """
    # Verify required environment variables (moved here from module level)
    required_vars = ["SUPABASE_URL", "SUPABASE_ANON_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        raise ValueError(
            f"Missing required environment variables: {', '.join(missing_vars)}. "
            "Please set them in your .env file or environment."
        )
    
    app = Flask(__name__)
    app.url_map.strict_slashes = False  # Accept URLs with or without trailing slashes

    # Suppress noisy HTTP client debug logs
    logging.getLogger("hpack.hpack").setLevel(logging.WARNING)
    logging.getLogger("httpcore.connection").setLevel(logging.WARNING)
    logging.getLogger("httpcore.http2").setLevel(logging.WARNING)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize CORS to allow frontend origins and auth headers
    # Get CORS origins from environment variable (supports multiple comma-separated origins)
    # Falls back to localhost for development if CORS_ORIGINS not set
    cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost,http://localhost:80")
    cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]

    CORS(
        app,
        resources={r"/api/*": {"origins": cors_origins}},
        supports_credentials=True,
        allow_headers="*",
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        expose_headers=["Content-Type", "Authorization"]
    )
    
    # Initialize Supabase client
    init_supabase(config_name)
    
    # Register blueprints
    app.register_blueprint(user_bp)
    app.register_blueprint(event_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(availability_bp)
    app.register_blueprint(preferences_bp)
    app.register_blueprint(calendar_bp)
    app.register_blueprint(busy_slots_bp)
    app.register_blueprint(preferred_slots_bp)
    app.register_blueprint(event_finalization_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(invitations_bp)
    app.register_blueprint(time_proposal_bp)
    app.register_blueprint(calendar_accounts_bp)

    # Initialize background jobs
    from .background_jobs import init_background_jobs
    init_background_jobs(app)


    print("\n" + "="*80)
    print("REGISTERED ROUTES:")
    print("="*80)
    for rule in app.url_map.iter_rules():
        if 'finalize' in rule.rule:
            print(f"Rule: {rule.rule}")
            print(f"Endpoint: {rule.endpoint}")
            print(f"Methods: {rule.methods}")
            print("-" * 40)
    print("="*80 + "\n")

    return app
