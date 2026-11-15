// Command server runs the calculator HTTP service.
package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/specialone0007/fullstack-calculator/backend/internal/api"
)

func main() {
	server := newServer(os.Getenv("PORT"))

	log.Printf("calculator listening on %s", server.Addr)
	log.Fatal(server.ListenAndServe())
}

// newServer returns the calculator's HTTP server. It listens on port, or on
// 8080 when port is empty.
func newServer(port string) *http.Server {
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/v1/calculate", api.HandleCalculate)

	return &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}
}
