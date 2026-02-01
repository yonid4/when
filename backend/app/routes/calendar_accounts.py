"""
Calendar Accounts routes for managing multi-calendar support.

Endpoints:
- GET /api/calendar-accounts - List user's connected accounts with sources
- GET /api/calendar-accounts/<account_id> - Get single account
- DELETE /api/calendar-accounts/<account_id> - Disconnect account
- GET /api/calendar-accounts/<account_id>/calendars - Fetch calendars from Google API
- POST /api/calendar-accounts/<account_id>/sync-calendars - Sync calendar list to DB
- PUT /api/calendar-accounts/sources/<source_id> - Update source (is_enabled, is_write_calendar)
- GET /api/calendar-accounts/write-calendar - Get user's write calendar
"""

from flask import Blueprint, request, jsonify
from ..utils.decorators import require_auth
from ..services.calendar_accounts import CalendarAccountsService
from ..services import google_calendar
import logging

calendar_accounts_bp = Blueprint("calendar_accounts", __name__, url_prefix="/api/calendar-accounts")


@calendar_accounts_bp.route("/", methods=["GET"])
@require_auth
def get_accounts(user_id):
    """
    List all connected calendar accounts for the current user.

    Returns:
        JSON array of accounts with nested sources
    """
    try:
        service = CalendarAccountsService()
        accounts = service.get_user_accounts(user_id)

        # Remove sensitive credentials from response
        for account in accounts:
            if "credentials" in account:
                del account["credentials"]

        return jsonify({
            "accounts": accounts,
            "count": len(accounts)
        }), 200

    except Exception as e:
        logging.error(f"Error getting calendar accounts: {e}")
        return jsonify({
            "error": "Failed to get calendar accounts",
            "message": str(e)
        }), 500


@calendar_accounts_bp.route("/<account_id>", methods=["GET"])
@require_auth
def get_account(user_id, account_id):
    """
    Get a single calendar account by ID.

    Args:
        account_id: Account's unique ID

    Returns:
        JSON account object with sources
    """
    try:
        service = CalendarAccountsService()
        account = service.get_account(account_id)

        if not account:
            return jsonify({
                "error": "Account not found",
                "message": f"No account found with ID {account_id}"
            }), 404

        # Verify ownership
        if account["user_id"] != user_id:
            return jsonify({
                "error": "Unauthorized",
                "message": "You don't have access to this account"
            }), 403

        # Remove sensitive credentials from response
        if "credentials" in account:
            del account["credentials"]

        return jsonify(account), 200

    except Exception as e:
        logging.error(f"Error getting calendar account {account_id}: {e}")
        return jsonify({
            "error": "Failed to get calendar account",
            "message": str(e)
        }), 500


@calendar_accounts_bp.route("/<account_id>", methods=["DELETE"])
@require_auth
def delete_account(user_id, account_id):
    """
    Disconnect a calendar account (revokes token, cascade deletes sources).

    Args:
        account_id: Account's unique ID

    Returns:
        JSON success message
    """
    try:
        service = CalendarAccountsService()
        account = service.get_account(account_id)

        if not account:
            return jsonify({
                "error": "Account not found",
                "message": f"No account found with ID {account_id}"
            }), 404

        # Verify ownership
        if account["user_id"] != user_id:
            return jsonify({
                "error": "Unauthorized",
                "message": "You don't have access to this account"
            }), 403

        # Delete account (revokes token and cascade deletes sources)
        success = service.delete_account(account_id)

        if success:
            return jsonify({
                "message": "Account disconnected successfully"
            }), 200
        else:
            return jsonify({
                "error": "Failed to disconnect account",
                "message": "An error occurred while disconnecting the account"
            }), 500

    except Exception as e:
        logging.error(f"Error deleting calendar account {account_id}: {e}")
        return jsonify({
            "error": "Failed to disconnect account",
            "message": str(e)
        }), 500


