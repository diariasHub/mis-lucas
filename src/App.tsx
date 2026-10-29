import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth, entrarConGoogle } from './firebase'
import { firebaseConfigurado } from './firebaseConfig'
import Panel from './components/Panel'

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!auth) return
    // Firebase recuerda la sesión en el dispositivo, así que esto también
    // funciona sin internet una vez que entraste la primera vez.
    return onAuthStateChanged(auth, setUser)
  }, [])

  if (!firebaseConfigurado) {
    return (
      <main className="centro">
        <h1>Mis Lucas</h1>
        <p className="muted">
          Falta la configuración de Firebase. Completa <code>src/firebaseConfig.ts</code> con los
          datos de tu proyecto y vuelve a publicar.
        </p>
      </main>
    )
  }

  if (user === undefined) {
    return <main className="centro"><p className="muted">Cargando…</p></main>
  }

  if (!user) {
    return (
      <main className="centro">
        <h1>Mis Lucas</h1>
        <p className="muted">Tu control de gastos. Funciona en el teléfono y en el computador, con o sin internet.</p>
        <button
          className="btn"
          onClick={() => {
            setError(null)
            entrarConGoogle().catch((e) => setError((e as Error).message))
          }}
        >
          Entrar con Google
        </button>
        {error && <p className="error">{error}</p>}
        {!navigator.onLine && (
          <p className="muted small">La primera vez necesitas internet para entrar. Después funciona sin conexión.</p>
        )}
      </main>
    )
  }

  return <Panel user={user} />
}
