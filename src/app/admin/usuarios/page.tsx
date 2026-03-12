'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { PageHeader } from '@/components/page-header'
import { DataTable } from '@/components/data-table'
import { Modal } from '@/components/modal'
import { generateUserCode } from '@/lib/utils'
import { Plus, Search, UserPlus, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Usuario, Rol } from '@/lib/types'
import { createUsuario, listUsuariosByCondominio, updateUsuario } from '@/lib/firebase/repo'

export default function AdminUsuariosPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [newOpen, setNewOpen] = useState(false)
  const [editUser, setEditUser] = useState<Usuario | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    rol: 'vecino' as Rol,
    lote_casa: '',
    telefono: '',
    email: '',
  })

  useEffect(() => {
    loadUsuarios()
  }, [])

  async function loadUsuarios() {
    const data = await listUsuariosByCondominio(usuario!.condominio_id!)
    setUsuarios(data.filter((u) => u.rol !== 'master'))
    setLoading(false)
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.telefono) {
      toast.error('Nombre y teléfono son obligatorios')
      return
    }
    if (form.rol === 'vecino' && !form.lote_casa) {
      toast.error('El lote/casa es obligatorio para vecinos')
      return
    }

    setSaving(true)
    const condominio = usuario!.condominio
    const condName = condominio?.nombre || 'X'
    const codigo = generateUserCode(condName, form.nombre)

    try {
      await createUsuario({
        codigo,
        nombre: form.nombre,
        rol: form.rol,
        lote_casa: form.lote_casa || null,
        telefono: form.telefono,
        email: form.email || null,
        condominio_id: usuario!.condominio_id!,
        moroso: false,
        activo: true,
      })
      toast.success(`Usuario creado. Código: ${codigo}`, { duration: 8000 })
      setNewOpen(false)
      setForm({ nombre: '', rol: 'vecino', lote_casa: '', telefono: '', email: '' })
      loadUsuarios()
    } catch {
      toast.error('Error al crear usuario')
    }
    setSaving(false)
  }

  async function toggleMoroso(u: Usuario) {
    try {
      await updateUsuario(u.id, { moroso: !u.moroso })
      toast.success(u.moroso ? 'Vecino marcado al día' : 'Vecino marcado como moroso')
      loadUsuarios()
    } catch {
      toast.error('Error al actualizar')
    }
  }

  async function updateUser() {
    if (!editUser) return
    setSaving(true)
    try {
      await updateUsuario(editUser.id, {
        nombre: editUser.nombre,
        telefono: editUser.telefono,
        email: editUser.email,
        lote_casa: editUser.lote_casa,
        rol: editUser.rol,
      })
      toast.success('Usuario actualizado')
      setEditUser(null)
      loadUsuarios()
    } catch {
      toast.error('Error al actualizar')
    }
    setSaving(false)
  }

  const filtered = usuarios.filter((u) =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.codigo.toLowerCase().includes(search.toLowerCase()) ||
    (u.lote_casa || '').toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
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
      render: (u: Usuario) => {
        const colors: Record<string, string> = {
          administrador: 'bg-purple-50 text-purple-700',
          coadministrador: 'bg-indigo-50 text-indigo-700',
          vecino: 'bg-blue-50 text-blue-700',
          policia: 'bg-green-50 text-green-700',
        }
        return <span className={`badge ${colors[u.rol] || 'bg-gray-100 text-gray-600'} capitalize`}>{u.rol}</span>
      },
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
        <div className="flex items-center gap-2">
          <span className={`badge ${u.moroso ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>
            {u.moroso ? 'Moroso' : 'Al día'}
          </span>
          {u.rol === 'vecino' && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleMoroso(u); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              {u.moroso ? 'Quitar' : 'Marcar'}
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Gestión de vecinos, policías y co-administradores"
        actions={
          <button onClick={() => setNewOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        }
      />

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o lote..."
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
        onRowClick={(u) => setEditUser(u)}
        emptyMessage="No hay usuarios registrados"
      />

      {/* New User Modal */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Nuevo Usuario" description="Se generará un código de acceso automáticamente">
        <form onSubmit={createUser} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre Completo *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
              placeholder="Nombre del usuario"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rol *</label>
            <select
              value={form.rol}
              onChange={(e) => setForm((prev) => ({ ...prev, rol: e.target.value as Rol }))}
              className="input-field"
            >
              <option value="vecino">Vecino</option>
              <option value="policia">Policía</option>
              <option value="coadministrador">Co-Administrador</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Casa / Lote {form.rol === 'vecino' ? '*' : '(Opcional)'}
            </label>
            <input
              type="text"
              value={form.lote_casa}
              onChange={(e) => setForm((prev) => ({ ...prev, lote_casa: e.target.value }))}
              placeholder="Ej: Casa 15"
              className="input-field"
              required={form.rol === 'vecino'}
            />
            {form.rol === 'policia' && (
              <p className="text-xs text-gray-400 mt-1">No requerido para policías</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono *</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
              placeholder="Ej: +502 5555-0000"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email (Opcional)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="correo@ejemplo.com"
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setNewOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Crear Usuario
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      {editUser && (
        <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Editar Usuario">
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">Código de acceso</p>
              <p className="font-mono font-bold text-lg text-brand-600">{editUser.codigo}</p>
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
                onChange={(e) => setEditUser({ ...editUser, rol: e.target.value as Rol })}
                className="input-field"
              >
                <option value="vecino">Vecino</option>
                <option value="policia">Policía</option>
                <option value="coadministrador">Co-Administrador</option>
                <option value="administrador">Administrador</option>
              </select>
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

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => setEditUser(null)} className="btn-secondary">Cancelar</button>
              <button onClick={updateUser} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar Cambios
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
