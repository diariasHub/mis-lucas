import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { firebaseConfig, firebaseConfigurado } from './firebaseConfig'

const app = firebaseConfigurado ? initializeApp(firebaseConfig) : null

/** Firestore con caché local persistente: funciona sin internet y
 *  sube los cambios pendientes cuando vuelve la conexión. */
export const db = app
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  : null

export const auth = app ? getAuth(app) : null

export async function entrarConGoogle() {
  if (!auth) return
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    await signInWithPopup(auth, provider)
  } catch (e) {
    const code = (e as { code?: string }).code ?? ''
    // Si el navegador bloquea la ventana emergente, usamos redirección
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider)
      return
    }
    if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') throw e
  }
}

export const salir = () => (auth ? signOut(auth) : Promise.resolve())
