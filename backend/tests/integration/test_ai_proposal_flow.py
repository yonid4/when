"""
Integration tests for AI time proposal generation flow.

Flow tested:
1. Request proposals →
2. Check cache →
3. Generate if needed (with Gemini AI) →
4. Store proposals →
5. Return to client →
6. Invalidate on event changes
"""

import pytest
import json
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch, MagicMock
from app.services.time_proposal import TimeProposalService


class TestAIProposalFlow:
    """Integration tests for AI-powered time proposal workflow."""

    @pytest.fixture
    def mock_supabase_for_proposals(self):
        """Mock Supabase client for proposal operations."""
        mock_client = Mock()

        # Storage
        events = [{
            "id": "event-123",
            "name": "Team Meeting",
            "coordinator_id": "user-1",
            "duration_minutes": 60,
            "earliest_date": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "latest_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "earliest_hour": "09:00:00",
            "latest_hour": "17:00:00",
            "status": "planning",
            "proposals_needs_regeneration": False,
            "proposals_last_generated_at": None
        }]

        participants = [
            {"event_id": "event-123", "user_id": "user-1"},
            {"event_id": "event-123", "user_id": "user-2"},
            {"event_id": "event-123", "user_id": "user-3"}
        ]

        profiles = [
            {"id": "user-1", "full_name": "User One", "email_address": "user1@example.com", "timezone": "America/New_York"},
            {"id": "user-2", "full_name": "User Two", "email_address": "user2@example.com", "timezone": "America/Los_Angeles"},
            {"id": "user-3", "full_name": "User Three", "email_address": "user3@example.com", "timezone": "UTC"}
        ]

        busy_slots = [
            {
                "user_id": "user-1",
                "start_time_utc": (datetime.now(timezone.utc) + timedelta(days=1, hours=10)).isoformat(),
                "end_time_utc": (datetime.now(timezone.utc) + timedelta(days=1, hours=11)).isoformat()
            }
        ]

        preferred_slots = []
        proposed_times = []

        def table_mock(table_name: str):
            table = Mock()

            if table_name == "events":
                def select_mock(fields="*"):
                    query = Mock()

                    def eq_mock(field, value):
                        result = Mock()
                        filtered = [e for e in events if e.get(field) == value]
                        result.execute.return_value.data = filtered
                        return result

                    query.eq = eq_mock
                    return query

                def update_mock(data):
                    query = Mock()

                    def eq_mock(field, value):
                        result = Mock()
                        for event in events:
                            if event.get(field) == value:
                                event.update(data)
                        result.execute.return_value.data = [e for e in events if e.get(field) == value]
                        return result

                    query.eq = eq_mock
                    return query

                table.select = select_mock
                table.update = update_mock

            elif table_name == "event_participants":
                def select_mock(fields="*"):
                    query = Mock()

                    def eq_mock(field, value):
                        result = Mock()
                        filtered = [p for p in participants if p.get(field) == value]
                        result.execute.return_value.data = filtered
                        return result

                    query.eq = eq_mock
                    return query

                table.select = select_mock

            elif table_name == "profiles":
                def select_mock(fields="*"):
                    query = Mock()

                    def in_mock(field, values):
                        result = Mock()
                        filtered = [p for p in profiles if p.get(field) in values]
                        result.execute.return_value.data = filtered
                        return result

                    query.in_ = in_mock
                    return query

                table.select = select_mock

            elif table_name == "busy_slots":
                def select_mock(fields="*"):
                    query = Mock()

                    def in_mock(field, values):
                        result = Mock()
                        filtered = [b for b in busy_slots if b.get(field) in values]
                        result.execute.return_value.data = filtered
                        return result

                    query.in_ = in_mock
                    return query

                table.select = select_mock

            elif table_name == "preferred_slots":
                def select_mock(fields="*"):
                    query = Mock()

                    def eq_mock(field, value):
                        result = Mock()
                        filtered = [p for p in preferred_slots if p.get(field) == value]
                        result.execute.return_value.data = filtered
                        return result

                    query.eq = eq_mock
                    return query

                table.select = select_mock

            elif table_name == "proposed_times":
                def select_mock(fields="*"):
                    query = Mock()

                    def eq_mock(field, value):
                        subquery = Mock()
                        filtered = [p for p in proposed_times if p.get(field) == value]

                        def order_mock(field, desc=False):
                            result = Mock()
                            sorted_data = sorted(filtered, key=lambda x: x.get(field, 0), reverse=desc)
                            result.execute.return_value.data = sorted_data
                            return result

                        def limit_mock(count):
                            result = Mock()
                            result.execute.return_value.data = filtered[:count]
                            return result

                        subquery.order = order_mock
                        subquery.limit = limit_mock
                        subquery.execute.return_value.data = filtered
                        return subquery

                    query.eq = eq_mock
                    return query

                def insert_mock(data):
                    result = Mock()
                    if isinstance(data, list):
                        for item in data:
                            proposal_data = {
                                **item,
                                "id": f"proposal-{len(proposed_times) + 1}",
                                "created_at": datetime.now(timezone.utc).isoformat()
                            }
                            proposed_times.append(proposal_data)
                    else:
                        proposal_data = {
                            **data,
                            "id": f"proposal-{len(proposed_times) + 1}",
                            "created_at": datetime.now(timezone.utc).isoformat()
                        }
                        proposed_times.append(proposal_data)
                    result.execute.return_value.data = proposed_times
                    return result

                def delete_mock():
                    query = Mock()

                    def eq_mock(field, value):
                        result = Mock()
                        nonlocal proposed_times
                        proposed_times = [p for p in proposed_times if p.get(field) != value]
                        result.execute.return_value = Mock()
                        return result

                    query.eq = eq_mock
                    return query

                table.select = select_mock
                table.insert = insert_mock
                table.delete = delete_mock

            return table

        mock_client.table = table_mock
        return mock_client

    @pytest.fixture
    def mock_gemini_response(self):
        """Mock Gemini AI response with time proposals."""
        return json.dumps([
            {
                "start_time_utc": (datetime.now(timezone.utc) + timedelta(days=2, hours=14)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "end_time_utc": (datetime.now(timezone.utc) + timedelta(days=2, hours=15)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "score": 95,
                "conflicts": 0,
                "reasoning": "No conflicts, preferred time zone for most participants"
            },
            {
                "start_time_utc": (datetime.now(timezone.utc) + timedelta(days=3, hours=10)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "end_time_utc": (datetime.now(timezone.utc) + timedelta(days=3, hours=11)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "score": 85,
                "conflicts": 0,
                "reasoning": "Morning slot, good for international team"
            },
            {
                "start_time_utc": (datetime.now(timezone.utc) + timedelta(days=4, hours=16)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "end_time_utc": (datetime.now(timezone.utc) + timedelta(days=4, hours=17)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "score": 75,
                "conflicts": 1,
                "reasoning": "One participant has minor conflict"
            }
        ])

    def test_complete_proposal_generation_flow(self, mock_supabase_for_proposals, mock_gemini_response):
        """
        Test complete flow from proposal request to storage.

        Steps:
        1. Request proposals
        2. Aggregate participant data
        3. Call Gemini AI
        4. Parse and validate response
        5. Store in cache
        6. Return to client
        """
        # Arrange
        event_id = "event-123"

        with patch('app.services.time_proposal.get_supabase', return_value=mock_supabase_for_proposals):
            with patch('app.services.time_proposal.create_client', return_value=mock_supabase_for_proposals):
                # Mock Gemini AI
                mock_model = Mock()
                mock_response = Mock()
                mock_response.text = mock_gemini_response
                mock_model.generate_content.return_value = mock_response

                with patch('app.services.time_proposal.GENAI_AVAILABLE', True):
                    service = TimeProposalService()
                    service.model = mock_model

                    # Act - Generate proposals
                    proposals = service.propose_times(event_id, num_suggestions=3)

                    # Assert - Proposals generated
                    assert len(proposals) == 3
                    assert all('start_time_utc' in p for p in proposals)
                    assert all('end_time_utc' in p for p in proposals)
                    assert all('score' in p for p in proposals)
                    assert all('conflicts' in p for p in proposals)
                    assert all('reasoning' in p for p in proposals)
                    assert all('availableCount' in p for p in proposals)
                    assert all('totalParticipants' in p for p in proposals)

                    # Verify Gemini was called
                    mock_model.generate_content.assert_called_once()

                    # Act - Save to cache
                    service.save_proposals_to_cache(event_id, proposals)

                    # Act - Retrieve from cache
                    cached_proposals = service.get_cached_proposals(event_id)

                    # Assert - Proposals cached and retrievable
                    assert cached_proposals is not None
                    assert len(cached_proposals) == 3

    def test_cache_hit_skips_ai_generation(self, mock_supabase_for_proposals, mock_gemini_response):
        """Test that cached proposals are returned without calling AI."""
        # Arrange
        event_id = "event-123"

        with patch('app.services.time_proposal.get_supabase', return_value=mock_supabase_for_proposals):
            with patch('app.services.time_proposal.create_client', return_value=mock_supabase_for_proposals):
                mock_model = Mock()
                mock_response = Mock()
                mock_response.text = mock_gemini_response
                mock_model.generate_content.return_value = mock_response

                with patch('app.services.time_proposal.GENAI_AVAILABLE', True):
                    service = TimeProposalService()
                    service.model = mock_model

                    # Generate and cache proposals
                    proposals = service.propose_times(event_id, num_suggestions=3)
                    service.save_proposals_to_cache(event_id, proposals)

                    # Reset mock
                    mock_model.generate_content.reset_mock()

                    # Act - Get cached proposals
                    cached_proposals = service.get_cached_proposals(event_id)

                    # Assert - Cache hit, AI not called
                    assert cached_proposals is not None
                    assert len(cached_proposals) == 3
                    mock_model.generate_content.assert_not_called()

    def test_force_regeneration_updates_cache(self, mock_supabase_for_proposals, mock_gemini_response):
        """Test force regeneration replaces cached proposals."""
        # Arrange
        event_id = "event-123"

        with patch('app.services.time_proposal.get_supabase', return_value=mock_supabase_for_proposals):
            with patch('app.services.time_proposal.create_client', return_value=mock_supabase_for_proposals):
                mock_model = Mock()
                mock_response = Mock()
                mock_response.text = mock_gemini_response
                mock_model.generate_content.return_value = mock_response

                with patch('app.services.time_proposal.GENAI_AVAILABLE', True):
                    service = TimeProposalService()
                    service.model = mock_model

                    # Generate initial proposals
                    initial_proposals = service.propose_times(event_id, num_suggestions=3)
                    service.save_proposals_to_cache(event_id, initial_proposals)

                    # Act - Force regeneration
                    new_proposals = service.regenerate_proposals_immediately(event_id, num_suggestions=3)

                    # Assert - New proposals generated
                    assert len(new_proposals) == 3
                    # Gemini should have been called twice (initial + regeneration)
                    assert mock_model.generate_content.call_count == 2

    def test_proposal_invalidation_on_participant_change(self, mock_supabase_for_proposals):
        """Test that proposals are marked as stale when participants change."""
        # Arrange
        event_id = "event-123"

        with patch('app.services.time_proposal.get_supabase', return_value=mock_supabase_for_proposals):
            with patch('app.services.time_proposal.create_client', return_value=mock_supabase_for_proposals):
                service = TimeProposalService()

                # Act - Mark proposals as stale
                service.mark_proposals_stale(event_id)

                # Get event to check flag
                event = mock_supabase_for_proposals.table("events").select("*").eq("id", event_id).execute().data[0]

                # Assert - Event marked for regeneration
                assert event["proposals_needs_regeneration"] is True

    def test_proposal_validation_rejects_invalid_times(self, mock_supabase_for_proposals):
        """Test that invalid proposals are rejected during validation."""
        # Arrange
        event_id = "event-123"

        invalid_gemini_response = json.dumps([
            {
                "start_time_utc": (datetime.now(timezone.utc) + timedelta(days=2, hours=15)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "end_time_utc": (datetime.now(timezone.utc) + timedelta(days=2, hours=14)).strftime("%Y-%m-%dT%H:%M:%SZ"),  # End before start!
                "score": 95,
                "conflicts": 0,
                "reasoning": "Invalid time order"
            },
            {
                "start_time_utc": (datetime.now(timezone.utc) + timedelta(days=3, hours=10)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "end_time_utc": (datetime.now(timezone.utc) + timedelta(days=3, hours=11)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "score": 85,
                "conflicts": 0,
                "reasoning": "Valid proposal"
            }
        ])

        with patch('app.services.time_proposal.get_supabase', return_value=mock_supabase_for_proposals):
            with patch('app.services.time_proposal.create_client', return_value=mock_supabase_for_proposals):
                mock_model = Mock()
                mock_response = Mock()
                mock_response.text = invalid_gemini_response
                mock_model.generate_content.return_value = mock_response

                with patch('app.services.time_proposal.GENAI_AVAILABLE', True):
                    service = TimeProposalService()
                    service.model = mock_model

                    # Act - Generate proposals (should filter invalid)
                    proposals = service.propose_times(event_id, num_suggestions=2)

                    # Assert - Only valid proposal returned
                    assert len(proposals) == 1
                    assert proposals[0]["reasoning"] == "Valid proposal"

    def test_proposal_duration_validation(self, mock_supabase_for_proposals):
        """Test that proposals match event duration requirements."""
        # Arrange
        event_id = "event-123"

        # Wrong duration (30 min instead of 60)
        wrong_duration_response = json.dumps([
            {
                "start_time_utc": (datetime.now(timezone.utc) + timedelta(days=2, hours=14)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "end_time_utc": (datetime.now(timezone.utc) + timedelta(days=2, hours=14, minutes=30)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "score": 95,
                "conflicts": 0,
                "reasoning": "Wrong duration"
            }
        ])

        with patch('app.services.time_proposal.get_supabase', return_value=mock_supabase_for_proposals):
            with patch('app.services.time_proposal.create_client', return_value=mock_supabase_for_proposals):
                mock_model = Mock()
                mock_response = Mock()
                mock_response.text = wrong_duration_response
                mock_model.generate_content.return_value = mock_response

                with patch('app.services.time_proposal.GENAI_AVAILABLE', True):
                    service = TimeProposalService()
                    service.model = mock_model

                    # Act - Generate proposals (should auto-correct duration)
                    proposals = service.propose_times(event_id, num_suggestions=1)

                    # Assert - Duration corrected to 60 minutes
                    assert len(proposals) == 1
                    start = datetime.fromisoformat(proposals[0]["start_time_utc"].replace("Z", "+00:00"))
                    end = datetime.fromisoformat(proposals[0]["end_time_utc"].replace("Z", "+00:00"))
                    duration_minutes = (end - start).total_seconds() / 60
                    assert duration_minutes == 60  # Corrected to event duration

    def test_no_participants_raises_error(self, mock_supabase_for_proposals):
        """Test that proposal generation fails for events with no participants."""
        # Arrange
        event_id = "event-456"

        # Add event with no participants
        mock_supabase_for_proposals.table("events").select("*").eq("id", event_id).execute().data = [{
            "id": event_id,
            "name": "No Participants Event",
            "coordinator_id": "user-1",
            "duration_minutes": 60,
            "earliest_date": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "latest_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "earliest_hour": "09:00:00",
            "latest_hour": "17:00:00"
        }]

        with patch('app.services.time_proposal.get_supabase', return_value=mock_supabase_for_proposals):
            with patch('app.services.time_proposal.create_client', return_value=mock_supabase_for_proposals):
                with patch('app.services.time_proposal.GENAI_AVAILABLE', True):
                    service = TimeProposalService()
                    service.model = Mock()

                    # Act & Assert - Should raise exception
                    with pytest.raises(Exception) as exc_info:
                        service.propose_times(event_id, num_suggestions=3)

                    error_msg = str(exc_info.value).lower()
                    assert (
                        "failed to aggregate" in error_msg
                        or "no participants" in error_msg
                        or "participant" in error_msg
                    )

    def test_proposal_sorting_by_conflicts_and_score(self, mock_supabase_for_proposals, mock_gemini_response):
        """Test that proposals are sorted by conflicts (ascending) then score (descending)."""
        # Arrange
        event_id = "event-123"

        with patch('app.services.time_proposal.get_supabase', return_value=mock_supabase_for_proposals):
            with patch('app.services.time_proposal.create_client', return_value=mock_supabase_for_proposals):
                mock_model = Mock()
                mock_response = Mock()
                mock_response.text = mock_gemini_response
                mock_model.generate_content.return_value = mock_response

                with patch('app.services.time_proposal.GENAI_AVAILABLE', True):
                    service = TimeProposalService()
                    service.model = mock_model

                    # Act
                    proposals = service.propose_times(event_id, num_suggestions=3)

                    # Assert - Sorted by conflicts first, then score
                    for i in range(len(proposals) - 1):
                        current = proposals[i]
                        next_prop = proposals[i + 1]

                        # If same conflicts, higher score should come first
                        if current["conflicts"] == next_prop["conflicts"]:
                            assert current["score"] >= next_prop["score"]
                        # Lower conflicts should come first
                        else:
                            assert current["conflicts"] <= next_prop["conflicts"]
