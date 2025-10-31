"""
Supabase client management.
"""

import os
from supabase import create_client, Client
from ..config import config

# Global Supabase client instance
_supabase_client = None

def init_supabase(config_name="development"):
    """
    Initialize the Supabase client with configuration.
    
    Args:
        config_name (str): The configuration to use (development, testing, production)
    """
    global _supabase_client
    
    if _supabase_client is None:
        # Get configuration
        cfg = config[config_name]
        
        # Get Supabase credentials from environment variables
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError(
                "Supabase credentials not found. "
                "Please set SUPABASE_URL and SUPABASE_KEY environment variables."
            )
        
        # Create Supabase client
        _supabase_client = create_client(supabase_url, supabase_key)

def get_supabase(access_token=None) -> Client:
    """
    Get the Supabase client instance.
    """
    url = os.environ.get("SUPABASE_URL")
    # key = os.environ.get("SUPABASE_ANON_KEY")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

    client = create_client(url, key)
    if access_token:
        client.postgrest.auth(access_token)
    
    return client