"""
Email utility functions for normalization and validation.

IMPORTANT: These functions are for COMPARISON/LOOKUP only.
DO NOT use these to modify emails stored in the database.
Supabase Auth controls email storage.
"""
import re
from typing import Optional


def normalize_email(email: str) -> str:
    """
    Normalize email address for comparison/lookup purposes.

    Gmail and some other providers treat dots in the local part as insignificant.
    This function normalizes emails by removing dots from the local part.

    IMPORTANT: Use this ONLY for lookups/comparisons, NOT for storing emails.
    Supabase Auth stores the original email from OAuth providers.

    Args:
        email: Email address to normalize

    Returns:
        Normalized email address (lowercase, dots removed from local part)

    Examples:
        >>> normalize_email("John.Doe@Gmail.com")
        'johndoe@gmail.com'
        >>> normalize_email("test.user.name@example.com")
        'testusername@example.com'
    """
    if not email or '@' not in email:
        return email.lower().strip() if email else ""

    # Split email into local and domain parts
    local_part, domain_part = email.rsplit('@', 1)

    # Remove dots from local part and convert to lowercase
    normalized_local = local_part.replace('.', '').lower().strip()

    # Convert domain to lowercase
    normalized_domain = domain_part.lower().strip()

    return f"{normalized_local}@{normalized_domain}"


def get_email_variants(email: str) -> list[str]:
    """
    Get both original and normalized email variants for lookup queries.

    Use this when querying the database to find users by email, since
    the stored email might be different from what the user enters.

    Args:
        email: Email address to get variants for

    Returns:
        List containing [original_lowercase, normalized] (duplicates removed)

    Examples:
        >>> get_email_variants("John.Doe@Gmail.com")
        ['john.doe@gmail.com', 'johndoe@gmail.com']
        >>> get_email_variants("user@example.com")
        ['user@example.com']
    """
    if not email:
        return []

    original = email.lower().strip()
    normalized = normalize_email(email)

    # Return unique values only
    if original == normalized:
        return [original]
    return [original, normalized]


def is_valid_email(email: str) -> bool:
    """
    Basic email validation.

    Args:
        email: Email address to validate

    Returns:
        True if email appears valid, False otherwise
    """
    if not email:
        return False

    # Basic regex pattern for email validation
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def emails_match(email1: str, email2: str) -> bool:
    """
    Check if two email addresses are equivalent after normalization.

    Args:
        email1: First email address
        email2: Second email address

    Returns:
        True if emails match after normalization, False otherwise
    """
    return normalize_email(email1) == normalize_email(email2)
