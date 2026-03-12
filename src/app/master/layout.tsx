'use client'

import { useAuthStore } from '@/lib/store'
import { Sidebar } from '@/components/sidebar'

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  const usuario = useAuthStore((s) => s.usuario)

  if (!usuario || usuario.rol !== 'master') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Sin acceso. Inicia sesión como master.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-72 p-8">
        {children}
      </main>
    </div>
  )
}
