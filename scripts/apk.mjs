// ============================================================================
// scripts/apk.mjs — Genera el APK de debug con el Gradle de android/ e imprime
// dónde quedó. Se llama desde `npm run android:apk`, que antes compila la web y
// la copia al proyecto nativo. Pasos y requisitos: docs/ANDROID.md.
// ============================================================================

import { spawnSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ANDROID = fileURLToPath(new URL('../android/', import.meta.url));
const APK = join(ANDROID, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const enWindows = process.platform === 'win32';

// shell: en Windows un .bat no se puede lanzar directo desde Node. El `.\` es
// necesario: cmd no siempre busca en la carpeta actual.
const comando = `${enWindows ? '.\\gradlew.bat' : './gradlew'} assembleDebug`;
const r = spawnSync(comando, { cwd: ANDROID, stdio: 'inherit', shell: true });
if (r.status !== 0) {
  console.error(`\nGradle falló (código ${r.status}). Errores conocidos: docs/ANDROID.md.`);
  process.exit(r.status ?? 1);
}

const megas = (statSync(APK).size / 1024 / 1024).toFixed(1);
console.log(`\nAPK de debug (${megas} MB):\n${APK}`);
