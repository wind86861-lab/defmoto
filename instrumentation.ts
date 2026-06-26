/**
 * Next.js server startup hook. Boots the Telegram chat-relay poller once, on
 * the Node.js runtime only (skipped in edge/build). No-op when the bot token
 * isn't configured, so the app runs fine without it.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startTelegramPoller } = await import('./lib/server/telegramPoller');
    startTelegramPoller();
  }
}
