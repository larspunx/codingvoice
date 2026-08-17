/**
 * Klucze API.
 *
 * Podstawowe miejsce to `SecretStorage` (keychain), nigdy `settings.json` — ustawienia synchronizują
 * się między maszynami i lądują w plikach wrzucanych do repo i na zrzuty ekranu, a klucz do płatnego
 * API nie ma prawa się tam znaleźć.
 *
 * Do tego trzymamy AWARYJNĄ kopię na dysku (0600). Keychain macOS po części restartów Cursora wraca
 * pusty i wtedy ElevenLabs „odpina się" mimo niezmienionych ustawień. Kopia na dysku sprawia, że
 * wybrany głos działa po każdym powrocie automatycznie; gdy keychain znów odpowie, magazyn się „leczy".
 */
import * as fs from 'node:fs'
import type * as vscode from 'vscode'
import type { EngineId } from './config.js'
import { apiKeyFallbackFile } from './shared/paths.js'

const apiKeyId = (engine: EngineId): string => `codingVoice.apiKey.${engine}`

export class Secrets {
  constructor(private readonly storage: vscode.SecretStorage) {}

  async getApiKey(engine: EngineId): Promise<string | undefined> {
    const fromStore = await this.storage.get(apiKeyId(engine))
    if (fromStore) {
      // Keychain odpowiedział — dosyłamy kopię na dysk, żeby po następnym restarcie, gdyby keychain
      // wrócił pusty, było z czego odtworzyć. Robi to samo, bez ponownego wklejania klucza.
      this.mirrorToDisk(engine, fromStore)
      return fromStore
    }
    // Keychain zwrócił pusto — sięgamy po kopię na dysku i, jeśli jest, przywracamy ją do magazynu,
    // żeby kolejne odczyty (i inne procesy) znów miały ją „u źródła".
    return this.refreshFromDisk(engine)
  }

  /**
   * Ratunek na nieświeży keychain: POMIŃ magazyn, weź kopię z dysku i wlecz nią keychain.
   *
   * Woła to `getApiKey`, gdy keychain oddał pusto, oraz silnik po odpowiedzi 401 — bo keychain macOS
   * tuż po restarcie Cursora potrafi oddać starą albo pustą wartość, przez co pierwsze zapytanie
   * dostaje 401 mimo poprawnego klucza leżącego na dysku. Zamiast prosić o ponowne wklejenie,
   * odtwarzamy klucz z kopii i leczymy nim magazyn. Zwraca klucz z dysku albo `undefined`. Nie rzuca.
   */
  async refreshFromDisk(engine: EngineId): Promise<string | undefined> {
    try {
      const fromDisk = fs.readFileSync(apiKeyFallbackFile(engine), 'utf8').trim()
      if (fromDisk) {
        await this.storage.store(apiKeyId(engine), fromDisk)
        return fromDisk
      }
    } catch {
      // Brak pliku = po prostu nie ma klucza. Nic do zrobienia.
    }
    return undefined
  }

  /**
   * Zapis kopii TYLKO gdy jeszcze jej nie ma.
   *
   * Kopia na dysku jest naszą siecią bezpieczeństwa na wypadek pustego keychaina — nie wolno jej
   * nadpisać wartością z keychaina, bo to właśnie keychain bywa nieświeży po restarcie i mógłby
   * zamazać dobry klucz starą albo pustą wartością. Świadomą zmianę klucza użytkownika utrwala
   * `setApiKey`, który pisze na dysk wprost; tu tylko dosypujemy kopię, gdy jej brak.
   */
  private mirrorToDisk(engine: EngineId, key: string): void {
    const file = apiKeyFallbackFile(engine)
    try {
      if (!fs.existsSync(file)) {
        fs.writeFileSync(file, key, { encoding: 'utf8', mode: 0o600 })
      }
    } catch {
      /* brak kopii to tylko utrata odporności, nie funkcji */
    }
  }

  async setApiKey(engine: EngineId, key: string | undefined): Promise<void> {
    const file = apiKeyFallbackFile(engine)
    if (key) {
      await this.storage.store(apiKeyId(engine), key)
      // 0600: plik czyta tylko właściciel. Zapis awaryjny nie może wywrócić zapisu klucza, więc
      // ewentualny błąd (pełny dysk) połykamy — keychain i tak dostał wartość.
      try {
        fs.writeFileSync(file, key, { encoding: 'utf8', mode: 0o600 })
      } catch {
        /* keychain ma klucz — brak kopii to tylko utrata odporności, nie funkcji */
      }
    } else {
      await this.storage.delete(apiKeyId(engine))
      try {
        fs.rmSync(file, { force: true })
      } catch {
        /* nie było czego kasować */
      }
    }
  }
}
