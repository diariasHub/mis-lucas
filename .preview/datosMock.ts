import { CONFIG_DEFAULT } from '/home/claude/proj/mis-lucas/src/types'
const fijos = [
  { id: 'agua', nombre: 'Agua', monto: 14000, tipo: 'cuenta', nroCliente: '207558', orden: 1, portal: 'https://example.com', usuario: '12.345.678-9' },
  { id: 'luz', nombre: 'Luz', monto: 18000, tipo: 'cuenta', orden: 2 },
  { id: 'be', nombre: 'BancoEstado consumo', monto: 135281, tipo: 'credito', fin: '2028-02', dia: 5, orden: 6 },
  { id: 'cons', nombre: 'Crédito Consorcio', monto: 157057, tipo: 'credito', fin: '2027-10', dia: 25, orden: 7 },
  { id: 'cop', nombre: 'Copeuch (descuento por planilla)', monto: 109863, tipo: 'credito', inicio: '2026-11', fin: '2027-10', planilla: true, orden: 10 },
]
export function useDatos() {
  return { cargando: false, config: { ...CONFIG_DEFAULT, inicio: '2026-11' }, fijos,
    movs: [{ id: 'm1', tipo: 'gasto', cat: 'cafe', monto: 2500, fecha: '2026-11-03', mes: '2026-11', nota: 'café uni' },
           { id: 'm2', tipo: 'gasto', cat: 'super', monto: 32450, fecha: '2026-11-04', mes: '2026-11' }],
    pagos: { agua: { mes: '2026-11', fijoId: 'agua', pagado: true, monto: 12330 } }, inicial: 633428, pendientes: false, error: null }
}
export const acciones = () => new Proxy({}, { get: () => () => {} })
export const alErrorDeEscritura = () => {}
export const exportarRespaldo = async () => ({})
export const importarRespaldo = async () => 0
