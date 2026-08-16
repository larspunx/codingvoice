/**
 * Odczyt finalnej wypowiedzi agenta z transkryptu Cursora (JSONL).
 *
 * Potrzebne od Cursor 3.15+, który przestał wkładać treść do pola `text` payloadu
 * `afterAgentResponse` — przychodzi puste, a odpowiedź jest już tylko w pliku wskazanym przez
 * `transcript_path`. Moduł jest czysty (bez `fs`), więc daje się testować bez dotykania dysku.
 */

interface CursorBlock {
  type?: string
  text?: string
}

interface CursorRow {
  role?: string
  type?: string
  message?: { content?: CursorBlock[] }
}

/**
 * Finalna wypowiedź agenta z transkryptu Cursora.
 *
 * Transkrypt nie odróżnia myślenia od odpowiedzi — jedno i drugie to bloki `type:"text"` bez
 * żadnych metadanych. Rozróżnia je jednak KOLEJNOŚĆ: myślenie zawsze poprzedza wywołanie narzędzia,
 * a właściwa odpowiedź to proza, którą agent domyka turę PO ostatnim narzędziu. Idziemy więc od
 * końca i zbieramy bloki tekstu aż do pierwszego napotkanego `tool_use` (czyli ostatniego w turze)
 * albo do wiadomości użytkownika — to granica tury.
 */
export function lastCursorTurnText(transcript: string): string {
  const lines = transcript.split('\n')
  const parts: string[] = []
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i]?.trim()
    if (!line) continue
    let row: CursorRow
    try {
      row = JSON.parse(line) as CursorRow
    } catch {
      continue // ostatnia linia bywa ucięta w połowie zapisu
    }
    const role = row.role ?? row.type
    if (role === 'user') break // początek tury — dalej wstecz to już poprzednia wypowiedź
    if (role !== 'assistant') continue // np. `turn_ended` i inne znaczniki
    const blocks = row.message?.content ?? []
    for (let j = blocks.length - 1; j >= 0; j -= 1) {
      const block = blocks[j]
      if (block?.type === 'tool_use') return parts.join('\n\n').trim() // ostatnie narzędzie w turze
      if (block?.type === 'text' && typeof block.text === 'string' && block.text.trim()) {
        parts.unshift(block.text)
      }
    }
  }
  return parts.join('\n\n').trim()
}
