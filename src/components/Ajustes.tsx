import { useEffect, useRef, useState } from 'react'
import type { User } from 'firebase/auth'
import type { Config, Fijo, TipoFijo } from '../types'
import { acciones, exportarRespaldo, importarRespaldo, type Respaldo } from '../data/datos'
import { salir } from '../firebase'
import { clp, formatoMiles, mesCorto, parseMonto } from '../lib/formato'
import { ordenarFijos } from '../lib/calculo'

type Acciones = ReturnType<typeof acciones>

export default function Ajustes({ user, config, fijos, acc }: { user: User; config: Config; fijos: Fijo[]; acc: Acciones }) {
  return (
    <details className="panel" id="ajustes">
      <summary>Ajustes: sueldo, metas, cuentas fijas y respaldo</summary>
      <FormConfig config={config} onGuardar={(c) => acc.guardarConfig(c)} />
      <CuentasFijas fijos={fijos} acc={acc} />
      <RespaldoYCuenta user={user} />
    </details>
  )
}

/* ---------------- Configuración ---------------- */
function FormConfig({ config, onGuardar }: { config: Config; onGuardar: (c: Config) => void }) {
  const [v, setV] = useState(() => aTexto(config))
  const [ok, setOk] = useState(false)
  useEffect(() => setV(aTexto(config)), [config])
  const campo = (k: keyof typeof v, etiqueta: string) => (
    <label>
      {etiqueta}
      <input className="field num" inputMode="numeric" value={v[k]} onChange={(e) => setV({ ...v, [k]: formatoMiles(parseMonto(e.target.value)) })} />
    </label>
  )
  return (
    <>
      <div className="cfg">
        {campo('sueldo', 'Sueldo líquido (antes de descuentos por planilla)')}
        {campo('limiteHormiga', 'Límite mensual gastos hormiga')}
        {campo('metaAhorro', 'Meta de ahorro mensual')}
        {campo('metaExtra', 'Meta de ingreso extra mensual')}
        <label>
          Mes en que parte el control
          <input className="field" type="month" value={v.inicio} onChange={(e) => setV({ ...v, inicio: e.target.value })} />
        </label>
      </div>
      <div className="row-inline">
        <button
          className="btn ghost"
          onClick={() => {
            onGuardar({
              ...config,
              sueldo: parseMonto(v.sueldo),
              limiteHormiga: parseMonto(v.limiteHormiga),
              metaAhorro: parseMonto(v.metaAhorro),
              metaExtra: parseMonto(v.metaExtra),
              inicio: v.inicio || null,
            })
            setOk(true)
            setTimeout(() => setOk(false), 2500)
          }}
        >
          Guardar ajustes
        </button>
        {ok && <span className="toast">Ajustes guardados</span>}
      </div>
    </>
  )
}
const aTexto = (c: Config) => ({
  sueldo: formatoMiles(c.sueldo),
  limiteHormiga: formatoMiles(c.limiteHormiga),
  metaAhorro: formatoMiles(c.metaAhorro),
  metaExtra: formatoMiles(c.metaExtra),
  inicio: c.inicio ?? '',
})

/* ---------------- Cuentas fijas ---------------- */
function CuentasFijas({ fijos, acc }: { fijos: Fijo[]; acc: Acciones }) {
  const [editando, setEditando] = useState<string | null>(null) // id, 'nuevo' o null
  const lista = [...fijos].sort(ordenarFijos)
  const actual = editando && editando !== 'nuevo' ? fijos.find((f) => f.id === editando) : undefined

  return (
    <>
      <div className="panel-head subt">
        <h3>Cuentas fijas y créditos</h3>
        <button className="linkbtn" onClick={() => setEditando('nuevo')}>+ Agregar</button>
      </div>
      {editando && (
        <EditorFijo
          key={editando}
          fijo={actual}
          ordenNuevo={fijos.length + 1}
          onCancelar={() => setEditando(null)}
          onGuardar={(f) => { acc.guardarFijo(editando === 'nuevo' ? null : editando, f); setEditando(null) }}
          onBorrar={editando !== 'nuevo' ? () => { acc.borrarFijo(editando); setEditando(null) } : undefined}
        />
      )}
      <div className="list">
        {lista.map((f) => (
          <div className="fxrow" key={f.id}>
            <span className="fx-txt">
              <b>{f.nombre}</b> <span className="muted small num">{clp(f.monto)}</span>
              {f.tipo === 'credito' && <span className="tag cr">crédito</span>}
              {f.planilla && <span className="tag">planilla</span>}
              <br />
              <span className="muted small">
                {[f.inicio ? `desde ${mesCorto(f.inicio)}` : '', f.fin ? `hasta ${mesCorto(f.fin)}` : ''].filter(Boolean).join(' · ') || 'todos los meses'}
              </span>
            </span>
            <button className="linkbtn" onClick={() => setEditando(f.id)}>Editar</button>
          </div>
        ))}
      </div>
    </>
  )
}

interface EditorProps {
  fijo?: Fijo
  ordenNuevo: number
  onGuardar: (f: Omit<Fijo, 'id'>) => void
  onCancelar: () => void
  onBorrar?: () => void
}

