'use client'

import { useEffect, useState } from 'react'
import { cn, getStatusLabel } from '@/lib/utils'
import type { EstadoAcceso, Usuario, Visita } from '@/lib/types'
import { Shield, AlertTriangle, XCircle, UserCheck } from 'lucide-react'

interface AccessScreenProps {
  status: EstadoAcceso
  usuario?: Usuario | null
  visita?: Visita | null
  placa?: string
  onClose: () => void
  duration?: number
}

const statusConfig = {
  verificado: {
    bg: 'bg-green-500',
    icon: <UserCheck className="w-20 h-20 text-white" />,
    glow: 'shadow-[0_0_120px_rgba(34,197,94,0.5)]',
  },
  moroso: {
    bg: 'bg-orange-500',
    icon: <AlertTriangle className="w-20 h-20 text-white" />,
    glow: 'shadow-[0_0_120px_rgba(249,115,22,0.5)]',
  },
  no_registrado: {
    bg: 'bg-red-600',
    icon: <XCircle className="w-20 h-20 text-white" />,
    glow: 'shadow-[0_0_120px_rgba(239,68,68,0.5)]',
  },
  visita: {
    bg: 'bg-blue-500',
    icon: <Shield className="w-20 h-20 text-white" />,
    glow: 'shadow-[0_0_120px_rgba(59,130,246,0.5)]',
  },
}

export function AccessScreen({ status, usuario, visita, placa, onClose, duration = 4000 }: AccessScreenProps) {
  const [visible, setVisible] = useState(true)
  const [progress, setProgress] = useState(100)
  const config = statusConfig[status]

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev - (100 / (duration / 50))
        if (next <= 0) {
          clearInterval(interval)
          return 0
        }
        return next
      })
    }, 50)

    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, duration)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [duration, onClose])

  return (
    <div
      className={cn(
        'access-overlay transition-opacity duration-300',
        config.bg,
        !visible && 'opacity-0'
      )}
    >
      <div className={cn('w-40 h-40 rounded-full flex items-center justify-center mb-8', config.bg, config.glow)}>
        {config.icon}
      </div>

      <h1 className="text-5xl font-black text-white mb-4 text-center">
        {getStatusLabel(status)}
      </h1>

      {usuario && (
        <div className="text-center space-y-2 mb-6">
          <p className="text-2xl font-semibold text-white/90">{usuario.nombre}</p>
          {usuario.lote_casa && (
            <p className="text-lg text-white/70">Casa/Lote: {usuario.lote_casa}</p>
          )}
        </div>
      )}

      {visita && (
        <div className="text-center space-y-2 mb-6">
          <p className="text-2xl font-semibold text-white/90">{visita.nombre_visita}</p>
          <p className="text-lg text-white/70">Motivo: {visita.motivo}</p>
          {visita.vecino && (
            <p className="text-lg text-white/70">Visita de: {visita.vecino.nombre}</p>
          )}
        </div>
      )}

      {placa && (
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4 mt-2">
          <p className="text-3xl font-mono font-bold text-white tracking-wider">{placa}</p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-80 h-1.5 bg-white/20 rounded-full mt-10 overflow-hidden">
        <div
          className="h-full bg-white/60 rounded-full transition-all duration-50 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
