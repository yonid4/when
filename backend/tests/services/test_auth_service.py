"""
Tests for AuthService.
"""

from unittest.mock import Mock, patch
from app.services.auth import AuthService


def test_get_google_auth_url_delegates():
    service = AuthService()
    with patch("app.services.auth.gc.get_auth_url", return_value="https://auth") as mock_get:
        url = service.get_google_auth_url()
        assert url == "https://auth"
        mock_get.assert_called_once()


def test_exchange_code_for_credentials_delegates():
    service = AuthService()
    with patch(
        "app.services.auth.gc.get_credentials_from_code", return_value={"ok": True}
    ) as mock_fn:
        creds = service.exchange_code_for_credentials("code")
        assert creds == {"ok": True}
        mock_fn.assert_called_once_with("code")


def test_store_google_credentials_delegates():
    service = AuthService()
    with patch("app.services.auth.gc.store_credentials") as mock_store:
        service.store_google_credentials("user-1", {"token": "t"})
        mock_store.assert_called_once()


def test_get_session_success(monkeypatch):
    service = AuthService()
    mock_auth = Mock()
    mock_auth.get_session.return_value = {"user": {"id": "u"}}
    mock_sb = Mock()
    mock_sb.auth = mock_auth
    monkeypatch.setattr("app.services.auth.get_supabase", lambda: mock_sb)
    service = AuthService()
    assert service.get_session() == {"user": {"id": "u"}}


def test_get_session_error(monkeypatch):
    service = AuthService()
    mock_auth = Mock()
    mock_auth.get_session.side_effect = Exception("boom")
    mock_sb = Mock()
    mock_sb.auth = mock_auth
    monkeypatch.setattr("app.services.auth.get_supabase", lambda: mock_sb)
    service = AuthService()
    assert service.get_session() is None


def test_get_user_from_token_success(monkeypatch):
    mock_user = Mock()
    mock_user.user = {"id": "u"}
    mock_auth = Mock()
    mock_auth.get_user.return_value = mock_user
    mock_sb = Mock()
    mock_sb.auth = mock_auth
    monkeypatch.setattr("app.services.auth.get_supabase", lambda: mock_sb)
    service = AuthService()
    assert service.get_user_from_token("tok") == {"id": "u"}


def test_get_user_from_token_error(monkeypatch):
    mock_auth = Mock()
    mock_auth.get_user.side_effect = Exception("bad")
    mock_sb = Mock()
    mock_sb.auth = mock_auth
    monkeypatch.setattr("app.services.auth.get_supabase", lambda: mock_sb)
    service = AuthService()
    assert service.get_user_from_token("tok") is None


def test_verify_token(monkeypatch):
    service = AuthService()
    with patch.object(service, "get_user_from_token", return_value={"id": "u"}):
        assert service.verify_token("tok") is True
    with patch.object(service, "get_user_from_token", return_value=None):
        assert service.verify_token("tok") is False


def test_refresh_and_logout(monkeypatch):
    mock_auth = Mock()
    mock_auth.refresh_session.return_value = {"ok": True}
    mock_auth.sign_out.return_value = None
    mock_sb = Mock()
    mock_sb.auth = mock_auth
    monkeypatch.setattr("app.services.auth.get_supabase", lambda: mock_sb)
    service = AuthService()
    res, err = service.refresh_session("r")
    assert err is None and res == {"ok": True}
    ok, err2 = service.logout("a")
    assert ok is True and err2 is None

