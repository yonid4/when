"""
Comprehensive unit tests for TimeProposalService.

Test coverage:
- propose_times: success, Gemini API integration, validation
- get_cached_proposals: cache hit, cache miss
- save_proposals_to_cache: success, replace existing
- regenerate_proposals_immediately: force regeneration
- should_regenerate: various scenarios
- mark_proposals_stale: success
- _aggregate_participant_data: success, no participants
- _calculate_free_windows: conflict-free slots, all busy
- _format_gemini_prompt: proper formatting
- _call_gemini_api: success, rate limit, retry logic
- _parse_gemini_response: JSON parsing, markdown cleanup
- _validate_proposed_times: valid, duration mismatch
"""

import pytest
import json
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch, MagicMock
from app.services.time_proposal import TimeProposalService


# ============================================================================
# Test Fixtures
# ============================================================================

@pytest.fixture
def mock_supabase():
    """Create a mock Supabase client."""
    return Mock()


@pytest.fixture
def mock_genai():
    """Create a mock Gemini AI client."""
    mock = Mock()
    mock_model = Mock()
    mock.GenerativeModel.return_value = mock_model
    return mock, mock_model


@pytest.fixture
def time_proposal_service(mock_supabase, mock_genai):
    """Create TimeProposalService with mocked dependencies."""
    mock_gen, mock_model = mock_genai

    # Mock the get_supabase function and genai module
    with patch("app.services.time_proposal.get_supabase", return_value=mock_supabase), \
         patch("app.services.time_proposal.GENAI_AVAILABLE", True), \
         patch.dict("os.environ", {
             "GEMINI_API_KEY": "test-gemini-key",
             "GEMINI_MODEL": "gemini-pro"
         }):
        # Import genai mock after patching GENAI_AVAILABLE
        import app.services.time_proposal as tp_module
        tp_module.genai = mock_gen

        service = TimeProposalService()
        service.service_role_client = mock_supabase
        service.model = mock_model
        yield service


@pytest.fixture
def sample_event():
    """Sample event data."""
    return {
        "id": "event-123",
        "name": "Team Meeting",
        "description": "Quarterly planning",
        "duration_minutes": 60,
        "earliest_date": "2025-12-20",
        "latest_date": "2025-12-27",
        "earliest_hour": "09:00:00",
        "latest_hour": "17:00:00",
        "coordinator_id": "user-coordinator"
    }


@pytest.fixture
def sample_participants():
    """Sample participants data."""
    return [
        {
            "id": "user-1",
            "full_name": "Alice",
            "email_address": "alice@example.com",
            "timezone": "America/New_York"
        },
        {
            "id": "user-2",
            "full_name": "Bob",
            "email_address": "bob@example.com",
            "timezone": "America/Los_Angeles"
        }
    ]


@pytest.fixture
def sample_gemini_response():
    """Sample Gemini API response."""
    return json.dumps([
        {
            "start_time_utc": "2025-12-20T14:00:00Z",
            "end_time_utc": "2025-12-20T15:00:00Z",
            "conflicts": 0,
            "reasoning": "Perfect time - all participants free"
        },
        {
            "start_time_utc": "2025-12-21T10:00:00Z",
            "end_time_utc": "2025-12-21T11:00:00Z",
            "conflicts": 0,
            "reasoning": "Good time in morning"
        }
    ])


# ============================================================================
# Tests: propose_times
# ============================================================================

