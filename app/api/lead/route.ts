import { NextResponse } from 'next/server';
import { createLead, listLeads } from '@/lib/db';
import { isAdminRequest } from '@/lib/server/adminAuth';
import { notifyOperator, notifyOrdersGroup } from '@/lib/server/chatRelay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LABELS: Record<string, string> = {
  product: '🔎 Maxsus so‘rov (tovar topilmadi)',
  branch: '🏢 Filial so‘rovi',
  service: '🔧 Servisga yozilish',
  franchise: '⭐️ Franshiza arizasi',
};

/** A real Uzbek phone: 9 local digits, optionally prefixed with 998. */
function normalizeUzPhone(raw: string): string | null {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 9) return `998${digits}`;
  if (digits.length === 12 && digits.startsWith('998')) return digits;
  return null;
}

// GET — leads for the admin panel.
export function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true, leads: listLeads() });
}

export async function POST(req: Request) {
  let body: {
    type?: string;
    name?: string;
    phone?: string;
    message?: string;
    product?: string;
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

  const type = (body.type || 'product').trim().slice(0, 20);
  const name = (body.name || '').trim().slice(0, 80);
  const message = (body.message || body.product || '').trim().slice(0, 500);

  // A real phone number is mandatory — junk like "asd" is rejected.
  const phone = normalizeUzPhone(body.phone || '');
  if (!phone) {
    return NextResponse.json({ ok: false, error: 'invalid-phone' }, { status: 400 });
  }
  // The product-request form needs the requested product text; the other forms
  // (branch/service/franchise) require a name instead.
  if (type === 'product' ? message.length < 3 : name.length < 2) {
    return NextResponse.json({ ok: false, error: 'invalid-fields' }, { status: 400 });
  }

  const meta: Record<string, string> = {};
  for (const k of ['city', 'budget', 'service', 'date', 'place'] as const) {
    const v = (body[k] || '').trim();
    if (v) meta[k] = v.slice(0, 120);
  }

  const lead = createLead({ type, name: name || undefined, phone, message: message || undefined, meta });

  const title = LABELS[type] || '📩 Yangi so‘rov';
  const lines = [
    title,
    `🕒 ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}`,
    name && `👤 ${name}`,
    `📞 +${phone}`,
    meta.place && `📍 ${meta.place}`,
    meta.service && `🔧 ${meta.service}`,
    meta.date && `🗓 ${meta.date}`,
    meta.city && `🏙 ${meta.city}`,
    meta.budget && `💰 ${meta.budget}`,
    message && `💬 ${message}`,
  ].filter(Boolean) as string[];
  const text = lines.join('\n');

  // Both channels: the admin orders group and the support operator's DM.
  const [group, operator] = await Promise.all([
    notifyOrdersGroup(text),
    notifyOperator(text),
  ]);

  return NextResponse.json({ ok: true, id: lead.id, delivered: group || operator });
}
