import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface AppState {
  // UI 状态
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  loading: boolean

  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  setLoading: (loading: boolean) => void
}

// 应用全局状态 Store
export const useAppStore = create<AppState>()(
  devtools((set) => ({
    sidebarOpen: true,
    theme: 'light',
    loading: false,

    toggleSidebar: () =>
      set((state) => ({ sidebarOpen: !state.sidebarOpen }), false, 'app/toggleSidebar'),

    setSidebarOpen: (open) =>
      set({ sidebarOpen: open }, false, 'app/setSidebarOpen'),

    setTheme: (theme) =>
      set({ theme }, false, 'app/setTheme'),

    setLoading: (loading) =>
      set({ loading }, false, 'app/setLoading'),
  }))
)
