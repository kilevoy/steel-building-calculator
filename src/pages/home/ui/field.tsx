interface FieldProps {
  label: string
  id?: string
  children: React.ReactNode
}

export function Field({ label, id, children }: FieldProps) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}
