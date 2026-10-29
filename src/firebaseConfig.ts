// Configuración web de Firebase. Estos valores son públicos (identifican el
// proyecto, no dan acceso): la seguridad la ponen las reglas de Firestore.
// Reemplázalos con los de tu proyecto: Consola de Firebase → Configuración
// del proyecto → Tus apps → App web.
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
}

export const firebaseConfigurado = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
