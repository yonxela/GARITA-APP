'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { getDaysUntil, formatDate } from '@/lib/utils'
import { Users, Car, ClipboardList, Activity, AlertTriangle, Bell } from 'lucide-react'
import type { Condominio, Mensaje } from '@/lib/types'
import { getCondominioById, listMensajesPara, listRegistrosHoy, listUsuariosByCondominio, listVehiculosByCondominio, listVisitasHoyByCondominio } from '@/lib/firebase/repo'

export default function AdminDashboard() {
  const usuario = useAuthStore((s) => s.usuario)
  const [stats, setStats] = useState({ usuarios: 0, vehiculos: 0, visitas_hoy: 0, accesos_hoy: 0 })
  const [condominio, setCondominio] = useState<Condominio | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (usuario?.condominio_id) loadData()
  }, [usuario])

  async function loadData() {
    const condId = usuario!.condominio_id!

    const today = new Date().toISOString().split('T')[0]
    const [cond, users, vehiculos, registros, msgs, visitas] = await Promise.all([
      getCondominioById(condId),
      listUsuariosByCondominio(condId),
      listVehiculosByCondominio(condId),
      listRegistrosHoy(condId, today),
      listMensajesPara(condId, ['administrador', 'coadministrador']),
      listVisitasHoyByCondominio(condId, today),
    ])

    setCondominio(cond)
    setStats({
      usuarios: (users || []).filter((u) => u.rol !== 'master').length,
      vehiculos: vehiculos.length,
      visitas_hoy: visitas.filter((v) => v.estado === 'pendiente').length,
      accesos_hoy: registros.length,
    })
    setMensajes((msgs || []).slice(0, 5))
    setLoading(false)
  }

  const daysUntilExpiry = condominio?.fecha_vencimiento ? getDaysUntil(condominio.fecha_vencimiento) : null
  const showWarning = condominio?.recordatorio_pago && daysUntilExpiry !== null && daysUntilExpiry <= (condominio.dias_recordatorio || 30)

  return (
    <div>
      <PageHeader
        title={`Dashboard — ${condominio?.nombre || ''}`}
        description={`Bienvenido, ${usuario?.nombre}`}
      />

      {showWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Aviso de Vencimiento</p>
            <p className="text-amber-700 text-sm mt-1">
              {condominio?.mensaje_recordatorio || `Faltan ${daysUntilExpiry} días para que se venza el sistema.`}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Usuarios"
          value={stats.usuarios}
          icon={<Users className="w-6 h-6" />}
          iconBg="bg-brand-50 text-brand-600"
        />
        <StatCard
          title="Vehículos"
          value={stats.vehiculos}
          icon={<Car className="w-6 h-6" />}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Visitas Pendientes"
          value={stats.visitas_hoy}
          icon={<ClipboardList className="w-6 h-6" />}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Accesos Hoy"
          value={stats.accesos_hoy}
          icon={<Activity className="w-6 h-6" />}
          iconBg="bg-green-50 text-green-600"
        />
      </div>

      {/* Recent Messages */}
      {mensajes.length > 0 && (
        <div className="bg-white rounded-2xl premium-shadow">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-gray-900">Mensajes Recientes</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {mensajes.map((msg) => (
              <div key={msg.id} className="px-6 py-4">
                <p className="font-semibold text-gray-900 text-sm">{msg.titulo}</p>
                <p className="text-gray-500 text-sm mt-1 line-clamp-2">{msg.contenido}</p>
                <p className="text-xs text-gray-400 mt-2">{formatDate(msg.fecha_creacion, true)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
