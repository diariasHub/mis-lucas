export type TipoMov = 'gasto' | 'ingreso' | 'ahorro'
export type TipoFijo = 'cuenta' | 'credito' | 'hogar'

export interface Config {
  sueldo: number
  limiteHormiga: number
  metaAhorro: number
  metaExtra: number
  /** Primer mes del control, formato YYYY-MM */
  inicio?: string | null
}

export interface Fijo {
  id: string
  nombre: string
  monto: number
  tipo: TipoFijo
  /** Mes desde el que aplica (YYYY-MM) */
  inicio?: string | null
  /** Último mes / última cuota (YYYY-MM) */
  fin?: string | null
  dia?: number | null
  nroCliente?: string | null
  nota?: string | null
  portal?: string | null
  usuario?: string | null
  /** Se descuenta de la liquidación: no se resta del saldo inicial */
  planilla?: boolean
  orden?: number
}

export interface Movimiento {
  id: string
  tipo: TipoMov
  cat: string
  monto: number
  /** YYYY-MM-DD */
  fecha: string
  /** YYYY-MM */
  mes: string
  nota?: string | null
  creado?: number
}

export interface Pago {
  mes: string
  fijoId: string
  pagado?: boolean
  monto?: number | null
}

export interface MesDoc {
  mes: string
  inicial?: number | null
}

export const CONFIG_DEFAULT: Config = {
  sueldo: 773000,
  limiteHormiga: 40000,
  metaAhorro: 30000,
  metaExtra: 150000,
  inicio: null,
}
