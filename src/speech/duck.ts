/**
 * Ściszanie innych aplikacji na czas czytania (ducking) i przywracanie po nim.
 *
 * Cel: gdy lektor mówi, muzyka albo film w tle robi się cichszy, żeby podsumowanie było wyraźnie
 * słychać — a po zakończeniu wszystko wraca DOKŁADNIE do poprzedniego poziomu (zapamiętanego, nie
 * zakładanego). To jest coś innego niż `codingVoice.volume`, który skaluje wyłącznie nasz własny
 * strumień. Tu ruszamy CUDZE strumienie, więc każda platforma ma swój mechanizm i swoje granice.
 *
 * Twarde różnice między systemami (nie nasze niedoróbki, tylko API systemów):
 *   Windows — WASAPI daje głośność PER APLIKACJA (sesja audio). Ściszamy każdą sesję poza naszym
 *             odtwarzaczem TTS do zadanego poziomu i przywracamy. Obejmuje też przeglądarkę grającą
 *             YouTube. Robi dokładnie to, o co chodzi — bez żadnej konfiguracji ani uprawnień.
 *   macOS   — brak publicznego API do głośności per aplikacja. Ściszamy więc automatycznie te
 *             skryptowalne playery z rodziny iTunes (Music, TV, Spotify, Swinsian), które podają swój
 *             stan przez `sound volume` i `player state`. Ruszamy tylko te, które REALNIE grają, i
 *             wracamy do dokładnego poziomu. Każdą apkę odpalamy OSOBNYM `osascript` (patrz MAC_APPS),
 *             bo brak jednej nie może wywalić reszty. Przeglądarki (YouTube) świadomie NIE ruszamy: jedyne lewary
 *             to systemowy klawisz Play/Pause (wymaga uprawnienia Accessibility i jest ślepym togglem —
 *             mógłby WŁĄCZYĆ dźwięk) albo sterowanie kartą (wymaga per-user włączenia JS z Apple Events).
 *             Żadne nie działa „u każdego bez konfiguracji", więc dla wtyczki ze sklepu odpadają.
 *   Linux   — pominięte świadomie (użytkownik prosił o Maca i Windows); no-op.
 *
 * Moduł celowo nie zna `vscode` — child_process + pliki, jak `playback.ts`. Wszystkie wywołania
 * systemowe są best-effort z limitem czasu: awaria ściszania nie ma prawa przerwać ani opóźnić mowy.
 */
import { spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { stateDir } from '../shared/paths.js'

export interface DuckSettings {
  /** Czy w ogóle ściszać. Domyślnie wyłączone — funkcja jest opt-in. */
  enabled: boolean
  /** Docelowy poziom innych aplikacji, 0–100. */
  level: number
  /** Czas płynnego przejścia głośności (fade) w ms, w obie strony. 0 = skokowo. */
  fadeMs: number
}

export interface DuckBackend {
  /** Zapamiętaj bieżący stan innych aplikacji i ścisz je do `level` (0–100), rampą przez `fadeMs`. */
  duck(level: number, fadeMs: number): Promise<void>
  /** Przywróć zapamiętany stan, rampą przez `fadeMs`. */
  restore(fadeMs: number): Promise<void>
  /** Po starcie: posprzątaj po ewentualnym crashu w poprzedniej sesji — skokowo, bez rampy. */
  recover(): Promise<void>
}

/** Rozbicie fade na kroki. `say`/PowerShell nie zmieniają poziomu w połowie, więc rampę robimy sami:
 *  krok ~60 ms jest na tyle gęsty, że ucho słyszy płynne zjeżdżanie, a nie schodki. */
const FADE_STEP_MS = 60
function fadeSteps(fadeMs: number): { steps: number; delaySec: string } {
  const steps = Math.max(1, Math.round(fadeMs / FADE_STEP_MS))
  return { steps, delaySec: (fadeMs / 1000 / steps).toFixed(3) }
}

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n))

