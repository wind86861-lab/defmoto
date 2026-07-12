export interface Branch {
  id: string;
  number: number;
  name: string;
  legalName?: string;
  director?: string;
  region?: string; // viloyat — for the region filter
  address: string;
  city: string;
  phone: string;
  secondaryPhone?: string;
  telegram?: string; // @username or full t.me link
  email?: string; // legacy — no longer edited
  workingHours: string;
  mapUrl?: string; // Google Maps link
  lat?: number; // legacy — used to derive a maps link when mapUrl is empty
  lng?: number;
  image?: string;
  videoUrl?: string;
  isHeadOffice?: boolean;
}

export interface ServiceCenter {
  id: string;
  name: string;
  shortName?: string;
  about?: string;
  region?: string; // viloyat — for the region filter
  address: string;
  phone: string;
  secondaryPhone?: string;
  telegram?: string; // @username or full t.me link
  email?: string; // legacy — no longer edited
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

// A franchise location, shown like a branch (with a region filter).
export interface FranchiseLocation {
  id: string;
  name: string;
  region?: string; // viloyat
  city?: string;
  address?: string;
  phone?: string;
  telegram?: string;
  workingHours?: string;
  mapUrl?: string;
  image?: string;
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
