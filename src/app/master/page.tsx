'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { Building2, Users, ShieldCheck, Activity } from 'lucide-react'
import type { Condominio } from '@/lib/types'
import { listCondominios } from '@/lib/firebase/repo'
import { collection, getCountFromServer, getDocs, query, where } from 'firebase/firestore'
import { db, col } from '@/lib/firebase/client'

export default function MasterDashboard() {
  const usuario = useAuthStore((s) => s.usuario)
  const [stats, setStats] = useState({ condominios: 0, usuarios: 0, activos: 0, accesos_hoy: 0 })
  const [condominiosRecientes, setCondominiosRecientes] = useState<Condominio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const today = new Date().toISOString().split('T')[0]

      const condominiosAll = await listCondominios()
      const condominiosActivos = condominiosAll.filter((c) => c.activo)

      const usersSnap = await getDocs(query(collection(db, col('usuarios'))))
      const usuariosNoMaster = usersSnap.docs.filter((d) => (d.data() as any).rol !== 'master').length

      const accesosHoy = await getCountFromServer(
        query(collection(db, col('registros_acceso')), where('fecha_hora', '>=', today))
      )

      setStats({
        condominios: condominiosAll.length,
        usuarios: usuariosNoMaster,
        activos: condominiosActivos.length,
        accesos_hoy: accesosHoy.data().count || 0,
      })

      setCondominiosRecientes(condominiosAll.slice(0, 5))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={`Hola, ${usuario?.nombre || 'Master'}`}
        description="Panel de control general de GARITA.APP"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Condominios"
          value={stats.condominios}
          icon={<Building2 className="w-6 h-6" />}
          iconBg="bg-brand-50 text-brand-600"
        />
        <StatCard
          title="Condominios Activos"
          value={stats.activos}
          icon={<ShieldCheck className="w-6 h-6" />}
          iconBg="bg-green-50 text-green-600"
        />
        <StatCard
          title="Total Usuarios"
          value={stats.usuarios}
          icon={<Users className="w-6 h-6" />}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Accesos Hoy"
          value={stats.accesos_hoy}
          icon={<Activity className="w-6 h-6" />}
          iconBg="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Recent Condominios */}
      <div className="bg-white rounded-2xl premium-shadow">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Condominios Recientes</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : condominiosRecientes.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No hay condominios registrados
            </div>
          ) : (
            condominiosRecientes.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{c.nombre}</p>
                    <p className="text-sm text-gray-500">{c.direccion}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${c.activo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
