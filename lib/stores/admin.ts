import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Demo password — replace with real auth API in backend phase.
const ADMIN_PASSWORD = 'deftmoto2026';

interface AdminAuthState {
  isAuthed: boolean;
  loggedInAt: string | null;
  login: (password: string) => boolean;
  logout: () => void;
}

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set) => ({
      isAuthed: false,
      loggedInAt: null,
      login: (password) => {
        if (password === ADMIN_PASSWORD) {
          set({ isAuthed: true, loggedInAt: new Date().toISOString() });
          return true;
        }
        return false;
      },
      logout: () => set({ isAuthed: false, loggedInAt: null }),
    }),
    { name: 'deftmoto-admin-auth' },
  ),
);
