import { compressImage } from '../utils/compressImage'
import './PhotoUploader.css'

// Android は capture="environment" でカメラを直接起動できる
// iOS は capture があると兄弟 input に干渉するため使わない
const isAndroid = /android/i.test(navigator.userAgent)

type Props = {
  photoUrl: string | null
  onChange: (dataUrl: string) => void
}

export function PhotoUploader({ photoUrl, onChange }: Props) {
  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = async e => {
      if (e.target?.result) {
        try {
          const compressed = await compressImage(e.target.result as string)
          onChange(compressed)
        } catch {
          // 圧縮失敗時は元データをそのまま渡す
          onChange(e.target.result as string)
        }
      }
    }
    reader.onerror = () => {
      // ファイル読み込み失敗 — サイレントに無視
    }
    reader.readAsDataURL(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // 同じファイルを再選択できるよう value をリセット
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }

  return (
    <div
      className={`photo-uploader ${photoUrl ? 'photo-uploader--has-photo' : ''}`}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      {photoUrl ? (
        <div className="photo-uploader-preview">
          <img src={photoUrl} alt="選択した草花の写真" />
          <div className="photo-uploader-change-row">
            {/*
              【オーバーレイ方式】
              ユーザーが実際に input 要素を直接タップする構造。
              - label 経由・programmatic click を使わない
              - ビューポート内に実在する → Android Chrome がカメラ Intent を確実に起動
              - iOS Safari でも最も安定する古典的パターン
            */}
            <div className="photo-uploader-change-wrapper">
              <span className="photo-uploader-change">撮り直す</span>
              <input
                type="file"
                accept="image/*"
                {...(isAndroid ? { capture: 'environment' } : {})}
                onChange={handleChange}
                className="photo-uploader-file-overlay"
                aria-label="撮り直す"
              />
            </div>
            <div className="photo-uploader-change-wrapper">
              <span className="photo-uploader-change">アルバムから</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="photo-uploader-file-overlay"
                aria-label="アルバムから"
              />
            </div>
          </div>
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
          <div className="photo-uploader-buttons">
            <div className="photo-uploader-btn-wrapper">
              <span className="photo-uploader-btn photo-uploader-btn--camera">撮影する</span>
              <input
                type="file"
                accept="image/*"
                {...(isAndroid ? { capture: 'environment' } : {})}
                onChange={handleChange}
                className="photo-uploader-file-overlay"
                aria-label="撮影する"
              />
            </div>
            <div className="photo-uploader-btn-wrapper">
              <span className="photo-uploader-btn photo-uploader-btn--album">アルバムから選ぶ</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="photo-uploader-file-overlay"
                aria-label="アルバムから選ぶ"
              />
            </div>
          </div>
          <p className="photo-uploader-hint">一輪を大きめに写すと名前が見つかりやすくなります</p>
        </div>
      )}
    </div>
  )
}
