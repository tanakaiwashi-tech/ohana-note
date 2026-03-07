import './PhotoViewer.css'

type Props = {
  src: string
  alt?: string
  onClose: () => void
}

export function PhotoViewer({ src, alt, onClose }: Props) {
  return (
    <div
      className="photo-viewer-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="写真を拡大表示"
    >
      <button
        className="photo-viewer-close"
        onClick={onClose}
        aria-label="閉じる"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
          <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
        </svg>
      </button>

      <img
        className="photo-viewer-img"
        src={src}
        alt={alt || '花の写真'}
        onClick={e => e.stopPropagation()}
      />
    </div>
  )
}
