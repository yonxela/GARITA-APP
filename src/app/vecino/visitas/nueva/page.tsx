'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { PageHeader } from '@/components/page-header'
import { ArrowLeft, UserPlus, Loader2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { createVisita } from '@/lib/firebase/repo'

export default function NuevaVisitaPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nombre_visita: '',
    motivo: '',
    placa: '',
    visita_larga: false,
    fecha_fin: '',
  })

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre_visita || !form.motivo) {
      toast.error('Nombre y motivo son obligatorios')
      return
    }
    if (form.visita_larga && !form.fecha_fin) {
      toast.error('Indica la fecha de fin para la visita larga')
      return
    }

    setLoading(true)
    try {
      await createVisita({
        vecino_id: usuario!.id,
        condominio_id: usuario!.condominio_id!,
        nombre_visita: form.nombre_visita,
        motivo: form.motivo,
        placa: form.placa || null,
        visita_larga: form.visita_larga,
        fecha_fin: form.visita_larga ? new Date(form.fecha_fin).toISOString() : null,
      } as any)
      toast.success('Visita registrada exitosamente')
      router.push('/vecino/visitas')
    } catch {
      toast.error('Error al registrar la visita')
    }
    setLoading(false)
  }

  return (
    <div>
      <PageHeader
        title="Nueva Visita"
        description="Registra una visita para que sea autorizada en garita"
        actions={
          <button onClick={() => router.back()} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-2xl premium-shadow p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nombre de la Visita *
            </label>
            <input
              type="text"
              value={form.nombre_visita}
              onChange={(e) => updateField('nombre_visita', e.target.value)}
              placeholder="Nombre completo del visitante"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Motivo de la Visita *
            </label>
            <textarea
              value={form.motivo}
              onChange={(e) => updateField('motivo', e.target.value)}
              placeholder="Ej: Entrega de paquete, visita familiar..."
              className="input-field min-h-[80px] resize-none"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Número de Placa
            </label>
            <input
              type="text"
              value={form.placa}
              onChange={(e) => updateField('placa', e.target.value.toUpperCase())}
              placeholder="Ej: P-123ABC (Opcional)"
              className="input-field font-mono uppercase"
            />
          </div>

          {/* Visita Larga Toggle */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.visita_larga}
                onChange={(e) => updateField('visita_larga', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span className="font-semibold text-gray-900">Visita Larga</span>
                <p className="text-xs text-gray-500">Las visitas normales tienen vigencia de 1 día</p>
              </div>
            </label>

            {form.visita_larga && (
              <div className="mt-4 animate-fade-in">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Fecha de Fin de Autorización *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={form.fecha_fin}
                    onChange={(e) => updateField('fecha_fin', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field pl-11"
                    required={form.visita_larga}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Registrar Visita
          </button>
        </div>
      </form>
    </div>
  )
}
