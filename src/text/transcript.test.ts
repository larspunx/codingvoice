import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lastCursorTurnText } from './transcript.js'

/** Buduje wiersz JSONL transkryptu Cursora dla wypowiedzi asystenta. */
function assistant(...blocks: Array<{ type: string; text?: string }>): string {
  return JSON.stringify({ role: 'assistant', message: { content: blocks } })
}
function user(text: string): string {
  return JSON.stringify({ role: 'user', message: { content: [{ type: 'text', text }] } })
}
const txt = (text: string) => ({ type: 'text', text })
const tool = () => ({ type: 'tool_use', name: 'Grep', input: {} })

test('bierze finalną odpowiedź po ostatnim wywołaniu narzędzia', () => {
  const transcript = [
    user('zrób coś'),
    assistant(txt('myślę, że użyję grepa'), tool()),
    assistant(txt('Gotowe — oto podsumowanie.')),
  ].join('\n')
  assert.equal(lastCursorTurnText(transcript), 'Gotowe — oto podsumowanie.')
})

test('pomija myślenie sprzed narzędzia', () => {
  const transcript = [
    user('pytanie'),
    assistant(txt('Użytkownik pyta o X, sprawdzam kod'), tool()),
    assistant(txt('Odpowiedź brzmi tak.')),
  ].join('\n')
  assert.equal(lastCursorTurnText(transcript), 'Odpowiedź brzmi tak.')
})

test('łączy kilka końcowych bloków tekstu', () => {
  const transcript = [
    user('pytanie'),
    assistant(tool()),
    assistant(txt('Pierwszy akapit.'), txt('Drugi akapit.')),
  ].join('\n')
  assert.equal(lastCursorTurnText(transcript), 'Pierwszy akapit.\n\nDrugi akapit.')
})

test('tura bez narzędzi — zwraca całą wypowiedź od granicy użytkownika', () => {
  const transcript = [user('cześć'), assistant(txt('Cześć! W czym pomóc?'))].join('\n')
  assert.equal(lastCursorTurnText(transcript), 'Cześć! W czym pomóc?')
})

test('ignoruje znaczniki i ucięte linie', () => {
  const transcript = [
    user('pytanie'),
    assistant(tool()),
    assistant(txt('Finalna odpowiedź.')),
    '{"type":"turn_ended"}',
    '{ucięta linia',
  ].join('\n')
  assert.equal(lastCursorTurnText(transcript), 'Finalna odpowiedź.')
})

test('pusty transkrypt → pusty wynik', () => {
  assert.equal(lastCursorTurnText(''), '')
})
