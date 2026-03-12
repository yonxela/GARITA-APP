'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { PageHeader } from '@/components/page-header'
import { DataTable } from '@/components/data-table'
import { formatDate, getStatusLabel } from '@/lib/utils'
import { Search, Radio } from 'lucide-react'
import type { RegistroAcceso, EstadoAcceso, TipoAcceso } from '@/lib/types'
import { listRegistrosHoy } from '@/lib/firebase/repo'

export default function AdminRegistrosPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const [registros, setRegistros] = useState<RegistroAcceso[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadRegistros()
  }, [])

  async function loadRegistros() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const data = await listRegistrosHoy(usuario!.condominio_id!, since)
    setRegistros(data)
    setLoading(false)
  }

  const resultadoColors: Record<EstadoAcceso, string> = {
    verificado: 'bg-green-50 text-green-700',
    moroso: 'bg-orange-50 text-orange-700',
    no_registrado: 'bg-red-50 text-red-600',
    visita: 'bg-blue-50 text-blue-700',
  }

  const accesoLabels: Record<TipoAcceso, string> = {
    lpr: 'Cámara LPR',
    qr: 'Código QR',
    tag: 'Tag/RFID',
    manual: 'Manual',
  }

  const columns = [
    {
      key: 'fecha_hora',
      label: 'Fecha/Hora',
      render: (r: RegistroAcceso) => (
        <span className="text-gray-600 text-sm">{formatDate(r.fecha_hora, true)}</span>
      ),
    },
    {
      key: 'tipo_acceso',
      label: 'Método',
      render: (r: RegistroAcceso) => (
        <span className="badge bg-gray-100 text-gray-700">{accesoLabels[r.tipo_acceso]}</span>
      ),
    },
    {
      key: 'placa',
      label: 'Placa',
      render: (r: RegistroAcceso) => (
        <span className="font-mono font-semibold text-gray-800">{r.placa || '—'}</span>
      ),
    },
    {
      key: 'persona',
      label: 'Persona',
      render: (r: RegistroAcceso) => (
        <span className="text-gray-700">
          {r.usuario?.nombre || r.visita?.nombre_visita || '—'}
        </span>
      ),
    },
    {
      key: 'tipo_resultado',
      label: 'Resultado',
      render: (r: RegistroAcceso) => (
        <span className={`badge ${resultadoColors[r.tipo_resultado]}`}>
          {getStatusLabel(r.tipo_resultado)}
        </span>
      ),
    },
  ]

  const filtered = registros.filter((r) =>
    (r.placa || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.usuario?.nombre || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title="Registros de Acceso"
        description="Historial completo de entradas al condominio"
      />

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por placa o nombre..."
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
        emptyMessage="No hay registros de acceso"
      />
    </div>
  )
}
