import type { FlowerRecord, FlowerStatus } from '../types/flower'
import { dbSaveRecord, dbLoadRecords } from './db'

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
  a.download = `kusabana-note-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const VALID_STATUSES: FlowerStatus[] = ['bud', 'starting', 'best', 'full', 'ending', 'finished']

function isValidRecord(r: unknown): r is FlowerRecord {
  if (!r || typeof r !== 'object') return false
  const rec = r as Record<string, unknown>
  return (
    typeof rec.id === 'string' && rec.id.length > 0 &&
    typeof rec.photoUrl === 'string' &&
    typeof rec.createdAt === 'string' &&
    typeof rec.flowerName === 'string' &&
    typeof rec.memo === 'string' &&
    typeof rec.status === 'string' &&
    VALID_STATUSES.includes(rec.status as FlowerStatus)
  )
}

export async function importFromJson(file: File): Promise<{ imported: number; skipped: number }> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('JSONの読み込みに失敗しました')
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('ファイルの形式が正しくありません')
  }

  const data = parsed as Record<string, unknown>
  if (!Array.isArray(data.records)) {
    throw new Error('recordsが見つかりません')
  }

  // 既存IDを取得して重複スキップ
  const existing = await dbLoadRecords()
  const existingIds = new Set(existing.map(r => r.id))

  let imported = 0
  let skipped = 0

  for (const item of data.records) {
    if (!isValidRecord(item)) {
      skipped++
      continue
    }
    if (existingIds.has(item.id)) {
      skipped++
      continue
    }
    await dbSaveRecord(item)
    imported++
  }

  return { imported, skipped }
}
