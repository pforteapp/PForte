# Generar el APK de Android

PForte es la app web de `src/` empaquetada con Capacitor 8.5.3. `android/` es la
plantilla de Capacitor sin cambios en el código nativo.

## Generar

```bash
npm install
npm run android:apk
```

Compila la web, la copia a `android/app/src/main/assets/public` y corre Gradle.
Al final imprime la ruta del archivo:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Hay que repetirlo después de **cualquier** cambio en la web: el APK lleva dentro
una copia de `dist/`.

## Requisitos

| Qué | Versión | Nota |
| --- | --- | --- |
| Node | 22 o más | |
| Android Studio y su SDK | | Trae `adb` en `Sdk/platform-tools`, que no queda en el PATH |
| JDK | **21** | Gradle 8.14.3 no corre sobre Java 25 |
| Plataforma Android 36, build-tools 35 | | Gradle las baja solo si las licencias están aceptadas |

## Preparar una máquina nueva

**1. Instalar el JDK 21.**

```powershell
winget install --id Microsoft.OpenJDK.21 -e
```

Si la máquina ya usa otro JDK: **el instalador cambia `JAVA_HOME` de máquina y
pone el 21 de primero en el PATH**. Hay que devolverlos a mano; el build no
necesita ninguno de los dos cambios. `android/gradle/gradle-daemon-jvm.properties`
pide el 21 solo para este proyecto.

**2. Decirle a Gradle dónde está ese JDK.** No detecta solo el de Microsoft.
Agregar esto a `~/.gradle/gradle.properties`, con la ruta real. Solo suma una
ruta candidata; no obliga a ningún otro proyecto a usar el 21:

```properties
org.gradle.java.installations.paths=C:/Program Files/Microsoft/jdk-21.0.13.21-hotspot
```

**3. Decirle a Gradle dónde está el SDK.** Crear `android/local.properties`
(git lo ignora), con barras normales, o definir `ANDROID_HOME`:

```properties
sdk.dir=C:/Users/<usuario>/AppData/Local/Android/Sdk
```

**4. Solo en Windows con Smart App Control activo.** Windows bloquea el
`aapt2.exe` que baja Gradle porque no está firmado. Usar el del SDK, también en
`~/.gradle/gradle.properties`:

```properties
android.aapt2FromMavenOverride=C:/Users/<usuario>/AppData/Local/Android/Sdk/build-tools/36.0.0/aapt2.exe
```

Si se actualizan las build-tools, hay que cambiar ese número.

## Instalar el APK

Con el teléfono conectado por USB o por Wi-Fi (ver `docs/PRUEBA-ANDROID.md`):

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

`-r` reemplaza la versión anterior. Si no hay `adb`, se puede pasar el `.apk` al
teléfono y abrirlo desde Archivos; Android va a pedir permiso para instalar apps
de esa fuente.

## Errores conocidos

| Mensaje | Causa | Arreglo |
| --- | --- | --- |
| `Unable to download toolchain matching the requirements ({languageVersion=21…` | Gradle no encuentra un JDK 21 | Instalarlo y hacer el paso 2 |
| `SDK location not found` | Gradle no sabe dónde está el SDK | Paso 3 |
| `aapt2.exe` bloqueado o que no arranca | Smart App Control | Paso 4 |
| El `.bat` falla de formas raras en un clon nuevo | `gradlew.bat` quedó con fin de línea LF | `.gitattributes` lo fija en CRLF; volver a sacar el archivo con `git checkout` |

## Versiones fijadas

Capacitor va en versión exacta, igual que OSMD: `android/` se generó para la
8.5.3. Subirlo es un cambio aparte, que hay que probar otra vez en un teléfono.
