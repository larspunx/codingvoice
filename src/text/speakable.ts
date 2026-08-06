/**
 * Markdown odpowiedzi agenta → tekst nadający się do wypowiedzenia.
 *
 * Port `tts.py summary` z prototypu (~/.cursor/hooks/tts.py), sprawdzonego na realnych
 * odpowiedziach agenta. Powód istnienia tego modułu: markdown czytany dosłownie brzmi jak śmieci —
 * „gwiazdka gwiazdka", ścieżki po osiemdziesiąt znaków, bloki kodu, a tabela zamienia się
 * w litanię „pipe … pipe". Czyścimy tekst, ale domyślnie go NIE skracamy.
 */

/** Glify, których syntezator nie wymawia w ogóle — bez tego „⌥⌘R" to cisza, a strzałka
 *  w ścieżce menu zlewa dwie nazwy w jedno słowo. */
const SYMBOLS: ReadonlyArray<readonly [string, string]> = [
  ['⌘', 'command '],
  ['⌥', 'option '],
  ['⇧', 'shift '],
  ['⌃', 'control '],
  ['␣', ' '],
  ['⏎', 'enter '],
  ['⎋', 'escape '],
  ['→', ', '],
  ['←', ', '],
  ['⇒', ', '],
  ['·', ', '],
  ['✓', 'ok'],
  ['✅', 'ok'],
  ['❌', 'no'],
]

/** Emoji i piktogramy wypadają bez śladu — syntezator albo je milczy, albo czyta nazwę Unicode. */
const PICTOGRAMS =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu

export interface SpeakableOptions {
  /** Ucięcie po N znakach, na granicy zdania. 0 = czytaj całość. Trzyma w ryzach rachunek
   *  za silniki chmurowe, które liczą sobie za znak. */
  maxCharacters?: number
  /** Bloki kodu i tabele. Domyślnie wypadają — na głos to bełkot. */
  skipCodeBlocks?: boolean
}

/**
 * Ścieżka czytana na głos to katastrofa („slash users slash mac slash tee es gie…").
 * Zostawiamy samą nazwę pliku — i dla bezwzględnych, i dla względnych (pipeline/cli.ts → cli.ts).
 */
function shortenPaths(text: string): string {
  const withFile = text.replace(
    /[\w.~-]*\/(?:[\w.-]+\/)*([\w-]+\.[A-Za-z0-9]{1,5})\b/g,
    '$1',
  )
  // Ścieżka do katalogu (bez rozszerzenia) też skraca się do ostatniego członu, a NIE znika —
  // usunięcie jej zostawiało zdania w rodzaju „obecność pliku , sprawdzana przy każdej turze".
  return withFile.replace(/(?:~|\.{0,2})?\/(?:[\w.-]+\/){2,}([\w.-]+)/g, '$1')
}

function speakableSymbols(text: string): string {
  let out = text
  for (const [glyph, spoken] of SYMBOLS) out = out.split(glyph).join(spoken)
  out = out.replace(PICTOGRAMS, '')
  out = out.replace(/\s*,\s*,\s*/g, ', ')
  return out.replace(/\s+([,.;:!?])/g, '$1')
}

/** Ucięcie na granicy zdania. Jeśli w ostatnich 60% limitu nie ma kropki, tniemy twardo —
 *  lepiej urwać w pół zdania niż przeczytać dwa razy więcej, niż użytkownik zamówił. */
function truncateAtSentence(text: string, limit: number): string {
  if (limit <= 0 || text.length <= limit) return text
  const cut = text.slice(0, limit)
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '))
  const kept = end > limit * 0.4 ? cut.slice(0, end + 1) : cut.trimEnd()
  return `${kept}…`
}

export function toSpeakable(markdown: string, options: SpeakableOptions = {}): string {
  const { maxCharacters = 0, skipCodeBlocks = true } = options
  let t = markdown

  if (skipCodeBlocks) {
    t = t.replace(/```[\s\S]*?```/g, ' ')
    // Tabela czytana dosłownie to „pipe co chcesz pipe jak pipe" — wypada w całości,
    // razem z wierszem separatora.
    t = t.replace(/^[ \t]*\|.*\|[ \t]*$/gm, '')
  }
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // obrazki
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // linki → sama etykieta
  t = t.replace(/^[ \t]{0,3}(?:[-*_][ \t]*){3,}$/gm, '') // linie poziome
  t = t.replace(/`([^`]*)`/g, '$1') // inline code bez backticków
  // Nagłówek dostaje kropkę, inaczej zlewa się z pierwszym zdaniem akapitu („Presety Każdy node…").
  t = t.replace(/^[ \t]{0,3}#{1,6}[ \t]*(.+?)[ \t]*$/gm, (_m, title: string) =>
    `${title.replace(/[.:]+$/, '')}.`,
  )
  t = t.replace(/^[ \t]{0,3}[-*+][ \t]+/gm, '') // punktory
  t = t.replace(/^[ \t]{0,3}\d+[.)][ \t]+/gm, '') // listy numerowane — sam numer nic nie wnosi
  t = t.replace(/\*\*([^*]+)\*\*/g, '$1')
  t = t.replace(/(?<!\w)[*_]([^*_]+)[*_](?!\w)/g, '$1')
  t = shortenPaths(t)
  t = speakableSymbols(t)
  t = t.replace(/[ \t]+/g, ' ')

  const paragraphs = t
    .split(/\n\s*\n/)
    .map((p) => p.split(/\s+/).filter(Boolean).join(' '))
    .filter((p) => p.length > 0)
  if (paragraphs.length === 0) return ''

  // Każdy akapit domykamy kropką — bez tego syntezator skleja ostatnie słowo akapitu
  // z pierwszym słowem następnego w jedno zdanie, bez pauzy, i całość zlewa się w monolog.
  const joined = paragraphs
    .map((p) => (/[.!?:…]$/.test(p) ? p : `${p}.`))
    .join(' ')

  return truncateAtSentence(joined, maxCharacters).trim()
}
