/**
 * Ustawienia pod ikoną koła zębatego.
 *
 * Świadomie QuickPick, a nie webview: webview to własny HTML, własny CSS i własny motyw do
 * utrzymania, a przy publikacji dodatkowy audyt bezpieczeństwa treści. QuickPick wygląda dokładnie
 * jak reszta edytora, działa z klawiatury i jest dostępny dla czytników ekranu za darmo.
 *
 * Klucz API dostaje osobne wejście, bo NIE MOŻE trafić do `settings.json` — idzie do SecretStorage.
 */
import * as vscode from 'vscode'
import { readSettings, updateSetting, type EngineId, type Settings } from '../config.js'
import type { Secrets } from '../secrets.js'
import { logFile } from '../shared/paths.js'
import type { ReadScope } from '../text/scope.js'

/** Podgląd głośności rysowany znakami. Zgrubna podziałka wystarcza, bo obok stoi liczba,
 *  a dokładne ustawianie należy do suwaka w listwie. */
const NOTCHES = 5
const renderTrack = (value: number): string => {
  const notch = Math.round((Math.max(0, Math.min(100, value)) / 100) * NOTCHES)
  return `${'━'.repeat(notch)}◉${'─'.repeat(NOTCHES - notch)}`
}

/** `run` jest opcjonalne, bo nagłówki sekcji to też pozycje listy — tyle że nieklikalne.
 *  `id` służy do odnalezienia wiersza po przebudowaniu listy, gdy jego wartość zmieniła się w miejscu. */
interface Item extends vscode.QuickPickItem {
  id?: string
  run?: () => Promise<void>
}

/** Nagłówek sekcji. Dzięki niemu widać na pierwszy rzut oka, że CAŁE to menu należy do wtyczki,
 *  i gdzie kończą się ustawienia głosu, a zaczynają ustawienia treści. */
const group = (label: string): Item => ({ label, kind: vscode.QuickPickItemKind.Separator })

const SCOPE_LABELS: Record<ReadScope, string> = {
  full: 'Whole answer',
  essentials: 'Key points only',
  ending: 'Just the ending',
}

const ENGINE_LABELS: Record<EngineId, string> = {
  system: 'System voice — free, offline',
  elevenlabs: 'ElevenLabs — your own API key',
  openai: 'OpenAI TTS — your own API key',
}

/**
 * Ekran ustawień otwieramy przez URL, NIE przez `executeCommand('workbench.action.openSettings')`.
 *
 * Ta komenda zwraca hostowi rozszerzeń obiekt panelu edytora, a Cursor 3.7 serializuje odpowiedź
 * do JSON — graf obiektów panelu jest tak wielki, że `JSON.stringify` blokuje renderer na 15+ s
 * i okno pada jako „unresponsive" (main.log: `serializeReplyOK`, trzy zwiechy 2026-08-03).
 * `openExternal` odpowiada pojedynczym boolem, więc nie ma czego serializować.
 */
export async function openSettingsScreen(query: string): Promise<void> {
  const opened = await vscode.env.openExternal(
    // `query` bywa filtrem z dwukropkiem (`@ext:…`) — kodujemy go, żeby `:` nie rozjechał ścieżki URI.
    vscode.Uri.parse(`${vscode.env.uriScheme}://settings/${encodeURIComponent(query)}`),
  )
  // Gdyby build nie znał URL-a ustawień, zostaje komenda — rzadka droga, ale lepsza niż nic.
  if (!opened) await vscode.commands.executeCommand('workbench.action.openSettings', query)
}

async function pickOne<T extends string>(
  title: string,
  options: Array<{ value: T; label: string; description?: string }>,
  current: T,
): Promise<T | undefined> {
  const picked = await vscode.window.showQuickPick(
    options.map((option) => ({
      label: option.label,
      description: option.description,
      // Zaznaczenie bieżącej wartości: bez tego użytkownik nie wie, co jest ustawione,
      // i musi wychodzić do `settings.json`, żeby sprawdzić.
      picked: option.value === current,
      detail: option.value === current ? '$(check) current' : undefined,
      value: option.value,
    })),
    { title, matchOnDescription: true },
  )
  return picked?.value
}

