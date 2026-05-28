import { useState, useEffect, useCallback, useMemo } from 'react'
import type { FlowerRecord, FlowerStatus } from './types/flower'
import { useFlowerRecords } from './hooks/useFlowerRecords'
import { HomePage } from './pages/HomePage'
import { NewRecordPage, type SaveData } from './pages/NewRecordPage'
import { DetailPage } from './pages/DetailPage'
import { SyncPanel } from './components/SyncPanel'
import { Toast } from './components/Toast'
import { PageTransition } from './components/PageTransition'
import { exportAsJson, importFromJson } from './utils/exportRecords'
import {
  type SyncStatus,
  type RegisterResult,
  getInitialSyncStatus,
  registerDevice,
  syncRecord,
} from './services/syncService'
import './App.css'

type Page =
  | { name: 'home' }
  | { name: 'new' }
  | { name: 'edit'; recordId: string }
  | { name: 'detail'; recordId: string }

type NavDir = 'forward' | 'back' | 'none'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function App() {
  const { records, isLoading, add, update, remove, reload } = useFlowerRecords()
  const [page, setPage] = useState<Page>({ name: 'home' })
  const [navDir, setNavDir] = useState<NavDir>('none')
  const [navKey, setNavKey] = useState(0)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // 同期状態
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getInitialSyncStatus)
  const [lastSynced, setLastSynced] = useState<string | null>(
    () => localStorage.getItem('ohana-sync-last-synced')
  )
  const [pendingRecord, setPendingRecord] = useState<FlowerRecord | null>(null)
  const [showSyncPanel, setShowSyncPanel] = useState(false)
  const [bulkSyncProgress, setBulkSyncProgress] = useState<{ done: number; total: number } | null>(null)

  /** 方向付きページ遷移 */
  const navigate = useCallback((newPage: Page, dir: NavDir) => {
    setNavDir(dir)
    setNavKey(k => k + 1)
    setPage(newPage)
  }, [])

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2400)
  }, [])

  // 詳細表示中にレコードが削除された場合はホームに戻す
  useEffect(() => {
    if (
      (page.name === 'detail' || page.name === 'edit') &&
      !isLoading &&
      !records.find(r => r.id === page.recordId)
    ) {
      setPage({ name: 'home' })
    }
  }, [records, page, isLoading])

  /** 記録を Supabase へ同期（ローカル保存とは独立して動く） */
  const doSync = useCallback(async (record: FlowerRecord) => {
    if (syncStatus === 'unavailable') return
    setSyncStatus('syncing')
    const result = await syncRecord(record)
    if (result === 'ok') {
      const now = new Date().toISOString()
      localStorage.setItem('ohana-sync-last-synced', now)
      setLastSynced(now)
      setSyncStatus('synced')
      setPendingRecord(null)
    } else if (result === 'needs_setup') {
      setSyncStatus('needs_setup')
      setPendingRecord(record)
    } else {
      setSyncStatus('failed')
      setPendingRecord(record)
    }
  }, [syncStatus])

  /** 全記録を順番に一括同期する */
  const doSyncAll = useCallback(async (allRecords: FlowerRecord[]) => {
    if (allRecords.length === 0) { setSyncStatus('synced'); return }
    setSyncStatus('syncing')
    setBulkSyncProgress({ done: 0, total: allRecords.length })
    for (let i = 0; i < allRecords.length; i++) {
      await syncRecord(allRecords[i])
      setBulkSyncProgress({ done: i + 1, total: allRecords.length })
    }
    const now = new Date().toISOString()
    localStorage.setItem('ohana-sync-last-synced', now)
    setLastSynced(now)
    setSyncStatus('synced')
    setBulkSyncProgress(null)
    setPendingRecord(null)
  }, [])

  /** 設定コード入力後の登録処理 — 成功時は全記録を一括同期 */
  const handleSetup = useCallback(async (passcode: string): Promise<RegisterResult> => {
    const result = await registerDevice(passcode)
    if (result === 'ok') {
      doSyncAll(records)  // 既存の全記録を一括同期（fire-and-forget）
    }
    return result
  }, [records, doSyncAll])

  /** 「もう一度送る」リトライ */
  const handleRetry = useCallback(async () => {
    if (pendingRecord) {
      await doSync(pendingRecord)
    }
  }, [pendingRecord, doSync])

  /** 「これまでの記録もすべて共有する」手動一括同期 */
  const handleSyncAll = useCallback(() => {
    if (syncStatus === 'unavailable') return
    setShowSyncPanel(false)
    doSyncAll(records)
  }, [syncStatus, records, doSyncAll])

  const handleSave = async (data: SaveData) => {
    const record: FlowerRecord = {
      id: generateId(),
      photoUrl: data.photoUrl,
      createdAt: new Date().toISOString(),
      flowerName: data.flowerName,
      status: data.status,
      memo: data.memo,
      suggestions: data.suggestions,
      sourceType: data.sourceType,
    }
    await add(record)
    navigate({ name: 'home' }, 'back')
    showToast('記録しました')
    doSync(record)
  }

  const handleUpdate = async (updated: FlowerRecord) => {
    await update(updated)
    navigate({ name: 'detail', recordId: updated.id }, 'back')
    showToast('更新しました ✓')
    doSync(updated)
  }

  const handleDelete = async (id: string) => {
    await remove(id)
    navigate({ name: 'home' }, 'back')
  }

  const knownNames = useMemo(() => {
    const seen = new Set<string>()
    for (const r of records) {
      if (r.flowerName.trim()) seen.add(r.flowerName.trim())
    }
    return [...seen]
  }, [records])

  const handleQuickStatus = useCallback(async (id: string, status: FlowerStatus) => {
    const record = records.find(r => r.id === id)
    if (!record) return
    const updated = { ...record, status }
    await update(updated)
    showToast('状態を更新しました ✓')
    doSync(updated)
  }, [records, update, showToast, doSync])

  const handleImport = async (file: File) => {
    try {
      const { imported, skipped } = await importFromJson(file)
      await reload()
      if (imported > 0) {
        showToast(`${imported}件を読み込みました${skipped > 0 ? `（${skipped}件スキップ）` : ''}`)
      } else {
        showToast('新しい記録はありませんでした')
      }
    } catch {
      showToast('読み込みに失敗しました')
    }
  }

  // 現在のページを描画
  let content: React.ReactNode = null

  if (page.name === 'new') {
    content = (
      <NewRecordPage
        onBack={() => navigate({ name: 'home' }, 'back')}
        onSave={handleSave}
        knownNames={knownNames}
      />
    )
  } else if (page.name === 'edit') {
    const record = records.find(r => r.id === page.recordId)
    if (record) {
      content = (
        <NewRecordPage
          initialRecord={record}
          onBack={() => navigate({ name: 'detail', recordId: page.recordId }, 'back')}
          onSave={handleSave}
          onUpdate={handleUpdate}
          knownNames={knownNames}
        />
      )
    }
  } else if (page.name === 'detail') {
    const record = records.find(r => r.id === page.recordId)
    if (record) {
      content = (
        <DetailPage
          record={record}
          records={records}
          onBack={() => navigate({ name: 'home' }, 'back')}
          onEdit={id => navigate({ name: 'edit', recordId: id }, 'forward')}
          onDelete={handleDelete}
          onQuickStatus={handleQuickStatus}
          onNavigate={id => navigate({ name: 'detail', recordId: id }, 'none')}
        />
      )
    }
  } else {
    content = (
      <HomePage
        records={records}
        isLoading={isLoading}
        onNewRecord={() => navigate({ name: 'new' }, 'forward')}
        onSelectRecord={id => navigate({ name: 'detail', recordId: id }, 'forward')}
        onExport={() => exportAsJson(records)}
        onImport={handleImport}
        syncStatus={syncStatus}
        onOpenSync={() => setShowSyncPanel(true)}
      />
    )
  }

  return (
    <>
      <PageTransition key={navKey} dir={navDir}>
        {content}
      </PageTransition>
      <Toast message={toastMsg} />
      {showSyncPanel && (
        <SyncPanel
          syncStatus={syncStatus}
          lastSynced={lastSynced}
          bulkSyncProgress={bulkSyncProgress}
          onClose={() => setShowSyncPanel(false)}
          onSetup={handleSetup}
          onRetry={handleRetry}
          onSyncAll={handleSyncAll}
        />
      )}
    </>
  )
}
