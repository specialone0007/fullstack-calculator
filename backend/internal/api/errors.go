package api

import (
	"encoding/json"
	"net/http"

	"github.com/specialone0007/fullstack-calculator/backend/internal/calculator"
)

// errorReply is the HTTP status and error code sent for one calculator error.
type errorReply struct {
	status int
	code   string
}

// calculatorErrorReplies is the one place that maps a calculator error to an
// HTTP status and an error code.
//
// 400 means the request is malformed or incomplete. 422 means the request is
// well formed but the maths has no answer.
var calculatorErrorReplies = map[error]errorReply{
	calculator.ErrUnknownOperation:   {http.StatusBadRequest, "UNKNOWN_OPERATION"},
	calculator.ErrMissingOperand:     {http.StatusBadRequest, "MISSING_OPERAND"},
	calculator.ErrDivisionByZero:     {http.StatusUnprocessableEntity, "DIVISION_BY_ZERO"},
	calculator.ErrNegativeSquareRoot: {http.StatusUnprocessableEntity, "NEGATIVE_SQUARE_ROOT"},
	calculator.ErrUndefinedResult:    {http.StatusUnprocessableEntity, "UNDEFINED_RESULT"},
}

// errorResponse is the body of every error reply.
type errorResponse struct {
	Error errorDetail `json:"error"`
}

// errorDetail is the inner object of an error reply.
type errorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// writeCalculatorError writes the reply for an error from calculator.Calculate.
func writeCalculatorError(w http.ResponseWriter, err error) {
	reply, known := calculatorErrorReplies[err]
	if !known {
		// Only reachable if the calculator gains an error that was not
		// added to the map above.
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "unexpected error")
		return
	}
	writeError(w, reply.status, reply.code, err.Error())
}

// writeError writes an error reply with the given status, code and message.
func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, errorResponse{Error: errorDetail{Code: code, Message: message}})
}

// writeJSON writes body as JSON with the given status.
func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	// The status line is already sent, so if this write fails the client
	// has gone away and there is no one left to tell.
	_ = json.NewEncoder(w).Encode(body)
}
