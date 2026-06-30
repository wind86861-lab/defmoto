import { NextResponse } from 'next/server';
import { listOrders, createOrder } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ orders: listOrders() });
}

export async function POST(req: Request) {
  let body: {
    id?: string;
    number?: string;
    status?: string;
    customerName?: string;
    phone?: string;
    total?: number;
    payload?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const order = createOrder(body);
  return NextResponse.json({ ok: true, order });
}
