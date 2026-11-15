# Prompts and AI workflow for the calculator assignment

Furkan Reha Tutas

I built this project with Claude Code. This document first explains how I
worked with it, and then gives the three prompts that drove the build.

## How I worked

I didn't change my routine for this assignment. It's the same flow I use at
work every day.

1. **I plan first.** One session with Claude Fable 5.2, and no code in it. We
   went back and forth on the structure and the architecture until every
   decision was written down. The three build prompts came out of that
   session.
2. **I build in small pull requests.** There are three here. The first is the
   backend, the second is the frontend, and the third is Docker and the
   documentation. Each one ran in its own Claude Opus 5.5 session and started
   from a single prompt.
3. **Every pull request gets an independent review.** I use `pr-critic` for
   this. It's a review skill I built myself, and my company uses it as well. A
   fresh Claude session reads the diff without the author's context, scores it
   out of ten, and lists what to fix by file and line. The build session fixes those points and the
   critic checks again. I set the bar at 10 out of 10 for this project. Each
   review is visible on its pull request. The critic keeps one comment there
   and updates it every round, so the points it raised earlier sit under
   "Resolved", each with the commit that fixed it.
4. **I merge by hand.** I read every diff myself before it goes into `main`.
5. **I finish with an audit.** A fresh session cloned the public repository
   into an empty folder and checked it against the assignment line by line. It
   ran every command in the README, both test suites and the Docker image.
   Nothing was missing. It found two small points, and they went into a
   fourth pull request with the same review.

