'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { DataTable } from '@/components/data-table'
import { Modal } from '@/components/modal'
import { StatCard } from '@/components/stat-card'
import { formatDate } from '@/lib/utils'
import {
  ArrowLeft, Settings, Users, Ban, Trash2, Power,
  Building2, ShieldCheck, AlertTriangle, Car, Loader2, Save,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Condominio, Usuario } from '@/lib/types'
import { deleteCondominio as deleteCondominioDoc, getCondominioById, listUsuariosByCondominio, updateCondominio, updateUsuario } from '@/lib/firebase/repo'

export default function CondominioDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [condominio, setCondominio] = useState<Condominio | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [configOpen, setConfigOpen] = useState(false)
  const [editUser, setEditUser] = useState<Usuario | null>(null)
  const [config, setConfig] = useState({
    config_lpr: false,
    config_qr: true,
    config_tag: false,
    config_manual: true,
    recordatorio_pago: false,
    dias_recordatorio: 30,
    mensaje_recordatorio: '',
    fecha_vencimiento: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    const [cond, users] = await Promise.all([
      getCondominioById(String(id)),
      listUsuariosByCondominio(String(id)),
    ])

    if (cond) {
      setCondominio(cond)
      setConfig({
        config_lpr: cond.config_lpr,
        config_qr: cond.config_qr,
        config_tag: cond.config_tag,
        config_manual: cond.config_manual,
        recordatorio_pago: cond.recordatorio_pago,
        dias_recordatorio: cond.dias_recordatorio || 30,
        mensaje_recordatorio: cond.mensaje_recordatorio || '',
        fecha_vencimiento: cond.fecha_vencimiento?.split('T')[0] || '',
      })
    }
    setUsuarios(users || [])
    setLoading(false)
  }

  async function saveConfig() {
    setSaving(true)
    try {
      await updateCondominio(String(id), {
        ...config,
        dias_recordatorio: config.recordatorio_pago ? config.dias_recordatorio : null,
        mensaje_recordatorio: config.recordatorio_pago ? config.mensaje_recordatorio : null,
        fecha_vencimiento: config.fecha_vencimiento || null,
      })
      toast.success('Configuración guardada')
      setConfigOpen(false)
      loadData()
    } catch {
      toast.error('Error al guardar configuración')
    } 
    setSaving(false)
  }

  async function toggleActive() {
    if (!condominio) return
    const newState = !condominio.activo
    try {
      await updateCondominio(String(id), { activo: newState } as any)
      toast.success(newState ? 'Condominio activado' : 'Condominio desactivado')
      loadData()
    } catch {
      toast.error('Error al actualizar estado')
    }
  }

  async function deleteCondominio() {
    if (!confirm('¿Estás seguro? Esta acción eliminará el condominio y TODOS sus datos permanentemente.')) return
    try {
      await deleteCondominioDoc(String(id))
      toast.success('Condominio eliminado')
      router.push('/master/condominios')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  async function updateUser(usuario: Usuario) {
    try {
      await updateUsuario(usuario.id, {
        nombre: usuario.nombre,
        telefono: usuario.telefono,
        email: usuario.email,
        lote_casa: usuario.lote_casa,
        rol: usuario.rol,
      })
      toast.success('Usuario actualizado')
      setEditUser(null)
      loadData()
    } catch {
      toast.error('Error al actualizar usuario')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!condominio) {
    return <div className="text-center text-gray-500 py-12">Condominio no encontrado</div>
  }

  const userColumns = [
    {
      key: 'nombre',
      label: 'Usuario',
      render: (u: Usuario) => (
        <div>
          <p className="font-semibold text-gray-900">{u.nombre}</p>
          <p className="text-xs text-gray-400 font-mono">{u.codigo}</p>
        </div>
      ),
    },
    {
      key: 'rol',
      label: 'Rol',
      render: (u: Usuario) => (
        <span className="badge bg-brand-50 text-brand-700 capitalize">{u.rol}</span>
      ),
    },
    {
      key: 'lote_casa',
      label: 'Casa/Lote',
      render: (u: Usuario) => <span className="text-gray-600">{u.lote_casa || '—'}</span>,
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      render: (u: Usuario) => <span className="text-gray-600">{u.telefono}</span>,
    },
    {
      key: 'moroso',
      label: 'Estado',
      render: (u: Usuario) => (
        <span className={`badge ${u.moroso ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>
          {u.moroso ? 'Moroso' : 'Al día'}
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={condominio.nombre}
        description={condominio.direccion}
        actions={
          <div className="flex gap-2">
            <button onClick={() => router.back()} className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
            <button onClick={() => setConfigOpen(true)} className="btn-secondary flex items-center gap-2">
              <Settings className="w-4 h-4" /> Configuración
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Usuarios"
          value={usuarios.length}
          icon={<Users className="w-6 h-6" />}
          iconBg="bg-brand-50 text-brand-600"
        />
        <StatCard
          title="Estado"
          value={condominio.activo ? 'Activo' : 'Inactivo'}
          icon={condominio.activo ? <ShieldCheck className="w-6 h-6" /> : <Ban className="w-6 h-6" />}
          iconBg={condominio.activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}
        />
        <StatCard
          title="Creado"
          value={formatDate(condominio.fecha_creacion)}
          icon={<Building2 className="w-6 h-6" />}
          iconBg="bg-purple-50 text-purple-600"
        />
      </div>

      {condominio.observaciones && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Observaciones</p>
            <p className="text-amber-700 text-sm mt-1">{condominio.observaciones}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mb-8">
        <button onClick={toggleActive} className={`btn-secondary flex items-center gap-2 ${!condominio.activo ? 'border-green-300 text-green-700' : 'border-orange-300 text-orange-700'}`}>
          <Power className="w-4 h-4" />
          {condominio.activo ? 'Desactivar' : 'Activar'}
        </button>
        <button onClick={deleteCondominio} className="btn-danger flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Eliminar
        </button>
      </div>

      {/* Users Table */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Usuarios del Condominio</h2>
      </div>
      <DataTable
        columns={userColumns}
        data={usuarios}
        onRowClick={(u) => setEditUser(u)}
        emptyMessage="No hay usuarios registrados"
      />

      {/* Config Modal */}
      <Modal open={configOpen} onClose={() => setConfigOpen(false)} title="Configuración del Condominio" size="lg">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Métodos de Acceso</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'config_lpr', label: 'Cámara LPR' },
                { key: 'config_qr', label: 'Código QR' },
                { key: 'config_tag', label: 'Tag / RFID' },
                { key: 'config_manual', label: 'Manual' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={(config as any)[key]}
                    onChange={(e) => setConfig((prev) => ({ ...prev, [key]: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={config.recordatorio_pago}
                onChange={(e) => setConfig((prev) => ({ ...prev, recordatorio_pago: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="font-semibold text-gray-900">Recordatorio de Pago</span>
            </label>

            {config.recordatorio_pago && (
              <div className="space-y-4 pl-8 animate-fade-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={config.fecha_vencimiento}
                    onChange={(e) => setConfig((prev) => ({ ...prev, fecha_vencimiento: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Días antes para mostrar aviso
                  </label>
                  <input
                    type="number"
                    value={config.dias_recordatorio}
                    onChange={(e) => setConfig((prev) => ({ ...prev, dias_recordatorio: parseInt(e.target.value) || 0 }))}
                    className="input-field"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Mensaje del Recordatorio
                  </label>
                  <textarea
                    value={config.mensaje_recordatorio}
                    onChange={(e) => setConfig((prev) => ({ ...prev, mensaje_recordatorio: e.target.value }))}
                    placeholder="Ej: Su plan está por vencer..."
                    className="input-field min-h-[80px] resize-none"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={() => setConfigOpen(false)} className="btn-secondary">Cancelar</button>
            <button onClick={saveConfig} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      {editUser && (
        <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Editar Usuario">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Código</label>
              <input type="text" value={editUser.codigo} disabled className="input-field bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre</label>
              <input
                type="text"
                value={editUser.nombre}
                onChange={(e) => setEditUser({ ...editUser, nombre: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rol</label>
              <select
                value={editUser.rol}
                onChange={(e) => setEditUser({ ...editUser, rol: e.target.value as any })}
                className="input-field"
              >
                <option value="administrador">Administrador</option>
                <option value="coadministrador">Co-Administrador</option>
                <option value="vecino">Vecino</option>
                <option value="policia">Policía</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono</label>
              <input
                type="tel"
                value={editUser.telefono}
                onChange={(e) => setEditUser({ ...editUser, telefono: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={editUser.email || ''}
                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Casa / Lote</label>
              <input
                type="text"
                value={editUser.lote_casa || ''}
                onChange={(e) => setEditUser({ ...editUser, lote_casa: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => setEditUser(null)} className="btn-secondary">Cancelar</button>
              <button onClick={() => updateUser(editUser)} className="btn-primary">Guardar Cambios</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
