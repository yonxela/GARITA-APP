'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { PageHeader } from '@/components/page-header'
import { DataTable } from '@/components/data-table'
import { formatDate } from '@/lib/utils'
import { Plus, Search, RotateCcw, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { Visita } from '@/lib/types'
import { createVisita, listVisitasByVecino } from '@/lib/firebase/repo'

export default function VecinoVisitasPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const router = useRouter()
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadVisitas()
  }, [])

  async function loadVisitas() {
    const data = await listVisitasByVecino(usuario!.id)
    setVisitas(data)
    setLoading(false)
  }

  async function reuseVisita(visita: Visita) {
    try {
      await createVisita({
        vecino_id: usuario!.id,
        condominio_id: usuario!.condominio_id!,
        nombre_visita: visita.nombre_visita,
        motivo: visita.motivo,
        placa: visita.placa,
        visita_larga: false,
        fecha_fin: null,
      } as any)
      toast.success(`Visita de ${visita.nombre_visita} registrada nuevamente`)
      loadVisitas()
    } catch {
      toast.error('Error al re-registrar visita')
    }
  }

  const filtered = visitas.filter((v) =>
    v.nombre_visita.toLowerCase().includes(search.toLowerCase()) ||
    (v.placa || '').toLowerCase().includes(search.toLowerCase())
  )

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
          {v.visita_larga ? `Larga (hasta ${v.fecha_fin ? formatDate(v.fecha_fin) : '?'})` : '1 día'}
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
        <span className={`badge ${estadoColors[v.estado]} capitalize`}>
          {v.estado}
        </span>
      ),
    },
    {
      key: 'acciones',
      label: '',
      render: (v: Visita) => (
        <button
          onClick={(e) => { e.stopPropagation(); reuseVisita(v); }}
          className="w-8 h-8 rounded-lg hover:bg-brand-50 flex items-center justify-center transition-colors group"
          title="Volver a registrar"
        >
          <RotateCcw className="w-4 h-4 text-gray-400 group-hover:text-brand-600" />
        </button>
      ),
      className: 'w-12',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Mis Visitas"
        description="Historial y registro de visitas"
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

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar visita o placa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-11"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage="No has registrado visitas"
      />
    </div>
  )
}
