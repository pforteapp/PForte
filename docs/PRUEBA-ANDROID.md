# Prueba de PForte en Android

La pregunta que decide el Hito 1: ¿entran las notas MIDI por USB-OTG a la app
instalada, y se puede leer la partitura en la pantalla?

Se hace en orden. Si un paso falla, ir a [Si algo falla](#si-algo-falla) antes de
seguir. Los resultados se anotan en [la tabla del final](#resultados).

## Lo que ya se sabe

| Prueba | Dónde | Resultado |
| --- | --- | --- |
| Teclado por OTG en **Chrome** | Samsung A50, Android 11, Yamaha Arius YDP-145 | Funciona: `android.software.midi` presente, teclado visto, notas en el registro |
| `requestMIDIAccess()` en el **WebView de la app** | Emulador, Android 17, WebView 145 | Resuelve sin pedir permiso; 0 entradas porque el emulador no tiene USB |
| Ejercicio completo en el WebView | Emulador, teclado de prueba | 20/20 notas, 8/8 tapas, sin errores |

**Lo que falta, y solo se prueba aquí: el WebView de la app con el teclado real.**
Chrome y el WebView comparten el código de MIDI, así que debería funcionar, pero
nadie lo ha visto todavía.

## Antes de empezar

- PC y teléfono en la misma red Wi-Fi.
- Volumen multimedia alto. Usar el parlante o audífonos de cable: los Bluetooth
  suman 150–250 ms y dañan la medición.
- No marcar "teclado de PC" en la app: solo sirve en computador.

## 1. Conectar el teléfono por Wi-Fi

El teclado ocupa el único puerto USB del teléfono. Por Wi-Fi se siguen viendo los
logs mientras está conectado.

En el teléfono: *Ajustes → Opciones de desarrollador → Depuración inalámbrica →
Vincular dispositivo con código*. Ahí aparecen una IP, un puerto y un código.

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb pair <IP>:<puerto-de-vincular>     # pide el código
& $adb connect <IP>:<puerto-de-la-pantalla-de-depuración-inalámbrica>
& $adb devices                            # debe aparecer el teléfono
```

Los dos puertos son distintos: el de vincular solo sirve para `pair`.

## 2. Instalar

```powershell
& $adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

Debe decir `Success`. Cómo generar el archivo: `docs/ANDROID.md`.

## 3. Abrir los logs, antes de que algo falle

1. Abre PForte en el teléfono.
2. En Chrome de la PC, ve a `chrome://inspect/#devices`.
3. Bajo el teléfono aparece `PForte`, con dirección `https://localhost/`. Haz clic
   en **inspect**. Se abre DevTools: la pestaña **Console** es la consola de la
   app y la pantalla se ve en vivo.

Esto solo funciona con el APK de debug. Los logs nativos van en otra terminal:

```powershell
& $adb logcat | findstr /i "capacitor chromium midi"
```

## 4. Revisar el teléfono

```powershell
& $adb shell pm list features | findstr midi              # feature:android.software.midi
& $adb shell dumpsys webviewupdate | findstr /i "Current" # versión del WebView
```

Anota la versión del WebView. Es lo que corre la app, y no es igual a la de Chrome.

## 5. Conectar el teclado

Con la app abierta y el teclado encendido, conéctalo por OTG. La app no debe
reiniciarse. Toca **Conectar MIDI**.

**Debe decir `MIDI: conectado: <nombre del teclado>`.** En la app no aparece un
aviso de permiso como en Chrome: el WebView lo concede solo.

## 6. Tocar una nota

Toca unas notas y abre **Registro de notas**, abajo. Deben aparecer como
`C4 (fuera del ejercicio)`.

**Este es el momento que decide el hito.**

## 7. Los 8 compases

Tempo 80, Ocultar 0. Ninguno de los dos se cambia. Toca **Empezar**.

El botón queda arriba de la partitura y nada baja solo: después de **Empezar**
tienes los 4 clicks de entrada (3 segundos) para deslizar hasta la partitura.
Mejor hazlo en horizontal si en vertical no alcanzas a ver lo que viene.

Mira esto:
- ¿Los compases se tapan al ritmo del click?
- ¿Las tapas cubren su compás? La primera nota de cada renglón asoma un poco;
  también pasa en escritorio.
- ¿El click suena parejo?

Al terminar, anota de la tabla **Resultado** el total y la línea `desvío
click→pantalla`. Del **Registro de notas**, copia cinco valores tipo
`correcta (+120 ms)`. Si casi todos son positivos y parecidos, eso es la latencia
de salida del teléfono: el click suena después de lo que marca el reloj.

Para medirla, en la consola de DevTools:

```js
const c = new AudioContext(); await c.resume();
setTimeout(() => console.log(c.baseLatency, c.outputLatency), 1000);
```

**No es un error:** la app dice "Sesión guardada", pero en Android no se guarda
ningún archivo. El WebView no descarga. Se arregla en el Hito 4.

## 8. La pantalla

Compara **el mismo ejercicio en las dos orientaciones**: Nivel 1, semilla 1. Es
el que carga la app al abrir. En el panel **Qué pieza se toca** no cambies ni el
nivel ni la semilla.

1. En vertical, mira la partitura y juzga. Mejor aún, toca los 8 compases.
2. Gira a horizontal. **Girar no vuelve a dibujar la partitura.** Abre **Qué pieza
   se toca** y toca **Generar y cargar**, que usa el mismo nivel y semilla.
3. Antes de juzgar, revisa que la línea bajo la partitura diga `Nivel 1 … semilla 1`
   en las dos orientaciones. Si no, estás comparando material distinto.

La pregunta: **¿se alcanzan a leer los compases que vienen mientras tocas?**

En el emulador, de tamaño parecido al A50, la partitura no cabe en ninguna de las
dos: 1143 px de alto contra 866 en vertical, 576 contra 363 en horizontal, y los
controles quedan arriba. El título también se corta en vertical. Anota si eso te
impide tocar.

Si hay una tablet, repite con la misma semilla.

## Si algo falla

| Lo que ves | Qué significa | Qué hacer |
| --- | --- | --- |
| `Este navegador no tiene Web MIDI` | El WebView no expone la API | Anotar la versión del WebView, actualizarlo en Play Store y repetir. Si sigue, **parar** |
| `acceso OK pero sin entradas` | La app no ve el teclado que Chrome sí veía | Es el fallo que busca este hito. Desconectar y conectar el teclado, volver a tocar **Conectar MIDI**. Si sigue, **parar** y copiar los logs |
| Un error con `NotAllowedError` | Se negó el permiso | Copiar el mensaje; no debería pasar |
| `conectado`, pero las notas no aparecen | Llega el dispositivo, no los mensajes | Repetir en Chrome para descartar el teclado; copiar los logs |
| La app se reinicia al conectar el teclado | Cambio de configuración de Android | Anotarlo y copiar logcat |
| No aparece en `chrome://inspect` | Se perdió `adb` | `adb devices` y repetir `adb connect`; el puerto cambia |

Para mandar los logs: en DevTools, clic derecho en Console → *Save as…*. Y logcat:

```powershell
& $adb logcat -d > logcat.txt
```

Si MIDI no funciona en la app pero sí en Chrome, la salida no es seguir: es
replantear, posiblemente con un plugin nativo que lea `android.media.midi`.

## Resultados

| Dato | Valor |
| --- | --- |
| Teléfono y Android | Samsung A50, Android 11 |
| Teclado | Yamaha Arius YDP-145 |
| Versión del WebView | |
| Línea `MIDI:` tras conectar | |
| ¿Las notas llegan al registro? | |
| ¿La app se reinició al conectar? | |
| Total de los 8 compases (correctas/esperadas) | |
| ¿Se tapan al ritmo? | |
| Desvío click→pantalla (media, máx) | |
| Cinco desvíos del registro de notas | |
| `baseLatency` / `outputLatency` | |
| Vertical: ¿se leen los compases que vienen? | |
| Horizontal: ¿se leen los compases que vienen? | |
| Tablet (modelo, si hubo) | |

**Conclusión:** (¿el producto es de celular, de tablet, o hay que replantear?)