@calendar_accounts_bp.route("/<account_id>/calendars", methods=["GET"])
@require_auth
def get_account_calendars(user_id, account_id):
    """
    Fetch available calendars from the provider API.

    This returns the current state from Google Calendar API, not the DB.
    Use POST /sync-calendars to save to DB.

    Args:
        account_id: Account's unique ID

    Returns:
        JSON array of calendars from the provider
    """
    try:
        service = CalendarAccountsService()
        account = service.get_account(account_id)

        if not account:
            return jsonify({
                "error": "Account not found",
                "message": f"No account found with ID {account_id}"
            }), 404

        # Verify ownership
        if account["user_id"] != user_id:
            return jsonify({
                "error": "Unauthorized",
                "message": "You don't have access to this account"
            }), 403

        if account["provider"] != "google":
            return jsonify({
                "error": "Unsupported provider",
                "message": f"Provider {account['provider']} is not supported"
            }), 400

        # Get credentials and fetch calendars
        creds_dict = account.get("credentials")
        if not creds_dict:
            return jsonify({
                "error": "No credentials",
                "message": "Account has no stored credentials"
            }), 400

        credentials = google_calendar.get_credentials_from_dict(creds_dict)
        calendars = google_calendar.get_user_calendars_list(credentials)

        return jsonify({
            "calendars": calendars,
            "count": len(calendars)
        }), 200

    except Exception as e:
        logging.error(f"Error fetching calendars for account {account_id}: {e}")
        return jsonify({
            "error": "Failed to fetch calendars",
            "message": str(e)
        }), 500


@calendar_accounts_bp.route("/<account_id>/sync-calendars", methods=["POST"])
@require_auth
def sync_account_calendars(user_id, account_id):
    """
    Sync calendar list from provider to database.

    This fetches calendars from the provider and upserts them to calendar_sources.

    Args:
        account_id: Account's unique ID

    Returns:
        JSON array of synced calendar sources
    """
    try:
        service = CalendarAccountsService()
        account = service.get_account(account_id)

        if not account:
            return jsonify({
                "error": "Account not found",
                "message": f"No account found with ID {account_id}"
            }), 404

        # Verify ownership
        if account["user_id"] != user_id:
            return jsonify({
                "error": "Unauthorized",
                "message": "You don't have access to this account"
            }), 403

        # Sync calendars from provider
        synced_sources = service.sync_calendars_from_provider(account_id)

        return jsonify({
            "message": "Calendars synced successfully",
            "sources": synced_sources,
            "count": len(synced_sources)
        }), 200

    except Exception as e:
        logging.error(f"Error syncing calendars for account {account_id}: {e}")
        return jsonify({
            "error": "Failed to sync calendars",
            "message": str(e)
        }), 500


@calendar_accounts_bp.route("/sources/<source_id>", methods=["PUT"])
@require_auth
def update_source(user_id, source_id):
    """
    Update a calendar source (toggle is_enabled, set is_write_calendar).

    Args:
        source_id: Source's unique ID

    Body:
        is_enabled (bool): Whether to sync busy times from this calendar
        is_write_calendar (bool): Whether to create events on this calendar

    Returns:
        JSON updated source object
    """
    try:
        data = request.get_json() or {}

        service = CalendarAccountsService()
        source = service.get_source(source_id)

        if not source:
            return jsonify({
                "error": "Source not found",
                "message": f"No calendar source found with ID {source_id}"
            }), 404

        # Verify ownership through account
        account = source.get("calendar_accounts")
        if not account or account["user_id"] != user_id:
            return jsonify({
                "error": "Unauthorized",
                "message": "You don't have access to this calendar source"
            }), 403

        # Handle is_write_calendar specially - need to unset others first
        if data.get("is_write_calendar") is True:
            service.set_write_calendar(user_id, source_id)
            # Remove from updates since we handled it
            data.pop("is_write_calendar", None)

        # Update other fields
        if data:
            updated_source = service.update_source(source_id, data)
        else:
            updated_source = service.get_source(source_id)

        if not updated_source:
            return jsonify({
                "error": "Update failed",
                "message": "Failed to update calendar source"
            }), 500

        # Remove nested account data for cleaner response
        if "calendar_accounts" in updated_source:
            del updated_source["calendar_accounts"]

        return jsonify(updated_source), 200

    except Exception as e:
        logging.error(f"Error updating calendar source {source_id}: {e}")
        return jsonify({
            "error": "Failed to update calendar source",
            "message": str(e)
        }), 500


@calendar_accounts_bp.route("/write-calendar", methods=["GET"])
@require_auth
def get_write_calendar(user_id):
    """
    Get the user's write calendar (where events are created).

    Returns:
        JSON write calendar source with account info
    """
    try:
        service = CalendarAccountsService()
        write_calendar = service.get_write_calendar(user_id)

        if not write_calendar:
            return jsonify({
                "write_calendar": None,
                "message": "No write calendar set"
            }), 200

        # Remove sensitive credentials from response
        if "account" in write_calendar and "credentials" in write_calendar["account"]:
            del write_calendar["account"]["credentials"]

        return jsonify({
            "write_calendar": write_calendar
        }), 200

    except Exception as e:
        logging.error(f"Error getting write calendar for user {user_id}: {e}")
        return jsonify({
            "error": "Failed to get write calendar",
            "message": str(e)
        }), 500
