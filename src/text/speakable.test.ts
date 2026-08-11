import test from 'node:test'
import assert from 'node:assert/strict'
import { toSpeakable } from './speakable.js'

test('blok kodu i tabela wypadają w całości', () => {
  const out = toSpeakable(
    'Gotowe.\n\n```ts\nconst x = 1\n```\n\n| co | jak |\n| --- | --- |\n| a | b |\n\nKoniec.',
  )
  assert.equal(out, 'Gotowe. Koniec.')
})

test('ścieżka skraca się do nazwy pliku', () => {
  assert.equal(toSpeakable('Zmiana w /Users/mac/tsg/app/src/lib/tree.ts jest gotowa.'), 'Zmiana w tree.ts jest gotowa.')
  assert.equal(toSpeakable('Zmiana w pipeline/cli.ts jest gotowa.'), 'Zmiana w cli.ts jest gotowa.')
})

test('ścieżka katalogu skraca się, ale nie znika', () => {
  // Znikanie zostawiało zdania w rodzaju „obecność pliku , sprawdzana przy każdej turze".
  assert.equal(toSpeakable('Stan trzyma ~/.cursor/hooks/tts/off i tyle.'), 'Stan trzyma off i tyle.')
})

test('nagłówek dostaje kropkę, żeby nie zlał się z akapitem', () => {
  assert.equal(toSpeakable('## Presety\n\nKażdy node ma swój.'), 'Presety. Każdy node ma swój.')
})

test('markdown inline znika, treść zostaje', () => {
  assert.equal(
    toSpeakable('To jest **ważne** i _pilne_, zobacz [dokumentację](https://x.dev) oraz `flagę`.'),
    'To jest ważne i pilne, zobacz dokumentację oraz flagę.',
  )
})

test('goły URL wypada — syntezator nie jęczy na http/slash', () => {
  assert.equal(
    toSpeakable('Logo jest tu: https://raw.githubusercontent.com/larspunx/codingvoice/main/assets/logo.png i działa.'),
    'Logo jest tu: i działa.',
  )
  assert.equal(
    toSpeakable('Zobacz www.example.com/docs/start oraz github.com/larspunx/codingvoice/blob/main/README.md.'),
    'Zobacz oraz.',
  )
})

test('markdown link z etykietą-URL wypada, zwykła etykieta zostaje', () => {
  assert.equal(
    toSpeakable('Wejdź na [https://cursor.com/marketplace](https://cursor.com/marketplace) teraz.'),
    'Wejdź na teraz.',
  )
  assert.equal(
    toSpeakable('Wejdź na [marketplace](https://cursor.com/marketplace) teraz.'),
    'Wejdź na marketplace teraz.',
  )
})

test('mail i autolink wypadają', () => {
  assert.equal(
    toSpeakable('Pisz na me@example.com albo <https://example.com/a/b> proszę.'),
    'Pisz na albo proszę.',
  )
})

test('skróty klawiszowe stają się wymawialne', () => {
  assert.equal(toSpeakable('Wciśnij ⌥⌘R teraz.'), 'Wciśnij option command R teraz.')
})

test('emoji nie są czytane', () => {
  assert.equal(toSpeakable('Gotowe ✅ 🚀 działa.'), 'Gotowe ok działa.')
})

test('punktory i numeracja znikają, każdy punkt jest osobnym zdaniem', () => {
  const out = toSpeakable('- pierwszy\n- drugi\n\n1. trzeci\n2. czwarty')
  assert.equal(out, 'pierwszy drugi. trzeci czwarty.')
})

test('limit tnie na granicy zdania', () => {
  const text = 'Zdanie pierwsze jest dosyć długie. Zdanie drugie też. Zdanie trzecie na pewno.'
  const out = toSpeakable(text, { maxCharacters: 60 })
  assert.equal(out, 'Zdanie pierwsze jest dosyć długie. Zdanie drugie też.…')
})

test('limit 0 czyta całość', () => {
  const text = 'a'.repeat(500)
  assert.equal(toSpeakable(text, { maxCharacters: 0 }).length, 501) // + domykająca kropka
})

test('skipCodeBlocks wyłączone zostawia kod', () => {
  const out = toSpeakable('Kod:\n\n```\nfoo\n```', { skipCodeBlocks: false })
  assert.match(out, /foo/)
})

test('sam kod daje pusty wynik, a nie śmieci', () => {
  assert.equal(toSpeakable('```\nconst x = 1\n```'), '')
})