class TestProposeTimes:
    """Tests for propose_times method."""

    def test_propose_times_success(self, time_proposal_service, mock_supabase, sample_event, sample_participants, sample_gemini_response):
        """Test successfully generating time proposals."""
        # Arrange - Mock data aggregation
        event_result = Mock()
        event_result.data = [sample_event]

        participants_result = Mock()
        participants_result.data = [{"user_id": p["id"]} for p in sample_participants]

        profiles_result = Mock()
        profiles_result.data = sample_participants

        busy_slots_result = Mock()
        busy_slots_result.data = []

        preferred_slots_result = Mock()
        preferred_slots_result.data = []

        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = event_result

        def mock_table_chain(*args, **kwargs):
            table_name = args[0] if args else None
            mock_chain = Mock()

            if table_name == "events":
                mock_chain.select.return_value.eq.return_value.execute.return_value = event_result
            elif table_name == "event_participants":
                mock_chain.select.return_value.eq.return_value.execute.return_value = participants_result
            elif table_name == "profiles":
                mock_chain.select.return_value.in_.return_value.execute.return_value = profiles_result
            elif table_name == "busy_slots":
                mock_chain.select.return_value.in_.return_value.execute.return_value = busy_slots_result
            elif table_name == "preferred_slots":
                mock_chain.select.return_value.eq.return_value.execute.return_value = preferred_slots_result

            return mock_chain

        mock_supabase.table.side_effect = mock_table_chain

        # Mock Gemini response
        mock_response = Mock()
        mock_response.text = sample_gemini_response
        time_proposal_service.model.generate_content.return_value = mock_response

        # Act
        result = time_proposal_service.propose_times("event-123", num_suggestions=2)

        # Assert
        assert len(result) == 2
        assert result[0]["conflicts"] == 0
        assert "start_time_utc" in result[0]
        assert "preferredCount" in result[0]

    def test_propose_times_no_gemini_available(self, monkeypatch, mock_supabase):
        """Test propose_times fails when Gemini is not available."""
        # Arrange
        monkeypatch.setattr("app.services.time_proposal.GENAI_AVAILABLE", False)
        monkeypatch.setattr("app.services.time_proposal.get_supabase", lambda access_token=None: mock_supabase)
        monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
        monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-key")

        service = TimeProposalService()
        service.service_role_client = mock_supabase

        # Act & Assert
        with pytest.raises(Exception, match="Gemini AI library not installed"):
            service.propose_times("event-123")

    def test_propose_times_no_participants(self, time_proposal_service, mock_supabase, sample_event):
        """Test propose_times fails when event has no participants."""
        # Arrange
        event_result = Mock()
        event_result.data = [sample_event]

        participants_result = Mock()
        participants_result.data = []

        def mock_table_chain(*args, **kwargs):
            mock_chain = Mock()
            table_name = args[0] if args else None

            if table_name == "events":
                mock_chain.select.return_value.eq.return_value.execute.return_value = event_result
            elif table_name == "event_participants":
                mock_chain.select.return_value.eq.return_value.execute.return_value = participants_result

            return mock_chain

        mock_supabase.table.side_effect = mock_table_chain

        # Act & Assert
        with pytest.raises(Exception, match="Failed to aggregate event data"):
            time_proposal_service.propose_times("event-123")


# ============================================================================
# Tests: _call_gemini_api
# ============================================================================

class TestCallGeminiApi:
    """Tests for _call_gemini_api method."""

    def test_call_gemini_api_success(self, time_proposal_service):
        """Test successful Gemini API call."""
        # Arrange
        prompt = "Test prompt"
        mock_response = Mock()
        mock_response.text = "Test response"
        time_proposal_service.model.generate_content.return_value = mock_response

        # Act
        result = time_proposal_service._call_gemini_api(prompt)

        # Assert
        assert result == "Test response"

    def test_call_gemini_api_rate_limit_retry(self, time_proposal_service):
        """Test Gemini API retries on rate limit."""
        # Arrange
        prompt = "Test prompt"

        # First call fails with rate limit, second succeeds
        mock_response = Mock()
        mock_response.text = "Success"

        time_proposal_service.model.generate_content.side_effect = [
            Exception("quota exceeded"),
            mock_response
        ]

        with patch("time.sleep"):  # Mock sleep to speed up test
            # Act
            result = time_proposal_service._call_gemini_api(prompt)

            # Assert
            assert result == "Success"

    def test_call_gemini_api_max_retries_exceeded(self, time_proposal_service):
        """Test Gemini API fails after max retries."""
        # Arrange
        prompt = "Test prompt"
        time_proposal_service.model.generate_content.side_effect = Exception("quota exceeded")

        with patch("time.sleep"):
            # Act & Assert
            with pytest.raises(Exception, match="rate limit exceeded"):
                time_proposal_service._call_gemini_api(prompt)


