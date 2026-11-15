package calculator

import (
	"errors"
	"math"
	"testing"
)

// number returns a pointer to value, for operands that are present.
func number(value float64) *float64 {
	return &value
}

func TestCalculateReturnsResult(t *testing.T) {
	testCases := []struct {
		name      string
		operation string
		a, b      *float64
		want      float64
	}{
		{"add sums two whole numbers", "add", number(2), number(3), 5},
		{"add handles negative numbers", "add", number(-2), number(-3), -5},
		{"add returns the exact float64 sum of decimals", "add", number(0.1), number(0.2), 0.30000000000000004},
		{"add treats b = 0 as a real operand", "add", number(1), number(0), 1},
		{"subtract takes b away from a", "subtract", number(10), number(4), 6},
		{"subtract can go below zero", "subtract", number(4), number(10), -6},
		{"subtract of equal numbers is zero", "subtract", number(-3), number(-3), 0},
		{"multiply multiplies two numbers", "multiply", number(6), number(7), 42},
		{"multiply by a negative flips the sign", "multiply", number(6), number(-7), -42},
		{"multiply by zero is zero", "multiply", number(123.45), number(0), 0},
		{"multiply of very large numbers stays finite when it fits", "multiply", number(1e154), number(1e154), 1e308},
		{"divide splits a by b", "divide", number(10), number(2), 5},
		{"divide returns decimals", "divide", number(1), number(4), 0.25},
		{"divide of zero by a number is zero", "divide", number(0), number(5), 0},
		{"power raises a to b", "power", number(2), number(10), 1024},
		{"power with a negative exponent gives a fraction", "power", number(2), number(-2), 0.25},
		{"power with a zero exponent is one", "power", number(0), number(0), 1},
		{"power with a decimal exponent takes a root", "power", number(9), number(0.5), 3},
		{"percentage takes a percent of b", "percentage", number(10), number(200), 20},
		{"percentage handles decimals", "percentage", number(12.5), number(80), 10},
		{"percentage of a negative is negative", "percentage", number(50), number(-8), -4},
		{"percentage of 29 of 100 is exactly 29", "percentage", number(29), number(100), 29},
		{"percentage of 7 of 100 is exactly 7", "percentage", number(7), number(100), 7},
		{"percentage stays finite when a times b alone would overflow", "percentage", number(math.MaxFloat64), number(50), math.MaxFloat64 / 2},
		{"sqrt takes the square root of a", "sqrt", number(16), number(0), 4},
		{"sqrt ignores a missing b", "sqrt", number(2), nil, math.Sqrt2},
		{"sqrt ignores whatever b is", "sqrt", number(9), number(-100), 3},
		{"sqrt of zero is zero", "sqrt", number(0), nil, 0},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := Calculate(tc.operation, tc.a, tc.b)
			if err != nil {
				t.Fatalf("Calculate returned error %v, want %v", err, tc.want)
			}
			if got != tc.want {
				t.Errorf("Calculate = %v, want %v", got, tc.want)
			}
		})
	}
}

func TestCalculateNeverReturnsNegativeZero(t *testing.T) {
	testCases := []struct {
		name      string
		operation string
		a, b      *float64
	}{
		{"add of -0 and -0 is plain zero", "add", number(math.Copysign(0, -1)), number(math.Copysign(0, -1))},
		{"multiply of a negative by zero is plain zero", "multiply", number(-5), number(0)},
		{"divide of zero by a negative is plain zero", "divide", number(0), number(-5)},
		{"percentage of zero of a negative is plain zero", "percentage", number(0), number(-5)},
		{"sqrt of -0 is plain zero", "sqrt", number(math.Copysign(0, -1)), nil},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := Calculate(tc.operation, tc.a, tc.b)
			if err != nil {
				t.Fatalf("Calculate returned error %v, want 0", err)
			}
			if got != 0 || math.Signbit(got) {
				t.Errorf("Calculate = %v (negative sign: %v), want plain 0", got, math.Signbit(got))
			}
		})
	}
}

func TestCalculateReturnsError(t *testing.T) {
	testCases := []struct {
		name      string
		operation string
		a, b      *float64
		want      error
	}{
		{"an empty operation name is unknown", "", number(1), number(2), ErrUnknownOperation},
		{"an operation not in the table is unknown", "modulo", number(1), number(2), ErrUnknownOperation},
		{"operation names are case sensitive", "Add", number(1), number(2), ErrUnknownOperation},
		{"an unknown operation is reported before missing operands", "modulo", nil, nil, ErrUnknownOperation},
		{"a missing a is a missing operand", "add", nil, number(2), ErrMissingOperand},
		{"a missing b is a missing operand when the operation needs b", "add", number(1), nil, ErrMissingOperand},
		{"sqrt still needs a", "sqrt", nil, number(4), ErrMissingOperand},
		{"a missing operand is reported before the maths", "divide", number(1), nil, ErrMissingOperand},
		{"divide by zero has no answer", "divide", number(10), number(0), ErrDivisionByZero},
		{"divide by -0 has no answer", "divide", number(10), number(math.Copysign(0, -1)), ErrDivisionByZero},
		{"divide of zero by zero has no answer", "divide", number(0), number(0), ErrDivisionByZero},
		{"sqrt of a negative number has no real answer", "sqrt", number(-4), nil, ErrNegativeSquareRoot},
		{"sqrt of a tiny negative number has no real answer", "sqrt", number(-1e-300), nil, ErrNegativeSquareRoot},
		{"add that overflows is undefined", "add", number(math.MaxFloat64), number(math.MaxFloat64), ErrUndefinedResult},
		{"subtract that overflows is undefined", "subtract", number(-math.MaxFloat64), number(math.MaxFloat64), ErrUndefinedResult},
		{"multiply that overflows is undefined", "multiply", number(1e200), number(1e200), ErrUndefinedResult},
		{"divide that overflows is undefined", "divide", number(1e300), number(1e-300), ErrUndefinedResult},
		{"power that overflows is undefined", "power", number(10), number(400), ErrUndefinedResult},
		{"power of zero to a negative exponent is undefined", "power", number(0), number(-1), ErrUndefinedResult},
		{"power of a negative number to a fraction is undefined", "power", number(-8), number(0.5), ErrUndefinedResult},
		{"percentage that overflows is undefined", "percentage", number(math.MaxFloat64), number(1000), ErrUndefinedResult},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := Calculate(tc.operation, tc.a, tc.b)
			if !errors.Is(err, tc.want) {
				t.Fatalf("Calculate error = %v, want %v", err, tc.want)
			}
			if got != 0 {
				t.Errorf("Calculate = %v alongside an error, want 0", got)
			}
		})
	}
}
