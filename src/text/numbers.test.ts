import test from 'node:test'
import assert from 'node:assert/strict'
import { spokenNumbers } from './numbers.js'

test('pojedyncze cyfry po polsku i angielsku', () => {
  assert.equal(spokenNumbers('mam 3 pliki', 'pl'), 'mam trzy pliki')
  assert.equal(spokenNumbers('there are 3 files', 'en'), 'there are three files')
})

test('rok czytany jako liczebnik w danym języku', () => {
  assert.equal(spokenNumbers('rok 2026', 'pl'), 'rok dwa tysiące dwadzieścia sześć')
  assert.equal(spokenNumbers('year 2026', 'en'), 'year two thousand twenty-six')
})

test('polskie rzędy odmieniają się przez liczbę', () => {
  assert.equal(spokenNumbers('2000', 'pl'), 'dwa tysiące')
  assert.equal(spokenNumbers('1000', 'pl'), 'tysiąc')
  assert.equal(spokenNumbers('5000', 'pl'), 'pięć tysięcy')
  assert.equal(spokenNumbers('1000000', 'pl'), 'milion')
})

test('setki', () => {
  assert.equal(spokenNumbers('200', 'pl'), 'dwieście')
  assert.equal(spokenNumbers('234', 'en'), 'two hundred thirty-four')
})

test('wersja czytana kropka po kropce', () => {
  assert.equal(spokenNumbers('1.0.0', 'en'), 'one dot zero dot zero')
  assert.equal(spokenNumbers('0.12.0', 'pl'), 'zero kropka dwanaście kropka zero')
})

test('ułamek dziesiętny czytany cyfrowo po przecinku', () => {
  assert.equal(spokenNumbers('3.14', 'en'), 'three point one four')
  assert.equal(spokenNumbers('3,14', 'pl'), 'trzy przecinek jeden cztery')
})

test('procent', () => {
  assert.equal(spokenNumbers('75%', 'pl'), 'siedemdziesiąt pięć procent')
  assert.equal(spokenNumbers('75 %', 'en'), 'seventy-five percent')
})

test('angielski separator tysięcy znika', () => {
  assert.equal(spokenNumbers('1,000,000', 'en'), 'one million')
})

test('spacja jako polski separator tysięcy jest sklejana', () => {
  assert.equal(spokenNumbers('1 234', 'pl'), 'tysiąc dwieście trzydzieści cztery')
  assert.equal(
    spokenNumbers('1 234 567', 'pl'),
    'milion dwieście trzydzieści cztery tysiące pięćset sześćdziesiąt siedem',
  )
  assert.equal(spokenNumbers('1 000 000', 'pl'), 'milion')
  assert.equal(spokenNumbers('1 234,50', 'pl'), 'tysiąc dwieście trzydzieści cztery przecinek pięć zero')
})

test('spacja tylko między grupami po trzy cyfry — osobne liczby zostają osobno', () => {
  assert.equal(spokenNumbers('mam 3 4 koty', 'pl'), 'mam trzy cztery koty')
})

test('zero wiodące czytane cyfra po cyfrze (kody, uprawnienia)', () => {
  assert.equal(spokenNumbers('0700', 'en'), 'zero seven zero zero')
})

test('cyfra w identyfikatorze zostaje nietknięta', () => {
  assert.equal(spokenNumbers('utf8 i mp3', 'pl'), 'utf8 i mp3')
  assert.equal(spokenNumbers('model v2', 'en'), 'model v2')
  assert.equal(spokenNumbers('sha256', 'en'), 'sha256')
})

test('wersja z literowym prefiksem zostaje w całości nietknięta', () => {
  assert.equal(spokenNumbers('v1.2.3', 'pl'), 'v1.2.3')
  assert.equal(spokenNumbers('model-v1.2.3 gotowy', 'pl'), 'model-v1.2.3 gotowy')
  assert.equal(spokenNumbers('sha256.7', 'en'), 'sha256.7')
})

test('bardzo długi ciąg cyfr czytany cyfrowo', () => {
  assert.equal(spokenNumbers('1234567890123456', 'en'), 'one two three four five six seven eight nine zero one two three four five six')
})

test('tekst bez liczb bez zmian', () => {
  assert.equal(spokenNumbers('nic tu nie ma', 'pl'), 'nic tu nie ma')
})
