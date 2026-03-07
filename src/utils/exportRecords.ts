import type { FlowerRecord } from '../types/flower'

export function exportAsJson(records: FlowerRecord[]): void {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
  }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ohana-note-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
