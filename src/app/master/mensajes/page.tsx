'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { PageHeader } from '@/components/page-header'
import { Modal } from '@/components/modal'
import { formatDate } from '@/lib/utils'
import { Send, Plus, MessageSquare, Filter, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Condominio, Mensaje, Rol } from '@/lib/types'
import { countMensajesLeidos, createMensaje, listCondominios, listMensajesPara } from '@/lib/firebase/repo'

export default function MensajesPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [condominios, setCondominios] = useState<Condominio[]>([])
  const [loading, setLoading] = useState(true)
  const [newOpen, setNewOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    contenido: '',
    filtro_condominio: '',
    filtro_rol: '',
  })
  const [readCounts, setReadCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [msgs, conds] = await Promise.all([
      listMensajesPara(null, ['administrador', 'coadministrador', 'vecino', 'policia', 'master']),
      listCondominios(),
    ])

    setMensajes(msgs)
    setCondominios(conds.filter((c) => c.activo))

    if (msgs.length > 0) {
      const counts = await countMensajesLeidos(msgs.map((m) => m.id))
      setReadCounts(counts)
    }

    setLoading(false)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo || !form.contenido) {
      toast.error('Título y contenido son obligatorios')
      return
    }

    setSending(true)
    try {
      await createMensaje({
        remitente_id: usuario!.id,
        titulo: form.titulo,
        contenido: form.contenido,
        filtro_condominio: form.filtro_condominio || null,
        filtro_rol: (form.filtro_rol || null) as any,
      } as any)
      toast.success('Mensaje enviado')
      setNewOpen(false)
      setForm({ titulo: '', contenido: '', filtro_condominio: '', filtro_rol: '' })
      loadData()
    } catch {
      toast.error('Error al enviar mensaje')
    }
    setSending(false)
  }

  return (
    <div>
      <PageHeader
        title="Mensajes"
        description="Envía comunicados a los usuarios del sistema"
        actions={
          <button onClick={() => setNewOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Mensaje
          </button>
        }
      />

      {/* Messages List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl premium-shadow p-12 text-center">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : mensajes.length === 0 ? (
          <div className="bg-white rounded-2xl premium-shadow p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No hay mensajes enviados</p>
          </div>
        ) : (
          mensajes.map((msg) => (
            <div key={msg.id} className="bg-white rounded-2xl premium-shadow p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{msg.titulo}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(msg.fecha_creacion, true)}
                    {msg.filtro_rol && (
                      <span className="ml-2 badge bg-brand-50 text-brand-700 capitalize">{msg.filtro_rol}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">{readCounts[msg.id] || 0} leídos</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{msg.contenido}</p>
            </div>
          ))
        )}
      </div>

      {/* New Message Modal */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Nuevo Mensaje" description="Envía un comunicado a los usuarios">
        <form onSubmit={sendMessage} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Título *</label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
              placeholder="Asunto del mensaje"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contenido *</label>
            <textarea
              value={form.contenido}
              onChange={(e) => setForm((prev) => ({ ...prev, contenido: e.target.value }))}
              placeholder="Escribe tu mensaje..."
              className="input-field min-h-[120px] resize-none"
              rows={5}
              required
            />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Filtros (Opcional)</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Condominio</label>
              <select
                value={form.filtro_condominio}
                onChange={(e) => setForm((prev) => ({ ...prev, filtro_condominio: e.target.value }))}
                className="input-field"
              >
                <option value="">Todos</option>
                {condominios.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Rol</label>
              <select
                value={form.filtro_rol}
                onChange={(e) => setForm((prev) => ({ ...prev, filtro_rol: e.target.value }))}
                className="input-field"
              >
                <option value="">Todos</option>
                <option value="administrador">Administrador</option>
                <option value="coadministrador">Co-Administrador</option>
                <option value="vecino">Vecino</option>
                <option value="policia">Policía</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setNewOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={sending} className="btn-primary flex items-center gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar Mensaje
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
