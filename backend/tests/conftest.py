"""
Pytest configuration file with fixtures and setup.
"""

import pytest
from app import create_app
from unittest.mock import Mock

@pytest.fixture(scope="session")
def app():
    """Create and configure a Flask app for testing."""
    app = create_app("testing")
    
    with app.app_context():
        yield app 


@pytest.fixture()
def client(app):
    """Flask test client."""
    return app.test_client()


@pytest.fixture()
def auth_headers():
    """Default authorization headers for protected routes."""
    return {"Authorization": "Bearer test-token"}


@pytest.fixture()
def mock_authenticated_user(monkeypatch):
    """Patch Supabase get_user to return a mock authenticated user for @require_auth routes."""
    # Lazy import to match real import path used in decorators
    from app.utils import supabase_client as supabase_client_module
    from app.utils import decorators as decorators_module

    mock_user_obj = Mock()
    mock_user_obj.user = Mock()
    mock_user_obj.user.id = "user-123"

    mock_auth = Mock()
    mock_auth.get_user.return_value = mock_user_obj

    mock_supabase = Mock()
    mock_supabase.auth = mock_auth

    monkeypatch.setattr(supabase_client_module, "get_supabase", lambda: mock_supabase)
    # Also patch the imported name used inside the decorator module
    monkeypatch.setattr(decorators_module, "get_supabase", lambda: mock_supabase)
    return mock_user_obj