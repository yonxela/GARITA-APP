'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Shield,
  Building2,
  Users,
  Settings,
  MessageSquare,
  LogOut,
  Home,
  Car,
  UserPlus,
  ClipboardList,
  Camera,
  QrCode,
  Radio,
  KeyRound,
  Bell,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  children?: NavItem[]
}

const navByRole: Record<string, NavItem[]> = {
  master: [
    { label: 'Dashboard', href: '/master', icon: <Home className="w-5 h-5" /> },
    { label: 'Condominios', href: '/master/condominios', icon: <Building2 className="w-5 h-5" /> },
    { label: 'Mensajes', href: '/master/mensajes', icon: <MessageSquare className="w-5 h-5" /> },
  ],
  administrador: [
    { label: 'Dashboard', href: '/admin', icon: <Home className="w-5 h-5" /> },
    { label: 'Usuarios', href: '/admin/usuarios', icon: <Users className="w-5 h-5" /> },
    { label: 'Vehículos', href: '/admin/vehiculos', icon: <Car className="w-5 h-5" /> },
    { label: 'Visitas', href: '/admin/visitas', icon: <ClipboardList className="w-5 h-5" /> },
    { label: 'Registros', href: '/admin/registros', icon: <Radio className="w-5 h-5" /> },
  ],
  coadministrador: [
    { label: 'Dashboard', href: '/admin', icon: <Home className="w-5 h-5" /> },
    { label: 'Usuarios', href: '/admin/usuarios', icon: <Users className="w-5 h-5" /> },
    { label: 'Vehículos', href: '/admin/vehiculos', icon: <Car className="w-5 h-5" /> },
    { label: 'Visitas', href: '/admin/visitas', icon: <ClipboardList className="w-5 h-5" /> },
    { label: 'Registros', href: '/admin/registros', icon: <Radio className="w-5 h-5" /> },
  ],
  vecino: [
    { label: 'Dashboard', href: '/vecino', icon: <Home className="w-5 h-5" /> },
    { label: 'Mis Visitas', href: '/vecino/visitas', icon: <UserPlus className="w-5 h-5" /> },
    { label: 'Mis Vehículos', href: '/vecino/vehiculos', icon: <Car className="w-5 h-5" /> },
  ],
  policia: [
    { label: 'Panel de Garita', href: '/garita', icon: <Shield className="w-5 h-5" /> },
  ],
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { usuario, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  if (!usuario) return null

  const items = navByRole[usuario.rol] || []

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar flex flex-col transition-all duration-300 z-40',
        collapsed ? 'w-20' : 'w-72'
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-white">
                GARITA<span className="text-brand-400">.APP</span>
              </h1>
              <p className="text-[10px] text-sidebar-foreground/40 tracking-[0.2em] uppercase">SISDEL</p>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 mx-3 mt-4 bg-sidebar-accent rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-brand-400 text-sm font-bold">
              {usuario.nombre.charAt(0)}
            </span>
          </div>
          {!collapsed && (
            <div className="min-w-0 animate-fade-in">
              <p className="text-sm font-semibold text-white truncate">{usuario.nombre}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize">{usuario.rol}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 mt-4 overflow-y-auto scrollbar-thin">
        {items.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/master' && item.href !== '/admin' && item.href !== '/vecino' && pathname.startsWith(item.href))
          
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'sidebar-item w-full',
                isActive
                  ? 'active'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
              )}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  )
}
