"""
Route tests for events endpoints.
"""

from unittest.mock import patch


def test_create_event_validation(client, auth_headers, mock_authenticated_user):
    # missing required fields
    resp = client.post("/api/events/", json={"name": "X"}, headers=auth_headers)
    assert resp.status_code == 400


def test_create_event_success(client, auth_headers, mock_authenticated_user):
    payload = {
        "name": "Meet",
        "start_date": "2025-01-01T00:00:00Z",
        "end_date": "2025-01-02T00:00:00Z",
        "earliest_daily_start_time": "09:00",
        "latest_daily_end_time": "17:00",
        "duration_minutes": 60,
    }
    with patch("app.routes.events.EventsService") as mock_cls:
        instance = mock_cls.return_value
        instance.create_event.return_value = {"id": "e1"}
        instance.add_participant.return_value = {"id": "p1"}
        resp = client.post("/api/events/", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        assert resp.get_json()["id"] == "e1"


def test_get_event_not_found(client, auth_headers, mock_authenticated_user):
    with patch("app.routes.events.events_service.get_event", return_value=None):
        resp = client.get("/api/events/e1", headers=auth_headers)
        assert resp.status_code == 404


def test_get_event_success(client, auth_headers, mock_authenticated_user):
    with patch("app.routes.events.events_service.get_event", return_value={"id": "e1"}):
        with patch("app.routes.events.events_service.get_event_participants", return_value=[]):
            resp = client.get("/api/events/e1", headers=auth_headers)
            assert resp.status_code == 200


def test_update_event_success(client, auth_headers, mock_authenticated_user):
    with patch("app.routes.events.EventsService") as mock_cls:
        instance = mock_cls.return_value
        instance.update_event.return_value = {"id": "e1", "name": "New"}
        resp = client.put("/api/events/e1", json={"name": "New"}, headers=auth_headers)
        assert resp.status_code == 200


def test_delete_event_authorization(client, auth_headers, mock_authenticated_user):
    # not coordinator
    with patch("app.routes.events.events_service.get_event", return_value={"id": "e1", "coordinator_id": "other"}):
        resp = client.delete("/api/events/e1", headers=auth_headers)
        assert resp.status_code == 403

    # success path
    with patch("app.routes.events.events_service.get_event", return_value={"id": "e1", "coordinator_id": "user-123"}):
        with patch("app.routes.events.events_service.delete_event", return_value=True):
            resp2 = client.delete("/api/events/e1", headers=auth_headers)
            assert resp2.status_code == 200


def test_participants_endpoints(client, auth_headers, mock_authenticated_user):
    with patch("app.routes.events.events_service.add_participant", return_value={"id": "p"}):
        resp = client.post("/api/events/e1/participants", json={"user_id": "u"}, headers=auth_headers)
        assert resp.status_code == 201

    with patch("app.routes.events.events_service.update_participant_status", return_value={"status": "accepted"}):
        resp2 = client.put("/api/events/e1/participants/u", json={"status": "accepted"}, headers=auth_headers)
        assert resp2.status_code == 200

    # invalid status
    resp3 = client.put("/api/events/e1/participants/u", json={"status": "weird"}, headers=auth_headers)
    assert resp3.status_code == 400

