'use client'

import { Bell } from 'lucide-react'
import { useAuthStore } from '@/lib/store'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const usuario = useAuthStore((s) => s.usuario)

  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button className="relative w-10 h-10 bg-white rounded-xl premium-shadow flex items-center justify-center hover:bg-gray-50 transition-colors">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            3
          </span>
        </button>
      </div>
    </div>
  )
}
