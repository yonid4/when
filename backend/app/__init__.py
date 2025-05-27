"""
Event coordination application package.
"""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# Initialize extensions
db = SQLAlchemy()

def create_app(config_name="development"):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Configure the app
    if config_name == "testing":
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
        app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
        app.config["TESTING"] = True
    else:
        # Add your development/production config here
        pass
    
    # Initialize extensions with app
    db.init_app(app)
    
    return app