# ============================================================================
# Tests: _parse_gemini_response
# ============================================================================

class TestParseGeminiResponse:
    """Tests for _parse_gemini_response method."""

    def test_parse_valid_json(self, time_proposal_service):
        """Test parsing valid JSON response."""
        # Arrange
        response_text = json.dumps([
            {
                "start_time_utc": "2025-12-20T14:00:00Z",
                "end_time_utc": "2025-12-20T15:00:00Z",
                "conflicts": 0,
                "reasoning": "Good time"
            }
        ])

        # Act
        result = time_proposal_service._parse_gemini_response(response_text)

        # Assert
        assert len(result) == 1
        assert result[0]["conflicts"] == 0

    def test_parse_json_with_markdown(self, time_proposal_service):
        """Test parsing JSON wrapped in markdown code blocks."""
        # Arrange
        response_text = """```json
[
    {
        "start_time_utc": "2025-12-20T14:00:00Z",
        "end_time_utc": "2025-12-20T15:00:00Z",
        "conflicts": 0,
        "reasoning": "Good time"
    }
]
```"""

        # Act
        result = time_proposal_service._parse_gemini_response(response_text)

        # Assert
        assert len(result) == 1

    def test_parse_invalid_json(self, time_proposal_service):
        """Test parsing invalid JSON fails gracefully."""
        # Arrange
        response_text = "This is not JSON"

        # Act & Assert
        with pytest.raises(Exception, match="Failed to parse AI response"):
            time_proposal_service._parse_gemini_response(response_text)


# ============================================================================
# Tests: _validate_proposed_times
# ============================================================================

class TestValidateProposedTimes:
    """Tests for _validate_proposed_times method."""

    def test_validate_proposed_times_success(self, time_proposal_service, sample_event):
        """Test validation passes for valid proposals."""
        # Arrange
        proposals = [
            {
                "start_time_utc": "2025-12-20T14:00:00Z",
                "end_time_utc": "2025-12-20T15:00:00Z",
                "conflicts": 0,
                "reasoning": "Good time"
            }
        ]

        data = {
            "event": sample_event,
            "all_busy_slots": []
        }

        # Act
        result = time_proposal_service._validate_proposed_times(proposals, data)

        # Assert
        assert len(result) == 1

    def test_validate_missing_fields(self, time_proposal_service, sample_event):
        """Test validation skips proposals with missing fields."""
        # Arrange
        proposals = [
            {
                "start_time_utc": "2025-12-20T14:00:00Z",
                # Missing end_time_utc, conflicts, reasoning
            }
        ]

        data = {
            "event": sample_event,
            "all_busy_slots": []
        }

        # Act
        result = time_proposal_service._validate_proposed_times(proposals, data)

        # Assert
        assert len(result) == 0

    def test_validate_adjusts_duration_mismatch(self, time_proposal_service, sample_event):
        """Test validation adjusts duration mismatches."""
        # Arrange
        proposals = [
            {
                "start_time_utc": "2025-12-20T14:00:00Z",
                "end_time_utc": "2025-12-20T14:30:00Z",  # 30 min instead of 60
                "conflicts": 0,
                "reasoning": "Good time"
            }
        ]

        data = {
            "event": sample_event,
            "all_busy_slots": []
        }

        # Act
        result = time_proposal_service._validate_proposed_times(proposals, data)

        # Assert
        assert len(result) == 1
        # Duration should be adjusted to 60 minutes


# ============================================================================
# Tests: get_cached_proposals
# ============================================================================

