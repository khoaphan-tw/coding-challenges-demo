package domain

import (
	"fmt"
	"time"
)

// Settings are the dispatch rules an operator can change at runtime:
// the matching radius (AC-04) and the offer response timeout (AC-05).
type Settings struct {
	MatchRadiusM float64
	OfferTimeout time.Duration
}

// Accepted ranges. They keep a typo (e.g. a radius of 2 m or a timeout of
// 30 hours) from silently stopping dispatch.
const (
	MinRadiusM      = 100.0
	MaxRadiusM      = 50_000.0
	MinOfferTimeout = time.Second
	MaxOfferTimeout = time.Hour
)

// DefaultSettings are the values the challenge asks for: 2 km and 30 s.
func DefaultSettings() Settings {
	return Settings{MatchRadiusM: DefaultRadiusM, OfferTimeout: 30 * time.Second}
}

// Validate rejects values outside the accepted ranges.
func (s Settings) Validate() error {
	if s.MatchRadiusM < MinRadiusM || s.MatchRadiusM > MaxRadiusM {
		return fmt.Errorf("matchRadiusM must be between %.0f and %.0f, got %g", MinRadiusM, MaxRadiusM, s.MatchRadiusM)
	}
	if s.OfferTimeout < MinOfferTimeout || s.OfferTimeout > MaxOfferTimeout {
		return fmt.Errorf("offerTimeoutSeconds must be between %.0f and %.0f, got %g",
			MinOfferTimeout.Seconds(), MaxOfferTimeout.Seconds(), s.OfferTimeout.Seconds())
	}
	return nil
}
