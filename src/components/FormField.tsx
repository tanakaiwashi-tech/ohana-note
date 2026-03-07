import './FormField.css'

type Props = {
  label: string
  children: React.ReactNode
}

export function FormField({ label, children }: Props) {
  return (
    <div className="form-field">
      <label className="form-field-label">{label}</label>
      <div className="form-field-content">{children}</div>
    </div>
  )
}
