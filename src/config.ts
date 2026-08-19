/**
 * Ustawienia — jedno miejsce, w którym `vscode.workspace.getConfiguration` jest wołane.
 *
 * Reszta kodu dostaje zwykłe wartości, dzięki czemu daje się testować bez edytora, a zmiana
 * nazwy klucza w `package.json` ma dokładnie jeden punkt do poprawienia.
 */
import * as vscode from 'vscode'
import type { Language } from './text/language.js'
import type { SpeakOptions, VoiceGender } from './speech/types.js'
import type { ReadScope } from './text/scope.js'

export type EngineId = 'system' | 'elevenlabs' | 'openai'

export interface Settings {
  enabled: boolean
  engine: EngineId
  /** Ile z odpowiedzi ma zostać przeczytane — patrz `text/scope.ts`. */
  scope: ReadScope
  voice: VoiceGender
  /** Opcjonalne ID głosu ElevenLabs. Puste = domyślny głos dla wybranej płci. */
  elevenLabsVoiceId: string
  /** ElevenLabs `voice_settings` — niezależne od planu, wpływają na brzmienie syntezy. */
  elevenLabsStability: number
  elevenLabsSimilarity: number
  elevenLabsStyle: number
  elevenLabsSpeakerBoost: boolean
  /** `auto` = rozpoznaj z treści odpowiedzi. */
  language: Language | 'auto'
  rate: number
  /** Głośność czytania w procentach (0–100) względem tego, co robi reszta systemu. */
  volume: number
  maxCharacters: number
  skipCodeBlocks: boolean
  /** Poprzedź każde podsumowanie nazwą projektu — po głosie od razu wiadomo, którego okna dotyczy. */
  announceProject: boolean
  /** Ścisz inne aplikacje (muzyka, YouTube) na czas czytania i przywróć po nim — patrz `speech/duck.ts`. */
  duckSystemAudio: boolean
  /** Ile z WŁASNEJ głośności każdej aplikacji zostawić na czas czytania, w procentach (0–100):
   *  100 = bez zmian, 50 = o połowę ciszej, 0 = cisza. Względne, nie bezwzględne — patrz `speech/duck.ts`. */
  duckLevel: number
  /** Czas płynnego przejścia głośności (fade) w obie strony, w milisekundach. 0 = skokowo. */
  duckFade: number
  /** Zagraj krótki dźwięk, gdy agent kończy turę i czeka na Ciebie, ale nie ma nic do przeczytania
   *  (pytanie przez narzędzie, plan, same edycje) — patrz `RING_SIGNAL` i hook `speak`. */
  ring: boolean
}

const SECTION = 'codingVoice'

export function readSettings(): Settings {
  const config = vscode.workspace.getConfiguration(SECTION)
  return {
    enabled: config.get<boolean>('enabled', true),
    engine: config.get<EngineId>('engine', 'system'),
    scope: config.get<ReadScope>('scope', 'full'),
    voice: config.get<VoiceGender>('voice', 'female'),
    elevenLabsVoiceId: config.get<string>('elevenLabsVoiceId', ''),
    elevenLabsStability: config.get<number>('elevenLabsStability', 0.5),
    elevenLabsSimilarity: config.get<number>('elevenLabsSimilarity', 0.75),
    elevenLabsStyle: config.get<number>('elevenLabsStyle', 0),
    elevenLabsSpeakerBoost: config.get<boolean>('elevenLabsSpeakerBoost', true),
    language: config.get<Language | 'auto'>('language', 'auto'),
    rate: config.get<number>('rate', 1),
    volume: config.get<number>('volume', 100),
    maxCharacters: config.get<number>('maxCharacters', 0),
    skipCodeBlocks: config.get<boolean>('skipCodeBlocks', true),
    announceProject: config.get<boolean>('announceProject', false),
    duckSystemAudio: config.get<boolean>('duckSystemAudio', false),
    duckLevel: config.get<number>('duckLevel', 40),
    duckFade: config.get<number>('duckFade', 600),
    ring: config.get<boolean>('ring', true),
  }
}

export async function updateSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K],
): Promise<void> {
  // Zapis globalny, nie do workspace: ustawienia głosu są własnością osoby, nie projektu —
  // nikt nie chce commitować swojego tempa mowy do repozytorium zespołu.
  await vscode.workspace
    .getConfiguration(SECTION)
    .update(key, value, vscode.ConfigurationTarget.Global)
}

export function speakOptions(settings: Settings, detected: Language): SpeakOptions {
  return {
    language: settings.language === 'auto' ? detected : settings.language,
    voice: settings.voice,
    rate: settings.rate,
    // Procenty są dla użytkownika, silniki liczą na ułamku. Domknięcie do 0–1 chroni przed
    // ręcznie wpisaną wartością spoza zakresu w `settings.json`.
    volume: Math.max(0, Math.min(1, settings.volume / 100)),
  }
}

export function affectsUs(event: vscode.ConfigurationChangeEvent): boolean {
  return event.affectsConfiguration(SECTION)
}
