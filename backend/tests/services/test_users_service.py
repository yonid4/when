"""
Tests for UsersService.
"""

from unittest.mock import Mock
from app.services.users import UsersService


def setup_mock(monkeypatch):
    mock_sb = Mock()
    monkeypatch.setattr("app.services.users.get_supabase", lambda: mock_sb)
    return mock_sb


def test_create_get_update_delete_profile(monkeypatch):
    mock_sb = setup_mock(monkeypatch)

    # insert
    insert_result = Mock()
    insert_result.data = [{"id": "user-1", "full_name": "Test"}]
    mock_sb.table.return_value.insert.return_value.execute.return_value = insert_result

    service = UsersService()
    created = service.create_profile("user-1", {"full_name": "Test"})
    assert created["id"] == "user-1"

    # get
    get_result = Mock()
    get_result.data = [created]
    mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value = (
        get_result
    )
    fetched = service.get_profile("user-1")
    assert fetched["full_name"] == "Test"

    # update
    update_result = Mock()
    update_result.data = [{"id": "user-1", "full_name": "New"}]
    mock_sb.table.return_value.update.return_value.eq.return_value.execute.return_value = (
        update_result
    )
    updated = service.update_profile("user-1", {"full_name": "New"})
    assert updated["full_name"] == "New"

    # delete
    mock_sb.table.return_value.delete.return_value.eq.return_value.execute.return_value = (
        Mock()
    )
    assert service.delete_profile("user-1") is True


def test_google_helpers(monkeypatch):
    mock_sb = setup_mock(monkeypatch)
    service = UsersService()

    # set/get credentials
    mock_sb.table.return_value.update.return_value.eq.return_value.execute.return_value = (
        Mock()
    )
    assert service.set_google_credentials("u", {"tok": 1}) is True

    get_result = Mock()
    get_result.data = [{"google_auth_token": {"tok": 1}}]
    mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value = (
        get_result
    )
    assert service.get_google_credentials("u") == {"tok": 1}

    # calendar id
    mock_sb.table.return_value.update.return_value.eq.return_value.execute.return_value = (
        Mock()
    )
    assert service.set_google_calendar_id("u", "cal") is True
    get_cal = Mock()
    get_cal.data = [{"google_calendar_id": "cal"}]
    mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value = (
        get_cal
    )
    assert service.get_google_calendar_id("u") == "cal"


def test_timezone_list_ensure(monkeypatch):
    mock_sb = setup_mock(monkeypatch)
    service = UsersService()

    # timezone
    mock_sb.table.return_value.update.return_value.eq.return_value.execute.return_value = (
        Mock()
    )
    assert service.set_timezone("u", "UTC") is True
    get_tz = Mock()
    get_tz.data = [{"timezone": "UTC"}]
    mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value = (
        get_tz
    )
    assert service.get_timezone("u") == "UTC"

    # list users
    list_result = Mock()
    list_result.data = [{"id": "u"}]
    mock_sb.table.return_value.select.return_value.range.return_value.order.return_value.execute.return_value = (
        list_result
    )
    assert service.list_users() == [{"id": "u"}]

    # ensure profile
    get_none = Mock()
    get_none.data = []
    mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value = (
        get_none
    )
    insert_res = Mock()
    insert_res.data = [{"id": "u"}]
    mock_sb.table.return_value.insert.return_value.execute.return_value = insert_res
    ensured = service.ensure_profile("u", {"full_name": "A"})
    assert ensured["id"] == "u"

