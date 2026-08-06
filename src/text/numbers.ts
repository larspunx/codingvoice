/**
 * Liczby → słowa w języku wypowiedzi, tuż przed syntezą.
 *
 * Nawet gdy silnikowi wymusimy język (ElevenLabs `language_code`), gołe cyfry bywają czytane po
 * swojemu: „3" w polskim zdaniu potrafi wyjść „three", rok „2026" po angielsku. Rozwiązanie, które
 * nie zależy od silnika (i działa też dla głosu systemowego): zamieniamy liczby na słowa w
 * rozpoznanym języku, więc lektor dostaje już „trzy" i „dwa tysiące dwadzieścia sześć", a nie cyfry
 * do interpretacji.
 *
 * Świadome granice:
 *   • Zamieniamy tylko liczby STOJĄCE SAMODZIELNIE — cyfra po literze (mp3, utf8, sha256, v2) zostaje,
 *     bo to identyfikator, nie liczba.
 *   • Liczba z zerem wiodącym (0700, 007) i bardzo długi ciąg cyfr (ID) czytamy cyfra po cyfrze —
 *     „siedemset" zamiast uprawnień 0700 byłoby mylące.
 *   • Wersje (1.0.0) czytamy „jeden kropka zero kropka zero", ułamki (3.14) „trzy przecinek jeden
 *     cztery", procenty (75%) „siedemdziesiąt pięć procent".
 */
import type { Language } from './language.js'

const ONES: Record<Language, readonly string[]> = {
  en: [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
    'nineteen',
  ],
  pl: [
    'zero', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć',
    'dziesięć', 'jedenaście', 'dwanaście', 'trzynaście', 'czternaście', 'piętnaście', 'szesnaście',
    'siedemnaście', 'osiemnaście', 'dziewiętnaście',
  ],
}

const TENS: Record<Language, readonly string[]> = {
  en: ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'],
  pl: [
    '', '', 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt', 'sześćdziesiąt',
    'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt',
  ],
}

/** Setki: angielski składa je z „<cyfra> hundred", polski ma osobne słowa (sto, dwieście…). */
const PL_HUNDREDS: readonly string[] = [
  '', 'sto', 'dwieście', 'trzysta', 'czterysta', 'pięćset', 'sześćset', 'siedemset', 'osiemset',
  'dziewięćset',
]

const EN_SCALES: readonly string[] = ['', 'thousand', 'million', 'billion', 'trillion']

/** Polskie rzędy odmieniają się przez liczbę: [1, 2–4, 5+]. */
const PL_SCALES: ReadonlyArray<readonly [string, string, string] | null> = [
  null,
  ['tysiąc', 'tysiące', 'tysięcy'],
  ['milion', 'miliony', 'milionów'],
  ['miliard', 'miliardy', 'miliardów'],
  ['bilion', 'biliony', 'bilionów'],
]

const POINT: Record<Language, string> = { en: 'point', pl: 'przecinek' }
const DOT: Record<Language, string> = { en: 'dot', pl: 'kropka' }
const PERCENT: Record<Language, string> = { en: 'percent', pl: 'procent' }

/** Odmiana polskiego rzędu dla wartości grupy: jeden → forma 0, 2–4 (poza 12–14) → forma 1, reszta → 2. */
function plForm(n: number): 0 | 1 | 2 {
  if (n === 1) return 0
  const d = n % 10
  const dd = n % 100
  if (d >= 2 && d <= 4 && !(dd >= 12 && dd <= 14)) return 1
  return 2
}

function below1000(n: number, lang: Language): string {
  const parts: string[] = []
  const h = Math.floor(n / 100)
  const r = n % 100
  if (h > 0) {
    if (lang === 'pl') parts.push(PL_HUNDREDS[h] ?? '')
    else parts.push(`${ONES.en[h]} hundred`)
  }
  if (r > 0) {
    if (r < 20) {
      parts.push(ONES[lang][r] ?? '')
    } else {
      const t = Math.floor(r / 10)
      const o = r % 10
      if (lang === 'en') {
        parts.push(o > 0 ? `${TENS.en[t]}-${ONES.en[o]}` : (TENS.en[t] ?? ''))
      } else {
        parts.push(TENS.pl[t] ?? '')
        if (o > 0) parts.push(ONES.pl[o] ?? '')
      }
    }
  }
  return parts.filter(Boolean).join(' ')
}

