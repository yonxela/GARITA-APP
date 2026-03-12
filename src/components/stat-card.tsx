'use client'

import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
  className?: string
  iconBg?: string
}

export function StatCard({ title, value, icon, trend, trendUp, className, iconBg = 'bg-brand-50 text-brand-600' }: StatCardProps) {
  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className={cn(
              'text-xs font-medium mt-2',
              trendUp ? 'text-green-600' : 'text-red-500'
            )}>
              {trend}
            </p>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconBg)}>
          {icon}
        </div>
      </div>
    </div>
  )
}
