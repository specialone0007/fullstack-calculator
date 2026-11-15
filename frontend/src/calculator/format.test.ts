import { describe, expect, it } from 'vitest'
import { formatResult } from './format'

describe('formatResult', () => {
  it.each([
    ['integers', 42, '42'],
    ['zero', 0, '0'],
    ['decimals', 2.5, '2.5'],
    ['float noise', 0.1 + 0.2, '0.3'],
    ['more than 12 significant digits', 1 / 3, '0.333333333333'],
    ['the largest plain number', 999999999999, '999999999999'],
    ['the smallest plain number', 0.000001, '0.000001'],
    ['1e12', 1e12, '1e+12'],
    ['very large numbers', 1234567890123456, '1.23456789012e+15'],
    ['a value that rounds up to 1e12', 999999999999.9, '1e+12'],
    ['very small numbers', 0.00000012345, '1.2345e-7'],
    ['negative integers', -42, '-42'],
    ['negative decimals', -0.1 - 0.2, '-0.3'],
    ['very large negative numbers', -1234567890123456, '-1.23456789012e+15'],
    ['very small negative numbers', -0.00000012345, '-1.2345e-7'],
  ])('formats %s', (_name, value, expected) => {
    expect(formatResult(value)).toBe(expected)
  })
})
