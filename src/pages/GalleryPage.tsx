import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { STATUS_LABELS } from '../types/flower'
import type { FlowerStatus } from '../types/flower'
import './GalleryPage.css'

type GalleryRecord = {
  id: string
  flower_name: string
  status: FlowerStatus
  memo: string
  source_type: 'home' | 'outing' | null
  created_at: string
  photo_storage_path: string | null
}

function getPhotoUrl(path: string | null): string | null {
  if (!path) return null
  return supabase.storage.from('flower-photos').getPublicUrl(path).data.publicUrl
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function GalleryPage() {
  const [records, setRecords] = useState<GalleryRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    supabase
      .from('flower_records')
      .select('id, flower_name, status, memo, source_type, created_at, photo_storage_path')
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (fetchError || !data) {
          setError(true)
        } else {
          setRecords(data as GalleryRecord[])
        }
        setIsLoading(false)
      })
  }, [])

  return (
    <div className="gallery-page">
      <header className="gallery-header">
        <div className="gallery-header-inner">
          <div className="gallery-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="12" cy="12" r="2.5" />
              <ellipse cx="12" cy="6.5" rx="1.8" ry="3.2" />
              <ellipse cx="12" cy="17.5" rx="1.8" ry="3.2" />
              <ellipse cx="6.5" cy="12" rx="3.2" ry="1.8" />
              <ellipse cx="17.5" cy="12" rx="3.2" ry="1.8" />
              <ellipse cx="7.8" cy="7.8" rx="1.8" ry="3.2" transform="rotate(-45 7.8 7.8)" />
              <ellipse cx="16.2" cy="16.2" rx="1.8" ry="3.2" transform="rotate(-45 16.2 16.2)" />
              <ellipse cx="16.2" cy="7.8" rx="1.8" ry="3.2" transform="rotate(45 16.2 7.8)" />
              <ellipse cx="7.8" cy="16.2" rx="1.8" ry="3.2" transform="rotate(45 7.8 16.2)" />
            </svg>
          </div>
          <h1 className="gallery-header-title">草花ノート</h1>
        </div>
      </header>

      <main className="gallery-main">
        {isLoading && (
          <div className="gallery-loading">
            <span className="gallery-loading-dot" />
            <span className="gallery-loading-dot" />
            <span className="gallery-loading-dot" />
          </div>
        )}

        {error && !isLoading && (
          <div className="gallery-error">
            <p>読み込めませんでした</p>
          </div>
        )}

        {!isLoading && !error && records.length === 0 && (
          <div className="gallery-empty">
            <p>まだ記録はありません</p>
          </div>
        )}

        {!isLoading && !error && records.length > 0 && (
          <ul className="gallery-grid">
            {records.map(record => {
              const photoUrl = getPhotoUrl(record.photo_storage_path)
              return (
                <li key={record.id} className="gallery-card">
                  <div className="gallery-card-photo">
                    {photoUrl ? (
                      <img src={photoUrl} alt={record.flower_name || '草花の写真'} loading="lazy" />
                    ) : (
                      <div className="gallery-card-no-photo">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="gallery-card-body">
                    <div className="gallery-card-date">{formatDate(record.created_at)}</div>
                    <div className="gallery-card-name">{record.flower_name || '名前なし'}</div>
                    <div className="gallery-card-meta">
                      <span className="gallery-card-status">{STATUS_LABELS[record.status]}</span>
                      {record.source_type === 'home' && (
                        <span className="gallery-card-source">庭・ベランダ</span>
                      )}
                      {record.source_type === 'outing' && (
                        <span className="gallery-card-source">外で</span>
                      )}
                    </div>
                    {record.memo && (
                      <p className="gallery-card-memo">{record.memo}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>

      <footer className="gallery-footer">
        <p>草花ノート — 読み取り専用</p>
      </footer>
    </div>
  )
}
