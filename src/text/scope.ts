/**
 * Wybór, CO z odpowiedzi ma zostać przeczytane.
 *
 * Działa na surowym markdownie, przed czyszczeniem — i to jest cały sens tego modułu.
 * Nagłówki i pogrubienia to jedyny sygnał, który autor odpowiedzi zostawił o tym, co jest ważne;
 * po przepuszczeniu przez `toSpeakable` ten sygnał już nie istnieje i „istotne rzeczy" byłyby
 * zgadywaniem po długości zdań.
 *
 * Trzy tryby, zero wywołań sieciowych: nie wysyłamy odpowiedzi agenta do żadnego modelu po
 * streszczenie. Skrócenie tekstu do przeczytania nie może kosztować pieniędzy ani prywatności.
 */
import { splitSentences } from './sentences.js'

export type ReadScope = 'full' | 'ending' | 'essentials'

/** Ile znaków zbieramy w trybie „samo zakończenie". Mniej więcej minuta mowy. */
const ENDING_BUDGET = 700

/** Długa lista czytana w całości to litania — w trybie skrótu bierzemy początek. */
const MAX_LIST_ITEMS = 3

type BlockKind = 'code' | 'table' | 'heading' | 'list' | 'paragraph' | 'rule'

interface Block {
  kind: BlockKind
  lines: string[]
}

