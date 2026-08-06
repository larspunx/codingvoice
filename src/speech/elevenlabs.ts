/**
 * Silnik ElevenLabs — naturalne głosy, na własnym kluczu API użytkownika.
 *
 * W przeciwieństwie do systemowego ten silnik potrzebuje klucza, którego nie zna sam z siebie —
 * dostaje go przez wstrzyknięty getter, żeby nie importować `vscode` ani SecretStorage i dać się
 * przetestować. Klucz jest własnością osoby, bilingowany przez ElevenLabs wprost; my nie stoimy
 * po drodze i nie widzimy ani grosza.
 *
 * Dwa świadome wybory kosztowe, bo tu płaci się od znaku:
 *   1. Cache ostatnich klipów. `restartUtterance()` (suwak głośności w trakcie mowy) woła `speak()`
 *      ponownie z tym samym tekstem i głosem — bez cache każde drgnięcie suwaka byłoby nowym
 *      rachunkiem. Głośność wchodzi dopiero przy ODTWARZANIU, więc ten sam klip obsługuje każdy
 *      poziom. Klucz cache to tekst + głos + tempo, bo tylko one zmieniają syntezę.
 *   2. Tempo idzie w `voice_settings.speed`, nie w odtwarzacz — zmiana tempa w afplay ciągnie
 *      za sobą wysokość głosu, a ElevenLabs zmienia samo tempo.
 */
import { playAudio } from './playback.js'
import type { Language } from '../text/language.js'
import type { SpeakOptions, SpeechEngine, VoiceGender } from './types.js'

const API_BASE = 'https://api.elevenlabs.io/v1/text-to-speech'
/**
 * Model wymuszający język przez `language_code`.
 *
 * `eleven_multilingual_v2` brzmi odrobinę pełniej, ale NIE przyjmuje `language_code` — sam zgaduje
 * język token po tokenie. Przy krótkich fragmentach (sama liczba, „2026", kod) zgadywanie leci w
 * losowy, często azjatycki akcent — użytkownik słyszy „po chińsku". `turbo_v2_5` i `flash_v2_5` jako
 * jedyne pozwalają wymusić język (i włączają jego reguły normalizacji), a wspierają polski. Wybieramy
 * turbo: pewna wymowa waży tu więcej niż śladowa różnica w barwie.
 */
const MODEL = 'eleven_turbo_v2_5'
/** MP3 gra wprost każdy z naszych odtwarzaczy (afplay, ffplay, MediaPlayer); PCM wymagałby
 *  doklejania nagłówka WAV. 128 kbps to więcej niż trzeba dla mowy, a różnicy w cenie nie ma. */
const OUTPUT_FORMAT = 'mp3_44100_128'

/**
 * DOMYŚLNE głosy platformy — Aria i Brian — a nie „biblioteczne".
 *
 * Historia dwóch błędów, które to ustawiły:
 *   402 — pierwotne Rachel/Adam ElevenLabs przeklasyfikował na głosy z biblioteki, a te na darmowym
 *         planie są przez API zablokowane („paid_plan_required").
 *   401 — próba pobrania listy głosów konta (`GET /v1/voices`) leci 401 przy kluczu z ograniczonymi
 *         uprawnieniami: klucz może syntezować mowę, ale nie ma prawa czytać listy głosów.
 *
 * Głosy domyślne omijają jedno i drugie: są dostępne do syntezy na każdym planie i nie wymagają
 * osobnego uprawnienia. Kto chce inny głos, wkleja własne Voice ID w ustawieniach.
 */
const DEFAULT_VOICES: Record<VoiceGender, string> = {
  female: '9BWtsMINqrJLrRacOk9x', // Aria
  male: 'nPczCjzI2devNBz1zQrb', // Brian
}

/** ElevenLabs przyjmuje `speed` w 0.7–1.2; nasze tempo 0.5–2 domykamy do tego okna. */
function toSpeed(rate: number): number {
  return Math.max(0.7, Math.min(1.2, rate))
}

/** `voice_settings` ElevenLabs — brzmienie syntezy, niezależne od planu. */
export interface ElevenLabsVoiceSettings {
  stability: number
  similarity: number
  style: number
  speakerBoost: boolean
}

export interface ElevenLabsDeps {
  /** Klucz z SecretStorage. Getter, bo użytkownik może go dodać już po starcie rozszerzenia. */
  apiKey: () => Thenable<string | undefined> | Promise<string | undefined>
  /** Nadpisanie ID głosu z ustawień — puste znaczy „użyj domyślnego dla płci". */
  voiceIdOverride?: () => string | undefined
  /** Pokrętła brzmienia z ustawień. Getter, żeby zmiana działała bez restartu. */
  voiceSettings?: () => ElevenLabsVoiceSettings
}

