"""
Supabase client management.
"""

import logging
import os

from supabase import Client, create_client

logger = logging.getLogger(__name__)

_supabase_client = None


def init_supabase(config_name="development") -> None:
    """Initialize the Supabase client with configuration."""
    global _supabase_client

    if _supabase_client is not None:
        return

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")

    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set")

    _supabase_client = create_client(url, key)


def get_supabase(access_token=None) -> Client:
    """
    Get the Supabase client instance.

    For backend operations, this uses the SERVICE ROLE KEY to bypass RLS policies.
    Token validation is handled separately in decorators.
    """
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not key:
        logger.warning("SUPABASE_SERVICE_ROLE_KEY not found, falling back to ANON KEY")
        key = os.environ.get("SUPABASE_ANON_KEY")

    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON_KEY) must be set")

    return create_client(url, key)