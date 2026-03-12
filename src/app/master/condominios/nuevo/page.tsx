'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateUserCode } from '@/lib/utils'
import { PageHeader } from '@/components/page-header'
import { ArrowLeft, Building2, UserPlus, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createCondominio, createUsuario } from '@/lib/firebase/repo'

export default function NuevoCondominioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    direccion: '',
    observaciones: '',
    admin_nombre: '',
    admin_telefono: '',
    admin_email: '',
    admin_lote: '',
  })

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.direccion || !form.admin_nombre || !form.admin_telefono) {
      toast.error('Completa todos los campos obligatorios')
      return
    }

    setLoading(true)
    try {
      const condominioId = await createCondominio({
        nombre: form.nombre,
        direccion: form.direccion,
        observaciones: form.observaciones || null,
      })

      const codigo = generateUserCode(form.nombre, form.admin_nombre)

      await createUsuario({
        codigo,
        nombre: form.admin_nombre,
        telefono: form.admin_telefono,
        email: form.admin_email || null,
        lote_casa: form.admin_lote || null,
        rol: 'administrador',
        condominio_id: condominioId,
        moroso: false,
        activo: true,
      })

      toast.success(
        `Condominio creado exitosamente. Código del admin: ${codigo}`,
        { duration: 8000 }
      )
      router.push('/master/condominios')
    } catch (err: any) {
      toast.error(err.message || 'Error al crear el condominio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Nuevo Condominio"
        description="Registrar un nuevo condominio y su administrador"
        actions={
          <button onClick={() => router.back()} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl">
        {/* Datos del Condominio */}
        <div className="bg-white rounded-2xl premium-shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Datos del Condominio</h2>
              <p className="text-sm text-gray-500">Información general del residencial</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nombre del Condominio *
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => updateField('nombre', e.target.value)}
                placeholder="Ej: Residencial Los Pinos"
                className="input-field"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Dirección *
              </label>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => updateField('direccion', e.target.value)}
                placeholder="Dirección completa"
                className="input-field"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Observaciones
              </label>
              <textarea
                value={form.observaciones}
                onChange={(e) => updateField('observaciones', e.target.value)}
                placeholder="Notas adicionales..."
                className="input-field min-h-[80px] resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Datos del Administrador */}
        <div className="bg-white rounded-2xl premium-shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Administrador del Condominio</h2>
              <p className="text-sm text-gray-500">Se generará un código de acceso automáticamente</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={form.admin_nombre}
                onChange={(e) => updateField('admin_nombre', e.target.value)}
                placeholder="Nombre del administrador"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Teléfono *
              </label>
              <input
                type="tel"
                value={form.admin_telefono}
                onChange={(e) => updateField('admin_telefono', e.target.value)}
                placeholder="Ej: +502 5555-0000"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={form.admin_email}
                onChange={(e) => updateField('admin_email', e.target.value)}
                placeholder="correo@ejemplo.com"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Casa / Lote (Opcional)
              </label>
              <input
                type="text"
                value={form.admin_lote}
                onChange={(e) => updateField('admin_lote', e.target.value)}
                placeholder="Ej: Casa 15"
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Crear Condominio
          </button>
        </div>
      </form>
    </div>
  )
}
