"""
Initialize the Flask application.
"""

import os
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
# from .routes.calendar import calendar_bp
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
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    CORS(app)
    
    # Initialize Supabase client
    init_supabase(config_name)
    
    # Add a simple health check route
    @app.route('/')
    def health_check():
        return {"status": "ok", "message": "Event Coordination API is running"}, 200
    
    @app.route('/health')
    def health():
        return {"status": "healthy", "service": "event-coordination-api"}, 200

    # Register blueprints
    app.register_blueprint(user_bp)
    app.register_blueprint(event_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(availability_bp)
    app.register_blueprint(preferences_bp)
    # app.register_blueprint(calendar_bp)

    # # Initialize background jobs
    # from .background_jobs import init_background_jobs
    # init_background_jobs(app)

    return app
