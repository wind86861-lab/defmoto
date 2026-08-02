import { NextResponse } from 'next/server';
import { getLinkByCode, recordLinkClick } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Marketing link redirect + click tracker: /r/<code> counts the visit and
 * forwards to the campaign's target page. A per-code cookie dedupes unique
 * visitors. Unknown codes just go home.
 */
export function GET(req: Request, { params }: { params: { code: string } }) {
  // Build the PUBLIC origin from the proxy headers (the app runs behind nginx
  // on localhost, so req.url would otherwise redirect users to localhost).
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const origin =
    (host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_APP_URL) || new URL(req.url).origin;

  const link = getLinkByCode(params.code);
  if (!link) {
    return NextResponse.redirect(`${origin}/`, 302);
  }

  // Resolve the destination robustly:
  //  - repair a malformed leading slash before a full URL ("/https://…" from an
  //    older paste) so it doesn't become {origin}/https://…
  //  - a real full URL → as-is; a site path → prefix the public origin.
  let target = (link.target || '/').trim().replace(/^\/+(https?:\/\/)/i, '$1');
  const dest = /^https?:\/\//i.test(target)
    ? target
    : `${origin}${target.startsWith('/') ? target : `/${target}`}`;

  // Don't let link-preview crawlers (Telegram/WhatsApp/social when the link is
  // shared) inflate the click count — they must still be redirected, just not
  // counted. Only real user agents count.
  const ua = req.headers.get('user-agent') || '';
  const isBot =
    /bot|crawl|spider|preview|facebookexternalhit|telegram|whatsapp|slack|discord|twitter|linkedin|embed|scrap|monitor|fetch|curl|wget|python|go-http|headless/i.test(
      ua,
    );

  const cookieName = `dmref_${link.code}`;
  const seen = (req.headers.get('cookie') || '')
    .split(';')
    .some((c) => c.trim().startsWith(`${cookieName}=`));

  if (!isBot) recordLinkClick(link.code, !seen);

  const res = NextResponse.redirect(dest, 302);
  if (!isBot && !seen) {
    res.cookies.set(cookieName, '1', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: 'lax',
    });
  }
  return res;
}
