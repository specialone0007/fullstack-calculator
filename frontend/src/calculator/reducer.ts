import type { CalculateRequest } from '../api/calculate'
import { appendDecimalPoint, appendDigit, removeLastCharacter, toggleSign } from './entry'
import { formatResult } from './format'

export type Operator = 'add' | 'subtract' | 'multiply' | 'divide' | 'power' | 'percentage'

export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'

export const OPERATOR_SYMBOLS: Record<Operator, string> = {
  add: '+',
  subtract: '-',
  multiply: '×',
  divide: '÷',
  power: '^',
  percentage: '% of',
}

// A number that is no longer being typed: the exact value to send to the
// backend, and the text the display shows for it.
export interface Operand {
  value: number
  text: string
}

// A request on its way to the backend, with the expression the display
// shows once the answer arrives.
export interface Calculation {
  request: CalculateRequest
  expression: string
}

export interface CalculatorState {
  // The number being typed, as text. Empty when nothing is typed.
  entry: string
  // The first number. Set together with operator, when an operator is chosen.
  first: Operand | null
  operator: Operator | null
  // The last answer from the backend, kept exact so the next operation can use it.
  result: { value: number; expression: string } | null
  pending: Calculation | null
  error: string | null
}

export const initialState: CalculatorState = {
  entry: '',
  first: null,
  operator: null,
  result: null,
  pending: null,
  error: null,
}

export type KeyAction =
  | { type: 'digitPressed'; digit: Digit }
  | { type: 'decimalPointPressed' }
  | { type: 'signTogglePressed' }
  | { type: 'backspacePressed' }
  | { type: 'clearPressed' }
  | { type: 'operatorPressed'; operator: Operator }
  | { type: 'equalsPressed' }
  | { type: 'squareRootPressed' }

export type CalculatorAction =
  | KeyAction
  | { type: 'resultReceived'; result: number }
  | { type: 'requestFailed'; message: string }

export function calculatorReducer(state: CalculatorState, action: CalculatorAction): CalculatorState {
  switch (action.type) {
    case 'resultReceived':
      if (state.pending === null) return state
      return { ...initialState, result: { value: action.result, expression: state.pending.expression } }
    case 'requestFailed':
      // Everything else stays as it was, so pressing the same key again retries.
      return { ...state, pending: null, error: action.message }
    default:
      if (!isKeyEnabled(state, action)) return state
      return pressKey({ ...state, error: null }, action)
  }
}

export function isKeyEnabled(state: CalculatorState, action: KeyAction): boolean {
  if (state.pending !== null) return false
  switch (action.type) {
    case 'operatorPressed':
      if (state.result !== null) return true
      return state.operator === null ? state.entry !== '' : state.entry === ''
    case 'equalsPressed':
      return state.operator !== null && state.entry !== ''
    case 'squareRootPressed':
      return state.result !== null || (state.operator === null && state.entry !== '')
    default:
      return true
  }
}

// calculationFor returns the request a key sends, or null for a key that
// sends none or is disabled.
export function calculationFor(state: CalculatorState, action: KeyAction): Calculation | null {
  if (!isKeyEnabled(state, action)) return null
  if (action.type === 'equalsPressed' && state.first !== null && state.operator !== null) {
    const second = operandFromEntry(state.entry)
    return {
      request: { operation: state.operator, a: state.first.value, b: second.value },
      expression: `${state.first.text} ${OPERATOR_SYMBOLS[state.operator]} ${second.text} =`,
    }
  }
  if (action.type === 'squareRootPressed') {
    const operand = state.result !== null ? operandFromResult(state.result.value) : operandFromEntry(state.entry)
    return { request: { operation: 'sqrt', a: operand.value }, expression: `√ ${operand.text} =` }
  }
  return null
}

function pressKey(state: CalculatorState, action: KeyAction): CalculatorState {
  // After a result, a digit or a decimal point starts a new calculation.
  const editable = state.result !== null ? initialState : state

  switch (action.type) {
    case 'digitPressed':
      return { ...editable, entry: appendDigit(editable.entry, action.digit) }
    case 'decimalPointPressed':
      return { ...editable, entry: appendDecimalPoint(editable.entry) }
    case 'signTogglePressed':
      return { ...state, entry: toggleSign(state.entry) }
    case 'backspacePressed':
      return { ...state, entry: removeLastCharacter(state.entry) }
    case 'clearPressed':
      return initialState
    case 'operatorPressed':
      if (state.result !== null) {
        return { ...initialState, first: operandFromResult(state.result.value), operator: action.operator }
      }
      if (state.operator !== null) return { ...state, operator: action.operator }
      return { ...state, first: operandFromEntry(state.entry), operator: action.operator, entry: '' }
    case 'equalsPressed':
    case 'squareRootPressed':
      return { ...state, pending: calculationFor(state, action) }
  }
}

function operandFromEntry(entry: string): Operand {
  // A trailing point, as in "2.", adds nothing once the number is finished.
  return { value: Number(entry), text: entry.endsWith('.') ? entry.slice(0, -1) : entry }
}

function operandFromResult(value: number): Operand {
  return { value, text: formatResult(value) }
}
