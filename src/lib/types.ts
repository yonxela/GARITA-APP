export type Rol = 'master' | 'administrador' | 'coadministrador' | 'vecino' | 'policia'

export type TipoAcceso = 'lpr' | 'qr' | 'tag' | 'manual'

export type EstadoAcceso = 'verificado' | 'moroso' | 'no_registrado' | 'visita'

export type EstadoVisita = 'pendiente' | 'ingresada' | 'finalizada' | 'expirada'

export interface Condominio {
  id: string
  nombre: string
  direccion: string
  observaciones: string | null
  activo: boolean
  fecha_creacion: string
  config_lpr: boolean
  config_qr: boolean
  config_tag: boolean
  config_manual: boolean
  recordatorio_pago: boolean
  dias_recordatorio: number | null
  mensaje_recordatorio: string | null
  fecha_vencimiento: string | null
}

export interface Usuario {
  id: string
  codigo: string
  nombre: string
  email: string | null
  telefono: string
  rol: Rol
  condominio_id: string | null
  lote_casa: string | null
  moroso: boolean
  activo: boolean
  fecha_creacion: string
  condominio?: Condominio
}

export interface Vehiculo {
  id: string
  usuario_id: string
  placa: string
  marca: string | null
  modelo: string | null
  color: string | null
  activo: boolean
  usuario?: Usuario
}

export interface Visita {
  id: string
  vecino_id: string
  condominio_id: string
  nombre_visita: string
  motivo: string
  placa: string | null
  fecha_creacion: string
  visita_larga: boolean
  fecha_fin: string | null
  estado: EstadoVisita
  fecha_ingreso: string | null
  vecino?: Usuario | Pick<Usuario, 'nombre' | 'lote_casa'>
}

export interface RegistroAcceso {
  id: string
  condominio_id: string
  tipo_acceso: TipoAcceso
  tipo_resultado: EstadoAcceso
  vehiculo_id: string | null
  visita_id: string | null
  usuario_id: string | null
  placa: string | null
  fecha_hora: string
  vehiculo?: Vehiculo
  visita?: Visita
  usuario?: Usuario
}

export interface Mensaje {
  id: string
  remitente_id: string
  contenido: string
  titulo: string
  filtro_condominio: string | null
  filtro_rol: Rol | null
  fecha_creacion: string
  remitente?: Usuario
}

export interface MensajeLeido {
  id: string
  mensaje_id: string
  usuario_id: string
  fecha_lectura: string
}
