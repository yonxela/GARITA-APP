import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario } from './types'

interface AuthState {
  usuario: Usuario | null
  setUsuario: (usuario: Usuario | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      setUsuario: (usuario) => set({ usuario }),
      logout: () => set({ usuario: null }),
    }),
    {
      name: 'garita-auth',
    }
  )
)
