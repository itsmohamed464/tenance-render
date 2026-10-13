// Runtime: footage layers, captions, grain, deterministic seek(t)
(() => {
  const CFG = window.CFG;
  const stage = document.getElementById('stage');
  const tl = gsap.timeline({ paused: true });
  const CUES = [];
  const LAYERS = [];
  const FLOAT = [];
  const PER = [];
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const easeOutBack = (x, s = 1.9) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
  const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
  const el = (tag, cls, html, parent, css) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (css) Object.assign(e.style, css);
    (parent || stage).appendChild(e);
    return e;
  };
  const sfx = (name, t, db = 0, o = {}) => CUES.push(Object.assign({ name, t: Math.round(t * 1000) / 1000, db }, o));
  const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, '');
  const words = CFG.words;
  function W(cands, after = -1) {
    const cs = [].concat(cands).map(norm);
    const i = words.findIndex((w, k) => k > after && cs.includes(norm(w.text)));
    if (i < 0) throw new Error('word not found: ' + cands);
    return Object.assign({ i }, words[i]);
  }

  // footage shots: map = [[videoTime, clipTime], ...] piecewise linear
  function shot(parent, clip, map, cls = '') {
    const s = el('div', 'shot ' + cls, null, parent);
    const cam = el('div', 'cam', null, s);
    const img = el('img', null, null, cam);
    const L = { img, clip, map, cur: '', t0: map[0][0] - 0.1, t1: map[map.length - 1][0] + 0.1 };
    L.cur = frameSrc(clip, map[0][1]);
    img.src = L.cur;
    LAYERS.push(L);
    return { s, cam, img };
  }
  const lerpMap = (map, t) => {
    if (t <= map[0][0]) return map[0][1];
    for (let i = 1; i < map.length; i++) if (t <= map[i][0]) {
      const [a, ca] = map[i - 1], [b, cb] = map[i];
      return ca + (cb - ca) * (t - a) / (b - a);
    }
    const [a, ca] = map[map.length - 1];
    return ca + (t - a);
  };
  function frameSrc(clip, ct) {
    const n = Math.max(0, Math.min(120, Math.round(ct * 24)));
    return `frames/${clip}/${String(n + 1).padStart(4, '0')}.jpg`;
  }

  // captions: groups = word counts per caption group; disp = display overrides
  const CG = [];
  const DISP = { ...(/^[WX]/.test(CFG.concept) ? { eins: '1', one: '1', vier: '4', four: '4', fünf: '5', five: '5' } : {}), siebenundvierzig: '47', 'forty-seven': '47', vierzehn: '14', fourteen: '14', zwei: '2', two: '2', ...(CFG.concept >= 'G' ? { drei: '3', three: '3', neun: '9', nine: '9' } : {}) };
  const dispText = (txt) => {
    const n = norm(txt);
    let core = /^[ap]\.m\./i.test(txt) ? txt.slice(0, 4).toLowerCase() : DISP[n] || (/^(mr|mrs|ms|dr)$/.test(n) ? txt : txt.replace(/\.\.\.$/, '…').replace(/[.,:;]+$/, ''));
    if (DISP[n] && /[?!]$/.test(txt)) core += txt.slice(-1);
    return core;
  };
  function captions(groups) {
    const box = el('div', '', null, stage);
    box.id = 'cap';
    let k = 0;
    for (const n of groups) {
      const ws = words.slice(k, k + n);
      k += n;
      const g = el('div', 'cg', null, box);
      const gi = el('div', 'cgi', null, g);
      const hl = el('div', 'hlb', null, gi);
      const spans = ws.map((w) => el('span', 'cw', dispText(w.text), gi));
      CG.push({ g, gi, hl, spans, ws, fit: 1 });
    }
    if (k !== words.length) throw new Error(`caption groups cover ${k}/${words.length} words`);
    CG.forEach((G, j) => {
      const nx = CG[j + 1];
      G.t0 = G.ws[0].start - 0.07;
      const lastEnd = G.ws[G.ws.length - 1].end;
      if (!nx) G.t1 = lastEnd + 0.4;
      else {
        const n0 = nx.ws[0].start - 0.07;
        G.t1 = n0 - lastEnd < 0.75 ? n0 : lastEnd + 0.45;
      }
    });
  }
  function fitCaptions() {
    for (const G of CG) {
      G.g.style.visibility = 'visible';
      const w = G.gi.scrollWidth;
      G.fit = Math.min(1, 900 / w);
      G.rects = G.spans.map((s) => ({ x: s.offsetLeft, y: s.offsetTop, w: s.offsetWidth, h: s.offsetHeight }));
      G.g.style.visibility = 'hidden';
    }
  }
  let capHidden = () => false;
  function capUpdate(t) {
    for (const G of CG) {
      const on = t >= G.t0 && t < G.t1 && !capHidden(t);
      G.g.style.visibility = on ? 'visible' : 'hidden';
      if (!on) continue;
      const pg = clamp01((t - G.t0) / 0.16);
      const out = clamp01((t - (G.t1 - 0.08)) / 0.08);
      G.gi.style.transform = `scale(${G.fit * (0.86 + 0.14 * easeOutBack(pg)) * (1 - 0.06 * out)})`;
      G.g.style.opacity = String(Math.min(1, pg * 2.5) * (1 - out));
      let act = -1;
      G.ws.forEach((w, i) => {
        const sp = G.spans[i];
        const a = clamp01((t - (w.start - 0.06)) / 0.13);
        sp.style.opacity = a > 0 ? String(Math.min(1, a * 2)) : '0';
        sp.style.transform = `translateY(${(1 - easeOutCubic(a)) * 26}px) scale(${0.78 + 0.22 * easeOutBack(a, 2.4)})`;
        if (t >= w.start - 0.03) act = i;
      });
      G.spans.forEach((sp, i) => sp.classList.toggle('on', i === act));
      if (act < 0) { G.hl.style.opacity = '0'; continue; }
      const r1 = G.rects[act];
      const r0 = act > 0 ? G.rects[act - 1] : null;
      const p = easeOutCubic(clamp01((t - (G.ws[act].start - 0.03)) / 0.1));
      let x = r1.x, y = r1.y, w = r1.w, h = r1.h, sc = 1;
      if (r0) { x = r0.x + (r1.x - r0.x) * p; w = r0.w + (r1.w - r0.w) * p; } else sc = 0.6 + 0.4 * easeOutBack(p);
      G.hl.style.opacity = '1';
      G.hl.style.left = x - 2 + 'px';
      G.hl.style.top = y + 6 + 'px';
      G.hl.style.width = w + 4 + 'px';
      G.hl.style.height = h - 10 + 'px';
      G.hl.style.transform = `scale(${sc}) rotate(-1.5deg)`;
    }
  }

  // film grain
  const gc = el('canvas', 'grain', null, stage);
  gc.width = 360; gc.height = 640;
  const gx = gc.getContext('2d');
  const gimg = gx.createImageData(360, 640);
  function grain(f) {
    let s = (f * 2654435761) >>> 0 || 1;
    const d = gimg.data;
    for (let i = 0; i < d.length; i += 4) {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      const v = s & 255;
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    gx.putImageData(gimg, 0, 0);
  }

  // gentle idle float (uses CSS `translate`/`rotate`, independent of GSAP transforms)
  function float(e, amp = 8, rot = 0, sp = 1, ph = 0) { FLOAT.push({ e, amp, rot, sp, ph }); }
  function perFrame(fn) { PER.push(fn); }

  async function seek(t) {
    tl.seek(t, false);
    capUpdate(t);
    grain(Math.floor(t * 20 + 1e-6));
    for (const F of FLOAT) {
      F.e.style.translate = `0 ${(Math.sin(t * 1.7 * F.sp + F.ph) * F.amp).toFixed(2)}px`;
      if (F.rot) F.e.style.rotate = `y ${(Math.sin(t * 1.3 * F.sp + F.ph + 1) * F.rot).toFixed(3)}deg`;
    }
    for (const fn of PER) fn(t);
    const ps = [];
    for (const L of LAYERS) {
      if (t < L.t0 || t > L.t1) continue;
      const src = frameSrc(L.clip, lerpMap(L.map, t));
      if (src !== L.cur) { L.cur = src; L.img.src = src; ps.push(L.img.decode().catch(() => {})); }
    }
    await Promise.all(ps);
  }
  async function ready() {
    await document.fonts.ready;
    fitCaptions();
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
  }
  window.R = { CFG, stage, tl, el, sfx, W, words, shot, captions, float, perFrame, clamp01, setCapHidden: (f) => { capHidden = f; } };
  window.seek = seek;
  window.ready = ready;
  window.CUES = CUES;
})();
