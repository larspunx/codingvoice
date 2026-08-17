/**
 * Pełne okno ustawień — wszystko w jednym miejscu, z suwakiem głośności w środku.
 *
 * Do tej pory ustawienia mieszkały w liście QuickPick, a głośność w osobnym panelu. Użytkownik
 * chce jedno okno: wszystkie opcje obok siebie i suwak, który się łapie i przeciąga, tam gdzie
 * reszta. QuickPick nie narysuje suwaka, natywny ekran ustawień nie przyjmie własnego widżetu —
 * zostaje webview, i to on jest tym oknem.
 *
 * Klucz API jest sekretem: NIE wpuszczamy go do `settings.json` ani nie odsyłamy z powrotem do
 * webview. Pole pokazuje tylko, czy klucz jest zapisany; wpisany klucz leci do SecretStorage
 * i znika z pola. Reszta ustawień to zwykłe wartości z konfiguracji, więc idą przez `updateSetting`.
 *
 * Głośność działa na żywo tak samo jak w małym panelu: zapis natychmiast, a słyszalny skok robi
 * `restartUtterance()` z debounce, bo silniki biorą poziom tylko na starcie zdania.
 */
import * as vscode from 'vscode'
import { readSettings, updateSetting, type EngineId, type Settings } from '../config.js'
import type { Secrets } from '../secrets.js'
import { logFile } from '../shared/paths.js'
import type { SpeechController } from '../speech/controller.js'
import type { VoiceGender } from '../speech/types.js'
import type { Language } from '../text/language.js'
import type { ReadScope } from '../text/scope.js'
import { openSettingsScreen } from './settingsMenu.js'

const RESTART_DEBOUNCE_MS = 200

/** Album autora — link ze stopki „About". Otwierany przez `openExternal`, nie surowym `<a>`,
 *  żeby nie walczyć z CSP webview. */
const SPOTIFY_ALBUM =
  'https://open.spotify.com/album/0oKFlySlL4IJCb9L1Wz5GY?si=bHh1TGHNSmeRAyXcmaiMyA'

/** VoiceLab / Voice Design — tu użytkownik tworzy własny głos „generated", jedyny, który darmowy
 *  plan puszcza przez API. */
const ELEVENLABS_VOICE_DESIGN = 'https://elevenlabs.io/app/voice-lab'

/** Napiwek dla autora — działa dla każdego (karta/PayPal), Polak też wpłaci. */
const KOFI_URL = 'https://ko-fi.com/larspunx'

/**
 * Tekst testu głosowego — jednocześnie krótki samouczek i próbka brzmienia.
 *
 * Ten sam napis pokazujemy w oknie i czytamy przyciskiem, więc użytkownik słyszy dokładnie to, co
 * widzi. Domyślny język wtyczki to angielski, więc i ten tekst jest po angielsku; przy `auto`
 * rozpoznawanie języka i tak trafi w EN. Puszczamy go przez `controller.speakNew`, czyli ten sam
 * tor co czytanie odpowiedzi — dzięki temu jest realnym testem: silnik, głos, język, tempo i
 * głośność z ustawień działają na niego natychmiast, tak samo jak na główny feature.
 */
const VOICE_TEST_TEXT =
  'Hi! This is Coding Voice. I read out the summary of every answer as soon as the agent finishes, ' +
  'so you can keep your eyes off the screen. What you are hearing right now is a quick voice test ' +
  'using your current settings. By default I use your computer\'s built-in system voice, which is ' +
  'free and works offline. In the settings below you can switch the voice, change the language, and ' +
  'adjust the speed and volume. Any change you make applies here and to every answer I read. Enjoy!'

interface StatePayload extends Settings {
  hasElevenLabsKey: boolean
}

export interface SettingsPanel extends vscode.Disposable {
  open: () => void
  refresh: () => void
}

