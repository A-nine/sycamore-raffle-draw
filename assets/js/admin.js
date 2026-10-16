/* Sycamore Raffle Draw \u2014 admin console */
(function () {
  'use strict';
  const { icon, logo, $, $$, esc, fmt, pad5, isoNow, hhmmss, shortHash, toast, store } = SR;
  const app = $('#app');
  const AUTH = 'sr.auth';
  const auth = {
    get() { try { return sessionStorage.getItem(AUTH) || ''; } catch (e) { return ''; } },
    set(v) { try { v ? sessionStorage.setItem(AUTH, v) : sessionStorage.removeItem(AUTH); } catch (e) { } },
    email() { try { return sessionStorage.getItem('sr.email') || 'tolu.adebayo@sycamore.ng'; } catch (e) { return ''; } }
  };
  const stageURL = () => new URL('stage.html', location.href).href;
  const verifyURL = id => new URL('verify.html' + (id ? '?id=' + id : ''), location.href).href;
  let cleanup = [];
  const onCleanup = fn => cleanup.push(fn);

  /* ---------------- Router ---------------- */
  const routes = { signin, mfa, overview, upload, rules, review, control, pools, audit, settings };
  function go(r) { location.hash = '#/' + r; }
  function route() {
    cleanup.forEach(f => { try { f(); } catch (e) { } }); cleanup = [];
    let r = (location.hash.replace(/^#\/?/, '') || 'overview').split('?')[0];
    if (!routes[r]) r = 'overview';
    const a = auth.get();
    if (r !== 'signin' && r !== 'mfa' && a !== 'ok') r = a === 'mfa' ? 'mfa' : 'signin';
    if (r === 'mfa' && a !== 'mfa') r = a === 'ok' ? 'overview' : 'signin';
    if (r === 'signin' && a === 'ok') r = 'overview';
    document.title = 'Sycamore Raffle Draw \u2014 ' + ({ signin: 'Sign in', mfa: 'Verify', control: 'Control room' }[r] || r[0].toUpperCase() + r.slice(1));
    routes[r]();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ---------------- Shell ---------------- */
  const NAV = [
    ['overview', 'grid', 'Overview'], ['upload', 'plus', 'New draw'], ['pools', 'users', 'Entrant pools'],
    ['rules', 'sliders', 'Rules & duplicates'], ['control', 'radio', 'Live control'], ['audit', 'shield', 'Audit log'], ['settings', 'key', 'Settings']
  ];
  function shell(active, html) {
    const email = auth.email();
    const nm = email.split('@')[0].split(/[._-]/).map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ').trim() || 'Admin';
    const ini = nm.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    app.innerHTML =
      '<div class="mobile-bar">' + logo({ white: true, href: '#/overview' }) + '<button aria-label="Open menu" data-menu>' + icon('menu') + '</button></div>' +
      '<div class="shell"><aside class="sidebar">' +
      '<div class="brand">' + logo({ white: true, href: '#/overview' }) + '<span class="pill-gold">RAFFLE DRAW</span></div>' +
      '<nav class="nav"><div class="eyebrow">Workspace</div>' +
      NAV.map(([r, ic, label]) => '<a href="#/' + r + '" class="' + (r === active ? 'active' : '') + '">' + icon(ic) + label + '</a>').join('') +
      '</nav><div class="side-foot"><div class="stage-box"><div class="row" style="gap:8px;color:#fff;font-weight:700">' + icon('monitor') + 'Stage display</div>' +
      '<a href="stage.html" target="sycamore-stage">' + esc(stageURL().replace(/^https?:\/\//, '')) + '</a></div>' +
      '<div class="me"><div class="avatar">' + esc(ini) + '</div><div class="who"><b>' + esc(nm) + '</b><small>Raffle admin \u00b7 MFA on</small></div>' +
      '<button title="Sign out" data-signout>' + icon('logout') + '</button></div></div></aside>' +
      '<main class="main">' + html + '</main></div>';
    $('[data-signout]').onclick = () => { auth.set(''); go('signin'); };
    const sh = $('.shell');
    $('[data-menu]').onclick = () => sh.classList.toggle('nav-open');
    sh.addEventListener('click', e => { if (sh.classList.contains('nav-open') && !e.target.closest('.sidebar')) sh.classList.remove('nav-open'); });
  }
  function head(crumb, title, actions, sub) {
    return '<div class="page-head"><div><div class="crumb">' + crumb + '</div><h1>' + title + '</h1>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + '</div><div class="actions">' + (actions || '') + '</div></div>';
  }
  function stepper(n) {
    const steps = ['Upload entrants', 'Rules & duplicates', 'Review & lock', 'Go live'];
    const links = ['upload', 'rules', 'review', 'control'];
    return '<div class="card stepper">' + steps.map((s, i) => {
      const st = i + 1 < n ? 'done' : i + 1 === n ? 'on' : '';
      return (i ? '<div class="step-line ' + (i < n ? 'done' : '') + '"></div>' : '') +
        '<a class="step ' + st + '" href="#/' + links[i] + '" style="text-decoration:none"><span class="n">' + (st === 'done' ? icon('check') : i + 1) + '</span><span class="t">' + s + '</span></a>';
    }).join('') + '</div>';
  }
  function lockedNotice(s) {
    return '<div class="alert alert-info" style="margin-bottom:20px">' + icon('lock') + '<div><b>The pool is locked</b> for \u201c' + esc(s.pool.name) + '\u201d. Entrants and rules can\u2019t change now. ' +
      '<a class="link" href="#/control">Go to the control room</a> or <a class="link" href="#/settings">start a new draw</a>.</div></div>';
  }

  /* ---------------- A-01 Sign in ---------------- */
  function authArt() {
    return '<section class="auth-art">' + logo({ white: true }) +
      '<div class="art-tape stage-ish"></div>' +
      '<div class="eyebrow gold">Sycamore Raffle Draw</div><h1 style="margin-top:12px">Draws everyone can see are fair.</h1>' +
      '<p>Upload entrants, set the rules, then run a live draw. Every result comes with a SHA-256 audit trail.</p>' +
      '<div class="trust"><span>' + icon('shieldCheck') + 'TLS 1.3 everywhere</span><span>' + icon('lock') + 'AES-256-GCM at rest</span><span>' + icon('eyeOff') + 'PII masked on stage</span></div></section>';
  }
  function mountArtTape() {
    const host = $('.art-tape');
    const demo = SR.demoPool();
    const t = SR.mountTape(host, { worldWidth: 1100 });
    t.setPool(demo.slots, demo.names, true);
    t.setState({ mode: 'idle', speed: 180, playing: true, anchorT: Date.now(), anchorP: 0, seed: 3 });
    onCleanup(() => t.destroy());
  }
  function signin() {
    app.innerHTML = '<div class="auth">' + authArt() +
      '<section class="auth-form"><form novalidate>' +
      '<div><h2>Admin sign in</h2><p class="muted" style="margin-top:8px">Use your Sycamore work email. We\u2019ll ask for a one-time code next.</p></div>' +
      '<div class="field"><label for="em">Work email</label><input class="input" id="em" type="email" autocomplete="username" placeholder="you@sycamore.ng" value="' + esc(auth.email()) + '"><span class="help err hidden" id="em-err">Enter a valid email address.</span></div>' +
      '<div class="field"><label for="pw">Password</label><input class="input" id="pw" type="password" autocomplete="current-password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"><span class="help err hidden" id="pw-err">Enter your password.</span></div>' +
      '<div class="row between"><label class="check"><input type="checkbox" checked> Keep me signed in on this device</label><a class="link" style="font-size:13px" href="#/signin" onclick="return false">Forgot password?</a></div>' +
      '<button class="btn btn-primary btn-lg btn-block" type="submit">Continue ' + icon('arrowRight') + '</button>' +
      '<div class="note">' + icon('monitor') + '<span>Viewers don\u2019t need an account. Share the Stage display link from the control room.</span></div>' +
      '<div class="note">' + icon('info') + '<span><b>Demo build:</b> this static site has no auth server, so any email and password will work. Production needs the SISL backend for real sign-in and MFA.</span></div>' +
      '</form></section></div>';
    mountArtTape();
    $('form').onsubmit = e => {
      e.preventDefault();
      const em = $('#em'), pw = $('#pw');
      const okE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim()), okP = pw.value.length > 0;
      em.classList.toggle('err', !okE); $('#em-err').classList.toggle('hidden', okE);
      pw.classList.toggle('err', !okP); $('#pw-err').classList.toggle('hidden', okP);
      if (!okE || !okP) return;
      try { sessionStorage.setItem('sr.email', em.value.trim()); } catch (x) { }
      auth.set('mfa'); go('mfa');
    };
  }

  /* ---------------- A-02 MFA ---------------- */
  function mfa() {
    const em = auth.email();
    app.innerHTML = '<div class="auth">' + authArt() +
      '<section class="auth-form"><form novalidate>' +
      '<div class="lock-card" style="position:static;padding:0;background:none;color:var(--ink)"><div class="ico">' + icon('shieldCheck') + '</div></div>' +
      '<div><h2>Enter your 6-digit code</h2><p class="muted" style="margin-top:8px">Open your authenticator app for <b style="color:var(--ink)">' + esc(em) + '</b>.</p></div>' +
      '<div class="otp">' + Array.from({ length: 6 }, (_, i) => '<input inputmode="numeric" maxlength="1" aria-label="Digit ' + (i + 1) + '">').join('') + '</div>' +
      '<span class="help err hidden" id="otp-err">Enter all 6 digits.</span>' +
      '<button class="btn btn-primary btn-lg btn-block" type="submit">Verify and sign in</button>' +
      '<div class="row between" style="font-size:13px"><a class="link" href="#/signin" data-back>Use a different account</a><span class="muted">Demo: any 6 digits work</span></div>' +
      '</form></section></div>';
    mountArtTape();
    const boxes = $$('.otp input');
    boxes[0].focus();
    boxes.forEach((b, i) => {
      b.addEventListener('input', () => { b.value = b.value.replace(/\D/g, '').slice(-1); if (b.value && boxes[i + 1]) boxes[i + 1].focus(); });
      b.addEventListener('keydown', e => { if (e.key === 'Backspace' && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });
      b.addEventListener('paste', e => {
        const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
        if (d.length) { e.preventDefault(); d.split('').forEach((c, k) => { if (boxes[k]) boxes[k].value = c; }); (boxes[d.length] || boxes[5]).focus(); }
      });
    });
    $('[data-back]').onclick = () => auth.set('');
    $('form').onsubmit = e => {
      e.preventDefault();
      const code = boxes.map(b => b.value).join('');
      const ok = /^\d{6}$/.test(code);
      $('#otp-err').classList.toggle('hidden', ok);
      if (!ok) return;
      auth.set('ok'); go('overview');
    };
  }

  /* ---------------- A-03 Overview ---------------- */
  function overview() {
    const s = store.get(), audits = Object.values(store.audits()).sort((a, b) => b.lockedAt.localeCompare(a.lockedAt));
    const nm = (auth.email().split('@')[0].split(/[._-]/)[0] || 'there');
    const hr = new Date().getHours();
    const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
    const entrants = audits.reduce((n, a) => n + (a.rowsRead || 0), 0);
    const parse = s.draft.stats && s.draft.stats.ms ? (s.draft.stats.ms / 1000).toFixed(1) + ' s' : '\u2014';
    const p = s.pool;
    const done = p ? s.winners.length : 0;
    let heroHTML;
    if (p) {
      const status = done >= p.settings.winners ? '<span class="badge badge-success">All winners drawn</span>' : '<span class="badge badge-live">Ready to go live</span>';
      heroHTML = '<div class="hero-draw"><div class="row" style="flex-wrap:wrap">' + status + '<span class="meta" style="font-size:13px">' + esc(fmtDate(p.date)) + '</span></div>' +
        '<h2>' + esc(p.name) + '</h2><p class="meta">' + fmt(p.slotsCount) + ' slots \u00b7 ' + modeLabel(p.mode) + ' \u00b7 Pool locked at ' + new Date(p.lockedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' \u00b7 ' + done + ' of ' + p.settings.winners + ' winners drawn</p>' +
        '<div class="actions"><a class="btn btn-gold" href="#/control">Open control room ' + icon('arrowRight') + '</a><a class="btn btn-ondark" href="verify.html?id=' + p.drawId + '" target="_blank">View certificate</a></div>' +
        '<span class="hash-chip">pool ' + shortHash(p.poolHash) + '</span></div>';
    } else if (s.draft.rows.length) {
      heroHTML = '<div class="hero-draw"><span class="badge badge-ondark" style="align-self:flex-start">Draft</span><h2>' + esc(s.draft.name || 'Untitled draw') + '</h2>' +
        '<p class="meta">' + fmt(s.draft.rows.length) + ' valid entries uploaded. Set rules, then lock the pool.</p>' +
        '<div class="actions"><a class="btn btn-gold" href="#/rules">Continue setup ' + icon('arrowRight') + '</a></div></div>';
    } else {
      heroHTML = '<div class="hero-draw"><span class="badge badge-ondark" style="align-self:flex-start">No draw yet</span><h2>Start your first draw</h2>' +
        '<p class="meta">Upload a CSV of entrants. You can try it with our 12,517-row sample file.</p>' +
        '<div class="actions"><a class="btn btn-gold" href="#/upload">Start a new draw ' + icon('arrowRight') + '</a></div></div>';
    }
    const ck = [
      ['CSV uploaded and parsed', !!s.draft.rows.length || !!p],
      ['Duplicate rule set: ' + modeLabel((p || s).mode || s.rules.mode), !!p || !!s.draft.rows.length],
      ['Pool locked and hashed', !!p],
      ['Stage display connected', store.stageAlive()],
      ['Sound check', !!(p ? p.settings.sound : s.settings.sound)]
    ];
    shell('overview',
      head('Workspace / Overview', greet + ', ' + esc(nm[0].toUpperCase() + nm.slice(1)),
        '<a class="btn btn-secondary" href="stage.html" target="sycamore-stage">Open stage display</a><a class="btn btn-gold" href="#/upload">Start a new draw ' + icon('arrowRight') + '</a>',
        p ? 'You have one draw ready to go live.' : 'Run fair, auditable draws in four steps.') +
      '<div class="stats">' +
      stat('Draws run', audits.length, 'On this device') +
      stat('Entrants processed', fmt(entrants), 'Across ' + audits.length + ' pool' + (audits.length === 1 ? '' : 's')) +
      stat('Audits verifiable', audits.length + ' / ' + audits.length, 'SHA-256 pool hashes') +
      stat('Last parse time', parse, 'Most recent CSV') + '</div>' +
      '<div class="grid-2" style="grid-template-columns:minmax(0,1fr) 360px;margin-bottom:20px">' + heroHTML +
      '<div class="card card-pad"><h3>Pre-show checklist</h3><ul class="checklist">' + ck.map(([t, on]) => '<li><span class="tick ' + (on ? 'on' : '') + '">' + (on ? icon('check') : '') + '</span>' + esc(t) + '</li>').join('') + '</ul></div></div>' +
      '<div class="card"><div class="row between card-pad" style="padding-bottom:16px"><h3>Recent draws</h3><a class="link" href="#/audit" style="font-size:14px;text-decoration:none">View audit log \u2192</a></div>' + drawsTable(audits) + '</div>');
  }
  function stat(label, val, sub) { return '<div class="card stat"><div class="eyebrow">' + label + '</div><b>' + val + '</b><small>' + sub + '</small></div>'; }
  function modeLabel(m) { return m === 'UNIQUE_ENTRANT' ? 'Unique entrant' : 'Weighted'; }
  function fmtDate(d) { if (!d) return 'Date not set'; const x = new Date(d); return isNaN(x) ? d : x.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  function drawsTable(audits) {
    if (!audits.length) return '<div class="empty"><h3>No draws yet</h3><p>Locked pools and winners show up here with their audit links.</p></div>';
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Draw</th><th>Locked</th><th>Rule</th><th>Pool</th><th>Winners</th><th>Status</th></tr></thead><tbody>' +
      audits.map(a => {
        const n = (a.winners || []).length, tot = a.replacement != null ? a.winnersPlanned : 0;
        const st = n && n >= (a.winnersPlanned || 1) ? '<span class="badge badge-success">Complete</span>' : n ? '<span class="badge badge-info">In progress</span>' : '<span class="badge badge-live">Ready</span>';
        void tot;
        return '<tr><td><a class="link" style="text-decoration:none" href="verify.html?id=' + a.drawId + '" target="_blank">' + esc(a.name) + '</a></td><td>' + new Date(a.lockedAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) + '</td><td>' + modeLabel(a.mode) + '</td><td>' + fmt(a.slotsCount) + '</td><td>' + (n ? esc(a.winners.map(w => w.label).join(', ')) : '\u2014') + '</td><td>' + st + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* ---------------- A-04 Upload ---------------- */
  function upload() {
    const s = store.get();
    if (s.pool) { shell('upload', head('New draw / Step 1 of 4', 'Upload entrants') + lockedNotice(s)); return; }
    const d = s.draft, err = d.error;
    const fileCard = d.file && !err ? '<div class="card file-row"><div class="file-ico">' + icon('file') + '</div><div style="flex:1;min-width:0"><b>' + esc(d.file.name) + '</b><div class="help">' + (d.file.size / 1048576).toFixed(1) + ' MB \u00b7 ' + d.file.encoding + ' detected' + (d.file.encoding !== 'UTF-8' ? ', converted to UTF-8' : '') + ' \u00b7 ' + d.file.delimiter + '-separated \u00b7 header row found</div></div><span class="badge badge-success">Parsed in ' + ((d.stats.ms || 0) / 1000).toFixed(1) + ' s</span><button class="btn btn-sm btn-secondary" data-clear title="Remove file">' + icon('trash') + '</button></div>'
      : err ? '<div class="card file-row" style="border-color:#fecaca"><div class="file-ico err">' + icon('alert') + '</div><div style="flex:1;min-width:0"><b>' + esc(err.file || 'File') + '</b><div class="help err">' + esc(err.message) + '</div></div><button class="btn btn-sm btn-secondary" data-clear>' + icon('trash') + '</button></div>' : '';
    let summary;
    if (err) {
      summary = '<div class="card card-pad"><h3>We couldn\u2019t read this file</h3><div class="alert alert-error" style="margin-top:16px">' + icon('alert') + '<div><b>' + esc(err.message) + '</b>' + (err.header ? '<div style="margin-top:6px">Columns found: <span class="mono">' + esc(err.header.join(' \u00b7 ') || '(none)') + '</span></div>' : '') + '</div></div>' +
        '<p class="help" style="margin-top:14px">Fix: add a header row with a column called <b>Name</b> or <b>Full Name</b>. Email and Identifier are optional. Use UTF-8, UTF-8-BOM or ISO-8859-1 with comma, semicolon or tab separators.</p></div>';
    } else if (d.stats) {
      const prev = d.rows.slice(0, 4);
      summary = '<div class="card card-pad"><h3>Parse summary</h3><div style="margin-top:10px">' +
        '<div class="kv"><span>Total rows read</span><b>' + fmt(d.stats.read) + '</b></div>' +
        '<div class="kv"><span>Empty or blank rows removed</span><b class="muted">' + fmt(d.stats.blank) + '</b></div>' +
        '<div class="kv"><span>Valid entries</span><b style="color:var(--success)">' + fmt(d.stats.valid) + '</b></div></div>' +
        '<div class="eyebrow" style="margin:18px 0 10px">Columns detected</div><div class="chips"><span class="badge badge-success">' + esc(d.columns.name) + ' \u00b7 required</span>' +
        (d.columns.email ? '<span class="badge badge-info">' + esc(d.columns.email) + '</span>' : '') + (d.columns.id ? '<span class="badge badge-info">' + esc(d.columns.id) + ' (identifier)</span>' : '') + '</div>' +
        '<div class="eyebrow" style="margin:18px 0 10px">Preview \u00b7 first ' + prev.length + ' rows</div><div class="mini-table"><table><thead><tr><th>Full name</th><th>Email</th><th>Tag</th></tr></thead><tbody>' +
        prev.map(r => '<tr><td>' + esc(r.name) + '</td><td class="mono">' + esc(SR.maskEmail(r.email)) + '</td><td class="mono">' + esc(SR.maskTag(r) || '\u2014') + '</td></tr>').join('') + '</tbody></table></div>' +
        '<p class="help" style="margin-top:12px;display:flex;gap:6px;align-items:center">' + icon('eyeOff') + 'Emails and tags are masked here and on stage.</p></div>';
    } else {
      summary = '<div class="card card-pad"><h3>Parse summary</h3><div class="empty" style="padding:32px 8px">' + icon('file') + '<p style="margin-top:10px">Upload a CSV to see row counts, detected columns and a masked preview.</p></div></div>';
    }
    shell('upload',
      head('New draw / Step 1 of 4', 'Upload entrants', '<button class="btn btn-secondary" data-save>Save draft</button><button class="btn btn-primary" data-next ' + (d.rows.length ? '' : 'disabled') + '>Continue to rules ' + icon('arrowRight') + '</button>') +
      stepper(1) +
      '<div class="grid-2"><div class="stack"><div class="card card-pad"><h3>Draw details</h3><div class="grid-2" style="grid-template-columns:1fr 1fr;margin-top:16px;gap:16px">' +
      '<div class="field"><label for="dn">Draw name</label><input class="input" id="dn" value="' + esc(d.name) + '"></div>' +
      '<div class="field"><label for="dd">Event date &amp; time</label><input class="input" id="dd" type="datetime-local" value="' + esc(d.date) + '"></div></div></div>' +
      '<label class="drop" id="drop"><input type="file" accept=".csv,text/csv,text/plain" class="sr-only" id="file"><div class="ico">' + icon('upload') + '</div>' +
      '<b>Drop ' + (d.file ? 'a new CSV to replace' : 'your CSV here') + ', or <a>browse files</a></b><p class="help" style="margin-top:8px">.csv only \u00b7 UTF-8, UTF-8-BOM or ISO-8859-1 \u00b7 comma, semicolon or tab \u00b7 up to 100,000 rows</p></label>' +
      fileCard +
      '<p class="help">No file handy? <a class="link" href="#" data-sample>Use the 12,517-row sample file</a> or <a class="link" href="assets/sample/entrants_aug26.csv" download>download it</a>.</p>' +
      '</div>' + summary + '</div>');

    const saveDetails = () => store.update(x => { x.draft.name = $('#dn').value.trim(); x.draft.date = $('#dd').value; });
    $('#dn').onchange = saveDetails; $('#dd').onchange = saveDetails;
    $('[data-save]').onclick = () => { saveDetails(); toast('Draft saved on this device'); };
    $('[data-next]').onclick = () => { saveDetails(); go('rules'); };
    const clear = $('[data-clear]');
    if (clear) clear.onclick = e => { e.preventDefault(); store.update(x => { x.draft.file = null; x.draft.rows = []; x.draft.stats = null; x.draft.columns = null; x.draft.error = null; }); upload(); };
    const drop = $('#drop');
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) handleFile(f); });
    $('#file').onchange = e => { const f = e.target.files[0]; if (f) handleFile(f); };
    $('[data-sample]').onclick = async e => {
      e.preventDefault();
      try {
        const r = await fetch('assets/sample/entrants_aug26.csv');
        if (!r.ok) throw new Error();
        const buf = await r.arrayBuffer();
        process(buf, 'entrants_aug26.csv');
      } catch (x) { toast('Couldn\u2019t load the sample here. Download it with the link and drop it in.', 'err'); }
    };
  }
  async function handleFile(f) {
    if (!/\.(csv|txt)$/i.test(f.name)) { store.update(x => { x.draft.error = { file: f.name, message: 'Only .csv files are accepted.' }; }); upload(); return; }
    process(await f.arrayBuffer(), f.name);
  }
  function process(buf, name) {
    const t0 = performance.now();
    try {
      const res = SR.ingest(buf, name);
      res.stats.ms = Math.max(50, Math.round(performance.now() - t0));
      const ok = store.update(x => {
        x.draft.file = res.file; x.draft.rows = res.rows; x.draft.stats = res.stats; x.draft.columns = res.columns; x.draft.error = null;
        store.log(x, 'CSV parsed \u00b7 ' + fmt(res.stats.valid) + ' valid', 'info');
      });
      void ok;
      toast(fmt(res.stats.valid) + ' valid entries found');
    } catch (e) {
      store.update(x => { x.draft.file = null; x.draft.rows = []; x.draft.stats = null; x.draft.error = { file: name, message: e.message || String(e), header: e.header }; });
    }
    upload();
  }

  /* ---------------- A-05 Rules & duplicates ---------------- */
  function rules() {
    const s = store.get();
    if (s.pool) { shell('rules', head('New draw / Step 2 of 4', 'Rules & duplicates') + lockedNotice(s)); return; }
    if (!s.draft.rows.length) { shell('rules', head('New draw / Step 2 of 4', 'Rules & duplicates') + stepper(2) + '<div class="card empty"><h3>Upload entrants first</h3><p>Rules work on the names in your CSV.</p><a class="btn btn-primary" style="margin-top:16px" href="#/upload">Go to upload</a></div>'); return; }
    const r = s.rules, a = SR.analyse(s.draft.rows, r);
    const RULES = [
      ['nfkc', 'Unicode clean-up', 'NFKC', 'J\u0101ne Doe \u2192 Jane Doe'],
      ['lower', 'Ignore capitals', 'lowercase', 'Jane DOE \u2192 jane doe'],
      ['punct', 'Remove punctuation', 'a-z 0-9 and spaces only', 'Jane-Doe, Jr. \u2192 janedoe jr'],
      ['spaces', 'Tidy spaces', 'trim + collapse', '\u201c  Jane   Doe \u201d \u2192 jane doe']
    ];
    const on = RULES.filter(x => r[x[0]]).length;
    const mode = (id, title, desc, n) => '<label class="mode ' + (r.mode === id ? 'on' : '') + '"><input type="radio" name="mode" value="' + id + '" ' + (r.mode === id ? 'checked' : '') + '><span class="radio"></span>' +
      '<span class="mono muted" style="font-size:12px">' + id + '</span><h3>' + title + '</h3><p>' + desc + '</p><div class="pool"><div class="eyebrow">Pool size</div><b>' + fmt(n) + ' slots</b></div></label>';
    const top = a.top[0];
    shell('rules',
      head('New draw / Step 2 of 4', 'Rules & duplicates', '<a class="btn btn-secondary" href="#/upload">Back</a><a class="btn btn-primary" href="#/review">Continue to review ' + icon('arrowRight') + '</a>') +
      stepper(2) +
      '<div class="grid-2"><div class="stack"><div><h3 style="font-size:20px">How should duplicates count?</h3><p class="muted" style="margin-top:4px">Choose before you lock the pool. You can\u2019t change this once the draw starts.</p></div>' +
      '<div class="mode-cards">' + mode('UNIQUE_ENTRANT', 'Unique entrants', 'One slot per person. Rows with the same normalised name are merged, and the first spelling is shown.', a.uniqueCount) +
      mode('WEIGHTED_SLOT', 'Weighted slots', 'Every valid row is its own slot. People with more entries have better odds.', a.weightedCount) + '</div>' +
      '<div class="card card-pad"><div class="row between" style="align-items:flex-start"><div><h3>Name matching rules</h3><p class="help" style="margin-top:4px">Applied in order to build the key used to find duplicates. The name shown on stage doesn\u2019t change.</p></div><span class="badge badge-info">' + on + ' of 4 on</span></div>' +
      '<div style="margin-top:14px">' + RULES.map(([k, t, sub, ex], i) => '<div class="rule"><span class="ix">' + (i + 1) + '</span><div><b>' + t + '</b><div class="mono muted" style="font-size:12px;margin-top:2px">' + sub + '</div></div><span class="ex">' + esc(ex) + '</span><label class="switch"><input type="checkbox" data-rule="' + k + '" ' + (r[k] ? 'checked' : '') + '><span></span></label></div>').join('') + '</div>' +
      (!r.punct ? '<p class="help" style="margin-top:10px;display:flex;gap:6px;align-items:center">' + icon('info') + 'Punctuation is off, so \u201cjane-doe\u201d stays separate from \u201cjane doe\u201d. Turn it on to merge them.</p>' : '') + '</div></div>' +
      '<div class="card card-pad"><h3>Duplicate preview</h3><div class="dup-head"><div><div class="eyebrow">Duplicate rows</div><b>' + fmt(a.dupRows) + '</b></div><div><div class="eyebrow">People affected</div><b>' + fmt(a.peopleAffected) + '</b></div></div>' +
      '<div class="eyebrow" style="margin-bottom:4px">Biggest groups</div>' +
      (a.top.length ? a.top.map(g => '<div class="dup"><div><b>' + esc(g.name.trim()) + '</b><small>key: ' + esc(g.key) + '</small></div><span class="badge badge-info no-dot">\u00d7 ' + g.n + ' ' + (r.mode === 'WEIGHTED_SLOT' ? 'slots' : 'rows') + '</span></div>').join('') : '<p class="help" style="padding:12px 0">No duplicates with these rules.</p>') +
      (top ? '<div class="alert alert-info" style="margin-top:16px">' + icon('shuffle') + '<div>' + (r.mode === 'WEIGHTED_SLOT'
        ? 'Weighted is on. ' + esc(top.name.trim()) + ' has ' + top.n + ' of ' + fmt(a.weightedCount) + ' slots, so a ' + (top.n / a.weightedCount * 100).toFixed(2) + '% chance.'
        : 'Unique is on. ' + esc(top.name.trim()) + '\u2019s ' + top.n + ' rows become one slot of ' + fmt(a.uniqueCount) + '.') + '</div></div>' : '') +
      '</div></div>');
    $$('input[name=mode]').forEach(i => i.onchange = () => { store.update(x => { x.rules.mode = i.value; store.log(x, 'Rule set: ' + i.value, ''); }); rules(); });
    $$('[data-rule]').forEach(i => i.onchange = () => { store.update(x => { x.rules[i.dataset.rule] = i.checked; }); rules(); });
  }

  /* ---------------- A-06 Review & lock ---------------- */
  function review() {
    const s = store.get();
    if (!s.pool && !s.draft.rows.length) { shell('review', head('New draw / Step 3 of 4', 'Review & lock') + stepper(3) + '<div class="card empty"><h3>Nothing to review yet</h3><p>Upload entrants and choose rules first.</p><a class="btn btn-primary" style="margin-top:16px" href="#/upload">Go to upload</a></div>'); return; }
    const p = s.pool, st = p ? p.settings : s.settings, r = p ? p.rules : s.rules;
    const a = p ? null : SR.analyse(s.draft.rows, r);
    const poolSize = p ? p.slotsCount : (r.mode === 'UNIQUE_ENTRANT' ? a.uniqueCount : a.weightedCount);
    const people = p ? p.people : a.uniqueCount;
    const dis = p ? 'disabled' : '';
    const matching = ['nfkc', 'lower', 'punct', 'spaces'].filter(k => r[k]).map(k => ({ nfkc: 'Unicode NFKC', lower: 'lowercase', punct: 'no punctuation', spaces: 'tidy spaces' }[k])).join(' \u00b7 ') || 'Exact match';
    const kv = (k, v) => '<div class="kv"><span class="muted">' + k + '</span><b style="font-size:14px;text-align:right">' + v + '</b></div>';
    shell('review',
      head('New draw / Step 3 of 4', 'Review & lock', '<a class="btn btn-secondary" href="#/rules">Back</a><a class="btn btn-primary" href="#/control" ' + (p ? '' : 'style="pointer-events:none;opacity:.45" aria-disabled="true"') + '>Open control room ' + icon('arrowRight') + '</a>') +
      stepper(p ? 4 : 3) +
      '<div class="grid-2"><div class="stack"><div class="card card-pad"><div class="row between"><h3>Summary</h3>' + (p ? '<span class="badge badge-success">Locked</span>' : '<a class="link" href="#/upload" style="text-decoration:none;font-size:14px">Edit</a>') + '</div><div style="margin-top:10px">' +
      kv('Draw', esc(p ? p.name : s.draft.name || 'Untitled draw')) + kv('Event', esc(fmtDate(p ? p.date : s.draft.date))) +
      kv('Source file', esc((p ? p.file : s.draft.file || {}).name || '\u2014') + ' \u00b7 ' + fmt(p ? p.valid : s.draft.stats.valid) + ' valid of ' + fmt(p ? p.rowsRead : s.draft.stats.read) + ' rows') +
      kv('Duplicate rule', (r.mode === 'UNIQUE_ENTRANT' ? 'Unique entrants' : 'Weighted slots') + ' \u00b7 ' + r.mode) + kv('Name matching', matching) + kv('Pool size', fmt(poolSize) + ' slots \u00b7 ' + fmt(people) + ' people') + '</div></div>' +
      '<div class="card card-pad"><h3>Draw settings</h3>' +
      '<div class="setting" style="border-top:0;margin-top:6px"><div><b>Number of winners</b><small>Draws run one at a time from the control room.</small></div><div class="counter"><button data-w="-1" ' + dis + ' aria-label="Fewer">\u2212</button><span id="wn">' + st.winners + '</span><button data-w="1" ' + dis + ' aria-label="More">+</button></div></div>' +
      '<div class="eyebrow" style="margin:10px 0 10px">After someone wins</div><div class="opt-cards">' +
      '<label class="opt ' + (!st.replacement ? 'on' : '') + '"><input type="radio" name="rep" value="0" ' + (!st.replacement ? 'checked' : '') + ' ' + dis + '><div><b>Remove them from later rounds</b><small>Draw without replacement. Each person can win once.</small></div></label>' +
      '<label class="opt ' + (st.replacement ? 'on' : '') + '"><input type="radio" name="rep" value="1" ' + (st.replacement ? 'checked' : '') + ' ' + dis + '><div><b>Keep them in the pool</b><small>Draw with replacement. They could win again.</small></div></label></div>' +
      '<div class="setting" style="margin-top:16px"><div><b>Show masked tag on stage</b><small>Helps tell apart people with the same name, e.g. @ada\u2022\u2022\u202289.</small></div><label class="switch"><input type="checkbox" data-set="showTag" ' + (st.showTag ? 'checked' : '') + '><span></span></label></div>' +
      '<div class="setting"><div><b>Sound effects</b><small>Royalty-free synth presets: tick, brake, fanfare.</small></div><label class="switch"><input type="checkbox" data-set="sound" ' + (st.sound ? 'checked' : '') + '><span></span></label></div>' +
      '</div></div>' +
      '<div class="lock-card"><div class="ico">' + icon(p ? 'check' : 'lock') + '</div><h2>' + (p ? 'Pool locked' : 'Lock the pool') + '</h2>' +
      '<p>' + (p ? 'The entrant list is frozen. This hash is published on the stage and the verify page, so anyone can check the pool wasn\u2019t changed.' : 'Locking freezes the entrant list and computes a SHA-256 hash over the ordered slots. After this you can\u2019t edit entrants or rules.') + '</p>' +
      '<div class="hashbox ' + (p ? 'done' : '') + '"><div class="eyebrow cyan">Pool hash \u00b7 SHA-256</div><code id="hash">' + (p ? p.poolHash : 'Computed when you lock') + '</code></div>' +
      (p ? '<div class="lock-kv"><span>Draw ID</span><span>' + p.drawId.slice(0, 18) + '\u2026</span></div><div class="lock-kv"><span>Locked</span><span>' + p.lockedAt + '</span></div>' : '') +
      '<div class="lock-kv"><span>Slots</span><span>' + fmt(poolSize) + ' \u00b7 ' + r.mode + '</span></div><div class="lock-kv"><span>Random source</span><span>CSPRNG (crypto.getRandomValues)</span></div>' +
      (p ? '<a class="btn btn-gold btn-lg btn-block" style="margin-top:18px" href="#/control">Open control room ' + icon('arrowRight') + '</a>'
        : '<button class="btn btn-gold btn-lg btn-block" style="margin-top:18px" data-lock>' + icon('lock') + 'Lock pool &amp; compute hash</button>') + '</div></div>');

    if (!p) {
      $$('[data-w]').forEach(b => b.onclick = () => { store.update(x => { x.settings.winners = Math.max(1, Math.min(20, x.settings.winners + Number(b.dataset.w))); }); review(); });
      $$('input[name=rep]').forEach(i => i.onchange = () => { store.update(x => { x.settings.replacement = i.value === '1'; }); review(); });
      $('[data-lock]').onclick = lockPool;
    }
    $$('[data-set]').forEach(i => i.onchange = () => {
      store.update(x => { x.settings[i.dataset.set] = i.checked; if (x.pool) x.pool.settings[i.dataset.set] = i.checked; });
      store.setTape(Object.assign(store.tape(), { bump: Date.now() }));
    });
  }
  async function lockPool() {
    const btn = $('[data-lock]'); btn.disabled = true; btn.textContent = 'Computing hash\u2026';
    const s = store.get();
    const { slots, names, analysis } = SR.buildPool(s.draft.rows, s.rules);
    const poolHash = await SR.sha256Hex(JSON.stringify(slots));
    const pool = {
      drawId: SR.uuid(), name: s.draft.name || 'Untitled draw', date: s.draft.date, lockedAt: isoNow(), poolHash,
      mode: s.rules.mode, rules: Object.assign({}, s.rules), settings: Object.assign({}, s.settings),
      file: s.draft.file, rowsRead: s.draft.stats.read, valid: s.draft.stats.valid, slotsCount: slots.length, people: analysis.uniqueCount,
      slots, names, piiPurged: false
    };
    s.pool = pool; s.winners = [];
    store.log(s, 'Pool locked \u00b7 ' + poolHash.slice(0, 4) + '\u2026' + poolHash.slice(-4), 'ok');
    if (!store.set(s)) { toast('This browser is out of storage. Try a smaller file.', 'err'); btn.disabled = false; return; }
    saveAudit(s);
    const seed = SR.csprngIndex(100000).index;
    store.setTape({ mode: 'idle', speed: 300, playing: true, anchorT: Date.now(), anchorP: 0, seed, reveal: null });
    toast('Pool locked. Hash ' + shortHash(poolHash));
    review();
  }
  function saveAudit(s) {
    const p = s.pool;
    store.saveAudit({
      v: 1, drawId: p.drawId, name: p.name, date: p.date, lockedAt: p.lockedAt, poolHash: p.poolHash, mode: p.mode, rules: p.rules,
      rowsRead: p.rowsRead, valid: p.valid, slotsCount: p.slotsCount, replacement: !!p.settings.replacement, winnersPlanned: p.settings.winners,
      rng: 'crypto.getRandomValues (uint32) + rejection sampling; index = value % eligible.length',
      slots: p.slots,
      winners: s.winners.map(w => ({ round: w.round, slot: w.slot, label: w.label, value: w.value, eligible: w.eligible, at: w.at }))
    });
  }

  /* ---------------- A-07 / A-08 Control room ---------------- */
  function control() {
    const s = store.get(), p = s.pool;
    if (!p) { shell('control', head('Live control', 'Control room') + '<div class="card empty"><h3>No locked pool yet</h3><p>Lock a pool on the Review step to go live.</p><a class="btn btn-primary" style="margin-top:16px" href="#/review">Go to review</a></div>'); return; }
    shell('control',
      head('Live control / ' + esc(p.name), 'Control room', '<a class="btn btn-secondary" href="stage.html" target="sycamore-stage">Open stage ' + icon('external') + '</a><button class="btn btn-danger" data-end>End event</button>') +
      '<div class="row" style="gap:8px;margin:-12px 0 20px;flex-wrap:wrap"><span class="badge" id="stage-badge"></span><span class="badge badge-info" id="mode-badge"></span></div>' +
      '<div class="control-grid"><div><div class="row between" style="margin-bottom:10px"><span class="eyebrow">Stage preview \u00b7 what viewers see</span><span class="help">Same clock as the stage</span></div>' +
      '<div class="preview" id="preview" style="--band:130px"><div class="ptop"><div>' + logo({ white: true }) + '<div class="ptitle">' + esc(p.name) + '</div></div><span class="badge badge-live">LIVE</span></div>' +
      '<div class="pfoot">' + fmt(p.slotsCount) + ' slots in the pool \u00b7 pool hash ' + shortHash(p.poolHash) + '</div></div>' +
      '<div class="card speed"><button class="play" data-play aria-label="Pause or play tape"></button><div class="grow"><div class="row between"><b>Tape speed</b><span class="mono" id="spd"></span></div>' +
      '<input type="range" class="range" min="100" max="1200" step="10" id="speed" style="margin:10px 0 4px"><div class="row between help mono"><span>100</span><span>1200 px/s</span></div></div>' +
      '<label class="row" style="gap:10px">' + icon('volume') + 'Sound<span class="switch"><input type="checkbox" id="snd"><span></span></span></label></div></div>' +
      '<div class="stack"><div id="drawbox"></div><div class="card card-pad"><div class="row between"><h3>Event log</h3><span class="help">UTC</span></div><ul class="log" id="log"></ul></div>' +
      '<div class="card card-pad"><h3>Audit</h3><p class="help" style="margin:6px 0 14px">Draw ID <span class="mono">' + p.drawId + '</span></p><div class="actions"><a class="btn btn-secondary btn-sm" href="verify.html?id=' + p.drawId + '" target="_blank">' + icon('shieldCheck') + 'Verify page</a><button class="btn btn-danger btn-sm" data-purge ' + (p.piiPurged ? 'disabled' : '') + '>' + icon('trash') + (p.piiPurged ? 'PII purged' : 'Purge PII') + '</button></div></div></div></div>');

    const tape = SR.mountTape($('#preview'), { worldWidth: 1050, onTick: () => { if (!store.stageAlive() && store.get().pool.settings.sound) SR.sound.tick(); } });
    tape.setPool(p.slots, p.names, p.settings.showTag);
    tape.setState(store.tape());
    let loggedReveal = null;
    const soundHere = () => !store.stageAlive() && store.get().pool.settings.sound;
    const finish = st => {
      const r = SR.finishBrake(st);
      if (!r) return;
      tape.setState(r.state);
      if (r.fresh && soundHere()) SR.sound.lock();
      SR.scheduleReveal(r.state.lockedAt, did => { if (did && soundHere()) SR.sound.fanfare(); tape.setState(store.tape()); renderSide(); });
      renderSide();
    };
    tape.onLock = finish;
    onCleanup(() => tape.destroy());

    function renderSide() {
      const s = store.get(), p = s.pool, t = store.tape();
      tape.frameEl.classList.toggle('locked', t.mode === 'locked');
      const alive = store.stageAlive();
      const sb = $('#stage-badge'); sb.className = 'badge ' + (alive ? 'badge-success' : 'badge-neutral'); sb.textContent = alive ? 'Stage connected \u00b7 1 display' : 'Stage not open';
      $('#mode-badge').textContent = t.mode === 'brake' ? 'Braking \u00b7 6.0 s' : t.mode === 'locked' ? 'Winner locked' : (t.playing ? 'Idle loop \u00b7 ' + t.speed + ' px/s' : 'Tape paused');
      $('#spd').textContent = t.speed + ' px/s';
      const sp = $('#speed'); sp.value = t.speed; sp.style.setProperty('--p', ((t.speed - 100) / 11) + '%'); sp.disabled = t.mode === 'brake';
      $('[data-play]').innerHTML = icon(t.playing ? 'pause' : 'play'); $('[data-play]').disabled = t.mode !== 'idle';
      $('#snd').checked = !!p.settings.sound;
      if (t.mode === 'locked' && t.reveal && loggedReveal !== t.lockedAt) {
        loggedReveal = t.lockedAt;
        if (!s.log.some(l => l.msg === 'Round ' + t.reveal + ' winner revealed')) { store.log(s, 'Round ' + t.reveal + ' winner revealed', 'gold'); store.set(s); }
      }
      const n = s.winners.length, tot = p.settings.winners;
      const elig = SR.eligibleSlots(p.slots, s.winners, p.settings.replacement).length;
      const last = s.winners[n - 1];
      let html = '';
      if (t.mode === 'locked' && last) {
        html = '<div class="winner-card"><div class="eyebrow gold">Round ' + last.round + ' winner \u00b7 revealed on stage</div><h2>' + esc(last.name) + '</h2>' +
          '<div class="row" style="flex-wrap:wrap;gap:8px"><span class="badge badge-ondark no-dot mono">' + esc(last.tag || '\u2014') + '</span><span class="badge badge-ondark no-dot mono">Slot #' + pad5(last.slot + 1) + ' of ' + fmt(p.slotsCount) + '</span></div>' +
          '<p style="color:#c7d6ea;font-size:13px;margin:14px 0">Drawn ' + last.at + ' \u00b7 CSPRNG value ' + last.value + ' \u2192 index ' + (last.value % last.eligible) + ' of ' + fmt(last.eligible) + ' eligible.</p>' +
          '<div class="actions">' + (n < tot ? '<button class="btn btn-gold" data-next>Next round ' + icon('arrowRight') + '</button>' : '<a class="btn btn-gold" href="verify.html?id=' + p.drawId + '" target="_blank">View certificate</a>') +
          '<button class="btn btn-ondark" data-hide>' + (t.reveal ? 'Hide reveal' : 'Show reveal') + '</button></div></div>';
      } else if (n >= tot) {
        html = '<div class="draw-panel"><div class="eyebrow gold">All ' + tot + ' winners drawn</div><h2 style="margin:12px 0 8px">Event complete</h2><p>' + s.winners.map(w => 'Round ' + w.round + ': ' + esc(w.name)).join('<br>') + '</p>' +
          '<a class="btn btn-gold btn-block" style="margin-top:16px" href="verify.html?id=' + p.drawId + '" target="_blank">Open audit certificate</a></div>';
      } else {
        const braking = t.mode === 'brake';
        html = '<div class="draw-panel"><div class="row between"><span class="eyebrow gold">Round ' + (n + 1) + ' of ' + tot + '</span><span class="mono" style="font-size:12px;color:#c7d6ea">' + fmt(elig) + ' eligible slots</span></div>' +
          '<button class="btn btn-gold" data-draw ' + (braking || !elig ? 'disabled' : '') + '>' + (braking ? 'Drawing\u2026' : icon('play') + ' Draw winner') + '</button>' +
          '<p>The browser picks a slot with a CSPRNG and sends it to the stage. The tape then brakes over 6.0 s and stops on the winner.</p>' +
          '<p style="margin-top:12px">Shortcut <span class="kbd">Space</span></p></div>';
      }
      $('#drawbox').innerHTML = html;
      const d = $('[data-draw]'); if (d) d.onclick = drawWinner;
      const nx = $('[data-next]'); if (nx) nx.onclick = () => { const cur = store.tape(); const st = SR.resumeIdle(cur, Date.now()); st.reveal = null; store.setTape(st); tape.setState(st); store.update(x => store.log(x, 'Tape back to idle loop', 'info')); renderSide(); };
      const hd = $('[data-hide]'); if (hd) hd.onclick = () => { const cur = store.tape(); cur.reveal = cur.reveal ? null : store.get().winners.length; store.setTape(cur); renderSide(); };
      $('#log').innerHTML = s.log.slice(0, 30).map(l => '<li class="' + l.kind + '"><time>' + hhmmss(l.t) + '</time><span>' + esc(l.msg) + '</span></li>').join('') || '<li>No events yet</li>';
    }

    function drawWinner() {
      SR.sound.unlock();
      const s = store.get(), p = s.pool, t = store.tape();
      if (t.mode === 'brake' || s.winners.length >= p.settings.winners) return;
      const elig = SR.eligibleSlots(p.slots, s.winners, p.settings.replacement);
      if (!elig.length) { toast('No eligible slots left', 'err'); return; }
      const pick = SR.csprngIndex(elig.length);
      const slot = elig[pick.index], sl = p.slots[slot];
      const w = { round: s.winners.length + 1, slot, label: sl.label, name: p.names ? p.names[slot] : sl.label, tag: sl.tag, p: sl.p, value: pick.value, eligible: elig.length, at: isoNow() };
      s.winners.push(w);
      store.log(s, 'Round ' + w.round + ' drawn \u00b7 slot #' + pad5(slot + 1), 'gold');
      store.set(s); saveAudit(s);
      const plan = SR.planBrake(t, Date.now(), slot); plan.reveal = null;
      store.setTape(plan); tape.setState(plan);
      const fb = setTimeout(() => finish(plan), plan.T * 1000 + 80); onCleanup(() => clearTimeout(fb));
      renderSide();
    }

    $('#speed').oninput = e => {
      const v = Number(e.target.value), cur = store.tape();
      if (cur.mode === 'brake') return;
      const base = cur.mode === 'locked' ? SR.resumeIdle(cur, Date.now()) : SR.resumeIdle(cur, Date.now());
      base.speed = v; base.reveal = cur.mode === 'locked' ? null : cur.reveal;
      store.setTape(base); tape.setState(base);
      e.target.style.setProperty('--p', ((v - 100) / 11) + '%'); $('#spd').textContent = v + ' px/s';
      $('#mode-badge').textContent = 'Idle loop \u00b7 ' + v + ' px/s';
    };
    $('#speed').onchange = e => { store.update(x => store.log(x, 'Tape speed ' + e.target.value + ' px/s', 'info')); renderSide(); };
    $('[data-play]').onclick = () => { const cur = SR.resumeIdle(store.tape(), Date.now()); cur.playing = !cur.playing; store.setTape(cur); tape.setState(cur); renderSide(); };
    $('#snd').onchange = e => { store.update(x => { x.pool.settings.sound = e.target.checked; }); store.setTape(Object.assign(store.tape(), { bump: Date.now() })); if (e.target.checked) { SR.sound.unlock(); SR.sound.tick(); } };
    $('[data-end]').onclick = () => {
      if (!confirm('End this event? The stage goes back to idle. You can still view the certificate, and you can purge PII next.')) return;
      const cur = SR.resumeIdle(store.tape(), Date.now()); cur.reveal = null; store.setTape(cur);
      store.update(x => store.log(x, 'Event ended by admin', ''));
      go('settings');
    };
    $('[data-purge]').onclick = () => { if (purgePII()) control(); };
    const key = e => { if (e.code === 'Space' && !/input|textarea|button|select/i.test(e.target.tagName)) { e.preventDefault(); const d = $('[data-draw]'); if (d && !d.disabled) drawWinner(); } };
    document.addEventListener('keydown', key); onCleanup(() => document.removeEventListener('keydown', key));
    const onStore = e => { if (e.key === store.TAPE) { tape.setState(store.tape()); renderSide(); } };
    window.addEventListener('storage', onStore); onCleanup(() => window.removeEventListener('storage', onStore));
    const iv = setInterval(renderSideLite, 2000); onCleanup(() => clearInterval(iv));
    function renderSideLite() { const alive = store.stageAlive(); const sb = $('#stage-badge'); if (sb) { sb.className = 'badge ' + (alive ? 'badge-success' : 'badge-neutral'); sb.textContent = alive ? 'Stage connected \u00b7 1 display' : 'Stage not open'; } }
    renderSide();
  }

  function purgePII() {
    if (!confirm('Purge PII? Full names, emails and identifiers are deleted from this device. The stage and certificate keep only shortened names (e.g. \u201cIfeanyi O.\u201d) and masked tags. This can\u2019t be undone.')) return false;
    store.update(x => {
      x.draft.rows = []; x.draft.file = x.draft.file ? { name: x.draft.file.name, size: x.draft.file.size, encoding: x.draft.file.encoding, delimiter: x.draft.file.delimiter } : null;
      if (x.pool) { x.pool.names = null; x.pool.piiPurged = true; }
      x.winners.forEach(w => { w.name = w.label; });
      store.log(x, 'PII purged \u00b7 names shortened', 'ok');
    });
    store.setTape(Object.assign(store.tape(), { bump: Date.now() }));
    toast('PII purged from this device');
    return true;
  }

  /* ---------------- Entrant pools ---------------- */
  function pools() {
    const s = store.get(), p = s.pool;
    const rows = p ? p.slots.map((sl, i) => ({ slot: i, name: p.names ? p.names[i] : sl.label, tag: sl.tag, p: sl.p })) : s.draft.rows.map((r, i) => ({ slot: i, name: r.name, tag: SR.maskTag(r), email: r.email }));
    shell('pools', head('Workspace / Entrant pools', 'Entrant pools', p ? '<span class="badge badge-success">Locked \u00b7 ' + fmt(p.slotsCount) + ' slots</span>' : '<a class="btn btn-primary" href="#/upload">Upload entrants</a>',
      p ? esc(p.name) + ' \u00b7 ' + modeLabel(p.mode) + (p.piiPurged ? ' \u00b7 PII purged' : '') : s.draft.rows.length ? 'Draft \u00b7 not locked yet' : '') +
      (rows.length ? '<div class="card"><div class="card-pad" style="padding-bottom:12px"><input class="input" id="q" placeholder="Search names or tags\u2026" style="max-width:420px"></div><div class="table-wrap"><table class="table"><thead><tr><th>' + (p ? 'Slot' : 'Row') + '</th><th>Name</th><th>Tag</th>' + (p ? '<th>Person #</th>' : '<th>Email</th>') + '</tr></thead><tbody id="rows"></tbody></table></div><p class="help card-pad" id="cnt"></p></div>'
        : '<div class="card empty"><h3>No entrants yet</h3><p>Upload a CSV to build a pool.</p></div>'));
    if (!rows.length) return;
    const render = q => {
      q = q.trim().toLowerCase();
      const hit = q ? rows.filter(r => r.name.toLowerCase().includes(q) || (r.tag || '').includes(q)) : rows;
      $('#rows').innerHTML = hit.slice(0, 200).map(r => '<tr><td class="mono">#' + pad5(r.slot + 1) + '</td><td>' + esc(r.name) + '</td><td class="mono">' + esc(r.tag || '\u2014') + '</td><td class="mono">' + (p ? r.p + 1 : esc(SR.maskEmail(r.email))) + '</td></tr>').join('');
      $('#cnt').textContent = 'Showing ' + Math.min(200, hit.length) + ' of ' + fmt(hit.length) + (q ? ' matches' : ' rows');
    };
    $('#q').oninput = e => render(e.target.value); render('');
  }

  /* ---------------- Audit log ---------------- */
  function audit() {
    const s = store.get(), audits = Object.values(store.audits()).sort((a, b) => b.lockedAt.localeCompare(a.lockedAt));
    shell('audit', head('Workspace / Audit log', 'Audit log', '', 'Every locked pool gets a Draw ID, a SHA-256 pool hash and a public verify page.') +
      '<div class="card" style="margin-bottom:20px">' + drawsTable(audits) + '</div>' +
      '<div class="card card-pad"><h3>Event log</h3><ul class="log" style="max-height:none">' + (s.log.map(l => '<li class="' + l.kind + '"><time>' + new Date(l.t).toISOString().replace('T', ' ').slice(0, 19) + 'Z</time><span>' + esc(l.msg) + '</span></li>').join('') || '<li>No events yet</li>') + '</ul></div>');
  }

  /* ---------------- Settings ---------------- */
  function settings() {
    const s = store.get(), p = s.pool;
    shell('settings', head('Workspace / Settings', 'Settings') +
      '<div class="grid-2" style="grid-template-columns:1fr 1fr"><div class="card card-pad"><h3>Data &amp; privacy</h3>' +
      '<div class="setting" style="border-top:0"><div><b>Purge PII</b><small>Deletes full names, emails and identifiers. Keeps the redacted pool, hash and winners.</small></div><button class="btn btn-danger btn-sm" data-purge ' + ((p && p.piiPurged) || (!p && !s.draft.rows.length) ? 'disabled' : '') + '>Purge</button></div>' +
      '<div class="setting"><div><b>Uploaded CSV files</b><small>The raw file is read in your browser and never uploaded or kept. Production deletes server copies after 24 h.</small></div><span class="badge badge-success">Not stored</span></div>' +
      '<div class="setting"><div><b>Start a new draw</b><small>Archives the current draw (its certificate stays available) and clears the workspace.</small></div><button class="btn btn-secondary btn-sm" data-new>New draw</button></div>' +
      '<div class="setting"><div><b>Reset this device</b><small>Deletes every draw, certificate and setting stored in this browser.</small></div><button class="btn btn-danger btn-sm" data-reset>Reset</button></div></div>' +
      '<div class="card card-pad"><h3>Account</h3><div class="setting" style="border-top:0"><div><b>' + esc(auth.email()) + '</b><small>Role: Admin</small></div><span class="badge badge-success">MFA on</span></div>' +
      '<div class="setting"><div><b>Viewer link</b><small>Read-only. Anyone with the link can watch the stage.</small></div><button class="btn btn-secondary btn-sm" data-copy>' + icon('copy') + 'Copy</button></div>' +
      '<div class="alert alert-info" style="margin-top:12px">' + icon('info') + '<div>This is a static demo build. Draws sync between tabs in this browser. Remote viewers and real MFA need the SISL backend.</div></div></div></div>');
    const pg = $('[data-purge]'); if (pg) pg.onclick = () => { if (purgePII()) settings(); };
    $('[data-new]').onclick = () => {
      if (!confirm('Start a new draw? The current workspace is cleared. Certificates of locked draws stay in the audit log.')) return;
      const keep = store.get(); const d = { rules: keep.rules, settings: keep.settings };
      store.reset(); store.update(x => { x.rules = d.rules; x.settings = d.settings; store.log(x, 'New draw started', 'info'); });
      go('upload');
    };
    $('[data-reset]').onclick = () => {
      if (!confirm('Delete every draw and certificate stored in this browser?')) return;
      store.reset(); try { localStorage.removeItem(store.AUDITS); } catch (e) { }
      toast('This device was reset'); go('overview');
    };
    $('[data-copy]').onclick = async () => { try { await navigator.clipboard.writeText(stageURL()); toast('Viewer link copied'); } catch (e) { toast(stageURL()); } };
  }

  route();
})();
