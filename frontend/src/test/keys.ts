// Helpers that drive the reducer in tests.

import {
  calculatorReducer,
  initialState,
  type CalculatorAction,
  type CalculatorState,
  type KeyAction,
} from '../calculator/reducer'

// keys turns a short string into key presses, so a test reads like the keys
// a user presses: '10÷2=' is one, zero, divide, two, equals.
export function keys(text: string): KeyAction[] {
  return [...text].map((char): KeyAction => {
    switch (char) {
      case '.': return { type: 'decimalPointPressed' }
      case '±': return { type: 'signTogglePressed' }
      case '⌫': return { type: 'backspacePressed' }
      case 'C': return { type: 'clearPressed' }
      case '+': return { type: 'operatorPressed', operator: 'add' }
      case '-': return { type: 'operatorPressed', operator: 'subtract' }
      case '×': return { type: 'operatorPressed', operator: 'multiply' }
      case '÷': return { type: 'operatorPressed', operator: 'divide' }
      case '^': return { type: 'operatorPressed', operator: 'power' }
      case '%': return { type: 'operatorPressed', operator: 'percentage' }
      case '=': return { type: 'equalsPressed' }
      case '√': return { type: 'squareRootPressed' }
      case '0': case '1': case '2': case '3': case '4':
      case '5': case '6': case '7': case '8': case '9':
        return { type: 'digitPressed', digit: char }
      default: throw new Error(`no key for ${char}`)
    }
  })
}

export function run(actions: CalculatorAction[], state: CalculatorState = initialState): CalculatorState {
  return actions.reduce(calculatorReducer, state)
}

// A state showing the given result, as if a calculation had come back with it.
export function withResult(result: number): CalculatorState {
  return run([...keys('1+2='), { type: 'resultReceived', result }])
}