async function askApiKey(secrets: Secrets, engine: EngineId): Promise<void> {
  if (engine === 'system') {
    void vscode.window.showInformationMessage('The system voice needs no API key.')
    return
  }
  const existing = await secrets.getApiKey(engine)
  const empty = engine === 'elevenlabs' ? 'your ElevenLabs API key' : 'sk-…'
  const key = await vscode.window.showInputBox({
    title: `${ENGINE_LABELS[engine]} — API key`,
    prompt: 'The key is stored in the OS keychain and never leaves this machine except to call the provider.',
    password: true,
    value: '',
    placeHolder: existing ? '•••••• (saved — leave empty to remove)' : empty,
    ignoreFocusOut: true, // wklejanie klucza z menedżera haseł zabiera fokus
  })
  if (key === undefined) return
  await secrets.setApiKey(engine, key.trim() || undefined)
  void vscode.window.showInformationMessage(
    key.trim() ? 'API key saved.' : 'API key removed.',
  )
}

export async function showSettingsMenu(secrets: Secrets): Promise<void> {
  // Lista jest budowana od nowa po każdej zmianie w miejscu (głośność), więc musi być funkcją,
  // a nie stałą — inaczej wiersz pokazywałby wartość sprzed kliknięcia.
  const build = (): Item[] => {
    const settings: Settings = readSettings()
    return [
      {
        label: settings.enabled ? '$(unmute) Reading aloud: on' : '$(mute) Reading aloud: off',
        description: 'Toggle',
        run: async () => updateSetting('enabled', !settings.enabled),
      },
      group('Voice'),
      {
        label: '$(broadcast) Engine',
        description: ENGINE_LABELS[settings.engine],
        run: async () => {
          const engine = await pickOne<EngineId>(
            'Speech engine',
            [
              { value: 'system', label: ENGINE_LABELS.system, description: 'no key, works offline' },
              { value: 'elevenlabs', label: ENGINE_LABELS.elevenlabs, description: 'billed to your account' },
              { value: 'openai', label: ENGINE_LABELS.openai, description: 'billed to your account' },
            ],
            settings.engine,
          )
          if (!engine) return
          await updateSetting('engine', engine)
          // Wybór silnika chmurowego bez klucza kończy się błędem przy pierwszej wypowiedzi —
          // lepiej zapytać teraz, póki użytkownik jest w kontekście.
          if (engine !== 'system' && !(await secrets.getApiKey(engine))) await askApiKey(secrets, engine)
        },
      },
      {
        label: '$(person) Voice',
        description: settings.voice === 'male' ? 'male' : 'female',
        run: async () => {
          const voice = await pickOne('Narrator voice', [
            { value: 'female' as const, label: 'Female' },
            { value: 'male' as const, label: 'Male' },
          ], settings.voice)
          if (voice) await updateSetting('voice', voice)
        },
      },
      {
        label: '$(globe) Language',
        description: settings.language === 'auto' ? 'auto-detect' : settings.language,
        run: async () => {
          const language = await pickOne('Spoken language', [
            { value: 'auto' as const, label: 'Auto-detect', description: 'from the answer itself' },
            { value: 'en' as const, label: 'English' },
            { value: 'pl' as const, label: 'Polski' },
          ], settings.language)
          if (language) await updateSetting('language', language)
        },
      },
      {
        label: '$(dashboard) Speed',
        description: `${settings.rate.toFixed(2)}×`,
        run: async () => {
          const rate = await pickOne('Speech rate', [
            { value: '0.75', label: 'Slow — 0.75×' },
            { value: '1', label: 'Normal — 1×' },
            { value: '1.25', label: 'Brisk — 1.25×' },
            { value: '1.5', label: 'Fast — 1.5×' },
            { value: '2', label: 'Very fast — 2×' },
          ], String(settings.rate))
          if (rate) await updateSetting('rate', Number(rate))
        },
      },
      {
        id: 'volume',
        label: '$(unmute) Volume',
        description: `${renderTrack(settings.volume)}  ${Math.round(settings.volume)}%`,
        detail: 'Opens a slider you grab and drag, down in the panel',
        run: async () => {
          await vscode.commands.executeCommand('codingVoice.setVolume')
        },
      },
      group('What gets read'),
      {
        label: '$(list-selection) What to read',
        description: SCOPE_LABELS[settings.scope],
        run: async () => {
          const scope = await pickOne<ReadScope>(
            'How much of the answer to read',
            [
              { value: 'full', label: SCOPE_LABELS.full, description: 'everything the agent wrote' },
              {
                value: 'essentials',
                label: SCOPE_LABELS.essentials,
                description: 'headings, highlighted sentences, the point of each paragraph',
              },
              {
                value: 'ending',
                label: SCOPE_LABELS.ending,
                description: 'the conclusion and what to do next',
              },
            ],
            settings.scope,
          )
          if (scope) await updateSetting('scope', scope)
        },
      },
      {
        label: '$(law) Length limit',
        description: settings.maxCharacters === 0 ? 'whole answer' : `${settings.maxCharacters} characters`,
        // Przy silnikach chmurowych to jest główny hamulec rachunku — płaci się od znaku.
        detail: settings.engine === 'system' ? undefined : 'Cloud engines bill per character.',
        run: async () => {
          const limit = await pickOne('Cut the spoken text after', [
            { value: '0', label: 'No limit — read the whole answer' },
            { value: '400', label: 'Short — ~400 characters' },
            { value: '800', label: 'Medium — ~800 characters' },
            { value: '1500', label: 'Long — ~1500 characters' },
          ], String(settings.maxCharacters))
          if (limit) await updateSetting('maxCharacters', Number(limit))
        },
      },
      {
        label: '$(code) Code blocks',
        description: settings.skipCodeBlocks ? 'skipped' : 'read aloud',
        // Ostatni parametr, który mieszkał wyłącznie w `settings.json`. Menu ma być kompletne —
        // inaczej „wszystkie ustawienia w jednym miejscu" jest obietnicą, której nie dotrzymuje.
        run: async () => updateSetting('skipCodeBlocks', !settings.skipCodeBlocks),
      },
      group('Extension'),
      {
        label: '$(key) API key',
        description: settings.engine === 'system' ? 'not needed for the system voice' : ENGINE_LABELS[settings.engine],
        run: async () => askApiKey(secrets, settings.engine),
      },
      {
        label: '$(settings-gear) All settings',
        description: 'open the standard settings UI',
        // Filtr `@ext:` pokazuje CAŁĄ grupę ustawień wtyczki, a nie pojedynczy klucz — inaczej
        // ekran znajdował „1 Setting" i wyglądał, jakby reszta zniknęła.
        run: async () => openSettingsScreen('@ext:larspunx.coding-voice'),
      },
      {
        label: '$(output) Diagnostics',
        description: 'open the hook log',
        // Hook biegnie w osobnym procesie; jego log to jedyny ślad, gdy nic nie zostaje przeczytane.
        run: async () => {
          const document = await vscode.workspace.openTextDocument(vscode.Uri.file(logFile))
          await vscode.window.showTextDocument(document)
        },
      },
    ]
  }

  const quick = vscode.window.createQuickPick<Item>()
  quick.title = 'Coding Voice'
  quick.placeholder = 'Settings'
  quick.items = build()

  const picked = await new Promise<Item | undefined>((resolve) => {
    let chosen: Item | undefined
    quick.onDidAccept(() => {
      chosen = quick.activeItems[0]
      quick.hide()
    })
    quick.onDidHide(() => {
      quick.dispose()
      resolve(chosen)
    })
    quick.show()
  })
  // Uruchomienie dopiero po zamknięciu tego menu: część pozycji otwiera własny QuickPick,
  // a dwa naraz na ekranie kończą się tym, że drugi zamyka pierwszy i sam siebie.
  await picked?.run?.()
}
