import { formatResult } from './format'
import { OPERATOR_SYMBOLS, type CalculatorState } from './reducer'

export interface DisplayText {
  // The small top line: the expression being built, or the one that gave the result.
  expression: string
  // The main line: the number being typed, or the number it stands on.
  value: string
}

export function displayText(state: CalculatorState): DisplayText {
  return { expression: expressionLine(state), value: valueLine(state) }
}

function expressionLine(state: CalculatorState): string {
  if (state.result !== null) return state.result.expression
  if (state.first === null || state.operator === null) return ''

  const start = `${state.first.text} ${OPERATOR_SYMBOLS[state.operator]}`
  return state.entry === '' ? start : `${start} ${state.entry}`
}

function valueLine(state: CalculatorState): string {
  if (state.entry !== '') return state.entry
  if (state.first !== null) return state.first.text
  if (state.result !== null) return formatResult(state.result.value)
  return '0'
}
