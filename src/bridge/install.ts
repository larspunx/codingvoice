/**
 * Rejestracja hooków w Cursorze.
 *
 * Dwa problemy do rozwiązania:
 *
 * 1. **Czym odpalić hooka.** `~/.cursor/hooks.json` przechowuje polecenie powłoki. Na Windows nie ma
 *    `bash`, a Node nie musi być w `PATH` — nie wolno niczego zakładać o środowisku użytkownika.
 *    Dlatego generujemy launcher pod bieżący system, wskazujący na runtime, który NA PEWNO istnieje:
 *    binarkę samego Cursora uruchomioną w trybie Node (`ELECTRON_RUN_AS_NODE=1`).
 *
 * 2. **Cudze hooki.** `hooks.json` to plik użytkownika — mogą tam siedzieć wpisy innych wtyczek
 *    albo ręczne. Scalamy: usuwamy wyłącznie własne wpisy (rozpoznawane po ścieżce do naszego
 *    katalogu stanu) i dopisujemy aktualne. Reszta zostaje nietknięta.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import {
  hookScriptPath,
  launcherPath,
  legacyStateDir,
  logFile,
  stateDir,
  type HookEvent,
} from '../shared/paths.js'

const hooksFile = path.join(os.homedir(), '.cursor', 'hooks.json')

/** Panel Claude Code ma własny plik hooków, o którym Cursor nic nie wie. Bez wpisu tutaj wtyczka
 *  milczy w tym panelu — a to w nim toczy się większość rozmów. */
const claudeSettingsFile = path.join(os.homedir(), '.claude', 'settings.json')

/** `afterAgentResponse` tylko buforuje — musi wrócić natychmiast, bo blokuje turę agenta. */
const CAPTURE_TIMEOUT_S = 5
/** `stop` przenosi plik i tyle; mówienie dzieje się już w rozszerzeniu, po zwróceniu sterowania. */
const SPEAK_TIMEOUT_S = 5

interface HookEntry {
  command: string
  timeout?: number
}

interface HooksFile {
  version?: number
  hooks?: Record<string, HookEntry[]>
  [key: string]: unknown
}

/**
 * Odkłada `dist/hook.js` do katalogu stanu i zwraca ścieżkę do kopii — patrz `hookScriptPath`.
 * Gdy kopiowanie padnie, wracamy do pliku w rozszerzeniu: gorzej, ale wciąż działa do najbliższej
 * aktualizacji, a to lepsze niż hook, którego nie ma wcale.
 */
function stageHookScript(extensionPath: string): string {
  const source = path.join(extensionPath, 'dist', 'hook.js')
  try {
    fs.mkdirSync(stateDir, { recursive: true })
    fs.copyFileSync(source, hookScriptPath)
    return hookScriptPath
  } catch {
    return source
  }
}

function writeLauncher(event: HookEvent, runtime: string, hookScript: string): string {
  const target = launcherPath(event)
  // Brak skryptu ubijał hooka, zanim ten zdążył cokolwiek zapisać — cisza wtyczki wyglądała wtedy
  // identycznie jak wyłączone czytanie. Launcher sprawdza to sam i zostawia ślad w logu.
  // Kończymy zerem: awaria czytania nie ma prawa wywrócić tury agenta.
  const body =
    process.platform === 'win32'
      ? [
          '@echo off',
          `if not exist "${hookScript}" (`,
          `  echo launcher: brak "${hookScript}" - hook nie wystartowal>>"${logFile}"`,
          '  exit /b 0',
          ')',
          'set ELECTRON_RUN_AS_NODE=1',
          `"${runtime}" "${hookScript}" ${event}`,
          '',
        ].join('\r\n')
      : [
          '#!/bin/sh',
          '# Generowane przez rozszerzenie Coding Voice — ręczne zmiany zostaną nadpisane.',
          `if [ ! -f "${hookScript}" ]; then`,
          `  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) launcher: brak ${hookScript} — hook nie wystartował" >> "${logFile}"`,
          '  exit 0',
          'fi',
          `ELECTRON_RUN_AS_NODE=1 exec "${runtime}" "${hookScript}" ${event}`,
          '',
        ].join('\n')

  fs.mkdirSync(stateDir, { recursive: true })
  fs.writeFileSync(target, body, 'utf8')
  if (process.platform !== 'win32') fs.chmodSync(target, 0o755)
  return target
}

