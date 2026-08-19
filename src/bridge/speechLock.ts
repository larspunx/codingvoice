/**
 * Globalny zamek mowy między oknami Cursora.
 *
 * Każde okno to osobny host rozszerzeń — nic nie wie o pozostałych poza tym, że dzielą katalog stanu.
 * Gdy dwa projekty domkną turę w zbliżonym momencie, bez koordynacji obie wtyczki zaczęłyby czytać
 * naraz: dwa głosy jeden na drugim. Ten zamek szereguje je w czasie — kto trzyma plik, ten mówi;
 * reszta czeka, aż zwolni, i dopiero wtedy rusza. Efekt: podsumowania z różnych okien lecą po kolei,
 * a nie jednocześnie.
 *
 * Dlaczego plik, a nie np. gniazdo: hosty rozszerzeń nie mają wspólnego kanału IPC, ale mają wspólny
 * dysk (`~/.cursor/coding-voice`). Atomowe `open(O_CREAT|O_EXCL)` daje dokładnie jednego zwycięzcę —
 * pozostali dostają EEXIST i czekają. Plik nosi znacznik właściciela i czas odświeżany biciem serca,
 * więc okno, które padło w trakcie czytania, po TTL zostaje przejęte i nie blokuje reszty na zawsze.
 */
import * as fs from 'node:fs'
import { speechLockFile } from '../shared/paths.js'

/** Jak często sprawdzamy, czy zajęty zamek już zwolniono. Tanie (jeden `open`), więc gęsto. */
const POLL_MS = 250

/** Jak często właściciel odświeża znacznik czasu w pliku, dowodząc, że wciąż żyje i czyta. */
const HEARTBEAT_MS = 4000

/** Zamek starszy niż to (bez odświeżenia) uznajemy za porzucony — okno właściciela padło.
 *  Z zapasem względem bicia serca, żeby chwilowe zapracowanie procesu nie wyglądało jak śmierć. */
const STALE_MS = 12_000

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export interface SpeechLock {
  /** Czeka, aż to okno może mówić: zamek jest wolny albo przeterminowany (padłe okno) i udało się go
   *  przejąć. Po powrocie plik należy do nas i bije mu serce, aż do `release`. */
  acquire: () => Promise<void>
  /** Oddaje zamek, jeśli wciąż jest nasz, i zatrzymuje bicie serca. Wywołanie bez trzymania jest bezpieczne. */
  release: () => void
  /** Zwolnienie na zamknięcie okna. */
  dispose: () => void
}

export function createSpeechLock(file: string = speechLockFile): SpeechLock {
  // Znacznik tej instancji: pid okna + losowy sufiks. Po nim poznajemy, że plik wciąż nasz, a nie
  // przejęty przez inne okno po TTL — żeby przy zwalnianiu nie skasować cudzego, świeżego zamka.
  const token = `${process.pid}-${Math.random().toString(36).slice(2)}`
  let heartbeat: ReturnType<typeof setInterval> | undefined

  const stopHeartbeat = (): void => {
    if (heartbeat) {
      clearInterval(heartbeat)
      heartbeat = undefined
    }
  }

  const startHeartbeat = (): void => {
    stopHeartbeat()
    heartbeat = setInterval(() => {
      try {
        fs.writeFileSync(file, JSON.stringify({ token, at: Date.now() }), 'utf8')
      } catch {
        // Best-effort — kolejne bicie spróbuje znów. Zniknięcie pliku obsłuży przejęcie po TTL.
      }
    }, HEARTBEAT_MS)
    // Sam zegar bicia serca nie może trzymać procesu przy życiu przy zamykaniu okna.
    heartbeat.unref?.()
  }

  const tryCreate = (): boolean => {
    try {
      // `wx` = O_CREAT|O_EXCL: sukces tylko wtedy, gdy pliku nie było. To jest atomowy zwycięzca.
      const fd = fs.openSync(file, 'wx')
      try {
        fs.writeSync(fd, JSON.stringify({ token, at: Date.now() }))
      } finally {
        fs.closeSync(fd)
      }
      return true
    } catch {
      return false // istnieje — ktoś mówi (albo zamek jest do przejęcia, sprawdzi to `isStale`)
    }
  }

  const isStale = (): boolean => {
    try {
      const { at } = JSON.parse(fs.readFileSync(file, 'utf8')) as { at?: number }
      return typeof at !== 'number' || Date.now() - at > STALE_MS
    } catch {
      return true // nieczytelny/uszkodzony wpis traktujemy jak porzucony
    }
  }

  return {
    async acquire(): Promise<void> {
      for (;;) {
        if (tryCreate()) {
          startHeartbeat()
          return
        }
        if (isStale()) {
          // Właściciel padł. Kasujemy porzucony plik i wracamy do pętli — o zwycięzcy i tak
          // rozstrzygnie atomowe `open('wx')`, więc dwa czekające okna się nie pobiją.
          try {
            fs.rmSync(file, { force: true })
          } catch {
            /* ktoś nas ubiegł ze sprzątaniem — trudno, następny obrót pętli to wyłapie */
          }
          continue
        }
        await sleep(POLL_MS)
      }
    },
    release(): void {
      stopHeartbeat()
      try {
        const { token: owner } = JSON.parse(fs.readFileSync(file, 'utf8')) as { token?: string }
        if (owner === token) fs.rmSync(file, { force: true })
        // Cudzy token = zamek już przejęto po naszym TTL; nie ruszamy, żeby nie uciszyć innego okna.
      } catch {
        /* pliku nie ma albo jest nieczytelny — nie ma czego oddawać */
      }
    },
    dispose(): void {
      this.release()
    },
  }
}
