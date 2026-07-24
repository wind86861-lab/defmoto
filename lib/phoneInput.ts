/**
 * Input sanitisers for numeric fields — keep the value strictly numeric while
 * the user types, so a phone field can never hold letters and an OTP/code field
 * can never hold anything but digits.
 */

/** Phone: a single optional leading "+", then digits and light formatting. */
export function sanitizePhoneInput(raw: string): string {
  const cleaned = (raw || '').replace(/[^\d+\s()\-]/g, '');
  const plus = cleaned.trimStart().startsWith('+') ? '+' : '';
  const rest = cleaned.replace(/\+/g, '');
  return (plus + rest).slice(0, 20);
}

/** Digits only (OTP / verification codes). */
export function digitsOnly(raw: string, maxLen = 8): string {
  return (raw || '').replace(/\D/g, '').slice(0, maxLen);
}

/** Non-negative integer string (prices, counts) — no separators, no sign. */
export function integerOnly(raw: string, maxLen = 12): string {
  return (raw || '').replace(/\D/g, '').slice(0, maxLen);
}
