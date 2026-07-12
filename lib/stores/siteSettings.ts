import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createServerPersist } from '@/lib/serverPersist';

export interface HeroSlide {
  id: string;
  image: string; // can be data URL or remote URL
  link?: string; // optional URL — slide becomes clickable when set
}

export interface HeroOverride {
  slides?: HeroSlide[];
}

export interface PromoBanner {
  id: string;
  enabled: boolean;
  message: string;
  href?: string;
}

export interface Marketplace {
  id: string;
  name: string; // full name — used as aria-label / tooltip (e.g. "Uzum Market")
  label: string; // short badge text (e.g. "Uzum") — shown when no icon
  url: string;
  color: string; // hex brand colour for the badge
  icon?: string; // uploaded logo (data URL) or remote image URL — overrides the label badge
  enabled: boolean;
}

// BTS delivery — sender (shop origin) config, editable from the admin panel.
// The server reads this (via the persisted site-settings blob) to calculate
// delivery price and to build shipments. Falls back to env when unset.
export interface BtsSettings {
  enabled: boolean;
  regionCode?: string;
  regionName?: string;
  cityCode?: string; // origin city → drives the BTS price (sender → receiver)
  cityName?: string;
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  // How the shop hands parcels to BTS: drops them at a BTS branch ('self',
  // cheaper) or a BTS courier collects from the shop ('courier').
  dispatch?: 'self' | 'courier';
}

// Footer / contact block — editable from the admin panel.
export interface SiteContact {
  tagline?: string;
  phone?: string;
  address?: string;
  workingHours?: string;
  telegram?: string;
  whatsapp?: string;
  instagram?: string;
  viber?: string;
}

// One delivery-terms row (same for every product), shown on the product page.
export interface DeliveryTerm {
  title: string;
  text: string;
}

// A partner brand shown on the home page (admin-managed).
export interface PartnerBrand {
  id: string;
  name: string;
  tagline?: string;
  logo?: string; // uploaded logo image (data URL / /uploads/...)
}

interface SiteSettingsState {
  hero: HeroOverride;
  banner: PromoBanner | null;
  marketplaces: Marketplace[];
  bts: BtsSettings;
  contact: SiteContact;
  deliveryTerms: DeliveryTerm[];
  partners: PartnerBrand[];
  setBts: (patch: Partial<BtsSettings>) => void;
  setContact: (patch: Partial<SiteContact>) => void;
  setDeliveryTerms: (terms: DeliveryTerm[]) => void;
  addPartner: (p: PartnerBrand) => void;
  updatePartner: (id: string, patch: Partial<PartnerBrand>) => void;
  removePartner: (id: string) => void;
  setHero: (patch: Partial<HeroOverride>) => void;
  resetHero: () => void;
  addSlide: (slide: HeroSlide) => void;
  removeSlide: (id: string) => void;
  reorderSlide: (id: string, direction: -1 | 1) => void;
  setBanner: (banner: PromoBanner | null) => void;
  addMarketplace: (m: Marketplace) => void;
  updateMarketplace: (id: string, patch: Partial<Marketplace>) => void;
  removeMarketplace: (id: string) => void;
  reorderMarketplace: (id: string, direction: -1 | 1) => void;
  resetMarketplaces: () => void;
}

// Same images Hero.tsx used to hard-code — now seeded into the store so
// admins can edit/link them from day one instead of starting from empty.
export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  { id: 'default-1', image: '/images/hero/sportbike-1.png' },
  { id: 'default-2', image: '/images/hero/sportbike-2.png' },
  {
    id: 'default-3',
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1600&q=90',
  },
  {
    id: 'default-4',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1600&q=90',
  },
];

const defaultHero: HeroOverride = { slides: DEFAULT_HERO_SLIDES };

// Marketplaces where DEFT MOTO also sells — shown in the navbar and editable
// from the admin panel. Colours match the PriceCompare brand chips.
export const DEFAULT_MARKETPLACES: Marketplace[] = [
  {
    id: 'mp-uzum',
    name: 'Uzum Market',
    label: 'Uzum',
    url: 'https://uzum.uz',
    color: '#7B2CBF',
    enabled: true,
  },
  {
    id: 'mp-wildberries',
    name: 'Wildberries',
    label: 'WB',
    url: 'https://www.wildberries.uz',
    color: '#CB11AB',
    enabled: true,
  },
  {
    id: 'mp-yandex',
    name: 'Yandex Market',
    label: 'Yandex',
    url: 'https://market.yandex.uz',
    color: '#FC3F1D',
    enabled: true,
  },
];

export const DEFAULT_BTS_SETTINGS: BtsSettings = { enabled: true, dispatch: 'self' };

