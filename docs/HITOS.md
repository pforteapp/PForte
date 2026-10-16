# PForte — Hitos

Juan (código) · Julián (pedagogía y pruebas con alumnos)

## Principios

1. **Cada hito termina con algo que un alumno puede tocar.** Si un hito no
   produce eso, está mal definido.
2. **Nada de servidor hasta el Hito 5.** Cuentas, sincronización y ligas son
   plomería alrededor de un núcleo que todavía no corre en un teléfono.
3. **El diseño ya existe.** No se dibujan pantallas nuevas; se aplica el
   lenguaje visual que ya está hecho.
4. **Cada hito tiene un criterio de salida verificable.** No "quedó listo": una
   frase que se puede comprobar.

## Reglas de operación

- **Un hito a la vez.** No se empieza el siguiente sin cerrar el criterio de
  salida del anterior.
- **Si algo se ocurre en el camino**, va a la lista de hallazgos y se decide al
  cerrar el hito.
- **Si un hito se atrasa**, se replanifica a propósito y se dice en voz alta. No
  se declara terminado a medias.
- **Nada se da por hecho sin verlo correr.** Compilar no es funcionar.

---

## Hito 0 · Repo nuevo con el núcleo portado

- [ ] Crear el repo `PForte` en GitHub (el anterior queda como `PForte-Prototype`)
- [ ] Portar los seis archivos del producto, **archivo por archivo, sin
      regenerarlos**: `metronomo.ts`, `partitura.ts`, `comparador.ts`,
      `generador.ts`, `midi.ts`, `sesion.ts`
- [ ] NO portar: `pieza.ts` (pieza escrita a mano), `medicion/` (el experimento
      del micrófono), las pestañas de `App.tsx`
- [ ] Copiar el `CLAUDE.md` a la raíz y ajustar rutas
- [ ] Agregar el script que falta: `"check": "tsc -b && node scripts/verificar.mjs"`
- [ ] Portar `scripts/verificar.mjs` y `scripts/verificar-sesion.mjs`

**Criterio de salida:** `npm run check` pasa en el repo nuevo y el ejercicio
corre en Chrome de escritorio igual que antes.

## Hito 1 · Corre en Android — el hito que decide

Este hito puede matar el plan. Si falla, se replantea todo antes de invertir en
los demás.

- [ ] Montar Capacitor sobre el proyecto web
- [ ] Generar el APK e instalarlo en un celular
- [ ] Probar MIDI por USB-OTG en Android (cable + teclado)
- [ ] **La prueba de pantalla:** ¿se alcanzan a leer los compases que vienen,
      en celular? ¿Y en tablet?

**Criterio de salida:** Juan toca los 8 compases en su celular, con teclado MIDI
conectado, y los compases desaparecen al ritmo.

**Si la pantalla del celular no da:** el producto es de tablet, y eso cambia a
quién se le vende. Esa conclusión vale tanto como el éxito: se escribe y se
sigue.

**Si MIDI no funciona en Android:** parar y replantear. No seguir construyendo
encima.

## Hito 2 · La pantalla de lección de verdad

Es la única pantalla que no puede ser genérica, porque es el producto.

- [ ] Aplicar el lenguaje visual del diseño (paleta oklch, Bricolage Grotesque)
      a la pantalla del ejercicio
- [ ] Compases ocultos configurables: 0, 1, 2, 3
- [ ] Entrada suave, lo que pidieron los tres alumnos: primera corrida con 0
      compases ocultos, después sube
- [ ] Pantalla de resultado con la tabla por compás
- [ ] Quitar del onboarding la promesa de micrófono en tiempo real; en su lugar,
      conectar teclado MIDI

**Criterio de salida:** un alumno de Julián la usa 15 minutos sin que nadie le
explique nada.

## Hito 3 · Generador con niveles reales

**Depende de Julián, antes de arrancar:** una página con los criterios de
dificultad de cada nivel: ámbito de notas, saltos máximos, figuras rítmicas,
armaduras, independencia de manos y qué hay que dominar para pasar al
siguiente. Sin esa página este hito no arranca.

- [ ] Implementar los ejes de dificultad que defina Julián
- [ ] Semilla reproducible: el mismo número da el mismo ejercicio
- [ ] Al menos 3 niveles

**Criterio de salida:** el generador produce 20 ejercicios de nivel 1 y Julián
aprueba al menos 18 como material que él usaría en clase.

## Hito 4 · Progreso local

Todo en el dispositivo. Sin servidor todavía.

- [ ] Guardar cada sesión (ya existe `sesion.ts`, hay que persistirlo)
- [ ] Racha, XP y nivel, calculados en local
- [ ] Pantalla de perfil y de progreso, con el diseño que ya está

**Criterio de salida:** se cierra la app, se vuelve a abrir, y el progreso sigue
ahí.

## Hito 5 · Servidor y cuentas

Hasta aquí no se toca backend.

- [ ] API y base de datos
- [ ] Registro e inicio de sesión
- [ ] Sincronizar el progreso local contra el servidor
- [ ] **Consentimiento de acudiente si hay menores de edad** (Ley 1581 de habeas
      data en Colombia): los alumnos de piano suelen ser niños

**Criterio de salida:** se inicia sesión en dos dispositivos distintos y se ve el
mismo progreso.

## Hito 6 · Prueba con cinco alumnos

- [ ] Julián consigue cinco alumnos que no hayan visto nada
- [ ] Cada uno usa la app 20 minutos, instalada en su propio dispositivo
- [ ] La predicción se escribe antes de cada sesión, igual que en la prueba del
      prototipo
- [ ] Se comparan las cinco predicciones contra las tablas de la app

**Criterio de salida:** cinco pares escritos, y una decisión sobre qué
construir después.

---

## Fuera de alcance hasta después del Hito 6

Ligas y ranking entre usuarios · logros · misiones diarias · escaneo de
partituras · entrenador por voz · micrófono dentro del producto · iOS ·
biblioteca de repertorio · pagos.

Todo eso está diseñado y va a entrar. Pero no antes de que cinco alumnos hayan
usado el núcleo.
