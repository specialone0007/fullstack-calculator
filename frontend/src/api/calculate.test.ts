import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  calculate,
  CalculateError,
  SERVICE_UNREACHABLE_CODE,
  SERVICE_UNREACHABLE_MESSAGE,
  type CalculateRequest,
} from './calculate'

function reply(status: number, body: string) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { status }))
}

async function errorFrom(request: CalculateRequest): Promise<unknown> {
  return calculate(request).then(
    () => 'no error',
    (error: unknown) => error,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('calculate', () => {
  it('posts the request as JSON and returns the result', async () => {
    const fetchMock = reply(200, '{"result":5}')

    await expect(calculate({ operation: 'divide', a: 10, b: 2 })).resolves.toBe(5)
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"operation":"divide","a":10,"b":2}',
    })
  })

  it('throws the code and message of a backend error', async () => {
    reply(422, '{"error":{"code":"DIVISION_BY_ZERO","message":"cannot divide by zero"}}')

    const error = await errorFrom({ operation: 'divide', a: 1, b: 0 })
    expect(error).toBeInstanceOf(CalculateError)
    expect(error).toMatchObject({ code: 'DIVISION_BY_ZERO', message: 'cannot divide by zero' })
  })

  it('throws the unreachable error on a network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    await expectUnreachable()
  })

  it('throws the unreachable error when the reply is not JSON', async () => {
    reply(502, '<html>Bad Gateway</html>')

    await expectUnreachable()
  })

  it('throws the unreachable error when the JSON has the wrong shape', async () => {
    reply(200, '{"answer":5}')
    await expectUnreachable()

    reply(500, '{"error":"boom"}')
    await expectUnreachable()
  })
})

async function expectUnreachable() {
  const error = await errorFrom({ operation: 'sqrt', a: 9 })
  expect(error).toBeInstanceOf(CalculateError)
  expect(error).toMatchObject({ code: SERVICE_UNREACHABLE_CODE, message: SERVICE_UNREACHABLE_MESSAGE })
}
