import type { FlowerSuggestion } from '../types/flower'
import './SuggestionPanel.css'

type Props = {
  suggestions: FlowerSuggestion[]
  isLoading: boolean
  onSelect: (name: string) => void
  selectedName?: string
}

export function SuggestionPanel({ suggestions, isLoading, onSelect, selectedName }: Props) {
  // 読み込み中
  if (isLoading) {
    return (
      <div className="suggestion-panel">
        <div className="suggestion-loading">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p className="suggestion-loading-text">この草花の名前を探しています</p>
      </div>
    )
  }

  // 見つからなかった
  if (suggestions.length === 0) {
    return (
      <div className="suggestion-panel suggestion-panel--unfound">
        <p className="suggestion-unfound-text">名前はうまく見つかりませんでした</p>
        <p className="suggestion-note">名前がわからなくても、そのまま残せます</p>
      </div>
    )
  }

  // 候補あり
  return (
    <div className="suggestion-panel">
      <div className="suggestion-label">近い名前</div>
      <div className="suggestion-list">
        {suggestions.map(s => (
          <button
            key={s.id}
            type="button"
            className={`suggestion-item${selectedName === s.name ? ' suggestion-item--selected' : ''}`}
            onClick={() => onSelect(s.name)}
          >
            {s.name}
          </button>
        ))}
      </div>
      <p className="suggestion-note">名前がわからなくても、そのまま残せます</p>
    </div>
  )
}
