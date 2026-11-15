// The operation names the backend accepts in POST /api/v1/calculate.
export type Operation =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'power'
  | 'percentage'
  | 'sqrt'

export interface CalculateRequest {
  operation: Operation
  a: number
  // Left out for sqrt, which uses only a.
  b?: number
}

export const SERVICE_UNREACHABLE_MESSAGE = 'Cannot reach the calculator service. Please try again.'

// The code CalculateError carries when there is no reply from the backend to read.
export const SERVICE_UNREACHABLE_CODE = 'SERVICE_UNREACHABLE'

// The one error type calculate throws. For a backend error it carries the
// backend's code and message; otherwise it carries SERVICE_UNREACHABLE.
export class CalculateError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'CalculateError'
    this.code = code
  }
}

// calculate sends one calculation to the backend and returns its result.
export async function calculate(request: CalculateRequest): Promise<number> {
  let response: Response
  let body: unknown
  try {
    response = await fetch('/api/v1/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    body = await response.json()
  } catch {
    throw unreachable()
  }

  if (response.ok && isSuccessBody(body)) {
    return body.result
  }
  if (!response.ok && isErrorBody(body)) {
    throw new CalculateError(body.error.code, body.error.message)
  }
  throw unreachable()
}

function unreachable(): CalculateError {
  return new CalculateError(SERVICE_UNREACHABLE_CODE, SERVICE_UNREACHABLE_MESSAGE)
}

function isSuccessBody(body: unknown): body is { result: number } {
  return isObject(body) && typeof body.result === 'number'
}

function isErrorBody(body: unknown): body is { error: { code: string; message: string } } {
  return (
    isObject(body) &&
    isObject(body.error) &&
    typeof body.error.code === 'string' &&
    typeof body.error.message === 'string'
  )
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
