/**
 * Odbiór wypowiedzi od hooka.
 *
 * Hook odkłada pliki do katalogu, my je zabieramy. Obserwujemy katalog przez `fs.watch`,
 * ale NIE polegamy na nim wyłącznie: na Linuksie przy montowanych zdalnie katalogach domowych
 * i na niektórych konfiguracjach macOS zdarzenia potrafią nie przyjść. Odpytywanie co sekundę
 * jest tanie (odczyt jednego katalogu) i zamienia „czasem nie działa" w „najwyżej sekunda zwłoki".
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { queueDir } from '../shared/paths.js'

const POLL_INTERVAL_MS = 1000

/** Wpis starszy niż to jest nieaktualny — Cursor był zamknięty, a nikt nie chce po starcie
 *  wysłuchać odpowiedzi sprzed godziny. Ta sama zasada obowiązuje po stronie hooka. */
const MAX_AGE_MS = 5 * 60 * 1000

/** Znacznik w nazwie pliku przejętego przez konkretną instancję. Nie kończy się na `.txt`,
 *  więc obserwator nie weźmie go za nowy wpis. */
const CLAIM_MARK = '.claim.'

/** Sprzątanie po instancji, która padła między przejęciem a skasowaniem wpisu. Bez tego
 *  osierocony plik zostawałby w kolejce na zawsze. */
function sweepStaleClaim(entry: string): void {
  const file = path.join(queueDir, entry)
  try {
    if (Date.now() - fs.statSync(file).mtimeMs > MAX_AGE_MS) fs.rmSync(file, { force: true })
  } catch {
    // Zniknął sam — dokładnie o to chodziło.
  }
}

export interface QueueWatcher {
  dispose: () => void
}

/** Tag workspace z nazwy wpisu, np. `1712-a1b2c3-xk9f.txt` → `xk9f`. Wpis bez tagu (starsza
 *  wersja hooka albo tura bez znanego projektu) zwraca '' i czyta go dowolne okno. */
function tagOf(entry: string): string {
  const parts = entry.replace(/\.txt$/, '').split('-')
  return parts.length >= 3 ? (parts[2] ?? '') : ''
}

/**
 * @param onText   wywoływane dla każdej przejętej wypowiedzi
 * @param ownTags  tagi workspace tego okna. Okno konsumuje wpisy o zgodnym tagu oraz wpisy bez tagu;
 *                 wpisy z CUDZYM tagiem zostawia — przeczyta je okno z właściwego projektu. Dzięki
 *                 temu dwa okna z różnymi silnikami nie kłócą się o tę samą turę.
 */
export function watchQueue(
  onText: (text: string) => void,
  ownTags: ReadonlySet<string> = new Set(),
): QueueWatcher {
  fs.mkdirSync(queueDir, { recursive: true })

  let draining = false
  const drain = (): void => {
    if (draining) return
    draining = true
    try {
      // Sortowanie po nazwie = po znaczniku czasu; przy zaległości czytamy w kolejności zdarzeń.
      for (const entry of fs.readdirSync(queueDir).sort()) {
        if (entry.includes(CLAIM_MARK)) {
          sweepStaleClaim(entry)
          continue
        }
        if (!entry.endsWith('.txt')) continue // pliki `.part` to zapis w toku

        // Cudzy projekt — zostawiamy nietknięte dla okna, do którego wpis należy. Nie kasujemy:
        // za sprzątanie osieroconych odpowiada TTL (sweepStaleClaim / MAX_AGE_MS).
        const tag = tagOf(entry)
        if (tag && !ownTags.has(tag)) continue

        const file = path.join(queueDir, entry)
        const claim = `${file}${CLAIM_MARK}${process.pid}`

        // Przejęcie wpisu przez `rename`, a nie przez „odczytaj, potem skasuj".
        //
        // Kolejka jest JEDNA dla całego systemu (`~/.cursor/coding-voice/queue`), a instancji
        // rozszerzenia jest tyle, ile otwartych okien Cursora — każde ma własny host rozszerzeń
        // i własnego obserwatora. Tag workspace odsiewa już wpisy z innych projektów (wyżej), ale
        // ten sam projekt można otworzyć w dwóch oknach naraz — wtedy przy odczycie przed kasowaniem
        // obie zdążyłyby wczytać ten sam plik, zanim którakolwiek go usunęła, i obie zaczęłyby mówić:
        // dwa głosy rozjechane o milisekundy, czyli pogłos.
        //
        // `rename` w obrębie jednego katalogu jest atomowy: dokładnie jedno okno wygrywa,
        // pozostałe dostają ENOENT i idą dalej. Które wygra — nie ma znaczenia, mają ten sam projekt,
        // więc i ten sam głos; znaczenie ma to, że wygrywa jedno.
        try {
          fs.renameSync(file, claim)
        } catch {
          continue // ktoś nas ubiegł albo zapis jeszcze trwa — wrócimy przy następnym przebiegu
        }

        let text = ''
        try {
          text = fs.readFileSync(claim, 'utf8')
        } catch {
          /* plik zniknął nam z rąk — nie ma czego czytać */
        }
        // Kasujemy przed wypowiedzeniem: gdyby mówienie rzuciło wyjątkiem, wpis nie może wrócić
        // w pętli przy każdym odpytaniu.
        fs.rmSync(claim, { force: true })

        const stamp = Number.parseInt(entry.split('-')[0] ?? '', 10)
        if (Number.isFinite(stamp) && Date.now() - stamp > MAX_AGE_MS) continue
        if (text.trim()) onText(text)
      }
    } catch {
      // Katalog mógł zniknąć (czyszczenie stanu) — odtworzy się przy następnym wpisie hooka.
    } finally {
      draining = false
    }
  }

  let watcher: fs.FSWatcher | undefined
  try {
    watcher = fs.watch(queueDir, () => drain())
  } catch {
    // Zostaje samo odpytywanie.
  }
  const timer = setInterval(drain, POLL_INTERVAL_MS)
  drain() // zaległości z czasu, gdy rozszerzenie nie działało

  return {
    dispose: () => {
      watcher?.close()
      clearInterval(timer)
    },
  }
}