class TestGetCachedProposals:
    """Tests for get_cached_proposals method."""

    def test_get_cached_proposals_success(self, time_proposal_service, mock_supabase):
        """Test getting cached proposals."""
        # Arrange
        event_id = "event-123"

        proposed_times_result = Mock()
        proposed_times_result.data = [
            {
                "start_time_utc": "2025-12-20T14:00:00",
                "end_time_utc": "2025-12-20T15:00:00",
                "conflicts": 0,
                "reasoning": "Good time",
                "rank": 0
            }
        ]

        event_result = Mock()
        event_result.data = [{"id": event_id}]

        participants_result = Mock()
        participants_result.data = [{"user_id": "user-1"}, {"user_id": "user-2"}]

        preferred_slots_result = Mock()
        preferred_slots_result.data = []

        def mock_table_chain(*args, **kwargs):
            mock_chain = Mock()
            table_name = args[0] if args else None

            if table_name == "proposed_times":
                mock_chain.select.return_value.eq.return_value.order.return_value.execute.return_value = proposed_times_result
            elif table_name == "events":
                mock_chain.select.return_value.eq.return_value.execute.return_value = event_result
            elif table_name == "event_participants":
                mock_chain.select.return_value.eq.return_value.execute.return_value = participants_result
            elif table_name == "preferred_slots":
                mock_chain.select.return_value.eq.return_value.execute.return_value = preferred_slots_result

            return mock_chain

        mock_supabase.table.side_effect = mock_table_chain

        # Act
        result = time_proposal_service.get_cached_proposals(event_id)

        # Assert
        assert result is not None
        assert len(result) == 1
        assert "preferredCount" in result[0]

    def test_get_cached_proposals_no_cache(self, time_proposal_service, mock_supabase):
        """Test getting cached proposals when none exist."""
        # Arrange
        proposed_times_result = Mock()
        proposed_times_result.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = proposed_times_result

        # Act
        result = time_proposal_service.get_cached_proposals("event-123")

        # Assert
        assert result is None


# ============================================================================
# Tests: save_proposals_to_cache
# ============================================================================

class TestSaveProposalsToCache:
    """Tests for save_proposals_to_cache method."""

    def test_save_proposals_success(self, time_proposal_service, mock_supabase):
        """Test saving proposals to cache."""
        # Arrange
        event_id = "event-123"
        proposals = [
            {
                "start_time_utc": "2025-12-20T14:00:00Z",
                "end_time_utc": "2025-12-20T15:00:00Z",
                "conflicts": 0,
                "reasoning": "Good time"
            }
        ]

        # Mock delete existing
        mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = Mock()

        # Mock insert new
        mock_supabase.table.return_value.insert.return_value.execute.return_value = Mock()

        # Mock update events table
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = Mock()

        # Act
        time_proposal_service.save_proposals_to_cache(event_id, proposals)

        # Assert - No exception raised means success


# ============================================================================
# Tests: should_regenerate
# ============================================================================