/** Liczba całkowita 0..10^15-1 na słowa. Dłuższe wpadają w czytanie cyfrowe jeszcze przed tym miejscem. */
function integerWords(value: number, lang: Language): string {
  if (value === 0) return ONES[lang][0] ?? 'zero'
  const groups: number[] = []
  let n = value
  while (n > 0) {
    groups.push(n % 1000)
    n = Math.floor(n / 1000)
  }
  const parts: string[] = []
  for (let i = groups.length - 1; i >= 0; i -= 1) {
    const g = groups[i]
    if (!g) continue
    if (i === 0) {
      parts.push(below1000(g, lang))
      continue
    }
    if (lang === 'en') {
      parts.push(below1000(g, 'en'), EN_SCALES[i] ?? '')
    } else {
      const scale = PL_SCALES[i]
      if (!scale) continue
      // 1000 to „tysiąc", nie „jeden tysiąc"; „jeden" przed rzędem po polsku się pomija.
      if (g !== 1) parts.push(below1000(g, 'pl'))
      parts.push(scale[plForm(g)])
    }
  }
  return parts.filter(Boolean).join(' ')
}

const digits = (raw: string, lang: Language): string =>
  raw
    .split('')
    .map((ch) => ONES[lang][Number(ch)] ?? '')
    .filter(Boolean)
    .join(' ')

/** Ciąg cyfr → słowa: zero wiodące lub bardzo długa liczba idą cyfra po cyfrze (kody, ID, uprawnienia). */
function readInteger(raw: string, lang: Language): string {
  if (raw.length > 15 || (raw.length > 1 && raw.startsWith('0'))) return digits(raw, lang)
  return integerWords(Number(raw), lang)
}

function readDecimal(intPart: string, fracPart: string, lang: Language): string {
  return `${readInteger(intPart, lang)} ${POINT[lang]} ${digits(fracPart, lang)}`
}

/** Pojedynczy token liczbowy (bez „%") na słowa, z separatorami rozstrzygniętymi wg języka. */
function tokenToWords(core: string, lang: Language): string {
  // Kanonicznie sprowadzamy do „tylko cyfry i kropki jako separator dziesiętny/wersji":
  //   • angielski: przecinek = separator tysięcy → znika,
  //   • polski:    przecinek = przecinek dziesiętny, kropka = separator tysięcy.
  // Spacja (zwykła, twarda, wąska) to po polsku standardowy separator tysięcy: „1 234 567".
  // Regex dopuszcza ją tylko między grupami po trzy cyfry, więc tu jest zawsze separatorem.
  let s = core.replace(/[ \u00A0\u202F\u2009]/g, '')
  if (lang === 'en') {
    s = s.replace(/,/g, '')
  } else if (s.includes(',')) {
    s = s.replace(/\./g, '')
    const at = s.indexOf(',')
    s = `${s.slice(0, at)}.${s.slice(at + 1).replace(/,/g, '')}`
  }

  const dotCount = (s.match(/\./g) ?? []).length
  if (dotCount === 0) return readInteger(s, lang)
  if (dotCount === 1) {
    const [intPart = '', fracPart = ''] = s.split('.')
    return readDecimal(intPart, fracPart, lang)
  }
  // Dwie kropki lub więcej — wersja (1.0.0): każdy człon osobno, sklejony słowem „kropka".
  return s
    .split('.')
    .map((part) => readInteger(part, lang))
    .join(` ${DOT[lang]} `)
}

/**
 * Liczba stoi samodzielnie, gdy nie poprzedza jej litera/cyfra/podkreślenie — inaczej to część
 * identyfikatora (mp3, utf8), którego nie ruszamy. Po liczbie może iść „%", które zamieniamy na słowo.
 */
// Druga asercja chroni człony po kropce w identyfikatorach: w „v1.2.3" pierwszą cyfrę blokuje
// litera „v", ale bez tego skan ruszyłby od „2.3" (poprzedzone kropką, nie literą) i wypluł
// „v1.dwa przecinek trzy". Blokujemy więc też liczbę tuż po „⟨znak identyfikatora⟩.".
const NUMBER =
  /(?<![A-Za-z0-9_])(?<![A-Za-z0-9_]\.)(\d{1,3}(?:[ \u00A0\u202F\u2009]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)*)(\s*%)?/g

export function spokenNumbers(text: string, lang: Language): string {
  return text.replace(NUMBER, (_match, core: string, percent: string | undefined) => {
    const words = tokenToWords(core, lang)
    return percent ? `${words} ${PERCENT[lang]}` : words
  })
}
