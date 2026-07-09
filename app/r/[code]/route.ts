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
  const origin = new URL(req.url).origin;
  const link = getLinkByCode(params.code);
  if (!link) {
    return NextResponse.redirect(`${origin}/`, 302);
  }

  const cookieName = `dmref_${link.code}`;
  const seen = (req.headers.get('cookie') || '')
    .split(';')
    .some((c) => c.trim().startsWith(`${cookieName}=`));

  recordLinkClick(link.code, !seen);

  const dest = link.target.startsWith('/') ? `${origin}${link.target}` : `${origin}/`;
  const res = NextResponse.redirect(dest, 302);
  if (!seen) {
    res.cookies.set(cookieName, '1', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: 'lax',
    });
  }
  return res;
}
