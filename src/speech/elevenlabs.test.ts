/**
 * Samonaprawa klucza po 401.
 *
 * Sedno: keychain macOS bywa nieświeży tuż po przeładowaniu okna i oddaje stary/pusty klucz, więc
 * pierwsze zapytanie o syntezę dostaje 401 mimo poprawnego klucza na dysku. Silnik ma się z tego
 * pozbierać SAM — sięgnąć po kopię z dysku i ponowić raz — a nie zrzucać na użytkownika ponowne
 * wklejanie klucza. Te testy pilnują dokładnie tego zachowania, bez dotykania odtwarzania dźwięku
 * (przerywamy `signal` zaraz po udanej syntezie, więc `playAudio` nie startuje).
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElevenLabsEngine } from './elevenlabs.js'
import type { SpeakOptions } from './types.js'

const OPTIONS: SpeakOptions = { language: 'en', voice: 'female', rate: 1, volume: 1 }

interface FetchCall {
  key: string | undefined
}

/** Podmienia globalny `fetch` na scenariusz krok-po-kroku i oddaje funkcję sprzątającą. */
function stubFetch(
  handler: (call: number, key: string | undefined, controller: AbortController) => Response,
  controller: AbortController,
): { calls: FetchCall[]; restore: () => void } {
  const original = globalThis.fetch
  const calls: FetchCall[] = []
  globalThis.fetch = (async (_url: unknown, init: { headers?: Record<string, string> }) => {
    const key = init.headers?.['xi-api-key']
    calls.push({ key })
    return handler(calls.length, key, controller)
  }) as unknown as typeof fetch
  return { calls, restore: () => void (globalThis.fetch = original) }
}

test('401 na kluczu z keychaina → odświeżenie z dysku i jedno ponowienie', async () => {
  const controller = new AbortController()
  // Pierwsze zapytanie: nieświeży klucz z keychaina → 401. Drugie: świeży z dysku → 200,
  // ale zaraz przerywamy, żeby nie ruszać odtwarzacza.
  const { calls, restore } = stubFetch((n, _key, ctrl) => {
    if (n === 1) return new Response('unauthorized', { status: 401 })
    ctrl.abort()
    return new Response(new Uint8Array([1, 2, 3]), { status: 200 })
  }, controller)

  let refreshed = 0
  const engine = createElevenLabsEngine({
    apiKey: async () => 'stale-from-keychain',
    refreshApiKey: async () => {
      refreshed += 1
      return 'good-from-disk'
    },
  })

  try {
    await engine.speak('hello', OPTIONS, controller.signal)
  } finally {
    restore()
  }

  assert.equal(refreshed, 1, 'awaryjny getter wołany dokładnie raz')
  assert.equal(calls.length, 2, 'dokładnie dwie próby: pierwotna + jedno ponowienie')
  assert.equal(calls[0]?.key, 'stale-from-keychain')
  assert.equal(calls[1]?.key, 'good-from-disk', 'ponowienie idzie świeżym kluczem z dysku')
})

test('401 gdy kopia na dysku to ten sam zły klucz → brak ponowienia, błąd leci dalej', async () => {
  const controller = new AbortController()
  const { calls, restore } = stubFetch(() => new Response('unauthorized', { status: 401 }), controller)

  const engine = createElevenLabsEngine({
    apiKey: async () => 'same-bad-key',
    refreshApiKey: async () => 'same-bad-key',
  })

  try {
    await assert.rejects(
      () => engine.speak('hello', OPTIONS, controller.signal),
      /rejected the API key/,
    )
  } finally {
    restore()
  }

  assert.equal(calls.length, 1, 'ten sam klucz z dysku = drugie podejście nic nie zmieni, więc go nie robimy')
})

test('401 bez awaryjnego gettera → błąd bez ponowienia', async () => {
  const controller = new AbortController()
  const { calls, restore } = stubFetch(() => new Response('unauthorized', { status: 401 }), controller)

  const engine = createElevenLabsEngine({ apiKey: async () => 'only-keychain' })

  try {
    await assert.rejects(
      () => engine.speak('hello', OPTIONS, controller.signal),
      /rejected the API key/,
    )
  } finally {
    restore()
  }

  assert.equal(calls.length, 1)
})

test('401 z powodu wyczerpanego limitu (quota) → brak samonaprawy, komunikat o kredytach', async () => {
  const controller = new AbortController()
  // ElevenLabs na brak kredytów zwraca 401 z code: quota_exceeded — to NIE jest problem z kluczem.
  const quotaBody = JSON.stringify({
    detail: { code: 'quota_exceeded', message: 'You have 0 credits remaining' },
  })
  const { calls, restore } = stubFetch(() => new Response(quotaBody, { status: 401 }), controller)

  let refreshed = 0
  const engine = createElevenLabsEngine({
    apiKey: async () => 'good-key',
    refreshApiKey: async () => {
      refreshed += 1
      return 'good-key-from-disk'
    },
  })

  try {
    await assert.rejects(() => engine.speak('hello', OPTIONS, controller.signal), /out of credits/)
  } finally {
    restore()
  }

  assert.equal(refreshed, 0, 'limit to nie problem z kluczem — nie odświeżamy')
  assert.equal(calls.length, 1, 'brak ponawiania — ponowienie tylko spaliłoby kolejne kredyty')
})
