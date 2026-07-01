/** Client IP (behind nginx, via X-Forwarded-For). */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') || '';
  const first = xff.split(',')[0]?.trim();
  return first || req.headers.get('x-real-ip') || '';
}

/**
 * Allow the request only from the provider's IPs. If the env allow-list is
 * empty (not configured yet) we allow through — the request is still protected
 * by the provider auth/signature. Set the IPs once the provider gives them.
 */
export function ipAllowed(req: Request, envVar: string): boolean {
  const allow = (process.env[envVar] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (allow.length === 0) return true;
  return allow.includes(clientIp(req));
}
