import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// 用户状态接口
interface User {
  id: string
  name: string
  email: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean

  // Actions
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

// 认证状态 Store
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        isAuthenticated: false,

        login: (user, token) =>
          set({ user, token, isAuthenticated: true }, false, 'auth/login'),

        logout: () =>
          set({ user: null, token: null, isAuthenticated: false }, false, 'auth/logout'),

        updateUser: (userData) =>
          set(
            (state) => ({
              user: state.user ? { ...state.user, ...userData } : null,
            }),
            false,
            'auth/updateUser'
          ),
      }),
      {
        name: 'auth-storage', // localStorage key
      }
    )
  )
)
