/**
 * Ścieżki stanu współdzielone przez rozszerzenie i hooka.
 *
 * Hook biegnie w OSOBNYM procesie, odpalanym przez Cursora — nie ma dostępu do `vscode`
 * ani do stanu rozszerzenia. Jedyne, co ich łączy, to te ścieżki, wyliczane po obu stronach
 * z katalogu domowego identycznie.
 *
 * Celowo NIE mieszkamy w `~/.cursor/hooks/` — tam siedzi prototyp i cudze hooki.
 */
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

/** Katalog stanu wtyczki. */
export const stateDir = path.join(os.homedir(), '.cursor', 'coding-voice')

/**
 * Utwórz katalog stanu z uprawnieniami tylko dla właściciela (0700).
 *
 * Trzymamy tu klucz API (kopia awaryjna), surowy payload hooka (może zawierać e-mail i metadane)
 * oraz teksty odpowiedzi. Na maszynie współdzielonej domyślne 0755 pozwoliłoby innym kontom je
 * odczytać, więc zamykamy katalog i naprawiamy uprawnienia także wtedy, gdy powstał wcześniej.
 * `chmod` jest best-effort — na Windowsie POSIX-owe bity nie mają znaczenia, a brak uprawnień
 * do zmiany nie może wywrócić hooka ani rozszerzenia.
 */
export function ensureStateDir(): void {
  fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 })
  try {
    fs.chmodSync(stateDir, 0o700)
  } catch {
    /* jw. */
  }
}

/**
 * Katalog stanu sprzed zmiany nazwy na „Coding Voice".
 *
 * Istnieje wyłącznie po to, żeby posprzątać: w `hooks.json` użytkownika siedzą wpisy wskazujące
 * na stare launchery. Bez rozpoznania ich po tej ścieżce wyglądałyby na CUDZE hooki, zostałyby
 * nietknięte i przy każdej turze odpalałby się skrypt wskazujący na nieistniejące już
 * rozszerzenie — a przez chwilę, zanim stara wtyczka zniknie, mówiłyby obie naraz.
 */
export const legacyStateDir = path.join(os.homedir(), '.cursor', 'cursor-voice')

/** Bufor bieżącej tury. `afterAgentResponse` potrafi trafić kilka razy w jednej turze
 *  (wiadomości między wywołaniami narzędzi) — nadpisujemy, więc zostaje ostatnia, czyli podsumowanie. */
export const pendingFile = path.join(stateDir, 'pending.txt')

/** Workspace bieżącej tury — zapisywany razem z buforem, żeby przy domknięciu tury (`speak`,
 *  osobny proces bez payloadu) wciąż wiedzieć, do którego okna należy wypowiedź. */
export const pendingWsFile = path.join(stateDir, 'pending-ws.txt')

/** Kolejka gotowych wypowiedzi. Jeden plik = jedna zakończona tura. Rozszerzenie je konsumuje i kasuje. */
export const queueDir = path.join(stateDir, 'queue')

/**
 * Osobny kanał sygnału „Twoja kolej" (ring) — CELOWO poza `queueDir`.
 *
 * Dawniej ring jechał tą samą kolejką co tekst, jako sentinel w treści wpisu. Problem: host, który tego
 * sentinela NIE rozpoznaje (starsza wersja rozszerzenia sprzed funkcji ringu albo inne okno w trakcie
 * aktualizacji), traktował go jak zwykły tekst i próbował przeczytać — raz „coding voice ring", raz samą
 * doklejoną kropkę („kropka"). Nie da się tego naprawić po stronie treści, bo starego hosta nie zmienimy.
 *
 * Rozdzielenie kanałów rozwiązuje to u źródła: hook wkłada ring TU, a stare hosty obserwują wyłącznie
 * `queueDir`, więc pliku ringu po prostu nigdy nie zobaczą (cisza zamiast czytania), a `queueDir` niosący
 * już tylko prawdziwy tekst czytają normalnie. Nowe rozszerzenie obserwuje oba katalogi i na plik z tego
 * gra dźwięk. Treść pliku nie ma znaczenia — liczy się samo jego pojawienie się (tag w nazwie kieruje go
 * do właściwego okna, jak w `queueDir`). */
