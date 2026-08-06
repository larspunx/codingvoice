/**
 * Przypisanie wypowiedzi do okna, które ją wywołało.
 *
 * Kolejka jest JEDNA dla całego systemu, a instancji rozszerzenia tyle, ile otwartych okien
 * Cursora. Dawniej „które okno pierwsze złapie, to czyta" — ale gdy okna mają różne silniki
 * (jeden ElevenLabs, drugi systemowy, bo inny profil/projekt), ten sam tekst raz szedł jednym
 * głosem, raz drugim. Tag workspace w nazwie pliku sprawia, że wypowiedź czyta wyłącznie okno
 * z tego samego projektu, z którego przyszła.
 *
 * Helper jest współdzielony przez hook i rozszerzenie, więc NIE importuje `vscode` — obie strony
 * liczą tag identycznie z tej samej ścieżki.
 */

/** Krótki, stabilny, bezpieczny w nazwie pliku skrót ścieżki (djb2 → base36). Pusta ścieżka =
 *  brak tagu, co znaczy „każde okno może przeczytać" (zgodność wstecz i awaryjne wpisy). */
export function workspaceTag(root: string | undefined | null): string {
  const norm = (root ?? '').trim().replace(/\/+$/, '')
  if (!norm) return ''
  let h = 5381
  for (let i = 0; i < norm.length; i += 1) {
    h = ((h << 5) + h + norm.charCodeAt(i)) >>> 0
  }
  return h.toString(36)
}

/** Pierwsza ścieżka z pola `workspace_roots` (albo `cwd`) payloadu hooka. Cursor potrafi podać
 *  to jako listę JSON albo jako string ze „stringowaną" listą (`"['/a/b']"`) — ogarniamy oba. */
export function parseWorkspaceRoot(raw: string): string {
  let data: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return ''
    data = parsed as Record<string, unknown>
  } catch {
    return ''
  }
  return pickFirstPath(data['workspace_roots']) || pickFirstPath(data['cwd'])
}

function pickFirstPath(value: unknown): string {
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
    return value[0].trim()
  }
  if (typeof value === 'string') {
    const quoted = value.match(/['"]([^'"]+)['"]/)
    if (quoted?.[1]) return quoted[1].trim()
    return value.trim()
  }
  return ''
}
