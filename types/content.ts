export interface Branch {
  id: string;
  number: number;
  name: string;
  legalName?: string;
  director?: string;
  address: string;
  city: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  workingHours: string;
  lat: number;
  lng: number;
  image?: string;
  videoUrl?: string;
  isHeadOffice?: boolean;
}

export interface ServiceCenter {
  id: string;
  name: string;
  shortName?: string;
  about?: string;
  address: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  workingHours: string;
  image?: string;
  videoUrl?: string; // YouTube URL — conditional
  services: ServiceItem[];
}

export interface ServiceItem {
  id: string;
  title: string;
  description?: string;
  priceFrom?: number;
  duration?: string;
}

export type BlogCategory = 'news' | 'tips' | 'reviews' | 'promotion';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover: string;
  videoUrl?: string;
  category: BlogCategory;
  author: string;
  publishedAt: string;
  readMinutes: number;
  isPromotion?: boolean;
  promotionBadge?: string;
}
