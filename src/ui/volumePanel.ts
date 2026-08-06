/**
 * Suwak głośności — widok webview w dolnym panelu, obok terminala.
 *
 * Pasek stanu nie ma widżetu suwaka i element paska dostaje wyłącznie fakt kliknięcia, bez pozycji
 * ani ruchu kursora — więc „łapię i przesuwam" nie ma prawa tam zadziałać. Natywny ekran ustawień
 * renderuje tylko swoje wbudowane kontrolki i też nie przyjmie własnego suwaka. Jedyne miejsce
 * w API z własnym DOM-em to webview; sadzamy je w panelu na dole, a nie jako kartę w edytorze,
 * żeby suwak siedział przy pasku stanu, nie zabierał miejsca na kod i nie otwierał się jak plik.
 *
 * „Live" jest ograniczone przez silnik: `say`, PowerShell i `spd-say` biorą głośność tylko na
 * starcie zdania, żaden nie zmienia poziomu w trakcie. Płynne przeciąganie odbija się natychmiast
 * w liczbie i w położeniu kropki, a słyszalny skok głośności robi `restartUtterance()` — bieżące
 * zdanie od nowa z nowym poziomem. Wołane z debounce, bo przy każdym drgnięciu suwaka mowa
 * zacinałaby się w kółko.
 */
import * as vscode from 'vscode'
import { readSettings, updateSetting } from '../config.js'
import type { SpeechController } from '../speech/controller.js'

export interface VolumePanel extends vscode.Disposable {
  /** Provider do zarejestrowania w `window.registerWebviewViewProvider`. */
  readonly provider: vscode.WebviewViewProvider
  /** Otwiera/fokusuje widok w panelu — podpięte pod kliknięcie w szynę na pasku stanu. */
  open: () => void
  /** Głośność zmieniła się spoza suwaka (menu, settings.json) — dosuwamy kropkę do prawdy. */
  refresh: () => void
}

/** Id widoku musi zgadzać się z `contributes.views` w package.json — stąd bierze się komenda
 *  `<viewId>.focus`, którą otwieramy panel. */
const VIEW_ID = 'codingVoice.volumeView'

/** Ile milisekund ciszy w ruchu suwaka, zanim puścimy bieżące zdanie od nowa z nowym poziomem.
 *  Krótkie tyle, że skok głośności czuć od razu, długie tyle, że przeciąganie nie miele
 *  restartami. */
const RESTART_DEBOUNCE_MS = 200

export function createVolumePanel(controller: SpeechController): VolumePanel {
  let view: vscode.WebviewView | undefined
  let restartTimer: ReturnType<typeof setTimeout> | undefined

  /** Suwak jest źródłem prawdy w trakcie przeciągania, więc zapis ustawienia leci natychmiast,
   *  a słyszalny przeskok czeka na debounce — chyba że użytkownik puścił suwak (`commit`),
   *  wtedy gramy od razu. */
  const apply = (percent: number, commit: boolean): void => {
    const level = Math.max(0, Math.min(100, Math.round(percent)))
    void updateSetting('volume', level)

    if (restartTimer) clearTimeout(restartTimer)
    if (commit) {
      controller.restartUtterance()
      return
    }
    restartTimer = setTimeout(() => controller.restartUtterance(), RESTART_DEBOUNCE_MS)
  }

  const push = (): void => {
    void view?.webview.postMessage({ type: 'volume', value: Math.round(readSettings().volume) })
  }

  const provider: vscode.WebviewViewProvider = {
    resolveWebviewView(webviewView) {
      view = webviewView
      webviewView.webview.options = { enableScripts: true }
      webviewView.webview.html = html(readSettings().volume)

      webviewView.webview.onDidReceiveMessage((message: { type?: string; value?: number }) => {
        if (message.type === 'input' && typeof message.value === 'number') {
          apply(message.value, false)
        } else if (message.type === 'change' && typeof message.value === 'number') {
          apply(message.value, true)
        }
      })

      webviewView.onDidDispose(() => {
        view = undefined
      })
    },
  }

  return {
    provider,
    // `<viewId>.focus` otwiera panel i pokazuje widok nawet wtedy, gdy jeszcze nie był
    // wyrenderowany — Cursor sam go wtedy resolve'uje.
    open: () => void vscode.commands.executeCommand(`${VIEW_ID}.focus`),
    refresh: push,
    dispose: () => {
      if (restartTimer) clearTimeout(restartTimer)
    },
  }
}

