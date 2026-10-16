// ============================================================================
// scripts/verificar.mjs — Prueba automática del ejercicio en Chromium con
// Playwright. No es parte del producto: es la puerta de `npm run check`.
//
// Qué hace:
//   1. Abre la app, espera a que OSMD dibuje y verifica que extrajo las mismas
//      notas que escribió el generador (y que son las que este script va a tocar).
//   2. Activa el "teclado de PC de prueba", arranca el metrónomo a 120 bpm y
//      "toca" el ejercicio completo presionando teclas en el pulso exacto.
//      Al final espera todas las notas correctas (salvo 2) y 8 compases ocultos.
//      Además mide CUÁNDO aparece cada tapa, contra dos puertas: la deriva
//      (reloj de audio) y el jitter (planificador del navegador); ver abajo.
//      Eso es "compases desapareciendo al ritmo" y "metrónomo sin deriva",
//      que tsc no puede ver.
//   3. Genera ejercicios de los 3 niveles y verifica el chequeo cruzado.
//      Carga además dos piezas de repertorio real (.mxl, en tests/fixtures/)
//      directo con partitura.ts, sin pasar por la pantalla, y mide su dificultad.
//
// Sale con código 1 si falla cualquier paso o si hubo errores en la consola.
//
// Uso: `npm run check` (levanta su propio servidor de Vite).
//      URL=http://localhost:5173/ usa un servidor que ya esté corriendo.
//      HEADED=1 abre una ventana real.
// ============================================================================

import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
// El ejercicio y cómo tocarlo viven en un solo lugar (lo comparte verificar-sesion.mjs).
import { BPM, MS_POR_PULSO, NOTAS, NUM_COMPASES, PULSOS_POR_COMPAS, tocarPieza } from './ejercicio-prueba.mjs';
import { levantarServidor } from './servidor.mjs';

const SALIDA = fileURLToPath(new URL('../docs/resultados/', import.meta.url));
const FIXTURES = fileURLToPath(new URL('../tests/fixtures/', import.meta.url));
mkdirSync(SALIDA, { recursive: true });

// Dos puertas distintas, porque miden dos problemas distintos:
//
// DERIVA — el reloj de audio. El metrónomo agenda cada click en el reloj del
// AudioContext; si eso estuviera mal, el error se ACUMULA y la última tapa
// llega cada vez más lejos de donde debía. Se mide de la primera a la última
// tapa (7 compases, 14 s a 120 bpm). En 20 corridas: peor caso 14,2 ms. Se
// probó ±15 y quedaba al borde; 20 es el mínimo estable. Ojo: los instantes de
// la primera y la última tapa traen su propio jitter, así que esta cifra
// incluye hasta dos veces el jitter de los extremos, no solo deriva.
const TOLERANCIA_DERIVA_MS = 20;
//
// JITTER — el planificador del navegador. Cada pulso avisa a la pantalla con
// un setTimeout apuntado al instante del click, y el hilo principal a veces lo
// suelta unos ms tarde. Es ruido por pulso, no se acumula. Se mide como el
// máximo desvío click→pantalla y el peor intervalo entre dos tapas. Techo:
// peor caso de 20 corridas (32 ms click→pantalla; 16,5 ms entre tapas) + un
// cuadro de 60 Hz (16,7 ms) = 48,7, redondeado a 50.
const TECHO_JITTER_MS = 50;

const servidor = await levantarServidor();
const navegador = await chromium.launch({
  headless: process.env.HEADED !== '1',
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 900 } });
const erroresConsola = [];
pagina.on('console', (m) => { if (m.type() === 'error') erroresConsola.push(m.text()); });
pagina.on('pageerror', (e) => erroresConsola.push(`pageerror: ${e.message}`));

const informe = {};
const fallos = [];
const paso = (n, ok, detalle) => {
  informe[n] = { ok, detalle };
  if (!ok) fallos.push(n);
  console.log(`${ok ? 'OK ' : 'FALLA'} ${n}: ${detalle}`);
};

