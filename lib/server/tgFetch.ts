/**
 * Robust Telegram Bot API caller for this host.
 *
 * The production server has NO working IPv6, yet api.telegram.org resolves to
 * an IPv6 address first — and Node's global fetch (undici) pooled the
 * long-poll connections, which then went stale behind the host's NAT and hung
 * forever with ETIMEDOUT (silently killing the bot / operator chat).
 *
 * Using Node's `https` module directly sidesteps both problems: every call
 * opens a FRESH IPv4 connection (`family: 4`, `keepAlive: false`) with a hard
 * timeout, so a dropped socket can never poison later requests.
 */

import https from 'node:https';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// keepAlive:false → the socket is closed after each response (no stale reuse).
const agent = new https.Agent({ keepAlive: false });

export function tgApi<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  const payload = JSON.stringify(params);
  // Long-poll calls carry a `timeout` (seconds); give them headroom, else 20s.
  const pollSecs = typeof params.timeout === 'number' ? (params.timeout as number) : 0;
  return new Promise<T>((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        path: `/bot${BOT_TOKEN}/${method}`,
        method: 'POST',
        family: 4, // IPv4 only — the host's IPv6 is broken
        agent,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: (pollSecs + 20) * 1000,
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data) as T);
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('ETIMEDOUT')));
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}
