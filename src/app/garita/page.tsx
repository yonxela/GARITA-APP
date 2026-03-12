'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/lib/store'
import { AccessScreen } from '@/components/access-screen'
import { formatDate } from '@/lib/utils'
import {
  Shield, Camera, QrCode, Radio, Keyboard, LogOut,
  Clock, CheckCircle2, Car, UserCheck, AlertTriangle, XCircle,
  Users, Search, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Visita, RegistroAcceso, Usuario, Vehiculo, EstadoAcceso, Condominio } from '@/lib/types'
import { createRegistroAcceso, findVehiculoByPlacaInCondominio, findVisitaPendienteByPlaca, getCondominioById, listRegistrosHoy, listVisitasHoyByCondominio, updateVisita } from '@/lib/firebase/repo'

type Tab = 'visitas' | 'registros'

export default function GaritaPage() {
  const { usuario, logout } = useAuthStore()
  const [condominio, setCondominio] = useState<Condominio | null>(null)
  const [visitasHoy, setVisitasHoy] = useState<Visita[]>([])
  const [registrosHoy, setRegistrosHoy] = useState<RegistroAcceso[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('visitas')
  const [loading, setLoading] = useState(true)

  // Access screen state
  const [accessScreen, setAccessScreen] = useState<{
    show: boolean
    status: EstadoAcceso
    usuario?: Usuario | null
    visita?: Visita | null
    placa?: string
  }>({ show: false, status: 'verificado' })

  // Manual search
  const [manualPlaca, setManualPlaca] = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    const condId = usuario!.condominio_id!
    const today = new Date().toISOString().split('T')[0]

    const [cond, visitas, registros] = await Promise.all([
      getCondominioById(condId),
      listVisitasHoyByCondominio(condId, today),
      listRegistrosHoy(condId, today),
    ])

    setCondominio(cond)
    setVisitasHoy((visitas || []).filter((v) => ['pendiente', 'ingresada'].includes((v as any).estado)) as any)
    setRegistrosHoy((registros || []).slice(0, 50))
    setLoading(false)
  }

  const showAccessResult = useCallback((status: EstadoAcceso, usr?: Usuario | null, vis?: Visita | null, placa?: string) => {
    setAccessScreen({ show: true, status, usuario: usr, visita: vis, placa })
  }, [])

  async function registrarAcceso(
    tipoAcceso: 'lpr' | 'qr' | 'tag' | 'manual',
    tipoResultado: EstadoAcceso,
    opts: { vehiculo_id?: string; visita_id?: string; usuario_id?: string; placa?: string }
  ) {
    await createRegistroAcceso({
      condominio_id: usuario!.condominio_id!,
      tipo_acceso: tipoAcceso,
      tipo_resultado: tipoResultado,
      ...opts,
    } as any)
    loadData()
  }

  async function validarVisita(visita: Visita) {
    await updateVisita(visita.id, { estado: 'ingresada', fecha_ingreso: new Date().toISOString() } as any)
    await registrarAcceso('manual', 'visita', { visita_id: visita.id, placa: visita.placa || undefined })
    showAccessResult('visita', null, visita, visita.placa || undefined)
    toast.success(`Visita de ${visita.nombre_visita} validada`)
  }

  async function buscarPlaca() {
    if (!manualPlaca.trim()) {
      toast.error('Ingresa un número de placa')
      return
    }

    setSearching(true)
    const placa = manualPlaca.toUpperCase().trim()

    const veh = await findVehiculoByPlacaInCondominio(usuario!.condominio_id!, placa)
    if (veh?.usuario) {
      const usr = veh.usuario as Usuario
      const status: EstadoAcceso = usr.moroso ? 'moroso' : 'verificado'
      showAccessResult(status, usr, null, placa)
      await registrarAcceso('manual', status, {
        vehiculo_id: veh.vehiculo.id,
        usuario_id: usr.id,
        placa,
      })
    } else {
      const visita = await findVisitaPendienteByPlaca(usuario!.condominio_id!, placa)
      if (visita) {
        await updateVisita(visita.id, { estado: 'ingresada', fecha_ingreso: new Date().toISOString() } as any)
        showAccessResult('visita', null, visita as any, placa)
        await registrarAcceso('manual', 'visita', { visita_id: visita.id, placa })
      } else {
        showAccessResult('no_registrado', null, null, placa)
        await registrarAcceso('manual', 'no_registrado', { placa })
      }
    }

    setManualPlaca('')
    setSearching(false)
  }

  const resultColors: Record<EstadoAcceso, string> = {
    verificado: 'border-l-green-500 bg-green-50/50',
    moroso: 'border-l-orange-500 bg-orange-50/50',
    no_registrado: 'border-l-red-500 bg-red-50/50',
    visita: 'border-l-blue-500 bg-blue-50/50',
  }

  const resultIcons: Record<EstadoAcceso, React.ReactNode> = {
    verificado: <UserCheck className="w-5 h-5 text-green-600" />,
    moroso: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    no_registrado: <XCircle className="w-5 h-5 text-red-500" />,
    visita: <Shield className="w-5 h-5 text-blue-500" />,
  }

  const resultLabels: Record<EstadoAcceso, string> = {
    verificado: 'Verificado',
    moroso: 'Moroso',
    no_registrado: 'No Registrado',
    visita: 'Visita',
  }

  return (
    <>
      {/* Access Screen Overlay */}
      {accessScreen.show && (
        <AccessScreen
          status={accessScreen.status}
          usuario={accessScreen.usuario}
          visita={accessScreen.visita}
          placa={accessScreen.placa}
          onClose={() => setAccessScreen((prev) => ({ ...prev, show: false }))}
        />
      )}

      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <header className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Panel de Garita</h1>
                <p className="text-sm text-gray-400">{condominio?.nombre} — {usuario?.nombre}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-4">
                <p className="text-xs text-gray-400">
                  {new Date().toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => { logout(); window.location.href = '/' }}
                className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors"
              >
                <LogOut className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 grid grid-cols-12 gap-6">
          {/* Left Panel - Access Methods */}
          <div className="col-span-4 space-y-6">
            {/* Manual Search */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Keyboard className="w-5 h-5 text-brand-400" />
                <h2 className="font-bold">Búsqueda Manual</h2>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualPlaca}
                  onChange={(e) => setManualPlaca(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && buscarPlaca()}
                  placeholder="Número de placa..."
                  className="flex-1 bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white font-mono text-lg placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 uppercase"
                  autoFocus
                />
                <button
                  onClick={buscarPlaca}
                  disabled={searching}
                  className="px-5 py-3 bg-brand-600 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Access Method Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {condominio?.config_lpr && (
                <button className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-5 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group">
                  <Camera className="w-8 h-8 text-purple-400 group-hover:text-purple-300 mb-3" />
                  <p className="font-semibold text-sm">Cámara LPR</p>
                  <p className="text-xs text-gray-500 mt-1">Lectura de placa</p>
                </button>
              )}
              {condominio?.config_qr && (
                <button className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
                  <QrCode className="w-8 h-8 text-blue-400 group-hover:text-blue-300 mb-3" />
                  <p className="font-semibold text-sm">Código QR</p>
                  <p className="text-xs text-gray-500 mt-1">Escanear código</p>
                </button>
              )}
              {condominio?.config_tag && (
                <button className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-5 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group">
                  <Radio className="w-8 h-8 text-amber-400 group-hover:text-amber-300 mb-3" />
                  <p className="font-semibold text-sm">Tag / RFID</p>
                  <p className="text-xs text-gray-500 mt-1">Lectura de tag</p>
                </button>
              )}
              {condominio?.config_manual && (
                <button className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-5 hover:border-green-500/50 hover:bg-green-500/5 transition-all group">
                  <Keyboard className="w-8 h-8 text-green-400 group-hover:text-green-300 mb-3" />
                  <p className="font-semibold text-sm">Manual</p>
                  <p className="text-xs text-gray-500 mt-1">Ingreso manual</p>
                </button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-brand-400">{visitasHoy.filter((v) => v.estado === 'pendiente').length}</p>
                  <p className="text-xs text-gray-400 mt-1">Visitas Pendientes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{registrosHoy.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Accesos Hoy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Visits & Records */}
          <div className="col-span-8">
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-1 mb-4">
              <button
                onClick={() => setActiveTab('visitas')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all',
                  activeTab === 'visitas'
                    ? 'bg-brand-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <Users className="w-4 h-4" />
                Visitas del Día ({visitasHoy.length})
              </button>
              <button
                onClick={() => setActiveTab('registros')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all',
                  activeTab === 'registros'
                    ? 'bg-brand-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <Clock className="w-4 h-4" />
                Registros ({registrosHoy.length})
              </button>
            </div>

            {/* Content */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : activeTab === 'visitas' ? (
                <div className="divide-y divide-gray-700/30">
                  {visitasHoy.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No hay visitas pendientes</p>
                    </div>
                  ) : (
                    visitasHoy.map((v) => (
                      <div key={v.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-700/20 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            v.estado === 'pendiente' ? 'bg-amber-500/20' : 'bg-green-500/20'
                          )}>
                            {v.estado === 'pendiente' ? (
                              <Clock className="w-5 h-5 text-amber-400" />
                            ) : (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{v.nombre_visita}</p>
                            <p className="text-sm text-gray-400">
                              {v.vecino?.nombre} — {v.vecino?.lote_casa} • {v.motivo}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {v.placa && (
                            <span className="font-mono text-sm text-gray-300 bg-gray-700/50 px-3 py-1 rounded-lg">
                              {v.placa}
                            </span>
                          )}
                          {v.estado === 'pendiente' ? (
                            <button
                              onClick={() => validarVisita(v)}
                              className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                            >
                              Validar Ingreso
                            </button>
                          ) : (
                            <span className="badge bg-green-500/20 text-green-400">Ingresó</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-700/30 max-h-[600px] overflow-y-auto scrollbar-thin">
                  {registrosHoy.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No hay registros de hoy</p>
                    </div>
                  ) : (
                    registrosHoy.map((r) => (
                      <div
                        key={r.id}
                        className={cn(
                          'px-5 py-3 border-l-4 flex items-center justify-between',
                          resultColors[r.tipo_resultado]
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {resultIcons[r.tipo_resultado]}
                          <div>
                            <p className="font-semibold text-gray-200 text-sm">
                              {r.usuario?.nombre || r.visita?.nombre_visita || 'Desconocido'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(r.fecha_hora).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                              {' — '}
                              {r.tipo_acceso.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {r.placa && (
                            <span className="font-mono text-sm text-gray-300">{r.placa}</span>
                          )}
                          <span className={cn(
                            'badge text-xs',
                            r.tipo_resultado === 'verificado' && 'bg-green-500/20 text-green-400',
                            r.tipo_resultado === 'moroso' && 'bg-orange-500/20 text-orange-400',
                            r.tipo_resultado === 'no_registrado' && 'bg-red-500/20 text-red-400',
                            r.tipo_resultado === 'visita' && 'bg-blue-500/20 text-blue-400',
                          )}>
                            {resultLabels[r.tipo_resultado]}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
