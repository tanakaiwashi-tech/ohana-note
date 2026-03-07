import type { FlowerSuggestion } from '../types/flower'
import './SuggestionPanel.css'

type Props = {
  suggestions: FlowerSuggestion[]
  isLoading: boolean
  onSelect: (name: string) => void
}

export function SuggestionPanel({ suggestions, isLoading, onSelect }: Props) {
  if (isLoading) {
    return (
      <div className="suggestion-panel">
        <div className="suggestion-label">候補を探しています…</div>
        <div className="suggestion-loading">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    )
  }

  if (suggestions.length === 0) return null

  return (
    <div className="suggestion-panel">
      <div className="suggestion-label">候補</div>
      <div className="suggestion-list">
        {suggestions.map(s => (
          <button
            key={s.id}
            type="button"
            className="suggestion-item"
            onClick={() => onSelect(s.name)}
          >
            {s.name}
          </button>
        ))}
      </div>
      <p className="suggestion-note">違う場合は下の入力欄に直接書けます</p>
    </div>
  )
}
