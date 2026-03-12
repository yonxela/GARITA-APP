'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { DataTable } from '@/components/data-table'
import { formatDate } from '@/lib/utils'
import { Plus, Building2, Search } from 'lucide-react'
import type { Condominio } from '@/lib/types'
import { listCondominios } from '@/lib/firebase/repo'

export default function CondominiosPage() {
  const router = useRouter()
  const [condominios, setCondominios] = useState<Condominio[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadCondominios()
  }, [])

  async function loadCondominios() {
    const data = await listCondominios()
    setCondominios(data)
    setLoading(false)
  }

  const filtered = condominios.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.direccion.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      key: 'nombre',
      label: 'Condominio',
      render: (c: Condominio) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{c.nombre}</p>
            <p className="text-xs text-gray-400">{c.direccion}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'fecha_creacion',
      label: 'Fecha Creación',
      render: (c: Condominio) => (
        <span className="text-gray-600">{formatDate(c.fecha_creacion)}</span>
      ),
    },
    {
      key: 'activo',
      label: 'Estado',
      render: (c: Condominio) => (
        <span className={`badge ${c.activo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {c.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'config',
      label: 'Accesos',
      render: (c: Condominio) => (
        <div className="flex gap-1.5">
          {c.config_lpr && <span className="badge bg-purple-50 text-purple-700">LPR</span>}
          {c.config_qr && <span className="badge bg-blue-50 text-blue-700">QR</span>}
          {c.config_tag && <span className="badge bg-amber-50 text-amber-700">TAG</span>}
          {c.config_manual && <span className="badge bg-gray-100 text-gray-600">Manual</span>}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Condominios"
        description="Gestión de todos los condominios en el sistema"
        actions={
          <button
            onClick={() => router.push('/master/condominios/nuevo')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Condominio
          </button>
        }
      />

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar condominio..."
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
        onRowClick={(c) => router.push(`/master/condominios/${c.id}`)}
        emptyMessage="No hay condominios registrados"
      />
    </div>
  )
}
