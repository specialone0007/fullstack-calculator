# fullstack-calculator

## What this is

A calculator in the browser. The React frontend shows the keypad and the display, and it sends every calculation to a Go backend over one JSON endpoint. The backend does all the arithmetic and returns the result or a clear error.

## Run with Docker

You need Docker. From the repository root:

```bash
docker build -t fullstack-calculator .
docker run --rm -p 8080:8080 fullstack-calculator
```

Open http://localhost:8080. The calculator and the API are served from the same port.

## Run locally

Install:

- Go 1.27.4 or newer (the version in `backend/go.mod`)
- Node 26 (the version in `frontend/.nvmrc`) with npm

Start the backend in one terminal. It listens on port 8080; set the environment variable `PORT` to use another port. When the environment variable `STATIC_DIR` names a folder, such as `../frontend/dist` after `npm run build`, the server also serves that folder at `/`. The Docker image sets it.

```bash
cd backend
go run ./cmd/server
```

Start the frontend in a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. The Vite dev server forwards every request under `/api` to the backend on port 8080, so the browser talks to one origin.

## API

There is one endpoint:

```text
POST /api/v1/calculate
Content-Type: application/json

{"operation": "add", "a": 2, "b": 3}
```

A success returns status 200 and `{"result": <number>}`. An error returns `{"error": {"code": "<CODE>", "message": "<text>"}}` with the status from the error table.

### Operations

| `operation`  | Result          | Needs `b` |
|--------------|-----------------|-----------|
| `add`        | a + b           | yes       |
| `subtract`   | a - b           | yes       |
| `multiply`   | a × b           | yes       |
| `divide`     | a ÷ b           | yes       |
| `power`      | a to the power b | yes      |
| `percentage` | a percent of b, which is a × b ÷ 100 | yes |
| `sqrt`       | square root of a | no, `b` is ignored |

### Errors

| Status | Code                   | When |
|--------|------------------------|------|
| 400    | `INVALID_REQUEST`      | The body is not one JSON object with only the fields `operation`, `a` and `b`, a field has the wrong type, or the body is larger than 1024 bytes. |
| 400    | `UNKNOWN_OPERATION`    | `operation` is not in the operations table. |
| 400    | `MISSING_OPERAND`      | `a` is missing or null, or `b` is missing or null for an operation that needs it. |
| 422    | `DIVISION_BY_ZERO`     | `divide` with `b` equal to 0. |
| 422    | `NEGATIVE_SQUARE_ROOT` | `sqrt` with `a` below 0. |
| 422    | `UNDEFINED_RESULT`     | The result is infinite or not a number, for example 10 to the power 400. |

The handler also has a 500 `INTERNAL_ERROR` reply for a calculator error that is missing from its error map. No request can reach it today.

### Examples

These commands are for a POSIX shell, such as bash or zsh. They need the server from "Run with Docker" or the backend from "Run locally" on port 8080. The `-w` option prints the HTTP status on the line after the body.

Operations:

```bash
curl -s -w '%{http_code}\n' -X POST http://localhost:8080/api/v1/calculate -H 'Content-Type: application/json' -d '{"operation":"add","a":2,"b":3}'
```

```text
{"result":5}
200
```

```bash
curl -s -w '%{http_code}\n' -X POST http://localhost:8080/api/v1/calculate -H 'Content-Type: application/json' -d '{"operation":"subtract","a":10,"b":4}'
```

```text
{"result":6}
200
```

```bash
curl -s -w '%{http_code}\n' -X POST http://localhost:8080/api/v1/calculate -H 'Content-Type: application/json' -d '{"operation":"multiply","a":6,"b":7}'
```

```text
{"result":42}
200
```

```bash
curl -s -w '%{http_code}\n' -X POST http://localhost:8080/api/v1/calculate -H 'Content-Type: application/json' -d '{"operation":"divide","a":7,"b":2}'
```

```text
{"result":3.5}
200
```

```bash
curl -s -w '%{http_code}\n' -X POST http://localhost:8080/api/v1/calculate -H 'Content-Type: application/json' -d '{"operation":"power","a":2,"b":10}'
```

```text
{"result":1024}
200
```

```bash
curl -s -w '%{http_code}\n' -X POST http://localhost:8080/api/v1/calculate -H 'Content-Type: application/json' -d '{"operation":"percentage","a":15,"b":200}'
```

```text
{"result":30}
200
```

```bash
curl -s -w '%{http_code}\n' -X POST http://localhost:8080/api/v1/calculate -H 'Content-Type: application/json' -d '{"operation":"sqrt","a":16}'
```

```text
{"result":4}
200
```

Errors:

```bash
curl -s -w '%{http_code}\n' -X POST http://localhost:8080/api/v1/calculate -H 'Content-Type: application/json' -d '{"operation":"add","a":"two","b":3}'
```

```text
{"error":{"code":"INVALID_REQUEST","message":"the request body must be one JSON object with the fields operation, a and b, at most 1024 bytes long"}}
400
```

A body larger than 1024 bytes gets the same `INVALID_REQUEST` reply.

```bash
curl -s -w '%{http_code}\n' -X POST http://localhost:8080/api/v1/calculate -H 'Content-Type: application/json' -d '{"operation":"modulo","a":7,"b":2}'
```

```text
{"error":{"code":"UNKNOWN_OPERATION","message":"unknown operation"}}
400
```

