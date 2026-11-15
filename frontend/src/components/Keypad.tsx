import type { Digit, KeyAction, Operator } from '../calculator/reducer'

interface Key {
  label: string
  // The accessible name, for keys whose label is a symbol.
  name?: string
  action: KeyAction
  className?: string
}

function digitKey(digit: Digit, className?: string): Key {
  return { label: digit, action: { type: 'digitPressed', digit }, className }
}

function operatorKey(label: string, name: string, operator: Operator): Key {
  return { label, name, action: { type: 'operatorPressed', operator }, className: 'key-operator' }
}

// In reading order. The CSS grid places them four to a row.
const KEYS: Key[] = [
  { label: 'C', name: 'Clear', action: { type: 'clearPressed' }, className: 'key-control' },
  { label: '⌫', name: 'Backspace', action: { type: 'backspacePressed' }, className: 'key-control' },
  { label: '±', name: 'Toggle sign', action: { type: 'signTogglePressed' }, className: 'key-control' },
  operatorKey('÷', 'Divide', 'divide'),
  { label: '√', name: 'Square root', action: { type: 'squareRootPressed' }, className: 'key-operator' },
  operatorKey('xʸ', 'Power', 'power'),
  operatorKey('% of', 'Percent of', 'percentage'),
  operatorKey('×', 'Multiply', 'multiply'),
  digitKey('7'),
  digitKey('8'),
  digitKey('9'),
  operatorKey('-', 'Subtract', 'subtract'),
  digitKey('4'),
  digitKey('5'),
  digitKey('6'),
  operatorKey('+', 'Add', 'add'),
  digitKey('1'),
  digitKey('2'),
  digitKey('3'),
  { label: '=', name: 'Equals', action: { type: 'equalsPressed' }, className: 'key-equals' },
  digitKey('0', 'key-zero'),
  { label: '.', name: 'Decimal point', action: { type: 'decimalPointPressed' } },
]

interface KeypadProps {
  isEnabled: (action: KeyAction) => boolean
  onPress: (action: KeyAction) => void
}

export function Keypad({ isEnabled, onPress }: KeypadProps) {
  return (
    <div className="keypad">
      {KEYS.map((key) => (
        <button
          key={key.label}
          type="button"
          className={key.className ? `key ${key.className}` : 'key'}
          aria-label={key.name}
          disabled={!isEnabled(key.action)}
          onClick={() => onPress(key.action)}
        >
          {key.label}
        </button>
      ))}
    </div>
  )
}
