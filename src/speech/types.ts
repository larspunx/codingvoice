import type { Language } from '../text/language.js'

export type SpeechState = 'idle' | 'speaking' | 'paused'

export type VoiceGender = 'female' | 'male'

export interface SpeakOptions {
  language: Language
  voice: VoiceGender
  /** Mnożnik tempa, 1 = normalne. Każdy silnik przelicza go na własną skalę. */
  rate: number
  /**
   * Głośność samego czytania, 0–1, gdzie 1 = pełna głośność silnika.
   *
   * Skaluje WYŁĄCZNIE nasz strumień, nie ruszając głośności systemowej — po to, żeby dało się
   * ściszyć lektora względem muzyki czy rozmowy lecących równolegle z innych aplikacji.
   */
  volume: number
}

export interface SpeechEngine {
  readonly id: string
  /** Czy silnik da się w ogóle użyć na tej maszynie (jest binarka / jest klucz API). */
  isAvailable(): Promise<boolean>
  /**
   * Wypowiada JEDEN fragment i kończy się dopiero, gdy fragment przestał brzmieć.
   * Przerwanie idzie przez `signal` — to jest podstawa pauzy i stopu.
   */
  speak(text: string, options: SpeakOptions, signal: AbortSignal): Promise<void>
}
