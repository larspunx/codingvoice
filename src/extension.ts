/**
 * Punkt wejścia rozszerzenia — spina hooka, kontroler mowy i pasek stanu.
 *
 * Przepływ jednej tury:
 *   agent kończy odpowiedź
 *     → hook `afterAgentResponse` buforuje treść
 *     → hook `stop` przenosi ją do kolejki
 *     → obserwator kolejki budzi to miejsce
 *     → czyścimy markdown, rozpoznajemy język, dzielimy na fragmenty
 *     → kontroler mówi fragment po fragmencie, pasek stanu pokazuje stan
 */
import * as fs from 'node:fs'
import * as vscode from 'vscode'
import { installHooks } from './bridge/install.js'
import { watchQueue } from './bridge/queue.js'
import { affectsUs, readSettings, speakOptions, updateSetting } from './config.js'
import { Secrets } from './secrets.js'
import { ensureStateDir, lastSpokenFile } from './shared/paths.js'
import { workspaceTag } from './shared/workspace.js'
import { SpeechController } from './speech/controller.js'
import { Ducker } from './speech/duck.js'
import { createElevenLabsEngine } from './speech/elevenlabs.js'
import { systemEngine, warmUp } from './speech/system.js'
import type { SpeakOptions, SpeechEngine } from './speech/types.js'
import { detectLanguage } from './text/language.js'
import { spokenNumbers } from './text/numbers.js'
import { applyScope } from './text/scope.js'
import { toSpeakable } from './text/speakable.js'
import { createSettingsPanel } from './ui/settingsPanel.js'
import { createStatusBar } from './ui/statusBar.js'
import { createVolumePanel } from './ui/volumePanel.js'

/** Trzymane na poziomie modułu, żeby `deactivate` mogło przywrócić głośność, gdyby okno zamknięto
 *  w trakcie czytania — inaczej muzyka zostałaby ściszona do 10%. */
let ducker: Ducker | undefined

