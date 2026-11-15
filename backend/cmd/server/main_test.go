package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestNewServerSendsCalculatePostsToTheCalculator(t *testing.T) {
	body := strings.NewReader(`{"operation":"add","a":1,"b":2}`)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", body)
	recorder := httptest.NewRecorder()

	newServer("").Handler.ServeHTTP(recorder, request)

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
			if got := newServer(tc.port).Addr; got != tc.wantAddr {
				t.Errorf("Addr = %q, want %q", got, tc.wantAddr)
			}
		})
	}
}

func TestNewServerSetsTimeouts(t *testing.T) {
	server := newServer("")

	if server.ReadTimeout != 5*time.Second {
		t.Errorf("ReadTimeout = %v, want 5s", server.ReadTimeout)
	}
	if server.WriteTimeout != 10*time.Second {
		t.Errorf("WriteTimeout = %v, want 10s", server.WriteTimeout)
	}
}
