import type { PersistStorage, StorageValue } from 'zustand/middleware';

/**
 * Zustand persist storage backed by the server content API instead of
 * localStorage — so admin-managed content is global (every visitor sees the
 * same data) and survives across devices. Reads/writes the whole store blob
 * under one content key. Runs only in the browser (persist hydrates client-side).
 *
 * IMPORTANT — write gate against the hydration race:
 * The store is created with its DEFAULT state (e.g. mockProducts) and only
 * hydrates from the server asynchronously afterwards. Without a gate, any set()
 * that fires before hydration finishes — or a transient GET error — would PUT
 * the default blob and WIPE real server data (added products vanishing). So we
 * only allow writes once we've CONFIRMED the server state: after a successful
 * load (200) or a definitive "no data yet" (404). A failed/errored read keeps
 * writes blocked so we never clobber good data we simply couldn't read.
 */
export function createServerPersist<T>(apiKey: string): PersistStorage<T> {
  let canWrite = false;

  return {
    getItem: async (): Promise<StorageValue<T> | null> => {
      try {
        const res = await fetch(`/api/content/${apiKey}`, { cache: 'no-store' });
        if (res.status === 404) {
          // Confirmed: no server data yet → safe to persist the first save.
          canWrite = true;
          return null;
        }
        if (!res.ok) {
          // Transient error — do NOT enable writes (avoid clobbering good data).
          return null;
        }
        const json = (await res.json()) as StorageValue<T> | null;
        // Confirmed server state loaded → writes are now safe.
        canWrite = true;
        return json ?? null;
      } catch {
        // Network failure — keep writes blocked until a successful hydration.
        return null;
      }
    },
    setItem: async (_name, value): Promise<void> => {
      // Never persist before we've confirmed the server's current state.
      if (!canWrite) return;
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
