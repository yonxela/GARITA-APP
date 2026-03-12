'use client'

import { useAuthStore } from '@/lib/store'
import { Sidebar } from '@/components/sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const usuario = useAuthStore((s) => s.usuario)

  if (!usuario || !['administrador', 'coadministrador'].includes(usuario.rol)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Sin acceso. Inicia sesión como administrador.</p>
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