/** `osascript` z PEŁNĄ ścieżką: host rozszerzeń ma okrojony `PATH` i nie znajduje binarki po nazwie —
 *  ten sam powód, dla którego `playback.ts` woła `/usr/bin/afplay`, a `system.ts` `/usr/bin/say`. */
const OSASCRIPT = '/usr/bin/osascript'

/** Log diagnostyczny ściszania — jedyne okno na to, co dzieje się w hoście rozszerzeń, bo błędy są
 *  celowo połykane, żeby nie psuć mowy. Best-effort, nigdy nie rzuca. */
function log(message: string): void {
  try {
    fs.mkdirSync(stateDir, { recursive: true })
    fs.appendFileSync(path.join(stateDir, 'duck.log'), `${new Date().toISOString()} ${message}\n`)
  } catch {
    /* brak logu nie może niczego wywrócić */
  }
}

/**
 * Odpal proces, zbierz stdout, przerwij po limicie czasu.
 *
 * Best-effort: zwraca stdout przy kodzie 0, w innym razie rzuca — ale wszystkie wywołania i tak są
 * łapane wyżej, więc żaden błąd systemowy nie wychodzi poza ten moduł.
 */
function exec(command: string, args: string[], input?: string, timeoutMs = 6000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
    })
    let out = ''
    let err = ''
    child.stdout?.on('data', (d: Buffer) => {
      out += d.toString()
    })
    child.stderr?.on('data', (d: Buffer) => {
      err += d.toString()
    })
    const timer = setTimeout(() => {
      try {
        child.kill('SIGKILL')
      } catch {
        /* proces mógł już zniknąć */
      }
      reject(new Error(`${command} przekroczył limit czasu`))
    }, timeoutMs)
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0 || code === null) resolve(out)
      else reject(new Error(`${command} zakończył się kodem ${String(code)}: ${err.trim()}`))
    })
    if (input !== undefined) {
      child.stdin?.on('error', () => undefined)
      child.stdin?.end(input, 'utf8')
    }
  })
}

/* ------------------------------------- macOS ------------------------------------- */

/** Co ściszyliśmy na macOS — zrzucane na dysk, żeby przetrwać crash i dać się odtworzyć. */
interface MacState {
  /** Aplikacja → jej `sound volume` (0–100) sprzed ściszenia. */
  apps: Record<string, number>
}

const MAC_STATE_FILE = path.join(stateDir, 'duck-mac.json')

/**
 * Odtwarzacze z jednolitym `sound volume` (0–100) i `player state` w AppleScript — słownictwo rodziny
 * iTunes. Tylko takie ruszamy: znamy ich stan, więc nie ma ryzyka „ślepego" włączenia dźwięku, a
 * przywracamy dokładny poziom.
 *
 * AppleScriptem ruszamy WYŁĄCZNIE apki, które realnie działają — filtr `pgrep` w `macRunningApps`
 * (bez Apple Events, bez uprawnień, bez okien) odsiewa nieobecne, ZANIM padnie jakikolwiek `tell`.
 * To zamyka drogę do dialogu „Gdzie jest X?" (macOS pokazuje go, gdy AppleScript adresuje apkę, której
 * nie ma) i naprawia ukryte ryzyko dla Spotify u kogoś, kto go nie ma. KAŻDA działająca apka idzie potem
 * OSOBNYM `osascript` — równolegle (patrz MacBackend), więc czas to najdłuższa rampa, nie suma; osobne
 * procesy izolują też ewentualny błąd jednej apki od reszty. Podcasts NIE pasuje (brak `sound volume`/
 * `player state` w słowniku), więc nawet uruchomiony zostałby pominięty przez `try` w skrypcie.
 */
const MAC_APPS = ['Spotify', 'Music', 'TV', 'Swinsian']

