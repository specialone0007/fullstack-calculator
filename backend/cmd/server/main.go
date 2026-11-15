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
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/v1/calculate", api.HandleCalculate)

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Printf("calculator listening on %s", server.Addr)
	log.Fatal(server.ListenAndServe())
}