function EditorFijo({ fijo, ordenNuevo, onGuardar, onCancelar, onBorrar }: EditorProps) {
  const [f, setF] = useState({
    nombre: fijo?.nombre ?? '',
    monto: formatoMiles(fijo?.monto ?? 0),
    tipo: (fijo?.tipo ?? 'cuenta') as TipoFijo,
    inicio: fijo?.inicio ?? '',
    fin: fijo?.fin ?? '',
    dia: fijo?.dia ? String(fijo.dia) : '',
    nroCliente: fijo?.nroCliente ?? '',
    portal: fijo?.portal ?? '',
    usuario: fijo?.usuario ?? '',
    nota: fijo?.nota ?? '',
    planilla: !!fijo?.planilla,
  })
  const [confirmar, setConfirmar] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value })

  const guardar = () => {
    const portal = f.portal.trim()
    onGuardar({
      nombre: f.nombre.trim() || 'Sin nombre',
      monto: parseMonto(f.monto),
      tipo: f.tipo,
      inicio: f.inicio || null,
      fin: f.fin || null,
      dia: parseMonto(f.dia) || null,
      nroCliente: f.nroCliente.trim() || null,
      portal: !portal ? null : /^https?:\/\//i.test(portal) ? portal : `https://${portal}`,
      usuario: f.usuario.trim() || null,
      nota: f.nota.trim() || null,
      planilla: f.planilla,
      orden: fijo?.orden ?? ordenNuevo,
    })
  }

  return (
    <div className="fx-edit">
      <label className="full">Nombre<input className="field" value={f.nombre} onChange={set('nombre')} /></label>
      <label>Monto mensual<input className="field num" inputMode="numeric" value={f.monto} onChange={(e) => setF({ ...f, monto: formatoMiles(parseMonto(e.target.value)) })} /></label>
      <label>Tipo
        <select className="field" value={f.tipo} onChange={set('tipo')}>
          <option value="cuenta">Cuenta / servicio</option>
          <option value="credito">Crédito</option>
          <option value="hogar">Hogar / mascotas</option>
        </select>
      </label>
      <label>Desde (mes)<input className="field" type="month" value={f.inicio} onChange={set('inicio')} /></label>
      <label>Hasta / última cuota<input className="field" type="month" value={f.fin} onChange={set('fin')} /></label>
      <label>Día de vencimiento<input className="field" inputMode="numeric" value={f.dia} onChange={set('dia')} /></label>
      <label>N° cliente<input className="field" value={f.nroCliente} onChange={set('nroCliente')} /></label>
      <label>Portal de pago (link)<input className="field" value={f.portal} placeholder="https://…" onChange={set('portal')} /></label>
      <label>Usuario / RUT de acceso<input className="field" value={f.usuario} onChange={set('usuario')} /></label>
      <span className="full muted small">No guardes contraseñas aquí: usa el gestor de contraseñas de tu navegador.</span>
      <label className="full">Nota<input className="field" value={f.nota} onChange={set('nota')} /></label>
      <label className="full check"><input type="checkbox" checked={f.planilla} onChange={set('planilla')} /> Se descuenta por planilla (ya viene restado del sueldo)</label>
      <div className="row full">
        <button className="btn" onClick={guardar}>Guardar</button>
        <button className="btn ghost" onClick={onCancelar}>Cancelar</button>
        {onBorrar && (
          <button className={`btn ${confirmar ? 'danger' : 'ghost'}`} onClick={() => (confirmar ? onBorrar() : setConfirmar(true))}>
            {confirmar ? 'Confirmar borrar' : 'Borrar'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ---------------- Respaldo y cuenta ---------------- */
function RespaldoYCuenta({ user }: { user: User }) {
  const archivo = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const exportar = async () => {
    try {
      const r = await exportarRespaldo(user.uid)
      const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `mis-lucas-respaldo-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(a.href)
      setMsg('Respaldo descargado.')
    } catch (e) {
      setMsg(`No se pudo exportar: ${(e as Error).message}`)
    }
  }

  const importar = async (file: File) => {
    try {
      const r = JSON.parse(await file.text()) as Respaldo
      const n = await importarRespaldo(user.uid, r)
      setMsg(`Importados ${n} registros.`)
    } catch (e) {
      setMsg(`No se pudo importar: ${(e as Error).message}`)
    }
  }

  return (
    <>
      <div className="panel-head subt"><h3>Respaldo</h3></div>
      <p className="muted small sin-margen">Descarga una copia de todos tus datos, o carga un respaldo (los registros con el mismo identificador se reemplazan).</p>
      <div className="row-inline">
        <button className="btn ghost" onClick={exportar}>Descargar respaldo</button>
        <button className="btn ghost" onClick={() => archivo.current?.click()}>Cargar respaldo</button>
        <input ref={archivo} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importar(f); e.target.value = '' }} />
      </div>
      {msg && <div className="small">{msg}</div>}
      <div className="panel-head subt"><h3>Cuenta</h3></div>
      <div className="row-inline">
        <span className="muted small">Conectado como {user.email}</span>
        <button className="linkbtn" onClick={() => salir()}>Cerrar sesión</button>
      </div>
    </>
  )
}
