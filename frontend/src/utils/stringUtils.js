/**
 * String manipulation utilities
 * Common string parsing and formatting functions
 */

import { EMAIL_REGEX } from "./validators";

/**
 * Parse a comma or newline separated list of emails
 * @param {string} input - Input string with emails
 * @returns {string[]} Array of trimmed, non-empty email strings
 *
 * @example
 * parseEmailList("john@example.com, jane@example.com\nbob@example.com")
 * // Returns: ["john@example.com", "jane@example.com", "bob@example.com"]
 */
export const parseEmailList = (input) => {
  if (!input || typeof input !== "string") return [];

  return input
    .split(/[,\n]/)
    .map(e => e.trim())
    .filter(e => e.length > 0);
};

/**
 * Parse and validate a list of emails
 * @param {string} input - Input string with emails
 * @returns {{ valid: string[], invalid: string[] }} Object with valid and invalid emails
 */
export const parseAndValidateEmails = (input) => {
  const emails = parseEmailList(input);

  const valid = [];
  const invalid = [];

  emails.forEach(email => {
    if (EMAIL_REGEX.test(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  });

  return { valid, invalid };
};

/**
 * Truncate a string to a maximum length with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length (default: 50)
 * @returns {string} Truncated string
 */
export const truncate = (str, maxLength = 50) => {
  if (!str || str.length <= maxLength) return str || "";
  return str.slice(0, maxLength - 3) + "...";
};

/**
 * Capitalize the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Convert a string to title case
 * @param {string} str - String to convert
 * @returns {string} Title cased string
 */
export const toTitleCase = (str) => {
  if (!str) return "";
  return str
    .split(" ")
    .map(word => capitalize(word.toLowerCase()))
    .join(" ");
};

/**
 * Generate initials from a name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 characters)
 */
export const getInitials = (name) => {
  if (!name) return "";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Format a list of names for display
 * @param {string[]} names - Array of names
 * @param {number} maxDisplay - Maximum names to display before "and X more"
 * @returns {string} Formatted names string
 *
 * @example
 * formatNameList(["Alice", "Bob", "Charlie", "Dave"], 2)
 * // Returns: "Alice, Bob, and 2 more"
 */
export const formatNameList = (names, maxDisplay = 3) => {
  if (!names || names.length === 0) return "";

  if (names.length <= maxDisplay) {
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return names.slice(0, -1).join(", ") + ", and " + names[names.length - 1];
  }

  const displayed = names.slice(0, maxDisplay);
  const remaining = names.length - maxDisplay;
  return `${displayed.join(", ")}, and ${remaining} more`;
};

/**
 * Pluralize a word based on count
 * @param {string} singular - Singular form
 * @param {number} count - Count
 * @param {string} plural - Plural form (optional, defaults to singular + 's')
 * @returns {string} Pluralized word
 */
export const pluralize = (singular, count, plural) => {
  if (count === 1) return singular;
  return plural || `${singular}s`;
};
