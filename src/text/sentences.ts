/**
 * Podział na zdania — wspólny dla dzielenia na fragmenty i dla wyboru zakresu czytania.
 *
 * Jedna definicja granicy zdania w całej wtyczce, bo dwie rozjechałyby się przy pierwszej poprawce:
 * „np." albo inicjał urwany w złym miejscu słychać natychmiast.
 */

/** Kropka po skrócie, po inicjale i w liczbie nie kończy zdania. */
const SENTENCE_END =
  /(?<![A-ZĄĆĘŁŃÓŚŹŻ])(?<!\b(?:np|itp|itd|tzn|tj|dr|inż|mgr|ok|ang|str|nr|vs|etc|e\.g|i\.e))([.!?…])\s+/gu

/** Znak roboczy do znaczenia granic — w tekście do przeczytania nie ma prawa wystąpić. */
const MARK = '\u0000'

export function splitSentences(text: string): string[] {
  return text
    .replace(SENTENCE_END, `$1${MARK}`)
    .split(MARK)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}
