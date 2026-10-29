import { useEffect, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Config, Fijo, MesDoc, Movimiento, Pago } from '../types'
import { CONFIG_DEFAULT } from '../types'

/* ---------------- Rutas ---------------- */
// Todo vive bajo users/{uid}/…, y las reglas de Firestore solo dejan
// leer y escribir a su dueño.
const col = (uid: string, nombre: string) => collection(db!, 'users', uid, nombre)
const ref = (uid: string, nombre: string, id: string) => doc(db!, 'users', uid, nombre, id)

/* ---------------- Errores de escritura ---------------- */
// Sin internet, una escritura queda guardada localmente y su promesa no se
// resuelve hasta que el servidor la confirma. Por eso nunca esperamos las
// escrituras: la interfaz se actualiza al tiro desde la caché local.
type OyenteError = (msg: string) => void
let oyenteError: OyenteError = () => {}
export const alErrorDeEscritura = (fn: OyenteError) => { oyenteError = fn }
const sinEsperar = (p: Promise<unknown>) =>
  p.catch((e) => oyenteError((e as Error)?.message ?? 'No se pudo guardar'))

const limpio = <T extends object>(o: T): DocumentData => {
  const r: DocumentData = {}
  Object.entries(o).forEach(([k, v]) => { if (v !== undefined && k !== 'id') r[k] = v })
  return r
}

/* ---------------- Lectura ---------------- */
export interface Datos {
  cargando: boolean
  config: Config
  fijos: Fijo[]
  movs: Movimiento[]
  pagos: Record<string, Pago>
  inicial: number | null
  /** Hay cambios hechos sin conexión que aún no llegan al servidor */
  pendientes: boolean
  error: string | null
}

export function useDatos(uid: string, mes: string): Datos {
  const [config, setConfig] = useState<Config>(CONFIG_DEFAULT)
  const [configListo, setConfigListo] = useState(false)
  const [fijos, setFijos] = useState<Fijo[]>([])
  const [movs, setMovs] = useState<Movimiento[]>([])
  const [pagos, setPagos] = useState<Record<string, Pago>>({})
  const [inicial, setInicial] = useState<number | null>(null)
  const [pend, setPend] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const marcar = (k: string, v: boolean) => setPend((p) => (p[k] === v ? p : { ...p, [k]: v }))
  const fallo = (e: Error) => setError(e.message)

  // Datos generales: configuración y cuentas fijas
  useEffect(() => {
    const opts = { includeMetadataChanges: true }
    const u1 = onSnapshot(ref(uid, 'config', 'main'), opts, (d) => {
      setConfig({ ...CONFIG_DEFAULT, ...(d.data() as Partial<Config> | undefined) })
      setConfigListo(true)
      marcar('config', d.metadata.hasPendingWrites)
    }, fallo)
    const u2 = onSnapshot(col(uid, 'fijos'), opts, (s) => {
      setFijos(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Fijo, 'id'>) })))
      marcar('fijos', s.metadata.hasPendingWrites)
    }, fallo)
    return () => { u1(); u2() }
  }, [uid])

  // Datos del mes visible
  useEffect(() => {
    const opts = { includeMetadataChanges: true }
    const u1 = onSnapshot(query(col(uid, 'movs'), where('mes', '==', mes)), opts, (s) => {
      setMovs(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Movimiento, 'id'>) })))
      marcar('movs', s.metadata.hasPendingWrites)
    }, fallo)
    const u2 = onSnapshot(query(col(uid, 'pagos'), where('mes', '==', mes)), opts, (s) => {
      const p: Record<string, Pago> = {}
      s.docs.forEach((d) => { const v = d.data() as Pago; p[v.fijoId] = v })
      setPagos(p)
      marcar('pagos', s.metadata.hasPendingWrites)
    }, fallo)
    const u3 = onSnapshot(ref(uid, 'meses', mes), opts, (d) => {
      const v = (d.data() as MesDoc | undefined)?.inicial
      setInicial(typeof v === 'number' ? v : null)
      marcar('mes', d.metadata.hasPendingWrites)
    }, fallo)
    return () => { u1(); u2(); u3() }
  }, [uid, mes])

  return {
    cargando: !configListo,
    config, fijos, movs, pagos, inicial,
    pendientes: Object.values(pend).some(Boolean),
    error,
  }
}

