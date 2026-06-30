import { create } from 'zustand';

/**
 * Estado de UI puramente cliente (NO estado de servidor ni de auth).
 * El estado de servidor lo lleva TanStack Query; la sesión la lleva supabase-js.
 */
interface UiState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
