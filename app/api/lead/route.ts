import { NextResponse } from 'next/server';
import { notifyOperator } from '@/lib/server/chatRelay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LABELS: Record<string, string> = {
  branch: '🏢 Filial so‘rovi',
  service: '🔧 Servisga yozilish',
  franchise: '⭐️ Franshiza arizasi',
};

export async function POST(req: Request) {
  let body: {
    type?: string;
    name?: string;
    phone?: string;
    message?: string;
    city?: string;
    budget?: string;
    service?: string;
    date?: string;
    place?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const name = (body.name || '').trim().slice(0, 80);
  const phone = (body.phone || '').trim().slice(0, 40);
  if (name.length < 2 || phone.replace(/\D/g, '').length < 7) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const title = LABELS[body.type ?? ''] || '📩 Yangi so‘rov';
  const lines = [
    `*${title}*`,
    '',
    `👤 ${name}`,
    `📞 ${phone}`,
    body.place && `📍 ${body.place}`,
    body.service && `🔧 ${body.service}`,
    body.date && `🗓 ${body.date}`,
    body.city && `🏙 ${body.city}`,
    body.budget && `💰 ${body.budget}`,
    body.message && `\n💬 ${body.message}`,
  ].filter(Boolean);

  const delivered = await notifyOperator(lines.join('\n'));
  return NextResponse.json({ ok: true, delivered });
}
