import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface SiteSettingsState {
  hero: HeroOverride;
  banner: PromoBanner | null;
  marketplaces: Marketplace[];
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

export const useSiteSettings = create<SiteSettingsState>()(
  persist(
    (set) => ({
      hero: defaultHero,
      banner: null,
      marketplaces: DEFAULT_MARKETPLACES,
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
      version: 2,
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
        return state;
      },
    },
  ),
);