/**
 * Skrypt ściszający JEDNĄ aplikację. Wchodzimy do `tell` tylko gdy działa (`is running` nie uruchamia
 * apki) i ściszamy jedynie, gdy REALNIE gra (`player state is playing`), żeby nie ruszać wyciszonej w
 * tle muzyki. Ramp od `startVol` do celu w `steps` krokach po `delaySec`, na końcu dobicie do celu
 * (zaokrąglenia nie zostawią np. 9.7 zamiast 10). `level` to PROCENT bieżącej głośności — cel liczymy
 * z `startVol` (grało 60, level=50 → cel 30); tak użytkownik myśli o ściszaniu: „przygłoś o połowę".
 * Zwraca `APP=startVol`, gdy realnie grała (do zapamiętania), inaczej pusto.
 */
function macDuckOne(app: string, level: number, steps: number, delaySec: string): string {
  return `if application "${app}" is running then
  tell application "${app}"
    try
      if player state is playing then
        set startVol to sound volume
        set target to startVol * ${level} / 100
        repeat with i from 1 to ${steps}
          set sound volume to (startVol + (target - startVol) * i / ${steps})
          delay ${delaySec}
        end repeat
        set sound volume to target
        return "${app}=" & (startVol as text)
      end if
    end try
  end tell
end if
return ""`
}

/** Przywrócenie JEDNEJ aplikacji do zapamiętanego poziomu (wartość BEZWZGLĘDNA sprzed ściszenia), rampą. */
function macRestoreOne(app: string, vol: number, steps: number, delaySec: string): string {
  return `if application "${app}" is running then
  tell application "${app}"
    try
      set startVol to sound volume
      set target to ${Math.round(vol)}
      repeat with i from 1 to ${steps}
        set sound volume to (startVol + (target - startVol) * i / ${steps})
        delay ${delaySec}
      end repeat
      set sound volume to target
    end try
  end tell
end if
return ""`
}

/** Przywrócenie JEDNEJ aplikacji skokowo (recover po crashu — bez rampy). */
function macRestoreInstantOne(app: string, vol: number): string {
  return `if application "${app}" is running then tell application "${app}" to set sound volume to ${Math.round(vol)}`
}

/**
 * Które z MAC_APPS naprawdę DZIAŁAJĄ — sprawdzane przez `pgrep`, BEZ AppleScriptu.
 *
 * To jest bramka bezpieczeństwa przeciw dialogowi „Wybierz aplikację / Gdzie jest X?": gdy AppleScript
 * adresuje apkę, której nie ma, macOS (CoreServicesUIAgent) potrafi wyświetlić okno lokalizacji i zawiesić
 * czekanie. `pgrep` to zwykły odczyt tablicy procesów — nie wysyła Apple Events, więc NIE prosi o
 * uprawnienie Automation ani nie pokazuje żadnego okna. AppleScript odpalamy potem WYŁĄCZNIE dla apek z
 * tej listy — a skoro działają, to są zainstalowane, więc `tell` się kompiluje i żaden dialog nie padnie.
 * Naprawia to też ukryte ryzyko dla Spotify u kogoś, kto go nie ma. `-x` = dokładne dopasowanie nazwy
 * procesu (= nazwa aplikacji dla naszej listy). Kod 1 z pgrep znaczy „nic nie pasuje" → pusty zbiór.
 */
async function macRunningApps(): Promise<Set<string>> {
  const pattern = MAC_APPS.map((a) => a.replace(/[^A-Za-z0-9]/g, '')).join('|')
  try {
    const out = await exec('/usr/bin/pgrep', ['-x', '-l', pattern], undefined, 3000)
    const running = new Set<string>()
    for (const line of out.split('\n')) {
      const name = line.trim().split(/\s+/)[1]
      if (name && MAC_APPS.includes(name)) running.add(name)
    }
    return running
  } catch {
    return new Set() // pgrep kończy kodem 1, gdy nic nie gra — traktujemy jak „nie ma czego ściszać"
  }
}

