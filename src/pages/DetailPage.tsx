import { useState } from 'react'
import type { FlowerRecord } from '../types/flower'
import { STATUS_LABELS, SOURCE_LABELS } from '../types/flower'
import { Header } from '../components/Header'
import { ConfirmModal } from '../components/ConfirmModal'
import { PhotoViewer } from '../components/PhotoViewer'
import './DetailPage.css'

type Props = {
  record: FlowerRecord
  records?: FlowerRecord[]
  onBack: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onNavigate?: (id: string) => void
}

export function DetailPage({ record, records, onBack, onEdit, onDelete, onNavigate }: Props) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPhotoViewer, setShowPhotoViewer] = useState(false)

  const date = new Date(record.createdAt)
  const dateStr = date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  const timeStr = date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const currentIndex = records ? records.findIndex(r => r.id === record.id) : -1
  const prevRecord = records && currentIndex > 0 ? records[currentIndex - 1] : null
  const nextRecord = records && currentIndex >= 0 && currentIndex < records.length - 1 ? records[currentIndex + 1] : null

  return (
    <div className="detail-page">
      <Header
        title={record.flowerName || '記録'}
        showBack
        onBack={onBack}
        rightElement={
          <div className="detail-header-actions">
            <button
              className="detail-action-btn"
              onClick={() => onEdit(record.id)}
              aria-label="編集"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              className="detail-action-btn detail-action-btn--delete"
              onClick={() => setShowDeleteModal(true)}
              aria-label="削除"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        }
      />

      <main className="detail-main">
        {/* Photo */}
        <div className="detail-photo-wrap">
          {record.photoUrl ? (
            <img
              className="detail-photo detail-photo--clickable"
              src={record.photoUrl}
              alt={record.flowerName || '草花の写真'}
              onClick={() => setShowPhotoViewer(true)}
            />
          ) : (
            <div className="detail-photo-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="detail-body">
          <div className="detail-date">
            {dateStr} {timeStr}
          </div>

          <h2 className="detail-name">
            {record.flowerName || '名前なし'}
          </h2>

          <div className="detail-status-row">
            <span className="detail-status-badge">
              {STATUS_LABELS[record.status]}
            </span>
            {record.sourceType && (
              <span className="detail-source-badge">
                {SOURCE_LABELS[record.sourceType]}
              </span>
            )}
          </div>

          {record.memo && (
            <div className="detail-memo-section">
              <div className="detail-memo-label">ひとこと</div>
              <p className="detail-memo">{record.memo}</p>
            </div>
          )}
        </div>

        {/* 前後ナビゲーション */}
        {onNavigate && records && records.length > 1 && (
          <div className="detail-nav">
            <button
              className="detail-nav-btn"
              onClick={() => prevRecord && onNavigate(prevRecord.id)}
              disabled={!prevRecord}
              aria-label="前の草花"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              前の草花
            </button>
            <span className="detail-nav-count">
              {currentIndex + 1} / {records.length}
            </span>
            <button
              className="detail-nav-btn"
              onClick={() => nextRecord && onNavigate(nextRecord.id)}
              disabled={!nextRecord}
              aria-label="次の草花"
            >
              次の草花
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </main>

      {showPhotoViewer && record.photoUrl && (
        <PhotoViewer
          src={record.photoUrl}
          alt={record.flowerName || '草花の写真'}
          onClose={() => setShowPhotoViewer(false)}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        title="この記録を削除しますか？"
        message="削除すると元に戻せません"
        confirmLabel="削除する"
        cancelLabel="キャンセル"
        isDanger
        onConfirm={() => onDelete(record.id)}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  )
}
