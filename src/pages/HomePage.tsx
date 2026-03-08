import { useState, useRef } from 'react'
import type { FlowerRecord, FlowerStatus } from '../types/flower'
import { Header } from '../components/Header'
import { FlowerCard } from '../components/FlowerCard'
import './HomePage.css'

type ViewMode = 'list' | 'grid'
type FilterGroup = 'all' | 'pre' | 'peak' | 'post'
type SourceFilter = 'all' | 'home' | 'outing'

const FILTER_LABELS: { key: FilterGroup; label: string; statuses: FlowerStatus[] }[] = [
  { key: 'all',  label: 'すべて',    statuses: [] },
  { key: 'pre',  label: '咲く前',    statuses: ['bud', 'starting'] },
  { key: 'peak', label: '見ごろ',    statuses: ['best', 'full'] },
  { key: 'post', label: '終わりかけ', statuses: ['ending', 'finished'] },
]

const SOURCE_FILTER_LABELS: { key: SourceFilter; label: string }[] = [
  { key: 'all',    label: 'すべての場所' },
  { key: 'home',   label: '庭・ベランダ' },
  { key: 'outing', label: '外で出会った' },
]

type Props = {
  records: FlowerRecord[]
  isLoading: boolean
  onNewRecord: () => void
  onSelectRecord: (id: string) => void
  onExport: () => void
  onImport: (file: File) => void
}

/** records（新しい順）を月ごとにグループ化する */
function groupByMonth(records: FlowerRecord[]) {
  const groups: { key: string; label: string; records: FlowerRecord[] }[] = []
  for (const record of records) {
    const d = new Date(record.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月`
    const last = groups[groups.length - 1]
    if (last && last.key === key) {
      last.records.push(record)
    } else {
      groups.push({ key, label, records: [record] })
    }
  }
  return groups
}

export function HomePage({ records, isLoading, onNewRecord, onSelectRecord, onExport, onImport }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('ohana-view-mode') as ViewMode) ?? 'list'
  )
  const [filterGroup, setFilterGroup] = useState<FilterGroup>('all')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const importRef = useRef<HTMLInputElement>(null)

  const toggleViewMode = () => {
    const next: ViewMode = viewMode === 'list' ? 'grid' : 'list'
    setViewMode(next)
    localStorage.setItem('ohana-view-mode', next)
  }

  const handleImportClick = () => {
    importRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImport(file)
      e.target.value = ''
    }
  }

  const activeFilter = FILTER_LABELS.find(f => f.key === filterGroup)!
  const hasSourceTypeData = records.some(r => r.sourceType !== undefined)

  const filteredRecords = records
    .filter(r => filterGroup === 'all' || activeFilter.statuses.includes(r.status))
    .filter(r => sourceFilter === 'all' || r.sourceType === sourceFilter)

  const groups = groupByMonth(filteredRecords)

  return (
    <div className="home-page">
      <Header
        title="草花ノート"
        rightElement={
          <div className="home-header-actions">
            {records.length > 0 && (
              <button
                className="home-view-toggle"
                onClick={onExport}
                aria-label="記録をエクスポート"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 3v13M7 11l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 20h14" strokeLinecap="round" />
                </svg>
              </button>
            )}
            <button
              className="home-view-toggle"
              onClick={handleImportClick}
              aria-label="バックアップから読み込む"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 21V8M7 13l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 4h14" strokeLinecap="round" />
              </svg>
            </button>
            {records.length > 0 && (
              <button
                className="home-view-toggle"
                onClick={toggleViewMode}
                aria-label={viewMode === 'list' ? 'グリッド表示に切り替え' : 'リスト表示に切り替え'}
              >
                {viewMode === 'list' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <line x1="4" y1="7" x2="20" y2="7" strokeLinecap="round" />
                    <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
                    <line x1="4" y1="17" x2="20" y2="17" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            )}
            <button className="home-new-btn-small" onClick={onNewRecord} aria-label="新しい記録">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
                <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        }
      />

      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <main className="home-main">
        {isLoading ? (
          <div className="home-loading">
            <span className="home-loading-dot" />
            <span className="home-loading-dot" />
            <span className="home-loading-dot" />
          </div>
        ) : records.length === 0 ? (
          <div className="home-empty">
            <div className="home-empty-icon">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.9">
                <circle cx="12" cy="12" r="2.5" />
                <ellipse cx="12" cy="6.5" rx="2" ry="3.5" />
                <ellipse cx="12" cy="17.5" rx="2" ry="3.5" />
                <ellipse cx="6.5" cy="12" rx="3.5" ry="2" />
                <ellipse cx="17.5" cy="12" rx="3.5" ry="2" />
                <ellipse cx="7.8" cy="7.8" rx="2" ry="3.5" transform="rotate(-45 7.8 7.8)" />
                <ellipse cx="16.2" cy="16.2" rx="2" ry="3.5" transform="rotate(-45 16.2 16.2)" />
                <ellipse cx="16.2" cy="7.8" rx="2" ry="3.5" transform="rotate(45 16.2 7.8)" />
                <ellipse cx="7.8" cy="16.2" rx="2" ry="3.5" transform="rotate(45 7.8 16.2)" />
              </svg>
            </div>
            <p className="home-empty-title">まだ記録はありません</p>
            <p className="home-empty-sub">
              育てている草花も、出会った草花も、<br />あなたのひとことと一緒に残せます
            </p>
            <button className="home-new-btn-main" onClick={onNewRecord}>
              記録をはじめる
            </button>
          </div>
        ) : (
          <>
            <div className="home-count">全{records.length}件</div>

            {/* ステータスフィルター */}
            <div className="home-filter">
              {FILTER_LABELS.map(f => (
                <button
                  key={f.key}
                  className={`home-filter-chip ${filterGroup === f.key ? 'home-filter-chip--active' : ''}`}
                  onClick={() => setFilterGroup(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* 場所フィルター（sourceTypeデータがある場合のみ表示） */}
            {hasSourceTypeData && (
              <div className="home-source-filter">
                {SOURCE_FILTER_LABELS.map(f => (
                  <button
                    key={f.key}
                    className={`home-filter-chip home-filter-chip--sm ${sourceFilter === f.key ? 'home-filter-chip--active' : ''}`}
                    onClick={() => setSourceFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {filteredRecords.length === 0 ? (
              <p className="home-filter-empty">この条件の草花はまだありません</p>
            ) : (
              groups.map(group => (
                <section key={group.key} className="home-month-section">
                  <h2 className="home-month-label">{group.label}</h2>
                  {viewMode === 'grid' ? (
                    <ul className="home-grid">
                      {group.records.map(record => (
                        <li key={record.id}>
                          <FlowerCard
                            record={record}
                            onClick={() => onSelectRecord(record.id)}
                            variant="grid"
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="home-list">
                      {group.records.map(record => (
                        <li key={record.id}>
                          <FlowerCard
                            record={record}
                            onClick={() => onSelectRecord(record.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))
            )}
          </>
        )}
      </main>

      {records.length > 0 && (
        <button
          className="home-fab"
          onClick={onNewRecord}
          aria-label="新しい花を記録する"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
            <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  )
}
