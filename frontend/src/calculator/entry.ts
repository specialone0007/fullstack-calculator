// How the number being typed changes with each key. Every function takes the
// text typed so far and returns the new text. An empty string means nothing
// is typed yet.

import type { Digit } from './reducer'

const MAX_DIGITS = 15

export function appendDigit(entry: string, digit: Digit): string {
  if (entry.replace(/\D/g, '').length >= MAX_DIGITS) return entry
  if (entry === '0') return digit
  if (entry === '-0') return `-${digit}`
  return entry + digit
}

export function appendDecimalPoint(entry: string): string {
  if (entry.includes('.')) return entry
  return entry === '' ? '0.' : `${entry}.`
}

export function toggleSign(entry: string): string {
  if (entry === '') return entry
  return entry.startsWith('-') ? entry.slice(1) : `-${entry}`
}

export function removeLastCharacter(entry: string): string {
  const shorter = entry.slice(0, -1)
  // A lone minus is not a number, so the entry is empty again.
  return shorter === '-' ? '' : shorter
}