/* ---------------- Escritura ---------------- */
export const acciones = (uid: string) => ({
  agregarMov(m: Omit<Movimiento, 'id'>) {
    const r = doc(col(uid, 'movs'))
    sinEsperar(setDoc(r, limpio(m)))
  },
  borrarMov(id: string) {
    sinEsperar(deleteDoc(ref(uid, 'movs', id)))
  },
  guardarPago(mes: string, fijoId: string, actual: Pago | undefined, cambio: Partial<Pago>) {
    const p: Pago = { ...(actual ?? {}), ...cambio, mes, fijoId }
    sinEsperar(setDoc(ref(uid, 'pagos', `${mes}__${fijoId}`), limpio(p)))
  },
  guardarInicial(mes: string, inicial: number | null) {
    sinEsperar(setDoc(ref(uid, 'meses', mes), { mes, inicial }))
  },
  guardarFijo(id: string | null, f: Omit<Fijo, 'id'>) {
    const r = id ? ref(uid, 'fijos', id) : doc(col(uid, 'fijos'))
    sinEsperar(setDoc(r, limpio(f)))
  },
  borrarFijo(id: string) {
    sinEsperar(deleteDoc(ref(uid, 'fijos', id)))
  },
  guardarConfig(c: Config) {
    sinEsperar(setDoc(ref(uid, 'config', 'main'), limpio(c)))
  },
})

/* ---------------- Respaldo: importar / exportar ---------------- */
export interface Respaldo {
  version: 1
  config?: Partial<Config>
  fijos?: Fijo[]
  pagos?: (Pago & { id?: string })[]
  meses?: MesDoc[]
  movs?: Movimiento[]
}

/** Copia un respaldo JSON a tu cuenta. Los documentos con el mismo id se reemplazan. */
export async function importarRespaldo(uid: string, r: Respaldo) {
  if (r?.version !== 1) throw new Error('El archivo no es un respaldo de Mis Lucas.')
  const escrituras: [ReturnType<typeof ref>, DocumentData][] = []
  if (r.config) escrituras.push([ref(uid, 'config', 'main'), limpio({ ...CONFIG_DEFAULT, ...r.config })])
  r.fijos?.forEach((f) => escrituras.push([ref(uid, 'fijos', f.id), limpio(f)]))
  r.pagos?.forEach((p) => escrituras.push([ref(uid, 'pagos', p.id ?? `${p.mes}__${p.fijoId}`), limpio(p)]))
  r.meses?.forEach((m) => escrituras.push([ref(uid, 'meses', m.mes), limpio(m)]))
  r.movs?.forEach((m) => escrituras.push([m.id ? ref(uid, 'movs', m.id) : doc(col(uid, 'movs')), limpio(m)]))
  // Firestore admite hasta 500 escrituras por lote
  for (let i = 0; i < escrituras.length; i += 450) {
    const b = writeBatch(db!)
    escrituras.slice(i, i + 450).forEach(([d, data]) => b.set(d, data))
    sinEsperar(b.commit())
  }
  return escrituras.length
}

export async function exportarRespaldo(uid: string): Promise<Respaldo> {
  const lista = async <T,>(n: string) =>
    (await getDocs(col(uid, n))).docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as T)
  const cfg = await getDoc(ref(uid, 'config', 'main'))
  return {
    version: 1,
    config: cfg.data() as Partial<Config> | undefined,
    fijos: await lista<Fijo>('fijos'),
    pagos: await lista<Pago & { id: string }>('pagos'),
    meses: await lista<MesDoc>('meses'),
    movs: await lista<Movimiento>('movs'),
  }
}
