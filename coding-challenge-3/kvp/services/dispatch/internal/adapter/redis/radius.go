package redis

import (
	"context"
	"errors"
	"strconv"
	"sync"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

// RadiusKey holds the live max pickup distance in metres. Change it with
// `redis-cli SET config:match_radius_m 3000` (no restart needed).
const RadiusKey = "config:match_radius_m"

// RadiusConfig serves the match radius from Redis. The env value (Default)
// seeds the key on first use; reads refresh its TTL (GETEX), so it only
// expires if the service is idle for the whole TTL, after which Default is
// re-seeded. A short in-process cache keeps the hot path off the network.
type RadiusConfig struct {
	R        *goredis.Client
	Default  float64
	TTL      time.Duration
	CacheFor time.Duration

	mu      sync.Mutex
	val     float64
	fetched time.Time
}

// Radius implements usecase.RadiusProvider.
func (c *RadiusConfig) Radius(ctx context.Context) (float64, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.val > 0 && time.Since(c.fetched) < c.CacheFor {
		return c.val, nil
	}
	s, err := c.R.GetEx(ctx, RadiusKey, c.TTL).Result()
	if errors.Is(err, goredis.Nil) {
		if err = c.R.SetNX(ctx, RadiusKey, strconv.FormatFloat(c.Default, 'f', -1, 64), c.TTL).Err(); err != nil {
			return c.fallback(err)
		}
		c.val, c.fetched = c.Default, time.Now()
		return c.val, nil
	}
	if err != nil {
		return c.fallback(err)
	}
	v, err := strconv.ParseFloat(s, 64)
	if err != nil || v <= 0 {
		return c.Default, nil // bad operator input: ignore it, keep matching
	}
	c.val, c.fetched = v, time.Now()
	return v, nil
}

// fallback serves the last known value (or Default) when Redis is unreachable.
func (c *RadiusConfig) fallback(err error) (float64, error) {
	if c.val > 0 {
		return c.val, nil
	}
	return c.Default, err
}
