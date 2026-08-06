/**
 * Sterowanie odtwarzaniem: co jest czytane, w którym miejscu i w jakim stanie.
 *
 * Celowo nie zna `vscode` — dzięki temu daje się przetestować bez uruchamiania edytora,
 * a pasek stanu jest tylko jego widokiem.
 *
 * Model stanu jest jawny i trzymany tutaj, a nie odczytywany z systemu. Prototyp sprawdzał
 * `pgrep say` przy każdym odświeżeniu paska, bo mówienie odpalał ktoś inny (skrypt hooka)
 * i nie było wspólnego właściciela. Tu jest jeden właściciel, więc stan trzymamy wprost.
 */
import { splitIntoUtterances } from './chunk.js'
import type { SpeakOptions, SpeechEngine, SpeechState } from './types.js'

export interface ControllerDeps {
  /** Silnik bieżący. Funkcja, a nie wartość — użytkownik może przełączyć silnik w trakcie. */
  engine: () => SpeechEngine
  /** Ustawienia czytane przy każdym fragmencie, żeby zmiana tempa działała bez restartu.
   *  Dostaje treść fragmentu, bo język rozpoznajemy per fragment — mieszany tekst PL/EN
   *  dostaje wtedy właściwy głos zdanie po zdaniu, a nie jeden na całą odpowiedź. */
  options: (utterance: string) => SpeakOptions
  /** Ostatni szlif tekstu tuż przed syntezą, z językiem już rozpoznanym — np. zamiana liczb na
   *  słowa w docelowym języku, żeby lektor nie czytał cyfr z obcym akcentem. Opcjonalne. */
  transform?: (utterance: string, options: SpeakOptions) => string
  /** Awaria silnika (brak binarki, odrzucony klucz API). */
  onError: (error: Error) => void
}

export class SpeechController {
  private utterances: string[] = []
  private index = 0
  private currentState: SpeechState = 'idle'
  private abort: AbortController | undefined
  /** Rozpoznaje przeterminowane przebiegi pętli: nowa tura unieważnia poprzednią. */
  private run = 0
  /** Bieżący przebieg pętli. Restart czeka na niego, żeby stary lektor zdążył zamilknąć,
   *  zanim odezwie się nowy — inaczej przez moment słychać obu naraz. */
  private running: Promise<void> | undefined
  private readonly listeners = new Set<() => void>()

  constructor(private readonly deps: ControllerDeps) {}

  get state(): SpeechState {
    return this.currentState
  }

  /** Czy jest co powtórzyć — decyduje o tym, czy przycisk odtwarzania ma sens w bezruchu. */
  get canReplay(): boolean {
    return this.utterances.length > 0
  }

  onChange(listener: () => void): { dispose: () => void } {
    this.listeners.add(listener)
    return { dispose: () => this.listeners.delete(listener) }
  }

  private setState(state: SpeechState): void {
    if (this.currentState === state) return
    this.currentState = state
    for (const listener of this.listeners) listener()
  }

  /** Nowa tura agenta. Ucina to, co właśnie leci — użytkownik czeka na aktualną odpowiedź,
   *  nie na poprzednią. */
  speakNew(text: string): void {
    const utterances = splitIntoUtterances(text)
    if (utterances.length === 0) return
    this.cancel()
    this.utterances = utterances
    this.index = 0
    this.start()
  }

  /** Powtórka ostatniej odpowiedzi od początku. Działa też przy wyłączonym czytaniu —
   *  to akcja wywołana wprost przez użytkownika, a nie automatyczna reakcja na turę. */
  replay(): void {
    if (this.utterances.length === 0) return
    this.cancel()
    this.index = 0
    this.start()
  }

  /** Pauza zatrzymuje się na granicy fragmentu, wznowienie wraca do jego początku.
   *  Powtórzenie kilku sekund jest mniej dotkliwe niż brak pauzy na Windows i Linuksie,
   *  gdzie nie ma czego wstrzymać sygnałem. */
  toggle(): void {
    if (this.currentState === 'speaking') this.pause()
    else if (this.currentState === 'paused') this.start()
    else this.replay()
  }

  /**
   * Bieżący fragment od nowa, z aktualnymi ustawieniami.
   *
   * Głośność wchodzi w silnik przy STARCIE fragmentu i tylko wtedy: `say` dostaje ją jako `[[volm]]`
   * doklejone do treści, PowerShell i `spd-say` jako argument procesu. Żaden z nich nie umie zmienić
   * poziomu w połowie wypowiedzi. Bez tego przesunięcie suwaka w trakcie czytania było słychać
   * dopiero przy następnym fragmencie — a fragment ma do 320 znaków, czyli kilkanaście sekund.
   * Dla ucha wyglądało to po prostu na zepsuty suwak.
   *
   * Puszczamy więc fragment od początku. Powtórka jednego zdania to ta sama cena, którą płacimy
   * już przy pauzie, i tak samo warta natychmiastowej reakcji.
   */
  restartUtterance(): void {
    if (this.currentState !== 'speaking') return
    const run = this.run
    const previous = this.running
    this.cancel()
    void (async () => {
      await previous
      // W międzyczasie mogła przyjść pauza, stop albo nowa tura — wtedy restart jest nieaktualny
      // i wchodziłby w drogę temu, co użytkownik zrobił później.
      if (this.currentState !== 'speaking' || this.run !== run + 1) return
      this.start()
    })()
  }

  pause(): void {
    if (this.currentState !== 'speaking') return
    this.abort?.abort()
    this.abort = undefined
    this.setState('paused')
  }

  stop(): void {
    this.cancel()
    this.setState('idle')
  }

  private cancel(): void {
    this.run += 1
    this.abort?.abort()
    this.abort = undefined
  }

  private start(): void {
    this.run += 1
    this.setState('speaking')
    this.running = this.loop(this.run)
    void this.running
  }

  private async loop(run: number): Promise<void> {
    while (run === this.run && this.index < this.utterances.length) {
      const text = this.utterances[this.index]
      if (text === undefined) break

      const abort = new AbortController()
      this.abort = abort
      const options = this.deps.options(text)
      const spoken = this.deps.transform ? this.deps.transform(text, options) : text
      try {
        await this.deps.engine().speak(spoken, options, abort.signal)
      } catch (error) {
        if (run !== this.run) return // unieważnione w trakcie — błąd dotyczy nieaktualnego przebiegu
        this.setState('idle')
        this.deps.onError(error instanceof Error ? error : new Error(String(error)))
        return
      }
      // Przerwanie: pauza (stan już ustawiony) albo nowa tura (inny `run`). Indeks zostaje
      // na bieżącym fragmencie, żeby wznowienie odtworzyło go od początku.
      if (abort.signal.aborted || run !== this.run) return
      this.index += 1
    }
    if (run === this.run) {
      this.abort = undefined
      this.setState('idle')
    }
  }
}
