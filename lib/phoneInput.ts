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

/**
 * The 9 local digits of an Uzbek number, with the country code and any
 * national prefix stripped. Hard-capped at 9 — typing more simply does
 * nothing, so a field can never hold "5555555555555555".
 */
export function uzLocalDigits(raw: string): string {
  let d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  // "8 90 ..." / "0 90 ..." — a national prefix the user typed out of habit.
  else if (d.length > 9 && (d.startsWith('8') || d.startsWith('0'))) d = d.slice(1);
  return d.slice(0, 9);
}

/**
 * Progressive Uzbek phone mask: "+998 90 123 45 67".
 *
 * Reformats on every keystroke and accepts at most 9 local digits, so the user
 * physically cannot enter a longer number. Returns "" for empty input so the
 * field stays clearable.
 */
export function formatUzPhone(raw: string): string {
  const d = uzLocalDigits(raw);
  if (!d) return '';
  const groups = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return `+998 ${groups.join(' ')}`;
}

/** True once the number holds all 9 local digits. */
export function isCompleteUzPhone(raw: string): boolean {
  return uzLocalDigits(raw).length === 9;
}

/** Digits only (OTP / verification codes). */
export function digitsOnly(raw: string, maxLen = 8): string {
  return (raw || '').replace(/\D/g, '').slice(0, maxLen);
}

/** Non-negative integer string (prices, counts) — no separators, no sign. */
export function integerOnly(raw: string, maxLen = 12): string {
  return (raw || '').replace(/\D/g, '').slice(0, maxLen);
}
