import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUserCode(condominioInitial: string, userName: string): string {
  const first = condominioInitial.toUpperCase().charAt(0)
  const second = userName.toUpperCase().charAt(0)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const third = alphabet[Math.floor(Math.random() * alphabet.length)]
  const numbers = Math.floor(100 + Math.random() * 900).toString()
  return `${first}${second}${third}${numbers}`
}

export function formatDate(date: string | Date, includeTime = false): string {
  const d = new Date(date)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
  }
  return d.toLocaleDateString('es-GT', options)
}

export function getStatusColor(status: 'verificado' | 'moroso' | 'no_registrado' | 'visita'): string {
  const colors = {
    verificado: 'bg-status-verified',
    moroso: 'bg-status-moroso',
    no_registrado: 'bg-status-unregistered',
    visita: 'bg-status-visit',
  }
  return colors[status]
}

export function getStatusLabel(status: 'verificado' | 'moroso' | 'no_registrado' | 'visita'): string {
  const labels = {
    verificado: 'Vecino Verificado',
    moroso: 'Vecino Moroso',
    no_registrado: 'No Registrado',
    visita: 'Visita Autorizada',
  }
  return labels[status]
}

export function getDaysUntil(date: string | Date): number {
  const target = new Date(date)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
