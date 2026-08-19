/**
 * Silnik systemowy — darmowy, offline, bez klucza API. To jest wersja, którą dostaje każdy,
 * kto zainstaluje wtyczkę, i to ona decyduje o pierwszym wrażeniu.
 *
 * Trzy platformy, trzy zupełnie różne mechanizmy:
 *   macOS   — `say`, głosy dobierane po nazwie z listy dostępnych w systemie
 *   Windows — System.Speech przez PowerShell, głos dobierany po płci i kulturze
 *   Linux   — `spd-say` (speech-dispatcher), a gdy go nie ma — `espeak-ng`
 *
 * Wspólny kontrakt: `speak()` kończy się dopiero, gdy fragment przestał brzmieć, a `signal`
 * przerywa go natychmiast. Cała reszta wtyczki nie musi wiedzieć, na czym stoi.
 */
import { execFile, spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { promisify } from 'node:util'
import { stateDir } from '../shared/paths.js'
import type { SpeakOptions, SpeechEngine } from './types.js'

const execFileAsync = promisify(execFile)

/** Głosy w kolejności preferencji. Nazwy są weryfikowane wobec tego, co system faktycznie ma —
 *  lista to życzenie, nie założenie. */
const MACOS_VOICES: Record<string, string[]> = {
  'pl:female': ['Zosia', 'Ewa'],
  'pl:male': ['Krzysztof', 'Marek'],
  'en:female': ['Samantha', 'Ava', 'Allison', 'Serena', 'Karen'],
  'en:male': ['Alex', 'Daniel', 'Tom', 'Fred'],
}

function killTree(child: { pid?: number; kill: (signal?: NodeJS.Signals) => boolean }): void {
  if (process.platform === 'win32' && child.pid !== undefined) {
    // PowerShell odpala syntezator w procesie potomnym — samo zabicie powłoki zostawiłoby mowę.
    execFile('taskkill', ['/pid', String(child.pid), '/T', '/F'], () => undefined)
    return
  }
  child.kill('SIGTERM')
}

/** Wspólny przebieg: odpal proces, poczekaj aż zamilknie, przerwij na `signal`. */
function run(
  command: string,
  args: string[],
  signal: AbortSignal,
  stdin?: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return resolve()
    const child = spawn(command, args, { stdio: [stdin === undefined ? 'ignore' : 'pipe', 'ignore', 'pipe'] })
    let stderr = ''
    child.stderr?.on('data', (d: Buffer) => {
      stderr += d.toString()
    })

    const onAbort = (): void => killTree(child)
    signal.addEventListener('abort', onAbort, { once: true })

    const done = (fn: () => void): void => {
      signal.removeEventListener('abort', onAbort)
      fn()
    }

    child.on('error', (error) => done(() => reject(error)))
    child.on('close', (code) => {
      // Przerwanie to nie awaria — użytkownik nacisnął pauzę albo przyszła nowa tura.
      if (signal.aborted || code === 0 || code === null) return done(resolve)
      done(() => reject(new Error(`${command} zakończył się kodem ${String(code)}: ${stderr.trim()}`)))
    })

    if (stdin !== undefined) {
      child.stdin?.on('error', () => undefined) // proces mógł już zniknąć — to nie jest błąd
      child.stdin?.end(stdin, 'utf8')
    }
  })
}

async function hasBinary(name: string): Promise<boolean> {
  const probe = process.platform === 'win32' ? 'where' : 'which'
  try {
    await execFileAsync(probe, [name])
    return true
  } catch {
    return false
  }
}

/* ---------------------------------- macOS ---------------------------------- */

let macVoiceCache: Map<string, string[]> | undefined

/** Lista głosów zainstalowanych w systemie, pogrupowana po języku. Pobierana raz —
 *  użytkownik nie doinstalowuje głosów w trakcie sesji, a `say -v ?` trwa ~100 ms. */
async function macVoices(): Promise<Map<string, string[]>> {
  if (macVoiceCache) return macVoiceCache
  const byLanguage = new Map<string, string[]>()
  try {
    const { stdout } = await execFileAsync('/usr/bin/say', ['-v', '?'])
    for (const line of stdout.split('\n')) {
      const match = /^(.+?)\s{2,}([a-z]{2})[_-]([A-Z]{2})/.exec(line)
      if (!match) continue
      const [, name, language] = match
      if (!name || !language) continue
      const list = byLanguage.get(language) ?? []
      list.push(name.trim())
      byLanguage.set(language, list)
    }
  } catch {
    // Brak listy nie jest końcem świata — `say` bez `-v` użyje głosu systemowego.
  }
  macVoiceCache = byLanguage
  return byLanguage
}

