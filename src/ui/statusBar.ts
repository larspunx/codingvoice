/**
 * Pasek stanu — jedyne UI wtyczki.
 *
 * Cztery elementy po lewej, w jednym ciągu: włącznik, odtwarzanie, suwak z odczytem procentowym,
 * ustawienia. Nie ma zakładki w panelu, nie ma karty w edytorze, nie ma osobnego okna głośności —
 * wtyczka nie otwiera niczego, czego użytkownik nie kliknął.
 *
 * Prawa strona paska jest w Cursorze zatłoczona i elementy potrafią się tam nie zmieścić.
 * Sąsiadujące priorytety gwarantują, że nikt się między nasze cztery ikony nie wciśnie.
 *
 * Czego pasek stanu NIE potrafi: element zgłasza wyłącznie fakt kliknięcia. Nie zna pozycji
 * kursora ani jego ruchu, więc suwaka nie da się tu przeciągnąć — narysowana szyna jest wskaźnikiem
 * poziomu, nie kontrolką. Kliknięcie otwiera prawdziwy suwak w dolnym panelu.
 */
import * as vscode from 'vscode'
import { readSettings } from '../config.js'
import type { SpeechController } from '../speech/controller.js'

/** Malejąco, bo VS Code układa elementy od najwyższego priorytetu. Kolejność na pasku:
 *  włącznik → odtwarzanie → głośność → ustawienia. */
const PRIORITY = { power: 1003, playback: 1002, volume: 1001, settings: 1000 }

/**
 * Stan niosą kolory, nie napisy: zielony włącznik znaczy, że wtyczka czyta, czerwony — że milczy,
 * żółto-pomarańczowy kafelek pauzy — że właśnie leci mowa. Przekreślony głośnik na 13 px jest nie
 * do odróżnienia od zwykłego, więc bez koloru wyciszona wtyczka wygląda identycznie jak zepsuta.
 *
 * Kolory pochodzą z palety motywu, a nie z wartości heksadecymalnych — trzymają kontrast tak samo
 * w ciemnym i jasnym, i wpasowują się w motyw, którego nie znamy.
 *
 * Odtwarzanie dostaje TŁO, nie kolor glifu: pasek stanu maluje cały element tylko przez
 * `backgroundColor`, i to jedyny sposób, żeby żółto-pomarańczowy był widoczny na ikonce 13 px,
 * a nie ledwo majaczył na jej krawędziach. VS Code honoruje w tej roli wyłącznie dwa tła —
 * błędu i ostrzeżenia; ostrzeżenie to właśnie bursztyn, którego chcemy.
 */
const GREEN = new vscode.ThemeColor('charts.green')
const RED = new vscode.ThemeColor('charts.red')
const AMBER_BG = new vscode.ThemeColor('statusBarItem.warningBackground')

/** Długość szyny w znakach. Sześć pozycji to podziałka co ~17% — dokładna wartość i tak stoi
 *  obok liczbą, a każdy znak więcej odbiera miejsce sąsiadom na pasku. */
const TRACK = 6

/** Szyna z kropką rysowana znakami: `──●───`. Przy 0% kropka siedzi na lewym krańcu,
 *  przy 100% na prawym. */
function renderTrack(volume: number): string {
  const level = Math.max(0, Math.min(100, volume))
  const dot = Math.round((level / 100) * TRACK)
  return `${'─'.repeat(dot)}●${'─'.repeat(TRACK - dot)}`
}

export interface StatusBar {
  refresh: () => void
  dispose: () => void
}

export function createStatusBar(controller: SpeechController): StatusBar {
  const make = (priority: number, name: string, command: string): vscode.StatusBarItem => {
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, priority)
    // `name` pozwala odnaleźć i przywrócić element w menu paska stanu (prawy klik), gdyby użytkownik
    // go ukrył — bez tego wtyczka wygląda na zepsutą i nie da się jej odzyskać.
    item.name = name
    item.command = command
    return item
  }

  const power = make(PRIORITY.power, 'Coding Voice: reading', 'codingVoice.toggleEnabled')
  const playback = make(PRIORITY.playback, 'Coding Voice: playback', 'codingVoice.playPause')
  const volume = make(PRIORITY.volume, 'Coding Voice: volume', 'codingVoice.setVolume')
  const settings = make(PRIORITY.settings, 'Coding Voice: settings', 'codingVoice.openSettings')

  settings.text = '$(gear)'
  settings.tooltip = 'Coding Voice settings'

  function render(): void {
    const { enabled, volume: level } = readSettings()

    power.text = enabled ? '$(unmute)' : '$(mute)'
    power.color = enabled ? GREEN : RED
    power.tooltip = enabled
      ? 'Reading aloud is on — click to turn it off'
      : 'Reading aloud is off — click to turn it on'
    power.show()

    // ⏸ tylko wtedy, gdy naprawdę leci mowa. W bezruchu i po pauzie przycisk zapowiada granie,
    // więc pokazuje ▷ — inaczej trzeba by zgadywać, czy kliknięcie zacznie, czy zatrzyma.
    const speaking = controller.state === 'speaking'
    playback.text = speaking ? '$(debug-pause)' : '$(play)'
    // Bursztynowy kafelek podczas mowy; w spoczynku i po pauzie zwykły przycisk bez tła.
    playback.backgroundColor = speaking ? AMBER_BG : undefined
    playback.tooltip = speaking
      ? 'Pause'
      : controller.state === 'paused'
        ? 'Resume'
        : 'Play the last answer from the start'
    playback.show()

    volume.text = `${renderTrack(level)} ${Math.round(level)}%`
    // Szyna to podgląd poziomu — sam suwak, który się łapie i przesuwa, otwiera się w dolnym panelu.
    volume.tooltip = 'Reading volume — click to open the slider in the panel'
    volume.show()

    settings.show()
  }

  render()
  const subscription = controller.onChange(render)

  return {
    // Wołane przy zmianie ustawień — włącznik i głośność nie pochodzą z kontrolera,
    // więc same się nie odświeżą.
    refresh: render,
    dispose: () => vscode.Disposable.from(power, playback, volume, settings, subscription).dispose(),
  }
}
