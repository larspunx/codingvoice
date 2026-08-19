/**
 * Hook Cursora — celowo cienki.
 *
 * Nie mówi i nie zna ustawień. Tylko wyciąga treść odpowiedzi i odkłada ją do kolejki,
 * a rozszerzenie ją stamtąd zabiera. Powód: mówienie wymaga klucza API, wyboru głosu i sterowania
 * pauzą — to wszystko żyje w rozszerzeniu. Gdyby mówił hook, każdą z tych rzeczy trzeba by
 * duplikować w procesie, który nie ma dostępu do `vscode` i musi zwrócić sterowanie w kilka sekund,
 * inaczej Cursor uzna go za zawieszonego i zabije razem z mówieniem.
 *
 * Trzy tryby:
 *   capture  (hook `afterAgentResponse` Cursora) — buforuje treść; w turze potrafi trafić kilka razy
 *   speak    (hook `stop` Cursora)               — domyka turę: przenosi bufor do kolejki
 *   claude   (hook `Stop` Claude Code)           — jedno wywołanie na całą turę, treść z transkryptu
 *
 * Panel Claude Code to osobny agent z osobnym systemem hooków (`~/.claude/settings.json`) —
 * hooki Cursora nie mają o nim pojęcia i przy rozmowie w tym panelu nigdy nie padają.
 * Bez trybu `claude` wtyczka milczy dokładnie tam, gdzie użytkownik jej najczęściej używa.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { extractResponse } from '../text/extract.js'
import { lastCursorTurnText } from '../text/transcript.js'
import {
  ensureStateDir,
  lastPayloadFile,
  logFile,
  pendingFile,
  pendingWsFile,
  queueDir,
  ringDir,
  RING_SIGNAL,
} from '../shared/paths.js'
import { parseWorkspaceRoot, workspaceTag } from '../shared/workspace.js'

/** Kolejka starsza niż to jest bezwartościowa — rozszerzenie było wyłączone, a nikt nie chce
 *  wysłuchać odpowiedzi sprzed godziny po ponownym starcie Cursora. */
const QUEUE_TTL_MS = 5 * 60 * 1000

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    process.stdin.on('data', (c: Buffer) => chunks.push(c))
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    process.stdin.on('error', () => resolve(''))
  })
}

function log(message: string): void {
  try {
    fs.appendFileSync(logFile, `${new Date().toISOString()} ${message}\n`)
  } catch {
    // Log jest wygodą, nie warunkiem działania — hook nie ma prawa polec przez pełny dysk.
  }
}

function capture(payload: string): void {
  try {
    fs.writeFileSync(lastPayloadFile, payload)
  } catch {
    /* jw. */
  }
  // Cursor 3.15+ przestał wkładać odpowiedź do pola `text` payloadu `afterAgentResponse` —
  // przychodzi puste, a treść jest już tylko w transkrypcie wskazanym przez `transcript_path`.
  // Najpierw próbujemy pola z payloadu (starsze Cursory), a gdy pusto — sięgamy do transkryptu.
  const text = extractResponse(payload) || textFromCursorTranscript(payload)
  if (!text) {
    log('capture: pusta treść — payload zmienił schemat?')
    return
  }
  fs.writeFileSync(pendingFile, text, 'utf8')
  // Workspace zapisujemy osobno: `speak` domyka turę w innym procesie, który payloadu już nie ma.
  try {
    fs.writeFileSync(pendingWsFile, parseWorkspaceRoot(payload), 'utf8')
  } catch {
    /* jw. — bez tagu wpis przeczyta dowolne okno, gorzej ale nie milczkiem */
  }
}

/** Domknięcie tury Cursora. Zwraca `true`, gdy było co przeczytać i wpis trafił do kolejki. */
function promote(): boolean {
  let text = ''
  try {
    text = fs.readFileSync(pendingFile, 'utf8')
  } catch {
    return false // tura bez odpowiedzi (np. sama praca narzędziami) — nie ma czego czytać
  }
  if (!text.trim()) return false
  let ws = ''
  try {
    ws = fs.readFileSync(pendingWsFile, 'utf8')
  } catch {
    /* brak zapisu workspace — wpis pójdzie bez tagu */
  }
  enqueue(text, workspaceTag(ws))
  fs.rmSync(pendingFile, { force: true }) // zużyte — kolejny `stop` bez nowej odpowiedzi ma milczeć
  fs.rmSync(pendingWsFile, { force: true })
  return true
}

/**
 * Sygnał „Twoja kolej": tura skończyła się bez wypowiedzi, więc agent zapewne czeka na decyzję
 * (pytanie przez narzędzie, plan, same edycje). Wkładamy znacznik do OSOBNEGO kanału ringu (`ringDir`),
 * nie do kolejki tekstu — rozszerzenie zagra krótki dźwięk zamiast mówić, a stary host obserwujący tylko
 * `queueDir` w ogóle go nie zobaczy (cisza zamiast czytania sentinela). Pomijamy przerwane/błędne
 * domknięcia: `aborted` to reakcja na kliknięcie użytkownika (nie zaskakujmy go dźwiękiem), `error` ma
 * własną ścieżkę komunikatu.
 */
function ringIfWaiting(payload: string): void {
  let status = ''
  let ws = ''
  try {
    const parsed = JSON.parse(payload) as { status?: string }
    status = typeof parsed.status === 'string' ? parsed.status : ''
  } catch {
    /* payload bez JSON-a — traktujemy jak zwykłe domknięcie */
  }
  if (status === 'aborted' || status === 'error') return
  try {
    ws = parseWorkspaceRoot(payload)
  } catch {
    /* bez workspace zadzwoni pierwsze okno, które przejmie wpis (rename jest atomowy) */
  }
  enqueue(RING_SIGNAL, workspaceTag(ws), ringDir)
}