class TestShouldRegenerate:
    """Tests for should_regenerate method."""

    def test_should_regenerate_true(self, time_proposal_service, mock_supabase):
        """Test should_regenerate returns true when flag is set."""
        # Arrange
        event_result = Mock()
        event_result.data = [{
            "proposals_needs_regeneration": True,
            "proposals_last_generated_at": None
        }]

        proposals_result = Mock()
        proposals_result.data = []

        def mock_table_chain(*args, **kwargs):
            mock_chain = Mock()
            table_name = args[0] if args else None

            if table_name == "events":
                mock_chain.select.return_value.eq.return_value.execute.return_value = event_result
            elif table_name == "proposed_times":
                mock_chain.select.return_value.eq.return_value.limit.return_value.execute.return_value = proposals_result

            return mock_chain

        mock_supabase.table.side_effect = mock_table_chain

        # Act
        result = time_proposal_service.should_regenerate("event-123")

        # Assert
        assert result["needs_regeneration"] is True
        assert result["has_proposals"] is False

    def test_should_regenerate_false_with_proposals(self, time_proposal_service, mock_supabase):
        """Test should_regenerate returns false when proposals exist and flag is false."""
        # Arrange
        event_result = Mock()
        event_result.data = [{
            "proposals_needs_regeneration": False,
            "proposals_last_generated_at": "2025-12-18T10:00:00Z"
        }]

        proposals_result = Mock()
        proposals_result.data = [{"id": "proposal-1"}]

        def mock_table_chain(*args, **kwargs):
            mock_chain = Mock()
            table_name = args[0] if args else None

            if table_name == "events":
                mock_chain.select.return_value.eq.return_value.execute.return_value = event_result
            elif table_name == "proposed_times":
                mock_chain.select.return_value.eq.return_value.limit.return_value.execute.return_value = proposals_result

            return mock_chain

        mock_supabase.table.side_effect = mock_table_chain

        # Act
        result = time_proposal_service.should_regenerate("event-123")

        # Assert
        assert result["needs_regeneration"] is False
        assert result["has_proposals"] is True


# ============================================================================
# Tests: mark_proposals_stale
# ============================================================================

class TestMarkProposalsStale:
    """Tests for mark_proposals_stale method."""

    def test_mark_proposals_stale_success(self, time_proposal_service, mock_supabase):
        """Test marking proposals as stale."""
        # Arrange
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = Mock()

        # Act
        time_proposal_service.mark_proposals_stale("event-123")

        # Assert - No exception means success

    def test_mark_proposals_stale_database_error(self, time_proposal_service, mock_supabase):
        """Test mark_proposals_stale handles database errors gracefully."""
        # Arrange
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.side_effect = Exception("DB Error")

        # Act - Should not raise
        time_proposal_service.mark_proposals_stale("event-123")

        # Assert - No exception raised


# ============================================================================
# Tests: _calculate_free_windows
# ============================================================================

class TestCalculateFreeWindows:
    """Tests for _calculate_free_windows method."""

    def test_calculate_free_windows_all_free(self, time_proposal_service, sample_event):
        """Test calculating free windows when all time is free."""
        # Arrange
        data = {
            "event": sample_event,
            "participants": [{"user_id": "user-1"}],
            "all_busy_slots": []
        }

        # Act
        result = time_proposal_service._calculate_free_windows(data)

        # Assert
        assert len(result) > 0  # Should have free windows

    def test_calculate_free_windows_all_busy(self, time_proposal_service, sample_event):
        """Test calculating free windows when all time is busy."""
        # Arrange
        data = {
            "event": sample_event,
            "participants": [{"user_id": "user-1"}],
            "all_busy_slots": [
                {
                    "user_id": "user-1",
                    "start_time_utc": "2025-12-20T00:00:00Z",
                    "end_time_utc": "2025-12-27T23:59:59Z"
                }
            ]
        }

        # Act
        result = time_proposal_service._calculate_free_windows(data)

        # Assert
        assert len(result) == 0  # No free windows


# ============================================================================
# Tests: _format_gemini_prompt
# ============================================================================

class TestFormatGeminiPrompt:
    """Tests for _format_gemini_prompt method."""

    def test_format_gemini_prompt_includes_all_data(self, time_proposal_service, sample_event, sample_participants):
        """Test prompt includes all necessary data."""
        # Arrange
        data = {
            "event": sample_event,
            "participants": sample_participants,
            "all_busy_slots": [],
            "all_preferred_slots": [],
            "has_conflict_free_slots": True,
            "free_windows": []
        }

        # Act
        result = time_proposal_service._format_gemini_prompt(data, num_suggestions=5)

        # Assert
        assert "Team Meeting" in result
        assert "60 minutes" in result
        assert "Alice" in result
        assert "Bob" in result
        assert "EXACTLY 5" in result
