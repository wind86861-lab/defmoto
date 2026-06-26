import type { useTranslations } from 'next-intl';
import { mockProducts } from '@/mocks/products';
import { mockServiceCenters } from '@/mocks/services';
import type { ChatAttachment, ChatMessage } from '@/types/chat';

/**
 * Mock operator that returns a realistic reply for a given user message.
 * Backend swap: replace with real Socket.IO subscription / API call.
 */

interface UserInput {
  text?: string;
  hasImage?: boolean;
}

function id() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const greetings = ['salom', 'привет', 'hello', 'hi', 'assalom'];
const helmetKeywords = ['shlem', 'каска', 'шлем', 'helmet'];
const oilKeywords = ['moy', 'масло', 'oil', 'motul', 'castrol'];
const tireKeywords = ['shina', 'шина', 'tire', 'michelin', 'pirelli'];
const repairKeywords = ['buzilgan', 'remont', 'ta\'mir', 'сломан', 'не работает', 'broken'];
const priceKeywords = ['narx', 'qancha', 'цена', 'price', 'how much'];

function matchAny(text: string, keywords: string[]) {
  const t = text.toLowerCase();
  return keywords.some((k) => t.includes(k));
}

function toProductAttachment(slug: string): ChatAttachment | null {
  const p = mockProducts.find((x) => x.slug === slug);
  if (!p) return null;
  return {
    kind: 'product',
    productId: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    oldPrice: p.oldPrice,
    image: p.images[0],
    brand: p.brand,
  };
}

function toServiceAttachment(centerId: string): ChatAttachment | null {
  const c = mockServiceCenters.find((x) => x.id === centerId);
  if (!c) return null;
  return {
    kind: 'service',
    centerId: c.id,
    centerName: c.name,
    address: c.address,
  };
}

export function generateOperatorReply(
  input: UserInput,
  t: ReturnType<typeof useTranslations>,
): ChatMessage[] {
  const replies: ChatMessage[] = [];
  const text = (input.text ?? '').trim();
  const lower = text.toLowerCase();

  // Image received → ask for clarification + suggest service centre
  if (input.hasImage) {
    replies.push({
      id: id(),
      author: 'operator',
      text: t('botImageReceivedText'),
      createdAt: new Date().toISOString(),
    });
    const svc = toServiceAttachment('s1');
    if (svc) {
      replies.push({
        id: id(),
        author: 'operator',
        attachments: [svc],
        createdAt: new Date().toISOString(),
      });
    }
    return replies;
  }

  // Greeting
  if (matchAny(lower, greetings)) {
    replies.push({
      id: id(),
      author: 'operator',
      text: t('botGreetingReplyText'),
      createdAt: new Date().toISOString(),
    });
    return replies;
  }

  // Helmet inquiry
  if (matchAny(lower, helmetKeywords)) {
    replies.push({
      id: id(),
      author: 'operator',
      text: t('botHelmetReplyText'),
      createdAt: new Date().toISOString(),
    });
    ['shlem-ls2-ff353', 'helmet-shoei-rf1400', 'helmet-ls2-ff800'].forEach(
      (slug) => {
        const att = toProductAttachment(slug);
        if (att) {
          replies.push({
            id: id(),
            author: 'operator',
            attachments: [att],
            createdAt: new Date().toISOString(),
          });
        }
      },
    );
    return replies;
  }

  // Oil
  if (matchAny(lower, oilKeywords)) {
    replies.push({
      id: id(),
      author: 'operator',
      text: t('botOilReplyText'),
      createdAt: new Date().toISOString(),
    });
    ['oil-motul-7100-10w40', 'oil-castrol-power1-racing'].forEach((slug) => {
      const att = toProductAttachment(slug);
      if (att) {
        replies.push({
          id: id(),
          author: 'operator',
          attachments: [att],
          createdAt: new Date().toISOString(),
        });
      }
    });
    return replies;
  }

  // Tire
  if (matchAny(lower, tireKeywords)) {
    replies.push({
      id: id(),
      author: 'operator',
      text: t('botTireReplyText'),
      createdAt: new Date().toISOString(),
    });
    ['tire-michelin-pilot-power', 'tire-pirelli-diablo-rosso-iv'].forEach((slug) => {
      const att = toProductAttachment(slug);
      if (att) {
        replies.push({
          id: id(),
          author: 'operator',
          attachments: [att],
          createdAt: new Date().toISOString(),
        });
      }
    });
    return replies;
  }

  // Repair
  if (matchAny(lower, repairKeywords)) {
    replies.push({
      id: id(),
      author: 'operator',
      text: t('botRepairReplyText'),
      createdAt: new Date().toISOString(),
    });
    const svc = toServiceAttachment('s1');
    if (svc) {
      replies.push({
        id: id(),
        author: 'operator',
        attachments: [svc],
        createdAt: new Date().toISOString(),
      });
    }
    return replies;
  }

  // Price
  if (matchAny(lower, priceKeywords)) {
    replies.push({
      id: id(),
      author: 'operator',
      text: t('botPriceReplyText'),
      createdAt: new Date().toISOString(),
    });
    return replies;
  }

  // Default
  replies.push({
    id: id(),
    author: 'operator',
    text: t('botDefaultReplyText'),
    createdAt: new Date().toISOString(),
  });
  return replies;
}
