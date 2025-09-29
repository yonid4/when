"""
Pytest configuration file with fixtures and setup.
"""

import pytest
from app import create_app, db
from app.models import User, Event, AvailableSlot, UserBusySlot, EventParticipant

@pytest.fixture(scope="session")
def app():
    """Create and configure a Flask app for testing."""
    app = create_app("testing")
    
    # Create the database and load test data
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope="function")
def _db(app):
    """Provide the transactional database session."""
    with app.app_context():
        yield db

@pytest.fixture(scope="function")
def session(_db):
    """Create a new database session for a test."""
    connection = _db.engine.connect()
    transaction = connection.begin()
    
    options = dict(bind=connection, binds={})
    session = _db.create_scoped_session(options=options)
    
    _db.session = session
    
    yield session
    
    transaction.rollback()
    connection.close()
    session.remove() 