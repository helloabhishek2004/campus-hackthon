/**
 * Safely masks a phone number so sensitive digits are never exposed to clients.
 *
 * Example:
 *  - "+919876543210" -> "+91 ******3210"
 *  - "9876543210"    -> "******3210"
 *  - "1234"          -> "****"
 */
export function maskPhoneNumber(rawPhone: string | null | undefined): string {
  if (!rawPhone || typeof rawPhone !== "string") {
    return "******";
  }

  const trimmed = rawPhone.trim();
  if (trimmed.length === 0) {
    return "******";
  }

  // If phone has country code or prefix (e.g. "+91 9876543210" or "+919876543210")
  if (trimmed.startsWith("+")) {
    const spaceIndex = trimmed.indexOf(" ");
    if (spaceIndex > 0) {
      const countryCode = trimmed.slice(0, spaceIndex);
      const rest = trimmed.slice(spaceIndex + 1).replace(/\s+/g, "");
      if (rest.length <= 4) {
        return `${countryCode} ${"*".repeat(rest.length)}`;
      }
      return `${countryCode} ${"*".repeat(rest.length - 4)}${rest.slice(-4)}`;
    }

    // No space after prefix, assume +91 or similar (first 3 chars)
    if (trimmed.length > 7) {
      const prefix = trimmed.slice(0, 3);
      const rest = trimmed.slice(3);
      return `${prefix} ${"*".repeat(Math.max(rest.length - 4, 2))}${rest.slice(-4)}`;
    }
  }

  // Standard domestic phone number
  const cleaned = trimmed.replace(/\D/g, "");
  if (cleaned.length <= 4) {
    return "*".repeat(Math.max(cleaned.length, 4));
  }

  const visibleSuffix = cleaned.slice(-4);
  const maskedPrefix = "*".repeat(cleaned.length - 4);
  return `${maskedPrefix}${visibleSuffix}`;
}