function readHooksFile(): HooksFile {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(hooksFile, 'utf8'))
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as HooksFile
    }
  } catch {
    // Brak pliku albo niepoprawny JSON. W obu wypadkach startujemy od pustego — ale przy
    // niepoprawnym JSON-ie robimy kopię, żeby użytkownik nie stracił swoich wpisów bezpowrotnie.
    if (fs.existsSync(hooksFile)) {
      try {
        fs.copyFileSync(hooksFile, `${hooksFile}.broken-backup`)
      } catch {
        /* nic więcej nie zrobimy */
      }
    }
  }
  return {}
}

/** Nasze wpisy rozpoznajemy po ścieżce do katalogu stanu — nie po nazwie zdarzenia,
 *  bo użytkownik mógł mieć własny hook na tym samym zdarzeniu. Wpisy spod starej nazwy
 *  też są nasze: mają zniknąć, a nie zostać uszanowane jako cudze. */
function isOurs(entry: HookEntry): boolean {
  if (typeof entry.command !== 'string') return false
  return entry.command.includes(stateDir) || entry.command.includes(legacyStateDir)
}

/** Katalog stanu sprzed zmiany nazwy. Launchery już wyrejestrowane z `hooks.json`, więc zostaje
 *  tylko usunąć pliki — inaczej zostawiamy użytkownikowi martwy katalog na zawsze. */
function removeLegacyState(): void {
  try {
    fs.rmSync(legacyStateDir, { recursive: true, force: true })
  } catch {
    // Brak uprawnień albo katalog w użyciu — nie jest to powód, żeby przerywać instalację hooków.
  }
}

/* ------------------------------- Claude Code ------------------------------- */

/** Kształt `~/.claude/settings.json` — interesuje nas wyłącznie gałąź `hooks.Stop`, reszta
 *  (uprawnienia, model, klucze) przechodzi przez nas nietknięta. */
interface ClaudeCommandHook {
  type?: string
  command?: string
  timeout?: number
}
interface ClaudeMatcherGroup {
  matcher?: string
  hooks?: ClaudeCommandHook[]
}
interface ClaudeSettings {
  hooks?: Record<string, ClaudeMatcherGroup[]>
  [key: string]: unknown
}

/**
 * Podpięcie się pod zdarzenie `Stop` panelu Claude Code.
 *
 * Ten plik należy do użytkownika i trzymają się w nim rzeczy, których strata boli bardziej niż
 * milczenie wtyczki — uprawnienia, model, konfiguracja innych hooków. Dlatego przy niepoprawnym
 * JSON-ie **nie** startujemy od pustego obiektu (tak robimy w `hooks.json` Cursora, który jest
 * nasz do spółki z paroma wtyczkami) tylko odpuszczamy i zostawiamy plik w spokoju.
 */
function installClaudeCodeHook(runtime: string, hookScript: string): boolean {
  const launcher = writeLauncher('claude', runtime, hookScript)

  let config: ClaudeSettings = {}
  if (fs.existsSync(claudeSettingsFile)) {
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(claudeSettingsFile, 'utf8'))
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false
      config = parsed as ClaudeSettings
    } catch {
      return false
    }
  }

  const hooks = { ...(config.hooks ?? {}) }
  const before = JSON.stringify(hooks)

  // Nasz wpis idzie w osobnej grupie bez `matcher`, więc czyszczenie sprowadza się do wyrzucenia
  // grup, w których zostałaby sama nasza komenda.
  const foreign = (hooks['Stop'] ?? [])
    .map((group) => ({
      ...group,
      hooks: (group.hooks ?? []).filter(
        (entry) =>
          typeof entry.command !== 'string' ||
          !(entry.command.includes(stateDir) || entry.command.includes(legacyStateDir)),
      ),
    }))
    .filter((group) => (group.hooks ?? []).length > 0)

  hooks['Stop'] = [
    ...foreign,
    { hooks: [{ type: 'command', command: launcher, timeout: SPEAK_TIMEOUT_S }] },
  ]

  if (JSON.stringify(hooks) === before) return false

  const next: ClaudeSettings = { ...config, hooks }
  fs.mkdirSync(path.dirname(claudeSettingsFile), { recursive: true })
  const tmp = `${claudeSettingsFile}.tmp`
  fs.writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
  fs.renameSync(tmp, claudeSettingsFile)
  return true
}

