import test from 'node:test'
import assert from 'node:assert/strict'
import { applyScope } from './scope.js'

/** Kształt typowej odpowiedzi agenta: nagłówki, wyróżnienia, lista, kod, tabela i puenta. */
const ANSWER = [
  'Zrobione. Zmiana dotyczy trzech plików i wszystkie testy przechodzą.',
  '',
  '## Co się zmieniło',
  '',
  'Parser czyta teraz **całe drzewo naraz**. Wcześniej szedł gałąź po gałęzi. Różnica jest widoczna przy dużych projektach.',
  '',
  '```ts',
  'const x = 1',
  '```',
  '',
  '| Plik | Zmiana |',
  '| --- | --- |',
  '| a.ts | nowy |',
  '',
  '- pierwszy punkt',
  '- **drugi punkt**',
  '- trzeci punkt',
  '- czwarty punkt',
  '',
  'Zostaje jedna decyzja: czy wchodzimy w cache. Powiedz, a dorobię.',
].join('\n')

test('full nie rusza tekstu', () => {
  assert.equal(applyScope(ANSWER, 'full'), ANSWER)
})

test('ending bierze koniec odpowiedzi, bez kodu i tabeli', () => {
  const out = applyScope(ANSWER, 'ending')
  assert.match(out, /Zostaje jedna decyzja/)
  assert.doesNotMatch(out, /const x = 1/)
  assert.doesNotMatch(out, /\| Plik \|/)
  assert.doesNotMatch(out, /Zrobione\./) // początek odpowiedzi nie należy do zakończenia
})

test('ending zawsze coś zwraca, nawet gdy jest jeden długi akapit', () => {
  const long = 'x'.repeat(2000)
  assert.equal(applyScope(long, 'ending'), long)
})

test('essentials zachowuje nagłówki', () => {
  assert.match(applyScope(ANSWER, 'essentials'), /## Co się zmieniło/)
})

test('essentials bierze pierwsze zdanie akapitu i zdania wyróżnione', () => {
  const out = applyScope(ANSWER, 'essentials')
  assert.match(out, /Parser czyta teraz \*\*całe drzewo naraz\*\*/)
  assert.doesNotMatch(out, /Różnica jest widoczna/) // środek akapitu bez wyróżnienia wypada
})

test('essentials z listy bierze punkty wyróżnione, gdy takie są', () => {
  const out = applyScope(ANSWER, 'essentials')
  assert.match(out, /\*\*drugi punkt\*\*/)
  assert.doesNotMatch(out, /czwarty punkt/)
})

test('essentials zostawia puentę w całości', () => {
  const out = applyScope(ANSWER, 'essentials')
  assert.match(out, /Zostaje jedna decyzja: czy wchodzimy w cache\. Powiedz, a dorobię\./)
})

test('essentials wyrzuca kod i tabelę', () => {
  const out = applyScope(ANSWER, 'essentials')
  assert.doesNotMatch(out, /const x = 1/)
  assert.doesNotMatch(out, /\| Plik \|/)
})

test('lista bez wyróżnień skraca się do początku', () => {
  const list = ['- jeden', '- dwa', '- trzy', '- cztery', '- pięć'].join('\n')
  const out = applyScope(`Wstęp.\n\n${list}\n\nPuenta.`, 'essentials')
  assert.match(out, /- trzy/)
  assert.doesNotMatch(out, /- cztery/)
})

/* Ściana tekstu bez pustych linii — podział na bloki nic nie daje i oba tryby musiały­by
   zwrócić całość. Sprawdzamy, że schodzą wtedy na poziom zdań. */
const WALL = Array.from({ length: 40 }, (_, i) => `Zdanie numer ${i} niesie jakąś treść.`).join(' ')

test('ending na jednym długim akapicie bierze ostatnie zdania', () => {
  const out = applyScope(WALL, 'ending')
  // Budżet zakończenia to ~700 znaków; jedno zdanie ponad limit jest dopuszczalne,
  // bo do budżetu wchodzi zawsze przynajmniej ostatnie zdanie.
  assert.ok(out.length < 800, `zwrócono ${out.length} z ${WALL.length} znaków`)
  assert.match(out, /Zdanie numer 39/)
  assert.doesNotMatch(out, /Zdanie numer 0 /)
})

test('essentials na jednym długim akapicie bierze tezę, wyróżnienia i puentę', () => {
  const wall = `Teza otwierająca. ${WALL} To jest **naprawdę ważne** zdanie. Puenta na koniec.`
  const out = applyScope(wall, 'essentials')
  assert.match(out, /Teza otwierająca\./)
  assert.match(out, /\*\*naprawdę ważne\*\*/)
  assert.match(out, /Puenta na koniec\./)
  assert.doesNotMatch(out, /Zdanie numer 20/)
})

test('odpowiedź złożona z samego kodu daje pusty wynik', () => {
  assert.equal(applyScope('```\nfoo\n```', 'essentials'), '')
  assert.equal(applyScope('```\nfoo\n```', 'ending'), '')
})
