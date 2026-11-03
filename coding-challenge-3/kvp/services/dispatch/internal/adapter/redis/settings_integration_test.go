//go:build integration

package redis

import (
	"context"
	"testing"
	"time"

	goredis "github.com/redis/go-redis/v9"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"

	"ridehail/services/dispatch/internal/domain"
	"ridehail/services/dispatch/internal/usecase"
)

// The radius and offer timeout live in a Redis hash: seeded from the env on
// start, changeable through the API or by hand with HSET, and picked up by
// dispatch within the cache TTL.
func TestSettingsLiveInRedisAndCanBeChangedByHand(t *testing.T) {
	ctx := context.Background()
	ctr, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: testcontainers.ContainerRequest{
			Image: "redis:8-alpine", ExposedPorts: []string{"6379/tcp"},
			WaitingFor: wait.ForLog("Ready to accept connections"),
		},
		Started: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	defer testcontainers.TerminateContainer(ctr) //nolint:errcheck
	addr, _ := ctr.PortEndpoint(ctx, "6379/tcp", "")
	rdb := goredis.NewClient(&goredis.Options{Addr: addr})
	live := &usecase.LiveSettings{Store: &SettingsStore{R: rdb}, Defaults: domain.DefaultSettings(), TTL: 50 * time.Millisecond}

	if err := live.Seed(ctx); err != nil {
		t.Fatal(err)
	}
	if m := rdb.HGetAll(ctx, SettingsKey).Val(); m[FieldRadius] != "2000" || m[FieldTimeout] != "30" {
		t.Fatalf("seeded hash: %v", m)
	}

	// Through the use case (what PUT /dispatch/config does).
	r := 1500.0
	if _, err := live.Update(ctx, usecase.SettingsPatch{MatchRadiusM: &r}); err != nil {
		t.Fatal(err)
	}
	if got := live.Current(ctx); got.MatchRadiusM != 1500 || got.OfferTimeout != 30*time.Second {
		t.Fatalf("after update: %+v", got)
	}
	bad := 5.0
	if _, err := live.Update(ctx, usecase.SettingsPatch{MatchRadiusM: &bad}); err == nil {
		t.Fatal("a 5 m radius must be rejected")
	}

	// By hand in Redis: picked up after the TTL.
	rdb.HSet(ctx, SettingsKey, FieldTimeout, "12.5")
	time.Sleep(80 * time.Millisecond)
	if got := live.Current(ctx); got.OfferTimeout != 12500*time.Millisecond {
		t.Fatalf("hand edit not picked up: %+v", got)
	}

	// Garbage by hand: dispatch keeps working on the defaults.
	rdb.HSet(ctx, SettingsKey, FieldRadius, "two km")
	time.Sleep(80 * time.Millisecond)
	if v := live.View(ctx); v.Source != "default" || v.Settings != domain.DefaultSettings() {
		t.Fatalf("invalid value: want defaults, got %+v", v)
	}

	// Redis lost the key (restart without persistence): defaults are written back.
	rdb.Del(ctx, SettingsKey)
	time.Sleep(80 * time.Millisecond)
	if v := live.View(ctx); v.Source != "redis" || v.Settings != domain.DefaultSettings() {
		t.Fatalf("missing key: %+v", v)
	}
	if rdb.Exists(ctx, SettingsKey).Val() != 1 {
		t.Fatal("defaults were not re-seeded")
	}
}