export function activate(context: vscode.ExtensionContext): void {
  // Zamknij katalog stanu na właściciela (0700) zanim cokolwiek do niego zapiszemy — trzyma klucz
  // API i teksty odpowiedzi, więc na współdzielonej maszynie nie ma prawa być czytelny dla innych.
  ensureStateDir()

  const secrets = new Secrets(context.secrets)

  // Lista głosów systemowych kosztuje ~1,8 s — pobieramy ją teraz, żeby nie doliczyła się
  // do pierwszej wypowiedzi.
  warmUp()

  const elevenLabs = createElevenLabsEngine({
    apiKey: () => secrets.getApiKey('elevenlabs'),
    // Samonaprawa na 401: keychain bywa nieświeży tuż po przeładowaniu okna, więc pierwsze zapytanie
    // może odbić się mimo poprawnego klucza. Wtedy silnik sięga po kopię z dysku i ponawia raz.
    refreshApiKey: () => secrets.refreshFromDisk('elevenlabs'),
    voiceIdOverride: () => readSettings().elevenLabsVoiceId.trim() || undefined,
    voiceSettings: () => {
      const s = readSettings()
      return {
        stability: s.elevenLabsStability,
        similarity: s.elevenLabsSimilarity,
        style: s.elevenLabsStyle,
        speakerBoost: s.elevenLabsSpeakerBoost,
      }
    },
  })

  const engine = (): SpeechEngine => {
    // OpenAI dochodzi w kolejnym kroku; do tego czasu spada na systemowy, co jest lepsze niż cisza.
    return readSettings().engine === 'elevenlabs' ? elevenLabs : systemEngine
  }

  const controller = new SpeechController({
    engine,
    // Język rozpoznajemy per fragment (nie raz na całą odpowiedź). Dzięki temu w mieszanym
    // tekście polskie zdanie dostaje polski głos, a angielskie — angielski. Gdy użytkownik
    // wymusił język na sztywno, `speakOptions` i tak zignoruje wykryty i użyje ustawionego.
    options: (utterance: string): SpeakOptions => {
      const settings = readSettings()
      // Angielski jest domyślny: fragment, którego heurystyka nie rozstrzygnie, zostaje przy nim.
      // Polski wchodzi, gdy użytkownik wybierze go wprost albo gdy detektor znajdzie polskie sygnały.
      const language =
        settings.language === 'auto' ? detectLanguage(utterance, 'en') : settings.language
      return speakOptions(settings, language)
    },
    // Cyfry na słowa w języku fragmentu: bez tego ElevenLabs czyta liczby jednym (angielskim)
    // głosem niezależnie od reszty zdania, więc „3" w polskim tekście brzmi „three".
    transform: (utterance, options) => spokenNumbers(utterance, options.language),
    onError: (error) => {
      void vscode.window.showErrorMessage(`Coding Voice: ${error.message}`)
    },
  })

  // Ściszanie innych aplikacji na czas czytania. Podpięte pod stan kontrolera, bo `setState` to jedyne
  // miejsce, przez które przechodzą wszystkie przejścia (start, pauza, stop, koniec, błąd). Ściszamy przy
  // wejściu w mówienie, przywracamy przy wyjściu — a że kolejne fragmenty jednej tury nie zmieniają stanu
  // (`speaking` → `speaking` to nie-zdarzenie), nie ma migotania między zdaniami.
  ducker = new Ducker(() => {
    const s = readSettings()
    return { enabled: s.duckSystemAudio, level: s.duckLevel, fadeMs: s.duckFade }
  })
  const duckSub = controller.onChange(() => {
    if (controller.state === 'speaking') ducker?.engage()
    else ducker?.release()
  })

  // Cztery ikony w pasku stanu: 🔊 · ▷ · szyna z odczytem · ⚙. Kliknięcie w szynę otwiera
  // suwak w dolnym panelu — szyna jest wskaźnikiem, bo element paska nie zna ruchu kursora,
  // a webview zna.
  const statusBar = createStatusBar(controller)
  const volumePanel = createVolumePanel(controller)
  // Jedno okno ze wszystkimi ustawieniami, łącznie z suwakiem głośności — otwierane kołem zębatym.
  const settingsPanel = createSettingsPanel(secrets, controller)

  // Rejestracja hooków przy każdym starcie, nie tylko przy pierwszej instalacji: po aktualizacji
  // wtyczki zmienia się ścieżka do `dist/hook.js`, a po aktualizacji Cursora — ścieżka do runtime'u.
  try {
    installHooks(context.extensionPath)
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Coding Voice could not register its hooks: ${String(error)}`,
    )
  }

  // Wypowiedz gotowy do czytania tekst: rozpoznaj język i zacznij od początku. Zapisujemy go też
  // na dysk, żeby przycisk play mógł go powtórzyć nawet po przeładowaniu okna, gdy pamięć jest pusta.
  const speakText = (text: string): void => {
    // Fire-and-forget: zapis powtórki nie może wstrzymywać mowy ani wywalić rozszerzenia przy
    // pełnym dysku — najwyżej powtórka po restarcie nie zadziała.
    fs.writeFile(lastSpokenFile, text, () => undefined)
    controller.speakNew(text)
  }

  // Tagi workspace tego okna — czytamy tylko wypowiedzi z projektów tu otwartych. Zbiór jest
  // żywy: `watchQueue` trzyma referencję, a my aktualizujemy go, gdy zmieni się lista folderów.
  const ownTags = new Set<string>()
  const refreshOwnTags = (): void => {
    ownTags.clear()
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      ownTags.add(workspaceTag(folder.uri.fsPath))
    }
  }
  refreshOwnTags()
  context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(refreshOwnTags))

  const queue = watchQueue((raw) => {
    const settings = readSettings()
    if (!settings.enabled) return
    // Zakres NAJPIERW, na surowym markdownie: wybór „istotnych rzeczy" opiera się na nagłówkach
    // i pogrubieniach, których po wyczyszczeniu już nie ma.
    const text = toSpeakable(applyScope(raw, settings.scope), {
      maxCharacters: settings.maxCharacters,
      skipCodeBlocks: settings.skipCodeBlocks,
    })
    if (!text) return // odpowiedź była samym kodem albo tabelą — nie ma czego czytać
    // Nazwa projektu na początku (opcjonalnie): przy kilku oknach czytających naraz od razu słychać,
    // którego projektu dotyczy podsumowanie. Osobne zdanie, żeby lektor zrobił po niej pauzę.
    const projectName = vscode.workspace.workspaceFolders?.[0]?.name
    const spoken = settings.announceProject && projectName ? `${projectName}. ${text}` : text
    speakText(spoken)
  }, ownTags)

  context.subscriptions.push(
    statusBar,
    volumePanel,
    settingsPanel,
    // Widok suwaka mieszka w dolnym panelu; provider musi być zarejestrowany, zanim ktokolwiek
    // kliknie w szynę. `retainContextWhenHidden` trzyma stan suwaka, gdy panel jest schowany.
    vscode.window.registerWebviewViewProvider('codingVoice.volumeView', volumePanel.provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
    queue,
    // Kliknięcie w szynę otwiera interaktywny suwak w dolnym panelu — jedyne miejsce w API,
    // gdzie „łapię i przesuwam" działa, to webview z własnym DOM-em.
    vscode.commands.registerCommand('codingVoice.setVolume', () => volumePanel.open()),
    vscode.commands.registerCommand('codingVoice.playPause', async () => {
      // Wyłączone czytanie jest najczęstszym powodem ciszy po kliknięciu ▷ — i jedynym, który
      // da się naprawić jednym przyciskiem. Więc go proponujemy zamiast milczeć.
      if (!readSettings().enabled) {
        const turnOn = 'Turn reading on'
        const answer = await vscode.window.showInformationMessage(
          'Coding Voice: reading aloud is off, so nothing will be spoken.',
          turnOn,
        )
        if (answer === turnOn) await updateSetting('enabled', true)
        return
      }
      // Bezruch bez niczego w pamięci: najczęściej po przeładowaniu okna. Zanim ogłosimy „nie ma
      // czego czytać", sięgamy po ostatnią przeczytaną odpowiedź z dysku i gramy ją od początku —
      // dokładnie to, czego oczekuje ręka na przycisku play.
      if (controller.state === 'idle' && !controller.canReplay) {
        let last = ''
        try {
          last = fs.readFileSync(lastSpokenFile, 'utf8')
        } catch {
          /* pliku nie ma — pierwszy start albo nic jeszcze nie padło */
        }
        if (last.trim()) {
          speakText(last)
          return
        }
        void vscode.window.showInformationMessage(
          'Coding Voice: nothing to read yet — the next agent answer will be read aloud.',
        )
        return
      }
      controller.toggle()
    }),
    vscode.commands.registerCommand('codingVoice.stop', () => controller.stop()),
    vscode.commands.registerCommand('codingVoice.toggleEnabled', async () => {
      const next = !readSettings().enabled
      await updateSetting('enabled', next)
      // Wyłączenie ma uciszyć natychmiast, a nie dopiero od następnej tury.
      if (!next) controller.stop()
    }),
    vscode.commands.registerCommand('codingVoice.openSettings', () => settingsPanel.open()),
    vscode.commands.registerCommand('codingVoice.setApiKey', () => settingsPanel.open()),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!affectsUs(event)) return
      statusBar.refresh()
      volumePanel.refresh()
      settingsPanel.refresh()
      // Wyłączenie ściszania w trakcie czytania ma natychmiast oddać głośność innym aplikacjom,
      // a nie dopiero po końcu tury.
      if (!readSettings().duckSystemAudio) ducker?.release()
    }),
    duckSub,
    { dispose: () => void ducker?.dispose() },
  )
}

export function deactivate(): Thenable<void> | undefined {
  // Hooki zostają zarejestrowane celowo: gdyby znikały przy każdym zamknięciu okna, wtyczka
  // przestawałaby działać po restarcie Cursora, zanim host rozszerzeń zdąży wstać.
  //
  // Głośność za to MUSIMY oddać: gdyby okno zamknięto w trakcie czytania, muzyka zostałaby ściszona
  // do 10%. Zwracamy obietnicę, żeby host rozszerzeń poczekał na przywrócenie przed zabiciem procesu.
  return ducker?.dispose()
}
