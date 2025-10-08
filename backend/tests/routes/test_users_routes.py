"""
Route tests for users endpoints.
"""

from unittest.mock import patch


def test_create_user_profile(client, auth_headers, mock_authenticated_user):
    payload = {"email_address": "a@b.com", "full_name": "Alice"}
    with patch("app.routes.users.users_service.create_profile", return_value={"id": "user-123"}):
        resp = client.post("/api/users/", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        assert resp.get_json()["id"] == "user-123"


def test_get_user_profile_not_found(client, auth_headers, mock_authenticated_user):
    with patch("app.routes.users.users_service.get_profile", return_value=None):
        resp = client.get("/api/users/user-123", headers=auth_headers)
        assert resp.status_code == 404


def test_update_user_self_only(client, auth_headers, mock_authenticated_user):
    # unauthorized update different user
    resp = client.put("/api/users/other", json={"full_name": "X"}, headers=auth_headers)
    assert resp.status_code == 403

    # authorized
    with patch("app.routes.users.users_service.update_profile", return_value={"id": "user-123"}):
        resp2 = client.put("/api/users/user-123", json={"full_name": "X"}, headers=auth_headers)
        assert resp2.status_code == 200


def test_delete_user_self_only(client, auth_headers, mock_authenticated_user):
    # unauthorized
    resp = client.delete("/api/users/other", headers=auth_headers)
    assert resp.status_code == 403

    # authorized
    with patch("app.routes.users.users_service.delete_profile", return_value=True):
        resp2 = client.delete("/api/users/user-123", headers=auth_headers)
        assert resp2.status_code == 200

