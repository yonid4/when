"""
Route tests for google_calendar endpoints.
"""

from unittest.mock import patch


def test_connection_status(client, auth_headers, mock_authenticated_user):
    with patch("app.routes.calendar.users_service.get_google_calendar_id", return_value="cal"):
        resp = client.get("/api/calendar/connection-status", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json()["google_calendar_id"] == "cal"


def test_sync_calendar_authorization(client, auth_headers, mock_authenticated_user):
    # event not found
    with patch("app.routes.calendar.events_service.get_event", return_value=None):
        resp = client.post("/api/calendar/sync/e1", headers=auth_headers)
        assert resp.status_code == 404

    # not a participant
    with patch("app.routes.calendar.events_service.get_event", return_value={"id": "e1"}):
        with patch("app.routes.calendar.events_service.is_user_participant", return_value=False):
            resp2 = client.post("/api/calendar/sync/e1", headers=auth_headers)
            assert resp2.status_code == 403

