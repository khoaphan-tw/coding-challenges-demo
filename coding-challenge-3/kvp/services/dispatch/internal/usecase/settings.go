package usecase

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"ridehail/services/dispatch/internal/domain"
)

// LiveSettings serves the dispatch settings (match radius, offer timeout)
// from the SettingsStore (Redis), so an operator can change them without a
// redeploy. Reads go through a short in-process cache: matching does not
// pay a Redis round-trip per ride, and a change is picked up within TTL.
//
// Defaults (from MATCH_RADIUS_M / OFFER_TIMEOUT) are written to the store on
// start (Seed) and used whenever the store is empty, unreadable or holds
// invalid values, so dispatch never stops because of the config.
type LiveSettings struct {
	Store    SettingsStore
	Defaults domain.Settings
	TTL      time.Duration // default 1 s

	mu     sync.Mutex
	cur    domain.Settings
	source string // "redis" or "default"
	at     time.Time
}

// SettingsView is the current value and where it came from.
type SettingsView struct {
	Settings domain.Settings
	Source   string // "redis" or "default"
}

// Seed writes the defaults to the store, replacing what is there: the
// deployment's env values win on start, and runtime changes last until
// the next restart.
func (l *LiveSettings) Seed(ctx context.Context) error {
	if err := l.Store.Save(ctx, l.Defaults); err != nil {
		return err
	}
	l.set(l.Defaults, "redis")
	slog.InfoContext(ctx, "dispatch settings seeded",
		"match_radius_m", l.Defaults.MatchRadiusM, "offer_timeout", l.Defaults.OfferTimeout.String())
	return nil
}

// Current returns the live settings (cached for TTL).
func (l *LiveSettings) Current(ctx context.Context) domain.Settings { return l.View(ctx).Settings }

// View returns the live settings and their source (cached for TTL).
func (l *LiveSettings) View(ctx context.Context) SettingsView {
	ttl := l.TTL
	if ttl == 0 {
		ttl = time.Second
	}
	l.mu.Lock()
	if !l.at.IsZero() && time.Since(l.at) < ttl {
		v := SettingsView{Settings: l.cur, Source: l.source}
		l.mu.Unlock()
		return v
	}
	l.mu.Unlock()
	return l.refresh(ctx)
}

func (l *LiveSettings) refresh(ctx context.Context) SettingsView {
	s, found, err := l.Store.Load(ctx)
	switch {
	case err != nil:
		slog.WarnContext(ctx, "dispatch settings unreadable, using defaults", "error", err)
		s = l.Defaults
		l.set(s, "default")
		return SettingsView{Settings: s, Source: "default"}
	case !found: // e.g. Redis restarted without persistence: put the defaults back
		s = l.Defaults
		if err := l.Store.Save(ctx, s); err != nil {
			slog.WarnContext(ctx, "dispatch settings missing, re-seed failed", "error", err)
			l.set(s, "default")
			return SettingsView{Settings: s, Source: "default"}
		}
	case s.Validate() != nil:
		slog.WarnContext(ctx, "dispatch settings in Redis are invalid, using defaults",
			"error", s.Validate(), "match_radius_m", s.MatchRadiusM, "offer_timeout", s.OfferTimeout.String())
		s = l.Defaults
		l.set(s, "default")
		return SettingsView{Settings: s, Source: "default"}
	}
	l.set(s, "redis")
	return SettingsView{Settings: s, Source: "redis"}
}

// SettingsPatch changes some settings; nil fields keep their value.
type SettingsPatch struct {
	MatchRadiusM *float64
	OfferTimeout *time.Duration
}

// Update validates and stores a change. The new values apply to rides
// requested after the change (radius) and to offers created after it (timeout).
func (l *LiveSettings) Update(ctx context.Context, p SettingsPatch) (domain.Settings, error) {
	old := l.refresh(ctx).Settings
	next := old
	if p.MatchRadiusM != nil {
		next.MatchRadiusM = *p.MatchRadiusM
	}
	if p.OfferTimeout != nil {
		next.OfferTimeout = *p.OfferTimeout
	}
	if err := next.Validate(); err != nil {
		return old, &InvalidSettingsError{Err: err}
	}
	if err := l.Store.Save(ctx, next); err != nil {
		return old, err
	}
	l.set(next, "redis")
	slog.InfoContext(ctx, "dispatch settings updated",
		"match_radius_m", next.MatchRadiusM, "offer_timeout", next.OfferTimeout.String(),
		"previous_match_radius_m", old.MatchRadiusM, "previous_offer_timeout", old.OfferTimeout.String())
	return next, nil
}

func (l *LiveSettings) set(s domain.Settings, source string) {
	l.mu.Lock()
	l.cur, l.source, l.at = s, source, time.Now()
	l.mu.Unlock()
}

// InvalidSettingsError is returned by Update for out-of-range values.
type InvalidSettingsError struct{ Err error }

func (e *InvalidSettingsError) Error() string { return e.Err.Error() }
func (e *InvalidSettingsError) Unwrap() error { return e.Err }
