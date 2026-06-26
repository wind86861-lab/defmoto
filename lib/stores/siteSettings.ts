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

interface SiteSettingsState {
  hero: HeroOverride;
  banner: PromoBanner | null;
  setHero: (patch: Partial<HeroOverride>) => void;
  resetHero: () => void;
  addSlide: (slide: HeroSlide) => void;
  removeSlide: (id: string) => void;
  reorderSlide: (id: string, direction: -1 | 1) => void;
  setBanner: (banner: PromoBanner | null) => void;
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

export const useSiteSettings = create<SiteSettingsState>()(
  persist(
    (set) => ({
      hero: defaultHero,
      banner: null,
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
    }),
    {
      name: 'deftmoto-site-settings',
      version: 1,
      // v0 persisted state had no seeded slides — backfill so existing
      // browsers also get an editable/linkable default banner.
      migrate: (persisted) => {
        const state = persisted as SiteSettingsState;
        if (!state.hero?.slides || state.hero.slides.length === 0) {
          state.hero = { ...state.hero, slides: DEFAULT_HERO_SLIDES };
        }
        return state;
      },
    },
  ),
);
