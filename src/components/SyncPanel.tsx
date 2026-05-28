import { useState } from 'react'
import type { SyncStatus, RegisterResult } from '../services/syncService'
import './SyncPanel.css'

type Props = {
  syncStatus: SyncStatus
  lastSynced: string | null
  onClose: () => void
  onSetup: (passcode: string) => Promise<RegisterResult>
  onRetry: () => Promise<void>
}

function formatLastSynced(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('ja-JP', {
    month: 'long', day: 'numeric',
  }) + ' ' + d.toLocaleTimeString('ja-JP', {
    hour: '2-digit', minute: '2-digit',
  })
}

export function SyncPanel({ syncStatus, lastSynced, onClose, onSetup, onRetry }: Props) {
  const [view, setView] = useState<'status' | 'setup'>(
    syncStatus === 'not_setup' || syncStatus === 'needs_setup' ? 'setup' : 'status'
  )
  const [passcode, setPasscode] = useState('')
  const [setupError, setSetupError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passcode.trim()) return
    setIsSubmitting(true)
    setSetupError(null)
    const result = await onSetup(passcode.trim())
    setIsSubmitting(false)
    if (result === 'ok') {
      onClose()
    } else if (result === 'wrong_code') {
      setSetupError('コードが違います。設定者に確認してください。')
    } else {
      setSetupError('接続に失敗しました。しばらくしてからお試しください。')
    }
  }

  const handleRetry = async () => {
    setIsRetrying(true)
    await onRetry()
    setIsRetrying(false)
    onClose()
  }

  return (
    <div className="sync-overlay" onClick={onClose}>
      <div className="sync-sheet" onClick={e => e.stopPropagation()}>

        {view === 'setup' ? (
          <>
            <p className="sync-sheet-title">
              {syncStatus === 'needs_setup' ? '共有を設定し直す' : '草花を家族と共有する'}
            </p>
            <p className="sync-sheet-sub">
              {syncStatus === 'needs_setup'
                ? '記録は保存されています。設定コードを入力すると共有が再開します。'
                : '設定コードを入力すると、記録が自動で家族ページに届きます。'}
            </p>
            <form onSubmit={handleSetupSubmit} className="sync-form">
              <input
                className="sync-input"
                type="text"
                inputMode="numeric"
                value={passcode}
                onChange={e => { setPasscode(e.target.value); setSetupError(null) }}
                placeholder="設定コードを入力"
                autoFocus
                disabled={isSubmitting}
              />
              {setupError && <p className="sync-error">{setupError}</p>}
              <button
                type="submit"
                className="sync-btn sync-btn--primary"
                disabled={!passcode.trim() || isSubmitting}
              >
                {isSubmitting ? '確認中...' : '設定する'}
              </button>
              <button type="button" className="sync-btn sync-btn--cancel" onClick={onClose}>
                キャンセル
              </button>
            </form>
          </>
        ) : (
          <>
            {syncStatus === 'synced' && (
              <>
                <div className="sync-icon sync-icon--ok">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 16.5A4.5 4.5 0 0016 12H5.5a3.5 3.5 0 000 7H16" strokeLinecap="round" />
                    <path d="M9 19l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="sync-sheet-title">共有できています</p>
                {lastSynced && (
                  <p className="sync-sheet-sub">最後の共有：{formatLastSynced(lastSynced)}</p>
                )}
                <button className="sync-btn sync-btn--cancel" onClick={onClose}>閉じる</button>
              </>
            )}

            {syncStatus === 'syncing' && (
              <>
                <div className="sync-icon sync-icon--syncing">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 16.5A4.5 4.5 0 0016 12H5.5a3.5 3.5 0 000 7H16" strokeLinecap="round" />
                    <path d="M12 6l2-2-2-2M12 6A6 6 0 016 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="sync-sheet-title">送信中です...</p>
                <p className="sync-sheet-sub">しばらくお待ちください</p>
              </>
            )}

            {syncStatus === 'failed' && (
              <>
                <div className="sync-icon sync-icon--warn">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 16.5A4.5 4.5 0 0016 12H5.5a3.5 3.5 0 000 7H16" strokeLinecap="round" />
                    <path d="M15 9V5M15 13v.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="sync-sheet-title">共有が止まっています</p>
                <p className="sync-sheet-sub">記録は保存されています</p>
                <button
                  className="sync-btn sync-btn--primary"
                  onClick={handleRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? '送信中...' : 'もう一度送る'}
                </button>
                <button
                  type="button"
                  className="sync-btn sync-btn--text"
                  onClick={() => setView('setup')}
                >
                  共有を設定し直す
                </button>
                <button className="sync-btn sync-btn--cancel" onClick={onClose}>閉じる</button>
              </>
            )}
          </>
        )}

      </div>
    </div>
  )
}
