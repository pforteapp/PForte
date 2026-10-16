// ============================================================================
// scripts/servidor.mjs — Levanta el servidor de desarrollo de Vite para que
// los scripts de prueba no dependan de tener `npm run dev` abierto aparte.
//
// Si la variable de entorno URL está definida, no levanta nada y usa esa
// dirección (sirve para probar contra un servidor que ya está corriendo).
// ============================================================================

import { fileURLToPath } from 'node:url';

/** Devuelve `{ url, cerrar }`. Llamar a `cerrar()` al terminar. */
export async function levantarServidor() {
  if (process.env.URL) return { url: process.env.URL, cerrar: async () => {} };
  const { createServer } = await import('vite');
  const servidor = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)),
    logLevel: 'error',
    server: { port: 5199, strictPort: false },
  });
  await servidor.listen();
  return { url: servidor.resolvedUrls.local[0], cerrar: () => servidor.close() };
}