/* ------------------------------- Claude Code ------------------------------- */

interface ClaudeStopPayload {
  transcript_path?: string
}

interface TranscriptRow {
  type?: string
  isSidechain?: boolean
  message?: { content?: Array<{ type?: string; text?: string }> }
}

/**
 * Ostatnia wypowiedź asystenta z transkryptu rozmowy.
 *
 * Hook `Stop` dostaje tylko ścieżkę do pliku JSONL — treści odpowiedzi w payloadzie nie ma.
 * Idziemy od końca, bo interesuje nas podsumowanie tury, a nie zdania rzucane po drodze między
 * wywołaniami narzędzi; wpisy z `isSidechain` pomijamy, bo to gadanie podagentów, którego
 * użytkownik nigdy nie zobaczył na ekranie.
 */
function lastAssistantText(transcript: string): string {
  const lines = fs.readFileSync(transcript, 'utf8').split('\n')
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i]?.trim()
    if (!line) continue
    let row: TranscriptRow
    try {
      row = JSON.parse(line) as TranscriptRow
    } catch {
      continue // ostatnia linia potrafi być ucięta w połowie zapisu
    }
    if (row.type !== 'assistant' || row.isSidechain) continue
    const text = (row.message?.content ?? [])
      .filter((block) => block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text as string)
      .join('\n\n')
      .trim()
    // Tura kończy się zwykle kilkoma wpisami z samymi narzędziami — szukamy dalej wstecz,
    // aż trafimy na ten, w którym asystent naprawdę coś powiedział.
    if (text) return text
  }
  return ''
}

function fromClaudeCode(payload: string): void {
  let transcript = ''
  try {
    transcript = (JSON.parse(payload) as ClaudeStopPayload).transcript_path ?? ''
  } catch {
    log('claude: payload nie jest JSON-em')
    return
  }
  if (!transcript || !fs.existsSync(transcript)) {
    log(`claude: brak transkryptu (${transcript || 'ścieżka pusta'})`)
    return
  }
  // Payload `Stop` Claude Code niesie `cwd` — wystarcza, by przypisać wypowiedź do właściwego okna.
  const tag = workspaceTag(parseWorkspaceRoot(payload))
  const text = lastAssistantText(transcript)
  if (!text) {
    // Tura bez wypowiedzi asystenta = agent zrobił coś niewerbalnego i czeka na Ciebie. Zamiast
    // milczeć, dajemy krótki sygnał „Twoja kolej" — osobnym kanałem ringu (patrz `ringIfWaiting`).
    enqueue(RING_SIGNAL, tag, ringDir)
    return
  }
  enqueue(text, tag)
}

/* --------------------------- transkrypt Cursora ---------------------------- */

function textFromCursorTranscript(payload: string): string {
  let transcript = ''
  try {
    transcript = (JSON.parse(payload) as { transcript_path?: string }).transcript_path ?? ''
  } catch {
    return ''
  }
  if (!transcript || !fs.existsSync(transcript)) return ''
  try {
    return lastCursorTurnText(fs.readFileSync(transcript, 'utf8'))
  } catch {
    return ''
  }
}

/* --------------------------------- kolejka --------------------------------- */

function enqueue(text: string, tag = '', dir: string = queueDir): void {
  fs.mkdirSync(dir, { recursive: true })
  dropStaleEntries(dir)

  // Nazwa: `<znacznik czasu>-<losowy sufiks>[-<tag workspace>].txt`.
  //   • znacznik czasu → rozszerzenie odrzuca przeterminowane wpisy bez czytania zawartości,
  //   • losowy sufiks  → dwie tury mogą domknąć się w tej samej milisekundzie,
  //   • tag workspace  → wpis przeczyta tylko okno z tego samego projektu (patrz shared/workspace).
  // Tag i sufiks są base36 (bez „-"), więc podział po „-" pozostaje jednoznaczny. `dir` to `queueDir`
  // dla tekstu albo `ringDir` dla sygnału ringu — ta sama mechanika nazw/przejęcia w obu kanałach.
  const rand = Math.random().toString(36).slice(2, 8)
  const suffix = tag ? `-${tag}` : ''
  const name = `${Date.now()}-${rand}${suffix}.txt`
  const target = path.join(dir, name)
  // Zapis przez plik tymczasowy i rename: rozszerzenie obserwuje katalog i inaczej zdążyłoby
  // podnieść plik w połowie zapisu.
  const tmp = `${target}.part`
  fs.writeFileSync(tmp, text, 'utf8')
  fs.renameSync(tmp, target)
}

function dropStaleEntries(dir: string): void {
  const now = Date.now()
  for (const entry of fs.readdirSync(dir)) {
    const stamp = Number.parseInt(entry.split('-')[0] ?? '', 10)
    if (Number.isFinite(stamp) && now - stamp > QUEUE_TTL_MS) {
      fs.rmSync(path.join(dir, entry), { force: true })
    }
  }
}

async function main(): Promise<void> {
  ensureStateDir()
  const mode = process.argv[2]
  // stdin trzeba odczytać nawet gdy jest nieużywany, inaczej zostawiamy Cursorowi SIGPIPE.
  const payload = await readStdin()
  try {
    if (mode === 'capture') capture(payload)
    else if (mode === 'speak') {
      if (!promote()) ringIfWaiting(payload)
    } else if (mode === 'claude') fromClaudeCode(payload)
    else log(`nieznany tryb: ${String(mode)}`)
  } catch (error) {
    log(`błąd w trybie ${String(mode)}: ${String(error)}`)
  }
  // Zawsze 0: niezerowy kod z hooka Cursor pokazuje użytkownikowi jako błąd agenta.
  process.exit(0)
}

void main()
