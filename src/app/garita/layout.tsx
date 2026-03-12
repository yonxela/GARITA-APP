'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export default function GaritaLayout({ children }: { children: React.ReactNode }) {
  const usuario = useAuthStore((s) => s.usuario)
  const router = useRouter()

  useEffect(() => {
    if (!usuario || usuario.rol !== 'policia') {
      router.push('/')
    }
  }, [usuario, router])

  if (!usuario || usuario.rol !== 'policia') return null

  return (
    <div className="min-h-screen bg-gray-900">
      {children}
    </div>
  )
}
