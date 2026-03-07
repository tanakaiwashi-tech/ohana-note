import { openDB } from 'idb'
import type { FlowerRecord } from '../types/flower'

const DB_NAME = 'ohana-note-db'
const STORE = 'records'
const DB_VERSION = 1

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    },
  })
}

export async function dbLoadRecords(): Promise<FlowerRecord[]> {
  const db = await getDB()
  const all = (await db.getAll(STORE)) as FlowerRecord[]
  return all.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function dbSaveRecord(record: FlowerRecord): Promise<void> {
  const db = await getDB()
  await db.put(STORE, record)
}

export async function dbDeleteRecord(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE, id)
}

/**
 * localStorage に旧データが残っていれば IndexedDB に移行する
 * 移行後は localStorage のデータを削除する
 */
export async function migrateFromLocalStorage(): Promise<void> {
  const LEGACY_KEY = 'ohana-note-records'
  const raw = localStorage.getItem(LEGACY_KEY)
  if (!raw) return

  try {
    const records = JSON.parse(raw) as FlowerRecord[]
    if (records.length > 0) {
      const db = await getDB()
      const count = await db.count(STORE)
      if (count === 0) {
        for (const r of records) await db.put(STORE, r)
      }
    }
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // 移行失敗は無視（既存データを壊さない）
  }
}
