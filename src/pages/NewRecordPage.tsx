import { useState } from 'react'
import type { FlowerRecord, FlowerStatus, FlowerSuggestion } from '../types/flower'
import { Header } from '../components/Header'
import { PhotoUploader } from '../components/PhotoUploader'
import { SuggestionPanel } from '../components/SuggestionPanel'
import { StatusSelector } from '../components/StatusSelector'
import { FormField } from '../components/FormField'
import { getFlowerSuggestions } from '../services/flowerSuggestion'
import './NewRecordPage.css'

export type SaveData = {
  photoUrl: string
  flowerName: string
  status: FlowerStatus
  memo: string
  suggestions: FlowerSuggestion[]
}

type Props = {
  onBack: () => void
  /** 指定されている場合は編集モード */
  initialRecord?: FlowerRecord
  /** 新規作成時に呼ばれる */
  onSave: (data: SaveData) => void
  /** 編集完了時に呼ばれる */
  onUpdate?: (updated: FlowerRecord) => void
}

export function NewRecordPage({ onBack, initialRecord, onSave, onUpdate }: Props) {
  const isEditMode = Boolean(initialRecord)

  const [photoUrl, setPhotoUrl] = useState<string | null>(
    initialRecord?.photoUrl ?? null
  )
  const [flowerName, setFlowerName] = useState(initialRecord?.flowerName ?? '')
  const [status, setStatus] = useState<FlowerStatus | null>(
    initialRecord?.status ?? null
  )
  const [memo, setMemo] = useState(initialRecord?.memo ?? '')
  const [suggestions, setSuggestions] = useState<FlowerSuggestion[]>(
    initialRecord?.suggestions ?? []
  )
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showStatusHint, setShowStatusHint] = useState(false)

  const handlePhotoChange = async (url: string) => {
    setPhotoUrl(url)
    setSuggestions([])
    setLoadingSuggestions(true)
    try {
      const result = await getFlowerSuggestions(url)
      setSuggestions(result)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleSelectSuggestion = (name: string) => {
    setFlowerName(name)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!photoUrl) return
    if (!status) {
      setShowStatusHint(true)
      return
    }

    setSaved(true)
    setTimeout(() => {
      if (isEditMode && initialRecord && onUpdate) {
        onUpdate({
          ...initialRecord,
          photoUrl,
          flowerName,
          status,
          memo,
          suggestions,
        })
      } else {
        onSave({ photoUrl, flowerName, status, memo, suggestions })
      }
    }, 500)
  }

  const canSave = Boolean(photoUrl) && !saved

  const pageTitle = isEditMode ? '記録を編集' : '花を記録する'
  const btnLabel = isEditMode ? '更新する' : '記録する'
  const savedLabel = isEditMode ? '更新しました ✓' : '保存しました ✓'

  return (
    <div className="new-record-page">
      <Header title={pageTitle} showBack onBack={onBack} />

      <main className="new-record-main">
        <form onSubmit={handleSubmit}>
          <div className="new-record-form">

            {/* Photo */}
            <FormField label="写真">
              <PhotoUploader photoUrl={photoUrl} onChange={handlePhotoChange} />
            </FormField>

            {/* Suggestions */}
            {(loadingSuggestions || suggestions.length > 0) && (
              <SuggestionPanel
                suggestions={suggestions}
                isLoading={loadingSuggestions}
                onSelect={handleSelectSuggestion}
              />
            )}

            {/* Flower name */}
            <FormField label="花の名前">
              <input
                type="text"
                className="text-input"
                value={flowerName}
                onChange={e => setFlowerName(e.target.value)}
                placeholder="わからなければ空欄でも大丈夫"
                maxLength={40}
              />
            </FormField>

            {/* Status */}
            <FormField label="今の状態">
              <StatusSelector
                value={status}
                onChange={s => { setStatus(s); setShowStatusHint(false) }}
                showHint={showStatusHint}
              />
            </FormField>

            {/* Memo */}
            <FormField label="ひとこと">
              <textarea
                className="text-input text-input--textarea"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="今日のひとことを少しだけ"
                rows={3}
                maxLength={200}
              />
            </FormField>

            {/* Submit */}
            <button
              type="submit"
              className={`save-btn ${saved ? 'save-btn--saved' : ''}`}
              disabled={!canSave}
            >
              {saved ? savedLabel : btnLabel}
            </button>

            {!photoUrl && (
              <p className="save-note">写真を選ぶと{isEditMode ? '更新' : '記録'}できます</p>
            )}
          </div>
        </form>
      </main>
    </div>
  )
}
