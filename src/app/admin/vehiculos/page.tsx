'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { PageHeader } from '@/components/page-header'
import { DataTable } from '@/components/data-table'
import { Modal } from '@/components/modal'
import { Plus, Search, Car, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Vehiculo, Usuario } from '@/lib/types'
import { createVehiculo, listUsuariosByCondominio, listVehiculosByCondominio } from '@/lib/firebase/repo'

export default function AdminVehiculosPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const [vehiculos, setVehiculos] = useState<(Vehiculo & { usuario?: Usuario })[]>([])
  const [vecinos, setVecinos] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [newOpen, setNewOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    usuario_id: '',
    placa: '',
    marca: '',
    modelo: '',
    color: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const condId = usuario!.condominio_id!
    const [vehiculos, usuarios] = await Promise.all([
      listVehiculosByCondominio(condId),
      listUsuariosByCondominio(condId),
    ])
    setVehiculos(vehiculos)
    setVecinos(usuarios.filter((u) => ['vecino', 'administrador', 'coadministrador'].includes(u.rol)).sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setLoading(false)
  }

  async function createVehiculo(e: React.FormEvent) {
    e.preventDefault()
    if (!form.usuario_id || !form.placa) {
      toast.error('Propietario y placa son obligatorios')
      return
    }

    setSaving(true)
    try {
      await createVehiculo({
        usuario_id: form.usuario_id,
        placa: form.placa.toUpperCase(),
        marca: form.marca || null,
        modelo: form.modelo || null,
        color: form.color || null,
        activo: true,
      } as any)
      toast.success('Vehículo registrado')
      setNewOpen(false)
      setForm({ usuario_id: '', placa: '', marca: '', modelo: '', color: '' })
      loadData()
    } catch {
      toast.error('Error al registrar vehículo')
    }
    setSaving(false)
  }

  const filtered = vehiculos.filter((v) =>
    v.placa.toLowerCase().includes(search.toLowerCase()) ||
    (v.usuario?.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.marca || '').toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      key: 'placa',
      label: 'Placa',
      render: (v: Vehiculo & { usuario?: Usuario }) => (
        <span className="font-mono font-bold text-gray-900">{v.placa}</span>
      ),
    },
    {
      key: 'vehiculo',
      label: 'Vehículo',
      render: (v: Vehiculo) => (
        <span className="text-gray-600">
          {[v.marca, v.modelo, v.color].filter(Boolean).join(' ') || '—'}
        </span>
      ),
    },
    {
      key: 'propietario',
      label: 'Propietario',
      render: (v: Vehiculo & { usuario?: Usuario }) => (
        <div>
          <p className="font-medium text-gray-900">{v.usuario?.nombre}</p>
          <p className="text-xs text-gray-400">{v.usuario?.lote_casa}</p>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Vehículos"
        description="Gestión de vehículos del condominio"
        actions={
          <button onClick={() => setNewOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Vehículo
          </button>
        }
      />

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por placa, propietario..."
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
        emptyMessage="No hay vehículos registrados"
      />

      {/* New Vehicle Modal */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Registrar Vehículo">
        <form onSubmit={createVehiculo} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Propietario *</label>
            <select
              value={form.usuario_id}
              onChange={(e) => setForm((prev) => ({ ...prev, usuario_id: e.target.value }))}
              className="input-field"
              required
            >
              <option value="">Seleccionar usuario</option>
              {vecinos.map((v) => (
                <option key={v.id} value={v.id}>{v.nombre} — {v.lote_casa || v.codigo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Número de Placa *</label>
            <input
              type="text"
              value={form.placa}
              onChange={(e) => setForm((prev) => ({ ...prev, placa: e.target.value.toUpperCase() }))}
              placeholder="Ej: P-123ABC"
              className="input-field font-mono uppercase"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Marca</label>
              <input
                type="text"
                value={form.marca}
                onChange={(e) => setForm((prev) => ({ ...prev, marca: e.target.value }))}
                placeholder="Toyota"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Modelo</label>
              <input
                type="text"
                value={form.modelo}
                onChange={(e) => setForm((prev) => ({ ...prev, modelo: e.target.value }))}
                placeholder="Corolla"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                placeholder="Blanco"
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setNewOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Car className="w-4 h-4" />}
              Registrar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