export function createSettingsPanel(secrets: Secrets, controller: SpeechController): SettingsPanel {
  let panel: vscode.WebviewPanel | undefined
  let restartTimer: ReturnType<typeof setTimeout> | undefined

  const applyVolume = (percent: number, commit: boolean): void => {
    const level = Math.max(0, Math.min(100, Math.round(percent)))
    void updateSetting('volume', level)
    if (restartTimer) clearTimeout(restartTimer)
    if (commit) {
      controller.restartUtterance()
      return
    }
    restartTimer = setTimeout(() => controller.restartUtterance(), RESTART_DEBOUNCE_MS)
  }

  const state = async (): Promise<StatePayload> => {
    const settings = readSettings()
    return {
      ...settings,
      hasElevenLabsKey: Boolean(await secrets.getApiKey('elevenlabs')),
    }
  }

  const push = async (): Promise<void> => {
    if (!panel) return
    await panel.webview.postMessage({ type: 'state', state: await state() })
  }

  const open = (): void => {
    if (panel) {
      panel.reveal(vscode.ViewColumn.Active)
      void push()
      return
    }

    panel = vscode.window.createWebviewPanel(
      'codingVoiceSettings',
      'Coding Voice — Settings',
      vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true },
    )
    panel.webview.html = html()

    panel.webview.onDidReceiveMessage(async (message: Record<string, unknown>) => {
      const type = message.type

      if (type === 'ready') {
        await push()
      } else if (type === 'set') {
        // Klucze i wartości pochodzą wprost z kontrolek, które sami wystawiliśmy — enum po stronie
        // konfiguracji i tak odrzuci cokolwiek spoza zakresu.
        await updateSetting(message.key as keyof Settings, message.value as never)
      } else if (type === 'volume') {
        applyVolume(Number(message.value), Boolean(message.commit))
      } else if (type === 'apiKey') {
        const engine = message.engine as EngineId
        const value = String(message.value ?? '').trim()
        await secrets.setApiKey(engine, value || undefined)
        void vscode.window.showInformationMessage(value ? 'API key saved.' : 'API key removed.')
        await push()
      } else if (type === 'playTest') {
        // Świadomy test: gramy niezależnie od przełącznika „Read aloud" (jak przycisk play).
        // Ten sam tor co czytanie odpowiedzi, więc bierze bieżący silnik/głos/język/tempo/głośność.
        controller.speakNew(VOICE_TEST_TEXT)
      } else if (type === 'diagnostics') {
        const document = await vscode.workspace.openTextDocument(vscode.Uri.file(logFile))
        await vscode.window.showTextDocument(document)
      } else if (type === 'rawSettings') {
        await openSettingsScreen('@ext:larspunx.coding-voice')
      } else if (type === 'music') {
        await vscode.env.openExternal(vscode.Uri.parse(SPOTIFY_ALBUM))
      } else if (type === 'voiceDesign') {
        await vscode.env.openExternal(vscode.Uri.parse(ELEVENLABS_VOICE_DESIGN))
      } else if (type === 'kofi') {
        await vscode.env.openExternal(vscode.Uri.parse(KOFI_URL))
      }
    })

    panel.onDidDispose(() => {
      if (restartTimer) clearTimeout(restartTimer)
      panel = undefined
    })
  }

  return {
    open,
    refresh: () => void push(),
    dispose: () => {
      if (restartTimer) clearTimeout(restartTimer)
      panel?.dispose()
    },
  }
}

/* Typy pomocnicze tylko po to, żeby literki opcji zgadzały się z konfiguracją. */
const SCOPES: ReadScope[] = ['full', 'essentials', 'ending']
const ENGINES: EngineId[] = ['system', 'elevenlabs']
const VOICES: VoiceGender[] = ['female', 'male']
const LANGUAGES: Array<Language | 'auto'> = ['auto', 'en', 'pl']

function nonce(): string {
  let text = ''
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) text += chars.charAt(Math.floor(Math.random() * chars.length))
  return text
}

