# Backend Testing Suite Creation Prompt for Claude Code

## Context
You are tasked with creating a comprehensive test suite for the "When" event coordination application backend. This is a Flask application with extensive features including AI-powered time proposals, Google Calendar integration, real-time notifications, and event management.

## Project Structure
The backend uses:
- **Framework**: Flask 3.1 with modular blueprint architecture
- **Testing Framework**: Pytest (already installed in requirements.txt)
- **Database**: Supabase (PostgreSQL) with service role key for admin operations
- **Authentication**: JWT-based with Flask-JWT-Extended
- **External APIs**: Google Calendar API, Google Gemini AI

## Current Test Organization
- Existing tests are located in `/backend/tests/`
- Current test files include basic service and endpoint tests
- Need to expand coverage significantly

## Task: Create Comprehensive Test Suite

### 1. Test Structure Requirements

Create the following test directory structure:
```
backend/tests/
├── __init__.py
├── conftest.py                    # Shared fixtures and configuration
├── unit/                          # Unit tests for individual components
│   ├── __init__.py
│   ├── models/                    # Model validation tests
│   │   ├── __init__.py
│   │   ├── test_event_model.py
│   │   ├── test_participant_model.py
│   │   ├── test_busy_slot_model.py
│   │   ├── test_preference_model.py
│   │   ├── test_proposed_time_model.py
│   │   ├── test_preferred_slot_model.py
│   │   └── test_notification_model.py
│   ├── services/                  # Service layer tests
│   │   ├── __init__.py
│   │   ├── test_auth_service.py
│   │   ├── test_events_service.py
│   │   ├── test_busy_slots_service.py
│   │   ├── test_google_calendar_service.py
│   │   ├── test_time_proposal_service.py
│   │   ├── test_preferred_slots_service.py
│   │   ├── test_invitations_service.py
│   │   ├── test_notifications_service.py
│   │   ├── test_event_finalization_service.py
│   │   └── test_users_service.py
│   └── utils/                     # Utility function tests
│       ├── __init__.py
│       ├── test_auth_utils.py
│       ├── test_decorators.py
│       ├── test_timezone_utils.py
│       └── test_validators.py
├── integration/                   # Integration tests
│   ├── __init__.py
│   ├── test_event_creation_flow.py
│   ├── test_invitation_flow.py
│   ├── test_google_calendar_sync.py
│   ├── test_ai_proposal_flow.py
│   ├── test_event_finalization_flow.py
│   └── test_notification_flow.py
├── api/                          # API endpoint tests
│   ├── __init__.py
│   ├── test_auth_routes.py
│   ├── test_event_routes.py
│   ├── test_availability_routes.py
│   ├── test_busy_slots_routes.py
│   ├── test_preferences_routes.py
│   ├── test_preferred_slots_routes.py
│   ├── test_time_proposal_routes.py
│   ├── test_invitations_routes.py
│   ├── test_notifications_routes.py
│   ├── test_event_finalization_routes.py
│   └── test_users_routes.py
└── fixtures/                     # Test data and fixtures
    ├── __init__.py
    ├── sample_events.py
    ├── sample_users.py
    └── sample_busy_slots.py
```

### 2. Testing Requirements for Each Component

#### conftest.py Should Include:
- Flask test client fixture
- Mock Supabase client
- Mock Google Calendar API client
- Mock Gemini AI client
- Sample user authentication tokens
- Database transaction rollback fixtures
- Mock datetime for consistent test times

#### Unit Tests Should Cover:

**Models** (Pydantic validation):
- Valid data instantiation
- Invalid data rejection
- Field validation rules
- Required vs optional fields
- Type checking

**Services**:
- All public methods
- Error handling and edge cases
- Database operations (with mocked Supabase)
- External API calls (with mocked responses)
- Business logic validation

**Utils**:
- Decorator behavior (@require_auth, @require_coordinator)
- Timezone conversions
- Validation functions
- Error handling

#### Integration Tests Should Cover:

**Complete User Flows**:
1. **Event Creation Flow**:
   - User creates event
   - System generates event UID
   - Event appears in database
   - Creator is added as participant

2. **Invitation Flow**:
   - Coordinator sends invitations
   - Notifications are created
   - Recipients receive invitations
   - RSVP updates event status

3. **Google Calendar Sync**:
   - OAuth flow initiation
   - Token storage
   - Busy time fetching
   - Differential sync updates

4. **AI Proposal Flow**:
   - Trigger proposal generation
   - Cache validation
   - Force refresh behavior
   - Background regeneration

5. **Event Finalization**:
   - Coordinator finalizes time
   - Participants notified
   - Event status updated
   - Calendar integration

#### API Tests Should Cover:

**For Each Endpoint**:
- Successful requests (200/201 responses)
- Authentication requirements
- Authorization (coordinator vs participant)
- Invalid input handling (400 errors)
- Not found errors (404)
- Server errors (500)
- Request/response data validation

### 3. Specific Testing Challenges to Address

#### Mocking External Services:
```python
# Mock Supabase client responses
@pytest.fixture
def mock_supabase_client(monkeypatch):
    # Return mock client with common methods

# Mock Google Calendar API
@pytest.fixture
def mock_google_calendar(monkeypatch):
    # Return mock calendar service

# Mock Gemini AI
@pytest.fixture
def mock_gemini_ai(monkeypatch):
    # Return mock AI responses
```