function uninstallClaudeCodeHook(): void {
  if (!fs.existsSync(claudeSettingsFile)) return
  let config: ClaudeSettings
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(claudeSettingsFile, 'utf8'))
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return
    config = parsed as ClaudeSettings
  } catch {
    return
  }
  if (!config.hooks) return

  const hooks: Record<string, ClaudeMatcherGroup[]> = {}
  for (const [event, groups] of Object.entries(config.hooks)) {
    const kept = groups
      .map((group) => ({
        ...group,
        hooks: (group.hooks ?? []).filter(
          (entry) =>
            typeof entry.command !== 'string' ||
            !(entry.command.includes(stateDir) || entry.command.includes(legacyStateDir)),
        ),
      }))
      .filter((group) => (group.hooks ?? []).length > 0)
    if (kept.length > 0) hooks[event] = kept
  }

  const tmp = `${claudeSettingsFile}.tmp`
  fs.writeFileSync(tmp, `${JSON.stringify({ ...config, hooks }, null, 2)}\n`, 'utf8')
  fs.renameSync(tmp, claudeSettingsFile)
}

export interface InstallResult {
  changed: boolean
  hooksFile: string
}

/**
 * @param extensionPath katalog rozszerzenia — stamtąd bierzemy zbudowany `dist/hook.js`
 * @param runtime       binarka do uruchomienia hooka; domyślnie proces hosta rozszerzeń (Electron)
 */
export function installHooks(extensionPath: string, runtime = process.execPath): InstallResult {
  const hookScript = stageHookScript(extensionPath)
  const capture = writeLauncher('capture', runtime, hookScript)
  const speak = writeLauncher('speak', runtime, hookScript)

  // Niepowodzenie po stronie Claude Code nie może wywrócić rejestracji hooków Cursora
  // i odwrotnie — to dwa niezależne czaty i każdy ma działać sam z siebie.
  const claudeChanged = installClaudeCodeHook(runtime, hookScript)

  const config = readHooksFile()
  const hooks = { ...(config.hooks ?? {}) }
  const before = JSON.stringify(hooks)

  const keepForeign = (event: string): HookEntry[] =>
    (hooks[event] ?? []).filter((entry) => !isOurs(entry))

  hooks['afterAgentResponse'] = [
    ...keepForeign('afterAgentResponse'),
    { command: capture, timeout: CAPTURE_TIMEOUT_S },
  ]
  hooks['stop'] = [...keepForeign('stop'), { command: speak, timeout: SPEAK_TIMEOUT_S }]

  // Sprzątanie po starej nazwie robimy zawsze, nie tylko gdy `hooks.json` się zmienił: przy drugim
  // uruchomieniu wpisy są już aktualne, a katalog mógłby zostać na dysku bez końca.
  removeLegacyState()

  if (JSON.stringify(hooks) === before) return { changed: claudeChanged, hooksFile }

  const next: HooksFile = { ...config, version: config.version ?? 1, hooks }
  fs.mkdirSync(path.dirname(hooksFile), { recursive: true })
  // Zapis przez plik tymczasowy: Cursor czyta `hooks.json` w dowolnym momencie i nie może
  // trafić na wersję w połowie zapisu.
  const tmp = `${hooksFile}.tmp`
  fs.writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
  fs.renameSync(tmp, hooksFile)
  return { changed: true, hooksFile }
}

/** Wypisanie się z hooków — zostawia cudze wpisy nietknięte. Używane przy „wyłącz na stałe".
 *  Sprząta po obu czatach; inaczej po odinstalowaniu wtyczki Claude Code odpalałby przy każdej
 *  turze skrypt wskazujący na nieistniejący katalog. */
export function uninstallHooks(): void {
  uninstallClaudeCodeHook()
  const config = readHooksFile()
  if (!config.hooks) return
  const hooks: Record<string, HookEntry[]> = {}
  for (const [event, entries] of Object.entries(config.hooks)) {
    const foreign = entries.filter((entry) => !isOurs(entry))
    if (foreign.length > 0) hooks[event] = foreign
  }
  const tmp = `${hooksFile}.tmp`
  fs.writeFileSync(tmp, `${JSON.stringify({ ...config, hooks }, null, 2)}\n`, 'utf8')
  fs.renameSync(tmp, hooksFile)
}
