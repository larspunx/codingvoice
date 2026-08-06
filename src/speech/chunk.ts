/**
 * Podział tekstu na fragmenty wypowiadane pojedynczo.
 *
 * To jest fundament pauzy działającej na wszystkich platformach. Prototyp pauzował sygnałem
 * SIGSTOP na procesie `say` — na Windows nie ma czego zatrzymać, a przy silnikach chmurowych
 * dźwięk leci z odtwarzacza, nie z syntezatora. Zamiast tego mówimy fragment po fragmencie:
 * pauza to „nie zaczynaj następnego", wznowienie to „graj dalej od bieżącego". Jedna implementacja
 * na macOS, Windows, Linux i na każdy silnik.
 *
 * Przy okazji rozwiązuje to koszt: silniki chmurowe liczą za znak, więc gdy użytkownik przerwie
 * czytanie w połowie, nie zapłaci za resztę — nigdy jej nie zsyntezujemy.
 */
import { splitSentences } from '../text/sentences.js'

/** Kompromis: dłuższe fragmenty brzmią naturalniej (syntezator widzi więcej kontekstu),
 *  krótsze dają szybszą reakcję na pauzę i mniejszy przepał przy silnikach płatnych. */
const DEFAULT_MAX_CHARS = 320

export function splitIntoUtterances(text: string, maxChars = DEFAULT_MAX_CHARS): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  const sentences = splitSentences(trimmed)

  const utterances: string[] = []
  let current = ''
  for (const sentence of sentences) {
    // Zdanie dłuższe niż limit idzie osobno i nietknięte — cięcie w środku zdania słychać
    // jako urwany oddech, a to gorsze niż jeden dłuższy fragment.
    if (sentence.length >= maxChars) {
      if (current) {
        utterances.push(current)
        current = ''
      }
      utterances.push(sentence)
      continue
    }
    const candidate = current ? `${current} ${sentence}` : sentence
    if (candidate.length > maxChars) {
      utterances.push(current)
      current = sentence
    } else {
      current = candidate
    }
  }
  if (current) utterances.push(current)
  return utterances
}
