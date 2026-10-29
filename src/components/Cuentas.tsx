import { useEffect, useState } from 'react'
import type { Config, Fijo, Pago } from '../types'
import { proyeccion, type ResumenMes } from '../lib/calculo'
import { clp, formatoMiles, MESES, mesCorto, mesesEntre, nombreMes, parseMonto } from '../lib/formato'

const urlSegura = (u?: string | null) => (u && /^https?:\/\//i.test(u) ? u : null)

/* ---------------- Cuentas del mes ---------------- */
export function CuentasMes({ r, pagos, onPago }: { r: ResumenMes; pagos: Record<string, Pago>; onPago: (f: Fijo, c: Partial<Pago>) => void }) {
  const nPag = r.fijos.filter((f) => pagos[f.id]?.pagado).length
  return (
    <section className="panel" aria-label="Cuentas del mes">
      <div className="panel-head">
        <h2>Cuentas y créditos del mes</h2>
        <span className={`pill${r.fijos.length && nPag === r.fijos.length ? ' ok' : ''}`}>{nPag} de {r.fijos.length} pagadas</span>
      </div>
      <p className="muted small sin-margen">Marca cada una al pagarla. Si la boleta vino distinta (agua, luz, TAG), corrige el monto ahí mismo.</p>
      {r.fijos.length ? (
        <div className="list">
          {r.fijos.map((f) => (
            <FilaFijo key={f.id} f={f} monto={r.montoFijo(f)} pagado={!!pagos[f.id]?.pagado} onPago={(c) => onPago(f, c)} />
          ))}
        </div>
      ) : (
        <div className="empty">No hay cuentas fijas para este mes. Agrégalas en Ajustes, al final de la página.</div>
      )}
      <div className="totline"><span>Total que pagas tú</span><span className="num">{clp(r.compromisos)}</span></div>
      {r.descPlanilla > 0 && (
        <div className="muted small">No suma {clp(r.descPlanilla)} de descuentos por planilla: ya vienen restados antes de que te llegue el sueldo.</div>
      )}
    </section>
  )
}

function FilaFijo({ f, monto, pagado, onPago }: { f: Fijo; monto: number; pagado: boolean; onPago: (c: Partial<Pago>) => void }) {
  const [texto, setTexto] = useState(formatoMiles(monto) || '0')
  const [editando, setEditando] = useState(false)
  useEffect(() => { if (!editando) setTexto(formatoMiles(monto) || '0') }, [monto, editando])

  const meta = [
    f.dia ? `vence día ${f.dia}` : '',
    f.nroCliente ? `N° cliente ${f.nroCliente}` : '',
    f.usuario ? `usuario ${f.usuario}` : '',
    f.tipo === 'credito' && f.fin ? `última cuota ${mesCorto(f.fin)}` : '',
    f.nota ?? '',
  ].filter(Boolean).join(' · ')
  const portal = urlSegura(f.portal)

  return (
    <div className={`fx${pagado ? ' done' : ''}`}>
      <input type="checkbox" checked={pagado} onChange={(e) => onPago({ pagado: e.target.checked })} aria-label={`Pagado ${f.nombre}`} />
      <div className="fx-txt">
        <div className="name">
          {f.nombre}
          {f.tipo === 'credito' && <span className="tag cr">crédito</span>}
          {!f.monto && <span className="tag tbd">monto por confirmar</span>}
          {f.planilla && <span className="tag">descontado del sueldo</span>}
        </div>
        {meta && <div className="meta">{meta}</div>}
        {portal && <a className="portal" href={portal} target="_blank" rel="noopener noreferrer">Ir a pagar ↗</a>}
      </div>
      <input
        className="amt" inputMode="numeric" aria-label={`Monto ${f.nombre}`} value={texto}
        onFocus={() => setEditando(true)}
        onChange={(e) => setTexto(formatoMiles(parseMonto(e.target.value)))}
        onBlur={() => {
          setEditando(false)
          const v = parseMonto(texto)
          if (v !== monto) onPago({ monto: v })
        }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      />
    </div>
  )
}

/* ---------------- Créditos ---------------- */
export function Creditos({ fijos, mesHoy }: { fijos: Fijo[]; mesHoy: string }) {
  const cr = fijos.filter((f) => f.tipo === 'credito').sort((a, b) => (a.fin ?? '9999').localeCompare(b.fin ?? '9999'))
  return (
    <section className="panel" aria-label="Créditos">
      <div className="panel-head"><h2>Créditos</h2><span className="muted small">cuándo te liberas</span></div>
      {cr.length ? (
        <div className="list">
          {cr.map((f) => {
            let derecha: React.ReactNode
            let sub: string
            if (f.fin) {
              const n = Math.max(0, mesesEntre(mesHoy, f.fin) + 1)
              derecha = n
                ? <span className={`pill${n <= 3 ? ' ok' : ''}`}>{n} cuota{n > 1 ? 's' : ''}</span>
                : <span className="pill ok">pagado</span>
              sub = `Termina en ${nombreMes(f.fin)} · quedan aprox. ${clp(n * (f.monto || 0))} por pagar`
            } else {
              derecha = <span className="pill warn">fecha por confirmar</span>
              sub = 'Agrega la fecha de la última cuota en Ajustes para ver cuánto falta.'
            }
            if (f.inicio && f.inicio > mesHoy) sub = `Empieza en ${nombreMes(f.inicio)}. ${sub}`
            return (
              <div className="cr-item" key={f.id}>
                <div className="top"><b>{f.nombre}</b>{derecha}</div>
                <div className="small"><span className="num">{f.monto ? clp(f.monto) : 'monto por confirmar'}</span> al mes{f.planilla ? ' · descuento por planilla' : ''}</div>
                <div className="small muted">{sub}</div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty">Sin créditos registrados.</div>
      )}
    </section>
  )
}

/* ---------------- Proyección ---------------- */
export function Proyeccion({ desde, mesVisible, config, fijos }: { desde: string; mesVisible: string; config: Config; fijos: Fijo[] }) {
  const W = 520, H = 220, L = 8, R = 8, T = 22, B = 34
  const datos = proyeccion(desde, 14, config, fijos)
  const max = Math.max(1, ...datos.map((x) => Math.abs(x.libre)))
  const bw = (W - L - R) / datos.length
  const alto = (v: number) => ((H - T - B) * Math.max(0, v)) / max
  const primero = datos[0]?.libre ?? 0

  return (
    <section className="panel" aria-label="Proyección">
      <div className="panel-head"><h2>Lo que te queda libre, mes a mes</h2></div>
      <p className="muted small sin-margen">Sueldo menos cuentas y créditos, sin contar bonos. Las barras suben cuando terminan los créditos.</p>
      <div className="chart-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Proyección de dinero libre por mes">
          <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="var(--line)" />
          {datos.map(({ mes, libre }, i) => {
            const h = alto(libre)
            const x = L + i * bw + bw * 0.15
            const w = bw * 0.7
            const y = H - B - h
            const salto = i > 0 && libre > datos[i - 1].libre + 1000
            const color = libre < 0 ? 'var(--bad)' : libre > primero + 1000 ? 'var(--good)' : 'var(--accent)'
            return (
              <g key={mes}>
                <rect x={x} y={y} width={w} height={Math.max(1, h)} rx={3} fill={color} opacity={mes === mesVisible ? 1 : 0.82}>
                  <title>{`${nombreMes(mes)}: ${clp(libre)}`}</title>
                </rect>
                {(i % 2 === 0 || salto) && (
                  <text className="val" x={x + w / 2} y={y - 5} textAnchor="middle">{Math.round(libre / 1000)}k</text>
                )}
                <text x={x + w / 2} y={H - B + 14} textAnchor="middle">{MESES[Number(mes.slice(5)) - 1].slice(0, 3)}</text>
                {mes.endsWith('-01') && <text x={x + w / 2} y={H - B + 27} textAnchor="middle">{mes.slice(0, 4)}</text>}
              </g>
            )
          })}
        </svg>
      </div>
    </section>
  )
}
