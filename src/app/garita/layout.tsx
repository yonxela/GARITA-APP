'use client'

import { useAuthStore } from '@/lib/store'

export default function GaritaLayout({ children }: { children: React.ReactNode }) {
  const usuario = useAuthStore((s) => s.usuario)

  if (!usuario || usuario.rol !== 'policia') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-400 text-sm">Sin acceso. Inicia sesión como policía.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {children}
    </div>
  )
}
