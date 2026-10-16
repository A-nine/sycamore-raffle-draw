/* Sycamore Raffle Draw \u2014 shared core (storage, CSV, normalisation, crypto, tape engine, sound, confetti) */
(function (global) {
  'use strict';

  /* ---------------- Icons (lucide-style strokes) ---------------- */
  const ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    radio: '<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    shieldCheck: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    external: '<path d="M7 17 17 7M7 7h10v10"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    play: '<path d="m6 3 14 9-14 9z"/>',
    pause: '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0z"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    eyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    refresh: '<path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'
  };
  function icon(name, cls) {
    return '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  /* Official Sycamore logo (Brand Drive SVGs in assets/brand) */
  function logo(opts) {
    opts = opts || {};
    const tag = opts.href ? 'a' : 'span';
    const href = opts.href ? ' href="' + opts.href + '"' : '';
    return '<' + tag + href + ' class="logo' + (opts.white ? ' white' : '') + '">' +
      (opts.white
        ? '<img class="on-dark" src="assets/brand/logo-white.svg" alt="Sycamore" width="147" height="40"><img class="on-light" src="assets/brand/logo-blue.svg" alt="Sycamore" width="147" height="40">'
        : '<img src="assets/brand/logo-blue.svg" alt="Sycamore" width="147" height="40">') + '</' + tag + '>';
  }

  /* ---------------- Small utils ---------------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Number(n || 0).toLocaleString('en-US');
  const pad5 = n => String(n).padStart(5, '0');
  const isoNow = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const hhmmss = d => new Date(d).toISOString().slice(11, 19);
  const shortHash = h => h ? h.slice(0, 8) + '\u2026' + h.slice(-8) : '\u2014';

  function toast(msg, kind) {
    let wrap = $('.toasts');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toasts'; document.body.appendChild(wrap); }
    const t = document.createElement('div');
    t.className = 'toast' + (kind === 'err' ? ' err' : '');
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 3600);
  }

  /* ---------------- Storage (localStorage, fails soft) ---------------- */
  const KEY = 'sr.v1', TAPE = 'sr.tape', PING = 'sr.stagePing', AUDITS = 'sr.audits';
  function read(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function write(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { console.warn('storage write failed', k, e); return false; }
  }
  function defaults() {
    return {
      draft: { name: 'August Savers Mega Draw', date: '', file: null, rows: [], stats: null, columns: null },
      rules: { mode: 'WEIGHTED_SLOT', nfkc: true, lower: true, punct: false, spaces: true },
      settings: { winners: 3, replacement: false, showTag: true, sound: true },
      pool: null,
      winners: [],
      log: []
    };
  }
  const store = {
    get() { const s = read(KEY, null); return s ? Object.assign(defaults(), s) : defaults(); },
    set(s) { return write(KEY, s); },
    update(fn) { const s = store.get(); fn(s); store.set(s); return s; },
    reset() { try { localStorage.removeItem(KEY); localStorage.removeItem(TAPE); } catch (e) { } },
    log(s, msg, kind) { s.log.unshift({ t: Date.now(), msg, kind: kind || '' }); s.log = s.log.slice(0, 60); },
    tape() { return read(TAPE, { mode: 'idle', speed: 800, playing: true, anchorT: Date.now(), anchorP: 0 }); },
    setTape(t) { write(TAPE, t); },
    audits() { return read(AUDITS, {}); },
    saveAudit(a) { const all = store.audits(); all[a.drawId] = a; return write(AUDITS, all); },
    ping() { try { localStorage.setItem(PING, String(Date.now())); } catch (e) { } },
    stageAlive() { try { return Date.now() - Number(localStorage.getItem(PING) || 0) < 5000; } catch (e) { return false; } },
    KEY, TAPE, PING, AUDITS
  };

  /* ---------------- Theme (brand dark / light mode), shared by every page ---------------- */
  const THEME = 'sr.theme';
  const theme = {
    get() { try { return localStorage.getItem(THEME) === 'light' ? 'light' : 'dark'; } catch (e) { return 'dark'; } },
    apply(v) {
      v = v || theme.get();
      document.documentElement.setAttribute('data-theme', v);
      const m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', v === 'light' ? '#FFFFFF' : '#073042');
      document.querySelectorAll('[data-theme-toggle]').forEach(b => { b.innerHTML = theme.label(v); b.setAttribute('aria-pressed', String(v === 'light')); });
      document.querySelectorAll('[data-theme-switch]').forEach(i => { i.checked = v === 'light'; });
    },
    set(v) { try { localStorage.setItem(THEME, v); } catch (e) { } theme.apply(v); },
    toggle() { theme.set(theme.get() === 'light' ? 'dark' : 'light'); },
    label(v) { return v === 'light' ? icon('moon') + '<span>Dark mode</span>' : icon('sun') + '<span>Light mode</span>'; },
    bind(root) {
      (root || document).querySelectorAll('[data-theme-toggle]').forEach(b => { b.onclick = theme.toggle; });
      (root || document).querySelectorAll('[data-theme-switch]').forEach(i => { i.onchange = () => theme.set(i.checked ? 'light' : 'dark'); });
      theme.apply();
    },
    KEY: THEME
  };
  global.addEventListener('storage', e => { if (e.key === THEME) theme.apply(); });
  theme.apply();

  /* ---------------- CSV ingest (brief \u00a7CSV) ---------------- */
  function decode(buf) {
    const b = new Uint8Array(buf);
    if (b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF) return { text: new TextDecoder('utf-8').decode(b.subarray(3)), encoding: 'UTF-8-BOM' };
    try { return { text: new TextDecoder('utf-8', { fatal: true }).decode(b), encoding: 'UTF-8' }; }
    catch (e) { return { text: new TextDecoder('iso-8859-1').decode(b), encoding: 'ISO-8859-1' }; }
  }
  function sniffDelimiter(text) {
    const line = text.split(/\r?\n/).find(l => l.trim()) || '';
    const counts = { ',': 0, ';': 0, '\t': 0 };
    let q = false;
    for (const ch of line) { if (ch === '"') q = !q; else if (!q && ch in counts) counts[ch]++; }
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  }
  function parseCSV(text, d) {
    const rows = []; let row = [], f = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else if (c === '"') q = true;
      else if (c === d) { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(f); rows.push(row); row = []; f = '';
      } else f += c;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  const DELIM_NAME = { ',': 'comma', ';': 'semicolon', '\t': 'tab' };
  function ingest(buf, fileName) {
    const { text, encoding } = decode(buf);
    const delimiter = sniffDelimiter(text);
    const table = parseCSV(text, delimiter);
    while (table.length && table[table.length - 1].every(c => !c.trim())) table.pop();
    if (!table.length) throw { code: 'EMPTY', message: 'The file is empty.' };
    const header = table[0].map(h => h.trim());
    const find = re => header.findIndex(h => re.test(h));
    const ni = find(/^(full[\s_-]*name|name)$/i);
    if (ni < 0) throw { code: 'NO_NAME', message: 'No \u201cName\u201d or \u201cFull Name\u201d column found in the header row.', header, encoding, delimiter };
    const ei = find(/^e-?mail(\s*address)?$/i);
    const ii = find(/^(identifier|id|tag|phone|account|member\s*id)$/i);
    const body = table.slice(1);
    if (body.length > 100000) throw { code: 'TOO_MANY', message: 'This file has ' + fmt(body.length) + ' rows. The limit is 100,000.' };
    const rows = []; let blank = 0;
    for (const r of body) {
      const name = (r[ni] || '').trim();
      if (!name) { blank++; continue; }
      rows.push({ name, email: ei >= 0 ? (r[ei] || '').trim() : '', id: ii >= 0 ? (r[ii] || '').trim() : '' });
    }
    if (!rows.length) throw { code: 'NO_ROWS', message: 'The file has a header but no rows with a name.' };
    return {
      file: { name: fileName, size: buf.byteLength, encoding, delimiter: DELIM_NAME[delimiter] },
      columns: { name: header[ni], email: ei >= 0 ? header[ei] : null, id: ii >= 0 ? header[ii] : null },
      stats: { read: body.length, blank, valid: rows.length },
      rows
    };
  }

  /* ---------------- Normalisation + duplicates (brief \u00a7Normalisation) ---------------- */
  function normalise(name, rules) {
    let s = name;
    if (rules.nfkc) s = s.normalize('NFKC');
    if (rules.lower) s = s.toLowerCase();
    if (rules.punct) s = s.replace(/[^\p{L}\p{N}\s]/gu, '');
    if (rules.spaces) s = s.trim().replace(/\s+/g, ' ');
    return s;
  }
  function analyse(rows, rules) {
    const groups = new Map();
    rows.forEach((r, i) => {
      const k = normalise(r.name, rules);
      let g = groups.get(k);
      if (!g) { g = { key: k, first: r.name, rows: [] }; groups.set(k, g); }
      g.rows.push(i);
    });
    const list = Array.from(groups.values());
    const dupGroups = list.filter(g => g.rows.length > 1).sort((a, b) => b.rows.length - a.rows.length);
    return {
      groups: list,
      uniqueCount: list.length,
      weightedCount: rows.length,
      dupRows: dupGroups.reduce((n, g) => n + g.rows.length - 1, 0),
      peopleAffected: dupGroups.length,
      top: dupGroups.slice(0, 4).map(g => ({ name: g.first, key: g.key, n: g.rows.length }))
    };
  }

  /* ---------------- Masking (brief \u00a7PII) ---------------- */
  function shortName(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return parts[0] + ' ' + parts[parts.length - 1][0].toUpperCase() + '.';
  }
  function maskTag(r) {
    const src = (r.id || (r.email || '').split('@')[0] || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (src.length < 3) return '';
    return '@' + src.slice(0, 3) + '\u2022\u2022\u2022' + src.slice(-2);
  }
  function maskEmail(e) {
    if (!e || e.indexOf('@') < 0) return e ? e[0] + '\u2022\u2022\u2022' : '\u2014';
    const [u, d] = e.split('@');
    return u[0] + '\u2022' + '*'.repeat(Math.min(3, Math.max(1, u.length - 2))) + (u.length > 1 ? u[u.length - 1] : '') + '@' + d;
  }

  /* Build the ordered slot list. Public slots carry only redacted fields + a person group number. */
  function buildPool(rows, rules) {
    const a = analyse(rows, rules);
    const keyToP = new Map(); a.groups.forEach((g, i) => keyToP.set(g.key, i));
    const slots = [], names = [];
    if (rules.mode === 'UNIQUE_ENTRANT') {
      a.groups.forEach((g, p) => { const r = rows[g.rows[0]]; slots.push({ label: shortName(g.first), tag: maskTag(r), p }); names.push(g.first.trim().replace(/\s+/g, ' ')); });
    } else {
      rows.forEach(r => { const p = keyToP.get(normalise(r.name, rules)); const disp = a.groups[p].first.trim().replace(/\s+/g, ' '); slots.push({ label: shortName(disp), tag: maskTag(r), p }); names.push(disp); });
    }
    return { slots, names, analysis: a };
  }

  /* ---------------- Crypto ---------------- */
  async function sha256Hex(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  /* Unbiased pick in [0, n) using CSPRNG + rejection sampling. Returns the accepted uint32 too, for the audit. */
  function csprngIndex(n) {
    const limit = Math.floor(4294967296 / n) * n;
    const a = new Uint32Array(1);
    for (; ;) { crypto.getRandomValues(a); if (a[0] < limit) return { value: a[0], index: a[0] % n }; }
  }
  /* Slots still eligible for round k (without replacement removes every slot of earlier winners). */
  function eligibleSlots(slots, winners, replacement) {
    if (replacement) return slots.map((_, i) => i);
    const gone = new Set(winners.map(w => w.p));
    const out = [];
    for (let i = 0; i < slots.length; i++) if (!gone.has(slots[i].p)) out.push(i);
    return out;
  }

  /* ---------------- Sound (royalty-free synth presets) ---------------- */
  let actx = null;
  function ac() { if (!actx) { const C = global.AudioContext || global.webkitAudioContext; if (C) actx = new C(); } if (actx && actx.state === 'suspended') actx.resume(); return actx; }
  function blip(freq, dur, type, vol, when) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + (when || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  const sound = {
    unlock() { ac(); },
    tick() { blip(1400, 0.03, 'square', 0.03); },
    lock() { blip(220, 0.25, 'triangle', 0.12); blip(330, 0.25, 'triangle', 0.08, 0.02); },
    fanfare() { [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.35, 'triangle', 0.09, i * 0.12)); blip(1047, 0.9, 'sawtooth', 0.03, 0.5); }
  };

  /* ---------------- Tape engine ----------------
     Offsets are in "cards": card i is centred when offset === i.
     Idle speed is in px/s at a nominal 300 px pitch (default 800 px/s, slider 100\u20132400 px/s).
     Braking runs a cubic p(\u03c4)=p0+v0\u03c4+a\u03c4\u00b2+b\u03c4\u00b3 that starts at the current speed and lands
     exactly on card L after T seconds with zero velocity (\u00b10 px lock, well inside \u00b11 px). */
  const PX_PER_CARD = 300, BRAKE_S = 6.0, MIN_TRAVEL = 7;

  function tapeOffset(t, now) {
    if (t.mode === 'brake') {
      const tau = Math.min((now - t.t0) / 1000, t.T);
      const v0 = t.v0, T = t.T, D = t.L - t.p0;
      const b = (v0 - 2 * D / T) / (T * T), a = (-v0 - 3 * b * T * T) / (2 * T);
      return { p: t.p0 + v0 * tau + a * tau * tau + b * tau * tau * tau, done: tau >= T };
    }
    if (t.mode === 'locked') return { p: t.L, done: true };
    const v = t.playing ? t.speed / PX_PER_CARD : 0;
    return { p: t.anchorP + v * (now - t.anchorT) / 1000, done: false };
  }
  function planBrake(t, now, winnerSlot) {
    const p0 = tapeOffset(t, now).p;
    const v0 = t.mode === 'idle' && t.playing ? t.speed / PX_PER_CARD : 0;
    const L = Math.ceil(p0 + Math.max(v0 * BRAKE_S * 0.6, MIN_TRAVEL));
    return { mode: 'brake', t0: now, p0, v0, T: BRAKE_S, L, slot: winnerSlot, speed: t.speed, playing: t.playing, seed: t.seed };
  }
  function resumeIdle(t, now) {
    const p = tapeOffset(t, now).p;
    return { mode: 'idle', speed: t.speed, playing: t.playing, anchorT: now, anchorP: p, L: t.L, slot: t.slot, seed: t.seed };
  }

  /* Ends a brake exactly once, whichever screen (control or stage) gets there first.
     Values are deterministic, so two screens writing the same state is harmless. */
  function finishBrake(st) {
    const lockedAt = st.t0 + st.T * 1000, cur = store.tape();
    if (cur.mode === 'brake' && cur.t0 === st.t0) {
      const locked = { mode: 'locked', L: st.L, slot: st.slot, speed: st.speed, playing: st.playing, seed: st.seed, reveal: null, revealed: false, lockedAt };
      store.setTape(locked);
      return { state: locked, fresh: true };
    }
    if (cur.mode === 'locked' && cur.lockedAt === lockedAt) return { state: cur, fresh: false };
    return null;
  }
  /* Shows the reveal 1.2 s after the lock, once per round (a hidden reveal stays hidden). */
  function scheduleReveal(lockedAt, cb) {
    setTimeout(() => {
      const cur = store.tape();
      let did = false;
      if (cur.mode === 'locked' && cur.lockedAt === lockedAt && !cur.revealed) {
        cur.reveal = store.get().winners.length; cur.revealed = true; store.setTape(cur); did = true;
      }
      if (cb) cb(did);
    }, Math.max(0, lockedAt + 1200 - Date.now()));
  }

  /* Card i \u2192 slot index. Stride walk looks shuffled but is identical on every screen. */
  function strideFor(n) {
    if (n < 3) return 1;
    let a = Math.max(1, Math.round(n * 0.6180339887));
    const gcd = (x, y) => y ? gcd(y, x % y) : x;
    while (gcd(a, n) !== 1) a++;
    return a;
  }

  function Tape(host, opts) {
    this.host = host; this.opts = opts || {};
    this.track = document.createElement('div'); this.track.className = 'tape-track';
    host.appendChild(this.track);
    this.nodes = new Map(); this.lastCard = null; this.slots = []; this.names = null;
    this.state = store.tape(); this.onLock = null; this.onBrakeStart = null;
    this.locked = this.state.mode === 'locked';
    this.raf = this.frame.bind(this);
    requestAnimationFrame(this.raf);
  }
  Tape.prototype.setPool = function (slots, names, showTag) {
    this.slots = slots || []; this.names = names || null; this.showTag = showTag !== false;
    this.stride = strideFor(this.slots.length);
    this.nodes.forEach(n => n.remove()); this.nodes.clear();
  };
  Tape.prototype.setState = function (s) {
    const was = this.state.mode;
    this.state = s;
    if (s.mode === 'brake' && was !== 'brake' && this.onBrakeStart) this.onBrakeStart(s);
    if (s.mode !== 'locked') this.locked = false;
    this.nodes.forEach(n => n.remove()); this.nodes.clear();
  };
  Tape.prototype.slotFor = function (i) {
    const n = this.slots.length; if (!n) return -1;
    const s = this.state;
    if (s.L != null && i === s.L && s.slot != null) return s.slot;
    const seed = s.seed || 0;
    return (((i + seed) * this.stride) % n + n) % n;
  };
  Tape.prototype.measure = function () {
    const box = this.host.parentElement;
    const vertical = !!this.opts.allowVertical && box.clientWidth < 700 && box.clientHeight > box.clientWidth * 1.05;
    this.host.classList.toggle('vertical', vertical);
    const w = this.host.clientWidth, h = this.host.clientHeight;
    let pitch, fs;
    if (vertical) { pitch = Math.max(84, Math.min(140, h / 6.5)); fs = Math.max(18, Math.min(28, pitch * 0.22)); }
    else {
      const s = Math.max(0.42, Math.min(2.4, w / (this.opts.worldWidth || 1600)));
      pitch = PX_PER_CARD * s; fs = Math.max(13, 30 * s);
    }
    const slotH = vertical ? pitch - 12 : Math.min(this.host.clientHeight - 24, pitch * 0.42);
    const root = this.host.parentElement;
    root.style.setProperty('--pitch', pitch + 'px');
    root.style.setProperty('--gap', (vertical ? 12 : Math.round(pitch * 0.06)) + 'px');
    root.style.setProperty('--fs', fs + 'px');
    root.style.setProperty('--slot-h', slotH + 'px');
    return { vertical, pitch, span: (vertical ? h : w) / 2 / pitch };
  };
  Tape.prototype.frame = function () {
    if (this.dead) return;
    requestAnimationFrame(this.raf);
    const now = Date.now();
    const { p, done } = tapeOffset(this.state, now);
    const m = this.measure();
    const first = Math.floor(p - m.span - 1), last = Math.ceil(p + m.span + 1);
    for (const [i, el] of this.nodes) if (i < first || i > last) { el.remove(); this.nodes.delete(i); }
    for (let i = first; i <= last; i++) {
      let el = this.nodes.get(i);
      if (!el) {
        const si = this.slotFor(i);
        el = document.createElement('div'); el.className = 'slot';
        if (si >= 0) {
          const sl = this.slots[si];
          const nm = this.names ? this.names[si] : sl.label;
          el.innerHTML = '<div class="sn">SLOT #' + pad5(si + 1) + '</div><div class="nm">' + esc(nm) + '</div>' + (this.showTag && sl.tag ? '<div class="tg">' + esc(sl.tag) + '</div>' : '');
        } else el.innerHTML = '<div class="nm" style="opacity:.35">\u2014</div>';
        this.track.appendChild(el); this.nodes.set(i, el);
      }
      const d = (i - p) * m.pitch;
      el.style.transform = m.vertical ? 'translate3d(0,' + d + 'px,0)' : 'translate3d(calc(-50% + ' + d + 'px),0,0)';
      const dist = Math.abs(i - p) / Math.max(1, m.span);
      el.style.opacity = String(Math.max(0.25, 1 - dist * 0.65));
      el.classList.toggle('won', this.state.mode === 'locked' && i === this.state.L);
    }
    if (this.state.mode === 'brake') {
      const c = Math.round(p);
      if (this.lastCard != null && c !== this.lastCard && this.opts.onTick) this.opts.onTick();
      this.lastCard = c;
    } else this.lastCard = null;
    if (done && this.state.mode === 'brake' && !this.locked) {
      this.locked = true;
      if (this.onLock) this.onLock(this.state);
    }
  };
  Tape.prototype.destroy = function () { this.dead = true; this.track.remove(); };

  /* Builds the tape chrome (band, frame, arrows) inside `el` and returns the engine */
  function mountTape(el, opts) {
    el.insertAdjacentHTML('beforeend', '<div class="tape"></div><div class="frame-c"></div><div class="arrow top"></div><div class="arrow bot"></div>');
    const band = el.querySelector('.tape');
    const t = new Tape(band, opts);
    t.frameEl = el.querySelector('.frame-c');
    return t;
  }

  /* ---------------- Confetti (brand colours) ---------------- */
  function confetti(canvas, ms) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, global.devicePixelRatio || 1);
    const W = canvas.width = canvas.clientWidth * dpr, H = canvas.height = canvas.clientHeight * dpr;
    const cols = theme.get() === 'light' ? ['#26C615', '#073042', '#26C615', '#073042', '#26C615'] : ['#26C615', '#26C615', '#FFFFFF', '#26C615', '#26C615'];
    const parts = Array.from({ length: 220 }, () => ({
      x: Math.random() * W, y: -Math.random() * H * 0.6, w: (4 + Math.random() * 6) * dpr, h: (8 + Math.random() * 10) * dpr,
      vx: (Math.random() - 0.5) * 2 * dpr, vy: (2 + Math.random() * 4) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.25,
      c: cols[(Math.random() * cols.length) | 0], round: Math.random() < 0.25
    }));
    const end = Date.now() + (ms || 6000); let stop = false;
    (function loop() {
      if (stop) return;
      ctx.clearRect(0, 0, W, H);
      const fading = Date.now() > end;
      let alive = 0;
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vy += 0.02 * dpr;
        if (p.y > H + 20) { if (fading) continue; p.y = -20; p.x = Math.random() * W; p.vy = (2 + Math.random() * 3) * dpr; }
        alive++;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, 7); ctx.fill(); } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) requestAnimationFrame(loop); else ctx.clearRect(0, 0, W, H);
    })();
    return () => { stop = true; ctx.clearRect(0, 0, W, H); };
  }

  /* Demo pool used when no draw has been locked on this device (stage + verify still work) */
  const DEMO_NAMES = 'Adaeze Okafor,Chinedu Eze,Aisha Lawal,Tunde Bakare,Funmi Adeyemi,Segun Martins,Ifeanyi Okeke,Bola Hassan,Musa Bello,Ngozi Ike,Emeka Nwosu,Kemi Balogun,Yusuf Abubakar,Zainab Usman,Olumide Adebayo,Chiamaka Obi,Ibrahim Danjuma,Halima Akinola,Femi Okonkwo,Uche Ojo,Amaka Afolabi,Fatima Mohammed,Obinna Chukwu,Nkechi Ibe'.split(',');
  function demoPool() {
    const names = DEMO_NAMES.slice();
    const slots = names.map((n, i) => ({ label: shortName(n), tag: '@' + n.slice(0, 3).toLowerCase() + '\u2022\u2022\u2022' + String(10 + (i * 37) % 89).slice(-2), p: i }));
    return { slots, names };
  }

  global.SR = {
    icon, logo, theme, $, $$, esc, fmt, pad5, isoNow, hhmmss, shortHash, toast,
    store, ingest, normalise, analyse, buildPool, shortName, maskTag, maskEmail,
    sha256Hex, uuid, csprngIndex, eligibleSlots, sound,
    tapeOffset, planBrake, resumeIdle, finishBrake, scheduleReveal, mountTape, confetti, demoPool, BRAKE_S
  };
})(window);
