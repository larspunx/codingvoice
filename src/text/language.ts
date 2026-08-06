/**
 * Rozpoznanie języka wypowiedzi.
 *
 * Nie sięgamy po bibliotekę: rozstrzygamy między dwoma językami na tekście, który sami przed chwilą
 * oczyściliśmy, a każda zależność w rozszerzeniu to kolejny megabajt w paczce VSIX i kolejny audyt
 * przy publikacji. Heurystyka wystarcza, bo pomyłka kosztuje tyle, co jedno zdanie przeczytane
 * niewłaściwym głosem.
 */
export type Language = 'en' | 'pl'

/** Znaki, które w angielskim nie występują w ogóle — jedno wystąpienie przesądza sprawę. */
const POLISH_LETTERS = /[ąćęłńóśźż]/i

/**
 * Częste polskie słowa funkcyjne i typowe słowa ze statusów agenta. Bez diakrytyków, bo
 * użytkownicy (i sami agenci) piszą też „bez ogonków".
 */
const POLISH_WORDS =
  /\b(?:jest|nie|sie|się|tak|ale|oraz|zeby|żeby|dla|jak|juz|już|tez|też|czy|bo|na|do|to|z|w|mam|masz|sa|są|byl|był|byla|była|gotowe|gotowa|gotowy|plik|pliki|pliku|plikow|blad|bledy|teraz|wiec|więc|przez|przy|ten|ta|te|tego|tym|tych|linia|linie|linii|zmiana|zmiany|zrobione|port)\b/gi

/** Częste angielskie słowa funkcyjne i typowe słowa techniczne. */
const ENGLISH_WORDS =
  /\b(?:the|and|is|are|you|for|with|that|this|from|not|can|will|have|it|to|of|test|tests|file|files|line|lines|done|change|changes|fixed|added|error|errors|found|now)\b/gi

/** Zbitki liter typowe dla polskiego, prawie nieobecne w angielskim — łapią polski „bez ogonków". */
const POLISH_CLUSTERS = /rz|cz|sz|dz|szcz/gi

/**
 * Bezosobowe „-ono/-ano" (zrobiono, dodano, znaleziono) i końcówki czasowników „-uje/-ują"
 * (nasłuchuje, działają) — silne, jednoznaczne sygnały polskiego, których angielski nie ma.
 */
const POLISH_SUFFIX = /\w+(?:ono|ano|ęto|eto|uje|ują|uję|liśmy|lismy)\b/gi

function count(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0
}

export function detectLanguage(text: string, fallback: Language = 'en'): Language {
  if (POLISH_LETTERS.test(text)) return 'pl'
  const polish =
    count(text, POLISH_WORDS) + count(text, POLISH_CLUSTERS) + count(text, POLISH_SUFFIX)
  const english = count(text, ENGLISH_WORDS)
  if (polish === english) return fallback
  return polish > english ? 'pl' : 'en'
}
