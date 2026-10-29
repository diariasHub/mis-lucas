import type { TipoMov } from '../types'

export interface Categoria {
  id: string
  nombre: string
  hormiga?: boolean
}

export const CATEGORIAS: Record<TipoMov, Categoria[]> = {
  gasto: [
    { id: 'super', nombre: 'Supermercado' },
    { id: 'bencina', nombre: 'Bencina / micro' },
    { id: 'mascotas', nombre: 'Mascotas' },
    { id: 'hogar', nombre: 'Hogar y aseo' },
    { id: 'gas', nombre: 'Gas' },
    { id: 'salud', nombre: 'Salud' },
    { id: 'estudios', nombre: 'Estudios' },
    { id: 'cafe', nombre: 'Café y snacks', hormiga: true },
    { id: 'delivery', nombre: 'Delivery / comida fuera', hormiga: true },
    { id: 'online', nombre: 'Compras online', hormiga: true },
    { id: 'salidas', nombre: 'Salidas y alcohol', hormiga: true },
    { id: 'giros', nombre: 'Giros en efectivo', hormiga: true },
    { id: 'otros', nombre: 'Otros' },
  ],
  ingreso: [
    { id: 'bono', nombre: 'Bono UV' },
    { id: 'electricidad', nombre: 'Trabajo eléctrico' },
    { id: 'web', nombre: 'Digitalizap / web' },
    { id: 'tens', nombre: 'TENS / procedimientos' },
    { id: 'clases', nombre: 'Clases / ayudantías' },
    { id: 'venta', nombre: 'Venta de algo' },
    { id: 'otroing', nombre: 'Otro ingreso' },
  ],
  ahorro: [
    { id: 'cuenta', nombre: 'Cuenta de ahorro' },
    { id: 'copeuch', nombre: 'Copeuch' },
    { id: 'fondo', nombre: 'Fondo emergencia' },
    { id: 'otroah', nombre: 'Otro' },
  ],
}

export const HORMIGA = new Set(CATEGORIAS.gasto.filter((c) => c.hormiga).map((c) => c.id))

const NOMBRES: Record<string, string> = {}
Object.values(CATEGORIAS)
  .flat()
  .forEach((c) => (NOMBRES[c.id] = c.nombre))

export const nombreCategoria = (id: string) => NOMBRES[id] ?? id
