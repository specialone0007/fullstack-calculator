// Package calculator does the arithmetic behind the calculator service.
// It knows nothing about HTTP or JSON.
package calculator

import (
	"errors"
	"math"
)

// The errors Calculate can return. Callers compare against them with
// errors.Is or ==.
var (
	// ErrUnknownOperation means the operation name is not in the operations table.
	ErrUnknownOperation = errors.New("unknown operation")

	// ErrMissingOperand means a is missing, or b is missing for an operation that needs it.
	ErrMissingOperand = errors.New("missing operand")

	// ErrDivisionByZero means divide was called with b = 0.
	ErrDivisionByZero = errors.New("cannot divide by zero")

	// ErrNegativeSquareRoot means sqrt was called with a < 0.
	ErrNegativeSquareRoot = errors.New("cannot take the square root of a negative number")

	// ErrUndefinedResult means the result is infinite or not a number.
	ErrUndefinedResult = errors.New("the result is infinite or not a number")
)

// Calculate applies the named operation to a and b.
//
// A nil operand means the caller did not supply it, which is different from 0.
// The checks run in a fixed order: the operation is known, the operands are
// present, then the maths.
func Calculate(operationName string, a, b *float64) (float64, error) {
	op, known := operations[operationName]
	if !known {
		return 0, ErrUnknownOperation
	}

	if a == nil || (op.needsB && b == nil) {
		return 0, ErrMissingOperand
	}

	result, err := op.compute(*a, valueOrZero(b))
	if err != nil {
		return 0, err
	}

	if math.IsInf(result, 0) || math.IsNaN(result) {
		return 0, ErrUndefinedResult
	}

	return withoutNegativeZero(result), nil
}

// valueOrZero returns 0 for an operand that was not supplied. Only operations
// that ignore b ever receive that 0, because Calculate rejects a missing b for
// every operation that needs it.
func valueOrZero(operand *float64) float64 {
	if operand == nil {
		return 0
	}
	return *operand
}

// withoutNegativeZero turns -0 into 0, so that encoding/json never writes "-0".
func withoutNegativeZero(result float64) float64 {
	// -0 == 0 is true in Go, so this branch catches -0 and returns plain 0.
	if result == 0 {
		return 0
	}
	return result
}
