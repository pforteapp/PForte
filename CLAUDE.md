# PForte

Entrenador de lectura a primera vista al piano. El ejercicio oculta cada compás
justo cuando toca tocarlo, para forzar la anticipación visual; las notas entran
por MIDI y se comparan contra la partitura.

App web empaquetada con Capacitor para Android. iOS después.

Somos dos: Juan (código) y Julián (profesor de piano, pedagogía y pruebas con
alumnos).

## Repositorios

- Este repo es el producto: `JuanDMalaverO/PForte`
- El prototipo verificado vive aparte: `JuanDMalaverO/PForte-Prototype`. De ahí
  salen los módulos del núcleo. **Se portan, no se regeneran** — ese código ya
  está medido y sus rarezas están documentadas en los `docs/` de aquel repo.

## Comandos

```bash
npm run dev      # servidor de desarrollo (Vite)
npm run build    # tsc -b && vite build
npm run check    # tsc -b && node scripts/verificar.mjs  ← la puerta de cada tarea
npm run lint     # oxlint
node scripts/verificar-sesion.mjs   # el JSON de sesión, campo por campo
```

Los dos scripts de verificación levantan su propio servidor de Vite (no hace
falta `npm run dev` aparte) y tocan el ejercicio con el teclado de PC en
Chromium. La primera vez: `npx playwright install chromium`. Las capturas y el
informe quedan en `docs/resultados/` (ignorado por git).

El ejercicio que tocan sale de `src/generador.ts` (Nivel 1, semilla 1) a través
de `scripts/ejercicio-prueba.mjs`. Los `.mxl` de `tests/fixtures/` solo
existen para probar que `partitura.ts` lee repertorio real; no son contenido.

## Antes de dar algo por terminado

Corre `npm run check` y muestra la salida. No basta con que compile: `tsc -b`
pasa con las máscaras corridas y con el metrónomo derivando.

Para cambios visuales, una captura y mirarla.

## Reglas del dominio

No se deducen leyendo el código y romperlas no produce ningún error:

- **El único reloj es `audioContext.currentTime`.** Nunca `Date.now()` ni
  `setInterval` para nada que se compare contra la música. El metrónomo agenda
  los pulsos por adelantado en el hardware de audio; agendar y sonar son dos
  instantes distintos.
- **Los compases se tapan, no se borran.** Borrarlos obliga a OSMD a redibujar,
  la partitura se recoloca y salta bajo los ojos del que está leyendo.
- **IMPORTANTE: la geometría de las máscaras depende de `unitInPixels` de OSMD,
  una constante interna (10) que no es API pública.** En el código es
  `PIXELES_POR_UNIDAD` en `src/partitura.ts`, y por eso OSMD está fijado en
  `2.1.2` exacto en `package.json`. Si cambia, las máscaras se corren en
  silencio: sin excepción y sin error en consola. Cualquier cambio que toque
  posiciones de compás, o que suba la versión de OSMD, se verifica con una
  captura, no con tests.
- **El comparador trabaja con multiconjuntos, no con conjuntos.** Dos Do
  escritos y un Do tocado es un error; un `Set` lo daría por correcto.
- **Un ejercicio de lectura a primera vista se consume al usarlo.** Una vez que
  el alumno vio la pieza, ya no está leyendo a primera vista. Por eso el
  contenido se genera (`generador.ts`); no hay biblioteca de repertorio.
- **Los niveles de dificultad los define Julián, no el código.** Si falta ese
  criterio, pregúntame — no lo inventes.

## Restricciones del producto

- **MIDI es la única vía de entrada.** El micrófono tiene un piso de latencia de
  ~2 s con basic-pitch: sirve para evaluar después de tocar, no durante. No
  prometas detección en tiempo real por micrófono en ninguna pantalla ni texto.
- **No se vende en Estados Unidos.** La patente US 9,767,704 (Johns Hopkins,
  vigente hasta oct 2033) cubre el mecanismo y solo aplica allá.
- **Web MIDI no existe en Firefox ni Safari.** En Android se usa a través del
  WebView de Capacitor, y eso está sin verificar: es justo lo que prueba el
  Hito 1.

## Diseño

El sistema visual ya existe (paleta en oklch, Bricolage Grotesque, pantallas de
onboarding, home, lección, resultado, perfil). **No se diseñan pantallas
nuevas**: se aplica el lenguaje que ya está hecho. Pídemelo si lo necesitas.

## Convenciones

- Archivos, funciones y variables en español; el código de librerías queda como
  viene.
- Los módulos de lógica pura (`comparador.ts`, `generador.ts`) no importan
  React ni tocan el DOM. `partitura.ts` tampoco importa React, pero toca el DOM
  a propósito: es dueño de OSMD y pone las tapas de los compases.
- Los seis módulos del núcleo (`metronomo`, `partitura`, `comparador`,
  `generador`, `midi`, `sesion`) llegaron idénticos desde el prototipo. Si se
  cambian, que sea a propósito y con `npm run check` antes y después.
- Mensajes de commit en español, en imperativo.

## Cómo trabajamos

- **Un hito a la vez**, según `docs/HITOS.md`. No empieces el siguiente
  sin que yo cierre el anterior.
- Modo plan antes de escribir código en cualquier tarea que toque más de un
  archivo.
- Soy estudiante de cuarto semestre y quiero entender este código, no solo
  tenerlo. Cuando tomes una decisión que no sea obvia, explícame por qué en una
  frase en el momento, no al final.
- Si se te ocurre una función que no está en el hito actual, dímela en una línea
  y sigue. No la construyas.

## Fuera de alcance por ahora

Cuentas y servidor entran en el Hito 5; racha, XP y nivel en el Hito 4, y en
local. Ligas, logros, misiones, escaneo de partituras, entrenador por voz,
micrófono dentro del producto, iOS y pagos: después del Hito 6. Están
diseñados y van a entrar, pero no antes de que cinco alumnos usen el núcleo.
