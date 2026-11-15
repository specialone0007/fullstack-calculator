import { screen } from '@testing-library/react'
import type userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

// Helpers for the Calculator component tests.

export function replyWith(status: number, body: object) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

export function displayedValue() {
  return screen.getByRole('status').textContent
}

export async function clickKeys(user: ReturnType<typeof userEvent.setup>, ...names: string[]) {
  for (const name of names) {
    await user.click(screen.getByRole('button', { name }))
  }
}
