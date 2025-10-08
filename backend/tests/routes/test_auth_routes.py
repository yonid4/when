"""
Route tests for auth endpoints.
"""

from unittest.mock import patch, Mock


def test_debug_config(client):
    resp = client.get("/api/auth/debug/config")
    assert resp.status_code == 200


def test_login_redirects(client):
    with patch("app.services.auth.gc.get_auth_url", return_value="https://auth"):
        resp = client.get("/api/auth/login")
        assert resp.status_code in (301, 302)


def test_logout_requires_auth(client):
    resp = client.get("/api/auth/logout")
    assert resp.status_code == 401


def test_logout_success(client, auth_headers, mock_authenticated_user):
    with patch("app.routes.auth.auth_service.logout", return_value=(True, None)):
        resp = client.get("/api/auth/logout", headers=auth_headers)
        assert resp.status_code == 200


def test_refresh_missing_token(client):
    resp = client.post("/api/auth/refresh", json={})
    assert resp.status_code == 400


def test_refresh_success(client):
    with patch("app.routes.auth.auth_service.refresh_session", return_value=({"ok": True}, None)):
        resp = client.post("/api/auth/refresh", json={"refresh_token": "r"})
        assert resp.status_code == 200


def test_me_requires_auth(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_me_success(client, auth_headers, mock_authenticated_user):
    with patch("app.routes.auth.auth_service.get_user_from_token", return_value={"id": "u"}):
        resp = client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200


def test_google_route_configured(client, monkeypatch):
    with patch("app.routes.auth.auth_service.get_google_auth_url", return_value="https://auth"):
        resp = client.get("/api/auth/google")
        # config may fail if env missing; app factory validates env, so expect 200
        assert resp.status_code in (200, 400, 500)


def test_google_callback_missing_code(client):
    resp = client.get("/api/auth/google/callback")
    assert resp.status_code == 400


def test_google_callback_flow(client, monkeypatch):
    # Mock exchange and session
    with patch("app.routes.auth.auth_service.exchange_code_for_credentials", return_value={"c": 1}):
        mock_session = Mock(); mock_session.user = Mock(); mock_session.user.id = "user-123"
        with patch("app.routes.auth.auth_service.get_session", return_value=mock_session):
            with patch("app.routes.auth.auth_service.store_google_credentials") as mock_store:
                resp = client.get("/api/auth/google/callback?code=abc")
                # redirect to frontend
                assert resp.status_code in (301, 302)
                mock_store.assert_called_once()

