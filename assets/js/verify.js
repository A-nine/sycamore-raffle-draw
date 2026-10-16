/* Sycamore Raffle Draw \u2014 public verify portal (/verify/:drawId) */
(function () {
  'use strict';
  const { icon, logo, $, esc, fmt, pad5, store } = SR;
  $('#logo').innerHTML = logo({ white: true, href: 'verify.html' });
  $('#logo2').innerHTML = logo({ white: true });

  /* Same algorithm as the snippet shown on the page */
  async function check(meta, slots) {
    const hash = await SR.sha256Hex(JSON.stringify(slots));
    const res = { hashOK: hash === meta.poolHash, hash, rounds: [] };
    const gone = new Set();
    for (const w of meta.winners || []) {
      const elig = [];
      for (let i = 0; i < slots.length; i++) if (meta.replacement || !gone.has(slots[i].p)) elig.push(i);
      const n = elig.length, limit = Math.floor(4294967296 / n) * n;
      const idx = elig[w.value % n];
      const ok = n === w.eligible && w.value < limit && idx === w.slot;
      res.rounds.push({ round: w.round, ok, idx, label: slots[idx] ? slots[idx].label : '?', index: w.value % n, n });
      if (slots[idx]) gone.add(slots[idx].p);
    }
    res.allOK = res.hashOK && res.rounds.every(r => r.ok);
    return res;
  }

  async function sampleAudit() {
    const d = SR.demoPool();
    const meta = {
      v: 1, sample: true, drawId: 'b3e1c0de-4f2a-4c71-9a8e-2d5f6e7a8b90', name: 'August Savers Mega Draw (sample)', date: '2026-08-29T16:00',
      lockedAt: '2026-08-29T13:14:02Z', mode: 'WEIGHTED_SLOT', rules: { nfkc: true, lower: true, punct: false, spaces: true },
      rowsRead: 24, valid: 24, slotsCount: d.slots.length, replacement: false, winnersPlanned: 2,
      rng: 'crypto.getRandomValues (uint32) + rejection sampling; index = value % eligible.length', winners: []
    };
    meta.poolHash = await SR.sha256Hex(JSON.stringify(d.slots));
    const values = [2718281828, 3141592653], times = ['2026-08-29T15:02:46Z', '2026-08-29T15:09:12Z'];
    const gone = new Set();
    values.forEach((v, k) => {
      const elig = d.slots.map((_, i) => i).filter(i => !gone.has(d.slots[i].p));
      const slot = elig[v % elig.length];
      meta.winners.push({ round: k + 1, slot, label: d.slots[slot].label, value: v, eligible: elig.length, at: times[k] });
      gone.add(d.slots[slot].p);
    });
    meta.slots = d.slots;
    return meta;
  }

  function pickAudit() {
    const id = new URLSearchParams(location.search).get('id') || (location.hash.match(/verify\/([\w-]+)/) || [])[1];
    const all = store.audits(), list = Object.values(all).sort((a, b) => b.lockedAt.localeCompare(a.lockedAt));
    if (id) {
      const hit = all[id] || list.find(a => a.drawId.startsWith(id));
      return { audit: hit || null, missing: !hit, id };
    }
    return { audit: list[0] || null };
  }

  function snippet(meta) {
    const short = meta.drawId.slice(0, 8);
    return [
      '<span class="k">const</span> pool <span class="k">=</span> <span class="k">await</span> (<span class="k">await</span> fetch(<span class="s">\'pool_' + short + '.json\'</span>)).json();',
      '<span class="k">const</span> meta <span class="k">=</span> <span class="k">await</span> (<span class="k">await</span> fetch(<span class="s">\'metadata_' + short + '.json\'</span>)).json();',
      '<span class="k">const</span> sha <span class="k">=</span> <span class="k">async</span> s <span class="k">=></span> [...<span class="k">new</span> Uint8Array(<span class="k">await</span> crypto.subtle.digest(<span class="s">\'SHA-256\'</span>,',
      '  <span class="k">new</span> TextEncoder().encode(s)))].map(b <span class="k">=></span> b.toString(16).padStart(2, <span class="s">\'0\'</span>)).join(<span class="s">\'\'</span>);',
      '',
      'console.log((<span class="k">await</span> sha(JSON.stringify(pool.slots))) <span class="k">===</span> meta.poolHash); <span class="c">// true</span>',
      '',
      '<span class="k">const</span> gone <span class="k">=</span> <span class="k">new</span> Set();',
      '<span class="k">for</span> (<span class="k">const</span> w <span class="k">of</span> meta.winners) {',
      '  <span class="k">const</span> elig <span class="k">=</span> pool.slots.map((_, i) <span class="k">=></span> i)',
      '    .filter(i <span class="k">=></span> meta.replacement <span class="k">||</span> !gone.has(pool.slots[i].p));',
      '  <span class="k">const</span> slot <span class="k">=</span> elig[w.value % elig.length];',
      '  console.log(w.round, slot <span class="k">===</span> w.slot, pool.slots[slot].label);',
      '  gone.add(pool.slots[slot].p);',
      '}'
    ].join('\n');
  }

  function download(name, obj) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function metaOnly(a) { const m = Object.assign({}, a); delete m.slots; return m; }

  async function render(a, res, opts) {
    opts = opts || {};
    const w1 = a.winners[a.winners.length - 1];
    const badge = $('#status-badge');
    if (res.allOK) {
      badge.className = 'badge badge-success'; badge.innerHTML = 'Verified draw \u00b7 hashes match';
      $('#hero-title').textContent = a.winners.length ? 'This draw checks out.' : 'This pool checks out.';
    } else {
      badge.className = 'badge badge-error'; badge.innerHTML = 'Mismatch found';
      $('#hero-title').textContent = 'Something doesn\u2019t match.';
    }
    const when = w1 ? 'drawn ' + w1.at.replace('T', ' ').replace('Z', ' UTC') : 'locked ' + a.lockedAt.replace('T', ' ').replace('Z', ' UTC');
    $('#hero-sub').textContent = esc(a.name) + (w1 ? ' \u00b7 Round ' + w1.round + ' \u00b7 ' : ' \u00b7 ') + when + '. ' +
      (a.sample ? 'This is a sample certificate, because no draw has been locked on this device yet.' : opts.fromFiles ? 'Checked from the files you picked.' : 'Everything below is public, so you can check it yourself.');

    const f = (ic, label, val) => '<div><div class="eyebrow">' + icon(ic) + label + '</div><div class="mono">' + val + '</div></div>';
    const r1 = res.rounds[res.rounds.length - 1];
    $('#cert').innerHTML =
      '<div class="cert-top"><div><div class="eyebrow gold">Audit certificate' + (a.sample ? ' \u00b7 sample' : '') + '</div><h2>' + (w1 ? 'Round ' + w1.round + ' winner: ' + esc(w1.label) : 'Pool locked \u00b7 no winners yet') + '</h2>' +
      '<p>' + (w1 ? 'Slot #' + pad5(w1.slot + 1) + ' of ' + fmt(a.slotsCount) + ' \u00b7 names shortened for privacy' : fmt(a.slotsCount) + ' slots frozen and hashed') + '</p></div>' +
      '<div class="actions"><button class="btn btn-gold" data-print>' + icon('download') + 'Download certificate (PDF)</button><button class="btn btn-secondary" data-link>Copy link</button></div></div>' +
      '<div class="cert-grid">' +
      f('lock', 'Draw ID', esc(a.drawId)) + f('clock', 'Pool locked', esc(a.lockedAt)) + f('trophy', 'Winner drawn', w1 ? esc(w1.at) : '\u2014') +
      f('users', 'Duplicate rule', esc(a.mode)) + f('file', 'Rows read / slots', fmt(a.rowsRead) + ' / ' + fmt(a.slotsCount)) + f('hash', 'Winning index', r1 ? r1.index + ' of ' + fmt(r1.n) + ' eligible \u2192 slot #' + pad5(r1.idx + 1) : '\u2014') +
      '<div class="wide"><div class="eyebrow">' + icon('hash') + 'Pool hash \u00b7 SHA-256 ' + (res.hashOK ? '<span class="badge badge-success" style="margin-left:6px">matches</span>' : '<span class="badge badge-error" style="margin-left:6px">does not match</span>') + '</div><div class="mono">' + esc(a.poolHash) + '</div></div>' +
      '<div class="wide"><div class="eyebrow">' + icon('key') + 'Random source</div><div class="mono">' + esc(a.rng || 'CSPRNG') + ' \u00b7 ' + (a.replacement ? 'with replacement' : 'without replacement') + '</div></div></div>' +
      (a.winners.length ? '<div class="cert-rounds"><table><thead><tr><th>Round</th><th>Winner</th><th>Slot</th><th>CSPRNG value</th><th>Drawn (UTC)</th><th>Check</th></tr></thead><tbody>' +
        a.winners.map((w, i) => '<tr><td>' + w.round + '</td><td><b>' + esc(w.label) + '</b></td><td class="mono">#' + pad5(w.slot + 1) + '</td><td class="mono">' + w.value + '</td><td class="mono">' + esc(w.at) + '</td><td>' +
          (res.rounds[i].ok ? '<span class="badge badge-success">match</span>' : '<span class="badge badge-error">mismatch</span>') + '</td></tr>').join('') + '</tbody></table></div>' : '') +
      '<div class="cert-foot"><div class="row"><span class="sisl">SISL</span><span>Issued by Sycamore Integrated Solutions Limited \u00b7 RNG: CSPRNG (crypto.getRandomValues)</span></div><span class="mono">Certificate v1 \u00b7 immutable</span></div>';

    $('[data-print]').onclick = () => window.print();
    $('[data-link]').onclick = async () => { const u = new URL('verify.html?id=' + a.drawId, location.href).href; try { await navigator.clipboard.writeText(u); SR.toast('Link copied'); } catch (e) { SR.toast(u); } };

    const short = a.drawId.slice(0, 8);
    $('#downloads').innerHTML = '<button class="btn btn-primary btn-sm" data-dl-pool>' + icon('download') + 'pool_' + short + '.json</button><button class="btn btn-secondary btn-sm" data-dl-meta>' + icon('download') + 'metadata_' + short + '.json</button>';
    $('[data-dl-pool]').onclick = () => download('pool_' + short + '.json', { drawId: a.drawId, slots: a.slots });
    $('[data-dl-meta]').onclick = () => download('metadata_' + short + '.json', metaOnly(a));
    $('#code').innerHTML = snippet(a);
    $('#code-res').innerHTML = '<div class="' + (res.hashOK ? '' : 'bad') + '">' + icon(res.hashOK ? 'check' : 'x') + 'Pool hash ' + (res.hashOK ? 'matches' : 'does not match') + '</div>' +
      res.rounds.map(r => '<div class="' + (r.ok ? '' : 'bad') + '">' + icon(r.ok ? 'check' : 'x') + 'Round ' + r.round + ': index ' + r.index + ' \u2192 ' + esc(r.label) + '</div>').join('');
  }

  $('#copy').onclick = async () => { try { await navigator.clipboard.writeText($('#code').textContent); SR.toast('Snippet copied'); } catch (e) { } };

  /* Verify user-supplied files */
  let fPool = null, fMeta = null;
  async function readJSON(input) { const f = input.files[0]; if (!f) return null; return JSON.parse(await f.text()); }
  async function tryFiles() {
    const st = $('#f-status');
    try {
      fPool = await readJSON($('#f-pool')) || fPool; fMeta = await readJSON($('#f-meta')) || fMeta;
      if (!fPool || !fMeta) { st.textContent = fPool ? 'Now pick the metadata JSON.' : 'Now pick the pool JSON.'; return; }
      const a = Object.assign({}, fMeta, { slots: fPool.slots });
      const res = await check(a, fPool.slots);
      await render(a, res, { fromFiles: true });
      st.textContent = res.allOK ? 'Your files check out.' : 'Your files don\u2019t match.';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { st.textContent = 'Couldn\u2019t read those files: ' + e.message; }
  }
  $('#f-pool').onchange = tryFiles; $('#f-meta').onchange = tryFiles;

  (async function init() {
    const pick = pickAudit();
    if (pick.missing) SR.toast('Draw ' + pick.id.slice(0, 8) + ' isn\u2019t stored in this browser. Showing a sample.', 'err');
    const a = pick.audit || await sampleAudit();
    const res = await check(a, a.slots);
    render(a, res);
  })();
})();
