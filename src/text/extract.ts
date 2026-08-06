/**
 * Payload hooka Cursora → treść odpowiedzi agenta.
 *
 * Port `tts.py extract`. Cursor nie dokumentuje nazwy pola z treścią, więc szukamy po kolejności
 * kandydatów, a w ostateczności bierzemy najdłuższy string w całym drzewie. Dzięki temu hook
 * przeżyje zmianę schematu payloadu — a surowy payload i tak zapisujemy do diagnostyki.
 *
 * Potwierdzone na żywo: Cursor 3.7.36, `afterAgentResponse` → treść w polu `text`.
 */

/** Pola, w których NIE ma treści odpowiedzi — inaczej fallback „najdłuższy string" trafiłby w nie. */
const SKIP_KEYS = new Set([
  'conversation_id',
  'session_id',
  'generation_id',
  'id',
  'hook_event_name',
  'event',
  'workspace_roots',
  'cwd',
  'model',
  'chat_id',
  'thread_id',
  'url',
  'file_path',
  'path',
  'transcript_path',
  'user_email',
  'cursor_version',
])

const CANDIDATE_KEYS = [
  'response',
  'agent_response',
  'assistant_message',
  'agent_message',
  'message',
  'text',
  'content',
  'markdown',
  'output',
  'body',
  'summary',
]

/** Poniżej tylu znaków fallback uznaje trafienie za przypadkowe (identyfikator, nazwa modelu). */
const MIN_FALLBACK_LENGTH = 40

/** Treść bywa stringiem albo listą bloków `[{type:'text', text:…}]`. */
function fromValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value
      .filter(
        (b): b is { type?: string; text?: string } =>
          typeof b === 'object' && b !== null && !Array.isArray(b),
      )
      .filter((b) => b.type === undefined || b.type === 'text')
      .map((b) => b.text ?? '')
      .filter(Boolean)
      .join('\n')
  }
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>
    return fromValue(record['text'] ?? record['content'] ?? '')
  }
  return ''
}

function* strings(node: unknown, depth = 0): Generator<string> {
  if (depth > 6) return
  if (typeof node === 'string') {
    yield node
  } else if (Array.isArray(node)) {
    for (const item of node) yield* strings(item, depth + 1)
  } else if (typeof node === 'object' && node !== null) {
    for (const [key, value] of Object.entries(node)) {
      if (SKIP_KEYS.has(key)) continue
      yield* strings(value, depth + 1)
    }
  }
}

export function extractResponse(raw: string): string {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return raw.trim()
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return ''

  const record = data as Record<string, unknown>
  for (const key of CANDIDATE_KEYS) {
    if (key in record) {
      const got = fromValue(record[key]).trim()
      if (got) return got
    }
  }

  let best = ''
  for (const candidate of strings(record)) {
    if (candidate.length > best.length) best = candidate
  }
  return best.length > MIN_FALLBACK_LENGTH ? best.trim() : ''
}
