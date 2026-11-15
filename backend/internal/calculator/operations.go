package calculator

import "math"

// operation is one entry in the operations table.
type operation struct {
	// needsB is false for operations that use only a, such as sqrt.
	needsB bool

	// compute does the arithmetic. Calculate checks the result for
	// infinity and NaN afterwards, so compute does not need to.
	compute func(a, b float64) (float64, error)
}

// operations is the one place that lists what the calculator can do.
// Adding an operation means adding one entry here.
var operations = map[string]operation{
	"add":        {needsB: true, compute: add},
	"subtract":   {needsB: true, compute: subtract},
	"multiply":   {needsB: true, compute: multiply},
	"divide":     {needsB: true, compute: divide},
	"power":      {needsB: true, compute: power},
	"percentage": {needsB: true, compute: percentage},
	"sqrt":       {needsB: false, compute: squareRoot},
}

func add(a, b float64) (float64, error) {
	return a + b, nil
}

func subtract(a, b float64) (float64, error) {
	return a - b, nil
}

func multiply(a, b float64) (float64, error) {
	return a * b, nil
}

func divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, ErrDivisionByZero
	}
	return a / b, nil
}

func power(a, b float64) (float64, error) {
	return math.Pow(a, b), nil
}

// percentage returns a percent of b.
func percentage(a, b float64) (float64, error) {
	return (a / 100) * b, nil
}

// squareRoot ignores b.
func squareRoot(a, _ float64) (float64, error) {
	if a < 0 {
		return 0, ErrNegativeSquareRoot
	}
	return math.Sqrt(a), nil
}
