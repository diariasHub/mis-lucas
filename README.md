# Mis Lucas

Control mensual de gastos personales: cuentas fijas, créditos, gastos hormiga, ahorro e ingresos extra.
Es una PWA instalable que funciona **sin internet** en el teléfono y en el computador, y sincroniza
los cambios cuando vuelve la conexión.

## Funcionalidades

- Registro rápido de gastos, ingresos y ahorro por categoría
- Cuentas fijas y créditos que se repiten cada mes, con checklist de pago y monto editable por mes
- Descuentos por planilla (no se restan del saldo, porque ya vienen descontados del sueldo)
- Medidor de gastos hormiga contra un límite mensual
- Seguimiento de cuotas restantes y proyección de dinero libre a 14 meses
- Respaldo e importación en JSON
- Modo sin conexión con sincronización automática (caché persistente de Firestore)

## Tecnologías

React 19 · TypeScript · Vite · Firebase Authentication (Google) · Cloud Firestore · vite-plugin-pwa (Workbox) · Vitest · GitHub Actions + GitHub Pages

## Arquitectura

```
src/
├── lib/            lógica pura: cálculo del mes, proyección, formato CLP, categorías (con pruebas)
├── data/datos.ts   lectura en tiempo real y escrituras sin bloqueo para funcionar offline
├── components/     interfaz: resumen, registro, cuentas, créditos, proyección, ajustes
└── firebase.ts     inicialización con caché local persistente
```

Los datos de cada usuario viven en `users/{uid}/…` y las reglas de Firestore (`firestore.rules`)
solo permiten acceso a su dueño.

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm test         # pruebas
npm run build    # compilación de producción
```

Completa `src/firebaseConfig.ts` con la configuración web de tu proyecto de Firebase.

## Publicación

Cada push a `main` ejecuta las pruebas, compila y publica en GitHub Pages
(`.github/workflows/deploy.yml`).
