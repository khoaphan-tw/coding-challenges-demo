package redis

import (
	"context"
	"errors"
	"strconv"
	"sync"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

// Live-tunable settings. Change with e.g.
//
//	redis-cli SET config:match_radius_m 3000
//	redis-cli SET config:offer_timeout 10s
//
// No restart needed; new values apply within the cache window.
const (
	RadiusKey       = "config:match_radius_m"
	OfferTimeoutKey = "config:offer_timeout"
)

// setting is one Redis-backed value. The env value (def) seeds the key on
// first use; reads refresh its TTL (GETEX), so the key only expires if the
// service is idle for the whole TTL, after which def is re-seeded. A short
// in-process cache keeps the hot path off the network.
type setting[T any] struct {
	r        *goredis.Client
	key      string
	def      T
	ttl      time.Duration
	cacheFor time.Duration
	parse    func(string) (T, bool) // ok=false → invalid operator input
	format   func(T) string

	mu      sync.Mutex
	val     T
	has     bool
	fetched time.Time
}

func (s *setting[T]) get(ctx context.Context) (T, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.has && time.Since(s.fetched) < s.cacheFor {
		return s.val, nil
	}
	raw, err := s.r.GetEx(ctx, s.key, s.ttl).Result()
	if errors.Is(err, goredis.Nil) {
		if err = s.r.SetNX(ctx, s.key, s.format(s.def), s.ttl).Err(); err != nil {
			return s.fallback(err)
		}
		s.val, s.has, s.fetched = s.def, true, time.Now()
		return s.val, nil
	}
	if err != nil {
		return s.fallback(err)
	}
	v, ok := s.parse(raw)
	if !ok {
		return s.def, nil // bad operator input: ignore it, keep dispatching
	}
	s.val, s.has, s.fetched = v, true, time.Now()
	return v, nil
}

// fallback serves the last known value (or the default) when Redis is unreachable.
func (s *setting[T]) fallback(err error) (T, error) {
	if s.has {
		return s.val, nil
	}
	return s.def, err
}

// LiveConfig serves dispatch settings from Redis.
type LiveConfig struct {
	radius  *setting[float64]
	timeout *setting[time.Duration]
}

// NewLiveConfig seeds Redis from the given defaults on first read.
func NewLiveConfig(r *goredis.Client, radiusM float64, offerTimeout, ttl, cacheFor time.Duration) *LiveConfig {
	return &LiveConfig{
		radius: &setting[float64]{r: r, key: RadiusKey, def: radiusM, ttl: ttl, cacheFor: cacheFor,
			parse: func(s string) (float64, bool) {
				v, err := strconv.ParseFloat(s, 64)
				return v, err == nil && v > 0
			},
			format: func(v float64) string { return strconv.FormatFloat(v, 'f', -1, 64) }},
		timeout: &setting[time.Duration]{r: r, key: OfferTimeoutKey, def: offerTimeout, ttl: ttl, cacheFor: cacheFor,
			parse: func(s string) (time.Duration, bool) {
				v, err := time.ParseDuration(s)
				return v, err == nil && v > 0
			},
			format: func(v time.Duration) string { return v.String() }},
	}
}

// Radius implements usecase.RadiusProvider.
func (c *LiveConfig) Radius(ctx context.Context) (float64, error) { return c.radius.get(ctx) }

// OfferTimeout implements usecase.OfferTimeoutProvider.
func (c *LiveConfig) OfferTimeout(ctx context.Context) (time.Duration, error) {
	return c.timeout.get(ctx)
}
