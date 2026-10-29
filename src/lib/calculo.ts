import type { Config, Fijo, Movimiento, Pago } from '../types'
import { HORMIGA } from './categorias'
import { sumarMeses } from './formato'

export const fijoActivo = (f: Fijo, mes: string) =>
  (!f.inicio || f.inicio <= mes) && (!f.fin || f.fin >= mes)

export const ordenarFijos = (a: Fijo, b: Fijo) => (a.orden ?? 99) - (b.orden ?? 99)

export interface ResumenMes {
  fijos: Fijo[]
  montoFijo: (f: Fijo) => number
  /** Lo que pagas tú (sin descuentos por planilla) */
  compromisos: number
  pagado: number
  descPlanilla: number
  /** Saldo con que partiste: el ingresado o sueldo - planilla */
  base: number
  ingresos: number
  extra: number
  gastoVar: number
  ahorro: number
  hormiga: Movimiento[]
  hormigaTotal: number
  totalIngresos: number
  disponible: number
}

const suma = (xs: { monto: number }[]) => xs.reduce((s, x) => s + (x.monto || 0), 0)

export function resumirMes(
  mes: string,
  config: Config,
  fijosTodos: Fijo[],
  movs: Movimiento[],
  pagos: Record<string, Pago>,
  inicial: number | null,
): ResumenMes {
  const fijos = fijosTodos.filter((f) => fijoActivo(f, mes)).sort(ordenarFijos)
  const montoFijo = (f: Fijo) => {
    const p = pagos[f.id]
    return p && p.monto != null ? p.monto : f.monto || 0
  }
  const normales = fijos.filter((f) => !f.planilla)
  const planilla = fijos.filter((f) => f.planilla)
  const compromisos = normales.reduce((s, f) => s + montoFijo(f), 0)
  const descPlanilla = planilla.reduce((s, f) => s + montoFijo(f), 0)
  const pagado = normales.filter((f) => pagos[f.id]?.pagado).reduce((s, f) => s + montoFijo(f), 0)

  const gastos = movs.filter((x) => x.tipo === 'gasto')
  const ingresosMov = movs.filter((x) => x.tipo === 'ingreso')
  const gastoVar = suma(gastos)
  const ingresos = suma(ingresosMov)
  const ahorro = suma(movs.filter((x) => x.tipo === 'ahorro'))
  const extra = suma(ingresosMov.filter((x) => x.cat !== 'bono'))
  const hormiga = gastos.filter((x) => HORMIGA.has(x.cat))

  const base = inicial != null ? inicial : (config.sueldo || 0) - descPlanilla
  const totalIngresos = base + ingresos
  const disponible = totalIngresos - compromisos - gastoVar - ahorro

  return {
    fijos, montoFijo, compromisos, pagado, descPlanilla, base, ingresos, extra,
    gastoVar, ahorro, hormiga, hormigaTotal: suma(hormiga), totalIngresos, disponible,
  }
}

/** Dinero libre por mes: sueldo menos todas las cuotas y cuentas (incluida planilla) */
export function proyeccion(desde: string, n: number, config: Config, fijos: Fijo[]) {
  return Array.from({ length: n }, (_, i) => {
    const mes = sumarMeses(desde, i)
    const total = fijos.filter((f) => fijoActivo(f, mes)).reduce((s, f) => s + (f.monto || 0), 0)
    return { mes, libre: (config.sueldo || 0) - total }
  })
}
