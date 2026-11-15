import { useEffect, useReducer } from 'react'
import { calculate, CalculateError, SERVICE_UNREACHABLE_MESSAGE } from '../api/calculate'
import { displayText } from '../calculator/display'
import {
  calculationFor,
  calculatorReducer,
  initialState,
  isKeyEnabled,
  type KeyAction,
} from '../calculator/reducer'
import { Display } from './Display'
import { Keypad } from './Keypad'

// Maps KeyboardEvent.key to the keypad key it presses.
const KEYBOARD_ACTIONS: Record<string, KeyAction | undefined> = {
  '0': { type: 'digitPressed', digit: '0' },
  '1': { type: 'digitPressed', digit: '1' },
  '2': { type: 'digitPressed', digit: '2' },
  '3': { type: 'digitPressed', digit: '3' },
  '4': { type: 'digitPressed', digit: '4' },
  '5': { type: 'digitPressed', digit: '5' },
  '6': { type: 'digitPressed', digit: '6' },
  '7': { type: 'digitPressed', digit: '7' },
  '8': { type: 'digitPressed', digit: '8' },
  '9': { type: 'digitPressed', digit: '9' },
  '.': { type: 'decimalPointPressed' },
  '+': { type: 'operatorPressed', operator: 'add' },
  '-': { type: 'operatorPressed', operator: 'subtract' },
  '*': { type: 'operatorPressed', operator: 'multiply' },
  '/': { type: 'operatorPressed', operator: 'divide' },
  '^': { type: 'operatorPressed', operator: 'power' },
  '%': { type: 'operatorPressed', operator: 'percentage' },
  '=': { type: 'equalsPressed' },
  Enter: { type: 'equalsPressed' },
  Backspace: { type: 'backspacePressed' },
  Escape: { type: 'clearPressed' },
}

export function Calculator() {
  const [state, dispatch] = useReducer(calculatorReducer, initialState)

  async function press(action: KeyAction) {
    if (!isKeyEnabled(state, action)) return

    const calculation = calculationFor(state, action)
    dispatch(action)
    if (calculation === null) return

    try {
      const result = await calculate(calculation.request)
      dispatch({ type: 'resultReceived', result })
    } catch (error) {
      // calculate throws only CalculateError; the fallback keeps the type checker honest.
      const message = error instanceof CalculateError ? error.message : SERVICE_UNREACHABLE_MESSAGE
      dispatch({ type: 'requestFailed', message })
    }
  }

  // No dependency list: the listener is replaced after every render, so it
  // always presses keys against the current state.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Leave shortcuts such as Ctrl+- (zoom out) to the browser.
      if (event.ctrlKey || event.metaKey || event.altKey) return

      const action = KEYBOARD_ACTIONS[event.key]
      if (action === undefined) return

      // Stops Enter from also clicking a focused button, and / from opening
      // the browser's find bar.
      event.preventDefault()
      void press(action)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  const { expression, value } = displayText(state)

  return (
    <main className="calculator">
      <Display expression={expression} value={value} error={state.error} />
      <Keypad isEnabled={(action) => isKeyEnabled(state, action)} onPress={(action) => void press(action)} />
    </main>
  )
}
