function parseRange(part: string): { start: number; end: number } | null {
  const match = part.match(/(\d{1,2}):(\d{2})\s*[—-]\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const [, h1, m1, h2, m2] = match;
  return {
    start: Number(h1) * 60 + Number(m1),
    end: Number(h2) * 60 + Number(m2),
  };
}

/**
 * Parses strings like "Du-Sh: 09:00 — 20:00 · Yak: 10:00 — 18:00" or
 * "Du-Sh: 09:00 — 19:00" (no Sunday entry = closed on Yak).
 */
export function isOpenNow(workingHours: string, now: Date = new Date()): boolean {
  const parts = workingHours.split('·').map((p) => p.trim());
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const isSunday = now.getDay() === 0;

  if (isSunday) {
    const sundayPart = parts.find((p) => /^Yak/i.test(p));
    if (!sundayPart || /dam/i.test(sundayPart)) return false;
    const range = parseRange(sundayPart);
    return range ? minutesNow >= range.start && minutesNow < range.end : false;
  }

  const range = parseRange(parts[0]);
  return range ? minutesNow >= range.start && minutesNow < range.end : false;
}
