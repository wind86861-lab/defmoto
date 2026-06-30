import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Client-side admin UI gate. The real protection is the server session cookie
 * (see lib/server/adminAuth) — this store only drives the admin UI shell and
 * mirrors the authenticated state. Sign-in happens via /api/admin/login.
 */
interface AdminAuthState {
  isAuthed: boolean;
  loggedInAt: string | null;
  markAuthed: () => void;
  logout: () => void;
}

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set) => ({
      isAuthed: false,
      loggedInAt: null,
      markAuthed: () => set({ isAuthed: true, loggedInAt: new Date().toISOString() }),
      logout: () => set({ isAuthed: false, loggedInAt: null }),
    }),
    { name: 'deftmoto-admin-auth' },
  ),
);
