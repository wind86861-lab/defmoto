import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockBranches } from '@/mocks/branches';
import { mockServiceCenters } from '@/mocks/services';
import type { Branch, ServiceCenter, ServiceItem } from '@/types/content';

/**
 * Admin-managed site content: branches, service centres and the franchise
 * block. Seeded from the mock data so the admin starts with the live content
 * and can fully edit it (persisted to localStorage, same pattern as hero /
 * marketplaces).
 */

export interface FranchiseOverride {
  title?: string;
  description?: string;
  statInvestment?: string;
  statPayback?: string;
  statBranches?: string;
}

interface ContentState {
  branches: Branch[];
  serviceCenters: ServiceCenter[];
  franchise: FranchiseOverride;

  // Branches
  addBranch: (b: Branch) => void;
  updateBranch: (id: string, patch: Partial<Branch>) => void;
  removeBranch: (id: string) => void;
  reorderBranch: (id: string, dir: -1 | 1) => void;
  resetBranches: () => void;

  // Service centres
  addServiceCenter: (s: ServiceCenter) => void;
  updateServiceCenter: (id: string, patch: Partial<ServiceCenter>) => void;
  removeServiceCenter: (id: string) => void;
  reorderServiceCenter: (id: string, dir: -1 | 1) => void;
  addServiceItem: (centerId: string, item: ServiceItem) => void;
  updateServiceItem: (centerId: string, itemId: string, patch: Partial<ServiceItem>) => void;
  removeServiceItem: (centerId: string, itemId: string) => void;
  resetServiceCenters: () => void;

  // Franchise
  setFranchise: (patch: Partial<FranchiseOverride>) => void;
  resetFranchise: () => void;
}

function move<T extends { id: string }>(list: T[], id: string, dir: -1 | 1): T[] {
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return list;
  const next = idx + dir;
  if (next < 0 || next >= list.length) return list;
  const copy = [...list];
  [copy[idx], copy[next]] = [copy[next], copy[idx]];
  return copy;
}

export const useContentStore = create<ContentState>()(
  persist(
    (set) => ({
      branches: mockBranches,
      serviceCenters: mockServiceCenters,
      franchise: {},

      addBranch: (b) => set((s) => ({ branches: [...s.branches, b] })),
      updateBranch: (id, patch) =>
        set((s) => ({
          branches: s.branches.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      removeBranch: (id) =>
        set((s) => ({ branches: s.branches.filter((b) => b.id !== id) })),
      reorderBranch: (id, dir) => set((s) => ({ branches: move(s.branches, id, dir) })),
      resetBranches: () => set({ branches: mockBranches }),

      addServiceCenter: (c) =>
        set((s) => ({ serviceCenters: [...s.serviceCenters, c] })),
      updateServiceCenter: (id, patch) =>
        set((s) => ({
          serviceCenters: s.serviceCenters.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        })),
      removeServiceCenter: (id) =>
        set((s) => ({ serviceCenters: s.serviceCenters.filter((c) => c.id !== id) })),
      reorderServiceCenter: (id, dir) =>
        set((s) => ({ serviceCenters: move(s.serviceCenters, id, dir) })),
      addServiceItem: (centerId, item) =>
        set((s) => ({
          serviceCenters: s.serviceCenters.map((c) =>
            c.id === centerId ? { ...c, services: [...c.services, item] } : c,
          ),
        })),
      updateServiceItem: (centerId, itemId, patch) =>
        set((s) => ({
          serviceCenters: s.serviceCenters.map((c) =>
            c.id === centerId
              ? {
                  ...c,
                  services: c.services.map((it) =>
                    it.id === itemId ? { ...it, ...patch } : it,
                  ),
                }
              : c,
          ),
        })),
      removeServiceItem: (centerId, itemId) =>
        set((s) => ({
          serviceCenters: s.serviceCenters.map((c) =>
            c.id === centerId
              ? { ...c, services: c.services.filter((it) => it.id !== itemId) }
              : c,
          ),
        })),
      resetServiceCenters: () => set({ serviceCenters: mockServiceCenters }),

      setFranchise: (patch) =>
        set((s) => ({ franchise: { ...s.franchise, ...patch } })),
      resetFranchise: () => set({ franchise: {} }),
    }),
    {
      name: 'deftmoto-content',
      version: 1,
    },
  ),
);