```bash
curl -s -w '%{http_code}\n' -X POST http://localhost:8080/api/v1/calculate -H 'Content-Type: application/json' -d '{"operation":"add","a":1}'
```

```text
{"error":{"code":"MISSING_OPERAND","message":"missing operand"}}
400
```

```bash
curl -s -w '%{http_code}\n' -X POST http://localhost:8080/api/v1/calculate -H 'Content-Type: application/json' -d '{"operation":"divide","a":1,"b":0}'
```

```text
{"error":{"code":"DIVISION_BY_ZERO","message":"cannot divide by zero"}}
422
```

```bash
curl -s -w '%{http_code}\n' -X POST http://localhost:8080/api/v1/calculate -H 'Content-Type: application/json' -d '{"operation":"sqrt","a":-4}'
```

```text
{"error":{"code":"NEGATIVE_SQUARE_ROOT","message":"cannot take the square root of a negative number"}}
422
```

```bash
curl -s -w '%{http_code}\n' -X POST http://localhost:8080/api/v1/calculate -H 'Content-Type: application/json' -d '{"operation":"power","a":10,"b":400}'
```

```text
{"error":{"code":"UNDEFINED_RESULT","message":"the result is infinite or not a number"}}
422
```

## Tests and coverage

Backend:

```bash
cd backend
go test ./... -cover
```

Frontend:

```bash
cd frontend
npm ci
npm test
npm run coverage
```

| Part     | Coverage |
|----------|----------|
| Backend  | 95.9% of statements. The `api` and `calculator` packages are at 100%. `cmd/server` is at 76.9%, because the tests call `newServer` but not `main`. |
| Frontend | 99.24% of statements, 98.29% of branches, 100% of functions, 100% of lines. The frontend test run has 85 tests. |

The saved summaries are [docs/coverage/backend.txt](docs/coverage/backend.txt) and [docs/coverage/frontend.txt](docs/coverage/frontend.txt). The frontend summary lists only the files below 100%.

The HTML reports are not committed. To make them:

```bash
cd backend
go test ./... -coverprofile coverage.out
go tool cover -html coverage.out
```

```bash
cd frontend
npx vitest run --coverage --coverage.reporter html
```

The first opens the backend report in the browser. The second writes the frontend report to `frontend/coverage/index.html`.

## Project structure

```text
.
├── backend/                  Go service, standard library only
│   ├── cmd/server/           main: the HTTP server, the route and the static files
│   └── internal/
│       ├── api/              HTTP handler: decodes requests, writes replies and errors
│       └── calculator/       the arithmetic and the operations table, no HTTP
├── frontend/                 React app built with Vite
│   └── src/
│       ├── api/              the one call to the backend
│       ├── calculator/       the key reducer, the typed number and the display text
│       ├── components/       the calculator, its display and its keypad
│       └── test/             helpers and setup for the tests
├── docs/coverage/            saved coverage summaries
└── Dockerfile                one image for the frontend and the backend
```

## Design decisions

- **One endpoint and one table of operations.** The backend has one route, `POST /api/v1/calculate`, and one map in `backend/internal/calculator/operations.go` that lists every operation. Adding an operation is one entry in that map, with no new route or handler.
- **Standard library only in the backend.** `net/http` routes by method and path, and `encoding/json` reads and writes the bodies. A framework would add a dependency without adding anything this service needs.
- **The arithmetic package knows nothing about HTTP.** `internal/calculator` takes numbers and returns a number or an error. `internal/api` turns that into JSON and status codes. Each part is tested on its own.
- **400 for a malformed request, 422 for maths with no answer.** A 400 means the client sent something wrong and should fix the request. A 422 means the request was fine but the maths has no answer, like division by zero. The frontend shows the message either way.
- **`float64`, exact in the API and rounded only for display.** The API returns the full `float64` value, so `0.1 + 0.2` returns `0.30000000000000004`. The frontend rounds to 12 significant digits only on screen and keeps the exact value for the next calculation. A calculator for money would use integer minor units, such as cents, or a decimal type instead.
- **The frontend never calculates.** It only builds requests and shows answers. The rules, such as what a percentage means or when a result is undefined, live only in the backend, so there is one place to change them.
- **Key presses go through one pure reducer.** Every key and every backend reply is an action for `calculatorReducer` in `frontend/src/calculator/reducer.ts`. The logic is tested by calling that function, without a browser.
- **One Docker image and one origin.** The Go server serves the built frontend and the API on the same port. The browser never makes a cross-origin request, so the backend needs no CORS headers. In local development the Vite proxy gives the same single origin.

## Assumptions

- `percentage` means "a percent of b". `15 % of 200` is 30.
- `sqrt` uses only `a`. The API ignores `b` for it, and the frontend does not send it.
- The calculator does one operation at a time. After `2 + 3`, you press `=` before the next operator. An operator pressed after a result continues from that result.
- The screen shows at most 12 significant digits. Very large and very small numbers use exponent form, such as `1e+12`.

## Left out on purpose

- Authentication
- Rate limiting
- Request logging
- Graceful shutdown
- Calculation history
- CI

The assignment asked for clarity over extra features.

## How AI was used

This project was built with Claude Code. The work was planned first, then built in three pull requests: the backend, the frontend, and the Docker image with this README. Each pull request went through a critic review, and the prompts are shared with the submission.
