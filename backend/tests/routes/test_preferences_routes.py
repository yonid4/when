"""
Route tests for preferences endpoints.
"""

from unittest.mock import patch


def test_add_preference_success(client, auth_headers, mock_authenticated_user):
    with patch("app.routes.preferences.preferences_service.add_preference", return_value={"id": "p"}):
        resp = client.post(
            "/api/preferences/e1",
            json={
                "preferred_start_time_utc": "2024-01-01T10:00:00Z",
                "preferred_end_time_utc": "2024-01-01T11:00:00Z",
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201


def test_get_preferences_success(client, auth_headers, mock_authenticated_user):
    with patch("app.routes.preferences.preferences_service.get_event_preferences", return_value=[]):
        resp = client.get("/api/preferences/e1", headers=auth_headers)
        assert resp.status_code == 200


def test_get_user_preferences_success(client, auth_headers, mock_authenticated_user):
    with patch("app.routes.preferences.preferences_service.get_user_preferences", return_value=[]):
        resp = client.get("/api/preferences/e1/u1", headers=auth_headers)
        assert resp.status_code == 200


def test_delete_preference_success(client, auth_headers, mock_authenticated_user):
    with patch("app.routes.preferences.preferences_service.delete_preference", return_value=True):
        resp = client.delete("/api/preferences/p1", headers=auth_headers)
        assert resp.status_code == 200

