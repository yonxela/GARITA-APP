'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { formatDate } from '@/lib/utils'
import { UserPlus, Car, ClipboardList, Clock, Plus } from 'lucide-react'
import type { Visita, Vehiculo } from '@/lib/types'
import { listVehiculosByUsuario, listVisitasByVecino } from '@/lib/firebase/repo'

export default function VecinoDashboard() {
  const usuario = useAuthStore((s) => s.usuario)
  const router = useRouter()
  const [visitasActivas, setVisitasActivas] = useState<Visita[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [totalVisitas, setTotalVisitas] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [visitasAll, vehiculosAll] = await Promise.all([
      listVisitasByVecino(usuario!.id),
      listVehiculosByUsuario(usuario!.id),
    ])

    const activas = visitasAll.filter((v) => ['pendiente', 'ingresada'].includes(v.estado)).slice(0, 5)
    setVisitasActivas(activas)
    setVehiculos(vehiculosAll)
    setTotalVisitas(visitasAll.length)
    setLoading(false)
  }

  return (
    <div>
      <PageHeader
        title={`Hola, ${usuario?.nombre}`}
        description={`${usuario?.lote_casa || ''} — Panel de residente`}
        actions={
          <button
            onClick={() => router.push('/vecino/visitas/nueva')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Visita
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Visitas Activas"
          value={visitasActivas.length}
          icon={<ClipboardList className="w-6 h-6" />}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Mis Vehículos"
          value={vehiculos.length}
          icon={<Car className="w-6 h-6" />}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Total Visitas"
          value={totalVisitas}
          icon={<UserPlus className="w-6 h-6" />}
          iconBg="bg-green-50 text-green-600"
        />
      </div>

      {/* Visitas Activas */}
      <div className="bg-white rounded-2xl premium-shadow mb-6">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Visitas Activas</h2>
          <button
            onClick={() => router.push('/vecino/visitas')}
            className="text-sm text-brand-600 font-semibold hover:text-brand-700"
          >
            Ver todas
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {visitasActivas.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No tienes visitas activas
            </div>
          ) : (
            visitasActivas.map((v) => (
              <div key={v.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{v.nombre_visita}</p>
                    <p className="text-sm text-gray-500">{v.motivo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`badge ${v.estado === 'pendiente' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'} capitalize`}>
                    {v.estado}
                  </span>
                  {v.placa && <p className="text-xs text-gray-400 mt-1 font-mono">{v.placa}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mis Vehículos */}
      <div className="bg-white rounded-2xl premium-shadow">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Mis Vehículos</h2>
          <button
            onClick={() => router.push('/vecino/vehiculos')}
            className="text-sm text-brand-600 font-semibold hover:text-brand-700"
          >
            Ver todos
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {vehiculos.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No tienes vehículos registrados
            </div>
          ) : (
            vehiculos.map((v) => (
              <div key={v.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Car className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-mono font-bold text-gray-900">{v.placa}</p>
                  <p className="text-sm text-gray-500">
                    {[v.marca, v.modelo, v.color].filter(Boolean).join(' ')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
