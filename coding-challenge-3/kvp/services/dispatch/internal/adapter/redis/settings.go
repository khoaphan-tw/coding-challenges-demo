package redis

import (
	"context"
	"fmt"
	"strconv"
	"time"

	goredis "github.com/redis/go-redis/v9"

	"ridehail/services/dispatch/internal/domain"
	"ridehail/services/dispatch/internal/usecase"
)

// SettingsKey is the Redis hash with the live dispatch settings. It can be
// read and changed by hand, e.g.:
//
//	HGETALL config:dispatch
//	HSET config:dispatch match_radius_m 1500 offer_timeout_s 20
const SettingsKey = "config:dispatch"

// Fields of SettingsKey.
const (
	FieldRadius  = "match_radius_m"
	FieldTimeout = "offer_timeout_s"
)

// SettingsStore implements usecase.SettingsStore on a Redis hash.
type SettingsStore struct {
	R *goredis.Client
}

var _ usecase.SettingsStore = (*SettingsStore)(nil)

// Load reads the hash. found=false when it does not exist.
func (s *SettingsStore) Load(ctx context.Context) (domain.Settings, bool, error) {
	m, err := s.R.HGetAll(ctx, SettingsKey).Result()
	if err != nil {
		return domain.Settings{}, false, fmt.Errorf("hgetall %s: %w", SettingsKey, err)
	}
	if len(m) == 0 {
		return domain.Settings{}, false, nil
	}
	radius, err := strconv.ParseFloat(m[FieldRadius], 64)
	if err != nil {
		return domain.Settings{}, true, fmt.Errorf("%s.%s=%q: %w", SettingsKey, FieldRadius, m[FieldRadius], err)
	}
	secs, err := strconv.ParseFloat(m[FieldTimeout], 64)
	if err != nil {
		return domain.Settings{}, true, fmt.Errorf("%s.%s=%q: %w", SettingsKey, FieldTimeout, m[FieldTimeout], err)
	}
	return domain.Settings{MatchRadiusM: radius, OfferTimeout: time.Duration(secs * float64(time.Second))}, true, nil
}

// Save writes both fields in one HSET.
func (s *SettingsStore) Save(ctx context.Context, v domain.Settings) error {
	return s.R.HSet(ctx, SettingsKey,
		FieldRadius, strconv.FormatFloat(v.MatchRadiusM, 'f', -1, 64),
		FieldTimeout, strconv.FormatFloat(v.OfferTimeout.Seconds(), 'f', -1, 64),
	).Err()
}
