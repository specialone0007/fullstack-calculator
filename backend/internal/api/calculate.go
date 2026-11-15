// Package api holds the HTTP handlers of the calculator service.
// It decodes requests and writes replies; the arithmetic lives in package calculator.
package api

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/specialone0007/fullstack-calculator/backend/internal/calculator"
)

// maxBodyBytes is the largest request body HandleCalculate accepts.
const maxBodyBytes = 1024

// invalidRequestMessage is the message sent with every INVALID_REQUEST reply.
const invalidRequestMessage = "the request body must be one JSON object with the fields operation, a and b, at most 1024 bytes long"

// errInvalidRequest is returned by decodeCalculateRequest for any body it rejects.
var errInvalidRequest = errors.New("invalid request body")

// calculateRequest is the body of POST /api/v1/calculate.
// The operands are pointers so that a missing or null operand stays nil
// instead of becoming 0.
type calculateRequest struct {
	Operation string   `json:"operation"`
	A         *float64 `json:"a"`
	B         *float64 `json:"b"`
}

// calculateResponse is the body of a successful reply.
type calculateResponse struct {
	Result float64 `json:"result"`
}

// HandleCalculate serves POST /api/v1/calculate. It decodes the request,
// asks the calculator for the result and writes it, or the error, as JSON.
func HandleCalculate(w http.ResponseWriter, r *http.Request) {
	request, err := decodeCalculateRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", invalidRequestMessage)
		return
	}

	result, err := calculator.Calculate(request.Operation, request.A, request.B)
	if err != nil {
		writeCalculatorError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, calculateResponse{Result: result})
}

// decodeCalculateRequest reads the body as exactly one JSON object of at most
// maxBodyBytes, with no unknown fields and nothing after it.
func decodeCalculateRequest(w http.ResponseWriter, r *http.Request) (calculateRequest, error) {
	body := http.MaxBytesReader(w, r.Body, maxBodyBytes)
	decoder := json.NewDecoder(body)
	decoder.DisallowUnknownFields()

	// Decoding into a pointer lets us tell a JSON null apart from an object:
	// null leaves the pointer nil, while an object, even {}, fills it in.
	var request *calculateRequest
	if err := decoder.Decode(&request); err != nil {
		return calculateRequest{}, errInvalidRequest
	}
	if request == nil {
		return calculateRequest{}, errInvalidRequest
	}

	// A second Decode must hit the end of the body. Anything else means
	// there is more data after the object, or the body is too large.
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return calculateRequest{}, errInvalidRequest
	}

	return *request, nil
}
