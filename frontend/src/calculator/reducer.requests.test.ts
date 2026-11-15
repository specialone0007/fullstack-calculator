import { describe, expect, it } from 'vitest'
import { keys, run, withResult } from '../test/keys'
import { calculationFor, calculatorReducer, initialState, isKeyEnabled, type CalculatorAction } from './reducer'

// The keys that build and send a calculation, and the answers that come back.

const failed = (message: string): CalculatorAction => ({ type: 'requestFailed', message })

describe('operators', () => {
  it('do nothing without a first number', () => {
    expect(run(keys('+'))).toEqual(initialState)
  })

  it('move the typed number into the first number', () => {
    const state = run(keys('10÷'))
    expect(state.first).toEqual({ value: 10, text: '10' })
    expect(state.operator).toBe('divide')
    expect(state.entry).toBe('')
  })

  it('drop a trailing decimal point from the first number', () => {
    expect(run(keys('2.+')).first).toEqual({ value: 2, text: '2' })
  })

  it('replace the operator before the second number is typed', () => {
    expect(run(keys('10÷×')).operator).toBe('multiply')
  })

  it('are disabled once the second number has a digit', () => {
    const state = run(keys('10÷2'))
    expect(isKeyEnabled(state, keys('+')[0])).toBe(false)
    expect(run(keys('×'), state)).toEqual(state)
  })
})

describe('equals', () => {
  it('is disabled until there is a second number', () => {
    expect(isKeyEnabled(initialState, keys('=')[0])).toBe(false)
    expect(isKeyEnabled(run(keys('10')), keys('=')[0])).toBe(false)
    expect(isKeyEnabled(run(keys('10÷')), keys('=')[0])).toBe(false)
    expect(run(keys('10÷=')).pending).toBeNull()
  })

  it('sends the calculation', () => {
    expect(run(keys('10÷2=')).pending).toEqual({
      request: { operation: 'divide', a: 10, b: 2 },
      expression: '10 ÷ 2 =',
    })
  })

  it('reads % of left to right', () => {
    expect(run(keys('15%200=')).pending).toEqual({
      request: { operation: 'percentage', a: 15, b: 200 },
      expression: '15 % of 200 =',
    })
  })

  it('shows the answer as a result', () => {
    const state = run([...keys('10÷2='), { type: 'resultReceived', result: 5 }])
    expect(state).toEqual({ ...initialState, result: { value: 5, expression: '10 ÷ 2 =' } })
  })

  it('is disabled after a result', () => {
    expect(isKeyEnabled(withResult(5), keys('=')[0])).toBe(false)
  })
})

describe('square root', () => {
  it('is enabled with a first number and no operator', () => {
    expect(isKeyEnabled(initialState, keys('√')[0])).toBe(false)
    expect(isKeyEnabled(run(keys('9')), keys('√')[0])).toBe(true)
    expect(isKeyEnabled(run(keys('9+')), keys('√')[0])).toBe(false)
    expect(isKeyEnabled(run(keys('9+4')), keys('√')[0])).toBe(false)
  })

  it('sends the request at once', () => {
    expect(run(keys('9√')).pending).toEqual({
      request: { operation: 'sqrt', a: 9 },
      expression: '√ 9 =',
    })
  })

  it('uses the exact value of a result', () => {
    expect(run(keys('√'), withResult(0.30000000000000004)).pending).toEqual({
      request: { operation: 'sqrt', a: 0.30000000000000004 },
      expression: '√ 0.3 =',
    })
  })

  it('counts its answer as a result', () => {
    const state = run([...keys('9√'), { type: 'resultReceived', result: 3 }])
    expect(state.result).toEqual({ value: 3, expression: '√ 9 =' })
  })
})

describe('after a result', () => {
  it('an operator continues from the exact value', () => {
    const state = run(keys('+'), withResult(0.30000000000000004))
    expect(state.first).toEqual({ value: 0.30000000000000004, text: '0.3' })
    expect(state.operator).toBe('add')
    expect(state.result).toBeNull()
  })

  it('a digit or a decimal point starts a new calculation', () => {
    expect(run(keys('7'), withResult(5))).toEqual({ ...initialState, entry: '7' })
    expect(run(keys('.'), withResult(5))).toEqual({ ...initialState, entry: '0.' })
  })
})

describe('while a request is in flight', () => {
  it('every key is disabled and does nothing', () => {
    const state = run(keys('10÷2='))
    for (const key of keys('0.±⌫C+=√')) {
      expect(isKeyEnabled(state, key)).toBe(false)
      expect(calculatorReducer(state, key)).toBe(state)
    }
  })
})

describe('when a request fails', () => {
  it('keeps the calculation and shows the message', () => {
    const state = run([...keys('1÷0='), failed('cannot divide by zero')])
    expect(state).toEqual({ ...run(keys('1÷0')), error: 'cannot divide by zero' })
  })

  it('retries when the same key is pressed again', () => {
    const state = run([...keys('1÷0='), failed('cannot divide by zero')])
    expect(calculationFor(state, keys('=')[0])).toEqual(run(keys('1÷0=')).pending)
    expect(run(keys('='), state)).toEqual(run(keys('1÷0=')))

    const root = run([...keys('9±√'), failed('cannot take the square root of a negative number')])
    expect(run(keys('√'), root).pending).toEqual(run(keys('9±√')).pending)
  })

  it('clears the message on the next key, which then works as usual', () => {
    const state = run([...keys('1÷0='), failed('cannot divide by zero'), ...keys('⌫5')])
    expect(state).toEqual(run(keys('1÷5')))
  })
})

describe('calculationFor', () => {
  it('returns null for keys that send nothing or are disabled', () => {
    expect(calculationFor(run(keys('5')), keys('+')[0])).toBeNull()
    expect(calculationFor(initialState, keys('√')[0])).toBeNull()
  })
})

describe('answers', () => {
  it('are ignored when no request is in flight', () => {
    expect(calculatorReducer(initialState, { type: 'resultReceived', result: 5 })).toBe(initialState)
  })
})
