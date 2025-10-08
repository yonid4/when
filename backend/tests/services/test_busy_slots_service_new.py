"""
Tests for BusySlotService (current implementation at app.services.busy_slots).
"""

from unittest.mock import Mock, patch
from datetime import datetime

from app.services.busy_slots import BusySlotService
from app.models.busy_slot import BusySlot


def make_service(monkeypatch):
    mock_sb = Mock()
    monkeypatch.setattr("app.services.busy_slots.get_supabase", lambda: mock_sb)
    service = BusySlotService()
    service.supabase = mock_sb
    return service, mock_sb


def test_get_user_busy_slots_success(monkeypatch):
    service, mock_sb = make_service(monkeypatch)

    result_obj = Mock(); result_obj.data = [{"id": "1", "user_id": "u"}]
    mock_table = mock_sb.table.return_value
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.gte.return_value = mock_table
    mock_table.lte.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.execute.return_value = result_obj

    out = service.get_user_busy_slots("u", datetime(2024, 1, 1), datetime(2024, 1, 2))
    assert out == [{"id": "1", "user_id": "u"}]


def test_get_participants_busy_slots_success(monkeypatch):
    service, mock_sb = make_service(monkeypatch)

    result_obj = Mock(); result_obj.data = [{"id": "1", "user_id": "u1"}]
    mock_table = mock_sb.table.return_value
    mock_table.select.return_value = mock_table
    mock_table.in_.return_value = mock_table
    mock_table.gte.return_value = mock_table
    mock_table.lte.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.execute.return_value = result_obj

    out = service.get_participants_busy_slots(["u1", "u2"], datetime(2024, 1, 1), datetime(2024, 1, 2))
    assert out == [{"id": "1", "user_id": "u1"}]


def test_store_and_upsert_busy_slot(monkeypatch):
    service, mock_sb = make_service(monkeypatch)
    mock_table = mock_sb.table.return_value

    # upsert path: no existing -> insert (slot has no google_event_id)
    ins_exec = Mock(); ins_exec.data = [{"id": "new"}]
    mock_table.insert.return_value.execute.return_value = ins_exec

    slot = BusySlot(user_id="u", start_time_utc=datetime(2024, 1, 1, 9), end_time_utc=datetime(2024, 1, 1, 10))
    out = service.upsert_busy_slot(slot)
    assert out == {"id": "new"}

    # upsert path: existing -> update (provide google_event_id)
    slot.google_event_id = "gid"
    sel_exec = Mock(); sel_exec.data = [{"id": "existing"}]
    upd_exec = Mock(); upd_exec.data = [{"id": "existing", "updated": True}]
    mock_table.select.return_value.eq.return_value.eq.return_value.execute.return_value = sel_exec
    mock_table.update.return_value.eq.return_value.execute.return_value = upd_exec
    out2 = service.upsert_busy_slot(slot)
    assert out2.get("updated") is True


def test_delete_user_busy_slots_in_range(monkeypatch):
    service, mock_sb = make_service(monkeypatch)
    mock_table = mock_sb.table.return_value
    mock_table.delete.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.gte.return_value = mock_table
    mock_table.lte.return_value = mock_table
    mock_table.execute.return_value = Mock()
    ok = service.delete_user_busy_slots_in_range("u", datetime(2024,1,1), datetime(2024,1,2))
    assert ok is True


def test_rpc_get_merged_busy_slots_success(monkeypatch):
    service, mock_sb = make_service(monkeypatch)
    mock_rpc = mock_sb.rpc.return_value
    res = Mock(); res.data = [{"start_time": "s", "end_time": "e", "busy_participants_count": 1}]
    mock_rpc.execute.return_value = res
    out = service.get_merged_busy_slots_for_event("event", datetime(2024,1,1), datetime(2024,1,2))
    assert out == res.data


def test_rpc_fallback_merge_logic(monkeypatch):
    service, mock_sb = make_service(monkeypatch)
    # RPC failure triggers fallback
    mock_sb.rpc.side_effect = Exception("fail")

    # Provide fallback source data
    # participants
    part_table = Mock()
    part_res = Mock(); part_res.data = [{"user_id": "u1"}, {"user_id": "u2"}]
    part_table.select.return_value.eq.return_value.execute.return_value = part_res

    # busy_slots table
    busy_table = Mock()
    busy_res = Mock(); busy_res.data = [
        {"start_time_utc": "2024-01-01T09:00:00+00:00", "end_time_utc": "2024-01-01T10:00:00+00:00", "user_id": "u1"},
        {"start_time_utc": "2024-01-01T09:30:00+00:00", "end_time_utc": "2024-01-01T10:30:00+00:00", "user_id": "u2"},
    ]
    busy_table.select.return_value.in_.return_value.gte.return_value.lte.return_value.order.return_value.execute.return_value = busy_res

    def table_side(name):
        if name == "event_participants":
            return part_table
        if name == "busy_slots":
            return busy_table
        return mock_sb.table.return_value

    mock_sb.table.side_effect = table_side

    out = service.get_merged_busy_slots_for_event("event", datetime(2024,1,1), datetime(2024,1,2))
    # Expect merged segments list
    assert isinstance(out, list) and len(out) > 0