try {
// --- 1. carga y extracción ------------------------------------------------------
await pagina.goto(servidor.url);
await pagina.waitForSelector('#chequeo:has-text("generador")', { timeout: 30000 });
const chequeo = (await pagina.textContent('#chequeo')).trim();
const extraidas = Number(/las mismas (\d+) notas/.exec(chequeo)?.[1]);
paso('1-carga', chequeo.includes('OK') && extraidas === NOTAS.length,
  `${chequeo} (este script va a tocar ${NOTAS.length})`);
await pagina.screenshot({ path: `${SALIDA}01-partitura.png`, fullPage: true });

// --- 2. tocar la pieza con el teclado de prueba ---------------------------------
await pagina.check('input[type=checkbox]');
await pagina.fill('input[type=number] >> nth=0', String(BPM));
// Anotar el instante (reloj de la página) en que aparece cada tapa.
await pagina.evaluate(() => {
  window.__tapas = [];
  new MutationObserver((cambios) => {
    for (const c of cambios) {
      for (const nodo of c.addedNodes) {
        if (nodo.classList?.contains('tapa')) window.__tapas.push({ compas: Number(nodo.dataset.compas), ms: performance.now() });
      }
    }
  }).observe(document.querySelector('#partitura'), { childList: true });
});
await tocarPieza(pagina);
await pagina.waitForSelector('#estado:has-text("terminado")', { timeout: 15000 });
await pagina.screenshot({ path: `${SALIDA}02-final.png`, fullPage: true });
const tapas = await pagina.locator('.tapa').count();
const dibujadas = await pagina.locator('#partitura svg').count();
const filaTotal = await pagina.locator('#tabla-resultados tr:has(th:text("total"))').textContent();
const correctas = Number((await pagina.locator('#tabla-resultados tr:has(th:text("total")) th').nth(2).textContent()).trim());
paso('2-tocar-pieza', correctas >= NOTAS.length - 2 && tapas === NUM_COMPASES && dibujadas === 1,
  `correctas ${correctas}/${NOTAS.length}, compases ocultos ${tapas}, partituras dibujadas ${dibujadas}, fila total: ${filaTotal.replace(/\s+/g, ' ').trim()}`);

// Ritmo de las tapas: una cada compás, sin deriva acumulada.
const tiemposTapas = (await pagina.evaluate(() => window.__tapas)).sort((a, b) => a.compas - b.compas);
const msPorCompas = PULSOS_POR_COMPAS * MS_POR_PULSO;
const intervalos = tiemposTapas.slice(1).map((t, i) => t.ms - tiemposTapas[i].ms);
const peorIntervalo = Math.max(...intervalos.map((x) => Math.abs(x - msPorCompas)));
const tramoTotal = tiemposTapas.at(-1).ms - tiemposTapas[0].ms;
const derivaTotal = tramoTotal - (NUM_COMPASES - 1) * msPorCompas;
informe['2-ritmo-tapas'] = { intervalosMs: intervalos.map((x) => Math.round(x * 10) / 10), derivaTotalMs: Math.round(derivaTotal * 10) / 10 };
paso('2-deriva', tiemposTapas.length === NUM_COMPASES && Math.abs(derivaTotal) <= TOLERANCIA_DERIVA_MS,
  `${tiemposTapas.length} tapas; primera→última ${tramoTotal.toFixed(1)} ms de ${(NUM_COMPASES - 1) * msPorCompas} esperados ` +
  `(deriva ${derivaTotal.toFixed(1)} ms); tolerancia ±${TOLERANCIA_DERIVA_MS} ms`);

const textoTabla = await pagina.locator('#tabla-resultados').textContent();
const desvio = /desvío click→pantalla: media ([\d.]+) ms, máx ([\d.]+) ms \((\d+) pulsos\)/.exec(textoTabla);
paso('2-jitter', desvio !== null && Number(desvio[2]) <= TECHO_JITTER_MS && peorIntervalo <= TECHO_JITTER_MS,
  desvio
    ? `${desvio[0]}; peor intervalo entre tapas ${peorIntervalo.toFixed(1)} ms de ${msPorCompas}; techo ${TECHO_JITTER_MS} ms`
    : 'la tabla no trae el desvío del metrónomo');
const registro = await pagina.locator('.caja .mono div').allTextContents();
informe['2-registro'] = registro;
const desvios = registro.map((l) => /\(([-+]\d+) ms\)/.exec(l)?.[1]).filter(Boolean).map(Number);
if (desvios.length) {
  const abs = desvios.map(Math.abs);
  informe['2-desvio-notas'] = { n: abs.length, mediaAbsMs: Math.round(abs.reduce((a, b) => a + b, 0) / abs.length), maxAbsMs: Math.max(...abs) };
  console.log('      desvío tecla→pulso esperado:', JSON.stringify(informe['2-desvio-notas']));
}

// --- 3. generador y repertorio -----------------------------------------------------
// Los controles de esta sección van plegados (el alumno no los necesita ver).
await pagina.locator('details').evaluateAll((lista) => lista.forEach((d) => { d.open = true; }));
const niveles = await pagina.locator('select option').allTextContents();
for (const [i, nivel] of niveles.entries()) {
  await pagina.selectOption('select', { label: nivel });
  await pagina.click('#btn-generar');
  // El chequeo del nivel 1 ya está en pantalla desde el paso 1: hay que esperar
  // a que la recarga termine, no solo a que aparezca el texto.
  await pagina.waitForSelector(`#chequeo:has-text("${nivel}")`, { timeout: 15000 });
  await pagina.waitForSelector('#estado:has-text("listo")', { timeout: 15000 });
  const texto = (await pagina.textContent('#chequeo')).trim();
  const dif = (await pagina.textContent('#dificultad')).trim();
  paso(`3-generador-nivel-${i + 1}`, texto.includes('OK'), `${texto} | ${dif}`);
  await pagina.screenshot({ path: `${SALIDA}03-generado-nivel${i + 1}.png`, fullPage: true });
}
// El repertorio no está en el producto (el contenido se genera), pero partitura.ts
// sí sabe leer .mxl: se prueba importándolo directo en la página.
for (const archivo of ['Bach_Minuet_in_G_BWV_Anh114.mxl', 'Satie_Gymnopedie_1.mxl']) {
  const bytes = [...readFileSync(`${FIXTURES}${archivo}`)];
  const r = await pagina.evaluate(async (bytes) => {
    const { Partitura } = await import('/src/partitura.ts');
    const { medirDificultad } = await import('/src/generador.ts');
    const div = document.createElement('div');
    div.id = 'fixture';
    div.style.position = 'relative';
    document.body.appendChild(div);
    const p = await Partitura.cargar(div, new Blob([new Uint8Array(bytes)]));
    const notas = p.notasEsperadas();
    return { compases: p.numCompases, notas: notas.length, dificultad: medirDificultad(notas, p.numCompases) };
  }, bytes);
  await pagina.locator('#fixture').screenshot({ path: `${SALIDA}03-repertorio-${archivo}.png` });
  await pagina.evaluate(() => document.querySelector('#fixture')?.remove());
  const d = r.dificultad;
  paso(`3-repertorio-${archivo}`, r.compases > 0 && r.notas > 0,
    `cargado: ${r.compases} compases, ${r.notas} notas extraídas | ${d.notasPorCompas} notas/compás · salto medio ${d.saltoMedioSemitonos} semitonos · ` +
    `ámbito ${d.ambitoSemitonos} semitonos · ${d.figurasDistintas} figuras distintas · máx ${d.notasSimultaneasMax} notas simultáneas`);
}
} catch (e) {
  paso('excepción', false, e.stack ?? String(e));
} finally {
  informe.erroresConsola = erroresConsola;
  console.log(erroresConsola.length ? `Errores de consola:\n${erroresConsola.join('\n')}` : 'Sin errores de consola.');
  if (erroresConsola.length) fallos.push('errores de consola');
  writeFileSync(`${SALIDA}verificacion.json`, JSON.stringify(informe, null, 2));
  await navegador.close();
  await servidor.cerrar();
}

console.log(fallos.length === 0 ? '\nVERIFICADO.' : `\n${fallos.length} FALLAS: ${fallos.join(', ')}`);
process.exit(fallos.length === 0 ? 0 : 1);
