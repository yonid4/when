"""Calendar accounts routes for managing multi-calendar support."""

import logging

from flask import Blueprint, request, jsonify

from ..services import google_calendar, microsoft_calendar
from ..services.calendar_accounts import CalendarAccountsService
from ..utils.decorators import require_auth

calendar_accounts_bp = Blueprint("calendar_accounts", __name__, url_prefix="/api/calendar-accounts")


def _get_account_or_error(service: CalendarAccountsService, account_id: str, user_id: str):
    """Get account and verify ownership. Returns (account, error_response, status_code)."""
    account = service.get_account(account_id)

    if not account:
        return None, {"error": "Account not found", "message": f"No account found with ID {account_id}"}, 404

    if account["user_id"] != user_id:
        return None, {"error": "Unauthorized", "message": "You don't have access to this account"}, 403

    return account, None, None


def _remove_credentials(account: dict) -> dict:
    """Remove sensitive credentials from account dict."""
    if "credentials" in account:
        del account["credentials"]
    return account


@calendar_accounts_bp.route("/", methods=["GET"])
@require_auth
def get_accounts(user_id):
    """List all connected calendar accounts for the current user."""
    try:
        service = CalendarAccountsService()
        accounts = service.get_user_accounts(user_id)

        for account in accounts:
            _remove_credentials(account)

        return jsonify({"accounts": accounts, "count": len(accounts)}), 200

    except Exception as e:
        logging.error(f"Error getting calendar accounts: {e}")
        return jsonify({"error": "Failed to get calendar accounts", "message": str(e)}), 500


@calendar_accounts_bp.route("/<account_id>", methods=["GET"])
@require_auth
def get_account(user_id, account_id):
    """Get a single calendar account by ID."""
    try:
        service = CalendarAccountsService()
        account, error, status = _get_account_or_error(service, account_id, user_id)
        if error:
            return jsonify(error), status

        return jsonify(_remove_credentials(account)), 200

    except Exception as e:
        logging.error(f"Error getting calendar account {account_id}: {e}")
        return jsonify({"error": "Failed to get calendar account", "message": str(e)}), 500


@calendar_accounts_bp.route("/<account_id>", methods=["DELETE"])
@require_auth
def delete_account(user_id, account_id):
    """Disconnect a calendar account (revokes token, cascade deletes sources)."""
    try:
        service = CalendarAccountsService()
        account, error, status = _get_account_or_error(service, account_id, user_id)
        if error:
            return jsonify(error), status

        if service.delete_account(account_id):
            return jsonify({"message": "Account disconnected successfully"}), 200

        return jsonify({
            "error": "Failed to disconnect account",
            "message": "An error occurred while disconnecting the account"
        }), 500

    except Exception as e:
        logging.error(f"Error deleting calendar account {account_id}: {e}")
        return jsonify({"error": "Failed to disconnect account", "message": str(e)}), 500


@calendar_accounts_bp.route("/<account_id>/calendars", methods=["GET"])
@require_auth
def get_account_calendars(user_id, account_id):
    """Fetch available calendars from the provider API."""
    try:
        service = CalendarAccountsService()
        account, error, status = _get_account_or_error(service, account_id, user_id)
        if error:
            return jsonify(error), status

        creds_dict = account.get("credentials")
        if not creds_dict:
            return jsonify({"error": "No credentials", "message": "Account has no stored credentials"}), 400

        provider = account["provider"]
        if provider == "google":
            credentials = google_calendar.get_credentials_from_dict(creds_dict)
            calendars = google_calendar.get_user_calendars_list(credentials)
        elif provider == "microsoft":
            calendars = microsoft_calendar.get_user_calendars_list(creds_dict)
        else:
            return jsonify({
                "error": "Unsupported provider",
                "message": f"Provider {provider} is not supported"
            }), 400

        return jsonify({"calendars": calendars, "count": len(calendars)}), 200

    except Exception as e:
        logging.error(f"Error fetching calendars for account {account_id}: {e}")
        return jsonify({"error": "Failed to fetch calendars", "message": str(e)}), 500


@calendar_accounts_bp.route("/<account_id>/sync-calendars", methods=["POST"])
@require_auth
def sync_account_calendars(user_id, account_id):
    """Sync calendar list from provider to database."""
    try:
        service = CalendarAccountsService()
        account, error, status = _get_account_or_error(service, account_id, user_id)
        if error:
            return jsonify(error), status

        synced_sources = service.sync_calendars_from_provider(account_id)

        return jsonify({
            "message": "Calendars synced successfully",
            "sources": synced_sources,
            "count": len(synced_sources)
        }), 200

    except Exception as e:
        logging.error(f"Error syncing calendars for account {account_id}: {e}")
        return jsonify({"error": "Failed to sync calendars", "message": str(e)}), 500


@calendar_accounts_bp.route("/sources/<source_id>", methods=["PUT"])
@require_auth
def update_source(user_id, source_id):
    """Update a calendar source (toggle is_enabled, set is_write_calendar)."""
    try:
        data = request.get_json() or {}
        service = CalendarAccountsService()
        source = service.get_source(source_id)

        if not source:
            return jsonify({
                "error": "Source not found",
                "message": f"No calendar source found with ID {source_id}"
            }), 404

        account = source.get("calendar_accounts")
        if not account or account["user_id"] != user_id:
            return jsonify({
                "error": "Unauthorized",
                "message": "You don't have access to this calendar source"
            }), 403

        if data.get("is_write_calendar") is True:
            service.set_write_calendar(user_id, source_id)
            data.pop("is_write_calendar", None)

        updated_source = service.update_source(source_id, data) if data else service.get_source(source_id)

        if not updated_source:
            return jsonify({"error": "Update failed", "message": "Failed to update calendar source"}), 500

        if "calendar_accounts" in updated_source:
            del updated_source["calendar_accounts"]

        return jsonify(updated_source), 200

    except Exception as e:
        logging.error(f"Error updating calendar source {source_id}: {e}")
        return jsonify({"error": "Failed to update calendar source", "message": str(e)}), 500


@calendar_accounts_bp.route("/write-calendar", methods=["GET"])
@require_auth
def get_write_calendar(user_id):
    """Get the user's write calendars (one per provider)."""
    try:
        service = CalendarAccountsService()
        write_calendars = service.get_all_write_calendars(user_id)

        # Remove credentials from response
        for cal in write_calendars:
            if "account" in cal and "credentials" in cal["account"]:
                del cal["account"]["credentials"]

        return jsonify({"write_calendars": write_calendars}), 200

    except Exception as e:
        logging.error(f"Error getting write calendars for user {user_id}: {e}")
        return jsonify({"error": "Failed to get write calendars", "message": str(e)}), 500
