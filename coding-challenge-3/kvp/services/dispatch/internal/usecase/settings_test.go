package usecase

import (
	"context"
	"errors"
	"testing"
	"time"

	"ridehail/services/dispatch/internal/domain"
)

type fakeSettingsStore struct {
	s     domain.Settings
	found bool
	err   error
	loads int
}

func (f *fakeSettingsStore) Load(context.Context) (domain.Settings, bool, error) {
	f.loads++
	return f.s, f.found, f.err
}
func (f *fakeSettingsStore) Save(_ context.Context, s domain.Settings) error {
	if f.err != nil {
		return f.err
	}
	f.s, f.found = s, true
	return nil
}

func TestLiveSettingsCachesReads(t *testing.T) {
	store := &fakeSettingsStore{}
	live := &LiveSettings{Store: store, Defaults: domain.DefaultSettings(), TTL: time.Hour}
	ctx := context.Background()
	if err := live.Seed(ctx); err != nil {
		t.Fatal(err)
	}
	for range 100 {
		live.Current(ctx)
	}
	if store.loads != 0 {
		t.Fatalf("matching must not hit Redis on every ride: %d loads", store.loads)
	}
}

func TestLiveSettingsFallBackToDefaultsWhenRedisFails(t *testing.T) {
	store := &fakeSettingsStore{err: errors.New("connection refused")}
	live := &LiveSettings{Store: store, Defaults: domain.Settings{MatchRadiusM: 1200, OfferTimeout: 5 * time.Second}}
	if v := live.View(context.Background()); v.Source != "default" || v.Settings.MatchRadiusM != 1200 {
		t.Fatalf("want defaults, got %+v", v)
	}
}

func TestLiveSettingsUpdateValidatesAndKeepsOtherField(t *testing.T) {
	store := &fakeSettingsStore{}
	live := &LiveSettings{Store: store, Defaults: domain.DefaultSettings()}
	ctx := context.Background()
	timeout := 45 * time.Second
	got, err := live.Update(ctx, SettingsPatch{OfferTimeout: &timeout})
	if err != nil || got.OfferTimeout != timeout || got.MatchRadiusM != 2000 {
		t.Fatalf("update: %+v, %v", got, err)
	}
	tooShort := 10 * time.Millisecond
	var invalid *InvalidSettingsError
	if _, err := live.Update(ctx, SettingsPatch{OfferTimeout: &tooShort}); !errors.As(err, &invalid) {
		t.Fatalf("want InvalidSettingsError, got %v", err)
	}
	if store.s.OfferTimeout != timeout {
		t.Fatalf("an invalid update must not be stored: %+v", store.s)
	}
}

func TestOrchestratorUsesLiveSettings(t *testing.T) {
	live := &LiveSettings{Store: &fakeSettingsStore{}, Defaults: domain.Settings{MatchRadiusM: 900, OfferTimeout: 7 * time.Second}}
	o := (&Orchestrator{Live: live}).Init()
	if got := o.settings(context.Background()); got.MatchRadiusM != 900 || got.OfferTimeout != 7*time.Second {
		t.Fatalf("got %+v", got)
	}
	static := (&Orchestrator{}).Init()
	if got := static.settings(context.Background()); got != domain.DefaultSettings() {
		t.Fatalf("without Live: %+v", got)
	}
}
