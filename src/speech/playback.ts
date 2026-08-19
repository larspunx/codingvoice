/**
 * Odtwarzanie gotowego audio z silników chmurowych.
 *
 * Silnik systemowy sam wydaje dźwięk — `say` mówi wprost do karty dźwiękowej. Chmura zwraca
 * bajty (MP3), które ktoś musi zagrać. Tu robi to zewnętrzny odtwarzacz, po jednym na platformę,
 * z tym samym kontraktem co `speak()`: funkcja kończy się dopiero, gdy dźwięk przestał brzmieć,
 * a `signal` przerywa go natychmiast (zabiciem procesu odtwarzacza).
 *
 * Głośność wchodzi TU, na etapie odtwarzania, a nie w API — ElevenLabs nie ma parametru głośności,
 * a i tak chcemy skalować wyłącznie własny strumień, nie ruszając głośności systemu. Każdy
 * odtwarzacz liczy ją na własnej skali.
 */
import { execFile, spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { promisify } from 'node:util'
import { stateDir } from '../shared/paths.js'

const execFileAsync = promisify(execFile)

function killTree(child: { pid?: number; kill: (signal?: NodeJS.Signals) => boolean }): void {
  if (process.platform === 'win32' && child.pid !== undefined) {
    execFile('taskkill', ['/pid', String(child.pid), '/T', '/F'], () => undefined)
    return
  }
  child.kill('SIGTERM')
}

/** Odpal odtwarzacz, poczekaj aż zamilknie, przerwij na `signal`. Bliźniak `run()` z system.ts,
 *  ale trzymany osobno: tam chodzi o syntezatory, tu o odtwarzacze plików. */
function run(command: string, args: string[], signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return resolve()
    const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] })
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
      if (signal.aborted || code === 0 || code === null) return done(resolve)
      done(() => reject(new Error(`${command} zakończył się kodem ${String(code)}: ${stderr.trim()}`)))
    })
  })
}

async function hasBinary(name: string): Promise<boolean> {
  try {
    await execFileAsync('which', [name])
    return true
  } catch {
    return false
  }
}

/**
 * Odtwarzacz na Windows przez MediaPlayer (obsługuje MP3, w przeciwieństwie do SoundPlayer,
 * który bierze tylko WAV). `Play()` jest asynchroniczne i zwraca sterowanie od razu, więc bez
 * jawnego czekania na długość utworu proces PowerShella skończyłby się, zanim cokolwiek zabrzmi —
 * i zabił odtwarzanie ze sobą. Dlatego czekamy na `NaturalDuration`, a potem śpimy tyle, ile trwa.
 */
const WINDOWS_SCRIPT = `param([string]$File, [double]$Volume)
Add-Type -AssemblyName PresentationCore
$player = New-Object System.Windows.Media.MediaPlayer
$player.Volume = $Volume
$player.Open([uri]$File)
$deadline = (Get-Date).AddSeconds(5)
while (-not $player.NaturalDuration.HasTimeSpan -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 40 }
$player.Play()
if ($player.NaturalDuration.HasTimeSpan) {
  Start-Sleep -Milliseconds ([int]$player.NaturalDuration.TimeSpan.TotalMilliseconds + 250)
}
$player.Stop()
$player.Close()
`

let windowsScriptCache: string | undefined
function windowsScriptPath(): string {
  if (windowsScriptCache) return windowsScriptCache
  const target = path.join(stateDir, 'play.ps1')
  fs.mkdirSync(stateDir, { recursive: true })
  fs.writeFileSync(target, WINDOWS_SCRIPT, 'utf8')
  windowsScriptCache = target
  return target
}

/** Buduje komendę odtwarzacza dla macOS i Linuksa. Windows idzie osobną ścieżką w `playAudio`,
 *  bo MediaPlayer wymaga skryptu z jawnym czekaniem na koniec utworu. `volume` w 0–1. */
async function player(file: string, volume: number): Promise<[string, string[]]> {
  const clamped = Math.max(0, Math.min(1, volume))

  if (process.platform === 'darwin') {
    // afplay: -v to mnożnik, 1 = poziom pliku, 0 = cisza. Skaluje tylko ten dźwięk.
    return ['/usr/bin/afplay', ['-v', clamped.toFixed(3), file]]
  }

  // Linux: ffplay gra MP3 wprost i ma głośność 0–100. mpg123 jako zapas — skala 0–32768.
  if (await hasBinary('ffplay')) {
    return [
      'ffplay',
      ['-nodisp', '-autoexit', '-loglevel', 'quiet', '-volume', String(Math.round(clamped * 100)), file],
    ]
  }
  const scale = Math.round(clamped * 32768)
  return ['mpg123', ['-q', '-f', String(scale), file]]
}

/**
 * Zapisz bajty do pliku tymczasowego, zagraj, posprzątaj.
 *
 * Nazwa jest losowa, bo restart głośności potrafi na moment nałożyć nowe odtwarzanie na stare,
 * zanim tamto padnie — dwa procesy nie mogą wtedy walczyć o ten sam plik.
 */
/**
 * Zagraj gotowy plik audio z dysku (krótki sygnał „ring").
 *
 * Osobno od `playAudio`, bo tu nie ma bufora z syntezy ani sprzątania po pliku tymczasowym —
 * plik istnieje na stałe w katalogu rozszerzenia. Głośność liczona jak przy mowie: skalujemy
 * wyłącznie ten dźwięk, systemu nie ruszamy.
 */
export async function playSoundFile(file: string, volume: number, signal: AbortSignal): Promise<void> {
  if (process.platform === 'win32') {
    const script = windowsScriptPath()
    await run(
      'powershell',
      [
        '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
        '-File', script,
        '-File', file,
        '-Volume', Math.max(0, Math.min(1, volume)).toFixed(3),
      ],
      signal,
    )
    return
  }
  const [command, args] = await player(file, volume)
  await run(command, args, signal)
}

export async function playAudio(bytes: Buffer, volume: number, signal: AbortSignal): Promise<void> {
  fs.mkdirSync(stateDir, { recursive: true })
  const file = path.join(stateDir, `clip-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`)
  fs.writeFileSync(file, bytes)
  try {
    if (process.platform === 'win32') {
      // MediaPlayer bierze ścieżkę pliku z parametru skryptu, nie z argumentu MP3 dopisywanego
      // przez `player()` — na Windows plik podajemy skryptowi, nie odtwarzaczowi.
      const script = windowsScriptPath()
      await run(
        'powershell',
        [
          '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
          '-File', script,
          '-File', file,
          '-Volume', Math.max(0, Math.min(1, volume)).toFixed(3),
        ],
        signal,
      )
      return
    }
    const [command, args] = await player(file, volume)
    await run(command, args, signal)
  } finally {
    fs.rm(file, { force: true }, () => undefined)
  }
}
