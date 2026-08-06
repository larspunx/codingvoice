import test from 'node:test'
import assert from 'node:assert/strict'
import { detectLanguage } from './language.js'

test('diakrytyk przesądza sprawę', () => {
  assert.equal(detectLanguage('Zrobione, sprawdź plik.'), 'pl')
})

test('polski bez ogonków rozpoznany po słowach funkcyjnych', () => {
  assert.equal(detectLanguage('To jest gotowe, ale nie wiem czy dla wszystkich tak samo dziala'), 'pl')
})

test('angielski', () => {
  assert.equal(detectLanguage('The change is done and the tests are passing for this file.'), 'en')
})

test('krótki polski status bez ogonków i słów funkcyjnych — po zbitkach i końcówkach', () => {
  // Typowe podsumowania agenta: brak diakrytyków, mało słów funkcyjnych, ale liczby w środku.
  // Bez tego lądowały jako „en" i liczby leciały po angielsku.
  assert.equal(detectLanguage('Znaleziono 3 pliki.', 'en'), 'pl')
  assert.equal(detectLanguage('Port 8080 nasluchuje.', 'en'), 'pl')
  assert.equal(detectLanguage('Naprawiono 3 bledy.', 'en'), 'pl')
  assert.equal(detectLanguage('Wersja 1.2.3 dziala.', 'en'), 'pl')
  assert.equal(detectLanguage('Usunieto 4 zbedne importy.', 'en'), 'pl')
})

test('angielski technicznie nie jest brany za polski', () => {
  assert.equal(detectLanguage('Found 3 errors in the file.', 'en'), 'en')
  assert.equal(detectLanguage('Fixed the bug and added a new test.', 'en'), 'en')
  assert.equal(detectLanguage('Version 1.2.3 is ready.', 'en'), 'en')
})

test('bez rozstrzygnięcia wraca ustawienie domyślne', () => {
  assert.equal(detectLanguage('42', 'pl'), 'pl')
  assert.equal(detectLanguage('42', 'en'), 'en')
})
