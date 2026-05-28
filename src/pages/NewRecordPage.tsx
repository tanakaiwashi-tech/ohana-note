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
  sourceType?: 'home' | 'outing'
}

type Props = {
  onBack: () => void
  initialRecord?: FlowerRecord
  onSave: (data: SaveData) => void
  onUpdate?: (updated: FlowerRecord) => void
  knownNames?: string[]
}

export function NewRecordPage({ onBack, initialRecord, onSave, onUpdate, knownNames = [] }: Props) {
  const isEditMode = Boolean(initialRecord)

  const [photoUrl, setPhotoUrl] = useState<string | null>(
    initialRecord?.photoUrl ?? null
  )
  const [flowerName, setFlowerName] = useState(initialRecord?.flowerName ?? '')
  const [status, setStatus] = useState<FlowerStatus | null>(
    initialRecord?.status ?? null
  )
  const [memo, setMemo] = useState(initialRecord?.memo ?? '')
  const [sourceType, setSourceType] = useState<'home' | 'outing' | undefined>(
    initialRecord?.sourceType
  )
  const [suggestions, setSuggestions] = useState<FlowerSuggestion[]>(
    initialRecord?.suggestions ?? []
  )
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [suggestionsAttempted, setSuggestionsAttempted] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showStatusHint, setShowStatusHint] = useState(false)

  const handlePhotoChange = async (url: string) => {
    setPhotoUrl(url)
    setSuggestions([])
    setSuggestionsAttempted(false)
    setLoadingSuggestions(true)
    try {
      const result = await getFlowerSuggestions(url, {
        month: new Date().getMonth() + 1,
        sourceType,
        knownNames,
      })
      setSuggestions(result)
    } finally {
      setLoadingSuggestions(false)
      setSuggestionsAttempted(true)
    }
  }

  const handleSelectSuggestion = (name: string) => {
    setFlowerName(name)
  }

  const toggleSourceType = (type: 'home' | 'outing') => {
    setSourceType(prev => (prev === type ? undefined : type))
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
          sourceType,
        })
      } else {
        onSave({ photoUrl, flowerName, status, memo, suggestions, sourceType })
      }
    }, 500)
  }

  const canSave = Boolean(photoUrl) && !saved

  const pageTitle = isEditMode ? '記録を編集' : '記録をつける'
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
            {(loadingSuggestions || suggestionsAttempted) && (
              <SuggestionPanel
                suggestions={suggestions}
                isLoading={loadingSuggestions}
                onSelect={handleSelectSuggestion}
                selectedName={flowerName}
              />
            )}

            {/* Flower name */}
            <FormField label="名前">
              <input
                type="text"
                className="text-input"
                value={flowerName}
                onChange={e => setFlowerName(e.target.value)}
                placeholder="わからなければ、空欄のままでも"
                maxLength={40}
              />
            </FormField>

            {/* Source type */}
            <FormField label="どこで">
              <div className="source-type-selector">
                <button
                  type="button"
                  className={`source-type-btn ${sourceType === 'home' ? 'source-type-btn--selected' : ''}`}
                  onClick={() => toggleSourceType('home')}
                >
                  庭・ベランダで
                </button>
                <button
                  type="button"
                  className={`source-type-btn ${sourceType === 'outing' ? 'source-type-btn--selected' : ''}`}
                  onClick={() => toggleSourceType('outing')}
                >
                  外で出会った
                </button>
              </div>
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
                placeholder="ひとことを添えてみてください"
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
