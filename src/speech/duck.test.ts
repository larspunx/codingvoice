import assert from 'node:assert/strict'
import { test } from 'node:test'
import { type DuckBackend, Ducker, type DuckSettings } from './duck.js'

/** Backend-atrapa: liczy wywołania i pozwala wstrzyknąć opóźnienie oraz awarię ducka. */
class FakeBackend implements DuckBackend {
  duckCalls = 0
  restoreCalls = 0
  recoverCalls = 0
  lastLevel = -1
  lastFade = -1
  /** Ile ms trwa `duck` — do testu wyścigu engage/release. */
  duckDelay = 0
  /** Gdy true, `duck` rzuca — do testu degradacji. */
  failDuck = false

  async duck(level: number, fadeMs: number): Promise<void> {
    this.duckCalls += 1
    this.lastLevel = level
    this.lastFade = fadeMs
    if (this.duckDelay) await new Promise((r) => setTimeout(r, this.duckDelay))
    if (this.failDuck) throw new Error('brak narzędzia')
  }
  async restore(): Promise<void> {
    this.restoreCalls += 1
  }
  async recover(): Promise<void> {
    this.recoverCalls += 1
  }
}

const on = (over: Partial<DuckSettings> = {}): (() => DuckSettings) => {
  return () => ({ enabled: true, level: 10, fadeMs: 0, ...over })
}

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 5))

test('engage ściza raz i podaje poziom oraz fade z ustawień', async () => {
  const backend = new FakeBackend()
  const ducker = new Ducker(on({ level: 25, fadeMs: 800 }), backend)
  ducker.engage()
  await flush()
  assert.equal(backend.duckCalls, 1)
  assert.equal(backend.restoreCalls, 0)
  assert.equal(backend.lastLevel, 25)
  assert.equal(backend.lastFade, 800)
})

test('kolejne fragmenty tury (engage×N bez release) nie migoczą — jeden duck', async () => {
  const backend = new FakeBackend()
  const ducker = new Ducker(on(), backend)
  ducker.engage()
  ducker.engage()
  ducker.engage()
  await flush()
  assert.equal(backend.duckCalls, 1)
  assert.equal(backend.restoreCalls, 0)
})

test('release po engage przywraca dokładnie raz', async () => {
  const backend = new FakeBackend()
  const ducker = new Ducker(on(), backend)
  ducker.engage()
  await flush()
  ducker.release()
  await flush()
  assert.equal(backend.duckCalls, 1)
  assert.equal(backend.restoreCalls, 1)
})

test('wyłączona funkcja nie rusza systemu, ale release i tak przywraca', async () => {
  const backend = new FakeBackend()
  const ducker = new Ducker(on({ enabled: false }), backend)
  ducker.engage()
  await flush()
  assert.equal(backend.duckCalls, 0)
  // Nic nie ściszyliśmy, więc release też nie ma czego przywracać.
  ducker.release()
  await flush()
  assert.equal(backend.restoreCalls, 0)
})

test('szybkie engage→release w trakcie wolnego ducka kończy się przywróceniem', async () => {
  const backend = new FakeBackend()
  backend.duckDelay = 20
  const ducker = new Ducker(on(), backend)
  ducker.engage()
  ducker.release() // przychodzi zanim duck się skończy
  await new Promise((r) => setTimeout(r, 60))
  assert.equal(backend.duckCalls, 1)
  assert.equal(backend.restoreCalls, 1) // stan dobity do „nie ściszone"
})

test('awaria ducka wyłącza próby na resztę sesji (bez zapętlenia)', async () => {
  const backend = new FakeBackend()
  backend.failDuck = true
  const ducker = new Ducker(on(), backend)
  ducker.engage()
  await flush()
  assert.equal(backend.duckCalls, 1)
  ducker.engage() // druga próba — już nie powinna nic robić
  await flush()
  assert.equal(backend.duckCalls, 1)
})

test('konstruktor woła recover (sprzątanie po crashu)', async () => {
  const backend = new FakeBackend()
  // eslint-disable-next-line no-new
  new Ducker(on(), backend)
  await flush()
  assert.equal(backend.recoverCalls, 1)
})

test('dispose przywraca, jeśli coś było ściszone', async () => {
  const backend = new FakeBackend()
  const ducker = new Ducker(on(), backend)
  ducker.engage()
  await flush()
  await ducker.dispose()
  assert.equal(backend.restoreCalls, 1)
})
