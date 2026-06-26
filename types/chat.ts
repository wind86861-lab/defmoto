export type ChatAuthor = 'user' | 'operator' | 'system';

export type ChatStatus = 'sending' | 'sent' | 'delivered' | 'read';

export type ChatAttachment =
  | { kind: 'image'; url: string; alt?: string }
  | {
      kind: 'product';
      productId: string;
      slug: string;
      name: string;
      price: number;
      oldPrice?: number;
      image: string;
      brand?: string;
    }
  | {
      kind: 'service';
      centerId: string;
      centerName: string;
      address: string;
    };

export interface ChatMessage {
  id: string;
  author: ChatAuthor;
  text?: string;
  attachments?: ChatAttachment[];
  createdAt: string;
  status?: ChatStatus;
  // Operator-only meta
  operatorName?: string;
  operatorRole?: string;
}

export interface OperatorProfile {
  name: string;
  role: string;
  avatarInitial: string;
  isOnline: boolean;
  responseTimeText: string;
}
