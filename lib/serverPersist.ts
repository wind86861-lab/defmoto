import type { PersistStorage, StorageValue } from 'zustand/middleware';

/**
 * Zustand persist storage backed by the server content API instead of
 * localStorage — so admin-managed content is global (every visitor sees the
 * same data) and survives across devices. Reads/writes the whole store blob
 * under one content key. Runs only in the browser (persist hydrates client-side).
 */
export function createServerPersist<T>(apiKey: string): PersistStorage<T> {
  return {
    getItem: async (): Promise<StorageValue<T> | null> => {
      try {
        const res = await fetch(`/api/content/${apiKey}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const json = (await res.json()) as StorageValue<T> | null;
        return json ?? null;
      } catch {
        return null;
      }
    },
    setItem: async (_name, value): Promise<void> => {
      try {
        await fetch(`/api/content/${apiKey}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value),
        });
      } catch {
        /* offline — ignore; next save retries */
      }
    },
    removeItem: async (): Promise<void> => {},
  };
}