export const ringDir = path.join(stateDir, 'ring')

/**
 * Treść pliku ringu wkładanego do `ringDir`. To TYLKO znacznik — ring rozpoznajemy po samym pojawieniu
 * się pliku w osobnym katalogu (patrz `ringDir`), a nie po treści, więc ta wartość nigdy nie trafia do
 * ścieżki mowy. Znaki ze strefy prywatnej Unicode (PUA) trzymamy dla pewności: gdyby jakiś przyszły kod
 * kiedyś jednak podał ją do lektora, `toSpeakable` wycina PUA do pustego i nic się nie wypowie. */
export const RING_SIGNAL = '\uE000\uE001\uE002'

/** Ostatnio wypowiedziany tekst — do powtórki przyciskiem, także gdy czytanie jest wyłączone. */
export const lastSpokenFile = path.join(stateDir, 'last-spoken.txt')

/**
 * Globalny zamek mowy — JEDEN plik dla wszystkich okien Cursora.
 *
 * Każde okno to osobny host rozszerzeń, ale wszystkie dzielą ten katalog. Bez zamka dwa projekty,
 * które skończą turę w zbliżonym momencie, zaczęłyby czytać naraz — dwa głosy jeden na drugim.
 * Kto trzyma ten plik, ten mówi; reszta czeka, aż zwolni, i dopiero wtedy rusza. Plik nosi znacznik
 * właściciela i czas (bicie serca), więc okno, które padło w trakcie czytania, po TTL zostaje przejęte.
 */
export const speechLockFile = path.join(stateDir, 'speaking.lock')

/** Surowy payload ostatniego hooka. Schemat nie jest udokumentowany, więc zostaje do diagnostyki. */
export const lastPayloadFile = path.join(stateDir, 'last-payload.json')

/** Log hooka — hook nie ma gdzie indziej krzyczeć, jego stderr nigdzie nie trafia. */
export const logFile = path.join(stateDir, 'hook.log')

/**
 * Awaryjna kopia klucza API POZA keychainem.
 *
 * SecretStorage macOS (keychain) po niektórych restartach Cursora wraca pusty — apka nie odblokuje
 * keychaina i wszystkie sekrety czytają się jako brak. Wtedy ElevenLabs traci uwierzytelnienie mimo
 * że użytkownik nic nie zmienił. Trzymamy więc drugą kopię w katalogu stanu (uprawnienia 0600, tylko
 * właściciel), z której korzystamy, gdy keychain zawiedzie. Świadomy kompromis: plaintext na dysku
 * użytkownika (jak `~/.npmrc` czy `~/.aws/credentials`) w zamian za to, że wybrany głos działa po
 * każdym powrocie bez ręcznego wklejania klucza.
 */
export const apiKeyFallbackFile = (engine: string): string =>
  path.join(stateDir, `apikey-${engine}`)

/**
 * Kopia `dist/hook.js` odłożona POZA katalogiem rozszerzenia.
 *
 * Launcher w `hooks.json` przeżywa aktualizację wtyczki, ale ścieżka do rozszerzenia zawiera numer
 * wersji i po aktualizacji stary katalog znika. Gdyby launcher wskazywał prosto na `dist/hook.js`,
 * do najbliższego przeładowania okna hook celowałby w nieistniejący plik — i milczałby bez
 * jednego wpisu w logu, bo umiera, zanim zdąży cokolwiek zapisać. Kopia w katalogu stanu nie ma
 * w ścieżce wersji, więc jest odporna zarówno na aktualizację, jak i na sprzątanie starych kopii.
 */
export const hookScriptPath = path.join(stateDir, 'hook.js')

/** Zdarzenia, na które podpinamy launcher: dwa po stronie agenta Cursora (`capture` + `speak`)
 *  i jedno po stronie panelu Claude Code (`claude`), który ma własny system hooków. */
export type HookEvent = 'capture' | 'speak' | 'claude'

/** Launchery hooka generowane per platforma (patrz `bridge/install.ts`). */
export function launcherPath(event: HookEvent): string {
  const ext = process.platform === 'win32' ? 'cmd' : 'sh'
  return path.join(stateDir, `hook-${event}.${ext}`)
}