class MacBackend implements DuckBackend {
  async duck(level: number, fadeMs: number): Promise<void> {
    // NAJPIERW bramka `pgrep`: AppleScriptem ruszamy tylko apki, które REALNIE działają. Dzięki temu
    // nigdy nie adresujemy apki nieobecnej — a to jedyna droga do dialogu „Gdzie jest X?" (patrz
    // macRunningApps). Gdy nic nie gra, nie ma czego ściszać — zostawiamy pusty stan.
    const running = await macRunningApps()
    const targets = MAC_APPS.filter((app) => running.has(app))
    const { steps, delaySec } = fadeSteps(fadeMs)
    // Każda działająca apka osobnym procesem, RÓWNOLEGLE: nie grająca (lub tylko wyciszona) zwraca pusto
    // i jest pomijana. Czas całości ~ najdłuższa rampa, nie suma. `tell` się kompiluje, bo apka działa.
    const results = await Promise.all(
      targets.map((app) =>
        exec(OSASCRIPT, ['-e', macDuckOne(app, level, steps, delaySec)], undefined, fadeMs + 5000).catch(
          () => '',
        ),
      ),
    )
    const apps: Record<string, number> = {}
    for (const out of results) {
      const [app, value] = out.trim().split('=')
      if (app && value !== undefined && value !== '') {
        const n = Number.parseFloat(value)
        if (Number.isFinite(n)) apps[app] = n
      }
    }
    log(`mac duck level=${level} fade=${fadeMs} → ${JSON.stringify(apps)}`)
    try {
      fs.writeFileSync(MAC_STATE_FILE, JSON.stringify({ apps } satisfies MacState), 'utf8')
    } catch {
      /* brak zapisu tylko odbiera odporność na crash; samo przywracanie działa z pamięci sesji */
    }
  }

  async restore(fadeMs: number): Promise<void> {
    const state = readMacState()
    if (!state) return
    const entries = Object.entries(state.apps)
    if (entries.length > 0) {
      const { steps, delaySec } = fadeSteps(fadeMs)
      log(`mac restore fade=${fadeMs} → ${JSON.stringify(state.apps)}`)
      await Promise.all(
        entries.map(([app, vol]) =>
          exec(OSASCRIPT, ['-e', macRestoreOne(app, vol, steps, delaySec)], undefined, fadeMs + 5000).catch(
            (e) => {
              log(`mac restore ${app} FAIL ${String(e)}`)
              return ''
            },
          ),
        ),
      )
    }
    clearMacState()
  }

  async recover(): Promise<void> {
    const state = readMacState()
    if (!state) return
    const entries = Object.entries(state.apps)
    if (entries.length > 0) {
      await Promise.all(
        entries.map(([app, vol]) =>
          exec(OSASCRIPT, ['-e', macRestoreInstantOne(app, vol)]).catch(() => ''),
        ),
      )
    }
    clearMacState()
  }
}

function readMacState(): MacState | undefined {
  try {
    return JSON.parse(fs.readFileSync(MAC_STATE_FILE, 'utf8')) as MacState
  } catch {
    return undefined
  }
}

function clearMacState(): void {
  try {
    fs.rmSync(MAC_STATE_FILE, { force: true })
  } catch {
    /* nie ma czego kasować */
  }
}

/* ------------------------------------ Windows ------------------------------------ */

const WIN_STATE_FILE = path.join(stateDir, 'duck-win.json')

/**
 * Skrypt PowerShell z inline C# (WASAPI). PowerShell nie zna tych interfejsów COM, więc dokładamy je
 * przez `Add-Type`. Interfejsy okrojone do metod, których używamy — ale metody MUSZĄ zachować kolejność
 * z tablicy wirtualnej COM, więc te przed używanymi zostają jako zaślepki.
 *
 * `duck`  : zapamiętuje głośność każdej AKTYWNEJ sesji (poza naszym odtwarzaczem TTS) do pliku stanu
 *           i ścisza ją do `Level`.
 * `restore`: czyta plik stanu i przywraca głośności; sesje, które zniknęły, pomija.
 *
 * Nasz TTS na Windows gra przez PowerShell (`playback.ts`/`system.ts`) — wykluczamy więc procesy
 * `powershell`/`pwsh`, żeby nie ściszyć samego lektora.
 */
