'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { PageHeader } from '@/components/page-header'
import { DataTable } from '@/components/data-table'
import { formatDate } from '@/lib/utils'
import { Search, ClipboardList, Clock, CheckCircle2, XCircle } from 'lucide-react'
import type { Visita } from '@/lib/types'
import { listVisitasHoyByCondominio } from '@/lib/firebase/repo'

export default function AdminVisitasPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  useEffect(() => {
    loadVisitas()
  }, [])

  async function loadVisitas() {
    // Traemos un rango grande (últimos 90 días) para el histórico simple
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const data = await listVisitasHoyByCondominio(usuario!.condominio_id!, since)
    setVisitas(data as any)
    setLoading(false)
  }

  const filtered = visitas.filter((v) => {
    const matchSearch = v.nombre_visita.toLowerCase().includes(search.toLowerCase()) ||
      (v.placa || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.vecino?.nombre || '').toLowerCase().includes(search.toLowerCase())
    const matchEstado = filtroEstado === 'todos' || v.estado === filtroEstado
    return matchSearch && matchEstado
  })

  const estadoIcons: Record<string, React.ReactNode> = {
    pendiente: <Clock className="w-3.5 h-3.5" />,
    ingresada: <CheckCircle2 className="w-3.5 h-3.5" />,
    finalizada: <CheckCircle2 className="w-3.5 h-3.5" />,
    expirada: <XCircle className="w-3.5 h-3.5" />,
  }

  const estadoColors: Record<string, string> = {
    pendiente: 'bg-amber-50 text-amber-700',
    ingresada: 'bg-blue-50 text-blue-700',
    finalizada: 'bg-green-50 text-green-700',
    expirada: 'bg-gray-100 text-gray-500',
  }

  const columns = [
    {
      key: 'nombre_visita',
      label: 'Visita',
      render: (v: Visita) => (
        <div>
          <p className="font-semibold text-gray-900">{v.nombre_visita}</p>
          <p className="text-xs text-gray-400">{v.motivo}</p>
        </div>
      ),
    },
    {
      key: 'vecino',
      label: 'Residente',
      render: (v: Visita) => (
        <div>
          <p className="text-gray-700">{v.vecino?.nombre}</p>
          <p className="text-xs text-gray-400">{v.vecino?.lote_casa}</p>
        </div>
      ),
    },
    {
      key: 'placa',
      label: 'Placa',
      render: (v: Visita) => (
        <span className="font-mono text-gray-600">{v.placa || '—'}</span>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (v: Visita) => (
        <span className={`badge ${v.visita_larga ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
          {v.visita_larga ? 'Larga' : '1 día'}
        </span>
      ),
    },
    {
      key: 'fecha',
      label: 'Fecha',
      render: (v: Visita) => (
        <span className="text-gray-500 text-sm">{formatDate(v.fecha_creacion)}</span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (v: Visita) => (
        <span className={`badge ${estadoColors[v.estado]} flex items-center gap-1 w-fit`}>
          {estadoIcons[v.estado]}
          <span className="capitalize">{v.estado}</span>
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Visitas"
        description="Historial de visitas registradas en el condominio"
      />

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar visita, residente o placa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-11"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="input-field w-48"
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="ingresada">Ingresada</option>
          <option value="finalizada">Finalizada</option>
          <option value="expirada">Expirada</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage="No hay visitas registradas"
      />
    </div>
  )
}
