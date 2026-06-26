import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const LIMIT = 8;

interface RecentSearchesState {
  items: string[];
  add: (q: string) => void;
  remove: (q: string) => void;
  clear: () => void;
}

export const useRecentSearches = create<RecentSearchesState>()(
  persist(
    (set) => ({
      items: [],
      add: (q) =>
        set((state) => {
          const trimmed = q.trim();
          if (!trimmed) return state;
          const filtered = state.items.filter(
            (x) => x.toLowerCase() !== trimmed.toLowerCase(),
          );
          return { items: [trimmed, ...filtered].slice(0, LIMIT) };
        }),
      remove: (q) =>
        set((state) => ({ items: state.items.filter((x) => x !== q) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'deftmoto-recent-searches' },
  ),
);