#### Authentication Testing:
```python
# Create fixture for authenticated requests
@pytest.fixture
def auth_headers(test_user):
    token = create_access_token(identity=test_user['id'])
    return {'Authorization': f'Bearer {token}'}
```

#### Timezone Handling:
```python
# Mock current time for consistent tests
@pytest.fixture
def fixed_datetime(monkeypatch):
    # Freeze time for testing
```

### 4. Test Coverage Goals

Aim for:
- **Overall**: 80%+ code coverage
- **Services**: 90%+ coverage (core business logic)
- **Routes**: 85%+ coverage (API endpoints)
- **Models**: 95%+ coverage (validation)
- **Utils**: 90%+ coverage (helper functions)

### 5. Testing Best Practices to Follow

1. **Arrange-Act-Assert** pattern for all tests
2. **Clear test names** that describe what's being tested
3. **One assertion per test** (or closely related assertions)
4. **Mock external dependencies** (databases, APIs)
5. **Use parametrized tests** for testing multiple scenarios
6. **Clean up after tests** (database rollbacks, file cleanup)
7. **Independent tests** that can run in any order
8. **Descriptive failure messages**

### 6. Example Test Template

```python
"""
Tests for [Component Name]
Located at: backend/app/services/example.py
"""
import pytest
from datetime import datetime, timezone
from unittest.mock import Mock, patch, MagicMock

from app.services.example import ExampleService
from app.models.example import ExampleModel

class TestExampleService:
    """Test suite for ExampleService"""
    
    @pytest.fixture
    def service(self, mock_supabase):
        """Create service instance with mocked dependencies"""
        return ExampleService(mock_supabase)
    
    @pytest.fixture
    def sample_data(self):
        """Sample test data"""
        return {
            'id': 'test-123',
            'name': 'Test Event',
            'created_at': datetime.now(timezone.utc).isoformat()
        }
    
    def test_create_success(self, service, sample_data):
        """Test successful creation of example"""
        # Arrange
        service.db.table.return_value.insert.return_value.execute.return_value.data = [sample_data]
        
        # Act
        result = service.create(sample_data)
        
        # Assert
        assert result['id'] == 'test-123'
        assert result['name'] == 'Test Event'
        service.db.table.assert_called_once_with('examples')
    
    def test_create_invalid_data(self, service):
        """Test creation with invalid data raises ValidationError"""
        # Arrange
        invalid_data = {'name': ''}  # Name cannot be empty
        
        # Act & Assert
        with pytest.raises(ValidationError) as exc_info:
            service.create(invalid_data)
        
        assert 'name' in str(exc_info.value)
    
    @pytest.mark.parametrize('user_role,should_succeed', [
        ('coordinator', True),
        ('participant', False),
        ('guest', False),
    ])
    def test_permission_based_access(self, service, user_role, should_succeed):
        """Test access control based on user role"""
        # Arrange
        user = {'id': 'user-123', 'role': user_role}
        
        # Act
        result = service.perform_action(user)
        
        # Assert
        if should_succeed:
            assert result is not None
        else:
            assert result is None or raises error
```

### 7. Running and Validating Tests

After creating tests, include instructions for:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html --cov-report=term

# Run specific test file
pytest tests/unit/services/test_events_service.py

# Run specific test
pytest tests/unit/services/test_events_service.py::TestEventsService::test_create_event

# Run with verbose output
pytest -v

# Run only failed tests
pytest --lf

# Run tests in parallel (if pytest-xdist installed)
pytest -n auto
```

### 8. Additional Requirements

1. **Documentation**: Each test file should have a module docstring explaining what's being tested
2. **Comments**: Complex test logic should be commented
3. **Fixtures**: Reusable fixtures should be in conftest.py
4. **Mock Data**: Realistic test data that mirrors production scenarios
5. **Error Cases**: Test both happy paths and error conditions
6. **Edge Cases**: Test boundary conditions and unusual inputs

### 9. Priority Order

Create tests in this order:
1. **conftest.py** - Setup fixtures first
2. **Unit tests for services** - Core business logic
3. **API endpoint tests** - User-facing functionality
4. **Model validation tests** - Data validation
5. **Integration tests** - Complete workflows
6. **Utils tests** - Helper functions

### 10. Key Files to Reference

When writing tests, reference these source files:
- `/backend/app/services/*.py` - Service implementations
- `/backend/app/routes/*.py` - API endpoints
- `/backend/app/models/*.py` - Data models
- `/backend/app/utils/*.py` - Utility functions
- `/backend/app/config.py` - Configuration

## Deliverables

1. Complete test directory structure as specified
2. All test files with comprehensive test cases
3. conftest.py with all necessary fixtures
4. README.md in tests/ explaining how to run tests
5. Coverage report showing 80%+ coverage

## Important Notes

- DO NOT make real API calls to Google Calendar or Gemini AI - always mock
- DO NOT connect to real Supabase database - use mocked client
- DO ensure all tests are independent and can run in isolation
- DO use descriptive test names that explain the scenario
- DO handle timezone-aware datetimes properly
- DO test both success and failure scenarios
- DO validate request/response data structures

## Questions to Clarify Before Starting

If you need clarification on:
1. Specific business logic requirements
2. Expected error handling behavior
3. Authentication/authorization rules
4. Data validation rules

Please ask before proceeding to ensure accurate tests.