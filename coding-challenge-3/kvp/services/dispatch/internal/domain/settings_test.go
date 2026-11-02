package domain

import (
	"testing"
	"time"
)

func TestDefaultSettingsAreTheChallengeValues(t *testing.T) {
	s := DefaultSettings()
	if s.MatchRadiusM != 2000 || s.OfferTimeout != 30*time.Second {
		t.Fatalf("defaults: got %+v", s)
	}
	if err := s.Validate(); err != nil {
		t.Fatalf("defaults must be valid: %v", err)
	}
}

func TestSettingsValidation(t *testing.T) {
	cases := []struct {
		name string
		s    Settings
		ok   bool
	}{
		{"smallest", Settings{MatchRadiusM: MinRadiusM, OfferTimeout: MinOfferTimeout}, true},
		{"largest", Settings{MatchRadiusM: MaxRadiusM, OfferTimeout: MaxOfferTimeout}, true},
		{"radius too small", Settings{MatchRadiusM: 2, OfferTimeout: 30 * time.Second}, false},
		{"radius too large", Settings{MatchRadiusM: 60_000, OfferTimeout: 30 * time.Second}, false},
		{"timeout too short", Settings{MatchRadiusM: 2000, OfferTimeout: 500 * time.Millisecond}, false},
		{"timeout too long", Settings{MatchRadiusM: 2000, OfferTimeout: 2 * time.Hour}, false},
	}
	for _, c := range cases {
		if err := c.s.Validate(); (err == nil) != c.ok {
			t.Errorf("%s: ok=%v, err=%v", c.name, c.ok, err)
		}
	}
}
