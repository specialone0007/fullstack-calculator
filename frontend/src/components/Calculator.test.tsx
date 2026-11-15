import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clickKeys, displayedValue, replyWith } from '../test/calculator'
import { Calculator } from './Calculator'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Calculator keypad', () => {
  it('shows the result of 10 ÷ 2 clicked on the keypad', async () => {
    const fetchMock = replyWith(200, { result: 5 })
    const user = userEvent.setup()
    render(<Calculator />)

    await clickKeys(user, '1', '0', 'Divide', '2', 'Equals')

    await waitFor(() => expect(displayedValue()).toBe('5'))
    expect(screen.getByText('10 ÷ 2 =')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0][1]?.body).toBe('{"operation":"divide","a":10,"b":2}')
  })

  it('shows the backend message for 1 ÷ 0 clicked on the keypad', async () => {
    replyWith(422, { error: { code: 'DIVISION_BY_ZERO', message: 'cannot divide by zero' } })
    const user = userEvent.setup()
    render(<Calculator />)

    await clickKeys(user, '1', 'Divide', '0', 'Equals')

    expect(await screen.findByRole('alert')).toHaveTextContent('cannot divide by zero')
  })

  it.each([
    ['Add', '12 +'],
    ['Subtract', '12 -'],
    ['Multiply', '12 ×'],
    ['Percent of', '12 % of'],
  ])('chooses an operator with the %s button', async (name, expression) => {
    const user = userEvent.setup()
    render(<Calculator />)

    await clickKeys(user, '1', '2', name)

    expect(screen.getByText(expression)).toBeInTheDocument()
  })

  it.each([
    ['Toggle sign', '-12'],
    ['Backspace', '1'],
    ['Clear', '0'],
    ['Decimal point', '12.'],
  ])('edits the number with the %s button', async (name, value) => {
    const user = userEvent.setup()
    render(<Calculator />)

    await clickKeys(user, '1', '2', name)

    expect(displayedValue()).toBe(value)
  })

  it('disables every key while a request is in flight', async () => {
    let answer: (response: Response) => void = () => {}
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise((resolve) => (answer = resolve)))
    const user = userEvent.setup()
    render(<Calculator />)

    await clickKeys(user, '9', 'Square root')

    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
    }
    answer(new Response('{"result":3}'))
    await waitFor(() => expect(displayedValue()).toBe('3'))
    expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled()
  })

  it('shows a message when the service cannot be reached, and retries', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const user = userEvent.setup()
    render(<Calculator />)

    await clickKeys(user, '2', 'Power', '3', 'Equals')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cannot reach the calculator service. Please try again.',
    )

    replyWith(200, { result: 8 })
    await clickKeys(user, 'Equals')
    await waitFor(() => expect(displayedValue()).toBe('8'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
