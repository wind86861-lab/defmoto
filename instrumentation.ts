/**
 * Next.js server startup hook. Boots the Telegram chat-relay poller once, on
 * the Node.js runtime only (skipped in edge/build). No-op when the bot token
 * isn't configured, so the app runs fine without it.
 */
export async function register() {
  console.log('[instrumentation] register runtime=', process.env.NEXT_RUNTIME);
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Prefer IPv4 for all outbound fetches. The production host has broken IPv6
    // connectivity but api.telegram.org resolves to an IPv6 address first, so
    // Node's fetch (undici) picked IPv6 and threw "fetch failed" every cycle —
    // silently killing the Telegram bot. Forcing IPv4-first fixes it.
    try {
      const dns = await import('node:dns');
      dns.setDefaultResultOrder('ipv4first');
    } catch {
      /* older Node without the API — ignore */
    }
    const { startTelegramPoller } = await import('./lib/server/telegramPoller');
    startTelegramPoller();
  }
}
