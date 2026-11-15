import { describe, expect, it } from 'vitest'
import { keys, run } from '../test/keys'
import { displayText } from './display'
import type { CalculatorAction } from './reducer'

const answer = (result: number): CalculatorAction => ({ type: 'resultReceived', result })

describe('displayText', () => {
  it('shows 0 before anything is typed', () => {
    expect(displayText(run([]))).toEqual({ expression: '', value: '0' })
  })

  it('shows the number being typed', () => {
    expect(displayText(run(keys('20.')))).toEqual({ expression: '', value: '20.' })
  })

  it('shows the first number until the second is typed', () => {
    expect(displayText(run(keys('20÷')))).toEqual({ expression: '20 ÷', value: '20' })
  })

  it('shows the expression being built', () => {
    expect(displayText(run(keys('20÷2')))).toEqual({ expression: '20 ÷ 2', value: '2' })
  })

  it('shows the full expression and the result', () => {
    expect(displayText(run([...keys('20÷2='), answer(10)]))).toEqual({ expression: '20 ÷ 2 =', value: '10' })
    expect(displayText(run([...keys('9√'), answer(3)]))).toEqual({ expression: '√ 9 =', value: '3' })
  })

  it('rounds a result and the first number taken from it', () => {
    const afterResult = run([...keys('.1+.2='), answer(0.1 + 0.2)])
    expect(displayText(afterResult)).toEqual({ expression: '0.1 + 0.2 =', value: '0.3' })
    expect(displayText(run(keys('+'), afterResult))).toEqual({ expression: '0.3 +', value: '0.3' })
  })
})
