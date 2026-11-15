const SIGNIFICANT_DIGITS = 12

// formatResult turns a result from the backend into display text with at most
// 12 significant digits. Very large and very small results use exponent form.
export function formatResult(value: number): string {
  // Rounding first hides float noise, so 0.30000000000000004 shows as 0.3,
  // and lets a value that rounds up to 1e12 take the exponent form.
  const rounded = Number(value.toPrecision(SIGNIFICANT_DIGITS))
  const size = Math.abs(rounded)

  if (size >= 1e12 || (size !== 0 && size < 1e-6)) {
    // toExponential pads the digits with zeros, as in 1.50000000000e+12.
    return rounded.toExponential(SIGNIFICANT_DIGITS - 1).replace(/\.?0+e/, 'e')
  }
  return String(rounded)
}
