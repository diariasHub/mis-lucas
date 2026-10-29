import { useEffect, useState } from 'react'

export function useEnLinea() {
  const [enLinea, setEnLinea] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setEnLinea(true)
    const off = () => setEnLinea(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return enLinea
}

/** Fecha de hoy que se actualiza si la app queda abierta pasada la medianoche */
export function useHoy() {
  const [hoy, setHoy] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setHoy(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])
  return hoy
}
