import { describe, expect, it } from 'vitest'
import { proyeccion, resumirMes } from './calculo'
import { CONFIG_DEFAULT, type Fijo, type Movimiento, type Pago } from '../types'

const fijos: Fijo[] = [
  { id: 'agua', nombre: 'Agua', monto: 14000, tipo: 'cuenta' },
  { id: 'luz', nombre: 'Luz', monto: 18000, tipo: 'cuenta' },
  { id: 'internet', nombre: 'Internet', monto: 14990, tipo: 'cuenta' },
  { id: 'telefono', nombre: 'Teléfono', monto: 25980, tipo: 'cuenta' },
  { id: 'tag', nombre: 'TAG', monto: 20000, tipo: 'cuenta' },
  { id: 'be', nombre: 'BancoEstado', monto: 135281, tipo: 'credito', fin: '2028-02' },
  { id: 'consorcio', nombre: 'Consorcio', monto: 157057, tipo: 'credito', fin: '2027-10' },
  { id: 'falabella', nombre: 'Falabella', monto: 36363, tipo: 'credito', fin: '2028-08' },
  { id: 'ml', nombre: 'Mercado Libre', monto: 11987, tipo: 'credito', fin: '2026-11' },
  { id: 'copeuch', nombre: 'Copeuch', monto: 109863, tipo: 'credito', inicio: '2026-11', fin: '2027-10', planilla: true },
  { id: 'cae', nombre: 'CAE', monto: 18550, tipo: 'credito', fin: '2050-08' },
]

const pagos: Record<string, Pago> = {
  agua: { mes: '2026-11', fijoId: 'agua', monto: 12330, pagado: true },
  luz: { mes: '2026-11', fijoId: 'luz', monto: 27281, pagado: true },
  tag: { mes: '2026-11', fijoId: 'tag', monto: 29300, pagado: true },
  cae: { mes: '2026-11', fijoId: 'cae', monto: 0 },
}

describe('resumirMes', () => {
  it('cuadra noviembre 2026: saldo inicial menos pagos, sin restar planilla', () => {
    const r = resumirMes('2026-11', CONFIG_DEFAULT, fijos, [], pagos, 633428)
    expect(r.compromisos).toBe(450569)
    expect(r.descPlanilla).toBe(109863)
    expect(r.disponible).toBe(182859)
  })

  it('sin saldo inicial usa sueldo menos planilla', () => {
    const r = resumirMes('2026-11', CONFIG_DEFAULT, fijos, [], pagos, null)
    expect(r.base).toBe(773000 - 109863)
  })

  it('resta gastos y ahorro, suma ingresos y separa hormiga y extra', () => {
    const movs: Movimiento[] = [
      { id: '1', tipo: 'gasto', cat: 'cafe', monto: 2000, fecha: '2026-11-03', mes: '2026-11' },
      { id: '2', tipo: 'gasto', cat: 'super', monto: 30000, fecha: '2026-11-04', mes: '2026-11' },
      { id: '3', tipo: 'ingreso', cat: 'tens', monto: 40000, fecha: '2026-11-05', mes: '2026-11' },
      { id: '4', tipo: 'ingreso', cat: 'bono', monto: 100000, fecha: '2026-11-06', mes: '2026-11' },
      { id: '5', tipo: 'ahorro', cat: 'cuenta', monto: 10000, fecha: '2026-11-07', mes: '2026-11' },
    ]
    const r = resumirMes('2026-11', CONFIG_DEFAULT, fijos, movs, pagos, 633428)
    expect(r.hormigaTotal).toBe(2000)
    expect(r.extra).toBe(40000)
    expect(r.disponible).toBe(182859 - 32000 + 140000 - 10000)
  })

  it('ignora cuotas que ya terminaron', () => {
    const r = resumirMes('2026-12', CONFIG_DEFAULT, fijos, [], {}, null)
    expect(r.fijos.find((f) => f.id === 'ml')).toBeUndefined()
  })
})

describe('proyeccion', () => {
  it('libera la cuota de Consorcio y Copeuch desde noviembre 2027', () => {
    const p = proyeccion('2027-10', 2, CONFIG_DEFAULT, fijos)
    expect(p[1].libre - p[0].libre).toBe(157057 + 109863)
  })
})
