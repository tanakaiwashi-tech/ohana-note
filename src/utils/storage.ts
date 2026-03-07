import type { FlowerRecord } from '../types/flower'

const STORAGE_KEY = 'ohana-note-records'

export function loadRecords(): FlowerRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as FlowerRecord[]
  } catch {
    return []
  }
}

export function saveRecords(records: FlowerRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export function addRecord(record: FlowerRecord): FlowerRecord[] {
  const current = loadRecords()
  const updated = [record, ...current]
  saveRecords(updated)
  return updated
}

export function deleteRecord(id: string): FlowerRecord[] {
  const current = loadRecords()
  const updated = current.filter(r => r.id !== id)
  saveRecords(updated)
  return updated
}
