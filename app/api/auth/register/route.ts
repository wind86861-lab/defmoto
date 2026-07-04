import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Registration is bot-only. Users sign up through the Telegram bot (which links
// their Telegram account) and then log in on the site with phone + password.
export function POST() {
  return NextResponse.json(
    { ok: false, error: 'register-via-bot' },
    { status: 403 },
  );
}
