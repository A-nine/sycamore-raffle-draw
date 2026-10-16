/* Sycamore Raffle Draw \u2014 live stage (viewer, read-only). Syncs with the control room through localStorage events. */
(function () {
  'use strict';
  const { icon, logo, $, esc, fmt, pad5, shortHash, store } = SR;
  const stage = $('#stage');
  $('#logo').innerHTML = logo({ white: true });

  let pool = null, demo = false, audioOn = false, stopConfetti = null, lastReveal = null, demoState = null;
  const tape = SR.mountTape($('#tape'), {
    worldWidth: 1600, allowVertical: true,
    onTick: () => { if (soundOK()) SR.sound.tick(); }
  });
  tape.onLock = st => {
    if (!demo) {
      const r = SR.finishBrake(st);
      if (r) { tape.setState(r.state); SR.scheduleReveal(r.state.lockedAt, () => { tape.setState(store.tape()); sync(); }); }
    }
    tape.frameEl.classList.add('locked');
    if (soundOK()) SR.sound.lock();
    setStatus('Winner locked', true);
    $('#headline').textContent = 'We have a winner';
    $('#subline').textContent = 'Locked in the centre frame. Verified with SHA-256.';
    if (demo) { demoState = { mode: 'locked', L: tape.state.L, slot: tape.state.slot, speed: 800, playing: true, seed: tape.state.seed, reveal: 1 }; tape.setState(demoState); setTimeout(() => applyReveal(demoState), 1200); }
  };

  function soundOK() {
    if (!audioOn) return false;
    if (demo) return true;
    const s = store.get(); return !!(s.pool && s.pool.settings.sound);
  }
  function setStatus(txt, gold) { $('#status').textContent = txt; $('#st-dot').classList.toggle('gold', !!gold); }

  function load() {
    const s = store.get();
    if (s.pool) {
      demo = false; pool = s.pool;
      tape.setPool(pool.slots, pool.names, pool.settings.showTag);
      tape.setState(store.tape());
    } else {
      demo = true;
      const d = SR.demoPool();
      pool = { name: 'Sycamore Raffle Draw', slots: d.slots, names: d.names, slotsCount: d.slots.length, settings: { winners: 1, showTag: true }, mode: 'WEIGHTED_SLOT', poolHash: '', drawId: '' };
      tape.setPool(d.slots, d.names, true);
      demoState = { mode: 'idle', speed: 800, playing: true, anchorT: Date.now(), anchorP: 0, seed: 5 };
      tape.setState(demoState);
    }
    header(); footer(); sync();
  }

  function header() {
    const s = store.get(), n = s.winners.length, tot = pool.settings.winners;
    $('#ev-name').textContent = pool.name;
    const d = pool.date ? new Date(pool.date) : null;
    const when = d && !isNaN(d) ? ' \u00b7 ' + d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';
    $('#ev-meta').textContent = demo ? 'Demo stage \u00b7 no pool locked on this device' : 'Round ' + Math.min(n + (store.tape().mode === 'idle' ? 1 : 0), tot) + ' of ' + tot + when;
    $('#pool-count').innerHTML = icon('users') + ' ' + fmt(pool.slotsCount) + ' in the pool';
    const t = store.tape();
    const live = $('#live');
    live.textContent = !demo && t.mode === 'locked' ? 'WINNER LOCKED' : demo ? 'DEMO' : 'LIVE';
  }

  function footer() {
    if (demo) {
      $('#foot').innerHTML = cell('info', 'Demo mode', 'Press Space for a sample draw') + cell('lock', 'Draw ID', 'Created when a pool is locked') +
        cell('users', 'Rule', 'Weighted \u00b7 ' + pool.slotsCount + ' slots') + cell('shieldCheck', 'Run a real draw', '<a href="index.html">Open the admin console</a>');
      return;
    }
    const v = new URL('verify.html?id=' + pool.drawId, location.href);
    $('#foot').innerHTML = cell('hash', 'Pool hash \u00b7 SHA-256', shortHash(pool.poolHash)) + cell('lock', 'Draw ID', pool.drawId.slice(0, 13) + '\u2026' + pool.drawId.slice(-4)) +
      cell('users', 'Rule', (pool.mode === 'UNIQUE_ENTRANT' ? 'Unique' : 'Weighted') + ' \u00b7 ' + fmt(pool.slotsCount) + ' slots') +
      cell('shieldCheck', 'Verify it yourself', '<a href="' + esc(v.href) + '" target="_blank">' + esc(v.host + v.pathname.replace(/\/[^/]*$/, '') + '/verify/' + pool.drawId.slice(0, 8)) + '</a>');
  }
  function cell(ic, label, val) { return '<div>' + icon(ic) + '<div style="min-width:0"><div class="eyebrow">' + label + '</div><div class="mono">' + val + '</div></div></div>'; }

  function sync() {
    const t = demo ? demoState : store.tape();
    stage.classList.toggle('braking', t.mode === 'brake');
    tape.frameEl.classList.toggle('locked', t.mode === 'locked');
    if (t.mode === 'brake') {
      const s = store.get();
      $('#headline').textContent = demo ? 'Drawing a sample winner\u2026' : 'Drawing round ' + (s.winners.length) + '\u2026';
      $('#subline').textContent = 'The tape is braking. Watch the centre frame.';
      setStatus('Braking \u00b7 6.0 s \u00b7 winner already chosen by CSPRNG', true);
    } else if (t.mode === 'locked') {
      $('#headline').textContent = 'We have a winner';
      $('#subline').textContent = 'Locked in the centre frame. Verified with SHA-256.';
      setStatus('Winner locked', true);
    } else {
      $('#headline').textContent = 'Every entrant is in the pool';
      $('#subline').textContent = 'Watch the tape. Every name you see could win.';
      setStatus(t.playing ? 'Tape running \u00b7 ' + t.speed + ' px/s \u00b7 draw starts soon' + (demo ? ' \u00b7 press Space for a sample draw' : '') : 'Tape paused', false);
    }
    header();
    applyReveal(t);
  }

  function applyReveal(t) {
    const show = t.reveal || null;
    if (!show) { stage.classList.remove('reveal'); if (stopConfetti) { stopConfetti(); stopConfetti = null; } lastReveal = null; rounds(); return; }
    if (lastReveal === show && stage.classList.contains('reveal')) return;
    lastReveal = show;
    const s = store.get();
    const w = demo ? demoWinner : s.winners[show - 1];
    if (!w) return;
    const tot = pool.settings.winners;
    $('#modal').innerHTML = '<div class="body"><div class="cup">' + icon('trophy') + '</div>' +
      '<div class="eyebrow gold">' + (demo ? 'Sample winner \u00b7 demo stage' : 'Round ' + w.round + ' winner \u00b7 ' + esc(pool.name)) + '</div>' +
      '<h2>' + esc(w.name || w.label) + '</h2><div class="chips">' + (pool.settings.showTag && w.tag ? '<span class="chip">' + esc(w.tag) + '</span>' : '') +
      '<span class="chip">Slot #' + pad5(w.slot + 1) + ' of ' + fmt(pool.slotsCount) + '</span></div>' +
      '<p class="congrats">Congratulations! The Sycamore team will contact you within 24 hours.</p></div>' +
      (demo ? '<div class="hash"><div class="ok">' + icon('info') + '</div><div><div class="eyebrow" style="color:var(--cyan)">Demo stage</div><code>Lock a pool in the admin console to get a SHA-256 pool hash and a public verify link.</code></div></div>'
        : '<div class="hash"><div class="ok">' + icon('shieldCheck') + '</div><div><div class="eyebrow">Verified draw \u00b7 SHA-256 \u00b7 ' + esc(w.at) + '</div><code>' + esc(pool.poolHash) + '</code>' +
        '<a href="verify.html?id=' + pool.drawId + '" target="_blank">Check it at ' + esc(location.host || 'this site') + '/verify/' + pool.drawId.slice(0, 8) + '</a></div></div>');
    stage.classList.add('reveal');
    if (stopConfetti) stopConfetti();
    stopConfetti = SR.confetti($('#confetti'), 7000);
    if (soundOK()) SR.sound.fanfare();
    rounds(show, tot);
  }
  function rounds(cur, tot) {
    const s = store.get();
    if (!cur || demo) { $('#rounds').innerHTML = ''; return; }
    $('#rounds').innerHTML = Array.from({ length: tot }, (_, i) => {
      const w = s.winners[i];
      return '<span class="' + (i + 1 === cur ? 'on' : '') + '">Round ' + (i + 1) + (w ? ' \u00b7 ' + esc(w.label) : i === s.winners.length ? ' \u00b7 up next' : '') + '</span>';
    }).join('');
  }

  /* Demo draw (only when no pool is locked on this device) */
  let demoWinner = null;
  function demoDraw() {
    if (!demo || demoState.mode === 'brake') return;
    SR.sound.unlock();
    if (demoState.mode === 'locked') { demoState = SR.resumeIdle(demoState, Date.now()); demoState.reveal = null; tape.setState(demoState); sync(); return; }
    const pick = SR.csprngIndex(pool.slots.length);
    const sl = pool.slots[pick.index];
    demoWinner = { slot: pick.index, name: pool.names[pick.index], label: sl.label, tag: sl.tag };
    demoState = SR.planBrake(demoState, Date.now(), pick.index);
    tape.setState(demoState); sync();
  }

  /* Events */
  window.addEventListener('storage', e => {
    if (e.key === store.KEY) {
      const s = store.get();
      if (!!s.pool !== !demo || (s.pool && pool && s.pool.drawId !== pool.drawId)) { load(); return; }
      if (s.pool) { pool = s.pool; tape.setPool(pool.slots, pool.names, pool.settings.showTag); tape.setState(store.tape()); footer(); }
      sync();
    }
    if (e.key === store.TAPE && !demo) {
      const s = store.get(); if (s.pool) { pool = s.pool; tape.setPool(pool.slots, pool.names, pool.settings.showTag); }
      tape.setState(store.tape()); sync();
    }
  });
  document.addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); demoDraw(); }
    if (e.key === 'f' || e.key === 'F') toggleFS();
  });
  function toggleFS() { if (document.fullscreenElement) document.exitFullscreen(); else if (stage.requestFullscreen) stage.requestFullscreen().catch(() => { }); }
  $('#fs').onclick = toggleFS;
  const sb = $('#sound-btn');
  sb.innerHTML = icon('volume') + '<span class="lbl">Click to enable sound</span>'; sb.setAttribute('aria-label', 'Enable sound');
  sb.onclick = () => { SR.sound.unlock(); audioOn = true; SR.sound.tick(); sb.remove(); };
  store.ping(); setInterval(() => store.ping(), 2000);
  window.addEventListener('beforeunload', () => { try { localStorage.removeItem(store.PING); } catch (e) { } });
  window.addEventListener('resize', () => { if (stopConfetti && stage.classList.contains('reveal')) { stopConfetti(); stopConfetti = SR.confetti($('#confetti'), 3000); } });

  load();
})();
