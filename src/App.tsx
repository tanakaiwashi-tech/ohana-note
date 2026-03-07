import { useState, useEffect, useCallback } from 'react'
import type { FlowerRecord } from './types/flower'
import { useFlowerRecords } from './hooks/useFlowerRecords'
import { HomePage } from './pages/HomePage'
import { NewRecordPage, type SaveData } from './pages/NewRecordPage'
import { DetailPage } from './pages/DetailPage'
import { Toast } from './components/Toast'
import { PageTransition } from './components/PageTransition'
import { exportAsJson } from './utils/exportRecords'
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
  const { records, isLoading, add, update, remove } = useFlowerRecords()
  const [page, setPage] = useState<Page>({ name: 'home' })
  const [navDir, setNavDir] = useState<NavDir>('none')
  const [navKey, setNavKey] = useState(0)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

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

  const handleSave = async (data: SaveData) => {
    const record: FlowerRecord = {
      id: generateId(),
      photoUrl: data.photoUrl,
      createdAt: new Date().toISOString(),
      flowerName: data.flowerName,
      status: data.status,
      memo: data.memo,
      suggestions: data.suggestions,
    }
    await add(record)
    navigate({ name: 'home' }, 'back')
    showToast('記録しました 🌸')
  }

  const handleUpdate = async (updated: FlowerRecord) => {
    await update(updated)
    navigate({ name: 'detail', recordId: updated.id }, 'back')
    showToast('更新しました ✓')
  }

  const handleDelete = async (id: string) => {
    await remove(id)
    navigate({ name: 'home' }, 'back')
  }

  // 現在のページを描画
  let content: React.ReactNode = null

  if (page.name === 'new') {
    content = (
      <NewRecordPage
        onBack={() => navigate({ name: 'home' }, 'back')}
        onSave={handleSave}
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
      />
    )
  }

  return (
    <>
      {/* Toast は PageTransition の外に置く（transform で fixed が崩れるのを防ぐ） */}
      <PageTransition key={navKey} dir={navDir}>
        {content}
      </PageTransition>
      <Toast message={toastMsg} />
    </>
  )
}
