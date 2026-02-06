"""
Email utility functions for normalization and validation.

IMPORTANT: These functions are for COMPARISON/LOOKUP only.
DO NOT use these to modify emails stored in the database.
Supabase Auth controls email storage.
"""

import re


def normalize_email(email: str) -> str:
    """
    Normalize email address for comparison/lookup purposes.

    Removes dots from the local part (Gmail treats them as insignificant).
    Use ONLY for lookups/comparisons, NOT for storing emails.
    """
    if not email or '@' not in email:
        return email.lower().strip() if email else ""

    local_part, domain_part = email.rsplit('@', 1)
    normalized_local = local_part.replace('.', '').lower().strip()
    normalized_domain = domain_part.lower().strip()

    return f"{normalized_local}@{normalized_domain}"


def get_email_variants(email: str) -> list[str]:
    """
    Get both original and normalized email variants for lookup queries.

    Use when querying the database to find users by email, since the stored
    email might differ from what the user enters.
    """
    if not email:
        return []

    original = email.lower().strip()
    normalized = normalize_email(email)

    if original == normalized:
        return [original]
    return [original, normalized]


EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


def is_valid_email(email: str) -> bool:
    """Basic email validation."""
    if not email:
        return False
    return bool(EMAIL_PATTERN.match(email))


def emails_match(email1: str, email2: str) -> bool:
    """Check if two email addresses are equivalent after normalization."""
    return normalize_email(email1) == normalize_email(email2)
