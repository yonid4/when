# Busy Slots Tests

This directory contains comprehensive tests for the busy slots functionality.

## Test Files

### 1. `test_busy_slots_service.py` 
**Service Layer Tests (Unit Tests)**
- Tests for `BusySlotService` class in `services_simple/busy_slots.py`
- Covers all CRUD operations, Google Calendar sync, and merging logic
- Uses mocked dependencies for fast execution
- **Classes:**
  - `TestBusySlotServiceBasicOperations` - CRUD operations
  - `TestBusySlotServiceAdvancedOperations` - Upsert, bulk operations
  - `TestBusySlotServiceParticipantOperations` - Event participant queries
  - `TestBusySlotServiceGoogleCalendarSync` - Google Calendar integration
  - `TestBusySlotServiceMergedSlots` - RPC and Python merging logic
  - `TestBusySlotServiceErrorHandling` - Error scenarios

### 2. `test_busy_slots_routes.py`
**API Routes Tests (Integration Tests)**
- Tests for all endpoints in `routes/busy_slots.py`
- Covers HTTP request/response handling, authentication, validation
- Uses mocked services and database
- **Classes:**
  - `TestAddBusySlots` - POST `/api/busy_slots/<event_id>`
  - `TestGetBusySlots` - GET `/api/busy_slots/<event_id>`
  - `TestGetUserBusySlots` - GET `/api/busy_slots/user/<user_id>`
  - `TestDeleteUserBusySlots` - DELETE `/api/busy_slots/<event_id>/<user_id>`
  - `TestSyncUserGoogleCalendar` - POST `/api/busy_slots/sync/<user_id>`
  - `TestGetEventParticipantsBusySlots` - GET `/api/busy_slots/event/<event_id>/participants`
  - `TestGetMergedBusySlots` - GET `/api/busy_slots/event/<event_id>/merged`
  - `TestRouteAuthentication` - Authentication requirements
  - `TestRouteInputValidation` - Input validation
  - `TestRouteErrorHandling` - Error handling

### 3. `test_busy_slots_integration.py`
**Integration Tests (Requires Database)**
- Tests RPC functionality with real database
- Tests Python merging logic comprehensively
- Performance and edge case testing
- **Classes:**
  - `TestBusySlotRPCIntegration` - RPC function testing
  - `TestBusySlotServiceFullIntegration` - Full workflow tests

## Running Tests

### Prerequisites
```bash
# Install test dependencies
pip install pytest pytest-cov

# Ensure you're in the backend directory
cd backend/
```

### Run All Tests
```bash
# Run all tests
pytest tests/

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

### Run Specific Test Categories

#### Unit Tests Only (Fast)
```bash
# Service tests (mocked, fast)
pytest tests/services/test_busy_slots_service.py -v

# Route tests (mocked, fast)  
pytest tests/test_busy_slots_routes.py -v
```

#### Integration Tests (Requires Database)
```bash
# Integration tests (requires real database)
pytest tests/test_busy_slots_integration.py -m integration -v

# Skip slow tests
pytest tests/ -m "not slow"
```

### Run Specific Test Classes
```bash
# Test basic service operations
pytest tests/services/test_busy_slots_service.py::TestBusySlotServiceBasicOperations -v

# Test merged slots functionality
pytest tests/services/test_busy_slots_service.py::TestBusySlotServiceMergedSlots -v

# Test API routes
pytest tests/test_busy_slots_routes.py::TestGetMergedBusySlots -v
```

### Run Specific Test Methods
```bash
# Test RPC functionality
pytest tests/services/test_busy_slots_service.py::TestBusySlotServiceMergedSlots::test_get_merged_busy_slots_for_event_rpc_success -v

# Test Python merging logic
pytest tests/services/test_busy_slots_service.py::TestBusySlotServiceMergedSlots::test_merge_overlapping_slots_python_basic -v
```

## Test Configuration

### Markers
- `@pytest.mark.unit` - Fast unit tests with mocks
- `@pytest.mark.integration` - Tests requiring database
- `@pytest.mark.slow` - Tests that take longer to run
- `@pytest.mark.rpc` - Tests requiring RPC functions

### Environment Setup

#### For Unit Tests
No special setup required - all dependencies are mocked.

#### For Integration Tests
1. **Database Setup**: Ensure Supabase connection is configured
2. **RPC Function**: Create the PostgreSQL RPC function:
   ```sql
   -- Run this in Supabase SQL Editor
   CREATE OR REPLACE FUNCTION get_merged_busy_slots_for_event(...)
   -- (See main implementation for full SQL)
   ```
3. **Test Data**: Some integration tests may require test data setup

## Test Coverage

The tests cover:

### Service Layer (`BusySlotService`)
- ✅ **Basic CRUD Operations**
  - `get_user_busy_slots()`
  - `get_busy_slots()`
  - `store_busy_slot()`
  - `delete_user_busy_slots_in_range()`

- ✅ **Advanced Operations**
  - `upsert_busy_slot()`
  - `bulk_store_busy_slots()`
  - `get_participants_busy_slots()`
  - `get_event_participants_busy_slots()`

- ✅ **Google Calendar Integration**
  - `sync_user_google_calendar()`
  - `delete_user_google_events()`

- ✅ **Merged Slots Logic**
  - `get_merged_busy_slots_for_event()` (RPC)
  - `_get_merged_busy_slots_fallback()` (Python)
  - `_merge_overlapping_slots_python()` (Algorithm)

- ✅ **Error Handling**
  - Database errors
  - Invalid input handling
  - Service failures

### API Routes
- ✅ **All Endpoints**
  - POST, GET, DELETE operations
  - Authentication requirements
  - Input validation
  - Error responses

- ✅ **HTTP Scenarios**
  - Success responses (200, 201)
  - Client errors (400, 404)
  - Server errors (500)
  - Malformed requests

### Integration Scenarios
- ✅ **RPC Function Testing**
- ✅ **Python Fallback Logic**
- ✅ **Complex Merging Scenarios**
- ✅ **Edge Cases**

## Debugging Tests

### Verbose Output
```bash
pytest tests/ -v -s
```

### Debug Specific Test
```bash
pytest tests/services/test_busy_slots_service.py::TestBusySlotServiceMergedSlots::test_merge_overlapping_slots_python_basic -v -s --pdb
```

### View Test Coverage
```bash
pytest tests/ --cov=app --cov-report=html
open htmlcov/index.html
```

## Adding New Tests

### For New Service Methods
1. Add test class in `test_busy_slots_service.py`
2. Mock all external dependencies
3. Test success and error scenarios
4. Add integration test if needed

### For New API Endpoints
1. Add test class in `test_busy_slots_routes.py`
2. Mock authentication and services
3. Test all HTTP methods and status codes
4. Test input validation and error handling

### Best Practices
- **Arrange, Act, Assert** pattern
- **Mock external dependencies** (database, APIs)
- **Test both success and failure paths**
- **Use descriptive test names**
- **Keep tests independent** (no shared state)
- **Use fixtures for common setup**
