import { describe, expect, it } from 'vitest'
import { keys, run, withResult } from '../test/keys'
import { initialState, type CalculatorAction } from './reducer'

// The keys that edit the number being typed: digits, the decimal point, sign
// toggle, backspace and clear.

const failed = (message: string): CalculatorAction => ({ type: 'requestFailed', message })

describe('digits and the decimal point', () => {
  it('appends digits to the number being typed', () => {
    expect(run(keys('123')).entry).toBe('123')
  })

  it('replaces a leading 0, also after a minus', () => {
    expect(run(keys('05')).entry).toBe('5')
    expect(run(keys('00')).entry).toBe('0')
    expect(run(keys('0±5')).entry).toBe('-5')
  })

  it('starts 0. when the point is pressed on an empty number', () => {
    expect(run(keys('.')).entry).toBe('0.')
    expect(run(keys('.5')).entry).toBe('0.5')
    expect(run(keys('5+.')).entry).toBe('0.')
  })

  it('keeps a zero after the point', () => {
    expect(run(keys('0.05')).entry).toBe('0.05')
  })

  it('allows only one decimal point', () => {
    expect(run(keys('1.2.3.')).entry).toBe('1.23')
  })

  it('allows at most 15 digits, not counting the point or the sign', () => {
    expect(run(keys('1234567890123456')).entry).toBe('123456789012345')
    expect(run(keys('1234567.890123456')).entry).toBe('1234567.89012345')
    expect(run(keys('123456789012345±6')).entry).toBe('-123456789012345')
  })
})

describe('sign toggle', () => {
  it('adds and removes a leading minus', () => {
    expect(run(keys('5±')).entry).toBe('-5')
    expect(run(keys('5±±')).entry).toBe('5')
  })

  it('does nothing on an empty number', () => {
    expect(run(keys('±'))).toEqual(initialState)
    expect(run(keys('5+±')).entry).toBe('')
  })

  it('does nothing on a result', () => {
    expect(run(keys('±'), withResult(5))).toEqual(withResult(5))
  })
})

describe('backspace', () => {
  it('removes the last character', () => {
    expect(run(keys('12.⌫')).entry).toBe('12')
    expect(run(keys('12⌫')).entry).toBe('1')
  })

  it('empties the number when only a minus is left', () => {
    expect(run(keys('5±⌫')).entry).toBe('')
  })

  it('does nothing to an operator or a result', () => {
    expect(run(keys('5+⌫'))).toEqual(run(keys('5+')))
    expect(run(keys('⌫'), withResult(5))).toEqual(withResult(5))
  })
})

describe('clear', () => {
  it('resets everything, including an error', () => {
    expect(run(keys('5+2C'))).toEqual(initialState)
    expect(run(keys('C'), withResult(5))).toEqual(initialState)
    expect(run([...keys('1÷0='), failed('cannot divide by zero'), ...keys('C')])).toEqual(initialState)
  })
})