function nonce(): string {
  let text = ''
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) text += chars.charAt(Math.floor(Math.random() * chars.length))
  return text
}

function html(initial: number): string {
  const n = nonce()
  const value = Math.round(Math.max(0, Math.min(100, initial)))
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; style-src 'nonce-${n}'; script-src 'nonce-${n}';" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style nonce="${n}">
  :root { color-scheme: light dark; }
  body {
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    margin: 0;
    padding: 12px 16px;
  }
  .card { display: flex; flex-direction: column; gap: 10px; max-width: 640px; }
  .head { display: flex; align-items: baseline; justify-content: space-between; }
  .title { font-size: 12px; opacity: 0.7; letter-spacing: 0.02em; }
  .value { font-size: 22px; font-variant-numeric: tabular-nums; font-weight: 600; }
  .row { display: flex; align-items: center; gap: 12px; }
  .icon { display: inline-flex; align-items: center; opacity: 0.65; user-select: none; }
  .icon svg { width: 16px; height: 16px; display: block; }
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    flex: 1;
    height: 6px;
    border-radius: 999px;
    background: var(--vscode-scrollbarSlider-background);
    outline: none;
    cursor: pointer;
  }
  input[type="range"]:focus-visible {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: 4px;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--vscode-button-background, var(--vscode-focusBorder));
    border: 2px solid var(--vscode-panel-background, var(--vscode-editor-background));
    box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    cursor: grab;
  }
  input[type="range"]:active::-webkit-slider-thumb { cursor: grabbing; }
  input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--vscode-button-background, var(--vscode-focusBorder));
    border: 2px solid var(--vscode-panel-background, var(--vscode-editor-background));
    cursor: grab;
  }
  .hint { font-size: 11px; opacity: 0.55; line-height: 1.5; }
</style>
</head>
<body>
  <div class="card">
    <div class="head">
      <span class="title">Reading volume</span>
      <span class="value"><span id="num">${value}</span>%</span>
    </div>
    <div class="row">
      <span class="icon" title="Quieter"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h2.5L8 3v10L4.5 10H2z"/><path d="M10.5 6.5c.7.8.7 2.2 0 3"/></svg></span>
      <input id="slider" type="range" min="0" max="100" step="1" value="${value}"
        aria-label="Reading volume" />
      <span class="icon" title="Louder"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h2.5L8 3v10L4.5 10H2z"/><path d="M10.5 6c.9 1 .9 3 0 4"/><path d="M12.3 4.5c1.6 1.7 1.6 5.3 0 7"/></svg></span>
    </div>
    <div class="hint">Grab the dot and drag. Changes only this voice — your system volume stays
      where it is. While an answer is playing, the new level takes over the current sentence.</div>
  </div>
<script nonce="${n}">
  const vscode = acquireVsCodeApi();
  const slider = document.getElementById('slider');
  const num = document.getElementById('num');

  slider.addEventListener('input', () => {
    num.textContent = slider.value;
    vscode.postMessage({ type: 'input', value: Number(slider.value) });
  });
  slider.addEventListener('change', () => {
    vscode.postMessage({ type: 'change', value: Number(slider.value) });
  });

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message && message.type === 'volume' && typeof message.value === 'number') {
      // Nie nadpisujemy w trakcie chwytania — inaczej wartość odbita z hosta szarpałaby kropkę
      // spod palca.
      if (document.activeElement !== slider) {
        slider.value = String(message.value);
        num.textContent = String(message.value);
      }
    }
  });
</script>
</body>
</html>`
}
