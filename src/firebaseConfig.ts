// Configuración web de Firebase. Estos valores son públicos (identifican el
// proyecto, no dan acceso): la seguridad la ponen las reglas de Firestore.
// Reemplázalos con los de tu proyecto: Consola de Firebase → Configuración
// del proyecto → Tus apps → App web.
export const firebaseConfig = {
  apiKey: 'AIzaSyAEQjIrAlAqPqWPExBpieBXfEKlyXKra0Y',
  authDomain: 'mis-lucas-7ae35.firebaseapp.com',
  projectId: 'mis-lucas-7ae35',
  storageBucket: 'mis-lucas-7ae35.firebasestorage.app',
  messagingSenderId: '1031814090424',
  appId: '1:1031814090424:web:db96583fc3fba8baff6e4d',
}

export const firebaseConfigurado = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
