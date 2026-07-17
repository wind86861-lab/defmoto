/**
 * Build a BTS shipment from a stored order and dispatch it.
 * The shop (sender) comes from env; the receiver comes from the order's
 * checkout payload. City/branch codes that the checkout can't yet provide are
 * passed as overrides by the operator when dispatching from the admin panel.
 */

import { getOrder, setOrderBts, updateOrderStatus } from '@/lib/db';
import { notifyOperator } from '@/lib/server/chatRelay';
import { notifyOrderStatus } from '@/lib/server/orderNotify';
import { getBtsSender } from './settings';
import {
  btsCreateOrder,
  type BtsCreateOrderInput,
  type BtsPickupType,
  type BtsDropoffType,
} from './client';

export interface ShipmentOverrides {
  receiverCityCode?: string;
  receiverBranchCode?: string;
  senderCityCode?: string;
  pickup_type?: BtsPickupType;
  dropoff_type?: BtsDropoffType;
  weight?: number;
}

export async function createShipmentForOrder(
  orderId: string,
  ov: ShipmentOverrides = {},
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const order = getOrder(orderId);
  if (!order) return { ok: false, error: 'order-not-found' };
  if (order.bts?.orderId) return { ok: false, error: 'already-shipped' };

  const payload = (order.payload || {}) as Record<string, any>;
  const contact = payload.contact || {};
  const address = payload.address || {};
  const delivery = payload.delivery || {};
  const items: any[] = Array.isArray(payload.items) ? payload.items : [];
  const paymentMethod = payload.payment?.method;

  // Customer-selected BTS branch (from checkout), if any.
  const btsSel = (delivery.bts || {}) as {
    regionCode?: string;
    cityCode?: string;
    branchCode?: string;
  };

  const sender = getBtsSender();

  const dropoff: BtsDropoffType =
    ov.dropoff_type || (delivery.method === 'bts' ? 'branch' : 'courier');
  const pickup: BtsPickupType = ov.pickup_type || sender.pickupType;

  // Cash-on-delivery when not already paid online.
  const cod = paymentMethod === 'cash' || paymentMethod === 'bts';
  const piece = items.reduce((s, i) => s + (Number(i.quantity) || 1), 0) || 1;
  // Real shipment weight from the item kg × qty (fallback 1kg/item), so BTS
  // prices by the actual weight instead of a flat default.
  const fallbackKg = Number(process.env.BTS_DEFAULT_WEIGHT || 1);
  const itemsWeight = items.reduce(
    (s, i) => s + (Number(i.weight) > 0 ? Number(i.weight) : fallbackKg) * (Number(i.quantity) || 1),
    0,
  );
  const weight = ov.weight || Math.max(0.1, Math.round(itemsWeight * 1000) / 1000) || fallbackKg;

  const input: BtsCreateOrderInput = {
    clientId: order.id,
    pickup_type: pickup,
    dropoff_type: dropoff,
    is_sender_location: false,
    is_receiver_location: false,
    sender: {
      name: sender.senderName,
      phone: sender.senderPhone,
      address: sender.senderAddress,
      city_code: ov.senderCityCode || sender.senderCityCode || undefined,
      branch_code: process.env.BTS_SENDER_BRANCH_CODE || undefined,
    },
    receiver: {
      name: contact.name || order.customerName || '',
      phone: contact.phone || order.phone || '',
      address:
        [address.city, address.street, address.apartment].filter(Boolean).join(', ') ||
        (contact.name ?? ''),
      city_code:
        dropoff === 'courier'
          ? ov.receiverCityCode || btsSel.cityCode || undefined
          : undefined,
      branch_code:
        dropoff === 'branch'
          ? ov.receiverBranchCode || btsSel.branchCode || undefined
          : undefined,
    },
    bringBackMoney: cod ? 1 : 0,
    back_money: cod ? order.total : undefined,
    ready_to_take: true,
    cargo: {
      weight,
      piece,
      postTypes: items.slice(0, 50).map((i, idx) => ({
        name: String(i.name || `Tovar ${idx + 1}`).slice(0, 120),
        code: String(i.id || i.sku || idx),
        count: Number(i.quantity) || 1,
        cost: Math.round(Number(i.price) || 0),
      })),
    },
  };

  const r = await btsCreateOrder(input);
  if (!r.status || !r.data?.orderId) {
    return { ok: false, error: r.errors ? JSON.stringify(r.errors) : r.message || 'bts-error' };
  }

  setOrderBts(order.id, {
    orderId: r.data.orderId,
    barcode: r.data.barcode,
    tracking: r.data.tracking,
    cost: r.data.cost,
    statusName: r.data.status?.info,
    statusCode: r.data.status?.code ?? undefined,
  });
  updateOrderStatus(order.id, 'shipping');
  // Tell the customer it's on the way (Telegram DM) the moment we hand it to BTS.
  void notifyOrderStatus(order.id, 'shipping');

  void notifyOperator(
    [
      `🚚 *BTS jo'natma yaratildi* ${order.number}`,
      `Barcode: ${r.data.barcode}`,
      r.data.cost ? `Yetkazish: ${r.data.cost.toLocaleString('ru-RU')} so'm` : '',
      r.data.tracking || '',
    ]
      .filter(Boolean)
      .join('\n'),
  );

  return { ok: true, data: r.data };
}