function html(): string {
  const n = nonce()
  // Referencje do stałych, żeby TypeScript nie uznał ich za nieużywane, a jednocześnie żeby lista
  // opcji w HTML miała jedno źródło prawdy z konfiguracją.
  void SCOPES
  void ENGINES
  void VOICES
  void LANGUAGES
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
    background: var(--vscode-editor-background);
    margin: 0;
    padding: 28px;
    font-size: 13px;
  }
  .wrap { max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; gap: 4px; }
  h1 { font-size: 18px; font-weight: 600; margin: 0 0 4px; }
  .sub { opacity: 0.6; margin: 0 0 20px; font-size: 12px; }
  .group {
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.55;
    margin: 22px 0 6px;
  }
  .row {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 10px 0; border-bottom: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.15));
  }
  .row:last-child { border-bottom: none; }
  .label { display: flex; flex-direction: column; gap: 2px; }
  .label .name { font-weight: 500; }
  .label .desc { opacity: 0.55; font-size: 11px; }
  .control { flex: 0 0 auto; display: flex; align-items: center; gap: 10px; }
  select, input[type="text"], input[type="password"] {
    background: var(--vscode-settings-dropdownBackground, var(--vscode-input-background));
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-settings-dropdownBorder, var(--vscode-input-border, transparent));
    border-radius: 4px; padding: 5px 8px; font-family: inherit; font-size: 12px; min-width: 150px;
  }
  input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--vscode-focusBorder); }
  button {
    background: var(--vscode-button-background); color: var(--vscode-button-foreground);
    border: none; border-radius: 4px; padding: 6px 12px; font-family: inherit; font-size: 12px;
    cursor: pointer;
  }
  button.secondary {
    background: var(--vscode-button-secondaryBackground, transparent);
    color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
    border: 1px solid var(--vscode-button-border, rgba(128,128,128,0.4));
  }
  button:hover { background: var(--vscode-button-hoverBackground); }
  .slider-row { display: flex; flex-direction: column; gap: 8px; padding: 12px 0; border-bottom: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.15)); }
  .slider-top { display: flex; align-items: baseline; justify-content: space-between; }
  .slider-val { font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .slider-line { display: flex; align-items: center; gap: 12px; }
  .icon { display: inline-flex; align-items: center; opacity: 0.65; user-select: none; }
  .icon svg { width: 16px; height: 16px; display: block; }
  input[type="range"] {
    -webkit-appearance: none; appearance: none; flex: 1; height: 6px; border-radius: 999px;
    background: var(--vscode-scrollbarSlider-background); outline: none; cursor: pointer;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%;
    background: var(--vscode-button-background, var(--vscode-focusBorder));
    border: 2px solid var(--vscode-editor-background); box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    cursor: grab;
  }
  input[type="range"]:active::-webkit-slider-thumb { cursor: grabbing; }
  input[type="range"]::-moz-range-thumb {
    width: 18px; height: 18px; border-radius: 50%;
    background: var(--vscode-button-background, var(--vscode-focusBorder));
    border: 2px solid var(--vscode-editor-background); cursor: grab;
  }
  .key-line { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
  .key-desc { display: inline-flex; align-items: center; gap: 5px; }
  .key-check { width: 12px; height: 12px; flex: none; }
  .key-check[hidden] { display: none; }
  #apiKey.has-key::placeholder { color: var(--vscode-foreground); opacity: 0.75; letter-spacing: 1px; }
  .key-status { font-size: 11px; opacity: 0.6; }
  .hint { opacity: 0.5; font-size: 11px; line-height: 1.5; margin-top: 4px; }
  .info {
    background: var(--vscode-textBlockQuote-background, rgba(128,128,128,0.08));
    border-left: 3px solid var(--vscode-focusBorder);
    border-radius: 4px; padding: 12px 14px; margin: 8px 0 4px;
    font-size: 12px; line-height: 1.6;
  }
  .test {
    background: var(--vscode-textBlockQuote-background, rgba(128,128,128,0.08));
    border: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.2));
    border-radius: 6px; padding: 14px 16px; margin: 4px 0 8px;
  }
  .test-text { margin: 0 0 12px; font-size: 12.5px; line-height: 1.6; opacity: 0.9; }
  .test-play {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 16px; font-size: 12px; font-weight: 600; border-radius: 999px;
  }
  .test-play svg { width: 12px; height: 12px; flex: none; }
  .info .h { font-weight: 600; display: block; margin-bottom: 6px; }
  .info b { font-weight: 600; }
  .info .tag {
    display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
    padding: 1px 6px; border-radius: 999px; margin-right: 6px; vertical-align: middle;
  }
  .info .tag.free { background: rgba(29,185,84,0.18); color: #1db954; }
  .info .tag.paid { background: rgba(224,168,0,0.2); color: #e0a800; }
  .info p { margin: 8px 0 0; }
  .info .last { margin-top: 10px; opacity: 0.7; }
  .link-btn {
    margin-top: 10px; background: transparent; color: var(--vscode-textLink-foreground);
    border: 1px solid var(--vscode-textLink-foreground); border-radius: 4px; padding: 5px 12px;
    font-size: 12px; cursor: pointer;
  }
  .link-btn:hover { background: var(--vscode-textLink-foreground); color: var(--vscode-editor-background); }
  .footer {
    margin-top: 28px; padding-top: 18px;
    border-top: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.15));
    display: flex; flex-direction: column; gap: 12px; align-items: flex-start;
  }
  .footer .note { margin: 0; font-size: 12px; line-height: 1.6; opacity: 0.8; }
  .footer .who { font-weight: 600; opacity: 1; }
  .footer .signoff { font-style: italic; opacity: 0.9; }
  .spotify {
    display: inline-flex; align-items: center; gap: 8px;
    background: #1db954; color: #05240f; border: none; border-radius: 999px;
    padding: 7px 16px; font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer;
  }
  .spotify:hover { background: #1ed760; }
  .spotify svg, .kofi svg { width: 14px; height: 14px; flex: none; }
  .footer .buttons { display: flex; gap: 10px; flex-wrap: wrap; }
  .kofi {
    display: inline-flex; align-items: center; gap: 8px;
    background: #29abe0; color: #04222e; border: none; border-radius: 999px;
    padding: 7px 16px; font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer;
  }
  .kofi:hover { background: #3dbcef; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>Coding Voice</h1>
    <p class="sub">Every setting in one place. Changes apply immediately.</p>

    <div class="group">Voice test</div>
    <div class="test">
      <p class="test-text">${VOICE_TEST_TEXT}</p>
      <button id="playTest" class="test-play"><svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 3l9 5-9 5z"/></svg>Play voice test</button>
    </div>

    <div class="row">
      <div class="label"><span class="name">Read aloud</span><span class="desc">Speak each finished agent answer</span></div>
      <div class="control"><input type="checkbox" id="enabled" /></div>
    </div>

    <div class="group">Voice</div>

    <div class="row">
      <div class="label"><span class="name">Engine</span><span class="desc">System is free & offline; cloud engines bill your own account</span></div>
      <div class="control">
        <select id="engine">
          <option value="system">System — free, offline</option>
          <option value="elevenlabs">ElevenLabs — your API key</option>
        </select>
      </div>
    </div>
    <div class="hint">Changing the voice engine applies to every project. If you're working in several
      Cursor windows at once, reload them (or restart Cursor) so they all switch to the new voice.</div>

    <div class="row">
      <div class="label"><span class="name">Narrator</span></div>
      <div class="control">
        <select id="voice"><option value="female">Female</option><option value="male">Male</option></select>
      </div>
    </div>

    <div class="row">
      <div class="label"><span class="name">Language</span></div>
      <div class="control">
        <select id="language">
          <option value="auto">Auto-detect</option>
          <option value="en">English</option>
          <option value="pl">Polski</option>
        </select>
      </div>
    </div>

    <div class="slider-row">
      <div class="slider-top">
        <span class="name">Speed</span>
        <span class="slider-val"><span id="rateNum">1.00</span>×</span>
      </div>
      <div class="slider-line">
        <span class="icon" title="Slower"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="5.6"/><path d="M8 8 5.2 5.6"/></svg></span>
        <input type="range" id="rate" min="0.5" max="2" step="0.05" />
        <span class="icon" title="Faster"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="5.6"/><path d="M8 8 10.8 5.6"/></svg></span>
      </div>
    </div>

    <div class="slider-row">
      <div class="slider-top">
        <span class="name">Reading volume</span>
        <span class="slider-val"><span id="volNum">100</span>%</span>
      </div>
      <div class="slider-line">
        <span class="icon" title="Quieter"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h2.5L8 3v10L4.5 10H2z"/><path d="M10.5 6.5c.7.8.7 2.2 0 3"/></svg></span>
        <input type="range" id="volume" min="0" max="100" step="1" />
        <span class="icon" title="Louder"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h2.5L8 3v10L4.5 10H2z"/><path d="M10.5 6c.9 1 .9 3 0 4"/><path d="M12.3 4.5c1.6 1.7 1.6 5.3 0 7"/></svg></span>
      </div>
      <div class="hint">Grab the dot and drag. Changes only this voice — your system volume stays put.
        While an answer is playing, the new level takes over the current sentence.</div>
    </div>

    <div class="group">Other apps</div>

    <div class="row">
      <div class="label"><span class="name">Quiet other apps while reading</span><span class="desc">Lower music/video while a summary plays, then restore. Windows: any app (incl. a browser on YouTube). macOS: Apple Music &amp; Spotify.</span></div>
      <div class="control"><input type="checkbox" id="duckSystemAudio" /></div>
    </div>

    <div class="slider-row duck">
      <div class="slider-top">
        <span class="name">Keep at</span>
        <span class="slider-val"><span id="duckLevelNum">40</span>%</span>
      </div>
      <div class="slider-line">
        <span class="icon" title="Quieter"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h2.5L8 3v10L4.5 10H2z"/><path d="M10.5 6.5c.7.8.7 2.2 0 3"/></svg></span>
        <input type="range" id="duckLevel" min="0" max="100" step="1" />
        <span class="icon" title="Louder"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h2.5L8 3v10L4.5 10H2z"/><path d="M10.5 6c.9 1 .9 3 0 4"/><path d="M12.3 4.5c1.6 1.7 1.6 5.3 0 7"/></svg></span>
      </div>
      <div class="hint">Share of each app's own volume kept while a summary is read. 100% = untouched, 50% = half as loud. Lower = quieter background.</div>
    </div>

    <div class="slider-row duck">
      <div class="slider-top">
        <span class="name">Fade</span>
        <span class="slider-val"><span id="duckFadeNum">0.6</span>s</span>
      </div>
      <div class="slider-line">
        <span class="icon" title="Instant"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v6l4 2"/><circle cx="8" cy="8" r="6"/></svg></span>
        <input type="range" id="duckFade" min="0" max="5000" step="100" />
        <span class="icon" title="Slower"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 1.5"/></svg></span>
      </div>
      <div class="hint">How smoothly the volume slides down when reading starts and back up when it ends. 0 is instant.</div>
    </div>

    <div class="group">ElevenLabs</div>

    <div class="info">
      <span class="h">How to use ElevenLabs — free or paid</span>
      <p><span class="tag free">FREE</span>You can use ElevenLabs without paying, but its built-in
        voices are blocked over the API on the free plan. The workaround: create <b>your own</b> voice
        (that one is allowed). Open <b>Voice Design</b> in ElevenLabs, generate a voice, open it, copy
        its <b>Voice ID</b>, and paste it into the field below. Then pick Engine = ElevenLabs and you'll
        hear it.</p>
      <p><span class="tag paid">PAID</span>On any paid plan (Starter and up) the built-in voices work
        too — just leave the Voice ID field empty and the female/male default is used.</p>
      <p class="last">Either way you bring your own API key and ElevenLabs bills you directly — there's
        no account or markup on our side.</p>
      <button id="voiceDesign" class="link-btn">Open ElevenLabs Voice Design</button>
    </div>

    <div class="row">
      <div class="label"><span class="name">Voice ID</span><span class="desc">Free plan: paste the ID of a voice you created in Voice Design. Paid plan: leave empty for the default.</span></div>
      <div class="control"><input type="text" id="elevenLabsVoiceId" placeholder="leave empty for default" /></div>
    </div>

    <div class="row">
      <div class="label"><span class="name">API key</span><span class="desc key-desc"><svg class="key-check" id="keyOk" viewBox="0 0 16 16" fill="none" stroke="#3fb950" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" hidden><path d="M3 8.5 6.5 12 13 4.5"/></svg><span id="keyStatus">Not set</span></span></div>
      <div class="control key-line">
        <input type="password" id="apiKey" placeholder="paste key to save" />
        <button id="saveKey">Save</button>
        <button id="clearKey" class="secondary">Remove</button>
      </div>
    </div>

    <div class="slider-row tunable">
      <div class="slider-top"><span class="name">Stability</span><span class="slider-val"><span id="stabNum">50</span>%</span></div>
      <div class="slider-line">
        <span class="icon" title="Expressive"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 8h2l1.5-4.5L8 13l2-8 1.5 3h3"/></svg></span>
        <input type="range" id="elevenLabsStability" min="0" max="100" step="1" />
        <span class="icon" title="Consistent"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 8h13"/></svg></span>
      </div>
      <div class="hint">Lower = more expressive and variable. Higher = calmer and more consistent.</div>
    </div>

    <div class="slider-row tunable">
      <div class="slider-top"><span class="name">Similarity</span><span class="slider-val"><span id="simNum">75</span>%</span></div>
      <div class="slider-line">
        <span class="icon" title="Loose"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 8c1.4-3.2 3.4-3.2 4.8 0s3.4 3.2 4.8 0"/></svg></span>
        <input type="range" id="elevenLabsSimilarity" min="0" max="100" step="1" />
        <span class="icon" title="Precise"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="2.3"/></svg></span>
      </div>
      <div class="hint">How closely the output sticks to the original voice.</div>
    </div>

    <div class="slider-row tunable">
      <div class="slider-top"><span class="name">Style</span><span class="slider-val"><span id="styleNum">0</span>%</span></div>
      <div class="slider-line">
        <span class="icon" title="Neutral"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h8"/></svg></span>
        <input type="range" id="elevenLabsStyle" min="0" max="100" step="1" />
        <span class="icon" title="Theatrical"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5l1.5 4.9 4.9 1.6-4.9 1.6L8 14.5 6.5 9.6 1.6 8l4.9-1.6z"/></svg></span>
      </div>
      <div class="hint">Style exaggeration — higher is more theatrical but slower. 0 is neutral.</div>
    </div>

    <div class="row tunable">
      <div class="label"><span class="name">Speaker boost</span><span class="desc">Strengthen resemblance to the chosen voice</span></div>
      <div class="control"><input type="checkbox" id="elevenLabsSpeakerBoost" /></div>
    </div>

    <div class="group">What gets read</div>

    <div class="row">
      <div class="label"><span class="name">Scope</span><span class="desc">How much of the answer to read</span></div>
      <div class="control">
        <select id="scope">
          <option value="full">Whole answer</option>
          <option value="essentials">Key points only</option>
          <option value="ending">Just the ending</option>
        </select>
      </div>
    </div>

    <div class="row">
      <div class="label"><span class="name">Length limit</span><span class="desc">Cloud engines bill per character</span></div>
      <div class="control">
        <select id="maxCharacters">
          <option value="0">No limit</option>
          <option value="400">~400 characters</option>
          <option value="800">~800 characters</option>
          <option value="1500">~1500 characters</option>
        </select>
      </div>
    </div>

    <div class="row">
      <div class="label"><span class="name">Skip code blocks</span><span class="desc">Drop fenced code and tables — noise when read aloud</span></div>
      <div class="control"><input type="checkbox" id="skipCodeBlocks" /></div>
    </div>

    <div class="row">
      <div class="label"><span class="name">Announce project name</span><span class="desc">Start each summary with the project name — handy when several windows read at once</span></div>
      <div class="control"><input type="checkbox" id="announceProject" /></div>
    </div>

    <div class="group">Extension</div>

    <div class="row">
      <div class="label"><span class="name">Diagnostics</span><span class="desc">Open the hook log</span></div>
      <div class="control"><button id="diagnostics" class="secondary">Open log</button></div>
    </div>

    <div class="row">
      <div class="label"><span class="name">Raw settings</span><span class="desc">Open the standard settings editor</span></div>
      <div class="control"><button id="rawSettings" class="secondary">Open</button></div>
    </div>

    <div class="footer">
      <p class="note"><span class="who">Coding Voice by Lars.</span><br />
        Enjoy the extension. I'd love you to hear my music — recorded analog, no AI.</p>
      <p class="note">If this tool saves you some time, you can buy me a coffee — anything is
        appreciated, and it keeps the project going :)</p>
      <p class="note signoff">Cheers, Lars :)</p>
      <div class="buttons">
        <button id="music" class="spotify"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12V4l7 1.6"/><circle cx="4.4" cy="12" r="1.6"/><circle cx="11.4" cy="10.6" r="1.6"/></svg>Listen on Spotify</button>
        <button id="kofi" class="kofi"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h8v3.5a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z"/><path d="M11 7h1.6a1.6 1.6 0 0 1 0 3.2H11"/><path d="M5 2.5v1.6M8 2.5v1.6"/></svg>Buy me a coffee</button>
      </div>
    </div>
  </div>

