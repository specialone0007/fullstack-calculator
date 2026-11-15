package api

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// postCalculate sends body to HandleCalculate and returns the recorded reply.
func postCalculate(body string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", strings.NewReader(body))
	recorder := httptest.NewRecorder()
	HandleCalculate(recorder, request)
	return recorder
}

// checkReply fails the test unless the reply has the given status, a JSON
// content type, and exactly the given body.
func checkReply(t *testing.T, reply *httptest.ResponseRecorder, wantStatus int, wantBody string) {
	t.Helper()
	if reply.Code != wantStatus {
		t.Errorf("status = %d, want %d", reply.Code, wantStatus)
	}
	if contentType := reply.Header().Get("Content-Type"); contentType != "application/json" {
		t.Errorf("Content-Type = %q, want %q", contentType, "application/json")
	}
	if gotBody := strings.TrimSpace(reply.Body.String()); gotBody != wantBody {
		t.Errorf("body = %s, want %s", gotBody, wantBody)
	}
}

func TestHandleCalculateReturnsResult(t *testing.T) {
	testCases := []struct {
		name     string
		body     string
		wantBody string
	}{
		{"add sums a and b", `{"operation":"add","a":2,"b":3}`, `{"result":5}`},
		{"subtract takes b from a", `{"operation":"subtract","a":2,"b":3}`, `{"result":-1}`},
		{"multiply multiplies a and b", `{"operation":"multiply","a":2.5,"b":4}`, `{"result":10}`},
		{"divide divides a by b", `{"operation":"divide","a":10,"b":2}`, `{"result":5}`},
		{"power raises a to b", `{"operation":"power","a":2,"b":8}`, `{"result":256}`},
		{"percentage takes a percent of b", `{"operation":"percentage","a":15,"b":200}`, `{"result":30}`},
		{"sqrt takes the root of a without b", `{"operation":"sqrt","a":9}`, `{"result":3}`},
		{"sqrt ignores b when it is sent", `{"operation":"sqrt","a":9,"b":100}`, `{"result":3}`},
		{"b = 0 is a real operand, not a missing one", `{"operation":"add","a":1,"b":0}`, `{"result":1}`},
		{"the result is the exact float64, not rounded", `{"operation":"add","a":0.1,"b":0.2}`, `{"result":0.30000000000000004}`},
		{"a negative zero result is sent as 0", `{"operation":"multiply","a":-1,"b":0}`, `{"result":0}`},
		{"field names match case-insensitively", `{"OPERATION":"add","A":1,"B":2}`, `{"result":3}`},
		{"whitespace around the object is allowed", " \n{\"operation\":\"add\",\"a\":1,\"b\":2}\n ", `{"result":3}`},
		{"a body of exactly 1024 bytes is accepted", padTo(`{"operation":"add","a":1,"b":2}`, 1024), `{"result":3}`},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			checkReply(t, postCalculate(tc.body), http.StatusOK, tc.wantBody)
		})
	}
}

func TestHandleCalculateReturnsError(t *testing.T) {
	const (
		invalidRequest     = `{"error":{"code":"INVALID_REQUEST","message":"` + invalidRequestMessage + `"}}`
		unknownOperation   = `{"error":{"code":"UNKNOWN_OPERATION","message":"unknown operation"}}`
		missingOperand     = `{"error":{"code":"MISSING_OPERAND","message":"missing operand"}}`
		divisionByZero     = `{"error":{"code":"DIVISION_BY_ZERO","message":"cannot divide by zero"}}`
		negativeSquareRoot = `{"error":{"code":"NEGATIVE_SQUARE_ROOT","message":"cannot take the square root of a negative number"}}`
		undefinedResult    = `{"error":{"code":"UNDEFINED_RESULT","message":"the result is infinite or not a number"}}`
	)

	testCases := []struct {
		name       string
		body       string
		wantStatus int
		wantBody   string
	}{
		{"an empty body is invalid", ``, 400, invalidRequest},
		{"a body that is not JSON is invalid", `add 1 2`, 400, invalidRequest},
		{"a JSON null is not an object", `null`, 400, invalidRequest},
		{"a JSON array is not an object", `[1,2]`, 400, invalidRequest},
		{"a JSON number is not an object", `42`, 400, invalidRequest},
		{"an unknown field is invalid", `{"operation":"add","a":1,"b":2,"c":3}`, 400, invalidRequest},
		{"an operand of the wrong type is invalid", `{"operation":"add","a":"1","b":2}`, 400, invalidRequest},
		{"an operation of the wrong type is invalid", `{"operation":1,"a":1,"b":2}`, 400, invalidRequest},
		{"a number too large for float64 is invalid", `{"operation":"add","a":1e400,"b":2}`, 400, invalidRequest},
		{"a second object after the first is invalid", `{"operation":"add","a":1,"b":2}{}`, 400, invalidRequest},
		{"text after the object is invalid", `{"operation":"add","a":1,"b":2} extra`, 400, invalidRequest},
		{"a body of 1025 bytes is too large", padTo(`{"operation":"add","a":1,"b":2}`, 1025), 400, invalidRequest},
		{"an invalid body is reported before an unknown operation", `{"operation":"modulo","c":1}`, 400, invalidRequest},
		{"a missing operation is unknown", `{"a":1,"b":2}`, 400, unknownOperation},
		{"a null operation is unknown", `{"operation":null,"a":1,"b":2}`, 400, unknownOperation},
		{"an operation not in the table is unknown", `{"operation":"modulo","a":1,"b":2}`, 400, unknownOperation},
		{"an unknown operation is reported before missing operands", `{"operation":"modulo"}`, 400, unknownOperation},
		{"a missing a is a missing operand", `{"operation":"add","b":2}`, 400, missingOperand},
		{"a missing b is a missing operand", `{"operation":"add","a":1}`, 400, missingOperand},
		{"a null operand counts as missing", `{"operation":"add","a":1,"b":null}`, 400, missingOperand},
		{"sqrt still needs a", `{"operation":"sqrt"}`, 400, missingOperand},
		{"a missing operand is reported before the maths", `{"operation":"divide","a":1}`, 400, missingOperand},
		{"divide by zero has no answer", `{"operation":"divide","a":10,"b":0}`, 422, divisionByZero},
		{"sqrt of a negative number has no answer", `{"operation":"sqrt","a":-4}`, 422, negativeSquareRoot},
		{"a power that overflows has no answer", `{"operation":"power","a":10,"b":400}`, 422, undefinedResult},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			checkReply(t, postCalculate(tc.body), tc.wantStatus, tc.wantBody)
		})
	}
}

func TestWriteCalculatorErrorFallsBackToInternalError(t *testing.T) {
	recorder := httptest.NewRecorder()
	writeCalculatorError(recorder, errors.New("an error with no entry in the map"))

	checkReply(t, recorder, http.StatusInternalServerError,
		`{"error":{"code":"INTERNAL_ERROR","message":"unexpected error"}}`)
}

// padTo adds trailing spaces to body until it is exactly size bytes long.
func padTo(body string, size int) string {
	return body + strings.Repeat(" ", size-len(body))
}
