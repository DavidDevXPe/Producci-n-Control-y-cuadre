export function normalizeProductionDate(value: string | null | undefined): string | null {
  const raw = value?.trim() ?? ''
  if (!raw) return null

  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (iso) return `${iso[1]}-${iso[2]!.padStart(2, '0')}-${iso[3]!.padStart(2, '0')}`

  const display = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (display) return `${display[3]}-${display[2]!.padStart(2, '0')}-${display[1]!.padStart(2, '0')}`

  return null
}
