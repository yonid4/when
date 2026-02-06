/**
 * String manipulation utilities
 */

import { EMAIL_REGEX } from "./validators.js";

/**
 * Parse a comma or newline separated list of emails
 */
export function parseEmailList(input) {
  if (!input || typeof input !== "string") return [];

  return input
    .split(/[,\n]/)
    .map(e => e.trim())
    .filter(e => e.length > 0);
}

/**
 * Parse and validate a list of emails
 */
export function parseAndValidateEmails(input) {
  const emails = parseEmailList(input);
  const valid = [];
  const invalid = [];

  for (const email of emails) {
    if (EMAIL_REGEX.test(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  }

  return { valid, invalid };
}

/**
 * Truncate a string to a maximum length with ellipsis
 */
export function truncate(str, maxLength = 50) {
  if (!str || str.length <= maxLength) return str || "";
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert a string to title case
 */
export function toTitleCase(str) {
  if (!str) return "";
  return str
    .split(" ")
    .map(word => capitalize(word.toLowerCase()))
    .join(" ");
}

/**
 * Generate initials from a name (max 2 characters)
 */
export function getInitials(name) {
  if (!name) return "";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Format a list of names for display (e.g., "Alice, Bob, and 2 more")
 */
export function formatNameList(names, maxDisplay = 3) {
  if (!names || names.length === 0) return "";

  if (names.length <= maxDisplay) {
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return names.slice(0, -1).join(", ") + ", and " + names[names.length - 1];
  }

  const displayed = names.slice(0, maxDisplay);
  const remaining = names.length - maxDisplay;
  return `${displayed.join(", ")}, and ${remaining} more`;
}

/**
 * Pluralize a word based on count
 */
export function pluralize(singular, count, plural) {
  if (count === 1) return singular;
  return plural || `${singular}s`;
}
