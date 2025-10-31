"""
Initialize the Flask application.
"""

import os
import logging
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

# Load environment variables from .env file
load_dotenv()

# Verify required environment variables
required_vars = ["SUPABASE_URL", "SUPABASE_ANON_KEY"]
missing_vars = [var for var in required_vars if not os.getenv(var)]
if missing_vars:
    raise ValueError(
        f"Missing required environment variables: {', '.join(missing_vars)}. "
        "Please set them in your .env file."
    )

from .config import config
from .routes.users import user_bp
from .routes.events import event_bp
from .routes.auth import auth_bp
from .routes.availability import availability_bp
from .routes.preferences import preferences_bp
from .routes.google_calendar import calendar_bp
from .routes.busy_slots import busy_slots_bp
from .utils.supabase_client import init_supabase

def create_app(config_name="development"):
    """
    Create and configure the Flask application.
    
    Args:
        config_name (str): The configuration to use (development, testing, production)
        
    Returns:
        Flask: The configured Flask application
    """
    app = Flask(__name__)
    
    # Suppress noisy HTTP client debug logs
    logging.getLogger("hpack.hpack").setLevel(logging.WARNING)
    logging.getLogger("httpcore.connection").setLevel(logging.WARNING)
    logging.getLogger("httpcore.http2").setLevel(logging.WARNING)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize CORS to allow frontend origins and auth headers
    CORS(
        app,
        resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}},
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

    # Initialize background jobs
    from .background_jobs import init_background_jobs
    init_background_jobs(app)

    return app
