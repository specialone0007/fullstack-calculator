import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clickKeys, displayedValue, replyWith } from '../test/calculator'
import { Calculator } from './Calculator'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Calculator keyboard', () => {
  it.each([
    ['+', '6 +'],
    ['-', '6 -'],
    ['*', '6 ×'],
    ['^', '6 ^'],
    ['%', '6 % of'],
  ])('chooses an operator with the %s key', async (key, expression) => {
    const user = userEvent.setup()
    render(<Calculator />)

    await user.keyboard(`6${key}`)

    expect(screen.getByText(expression)).toBeInTheDocument()
  })

  it('types a decimal point with the . key', async () => {
    const user = userEvent.setup()
    render(<Calculator />)

    await user.keyboard('6.5')

    expect(displayedValue()).toBe('6.5')
  })

  it('shows the result of 10 / 2 typed on the keyboard', async () => {
    replyWith(200, { result: 5 })
    const user = userEvent.setup()
    render(<Calculator />)

    await user.keyboard('10/2{Enter}')

    await waitFor(() => expect(displayedValue()).toBe('5'))
  })

  it('shows the backend message for 1 / 0 typed on the keyboard', async () => {
    replyWith(422, { error: { code: 'DIVISION_BY_ZERO', message: 'cannot divide by zero' } })
    const user = userEvent.setup()
    render(<Calculator />)

    await user.keyboard('1/0{Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent('cannot divide by zero')
  })

  it('does not type a clicked digit again when Enter is pressed', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const user = userEvent.setup()
    render(<Calculator />)

    await clickKeys(user, '7')
    expect(screen.getByRole('button', { name: '7' })).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(displayedValue()).toBe('7')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('handles Backspace and Escape, and leaves shortcuts with Ctrl to the browser', async () => {
    const user = userEvent.setup()
    render(<Calculator />)

    await user.keyboard('123{Backspace}')
    expect(displayedValue()).toBe('12')

    await user.keyboard('{Control>}-{/Control}')
    // Choosing an operator would disable Square root.
    expect(screen.getByRole('button', { name: 'Square root' })).toBeEnabled()
    expect(screen.queryByText('12 -')).not.toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(displayedValue()).toBe('0')
  })
})
