import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { db, col } from './client'
import type { Condominio, Mensaje, RegistroAcceso, Usuario, Vehiculo, Visita } from '@/lib/types'

type WithId<T> = T & { id: string }

function withId<T extends DocumentData>(id: string, data: T): WithId<any> {
  return { id, ...(data as any) }
}

export async function getUsuarioByCodigo(codigo: string): Promise<Usuario | null> {
  const q = query(collection(db, col('usuarios')), where('codigo', '==', codigo.toUpperCase()), limit(1))
  const snap = await getDocs(q)
  const docu = snap.docs[0]
  if (!docu) return null
  return withId(docu.id, docu.data()) as Usuario
}

export async function getCondominioById(id: string): Promise<Condominio | null> {
  const ref = doc(db, col('condominios'), id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return withId(snap.id, snap.data()) as Condominio
}

export async function listCondominios(): Promise<Condominio[]> {
  const q = query(collection(db, col('condominios')), orderBy('fecha_creacion', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => withId(d.id, d.data()) as Condominio)
}

export async function createCondominio(input: {
  nombre: string
  direccion: string
  observaciones?: string | null
}): Promise<string> {
  const ref = await addDoc(collection(db, col('condominios')), {
    nombre: input.nombre,
    direccion: input.direccion,
    observaciones: input.observaciones ?? null,
    activo: true,
    fecha_creacion: new Date().toISOString(),
    config_lpr: false,
    config_qr: true,
    config_tag: false,
    config_manual: true,
    recordatorio_pago: false,
    dias_recordatorio: null,
    mensaje_recordatorio: null,
    fecha_vencimiento: null,
  })
  return ref.id
}

export async function updateCondominio(id: string, patch: Partial<Condominio>) {
  await updateDoc(doc(db, col('condominios'), id), patch as any)
}

export async function deleteCondominio(id: string) {
  await deleteDoc(doc(db, col('condominios'), id))
}

export async function listUsuariosByCondominio(condominioId: string): Promise<Usuario[]> {
  const q = query(
    collection(db, col('usuarios')),
    where('condominio_id', '==', condominioId),
    orderBy('fecha_creacion', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => withId(d.id, d.data()) as Usuario)
}

export async function createUsuario(input: Omit<Usuario, 'id' | 'fecha_creacion'>) {
  const ref = await addDoc(collection(db, col('usuarios')), {
    ...input,
    fecha_creacion: new Date().toISOString(),
  })
  return ref.id
}

export async function updateUsuario(id: string, patch: Partial<Usuario>) {
  await updateDoc(doc(db, col('usuarios'), id), patch as any)
}

export async function listVehiculosByCondominio(condominioId: string): Promise<(Vehiculo & { usuario?: Usuario })[]> {
  // Firestore no permite joins: consultamos vehículos y luego resolvemos usuarios en memoria.
  const qVeh = query(collection(db, col('vehiculos')), orderBy('fecha_creacion', 'desc'))
  const snapVeh = await getDocs(qVeh)
  const vehs = snapVeh.docs.map((d) => withId(d.id, d.data()) as Vehiculo)

  const userIds = Array.from(new Set(vehs.map((v) => v.usuario_id)))
  const users: Record<string, Usuario> = {}
  await Promise.all(
    userIds.map(async (uid) => {
      const uSnap = await getDoc(doc(db, col('usuarios'), uid))
      if (uSnap.exists()) users[uid] = withId(uSnap.id, uSnap.data()) as Usuario
    })
  )

  return vehs
    .map((v) => ({ ...v, usuario: users[v.usuario_id] }))
    .filter((v) => v.usuario?.condominio_id === condominioId)
}

export async function createVehiculo(input: Omit<Vehiculo, 'id'>) {
  const ref = await addDoc(collection(db, col('vehiculos')), {
    ...input,
    fecha_creacion: new Date().toISOString(),
  } as any)
  return ref.id
}

export async function listVehiculosByUsuario(usuarioId: string): Promise<Vehiculo[]> {
  const q = query(collection(db, col('vehiculos')), where('usuario_id', '==', usuarioId), where('activo', '==', true))
  const snap = await getDocs(q)
  return snap.docs.map((d) => withId(d.id, d.data()) as Vehiculo)
}

export async function findVehiculoByPlacaInCondominio(condominioId: string, placa: string) {
  const qVeh = query(collection(db, col('vehiculos')), where('placa', '==', placa.toUpperCase()), where('activo', '==', true), limit(1))
  const vehSnap = await getDocs(qVeh)
  const vehDoc = vehSnap.docs[0]
  if (!vehDoc) return null
  const veh = withId(vehDoc.id, vehDoc.data()) as Vehiculo
  const uSnap = await getDoc(doc(db, col('usuarios'), veh.usuario_id))
  if (!uSnap.exists()) return null
  const usr = withId(uSnap.id, uSnap.data()) as Usuario
  if (usr.condominio_id !== condominioId) return null
  return { vehiculo: veh, usuario: usr }
}

export async function createVisita(input: Omit<Visita, 'id' | 'fecha_creacion' | 'estado' | 'fecha_ingreso'>) {
  const ref = await addDoc(collection(db, col('visitas')), {
    ...input,
    fecha_creacion: new Date().toISOString(),
    estado: 'pendiente',
    fecha_ingreso: null,
  })
  return ref.id
}

export async function listVisitasByVecino(vecinoId: string): Promise<Visita[]> {
  const q = query(collection(db, col('visitas')), where('vecino_id', '==', vecinoId), orderBy('fecha_creacion', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => withId(d.id, d.data()) as Visita)
}

export async function listVisitasHoyByCondominio(condominioId: string, todayISO: string): Promise<(Visita & { vecino?: Pick<Usuario, 'nombre' | 'lote_casa'> })[]> {
  const q = query(
    collection(db, col('visitas')),
    where('condominio_id', '==', condominioId),
    where('fecha_creacion', '>=', todayISO),
    orderBy('fecha_creacion', 'desc')
  )
  const snap = await getDocs(q)
  const visitas = snap.docs.map((d) => withId(d.id, d.data()) as Visita)
  const vecinoIds = Array.from(new Set(visitas.map((v) => v.vecino_id)))
  const vecinos: Record<string, Pick<Usuario, 'nombre' | 'lote_casa'>> = {}
  await Promise.all(
    vecinoIds.map(async (uid) => {
      const uSnap = await getDoc(doc(db, col('usuarios'), uid))
      if (uSnap.exists()) {
        const u = uSnap.data() as Usuario
        vecinos[uid] = { nombre: u.nombre, lote_casa: u.lote_casa }
      }
    })
  )
  return visitas.map((v) => ({ ...v, vecino: vecinos[v.vecino_id] }))
}

export async function findVisitaPendienteByPlaca(condominioId: string, placa: string): Promise<(Visita & { vecino?: Pick<Usuario, 'nombre' | 'lote_casa'> }) | null> {
  const q = query(
    collection(db, col('visitas')),
    where('condominio_id', '==', condominioId),
    where('placa', '==', placa.toUpperCase()),
    where('estado', '==', 'pendiente'),
    orderBy('fecha_creacion', 'desc'),
    limit(1)
  )
  const snap = await getDocs(q)
  const d = snap.docs[0]
  if (!d) return null
  const visita = withId(d.id, d.data()) as Visita
  const uSnap = await getDoc(doc(db, col('usuarios'), visita.vecino_id))
  const vecino = uSnap.exists() ? (uSnap.data() as Usuario) : null
  return { ...visita, vecino: vecino ? { nombre: vecino.nombre, lote_casa: vecino.lote_casa } : undefined }
}

export async function updateVisita(id: string, patch: Partial<Visita>) {
  await updateDoc(doc(db, col('visitas'), id), patch as any)
}

export async function createRegistroAcceso(input: Omit<RegistroAcceso, 'id' | 'fecha_hora'>) {
  const ref = await addDoc(collection(db, col('registros_acceso')), {
    ...input,
    fecha_hora: new Date().toISOString(),
  })
  return ref.id
}

export async function listRegistrosHoy(condominioId: string, todayISO: string): Promise<RegistroAcceso[]> {
  const q = query(
    collection(db, col('registros_acceso')),
    where('condominio_id', '==', condominioId),
    where('fecha_hora', '>=', todayISO),
    orderBy('fecha_hora', 'desc'),
    limit(200)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => withId(d.id, d.data()) as RegistroAcceso)
}

export async function listMensajesPara(condominioId: string | null, roles: string[]): Promise<Mensaje[]> {
  // Simplificación: traemos últimos 50 y filtramos en memoria (evita queries complejas con OR).
  const q = query(collection(db, col('mensajes')), orderBy('fecha_creacion', 'desc'), limit(50))
  const snap = await getDocs(q)
  const msgs = snap.docs.map((d) => withId(d.id, d.data()) as Mensaje)
  return msgs.filter((m) => {
    const okCond = !m.filtro_condominio || m.filtro_condominio === condominioId
    const okRol = !m.filtro_rol || roles.includes(m.filtro_rol)
    return okCond && okRol
  })
}

export async function createMensaje(input: Omit<Mensaje, 'id' | 'fecha_creacion'>) {
  const ref = await addDoc(collection(db, col('mensajes')), {
    ...input,
    fecha_creacion: new Date().toISOString(),
  })
  return ref.id
}

export async function markMensajeLeido(mensajeId: string, usuarioId: string) {
  // Usamos un docId determinístico para evitar duplicados.
  const id = `${mensajeId}_${usuarioId}`
  await setDoc(doc(db, col('mensajes_leidos'), id), {
    mensaje_id: mensajeId,
    usuario_id: usuarioId,
    fecha_lectura: new Date().toISOString(),
  })
}

export async function countMensajesLeidos(mensajeIds: string[]): Promise<Record<string, number>> {
  // Simplificación: traemos últimos 200 "leídos" y contamos local (en producción se mejora).
  const q = query(collection(db, col('mensajes_leidos')), orderBy('fecha_lectura', 'desc'), limit(500))
  const snap = await getDocs(q)
  const counts: Record<string, number> = {}
  snap.docs.forEach((d) => {
    const data = d.data() as any
    const mid = data.mensaje_id
    if (!mensajeIds.includes(mid)) return
    counts[mid] = (counts[mid] || 0) + 1
  })
  return counts
}

