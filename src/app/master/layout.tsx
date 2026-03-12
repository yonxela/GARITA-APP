'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Sidebar } from '@/components/sidebar'

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  const usuario = useAuthStore((s) => s.usuario)
  const router = useRouter()

  useEffect(() => {
    if (!usuario || usuario.rol !== 'master') {
      router.push('/')
    }
  }, [usuario, router])

  if (!usuario || usuario.rol !== 'master') return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-72 p-8">
        {children}
      </main>
    </div>
  )
}
