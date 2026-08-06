import test from 'node:test'
import assert from 'node:assert/strict'
import { splitIntoUtterances } from './chunk.js'

test('krótki tekst to jeden fragment', () => {
  assert.deepEqual(splitIntoUtterances('Gotowe. Działa.'), ['Gotowe. Działa.'])
})

test('zdania łączą się w fragmenty do limitu', () => {
  const sentence = `${'a'.repeat(90)}.`
  const parts = splitIntoUtterances([sentence, sentence, sentence, sentence].join(' '), 200)
  assert.equal(parts.length, 2)
  for (const part of parts) assert.ok(part.length <= 200, `fragment ma ${part.length} znaków`)
})

test('skrót nie kończy zdania', () => {
  // „np. tak" rozbite na dwa fragmenty brzmiałoby jak dwie osobne myśli.
  assert.deepEqual(splitIntoUtterances('Weź np. ten plik. Koniec.', 200), ['Weź np. ten plik. Koniec.'])
})

test('inicjał nie kończy zdania', () => {
  assert.deepEqual(splitIntoUtterances('Pisał o tym J. Kowalski wczoraj.', 200), [
    'Pisał o tym J. Kowalski wczoraj.',
  ])
})

test('zdanie dłuższe niż limit idzie w całości, bez cięcia w środku', () => {
  const long = `${'x'.repeat(400)}.`
  const parts = splitIntoUtterances(`Krótkie. ${long}`, 200)
  assert.deepEqual(parts, ['Krótkie.', long])
})

test('pusty tekst nie daje fragmentów', () => {
  assert.deepEqual(splitIntoUtterances('   \n  '), [])
})
