export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export const pad = (n: number) => String(n).padStart(2, '0')

/** $12.345 en formato chileno */
export const clp = (n: number | null | undefined) => {
  const v = Math.round(n ?? 0)
  return (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('es-CL')
}

/** Lee un número escrito con puntos, signos, etc. */
export const parseMonto = (s: unknown): number => {
  const v = parseInt(String(s ?? '').replace(/[^\d-]/g, ''), 10)
  return Number.isNaN(v) ? 0 : v
}

export const formatoMiles = (n: number) => (n ? n.toLocaleString('es-CL') : '')

export const mesDe = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
export const fechaDe = (d: Date) => `${mesDe(d)}-${pad(d.getDate())}`

export const sumarMeses = (m: string, k: number) => {
  let [y, mo] = m.split('-').map(Number)
  mo += k
  while (mo > 12) { mo -= 12; y++ }
  while (mo < 1) { mo += 12; y-- }
  return `${y}-${pad(mo)}`
}

export const mesesEntre = (a: string, b: string) => {
  const [y1, m1] = a.split('-').map(Number)
  const [y2, m2] = b.split('-').map(Number)
  return (y2 - y1) * 12 + (m2 - m1)
}

export const nombreMes = (m: string) => {
  const [y, mo] = m.split('-').map(Number)
  return `${MESES[mo - 1]} ${y}`
}

export const mesCorto = (m: string) => {
  const [y, mo] = m.split('-').map(Number)
  return `${MESES[mo - 1].slice(0, 3)} ${String(y).slice(2)}`
}

export const diasDelMes = (m: string) => {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo, 0).getDate()
}
