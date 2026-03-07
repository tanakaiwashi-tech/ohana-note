import './Header.css'

type Props = {
  title: string
  showBack?: boolean
  onBack?: () => void
  rightElement?: React.ReactNode
}

export function Header({ title, showBack, onBack, rightElement }: Props) {
  return (
    <header className="header">
      <div className="header-left">
        {showBack && (
          <button className="header-back" onClick={onBack} aria-label="戻る">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
      <h1 className="header-title">{title}</h1>
      <div className="header-right">
        {rightElement}
      </div>
    </header>
  )
}