<script nonce="${n}">
  const vscode = acquireVsCodeApi();
  const $ = (id) => document.getElementById(id);
  const set = (key, value) => vscode.postMessage({ type: 'set', key, value });

  // Zwykłe kontrolki: przełącznik i listy zapisują wprost.
  $('enabled').addEventListener('change', (e) => set('enabled', e.target.checked));
  $('skipCodeBlocks').addEventListener('change', (e) => set('skipCodeBlocks', e.target.checked));
  $('announceProject').addEventListener('change', (e) => set('announceProject', e.target.checked));
  $('duckSystemAudio').addEventListener('change', (e) => set('duckSystemAudio', e.target.checked));

  // Ściszanie innych aplikacji: poziom w %, czas fade pokazujemy w sekundach, zapis po puszczeniu.
  $('duckLevel').addEventListener('input', (e) => { $('duckLevelNum').textContent = e.target.value; });
  $('duckLevel').addEventListener('change', (e) => set('duckLevel', Number(e.target.value)));
  $('duckFade').addEventListener('input', (e) => { $('duckFadeNum').textContent = (Number(e.target.value) / 1000).toFixed(1); });
  $('duckFade').addEventListener('change', (e) => set('duckFade', Number(e.target.value)));
  for (const id of ['engine', 'voice', 'language', 'scope']) {
    $(id).addEventListener('change', (e) => set(id, e.target.value));
  }
  $('maxCharacters').addEventListener('change', (e) => set('maxCharacters', Number(e.target.value)));

  // Tempo: liczba rusza się pod suwakiem, wartość zapisujemy po puszczeniu.
  $('rate').addEventListener('input', (e) => { $('rateNum').textContent = Number(e.target.value).toFixed(2); });
  $('rate').addEventListener('change', (e) => set('rate', Number(e.target.value)));

  // Głośność: liczba na żywo, zapis natychmiast (input), słyszalny skok po puszczeniu (change).
  $('volume').addEventListener('input', (e) => {
    $('volNum').textContent = e.target.value;
    vscode.postMessage({ type: 'volume', value: Number(e.target.value), commit: false });
  });
  $('volume').addEventListener('change', (e) => {
    vscode.postMessage({ type: 'volume', value: Number(e.target.value), commit: true });
  });

  // ID głosu ElevenLabs zapisujemy po opuszczeniu pola, żeby nie strzelać przy każdym znaku.
  $('elevenLabsVoiceId').addEventListener('change', (e) => set('elevenLabsVoiceId', e.target.value));

  // Pokrętła brzmienia ElevenLabs: pokazujemy w procentach, zapisujemy jako 0–1 po puszczeniu.
  const tune = (sliderId, numId, key) => {
    $(sliderId).addEventListener('input', (e) => { $(numId).textContent = e.target.value; });
    $(sliderId).addEventListener('change', (e) => set(key, Number(e.target.value) / 100));
  };
  tune('elevenLabsStability', 'stabNum', 'elevenLabsStability');
  tune('elevenLabsSimilarity', 'simNum', 'elevenLabsSimilarity');
  tune('elevenLabsStyle', 'styleNum', 'elevenLabsStyle');
  $('elevenLabsSpeakerBoost').addEventListener('change', (e) => set('elevenLabsSpeakerBoost', e.target.checked));

  // Kontrolki dotyczące wyłącznie ElevenLabs — przy innym silniku nic nie robią, więc je gasimy.
  const elevenOnly = ['elevenLabsVoiceId', 'elevenLabsStability', 'elevenLabsSimilarity', 'elevenLabsStyle', 'elevenLabsSpeakerBoost'];
  const setElevenEnabled = (on) => {
    for (const id of elevenOnly) {
      const el = $(id);
      el.disabled = !on;
      const box = el.closest('.row, .slider-row');
      if (box) box.style.opacity = on ? '' : '0.4';
    }
  };
  // Reaguj natychmiast na zmianę silnika, nie czekając na odbicie stanu z hosta.
  $('engine').addEventListener('change', (e) => setElevenEnabled(e.target.value === 'elevenlabs'));

  $('saveKey').addEventListener('click', () => {
    vscode.postMessage({ type: 'apiKey', engine: 'elevenlabs', value: $('apiKey').value });
    $('apiKey').value = '';
  });
  $('clearKey').addEventListener('click', () => {
    vscode.postMessage({ type: 'apiKey', engine: 'elevenlabs', value: '' });
    $('apiKey').value = '';
  });

  $('playTest').addEventListener('click', () => vscode.postMessage({ type: 'playTest' }));
  $('diagnostics').addEventListener('click', () => vscode.postMessage({ type: 'diagnostics' }));
  $('rawSettings').addEventListener('click', () => vscode.postMessage({ type: 'rawSettings' }));
  $('music').addEventListener('click', () => vscode.postMessage({ type: 'music' }));
  $('kofi').addEventListener('click', () => vscode.postMessage({ type: 'kofi' }));
  $('voiceDesign').addEventListener('click', () => vscode.postMessage({ type: 'voiceDesign' }));

  const draggingVolume = () => document.activeElement === $('volume');

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || msg.type !== 'state') return;
    const s = msg.state;
    $('enabled').checked = s.enabled;
    $('skipCodeBlocks').checked = s.skipCodeBlocks;
    $('announceProject').checked = s.announceProject;
    $('duckSystemAudio').checked = s.duckSystemAudio;
    $('duckLevel').value = String(Math.round(s.duckLevel)); $('duckLevelNum').textContent = String(Math.round(s.duckLevel));
    $('duckFade').value = String(Math.round(s.duckFade)); $('duckFadeNum').textContent = (Math.round(s.duckFade) / 1000).toFixed(1);
    $('engine').value = s.engine === 'elevenlabs' ? 'elevenlabs' : 'system';
    $('voice').value = s.voice;
    $('language').value = s.language;
    $('scope').value = s.scope;
    $('maxCharacters').value = String(s.maxCharacters);
    $('elevenLabsVoiceId').value = s.elevenLabsVoiceId || '';
    const pct = (v) => String(Math.round(v * 100));
    $('elevenLabsStability').value = pct(s.elevenLabsStability); $('stabNum').textContent = pct(s.elevenLabsStability);
    $('elevenLabsSimilarity').value = pct(s.elevenLabsSimilarity); $('simNum').textContent = pct(s.elevenLabsSimilarity);
    $('elevenLabsStyle').value = pct(s.elevenLabsStyle); $('styleNum').textContent = pct(s.elevenLabsStyle);
    $('elevenLabsSpeakerBoost').checked = s.elevenLabsSpeakerBoost;
    setElevenEnabled(s.engine === 'elevenlabs');
    $('rate').value = String(s.rate);
    $('rateNum').textContent = Number(s.rate).toFixed(2);
    // Nie wyrywamy suwaka głośności spod palca, gdy właśnie go trzymamy.
    if (!draggingVolume()) {
      $('volume').value = String(Math.round(s.volume));
      $('volNum').textContent = String(Math.round(s.volume));
    }
    $('keyStatus').textContent = s.engine === 'elevenlabs'
      ? (s.hasElevenLabsKey ? 'ElevenLabs key saved' : 'ElevenLabs key not set')
      : 'Not needed for the system voice';
    // Klucza NIE odsyłamy z hosta (to sekret) — ale gdy jest zapisany, dajemy znać wizualnie:
    // pole pokazuje w placeholderze gwiazdki „zajętości", a przy statusie zapala się zielony check.
    const keySaved = s.engine === 'elevenlabs' && s.hasElevenLabsKey;
    const api = $('apiKey');
    api.placeholder = keySaved ? '••••••••••••••••' : 'paste key to save';
    api.classList.toggle('has-key', keySaved);
    $('keyOk').hidden = !keySaved;
  });

  vscode.postMessage({ type: 'ready' });
</script>
</body>
</html>`
}