export const DEFAULT_CONTACT: SiteContact = {
  tagline: "Premium moto-texnika va ehtiyot qismlar do'koni. Bozordan arzon narxlar, rasmiy kafolat, professional servis.",
  phone: '+998 99 810-70-90',
  address: "Yunusobod tumani, Amir Temur ko'chasi 12, Toshkent",
  workingHours: 'Du-Sh: 09:00 — 20:00 · Yak: 10:00 — 18:00',
  telegram: '',
  whatsapp: '',
  instagram: '',
  viber: '',
};

export const DEFAULT_DELIVERY_TERMS: DeliveryTerm[] = [
  { title: 'Toshkent ichida', text: '1-2 ish kuni • Bepul (300 000 dan)' },
  { title: 'Viloyatlarga', text: '3-5 ish kuni • Pochta/kuryer' },
  { title: 'Filialdan olib ketish', text: '3+ filial • Bepul' },
  { title: 'Qaytarish', text: '14 kun ichida sababsiz' },
];

export const useSiteSettings = create<SiteSettingsState>()(
  persist(
    (set) => ({
      hero: defaultHero,
      banner: null,
      marketplaces: DEFAULT_MARKETPLACES,
      bts: DEFAULT_BTS_SETTINGS,
      contact: DEFAULT_CONTACT,
      deliveryTerms: DEFAULT_DELIVERY_TERMS,
      partners: [],
      setContact: (patch) => set((state) => ({ contact: { ...state.contact, ...patch } })),
      setDeliveryTerms: (terms) => set({ deliveryTerms: terms }),
      addPartner: (p) => set((state) => ({ partners: [...state.partners, p] })),
      updatePartner: (id, patch) =>
        set((state) => ({ partners: state.partners.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removePartner: (id) => set((state) => ({ partners: state.partners.filter((x) => x.id !== id) })),
      setBts: (patch) => set((state) => ({ bts: { ...state.bts, ...patch } })),
      setHero: (patch) =>
        set((state) => ({ hero: { ...state.hero, ...patch } })),
      resetHero: () => set({ hero: defaultHero }),
      addSlide: (slide) =>
        set((state) => ({
          hero: { ...state.hero, slides: [...(state.hero.slides ?? []), slide] },
        })),
      removeSlide: (id) =>
        set((state) => ({
          hero: {
            ...state.hero,
            slides: (state.hero.slides ?? []).filter((s) => s.id !== id),
          },
        })),
      reorderSlide: (id, direction) =>
        set((state) => {
          const slides = [...(state.hero.slides ?? [])];
          const idx = slides.findIndex((s) => s.id === id);
          if (idx === -1) return state;
          const next = idx + direction;
          if (next < 0 || next >= slides.length) return state;
          [slides[idx], slides[next]] = [slides[next], slides[idx]];
          return { hero: { ...state.hero, slides } };
        }),
      setBanner: (banner) => set({ banner }),
      addMarketplace: (m) =>
        set((state) => ({ marketplaces: [...state.marketplaces, m] })),
      updateMarketplace: (id, patch) =>
        set((state) => ({
          marketplaces: state.marketplaces.map((m) =>
            m.id === id ? { ...m, ...patch } : m,
          ),
        })),
      removeMarketplace: (id) =>
        set((state) => ({
          marketplaces: state.marketplaces.filter((m) => m.id !== id),
        })),
      reorderMarketplace: (id, direction) =>
        set((state) => {
          const list = [...state.marketplaces];
          const idx = list.findIndex((m) => m.id === id);
          if (idx === -1) return state;
          const next = idx + direction;
          if (next < 0 || next >= list.length) return state;
          [list[idx], list[next]] = [list[next], list[idx]];
          return { marketplaces: list };
        }),
      resetMarketplaces: () => set({ marketplaces: DEFAULT_MARKETPLACES }),
    }),
    {
      name: 'deftmoto-site-settings',
      version: 5,
      // Persist to the server (global) instead of localStorage.
      storage: createServerPersist('site-settings'),
      // v0 persisted state had no seeded slides — backfill so existing
      // browsers also get an editable/linkable default banner.
      // v2 introduces marketplaces — seed them for older persisted state.
      migrate: (persisted) => {
        const state = persisted as SiteSettingsState;
        if (!state.hero?.slides || state.hero.slides.length === 0) {
          state.hero = { ...state.hero, slides: DEFAULT_HERO_SLIDES };
        }
        if (!state.marketplaces || state.marketplaces.length === 0) {
          state.marketplaces = DEFAULT_MARKETPLACES;
        }
        // v3 introduces BTS sender settings.
        if (!state.bts) {
          state.bts = DEFAULT_BTS_SETTINGS;
        }
        // v4 introduces footer/contact + delivery terms.
        if (!state.contact) state.contact = DEFAULT_CONTACT;
        if (!state.deliveryTerms || state.deliveryTerms.length === 0) {
          state.deliveryTerms = DEFAULT_DELIVERY_TERMS;
        }
        // v5 introduces admin-managed partner brands.
        if (!state.partners) state.partners = [];
        return state;
      },
    },
  ),
);
