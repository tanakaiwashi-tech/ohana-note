import type { FlowerStatus } from '../types/flower'
import { STATUS_LABELS } from '../types/flower'
import './StatusSelector.css'

const STATUSES: FlowerStatus[] = ['bud', 'starting', 'best', 'full', 'ending', 'finished']

type Props = {
  value: FlowerStatus | null
  onChange: (status: FlowerStatus) => void
  showHint?: boolean
}

export function StatusSelector({ value, onChange, showHint }: Props) {
  return (
    <div className="status-selector-wrap">
      <div className="status-selector">
        {STATUSES.map(status => (
          <button
            key={status}
            type="button"
            className={`status-btn ${value === status ? 'status-btn--selected' : ''}`}
            onClick={() => onChange(status)}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>
      {showHint && (
        <p className="status-hint">状態をひとつ選んでから保存できます</p>
      )}
    </div>
  )
}