const WINDOWS_SCRIPT = `param(
  [Parameter(Mandatory=$true)][ValidateSet('duck','restore')][string]$Mode,
  [int]$Level = 10,
  [int]$Fade = 0,
  [Parameter(Mandatory=$true)][string]$State
)
$ErrorActionPreference = 'Stop'
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;

[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
class MMDeviceEnumerator { }

[ComImport, Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
  int EnumAudioEndpoints(int dataFlow, int stateMask, out IntPtr devices);
  int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice device);
}

[ComImport, Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
  int Activate(ref Guid iid, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object iface);
}

[ComImport, Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioSessionManager2 {
  int GetAudioSessionControl(IntPtr sessionGuid, int flags, out IntPtr ctl);
  int GetSimpleAudioVolume(IntPtr sessionGuid, int flags, out IntPtr vol);
  int GetSessionEnumerator(out IAudioSessionEnumerator e);
}

[ComImport, Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioSessionEnumerator {
  int GetCount(out int count);
  int GetSession(int index, out IAudioSessionControl2 session);
}

[ComImport, Guid("BFB7FF88-7239-4FC9-8FA2-07C950BE9C6D"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioSessionControl2 {
  int GetState(out int state);
  int GetDisplayName(out IntPtr name);
  int SetDisplayName([MarshalAs(UnmanagedType.LPWStr)] string name, ref Guid ctx);
  int GetIconPath(out IntPtr path);
  int SetIconPath([MarshalAs(UnmanagedType.LPWStr)] string path, ref Guid ctx);
  int GetGroupingParam(out Guid g);
  int SetGroupingParam(ref Guid g, ref Guid ctx);
  int RegisterAudioSessionNotification(IntPtr n);
  int UnregisterAudioSessionNotification(IntPtr n);
  int GetSessionIdentifier(out IntPtr id);
  int GetSessionInstanceIdentifier(out IntPtr id);
  int GetProcessId(out int pid);
}

[ComImport, Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface ISimpleAudioVolume {
  int SetMasterVolume(float level, ref Guid ctx);
  int GetMasterVolume(out float level);
  int SetMute(bool mute, ref Guid ctx);
  int GetMute(out bool mute);
}

public static class CVAudio {
  static IAudioSessionEnumerator Sessions() {
    var en = (IMMDeviceEnumerator)(new MMDeviceEnumerator());
    IMMDevice dev;
    en.GetDefaultAudioEndpoint(0, 1, out dev); // eRender, eMultimedia
    Guid iid = typeof(IAudioSessionManager2).GUID;
    object o;
    dev.Activate(ref iid, 0x17, IntPtr.Zero, out o); // CLSCTX_ALL
    var mgr = (IAudioSessionManager2)o;
    IAudioSessionEnumerator e;
    mgr.GetSessionEnumerator(out e);
    return e;
  }
  // Aktywne sesje (grające) z niezerowym PID.
  public static int[] ActivePids() {
    var e = Sessions();
    int count; e.GetCount(out count);
    var list = new List<int>();
    for (int i = 0; i < count; i++) {
      IAudioSessionControl2 ctl;
      if (e.GetSession(i, out ctl) != 0 || ctl == null) continue;
      int state; ctl.GetState(out state);
      int pid; ctl.GetProcessId(out pid);
      if (pid != 0 && state == 1) list.Add(pid); // AudioSessionStateActive
      Marshal.ReleaseComObject(ctl);
    }
    Marshal.ReleaseComObject(e);
    return list.ToArray();
  }
  static ISimpleAudioVolume VolumeFor(int pid) {
    var e = Sessions();
    int count; e.GetCount(out count);
    ISimpleAudioVolume result = null;
    for (int i = 0; i < count; i++) {
      IAudioSessionControl2 ctl;
      if (e.GetSession(i, out ctl) != 0 || ctl == null) continue;
      int cpid; ctl.GetProcessId(out cpid);
      if (cpid == pid) { result = (ISimpleAudioVolume)ctl; break; }
      Marshal.ReleaseComObject(ctl);
    }
    Marshal.ReleaseComObject(e);
    return result;
  }
  public static float GetVolume(int pid) {
    var v = VolumeFor(pid);
    if (v == null) return -1f;
    float lvl; v.GetMasterVolume(out lvl);
    Marshal.ReleaseComObject(v);
    return lvl;
  }
  public static void SetVolume(int pid, float level) {
    var v = VolumeFor(pid);
    if (v == null) return;
    Guid g = Guid.Empty;
    v.SetMasterVolume(level, ref g);
    Marshal.ReleaseComObject(v);
  }
}
"@

function Get-Steps([int]$fade) { return [Math]::Max(1, [int]($fade / 60)) }

if ($Mode -eq 'duck') {
  $exclude = @('powershell', 'pwsh')
  $saved = @{}
  foreach ($sid in [CVAudio]::ActivePids()) {
    try { $proc = Get-Process -Id $sid -ErrorAction Stop } catch { continue }
    if ($exclude -contains $proc.ProcessName) { continue }
    $vol = [CVAudio]::GetVolume($sid)
    if ($vol -lt 0) { continue }
    $saved[[string]$sid] = $vol
  }
  ($saved | ConvertTo-Json -Compress) | Set-Content -Path $State -Encoding UTF8
  # Ramp każdej sesji od zapamiętanego poziomu do celu przez $Fade ms — płynnie, nie skokowo.
  # $Level to PROCENT bieżącej głośności sesji, więc cel liczy się per sesja z jej własnego $start
  # (grało 0.6, $Level=50 → cel 0.3). Tak użytkownik myśli o ściszaniu: „przygłoś o połowę".
  $steps = Get-Steps $Fade
  $stepMs = [int]($Fade / $steps)
  for ($i = 1; $i -le $steps; $i++) {
    foreach ($k in $saved.Keys) {
      $start = [float]$saved[$k]
      $target = $start * $Level / 100.0
      $v = $start + ($target - $start) * $i / $steps
      try { [CVAudio]::SetVolume([int]$k, [float]$v) } catch { }
    }
    if ($stepMs -gt 0) { Start-Sleep -Milliseconds $stepMs }
  }
  foreach ($k in $saved.Keys) {
    $start = [float]$saved[$k]
    $target = $start * $Level / 100.0
    try { [CVAudio]::SetVolume([int]$k, [float]$target) } catch { }
  }
}
elseif ($Mode -eq 'restore') {
  if (Test-Path $State) {
    $raw = Get-Content -Path $State -Raw
    if ($raw.Trim()) {
      $saved = $raw | ConvertFrom-Json
      $starts = @{}
      foreach ($p in $saved.PSObject.Properties) { $starts[$p.Name] = [CVAudio]::GetVolume([int]$p.Name) }
      $steps = Get-Steps $Fade
      $stepMs = [int]($Fade / $steps)
      for ($i = 1; $i -le $steps; $i++) {
        foreach ($p in $saved.PSObject.Properties) {
          $s = [float]$starts[$p.Name]
          if ($s -lt 0) { continue }
          $v = $s + ([float]$p.Value - $s) * $i / $steps
          try { [CVAudio]::SetVolume([int]$p.Name, [float]$v) } catch { }
        }
        if ($stepMs -gt 0) { Start-Sleep -Milliseconds $stepMs }
      }
      foreach ($p in $saved.PSObject.Properties) { try { [CVAudio]::SetVolume([int]$p.Name, [float]$p.Value) } catch { } }
    }
    Remove-Item -Path $State -Force -ErrorAction SilentlyContinue
  }
}
`

