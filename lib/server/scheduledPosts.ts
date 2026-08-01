/**
 * Scheduled channel posts.
 *
 * The admin picks a send time in Uzbekistan time (UTC+5, no DST); we store it as
 * a UTC epoch and a background runner (started from instrumentation.ts) fires due
 * posts, independent of the server's own timezone. Persisted to .data so a
 * restart doesn't lose scheduled posts.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { postProductToChannel } from './channelPost';

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE = path.join(DATA_DIR, 'scheduled-posts.json');

/** Uzbekistan is UTC+5 year-round. */
const UZ_OFFSET_MIN = 5 * 60;

export interface ScheduledPost {
  id: string;
  productId: string;
  productName: string;
  sendAt: number; // UTC epoch ms
  createdAt: number;
  attempts: number;
}

interface State {
  loaded: boolean;
  items: ScheduledPost[];
}

const globalRef = globalThis as unknown as { __deftScheduledPosts?: State };
const state: State = globalRef.__deftScheduledPosts ?? (globalRef.__deftScheduledPosts = { loaded: false, items: [] });

async function load() {
  if (state.loaded) return;
  state.loaded = true;
  try {
    state.items = JSON.parse(await fs.readFile(FILE, 'utf8'));
    if (!Array.isArray(state.items)) state.items = [];
  } catch {
    state.items = [];
  }
}

async function persist() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(state.items));
  } catch {
    /* best-effort */
  }
}

/**
 * Convert an admin-entered "YYYY-MM-DDTHH:MM" wall-clock time (Uzbekistan) into
 * a UTC epoch. Returns null on a malformed value.
 */
export function uzLocalToEpoch(local: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec((local || '').trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number) as unknown as number[];
  // Wall-clock is UTC+5, so subtract the offset to get UTC.
  return Date.UTC(y, mo - 1, d, h, mi) - UZ_OFFSET_MIN * 60_000;
}

export async function addScheduledPost(
  productId: string,
  productName: string,
  sendAt: number,
): Promise<ScheduledPost> {
  await load();
  const item: ScheduledPost = {
    id: `sp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    productId,
    productName,
    sendAt,
    createdAt: Date.now(),
    attempts: 0,
  };
  state.items.push(item);
  await persist();
  return item;
}

export async function listScheduledPosts(): Promise<ScheduledPost[]> {
  await load();
  return [...state.items].sort((a, b) => a.sendAt - b.sendAt);
}

export async function cancelScheduledPost(id: string): Promise<boolean> {
  await load();
  const before = state.items.length;
  state.items = state.items.filter((x) => x.id !== id);
  if (state.items.length === before) return false;
  await persist();
  return true;
}

/** Fire every due post. Called on an interval by the scheduler. */
export async function runDueScheduledPosts(): Promise<void> {
  await load();
  const now = Date.now();
  const due = state.items.filter((x) => x.sendAt <= now);
  if (!due.length) return;

  for (const item of due) {
    const result = await postProductToChannel(item.productId);
    if (result.ok) {
      state.items = state.items.filter((x) => x.id !== item.id);
    } else {
      // Retry a couple of times (rate limits, transient errors), then drop.
      item.attempts += 1;
      if (item.attempts >= 3) {
        state.items = state.items.filter((x) => x.id !== item.id);
        console.log('[schedule] giving up on', item.productName, result);
      } else {
        item.sendAt = now + 2 * 60_000; // try again in 2 min
      }
    }
  }
  await persist();
}

let started = false;
/** Start the minute-interval runner (idempotent). */
export function startScheduler(): void {
  if (started) return;
  started = true;
  setInterval(() => {
    void runDueScheduledPosts();
  }, 60_000);
  // Also run shortly after boot to catch anything already due.
  setTimeout(() => void runDueScheduledPosts(), 10_000);
}
