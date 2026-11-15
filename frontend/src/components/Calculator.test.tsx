import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Calculator } from './Calculator'

function replyWith(status: number, body: object) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

function displayedValue() {
  return screen.getByRole('status').textContent
}

async function clickKeys(user: ReturnType<typeof userEvent.setup>, ...names: string[]) {
  for (const name of names) {
    await user.click(screen.getByRole('button', { name }))
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Calculator', () => {
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
    expect(screen.getByRole('button', { name: 'Equals' })).toBeDisabled()
    expect(screen.queryByText('12 -')).not.toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(displayedValue()).toBe('0')
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