const isFence = (line: string): boolean => /^\s{0,3}(?:```|~~~)/.test(line)
const isHeading = (line: string): boolean => /^\s{0,3}#{1,6}\s/.test(line)
const isTableRow = (line: string): boolean => /^\s*\|.*\|\s*$/.test(line)
const isRule = (line: string): boolean => /^\s{0,3}(?:[-*_]\s*){3,}$/.test(line)
const isListItem = (line: string): boolean => /^\s{0,3}(?:[-*+]|\d+[.)])\s+/.test(line)
const isBlank = (line: string): boolean => line.trim() === ''

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split('\n')
  const blocks: Block[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index] ?? ''

    if (isBlank(line)) {
      index += 1
      continue
    }

    if (isFence(line)) {
      // Blok kodu zjadamy razem z zamknięciem — wszystko w środku jest nietykalne,
      // bo może zawierać cokolwiek, łącznie z czymś, co wygląda jak nagłówek.
      const collected = [line]
      index += 1
      while (index < lines.length && !isFence(lines[index] ?? '')) {
        collected.push(lines[index] ?? '')
        index += 1
      }
      if (index < lines.length) {
        collected.push(lines[index] ?? '')
        index += 1
      }
      blocks.push({ kind: 'code', lines: collected })
      continue
    }

    if (isRule(line)) {
      blocks.push({ kind: 'rule', lines: [line] })
      index += 1
      continue
    }

    if (isHeading(line)) {
      blocks.push({ kind: 'heading', lines: [line] })
      index += 1
      continue
    }

    const kind: BlockKind = isTableRow(line) ? 'table' : isListItem(line) ? 'list' : 'paragraph'
    const belongs = (candidate: string): boolean => {
      if (isBlank(candidate) || isFence(candidate) || isHeading(candidate) || isRule(candidate)) return false
      if (kind === 'table') return isTableRow(candidate)
      if (kind === 'list') return true // wcięte kontynuacje punktu należą do listy
      return !isTableRow(candidate) && !isListItem(candidate)
    }

    const collected: string[] = []
    while (index < lines.length && belongs(lines[index] ?? '')) {
      collected.push(lines[index] ?? '')
      index += 1
    }
    blocks.push({ kind, lines: collected })
  }

  return blocks
}

/** Bloki, które w ogóle brzmią. Kod, tabele i linie poziome nie wnoszą nic na głos. */
const SPEAKABLE: ReadonlySet<BlockKind> = new Set<BlockKind>(['heading', 'list', 'paragraph'])

const text = (block: Block): string => block.lines.join('\n').trim()

/**
 * Samo zakończenie: ostatnie akapity, do wyczerpania budżetu.
 *
 * Agenci piszą wnioski na końcu — „co dalej", „co się zmieniło", pytanie do użytkownika.
 * Zaczynamy od nagłówka, jeśli akurat otwiera zebrany fragment: wejście w środek sekcji
 * brzmi jak włączenie radia w połowie zdania.
 */
function ending(blocks: Block[]): string {
  const speakable = blocks.filter((block) => SPEAKABLE.has(block.kind))
  if (speakable.length === 0) return ''

  const collected: Block[] = []
  let budget = 0
  for (let i = speakable.length - 1; i >= 0; i -= 1) {
    const block = speakable[i]
    if (!block) continue
    const size = text(block).length
    // Pierwszy blok wchodzi zawsze, nawet gdy sam przekracza budżet — inaczej długie
    // jednoakapitowe odpowiedzi dawałyby ciszę.
    if (collected.length > 0 && budget + size > ENDING_BUDGET) break
    collected.unshift(block)
    budget += size
    if (block.kind === 'heading') break // domknięty kawałek: nagłówek plus to, co pod nim
  }

  const joined = collected.map(text).join('\n\n')
  // Odpowiedź bywa jedną ścianą tekstu bez pustych linii — wtedy podział na bloki nic nie daje
  // i „zakończenie" byłoby całością. Schodzimy piętro niżej, na zdania.
  if (collected.length === 1 && joined.length > ENDING_BUDGET) return lastSentences(joined)
  return joined
}

/** Ostatnie zdania mieszczące się w budżecie; przynajmniej jedno, choćby przekraczało. */
function lastSentences(paragraph: string, budget = ENDING_BUDGET): string {
  const sentences = splitSentences(paragraph)
  const kept: string[] = []
  let size = 0
  for (let i = sentences.length - 1; i >= 0; i -= 1) {
    const sentence = sentences[i]
    if (!sentence) continue
    if (kept.length > 0 && size + sentence.length > budget) break
    kept.unshift(sentence)
    size += sentence.length
  }
  return kept.join(' ')
}

/** Zdania, które autor sam oznaczył jako ważne — pogrubieniem albo kodem w treści. */
function isMarked(sentence: string): boolean {
  return /\*\*[^*]+\*\*/.test(sentence) || /__[^_]+__/.test(sentence)
}

/**
 * Tylko istotne rzeczy: szkielet nagłówków, zdania oznaczone przez autora, pierwsze zdanie
 * każdego akapitu (bo tam siedzi teza) i całe ostatnie zdanie odpowiedzi (bo tam siedzi wniosek).
 */
function essentials(blocks: Block[]): string {
  const speakable = blocks.filter((block) => SPEAKABLE.has(block.kind))
  const last = speakable[speakable.length - 1]

  // Jeden długi blok bez akapitów: reguła „ostatni akapit w całości" zwróciłaby wszystko.
  // Wybieramy wtedy zdaniami — teza, to co autor wyróżnił, i puenta.
  const only = speakable.length === 1 ? speakable[0] : undefined
  if (only && only.kind === 'paragraph' && text(only).length > ENDING_BUDGET) {
    const sentences = splitSentences(text(only).replace(/\n/g, ' '))
    return sentences
      .filter(
        (sentence, index) =>
          index === 0 || index === sentences.length - 1 || isMarked(sentence),
      )
      .join(' ')
  }

  const kept: string[] = []
  for (const block of speakable) {
    if (block.kind === 'heading') {
      kept.push(text(block))
      continue
    }

    if (block.kind === 'list') {
      const items = block.lines.filter((line) => isListItem(line))
      const marked = items.filter(isMarked)
      // Lista z wyróżnieniami niesie własny wybór autora; bez nich bierzemy początek,
      // bo dalsze punkty to zwykle warianty i przypadki brzegowe.
      kept.push((marked.length > 0 ? marked : items.slice(0, MAX_LIST_ITEMS)).join('\n'))
      continue
    }

    // Ostatni akapit zostaje w całości — to jest puenta, a puenta ucięta do jednego zdania
    // przestaje być puentą.
    if (block === last) {
      kept.push(text(block))
      continue
    }

    const sentences = splitSentences(text(block).replace(/\n/g, ' '))
    const chosen = sentences.filter((sentence, index) => index === 0 || isMarked(sentence))
    if (chosen.length > 0) kept.push(chosen.join(' '))
  }

  return kept.filter(Boolean).join('\n\n')
}

export function applyScope(markdown: string, scope: ReadScope): string {
  if (scope === 'full') return markdown
  const blocks = parseBlocks(markdown)
  return scope === 'ending' ? ending(blocks) : essentials(blocks)
}
