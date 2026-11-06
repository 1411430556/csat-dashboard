import type { CsvRecord } from './csv'

export function formatPercent(value: number | null | undefined, digits: number): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '#DIV/0!'
  return (value * 100).toFixed(digits) + '%'
}

export function parseDate(raw: string): Date | null {
  if (!raw) return null
  const matched = raw.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/)
  if (!matched) return null
  return new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]))
}

export function formatDate(date: Date): string {
  return date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate()
}

export function describePeriod(records: Pick<CsvRecord, 'created'>[]): string {
  let min: Date | null = null
  let max: Date | null = null

  records.forEach(record => {
    const date = parseDate(record.created)
    if (!date) return
    if (!min || date < min) min = date
    if (!max || date > max) max = date
  })

  if (!min || !max) return ''
  const from = formatDate(min)
  const to = formatDate(max)
  return from === to ? from : from + ' ~ ' + to
}