let winScriptCache: string | undefined
function windowsScriptPath(): string {
  if (winScriptCache) return winScriptCache
  fs.mkdirSync(stateDir, { recursive: true })
  const target = path.join(stateDir, 'duck.ps1')
  fs.writeFileSync(target, WINDOWS_SCRIPT, 'utf8')
  winScriptCache = target
  return target
}

function runWindows(mode: 'duck' | 'restore', level: number, fadeMs: number): Promise<string> {
  const script = windowsScriptPath()
  return exec(
    'powershell',
    [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-File', script,
      '-Mode', mode,
      '-Level', String(Math.round(level)),
      '-Fade', String(Math.round(fadeMs)),
      '-State', WIN_STATE_FILE,
    ],
    undefined,
    // Enumeracja sesji + kompilacja Add-Type bywa wolniejsza niż zwykłe polecenie, plus czas rampy.
    fadeMs + 12000,
  )
}

class WindowsBackend implements DuckBackend {
  async duck(level: number, fadeMs: number): Promise<void> {
    await runWindows('duck', level, fadeMs)
  }
  async restore(fadeMs: number): Promise<void> {
    await runWindows('restore', 0, fadeMs)
  }
  async recover(): Promise<void> {
    // Plik stanu zostaje po duck; jeśli istnieje, poprzednia sesja padła w trakcie czytania. Skokowo.
    if (fs.existsSync(WIN_STATE_FILE)) await runWindows('restore', 0, 0).catch(() => undefined)
  }
}