/**
 * `say` traktuje `[[...]]` jako polecenie sterujące, jeśli zawartość parsuje się na znane polecenie
 * (`volm`, `rate`, `slnc`…) — takie miejsce znika z wypowiedzi i przestawia syntezator na resztę
 * fragmentu. Zwykły podwójny nawias, na przykład link wiki, jest czytany normalnie; sprawdzone.
 *
 * Zostaje więc wąski, ale realny przypadek: odpowiedź, w której agent cytuje polecenia mowy —
 * choćby tłumacząc działanie tego właśnie kodu. Rozsunięcie nawiasów kasuje sekwencję,
 * a dla ucha nie zmienia nic.
 */
function escapeMacCommands(text: string): string {
  return text.replace(/\[\[/g, '[ [')
}

async function pickMacVoice(options: SpeakOptions): Promise<string | undefined> {
  const installed = await macVoices()
  const available = installed.get(options.language) ?? []
  const other: 'female' | 'male' = options.voice === 'male' ? 'female' : 'male'

  const exact = (MACOS_VOICES[`${options.language}:${options.voice}`] ?? []).find((name) =>
    available.includes(name),
  )
  if (exact) return exact

  // Nie ma głosu żądanej płci w tym języku — typowy przypadek to polski męski, który na macOS
  // wymaga doinstalowania głosu premium. Właściwy język w niewłaściwej płci jest lepszy niż
  // odwrotnie: obcy akcent psuje zrozumiałość bardziej niż płeć lektora.
  const fallback = (MACOS_VOICES[`${options.language}:${other}`] ?? []).find((name) =>
    available.includes(name),
  )
  if (fallback) return fallback

  // Świadomie NIE bierzemy pierwszego lepszego z listy systemowej: macOS trzyma tam obok
  // lektorów głosy-zabawki („Bad News", „Bubbles", „Cellos"), które śpiewają zamiast czytać.
  // Brak wyboru oznacza „użyj głosu domyślnego systemu" — to zawsze jest normalny lektor.
  return undefined
}

/* --------------------------------- Windows --------------------------------- */

/**
 * Skrypt generujemy na dysk zamiast wklejać go w `-Command`: tekst do przeczytania idzie osobnym
 * plikiem, więc żaden cudzysłów, apostrof ani znak nowej linii w odpowiedzi agenta nie ma szansy
 * wpłynąć na to, co PowerShell wykona.
 */
const POWERSHELL_SCRIPT = `param([string]$TextPath, [string]$Culture, [string]$Gender, [int]$Rate, [int]$Volume)
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = $Rate
$synth.Volume = $Volume
try {
  $culture = New-Object System.Globalization.CultureInfo($Culture)
  $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::$Gender, [System.Speech.Synthesis.VoiceAge]::Adult, 0, $culture)
} catch {
  # Brak głosu w tej kulturze lub płci — zostaje głos domyślny systemu.
}
$text = [System.IO.File]::ReadAllText($TextPath, [System.Text.Encoding]::UTF8)
$synth.Speak($text)
`

function windowsScriptPath(): string {
  const target = path.join(stateDir, 'speak.ps1')
  // Nadpisujemy bezwarunkowo: skrypt jest generowany, a nie edytowany przez użytkownika,
  // i po aktualizacji wtyczki musi odpowiadać nowej wersji kodu.
  fs.mkdirSync(stateDir, { recursive: true })
  fs.writeFileSync(target, POWERSHELL_SCRIPT, 'utf8')
  return target
}

/* ---------------------------------- Linux ---------------------------------- */

async function linuxCommand(text: string, options: SpeakOptions): Promise<[string, string[]]> {
  const rate = Math.round((options.rate - 1) * 50) // spd-say: -100..100
  if (await hasBinary('spd-say')) {
    const voiceType = options.voice === 'male' ? 'male1' : 'female1'
    // spd-say też liczy głośność w -100..100, gdzie 0 to poziom domyślny. Pełna głośność u nas
    // ma znaczyć „nic nie zmieniaj", więc 1 mapujemy na 0, a 0 na -100.
    const volume = Math.round((options.volume - 1) * 100)
    // `-w` = czekaj do końca wypowiedzi; bez tego proces kończy się natychmiast i pauza nie ma
    // czego przerwać. `--` chroni tekst zaczynający się od myślnika przed zjedzeniem jako flaga.
    return [
      'spd-say',
      ['-w', '-l', options.language, '-t', voiceType, '-r', String(rate), '-i', String(volume), '--', text],
    ]
  }
  const variant = options.voice === 'male' ? '+m3' : '+f3'
  const speed = Math.round(175 * options.rate)
  // espeak-ng: amplituda 0–200, domyślnie 100 — pełna głośność u nas to właśnie tamta domyślna.
  const amplitude = Math.round(100 * options.volume)
  return [
    'espeak-ng',
    ['-v', `${options.language}${variant}`, '-s', String(speed), '-a', String(amplitude), '--stdin'],
  ]
}

/* --------------------------------- silnik ---------------------------------- */

export const systemEngine: SpeechEngine = {
  id: 'system',

  async isAvailable(): Promise<boolean> {
    if (process.platform === 'darwin') return fs.existsSync('/usr/bin/say')
    if (process.platform === 'win32') return hasBinary('powershell')
    return (await hasBinary('spd-say')) || (await hasBinary('espeak-ng'))
  },

  async speak(text: string, options: SpeakOptions, signal: AbortSignal): Promise<void> {
    if (process.platform === 'darwin') {
      const voice = await pickMacVoice(options)
      const args = ['-r', String(Math.round(190 * options.rate))]
      if (voice) args.push('-v', voice)
      // Tekst przez stdin (`-f -`), nie jako argument: odpowiedź agenta potrafi mieć każdy znak,
      // a limit długości argumentu jest twardy.
      args.push('-f', '-')
      const content = escapeMacCommands(text)

      // Pełna głośność: gramy na żywo, zero opóźnienia — nie ma czego skalować.
      if (options.volume >= 1) {
        return run('/usr/bin/say', args, signal, content)
      }

      // Ciszej niż 100%: osadzone `[[volm ...]]` macOS przy renderze IGNORUJE (sprawdzone —
      // nawet `volm 0.0` nie daje ciszy), więc głośność systemowego głosu w ogóle nie działała.
      // Renderujemy więc fragment do pliku i gramy go przez `afplay -v`, którego `-v` to realny
      // mnożnik głośności TEGO strumienia (0 = cisza, 1 = poziom pliku). Systemu i innych aplikacji
      // to nie rusza. Koszt: fragment musi się najpierw wyrenderować — ale tylko wtedy, gdy ktoś
      // faktycznie ściszył głos.
      fs.mkdirSync(stateDir, { recursive: true })
      const clip = path.join(stateDir, `say-${Date.now()}-${Math.random().toString(36).slice(2)}.aiff`)
      try {
        await run('/usr/bin/say', [...args, '-o', clip], signal, content)
        if (signal.aborted) return
        await run('/usr/bin/afplay', ['-v', options.volume.toFixed(3), clip], signal)
      } finally {
        fs.rm(clip, { force: true }, () => undefined)
      }
      return
    }

    if (process.platform === 'win32') {
      const textFile = path.join(stateDir, 'utterance.txt')
      fs.writeFileSync(textFile, text, 'utf8')
      const rate = Math.max(-10, Math.min(10, Math.round((options.rate - 1) * 10)))
      const culture = options.language === 'pl' ? 'pl-PL' : 'en-US'
      const gender = options.voice === 'male' ? 'Male' : 'Female'
      return run(
        'powershell',
        [
          '-NoProfile',
          '-NonInteractive',
          '-ExecutionPolicy', 'Bypass',
          '-File', windowsScriptPath(),
          '-TextPath', textFile,
          '-Culture', culture,
          '-Gender', gender,
          '-Rate', String(rate),
          // System.Speech liczy głośność w procentach — nasze 0–1 mapuje się wprost.
          '-Volume', String(Math.round(options.volume * 100)),
        ],
        signal,
      )
    }

    const [command, args] = await linuxCommand(text, options)
    return run(command, args, signal, command === 'espeak-ng' ? text : undefined)
  },
}

/**
 * Rozgrzanie cache'u głosów przy starcie rozszerzenia.
 *
 * `say -v ?` na typowym macOS wypisuje ~180 głosów i trwa około 1,8 s. Bez tego cały ten czas
 * doliczyłby się do PIERWSZEJ odpowiedzi w sesji — czyli dokładnie do momentu, w którym
 * użytkownik ocenia, czy wtyczka działa. Start rozszerzenia ma na to całe minuty zapasu.
 */
export function warmUp(): void {
  if (process.platform !== 'darwin') return
  void macVoices().catch(() => undefined)
}

/** Nazwy głosów dostępnych dla danego języka — do pokazania w ustawieniach. Pusta lista
 *  oznacza „system zdecyduje", a nie „nie zadziała". */
export async function listSystemVoices(language: string): Promise<string[]> {
  if (process.platform !== 'darwin') return []
  return (await macVoices()).get(language) ?? []
}
