'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Shield, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getCondominioById, getUsuarioByCodigo } from '@/lib/firebase/repo'

export default function LoginPage() {
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const setUsuario = useAuthStore((s) => s.setUsuario)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codigo.trim()) {
      toast.error('Ingresa tu código de acceso')
      return
    }

    setLoading(true)
    try {
      const data = await getUsuarioByCodigo(codigo)
      if (!data || !data.activo) {
        toast.error('Código no válido o usuario inactivo')
        return
      }

      let condominio = null
      if (data.rol !== 'master' && data.condominio_id) {
        condominio = await getCondominioById(data.condominio_id)
        if (condominio && !condominio.activo) {
          toast.error('El condominio se encuentra desactivado. Contacte al administrador.')
          return
        }
      }

      setUsuario({ ...data, condominio } as any)
      toast.success(`Bienvenido, ${data.nombre}`)

      const routes: Record<string, string> = {
        master: '/master',
        administrador: '/admin',
        coadministrador: '/admin',
        vecino: '/vecino',
        policia: '/garita',
      }
      router.push(routes[data.rol] || '/master')
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-white/60 text-sm font-medium tracking-wider uppercase">SISDEL</span>
            </div>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-6xl font-bold text-white leading-tight">
              GARITA
              <span className="text-brand-400">.APP</span>
            </h1>
            <p className="text-xl text-white/60 max-w-md leading-relaxed">
              Sistema inteligente de control de acceso para condominios y residenciales.
            </p>
            <div className="flex gap-4 pt-4">
              {['LPR', 'QR', 'TAG', 'Manual'].map((method) => (
                <div
                  key={method}
                  className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white/70 text-sm font-medium"
                >
                  {method}
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-white/30 text-sm">
            © {new Date().getFullYear()} SISDEL — Todos los derechos reservados
          </div>
        </div>
      </div>

      {/* Right Panel - Login */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                GARITA<span className="text-brand-600">.APP</span>
              </h1>
              <p className="text-xs text-gray-400 tracking-wider uppercase">SISDEL</p>
            </div>
          </div>

          <div className="space-y-2 mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Iniciar Sesión</h2>
            <p className="text-gray-500">Ingresa tu código único de acceso para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Código de Acceso
              </label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ej: AJH645"
                maxLength={6}
                className="input-field text-lg tracking-[0.3em] text-center font-mono font-bold uppercase"
                autoFocus
              />
              <p className="text-xs text-gray-400 text-center">
                3 letras + 3 números
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || codigo.length < 6}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-center text-xs text-gray-400">
              Powered by <span className="font-semibold text-gray-500">SISDEL</span> — Control de Acceso Inteligente
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
