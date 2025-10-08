"""
Tests for EventsService.
"""

from unittest.mock import Mock
from app.services.events import EventsService


def setup_mock(monkeypatch):
    mock_sb = Mock()
    monkeypatch.setattr("app.services.events.get_supabase", lambda: mock_sb)
    return mock_sb


def test_create_validate_and_get(monkeypatch):
    mock_sb = setup_mock(monkeypatch)
    service = EventsService()

    # invalid event data
    assert service.create_event({"name": "", "duration_minutes": 0}) is None

    # valid insert
    insert_result = Mock(); insert_result.data = [{"id": "e1", "name": "N"}]
    mock_sb.table.return_value.insert.return_value.execute.return_value = insert_result
    event = service.create_event({
        "name": "N",
        "coordinator_id": "u",
        "duration_minutes": 30
    })
    assert event["id"] == "e1"

    # get_event
    get_result = Mock(); get_result.data = [event]
    mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value = get_result
    assert service.get_event("e1")["name"] == "N"


def test_participants_and_permissions(monkeypatch):
    mock_sb = setup_mock(monkeypatch)
    service = EventsService()

    # get_event_participants
    part_res = Mock(); part_res.data = [{"user_id": "u"}]
    mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value = part_res
    assert service.get_event_participants("e1")[0]["user_id"] == "u"

    # check_user_permission: coordinator -> True
    def fake_get_event(_):
        return {"id": "e1", "coordinator_id": "u"}
    service.get_event = fake_get_event
    assert service.check_user_permission("e1", "u", "edit") is True

    # check_user_permission: view as participant
    service.get_event_participants = lambda _eid: [{"user_id": "p1"}]
    service.get_event = lambda _eid: {"id": "e1", "coordinator_id": "u"}
    assert service.check_user_permission("e1", "p1", "view") is True


def test_update_delete_status(monkeypatch):
    mock_sb = setup_mock(monkeypatch)
    service = EventsService()

    # update_event
    upd_res = Mock(); upd_res.data = [{"id": "e1", "name": "X"}]
    mock_sb.table.return_value.update.return_value.eq.return_value.execute.return_value = upd_res
    updated = service.update_event("e1", {"name": "X"})
    assert updated["name"] == "X"

    # delete_event
    mock_sb.table.return_value.delete.return_value.eq.return_value.execute.return_value = Mock()
    assert service.delete_event("e1") is True

    # status
    mock_sb.table.return_value.update.return_value.eq.return_value.execute.return_value = Mock()
    assert service.update_event_status("e1", "planning") is True