const DEFAULT_VOICE_SETTINGS: ElevenLabsVoiceSettings = {
  stability: 0.5,
  similarity: 0.75,
  style: 0,
  speakerBoost: true,
}

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n))

/** Ile klipów trzymać w cache. Na tyle, że przesuwanie suwaka głośności w obrębie jednej
 *  odpowiedzi trafia w cache, a nie tak dużo, żeby audio puchło w pamięci. */
const CACHE_LIMIT = 12

export function createElevenLabsEngine(deps: ElevenLabsDeps): SpeechEngine {
  // Wstawiając najświeższy klucz na koniec i usuwając najstarszy z początku, mamy zgrubne LRU
  // bez osobnej biblioteki.
  const cache = new Map<string, Buffer>()

  const remember = (key: string, bytes: Buffer): void => {
    cache.set(key, bytes)
    if (cache.size > CACHE_LIMIT) {
      const oldest = cache.keys().next().value
      if (oldest !== undefined) cache.delete(oldest)
    }
  }

  /** Nadpisanie z ustawień wygrywa; inaczej głos domyślny dla płci. Bez odpytywania API, żeby
   *  klucz z uprawnieniem tylko do syntezy (bez czytania listy głosów) też działał. */
  const pickVoice = (gender: VoiceGender): string => deps.voiceIdOverride?.() || DEFAULT_VOICES[gender]

  const synth = async (
    text: string,
    voiceId: string,
    speed: number,
    tuning: ElevenLabsVoiceSettings,
    language: Language,
    apiKey: string,
    signal: AbortSignal,
  ): Promise<Buffer> => {
    const response = await fetch(`${API_BASE}/${voiceId}?output_format=${OUTPUT_FORMAT}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'content-type': 'application/json',
        accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        // Kody 'pl'/'en' to już ISO 639-1 — wysyłamy wprost, żeby model nie zgadywał języka fragmentu.
        language_code: language,
        voice_settings: {
          stability: clamp01(tuning.stability),
          similarity_boost: clamp01(tuning.similarity),
          style: clamp01(tuning.style),
          use_speaker_boost: tuning.speakerBoost,
          speed,
        },
      }),
      signal,
    })

    if (!response.ok) {
      // Treść błędu ElevenLabs bywa pomocna (zły klucz, brak środków, nieznany głos) — bierzemy ją,
      // ale krótko, bo trafia do dymka w rogu edytora.
      const detail = await response.text().catch(() => '')
      const hint =
        response.status === 401
          ? 'ElevenLabs rejected the API key — check it in Coding Voice settings.'
          : response.status === 402
            ? "ElevenLabs' free plan blocks its default voices over the API. In ElevenLabs open Voice Design, create a voice (free, category \"generated\"), then paste its Voice ID in Coding Voice settings — or upgrade your ElevenLabs plan."
            : `ElevenLabs error ${response.status}. ${detail.slice(0, 200)}`.trim()
      throw new Error(hint)
    }

    return Buffer.from(await response.arrayBuffer())
  }

  return {
    id: 'elevenlabs',

    async isAvailable(): Promise<boolean> {
      return Boolean(await deps.apiKey())
    },

    async speak(text: string, options: SpeakOptions, signal: AbortSignal): Promise<void> {
      const apiKey = await deps.apiKey()
      if (!apiKey) {
        throw new Error('Add your ElevenLabs API key in Coding Voice settings to use this voice.')
      }

      const voiceId = pickVoice(options.voice)
      const speed = toSpeed(options.rate)
      const tuning = deps.voiceSettings?.() ?? DEFAULT_VOICE_SETTINGS
      // Cache po wszystkim, co zmienia syntezę — także po języku, bo ten sam tekst wymuszony jako
      // 'pl' i 'en' brzmi inaczej. Inaczej zmiana pokrętła grałaby ze starego klipu.
      const cacheKey = `${voiceId}:${options.language}:${speed}:${tuning.stability}:${tuning.similarity}:${tuning.style}:${tuning.speakerBoost}:${text}`

      let bytes = cache.get(cacheKey)
      if (!bytes) {
        bytes = await synth(text, voiceId, speed, tuning, options.language, apiKey, signal)
        if (signal.aborted) return // przerwane w trakcie pobierania — nie gramy przeterminowanego
        remember(cacheKey, bytes)
      }

      // Głośność dopiero tutaj: ten sam klip w cache obsługuje każdy poziom, więc suwak nie
      // generuje nowej syntezy ani nowego rachunku.
      await playAudio(bytes, options.volume, signal)
    },
  }
}
