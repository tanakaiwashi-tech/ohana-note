import { useRef } from 'react'
import { compressImage } from '../utils/compressImage'
import './PhotoUploader.css'

type Props = {
  photoUrl: string | null
  onChange: (dataUrl: string) => void
}

export function PhotoUploader({ photoUrl, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = async e => {
      if (e.target?.result) {
        const compressed = await compressImage(e.target.result as string)
        onChange(compressed)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }

  return (
    <div
      className={`photo-uploader ${photoUrl ? 'photo-uploader--has-photo' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        hidden
      />
      {photoUrl ? (
        <div className="photo-uploader-preview">
          <img src={photoUrl} alt="選択した草花の写真" />
          <button
            type="button"
            className="photo-uploader-change"
            onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
          >
            写真を変える
          </button>
        </div>
      ) : (
        <div className="photo-uploader-empty">
          <div className="photo-uploader-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="photo-uploader-text">写真を選ぶ</p>
          <p className="photo-uploader-sub">カメラで撮るか、アルバムから選べます</p>
          <p className="photo-uploader-hint">一輪を大きめに写すと名前が見つかりやすくなります</p>
        </div>
      )}
    </div>
  )
}
