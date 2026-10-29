import { useEffect, useMemo, useRef, useState } from 'react'
import type { User } from 'firebase/auth'
import { acciones, alErrorDeEscritura, useDatos } from '../data/datos'
import { useEnLinea, useHoy } from '../hooks'
import { resumirMes } from '../lib/calculo'
import { clp, diasDelMes, fechaDe, formatoMiles, mesDe, MESES, nombreMes, parseMonto, sumarMeses } from '../lib/formato'
import { Anotar, Medidores, Movimientos } from './Registro'
import { Creditos, CuentasMes, Proyeccion } from './Cuentas'
import Ajustes from './Ajustes'

export default function Panel({ user }: { user: User }) {
  const hoy = useHoy()
  const mesHoy = mesDe(hoy)
  const [mes, setMes] = useState(mesHoy)
  const d = useDatos(user.uid, mes)
  const acc = useMemo(() => acciones(user.uid), [user.uid])
  const enLinea = useEnLinea()
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => alErrorDeEscritura((m) => setAviso(`No se pudo guardar: ${m}`)), [])

  // Al abrir, si el control parte en un mes futuro, saltamos a ese mes
  const inicio = d.config.inicio ?? null
  const yaAjustado = useRef(false)
  useEffect(() => {
    if (d.cargando || yaAjustado.current) return
    yaAjustado.current = true
    if (inicio && mes < inicio) setMes(inicio)
  }, [d.cargando, inicio, mes])

  const r = resumirMes(mes, d.config, d.fijos, d.movs, d.pagos, d.inicial)
  const mesBase = inicio && inicio > mesHoy ? inicio : mesHoy
  const fechaDefecto = mes === mesHoy ? fechaDe(hoy) : `${mes}-01`
  const puedeRetroceder = !(inicio && mes <= inicio)

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <h1>Mis Lucas</h1>
          <EstadoSync enLinea={enLinea} pendientes={d.pendientes} />
        </div>
        <div className="monthnav" role="group" aria-label="Mes">
          <button onClick={() => setMes(sumarMeses(mes, -1))} disabled={!puedeRetroceder} aria-label="Mes anterior">‹</button>
          <span>{nombreMes(mes)}</span>
          <button onClick={() => setMes(sumarMeses(mes, 1))} aria-label="Mes siguiente">›</button>
        </div>
      </header>

      {(aviso || d.error) && (
        <div className="banner" role="alert">
          {aviso ?? `No se pudieron leer tus datos: ${d.error}`}
          {aviso && <button className="linkbtn" onClick={() => setAviso(null)}>Cerrar</button>}
        </div>
      )}

      <Resumen
        mes={mes} mesHoy={mesHoy} hoy={hoy} r={r} sueldo={d.config.sueldo} inicial={d.inicial}
        onInicial={(v) => acc.guardarInicial(mes, v)}
      />

      <div className="grid">
        <div className="col">
          <Anotar fechaDefecto={fechaDefecto} mesVisible={mes} onGuardar={(m) => acc.agregarMov(m)} />
          <Medidores r={r} config={d.config} mes={mes} mesHoy={mesHoy} hoy={hoy} />
          <Movimientos movs={d.movs} onBorrar={(id) => acc.borrarMov(id)} />
        </div>
        <div className="col">
          <CuentasMes
            r={r} pagos={d.pagos}
            onPago={(f, cambio) => acc.guardarPago(mes, f.id, d.pagos[f.id], cambio)}
          />
          <Creditos fijos={d.fijos} mesHoy={mesHoy} />
          <Proyeccion desde={mesBase} mesVisible={mes} config={d.config} fijos={d.fijos} />
        </div>
      </div>

      <Ajustes user={user} config={d.config} fijos={d.fijos} acc={acc} />
    </div>
  )
}

function EstadoSync({ enLinea, pendientes }: { enLinea: boolean; pendientes: boolean }) {
  if (!enLinea)
    return <span className="pill warn" title="Lo que anotes se guarda en este equipo y se sube al volver la conexión">Sin conexión · guardando aquí</span>
  if (pendientes) return <span className="pill">Subiendo cambios…</span>
  return <span className="pill ok">Sincronizado</span>
}

interface ResumenProps {
  mes: string
  mesHoy: string
  hoy: Date
  r: ReturnType<typeof resumirMes>
  sueldo: number
  inicial: number | null
  onInicial: (v: number | null) => void
}

function Resumen({ mes, mesHoy, hoy, r, sueldo, inicial, onInicial }: ResumenProps) {
  const [texto, setTexto] = useState('')
  const [editando, setEditando] = useState(false)
  useEffect(() => { if (!editando) setTexto(inicial != null ? formatoMiles(inicial) : '') }, [inicial, editando])

  const dim = diasDelMes(mes)
  const libre = Math.max(0, r.disponible)
  let porDia: React.ReactNode
  if (mes === mesHoy) {
    const quedan = dim - hoy.getDate() + 1
    porDia = <><span className="num">{clp(libre / quedan)}</span> por día · quedan {quedan} día{quedan > 1 ? 's' : ''}</>
  } else if (mes > mesHoy) {
    porDia = <>Parte el 1 de {MESES[Number(mes.slice(5)) - 1]}: <span className="num">{clp(libre / dim)}</span> por día si nada cambia</>
  } else {
    porDia = <>Cerraste el mes con <span className="num">{clp(r.disponible)}</span> {r.disponible >= 0 ? 'a favor' : 'en contra'}</>
  }

  const guardar = () => {
    setEditando(false)
    const t = texto.trim()
    const v = t ? parseMonto(t) : null
    if (v !== inicial) onInicial(v)
  }

  return (
    <section className="hero" aria-label="Resumen del mes">
      <div>
        <div className="label">Te queda disponible este mes</div>
        <div className={`big${r.disponible < 0 ? ' neg' : ''}`}>{clp(r.disponible)}</div>
        <div className="perday">{porDia}</div>
        <label className="inicial">
          <span className="label">Saldo con que partiste el mes</span>
          <span className="inicial-row">
            <span>$</span>
            <input
              id="fInicial" inputMode="numeric" autoComplete="off"
              placeholder={formatoMiles(sueldo - r.descPlanilla)}
              value={texto}
              onFocus={() => setEditando(true)}
              onChange={(e) => setTexto(formatoMiles(parseMonto(e.target.value)))}
              onBlur={guardar}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
            />
          </span>
          <span className="muted small">
            {inicial != null
              ? 'Monto real que ingresaste. Bórralo para usar el sueldo de Ajustes.'
              : `Sin dato: se usa el sueldo de ${clp(sueldo)}${r.descPlanilla ? ` menos ${clp(r.descPlanilla)} de descuento por planilla` : ''}.`}
          </span>
        </label>
      </div>
      <div className="stats">
        <div className="stat"><span className="label">Ingresos</span><span className="v">{clp(r.totalIngresos)}</span></div>
        <div className="stat"><span className="label">Fijos y créditos</span><span className="v">{clp(r.compromisos)}</span></div>
        <div className="stat"><span className="label">Gastos del día a día</span><span className="v">{clp(r.gastoVar)}</span></div>
        <div className="stat"><span className="label">Ahorrado</span><span className="v">{clp(r.ahorro)}</span></div>
      </div>
    </section>
  )
}
