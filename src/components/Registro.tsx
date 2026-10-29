import { useEffect, useRef, useState } from 'react'
import type { Config, Movimiento, TipoMov } from '../types'
import { CATEGORIAS, HORMIGA, nombreCategoria } from '../lib/categorias'
import { clp, diasDelMes, formatoMiles, nombreMes, parseMonto } from '../lib/formato'
import type { ResumenMes } from '../lib/calculo'

/* ---------------- Anotar ---------------- */
interface AnotarProps {
  fechaDefecto: string
  mesVisible: string
  onGuardar: (m: Omit<Movimiento, 'id'>) => void
}

export function Anotar({ fechaDefecto, mesVisible, onGuardar }: AnotarProps) {
  const [tipo, setTipo] = useState<TipoMov>('gasto')
  const [cat, setCat] = useState('super')
  const [monto, setMonto] = useState('')
  const [nota, setNota] = useState('')
  const [fecha, setFecha] = useState(fechaDefecto)
  const [toast, setToast] = useState('')
  const montoRef = useRef<HTMLInputElement>(null)

  useEffect(() => setFecha(fechaDefecto), [fechaDefecto])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const cambiarTipo = (t: TipoMov) => {
    setTipo(t)
    setCat(CATEGORIAS[t][0].id)
    montoRef.current?.focus()
  }

  const guardar = () => {
    const v = parseMonto(monto)
    if (v <= 0) { montoRef.current?.focus(); return }
    const f = fecha || fechaDefecto
    const mes = f.slice(0, 7)
    onGuardar({ tipo, cat, monto: v, fecha: f, mes, nota: nota.trim() || null, creado: Date.now() })
    setMonto('')
    setNota('')
    setToast(`Anotado: ${nombreCategoria(cat)} ${clp(v)}${mes !== mesVisible ? ` (en ${nombreMes(mes)})` : ''}`)
  }

  return (
    <section className="panel" aria-label="Anotar">
      <div className="panel-head"><h2>Anotar</h2><span className="muted small">toma 5 segundos</span></div>
      <div className="seg" role="group" aria-label="Tipo">
        {(['gasto', 'ingreso', 'ahorro'] as TipoMov[]).map((t) => (
          <button key={t} aria-pressed={tipo === t} onClick={() => cambiarTipo(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <label className="amount">
        <span>$</span>
        <input
          id="fMonto" ref={montoRef} inputMode="numeric" autoComplete="off" placeholder="0" aria-label="Monto"
          value={monto}
          onChange={(e) => setMonto(formatoMiles(parseMonto(e.target.value)))}
          onKeyDown={(e) => { if (e.key === 'Enter') guardar() }}
        />
      </label>
      <div className="chips">
        {CATEGORIAS[tipo].map((c) => (
          <button key={c.id} className={`chip${c.hormiga ? ' h' : ''}`} aria-pressed={c.id === cat} onClick={() => setCat(c.id)}>
            {c.nombre}
          </button>
        ))}
        {tipo === 'gasto' && <span className="muted small chips-nota">borde punteado = gasto hormiga</span>}
      </div>
      <div className="row">
        <input id="fNota" className="field" placeholder="Nota (opcional)" autoComplete="off" value={nota} onChange={(e) => setNota(e.target.value)} />
        <input id="fFecha" className="field" type="date" aria-label="Fecha" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>
      <button className="btn" onClick={guardar}>Guardar</button>
      <div className="toast" aria-live="polite">{toast}</div>
    </section>
  )
}

/* ---------------- Medidores ---------------- */
function Medidor({ titulo, valor, meta, inverso, nota }: { titulo: string; valor: number; meta: number; inverso?: boolean; nota?: string }) {
  const pct = meta > 0 ? Math.min(100, (valor / meta) * 100) : 0
  let cls = ''
  let pill = ''
  if (inverso) {
    cls = valor > meta ? 'bad' : valor > meta * 0.75 ? 'warn' : 'good'
    pill = valor > meta ? 'bad' : valor > meta * 0.75 ? 'warn' : 'ok'
  } else if (meta > 0 && valor >= meta) {
    cls = 'good'
    pill = 'ok'
  }
  return (
    <div className={`meter ${cls}`}>
      <div className="top">
        <span><b>{titulo}</b> {nota && <span className={`pill ${pill}`}>{nota}</span>}</span>
        <span className="num">{clp(valor)} <span className="muted">/ {clp(meta)}</span></span>
      </div>
      <div className="bar"><div className="fill" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

export function Medidores({ r, config, mes, mesHoy, hoy }: { r: ResumenMes; config: Config; mes: string; mesHoy: string; hoy: Date }) {
  const porCat: Record<string, number> = {}
  r.hormiga.forEach((x) => (porCat[x.cat] = (porCat[x.cat] ?? 0) + x.monto))
  const filas = Object.entries(porCat).sort((a, b) => b[1] - a[1])
  const lim = config.limiteHormiga
  const dias = mes === mesHoy ? hoy.getDate() : diasDelMes(mes)
  return (
    <section className="panel" aria-label="Medidores">
      <Medidor
        titulo="Gastos hormiga" valor={r.hormigaTotal} meta={lim} inverso
        nota={r.hormigaTotal > lim ? 'te pasaste' : r.hormigaTotal > lim * 0.75 ? 'cuidado' : 'bajo control'}
      />
      <div className="breakdown">
        {filas.length
          ? filas.map(([c, v]) => <div key={c}><span>{nombreCategoria(c)}</span><span className="num">{clp(v)}</span></div>)
          : <span className="muted">Sin gastos hormiga anotados este mes.</span>}
      </div>
      <Medidor titulo="Ingreso extra (sin bonos)" valor={r.extra} meta={config.metaExtra} nota={`${clp(r.extra / dias)} por día`} />
      <Medidor titulo="Ahorro del mes" valor={r.ahorro} meta={config.metaAhorro} nota={r.ahorro >= config.metaAhorro && config.metaAhorro > 0 ? 'meta cumplida' : undefined} />
    </section>
  )
}

/* ---------------- Movimientos ---------------- */
export function Movimientos({ movs, onBorrar }: { movs: Movimiento[]; onBorrar: (id: string) => void }) {
  const [armado, setArmado] = useState<string | null>(null)
  useEffect(() => {
    if (!armado) return
    const t = setTimeout(() => setArmado(null), 2500)
    return () => clearTimeout(t)
  }, [armado])

  const lista = [...movs].sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.creado ?? 0) - (a.creado ?? 0))
  return (
    <section className="panel" aria-label="Movimientos">
      <div className="panel-head"><h2>Movimientos del mes</h2><span className="muted small">{lista.length ? `${lista.length} anotados` : ''}</span></div>
      {lista.length ? (
        <div className="list">
          {lista.map((x) => {
            const cls = x.tipo === 'ingreso' ? 'in' : x.tipo === 'ahorro' ? 'sv' : ''
            const signo = x.tipo === 'ingreso' ? '+' : x.tipo === 'ahorro' ? '→' : ''
            return (
              <div className="mv" key={x.id}>
                <span className="d">{x.fecha.slice(8, 10)}/{x.fecha.slice(5, 7)}</span>
                <span className="mv-txt">
                  <b>{nombreCategoria(x.cat)}</b>
                  {HORMIGA.has(x.cat) && <span className="tag tbd">hormiga</span>}
                  {x.nota && <><br /><span className="muted small">{x.nota}</span></>}
                </span>
                <span className={`m ${cls}`}>{signo}{clp(x.monto)}</span>
                <button
                  className={`x${armado === x.id ? ' arm' : ''}`}
                  aria-label={armado === x.id ? 'Confirmar borrar' : 'Borrar movimiento'}
                  onClick={() => (armado === x.id ? (onBorrar(x.id), setArmado(null)) : setArmado(x.id))}
                >
                  {armado === x.id ? '¿?' : '✕'}
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty">
          Aún no anotas nada este mes. Escribe un monto arriba, elige la categoría y guarda. Lo que más ayuda es
          anotar los gastos chicos: el café, el completo, la compra online.
        </div>
      )}
    </section>
  )
}
