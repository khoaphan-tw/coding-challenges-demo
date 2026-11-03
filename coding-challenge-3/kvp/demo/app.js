/* KVP Dispatch Live: a map demo that drives the real Go services through the gateway.
 * Every number on screen comes from the API; the page only draws it. */
(() => {
  'use strict';

  // ---------- config ----------
  const qs = new URLSearchParams(location.search);
  // Served by the gateway at :8080/demo/ → same origin. Opened any other way → call localhost:8080.
  const BASE = qs.get('api') ?? (location.port === '8080' ? '' : 'http://localhost:8080');
  const DRIVER_IDS = Array.from({ length: 20 }, (_, i) => 'D' + String(i + 1).padStart(3, '0'));
  const TERMINAL = new Set(['COMPLETED', 'CANCELLED']);
  const RIDE_FLOW = ['REQUESTED', 'MATCHING', 'DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'COMPLETED'];
  const PLACES = {
    opera: [10.7767, 106.7031],      // Saigon Opera House
    tandinh: [10.7885, 106.6908],    // Tan Dinh Church
    benthanh: [10.7725, 106.6980],   // Ben Thanh Market
    notredame: [10.7798, 106.6990],  // Notre-Dame Cathedral
    bitexco: [10.7716, 106.7044],    // Bitexco Tower
    center: [10.7760, 106.7000],
  };

  // ---------- state ----------
  const S = {
    drivers: new Map(),     // id → driver JSON
    markers: new Map(),     // id → L.marker
    animating: new Set(),   // drivers whose marker the page is moving
    excluded: new Set(),    // excluded for the focused ride(s)
    pendingOffers: new Map(), // driverId → { expiresAt, createdAt }
    focus: [],              // ride ids in the ride card
    rideCache: new Map(),   // rideId → { ride, dispatch, history }
    labels: {},             // rideId → "A" / "B"
    mode: 'idle',
    running: false,
    token: 0,
    stepMode: false,
    nextResolve: null,
    free: { pickup: null, dest: null, layer: null },
    apiCount: 0,
    override: new Map(),  // driverId → status to display (scene pacing; the API is ahead by a few ms)
    rideOverride: {},     // rideId → fields to display
    posOverride: new Map(), // driverId → [lat, lng] to display
    ringOverride: null,   // Map driverId → offer, for the countdown ring
    cfg: { matchRadiusM: 2000, offerTimeoutSeconds: 30, source: 'default', redisKey: 'config:dispatch' }, // GET /dispatch/config
  };

  // ---------- map ----------
  const map = L.map('map', { zoomControl: false, attributionControl: true }).setView(PLACES.center, 15);
  L.control.zoom({ position: 'topleft' }).addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  const sceneLayer = L.layerGroup().addTo(map);
  const driverLayer = L.layerGroup().addTo(map);

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const short = (id) => (id ? id.slice(-6) : '–');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtM = (m) => (m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m');
  const fmtT = (iso) => { const d = new Date(iso); return d.toLocaleTimeString([], { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0'); };

  // ---------- geo ----------
  const R = 6371000, rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  function haversine(a, b) {
    const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function offset([lat, lng], meters, bearing) {
    const d = meters / R, b = rad(bearing), p1 = rad(lat), l1 = rad(lng);
    const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(b));
    const l2 = l1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
    return [+deg(p2).toFixed(6), +deg(l2).toFixed(6)];
  }
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  // ---------- API ----------
  class Abort extends Error {}
  async function api(method, path, body, { headers = {}, quiet = false } = {}) {
    const t0 = performance.now();
    let res;
    try {
      res = await fetch(BASE + path, {
        method,
        headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      if (!quiet) logApi(method, path, { status: 'ERR', ms: performance.now() - t0 });
      setHealth(false);
      throw e;
    }
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    const out = { status: res.status, ok: res.ok, data, replayed: res.headers.get('Idempotent-Replayed') === 'true', ms: performance.now() - t0 };
    if (!quiet) logApi(method, path, out);
    return out;
  }

  function logApi(method, path, r) {
    S.apiCount++;
    $('#apiCount').textContent = S.apiCount;
    const el = document.createElement('div');
    el.className = 'api';
    const cls = r.status === 'ERR' || r.status >= 500 ? 'err' : r.status >= 400 ? 'warn' : 'ok';
    const code = r.data && r.data.code ? ` ${r.data.code}` : '';
    el.innerHTML = `<span class="m">${method}</span><span class="p" title="${esc(path)}">${esc(path.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/g, (m) => '…' + m.slice(-6)))}</span>` +
      `<span class="s ${cls}">${r.status}</span><span class="ms">${Math.round(r.ms)} ms</span>` +
      (r.replayed || code ? `<span class="rp">${r.replayed ? 'Idempotent-Replayed: true' : ''}${esc(code)}</span>` : '');
    const box = $('#tab-api');
    box.prepend(el);
    while (box.children.length > 250) box.lastChild.remove();
  }

  async function fetchDrivers() {
    const rs = await Promise.all(DRIVER_IDS.map((id) => api('GET', `/drivers/${id}`, null, { quiet: true }).catch(() => null)));
    const out = [];
    for (const r of rs) if (r && r.ok) { S.drivers.set(r.data.driverId, r.data); out.push(r.data); }
    return out;
  }
  const getRide = async (id) => (await api('GET', `/rides/${id}`, null, { quiet: true })).data;
  const getDispatch = async (id) => { const r = await api('GET', `/rides/${id}/dispatch`, null, { quiet: true }); return r.ok ? r.data : null; };
  const getHistory = async (id) => { const r = await api('GET', `/rides/${id}/history`, null, { quiet: true }); return r.ok ? r.data : null; };

  // Rides this page created, so a reset can cancel the ones still open (they would steal drivers).
  const TRACK_KEY = 'kvp-demo-rides';
  const tracked = () => { try { return JSON.parse(localStorage.getItem(TRACK_KEY) || '[]'); } catch { return []; } };
  const track = (id) => { try { localStorage.setItem(TRACK_KEY, JSON.stringify([...new Set([...tracked(), id])].slice(-60))); } catch { /* storage unavailable */ } };
  const untrackAll = () => { try { localStorage.removeItem(TRACK_KEY); } catch { /* storage unavailable */ } };

  async function createRide(passengerId, pickup, dest, key) {
    const r = await api('POST', '/rides', {
      passengerId,
      pickup: { latitude: pickup[0], longitude: pickup[1] },
      destination: { latitude: dest[0], longitude: dest[1] },
    }, { headers: { 'Idempotency-Key': key || `demo-${passengerId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` } });
    if (r.ok) track(r.data.rideId);
    return r;
  }

  // ---------- health ----------
  function setHealth(ok) {
    const h = $('#health');
    h.className = 'health ' + (ok ? 'ok' : 'bad');
    h.querySelector('b').textContent = ok ? 'API live · localhost:8080' : 'API down: run make up';
  }
  async function health() {
    try { const r = await fetch(BASE + '/healthz'); setHealth(r.ok); } catch { setHealth(false); }
  }

  // ---------- driver markers ----------
  const CAR = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-6zm2.2-1h9.6l-1-3H8.2l-1 3zM7.5 14a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5zm9 0a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5z"/></svg>';
  function driverIcon(id) {
    return L.divIcon({
      className: 'drv-icon', iconSize: [34, 34], iconAnchor: [17, 17],
      html: `<div class="drv" data-id="${id}"><div class="ring"></div><div class="secs"></div><div class="body">${CAR}</div><div class="x">✕</div><span class="lbl">${id}</span></div>`,
    });
  }
  function ensureMarker(d) {
    let m = S.markers.get(d.driverId);
    if (!m) {
      m = L.marker([d.latitude, d.longitude], { icon: driverIcon(d.driverId), draggable: true, zIndexOffset: 500 }).addTo(driverLayer);
      m.dragging.disable();
      m.on('click', () => openDriverPopup(d.driverId));
      m.on('dragstart', () => S.animating.add(d.driverId));
      m.on('dragend', async () => {
        const p = m.getLatLng();
        await api('PUT', `/drivers/${d.driverId}/location`, { latitude: +p.lat.toFixed(6), longitude: +p.lng.toFixed(6) });
        S.animating.delete(d.driverId);
        toast(`${d.driverId} moved. Matching now uses this location (AC-03).`);
      });
      S.markers.set(d.driverId, m);
    }
    return m;
  }
  function drvEl(id) { const m = S.markers.get(id); return m && m.getElement() ? m.getElement().querySelector('.drv') : null; }
  function renderDriver(d) {
    const m = ensureMarker(d);
    if (!S.animating.has(d.driverId)) {
      const [lat, lng] = S.posOverride.get(d.driverId) || [d.latitude, d.longitude];
      const cur = m.getLatLng();
      if (Math.abs(cur.lat - lat) > 1e-7 || Math.abs(cur.lng - lng) > 1e-7) m.setLatLng([lat, lng]);
    }
    const el = drvEl(d.driverId);
    if (!el) return;
    const st = S.override.get(d.driverId) || d.status;
    for (const s of ['AVAILABLE', 'OFFERED', 'BUSY', 'OFFLINE']) el.classList.toggle('s-' + s, st === s);
    el.classList.toggle('excl', S.excluded.has(d.driverId));
    m.setZIndexOffset(st === 'OFFLINE' ? 0 : st === 'AVAILABLE' ? 500 : 900);
  }
  function flashDriver(id, cls = 'pulse', ms = 600) {
    const el = drvEl(id); if (!el) return;
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    if (ms) setTimeout(() => el.classList.remove(cls), ms);
  }

  // Offer countdown ring (expiresAt comes from the dispatch view).
  setInterval(() => {
    for (const [id, o] of S.ringOverride || S.pendingOffers) {
      const el = drvEl(id); if (!el) continue;
      const total = new Date(o.expiresAt) - new Date(o.createdAt);
      const left = o.frozen ? total : Math.max(0, new Date(o.expiresAt) - Date.now());
      el.style.setProperty('--p', (left / total).toFixed(3));
      el.querySelector('.secs').textContent = Math.ceil(left / 1000) + 's';
    }
  }, 200);

  function openDriverPopup(id) {
    const d = S.drivers.get(id); if (!d) return;
    const m = S.markers.get(id);
    const canToggle = d.status === 'AVAILABLE' || d.status === 'OFFLINE';
    const html = `<div class="popup"><h4>${id} · ${d.status}</h4>
      <div class="meta">v${d.version} · ${d.latitude.toFixed(5)}, ${d.longitude.toFixed(5)}${d.currentRideId ? `<br>ride …${short(d.currentRideId)}` : ''}${S.excluded.has(id) ? '<br><b style="color:var(--excluded)">excluded for this ride</b>' : ''}</div>
      <div class="row">
        ${canToggle ? `<button data-act="toggle">${d.status === 'OFFLINE' ? 'Go online' : 'Go offline'}</button>` : ''}
        ${d.status === 'OFFERED' ? '<button class="acc" data-act="accept">Accept</button><button class="rej" data-act="reject">Reject</button>' : ''}
        ${d.status === 'BUSY' ? '<button data-act="complete">Complete ride</button>' : ''}
        ${!canToggle ? '<button class="ghost" data-act="offline">Try going offline</button>' : ''}
      </div></div>`;
    m.unbindPopup().bindPopup(html, { offset: [0, -10] }).openPopup();
    const root = m.getPopup().getElement();
    root.querySelectorAll('button').forEach((b) => b.addEventListener('click', async () => {
      const act = b.dataset.act;
      if (act === 'toggle') await api('PUT', `/drivers/${id}/availability`, { status: d.status === 'OFFLINE' ? 'AVAILABLE' : 'OFFLINE' });
      if (act === 'offline') {
        const r = await api('PUT', `/drivers/${id}/availability`, { status: 'OFFLINE' });
        if (!r.ok) toast(`${r.status} ${r.data?.code}: an ${d.status} driver cannot go offline (AC-02)`, true);
      }
      if (act === 'accept' || act === 'reject') {
        const r = await api('POST', `/rides/${d.currentRideId}/offers/${id}/${act}`);
        if (!r.ok) toast(`${r.status} ${r.data?.code}`, true);
        focusRides([d.currentRideId]);
      }
      if (act === 'complete') await api('POST', `/rides/${d.currentRideId}/complete`);
      m.closePopup();
      poll();
    }));
  }

  // ---------- polling ----------
  let polling = false;
  async function poll() {
    if (polling) return;
    polling = true;
    try {
      const ds = await fetchDrivers();
      ds.forEach(renderDriver);
      await refreshRides();
    } catch { /* gateway down; health shows it */ } finally { polling = false; }
  }
  setInterval(poll, 650);
  setInterval(health, 5000);

  async function refreshRides() {
    if (!S.focus.length) { S.pendingOffers.clear(); return; }
    const excl = new Set(), pend = new Map();
    for (const id of S.focus) {
      const [ride, dispatch, history] = await Promise.all([getRide(id), getDispatch(id), getHistory(id)]);
      S.rideCache.set(id, { ride, dispatch, history });
      if (dispatch) {
        Object.keys(dispatch.exclusions || {}).forEach((d) => excl.add(d));
        (dispatch.offers || []).filter((o) => o.status === 'PENDING').forEach((o) => pend.set(o.driverId, o));
      }
    }
    S.excluded = excl;
    S.pendingOffers = pend;
    renderRideCard();
    renderStreams();
  }

  function focusRides(ids, labels = {}) {
    S.focus = ids.filter(Boolean);
    S.labels = labels;
    S.rideCache.clear();
    lastStreamKey = '';
    refreshRides();
  }

  // ---------- right panel ----------
  function renderRideCard() {
    const box = $('#rideCard');
    if (!S.focus.length) { box.innerHTML = '<div class="muted">No ride yet. Run a scene.</div>'; return; }
    box.innerHTML = '<div class="multi">' + S.focus.map((id) => {
      const c = S.rideCache.get(id); if (!c || !c.ride) return '';
      const r = { ...c.ride, ...(S.rideOverride[id] || {}) }, lab = S.labels[id] ? `<b style="color:var(--pickup)">${S.labels[id]}</b> ` : '';
      const idx = RIDE_FLOW.indexOf(r.status);
      const pipe = RIDE_FLOW.map((s, i) => `<div class="${s === r.status ? 'now' : i < idx ? 'done' : ''}">${s.replace('DRIVER_', '').slice(0, 9)}</div>`).join('') +
        (r.status === 'CANCELLED' ? '<div class="now cancel">CANCELLED</div>' : '');
      const saga = S.rideOverride[id] ? null : c.dispatch?.saga;
      const pend = S.rideOverride[id] && r.status !== 'DRIVER_ASSIGNED' ? null : (c.dispatch?.offers || []).find((o) => o.status === 'PENDING');
      const left = pend ? Math.max(0, Math.ceil((new Date(pend.expiresAt) - Date.now()) / 1000)) : null;
      const actions = S.mode === 'free' ? `<div class="ride-actions">
          ${['REQUESTED', 'MATCHING', 'DRIVER_ASSIGNED', 'DRIVER_ACCEPTED'].includes(r.status) ? `<button class="ghost" data-ra="cancel" data-id="${id}">Cancel</button>` : ''}
          ${r.status === 'DRIVER_ACCEPTED' ? `<button data-ra="drive" data-id="${id}">Drive trip</button><button class="ghost" data-ra="complete" data-id="${id}">Complete</button>` : ''}
        </div>` : '';
      return `<div>
        <div class="ride-head">${lab}<span class="ride-id" data-copy="${id}" title="Copy ride id">ride …${short(id)}</span><span class="muted" style="font-size:12px">${r.passengerId} · v${r.version}</span></div>
        <div class="pipe">${pipe}</div>
        <div class="ride-meta">driver <b>${r.assignedDriverId || '–'}</b> · saga <b>${saga?.status || '–'}</b> · round <b>${saga?.round ?? '–'}</b>${left !== null ? ` · offer <b style="color:var(--offered)">${left}s</b>` : ''}
          ${Object.keys(c.dispatch?.exclusions || {}).length ? `<br>excluded: <b style="color:var(--excluded)">${Object.entries(c.dispatch.exclusions).map(([d, why]) => `${d} (${why})`).join(', ')}</b>` : ''}</div>
        ${actions}
        <div class="trace">trace <code data-copy="make trace-ride RIDE=${id}" title="Copy: make trace-ride RIDE=…">${(r.traceId || '').slice(0, 16)}…</code> · click to copy <code>make trace-ride</code></div>
      </div>`;
    }).join('<hr style="border:0;border-top:1px solid var(--line);margin:4px 0">') + '</div>';
  }
  $('#rideCard').addEventListener('click', async (e) => {
    const cp = e.target.closest('[data-copy]');
    if (cp) { navigator.clipboard?.writeText(cp.dataset.copy); toast('Copied: ' + cp.dataset.copy); return; }
    const b = e.target.closest('[data-ra]'); if (!b) return;
    const id = b.dataset.id, act = b.dataset.ra;
    if (act === 'cancel') await api('POST', `/rides/${id}/cancel`);
    if (act === 'complete') await api('POST', `/rides/${id}/complete`);
    if (act === 'drive') { b.disabled = true; await driveTrip(id, S.token).catch(() => {}); }
    poll();
  });

  let lastStreamKey = '';
  function renderStreams() {
    const key = S.focus.map((id) => { const c = S.rideCache.get(id); return `${id}:${c?.dispatch?.steps?.length}:${c?.history?.transitions?.length}`; }).join('|');
    if (key === lastStreamKey) return;
    lastStreamKey = key;
    const steps = [], trans = [];
    for (const id of S.focus) {
      const c = S.rideCache.get(id); if (!c) continue;
      const lab = S.labels[id] ? S.labels[id] + ' · ' : '';
      (c.dispatch?.steps || []).forEach((s) => steps.push({ ...s, lab, rideId: id }));
      (c.history?.transitions || []).forEach((t) => trans.push({ ...t, lab, rideId: id }));
    }
    steps.sort((a, b) => b.at.localeCompare(a.at));
    trans.sort((a, b) => b.at.localeCompare(a.at));
    $('#tab-events').innerHTML = steps.map((s) => {
      const lost = /taken by another ride/.test(s.detail || '');
      return `<div class="ev ${lost ? 'race' : ''}"><div class="t">${fmtT(s.at).slice(0, 12)}</div><div>
        <span class="n ${lost ? 'LOST' : esc(s.step)}">${esc(s.lab)}${esc(s.step)}${lost ? ' · LOST RACE' : ''}</span>
        <div class="d">${esc(s.detail)}</div>
        <div class="ids">ride <b>…${short(s.rideId)}</b>${s.driverId ? ` · driver <b>${esc(s.driverId)}</b>` : ''}${s.eventId ? ` · event <b>…${short(s.eventId)}</b>` : ''}</div></div></div>`;
    }).join('') || '<div class="muted">Waiting for the saga…</div>';
    $('#tab-history').innerHTML = trans.map((t) => `<div class="ev"><div class="t">${fmtT(t.at).slice(0, 12)}</div><div>
        <span class="n ${esc(t.to)}">${esc(t.lab)}${esc(t.from || '∅')} → ${esc(t.to)}</span>
        <div class="d">${esc(t.action)}${t.driverId ? ' · ' + esc(t.driverId) : ''}</div>
        <div class="ids">cause <b>${esc((t.cause || '').replace(/(event:)(.*)/, (_, a, b) => a + '…' + b.slice(-6)))}</b></div></div></div>`).join('') || '<div class="muted">No transitions yet.</div>';
  }
  $$('.tab').forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)));
  function showTab(name) {
    $$('.tab').forEach((x) => x.classList.toggle('active', x.dataset.tab === name));
    ['seq', 'events', 'history', 'api'].forEach((n) => { $('#tab-' + n).hidden = n !== name; });
  }

  // ---------- narration ----------
  function say(kicker, title, text) {
    $('#caption').hidden = false;
    $('#capKicker').textContent = kicker;
    $('#capTitle').textContent = title;
    $('#capText').innerHTML = text || '';
    const c = $('#caption'); c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
  }
  function sql(html) { const el = $('#sql'); if (!html) { el.hidden = true; return; } el.innerHTML = html; el.hidden = false; }
  let toastTimer;
  function toast(msg, err) {
    document.querySelector('.toast')?.remove();
    const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg;
    document.body.append(t); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.remove(), 3200);
  }

  function check(tok) { if (tok !== S.token) throw new Abort(); }
  async function beat(tok, ms) {
    check(tok);
    if (S.stepMode) {
      $('#nextBtn').hidden = false;
      await new Promise((r) => { S.nextResolve = r; });
      $('#nextBtn').hidden = true;
    } else await sleep(ms);
    check(tok);
  }
  $('#nextBtn').addEventListener('click', () => S.nextResolve?.());
  document.addEventListener('keydown', (e) => {
    if (H.active && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      const k = { Space: () => (H.playing ? happyPause() : happyPlay()), ArrowRight: () => { happyPause(); happyNext(); }, ArrowLeft: happyPrev, Escape: () => happyStop() }[e.code];
      if (k) { e.preventDefault(); k(); return; }
    }
    if ((e.code === 'Space' || e.code === 'ArrowRight') && S.nextResolve && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault(); const r = S.nextResolve; S.nextResolve = null; r();
    }
  });
  async function waitFor(tok, fn, timeout = 12000, every = 250) {
    const end = Date.now() + timeout;
    while (Date.now() < end) { check(tok); const v = await fn(); if (v) return v; await sleep(every); }
    throw new Error('timed out waiting for the saga');
  }

  // ---------- drawing helpers ----------
  function pin(latlng, kind, label, letter) {
    return L.marker(latlng, {
      zIndexOffset: 1000,
      icon: L.divIcon({ className: 'pin-icon', iconSize: [30, 40], iconAnchor: [15, 30],
        html: `<div class="pin ${kind} drop"><div class="head"><span>${letter || (kind === 'pickup' ? 'P' : 'D')}</span></div>${label ? `<div class="tag">${esc(label)}</div>` : ''}</div>` }),
    }).addTo(sceneLayer);
  }
  function label(latlng, html, cls = '') {
    return L.marker(latlng, { interactive: false, zIndexOffset: 1200, icon: L.divIcon({ className: 'dist-label ' + cls, iconSize: [0, 0], html: `<div class="${cls}">${html}</div>` }) }).addTo(sceneLayer);
  }
  function growCircle(center, radius, ms = 900) {
    const c = L.circle(center, { radius: 1, color: '#7c9cff', weight: 1.5, fillColor: '#7c9cff', fillOpacity: 0.07, dashArray: '4 6' }).addTo(sceneLayer);
    const t0 = performance.now();
    return new Promise((res) => {
      const f = (t) => { const k = Math.min(1, (t - t0) / ms); c.setRadius(radius * (1 - (1 - k) ** 3)); k < 1 ? requestAnimationFrame(f) : res(c); };
      requestAnimationFrame(f);
    });
  }
  const line = (a, b, opts) => L.polyline([a, b], { weight: 2, opacity: 0.85, ...opts }).addTo(sceneLayer);

  // Road route from OSRM's public server; a straight line if it is unreachable.
  async function route(a, b) {
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 3500);
      const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`, { signal: ctl.signal });
      clearTimeout(t);
      const j = await r.json();
      const coords = j.routes?.[0]?.geometry?.coordinates;
      if (coords && coords.length > 1) return coords.map(([lng, lat]) => [lat, lng]);
    } catch { /* offline: fall back */ }
    return [a, lerp(a, b, 0.5), b];
  }

  // Moves a driver along a path and reports its position to the API every LOCATION_EVERY_MS
  // (real PUT /location calls), plus once on arrival. The marker itself moves smoothly.
  const LOCATION_EVERY_MS = 2000;
  // Optional ?speed=<km/h> makes the duration depend on the route length (time-lapsed: 400 is a good start); lower = slower.
  const DRIVE_KMH = +qs.get('speed') || 0;
  async function animateDriver(tok, id, path, msFixed) {
    const m = S.markers.get(id); if (!m) return;
    S.animating.add(id);
    const cum = [0];
    for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + haversine(path[i - 1], path[i]));
    const total = cum[cum.length - 1] || 1;
    const ms = DRIVE_KMH ? Math.max(1500, (total / 1000 / DRIVE_KMH) * 3600 * 1000) : msFixed;
    const t0 = performance.now();
    let lastSent = t0; // the start position is already stored
    try {
      await new Promise((res) => {
        const f = (t) => {
          if (tok !== S.token) return res();
          const k = Math.min(1, (t - t0) / ms), dist = k * total;
          let i = 1; while (i < cum.length - 1 && cum[i] < dist) i++;
          const seg = cum[i] - cum[i - 1] || 1;
          const p = lerp(path[i - 1], path[i], (dist - cum[i - 1]) / seg);
          m.setLatLng(p);
          if (t - lastSent >= LOCATION_EVERY_MS || k === 1) {
            lastSent = t;
            api('PUT', `/drivers/${id}/location`, { latitude: +p[0].toFixed(6), longitude: +p[1].toFixed(6) }).catch(() => {});
          }
          k < 1 ? requestAnimationFrame(f) : res();
        };
        requestAnimationFrame(f);
      });
      await sleep(300);
    } finally { S.animating.delete(id); }
    check(tok);
  }

  async function driveTrip(rideId, tok, { complete = true, fast = false } = {}) {
    const ride = await getRide(rideId);
    const id = ride.assignedDriverId, d = S.drivers.get(id);
    const pick = [ride.pickup.latitude, ride.pickup.longitude], dest = [ride.destination.latitude, ride.destination.longitude];
    const toPick = await route([d.latitude, d.longitude], pick);
    const trip = await route(pick, dest);
    const l1 = L.polyline(toPick, { color: '#3b82f6', weight: 5, opacity: 0.85, className: 'flow-line' }).addTo(sceneLayer);
    const l2 = L.polyline(trip, { color: '#e879f9', weight: 4, opacity: 0.6, dashArray: '2 8' }).addTo(sceneLayer);
    map.flyToBounds(L.latLngBounds([...toPick, ...trip]).pad(0.25), { duration: 0.8 });
    await animateDriver(tok, id, toPick, fast ? 3000 : 4200);
    l1.remove();
    l2.setStyle({ color: '#3b82f6', opacity: 0.9, dashArray: null, weight: 5 });
    await animateDriver(tok, id, trip, fast ? 4500 : 6000);
    l2.remove();
    return complete ? api('POST', `/rides/${rideId}/complete`) : null;
  }

  // ---------- city reset ----------
  // Puts every driver where a scene wants it. Open rides are cancelled first: a ride left MATCHING
  // would otherwise grab a driver the moment it becomes AVAILABLE.
  function cityLayout(overrides = {}) {
    return DRIVER_IDS.map((id, i) => {
      if (overrides[id]) return { id, ...overrides[id] };
      const [lat, lng] = offset(PLACES.center, 3600 + ((i * 733) % 1600), (i * 137.5) % 360);
      return { id, lat, lng, status: 'OFFLINE' };
    });
  }

  async function resetCity(tok, layout) {
    say('Setting the scene', 'Resetting the city', 'Cancelling open rides, then moving drivers with <b>PUT /drivers/{id}/location</b> and <b>/availability</b>.');
    await Promise.all(tracked().map((id) => api('POST', `/rides/${id}/cancel`, null, { quiet: true }).catch(() => {})));
    untrackAll();
    for (let pass = 0; pass < 10; pass++) {
      check(tok);
      const ds = await fetchDrivers();
      const stuck = ds.filter((d) => d.currentRideId);
      await Promise.all(stuck.map((d) => api('POST', `/rides/${d.currentRideId}/cancel`, null, { quiet: true }).catch(() => {})));
      const online = ds.filter((d) => !d.currentRideId && d.status !== 'OFFLINE');
      await Promise.all(online.map((d) => api('PUT', `/drivers/${d.driverId}/availability`, { status: 'OFFLINE' }, { quiet: true })));
      if (!stuck.length && !online.length) break;
      await sleep(400);
    }
    await Promise.all(layout.map((d) => api('PUT', `/drivers/${d.id}/location`, { latitude: d.lat, longitude: d.lng })));
    await Promise.all(layout.filter((d) => d.status === 'AVAILABLE').map((d) => api('PUT', `/drivers/${d.id}/availability`, { status: 'AVAILABLE' })));
    await sleep(900); // let the Redis GEO projection catch up (it is fed by driver events)
    // A ride from an older session may still be MATCHING and grab a driver: cancel it and re-free the driver.
    for (let pass = 0; pass < 4; pass++) {
      const strays = (await fetchDrivers()).filter((d) => d.currentRideId);
      if (!strays.length) break;
      await Promise.all(strays.map((d) => api('POST', `/rides/${d.currentRideId}/cancel`, null, { quiet: true })));
      await sleep(900);
    }
    (await fetchDrivers()).forEach(renderDriver);
    check(tok);
  }

  // ---------- scene 1: nearest, reject, rematch (AC-04/05/07) ----------
  async function sceneMatch(tok) {
    const P = PLACES.opera, DEST = PLACES.tandinh;
    const layout = cityLayout({
      D001: at(P, 420, 35, 'AVAILABLE'),
      D002: at(P, 760, 205, 'AVAILABLE'),
      D003: at(P, 1150, 300, 'AVAILABLE'),
      D004: at(P, 1480, 120, 'AVAILABLE'),
      D005: at(P, 1850, 250, 'AVAILABLE'),
      D006: at(P, 2450, 15, 'AVAILABLE'),
      D007: at(P, 2900, 160, 'AVAILABLE'),
      D008: at(P, 2600, 280, 'AVAILABLE'),
      D011: at(P, 230, 260, 'OFFLINE'),
      D012: at(P, 560, 95, 'OFFLINE'),
    });
    map.flyTo(P, 14.3, { duration: 0.8 });
    await resetCity(tok, layout);

    say('AC-01 · Create ride', 'Passenger P001 requests a ride', 'Opera House → Tan Dinh Church. <b>POST /rides</b> with an <b>Idempotency-Key</b>. The ride starts <b>REQUESTED</b> and dispatch runs asynchronously over Redpanda (AC-10).');
    pin(P, 'pickup', 'P001 pickup'); pin(DEST, 'dest', 'destination');
    const r = await createRide('P001', P, DEST);
    if (!r.ok) throw new Error('create failed: ' + r.status);
    const rideId = r.data.rideId;
    focusRides([rideId]);
    showTab('events');
    await beat(tok, 1500);

    say('AC-04 · Matching', 'Who is inside the 2 km radius?', 'Only <b>AVAILABLE</b> drivers within the radius are candidates, ordered by Haversine distance. Offline and far drivers are excluded.');
    const disp = await waitFor(tok, () => getDispatch(rideId));
    const radius = disp.saga.radiusM || 2000;
    await growCircle(P, radius);
    label(offset(P, radius, 90), `radius ${fmtM(radius)}`, 'radius-label');
    const lines = {};
    const cands = [];
    for (const d of layout) {
      const pos = [d.lat, d.lng], dist = haversine(P, pos);
      if (dist > 3300 || !SCENE1.includes(d.id)) continue;
      if (d.status === 'OFFLINE') {
        lines[d.id] = line(P, pos, { color: '#6b7280', dashArray: '2 6', opacity: 0.6 });
        label(lerp(P, pos, 0.62), `${d.id} offline`, 'off');
      } else if (dist > radius) {
        lines[d.id] = line(P, pos, { color: '#ef4444', dashArray: '2 6', opacity: 0.7 });
        label(lerp(P, pos, 0.75), `${fmtM(dist)} · outside`, 'out');
      } else cands.push({ ...d, dist });
    }
    cands.sort((a, b) => a.dist - b.dist || a.id.localeCompare(b.id));
    const rankLabels = {};
    for (const [i, c] of cands.entries()) {
      await sleep(180);
      lines[c.id] = line(P, [c.lat, c.lng], { color: '#22c55e', className: 'flow-line', weight: i === 0 ? 3.5 : 2 });
      rankLabels[c.id] = label(lerp(P, [c.lat, c.lng], 0.6), `#${i + 1} ${c.id} · ${fmtM(c.dist)}`, i === 0 ? 'rank' : 'in');
    }
    await beat(tok, 1600);

    let ride = await waitFor(tok, async () => { const x = await getRide(rideId); return x.status === 'DRIVER_ASSIGNED' && x; });
    const first = ride.assignedDriverId;
    const pick = (await getDispatch(rideId)).steps.filter((s) => s.step === 'RESERVING').pop();
    flashDriver(first, 'win', 0);
    say('AC-05 · Offer', `Offer sent to ${first}`, `Server says: <i>“${esc(pick?.detail)}”</i>. Ride is <b>DRIVER_ASSIGNED</b>, ${first} is <b>OFFERED</b> and has 30 s to answer (watch the ring).`);
    await beat(tok, 3200);

    ride = await getRide(rideId);
    const rejId = ride.assignedDriverId;
    let rej = rejId && await api('POST', `/rides/${rideId}/offers/${rejId}/reject`);
    flashDriver(rejId, 'win', 1);
    lines[rejId]?.setStyle({ color: '#ef4444', dashArray: '2 6', className: '' });
    rankLabels[rejId]?.remove();
    label(lerp(P, posOf(rejId), 0.6), `${rejId} rejected · excluded`, 'out');
    say('AC-07 · Rematch', `${rejId || first} ${rej?.ok ? 'rejects' : 'did not answer'}`, `${rejId} is <b>excluded from this ride for good</b> (but stays AVAILABLE for other rides). The ride goes back to <b>MATCHING</b> with <b>assignedDriverId</b> cleared, and the saga picks the next nearest.`);
    ride = await waitFor(tok, async () => { const x = await getRide(rideId); return x.status === 'DRIVER_ASSIGNED' && x.assignedDriverId !== rejId && x; }, 40000);
    const second = ride.assignedDriverId;
    flashDriver(second, 'win', 0);
    await beat(tok, 1400);
    say('AC-07 · Rematch', `Next nearest: ${second}`, `New offer to <b>${second}</b>. ${rejId} is skipped even though it is AVAILABLE again.`);
    await beat(tok, 2600);

    ride = await getRide(rideId);
    const acc = await api('POST', `/rides/${rideId}/offers/${ride.assignedDriverId}/accept`);
    flashDriver(ride.assignedDriverId, 'win', 1);
    await waitFor(tok, async () => (await getRide(rideId)).status === 'DRIVER_ACCEPTED');
    say('AC-05 · Accept', `${ride.assignedDriverId} accepts`, `Offer <b>ACCEPTED</b> (${acc.status}). Ride <b>DRIVER_ACCEPTED</b>, driver <b>BUSY</b>. Now the driver drives; every move is a real <b>PUT /drivers/${ride.assignedDriverId}/location</b> (AC-03).`);
    sceneLayer.eachLayer((l) => { if (l instanceof L.Polyline || (l.options.icon && /dist-label/.test(l.options.icon.options.className))) sceneLayer.removeLayer(l); });
    await beat(tok, 1200);
    await driveTrip(rideId, tok);
    await waitFor(tok, async () => (await getRide(rideId)).status === 'COMPLETED');
    say('AC-06 · Completed', 'Trip completed', `Ride <b>COMPLETED</b> (terminal) and ${ride.assignedDriverId} is back to <b>AVAILABLE</b>. The <b>State history</b> tab shows every transition and the event that caused it.`);
    showTab('history');
  }
  const SCENE1 = ['D001', 'D002', 'D003', 'D004', 'D005', 'D006', 'D007', 'D008', 'D011', 'D012'];
  const at = (p, m, b, status) => { const [lat, lng] = offset(p, m, b); return { lat, lng, status }; };
  const posOf = (id) => { const d = S.drivers.get(id); return d ? [d.latitude, d.longitude] : PLACES.center; };

  // ---------- scene 2: the race (AC-09) ----------
  const RACE_SQL = `<span class="c">-- driver-service: one statement decides the race</span>
<span class="k">UPDATE</span> drivers <span class="k">SET</span> status=<span class="w">'OFFERED'</span>, current_ride_id=$ride
<span class="k">WHERE</span> id=<span class="w">'D001'</span> <span class="k">AND</span> status=<span class="w">'AVAILABLE'</span>
<span class="c">-- </span><span class="w">1 row → reserved</span><span class="c">  ·  </span><span class="l">0 rows → taken, try next</span>`;

  function raceLayout() {
    const H = PLACES.benthanh;
    return {
      H, A: offset(H, 380, 270), B: offset(H, 380, 90),
      layout: cityLayout({
        D001: at(H, 0, 0, 'AVAILABLE'),
        D002: at(H, 950, 0, 'AVAILABLE'),
        D003: at(H, 1050, 180, 'AVAILABLE'),
      }),
    };
  }
  const score = { rounds: 0, collide: 0, double: 0 };
  function renderScore() {
    $('#raceScore').hidden = false;
    $('#rsRounds').textContent = score.rounds; $('#rsCollide').textContent = score.collide; $('#rsDouble').textContent = score.double;
    $('#raceScore .ok').style.color = score.double ? 'var(--excluded)' : '';
  }

  async function sceneRace(tok, rounds) {
    const { H, A, B, layout } = raceLayout();
    map.flyTo(H, 15.6, { duration: 0.8 });
    Object.assign(score, { rounds: 0, collide: 0, double: 0 });
    renderScore();
    await resetCity(tok, layout);
    sql(RACE_SQL);
    for (let i = 0; i < rounds; i++) {
      if (i > 0) await prepareNextRound(tok, layout);
      await raceRound(tok, H, A, B, i, rounds);
      if (i < rounds - 1) await beat(tok, rounds > 1 ? 900 : 0);
    }
    say('AC-09 · Result', `${score.rounds} race${score.rounds > 1 ? 's' : ''}, ${score.double} double-booking${score.double === 1 ? '' : 's'}`,
      `<b>${score.collide}</b> of ${score.rounds} rounds collided at the database itself (the loser's reservation got 0 rows and it moved on).${score.collide < score.rounds ? ' The others were serialised earlier by the GEO index.' : ''} Either way a driver never holds two rides.`);
    showTab('events');
  }

  async function prepareNextRound(tok, layout) {
    await Promise.all(S.focus.map((id) => api('POST', `/rides/${id}/cancel`, null, { quiet: true })));
    sceneLayer.clearLayers();
    S.markers.forEach((_, id) => drvEl(id)?.classList.remove('win'));
    const ids = layout.filter((d) => d.status === 'AVAILABLE').map((d) => d.id);
    await waitFor(tok, async () => (await fetchDrivers()).filter((d) => ids.includes(d.driverId)).every((d) => d.status === 'AVAILABLE' && !d.currentRideId), 10000);
    await sleep(700); // GEO projection
  }

  async function raceRound(tok, H, A, B, i, n) {
    pin(A, 'pickup', 'P002', 'A'); pin(B, 'pickup', 'P003', 'B');
    const bA = line(A, H, { color: '#f59e0b', weight: 3, className: 'bolt' });
    const bB = line(B, H, { color: '#f59e0b', weight: 3, className: 'bolt' });
    label(lerp(A, H, 0.5), fmtM(haversine(A, H)), 'in'); label(lerp(B, H, 0.5), fmtM(haversine(B, H)), 'in');
    say(`AC-09 · Round ${i + 1}/${n}`, 'Two rides, one nearest driver, same instant', 'P002 (A) and P003 (B) are both <b>380 m</b> from D001. Both <b>POST /rides</b> are fired together with <b>Promise.all</b>.');
    if (n === 1) await beat(tok, 1800);
    const DEST = PLACES.notredame;
    const [ra, rb] = await Promise.all([createRide('P002', A, DEST), createRide('P003', B, DEST)]);
    const idA = ra.data.rideId, idB = rb.data.rideId;
    focusRides([idA, idB], { [idA]: 'A', [idB]: 'B' });
    const [x, y] = await waitFor(tok, async () => {
      const [p, q] = await Promise.all([getRide(idA), getRide(idB)]);
      return p.status === 'DRIVER_ASSIGNED' && q.status === 'DRIVER_ASSIGNED' && [p, q];
    }, 15000, 120);
    const [dA, dB] = await Promise.all([getDispatch(idA), getDispatch(idB)]);
    const lostA = dA.steps.some((s) => /taken by another ride/.test(s.detail || ''));
    const lostB = dB.steps.some((s) => /taken by another ride/.test(s.detail || ''));
    const contested = x.assignedDriverId === 'D001' || y.assignedDriverId === 'D001' ? 'D001' : null;
    const double = x.assignedDriverId === y.assignedDriverId;
    score.rounds++; if (lostA || lostB) score.collide++; if (double) score.double++;
    renderScore();

    const winA = x.assignedDriverId === contested;
    const [wPin, lPin, loser] = winA ? [A, B, y] : [B, A, x];
    (winA ? bA : bB).setStyle({ color: '#22c55e', className: '', dashArray: null, weight: 4 });
    (winA ? bB : bA).setStyle({ color: '#ef4444', className: '', dashArray: '3 6', weight: 2 });
    line(lPin, posOf(loser.assignedDriverId), { color: '#22c55e', weight: 3, className: 'flow-line' });
    label(lerp(wPin, H, 0.5), `${winA ? 'A' : 'B'} wins D001`, 'rank');
    flashDriver('D001', 'win', 0);
    const how = lostA || lostB
      ? `Real collision: both reserved D001, Postgres let <b>one</b> UPDATE through; the other got <b>0 rows</b> → <i>“driver was taken by another ride, trying the next candidate”</i>.`
      : 'The GEO index already showed D001 as taken, so the second saga went straight to the next driver.';
    say(`AC-09 · Round ${i + 1}/${n}`, `${winA ? 'A' : 'B'} got D001 · ${winA ? 'B' : 'A'} got ${loser.assignedDriverId}`, `${how} ${double ? '<b style="color:var(--excluded)">DOUBLE BOOKING!</b>' : 'No driver holds two offers.'}`);
  }

  // ---------- scene 3: idempotency storm (AC-08) ----------
  async function sceneStorm(tok) {
    const P = PLACES.notredame, DEST = PLACES.bitexco;
    map.flyTo(P, 15.8, { duration: 0.8 });
    await resetCity(tok, cityLayout({ D001: at(P, 420, 45, 'AVAILABLE') }));
    const st = { sent: 0, replay: 0, rides: 0 };
    const show = () => { $('#stormScore').hidden = false; $('#ssSent').textContent = st.sent; $('#ssReplay').textContent = st.replay; $('#ssRides').textContent = st.rides; };
    show();
    pin(P, 'pickup', 'P004 pickup'); pin(DEST, 'dest', 'destination');
    const phones = Array.from({ length: 10 }, (_, i) => {
      const pos = offset(P, 210, i * 36);
      return L.marker(pos, { zIndexOffset: 1100, icon: L.divIcon({ className: 'phone-icon', iconSize: [22, 22], iconAnchor: [11, 11], html: `<div class="phone">${i + 1}</div>` }) }).addTo(sceneLayer);
    });
    say('AC-08 · Idempotency', 'A flaky network retries 10 times at once', 'Ten <b>identical POST /rides</b> with the <b>same Idempotency-Key</b>, in parallel. The key and the response are stored in the same transaction as the ride.');
    showTab('api');
    await beat(tok, 2000);

    const key = `storm-${Date.now()}`;
    const body = ['P004', P, DEST];
    const results = await Promise.all(phones.map(async (ph, i) => {
      flyDot(ph.getLatLng(), P, '#e879f9');
      const r = await createRide(...body, key);
      const el = ph.getElement()?.querySelector('.phone');
      el?.classList.add(r.ok ? (r.replayed ? 'replay' : 'ok') : 'bad');
      if (el) el.textContent = r.ok ? (r.replayed ? '↺' : '✓') : r.status;
      st.sent++; if (r.replayed) st.replay++; show();
      return r;
    }));
    const ids = [...new Set(results.filter((r) => r.ok).map((r) => r.data.rideId))];
    st.rides = ids.length; show();
    const rideId = ids[0];
    focusRides([rideId]);
    say('AC-08 · Idempotency', `10 requests → ${ids.length} ride`, `<b>${results.filter((r) => r.ok && !r.replayed).length}</b> created it, <b>${st.replay}</b> came back with <b>Idempotent-Replayed: true</b> and the same rideId <b>…${short(rideId)}</b>. ✓ = created · ↺ = replayed.`);
    await beat(tok, 3200);

    const bad = L.marker(offset(P, 330, 300), { zIndexOffset: 1100, icon: L.divIcon({ className: 'phone-icon', iconSize: [22, 22], iconAnchor: [11, 11], html: '<div class="phone">?</div>' }) }).addTo(sceneLayer);
    flyDot(bad.getLatLng(), P, '#ef4444');
    const reuse = await createRide('P004', P, PLACES.tandinh, key);
    const be = bad.getElement()?.querySelector('.phone');
    be?.classList.add('bad'); if (be) be.textContent = reuse.status;
    say('AC-01 · Key reuse', `Same key, different destination → ${reuse.status}`, `<b>${esc(reuse.data?.code)}</b>: a key belongs to one request body. Nothing was created.`);
    await beat(tok, 2800);

    const ride = await waitFor(tok, async () => { const x = await getRide(rideId); return x.status === 'DRIVER_ASSIGNED' && x; });
    const drv = ride.assignedDriverId;
    say('AC-08 · Duplicate accept', `${drv} taps “Accept” 5 times`, 'Five <b>POST …/accept</b> in parallel. One wins the atomic <b>UPDATE offers … WHERE status=\'PENDING\'</b>; the rest are replays.');
    await beat(tok, 1800);
    const accs = await Promise.all(Array.from({ length: 5 }, () => { flyDot(posOf(drv), P, '#22c55e'); return api('POST', `/rides/${rideId}/offers/${drv}/accept`); }));
    flashDriver(drv, 'pulse');
    await waitFor(tok, async () => (await getRide(rideId)).status === 'DRIVER_ACCEPTED');
    await beat(tok, 600);
    await Promise.all([1, 2, 3].map(() => api('POST', `/rides/${rideId}/complete`)));
    const h = await waitFor(tok, async () => { const x = await getHistory(rideId); return x.transitions.some((t) => t.to === 'COMPLETED') && x; });
    const nAcc = h.transitions.filter((t) => t.to === 'DRIVER_ACCEPTED').length;
    const nDone = h.transitions.filter((t) => t.to === 'COMPLETED').length;
    say('AC-06 · Duplicate transitions', `5 accepts → ${nAcc} transition · 3 completes → ${nDone}`,
      `Accept: <b>${accs.filter((r) => r.ok).length}× 200</b>, <b>${accs.filter((r) => r.replayed).length}</b> replayed. The state history has exactly <b>${nAcc}</b> DRIVER_ACCEPTED and <b>${nDone}</b> COMPLETED row. Duplicates are no-ops, never invalid states.`);
    showTab('history');
  }
  function flyDot(from, to, color) {
    const a = [from.lat ?? from[0], from.lng ?? from[1]];
    const dot = L.circleMarker(a, { radius: 5, color, fillColor: color, fillOpacity: 1, weight: 0 }).addTo(sceneLayer);
    const t0 = performance.now(), ms = 450 + Math.random() * 250;
    const f = (t) => { const k = Math.min(1, (t - t0) / ms); dot.setLatLng(lerp(a, to, k * k)); k < 1 ? requestAnimationFrame(f) : dot.remove(); };
    requestAnimationFrame(f);
  }

  // ---------- free play (AC-02/03) ----------
  function enterFree() {
    S.mode = 'free';
    S.markers.forEach((m) => m.dragging.enable());
    S.free.pickup = S.free.dest = null;
    sceneLayer.clearLayers(); sql(null);
    $('#requestBtn').disabled = true;
    say('Free play', 'Click the map to set a pickup', 'Then click again for the destination. Drag drivers to move them (PUT /location), click one to switch it online or offline, or to accept or reject its offer.');
  }
  map.on('click', (e) => {
    if (S.mode !== 'free') return;
    const p = [+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)];
    if (!S.free.pickup || S.free.dest) {
      sceneLayer.clearLayers();
      S.free.pickup = p; S.free.dest = null;
      pin(p, 'pickup', 'pickup');
      L.circle(p, { radius: S.cfg.matchRadiusM, color: '#7c9cff', weight: 1, fillOpacity: 0.05, dashArray: '4 6', interactive: false }).addTo(sceneLayer);
      say('Free play', 'Now click the destination', `The dashed circle is the ${fmtM(S.cfg.matchRadiusM)} matching radius (from Redis <b>config:dispatch</b>).`);
      $('#requestBtn').disabled = true;
    } else {
      S.free.dest = p;
      pin(p, 'dest', 'destination');
      $('#requestBtn').disabled = false;
      say('Free play', 'Ready', 'Press <b>Request ride</b>. If nobody is in range the ride stays MATCHING; bring a driver online nearby and watch it get matched.');
    }
  });
  $('#requestBtn').addEventListener('click', async () => {
    const pid = 'P00' + (5 + Math.floor(Math.random() * 5));
    const r = await createRide(pid, S.free.pickup, S.free.dest);
    if (!r.ok) { toast(`${r.status} ${r.data?.code}`, true); return; }
    focusRides([r.data.rideId]);
    showTab('events');
    say('Free play', `${pid} requested a ride`, `Watch the saga steps on the right. Click the offered driver to accept or reject, or let the ${S.cfg.offerTimeoutSeconds} s timer expire to see a timeout rematch.`);
  });


  // ---------- scene 0: happy path = docs/sequence-diagram.md §1 ----------
  // A step player: Next runs the real API call for a step the first time it is reached;
  // Prev/Next over steps already reached only replays what was recorded (no API calls).
  // Every arrow shows its evidence from the API, plus links to the same moment in
  // Grafana (logs/trace), Redpanda (messages) and Postgres (Adminer).
  const LANES = ['Passenger', 'Driver', 'ride-svc', 'dispatch', 'Redis', 'driver-svc'];
  const [LP, LD, LRS, LXS, LR, LDS] = [0, 1, 2, 3, 4, 5];
  const HOST = location.hostname || 'localhost';
  const TOOLS = { grafana: `http://${HOST}:3000`, redpanda: `http://${HOST}:8088`, db: `http://${HOST}:8089`, redis: `http://${HOST}:5540` };
  const RI_DB = '0'; // RedisInsight id of the database preconfigured by RI_REDIS_HOST (docker-compose.yml)
  const gExplore = (pane) => `${TOOLS.grafana}/explore?schemaVersion=1&orgId=1&panes=${encodeURIComponent(JSON.stringify({ a: pane }))}`;
  const gLogs = (c, svc, key = 'R1') => gExplore({
    datasource: 'loki',
    queries: [{ refId: 'A', datasource: { type: 'loki', uid: 'loki' }, expr: `${svc ? `{service_name="${svc}"}` : '{service_name=~".+"}'} | ride_id="${c[key]}"` }],
    range: { from: String(new Date(c.T0 || Date.now()).getTime() - 60000), to: 'now' },
  });
  const gTraceId = (id) => gExplore({ datasource: 'tempo', queries: [{ refId: 'A', datasource: { type: 'tempo', uid: 'tempo' }, queryType: 'traceql', query: id }], range: { from: 'now-6h', to: 'now' } });
  const gTrace = (c) => gTraceId(c.traceId);
  const gDash = () => `${TOOLS.grafana}/d/ridehail-dispatch/dispatch-overview?orgId=1&from=now-15m&to=now`;
  const rp = (topic, q) => `${TOOLS.redpanda}/topics/${topic}?q=${encodeURIComponent(q)}#messages`;
  function adm(db, table, col, val, order) {
    const p = new URLSearchParams({ pgsql: 'postgres', username: 'postgres', db, ns: 'public', select: table });
    if (col) { p.set('where[0][col]', col); p.set('where[0][op]', '='); p.set('where[0][val]', val); }
    if (order) { p.set('order[0]', order); p.set('desc[0]', '1'); }
    return `${TOOLS.db}/?${p}`;
  }
  const logs = (svc, key = 'R1', tag = '') => (c) => ['Grafana', `${tag}${svc ? svc.replace('-service', '') : 'all'} logs`, gLogs(c, svc, key)];
  const trace = (c) => ['Grafana', 'trace', gTrace(c)];
  const topic = (t, key = 'R1') => (c) => ['Redpanda', t, rp(t, c[key])];
  // RedisInsight cannot deep-link to a key, so the button opens Workbench and copies the command to run.
  const GEO = 'geo:drivers:available';
  const redis = (label, cmd) => (c) => ['Redis', label, `${TOOLS.redis}/${RI_DB}/workbench`, cmd(c)];
  const redisDrv = (key) => (c) => { const cmd = `HGETALL driver:${c[key]}\nGEOPOS ${GEO} ${c[key]}`; return ['Redis', key === 'drv' ? 'driver hash + GEO' : `${c[key]} hash + GEO`, `${TOOLS.redis}/${RI_DB}/workbench`, cmd]; };
  const redisDriver = redisDrv('drv');
  const redisConfig = redis('config:dispatch', () => 'HGETALL config:dispatch');
  const table = (db, t, col, key, order) => (c) => ['DB', `${db.replace('_db', '')}.${t}`, adm(db, t, col, c[key], order)];

  const T = (c, at, from = c.T0, after = '') => (at && from ? `${after ? '+' : 'T+'}${Math.max(0, new Date(at) - new Date(from))} ms${after ? ' after ' + after : ''}` : '');
  const ev = (id) => (id ? `…${short(id)}` : '–');
  const tr = (c, to, h = c.h1) => h?.transitions.find((t) => t.to === to);
  const stepOf = (c, name) => c.x1?.steps.find((s) => s.step === name);

  // Timeline: 16 diagram rows + the trip (map only).
  const HAPPY = [
    { row: { f: LP, t: LRS, txt: 'POST /rides · Idempotency-Key', ac: 'AC-01' }, live: true,
      kicker: 'Step 1 · AC-01', title: 'Passenger P001 requests a ride',
      text: () => 'Opera House → Tan Dinh Church. The passenger app sends <b>POST /rides</b> with an <b>Idempotency-Key</b>.',
      run: happyCreate,
      proof: (c) => `<b>${c.created.status}</b> · ride <b>${ev(c.R1)}</b> · <b>${c.created.data.status}</b> · ${Math.round(c.created.ms)} ms`,
      detail: (c) => c.created.data,
      links: [logs('ride-service'), table('ride_db', 'rides', 'id', 'R1'), table('ride_db', 'idempotency_keys', 'ride_id', 'R1')] },
    { row: { f: LRS, t: LRS, txt: '[tx] ride REQUESTED + outbox RideRequested', ac: 'AC-01' },
      kicker: 'Step 2 · transactional outbox', title: 'One transaction: ride + key + outgoing event',
      text: () => 'ride-service stores the ride, the idempotency key and a <b>RideRequested</b> outbox row atomically. The HTTP call is already answered.',
      proof: (c) => `<b>∅ → REQUESTED</b> · ${esc(tr(c, 'REQUESTED').cause.slice(0, 40))}…`, at: (c) => c.T0,
      detail: (c) => tr(c, 'REQUESTED'),
      links: [table('ride_db', 'outbox', 'msg_key', 'R1', 'id'), table('ride_db', 'ride_transitions', 'ride_id', 'R1', 'id'), topic('ride.events.v1')] },
    { row: { f: LRS, t: LXS, txt: 'RideRequested → saga STARTED', ac: 'AC-10', async: true },
      kicker: 'Step 3 · AC-10 event-driven', title: 'Dispatch picks up RideRequested from Redpanda',
      text: () => 'The outbox relay published the event; dispatch-service consumes it (inbox = skip duplicates) and starts the saga.',
      proof: (c) => `saga <b>STARTED</b> · event <b>${ev(stepOf(c, 'STARTED').eventId)}</b>`, at: (c) => stepOf(c, 'STARTED').at,
      detail: (c) => stepOf(c, 'STARTED'),
      links: [topic('ride.events.v1'), table('dispatch_db', 'dispatch_sagas', 'ride_id', 'R1'), table('dispatch_db', 'inbox', 'event_id', 'evStarted'), logs('dispatch-service')] },
    { row: { f: LXS, t: LRS, txt: 'StartMatching → REQUESTED → MATCHING', ac: 'AC-06', async: true },
      kicker: 'Step 4 · AC-06 state machine', title: 'Saga command: start matching',
      text: () => 'dispatch sends <b>StartMatching</b>; ride-service applies <b>REQUESTED → MATCHING</b> and replies CommandSucceeded.',
      proof: (c) => `<b>REQUESTED → MATCHING</b> · cause event <b>${ev(tr(c, 'MATCHING').cause.replace('event:', ''))}</b>`, at: (c) => tr(c, 'MATCHING').at,
      detail: (c) => tr(c, 'MATCHING'),
      links: [topic('ride.commands.v1'), topic('dispatch.replies.v1'), table('ride_db', 'ride_transitions', 'ride_id', 'R1', 'id')] },
    { row: { f: LXS, t: LR, txt: (c) => `GEOSEARCH pickup BYRADIUS ${km(c)} ASC`, ac: 'AC-04' },
      kicker: 'Step 5 · AC-04 matching', title: 'Nearest available driver within the radius',
      text: () => 'Redis GEO suggests candidates; Haversine orders them by (distance, driverId). Offline and far drivers are out.',
      proof: (c) => `“${esc(stepOf(c, 'RESERVING').detail)}” → <b>${c.drv}</b>`, at: (c) => stepOf(c, 'RESERVING').at,
      detail: (c) => ({ saga: { radiusM: c.x1.saga.radiusM, pickup: c.x1.saga.pickup }, step: stepOf(c, 'RESERVING') }),
      links: [redis('GEOSEARCH 2 km', (c) => `GEOSEARCH ${GEO} FROMLONLAT ${c.x1.saga.pickup.longitude} ${c.x1.saga.pickup.latitude} BYRADIUS ${c.x1.saga.radiusM} m ASC WITHDIST WITHCOORD`), table('dispatch_db', 'saga_steps', 'ride_id', 'R1', 'id'), logs('dispatch-service'), trace] },
    { row: { f: LXS, t: LDS, txt: 'ReserveDriver(D001)', ac: 'AC-09', async: true },
      kicker: 'Step 6 · saga command', title: 'Ask driver-service to reserve D001',
      text: () => 'The saga goes to <b>RESERVING</b> and writes a <b>ReserveDriver</b> command to its outbox.',
      proof: (c) => `ReserveDriver(<b>${c.drv}</b>) · offer <b>${ev(c.offer.offerId)}</b>`, at: (c) => stepOf(c, 'RESERVING').at,
      detail: (c) => ({ command: 'ReserveDriver', rideId: c.R1, driverId: c.drv, offerId: c.offer.offerId }),
      links: [topic('driver.commands.v1'), table('dispatch_db', 'outbox', 'msg_key', 'drv', 'id')] },
    { row: { f: LDS, t: LDS, txt: "UPDATE … WHERE status='AVAILABLE' → 1 row", ac: 'AC-09' },
      kicker: 'Step 7 · AC-09 concurrency guard', title: `D001 is reserved atomically`,
      text: () => 'One conditional <b>UPDATE drivers SET status=\'OFFERED\' WHERE id=$1 AND status=\'AVAILABLE\'</b>. Had another ride won, 0 rows would change and the saga would try the next driver.',
      proof: (c) => `${c.drv} <b>AVAILABLE → OFFERED</b> · currentRideId <b>${ev(c.d1.currentRideId)}</b>`, at: (c) => c.d1.updatedAt,
      detail: (c) => c.d1,
      links: [table('driver_db', 'drivers', 'id', 'drv'), topic('driver.events.v1', 'drv'), topic('dispatch.replies.v1'), redisDriver, logs('driver-service')] },
    { row: { f: LXS, t: LXS, txt: (c) => `[tx] offer PENDING, expires +${secs(c)} s`, ac: 'AC-05' },
      kicker: 'Step 8 · AC-05 offer', title: 'A pending offer with a timeout',
      text: (c) => `Offer <b>PENDING</b>, expires in <b>${c.offerSecs ?? secs(c)} s</b> (the ring on the driver). If nobody answers, a timeout counts as a rejection.`,
      proof: (c) => `offer <b>PENDING</b> · expires ${fmtT(c.offer.expiresAt).slice(0, 8)} (${c.offerSecs} s)`, at: (c) => c.offer.createdAt,
      detail: (c) => c.offer,
      links: [table('dispatch_db', 'offers', 'ride_id', 'R1'), logs('dispatch-service')] },
    { row: { f: LXS, t: LRS, txt: 'AssignDriver → DRIVER_ASSIGNED', ac: 'AC-05', async: true },
      kicker: 'Step 9 · AC-05', title: 'Ride DRIVER_ASSIGNED to D001',
      text: () => 'A pending offer, not an accepted ride yet: <b>assignedDriverId</b> is set and the driver has to answer.',
      proof: (c) => `<b>MATCHING → DRIVER_ASSIGNED</b> · driver <b>${c.drv}</b>`, at: (c) => tr(c, 'DRIVER_ASSIGNED').at,
      detail: (c) => tr(c, 'DRIVER_ASSIGNED'),
      links: [topic('ride.commands.v1'), table('ride_db', 'rides', 'id', 'R1'), table('ride_db', 'ride_transitions', 'ride_id', 'R1', 'id')] },
    { row: { f: LD, t: LXS, txt: 'GET /drivers/D001/offer', ac: 'AC-05' },
      kicker: 'Step 10 · driver app', title: "D001's phone shows the offer",
      text: () => 'The driver app reads <b>GET /drivers/D001/offer</b> (or gets it pushed by the gRPC stream, API v2).',
      run: async (c) => { c.off = await api('GET', `/drivers/${c.drv}/offer`); },
      proof: (c) => `<b>${c.off.status}</b> · offer <b>${ev(c.off.data?.offerId)}</b> · <b>${c.off.data?.status}</b>`,
      detail: (c) => c.off.data,
      links: [table('dispatch_db', 'offers', 'ride_id', 'R1'), trace] },
    { row: { f: LD, t: LXS, txt: 'POST …/offers/D001/accept (pivot)', ac: 'AC-05' },
      kicker: 'Step 11 · AC-05 pivot', title: 'D001 accepts',
      text: () => '<b>UPDATE offers SET status=\'ACCEPTED\' WHERE status=\'PENDING\' AND expires_at &gt; now()</b>. From here the saga only moves forward.',
      run: happyAccept,
      proof: (c) => `<b>${c.acc.status}</b> · offer <b>${c.acc.data?.status}</b> · ${Math.round(c.acc.ms)} ms`,
      detail: (c) => c.acc.data,
      links: [table('dispatch_db', 'offers', 'ride_id', 'R1'), logs('dispatch-service'), trace] },
    { row: { f: LXS, t: LDS, txt: 'MarkDriverBusy → OFFERED → BUSY', ac: 'AC-02', async: true },
      kicker: 'Step 12 · AC-02 driver status', title: 'D001 is BUSY',
      text: () => 'Accepting moves the driver <b>OFFERED → BUSY</b>; a BUSY driver cannot receive offers or go offline.',
      proof: (c) => `${c.drv} <b>OFFERED → BUSY</b>`, at: (c) => c.d2.updatedAt, from: (c) => c.tAccept, after: 'accept',
      detail: (c) => c.d2,
      links: [topic('driver.commands.v1'), table('driver_db', 'drivers', 'id', 'drv'), redisDriver] },
    { row: { f: LXS, t: LRS, txt: 'MarkAccepted → DRIVER_ACCEPTED', ac: 'AC-06', async: true },
      kicker: 'Step 13 · AC-06', title: 'Ride DRIVER_ACCEPTED',
      text: () => 'ride-service applies <b>DRIVER_ASSIGNED → DRIVER_ACCEPTED</b>. A repeated accept would be a no-op (AC-08).',
      proof: (c) => `<b>DRIVER_ASSIGNED → DRIVER_ACCEPTED</b> · v${c.accepted.version}`, at: (c) => tr(c, 'DRIVER_ACCEPTED', c.h2).at, from: (c) => c.tAccept, after: 'accept',
      detail: (c) => tr(c, 'DRIVER_ACCEPTED', c.h2),
      links: [topic('ride.commands.v1'), table('ride_db', 'ride_transitions', 'ride_id', 'R1', 'id')] },
    { trip: true, live: true,
      kicker: 'The trip · AC-03', title: 'D001 drives to the pickup, then to the destination',
      text: () => 'Every move is a real <b>PUT /drivers/D001/location</b>: latest location stored with a version, published as DriverLocationUpdated.',
      run: async (c, tok) => { await driveTrip(c.R1, tok, { complete: false, fast: true }); c.dTrip = (await api('GET', `/drivers/${c.drv}`, null, { quiet: true })).data; },
      detail: (c) => c.dTrip,
      links: [topic('driver.events.v1', 'drv'), table('driver_db', 'drivers', 'id', 'drv'), redisDriver, () => ['Grafana', 'dashboard', gDash()]] },
    { row: { f: LD, t: LRS, txt: 'POST /rides/R1/complete', ac: 'AC-06' },
      kicker: 'Step 14 · AC-06', title: 'Trip completed',
      text: () => '<b>COMPLETED</b> is a terminal state. ride-service publishes <b>RideCompleted</b> through its outbox.',
      run: async (c) => { c.done = await api('POST', `/rides/${c.R1}/complete`); },
      proof: (c) => `<b>${c.done.status}</b> · ride <b>${c.done.data?.status}</b>`,
      detail: (c) => c.done.data,
      links: [table('ride_db', 'rides', 'id', 'R1'), table('ride_db', 'ride_transitions', 'ride_id', 'R1', 'id'), logs('ride-service')] },
    { row: { f: LRS, t: LXS, txt: 'RideCompleted → saga COMPLETED', ac: 'AC-10', async: true },
      kicker: 'Step 15 · AC-10', title: 'The saga closes',
      text: () => 'dispatch consumes <b>RideCompleted</b>, marks the saga <b>COMPLETED</b> and sends <b>ReleaseDriver</b>.',
      run: happyFinish,
      proof: (c) => `saga <b>COMPLETED</b>${c.sDone?.eventId ? ` · event <b>${ev(c.sDone.eventId)}</b>` : ''}`, at: (c) => c.sDone?.at || c.x3.saga.updatedAt, from: (c) => c.tDone, after: 'complete',
      detail: (c) => ({ saga: c.x3.saga, step: c.sDone }),
      links: [topic('ride.events.v1'), table('dispatch_db', 'dispatch_sagas', 'ride_id', 'R1'), table('dispatch_db', 'saga_steps', 'ride_id', 'R1', 'id')] },
    { row: { f: LXS, t: LDS, txt: 'ReleaseDriver → BUSY → AVAILABLE', ac: 'AC-02', async: true },
      kicker: 'Done · 16/16 confirmed', title: 'D001 is AVAILABLE again',
      text: (c) => `Request → offer → accept → complete across 3 services and Redpanda. Request to offer took <b>${c.toOffer} ms</b> of server time. Use <b>Prev</b> or click any arrow to revisit a step.`,
      proof: (c) => `${c.drv} <b>BUSY → AVAILABLE</b> · currentRideId <b>null</b>`, at: (c) => c.d3.updatedAt, from: (c) => c.tDone, after: 'complete',
      detail: (c) => c.d3,
      links: [topic('driver.commands.v1'), table('driver_db', 'drivers', 'id', 'drv'), redisDriver, trace, logs(null)] },
  ];

  const H = { active: false, sc: null, idx: -1, reached: -1, playing: false, busy: false, failed: false, c: {}, tok: 0, loop: 0, finish: null, layout: null };
  const DWELL = 1500;

  async function happyCreate(c, tok) {
    c.created = await createRide('P001', PLACES.opera, PLACES.tandinh, `happy-${Date.now()}`);
    if (!c.created.ok) throw new Error(`POST /rides → ${c.created.status} ${c.created.data?.code || ''}`);
    c.R1 = c.created.data.rideId;
    c.traceId = c.created.data.traceId;
    focusRides([c.R1]);
    const assigned = await waitFor(tok, async () => { const r = await getRide(c.R1); return r.status === 'DRIVER_ASSIGNED' && r; });
    c.drv = assigned.assignedDriverId;
    const [h1, x1, d1] = await Promise.all([getHistory(c.R1), getDispatch(c.R1), api('GET', `/drivers/${c.drv}`, null, { quiet: true })]);
    Object.assign(c, { h1, x1, d1: d1.data, T0: h1.transitions[0].at, offer: x1.offers[0] });
    c.offerSecs = Math.round((new Date(c.offer.expiresAt) - new Date(c.offer.createdAt)) / 1000);
    c.evStarted = stepOf(c, 'STARTED')?.eventId;
    c.toOffer = new Date(tr(c, 'DRIVER_ASSIGNED').at) - new Date(c.T0);
    c.traceId = c.traceId || (await getRide(c.R1)).traceId;
  }
  async function happyAccept(c, tok) {
    c.acc = await api('POST', `/rides/${c.R1}/offers/${c.drv}/accept`);
    if (!c.acc.ok) {
      const e = new Error(c.acc.data?.code || String(c.acc.status));
      e.happy = `The offer is gone (<b>${esc(c.acc.data?.code)}</b>). If it expired while paused, the saga treated it as a rejection (AC-05) and moved on. Press <b>■ Stop</b> and run again; for slow presenting start the stack with <b>OFFER_TIMEOUT=5m make up</b>.`;
      throw e;
    }
    c.accepted = await waitFor(tok, async () => { const r = await getRide(c.R1); return r.status === 'DRIVER_ACCEPTED' && r; });
    c.d2 = await waitFor(tok, async () => { const r = await api('GET', `/drivers/${c.drv}`, null, { quiet: true }); return r.data.status === 'BUSY' && r.data; });
    c.h2 = await getHistory(c.R1);
    c.tAccept = (await getDispatch(c.R1)).offers.find((o) => o.status === 'ACCEPTED')?.respondedAt;
  }
  async function happyFinish(c, tok) {
    c.x3 = await waitFor(tok, async () => { const x = await getDispatch(c.R1); return x.saga.status === 'COMPLETED' && x; });
    c.sDone = c.x3.steps.filter((s) => s.step === 'COMPLETED').pop();
    c.tDone = tr(c, 'COMPLETED', await getHistory(c.R1))?.at;
    c.d3 = await waitFor(tok, async () => { const r = await api('GET', `/drivers/${c.drv}`, null, { quiet: true }); return r.data.status === 'AVAILABLE' && r.data; });
  }

  // ---- views ----
  function renderSeq() {
    const head = LANES.map((l) => `<div>${l}</div>`).join('');
    let n = 0;
    const rows = H.sc.steps.map((s, si) => {
      if (!s.row) return `<div class="sq-trip" id="sq-${si}">🚗 the trip · real PUT /location calls (AC-03)</div>`;
      const r = s.row, i = n++;
      const lo = Math.min(r.f, r.t), hi = Math.max(r.f, r.t), self = r.f === r.t;
      const left = ((lo + 0.5) / LANES.length) * 100, width = self ? 5 : ((hi - lo) / LANES.length) * 100;
      const lane = (k) => LANES[k].replace('-svc', '');
      return `<div class="sq-row" id="sq-${si}" data-step="${si}">
        <div class="sq-txt"><b>${i + 1}</b> ${esc(typeof r.txt === 'function' ? r.txt(H.c) : r.txt)} <span class="sq-who">${self ? lane(r.f) : `${lane(r.f)} → ${lane(r.t)}`}</span></div>
        <div class="sq-lanes">${LANES.map(() => '<i></i>').join('')}
          <div class="sq-arrow ${self ? 'self' : r.t < r.f ? 'rtl' : 'ltr'} ${r.async ? 'async' : ''}" style="left:${left}%;width:${width}%"></div>
        </div>
        <div class="sq-ev"><span class="sq-ac">${r.ac}</span><span class="sq-proof">waiting…</span><span class="sq-t"></span><span class="sq-tr"></span></div>
      </div>`;
    }).join('');
    $('#tab-seq').innerHTML = `<div class="sq-head">${head}</div>${rows}
      <div class="sq-foot">Same flow as <code>docs/sequence-diagram.md</code> ${H.sc.ref}. Dashed = async via Redpanda (outbox → topic → inbox). Click a lit arrow to revisit it; <b>trace ↗</b> opens the ride's full trace in Grafana.</div>`;
  }
  // Redis buttons: run the command through RedisInsight's own API (it saves it in Workbench history),
  // then open Workbench so the result is already there. The result is also shown under Details.
  const fmtRedis = (v, pad = '') => (Array.isArray(v) ? (v.length ? v.map((x, i) => `${pad}${i + 1}) ${Array.isArray(x) ? '\n' + fmtRedis(x, pad + '   ') : x ?? '(nil)'}`).join('\n') : `${pad}(empty)`) : `${pad}${v ?? '(nil)'}`);
  $('#capLinks').addEventListener('click', async (e) => {
    const a = e.target.closest('a[data-cmd]'); if (!a) return;
    e.preventDefault();
    const cmds = a.dataset.cmd.split('\n').filter(Boolean);
    navigator.clipboard?.writeText(a.dataset.cmd).catch(() => {});
    const w = window.open('', a.target); // open now (inside the click) so the popup is not blocked
    try {
      const r = await fetch(`${TOOLS.redis}/api/databases/${RI_DB}/workbench/command-executions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: cmds, mode: 'ASCII', resultsMode: 'DEFAULT', type: 'WORKBENCH' }),
      });
      if (!r.ok) throw new Error(`RedisInsight → ${r.status}`);
      const runs = await r.json();
      const d = $('#capDetail');
      d.textContent = runs.map((x) => `> ${x.command}\n${x.result.map((y) => (y.status === 'success' ? fmtRedis(y.response) : `(error) ${y.response}`)).join('\n')}`).join('\n\n');
      d.hidden = false; $('#cDetail').classList.add('on');
      toast('Ran in RedisInsight Workbench (expand the row there). Result also under Details. This is Redis now, not at this step.');
    } catch {
      toast('Could not run it in RedisInsight. The command is copied: paste (⌘V) in Workbench and run (⌘/Ctrl+Enter).', true);
    }
    if (w) w.location.href = a.href; else window.open(a.href, a.target);
  });
  $('#tab-seq').addEventListener('click', (e) => {
    if (e.target.closest('a')) return; // a trace link, not a step change
    const row = e.target.closest('[data-step]');
    if (!row || !H.active) return;
    const i = +row.dataset.step;
    if (i <= H.reached && !H.busy) { happyPause(); happyGo(i, false); }
  });

  function renderSeqState() {
    const traces = traceLinks(H.c);
    H.sc.steps.forEach((s, si) => {
      const row = $('#sq-' + si); if (!row) return;
      row.classList.toggle('done', si <= H.idx);
      row.classList.toggle('now', si === H.idx);
      row.classList.toggle('reached', si <= H.reached);
      if (!s.row) return;
      const proof = row.querySelector('.sq-proof'), t = row.querySelector('.sq-t'), trc = row.querySelector('.sq-tr');
      trc.innerHTML = si <= H.reached ? traces.map(([lab, url]) => `<a href="${esc(url)}" target="kvp-grafana" rel="noopener" title="Full trace of this ride in Grafana (Tempo)">${esc(lab)} ↗</a>`).join('') : '';
      if (si <= H.reached) {
        try {
          proof.innerHTML = s.proof(H.c);
          t.textContent = s.at ? T(H.c, s.at(H.c), s.from ? s.from(H.c) : H.c.T0, s.after) : '';
        } catch { proof.textContent = '…'; }
      } else { proof.textContent = si === H.idx ? 'running…' : 'waiting…'; t.textContent = ''; }
    });
    $('#sq-' + H.idx)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function renderInfo() {
    const s = H.sc.steps[H.idx], c = H.c, ready = H.idx <= H.reached;
    say(s.kicker, s.title, s.text(c));
    const links = ready ? s.links.map((f) => { try { return f(c); } catch { return null; } }).filter(Boolean) : [];
    // Every step: the full trace of each ride in this scenario, one click away.
    if (ready) links.unshift(...traceLinks(c).map(([lab, url]) => ['Grafana', `full ${lab}`, url]));
    const groups = {};
    links.forEach(([tool, label, url, copy]) => {
      (groups[tool] ||= []).push(`<a href="${esc(url)}" target="kvp-${tool.toLowerCase()}" rel="noopener"${copy ? ` data-cmd="${esc(copy)}" title="Opens Workbench and copies:\n${esc(copy)}"` : ''}>${esc(label)} ${copy ? '⧉' : '↗'}</a>`);
    });
    $('#capLinks').innerHTML = Object.entries(groups).map(([tool, as]) => `<span class="lk lk-${tool.toLowerCase()}"><i>${tool}</i>${as.join('')}</span>`).join('');
    let detail = null;
    if (ready && s.detail) { try { detail = s.detail(c); } catch { /* not recorded */ } }
    $('#capDetail').textContent = detail ? JSON.stringify(detail, null, 2) : 'No recorded data for this step yet.';
    renderSeqState();
    updateCtrl();
  }

  const driverStatusAt = (i) => (i < 6 ? 'AVAILABLE' : i <= 10 ? 'OFFERED' : i <= 15 ? 'BUSY' : 'AVAILABLE');
  const rideStatusAt = (i) => (i < 3 ? 'REQUESTED' : i < 8 ? 'MATCHING' : i < 12 ? 'DRIVER_ASSIGNED' : i < 14 ? 'DRIVER_ACCEPTED' : 'COMPLETED');

  async function happyMap(i, forward, tok) {
    const c = H.c, P = PLACES.opera, drv = c.drv || 'D001';
    sceneLayer.clearLayers();
    pin(P, 'pickup', 'P001 pickup'); pin(PLACES.tandinh, 'dest', 'destination');
    // Driver and ride as they were at step i (the API itself is already further along).
    S.override.set(drv, driverStatusAt(i));
    if (c.R1) S.rideOverride[c.R1] = { status: rideStatusAt(i), assignedDriverId: i >= 8 ? drv : null };
    const start = H.layout.find((d) => d.id === drv);
    if (i < 13) S.posOverride.set(drv, [start.lat, start.lng]);
    else if (c.dTrip) S.posOverride.set(drv, [c.dTrip.latitude, c.dTrip.longitude]);
    else S.posOverride.delete(drv);
    // Live countdown while the offer is really pending; frozen at full when replaying an old step.
    S.ringOverride = i >= 7 && i <= 10 && c.offer ? new Map([[drv, H.reached >= 10 ? { ...c.offer, frozen: true } : c.offer]]) : null;
    if (!forward && i < 13) map.flyTo(P, 14.4, { duration: 0.5 });
    const d = S.drivers.get(drv); if (d) renderDriver(d);
    S.markers.forEach((_, id) => drvEl(id)?.classList.toggle('win', id === drv && i >= 5 && i <= 10));
    renderRideCard();

    const m = S.markers.get(drv);
    m?.closePopup(); m?.unbindPopup();
    if (i === 9 && c.off?.data) {
      m.bindPopup(`<div class="popup"><h4>New ride request</h4><div class="meta">Pickup Opera House · ${fmtM(haversine([start.lat, start.lng], P))} away<br>Respond before ${fmtT(c.off.data.expiresAt).slice(0, 8)}</div><div class="row"><button class="acc">Accept</button><button class="rej">Reject</button></div></div>`, { offset: [0, -12], closeButton: false, autoClose: false }).openPopup();
    }
    if (i === 10 && c.acc?.data) m.bindPopup(`<div class="popup"><h4 style="color:var(--available)">Accepted ✓</h4><div class="meta">offer ${ev(c.acc.data.offerId)} · ${c.acc.data.status}</div></div>`, { offset: [0, -12], closeButton: false, autoClose: false }).openPopup();

    if (i >= 4 && i <= 12) {
      const radius = c.x1?.saga.radiusM || 2000;
      if (forward && i === 4) await growCircle(P, radius);
      else L.circle(P, { radius, color: '#7c9cff', weight: 1.5, fillColor: '#7c9cff', fillOpacity: 0.07, dashArray: '4 6', interactive: false }).addTo(sceneLayer);
      label(offset(P, radius, 90), `radius ${fmtM(radius)}`, 'radius-label');
      const ranked = H.layout.filter((x) => ['D001', 'D002', 'D003', 'D011'].includes(x.id))
        .map((x) => ({ ...x, dist: haversine(P, [x.lat, x.lng]) })).sort((a, b) => a.dist - b.dist);
      let rank = 0;
      for (const x of ranked) {
        if (forward && i === 4) { await sleep(220); if (tok !== S.token) return; }
        const pos = [x.lat, x.lng];
        if (x.status === 'OFFLINE') { line(P, pos, { color: '#6b7280', dashArray: '2 6' }); label(lerp(P, pos, 0.6), `${x.id} offline`, 'off'); }
        else if (x.dist > radius) { line(P, pos, { color: '#ef4444', dashArray: '2 6' }); label(lerp(P, pos, 0.7), `${x.id} ${fmtM(x.dist)} · outside`, 'out'); }
        else { rank++; line(P, pos, { color: '#22c55e', className: 'flow-line', weight: rank === 1 ? 4 : 2 }); label(lerp(P, pos, 0.6), `#${rank} ${x.id} · ${fmtM(x.dist)}`, rank === 1 ? 'rank' : 'in'); }
      }
    }
  }

  function updateCtrl() {
    const last = H.sc.steps.length - 1;
    $('#cPrev').disabled = H.busy || H.idx <= 0;
    $('#cNext').disabled = H.busy || H.failed || H.idx >= last;
    $('#cPlay').disabled = H.busy && !H.playing || H.failed || H.idx >= last;
    $('#cPlay').textContent = H.playing ? '⏸ Pause' : '▶ Play';
    $('#cNext').textContent = H.busy ? 'running…' : H.idx + 1 > H.reached && H.idx < last ? 'Run next ▶' : 'Next ▶';
    $('#cPos').textContent = `${H.idx + 1} / ${H.sc.steps.length}`;
  }

  // ---- navigation ----
  async function happyGo(i, forward) {
    const tok = H.tok;
    H.idx = i;
    renderInfo();
    await H.sc.map(i, forward, tok);
  }
  async function happyNext() {
    if (H.busy || H.failed || H.idx >= H.sc.steps.length - 1) return;
    const i = H.idx + 1, s = H.sc.steps[i], tok = H.tok;
    try {
      if (i > H.reached) {
        H.busy = true; updateCtrl();
        if (s.live) { H.idx = i; renderInfo(); await H.sc.map(i, true, tok); }
        if (s.run) await s.run(H.c, tok);
        if (tok !== H.tok) return;
        H.reached = i; H.busy = false;
        if (s.live) { renderInfo(); if (i === 0) await H.sc.map(i, false, tok); return; }
      }
      await happyGo(i, true);
    } catch (e) {
      if (tok !== H.tok || e instanceof Abort) return;
      H.busy = false; H.failed = true; H.playing = false;
      say('Stopped by the API', e.happy ? 'The offer is no longer pending' : e.message, e.happy || `${esc(e.message)}. Press <b>■ Stop</b> and run again.`);
      renderSeqState();
      updateCtrl();
    }
  }
  function happyPrev() { if (!H.busy && H.idx > 0) { happyPause(); happyGo(H.idx - 1, false); } }
  function happyPause() { H.playing = false; H.loop++; updateCtrl(); }
  async function happyPlay() {
    if (H.failed || H.idx >= H.sc.steps.length - 1) return;
    H.playing = true; const loop = ++H.loop; updateCtrl();
    while (H.playing && loop === H.loop && H.idx < H.sc.steps.length - 1 && !H.failed) {
      await happyNext();
      if (!H.playing || loop !== H.loop) break;
      await sleep(H.sc.steps[H.idx]?.trip ? 300 : DWELL);
    }
    if (loop === H.loop) { H.playing = false; updateCtrl(); }
  }
  async function happyStop({ quiet = false } = {}) {
    if (!H.active) return;
    H.active = false; H.playing = false; H.loop++; H.tok = ++S.token;
    $('#ctrl').hidden = true; $('#capLinks').innerHTML = ''; $('#capDetail').hidden = true;
    S.override.clear(); S.posOverride.clear(); S.rideOverride = {}; S.ringOverride = null;
    S.markers.forEach((m) => { m.closePopup(); m.unbindPopup(); });
    sql(null);
    let cancelled = false;
    for (const id of H.sc.rides(H.c).filter(Boolean)) {
      const r = await getRide(id).catch(() => null);
      if (r && !TERMINAL.has(r.status)) { await api('POST', `/rides/${id}/cancel`); cancelled = true; }
    }
    poll();
    H.finish?.();
    if (!quiet) say('Stopped', `${H.sc.title} stopped`, cancelled ? 'Open rides were <b>cancelled</b> (POST /cancel), so their drivers are released. Press <b>Run</b> to start again.' : 'Press <b>Run</b> to start again.');
  }

  // Runs one step-player scenario (PLAYERS): the happy path or a sequence-diagram flow.
  async function scenePlayer(tok, key) {
    const sc = PLAYERS[key];
    Object.assign(H, { active: true, sc, idx: -1, reached: -1, playing: false, busy: false, failed: false, c: {}, tok });
    H.layout = sc.layout();
    H.c.cfg = await getConfig();
    renderSeq();
    showTab('seq');
    map.flyTo(sc.center, sc.zoom || 14.4, { duration: 0.8 });
    await resetCity(tok, H.layout);
    $('#ctrl').hidden = false;
    const done = new Promise((res) => { H.finish = res; });
    if (S.stepMode) { await happyNext(); happyPause(); } else happyPlay();
    S.running = false; setButtons(); // the player stays active; other buttons work again
    await done;
  }

  $('#cNext').addEventListener('click', () => { happyPause(); happyNext(); });
  $('#cPrev').addEventListener('click', happyPrev);
  $('#cPlay').addEventListener('click', () => (H.playing ? happyPause() : happyPlay()));
  $('#cStop').addEventListener('click', () => happyStop());
  $('#cDetail').addEventListener('click', () => { const d = $('#capDetail'); d.hidden = !d.hidden; $('#cDetail').classList.toggle('on', !d.hidden); });
  setInterval(() => {
    const w = $('#cWarn');
    const offer = H.active && H.sc.pendingOffer?.(H.c, H.reached);
    if (!offer) { w.textContent = ''; return; }
    const left = Math.round((new Date(offer.expiresAt) - Date.now()) / 1000);
    w.className = left <= 0 ? 'bad' : left <= 10 ? 'warn' : '';
    w.textContent = left > 0 ? `offer expires in ${left}s` : 'offer expired: accept will fail (AC-05 timeout)';
  }, 500);


  // ---------- dispatch config (Redis config:dispatch) ----------
  async function getConfig() {
    try {
      const r = await api('GET', '/dispatch/config', null, { quiet: true });
      if (r.ok) S.cfg = r.data;
    } catch { /* gateway down */ }
    renderConfig();
    return S.cfg;
  }
  function renderConfig() {
    const c = S.cfg;
    if (document.activeElement !== $('#cfgRadius')) $('#cfgRadius').value = c.matchRadiusM;
    if (document.activeElement !== $('#cfgTimeout')) $('#cfgTimeout').value = c.offerTimeoutSeconds;
    $('#cfgSrc').textContent = c.source === 'default' ? 'defaults (Redis unavailable)' : `Redis · ${c.redisKey || 'config:dispatch'}`;
  }
  $('#cfgSave').addEventListener('click', async () => {
    const r = await api('PUT', '/dispatch/config', { matchRadiusM: +$('#cfgRadius').value, offerTimeoutSeconds: +$('#cfgTimeout').value });
    if (!r.ok) { toast(`${r.status} ${r.data?.code}: ${r.data?.detail || ''}`, true); return; }
    S.cfg = r.data; renderConfig();
    toast(`Saved to Redis: radius ${fmtM(r.data.matchRadiusM)}, offer timeout ${r.data.offerTimeoutSeconds} s. New rides and offers use it.`);
  });
  const secs = (c) => c.cfg?.offerTimeoutSeconds ?? 30;
  const km = (c) => fmtM(c.cfg?.matchRadiusM ?? 2000);

  // ---------- step-player helpers shared by the sequence scenarios ----------
  // Full trace of every ride in the scenario: [label, Grafana URL].
  function traceLinks(c) {
    if (!H.sc) return [];
    return H.sc.traces(c).filter(([, id]) => id).map(([lab, id]) => [lab, gTraceId(id)]);
  }
  const offerOf = (x, drv) => (x?.offers || []).filter((o) => o.driverId === drv).pop();
  const stepsOf = (x, name, drv) => (x?.steps || []).filter((s) => s.step === name && (!drv || s.driverId === drv));
  const lastTr = (h, to, from) => (h?.transitions || []).filter((t) => t.to === to && (!from || t.from === from)).pop();
  const driver = async (id) => (await api('GET', `/drivers/${id}`, null, { quiet: true })).data;
  const waitDriver = (tok, id, status) => waitFor(tok, async () => { const d = await driver(id); return d.status === status && !d.currentRideId === (status === 'AVAILABLE') && d; }, 15000);
  const assignedTo = (tok, id, not) => waitFor(tok, async () => { const r = await getRide(id); return r.status === 'DRIVER_ASSIGNED' && r.assignedDriverId !== not && r; }, 15000);

  // Shows statuses as they were at step i (the API is already further along).
  function showAt(drivers, rides) {
    S.override.clear();
    Object.entries(drivers).forEach(([id, st]) => st && S.override.set(id, st));
    S.rideOverride = rides;
    S.drivers.forEach((d) => renderDriver(d));
    renderRideCard();
  }
  // Pickup, radius and candidate lines. marks: driverId → 'rank' | 'excluded' | 'lost' | 'win'.
  function drawCandidates(P, radius, ids, marks = {}) {
    L.circle(P, { radius, color: '#7c9cff', weight: 1.5, fillColor: '#7c9cff', fillOpacity: 0.07, dashArray: '4 6', interactive: false }).addTo(sceneLayer);
    label(offset(P, radius, 90), `radius ${fmtM(radius)}`, 'radius-label');
    const ranked = H.layout.filter((x) => ids.includes(x.id)).map((x) => ({ ...x, dist: haversine(P, [x.lat, x.lng]) }))
      .sort((a, b) => a.dist - b.dist || a.id.localeCompare(b.id));
    let rank = 0;
    for (const x of ranked) {
      const pos = [x.lat, x.lng], m = marks[x.id];
      if (x.status === 'OFFLINE') { line(P, pos, { color: '#6b7280', dashArray: '2 6' }); label(lerp(P, pos, 0.6), `${x.id} offline`, 'off'); continue; }
      if (x.dist > radius) { line(P, pos, { color: '#ef4444', dashArray: '2 6' }); label(lerp(P, pos, 0.7), `${x.id} ${fmtM(x.dist)} · outside`, 'out'); continue; }
      if (m === 'excluded') { line(P, pos, { color: '#ef4444', dashArray: '2 6' }); label(lerp(P, pos, 0.6), `${x.id} rejected · excluded`, 'out'); continue; }
      rank++;
      line(P, pos, { color: '#22c55e', className: rank === 1 ? 'flow-line' : '', weight: rank === 1 ? 4 : 2 });
      label(lerp(P, pos, 0.6), `#${rank} ${x.id} · ${fmtM(x.dist)}`, rank === 1 ? 'rank' : 'in');
    }
  }
  const step = (o) => o; // readability: a step of a sequence scenario

  // ---------- sequence §2: reject → rematch (AC-05, AC-07) ----------
  const REJ = { P: PLACES.opera, DEST: PLACES.tandinh, ids: ['D001', 'D002', 'D003', 'D011'] };
  async function rejSetup(c, tok) {
    c.created = await createRide('P002', REJ.P, REJ.DEST, `reject-${Date.now()}`);
    if (!c.created.ok) throw new Error(`POST /rides → ${c.created.status}`);
    c.R1 = c.created.data.rideId; c.traceId = c.created.data.traceId;
    focusRides([c.R1]);
    const r = await assignedTo(tok, c.R1);
    c.drv1 = r.assignedDriverId;
    [c.x1, c.h1] = await Promise.all([getDispatch(c.R1), getHistory(c.R1)]);
    c.o1 = offerOf(c.x1, c.drv1);
    c.traceId = c.traceId || r.traceId;
  }
  async function rejReject(c, tok) {
    c.rej = await api('POST', `/rides/${c.R1}/offers/${c.drv1}/reject`);
    if (!c.rej.ok) { const e = new Error(c.rej.data?.code || String(c.rej.status)); e.happy = `Reject refused: <b>${esc(c.rej.data?.code)}</b>. If the ${secs(c)} s offer expired while paused, the saga already treated it as a rejection. Stop and run again.`; throw e; }
    const r = await assignedTo(tok, c.R1, c.drv1);
    c.drv2 = r.assignedDriverId;
    [c.x2, c.h2, c.dA, c.dB] = await Promise.all([getDispatch(c.R1), getHistory(c.R1), driver(c.drv1), driver(c.drv2)]);
    c.o2 = offerOf(c.x2, c.drv2);
  }
  const REJECT = [
    step({ row: { f: LP, t: LRS, txt: 'POST /rides → offer to the nearest (D001)', ac: 'AC-04' }, live: true,
      kicker: 'Setup · AC-01 → AC-05', title: 'Ride R1 is offered to the nearest driver',
      text: (c) => `Same start as the happy path: <b>POST /rides</b> → saga → nearest AVAILABLE driver within ${km(c)} → offer <b>O1 PENDING</b> (${secs(c)} s).`,
      run: rejSetup,
      proof: (c) => `ride <b>${ev(c.R1)}</b> <b>DRIVER_ASSIGNED</b> to <b>${c.drv1}</b> · offer O1 <b>PENDING</b>`,
      detail: (c) => ({ ride: c.created.data, offer: c.o1 }),
      links: [logs('dispatch-service'), table('dispatch_db', 'offers', 'ride_id', 'R1'), redisConfig] }),
    step({ row: { f: LD, t: LXS, txt: 'POST …/offers/D001/reject', ac: 'AC-05' },
      kicker: 'Step 2 · AC-05 reject', title: 'D001 rejects the offer',
      text: () => 'Only the driver holding the current offer can answer. One conditional <b>UPDATE offers … WHERE status=\'PENDING\'</b>: reject, accept, timeout and cancel race on that row and exactly one wins.',
      run: rejReject,
      proof: (c) => `<b>${c.rej.status}</b> · offer O1 <b>${c.rej.data?.status}</b> · ${Math.round(c.rej.ms)} ms`,
      detail: (c) => c.rej.data,
      links: [table('dispatch_db', 'offers', 'ride_id', 'R1'), logs('dispatch-service')] }),
    step({ row: { f: LXS, t: LXS, txt: '[tx] O1 REJECTED + exclusion(R1, D001), saga MATCHING', ac: 'AC-07' },
      kicker: 'Step 3 · AC-07 exclusion', title: 'D001 is excluded from R1 for good',
      text: () => 'In one transaction: the offer becomes <b>REJECTED</b>, <b>ride_exclusions(R1, D001)</b> is inserted, the saga goes back to <b>MATCHING</b>, and two compensations go to the outbox: <b>ReleaseDriver</b> and <b>UnassignDriver</b>.',
      proof: (c) => `excluded: <b>${Object.entries(c.x2.exclusions || {}).map(([d, w]) => `${d} (${w})`).join(', ')}</b> · “${esc(stepsOf(c.x2, 'MATCHING', c.drv1).pop()?.detail || '')}”`,
      at: (c) => stepsOf(c.x2, 'MATCHING', c.drv1).pop()?.at,
      detail: (c) => ({ exclusions: c.x2.exclusions, offer: offerOf(c.x2, c.drv1), step: stepsOf(c.x2, 'MATCHING', c.drv1).pop() }),
      links: [table('dispatch_db', 'ride_exclusions', 'ride_id', 'R1'), table('dispatch_db', 'saga_steps', 'ride_id', 'R1', 'id'), table('dispatch_db', 'outbox', 'msg_key', 'R1', 'id')] }),
    step({ row: { f: LXS, t: LDS, txt: 'ReleaseDriver → D001 OFFERED → AVAILABLE', ac: 'AC-02', async: true },
      kicker: 'Step 4 · AC-02 compensation', title: 'D001 is free again, for other rides',
      text: () => 'driver-service applies <b>OFFERED → AVAILABLE</b>, only <b>WHERE current_ride_id = R1</b>, so a late release can never free a driver who moved on. D001 goes back into Redis GEO.',
      proof: (c) => `${c.drv1} <b>${c.dA.status}</b> · currentRideId <b>${c.dA.currentRideId ? ev(c.dA.currentRideId) : 'null'}</b>`,
      at: (c) => c.dA.updatedAt,
      detail: (c) => c.dA,
      links: [topic('driver.commands.v1', 'drv1'), table('driver_db', 'drivers', 'id', 'drv1'), redisDrv('drv1')] }),
    step({ row: { f: LXS, t: LRS, txt: 'UnassignDriver → DRIVER_ASSIGNED → MATCHING', ac: 'AC-06', async: true },
      kicker: 'Step 5 · AC-06 state machine', title: 'Ride back to MATCHING, assignedDriverId cleared',
      text: () => 'The rejection transition: <b>DRIVER_ASSIGNED → MATCHING</b> with <b>assignedDriverId = null</b>, persisted in the state history. Commands are keyed by rideId, so Unassign and the next Assign arrive in order.',
      proof: (c) => { const t = lastTr(c.h2, 'MATCHING', 'DRIVER_ASSIGNED'); return t ? `<b>DRIVER_ASSIGNED → MATCHING</b> · ${esc(t.action)}` : '…'; },
      at: (c) => lastTr(c.h2, 'MATCHING', 'DRIVER_ASSIGNED')?.at,
      detail: (c) => lastTr(c.h2, 'MATCHING', 'DRIVER_ASSIGNED'),
      links: [topic('ride.commands.v1'), table('ride_db', 'ride_transitions', 'ride_id', 'R1', 'id')] }),
    step({ row: { f: LXS, t: LR, txt: 'GEOSEARCH again, skipping {D001} → D002', ac: 'AC-07' },
      kicker: 'Step 6 · AC-07 rematch', title: 'A new query, not the old list',
      text: () => 'Matching runs again from Redis. D001 is AVAILABLE and the nearest, but it is in this ride\'s exclusions, so the next nearest eligible driver is chosen.',
      proof: (c) => `“${esc(stepsOf(c.x2, 'RESERVING').pop()?.detail || '')}” → <b>${c.drv2}</b>`,
      at: (c) => stepsOf(c.x2, 'RESERVING').pop()?.at,
      detail: (c) => stepsOf(c.x2, 'RESERVING'),
      links: [redis('GEOSEARCH', (c) => `GEOSEARCH ${GEO} FROMLONLAT ${c.x2.saga.pickup.longitude} ${c.x2.saga.pickup.latitude} BYRADIUS ${c.x2.saga.radiusM} m ASC WITHDIST`), table('dispatch_db', 'saga_steps', 'ride_id', 'R1', 'id')] }),
    step({ row: { f: LXS, t: LDS, txt: "ReserveDriver(D002): UPDATE … WHERE status='AVAILABLE'", ac: 'AC-09', async: true },
      kicker: 'Step 7 · AC-09', title: 'D002 is reserved atomically',
      text: () => 'Same compare-and-set as every reservation: 1 row = reserved, 0 rows = someone else won.',
      proof: (c) => `${c.drv2} <b>AVAILABLE → OFFERED</b> · currentRideId <b>${ev(c.dB.currentRideId)}</b>`,
      at: (c) => c.dB.updatedAt,
      detail: (c) => c.dB,
      links: [table('driver_db', 'drivers', 'id', 'drv2'), redisDrv('drv2'), logs('driver-service')] }),
    step({ row: { f: LXS, t: LRS, txt: 'AssignDriver(D002) → DRIVER_ASSIGNED', ac: 'AC-05', async: true },
      kicker: 'Step 8 · AC-05', title: 'New offer O2 to D002',
      text: (c) => `Offer <b>O2 PENDING</b> with a fresh ${secs(c)} s timer. D001 never sees R1 again.`,
      proof: (c) => `<b>MATCHING → DRIVER_ASSIGNED</b> · ${c.drv2} · offer O2 <b>${c.o2?.status}</b>`,
      at: (c) => lastTr(c.h2, 'DRIVER_ASSIGNED')?.at,
      detail: (c) => ({ transition: lastTr(c.h2, 'DRIVER_ASSIGNED'), offer: c.o2 }),
      links: [table('dispatch_db', 'offers', 'ride_id', 'R1'), table('ride_db', 'rides', 'id', 'R1')] }),
    step({ row: { f: LD, t: LXS, txt: 'D002 accepts (pivot)', ac: 'AC-05' },
      kicker: 'Step 9 · AC-05 accept', title: 'D002 accepts',
      text: () => 'The pivot: from here the saga only moves forward. Ride <b>DRIVER_ACCEPTED</b>, driver <b>BUSY</b>.',
      run: async (c, tok) => {
        c.acc = await api('POST', `/rides/${c.R1}/offers/${c.drv2}/accept`);
        if (!c.acc.ok) { const e = new Error(c.acc.data?.code); e.happy = `Accept refused: <b>${esc(c.acc.data?.code)}</b> (offer expired while paused?). Stop and run again.`; throw e; }
        await waitFor(tok, async () => (await getRide(c.R1)).status === 'DRIVER_ACCEPTED');
      },
      proof: (c) => `<b>${c.acc.status}</b> · offer O2 <b>${c.acc.data?.status}</b>`,
      detail: (c) => c.acc.data,
      links: [table('dispatch_db', 'offers', 'ride_id', 'R1'), logs('dispatch-service')] }),
    step({ row: { f: LD, t: LRS, txt: 'Complete → D002 AVAILABLE · D001 never re-offered', ac: 'AC-07' },
      kicker: 'Done · AC-07', title: 'Rematched, accepted, completed',
      text: (c) => `Offers for this ride: <b>${(c.x3?.offers || []).map((o) => `${o.driverId} ${o.status}`).join(' · ')}</b>. The rejected driver stayed AVAILABLE for other rides the whole time.`,
      run: async (c, tok) => {
        c.done = await api('POST', `/rides/${c.R1}/complete`);
        c.dB2 = await waitDriver(tok, c.drv2, 'AVAILABLE');
        c.x3 = await getDispatch(c.R1);
      },
      proof: (c) => `<b>${c.done.data?.status}</b> · ${c.drv2} <b>AVAILABLE</b> · excluded: <b>${Object.keys(c.x3.exclusions || {}).join(', ')}</b>`,
      detail: (c) => ({ offers: c.x3.offers, exclusions: c.x3.exclusions }),
      links: [table('dispatch_db', 'offers', 'ride_id', 'R1'), table('ride_db', 'ride_transitions', 'ride_id', 'R1', 'id'), logs(null)] }),
  ];
  async function rejMap(i, forward, tok) {
    const c = H.c, d1 = c.drv1 || 'D001', d2 = c.drv2 || 'D002';
    sceneLayer.clearLayers();
    pin(REJ.P, 'pickup', 'P002 pickup'); pin(REJ.DEST, 'dest', 'destination');
    const radius = c.x1?.saga.radiusM || c.cfg?.matchRadiusM || 2000;
    if (forward && i === 0) await growCircle(REJ.P, radius);
    if (tok !== S.token) return;
    drawCandidates(REJ.P, radius, REJ.ids, i >= 2 ? { [d1]: 'excluded' } : {});
    showAt(
      { [d1]: i <= 2 ? 'OFFERED' : 'AVAILABLE', [d2]: i < 6 ? 'AVAILABLE' : i <= 7 ? 'OFFERED' : i === 8 ? 'BUSY' : 'AVAILABLE' },
      c.R1 ? { [c.R1]: { status: i <= 3 ? 'DRIVER_ASSIGNED' : i <= 6 ? 'MATCHING' : i === 7 ? 'DRIVER_ASSIGNED' : i === 8 ? 'DRIVER_ACCEPTED' : 'COMPLETED',
        assignedDriverId: i <= 3 ? d1 : i <= 6 ? null : d2 } } : {});
    S.ringOverride = i <= 1 && c.o1 ? new Map([[d1, H.reached >= 2 ? { ...c.o1, frozen: true } : c.o1]])
      : i === 7 && c.o2 ? new Map([[d2, H.reached >= 8 ? { ...c.o2, frozen: true } : c.o2]]) : null;
    S.markers.forEach((_, id) => drvEl(id)?.classList.toggle('win', (id === d1 && i <= 1) || (id === d2 && i >= 5 && i <= 8)));
  }

  // ---------- sequence §4: two rides race for the same driver (AC-09) ----------
  const RACE = (() => { const Hh = PLACES.benthanh; return { H: Hh, A: offset(Hh, 380, 270), B: offset(Hh, 380, 90), DEST: PLACES.notredame }; })();
  async function raceSetup(c, tok) {
    const t0 = performance.now();
    const [ra, rb] = await Promise.all([createRide('P003', RACE.A, RACE.DEST), createRide('P004', RACE.B, RACE.DEST)]);
    if (!ra.ok || !rb.ok) throw new Error('POST /rides failed');
    c.gap = Math.round(performance.now() - t0);
    c.RA = ra.data.rideId; c.RB = rb.data.rideId; c.trA = ra.data.traceId; c.trB = rb.data.traceId;
    focusRides([c.RA, c.RB], { [c.RA]: 'A', [c.RB]: 'B' });
    const [x, y] = await waitFor(tok, async () => {
      const [p, q] = await Promise.all([getRide(c.RA), getRide(c.RB)]);
      return p.status === 'DRIVER_ASSIGNED' && q.status === 'DRIVER_ASSIGNED' && [p, q];
    }, 15000, 120);
    c.rA = x; c.rB = y;
    [c.xA, c.xB] = await Promise.all([getDispatch(c.RA), getDispatch(c.RB)]);
    c.winA = x.assignedDriverId === 'D001';
    const [W, Lk] = c.winA ? ['A', 'B'] : ['B', 'A'];
    Object.assign(c, { W, Lk, xW: c.winA ? c.xA : c.xB, xL: c.winA ? c.xB : c.xA, loserDrv: (c.winA ? y : x).assignedDriverId, RL: c.winA ? c.RB : c.RA });
    c.lostStep = stepsOf(c.xL, 'MATCHING').find((s) => /taken by another ride/.test(s.detail || ''));
    c.collided = !!c.lostStep;
    c.first = (xx) => stepsOf(xx, 'RESERVING')[0];
    c.dW = await driver('D001'); c.dL = await driver(c.loserDrv);
    c.double = x.assignedDriverId === y.assignedDriverId;
  }
  const RACE_STEPS = [
    step({ row: { f: LP, t: LRS, txt: 'A and B: POST /rides at the same instant', ac: 'AC-09' }, live: true,
      kicker: 'Step 1 · AC-09 the race', title: 'Two passengers, 380 m from D001 each',
      text: () => 'P003 (A) and P004 (B) are both <b>380 m</b> from D001, the nearest driver. Both <b>POST /rides</b> are sent together (Promise.all).',
      run: raceSetup,
      proof: (c) => `A <b>${ev(c.RA)}</b> · B <b>${ev(c.RB)}</b> · both <b>201</b> in ${c.gap} ms`,
      detail: (c) => ({ A: c.rA, B: c.rB }),
      links: [logs('ride-service', 'RA', 'A '), logs('ride-service', 'RB', 'B ')] }),
    step({ row: { f: LRS, t: LXS, txt: 'RideRequested ×2 → two sagas', ac: 'AC-10', async: true },
      kicker: 'Step 2 · AC-10', title: 'Two independent sagas start',
      text: () => 'Each ride has its own saga (primary key = rideId) and runs on its own partition. Nothing coordinates them: the database will.',
      proof: (c) => `saga A <b>STARTED</b> ${T(c, stepsOf(c.xA, 'STARTED')[0]?.at, c.rA.createdAt, 'request')} · saga B <b>STARTED</b>`,
      at: (c) => stepsOf(c.xA, 'STARTED')[0]?.at,
      detail: (c) => ({ A: stepsOf(c.xA, 'STARTED')[0], B: stepsOf(c.xB, 'STARTED')[0] }),
      links: [topic('ride.events.v1', 'RA'), table('dispatch_db', 'dispatch_sagas', 'ride_id', 'RA'), table('dispatch_db', 'dispatch_sagas', 'ride_id', 'RB')] }),
    step({ row: { f: LXS, t: LR, txt: 'Both GEOSEARCH → nearest is D001', ac: 'AC-04' },
      kicker: 'Step 3 · AC-04', title: 'Both sagas want the same driver',
      text: () => 'Redis is a snapshot: both sagas may read D001 as AVAILABLE before either reservation lands. This is the race the challenge asks about.',
      proof: (c) => `A → <b>${c.first(c.xA)?.driverId}</b> · B → <b>${c.first(c.xB)?.driverId}</b>${c.collided ? ' · <b style="color:var(--offered)">same driver</b>' : ''}`,
      at: (c) => c.first(c.xA)?.at,
      detail: (c) => ({ A: c.first(c.xA), B: c.first(c.xB) }),
      links: [redis('GEOSEARCH', () => `GEOSEARCH ${GEO} FROMLONLAT ${RACE.H[1]} ${RACE.H[0]} BYRADIUS 2000 m ASC WITHDIST`), table('dispatch_db', 'saga_steps', 'ride_id', 'RA', 'id'), table('dispatch_db', 'saga_steps', 'ride_id', 'RB', 'id')] }),
    step({ row: { f: LXS, t: LDS, txt: 'ReserveDriver(A, D001) ∥ ReserveDriver(B, D001)', ac: 'AC-09', async: true },
      kicker: 'Step 4 · AC-09', title: 'Two reservations for D001',
      text: (c) => c.collided ? 'Both commands reach driver-service. A "read status, then write" would let both succeed (a lost update).'
        : 'This round the GEO index had already dropped D001 when the second saga searched, so only one command targeted D001. Run again to see a database collision; either way the guard is the same.',
      proof: (c) => c.collided ? 'both sagas sent <b>ReserveDriver(D001)</b>' : `only ${c.W} sent ReserveDriver(D001); ${c.Lk} went to <b>${c.loserDrv}</b>`,
      detail: (c) => ({ winner: c.first(c.xW), loser: c.first(c.xL) }),
      links: [topic('driver.commands.v1', 'RA'), logs('driver-service', 'RA', 'A '), logs('driver-service', 'RB', 'B ')] }),
    step({ row: { f: LDS, t: LDS, txt: "UPDATE … WHERE status='AVAILABLE' → 1 row ✔ / 0 rows ✘", ac: 'AC-09' },
      kicker: 'Step 5 · AC-09 compare-and-set', title: 'Postgres lets exactly one through',
      text: () => 'Row locking serialises the two UPDATEs. The second re-checks <b>status=\'AVAILABLE\'</b>, finds <b>OFFERED</b>, and updates <b>0 rows</b>. The row count is the answer: no lock service needed.',
      proof: (c) => `${c.W}: <b>1 row ✔</b> (D001 OFFERED for ${c.W}) · ${c.Lk}: ${c.collided ? '<b>0 rows ✘</b>' : 'not attempted'}`,
      at: (c) => c.dW.updatedAt,
      detail: (c) => c.dW,
      links: [table('driver_db', 'drivers', 'id', 'drvW'), redis('D001 hash + GEO', () => `HGETALL driver:D001\nGEOPOS ${GEO} D001`)] }),
    step({ row: { f: LDS, t: LXS, txt: 'DriverReservationFailed → loser tries the next driver', ac: 'AC-09', async: true },
      kicker: 'Step 6 · AC-09', title: 'The loser moves on',
      text: (c) => `Saga ${c.Lk} adds D001 to this round's skips and matches again.`,
      proof: (c) => c.collided ? `${c.Lk}: “${esc(c.lostStep.detail)}”` : `${c.Lk} skipped D001 via the GEO index`,
      at: (c) => c.lostStep?.at,
      detail: (c) => c.lostStep || stepsOf(c.xL, 'RESERVING'),
      links: [topic('dispatch.replies.v1', 'RL'), table('dispatch_db', 'saga_steps', 'ride_id', 'RL', 'id')] }),
    step({ row: { f: LXS, t: LRS, txt: 'A and B DRIVER_ASSIGNED to different drivers', ac: 'AC-09', async: true },
      kicker: 'Step 7 · AC-09 result', title: 'One driver, one ride',
      text: (c) => `${c.W} got <b>D001</b>, ${c.Lk} got <b>${c.loserDrv}</b>. ${c.double ? '<b style="color:var(--excluded)">DOUBLE BOOKING!</b>' : 'No driver holds two offers; partial unique indexes on offers back this up.'}`,
      proof: (c) => `A → <b>${c.rA.assignedDriverId}</b> · B → <b>${c.rB.assignedDriverId}</b> · double-bookings <b>${c.double ? 1 : 0}</b>`,
      detail: (c) => ({ A: c.rA, B: c.rB }),
      links: [table('dispatch_db', 'offers', 'status', 'pending'), table('ride_db', 'rides', 'id', 'RA'), table('ride_db', 'rides', 'id', 'RB')] }),
    step({ row: { f: LP, t: LRS, txt: 'Cancel both → drivers released', ac: 'AC-06' },
      kicker: 'Done · cleanup', title: 'Both rides cancelled, both drivers AVAILABLE',
      text: () => 'Cancelling before acceptance returns each OFFERED driver to AVAILABLE (saga compensation).',
      run: async (c, tok) => {
        await Promise.all([c.RA, c.RB].map((id) => api('POST', `/rides/${id}/cancel`)));
        c.relW = await waitDriver(tok, 'D001', 'AVAILABLE'); c.relL = await waitDriver(tok, c.loserDrv, 'AVAILABLE');
      },
      proof: (c) => `D001 <b>${c.relW.status}</b> · ${c.loserDrv} <b>${c.relL.status}</b>`,
      detail: (c) => ({ D001: c.relW, [c.loserDrv]: c.relL }),
      links: [logs(null, 'RA', 'A '), logs(null, 'RB', 'B ')] }),
  ];
  async function raceMap(i) {
    const c = H.c, { H: Hh, A, B } = RACE;
    sceneLayer.clearLayers();
    pin(A, 'pickup', 'P003', 'A'); pin(B, 'pickup', 'P004', 'B'); pin(RACE.DEST, 'dest', 'destination');
    label(lerp(A, Hh, 0.5), fmtM(haversine(A, Hh)), 'in'); label(lerp(B, Hh, 0.5), fmtM(haversine(B, Hh)), 'in');
    c.drvW = 'D001'; c.pending = 'PENDING';
    if (i < 4 || !c.RA) {
      line(A, Hh, { color: '#f59e0b', weight: 3, className: 'bolt' }); line(B, Hh, { color: '#f59e0b', weight: 3, className: 'bolt' });
    } else {
      const [wp, lp] = c.winA ? [A, B] : [B, A];
      line(wp, Hh, { color: '#22c55e', weight: 4 }); line(lp, Hh, { color: '#ef4444', dashArray: '3 6', weight: 2 });
      label(lerp(wp, Hh, 0.5), `${c.W} wins D001`, 'rank');
      if (i >= 5) line(lp, posOf(c.loserDrv), { color: '#22c55e', weight: 3, className: 'flow-line' });
    }
    sql(i >= 3 && i <= 5 ? RACE_SQL : null);
    const ld = c.loserDrv || 'D002';
    showAt({ D001: i < 4 ? 'AVAILABLE' : i <= 6 ? 'OFFERED' : 'AVAILABLE', [ld]: i < 6 ? 'AVAILABLE' : i === 6 ? 'OFFERED' : 'AVAILABLE' },
      c.RA ? { [c.RA]: { status: i < 6 ? 'MATCHING' : i === 6 ? 'DRIVER_ASSIGNED' : 'CANCELLED', assignedDriverId: i === 6 ? c.rA.assignedDriverId : null },
        [c.RB]: { status: i < 6 ? 'MATCHING' : i === 6 ? 'DRIVER_ASSIGNED' : 'CANCELLED', assignedDriverId: i === 6 ? c.rB.assignedDriverId : null } } : {});
    S.markers.forEach((_, id) => drvEl(id)?.classList.toggle('win', id === 'D001' && i >= 2 && i <= 6));
  }

  // ---------- sequence §6: cancel races accept (AC-05, AC-06) ----------
  const CXL = { P: PLACES.notredame, DEST: PLACES.bitexco, ids: ['D001', 'D002'] };
  async function cxlRace(c, tok) {
    const t0 = performance.now();
    [c.cxl, c.acc] = await Promise.all([api('POST', `/rides/${c.R1}/cancel`), api('POST', `/rides/${c.R1}/offers/${c.drv1}/accept`)]);
    c.gap = Math.round(performance.now() - t0);
    c.xF = await waitFor(tok, async () => { const x = await getDispatch(c.R1); return x.saga.status === 'CANCELLED' && x; }, 15000);
    c.dF = await waitDriver(tok, c.drv1, 'AVAILABLE');
    c.hF = await getHistory(c.R1);
    c.sCxl = stepsOf(c.xF, 'CANCELLED').pop();
    c.accFirst = !!lastTr(c.hF, 'DRIVER_ACCEPTED');
    c.oF = offerOf(c.xF, c.drv1);
  }
  const CANCEL = [
    step({ row: { f: LP, t: LRS, txt: 'POST /rides → offered to D001 (O1 PENDING)', ac: 'AC-05' }, live: true,
      kicker: 'Setup · AC-05', title: 'Ride R1 has a pending offer for D001',
      text: (c) => `R1 is <b>DRIVER_ASSIGNED</b>, D001 is <b>OFFERED</b>, the offer has ${secs(c)} s left. Now two people act at the same moment.`,
      run: async (c, tok) => {
        c.created = await createRide('P005', CXL.P, CXL.DEST, `cancel-${Date.now()}`);
        if (!c.created.ok) throw new Error(`POST /rides → ${c.created.status}`);
        c.R1 = c.created.data.rideId; c.traceId = c.created.data.traceId;
        focusRides([c.R1]);
        c.r1 = await assignedTo(tok, c.R1); c.drv1 = c.r1.assignedDriverId;
        c.x1 = await getDispatch(c.R1); c.o1 = offerOf(c.x1, c.drv1);
      },
      proof: (c) => `ride <b>${ev(c.R1)}</b> <b>DRIVER_ASSIGNED</b> · ${c.drv1} <b>OFFERED</b> · O1 <b>PENDING</b>`,
      detail: (c) => ({ ride: c.r1, offer: c.o1 }),
      links: [table('dispatch_db', 'offers', 'ride_id', 'R1'), logs('dispatch-service')] }),
    step({ row: { f: LP, t: LRS, txt: 'par ① passenger: POST /rides/R1/cancel', ac: 'AC-06' },
      kicker: 'Step 2 · race · passenger', title: 'The passenger cancels…',
      text: () => 'Sent <b>in parallel</b> with the driver\'s accept (Promise.all). ride-service owns the lifecycle and decides the cancellation in its own transaction.',
      run: cxlRace,
      proof: (c) => `<b>${c.cxl.status}</b> · ride <b>${c.cxl.data?.status || c.cxl.data?.code}</b> · ${Math.round(c.cxl.ms)} ms`,
      detail: (c) => c.cxl.data,
      links: [logs('ride-service'), table('ride_db', 'rides', 'id', 'R1')] }),
    step({ row: { f: LD, t: LXS, txt: 'par ② driver: POST …/offers/D001/accept', ac: 'AC-05' },
      kicker: 'Step 3 · race · driver', title: '…while D001 taps Accept',
      text: (c) => c.acc.ok ? 'dispatch-service owns the offer: <b>O1 PENDING → ACCEPTED</b> succeeds, because it has not heard about the cancel yet (that arrives as an event).'
        : `The cancel reached dispatch first and cancelled the offer, so the accept finds no pending offer: <b>${esc(c.acc.data?.code)}</b>.`,
      proof: (c) => `<b>${c.acc.status}</b> · ${c.acc.ok ? `offer <b>${c.acc.data?.status}</b>` : `<b>${esc(c.acc.data?.code)}</b>`} · ${Math.round(c.acc.ms)} ms`,
      detail: (c) => c.acc.data,
      links: [table('dispatch_db', 'offers', 'ride_id', 'R1'), logs('dispatch-service')] }),
    step({ row: { f: LRS, t: LRS, txt: '[tx] → CANCELLED + outbox RideCancelled', ac: 'AC-06' },
      kicker: 'Step 4 · AC-06', title: 'The ride is CANCELLED (terminal)',
      text: () => 'CANCELLED and COMPLETED are terminal: no command can move the ride out of them.',
      proof: (c) => { const t = lastTr(c.hF, 'CANCELLED'); return `<b>${t?.from} → CANCELLED</b> · ${esc(t?.action || '')}`; },
      at: (c) => lastTr(c.hF, 'CANCELLED')?.at,
      detail: (c) => c.hF.transitions,
      links: [table('ride_db', 'ride_transitions', 'ride_id', 'R1', 'id'), table('ride_db', 'outbox', 'msg_key', 'R1', 'id'), topic('ride.events.v1')] }),
    step({ row: { f: LXS, t: LRS, txt: 'MarkAccepted → refused: ride is terminal', ac: 'AC-06', async: true },
      kicker: 'Step 5 · AC-06 invalid transition', title: 'The accept cannot revive a cancelled ride',
      text: (c) => !c.acc.ok ? 'Not needed this time: the cancel won the offer row, so no MarkAccepted was sent.'
        : c.accFirst ? 'This time MarkAccepted landed first (<b>DRIVER_ACCEPTED</b>), then the cancel moved the ride to <b>CANCELLED</b>, which is allowed. Same end state.'
          : 'ride-service refuses <b>CANCELLED → DRIVER_ACCEPTED</b> and replies <b>CommandRejected</b>; the saga compensates.',
      proof: (c) => !c.acc.ok ? 'not sent (offer was already CANCELLED)' : c.accFirst ? 'DRIVER_ACCEPTED, then CANCELLED' : 'no DRIVER_ACCEPTED in the ride history ✔',
      detail: (c) => c.hF.transitions,
      links: [topic('ride.commands.v1'), topic('dispatch.replies.v1'), table('ride_db', 'ride_transitions', 'ride_id', 'R1', 'id')] }),
    step({ row: { f: LRS, t: LXS, txt: 'RideCancelled → saga CANCELLED (compensate)', ac: 'AC-10', async: true },
      kicker: 'Step 6 · saga compensation', title: 'The saga cancels and compensates',
      text: () => 'Whichever message arrives first (RideCancelled or CommandRejected) cancels the saga; the second is a no-op.',
      proof: (c) => `saga <b>CANCELLED</b> · “${esc(c.sCxl?.detail || '')}” · offer O1 <b>${c.oF?.status}</b>`,
      at: (c) => c.sCxl?.at,
      detail: (c) => ({ saga: c.xF.saga, step: c.sCxl, offer: c.oF }),
      links: [table('dispatch_db', 'dispatch_sagas', 'ride_id', 'R1'), table('dispatch_db', 'saga_steps', 'ride_id', 'R1', 'id')] }),
    step({ row: { f: LXS, t: LDS, txt: 'ReleaseDriver → D001 AVAILABLE (WHERE current_ride_id = R1)', ac: 'AC-02', async: true },
      kicker: 'Done · same end state, any order', title: 'Ride CANCELLED · saga CANCELLED · D001 AVAILABLE',
      text: () => 'The release only applies while D001 still holds R1, and it follows MarkDriverBusy on the same driverId partition, so D001 can never be stuck in BUSY.',
      proof: (c) => `${c.drv1} <b>${c.dF.status}</b> · currentRideId <b>null</b>`,
      at: (c) => c.dF.updatedAt,
      detail: (c) => c.dF,
      links: [table('driver_db', 'drivers', 'id', 'drv1'), redisDrv('drv1'), logs(null)] }),
  ];
  async function cxlMap(i, forward, tok) {
    const c = H.c, d1 = c.drv1 || 'D001';
    sceneLayer.clearLayers();
    pin(CXL.P, 'pickup', 'P005 pickup'); pin(CXL.DEST, 'dest', 'destination');
    const radius = c.x1?.saga.radiusM || c.cfg?.matchRadiusM || 2000;
    if (forward && i === 0) await growCircle(CXL.P, radius);
    if (tok !== S.token) return;
    drawCandidates(CXL.P, radius, CXL.ids);
    const accepted = c.acc?.ok && i >= 2 && i <= 5;
    showAt({ [d1]: i <= 1 ? 'OFFERED' : i === 6 ? 'AVAILABLE' : accepted && c.accFirst ? 'BUSY' : 'OFFERED' },
      c.R1 ? { [c.R1]: { status: i <= 1 ? 'DRIVER_ASSIGNED' : i === 2 && c.accFirst ? 'DRIVER_ACCEPTED' : 'CANCELLED', assignedDriverId: i <= 2 ? d1 : null } } : {});
    S.ringOverride = i <= 1 && c.o1 ? new Map([[d1, H.reached >= 1 ? { ...c.o1, frozen: true } : c.o1]]) : null;
    S.markers.forEach((_, id) => drvEl(id)?.classList.toggle('win', id === d1 && i <= 5));
  }

  // ---------- the step-player scenarios ----------
  const PLAYERS = {
    happy: { title: 'Happy path', ref: '§1', steps: HAPPY, center: PLACES.opera, map: happyMap,
      layout: () => cityLayout({
        D001: at(PLACES.opera, 800, 40, 'AVAILABLE'),
        D002: at(PLACES.opera, 1500, 215, 'AVAILABLE'),
        D003: at(PLACES.opera, 2500, 300, 'AVAILABLE'),
        D011: at(PLACES.opera, 420, 120, 'OFFLINE'),
      }),
      rides: (c) => [c.R1], traces: (c) => [['trace', c.traceId]],
      pendingOffer: (c, reached) => reached < 10 && c.offer },
    seqReject: { title: 'Reject → rematch', ref: '§2', steps: REJECT, center: REJ.P, map: rejMap,
      layout: () => cityLayout({
        D001: at(REJ.P, 600, 40, 'AVAILABLE'),
        D002: at(REJ.P, 1100, 215, 'AVAILABLE'),
        D003: at(REJ.P, 2500, 300, 'AVAILABLE'),
        D011: at(REJ.P, 400, 120, 'OFFLINE'),
      }),
      rides: (c) => [c.R1], traces: (c) => [['trace', c.traceId]],
      pendingOffer: (c, reached) => (reached < 1 ? c.o1 : reached === 7 ? c.o2 : null) },
    seqRace: { title: 'Two rides, one driver', ref: '§4', steps: RACE_STEPS, center: RACE.H, zoom: 15.6, map: raceMap,
      layout: () => cityLayout({
        D001: at(RACE.H, 0, 0, 'AVAILABLE'),
        D002: at(RACE.H, 950, 0, 'AVAILABLE'),
        D003: at(RACE.H, 1050, 180, 'AVAILABLE'),
      }),
      rides: (c) => [c.RA, c.RB], traces: (c) => [['trace A', c.trA], ['trace B', c.trB]] },
    seqCancel: { title: 'Cancel vs accept', ref: '§6', steps: CANCEL, center: CXL.P, zoom: 15, map: cxlMap,
      layout: () => cityLayout({
        D001: at(CXL.P, 700, 45, 'AVAILABLE'),
        D002: at(CXL.P, 1500, 230, 'AVAILABLE'),
      }),
      rides: (c) => [c.R1], traces: (c) => [['trace', c.traceId]],
      pendingOffer: (c, reached) => reached < 1 && c.o1 },
  };

  // ---------- runner ----------
  async function run(name) {
    if (S.running && name !== 'free') return;
    if (H.active) await happyStop({ quiet: true });
    const tok = ++S.token;
    S.nextResolve?.(); S.nextResolve = null;
    sceneLayer.clearLayers(); sql(null);
    S.markers.forEach((m) => m.dragging.disable());
    S.markers.forEach((_, id) => drvEl(id)?.classList.remove('win'));
    S.override.clear(); S.rideOverride = {};
    $$('.scene').forEach((s) => s.classList.toggle('active', s.dataset.scene === (name.startsWith('race') ? 'race' : name)));
    if (name === 'free') { S.running = false; setButtons(); enterFree(); return; }
    S.mode = name; S.running = true; setButtons();
    try {
      if (PLAYERS[name]) await scenePlayer(tok, name);
      if (name === 'match') await sceneMatch(tok);
      if (name === 'race') await sceneRace(tok, 1);
      if (name === 'race10') await sceneRace(tok, 10);
      if (name === 'storm') await sceneStorm(tok);
    } catch (e) {
      if (!(e instanceof Abort)) { console.error(e); say('Something went wrong', e.message, 'Check that the stack is up (<b>make up</b>) and press <b>Reset city</b>.'); }
    } finally {
      if (tok === S.token && !PLAYERS[name]) { S.running = false; setButtons(); $('#nextBtn').hidden = true; S.override.clear(); S.rideOverride = {}; }
    }
  }
  function setButtons() { $$('[data-run]').forEach((b) => { b.disabled = S.running && b.dataset.run !== 'free'; }); }
  $$('[data-run]').forEach((b) => b.addEventListener('click', () => run(b.dataset.run)));

  $('#resetBtn').addEventListener('click', async () => {
    if (H.active) await happyStop({ quiet: true });
    const tok = ++S.token;
    S.nextResolve?.(); S.nextResolve = null;
    S.running = true; setButtons();
    sceneLayer.clearLayers(); sql(null); focusRides([]); S.mode = 'idle';
    $$('.scene').forEach((s) => s.classList.remove('active'));
    try {
      await resetCity(tok, cityLayout(Object.fromEntries(DRIVER_IDS.slice(0, 10).map((id, i) => [id, at(PLACES.center, 300 + i * 260, i * 67, 'AVAILABLE')]))));
      say('Ready', 'City reset', '10 drivers online around District 1, 10 offline. Pick a scene.');
    } catch (e) { if (!(e instanceof Abort)) say('Reset failed', e.message, 'Is the stack up? <b>make up</b>'); }
    finally { if (tok === S.token) { S.running = false; setButtons(); } }
  });

  $('#stepMode').addEventListener('change', (e) => { S.stepMode = e.target.checked; if (!S.stepMode) S.nextResolve?.(); });
  const darkBox = $('#darkMap');
  try { if (localStorage.getItem('kvp-demo-light') === '1') darkBox.checked = false; } catch { /* storage unavailable */ }
  const applyDark = () => { document.body.classList.toggle('dark-map', darkBox.checked); try { localStorage.setItem('kvp-demo-light', darkBox.checked ? '0' : '1'); } catch { /* storage unavailable */ } };
  darkBox.addEventListener('change', applyDark); applyDark();

  // ---------- boot ----------
  health();
  getConfig();
  setInterval(getConfig, 5000);
  poll().then(() => {
    const pts = [...S.drivers.values()].map((d) => [d.latitude, d.longitude]);
    if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.3), { maxZoom: 15 });
  });
  say('KVP · Ride-hailing dispatch', 'Live on the real Go services', 'Every marker, status and step on this map is read from the API through the gateway. Start with <b>Happy path</b> on the left. Tip: turn on <b>Step mode</b> to advance with Space while presenting.');
})();
