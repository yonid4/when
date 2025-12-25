"""
Tests for PreferencesService.
"""

from unittest.mock import Mock
from app.services.preference import PreferencesService


def setup_mock(monkeypatch):
    mock_sb = Mock()
    monkeypatch.setattr("app.services.preference.get_supabase", lambda: mock_sb)
    return mock_sb


def test_add_and_get_and_delete(monkeypatch):
    mock_sb = setup_mock(monkeypatch)
    service = PreferencesService()

    # add
    insert_result = Mock()
    insert_result.data = [{"id": "pref-1"}]
    mock_sb.table.return_value.insert.return_value.execute.return_value = insert_result
    created = service.add_preference({
        "event_id": "e",
        "user_id": "u",
        "preferred_start_time_utc": "2025-01-01T10:00:00Z",
        "preferred_end_time_utc": "2025-01-01T11:00:00Z",
    })
    assert created["id"] == "pref-1"

    # get event prefs
    ev_res = Mock(); ev_res.data = [{"id": "pref-1"}]
    mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value = ev_res
    assert service.get_event_preferences("e") == [{"id": "pref-1"}]

    # get user prefs
    user_res = Mock(); user_res.data = [{"id": "pref-1", "user_id": "u"}]
    mock_sb.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = user_res
    assert service.get_user_preferences("e", "u")[0]["user_id"] == "u"

    # delete
    mock_sb.table.return_value.delete.return_value.eq.return_value.execute.return_value = Mock()
    assert service.delete_preference("pref-1") is True

