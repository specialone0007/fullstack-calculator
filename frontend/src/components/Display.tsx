interface DisplayProps {
  expression: string
  value: string
  error: string | null
}

export function Display({ expression, value, error }: DisplayProps) {
  return (
    <div className="display">
      <p className="display-expression">{expression}</p>
      {error === null ? (
        <output className="display-value">{value}</output>
      ) : (
        <p className="display-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
