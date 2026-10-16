// ============================================================================
// scripts/ejercicio-prueba.mjs — El ejercicio que tocan los scripts de prueba,
// y cómo tocarlo con el teclado de la PC.
//
// Reemplaza a pieza-fija.mjs del prototipo: en vez de una pieza transcrita a
// mano, las notas salen de src/generador.ts, el mismo módulo que usa la app.
// Node importa el .ts directamente (borra los tipos; por eso el tsconfig
// exige `erasableSyntaxOnly`).
//
// Es el Nivel 1 con semilla 1, que es lo que la app carga al abrir. Solo ese
// nivel se puede tocar desde acá: el teclado de prueba no tiene teclas negras,
// y los niveles 2 y 3 están en Sol y Fa mayor.
// ============================================================================

import { NIVELES, generarEjercicio } from '../src/generador.ts';

export const NIVEL = Object.keys(NIVELES)[0];
export const SEMILLA = 1;

/** Cada entrada es [nota MIDI, pulso desde el inicio]. */
export const NOTAS = generarEjercicio({ ...NIVELES[NIVEL], semilla: SEMILLA }).notas.map((n) => [n.midi, n.pulso]);

/** Qué tecla de la PC produce cada nota MIDI (ver `activarTecladoDePrueba`). */
export const TECLA = {
  60: 'a', 62: 's', 64: 'd', 65: 'f', 67: 'g', 69: 'h', 71: 'j', 72: 'k',
  48: 'z', 50: 'x', 52: 'c', 53: 'v', 55: 'b', 57: 'n', 59: 'm',
  41: 'q', 43: 'w', 45: 'e', 47: 'r',
};

const sinTecla = NOTAS.filter(([midi]) => !(midi in TECLA));
if (sinTecla.length) {
  throw new Error(`El ejercicio de prueba tiene notas que el teclado de PC no puede tocar: ${sinTecla.map(([m]) => m).join(', ')}`);
}

export const BPM = 120;
export const MS_POR_PULSO = 60000 / BPM;
export const PULSOS_POR_COMPAS = 4;
export const NUM_COMPASES = NIVELES[NIVEL].compases;

/**
 * "Toca" la pieza en la página: espera el pulso 0 (fin de la cuenta de
 * entrada) leyendo el reloj de la propia página, y después presiona cada
 * tecla en su pulso. Las notas simultáneas se presionan juntas.
 *
 * `opciones.omitir(midi, pulso)` → true para saltear esa nota (simula que el
 * alumno no la tocó). `opciones.agregar` son notas de más, como [[midi, pulso]].
 */
export async function tocarPieza(pagina, opciones = {}) {
  const { omitir = () => false, agregar = [] } = opciones;
  await pagina.evaluate(() => {
    window.__pulso0 = null;
    new MutationObserver(() => {
      if (window.__pulso0 === null && document.body.innerText.includes('compás 1, pulso 1')) {
        window.__pulso0 = performance.now();
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  });
  await pagina.click('#btn-iniciar');
  let pulso0 = null;
  while (pulso0 === null) {
    await new Promise((r) => setTimeout(r, 15));
    pulso0 = await pagina.evaluate(() => window.__pulso0);
  }
  // Alinear el reloj de la página con el de este script.
  const ahora = await pagina.evaluate(() => performance.now());
  const t0 = Date.now() - (ahora - pulso0);
  const porPulso = new Map();
  for (const [midi, pulso] of NOTAS) {
    if (omitir(midi, pulso)) continue;
    porPulso.set(pulso, [...(porPulso.get(pulso) ?? []), midi]);
  }
  for (const [midi, pulso] of agregar) porPulso.set(pulso, [...(porPulso.get(pulso) ?? []), midi]);
  for (const [pulso, midis] of [...porPulso.entries()].sort((a, b) => a[0] - b[0])) {
    const espera = t0 + pulso * MS_POR_PULSO - Date.now();
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));
    for (const m of midis) await pagina.keyboard.down(TECLA[m]);
    for (const m of midis) await pagina.keyboard.up(TECLA[m]);
  }
}