/* ------------------------------------- Noop -------------------------------------- */

class NoopBackend implements DuckBackend {
  async duck(): Promise<void> {}
  async restore(): Promise<void> {}
  async recover(): Promise<void> {}
}

function createBackend(): DuckBackend {
  if (process.platform === 'darwin') return new MacBackend()
  if (process.platform === 'win32') return new WindowsBackend()
  return new NoopBackend()
}

/**
 * Uzgadnia stan „ściszone / nie" z żądaniem, seryjnie.
 *
 * Kontroler mowy woła `engage()` przy wejściu w mówienie i `release()` przy wyjściu (pauza, stop,
 * koniec, błąd). Wywołania systemowe są asynchroniczne, więc szybkie przełączenia (pauza → wznów)
 * mogłyby się wyścignąć. Trzymamy więc tylko `desired` (czego chcemy) i pojedynczy bieg, który
 * dobija stan do żądania — nigdy dwa naraz, bez migotania na kolejnych fragmentach jednej tury.
 */
export class Ducker {
  private readonly backend: DuckBackend
  private desired = false
  private active = false
  private processing = false
  private failed = false

  /** `backend` wstrzykiwalny wyłącznie na potrzeby testów; produkcyjnie dobiera go platforma. */
  constructor(private readonly settings: () => DuckSettings, backend?: DuckBackend) {
    this.backend = backend ?? createBackend()
    // Sprzątanie po ewentualnym crashu poprzedniej sesji — zanim ktokolwiek zacznie mówić.
    void this.backend.recover().catch(() => undefined)
  }

  /** Wejście w mówienie. Nic nie robi, gdy funkcja wyłączona albo backend już raz zawiódł. */
  engage(): void {
    const enabled = this.settings().enabled
    log(`engage(enabled=${enabled}, failed=${this.failed})`)
    if (this.failed || !enabled) return
    this.desired = true
    void this.reconcile()
  }

  /** Wyjście z mówienia. Zawsze próbuje przywrócić — także gdy w międzyczasie wyłączono ustawienie. */
  release(): void {
    this.desired = false
    void this.reconcile()
  }

  /** Bezpieczne domknięcie przy zamykaniu okna: przywróć, cokolwiek zostało ściszone. */
  async dispose(): Promise<void> {
    this.desired = false
    await this.reconcile()
  }

  private async reconcile(): Promise<void> {
    if (this.processing) return
    this.processing = true
    try {
      while (this.desired !== this.active) {
        if (this.desired) {
          const s = this.settings()
          await this.backend.duck(clamp(s.level, 0, 100), Math.max(0, s.fadeMs))
          this.active = true
        } else {
          await this.backend.restore(Math.max(0, this.settings().fadeMs))
          this.active = false
        }
      }
    } catch (error) {
      // Best-effort: brak narzędzia/uprawnień nie może psuć mowy. Odpuszczamy do końca sesji, żeby nie
      // odpalać w kółko wywołania, które i tak nie przejdzie; przy następnym starcie `recover` posprząta.
      this.failed = true
      log(`reconcile FAIL → wyłączam do końca sesji: ${String(error)}`)
    } finally {
      this.processing = false
    }
  }
}
