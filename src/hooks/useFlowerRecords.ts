import { useState, useEffect, useCallback } from 'react'
import type { FlowerRecord } from '../types/flower'
import {
  dbLoadRecords,
  dbSaveRecord,
  dbDeleteRecord,
  migrateFromLocalStorage,
} from '../utils/db'

export function useFlowerRecords() {
  const [records, setRecords] = useState<FlowerRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      await migrateFromLocalStorage()
      const loaded = await dbLoadRecords()
      setRecords(loaded)
      setIsLoading(false)
    })()
  }, [])

  const add = useCallback(async (record: FlowerRecord) => {
    await dbSaveRecord(record)
    setRecords(prev => [record, ...prev])
  }, [])

  const update = useCallback(async (record: FlowerRecord) => {
    await dbSaveRecord(record)
    setRecords(prev =>
      prev
        .map(r => (r.id === record.id ? record : r))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
    )
  }, [])

  const remove = useCallback(async (id: string) => {
    await dbDeleteRecord(id)
    setRecords(prev => prev.filter(r => r.id !== id))
  }, [])

  return { records, isLoading, add, update, remove }
}
