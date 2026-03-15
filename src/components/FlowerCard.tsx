import type { FlowerRecord } from '../types/flower'
import { STATUS_LABELS } from '../types/flower'
import './FlowerCard.css'

type Props = {
  record: FlowerRecord
  onClick: () => void
  variant?: 'list' | 'grid'
}

const PhotoPlaceholder = () => (
  <div className="flower-card-no-photo">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
)

const SOURCE_LABEL: Record<string, string> = {
  home: '庭・ベランダ',
  outing: '外で',
}

export function FlowerCard({ record, onClick, variant = 'list' }: Props) {
  const date = new Date(record.createdAt)
  const dateStr = date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
  const weekday = date.toLocaleDateString('ja-JP', { weekday: 'short' })

  if (variant === 'grid') {
    return (
      <article className="flower-card flower-card--grid" onClick={onClick}>
        <div className="flower-card-photo flower-card-photo--grid">
          {record.photoUrl
            ? <img src={record.photoUrl} alt={record.flowerName || '草花の写真'} />
            : <PhotoPlaceholder />
          }
        </div>
        <div className="flower-card-body flower-card-body--grid">
          <div className="flower-card-name flower-card-name--grid">
            {record.flowerName || '名前なし'}
          </div>
          <div className="flower-card-grid-meta">
            <span className="flower-card-status">{STATUS_LABELS[record.status]}</span>
            <span className="flower-card-grid-date">{dateStr}（{weekday}）</span>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="flower-card" onClick={onClick}>
      <div className="flower-card-photo">
        {record.photoUrl
          ? <img src={record.photoUrl} alt={record.flowerName || '草花の写真'} />
          : <PhotoPlaceholder />
        }
      </div>
      <div className="flower-card-body">
        <div className="flower-card-date">{dateStr}（{weekday}）</div>
        <div className="flower-card-name">{record.flowerName || '名前なし'}</div>
        <div className="flower-card-meta">
          <div className="flower-card-meta-top">
            <span className="flower-card-status">{STATUS_LABELS[record.status]}</span>
            {record.sourceType && (
              <span className="flower-card-source">{SOURCE_LABEL[record.sourceType]}</span>
            )}
          </div>
          {record.memo && (
            <p className="flower-card-memo">{record.memo}</p>
          )}
        </div>
      </div>
    </article>
  )
}
