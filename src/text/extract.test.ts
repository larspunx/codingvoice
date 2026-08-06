import test from 'node:test'
import assert from 'node:assert/strict'
import { extractResponse } from './extract.js'

/** Kształt potwierdzony na żywo: Cursor 3.7.36, hook `afterAgentResponse`. */
const REAL_PAYLOAD = {
  conversation_id: '66e84c86-a852-4f59-8723-9abb0e94df28',
  generation_id: '9ec72abb-7b7a-4328-bcf2-72fe31d06c9f',
  model: 'claude-opus-5-thinking-high',
  text: 'Od strony samego projektu — **nic nie stracisz**.',
  input_tokens: 499162,
  session_id: '66e84c86-a852-4f59-8723-9abb0e94df28',
  hook_event_name: 'afterAgentResponse',
  cursor_version: '3.7.36',
  workspace_roots: ['/Users/mac/tsg/komiks'],
  user_email: 'ktos@example.com',
  transcript_path: '/Users/mac/.cursor/projects/x/agent-transcripts/y/y.jsonl',
}

test('bierze pole `text` z realnego payloadu', () => {
  assert.equal(extractResponse(JSON.stringify(REAL_PAYLOAD)), 'Od strony samego projektu — **nic nie stracisz**.')
})

test('radzi sobie z treścią jako listą bloków', () => {
  const payload = { message: [{ type: 'text', text: 'pierwszy' }, { type: 'text', text: 'drugi' }] }
  assert.equal(extractResponse(JSON.stringify(payload)), 'pierwszy\ndrugi')
})

test('nieznane pole — fallback bierze najdłuższy string', () => {
  const payload = { session_id: 'x'.repeat(80), niespodzianka: 'a'.repeat(60) }
  assert.equal(extractResponse(JSON.stringify(payload)), 'a'.repeat(60))
})

test('fallback ignoruje krótkie stringi techniczne', () => {
  assert.equal(extractResponse(JSON.stringify({ foo: 'krótkie', bar: 42 })), '')
})

test('niepoprawny JSON wraca jako surowy tekst', () => {
  assert.equal(extractResponse('  to nie jest JSON  '), 'to nie jest JSON')
})

test('puste pole `text` nie blokuje kolejnych kandydatów', () => {
  const payload = { text: '', content: 'treść zapasowa' }
  assert.equal(extractResponse(JSON.stringify(payload)), 'treść zapasowa')
})