| step            | model                          | pull request |
| --------------- | ------------------------------ | ------------ |
| Planning        | Claude Fable 5.2               | none         |
| Backend         | Claude Opus 5.5, high effort   | [#1](https://github.com/specialone0007/fullstack-calculator/pull/1) |
| Frontend        | Claude Opus 5.5, high effort   | [#2](https://github.com/specialone0007/fullstack-calculator/pull/2) |
| Docker and docs | Claude Opus 5.5, medium effort | [#3](https://github.com/specialone0007/fullstack-calculator/pull/3) |
| Final audit     | Claude Opus 5.5, high effort   | none         |
| Audit fixes     | Claude Opus 5.5, medium effort | [#4](https://github.com/specialone0007/fullstack-calculator/pull/4) |

## Planning

Nothing was built before the plan was finished, and the plan didn't come from
one prompt. I started from the assignment text and from the way I work every
day. From there we went back and forth over the structure and the
architecture until every decision was settled.

First, the workflow. A branch for each change, a pull request into `main`, a
critic review, and then a merge by hand.

Second, the architecture. The backend has one endpoint and one table of
operations, so adding an operation means adding one entry. There is one rule
behind the status codes, where 400 means the request is malformed and 422
means the maths has no answer. The frontend never calculates, so the rules
live only in the backend. One Docker image serves both sides.

Third, the scope. I wanted everything the assignment describes, including the
optional parts, and nothing more. A health endpoint and a CI pipeline came up
during planning. However, the assignment doesn't ask for them, so I dropped
both.

Finally, the quality bar. Clean, simple code that I can review line by line
before I merge, and a critic score of 10 out of 10 on every pull request. We
also decided which model and effort level each step uses, and the table above
shows the result.

Before the build started, I had a separate Claude session review the three
prompts, twice. It checked them against the assignment and against how Go,
React and Docker really behave. That review was worth it. It found more than
ten key sequences on the calculator that the first draft left open, and two
rules that worked against Go's standard library. All of that was fixed in the
prompts before any code existed.

## How I write a prompt

I write a prompt the way I'd write a task for a teammate who is new to the
project. Therefore the three prompts below share the same parts.

- The contract comes first. The request, the response, every error code and
  its status are fixed in the prompt, so the model doesn't make design
  decisions on its own.
- The scope has a fence. The assignment asks for clarity over extra features,
  and a model keeps adding things unless the prompt says where to stop.
- It ends with "Done when". This is a list of checks the session has to run
  and show me, so I don't have to take "it works" on trust.
- It says how the work lands. That means the branch name, the commit style, a
  pull request body with the real command output, the critic review, and no
  merge without me.

Under each prompt heading, the line in italics is my note. Everything after it
is the prompt.

---

## Prompt 1: backend API

_This one builds the Go service and its tests. The whole API contract is in
the prompt, so the build session had nothing to guess._

Build the backend of a calculator application in Go.

This is a take-home assignment. Write clean, simple code. I review every line
before I merge, so when clever and plain disagree, choose plain.

### Scope

- Work only in `backend/`. The React frontend comes in the next pull request.
- Build what is listed here and nothing more. No extra endpoints, no extra
  operations, no logging middleware, no CORS, no CI.

### What to build

A REST service that uses only the Go standard library (`net/http` with method
patterns such as `"POST /api/v1/calculate"`, and `encoding/json`). No
third-party modules.

- Module path: `github.com/specialone0007/fullstack-calculator/backend`
- Use the Go version installed on this machine and pin it in `go.mod`. If `go`
  is not on the PATH, stop and tell me.

Layout:

- `cmd/server/main.go`: wiring only. Read `PORT` (default `8080`), register the
  routes, start an `http.Server` with read and write timeouts.
- `internal/calculator/`: the arithmetic. It knows nothing about HTTP or JSON.
- `internal/api/`: the HTTP handlers. It contains no arithmetic.

### API contract

#### `POST /api/v1/calculate`

Request:

```json
{ "operation": "divide", "a": 10, "b": 2 }
```

Success, status 200:

```json
{ "result": 5 }
```

Failure:

```json
{ "error": { "code": "DIVISION_BY_ZERO", "message": "cannot divide by zero" } }
```

Operations:

| operation    | result                           | needs `b`          |
| ------------ | -------------------------------- | ------------------ |
| `add`        | a + b                            | yes                |
| `subtract`   | a - b                            | yes                |
| `multiply`   | a * b                            | yes                |
| `divide`     | a / b                            | yes                |
| `power`      | a raised to the power b          | yes                |
| `percentage` | a percent of b, so (a / 100) * b | yes                |
| `sqrt`       | square root of a                 | no, `b` is ignored |

Errors:

| status | code                   | when                                                                   |
| ------ | ---------------------- | ---------------------------------------------------------------------- |
| 400    | `INVALID_REQUEST`      | the body is not one JSON object, has unknown fields or wrong types, has anything after the object, or is larger than 1024 bytes |
| 400    | `UNKNOWN_OPERATION`    | `operation` is missing or not in the table above                       |
| 400    | `MISSING_OPERAND`      | `a` is missing, or `b` is missing for an operation that needs it       |
| 422    | `DIVISION_BY_ZERO`     | `divide` with b = 0                                                    |
| 422    | `NEGATIVE_SQUARE_ROOT` | `sqrt` with a < 0                                                      |
| 422    | `UNDEFINED_RESULT`     | the result is infinite or not a number, for example a `power` overflow |

The rule behind the status codes: 400 means the request is malformed or
incomplete. 422 means the request is well formed but the maths has no answer.

More rules:

- Checks run in this order, and the first failure is returned: the body
  decodes (`INVALID_REQUEST`), the operation is known (`UNKNOWN_OPERATION`),
  the operands are present (`MISSING_OPERAND`), then the maths.
- A missing operand is not the same as 0. `{"operation":"add","a":1}` is
  `MISSING_OPERAND`, and `{"operation":"add","a":1,"b":0}` is 1.
- An operand sent as `null` counts as missing.
- Field names match case-insensitively, as `encoding/json` does. Do not add
  code to change that.
- Numbers are `float64`. Return the exact `float64` result. Rounding for
  display is the frontend's job.
- The calculator never returns `-0`; it returns `0`. Without this,
  `encoding/json` writes `-0`.
- Every reply from the calculate handler is JSON with
  `Content-Type: application/json`.
- The mapping from a calculator error to a status and a code lives in one
  place.
- Adding a new operation should mean adding one entry in one place in
  `internal/calculator`, with no change to the handler.
- For a wrong method or an unknown path, the standard library's default
  plain-text reply is fine. Do not add code for it.

### Clean code rules

- Small functions that do one job, with early returns. No deep nesting.
- No goroutines, channels, generics or reflection. Nothing here needs them.
- No interface unless there are two real implementations of it.
- Names say what the thing is. Use Go's usual short names where they are the
  convention (`w`, `r`, `err`, `t`, `tc`, one-letter receivers) and `a` and
  `b` for the operands. Everything else gets a full name.
- Every exported name has a doc comment. Other comments explain why, never
  what the line already says.
- Keep each file short enough to read in one sitting, about 150 lines at most.
- `gofmt -l .` prints nothing and `go vet ./...` is clean.

### Tests

- `internal/calculator`: table-driven tests. Each case has a name that reads
  like a sentence. Cover every operation, every error, and the edge values:
  negatives, decimals, zero, very large numbers, `-0`.
- `internal/api`: tests with `net/http/httptest`. One success per operation,
  and every row of the error table.
- Target: 100% statement coverage of `internal/calculator` and at least 90% of
  `internal/api`. `main.go` is not tested.

### Workflow

1. `main` already holds one commit (a stub `README.md` and a `.gitignore`) and
   is pushed to `github.com/specialone0007/fullstack-calculator`. Create the
   branch `feat/backend-api` from it.
2. Commit in a few logical commits with `type(scope): subject` messages.
3. Push and open a pull request into `main`. The body has three headings:
   What this does, Why, Verification. Verification shows each command and what
   it printed.
4. Run the `pr-critic` skill on the pull request with `gate 10 rounds 5`. Fix
   what it finds and push once.
5. Do not merge. I read the diff and merge it myself.

### Done when

- `go run ./cmd/server` starts the service, and a `curl` for each operation and
  each error row returns exactly what the tables say.
- `go test ./... -cover` passes with the coverage targets met.
- The pull request is open, `pr-critic` has passed it at 10 out of 10, and it
  waits for my review. If the critic loop ends below 10, stop and tell me what
  is still open.

---

## Prompt 2: frontend UI

_This one builds the React app. Most of it describes the keypad key by key,
because that is where two engineers would otherwise build two different
calculators._

Build the React frontend for the calculator.

The backend from the previous pull request is merged. Read
`backend/internal/api` and `backend/internal/calculator` first: they are the
API contract. Do not change anything in `backend/`.

This is a take-home assignment. Write clean, simple code. I review every line
before I merge, so when clever and plain disagree, choose plain.

### Scope

- Work only in `frontend/`.
- Build what is listed here and nothing more. No history, no memory keys, no
  themes, no dark mode, no CI.

### What to build

React with TypeScript in strict mode, built with Vite. Plain CSS. No UI kit,
no state library, no HTTP library, no router. Remove everything the Vite
template adds that the app does not use.

Pin Node to the Active LTS major. Check the Node.js release schedule for it,
and do not rely on memory. If the Node on this machine is not that major, stop
and tell me before installing anything. Put that major in `frontend/.nvmrc`
(for example `26`) and in `frontend/package.json` as
`"engines": { "node": ">=26" }` with that major.

#### Behaviour

- A keypad calculator. Keys: digits 0 to 9, decimal point, sign toggle,
  backspace, clear, the operators `+`, `-`, `×`, `÷`, `xʸ` and `% of`, the
  square root key, and `=`.
- One operation at a time: first number, operator, second number, `=`.
- Digits append to the number being typed. A leading `0` is replaced, also
  after a `-`, so `0 5` shows `5` and `-0 5` shows `-5`. A decimal point on an
  empty number starts `0.`.
- Sign toggle adds or removes a leading `-` on the number being typed. On an
  empty number or on a result, it does nothing.
- Backspace removes the last character of the number being typed. When only
  `-` is left, the number is empty again. Backspace does nothing to an
  operator or a result.
- Operator keys are enabled when there is a first number and no second number
  has been typed. Pressing another operator before the second number replaces
  the operator. Once the second number has at least one digit, operator keys
  are disabled until `=` or clear.
- `=` is enabled only when there is a first number, an operator and a second
  number. After a result it is disabled.
- The square root key is enabled when there is a first number and no
  operator, or right after a result. It sends the request at once, and its
  answer counts as a result. Right after a result it uses the exact value the
  backend returned.
- `% of` reads left to right: `15 % of 200 =` shows 30.
- After a result, an operator key continues from the exact value the backend
  returned, not from the rounded display. A digit or a decimal point starts a
  new calculation.
- When a request fails, the calculation stays as it was before the key that
  sent it, so pressing that key again (`=` or the square root key) retries.
  The message clears on the next key press, and that key then works as usual.
- Clear resets everything, including an error message. Like every other key,
  it is disabled while a request is in flight.
- The frontend never calculates. Every operation is one
  `POST /api/v1/calculate`.
- Keyboard: digits, `.`, `+`, `-`, `*`, `/`, `^`, `%`, Enter for `=`,
  Backspace, Escape for clear. A key whose button is disabled does nothing.
  The keyboard listener calls `preventDefault()` for every key it handles, so
  Enter on a focused button does not also press that button, and `/` does not
  open the browser's find bar.

#### Validation and errors

- The keypad cannot produce an invalid number: one decimal point, at most 15
  digits.
- All keys are disabled while a request is in flight.
- Do not check division by zero or negative square roots in the browser. Send
  them and show the `message` from the backend. The backend is the only place
  that knows the rules.
- If the service cannot be reached or the reply is not the expected JSON, show
  "Cannot reach the calculator service. Please try again."
- An error appears in the display with `role="alert"`.

#### Display

- A small top line shows the expression being built, for example `10 ÷ 2`.
  After a result it shows the full expression with `=`, for example
  `10 ÷ 2 =` or `√ 9 =`.
- The main line shows the number being typed. When that number is empty, it
  shows the first number if there is one, otherwise `0`. After a result it
  shows the result.
- Show results with at most 12 significant digits, so 0.1 + 0.2 shows 0.3.
  A result of 1e12 or more, or a non-zero result smaller than 1e-6, shows in
  exponent form with at most 12 significant digits, for example
  `1.23456789012e+15`. The sign does not change this rule.
- Long numbers must not break the layout.

#### Responsive design

- One card, centred, about 360px wide at most. On a phone it fills the width.
- Keys are at least 44px tall. The layout works at 320px width.
- Every key is a real `<button>` with an accessible name.

#### Structure

- `src/api/calculate.ts`: the only file that calls `fetch`. It returns the
  result, or throws one error type that carries the backend's `code` and
  `message`.
- `src/calculator/reducer.ts`: a pure function that turns the current state
  and an action (a key press, an answer, a failure) into the next state. No
  `fetch`, no React.
- `src/calculator/format.ts`: turns a result into display text.
- `src/components/`: `Calculator.tsx` holds the state and makes the request.
  `Display.tsx` and `Keypad.tsx` only render what they are given.
- Vite dev proxy: `/api` goes to `http://localhost:8080`. No CORS anywhere.

### Clean code rules

- Function components. No `any`. No type assertions unless there is no other
  way, and then a comment says why.
- The state type is small enough to read at a glance. Each reducer action has
  a name that says what happened, such as `digitPressed` or `resultReceived`.
- `useEffect` only for the keyboard listener.
- Names say what the thing is. Comments explain why, never what the line
  already says.
- Keep each file short enough to read in one sitting, about 150 lines at most.
- `npm run lint` and `npm run build` are clean.

### Tests

Vitest with React Testing Library.

- `reducer.ts`: every key and every rule in the Behaviour list.
- `format.ts`: integers, decimals, the 0.1 + 0.2 case, very large and very
  small numbers, negatives.
- `calculate.ts`: with `fetch` mocked. A success, a backend error, a network
  failure, a reply that is not JSON.
- `Calculator.tsx`: with `fetch` mocked. Click `1 0 ÷ 2 =` and see 5. Click
  `1 ÷ 0 =` and see the backend's message. Type the same on the keyboard.
  Click a digit, then press Enter, and see that the digit is not typed twice.
- The `test` script is `vitest run`, so it exits when the tests finish.
- `npm run coverage` prints a text summary. Target: at least 90% of lines in
  `src/`. Set `coverage.include` to `src/**` and exclude `main.tsx`, the test
  files and `vite-env.d.ts`, so that a file with no test counts against the
  target.

### Workflow

1. Create the branch `feat/frontend-ui` from `main`.
2. Commit in a few logical commits with `type(scope): subject` messages.
3. Push and open a pull request into `main`. The body has three headings:
   What this does, Why, Verification. Verification shows each command and what
   it printed.
4. Run the `pr-critic` skill on the pull request with `gate 10 rounds 5`. Fix
   what it finds and push once. The critic does not edit package scripts or
   lock files. If it leaves such an item open, fix it yourself as the author
   and run the critic again.
5. Do not merge. I read the diff and merge it myself.

### Done when

- With the backend running on port 8080, `npm run dev` gives a working
  calculator. You have tried every operation, one backend error, and the
  service being stopped, in a real browser at desktop width and at 320px.
- `npm test`, `npm run coverage`, `npm run lint` and `npm run build` pass with
  the coverage target met.
- The pull request is open, `pr-critic` has passed it at 10 out of 10, and it
  waits for my review. If the critic loop ends below 10, stop and tell me what
  is still open.

---

## Prompt 3: Docker image and documentation

_This one finishes the project with one Docker image, the coverage report and
the README. It asks for real command output in the README, so nothing there
is written from memory._

Finish the calculator project: one Docker image that runs the frontend and the
backend together, the coverage report, and the README.

The backend and the frontend are merged. Read both before you write anything.
The README must describe the code as it is, not as the earlier prompts asked
for it.

Build what is listed here and nothing more.

### 1. Serve the frontend from the Go server

- When the environment variable `STATIC_DIR` is set, the server also serves
  the files in that directory at `/`. `POST /api/v1/calculate` works exactly
  as before.
- A request that matches no API route now goes to the file server. That is
  fine. The README documents only the route and the errors in the API
  contract.
- When `STATIC_DIR` is not set, nothing changes.
- Keep it as plain as the rest of the backend, and add a handler test for it.

### 2. Dockerfile

One multi-stage `Dockerfile` at the repository root:

1. A Node stage builds `frontend/`.
2. A Go stage builds a static binary from `backend/`.
3. A small final image holds the binary and the built frontend, runs as a
   non-root user, sets `STATIC_DIR`, and exposes port 8080.

Pin Go to the version in `backend/go.mod` and Node to the major in
`frontend/.nvmrc`, with exact image tags. Add a `.dockerignore`.

A reviewer runs two commands and opens one address:

```bash
docker build -t fullstack-calculator .
docker run --rm -p 8080:8080 fullstack-calculator
```

Then `http://localhost:8080` shows the calculator, and the API answers on the
same port.

### 3. Coverage report

- Save the backend's per-function coverage summary to
  `docs/coverage/backend.txt`.
- Save the frontend's text coverage summary to `docs/coverage/frontend.txt`.
- The HTML reports are generated on demand and are not committed.

### 4. README.md

Sections, in this order:

1. **What this is.** Two or three sentences.
2. **Run with Docker.** The two commands above.
3. **Run locally.** What to install, then how to start the backend and the
   frontend. Put each command on its own line, with no `&&`, so the commands
   run in bash, zsh, cmd and PowerShell.
4. **API.** The endpoint, the operations table, the error table, and one
   `curl` example for each operation and each error code, with the real
   output. Say that the examples are for a POSIX shell. For the size limit,
   describe it and do not show a 1024-byte body.
5. **Tests and coverage.** The commands, a small table with the coverage
   numbers, and links to the two files in `docs/coverage/`.
6. **Project structure.** A short tree with one line per folder.
7. **Design decisions.** Each one with its reason:
   - one endpoint and one table of operations, so a new operation is one entry
   - standard library only in the backend
   - the arithmetic package knows nothing about HTTP
   - 400 for a malformed request, 422 for maths with no answer
   - `float64`, exact in the API and rounded only for display. A calculator for
     money would use integer minor units or a decimal type instead.
   - the frontend never calculates, and the rules live only in the backend
   - key presses go through one pure reducer, so the logic is tested without a
     browser
   - one Docker image and one origin, so there is no CORS
8. **Assumptions.** What `percentage` means, that `sqrt` ignores `b`, one
   operation at a time, 12 significant digits on screen.
9. **Left out on purpose.** Authentication, rate limiting, request logging,
   graceful shutdown, calculation history, CI. One line saying the assignment
   asked for clarity over extra features.
10. **How AI was used.** Three sentences: built with Claude Code, planned
    first, then three pull requests, each with a critic review. The prompts
    are shared with the submission.

Writing style:

- Short, plain sentences. A reader should understand each section on the first
  read.
- No marketing words and no emoji.
- Real numbers and real output. Run every command in the README before you
  write it down, and paste what it printed.
- Describe what the project does. Do not describe what was fixed along the way.

### Workflow

1. Create the branch `feat/docker-and-docs` from `main`.
2. Commit in a few logical commits with `type(scope): subject` messages.
3. Push and open a pull request into `main`. The body has three headings:
   What this does, Why, Verification. Verification shows each command and what
   it printed.
4. Run the `pr-critic` skill on the pull request with `gate 10 rounds 5`. Fix
   what it finds and push once. The critic does not edit a Dockerfile. If it
   leaves such an item open, fix it yourself as the author and run the critic
   again.
5. Do not merge. I read the diff and merge it myself.

### Done when

- A fresh clone of the branch in an empty folder builds and runs with the two
  Docker commands. You have used the calculator in a browser from that
  container: one calculation and one error.
- Every command and every link in the README works as written.
- All backend and frontend tests pass, and the coverage files match the
  numbers in the README.
- The pull request is open, `pr-critic` has passed it at 10 out of 10, and it
  waits for my review. If the critic loop ends below 10, stop and tell me what
  is still open.

---

## Follow-ups

These are the corrections and decisions I gave during each build session, in
short form.

### Backend API

One follow-up. My prompt said `main.go` is not tested, because it only wires the
route into the server. The critic disagreed: a typo in the route would pass
every test. It was right, so I changed my rule and sent this:

> The critic is right about #2. Move the server setup into
> `newServer(port string) *http.Server` and add a small test: a POST to the
> route reaches the calculator, an empty port gives `:8080`, and the timeouts
> are 5 and 10 seconds. Do not test a wrong method or an unknown path. We
> promise nothing about those replies. Then run `pr-critic` again with
> `gate 10 rounds 5`.

### Frontend UI

None. The critic raised three points, all about keys that no test pressed.
The build session added those tests, and no correction from me was needed.

### Docker image and documentation

None. The critic raised two small points in its first round, and the build
session fixed both.

### After the final audit

The audit found two points worth fixing. The first one comes from my own
prompt, which named only Enter for equals. I sent this to a new session:

> Two small fixes from the final audit, in one pull request into main.
>
> 1. The = key on the keyboard does nothing. Only Enter means equals. Add = to
>    the keyboard map in `frontend/src/components/Calculator.tsx` so it presses
>    Equals, and add one test next to the Enter test.
> 2. On a Windows clone with Git's default line-ending setting, `gofmt -l .`
>    lists every Go file. Add a `.gitattributes` file at the root with:
>    `* text=auto eol=lf`
>
> The frontend test count goes from 85 to 86. Update that number in the README
> and regenerate `docs/coverage/frontend.txt`. Change nothing else.
>
> Workflow as before: branch `fix/equals-key-and-line-endings`, a pull request,
> `pr-critic` with `gate 10 rounds 5`, then stop for my merge.

## Conclusion

As a conclusion, the project was built in three pull requests and finished
with a fourth small one after the audit. All four were merged at a critic
score of 10 out of 10. The critic raised seven points on the way. The most
important one was a rounding error in percentage, where 29 percent of 100
returned 28.999999999999996. Four of the others were about tests that were
missing or too weak. The last two were a wrong reply to a GET request on the
API path and a setting that the README didn't name.

The backend is at 95.9% statement coverage, with 100% on the two packages
that hold the logic. The frontend has 86 tests and 100% line coverage. The
final audit ran everything from a fresh clone and found every line of the
assignment covered.

The repository is at <https://github.com/specialone0007/fullstack-calculator>,
and each review is on its pull request.
