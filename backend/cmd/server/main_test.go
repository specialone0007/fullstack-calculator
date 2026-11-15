package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestNewServerSendsCalculatePostsToTheCalculator(t *testing.T) {
	body := strings.NewReader(`{"operation":"add","a":1,"b":2}`)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", body)
	recorder := httptest.NewRecorder()

	newServer("", "").Handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
	if gotBody := strings.TrimSpace(recorder.Body.String()); gotBody != `{"result":3}` {
		t.Errorf("body = %s, want %s", gotBody, `{"result":3}`)
	}
}

func TestNewServerListensOnPort(t *testing.T) {
	testCases := []struct {
		name     string
		port     string
		wantAddr string
	}{
		{"an empty port falls back to 8080", "", ":8080"},
		{"a given port is used as is", "9090", ":9090"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if got := newServer(tc.port, "").Addr; got != tc.wantAddr {
				t.Errorf("Addr = %q, want %q", got, tc.wantAddr)
			}
		})
	}
}

func TestNewServerSetsTimeouts(t *testing.T) {
	server := newServer("", "")

	if server.ReadTimeout != 5*time.Second {
		t.Errorf("ReadTimeout = %v, want 5s", server.ReadTimeout)
	}
	if server.WriteTimeout != 10*time.Second {
		t.Errorf("WriteTimeout = %v, want 10s", server.WriteTimeout)
	}
}

func TestNewServerServesStaticDirAtRoot(t *testing.T) {
	staticDir := t.TempDir()
	page := "<!doctype html><title>Calculator</title>"
	if err := os.WriteFile(filepath.Join(staticDir, "index.html"), []byte(page), 0o600); err != nil {
		t.Fatal(err)
	}
	handler := newServer("", staticDir).Handler

	t.Run("GET / returns index.html", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/", nil))

		if recorder.Code != http.StatusOK {
			t.Errorf("status = %d, want %d", recorder.Code, http.StatusOK)
		}
		if gotBody := recorder.Body.String(); gotBody != page {
			t.Errorf("body = %q, want %q", gotBody, page)
		}
	})

	t.Run("POST /api/v1/calculate still reaches the calculator", func(t *testing.T) {
		body := strings.NewReader(`{"operation":"multiply","a":6,"b":7}`)
		recorder := httptest.NewRecorder()
		handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodPost, "/api/v1/calculate", body))

		if recorder.Code != http.StatusOK {
			t.Errorf("status = %d, want %d", recorder.Code, http.StatusOK)
		}
		if gotBody := strings.TrimSpace(recorder.Body.String()); gotBody != `{"result":42}` {
			t.Errorf("body = %s, want %s", gotBody, `{"result":42}`)
		}
	})

	t.Run("GET /api/v1/calculate gets 405, not the file server", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/api/v1/calculate", nil))

		if recorder.Code != http.StatusMethodNotAllowed {
			t.Errorf("status = %d, want %d", recorder.Code, http.StatusMethodNotAllowed)
		}
		if allow := recorder.Header().Get("Allow"); allow != http.MethodPost {
			t.Errorf("Allow = %q, want %q", allow, http.MethodPost)
		}
	})
}

func TestNewServerWithoutStaticDirServesNoFiles(t *testing.T) {
	recorder := httptest.NewRecorder()

	newServer("", "").Handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/", nil))

	if recorder.Code != http.StatusNotFound {
		t.Errorf("status = %d, want %d", recorder.Code, http.StatusNotFound)
	}
}
