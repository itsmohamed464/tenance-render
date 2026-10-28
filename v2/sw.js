// Winter scenes (W1 snow diorama, W2 mold kinetic, W3 countdown) — code-built visuals, three.js 3D
(() => {
  const { CFG, stage, tl, el, sfx, W, words, captions, perFrame, setCapHidden } = R;
  const lang = CFG.lang;
  const C = CFG.concept;
  stage.classList.add(C);
  const END = words[words.length - 1].end;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const E = {
    oc: (x) => 1 - Math.pow(1 - x, 3),
    o5: (x) => 1 - Math.pow(1 - x, 5),
    ic: (x) => x * x * x,
    io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    ob: (x, s = 1.7) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
    lin: (x) => x,
  };
  const seg = (t, a, d) => clamp((t - a) / d);
  const T3 = window.THREE;
  const READY = [];

  // ---------- three.js helpers ----------
  function gl3(parent, o = {}) {
    const cv = el('canvas', 'gl', null, parent);
    cv.width = 1080; cv.height = 1920;
    const r = new T3.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(window.PR || 1);
    r.setSize(1080, 1920, false);
    r.outputColorSpace = T3.SRGBColorSpace;
    r.toneMapping = T3.ACESFilmicToneMapping;
    r.toneMappingExposure = o.exposure || 1.0;
    r.shadowMap.enabled = true;
    r.shadowMap.type = T3.PCFSoftShadowMap;
    r.localClippingEnabled = true;
    r.setClearColor(0x000000, 0);
    const scene = new T3.Scene();
    const cam = new T3.PerspectiveCamera(o.fov || 30, 1080 / 1920, 0.1, 300);
    scene.environment = envMap(r, o.envTop || '#ffffff', o.envBot || '#8d97a3', o.envInt || 1);
    return { r, scene, cam, cv };
  }
  function envMap(r, top, bot, k) {
    const pm = new T3.PMREMGenerator(r);
    const es = new T3.Scene();
    const g = new T3.SphereGeometry(10, 32, 16);
    const p = g.attributes.position, ct = new T3.Color(top), cb = new T3.Color(bot), c = new T3.Color(), cols = [];
    for (let i = 0; i < p.count; i++) { c.copy(cb).lerp(ct, clamp((p.getY(i) / 10 + 0.4) / 1.2)); cols.push(c.r * k, c.g * k, c.b * k); }
    g.setAttribute('color', new T3.Float32BufferAttribute(cols, 3));
    es.add(new T3.Mesh(g, new T3.MeshBasicMaterial({ side: T3.BackSide, vertexColors: true })));
    const pan = (w, h, x, y, z, v) => {
      const m = new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshBasicMaterial({ color: new T3.Color(v, v, v), side: T3.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); es.add(m);
    };
    pan(6, 3, -5, 6, 4, 7 * k); pan(3, 6, 7, 2, 2, 3.5 * k); pan(8, 1.5, 0, -1, -8, 1.5 * k); pan(2, 2, 2, 7, -5, 4 * k);
    const tex = pm.fromScene(es, 0.03).texture;
    pm.dispose();
    return tex;
  }
  const M = {
    std: (color, o = {}) => new T3.MeshStandardMaterial(Object.assign({ color, roughness: 0.5, metalness: 0 }, o)),
    phy: (color, o = {}) => new T3.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.4, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.25 }, o)),
  };
  const mesh = (geo, mat, parent, pos, rot, sc) => {
    const m = new T3.Mesh(geo, mat);
    m.castShadow = true; m.receiveShadow = true;
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    if (sc) (typeof sc === 'number' ? m.scale.setScalar(sc) : m.scale.set(...sc));
    parent.add(m);
    return m;
  };
  function rrShape(w, h, r) {
    const s = new T3.Shape();
    const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function rbox(w, h, d, r = 0.06) {
    const b = Math.min(r, d / 3);
    const g = new T3.ExtrudeGeometry(rrShape(w - 2 * b, h - 2 * b, Math.max(0.001, r - b)), { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 6 });
    g.translate(0, 0, -(d - 2 * b) / 2);
    g.computeVertexNormals();
    return g;
  }
  // canvas-texture plane for big type rendered in 3D (proper occlusion with objects)
  function textPlane(draw, cw, ch, w, h, o = {}) {
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const tex = new T3.CanvasTexture(c);
    tex.colorSpace = T3.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new T3.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false, side: T3.DoubleSide, clippingPlanes: o.clip || null });
    const m = new T3.Mesh(new T3.PlaneGeometry(w, h), mat);
    READY.push(() => { draw(c.getContext('2d'), cw, ch); tex.needsUpdate = true; });
    return m;
  }
  // keyframed pose track: kf = [[t, poseFn, ease], ...]
  function track(kf) {
    return (t) => {
      if (t <= kf[0][0]) return kf[0][1](t);
      for (let i = 1; i < kf.length; i++) {
        if (t < kf[i][0]) {
          const [ta, pa] = kf[i - 1], [tb, pb, eb] = kf[i];
          const u = (eb || E.io)((t - ta) / (tb - ta));
          const A = pa(t), B = pb(t), o = {};
          for (const k in A) o[k] = lerp(A[k], B[k] ?? A[k], u);
          return o;
        }
      }
      return kf[kf.length - 1][1](t);
    };
  }
  const apply = (g, p) => { g.position.set(p.x || 0, p.y || 0, p.z || 0); g.scale.setScalar(Math.max(1e-4, p.s ?? 1)); g.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0); g.visible = (p.s ?? 1) > 0.002; };

  // ================= W3: 5 winter checks countdown (editorial + 3D objects) =================
  function W3() {
    const de = lang === 'de';
    const S = de ? {
      head: 'Winter-Checks', sub: 'für Mieter & Vermieter', kick: 'bevor der Frost kommt', bar: 'Winter-Check', temp: '−2°C',
      ben: [['🧊', 'Kein Frostschaden'], ['🔥', 'Volle Wärme'], ['🌬️', 'Kein Zug mehr'], ['🛡️', 'Sicher schlafen'], ['💧', 'Kein Wasserschaden']],
      rows: ['Außenhähne entleert', 'Heizkörper entlüftet', 'Fenster abgedichtet', 'Rauchmelder getestet', 'Dachrinne frei'],
      who: ['Vermieter', 'Mieter', 'Vermieter', 'Mieter', 'Vermieter'], app: 'Winter-Check', done: (n) => `${n}/5 erledigt`,
      r1: 'Mieter', r2: 'Vermieter', tag: 'für Mieter & Vermieter',
    } : {
      head: 'Winter checks', sub: 'for tenants & landlords', kick: 'before the frost hits', bar: 'Winter check', temp: '28°F',
      ben: [['🧊', 'No frozen pipes'], ['🔥', 'Full heat'], ['🌬️', 'No more drafts'], ['🛡️', 'Sleep safe'], ['💧', 'No water damage']],
      rows: ['Outdoor taps drained', 'Radiators bled', 'Windows sealed', 'Smoke alarms tested', 'Gutters cleared'],
      who: ['Landlord', 'Tenant', 'Landlord', 'Tenant', 'Landlord'], app: 'Winter check', done: (n) => `${n}/5 done`,
      r1: 'Tenant', r2: 'Landlord', tag: 'for tenants & landlords',
    };
    const K = {};
    K.frost = W(['Frost', 'frost']).start;
    const i5 = W(['Fünf', 'Five'], 0);
    K.n5 = i5.start;
    const i4 = W(['Vier', 'Four'], i5.i); K.n4 = i4.start;
    const i3 = W(['Drei', 'Three'], i4.i); K.n3 = i3.start;
    const i2 = W(['Zwei', 'Two'], i3.i); K.n2 = i2.start;
    const i1 = W(['Eins', 'One'], i2.i); K.n1 = i1.start;
    K.turn = W(['Mit', 'With'], i1.i).start;
    K.tick = W(['hakt', 'tick']).start;
    K.tog = W(['gemeinsam', 'together']).start;
    const T = END + 2.1;
    const NT = [K.n5, K.n4, K.n3, K.n2, K.n1];
    const ACT = [W(['absperren', 'shut']).start, W(['entlüften', 'bleed']).start, W(['abdichten', 'seal']).start, W(['testen', 'test']).start, W(['befreien', 'clear']).start];

    // ---- 2D layers ----
    const bg = el('div', 'w3bg', '<i class="g1"></i><i class="g2"></i>');
    const frost = el('canvas', 'w3frost', null, stage);
    frost.width = 540; frost.height = 960;
    (() => {
      const x = frost.getContext('2d');
      let s = 7;
      const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      const branch = (px, py, ang, len, w, d) => {
        if (d > 5 || len < 4) return;
        const nx = px + Math.cos(ang) * len, ny = py + Math.sin(ang) * len;
        x.strokeStyle = `rgba(150,190,232,${0.55 - d * 0.07})`; x.lineWidth = w;
        x.beginPath(); x.moveTo(px, py); x.lineTo(nx, ny); x.stroke();
        const n = 2 + Math.floor(rnd() * 2);
        for (let i = 0; i < n; i++) branch(px + (nx - px) * (0.35 + rnd() * 0.6), py + (ny - py) * (0.35 + rnd() * 0.6), ang + (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.6), len * (0.45 + rnd() * 0.25), w * 0.7, d + 1);
        branch(nx, ny, ang + (rnd() - 0.5) * 0.5, len * 0.75, w * 0.8, d + 1);
      };
      const corner = (cx, cy, a0) => { for (let i = 0; i < 9; i++) branch(cx, cy, a0 + (i / 8) * (Math.PI / 2), 60 + rnd() * 70, 2.2, 0); };
      corner(0, 0, 0); corner(540, 0, Math.PI / 2); corner(0, 960, -Math.PI / 2); corner(540, 960, Math.PI);
    })();
    tl.fromTo(frost, { opacity: 0, scale: 1.25 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out', immediateRender: false }, K.frost - 0.1);
    tl.set(frost, { opacity: 0 }, 0);
    tl.to(frost, { opacity: 0.45, duration: 0.6 }, K.n5 + 0.2);

    const G = gl3(stage, { fov: 30, envTop: '#ffffff', envBot: '#4c5664' });
    const { scene, cam } = G;
    cam.position.set(0, 2.2, 10.2);
    const LOOK = new T3.Vector3(0, -0.32, 0);
    cam.lookAt(LOOK);
    scene.add(new T3.HemisphereLight('#eef4ff', '#b8a991', 0.55));
    const key = new T3.DirectionalLight('#fff6ea', 2.3);
    key.position.set(-3.5, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 25 });
    key.shadow.radius = 6;
    key.shadow.bias = -0.0004;
    scene.add(key);
    const rim = new T3.DirectionalLight('#cfe1ff', 1.1);
    rim.position.set(4, 3, -4);
    scene.add(rim);
    const floor = new T3.Mesh(new T3.PlaneGeometry(40, 40), new T3.ShadowMaterial({ opacity: 0.16 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -1.45; floor.receiveShadow = true;
    scene.add(floor);

    // big numerals (3D planes, masked)
    const clip = [new T3.Plane(new T3.Vector3(0, -1, 0), 2.15), new T3.Plane(new T3.Vector3(0, 1, 0), 2.15)];
    const NUM = [5, 4, 3, 2, 1].map((n) => {
      const m = textPlane((x, w, h) => {
        x.clearRect(0, 0, w, h);
        x.font = '700 1180px Clash';
        x.textAlign = 'center'; x.textBaseline = 'alphabetic';
        x.lineWidth = 9; x.strokeStyle = '#0e1b2c';
        x.strokeText(String(n), w / 2 + 34, h - 150 + 30);
        x.fillStyle = '#2d5bff';
        x.fillText(String(n), w / 2, h - 150);
      }, 900, 1150, 3.05, 3.9, { clip });
      m.renderOrder = -1;
      scene.add(m);
      return m;
    });

    // ---- procedural objects ----
    const chrome = M.std('#e8ebef', { metalness: 1, roughness: 0.14 });
    const brass = M.std('#c99a3e', { metalness: 1, roughness: 0.3 });
    const red = M.phy('#d8402a', { roughness: 0.38 });
    const white = M.phy('#f2f1ec', { roughness: 0.32 });
    const water = new T3.MeshPhysicalMaterial({ color: '#9fd0ff', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.85, clearcoat: 1 });

    function mkTap() {
      const g = new T3.Group(), a = new T3.Group();
      g.add(a);
      a.position.set(0, 0.15, -0.55);
      const plate = mesh(new T3.CylinderGeometry(0.62, 0.62, 0.14, 48), chrome, a, [0, 0, 0], [Math.PI / 2, 0, 0]);
      const wall = mesh(rbox(1.7, 1.7, 0.18, 0.12), M.phy('#c96f4a', { roughness: 0.75, clearcoat: 0 }), a, [0, 0, -0.16]);
      for (let i = -1; i <= 1; i++) mesh(new T3.BoxGeometry(1.72, 0.035, 0.05), M.std('#e8ddd0', { roughness: 0.9 }), a, [0, i * 0.42 + 0.21, -0.06]);
      mesh(new T3.CylinderGeometry(0.17, 0.17, 0.75, 32), chrome, a, [0, 0, 0.4], [Math.PI / 2, 0, 0]);
      mesh(new T3.SphereGeometry(0.33, 40, 24), chrome, a, [0, 0, 0.85], null, [1, 0.92, 1.12]);
      const path = new T3.CatmullRomCurve3([new T3.Vector3(0, -0.05, 0.95), new T3.Vector3(0, -0.06, 1.3), new T3.Vector3(0, -0.22, 1.5), new T3.Vector3(0, -0.62, 1.56)]);
      mesh(new T3.TubeGeometry(path, 40, 0.13, 24, false), chrome, a);
      mesh(new T3.TorusGeometry(0.13, 0.035, 12, 32), chrome, a, [0, -0.62, 1.56], [Math.PI / 2, 0, 0]);
      mesh(new T3.CylinderGeometry(0.075, 0.075, 0.4, 20), chrome, a, [0, 0.42, 0.85]);
      const wheel = new T3.Group();
      wheel.position.set(0, 0.66, 0.85);
      a.add(wheel);
      mesh(new T3.TorusGeometry(0.38, 0.075, 18, 48), red, wheel, [0, 0, 0], [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 4; i++) mesh(new T3.BoxGeometry(0.72, 0.07, 0.09), red, wheel, [0, 0, 0], [0, (i * Math.PI) / 4, 0]);
      mesh(new T3.SphereGeometry(0.12, 24, 16), red, wheel, [0, 0.02, 0]);
      const drops = [0, 1, 2, 3].map(() => mesh(new T3.SphereGeometry(0.075, 20, 14), water, a, [0, -0.7, 1.56], null, [1, 1.35, 1]));
      return {
        g, anim(lt, act) {
          const u = E.io(seg(lt, act, 1.0));
          wheel.rotation.y = -u * Math.PI * 2.4;
          drops.forEach((d, i) => {
            const t0 = -0.4 + i * 0.42, k = lt - t0;
            const live = k > 0 && k < 0.55 && t0 < act + 0.55;
            d.visible = live;
            if (live) d.position.y = -0.72 - 4.2 * k * k;
          });
        },
      };
    }
    function mkRad() {
      const g = new T3.Group(), a = new T3.Group();
      g.add(a);
      a.position.y = 0.05;
      const enamel = M.phy('#f3f2ee', { roughness: 0.3, emissive: new T3.Color('#ff5a1f'), emissiveIntensity: 0 });
      for (let i = 0; i < 7; i++) mesh(new T3.CapsuleGeometry(0.135, 1.75, 8, 24), enamel, a, [-0.9 + i * 0.3, 0, 0]);
      mesh(new T3.CylinderGeometry(0.1, 0.1, 2.05, 24), enamel, a, [0, 0.86, 0], [0, 0, Math.PI / 2]);
      mesh(new T3.CylinderGeometry(0.1, 0.1, 2.05, 24), enamel, a, [0, -0.86, 0], [0, 0, Math.PI / 2]);
      // thermostat valve
      mesh(new T3.CylinderGeometry(0.07, 0.07, 0.35, 20), chrome, a, [1.18, -0.86, 0], [0, 0, Math.PI / 2]);
      mesh(new T3.CylinderGeometry(0.1, 0.1, 0.18, 24), chrome, a, [1.35, -0.86, 0]);
      const head = mesh(new T3.CylinderGeometry(0.17, 0.19, 0.42, 28), white, a, [1.35, -0.55, 0]);
      for (let i = 0; i < 10; i++) mesh(new T3.BoxGeometry(0.03, 0.36, 0.04), white, head, [Math.sin((i / 10) * Math.PI * 2) * 0.18, 0, Math.cos((i / 10) * Math.PI * 2) * 0.18], [0, (i / 10) * Math.PI * 2, 0]);
      // bleed valve + key
      mesh(new T3.CylinderGeometry(0.075, 0.075, 0.12, 6), chrome, a, [-1.08, 0.86, 0], [0, 0, Math.PI / 2]);
      const keyG = new T3.Group();
      keyG.position.set(-1.16, 0.86, 0);
      a.add(keyG);
      const kk = new T3.Group();
      keyG.add(kk);
      mesh(new T3.CylinderGeometry(0.035, 0.035, 0.3, 12), brass, kk, [-0.15, 0, 0], [0, 0, Math.PI / 2]);
      mesh(new T3.TorusGeometry(0.12, 0.035, 10, 24), brass, kk, [-0.38, 0, 0], [0, Math.PI / 2, 0]);
      const puffs = [...Array(7)].map((_, i) => mesh(new T3.SphereGeometry(0.06, 14, 10), new T3.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, roughness: 1 }), a, [-1.08, 0.95, 0]));
      puffs.forEach((p) => { p.castShadow = false; });
      return {
        g, anim(lt, act) {
          const kin = E.oc(seg(lt, act - 0.55, 0.4));
          kk.position.x = -0.9 * (1 - kin);
          kk.visible = kin > 0.01 && lt < act + 2.2;
          keyG.rotation.x = -E.io(seg(lt, act - 0.1, 0.8)) * Math.PI * 1.5;
          puffs.forEach((p, i) => {
            const k = seg(lt, act + 0.35 + i * 0.07, 0.9);
            p.visible = k > 0 && k < 1;
            const ang = -0.6 + i * 0.32;
            p.position.set(-1.08 - Math.cos(ang) * 0.1 - k * 0.5 * Math.cos(ang) - 0.15 * k, 0.95 + k * 0.75 + Math.sin(ang) * 0.2 * k, Math.sin(i * 2.1) * 0.25 * k);
            p.scale.setScalar(0.6 + k * 2.4);
            p.material.opacity = 0.75 * (1 - k);
          });
          const warm = E.io(seg(lt, act + 0.7, 1.2));
          enamel.emissiveIntensity = warm * 0.55;
          enamel.color.set('#f3f2ee').lerp(new T3.Color('#ffd2b0'), warm * 0.8);
        },
      };
    }
    function mkWin() {
      const g = new T3.Group(), a = new T3.Group();
      g.add(a);
      a.position.y = 0.05;
      const fs = rrShape(2.0, 2.55, 0.12);
      const hole = new T3.Path();
      const iw = 1.62, ih = 2.17;
      hole.moveTo(-iw / 2, -ih / 2); hole.lineTo(iw / 2, -ih / 2); hole.lineTo(iw / 2, ih / 2); hole.lineTo(-iw / 2, ih / 2); hole.lineTo(-iw / 2, -ih / 2);
      fs.holes.push(hole);
      const fg = new T3.ExtrudeGeometry(fs, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 });
      fg.translate(0, 0, -0.11);
      const wood = M.phy('#f6f4ef', { roughness: 0.4 });
      mesh(fg, wood, a);
      mesh(new T3.BoxGeometry(0.09, ih, 0.2), wood, a, [0, 0, 0]);
      mesh(new T3.BoxGeometry(iw, 0.08, 0.2), wood, a, [0, 0.18, 0]);
      mesh(new T3.BoxGeometry(0.06, 0.24, 0.07), chrome, a, [0.12, -0.15, 0.14]);
      const glass = new T3.MeshPhysicalMaterial({ color: '#d6ecff', roughness: 0.03, metalness: 0, transparent: true, opacity: 0.32, envMapIntensity: 2.2, clearcoat: 1 });
      const gl = mesh(new T3.PlaneGeometry(iw - 0.02, ih - 0.02), glass, a, [0, 0, -0.02]);
      gl.castShadow = false;
      // seal strip (drawn progressively)
      const sw = iw - 0.08, sh = ih - 0.08, sr = 0.06;
      const sp = new T3.CurvePath();
      const P = (x, y) => new T3.Vector3(x, y, 0.1);
      const pts = [P(-sw / 2 + sr, sh / 2), P(sw / 2 - sr, sh / 2), P(sw / 2, sh / 2 - sr), P(sw / 2, -sh / 2 + sr), P(sw / 2 - sr, -sh / 2), P(-sw / 2 + sr, -sh / 2), P(-sw / 2, -sh / 2 + sr), P(-sw / 2, sh / 2 - sr), P(-sw / 2 + sr, sh / 2)];
      for (let i = 0; i < pts.length - 1; i++) sp.add(new T3.LineCurve3(pts[i], pts[i + 1]));
      const NSEG = 240, RSEG = 10;
      const sealG = new T3.TubeGeometry(sp, NSEG, 0.04, RSEG, true);
      const seal = mesh(sealG, M.phy('#e07d43', { roughness: 0.45 }), a);
      // cold-air streaks
      const streakM = new T3.MeshBasicMaterial({ color: '#7fb2ff', transparent: true, opacity: 0.0 });
      const streaks = [...Array(6)].map((_, i) => { const m = new T3.Mesh(new T3.CapsuleGeometry(0.025, 0.7, 4, 8), streakM.clone()); m.rotation.z = Math.PI / 2; a.add(m); return m; });
      return {
        g, anim(lt, act) {
          const p = E.io(seg(lt, act - 0.05, 1.1));
          sealG.setDrawRange(0, Math.floor(p * NSEG) * RSEG * 6);
          seal.visible = p > 0.005;
          streaks.forEach((m, i) => {
            const ph = ((lt * 0.9 + i * 0.37) % 1);
            const born = lt - ph / 0.9;
            const ok = born < act + 0.7;
            m.position.set(2.6 - ph * 2.5, -0.85 + i * 0.34, 0.25 + (i % 2) * 0.1);
            m.material.opacity = ok ? 0.75 * Math.sin(Math.PI * ph) * (1 - ph * 0.4) : 0;
            m.visible = m.material.opacity > 0.01;
          });
        },
      };
    }
    function mkSmoke() {
      const g = new T3.Group(), a = new T3.Group();
      g.add(a);
      a.rotation.x = -2.0;
      a.position.y = 0.1;
      const prof = [[0, 0], [0.92, 0], [1.02, 0.05], [1.05, 0.15], [1.01, 0.27], [0.88, 0.36], [0.55, 0.41], [0, 0.43]].map(([x, y]) => new T3.Vector2(x, y));
      const body = mesh(new T3.LatheGeometry(prof, 64), white, a);
      body.rotation.x = Math.PI;
      for (let i = 0; i < 28; i++) {
        const an = (i / 28) * Math.PI * 2;
        mesh(new T3.BoxGeometry(0.2, 0.08, 0.04), M.std('#8a9198', { roughness: 0.7 }), a, [Math.cos(an) * 0.74, -0.385, Math.sin(an) * 0.74], [0, -an, 0]);
      }
      const btn = mesh(new T3.CylinderGeometry(0.25, 0.25, 0.08, 40), M.phy('#e4e6e8', { roughness: 0.35 }), a, [0, -0.47, 0]);
      const led = mesh(new T3.SphereGeometry(0.05, 16, 12), new T3.MeshStandardMaterial({ color: '#ff3b2f', emissive: new T3.Color('#ff2a1a'), emissiveIntensity: 2 }), a, [0.42, -0.45, 0.18]);
      const rings = [0, 1, 2].map(() => {
        const m = new T3.Mesh(new T3.TorusGeometry(1, 0.025, 8, 80), new T3.MeshBasicMaterial({ color: '#2d5bff', transparent: true, opacity: 0 }));
        a.add(m); m.rotation.x = Math.PI / 2; m.position.y = -0.45;
        return m;
      });
      return {
        g, anim(lt, act) {
          const press = seg(lt, act - 0.15, 0.12) * (1 - seg(lt, act + 0.35, 0.15));
          btn.position.y = -0.47 + 0.05 * press;
          const on = lt > act;
          const blink = Math.floor(lt * 3) % 2 === 0;
          led.material.color.set(on ? '#29d07a' : '#ff3b2f');
          led.material.emissive.set(on ? '#14c86a' : '#ff2a1a');
          led.material.emissiveIntensity = on ? 2.4 : (blink ? 2 : 0.15);
          rings.forEach((m, i) => {
            const k = seg(lt, act + 0.05 + i * 0.22, 0.85);
            m.visible = k > 0 && k < 1;
            m.scale.setScalar(1.05 + k * 1.6);
            m.material.opacity = 0.9 * (1 - k);
          });
        },
      };
    }
    function mkGut() {
      const g = new T3.Group(), a = new T3.Group();
      g.add(a);
      a.position.y = -0.1;
      const roof = new T3.Group();
      roof.position.set(0, 0.55, -0.55);
      roof.rotation.x = 0.5;
      a.add(roof);
      const tileM = M.phy('#b6533c', { roughness: 0.6, clearcoat: 0.2 });
      for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) mesh(new T3.CylinderGeometry(0.17, 0.17, 0.62, 20, 1, false, 0, Math.PI), tileM, roof, [-1.25 + i * 0.5 + (r % 2) * 0.25 - 0.12, 0.08, 0.35 - r * 0.5], [Math.PI / 2, 0, Math.PI / 2 + Math.PI / 2], [1, 1, 1]);
      mesh(new T3.BoxGeometry(3.0, 0.06, 1.6), M.std('#7b3a2a', { roughness: 0.9 }), roof, [0, -0.02, -0.15]);
      mesh(new T3.BoxGeometry(3.0, 0.32, 0.1), M.phy('#efe9df', { roughness: 0.6 }), a, [0, 0.12, -0.32]);
      const zinc = M.std('#a5adb3', { metalness: 0.75, roughness: 0.32, side: T3.DoubleSide });
      const gut = mesh(new T3.CylinderGeometry(0.34, 0.34, 3.0, 40, 1, true, Math.PI / 2, Math.PI), zinc, a, [0, 0, 0], [0, 0, Math.PI / 2]);
      [-1.5, 1.5].forEach((x) => mesh(new T3.CircleGeometry(0.34, 24, Math.PI, Math.PI), zinc, a, [x, 0, 0], [0, Math.PI / 2, 0]));
      mesh(new T3.TorusGeometry(0.34, 0.03, 8, 30, Math.PI), zinc, a, [-1.5, 0, 0], [0, Math.PI / 2, Math.PI]);
      mesh(new T3.TorusGeometry(0.34, 0.03, 8, 30, Math.PI), zinc, a, [1.5, 0, 0], [0, Math.PI / 2, Math.PI]);
      [-1, 0, 1].forEach((x) => mesh(new T3.TorusGeometry(0.36, 0.022, 6, 24, Math.PI), M.std('#6d757b', { metalness: 0.8, roughness: 0.4 }), a, [x, 0, 0], [0, Math.PI / 2, Math.PI]));
      const ls = new T3.Shape();
      ls.moveTo(0, -0.2); ls.quadraticCurveTo(0.17, -0.04, 0, 0.22); ls.quadraticCurveTo(-0.17, -0.04, 0, -0.2);
      const lg = new T3.ShapeGeometry(ls, 8);
      const LC = ['#d9792b', '#b4531f', '#e5a13a', '#9c6a2a', '#c8452a'];
      let sd = 3;
      const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      const leaves = [...Array(14)].map((_, i) => {
        const m = mesh(lg, M.std(LC[i % 5], { roughness: 0.7, side: T3.DoubleSide }), a);
        const L = { m, x0: -1.25 + (i / 13) * 2.5 + (rnd() - 0.5) * 0.15, y0: -0.05 + rnd() * 0.12, z0: (rnd() - 0.5) * 0.3, r0: [rnd() * 3, rnd() * 3, rnd() * 3], vx: (rnd() - 0.5) * 2.4, vy: 2.6 + rnd() * 1.6, vz: 1.2 + rnd() * 1.4, w: [(rnd() - 0.5) * 12, (rnd() - 0.5) * 12, (rnd() - 0.5) * 8], dl: rnd() * 0.45 };
        return L;
      });
      return {
        g, anim(lt, act) {
          leaves.forEach((L) => {
            const k = Math.max(0, lt - (act - 0.2 + L.dl));
            L.m.position.set(L.x0 + L.vx * k, L.y0 + L.vy * k - 4.5 * k * k, L.z0 + L.vz * k);
            L.m.rotation.set(L.r0[0] + L.w[0] * k, L.r0[1] + L.w[1] * k, L.r0[2] + L.w[2] * k);
            L.m.visible = k < 1.6;
          });
        },
      };
    }
    const OBJ = [mkTap(), mkRad(), mkWin(), mkSmoke(), mkGut()];
    OBJ.forEach((o) => scene.add(o.g));
    const SOLO_RY = [-0.75, 0.35, 0.45, 0.55, 0.3];
    const SOLO_S = [0.84, 0.86, 0.8, 0.9, 0.7];
    const ring = (k, R = 1.5, y = 0.05, s = 0.3) => (t) => { const a = (2 * Math.PI * k) / 5 + t * 0.42; return { x: R * Math.sin(a), y: y - 0.1 * Math.cos(a), z: R * Math.cos(a), s, ry: t * 0.8 + k * 1.3, rx: 0 }; };
    const ringOut = (k) => (t) => { const p = ring(k)(t); return { ...p, x: p.x * 2.2, z: p.z * 1.5, y: p.y + 0.6, s: 0 }; };
    const ringTop = (k) => (t) => { const a = (2 * Math.PI * k) / 5 + t * 0.55; return { x: 1.08 * Math.sin(a), y: 1.3 - 0.05 * Math.cos(a), z: 0.55 * Math.cos(a) - 0.2, s: 0.17, ry: t * 1.1 + k, rx: 0.1 }; };
    const solo = (k) => (t) => ({ x: 0, y: 0, z: 0.35, s: SOLO_S[k], ry: SOLO_RY[k] + (t - NT[k]) * 0.16, rx: 0.06 });
    const offL = (k) => (t) => ({ x: -4.6, y: 0.4, z: 0, s: 0.75, ry: SOLO_RY[k] - 1.6, rx: 0.2 });
    const offR = (k) => (t) => ({ x: 4.6, y: -0.3, z: 0, s: 0.75, ry: SOLO_RY[k] + 1.8, rx: -0.15 });
    const hid = (k) => (t) => ({ ...ring(k)(t), s: 0 });
    const TR = OBJ.map((o, k) => {
      const kf = [[0.05 + k * 0.09, hid(k)], [0.55 + k * 0.09, ring(k), (x) => E.ob(x, 1.6)]];
      if (k === 0) kf.push([NT[0] - 0.22, ring(k)], [NT[0] + 0.38, solo(k), E.o5]);
      else kf.push([NT[0] - 0.22, ring(k)], [NT[0] + 0.12, ringOut(k), E.ic], [NT[k] - 0.2, offR(k)], [NT[k] + 0.32, solo(k), E.o5]);
      if (k < 4) kf.push([NT[k + 1] - 0.2, solo(k)], [NT[k + 1] + 0.12, offL(k), E.ic], [K.turn - 0.25 + k * 0.05, offL(k)], [K.turn + 0.45 + k * 0.05, ringTop(k), E.o5]);
      else kf.push([K.turn - 0.25, solo(k)], [K.turn + 0.45, ringTop(k), E.o5]);
      return track(kf);
    });
    // numerals: hook "5" sits in the ring (z=0), then each numeral slides in behind its object
    const NUMT = NUM.map((m, k) => {
      const hide = () => ({ x: 0, y: -4.4, z: -1.5, s: 1 });
      const show = () => ({ x: 0, y: 0.1, z: -1.5, s: 1 });
      const up = () => ({ x: 0, y: 4.4, z: -1.5, s: 1 });
      let kf;
      if (k === 0) kf = [[0, () => ({ x: 0, y: 0.0, z: 0, s: 1.7 })], [0.45, () => ({ x: 0, y: 0.0, z: 0, s: 0.86 }), E.o5], [NT[0] - 0.2, () => ({ x: 0, y: 0.0, z: 0, s: 0.86 })], [NT[0] + 0.3, show, E.o5]];
      else kf = [[NT[k] - 0.2, hide], [NT[k] + 0.25, show, E.o5]];
      if (k < 4) kf.push([NT[k + 1] - 0.2, show], [NT[k + 1] + 0.2, up, E.ic]);
      else kf.push([K.turn - 0.25, show], [K.turn + 0.15, up, E.ic]);
      return track(kf);
    });
    perFrame((t) => {
      OBJ.forEach((o, k) => { apply(o.g, TR[k](t)); o.anim(t - NT[k], ACT[k] - NT[k]); });
      NUM.forEach((m, k) => { const p = NUMT[k](t); m.position.set(p.x, p.y, p.z); m.scale.setScalar(p.s); m.visible = t >= (k ? NT[k] - 0.3 : 0) && p.y < 4.3 && p.y > -4.3; });
      // subtle camera drift + punch-in on each number
      const punch = NT.reduce((acc, nt) => acc + 0.35 * Math.exp(-Math.pow((t - nt - 0.05) / 0.12, 2)), 0);
      cam.position.set(Math.sin(t * 0.35) * 0.35, 2.2 + Math.sin(t * 0.27) * 0.1, 10.2 - punch - (t < NT[0] ? 0.6 * E.oc(seg(t, 0, 4)) : 0));
      cam.lookAt(LOOK);
      floor.material.opacity = 0.16 * (1 - seg(t, K.turn - 0.2, 0.4));
      G.r.render(scene, cam);
    });

    // ---- HTML: hook headline, top bar, benefit chips, finale card ----
    const hk = el('div', 'w3hk', `<div class="h">${S.head}</div><div class="s">${S.sub}</div>`);
    tl.fromTo(hk.querySelector('.h'), { autoAlpha: 0, y: 70, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(2)' }, 0.25);
    tl.fromTo(hk.querySelector('.s'), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power3.out' }, W(['Mieter', 'tenants']).start - 0.1);
    const kk = el('div', 'w3kick', `❄ ${S.kick}`);
    tl.fromTo(kk, { autoAlpha: 0, scale: 0.6, rotation: -6 }, { autoAlpha: 1, scale: 1, rotation: -3, duration: 0.35, ease: 'back.out(2.4)' }, W(['bevor', 'before']).start - 0.05);
    tl.to([hk, kk], { autoAlpha: 0, y: 80, duration: 0.25, ease: 'power2.in' }, NT[0] - 0.25);
    sfx('impact', 0.02, -8);
    sfx('wind', 0.0, -18);
    sfx('shiver', K.frost - 0.05, -10);

    const bar = el('div', 'w3bar', `<span class="l">${S.bar}</span><span class="segs">${'<i><b></b></i>'.repeat(5)}</span><span class="tmp">❄ ${S.temp}</span>`);
    tl.fromTo(bar, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power3.out' }, NT[0] - 0.1);
    const fills = bar.querySelectorAll('.segs b');
    const bens = S.ben.map((b, k) => el('div', 'w3ben', `<span>${b[0]}</span>${b[1]}`));
    NT.forEach((nt, k) => {
      const nx = k < 4 ? NT[k + 1] : K.turn;
      tl.fromTo(bens[k], { autoAlpha: 0, y: 40, scale: 0.8, xPercent: -50 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2.2)', immediateRender: false }, ACT[k] + 0.45);
      tl.set(bens[k], { autoAlpha: 0, xPercent: -50 }, 0);
      tl.to(bens[k], { autoAlpha: 0, y: -30, duration: 0.18, ease: 'power2.in' }, nx - 0.22);
      tl.fromTo(fills[k], { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: 'power2.out', immediateRender: false }, ACT[k] + 0.5);
      tl.set(fills[k], { scaleX: 0 }, 0);
      sfx('whoosh', nt - 0.2, -11);
      sfx('thud', nt + 0.02, -10);
      sfx('pop', ACT[k] + 0.47, -14);
    });
    // per-object sounds
    sfx('drip', ACT[0] - 0.2, -14);
    sfx('heater', ACT[1] + 0.6, -12);
    sfx('whoosh', ACT[2] + 0.1, -16);
    sfx('buzz', ACT[3] + 0.05, -14);
    sfx('receipts', ACT[4] - 0.15, -10);

    // finale: Tenance checklist card
    const card = el('div', 'w3card', `<div class="w3hd"><span class="ai"><img src="assets/logo.png"></span><h4>${S.app}</h4><span class="pill">${S.done(0)}</span></div>` +
      S.rows.map((r, i) => `<div class="w3rw"><span class="w3n">${5 - i}</span><b>${r}</b><span class="w3who ${S.who[i] === S.r1 ? 'm' : 'v'}">${S.who[i]}</span><span class="w3ck"><i>✓</i></span></div>`).join('') +
      `<div class="w3ft"><span class="w3rc"><i>✓</i>${S.r1}</span><span class="w3rc"><i>✓</i>${S.r2}</span></div>`);
    tl.fromTo(card, { autoAlpha: 0, y: 260, rotationX: 28, scale: 0.9 }, { autoAlpha: 1, y: 0, rotationX: 0, scale: 1, duration: 0.55, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    tl.set(card, { autoAlpha: 0 }, 0);
    sfx('whoosh', K.turn - 0.2, -9);
    const pill = card.querySelector('.pill');
    const TT = [];
    perFrame((t) => { const n = TT.filter((x) => t >= x + 0.02).length; if (pill.dataset.n !== String(n)) { pill.dataset.n = n; pill.textContent = S.done(n); } });
    card.querySelectorAll('.w3rw').forEach((rw, i) => {
      const tt = K.tick - 0.05 + i * ((K.tog + 0.25 - K.tick) / 5);
      const ck = rw.querySelector('.w3ck');
      tl.fromTo(ck, { backgroundColor: '#ffffff', borderColor: '#cfd6e2' }, { backgroundColor: '#1fbf72', borderColor: '#1fbf72', duration: 0.12, immediateRender: false }, tt);
      tl.fromTo(ck.querySelector('i'), { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, tt);
      tl.set(ck.querySelector('i'), { scale: 0 }, 0);
      tl.fromTo(rw.querySelector('.w3who'), { autoAlpha: 0, x: 20 }, { autoAlpha: 1, x: 0, duration: 0.2, immediateRender: false }, tt + 0.05);
      tl.set(rw.querySelector('.w3who'), { autoAlpha: 0 }, 0);
      TT.push(tt);
      sfx('pop', tt, -13 + i * 0.5);
    });
    const rcs = card.querySelectorAll('.w3rc');
    tl.fromTo(rcs, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.4)', stagger: 0.1, immediateRender: false }, K.tog + 0.35);
    tl.set(rcs, { autoAlpha: 0 }, 0);
    sfx('chime', K.tog + 0.4, -12);
    const lk = el('div', 'w3lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.fromTo(lk, { autoAlpha: 0, xPercent: -50, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.35);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    sfx('impact', END + 0.38, -10);
    setCapHidden((t) => t < NT[0] - 0.1 || t > END + 0.3);
    return { T, K };
  }

  // ================= W2: mold — kinetic type + macro graphics (teal/mint) =================
  function W2() {
    const de = lang === 'de';
    const S = de ? {
      chip: '07:12 · 💧 78 %', nass: 'NASS', schwarz: 'SCHWARZ', schimmel: 'SCHIMMEL', nr: 'Winter-Problem', who: ['Mieter', 'Vermieter'], ball: 'Schuld?',
      n1h: 'Lüft-Erinnerung', n1: '💨 Jetzt 5 Min. stoßlüften', n1t: '07:15', gauge: 'Luftfeuchte',
      n2h: 'Feuchtigkeit gemeldet', n2: 'Schlafzimmer · Fensterecke', n2c: 'an Vermieter ✓', stamp: 'gestoppt ✓',
      n3h: 'Vermieter prüft', n3: '🔧 Do, 10:00 · Ursache wird behoben',
      e1: 'Gesunde Luft', e1c: 'für Mieter', e2: 'Geschützte Wände', e2c: 'für Vermieter', tag: 'für Mieter & Vermieter',
    } : {
      chip: '7:12 am · 💧 78%', nass: 'WET', schwarz: 'BLACK', schimmel: 'MOLD', nr: 'winter problem', who: ['Tenant', 'Landlord'], ball: 'Blame?',
      n1h: 'Airing reminder', n1: '💨 Open windows for 5 min', n1t: '7:15', gauge: 'Humidity',
      n2h: 'Damp spot reported', n2: 'Bedroom · window corner', n2c: 'sent to landlord ✓', stamp: 'stopped ✓',
      n3h: 'Landlord checks', n3: '🔧 Thu, 10 am · cause gets fixed',
      e1: 'Healthy air', e1c: 'for tenants', e2: 'Protected walls', e2c: 'for landlords', tag: 'for tenants & landlords',
    };
    const K = {};
    K.nass = W(['nass', 'wet']).start;
    K.ecke = W(['Ecke', 'corner']).start;
    K.schwarz = W(['schwarz', 'black']).start;
    K.schimmel = W(['Schimmel', 'Mold']).start;
    K.nr1 = W(['eins', 'one']).start;
    K.keiner = W(['keiner', 'nobody']).start;
    K.schuld = W(['schuld', 'blame']).start;
    K.turn = W(['Mit', 'With']).start;
    K.lueft = W(['Lüft-Erinnerungen', 'airing']).start;
    K.feucht = W(['Feuchtigkeit', 'damp']).start;
    K.foto = W(['Foto', 'photo']).start;
    K.bevor = W(['bevor', 'before']).start;
    K.luft = W(['Gesunde', 'Healthy']).start;
    K.waende = W(['geschützte', 'protected']).start;
    const T = END + 2.0;
    let sd = 11;
    const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += rnd(); return (u - 2) / 0.58; };

    // ---------- scene A: fogged window at dawn ----------
    const A = el('div', 'w2A');
    el('div', 'w2dawn', '<i class="sun"></i>' + [...Array(16)].map((_, i) => `<i class="bk" style="left:${(i * 137) % 1000}px;top:${980 + ((i * 71) % 520)}px;width:${40 + (i * 23) % 70}px;height:${40 + (i * 23) % 70}px;opacity:${0.35 + (i % 4) * 0.12}"></i>`).join('') + '<i class="city"></i>', A);
    const fog = el('canvas', 'w2fog', null, A);
    fog.width = 1080; fog.height = 1920;
    const fx = fog.getContext('2d');
    const fogTex = document.createElement('canvas');
    fogTex.width = 270; fogTex.height = 480;
    (() => {
      const x = fogTex.getContext('2d');
      const im = x.createImageData(270, 480);
      for (let i = 0; i < im.data.length; i += 4) {
        const py = Math.floor(i / 4 / 270);
        const n = rnd();
        im.data[i] = 214 + n * 30; im.data[i + 1] = 228 + n * 22; im.data[i + 2] = 234 + n * 18;
        im.data[i + 3] = 150 + n * 40 + (py / 480) * 40;
      }
      x.putImageData(im, 0, 0);
    })();
    const drop = document.createElement('canvas');
    drop.width = drop.height = 64;
    (() => {
      const d = drop.getContext('2d');
      const g = d.createRadialGradient(30, 28, 2, 32, 32, 31);
      g.addColorStop(0, 'rgba(255,255,255,0.05)'); g.addColorStop(0.72, 'rgba(190,220,232,0.22)'); g.addColorStop(0.93, 'rgba(25,60,75,0.55)'); g.addColorStop(1, 'rgba(25,60,75,0)');
      d.fillStyle = g; d.beginPath(); d.arc(32, 32, 31, 0, 7); d.fill();
      d.fillStyle = 'rgba(255,255,255,0.92)'; d.beginPath(); d.ellipse(23, 21, 7, 4.5, -0.6, 0, 7); d.fill();
      d.fillStyle = 'rgba(255,255,255,0.4)'; d.beginPath(); d.ellipse(39, 45, 9, 3, -0.6, 0, 7); d.fill();
    })();
    const txt = document.createElement('canvas');
    txt.width = 1080; txt.height = 700;
    READY.push(() => {
      const x = txt.getContext('2d');
      x.translate(540, 380); x.rotate(-0.07);
      x.font = `700 ${de ? 330 : 380}px Clash`; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = '#000'; x.fillText(S.nass, 0, 0);
    });
    const DROPS = [...Array(520)].map(() => { const r = 2.5 + 15 * Math.pow(rnd(), 3.2); return { x: rnd() * 1080, y: rnd() * 1920, r }; });
    const RUN = [...Array(9)].map((_, i) => ({ x: 120 + i * 105 + rnd() * 40, y0: 120 + rnd() * 700, r: 11 + rnd() * 8, t0: 0.2 + rnd() * 1.6, v: 260 + rnd() * 260 }));
    function drawFog(t) {
      fx.globalCompositeOperation = 'source-over';
      fx.clearRect(0, 0, 1080, 1920);
      fx.drawImage(fogTex, 0, 0, 1080, 1920);
      fx.globalCompositeOperation = 'destination-out';
      const p = E.io(seg(t, K.nass - 0.35, 0.55));
      if (p > 0) {
        fx.save();
        fx.beginPath();
        const w = p * 1080;
        fx.moveTo(0, 0); fx.lineTo(w, 0);
        for (let y = 0; y <= 700; y += 35) fx.lineTo(w + Math.sin(y * 0.11) * 30, 610 + y);
        fx.lineTo(0, 1310);
        fx.rect(0, 610, w, 700);
        fx.clip();
        fx.drawImage(txt, 0, 610);
        fx.restore();
      }
      for (const R of RUN) {
        const k = Math.max(0, t - R.t0);
        const y = R.y0 + R.v * Math.pow(k, 1.35);
        if (k > 0) { fx.lineWidth = R.r * 1.15; fx.lineCap = 'round'; fx.strokeStyle = 'rgba(0,0,0,0.9)'; fx.beginPath(); fx.moveTo(R.x, R.y0); fx.lineTo(R.x + Math.sin(k * 2) * 4, y); fx.stroke(); }
      }
      for (const D of DROPS) { fx.fillStyle = 'rgba(0,0,0,0.55)'; fx.beginPath(); fx.arc(D.x, D.y, D.r * 0.9, 0, 7); fx.fill(); }
      fx.globalCompositeOperation = 'source-over';
      for (const D of DROPS) fx.drawImage(drop, D.x - D.r, D.y - D.r, D.r * 2, D.r * 2);
      for (const R of RUN) {
        const k = Math.max(0, t - R.t0);
        const y = R.y0 + R.v * Math.pow(k, 1.35);
        fx.drawImage(drop, R.x + Math.sin(k * 2) * 4 - R.r, y - R.r * 1.15, R.r * 2, R.r * 2.3);
      }
    }
    const chip = el('div', 'w2chip', S.chip, A);
    tl.fromTo(chip, { autoAlpha: 0, y: -30, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(2.2)' }, 0.1);
    tl.fromTo(A, { scale: 1.12 }, { scale: 1.0, duration: K.ecke, ease: 'power1.out' }, 0);
    sfx('drip', 0.25, -10);
    sfx('drip', 1.1, -14);
    sfx('whoosh', K.nass - 0.35, -14);

    // ---------- scene B: wall corner, mold spreading ----------
    const B = el('div', 'w2B', '<i class="pl"></i><i class="fr1"></i><i class="fr2"></i><i class="gls"></i><i class="sh"></i>');
    const mold = el('canvas', 'w2mold', null, B);
    mold.width = 1080; mold.height = 1920;
    const mx = mold.getContext('2d');
    const CL = [[700, 950, 150], [560, 1090, 120], [760, 1200, 100], [450, 920, 90], [640, 1330, 80], [360, 1120, 75], [790, 1040, 80], [520, 1250, 70]];
    const SP = [];
    CL.forEach(([cx, cy, sg], ci) => {
      for (let i = 0; i < 700; i++) {
        const dx = gauss() * sg, dy = gauss() * sg * 1.1, d = Math.hypot(dx, dy) / sg;
        const cols = ['29,36,31', '40,52,43', '18,22,19', '58,70,52', '72,80,60'];
        SP.push({ x: cx + dx, y: cy + dy, r: 1.5 + rnd() * rnd() * 11 * (1.3 - Math.min(1, d * 0.5)), b: ci * 0.08 + d * 0.32 + rnd() * 0.2, c: cols[Math.floor(rnd() * 5)], a: 0.35 + rnd() * 0.55 });
      }
    });
    function drawMold(t, t0, sp = 1) {
      mx.clearRect(0, 0, 1080, 1920);
      const k = (t - t0) * sp;
      CL.forEach(([cx, cy, sg], ci) => {
        const g = clamp((k - ci * 0.08) / 1.4);
        if (g <= 0) return;
        const rg = mx.createRadialGradient(cx, cy, 0, cx, cy, sg * 2.6 * (0.5 + 0.5 * g));
        rg.addColorStop(0, `rgba(92,96,74,${0.32 * g})`); rg.addColorStop(0.6, `rgba(120,118,92,${0.14 * g})`); rg.addColorStop(1, 'rgba(120,118,92,0)');
        mx.fillStyle = rg; mx.fillRect(cx - sg * 3, cy - sg * 3, sg * 6, sg * 6);
      });
      for (const p of SP) {
        const g = clamp((k - p.b) / 0.5);
        if (g <= 0) continue;
        mx.fillStyle = `rgba(${p.c},${p.a * g})`;
        mx.beginPath(); mx.arc(p.x, p.y, p.r * (0.4 + 0.6 * g), 0, 7); mx.fill();
      }
    }
    tl.set(B, { autoAlpha: 0 }, 0);
    tl.set(B, { autoAlpha: 1 }, K.ecke - 0.2);
    tl.fromTo(A, { yPercent: 0, filter: 'blur(0px)' }, { yPercent: -110, filter: 'blur(14px)', duration: 0.26, ease: 'power3.in', immediateRender: false }, K.ecke - 0.32);
    tl.fromTo(B, { yPercent: 100 }, { yPercent: 0, duration: 0.32, ease: 'power3.out', immediateRender: false }, K.ecke - 0.2);
    tl.fromTo(B, { scale: 1 }, { scale: 1.16, duration: K.schimmel - K.ecke + 0.2, ease: 'none', transformOrigin: '62% 52%', immediateRender: false }, K.ecke - 0.2);
    sfx('whoosh', K.ecke - 0.35, -9);
    const sw = el('div', 'w2big blk', S.schwarz);
    tl.fromTo(sw, { autoAlpha: 0, scale: 2.4, rotation: -10, xPercent: -50 }, { autoAlpha: 1, scale: 1, rotation: -4, duration: 0.22, ease: 'power4.in', immediateRender: false }, K.schwarz - 0.1);
    tl.to(sw, { autoAlpha: 0, duration: 0.1 }, K.schimmel - 0.12);
    tl.set(sw, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(B, { x: 0 }, { x: 14, duration: 0.05, repeat: 5, yoyo: true, ease: 'none', immediateRender: false }, K.schwarz + 0.12);
    sfx('sting', K.schwarz - 0.05, -8);
    sfx('impact', K.schwarz + 0.12, -10);

    // ---------- scene C: SCHIMMEL marquee, #1 stamp, blame ping-pong ----------
    const Cc = el('div', 'w2C');
    const rows = [0, 1, 2].map((i) => el('div', 'w2mq ' + (i === 1 ? 'f' : 'o'), (S.schimmel + ' · ').repeat(6), Cc, { top: `${560 + i * 250}px` }));
    tl.set(Cc, { autoAlpha: 0 }, 0);
    tl.set(Cc, { autoAlpha: 1 }, K.schimmel - 0.12);
    tl.fromTo(Cc, { clipPath: 'circle(0% at 50% 55%)' }, { clipPath: 'circle(80% at 50% 55%)', duration: 0.35, ease: 'power3.out', immediateRender: false }, K.schimmel - 0.12);
    rows.forEach((r, i) => tl.fromTo(r, { x: i === 1 ? -900 : -100 }, { x: i === 1 ? -100 : -900, duration: K.turn - K.schimmel + 0.3, ease: 'none', immediateRender: false }, K.schimmel - 0.12));
    sfx('impact', K.schimmel - 0.05, -10);
    const st = el('div', 'w2nr', `<b>#1</b><span>${S.nr}</span>`, Cc);
    tl.fromTo(st, { autoAlpha: 0, scale: 3, rotation: 18, xPercent: -50, yPercent: -50 }, { autoAlpha: 1, scale: 1, rotation: -8, duration: 0.25, ease: 'power4.in', immediateRender: false }, K.nr1 - 0.2);
    tl.set(st, { autoAlpha: 0, xPercent: -50, yPercent: -50 }, 0);
    sfx('thud', K.nr1 + 0.05, -6);
    tl.to(rows, { opacity: 0.12, duration: 0.3 }, K.nr1);
    tl.to(st, { autoAlpha: 0, scale: 0.6, duration: 0.2, ease: 'power2.in' }, K.keiner - 0.3);
    const bl = el('div', 'w2bl', null, Cc);
    const p1 = el('div', 'w2who m', `<i>🙋</i>${S.who[0]}`, bl);
    const p2 = el('div', 'w2who v', `<i>🏠</i>${S.who[1]}`, bl);
    const ball = el('div', 'w2ball', S.ball, bl);
    tl.set(bl, { autoAlpha: 0 }, 0);
    tl.set(bl, { autoAlpha: 1 }, K.keiner - 0.2);
    tl.fromTo([p1, p2], { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(2.2)', stagger: 0.08, immediateRender: false }, K.keiner - 0.2);
    const hops = [[K.keiner - 0.05, 0], [K.keiner + 0.38, 1], [K.keiner + 0.78, 0], [K.schuld + 0.05, 1], [K.turn - 0.25, 0.5]];
    const PX = [250, 830];
    perFrame((t) => {
      if (t < K.keiner - 0.2 || t > K.turn + 0.2) return;
      let x = PX[0], y = 1040, rot = 0;
      for (let i = 0; i < hops.length - 1; i++) {
        const [ta, a] = hops[i], [tb, b] = hops[i + 1];
        if (t >= ta && t < tb) {
          const u = (t - ta) / (tb - ta);
          const xa = lerp(PX[0], PX[1], a), xb = lerp(PX[0], PX[1], b);
          x = lerp(xa, xb, E.io(u)); y = 1040 - Math.sin(Math.PI * u) * 330; rot = (b > a ? 1 : -1) * u * 360;
        } else if (t >= tb) { x = lerp(PX[0], PX[1], b); }
      }
      ball.style.transform = `translate(${x - 120}px, ${y - 120}px) rotate(${rot}deg)`;
    });
    hops.slice(1, 4).forEach(([tt]) => sfx('pop', tt, -10));
    tl.fromTo(ball, { scale: 1 }, { scale: 1.25, duration: 0.12, yoyo: true, repeat: 1, immediateRender: false }, K.schuld);

    // ---------- scene D: turn — mint, reminders, gauge, photo report ----------
    const D = el('div', 'w2D', '<i class="g"></i>');
    tl.set(D, { autoAlpha: 0 }, 0);
    tl.set(D, { autoAlpha: 1 }, K.turn - 0.12);
    tl.fromTo(D, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.4, ease: 'power4.out', immediateRender: false }, K.turn - 0.12);
    sfx('whoosh', K.turn - 0.25, -8);
    const card = (cls, html, top) => el('div', 'w2card ' + cls, html, D, { top: top + 'px' });
    const c1 = card('n1', `<span class="ai"><img src="assets/logo.png"></span><div class="tx"><b>${S.n1h}<em>${S.n1t}</em></b><span>${S.n1}</span></div>`, 400);
    tl.fromTo(c1, { autoAlpha: 0, y: -160, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.6)', immediateRender: false }, K.turn + 0.3);
    tl.set(c1, { autoAlpha: 0 }, 0);
    sfx('chime', K.turn + 0.35, -11);
    const R0 = 230, CIRC = Math.PI * R0;
    const gz = el('div', 'w2gauge', `<svg viewBox="0 0 560 320"><path d="M50 290 A230 230 0 0 1 510 290" fill="none" stroke="rgba(11,59,60,.12)" stroke-width="44" stroke-linecap="round"/><path class="v" d="M50 290 A230 230 0 0 1 510 290" fill="none" stroke="#ff6b4a" stroke-width="44" stroke-linecap="round" stroke-dasharray="${CIRC.toFixed(1)}" stroke-dashoffset="${CIRC.toFixed(1)}"/></svg><div class="num"><b>78</b><small>%</small></div><div class="lb">💧 ${S.gauge}</div><div class="air">${[0, 1, 2].map((i) => `<svg viewBox="0 0 600 60" style="top:${i * 46}px"><path d="M0 30 Q75 0 150 30 T300 30 T450 30 T600 30" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-dasharray="120 480"/></svg>`).join('')}</div>`, D);
    const gv = gz.querySelector('.v'), gn = gz.querySelector('.num b'), airs = gz.querySelectorAll('.air path');
    tl.fromTo(gz, { autoAlpha: 0, scale: 0.7, y: 40 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.8)', immediateRender: false }, K.lueft - 0.2);
    tl.set(gz, { autoAlpha: 0 }, 0);
    const g0 = K.lueft + 0.35, g1 = K.feucht - 0.05;
    const cA = new T3.Color('#ff6b4a'), cB = new T3.Color('#14b88f'), cT = new T3.Color();
    perFrame((t) => {
      if (t < K.turn) return;
      const show = E.oc(seg(t, K.lueft - 0.2, 0.5));
      const u = E.io(seg(t, g0, g1 - g0));
      const v = Math.round(78 - 26 * u);
      gn.textContent = v;
      gv.setAttribute('stroke-dashoffset', (CIRC * (1 - (v / 100) * show)).toFixed(1));
      cT.copy(cA).lerp(cB, u);
      gv.setAttribute('stroke', '#' + cT.getHexString());
      airs.forEach((a, i) => { a.setAttribute('stroke-dashoffset', String(-((t - g0) * 520 + i * 160))); a.parentNode.style.opacity = String(0.9 * seg(t, g0, 0.3) * (1 - seg(t, g1 + 0.3, 0.4))); });
    });
    sfx('wind', g0, -16);
    const thumb = document.createElement('canvas');
    thumb.width = 220; thumb.height = 220;
    const c2 = card('n2', `<div class="th"></div><div class="tx"><b>${S.n2h}</b><span>${S.n2}</span><span class="chip2">${S.n2c}</span></div><div class="stp">${S.stamp}</div>`, 1010);
    c2.querySelector('.th').appendChild(thumb);
    READY.push(() => {
      drawMold(K.ecke + 1.2, K.ecke - 0.75, 1.5);
      const x = thumb.getContext('2d');
      x.fillStyle = '#ddd7cb'; x.fillRect(0, 0, 220, 220);
      x.drawImage(mold, 470, 860, 380, 380, 0, 0, 220, 220);
      x.fillStyle = '#f7f5f0'; x.fillRect(150, 0, 70, 70);
    });
    tl.fromTo(c2, { autoAlpha: 0, x: 700, rotation: 6 }, { autoAlpha: 1, x: 0, rotation: 0, duration: 0.45, ease: 'power4.out', immediateRender: false }, K.feucht - 0.1);
    tl.set(c2, { autoAlpha: 0 }, 0);
    sfx('whoosh', K.feucht - 0.2, -12);
    const fl = el('div', 'w2flash', null, c2.querySelector('.th'));
    tl.set(fl, { opacity: 0 }, 0);
    tl.fromTo(fl, { opacity: 1 }, { opacity: 0, duration: 0.35, immediateRender: false }, K.foto + 0.05);
    sfx('shutter', K.foto, -8);
    const ch2 = c2.querySelector('.chip2');
    tl.fromTo(ch2, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, K.foto + 0.35);
    tl.set(ch2, { autoAlpha: 0 }, 0);
    sfx('send', K.foto + 0.3, -12);
    const stp = c2.querySelector('.stp');
    tl.fromTo(stp, { autoAlpha: 0, scale: 2.2, rotation: -20 }, { autoAlpha: 1, scale: 1, rotation: -12, duration: 0.22, ease: 'power4.in', immediateRender: false }, K.bevor + 0.2);
    tl.set(stp, { autoAlpha: 0 }, 0);
    sfx('thud', K.bevor + 0.42, -9);
    const c3 = card('n3', `<span class="ai v">🏠</span><div class="tx"><b>${S.n3h}</b><span>${S.n3}</span></div>`, 1290);
    tl.fromTo(c3, { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'back.out(1.8)', immediateRender: false }, K.bevor + 0.45);
    tl.set(c3, { autoAlpha: 0 }, 0);
    sfx('pop', K.bevor + 0.5, -12);

    // ---------- scene E: two benefits + lockup ----------
    const Ee = el('div', 'w2E', `<div class="top"><div class="waves">${[0, 1, 2, 3].map((i) => `<svg viewBox="0 0 1200 80" style="top:${i * 90}px"><path d="M0 40 Q100 0 200 40 T400 40 T600 40 T800 40 T1000 40 T1200 40" fill="none" stroke="rgba(20,184,143,.35)" stroke-width="10" stroke-linecap="round"/></svg>`).join('')}</div><h2>${S.e1}</h2><span class="ec">✓ ${S.e1c}</span></div><div class="bot"><div class="bricks"></div><div class="shield"><svg viewBox="0 0 120 140"><path d="M60 6 L110 24 V66 C110 100 88 124 60 134 C32 124 10 100 10 66 V24 Z" fill="#7ee0c3"/><path d="M38 70 L54 86 L84 52" fill="none" stroke="#0b3b3c" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg></div><h2>${S.e2}</h2><span class="ec">✓ ${S.e2c}</span></div>`);
    const eTop = Ee.querySelector('.top'), eBot = Ee.querySelector('.bot');
    tl.set(Ee, { autoAlpha: 0 }, 0);
    tl.set(Ee, { autoAlpha: 1 }, K.luft - 0.15);
    tl.fromTo(eTop, { xPercent: -100 }, { xPercent: 0, duration: 0.4, ease: 'power4.out', immediateRender: false }, K.luft - 0.15);
    tl.fromTo(eBot, { xPercent: 100 }, { xPercent: 0, duration: 0.4, ease: 'power4.out', immediateRender: false }, K.waende - 0.2);
    tl.set(eBot, { xPercent: 100 }, 0);
    tl.fromTo(eTop.querySelector('.ec'), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, W(['Mieter,', 'tenants,'], W(['Gesunde', 'Healthy']).i).start);
    tl.set(eTop.querySelector('.ec'), { autoAlpha: 0 }, 0);
    tl.fromTo(eBot.querySelector('.ec'), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, W(['Vermieter.', 'landlords.'], W(['geschützte', 'protected']).i).start);
    tl.set(eBot.querySelector('.ec'), { autoAlpha: 0 }, 0);
    tl.fromTo(eBot.querySelector('.shield'), { autoAlpha: 0, scale: 0.3, rotation: -20 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(2)', immediateRender: false }, K.waende + 0.1);
    tl.set(eBot.querySelector('.shield'), { autoAlpha: 0 }, 0);
    const waves = eTop.querySelectorAll('.waves svg');
    perFrame((t) => { if (t > K.luft - 0.2) waves.forEach((w, i) => { w.style.transform = `translateX(${-((t * 160 + i * 70) % 200)}px)`; }); });
    sfx('whoosh', K.luft - 0.3, -10);
    sfx('whoosh', K.waende - 0.35, -12);
    sfx('pop', K.waende + 0.15, -12);
    const lk = el('div', 'w2lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.fromTo(lk, { autoAlpha: 0, xPercent: -50, yPercent: -50, scale: 0.4, rotation: -6 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.9)', immediateRender: false }, END + 0.3);
    tl.set(lk, { autoAlpha: 0, xPercent: -50, yPercent: -50 }, 0);
    sfx('impact', END + 0.33, -9);
    sfx('chime', END + 0.4, -14);

    perFrame((t) => {
      if (t < K.ecke + 0.1) drawFog(t);
      if (t > K.ecke - 0.25 && t < K.schimmel + 0.4) drawMold(t, K.ecke - 0.75, 1.5);
    });
    setCapHidden((t) => t > K.luft - 0.2);
    return { T, K };
  }

  // ================= W1: who shovels? — 3D night diorama =================
  function W1() {
    const de = lang === 'de';
    const S = de ? {
      t0: '🌙 Mo · 02:14', t1: '◀ So · 19:30', t2: '☀️ Mo · 06:45', temp: '−3°C', q: ['Mieter?', 'Vermieter?'],
      planH: 'Winterdienst-Plan', seen: '👁 alle 6 Parteien', rows: [['KW 46', 'Wohnung 1'], ['KW 47', 'Wohnung 2', 1], ['KW 48', 'Wohnung 3'], ['KW 49', 'Hausmeister']], now: 'diese Woche',
      nH: 'Schneealarm ❄️', nT: 'So, 19:30', n: 'Morgen 8 cm Neuschnee. Du bist dran: Gehweg bis 7:00 Uhr.', free: '✓ Gehweg frei',
      r1: 'Mieter', r2: 'Vermieter', tag: 'für Mieter & Vermieter',
    } : {
      t0: '🌙 Mon · 2:14 am', t1: '◀ Sun · 7:30 pm', t2: '☀️ Mon · 6:45 am', temp: '27°F', q: ['Tenant?', 'Landlord?'],
      planH: 'Snow duty plan', seen: '👁 all 6 units', rows: [['Nov 9–15', 'Unit 1'], ['Nov 16–22', 'Unit 2', 1], ['Nov 23–29', 'Unit 3'], ['Nov 30–Dec 6', 'Caretaker']], now: 'this week',
      nH: 'Snow alert ❄️', nT: 'Sun, 7:30 pm', n: '3 in. of snow tomorrow. Your turn: sidewalk by 7 am.', free: '✓ Sidewalk clear',
      r1: 'Tenant', r2: 'Landlord', tag: 'for tenants & landlords',
    };
    const K = {};
    K.frage = W(['große', 'big']).start;
    K.haus = W(['Haus', 'outside']).start;
    K.wer = W(['Wer', 'who']).start;
    K.turn = W(['Mit', 'With']).start;
    K.plan = W(['Winterdienst-Plan', 'plan']).start;
    K.alle = W(['sichtbar', 'everyone']).start;
    K.alarm = W(['Schneealarm', 'when']).start;
    K.vor = W(['Vorabend', 'evening']).start;
    K.rem = W(['Erinnerung', 'reminder']).start;
    K.geh = W(['Gehweg', 'Sidewalk']).start;
    K.slip = W(['ausrutscht', 'slips']).start;
    const T = END + 2.1;
    const RW0 = K.alarm - 0.15, RW1 = RW0 + 0.55, FF0 = K.geh - 0.45, FF1 = K.geh + 0.05;
    // scene time for snowfall: forward, rewind to the evening before, then fast-forward to the morning
    const tau = (t) => {
      if (t < RW0) return t;
      if (t < RW1) return lerp(RW0, -1, E.io((t - RW0) / (RW1 - RW0)));
      if (t < FF0) return -1;
      if (t < FF1) return lerp(-1, 9, E.io((t - FF0) / (FF1 - FF0)));
      return 9 + (t - FF1);
    };
    const accum = (tt) => clamp((tt - 0.35) / 3.1);
    const CLR0 = K.geh + 0.15, CLR1 = K.geh + 1.25;

    const sky = el('div', 'w1sky', '<i class="stars"></i><i class="moon"></i>');
    const G = gl3(stage, { fov: 32, envTop: '#5a6fa8', envBot: '#0c1222', envInt: 0.6, exposure: 1.05 });
    const { scene, cam } = G;
    const hemi = new T3.HemisphereLight('#6d82c4', '#141a2a', 0.9);
    scene.add(hemi);
    const moon = new T3.DirectionalLight('#b8cbff', 1.5);
    moon.position.set(-7, 11, 7);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    Object.assign(moon.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 });
    moon.shadow.radius = 4; moon.shadow.bias = -0.0005;
    scene.add(moon);
    const sun = new T3.DirectionalLight('#ffc89a', 0);
    sun.position.set(8, 5, 6);
    scene.add(sun);
    const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,220,150,1)'); g.addColorStop(0.25, 'rgba(255,190,110,0.55)'); g.addColorStop(1, 'rgba(255,170,80,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; })();
    const glow = (pos, sc, parent = scene) => { const s = new T3.Sprite(new T3.SpriteMaterial({ map: glowTex, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.9 })); s.position.set(...pos); s.scale.setScalar(sc); parent.add(s); return s; };
    const D = new T3.Group();
    scene.add(D);
    // base + ground
    mesh(rbox(11.2, 1.0, 8.6, 0.18), M.std('#232836', { roughness: 0.9 }), D, [0, -0.5, 0]);
    mesh(new T3.BoxGeometry(11, 0.04, 3.0), M.std('#3a4434', { roughness: 1 }), D, [0, 0.02, -2.75]);
    mesh(new T3.BoxGeometry(11, 0.04, 1.2), M.std('#3a4434', { roughness: 1 }), D, [0, 0.02, 0.7]);
    mesh(new T3.BoxGeometry(11, 0.07, 1.45), M.std('#5f646d', { roughness: 0.85 }), D, [0, 0.035, 2.0]);
    for (let i = 0; i < 22; i++) mesh(new T3.BoxGeometry(0.03, 0.02, 1.4), M.std('#4a4e56'), D, [-5.25 + i * 0.5, 0.075, 2.0]);
    mesh(new T3.BoxGeometry(11, 0.14, 0.14), M.std('#9a9ea6', { roughness: 0.8 }), D, [0, 0.07, 2.78]);
    mesh(new T3.BoxGeometry(11, 0.03, 1.45), M.std('#22252c', { roughness: 0.7 }), D, [0, 0.015, 3.55]);
    for (let i = 0; i < 6; i++) mesh(new T3.BoxGeometry(0.7, 0.035, 0.1), M.std('#d9d4b8', { roughness: 0.8 }), D, [-4.6 + i * 1.85, 0.035, 3.55]);
    // house
    const H = new T3.Group();
    H.position.set(0, 0, -1.65);
    D.add(H);
    mesh(new T3.BoxGeometry(5.0, 4.4, 3.4), M.std('#d8c6ac', { roughness: 0.92 }), H, [0, 2.2 + 0.3, 0]);
    mesh(new T3.BoxGeometry(5.1, 0.5, 3.5), M.std('#7d6e5e', { roughness: 0.95 }), H, [0, 0.25, 0]);
    const rs = new T3.Shape(); rs.moveTo(-2.05, 0); rs.lineTo(2.05, 0); rs.lineTo(0, 1.7); rs.lineTo(-2.05, 0);
    const rg = new T3.ExtrudeGeometry(rs, { depth: 5.5, bevelEnabled: false });
    rg.translate(0, 0, -2.75);
    mesh(rg, M.std('#3b3f4b', { roughness: 0.7 }), H, [0, 4.7, 0], [0, Math.PI / 2, 0]);
    mesh(new T3.BoxGeometry(0.5, 1.1, 0.5), M.std('#8d5a43', { roughness: 0.9 }), H, [1.4, 5.8, -0.4]);
    const snowM = M.std('#eef4ff', { roughness: 0.85 });
    const roofSnow = [-1, 1].map((sg) => { const m = mesh(new T3.BoxGeometry(5.65, 1, 2.62), snowM, H, [0, 0, 0]); m.userData.sg = sg; return m; });
    const winM = [];
    const wins = [];
    const front = 1.71;
    [[-1.55, 1.35], [1.55, 1.35], [-1.55, 2.75], [0, 2.75], [1.55, 2.75], [-1.55, 4.1], [0, 4.1], [1.55, 4.1]].forEach(([x, y], i) => {
      mesh(new T3.BoxGeometry(0.82, 1.02, 0.08), M.std('#f2efe8', { roughness: 0.6 }), H, [x, y, front]);
      const m = new T3.MeshStandardMaterial({ color: '#2a2f3d', emissive: new T3.Color('#ffb85c'), emissiveIntensity: 0, roughness: 0.3 });
      mesh(new T3.BoxGeometry(0.66, 0.86, 0.06), m, H, [x, y, front + 0.03]);
      mesh(new T3.BoxGeometry(0.66, 0.05, 0.07), M.std('#f2efe8'), H, [x, y + 0.05, front + 0.05]);
      const g = glow([x, y, front + 0.4], 1.6, H);
      winM.push(m); wins.push({ m, g, x, y, on0: [1, 0, 1, 0, 0, 1, 0, 0][i] });
    });
    mesh(new T3.BoxGeometry(0.95, 1.55, 0.1), M.std('#5a3626', { roughness: 0.6 }), H, [0, 1.12, front]);
    mesh(new T3.BoxGeometry(1.4, 0.1, 0.5), M.std('#3b3f4b'), H, [0, 2.05, front + 0.2]);
    const doorLamp = mesh(new T3.SphereGeometry(0.1, 16, 12), new T3.MeshStandardMaterial({ color: '#fff3d6', emissive: new T3.Color('#ffc477'), emissiveIntensity: 3 }), H, [0.62, 1.75, front + 0.12]);
    const doorGlow = glow([0.62, 1.75, front + 0.3], 1.4, H);
    const doorL = new T3.PointLight('#ffb35a', 6, 5, 2);
    doorL.position.set(0.62, 1.7, front + 0.6); H.add(doorL);
    // street lamp
    const LP = new T3.Group(); LP.position.set(3.9, 0, 3.0); D.add(LP);
    const iron = M.std('#1f232b', { roughness: 0.5, metalness: 0.6 });
    mesh(new T3.CylinderGeometry(0.07, 0.09, 3.6, 12), iron, LP, [0, 1.8, 0]);
    mesh(new T3.CylinderGeometry(0.05, 0.05, 0.8, 8), iron, LP, [-0.35, 3.55, 0], [0, 0, Math.PI / 2]);
    mesh(new T3.ConeGeometry(0.28, 0.3, 16), iron, LP, [-0.7, 3.45, 0]);
    const bulb = mesh(new T3.SphereGeometry(0.13, 16, 12), new T3.MeshStandardMaterial({ color: '#fff3d6', emissive: new T3.Color('#ffc477'), emissiveIntensity: 3 }), LP, [-0.7, 3.3, 0]);
    const lampGlow = glow([-0.7, 3.25, 0], 2.6, LP);
    const lampL = new T3.PointLight('#ffb04f', 22, 9, 1.6);
    lampL.position.set(-0.7, 3.1, 0); LP.add(lampL);
    const cone = new T3.Mesh(new T3.ConeGeometry(1.5, 3.2, 32, 1, true), new T3.MeshBasicMaterial({ color: '#ffbf6a', transparent: true, opacity: 0.07, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide }));
    cone.position.set(-0.7, 1.65, 0); LP.add(cone);
    // trees
    const pine = (x, z, s) => {
      const g = new T3.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); D.add(g);
      mesh(new T3.CylinderGeometry(0.12, 0.16, 0.7, 8), M.std('#4a3326'), g, [0, 0.35, 0]);
      const caps = [];
      [[1.0, 1.3, 0.9], [0.8, 1.1, 1.6], [0.55, 0.9, 2.25]].forEach(([r, h, y]) => {
        mesh(new T3.ConeGeometry(r, h, 10), M.std('#1f3d2e', { roughness: 0.9 }), g, [0, y, 0]);
        const c = mesh(new T3.ConeGeometry(r * 0.82, h * 0.45, 10), snowM, g, [0, y + h * 0.22, 0]);
        caps.push(c);
      });
      return caps;
    };
    const treeCaps = [...pine(-4.4, -0.9, 1.0), ...pine(4.5, -2.3, 1.15), ...pine(-3.7, -3.3, 0.85)];
    // snow layers
    const box1 = new T3.BoxGeometry(1, 1, 1);
    box1.translate(0, 0.5, 0);
    const yard = mesh(box1, snowM, D, [0, 0.04, -1.55], null, [11, 0.01, 5.4]);
    const NSEG = 18, segW = 11 / NSEG;
    const walk = [...Array(NSEG)].map((_, i) => mesh(box1, snowM, D, [-5.5 + segW * (i + 0.5), 0.07, 2.0], null, [segW + 0.01, 0.01, 1.42]));
    const street = mesh(box1, M.std('#d9e1ef', { roughness: 0.9 }), D, [0, 0.03, 3.55], null, [11, 0.01, 1.42]);
    const piles = [...Array(NSEG)].map((_, i) => mesh(new T3.SphereGeometry(0.5, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), snowM, D, [-5.5 + segW * (i + 0.5), 0.05, 1.32], null, [0.001, 0.001, 0.001]));
    // shovel
    const SH = new T3.Group(); D.add(SH);
    mesh(new T3.CylinderGeometry(0.04, 0.04, 1.5, 10), M.std('#8a5a34', { roughness: 0.6 }), SH, [0, 0.75, 0]);
    mesh(new T3.BoxGeometry(0.34, 0.06, 0.06), M.std('#222'), SH, [0, 1.5, 0]);
    mesh(new T3.BoxGeometry(0.62, 0.5, 0.04), M.std('#d8402a', { roughness: 0.4, metalness: 0.2 }), SH, [0, 0.05, 0.05], [0.25, 0, 0]);
    // falling snow
    const NF = 1800;
    const fpos = new Float32Array(NF * 3), F0 = [];
    for (let i = 0; i < NF; i++) F0.push([(rnd2() - 0.5) * 13, rnd2() * 11, (rnd2() - 0.5) * 11, rnd2() * 6.28, 0.7 + rnd2() * 0.7]);
    function rnd2() { rnd2.s = ((rnd2.s || 5) * 16807) % 2147483647; return rnd2.s / 2147483647; }
    const fg = new T3.BufferGeometry();
    fg.setAttribute('position', new T3.BufferAttribute(fpos, 3));
    const flakeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T3.CanvasTexture(c); })();
    const fm = new T3.PointsMaterial({ size: 0.11, map: flakeTex, transparent: true, depthWrite: false, opacity: 1, color: '#ffffff' });
    const flakes = new T3.Points(fg, fm);
    scene.add(flakes);

    // camera: orbit pose track (a = angle, r = radius, h = height, tx/ty/tz = target)
    const P = (a, r, h, tx, ty, tz) => () => ({ a, r, h, tx, ty, tz });
    const camT = track([
      [0, P(-0.8, 36, 21, 0, 1.2, 0)],
      [K.haus - 0.1, P(-0.5, 29, 13, 0, 1.6, 0), E.io],
      [K.wer + 0.25, P(-0.3, 15.5, 5.2, -1.8, 1.0, 1.6), E.io],
      [K.turn - 0.1, P(-0.26, 15.0, 5.0, -1.8, 1.0, 1.6), E.io],
      [K.turn + 0.55, P(0.0, 31, 15.5, 0, 5.6, -0.4), E.o5],
      [K.alarm, P(0.22, 30, 15, 0, 5.6, -0.4), E.lin],
      [K.vor + 0.4, P(0.32, 28, 14, 0, 5.3, -0.4), E.io],
      [K.geh - 0.1, P(0.36, 28, 14, 0, 5.3, -0.4)],
      [K.geh + 0.55, P(0.5, 19, 8.0, 0.2, 1.3, 1.6), E.io],
      [K.slip + 0.2, P(0.62, 18, 7.5, 0.5, 1.2, 1.7), E.lin],
      [END + 0.45, P(0.72, 32, 16, 0, 5.4, -0.3), E.io],
      [T, P(0.8, 33, 16.5, 0, 5.4, -0.3), E.lin],
    ]);
    const SKY = [[0, '#0a1126', '#1a2a52', '#2b3f73'], [1, '#2a1f4d', '#5b3f7a', '#b06f86'], [2, '#3c6ea8', '#86b3dc', '#f3c99a']];
    const cA = new T3.Color(), cB = new T3.Color(), cC = new T3.Color();
    const skyMix = (k) => {
      const i = Math.min(1, Math.floor(k)), u = k - i;
      return [1, 2, 3].map((j) => cA.set(SKY[i][j]).lerp(cB.set(SKY[i + 1][j]), u).getStyle());
    };
    const moonEl = sky.querySelector('.moon'), starEl = sky.querySelector('.stars');
    perFrame((t) => {
      const tt = tau(t), A = accum(tt);
      const ev = E.io(seg(t, RW0, 0.5)) * (1 - E.io(seg(t, FF0, 0.5)));
      const mo = E.io(seg(t, FF0 + 0.2, 0.8));
      const sk = ev > 0 ? ev : 2 * mo;
      const [c1, c2, c3] = sk <= 1 ? skyMix(Math.max(0, sk)) : skyMix(Math.min(1.999, 1 + (sk - 1)));
      sky.style.background = `linear-gradient(180deg, ${c1} 0%, ${c2} 55%, ${c3} 100%)`;
      starEl.style.opacity = String(1 - Math.max(ev, mo));
      moonEl.style.opacity = String(1 - mo);
      hemi.color.set('#6d82c4').lerp(cC.set('#bcd2ff'), mo);
      hemi.intensity = 0.9 + 0.3 * mo + 0.2 * ev;
      moon.intensity = 1.5 * (1 - mo);
      sun.intensity = 1.6 * mo;
      const lampOn = 1 - mo * 0.85;
      lampL.intensity = 22 * lampOn; lampGlow.material.opacity = 0.9 * lampOn; bulb.material.emissiveIntensity = 3 * lampOn; cone.material.opacity = 0.07 * lampOn;
      // windows: some lit; "for everyone" lights them all in sequence; morning dims
      wins.forEach((w, i) => {
        const seq = seg(t, K.alle - 0.35 + i * 0.07, 0.15);
        const pulse = Math.exp(-Math.pow((t - (K.alle - 0.2 + i * 0.07)) / 0.12, 2));
        let on = Math.max(w.on0, seq);
        if (ev > 0.5 && i === 4) on = 1;
        const k = on * (1 - 0.6 * mo);
        w.m.emissiveIntensity = 1.8 * k + 2.5 * pulse;
        w.m.color.set(k > 0.1 ? '#ffe2b0' : '#2a2f3d');
        w.g.material.opacity = (0.75 * k + 0.6 * pulse) * (1 - 0.6 * mo);
      });
      // snow cover
      const h = 0.2 * A;
      yard.scale.y = Math.max(0.001, h); yard.visible = h > 0.004;
      street.scale.y = Math.max(0.001, h * 0.45); street.visible = h > 0.008;
      roofSnow.forEach((m) => { const sg = m.userData.sg, th = 0.14 * A; m.scale.set(1, Math.max(0.001, th), 1); m.visible = th > 0.004; m.rotation.set(sg * 0.692, 0, 0); m.position.set(0, 4.7 + 0.85 + 0.769 * (th / 2 + 0.01), sg * (1.025 + 0.639 * (th / 2 + 0.01))); });
      treeCaps.forEach((c) => { c.scale.setScalar(Math.max(0.001, A)); c.visible = A > 0.02; });
      const cl = (t - CLR0) / (CLR1 - CLR0);
      walk.forEach((m, i) => {
        const c = t > FF1 ? clamp(cl * NSEG - i) : 0;
        m.scale.y = Math.max(0.001, h * (1 - c)); m.visible = h * (1 - c) > 0.004;
        const p = piles[i];
        const ps = Math.max(0.001, 0.75 * c * A);
        p.scale.set(ps * 0.9, ps * 0.55, ps * 0.7); p.visible = ps > 0.005;
      });
      // shovel: stuck in the snow, wiggles on the question, sweeps the sidewalk at the end
      const sweep = clamp(cl);
      if (t > FF1 && cl > -0.05) {
        SH.position.set(-5.3 + sweep * 10.6, 0.08 + 0.05 * Math.sin(t * 22), 2.0);
        SH.rotation.set(0, Math.PI / 2, -0.65);
      } else {
        const wig = Math.exp(-Math.pow((t - K.wer - 0.25) / 0.35, 2));
        SH.position.set(-2.4, 0.05 + 0.2 * A, 1.9);
        SH.rotation.set(-0.22, 0.4, 0.15 + Math.sin(t * 18) * 0.12 * wig);
      }
      SH.visible = !(t > RW0 + 0.3 && t < FF1);
      // flakes
      const fall = tt < 0 ? 0 : clamp(tt / 0.4) * (t > FF1 ? 1 - 0.6 * clamp((t - FF1) / 1.2) : 1);
      fm.opacity = fall;
      flakes.visible = fall > 0.01;
      for (let i = 0; i < NF; i++) {
        const f = F0[i];
        let y = (f[1] - 1.05 * f[4] * Math.max(0, tt)) % 11;
        if (y < 0) y += 11;
        fpos[i * 3] = f[0] + Math.sin(tt * 0.9 + f[3]) * 0.35;
        fpos[i * 3 + 1] = y;
        fpos[i * 3 + 2] = f[2] + Math.cos(tt * 0.7 + f[3]) * 0.25;
      }
      fg.attributes.position.needsUpdate = true;
      const c = camT(t);
      cam.position.set(c.tx + Math.sin(c.a) * c.r, c.h, c.tz + Math.cos(c.a) * c.r);
      cam.lookAt(c.tx, c.ty, c.tz);
      G.r.render(scene, cam);
    });

    // ---- HTML overlays ----
    const chip = el('div', 'w1chip', `<span class="tm">${S.t0}</span><span class="tp">${S.temp}</span>`);
    const tm = chip.querySelector('.tm');
    tl.fromTo(chip, { autoAlpha: 0, y: -30 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'back.out(2)' }, 0.15);
    perFrame((t) => { const v = t < RW0 + 0.25 ? S.t0 : t < FF0 + 0.25 ? S.t1 : S.t2; if (tm.textContent !== v) tm.textContent = v; });
    tl.fromTo(chip, { scale: 1 }, { scale: 1.12, duration: 0.12, yoyo: true, repeat: 1, immediateRender: false }, RW0 + 0.2);
    tl.fromTo(chip, { scale: 1 }, { scale: 1.12, duration: 0.12, yoyo: true, repeat: 1, immediateRender: false }, FF0 + 0.2);
    sfx('wind', 0, -14);
    sfx('shiver', 0.9, -14);
    // the question
    const q1 = el('div', 'w1q l', S.q[0]), q2 = el('div', 'w1q r', S.q[1]);
    const qm = el('div', 'w1qm', '?');
    tl.fromTo(q1, { autoAlpha: 0, scale: 0.4, rotation: -14 }, { autoAlpha: 1, scale: 1, rotation: -6, duration: 0.35, ease: 'back.out(2.6)', immediateRender: false }, K.wer - 0.05);
    tl.fromTo(q2, { autoAlpha: 0, scale: 0.4, rotation: 14 }, { autoAlpha: 1, scale: 1, rotation: 6, duration: 0.35, ease: 'back.out(2.6)', immediateRender: false }, K.wer + 0.15);
    tl.fromTo(qm, { autoAlpha: 0, scale: 0.3, xPercent: -50 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(3)', immediateRender: false }, K.frage - 0.05);
    tl.set([q1, q2], { autoAlpha: 0 }, 0);
    tl.set(qm, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.to([q1, q2, qm], { autoAlpha: 0, scale: 0.7, duration: 0.2, ease: 'power2.in' }, K.turn - 0.2);
    perFrame((t) => {
      if (t < K.frage - 0.1 || t > K.turn) return;
      const v = new T3.Vector3(-2.4, 2.3, 1.9).applyMatrix4(D.matrixWorld).project(cam);
      qm.style.left = ((v.x + 1) / 2 * 1080).toFixed(1) + 'px';
      qm.style.top = ((1 - v.y) / 2 * 1920 - 250 + Math.sin(t * 6) * 10).toFixed(1) + 'px';
    });
    sfx('pop', K.frage, -11);
    sfx('pop', K.wer, -10);
    sfx('pop', K.wer + 0.2, -10);
    sfx('sting', K.wer - 0.1, -12);
    // plan card
    const plan = el('div', 'w1plan', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><b>❄️ ${S.planH}</b></div>` + S.rows.map((r) => `<div class="rw${r[2] ? ' on' : ''}"><span class="wk">${r[0]}</span><b>${r[1]}</b>${r[2] ? `<span class="nw">${S.now}</span>` : ''}</div>`).join('') + `<div class="seen">${S.seen}</div>`);
    tl.fromTo(plan, { autoAlpha: 0, y: -120, rotationX: -30 }, { autoAlpha: 1, y: 0, rotationX: 0, duration: 0.55, ease: 'power4.out', immediateRender: false }, K.turn + 0.1);
    tl.set(plan, { autoAlpha: 0 }, 0);
    plan.querySelectorAll('.rw').forEach((r, i) => { tl.fromTo(r, { autoAlpha: 0, x: -40 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power3.out', immediateRender: false }, K.plan + i * 0.1); tl.set(r, { autoAlpha: 0 }, 0); });
    const seen = plan.querySelector('.seen');
    tl.fromTo(seen, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, K.alle - 0.1);
    tl.set(seen, { autoAlpha: 0 }, 0);
    tl.to(plan, { autoAlpha: 0, y: -60, duration: 0.25, ease: 'power2.in' }, RW0);
    sfx('whoosh', K.turn - 0.05, -9);
    sfx('chime', K.alle, -13);
    // rewind + notification
    const rw = el('div', 'w1rw', '◀◀');
    tl.fromTo(rw, { autoAlpha: 0, scale: 0.6, xPercent: -50, yPercent: -50 }, { autoAlpha: 0.9, scale: 1.2, duration: 0.25, immediateRender: false }, RW0);
    tl.to(rw, { autoAlpha: 0, scale: 1.5, duration: 0.25 }, RW0 + 0.3);
    tl.set(rw, { autoAlpha: 0, xPercent: -50, yPercent: -50 }, 0);
    sfx('vortex', RW0 - 0.05, -14);
    const nt = el('div', 'w1note', `<span class="ai"><img src="assets/logo.png"></span><div class="tx"><b>${S.nH}<em>${S.nT}</em></b><span>${S.n}</span></div>`);
    tl.fromTo(nt, { autoAlpha: 0, y: -200, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.6)', immediateRender: false }, K.rem - 0.2);
    tl.set(nt, { autoAlpha: 0 }, 0);
    tl.to(nt, { autoAlpha: 0, y: -80, duration: 0.25, ease: 'power2.in' }, FF0 + 0.1);
    sfx('chime', K.rem - 0.15, -9);
    sfx('vortex', FF0 - 0.05, -15);
    // sidewalk clear
    const fr = el('div', 'w1free', S.free);
    tl.fromTo(fr, { autoAlpha: 0, scale: 0.5, xPercent: -50 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2.6)', immediateRender: false }, CLR1 - 0.1);
    tl.set(fr, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.to(fr, { autoAlpha: 0, y: -40, duration: 0.25 }, END + 0.15);
    sfx('receipts', CLR0, -12);
    sfx('receipts', CLR0 + 0.5, -13);
    sfx('pop', CLR1 - 0.05, -10);
    const roles = el('div', 'w1roles', `<span><i>✓</i>${S.r1}</span><span><i>✓</i>${S.r2}</span>`);
    tl.fromTo(roles.children, { autoAlpha: 0, y: 30, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2.2)', stagger: 0.1, immediateRender: false }, END + 0.3);
    tl.set(roles.children, { autoAlpha: 0 }, 0);
    const lk = el('div', 'w1lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.fromTo(lk, { autoAlpha: 0, xPercent: -50, scale: 0.5, y: 40 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.9)', immediateRender: false }, END + 0.2);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    sfx('impact', END + 0.23, -9);
    sfx('chime', END + 0.35, -14);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X1: heating traps — thermal-camera countdown (3D, custom heat shader) =================
  function X1() {
    const de = lang === 'de';
    const S = de ? {
      head: 'Heizkosten-Fallen', sub: 'für Mieter & Vermieter', ir: 'IR · WÄRMEBILD', ben: [['🪟', 'Wärme fliegt raus'], ['🛋️', 'Wärme bleibt hängen'], ['📈', 'Verbrauch unbemerkt']],
      card: 'Verbrauch', unit: 'kWh', months: ['Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt'], alert: '⚠️ Oktober +18 %', adj: 'Abschlag', from: '165 €', to: '185 €', ok: 'angepasst ✓',
      r1: 'Mieter', r2: 'Vermieter', tag: 'für Mieter & Vermieter', temp: (c) => c.toFixed(1).replace('.', ',') + ' °C',
    } : {
      head: 'Heating traps', sub: 'for tenants & landlords', ir: 'IR · THERMAL VIEW', ben: [['🪟', 'Heat escapes'], ['🛋️', 'Heat gets trapped'], ['📈', 'Usage goes unnoticed']],
      card: 'Usage', unit: 'kWh', months: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'], alert: '⚠️ October +18%', adj: 'Payment', from: '$165', to: '$185', ok: 'adjusted ✓',
      r1: 'Tenant', r2: 'Landlord', tag: 'for tenants & landlords', temp: (c) => (c * 9 / 5 + 32).toFixed(1) + ' °F',
    };
    const K = {};
    const i3 = W(['Drei', 'Three'], 0); K.n3 = i3.start;
    const i2 = W(['Zwei', 'Two'], i3.i); K.n2 = i2.start;
    const i1 = W(['Eins', 'One'], i2.i); K.n1 = i1.start;
    K.turn = W(['Mit', 'With'], i1.i).start;
    K.month = W(['Monat', 'month']).start;
    K.adj = W(['Abschlag', 'payment']).start;
    K.sub = W(['Mieter', 'tenants']).start;
    const T = END + 2.1;
    const NT = [K.n3, K.n2, K.n1];
    const ACT = [W(['Kipp', 'tilt']).start, W(['Sofa', 'sofa']).start, W(['fünf', 'max']).start];

    // ---- background + HUD ----
    el('div', 'x1bg', '<i class="v"></i>');
    const G = gl3(stage, { fov: 30, envTop: '#ffffff', envBot: '#333333', envInt: 0.4 });
    const { scene, cam } = G;
    cam.position.set(0, 1.6, 10.5);
    const LOOK = new T3.Vector3(0, -0.25, 0);
    // thermal shader: temperature = base + sum of gaussian heat sources (world space) -> ironbow palette, lambert-ish shading
    const TH = [];
    function thermal(base = 0.16) {
      const m = new T3.ShaderMaterial({
        uniforms: { uS: { value: [0, 1, 2, 3].map(() => new T3.Vector4(0, -99, 0, 0)) }, uR: { value: [1, 1, 1, 1] }, uBase: { value: base }, uT: { value: 0 }, uL: { value: new T3.Vector3(-0.45, 0.75, 0.5).normalize() } },
        vertexShader: 'varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: `uniform vec4 uS[4]; uniform float uR[4]; uniform float uBase; uniform float uT; uniform vec3 uL; varying vec3 vW; varying vec3 vN;
          vec3 pal(float t){ t = clamp(t, 0.0, 1.0);
            vec3 c0 = vec3(0.05,0.02,0.14), c1 = vec3(0.24,0.05,0.45), c2 = vec3(0.66,0.08,0.50), c3 = vec3(0.95,0.27,0.16), c4 = vec3(1.0,0.70,0.12), c5 = vec3(1.0,0.97,0.78);
            if (t < 0.2) return mix(c0, c1, t / 0.2); if (t < 0.4) return mix(c1, c2, (t - 0.2) / 0.2); if (t < 0.6) return mix(c2, c3, (t - 0.4) / 0.2); if (t < 0.8) return mix(c3, c4, (t - 0.6) / 0.2); return mix(c4, c5, (t - 0.8) / 0.2); }
          void main(){ float T = uBase; for (int i = 0; i < 4; i++) { vec3 d = vW - uS[i].xyz; T += uS[i].w * exp(-dot(d, d) / (uR[i] * uR[i])); }
            T += 0.02 * sin(vW.x * 9.0 + uT * 2.6) * sin(vW.y * 7.0 - uT * 1.9);
            vec3 n = normalize(vN); float l = 0.62 + 0.38 * max(dot(n, uL), 0.0); float rim = pow(1.0 - abs(n.z), 2.0) * 0.12;
            gl_FragColor = vec4(pal(T) * l + rim, 1.0); }`,
      });
      TH.push(m);
      return m;
    }
    const setSrc = (m, g, list) => list.forEach((s, i) => { const v = g.localToWorld(new T3.Vector3(...s.p)); m.uniforms.uS.value[i].set(v.x, v.y, v.z, s.a); m.uniforms.uR.value[i] = s.r; });
    const tm = (geo, mat, parent, pos, rot, sc) => { const m = new T3.Mesh(geo, mat); if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); if (sc) (typeof sc === 'number' ? m.scale.setScalar(sc) : m.scale.set(...sc)); parent.add(m); return m; };
    // heat particles (additive sprites)
    const pTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,200,90,1)'); g.addColorStop(0.4, 'rgba(255,90,30,0.55)'); g.addColorStop(1, 'rgba(160,20,90,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T3.CanvasTexture(c); })();
    function plume(parent, n, origin, dir, spread) {
      const sp = [...Array(n)].map((_, i) => { const s = new T3.Sprite(new T3.SpriteMaterial({ map: pTex, blending: T3.AdditiveBlending, transparent: true, depthWrite: false })); parent.add(s); return { s, ph: (i * 0.61803) % 1, ox: ((i * 37) % 11) / 11 - 0.5, oz: ((i * 53) % 13) / 13 - 0.5 }; });
      return (t, on) => sp.forEach((P) => {
        const k = (t * 0.55 + P.ph) % 1;
        P.s.position.set(origin[0] + dir[0] * k * 2.2 + P.ox * spread * (0.3 + k), origin[1] + dir[1] * k * 2.2 + Math.sin(t * 2 + P.ph * 6) * 0.08, origin[2] + dir[2] * k * 2.2 + P.oz * spread * (0.3 + k));
        P.s.scale.setScalar(0.25 + k * 0.9);
        P.s.material.opacity = on * Math.sin(Math.PI * k) * 0.75;
        P.s.visible = on > 0.01;
      });
    }
    // hook: house with leaking heat
    function mkHouse() {
      const g = new T3.Group(), m = thermal(0.2);
      tm(new T3.BoxGeometry(2.6, 2.0, 2.0), m, g, [0, 0, 0]);
      const rs = new T3.Shape(); rs.moveTo(-1.15, 0); rs.lineTo(1.15, 0); rs.lineTo(0, 0.95); rs.lineTo(-1.15, 0);
      const rg = new T3.ExtrudeGeometry(rs, { depth: 2.9, bevelEnabled: false }); rg.translate(0, 0, -1.45);
      tm(rg, m, g, [0, 1.0, 0], [0, Math.PI / 2, 0]);
      const wm = thermal(0.55);
      [[-0.7, 0.35], [0.7, 0.35], [-0.7, -0.45], [0.7, -0.45]].forEach(([x, y]) => tm(new T3.BoxGeometry(0.5, 0.55, 0.06), wm, g, [x, y, 1.02]));
      tm(new T3.BoxGeometry(0.5, 0.95, 0.06), thermal(0.42), g, [0, -0.52, 1.02]);
      const src = [{ p: [-0.7, 0.35, 1.2], a: 0.55, r: 0.65 }, { p: [0.7, 0.35, 1.2], a: 0.55, r: 0.65 }, { p: [0, 1.6, 0], a: 0.4, r: 0.9 }, { p: [0, -0.5, 1.2], a: 0.35, r: 0.6 }];
      const pl = plume(g, 14, [0, 1.75, 0], [0, 1, 0], 1.2);
      return { g, anim(lt, act, t) { TH.forEach(() => 0); [m, wm].forEach((mm) => setSrc(mm, g, src)); pl(t, 1); } };
    }
    // 3: window on tilt
    function mkWin() {
      const g = new T3.Group(), a = new T3.Group(); g.add(a);
      const wall = thermal(0.14), frame = thermal(0.2), glass = thermal(0.3);
      tm(new T3.BoxGeometry(2.3, 2.7, 0.22), wall, a, [0, 0, -0.2]);
      const fs = rrShape(1.7, 2.2, 0.06); const hole = new T3.Path(); hole.moveTo(-0.7, -0.95); hole.lineTo(0.7, -0.95); hole.lineTo(0.7, 0.95); hole.lineTo(-0.7, 0.95); hole.lineTo(-0.7, -0.95); fs.holes.push(hole);
      const fg = new T3.ExtrudeGeometry(fs, { depth: 0.16, bevelEnabled: false }); fg.translate(0, 0, -0.08);
      tm(fg, frame, a, [0, 0, 0]);
      const sash = new T3.Group(); sash.position.set(0, -0.95, 0.05); a.add(sash);
      const sg = rrShape(1.42, 1.92, 0.04); const sh = new T3.Path(); sh.moveTo(-0.6, 0.06); sh.lineTo(0.6, 0.06); sh.lineTo(0.6, 1.86); sh.lineTo(-0.6, 1.86); sh.lineTo(-0.6, 0.06); sg.holes.push(sh);
      const sgeo = new T3.ExtrudeGeometry(sg, { depth: 0.08, bevelEnabled: false }); sgeo.translate(0, 0.96, -0.04);
      tm(sgeo, frame, sash, [0, 0, 0]);
      tm(new T3.BoxGeometry(1.2, 1.8, 0.02), glass, sash, [0, 0.96, 0]);
      tm(new T3.BoxGeometry(0.05, 0.25, 0.06), frame, sash, [0.62, 0.9, 0.07]);
      const pl = plume(a, 22, [0, 1.0, 0.45], [0.05, 0.55, 1.0], 1.3);
      return { g, anim(lt, act) {
        const tilt = E.io(seg(lt, act - 0.5, 0.7));
        sash.rotation.x = tilt * 0.22;
        const leak = seg(lt, act - 0.2, 0.6);
        const src = [{ p: [0, 0.95, 0.35], a: 0.2 + 0.85 * leak, r: 0.75 }, { p: [0, 1.35, 0.3], a: 0.6 * leak, r: 0.6 }, { p: [0, -0.6, -0.1], a: 0.2 - 0.12 * leak, r: 1.2 }];
        [wall, frame, glass].forEach((mm) => setSrc(mm, a, src));
        pl(lt, leak);
      } };
    }
    // 2: radiator hidden behind a sofa
    function mkSofa() {
      const g = new T3.Group(), a = new T3.Group(); g.add(a);
      const rad = thermal(0.2), sofa = thermal(0.12), floor = thermal(0.1);
      for (let i = 0; i < 7; i++) tm(new T3.CapsuleGeometry(0.11, 0.9, 6, 16), rad, a, [-0.75 + i * 0.25, 0.25, -0.75]);
      tm(new T3.CylinderGeometry(0.08, 0.08, 1.8, 16), rad, a, [0, 0.75, -0.75], [0, 0, Math.PI / 2]);
      tm(new T3.CylinderGeometry(0.08, 0.08, 1.8, 16), rad, a, [0, -0.25, -0.75], [0, 0, Math.PI / 2]);
      const sf = new T3.Group(); a.add(sf);
      tm(rbox(2.6, 0.5, 1.0, 0.12), sofa, sf, [0, -0.15, 0.05]);
      tm(rbox(2.6, 1.0, 0.32, 0.12), sofa, sf, [0, 0.45, -0.32]);
      tm(rbox(0.32, 0.75, 1.0, 0.12), sofa, sf, [-1.3, 0.12, 0.05]);
      tm(rbox(0.32, 0.75, 1.0, 0.12), sofa, sf, [1.3, 0.12, 0.05]);
      [-0.62, 0.62].forEach((x) => tm(rbox(1.15, 0.22, 0.85, 0.1), sofa, sf, [x, 0.2, 0.12]));
      tm(new T3.BoxGeometry(4, 0.05, 3), floor, a, [0, -0.45, -0.2]);
      return { g, anim(lt, act) {
        sf.position.z = 0.9 * (1 - E.o5(seg(lt, act - 0.45, 0.5)));
        const on = seg(lt, act - 0.2, 0.8);
        const src = [{ p: [0, 0.25, -0.75], a: 0.72, r: 0.9 }, { p: [0, 0.5, -0.45], a: 0.35 * on, r: 0.6 }, { p: [0, -0.2, 1.2], a: -0.05 * on, r: 1.5 }];
        [rad, sofa, floor].forEach((mm) => setSrc(mm, a, src));
      } };
    }
    // 1: thermostat dial cranked to 5
    function mkThermo() {
      const g = new T3.Group(), a = new T3.Group(); g.add(a);
      const body = thermal(0.2), knob = thermal(0.25);
      tm(new T3.CylinderGeometry(0.42, 0.42, 1.4, 32), body, a, [0, -0.2, 0], [0, 0, Math.PI / 2]);
      const dial = new T3.Group(); dial.position.set(0, 0.0, 0.05); a.add(dial);
      tm(new T3.CylinderGeometry(0.85, 0.9, 0.9, 40), knob, dial, [0, 0, 0], [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 18; i++) { const an = (i / 18) * Math.PI * 2; tm(new T3.BoxGeometry(0.07, 0.07, 0.88), knob, dial, [Math.cos(an) * 0.89, Math.sin(an) * 0.89, 0], [0, 0, an]); }
      tm(new T3.BoxGeometry(0.1, 0.42, 0.04), thermal(0.85), dial, [0, 0.55, 0.47]);
      // scale marks 1..5 around the dial (fixed ring)
      const ring = thermal(0.3);
      tm(new T3.CylinderGeometry(1.42, 1.42, 0.12, 48), thermal(0.12), a, [0, 0, -0.45], [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 5; i++) { const an = Math.PI / 2 + 1.1 - i * 0.55; tm(new T3.CylinderGeometry(0.07 + i * 0.012, 0.07 + i * 0.012, 0.06, 16), ring, a, [Math.cos(an) * 1.18, Math.sin(an) * 1.18, -0.36], [Math.PI / 2, 0, 0]); }
      const pl = plume(a, 16, [0, 0.2, 0.6], [0, 0.9, 0.5], 1.6);
      return { g, anim(lt, act) {
        const turn = E.io(seg(lt, act - 0.35, 0.8));
        dial.rotation.z = 1.1 - turn * 2.2 + Math.sin(lt * 30) * 0.01 * turn;
        const hot = seg(lt, act, 1.2);
        const src = [{ p: [0, 0, 0.4], a: 0.25 + 0.6 * hot, r: 1.0 }, { p: [0, -0.2, -0.6], a: 0.3 + 0.3 * hot, r: 1.2 }];
        [body, knob, ring].forEach((mm) => setSrc(mm, a, src));
        pl(lt, hot);
      } };
    }
    const house = mkHouse();
    const OBJ = [mkWin(), mkSofa(), mkThermo()];
    scene.add(house.g); OBJ.forEach((o) => scene.add(o.g));
    // numerals
    const clip = [new T3.Plane(new T3.Vector3(0, -1, 0), 2.2), new T3.Plane(new T3.Vector3(0, 1, 0), 2.2)];
    const NUM = [3, 2, 1].map((n) => {
      const m = textPlane((x, w, h) => {
        x.clearRect(0, 0, w, h);
        x.font = '700 1150px Clash'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
        const gr = x.createLinearGradient(0, 120, 0, h - 120);
        gr.addColorStop(0, '#fff3c4'); gr.addColorStop(0.35, '#ffb31f'); gr.addColorStop(0.7, '#f0402a'); gr.addColorStop(1, '#7a1060');
        x.fillStyle = gr; x.fillText(String(n), w / 2, h - 150);
      }, 900, 1150, 3.0, 3.85, { clip });
      m.renderOrder = -1; scene.add(m);
      return m;
    });
    const SOLO_RY = [0.5, -0.45, 0.35];
    const solo = (k) => (t) => ({ x: 0, y: -0.45, z: 0.4, s: [0.78, 0.74, 0.72][k], ry: SOLO_RY[k] + (t - NT[k]) * 0.12, rx: 0.08 });
    const offL = (k) => () => ({ x: -4.8, y: 0.3, z: 0, s: 0.7, ry: SOLO_RY[k] - 1.4, rx: 0.2 });
    const offR = (k) => () => ({ x: 4.8, y: -0.2, z: 0, s: 0.7, ry: SOLO_RY[k] + 1.6, rx: -0.1 });
    const TR = OBJ.map((o, k) => {
      const kf = [[NT[k] - 0.22, offR(k)], [NT[k] + 0.32, solo(k), E.o5]];
      if (k < 2) kf.push([NT[k + 1] - 0.2, solo(k)], [NT[k + 1] + 0.14, offL(k), E.ic]);
      else kf.push([K.turn - 0.2, solo(k)], [K.turn + 0.2, () => ({ x: 0, y: -0.6, z: 0.4, s: 0, ry: 0, rx: 0 }), E.ic]);
      return track(kf);
    });
    const HT = track([[0, () => ({ x: 0, y: -0.2, z: 0, s: 0.45, ry: -0.6, rx: 0.12 })], [0.6, () => ({ x: 0, y: -0.15, z: 0, s: 0.74, ry: -0.5, rx: 0.12 }), E.o5], [NT[0] - 0.25, (t) => ({ x: 0, y: -0.15, z: 0, s: 0.74, ry: -0.5 + t * 0.12, rx: 0.12 })], [NT[0] + 0.15, () => ({ x: -4.6, y: 0.3, z: 0, s: 0.6, ry: -1.6, rx: 0.2 }), E.ic]]);
    const NUMT = NUM.map((m, k) => {
      const hide = () => ({ x: 0, y: -4.5, z: -1.6, s: 1 }), show = () => ({ x: 0, y: 0.35, z: -1.6, s: 1 }), up = () => ({ x: 0, y: 4.5, z: -1.6, s: 1 });
      const kf = [[NT[k] - 0.2, hide], [NT[k] + 0.25, show, E.o5]];
      kf.push([(k < 2 ? NT[k + 1] : K.turn) - 0.2, show], [(k < 2 ? NT[k + 1] : K.turn) + 0.2, up, E.ic]);
      return track(kf);
    });
    perFrame((t) => {
      TH.forEach((m) => { m.uniforms.uT.value = t; });
      apply(house.g, HT(t)); house.anim(t, 0, t);
      OBJ.forEach((o, k) => { apply(o.g, TR[k](t)); o.anim(t - NT[k], ACT[k] - NT[k]); });
      NUM.forEach((m, k) => { const p = NUMT[k](t); m.position.set(p.x, p.y, p.z); m.visible = t > NT[k] - 0.25 && Math.abs(p.y) < 4.4; });
      const punch = NT.reduce((acc, nt) => acc + 0.35 * Math.exp(-Math.pow((t - nt - 0.05) / 0.12, 2)), 0);
      cam.position.set(Math.sin(t * 0.3) * 0.3, 1.6 + Math.sin(t * 0.25) * 0.08, 10.5 - punch);
      cam.lookAt(LOOK);
      G.r.render(scene, cam);
    });

    // ---- HUD ----
    const hud = el('div', 'x1hud', `<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i><span class="ir">● ${S.ir}</span><span class="tmp"></span><div class="scale"><b>40°</b><i></i><b>0°</b></div><i class="ch"></i>`);
    const tmpEl = hud.querySelector('.tmp');
    perFrame((t) => {
      const lvl = t < NT[0] ? 24.6 : t < NT[1] ? 31.8 : t < NT[2] ? 38.4 : t < K.turn ? 41.2 : 21.5;
      const v = S.temp(lvl + Math.sin(t * 7) * 0.15);
      if (tmpEl.textContent !== 'max ' + v) tmpEl.textContent = 'max ' + v;
    });
    tl.fromTo(hud, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.05);
    tl.to(hud, { autoAlpha: 0, duration: 0.25 }, K.turn - 0.1);
    const hk = el('div', 'x1hk', `<div class="h"><span>3</span> ${S.head}</div><div class="s">${S.sub}</div>`);
    tl.fromTo(hk.querySelector('.h'), { autoAlpha: 0, y: 60, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(2)' }, 0.15);
    tl.fromTo(hk.querySelector('.s'), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power3.out' }, K.sub - 0.1);
    tl.to(hk, { autoAlpha: 0, y: 70, duration: 0.25, ease: 'power2.in' }, NT[0] - 0.25);
    sfx('impact', 0.05, -8);
    sfx('heater', 0.3, -14);
    const bens = S.ben.map((b) => el('div', 'x1ben', `<span>${b[0]}</span>${b[1]}`));
    NT.forEach((nt, k) => {
      const nx = k < 2 ? NT[k + 1] : K.turn;
      tl.set(bens[k], { autoAlpha: 0, xPercent: -50 }, 0);
      tl.fromTo(bens[k], { autoAlpha: 0, y: 40, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2.2)', immediateRender: false }, ACT[k] + 0.35);
      tl.to(bens[k], { autoAlpha: 0, y: -30, duration: 0.18, ease: 'power2.in' }, nx - 0.22);
      sfx('whoosh', nt - 0.2, -11);
      sfx('thud', nt + 0.02, -10);
      sfx('pop', ACT[k] + 0.32, -14);
    });
    sfx('wind', ACT[0] - 0.1, -16);
    sfx('heater', ACT[2] + 0.1, -12);
    // finale: usage card with adjustment
    const vals = [38, 34, 30, 33, 48, 64];
    const card = el('div', 'x1card', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><h4>${S.card}</h4><span class="u">${S.unit}</span></div><div class="bars">${vals.map((v, i) => `<div class="b${i === 5 ? ' hot' : ''}"><i style="height:${v * 4.2}px"></i><span>${S.months[i]}</span></div>`).join('')}</div><div class="al">${S.alert}</div><div class="adj"><span>${S.adj}</span><b class="f">${S.from}</b><b class="ar">→</b><b class="t">${S.to}</b><em>${S.ok}</em></div><div class="ft"><span><i>✓</i>${S.r1}</span><span><i>✓</i>${S.r2}</span></div>`);
    tl.set(card, { autoAlpha: 0 }, 0);
    tl.fromTo(card, { autoAlpha: 0, y: 240, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.2, -9);
    const bars = card.querySelectorAll('.bars i');
    tl.fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: 0.45, ease: 'power3.out', stagger: 0.06, immediateRender: false }, K.turn + 0.2);
    tl.set(bars, { scaleY: 0 }, 0);
    const al = card.querySelector('.al');
    tl.fromTo(al, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, K.month - 0.05);
    tl.set(al, { autoAlpha: 0 }, 0);
    sfx('pop', K.month, -11);
    const adj = card.querySelector('.adj');
    tl.fromTo(adj, { autoAlpha: 0, x: -40 }, { autoAlpha: 1, x: 0, duration: 0.35, ease: 'power3.out', immediateRender: false }, K.adj - 0.1);
    tl.set(adj, { autoAlpha: 0 }, 0);
    const okc = adj.querySelector('em');
    tl.fromTo(okc, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, K.adj + 0.55);
    tl.set(okc, { autoAlpha: 0 }, 0);
    sfx('chime', K.adj + 0.55, -12);
    const fts = card.querySelectorAll('.ft span');
    tl.fromTo(fts, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', stagger: 0.1, immediateRender: false }, END - 0.4);
    tl.set(fts, { autoAlpha: 0 }, 0);
    const lk = el('div', 'x1lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t < NT[0] - 0.1 || t > END + 0.3);
    return { T, K };
  }

  // ================= X2: burst pipe — night alarm kinetic (clock, cracking pipe, rising water, urgent ticket) =================
  function X2() {
    const de = lang === 'de';
    const S = de ? {
      temp: '−10 °C', burst: 'PLATZT', water: 'WASSER<br>ÜBERALL', sleep: 'Vermieter', zz: 'schläft', tk: 'Rohrbruch · Keller', tkM: 'Haus Nord · gemeldet 03:02', urg: 'DRINGEND', photo: '📷 Foto',
      push: 'Tenance · Dringend', pushT: 'Rohrbruch im Keller – Foto ansehen', seen: 'Gesehen ✓ 03:04', slot: 'Installateur', ok: 'bestätigt ✓', fix: 'Kleiner Schaden', fix2: 'statt großer Sanierung', stamp: '✓ DICHT',
      r1: 'Mieterin', r2: 'Vermieter', tag: 'für Mieter & Vermieter',
    } : {
      temp: '14 °F', burst: 'BURST', water: 'WATER<br>EVERYWHERE', sleep: 'Landlord', zz: 'asleep', tk: 'Burst pipe · Basement', tkM: 'North House · reported 3:02 am', urg: 'URGENT', photo: '📷 Photo',
      push: 'Tenance · Urgent', pushT: 'Burst pipe in the basement – view photo', seen: 'Seen ✓ 3:04 am', slot: 'Plumber', ok: 'confirmed ✓', fix: 'A small fix', fix2: 'instead of a big renovation', stamp: '✓ SEALED',
      r1: 'Tenant', r2: 'Landlord', tag: 'for tenants & landlords',
    };
    const K = {};
    K.burst = W(['platzt', 'bursts']).start;
    K.water = W(['Wasser', 'Water']).start;
    K.sleep = W(['schläft', 'asleep']).start;
    K.turn = W(['Mit', 'With']).start;
    K.urg = W(['dringend', 'urgent']).start;
    K.photo = W(['Foto', 'photo']).start;
    K.sees = W(['sieht', 'sees']).start;
    K.eight = W(['acht', 'eight']).start;
    K.small = W(['Kleiner', 'small']).start;
    const T = END + 2.0;
    let sd = 21;
    const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    const bg = el('div', 'x2bg', '<i class="g"></i>');
    // ---- seven-segment clock ----
    const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
    const digit = (d) => `<span class="dg">${'abcdefg'.split('').map((sg) => `<i class="x2s${sg}${SEG[d].includes(sg) ? ' on' : ''}"></i>`).join('')}</span>`;
    const clock = el('div', 'x2clock');
    const setClock = (h, m) => { clock.innerHTML = digit(Math.floor(h / 10)) + digit(h % 10) + '<span class="cl"><i></i><i></i></span>' + digit(Math.floor(m / 10)) + digit(m % 10); };
    setClock(3, 0);
    let lastClk = '';
    perFrame((t) => {
      let h = 3, m = 0;
      if (t > K.eight - 0.4) { const u = clamp((t - (K.eight - 0.4)) / 0.6); const mins = Math.round(180 + u * 300); h = Math.floor(mins / 60); m = mins % 60; if (u >= 1) { h = 8; m = 0; } }
      else if (t > K.turn) { m = Math.min(4, Math.floor((t - K.turn) * 1.5) + 2); }
      const k = h + ':' + m;
      if (k !== lastClk) { lastClk = k; setClock(h, m); }
    });
    const tmp = el('div', 'x2temp', `❄ ${S.temp}`);
    tl.fromTo(clock, { autoAlpha: 0, scale: 1.4 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power3.out' }, 0.05);
    tl.fromTo(tmp, { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.35);
    tl.to(clock, { scale: 0.42, y: -540, duration: 0.45, ease: 'power3.inOut' }, K.burst - 0.6);
    tl.to(tmp, { autoAlpha: 0, duration: 0.2 }, K.burst - 0.6);
    sfx('buzz', 0.1, -12);
    sfx('buzz', 0.75, -14);
    // ---- pipe + crack + spray + water (canvas) ----
    const pipe = el('div', 'x2pipe', `<svg viewBox="0 0 1080 300"><defs><linearGradient id="cu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc7a0"/><stop offset=".35" stop-color="#e07b45"/><stop offset=".7" stop-color="#9c4a24"/><stop offset="1" stop-color="#5e2a14"/></linearGradient></defs><rect x="-20" y="100" width="1120" height="100" fill="url(#cu)"/><rect x="250" y="88" width="60" height="124" rx="10" fill="#b8693c"/><rect x="770" y="88" width="60" height="124" rx="10" fill="#b8693c"/><path class="ck" d="M540 100 L525 130 L552 148 L530 172 L548 200" fill="none" stroke="#0a0f1e" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
    const ck = pipe.querySelector('.ck');
    tl.set(ck, { strokeDasharray: 140, strokeDashoffset: 140 }, 0);
    tl.fromTo(pipe, { autoAlpha: 0, scaleX: 1.6 }, { autoAlpha: 1, scaleX: 1, duration: 0.4, ease: 'power3.out', immediateRender: false }, K.burst - 0.65);
    tl.set(pipe, { autoAlpha: 0 }, 0);
    tl.to(ck, { strokeDashoffset: 0, duration: 0.18, ease: 'power2.in' }, K.burst - 0.05);
    tl.fromTo(pipe, { x: 0 }, { x: 12, duration: 0.04, repeat: 7, yoyo: true, ease: 'none', immediateRender: false }, K.burst + 0.1);
    const bw = el('div', 'x2big', S.burst);
    tl.set(bw, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(bw, { autoAlpha: 0, scale: 2.6, rotation: -8 }, { autoAlpha: 1, scale: 1, rotation: -4, duration: 0.2, ease: 'power4.in', immediateRender: false }, K.burst - 0.05);
    tl.to(bw, { autoAlpha: 0, duration: 0.2 }, K.water - 0.2);
    sfx('impact', K.burst + 0.12, -6);
    sfx('drip', K.burst + 0.3, -8);
    const wc = el('canvas', 'x2water', null, stage);
    wc.width = 540; wc.height = 960;
    const wx = wc.getContext('2d');
    const DROPS = [...Array(160)].map(() => ({ a: -Math.PI / 2 + (rnd() - 0.5) * 2.4, v: 260 + rnd() * 520, r: 2 + rnd() * 6, d: rnd() * 0.5 }));
    const WL0 = K.burst + 0.2;
    perFrame((t) => {
      wx.clearRect(0, 0, 540, 960);
      if (t < K.burst || t > K.turn + 0.5) return;
      // spray from the crack (pipe center ~ (270, 400) in half-res canvas)
      const k0 = t - K.burst;
      for (const D of DROPS) {
        const k = ((k0 * 1.6 + D.d) % 1);
        if (k0 * 1.6 < D.d) continue;
        const x = 270 + Math.cos(D.a) * D.v * k * 0.55, y = 400 + Math.sin(D.a) * D.v * k * 0.55 + 520 * k * k;
        wx.fillStyle = `rgba(150,225,255,${0.85 * (1 - k)})`;
        wx.beginPath(); wx.arc(x, y, D.r * (1 - 0.4 * k), 0, 7); wx.fill();
      }
      // rising water with waves
      const lvl = 960 - 520 * E.oc(seg(t, WL0, 2.6)) * (1 - E.io(seg(t, K.turn - 0.1, 0.6)));
      for (let L = 0; L < 2; L++) {
        wx.fillStyle = L ? 'rgba(40,150,230,0.75)' : 'rgba(80,200,255,0.45)';
        wx.beginPath(); wx.moveTo(0, 960);
        for (let x = 0; x <= 540; x += 12) wx.lineTo(x, lvl + L * 14 + Math.sin(x * 0.03 + t * (3 + L) + L) * 10 + Math.sin(x * 0.011 - t * 2) * 8);
        wx.lineTo(540, 960); wx.closePath(); wx.fill();
      }
    });
    tl.to(pipe, { autoAlpha: 0, y: -60, duration: 0.3 }, K.turn - 0.2);
    const ww = el('div', 'x2big2', S.water, stage, { fontSize: de ? '150px' : '118px' });
    tl.set(ww, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(ww, { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, K.water - 0.1);
    tl.to(ww, { autoAlpha: 0, duration: 0.2 }, K.sleep - 0.35);
    sfx('drip', K.water, -10);
    // sleeping landlord: phone face-down with Zzz
    const sl = el('div', 'x2sleep', `<div class="ph"><i class="moon">🌙</i><b>${S.sleep}</b><span>${S.zz}</span></div><em class="z1">Z</em><em class="z2">z</em><em class="z3">z</em>`);
    tl.set(sl, { autoAlpha: 0 }, 0);
    tl.fromTo(sl, { autoAlpha: 0, scale: 0.7, rotation: -8 }, { autoAlpha: 1, scale: 1, rotation: -3, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, K.sleep - 0.35);
    tl.fromTo(sl.querySelectorAll('em'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: -30, duration: 0.6, stagger: 0.18, ease: 'sine.out', immediateRender: false }, K.sleep);
    tl.to(sl, { autoAlpha: 0, scale: 0.8, duration: 0.25 }, K.turn - 0.2);
    // ---- turn: report ticket, urgent push, slot ----
    const flash = el('div', 'x2flash');
    tl.set(flash, { opacity: 0 }, 0);
    tl.fromTo(flash, { opacity: 0.9 }, { opacity: 0, duration: 0.4, immediateRender: false }, K.turn - 0.08);
    sfx('whoosh', K.turn - 0.25, -8);
    tl.to(bg, { backgroundColor: '#0b1a3a', duration: 0.4 }, K.turn - 0.1);
    const thumb = document.createElement('canvas'); thumb.width = 200; thumb.height = 200;
    (() => { const x = thumb.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, '#2b3446'); g.addColorStop(1, '#141a26'); x.fillStyle = g; x.fillRect(0, 0, 200, 200);
      const cu = x.createLinearGradient(0, 70, 0, 120); cu.addColorStop(0, '#ffc7a0'); cu.addColorStop(0.5, '#c4632f'); cu.addColorStop(1, '#5e2a14'); x.fillStyle = cu; x.fillRect(0, 72, 200, 44);
      x.strokeStyle = '#0a0f1e'; x.lineWidth = 5; x.beginPath(); x.moveTo(100, 72); x.lineTo(92, 88); x.lineTo(106, 98); x.lineTo(96, 116); x.stroke();
      for (let i = 0; i < 70; i++) { const a = -Math.PI / 2 + (Math.sin(i * 12.9) * 1.2); const r = 10 + (i * 7) % 70; x.fillStyle = 'rgba(150,225,255,.8)'; x.beginPath(); x.arc(100 + Math.cos(a) * r, 92 + Math.sin(a) * r * 0.8 + r * 0.4, 2 + (i % 3), 0, 7); x.fill(); }
      x.fillStyle = 'rgba(60,170,240,.7)'; x.fillRect(0, 160, 200, 40); })();
    const tk = el('div', 'x2tk', `<div class="th"></div><div class="tx"><b>${S.tk}</b><span>${S.tkM}</span><div class="ch"><em class="u">${S.urg}</em><em class="p">${S.photo}</em></div></div>`);
    tk.querySelector('.th').appendChild(thumb);
    tl.set(tk, { autoAlpha: 0 }, 0);
    tl.fromTo(tk, { autoAlpha: 0, y: 200, rotation: 4 }, { autoAlpha: 1, y: 0, rotation: 0, duration: 0.5, ease: 'power4.out', immediateRender: false }, K.turn + 0.15);
    const u = tk.querySelector('.u'), ph = tk.querySelector('.p');
    tl.set([u, ph], { autoAlpha: 0 }, 0);
    tl.fromTo(ph, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, K.photo - 0.05);
    tl.fromTo(u, { autoAlpha: 0, scale: 2.2, rotation: -10 }, { autoAlpha: 1, scale: 1, rotation: -4, duration: 0.22, ease: 'power4.in', immediateRender: false }, K.urg - 0.1);
    sfx('shutter', K.photo, -9);
    sfx('sting', K.urg - 0.05, -12);
    const push = el('div', 'x2push', `<span class="ai"><img src="assets/logo.png"></span><div class="tx"><b>${S.push}</b><span>${S.pushT}</span></div><em>${S.seen}</em>`);
    tl.set(push, { autoAlpha: 0 }, 0);
    tl.fromTo(push, { autoAlpha: 0, y: -160, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.7)', immediateRender: false }, K.sees - 0.35);
    const seen = push.querySelector('em');
    tl.set(seen, { autoAlpha: 0 }, 0);
    tl.fromTo(seen, { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, duration: 0.3, immediateRender: false }, K.sees + 0.35);
    sfx('chime', K.sees - 0.3, -9);
    const slot = el('div', 'x2slot', `<span class="ic">🔧</span><b>${S.slot}</b><span class="tm">08:00</span><em>${S.ok}</em>`);
    tl.set(slot, { autoAlpha: 0 }, 0);
    tl.fromTo(slot, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.2)', immediateRender: false }, K.eight - 0.1);
    sfx('pop', K.eight, -10);
    tl.to(clock, { scale: 0.42, color: '#3ad1ff', duration: 0.3 }, K.eight - 0.4);
    // ---- ending: small fix vs big renovation ----
    const end = el('div', 'x2end', `<div class="st">${S.stamp}</div><h2>${S.fix}</h2><p>${S.fix2}</p>`);
    tl.set(end, { autoAlpha: 0 }, 0);
    tl.to([tk, push, slot], { autoAlpha: 0, y: -40, duration: 0.25, stagger: 0.04 }, K.small - 0.35);
    tl.fromTo(end, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, immediateRender: false }, K.small - 0.15);
    tl.fromTo(end.querySelector('.st'), { scale: 2.4, rotation: -14 }, { scale: 1, rotation: -6, duration: 0.24, ease: 'power4.in', immediateRender: false }, K.small - 0.15);
    tl.fromTo(end.querySelector('h2'), { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, K.small);
    tl.fromTo(end.querySelector('p'), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: 'power3.out', immediateRender: false }, K.small + 0.6);
    sfx('impact', K.small + 0.08, -10);
    const roles = el('div', 'x2roles', `<span><i>✓</i>${S.r1}</span><span><i>✓</i>${S.r2}</span>`);
    tl.set(roles.children, { autoAlpha: 0 }, 0);
    tl.fromTo(roles.children, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.1, ease: 'back.out(2)', immediateRender: false }, END + 0.15);
    const lk = el('div', 'x2lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.35);
    sfx('chime', END + 0.4, -13);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X3: heating outage — 3D building, windows freeze, one update to all, warm again =================
  function X3() {
    const de = lang === 'de';
    const S = de ? {
      t0: 'Mo · 07:10', t1: 'Mo · 18:30', off: 'Heizung aus', on: '✓ Heizung läuft', call: 'Anruf', calls: (n) => `${n} Anrufe`, units: ['Whg 1', 'Whg 2', 'Whg 3', 'Whg 4', 'Whg 5', 'Whg 6'],
      msgH: 'An alle 6 Parteien', msg: 'Heizung ausgefallen. Techniker kommt heute um 14:00 Uhr.', read: 'gelesen', temp: (c) => c + '°C',
      r1: 'Mieter', r2: 'Vermieter', tag: 'für Mieter & Vermieter',
    } : {
      t0: 'Mon · 7:10 am', t1: 'Mon · 6:30 pm', off: 'Heating off', on: '✓ Heating back on', call: 'Call', calls: (n) => `${n} calls`, units: ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5', 'Unit 6'],
      msgH: 'To all 6 units', msg: 'Heating is down. A technician arrives today at 2 pm.', read: 'read', temp: (c) => Math.round(c * 9 / 5 + 32) + '°F',
      r1: 'Tenant', r2: 'Landlord', tag: 'for tenants & landlords',
    };
    const K = {};
    K.off = W(['aus', 'fails']).start;
    K.six = W(['sechs', 'six']).start;
    K.call = W(['rufen', 'call']).start;
    K.turn = W(['Mit', 'With']).start;
    K.all = W(['alle', 'everyone']).start;
    K.tech = W(['Techniker', 'technician']).start;
    K.no = W(['Keine', 'No']).start;
    K.eve = W(['Abend', 'evening']).start;
    K.warm = W(['warm', 'warm'], W(['Abend', 'evening']).i).start;
    const T = END + 2.1;
    const sky = el('div', 'x3sky', '<i class="sun"></i>');
    const G = gl3(stage, { fov: 32, envTop: '#cfe0ff', envBot: '#3a4458', envInt: 0.7, exposure: 1.0 });
    const { scene, cam } = G;
    const hemi = new T3.HemisphereLight('#d6e4ff', '#4a5468', 0.85); scene.add(hemi);
    const sun = new T3.DirectionalLight('#fff1dc', 1.6); sun.position.set(-6, 9, 7); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 }); sun.shadow.radius = 4; sun.shadow.bias = -0.0005; scene.add(sun);
    const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,220,150,1)'); g.addColorStop(0.3, 'rgba(255,180,100,0.5)'); g.addColorStop(1, 'rgba(255,170,80,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; })();
    const D = new T3.Group(); scene.add(D);
    const snow = M.std('#f2f6ff', { roughness: 0.85 });
    mesh(rbox(10.4, 1.0, 8.4, 0.18), M.std('#2a3040', { roughness: 0.9 }), D, [0, -0.5, 0]);
    mesh(new T3.BoxGeometry(10.3, 0.12, 8.3), snow, D, [0, 0.06, 0]);
    mesh(new T3.BoxGeometry(10.3, 0.13, 1.3), M.std('#6a707a', { roughness: 0.8 }), D, [0, 0.07, 2.55]);
    for (let i = 0; i < 20; i++) mesh(new T3.BoxGeometry(0.03, 0.02, 1.28), M.std('#545a64'), D, [-5 + i * 0.52, 0.14, 2.55]);
    const H = new T3.Group(); H.position.set(0, 0.12, -1.0); D.add(H);
    mesh(new T3.BoxGeometry(4.6, 5.0, 3.4), M.std('#e6cfb2', { roughness: 0.9 }), H, [0, 2.5, 0]);
    for (let f = 1; f < 3; f++) mesh(new T3.BoxGeometry(4.7, 0.12, 3.5), M.std('#c9a988', { roughness: 0.9 }), H, [0, f * 1.65, 0]);
    const rs = new T3.Shape(); rs.moveTo(-1.95, 0); rs.lineTo(1.95, 0); rs.lineTo(0, 1.4); rs.lineTo(-1.95, 0);
    const rg = new T3.ExtrudeGeometry(rs, { depth: 5.0, bevelEnabled: false }); rg.translate(0, 0, -2.5);
    mesh(rg, M.std('#3f4656', { roughness: 0.7 }), H, [0, 5.0, 0], [0, Math.PI / 2, 0]);
    [-1, 1].forEach((sg) => { const m = mesh(new T3.BoxGeometry(5.1, 0.14, 2.45), snow, H, [0, 5.0 + 0.7 + 0.08, sg * 0.98]); m.rotation.x = sg * 0.62; });
    mesh(new T3.BoxGeometry(0.55, 1.2, 0.55), M.std('#7a4e3a', { roughness: 0.9 }), H, [1.3, 6.0, -0.5]);
    mesh(new T3.BoxGeometry(0.62, 0.14, 0.62), snow, H, [1.3, 6.65, -0.5]);
    // smoke from the chimney (stops while the heating is off)
    const smokeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T3.CanvasTexture(c); })();
    const smoke = [...Array(10)].map((_, i) => { const sp = new T3.Sprite(new T3.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0 })); H.add(sp); return { sp, ph: i / 10 }; });
    // 6 front windows (2 per floor) + door
    const front = 1.72, wins = [];
    [[-1.15, 0.9], [1.15, 0.9], [-1.15, 2.55], [1.15, 2.55], [-1.15, 4.2], [1.15, 4.2]].forEach(([x, y], i) => {
      mesh(new T3.BoxGeometry(1.0, 1.05, 0.08), M.std('#eef1f5', { roughness: 0.6 }), H, [x, y, front]);
      const m = new T3.MeshStandardMaterial({ color: '#ffe2b0', emissive: new T3.Color('#ffb85c'), emissiveIntensity: 1.2, roughness: 0.25 });
      mesh(new T3.BoxGeometry(0.84, 0.88, 0.06), m, H, [x, y, front + 0.03]);
      mesh(new T3.BoxGeometry(0.05, 0.88, 0.07), M.std('#eef1f5'), H, [x, y, front + 0.05]);
      const g = new T3.Sprite(new T3.SpriteMaterial({ map: glowTex, blending: T3.AdditiveBlending, transparent: true, depthWrite: false })); g.position.set(x, y, front + 0.45); g.scale.setScalar(1.7); H.add(g);
      wins.push({ m, g, x, y });
    });
    mesh(new T3.BoxGeometry(0.9, 1.4, 0.1), M.std('#4b3428', { roughness: 0.6 }), H, [0, 0.82, front]);
    // trees
    const pine = (x, z, s) => { const g = new T3.Group(); g.position.set(x, 0.12, z); g.scale.setScalar(s); D.add(g); mesh(new T3.CylinderGeometry(0.12, 0.16, 0.6, 8), M.std('#4a3326'), g, [0, 0.3, 0]); [[0.95, 1.2, 0.9], [0.75, 1.0, 1.55], [0.5, 0.8, 2.15]].forEach(([r, h, y]) => { mesh(new T3.ConeGeometry(r, h, 10), M.std('#24463a', { roughness: 0.9 }), g, [0, y, 0]); mesh(new T3.ConeGeometry(r * 0.8, h * 0.42, 10), snow, g, [0, y + h * 0.24, 0]); }); };
    pine(-4.2, -0.4, 1.0); pine(4.1, -2.0, 1.15); pine(-3.6, -3.0, 0.85);
    // heating state per window: cold wave at K.off (staggered), warm again around K.eve
    const coldAt = (i) => K.off - 0.3 + i * 0.12, warmAt = (i) => K.eve - 0.2 + i * 0.16;
    const cWarm = new T3.Color('#ff9f3a'), cCold = new T3.Color('#2f7bff'), cTmp = new T3.Color(), bWarm = new T3.Color('#ffd79a'), bCold = new T3.Color('#a9cfff');
    const winP = (i) => H.localToWorld(new T3.Vector3(wins[i].x, wins[i].y, front + 0.1));
    const P = (a, r, h, tx, ty, tz) => () => ({ a, r, h, tx, ty, tz });
    const camT = track([
      [0, P(-0.55, 25, 10, 0, 2.6, -0.6)],
      [K.call, P(-0.35, 23, 9, 0, 2.9, -0.6), E.io],
      [K.turn + 0.4, P(-0.1, 26, 11, 0, 4.4, -0.6), E.io],
      [K.eve - 0.2, P(0.2, 25, 10.5, 0, 4.2, -0.6), E.lin],
      [T, P(0.45, 28, 12, 0, 4.8, -0.6), E.io],
    ]);
    const eve = (t) => E.io(seg(t, K.eve - 0.6, 1.0));
    perFrame((t) => {
      const ev = eve(t);
      sky.style.background = ev < 0.01 ? '' : `linear-gradient(180deg, rgb(${lerp(158, 40, ev)},${lerp(196, 44, ev)},${lerp(236, 92, ev)}) 0%, rgb(${lerp(206, 196, ev)},${lerp(222, 104, ev)},${lerp(244, 112, ev)}) 60%, rgb(${lerp(236, 250, ev)},${lerp(228, 170, ev)},${lerp(232, 110, ev)}) 100%)`;
      hemi.intensity = 0.85 - 0.35 * ev; sun.intensity = 1.6 - 1.2 * ev; sun.color.set('#fff1dc').lerp(cTmp.set('#ff9a5c'), ev);
      let coldN = 0;
      wins.forEach((w, i) => {
        const c = E.io(seg(t, coldAt(i), 0.35)) * (1 - E.io(seg(t, warmAt(i), 0.4)));
        coldN += c;
        w.m.emissive.copy(cWarm).lerp(cCold, c);
        w.m.color.copy(bWarm).lerp(bCold, c);
        w.m.emissiveIntensity = 1.7 * (1 - c) + 1.0 * c + 0.6 * ev * (1 - c);
        w.g.material.opacity = (0.7 * (1 - c) + 0.08 * c) * (0.6 + 0.5 * ev);
      });
      const heat = 1 - coldN / 6;
      smoke.forEach((sm) => { const k = (t * 0.35 + sm.ph) % 1; sm.sp.position.set(1.3 + k * 0.8, 6.8 + k * 2.4, -0.5 + k * 0.3); sm.sp.scale.setScalar(0.5 + k * 1.6); sm.sp.material.opacity = 0.55 * heat * Math.sin(Math.PI * k); });
      const c = camT(t);
      cam.position.set(c.tx + Math.sin(c.a) * c.r, c.h, c.tz + Math.cos(c.a) * c.r);
      cam.lookAt(c.tx, c.ty, c.tz);
      G.r.render(scene, cam);
    });
    // ---- HTML ----
    const chip = el('div', 'x3chip', `<span class="tm">🌤 ${S.t0}</span><span class="tp"></span><span class="st">${S.off}</span>`);
    const tp = chip.querySelector('.tp');
    perFrame((t) => { const c = Math.round(21 - 6 * E.io(seg(t, K.off, 3.0)) + 6 * E.io(seg(t, K.eve, 1.2))); const v = '🌡 ' + S.temp(c); if (tp.textContent !== v) { tp.textContent = v; tp.classList.toggle('cold', c < 19); } });
    const tm = chip.querySelector('.tm'), st = chip.querySelector('.st');
    tl.fromTo(chip, { autoAlpha: 0, y: -30 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'back.out(2)' }, 0.1);
    tl.set(st, { autoAlpha: 0 }, 0);
    tl.fromTo(st, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, K.off - 0.1);
    perFrame((t) => { const v = t < K.eve - 0.3 ? `🌤 ${S.t0}` : `🌆 ${S.t1}`; if (tm.textContent !== v) tm.textContent = v; const w = t < K.eve + 0.4 ? S.off : S.on; if (st.textContent !== w) { st.textContent = w; st.classList.toggle('ok', w === S.on); } });
    tl.fromTo(chip, { scale: 1 }, { scale: 1.1, duration: 0.12, yoyo: true, repeat: 1, immediateRender: false }, K.eve + 0.3);
    sfx('wind', 0, -15);
    sfx('shiver', K.off, -10);
    // six calls fly from windows to a ringing phone
    const ph = el('div', 'x3phone', `<span class="ic">📞</span><b class="n">${S.calls(0)}</b>`);
    const nEl = ph.querySelector('.n');
    tl.set(ph, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(ph, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, K.six - 0.25);
    tl.fromTo(ph, { rotation: -6 }, { rotation: 6, duration: 0.07, repeat: 15, yoyo: true, ease: 'none', immediateRender: false }, K.call);
    tl.to(ph, { autoAlpha: 0, y: 40, duration: 0.25 }, K.turn - 0.15);
    const bubs = S.units.map((u) => el('div', 'x3call', `📞 ${u}`));
    const CT = (i) => K.six - 0.1 + i * 0.16;
    perFrame((t) => {
      const n = bubs.filter((_, i) => t > CT(i) + 0.45).length;
      const lbl = S.calls(n); if (nEl.textContent !== lbl) nEl.textContent = lbl;
      bubs.forEach((b, i) => {
        const k = (t - CT(i)) / 0.45;
        if (k < 0 || t > K.turn - 0.1) { b.style.visibility = 'hidden'; return; }
        const v = winP(i).project(cam); const sx = (v.x + 1) / 2 * 1080, sy = (1 - v.y) / 2 * 1920;
        const ex = 540, ey = 1270, u = E.io(Math.min(1, k));
        b.style.visibility = 'visible';
        b.style.transform = `translate(${lerp(sx, ex + (i - 2.5) * 40, u) - 110}px, ${lerp(sy, ey - 120 - (i % 3) * 64, u) - 30}px) scale(${1 - 0.1 * u})`;
        b.style.opacity = String(Math.min(1, k * 4));
      });
    });
    bubs.forEach((_, i) => sfx('buzz', CT(i), -16 - i));
    // one message to everyone + read receipts on every window
    const msg = el('div', 'x3msg', `<span class="ai"><img src="assets/logo.png"></span><div class="tx"><b>${S.msgH}</b><span>${S.msg}</span></div>`);
    tl.set(msg, { autoAlpha: 0 }, 0);
    tl.fromTo(msg, { autoAlpha: 0, y: -140, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.6)', immediateRender: false }, K.turn + 0.2);
    tl.to(msg, { autoAlpha: 0, y: -60, duration: 0.25 }, K.eve - 0.4);
    sfx('send', K.turn + 0.25, -10);
    const rr = S.units.map(() => el('div', 'x3read', `✓ ${S.read}`));
    const RT = (i) => K.all + 0.05 + i * 0.09;
    perFrame((t) => rr.forEach((b, i) => {
      const k = (t - RT(i)) / 0.25;
      if (k < 0 || t > K.eve - 0.4) { b.style.visibility = 'hidden'; return; }
      const v = winP(i).project(cam); const sx = (v.x + 1) / 2 * 1080, sy = (1 - v.y) / 2 * 1920;
      b.style.visibility = 'visible';
      b.style.transform = `translate(${sx - 70}px, ${sy - 30}px) scale(${E.ob(Math.min(1, k), 2.4)})`;
    }));
    rr.forEach((_, i) => sfx('pop', RT(i), -18 + i * 0.5));
    const tech = el('div', 'x3tech', `<span>🔧</span><b>14:00</b>`);
    tl.set(tech, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(tech, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.4)', immediateRender: false }, K.tech + 0.2);
    tl.to(tech, { autoAlpha: 0, duration: 0.25 }, K.eve - 0.4);
    sfx('chime', K.tech + 0.25, -12);
    const roles = el('div', 'x3roles', `<span><i>✓</i>${S.r1}</span><span><i>✓</i>${S.r2}</span>`);
    tl.set(roles.children, { autoAlpha: 0 }, 0);
    tl.fromTo(roles.children, { autoAlpha: 0, y: 30, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2.2)', stagger: 0.1, immediateRender: false }, END + 0.3);
    const lk = el('div', 'x3lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, scale: 0.5, y: 40 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.9)', immediateRender: false }, END + 0.2);
    sfx('heater', K.eve, -12);
    sfx('impact', END + 0.23, -9);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X4: move-out countdown — kraft-paper moving box rotating 4 stencil faces, objects pop out =================
  function X4() {
    const de = lang === 'de';
    const S = de ? {
      head: 'Dinge vor dem Auszug', sub: 'Kaution ohne Streit zurück', tape: 'AUSZUG · UMZUG · AUSZUG · UMZUG',
      ben: ['🔢 Zählerstände', '📷 Jeder Raum', '📋 Einzug vs. Auszug', '💶 Kaution'],
      card: 'Auszug · Wohnung 3', rows: ['Zählerstände eingetragen', 'Räume fotografiert', 'Protokoll verglichen', 'Kaution geprüft'], dep: 'Kaution 1.500 €', depS: 'Rückzahlung ✓', in: 'EINZUG', out: 'AUSZUG', cur: '€',
      r1: 'Mieter', r2: 'Vermieter', tag: 'für Mieter & Vermieter',
    } : {
      head: 'things before you move out', sub: 'deposit back, no fight', tape: 'MOVE-OUT · MOVING DAY · MOVE-OUT · MOVING DAY',
      ben: ['🔢 Meter readings', '📷 Every room', '📋 Move-in vs. move-out', '💵 Deposit'],
      card: 'Move-out · Unit 3', rows: ['Meter readings logged', 'Rooms photographed', 'Report compared', 'Deposit checked'], dep: 'Deposit $1,500', depS: 'refunded ✓', in: 'MOVE-IN', out: 'MOVE-OUT', cur: '$',
      r1: 'Tenant', r2: 'Landlord', tag: 'for tenants & landlords',
    };
    const K = {};
    const i4 = W(['Vier', 'Four'], 0); K.n4 = i4.start;
    const i3 = W(['Drei', 'Three'], i4.i); K.n3 = i3.start;
    const i2 = W(['Zwei', 'Two'], i3.i); K.n2 = i2.start;
    const i1 = W(['Eins', 'One'], i2.i); K.n1 = i1.start;
    K.turn = W(['Mit', 'With'], i1.i).start;
    K.all = W(['alles', 'all']).start;
    K.sub = W(['Kaution', 'deposit']).start;
    const T = END + 2.1;
    const NT = [K.n4, K.n3, K.n2, K.n1];
    const ACT = [W(['eintragen', 'log']).start, W(['fotografieren', 'photograph']).start, W(['vergleichen', 'compare']).start, W(['prüfen', 'check']).start];
    el('div', 'x4bg', `<i class="tp">${S.tape}</i>`);
    const G = gl3(stage, { fov: 30, envTop: '#fff4e4', envBot: '#8a7254', envInt: 0.9 });
    const { scene, cam } = G;
    cam.position.set(0, 2.8, 14);
    const LOOK = new T3.Vector3(0, 0.55, 0);
    scene.add(new T3.HemisphereLight('#fff3e0', '#8a6a48', 0.7));
    const key = new T3.DirectionalLight('#fff0dc', 2.2); key.position.set(-4, 8, 6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 25 }); key.shadow.radius = 6; key.shadow.bias = -0.0004; scene.add(key);
    const floor = new T3.Mesh(new T3.PlaneGeometry(40, 40), new T3.ShadowMaterial({ opacity: 0.22 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -2.1; floor.receiveShadow = true; scene.add(floor);
    // cardboard faces (canvas textures): kraft, tape, stencil number
    const faceTex = (n, top) => {
      const c = document.createElement('canvas'); c.width = c.height = 512; const tex = new T3.CanvasTexture(c); tex.colorSpace = T3.SRGBColorSpace; tex.anisotropy = 4;
      READY.push(() => {
        const x = c.getContext('2d');
        x.fillStyle = '#c99a63'; x.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${90 + (i * 37) % 60},${60 + (i * 17) % 40},30,${0.04 + ((i * 13) % 10) / 160})`; x.fillRect((i * 97) % 512, (i * 61) % 512, 2 + (i % 5), 1 + (i % 3)); }
        x.strokeStyle = 'rgba(80,50,20,.25)'; x.lineWidth = 6; x.strokeRect(3, 3, 506, 506);
        if (top) { x.fillStyle = 'rgba(235,214,160,.85)'; x.fillRect(206, 0, 100, 512); return; }
        x.fillStyle = 'rgba(235,214,160,.8)'; x.fillRect(0, 0, 512, 70);
        if (n) {
          x.font = '700 400px Clash'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#1b130c'; x.fillText(String(n), 256, 290);
          x.font = '700 34px Gothic'; x.fillStyle = 'rgba(27,19,12,.75)'; x.fillText('▲ ▲  ' + (de ? 'OBEN' : 'THIS SIDE UP') + '  ▲ ▲', 256, 470);
        }
      });
      return new T3.MeshStandardMaterial({ map: tex, roughness: 0.85 });
    };
    const BOX = new T3.Group(); scene.add(BOX);
    const bx = new T3.Mesh(new T3.BoxGeometry(2.6, 2.4, 2.6), [faceTex(3), faceTex(1), faceTex(0, true), faceTex(0), faceTex(4), faceTex(2)]);
    bx.castShadow = true; bx.receiveShadow = true; BOX.add(bx);
    const kraft = M.std('#c3925a', { roughness: 0.85, side: T3.DoubleSide });
    const flaps = [0, 1, 2, 3].map((i) => { const pv = new T3.Group(); const a = (i * Math.PI) / 2; pv.position.set(Math.sin(a) * 1.3, 1.2, Math.cos(a) * 1.3); pv.rotation.y = a; BOX.add(pv); const f = mesh(new T3.BoxGeometry(2.6, 0.03, 1.3), kraft, pv, [0, 0, -0.65]); return pv; });
    // item objects
    const plastic = M.phy('#f1f1ee', { roughness: 0.35 }), dark = M.phy('#1d1f24', { roughness: 0.35 }), metal = M.std('#c9ced4', { metalness: 1, roughness: 0.25 });
    function mkMeter() {
      const g = new T3.Group();
      mesh(rbox(1.5, 1.7, 0.6, 0.12), plastic, g);
      const c = document.createElement('canvas'); c.width = 512; c.height = 128; const tex = new T3.CanvasTexture(c); tex.colorSpace = T3.SRGBColorSpace;
      const disp = mesh(new T3.PlaneGeometry(1.2, 0.3), new T3.MeshBasicMaterial({ map: tex, toneMapped: false }), g, [0, 0.35, 0.31]);
      mesh(new T3.CylinderGeometry(0.28, 0.28, 0.06, 32), dark, g, [0, -0.35, 0.31], [Math.PI / 2, 0, 0]);
      const nd = mesh(new T3.BoxGeometry(0.04, 0.24, 0.02), M.std('#e8432d'), g, [0, -0.35, 0.36]);
      let last = '';
      return { g, anim(lt, act) {
        const v = Math.floor(18000 + 4321 * E.oc(clamp((lt - act + 0.4) / 1.2)));
        const s = String(v).padStart(6, '0');
        if (s !== last) { last = s; const x = c.getContext('2d'); x.fillStyle = '#111'; x.fillRect(0, 0, 512, 128); x.font = '700 96px Clash'; x.textBaseline = 'middle'; s.split('').forEach((d, i) => { x.fillStyle = i > 3 ? '#e8432d' : '#fff'; x.fillText(d, 22 + i * 80, 68); }); tex.needsUpdate = true; }
        nd.rotation.z = -lt * 6;
      } };
    }
    function mkCam() {
      const g = new T3.Group();
      mesh(rbox(1.8, 1.15, 0.7, 0.16), dark, g);
      mesh(new T3.CylinderGeometry(0.42, 0.46, 0.5, 40), dark, g, [0, -0.05, 0.55], [Math.PI / 2, 0, 0]);
      mesh(new T3.CylinderGeometry(0.3, 0.3, 0.06, 40), M.phy('#3a5a8a', { roughness: 0.05, metalness: 0.3 }), g, [0, -0.05, 0.81], [Math.PI / 2, 0, 0]);
      mesh(rbox(0.5, 0.18, 0.4, 0.06), dark, g, [-0.45, 0.66, 0]);
      mesh(new T3.CylinderGeometry(0.1, 0.1, 0.1, 20), M.std('#e8432d'), g, [0.6, 0.62, 0]);
      const fl = new T3.Sprite(new T3.SpriteMaterial({ color: '#ffffff', transparent: true, opacity: 0, blending: T3.AdditiveBlending, depthWrite: false })); fl.position.set(0.55, 0.35, 0.5); fl.scale.setScalar(2.5); g.add(fl);
      return { g, anim(lt, act) { const k = lt - act - 0.1; fl.material.opacity = k > 0 && k < 0.3 ? 1 - k / 0.3 : 0; } };
    }
    function mkClip() {
      const g = new T3.Group();
      mesh(rbox(1.6, 2.1, 0.08, 0.06), M.std('#8a5a32', { roughness: 0.7 }), g);
      mesh(rbox(0.7, 0.22, 0.14, 0.05), metal, g, [0, 0.98, 0.06]);
      const c = document.createElement('canvas'); c.width = 384; c.height = 512; const tex = new T3.CanvasTexture(c); tex.colorSpace = T3.SRGBColorSpace;
      mesh(new T3.PlaneGeometry(1.42, 1.86), new T3.MeshStandardMaterial({ map: tex, roughness: 0.9 }), g, [0, -0.06, 0.05]);
      let st = -1;
      return { g, anim(lt, act) {
        const n = lt > act + 0.6 ? 2 : lt > act ? 1 : 0;
        if (n === st) return; st = n;
        const x = c.getContext('2d'); x.fillStyle = '#fbfaf6'; x.fillRect(0, 0, 384, 512);
        x.font = '700 30px Gothic'; x.fillStyle = '#333'; x.fillText(S.in, 30, 56); x.fillText(S.out, 210, 56);
        [[30, 80], [210, 80], [30, 290], [210, 290]].forEach(([px, py], i) => { x.fillStyle = i % 2 ? '#c4d3e6' : '#d9cbb6'; x.fillRect(px, py, 150, 150); x.strokeStyle = '#999'; x.strokeRect(px, py, 150, 150); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(px + 30, py + 60, 90, 6); });
        if (n >= 1) { x.strokeStyle = '#1fbf72'; x.lineWidth = 14; x.lineCap = 'round'; [[120, 230], [300, 230]].forEach(([cx, cy]) => { x.beginPath(); x.moveTo(cx - 30, cy); x.lineTo(cx - 8, cy + 22); x.lineTo(cx + 30, cy - 22); x.stroke(); }); }
        if (n >= 2) { [[120, 470], [300, 470]].forEach(([cx, cy]) => { x.beginPath(); x.moveTo(cx - 30, cy - 10); x.lineTo(cx - 8, cy + 12); x.lineTo(cx + 30, cy - 32); x.stroke(); }); }
        tex.needsUpdate = true;
      } };
    }
    function mkCoin() {
      const g = new T3.Group();
      const c = document.createElement('canvas'); c.width = c.height = 256; const tex = new T3.CanvasTexture(c); tex.colorSpace = T3.SRGBColorSpace;
      READY.push(() => { const x = c.getContext('2d'); const gr = x.createRadialGradient(110, 100, 10, 128, 128, 128); gr.addColorStop(0, '#fff2b0'); gr.addColorStop(0.6, '#e2b23c'); gr.addColorStop(1, '#a87818'); x.fillStyle = gr; x.fillRect(0, 0, 256, 256); x.font = '700 150px Gothic, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#8a5f0c'; x.fillText(S.cur, 128, 138); tex.needsUpdate = true; });
      const gold = M.std('#e2b23c', { metalness: 1, roughness: 0.25 }), face = new T3.MeshStandardMaterial({ map: tex, metalness: 0.8, roughness: 0.3 });
      const coin = new T3.Mesh(new T3.CylinderGeometry(0.85, 0.85, 0.16, 64), [gold, face, face]); coin.castShadow = true; coin.rotation.x = Math.PI / 2; g.add(coin);
      const ck = new T3.Group(); g.add(ck); ck.position.set(0.85, 0.75, 0.2);
      mesh(new T3.CylinderGeometry(0.34, 0.34, 0.12, 32), M.phy('#1fbf72'), ck, [0, 0, 0], [Math.PI / 2, 0, 0]);
      return { g, anim(lt, act) { const f = E.io(seg(lt, act - 0.3, 0.9)); coin.rotation.y = f * Math.PI * 4; g.position.y += Math.sin(Math.PI * f) * 0.5; ck.scale.setScalar(Math.max(0.001, E.ob(seg(lt, act + 0.5, 0.35), 2.4))); } };
    }
    const OBJ = [mkMeter(), mkCam(), mkClip(), mkCoin()];
    OBJ.forEach((o) => scene.add(o.g));
    const boxRot = (t) => { let r = 0; NT.forEach((nt, k) => { if (k > 0) r += E.io(seg(t, nt - 0.25, 0.5)); }); return -r * Math.PI / 2; };
    perFrame((t) => {
      const drop = E.ob(seg(t, 0.05, 0.6), 1.4);
      BOX.position.set(0, -0.9 + (1 - drop) * 4, 0);
      BOX.rotation.y = boxRot(t) + 0.32 + Math.sin(t * 0.7) * 0.04 + (t > K.turn ? -E.io(seg(t, K.turn - 0.1, 0.6)) * 0.3 : 0);
      const open = E.oc(seg(t, NT[0] - 0.5, 0.5)) * (1 - E.io(seg(t, K.turn - 0.2, 0.5)));
      flaps.forEach((pv, i) => { pv.rotation.x = -open * (1.9 + 0.12 * Math.sin(i)); });
      BOX.scale.setScalar(1 - 0.35 * E.io(seg(t, K.turn - 0.1, 0.6)));
      BOX.position.y += -0.4 * E.io(seg(t, K.turn - 0.1, 0.6)) + 0.0;
      OBJ.forEach((o, k) => {
        const t0 = NT[k] - 0.05, t1 = (k < 3 ? NT[k + 1] : K.turn) - 0.25;
        const up = E.ob(seg(t, t0, 0.5), 1.5) * (1 - E.ic(seg(t, t1, 0.3)));
        o.g.visible = up > 0.01;
        o.g.position.set(0, -0.6 + up * 2.75 + Math.sin(t * 2) * 0.05, 0.1);
        o.g.scale.setScalar(Math.max(0.001, up * 0.95));
        o.g.rotation.set(0.12, -0.35 + Math.sin((t - t0) * 0.9) * 0.25, 0);
        o.anim(t - NT[k], ACT[k] - NT[k]);
      });
      const punch = NT.reduce((acc, nt) => acc + 0.3 * Math.exp(-Math.pow((t - nt - 0.05) / 0.12, 2)), 0);
      cam.position.set(Math.sin(t * 0.3) * 0.3, 2.8, 14 - punch);
      cam.lookAt(LOOK);
      G.r.render(scene, cam);
    });
    const hk = el('div', 'x4hk', `<div class="h"${de ? '' : ' style="font-size:58px"'}><span>4</span>${S.head}</div><div class="s">${S.sub}</div>`);
    tl.fromTo(hk.querySelector('.h'), { autoAlpha: 0, y: -60, rotation: -3 }, { autoAlpha: 1, y: 0, rotation: -2, duration: 0.45, ease: 'back.out(2)' }, 0.2);
    tl.fromTo(hk.querySelector('.s'), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.4)' }, K.sub - 0.1);
    tl.to(hk, { autoAlpha: 0, y: -60, duration: 0.25, ease: 'power2.in' }, NT[0] - 0.3);
    sfx('thud', 0.55, -6);
    const bar = el('div', 'x4bar', `${[0, 1, 2, 3].map((i) => `<span class="it" data-i="${i}">${S.ben[i]}<i>✓</i></span>`).join('')}`);
    tl.set(bar, { autoAlpha: 0 }, 0);
    tl.fromTo(bar, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.35 }, NT[0] - 0.1);
    tl.to(bar, { autoAlpha: 0, duration: 0.25 }, K.turn - 0.1);
    bar.querySelectorAll('.it').forEach((it, k) => {
      tl.fromTo(it, { backgroundColor: 'rgba(255,255,255,0.55)', color: '#5a4630' }, { backgroundColor: '#1b130c', color: '#ffffff', duration: 0.2, immediateRender: false }, NT[k]);
      tl.fromTo(it.querySelector('i'), { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, ACT[k] + 0.5);
      tl.set(it.querySelector('i'), { scale: 0 }, 0);
      sfx('whoosh', NT[k] - 0.25, -11);
      sfx('pop', NT[k] + 0.1, -12);
      sfx('pop', ACT[k] + 0.5, -15);
    });
    sfx('shutter', ACT[1] + 0.1, -8);
    sfx('kaching', ACT[3] - 0.1, -10);
    const card = el('div', 'x4card', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><h4>${S.card}</h4></div>` + S.rows.map((r) => `<div class="rw"><span class="ck"><i>✓</i></span><b>${r}</b></div>`).join('') + `<div class="dep"><b>${S.dep}</b><em>${S.depS}</em></div><div class="ft"><span><i>✓</i>${S.r1}</span><span><i>✓</i>${S.r2}</span></div>`);
    tl.set(card, { autoAlpha: 0 }, 0);
    tl.fromTo(card, { autoAlpha: 0, y: -200, rotation: -4 }, { autoAlpha: 1, y: 0, rotation: -1.5, duration: 0.55, ease: 'power4.out', immediateRender: false }, K.turn + 0.05);
    sfx('whoosh', K.turn - 0.15, -9);
    card.querySelectorAll('.rw').forEach((rw, i) => { const tt = K.turn + 0.45 + i * 0.22; tl.fromTo(rw.querySelector('i'), { scale: 0 }, { scale: 1, duration: 0.25, ease: 'back.out(3)', immediateRender: false }, tt); tl.set(rw.querySelector('i'), { scale: 0 }, 0); sfx('pop', tt, -14); });
    const dep = card.querySelector('.dep em');
    tl.set(dep, { autoAlpha: 0 }, 0);
    tl.fromTo(dep, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, K.all);
    sfx('chime', K.all, -12);
    const fts = card.querySelectorAll('.ft span');
    tl.set(fts, { autoAlpha: 0 }, 0);
    tl.fromTo(fts, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', stagger: 0.1, immediateRender: false }, END - 0.3);
    const lk = el('div', 'x4lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t < NT[0] - 0.1 || t > END + 0.3);
    return { T, K };
  }

  // ================= X5: deposit — parcel-tracking style kinetic (yellow/black brutalist) =================
  function X5() {
    const de = lang === 'de';
    const S = de ? {
      amt: (v) => Math.round(v).toLocaleString('de-DE') + ' €', lab: 'KAUTION', years: ['2023', '2024', '2025', '2026'], q: 'WO IST<br>MEIN GELD?',
      trk: 'Kaution · Wohnung 3', id: 'Sendungsverfolgung für dein Geld', steps: [['Eingezahlt', '01.03.2023'], ['Verwahrt', 'sicher, für beide sichtbar'], ['Zurücküberwiesen', '05.11.2026']],
      no: ['Nachfragen', 'Misstrauen'], r1: 'Mieterin', r2: 'Vermieter', tag: 'für Mieter & Vermieter',
    } : {
      amt: (v) => '$' + Math.round(v).toLocaleString('en-US'), lab: 'DEPOSIT', years: ['2023', '2024', '2025', '2026'], q: "WHERE'S<br>MY MONEY?",
      trk: 'Deposit · Unit 3', id: 'Tracking for your money', steps: [['Paid in', 'Mar 1, 2023'], ['Held', 'safe, visible to both'], ['Paid back', 'Nov 5, 2026']],
      no: ['Chasing', 'Mistrust'], r1: 'Tenant', r2: 'Landlord', tag: 'for tenants & landlords',
    };
    const K = {};
    K.dep = W(['Kaution', 'deposit']).start;
    K.yrs = W(['Jahre', 'years']).start;
    K.asks = W(['fragt', 'asks']).start;
    K.wo = W(['Wo', 'wheres']).start;
    K.turn = W(['Mit', 'With']).start;
    K.step = W(['Schritt', 'step']).start;
    K.s1 = W(['eingezahlt', 'paid']).start;
    K.s2 = W(['verwahrt', 'held']).start;
    K.s3 = W(['zurücküberwiesen', 'back']).start;
    const iNo = W(['Kein', 'No'], W(['Mit', 'With']).i); K.no = iNo.start;
    K.no2 = W(['kein', 'no'], iNo.i).start;
    const T = END + 2.1;
    el('div', 'x5bg', '<i class="d"></i>');
    const big = el('div', 'x5amt', `<small>${S.lab}</small><b>${S.amt(0)}</b>`);
    const bigB = big.querySelector('b');
    perFrame((t) => { const v = S.amt(1500 * E.o5(seg(t, 0.05, 1.0))); if (bigB.textContent !== v) bigB.textContent = v; });
    tl.fromTo(big, { scale: 1.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.35, ease: 'power4.out' }, 0.02);
    tl.to(big, { scale: 0.45, y: -640, duration: 0.5, ease: 'power3.inOut' }, K.yrs - 0.4);
    sfx('kaching', 0.9, -8);
    sfx('impact', 0.05, -9);
    // years flip
    const yrs = el('div', 'x5yrs', S.years.map((y) => `<b>${y}</b>`).join(''));
    const yb = yrs.querySelectorAll('b');
    tl.set(yrs, { autoAlpha: 0 }, 0);
    tl.set(yrs, { autoAlpha: 1 }, K.yrs - 0.2);
    yb.forEach((b, i) => { const t0 = K.yrs - 0.2 + i * 0.32; tl.set(b, { autoAlpha: 0 }, 0); tl.fromTo(b, { autoAlpha: 0, rotationX: -90 }, { autoAlpha: 1, rotationX: 0, duration: 0.18, ease: 'power2.out', immediateRender: false }, t0); if (i < 3) tl.to(b, { rotationX: 90, autoAlpha: 0, duration: 0.14, ease: 'power2.in' }, t0 + 0.28); sfx('unfold', t0, -16); });
    tl.to(yrs, { autoAlpha: 0, y: -60, duration: 0.2 }, K.wo - 0.25);
    const q = el('div', 'x5q', S.q);
    tl.set(q, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(q, { autoAlpha: 0, scale: 2.2, rotation: -6 }, { autoAlpha: 1, scale: 1, rotation: -3, duration: 0.25, ease: 'power4.in', immediateRender: false }, K.wo - 0.1);
    tl.to(q, { autoAlpha: 0, scale: 0.8, duration: 0.2 }, K.turn - 0.15);
    const qs = [...Array(12)].map((_, i) => el('i', 'x5qm', '?', stage, { left: `${(i * 89) % 1000 + 20}px`, fontSize: `${70 + (i * 37) % 90}px` }));
    qs.forEach((m, i) => { const t0 = K.wo - 0.1 + i * 0.05, d = Math.max(0.35, Math.min(1.0, K.turn - 0.2 - t0)); tl.set(m, { autoAlpha: 0 }, 0); tl.fromTo(m, { autoAlpha: 0, y: -200, rotation: (i % 2 ? 1 : -1) * 20 }, { autoAlpha: 1, y: 1200 + (i * 53) % 500, rotation: (i % 2 ? -1 : 1) * 30, duration: d, ease: 'power1.in', immediateRender: false }, t0); tl.to(m, { autoAlpha: 0, duration: 0.12 }, Math.max(t0 + d - 0.12, K.turn - 0.15)); tl.set(m, { autoAlpha: 0 }, K.turn + 0.05); });
    sfx('sting', K.wo - 0.05, -11);
    // tracking card
    const card = el('div', 'x5trk', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.trk}</b><small>${S.id}</small></div></div><div class="ln"><i class="fill"></i><i class="dot"></i></div>` + S.steps.map((st, i) => `<div class="st" style="top:${170 + i * 170}px"><span class="nd"></span><div><b>${st[0]}</b><small>${st[1]}</small></div><em>✓</em></div>`).join(''));
    tl.set(card, { autoAlpha: 0 }, 0);
    tl.fromTo(card, { autoAlpha: 0, y: 220, rotation: 3 }, { autoAlpha: 1, y: 0, rotation: 0, duration: 0.5, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.2, -9);
    const fill = card.querySelector('.fill'), dot = card.querySelector('.dot'), sts = card.querySelectorAll('.st');
    const ST = [K.s1, K.s2, K.s3];
    perFrame((t) => { let p = 0; ST.forEach((st, i) => { p = Math.max(p, i * 0.5 * E.io(seg(t, st - 0.25, 0.35)) + (i ? 0 : 0)); }); const v = ST.reduce((acc, st, i) => (t > st - 0.25 ? i / 2 + 0.5 * E.io(seg(t, st - 0.25, 0.35)) - 0.5 : acc), -0.5); const pr = clamp(v + 0.5 > 0 ? (t >= ST[0] - 0.25 ? Math.max(0, v) : 0) : 0); fill.style.transform = `scaleY(${pr})`; dot.style.transform = `translateY(${pr * 340}px)`; dot.style.opacity = t > ST[0] - 0.3 ? '1' : '0'; });
    sts.forEach((st, i) => { tl.fromTo(st, { opacity: 0.35 }, { opacity: 1, duration: 0.2, immediateRender: false }, ST[i] - 0.1); tl.set(st, { opacity: 0.35 }, 0); tl.fromTo(st.querySelector('em'), { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, ST[i] + 0.15); tl.set(st.querySelector('em'), { scale: 0 }, 0); sfx('pop', ST[i] + 0.15, -12); });
    sfx('chime', K.s3 + 0.3, -11);
    const nos = S.no.map((n, i) => el('div', 'x5no', `${n}<i></i>`, stage, { top: '1110px', left: i ? '580px' : '50px' }));
    nos.forEach((n, i) => { const tt = i ? K.no2 : K.no; tl.set(n, { autoAlpha: 0 }, 0); tl.fromTo(n, { autoAlpha: 0, scale: 1.8, rotation: -8 }, { autoAlpha: 1, scale: 1, rotation: -3, duration: 0.2, ease: 'power4.in', immediateRender: false }, tt - 0.05); tl.fromTo(n.querySelector('i'), { scaleX: 0 }, { scaleX: 1, duration: 0.2, immediateRender: false }, tt + 0.2); tl.set(n.querySelector('i'), { scaleX: 0 }, 0); sfx('thud', tt + 0.12, -10); });
    const roles = el('div', 'x5roles', `<span><i>✓</i>${S.r1}</span><span><i>✓</i>${S.r2}</span>`);
    tl.set(roles.children, { autoAlpha: 0 }, 0);
    tl.fromTo(roles.children, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.1, ease: 'back.out(2)', immediateRender: false }, END + 0.15);
    const lk = el('div', 'x5lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.35);
    sfx('impact', END + 0.38, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X6: rent day — 3D studio: flip calendar, two phones, paper-plane transfer, receipt =================
  function X6() {
    const de = lang === 'de';
    const S = de ? {
      m0: 'SEP', d0: '30', m1: 'OKT', d1: '1', amt: '850,00 €', sent: 'Überweisung gesendet', none: 'Keine neuen Umsätze', recv: 'Miete eingegangen', rcpt: 'Quittung Oktober', rcptS: 'automatisch erstellt', paid: 'BEZAHLT ✓',
      tn: 'Mieterin', ll: 'Vermieter', no: ['Rückfragen', 'Kontoauszug-Chaos'], tag: 'für Mieter & Vermieter', unit: 'Wohnung 3 · Miete',
    } : {
      m0: 'SEP', d0: '30', m1: 'OCT', d1: '1', amt: '$850.00', sent: 'Transfer sent', none: 'No new transactions', recv: 'Rent received', rcpt: 'October receipt', rcptS: 'created automatically', paid: 'PAID ✓',
      tn: 'Tenant', ll: 'Landlord', no: ['Questions', 'Statement hunting'], tag: 'for tenants & landlords', unit: 'Unit 3 · Rent',
    };
    const K = {};
    K.first = W(['Erste', 'first']).start;
    K.sent = W(['raus', 'sent']).start;
    K.arr = W(['angekommen', 'arrive']).start;
    K.turn = W(['Mit', 'With']).start;
    K.now = W(['sofort', 'away']).start;
    K.recv = W(['eingegangen', 'received']).start;
    K.rcpt = W(['Quittung', 'receipt']).start;
    const iNo = W(['Keine', 'No'], W(['Mit', 'With']).i); K.no = iNo.start;
    K.no2 = W(['kein', 'no'], iNo.i).start;
    const T = END + 2.1;
    el('div', 'x6bg', '<i class="s"></i>');
    const G = gl3(stage, { fov: 30, envTop: '#ffffff', envBot: '#9fb8ad', envInt: 1.0 });
    const { scene, cam } = G;
    cam.position.set(0, 3.0, 15);
    const LOOK = new T3.Vector3(0, 0.45, 0);
    scene.add(new T3.HemisphereLight('#ffffff', '#a6c9b8', 0.75));
    const key = new T3.DirectionalLight('#fffaf2', 2.0); key.position.set(-4, 9, 6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 }); key.shadow.radius = 7; key.shadow.bias = -0.0004; scene.add(key);
    const floor = new T3.Mesh(new T3.PlaneGeometry(40, 40), new T3.ShadowMaterial({ opacity: 0.18 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.2; floor.receiveShadow = true; scene.add(floor);
    const canvasMat = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const tex = new T3.CanvasTexture(c); tex.colorSpace = T3.SRGBColorSpace; tex.anisotropy = 4; const m = new T3.MeshBasicMaterial({ map: tex, toneMapped: false }); m.userData.redraw = (...a) => { draw(c.getContext('2d'), w, h, ...a); tex.needsUpdate = true; }; return m; };
    const rr = (x, X, Y, W, H, R) => { x.beginPath(); x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R); x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath(); };
    // flip calendar
    const CAL = new T3.Group(); CAL.position.set(0, 2.55, -1.4); CAL.scale.setScalar(0.78); scene.add(CAL);
    mesh(rbox(2.6, 0.35, 1.6, 0.12), M.phy('#1e4a3a', { roughness: 0.4 }), CAL, [0, -1.2, 0]);
    mesh(rbox(2.4, 2.6, 0.12, 0.05), M.phy('#2a5540', { roughness: 0.45 }), CAL, [0, 0.1, -0.4], [-0.18, 0, 0]);
    const page = (m, d, red) => canvasMat(512, 560, (x, w, h) => { x.fillStyle = '#fffdf8'; x.fillRect(0, 0, w, h); x.fillStyle = red ? '#e8432d' : '#2a5540'; x.fillRect(0, 0, w, 130); x.font = '700 84px Clash'; x.textAlign = 'center'; x.fillStyle = '#fff'; x.fillText(m, w / 2, 98); x.font = '700 330px Clash'; x.fillStyle = '#16251d'; x.fillText(d, w / 2, 450); });
    const pBack = page(S.m1, S.d1, true), pFront = page(S.m0, S.d0, false);
    READY.push(() => { pBack.userData.redraw(); pFront.userData.redraw(); });
    const pg1 = mesh(new T3.PlaneGeometry(2.2, 2.4), pBack, CAL, [0, 0.1, -0.31], [-0.18, 0, 0]); pg1.castShadow = false;
    const hinge = new T3.Group(); hinge.position.set(0, 1.28, -0.5); hinge.rotation.x = -0.18; CAL.add(hinge);
    const pg0 = new T3.Mesh(new T3.PlaneGeometry(2.2, 2.4), pFront); pg0.position.set(0, -1.2, 0.1); hinge.add(pg0);
    const pg0b = new T3.Mesh(new T3.PlaneGeometry(2.2, 2.4), new T3.MeshBasicMaterial({ color: '#efe9dc', toneMapped: false })); pg0b.position.set(0, -1.2, 0.098); pg0b.rotation.y = Math.PI; hinge.add(pg0b);
    [-0.7, 0.7].forEach((x) => mesh(new T3.TorusGeometry(0.12, 0.035, 10, 24), M.std('#c9ced4', { metalness: 1, roughness: 0.25 }), CAL, [x, 1.3, -0.4], [0, Math.PI / 2, 0]));
    // phones
    const phone = (x, ry, scr) => { const g = new T3.Group(); g.position.set(x, -1.0, 1.0); g.rotation.set(-0.3, ry, 0); g.scale.setScalar(0.72); scene.add(g); mesh(rbox(1.5, 3.0, 0.16, 0.2), M.phy('#15181d', { roughness: 0.3 }), g); const sm = mesh(new T3.PlaneGeometry(1.36, 2.86), scr, g, [0, 0, 0.085]); sm.castShadow = false; return g; };
    const scrDraw = (who, state) => (x, w, h, st) => {
      x.fillStyle = '#f6f8f7'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#16251d'; x.font = '700 30px Gothic'; x.fillText('9:41', 40, 50);
      x.font = '700 34px Gothic'; x.fillStyle = '#5c6b63'; x.fillText(who, 40, 120);
      x.font = '700 46px Clash'; x.fillStyle = '#16251d'; x.fillText(S.unit, 40, 180);
      const s = st();
      rr(x, 30, 230, w - 60, 250, 30); x.fillStyle = s.bg; x.fill();
      x.font = '700 40px Gothic'; x.fillStyle = s.fg; x.fillText(s.l1, 60, 310);
      x.font = '700 78px Clash'; x.fillText(s.l2, 60, 410);
      if (s.ok) { x.fillStyle = '#1fbf72'; x.beginPath(); x.arc(w - 90, 300, 40, 0, 7); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 10; x.beginPath(); x.moveTo(w - 108, 300); x.lineTo(w - 94, 316); x.lineTo(w - 70, 286); x.stroke(); }
      x.fillStyle = '#e4ebe7'; [540, 640, 740].forEach((y) => { rr(x, 30, y, w - 60, 80, 20); x.fill(); });
    };
    let tState = 0, lState = 0;
    const tScr = canvasMat(512, 1080, scrDraw(S.tn, 0)), lScr = canvasMat(512, 1080, scrDraw(S.ll, 0));
    const tSt = () => ({ bg: '#2a5540', fg: '#ffffff', l1: S.sent, l2: S.amt, ok: true });
    const lSt = () => (lState ? { bg: '#1fbf72', fg: '#ffffff', l1: S.recv, l2: S.amt, ok: true } : { bg: '#e9eeeb', fg: '#7b8a82', l1: S.none, l2: '— —', ok: false });
    READY.push(() => { tScr.userData.redraw(tSt); lScr.userData.redraw(lSt); });
    const PT = phone(-1.08, 0.3, tScr), PL = phone(1.08, -0.3, lScr);
    // paper plane
    const pg = new T3.BufferGeometry();
    pg.setAttribute('position', new T3.Float32BufferAttribute([0, 0, 0.6, -0.42, 0.02, -0.35, 0, 0, -0.25, 0, 0, 0.6, 0, 0, -0.25, 0.42, 0.02, -0.35, 0, 0, 0.6, 0, -0.14, -0.3, 0, 0, -0.25], 3));
    pg.computeVertexNormals();
    const plane = new T3.Mesh(pg, M.std('#ffffff', { roughness: 0.6, side: T3.DoubleSide })); plane.castShadow = true; scene.add(plane);
    const PATH = new T3.CatmullRomCurve3([new T3.Vector3(-1.1, -0.3, 1.4), new T3.Vector3(-0.8, 0.6, 1.9), new T3.Vector3(0, 0.95, 2.1), new T3.Vector3(0.8, 0.6, 1.9), new T3.Vector3(1.1, -0.3, 1.4)]);
    const trail = [...Array(14)].map(() => { const m = new T3.Mesh(new T3.SphereGeometry(0.035, 10, 8), new T3.MeshBasicMaterial({ color: '#2a5540', transparent: true, opacity: 0.7 })); scene.add(m); return m; });
    // receipt sheet
    const rcM = canvasMat(512, 700, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a5540'; x.fillRect(0, 0, w, 16); x.font = '700 50px Clash'; x.fillStyle = '#16251d'; x.fillText(S.rcpt, 40, 100); x.font = '700 30px Gothic'; x.fillStyle = '#5c6b63'; x.fillText(S.unit, 40, 150); x.fillStyle = '#e4ebe7'; [210, 280, 350].forEach((y) => x.fillRect(40, y, w - 80, 26)); x.font = '700 64px Clash'; x.fillStyle = '#16251d'; x.fillText(S.amt, 40, 500); x.save(); x.translate(330, 600); x.rotate(-0.12); x.strokeStyle = '#1fbf72'; x.lineWidth = 8; x.strokeRect(-150, -50, 300, 90); x.font = '700 50px Clash'; x.fillStyle = '#1fbf72'; x.textAlign = 'center'; x.fillText(S.paid, 0, 12); x.restore(); });
    READY.push(() => rcM.userData.redraw());
    const RC = new T3.Group(); scene.add(RC);
    const rcp = mesh(new T3.PlaneGeometry(1.5, 2.05), rcM, RC); rcp.castShadow = true;
    perFrame((t) => {
      const fl = E.io(seg(t, K.first - 0.25, 0.6));
      hinge.rotation.x = -0.18 - fl * 2.9;
      const tf = seg(t, K.sent - 0.3, 2.2), mid = 0.5;
      let u;
      if (t < K.turn) u = Math.min(mid, E.oc(tf) * mid) + Math.sin(t * 5) * 0.004 * (tf > 0.6 ? 1 : 0);
      else u = mid + (1 - mid) * E.io(seg(t, K.turn + 0.1, 0.9));
      const p = PATH.getPointAt(clamp(u)), tg = PATH.getTangentAt(clamp(u));
      plane.position.copy(p).add(new T3.Vector3(0, Math.sin(t * 3) * 0.06, 0));
      plane.lookAt(p.clone().add(tg));
      plane.visible = t > K.sent - 0.35 && u < 0.985;
      plane.scale.setScalar(0.85);
      trail.forEach((m, i) => { const uu = u - (i + 1) * 0.025; m.visible = plane.visible && uu > 0.02; if (m.visible) m.position.copy(PATH.getPointAt(clamp(uu))); m.material.opacity = 0.7 * (1 - i / 14); });
      pg0.visible = pg0b.visible = fl < 0.5;
      const ls = t > K.recv - 0.2 ? 1 : 0;
      if (ls !== lState) { lState = ls; lScr.userData.redraw(lSt); }
      const r = E.ob(seg(t, K.rcpt - 0.2, 0.6), 1.3);
      RC.visible = r > 0.01;
      const rm = E.io(seg(t, K.rcpt + 0.3, 0.6)); RC.position.set(lerp(1.1, 0, rm), -0.9 + r * 1.3 + rm * 0.2, 1.3 + r * 0.6 + rm * 0.9);
      RC.rotation.set(-0.1, -0.35 + Math.sin(t * 1.3) * 0.06, 0.05);
      RC.scale.setScalar(Math.max(0.001, r));
      PT.position.y = -0.2 + Math.sin(t * 1.2) * 0.04; PL.position.y = -0.2 + Math.sin(t * 1.2 + 1) * 0.04;
      cam.position.set(Math.sin(t * 0.25) * 0.4, 3.0, 15 - 0.8 * E.io(seg(t, K.turn, 1.5)));
      cam.lookAt(LOOK);
      G.r.render(scene, cam);
    });
    sfx('unfold', K.first - 0.2, -10);
    sfx('whoosh', K.sent - 0.2, -10);
    const qm = el('div', 'x6q', '?');
    tl.set(qm, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(qm, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(3)', immediateRender: false }, K.arr - 0.1);
    tl.to(qm, { autoAlpha: 0, scale: 0.5, duration: 0.2 }, K.turn);
    sfx('pop', K.arr, -10);
    const lab = [el('div', 'x6lab l', S.tn), el('div', 'x6lab r', S.ll)];
    tl.set(lab, { autoAlpha: 0 }, 0);
    tl.fromTo(lab, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.1, immediateRender: false }, K.sent - 0.4);
    tl.to(lab, { autoAlpha: 0, duration: 0.2 }, END + 0.1);
    sfx('kaching', K.recv - 0.15, -8);
    sfx('chime', K.recv, -13);
    sfx('receipts', K.rcpt - 0.1, -12);
    const nos = S.no.map((n, i) => el('div', 'x6no', `✕ ${n}`, stage, { top: `${310 + i * 110}px` }));
    nos.forEach((n, i) => { const tt = i ? K.no2 : K.no; tl.set(n, { autoAlpha: 0, xPercent: -50 }, 0); tl.fromTo(n, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, tt - 0.05); tl.to(n, { autoAlpha: 0, duration: 0.2 }, END + 0.1); sfx('pop', tt, -12); });
    const lk = el('div', 'x6lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: -40, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X7: 3 documents — 3D filing drawer, docs rise per number, search card =================
  function X7() {
    const de = lang === 'de';
    const S = de ? {
      head: 'Dokumente', sub: 'in 2 Sekunden', alert: 'IM ERNSTFALL',
      ctx: ['Nachzahlung?', 'Kaution?', 'Kündigung?'],
      d0: ['Nebenkosten-', 'abrechnung 2025'], rows0: [['Heizung', '412,00 €'], ['Wasser', '186,40 €'], ['Hausmeister', '96,10 €'], ['Müll', '58,30 €']], tot0: ['Summe', '752,80 €'],
      d1: ['Übergabe-', 'protokoll'], rooms: ['Küche', 'Bad', 'Wohnen', 'Flur'], mtr: 'Zähler 18.432',
      d2: ['MIETVERTRAG', ''], par: ['§ 1 Mietsache', '§ 2 Mietzeit', '§ 3 Miete', '§ 4 Kaution'], sig: ['Mieter', 'Vermieter'],
      card: 'Dokumente', cardS: 'Wohnung 3 · geteilt', q: 'Mietvertrag', tm: '0,2 s', res: [['Mietvertrag', 'PDF · 12 Seiten'], ['Übergabeprotokoll', 'PDF · 6 Fotos'], ['Nebenkostenabrechnung 2025', 'PDF · 3 Seiten']],
      r1: 'Mieter', r2: 'Vermieter', tag: 'für Mieter & Vermieter',
    } : {
      head: 'documents', sub: 'in 2 seconds', alert: 'WHEN IT COUNTS',
      ctx: ['Extra charge?', 'Deposit?', 'Notice?'],
      d0: ['Utility', 'statement 2025'], rows0: [['Heating', '$412.00'], ['Water', '$186.40'], ['Caretaker', '$96.10'], ['Trash', '$58.30']], tot0: ['Total', '$752.80'],
      d1: ['Handover', 'report'], rooms: ['Kitchen', 'Bath', 'Living', 'Hall'], mtr: 'Meter 18,432',
      d2: ['LEASE', 'AGREEMENT'], par: ['§ 1 Premises', '§ 2 Term', '§ 3 Rent', '§ 4 Deposit'], sig: ['Tenant', 'Landlord'],
      card: 'Documents', cardS: 'Unit 3 · shared', q: 'lease', tm: '0.2 s', res: [['Lease agreement', 'PDF · 12 pages'], ['Handover report', 'PDF · 6 photos'], ['Utility statement 2025', 'PDF · 3 pages']],
      r1: 'Tenant', r2: 'Landlord', tag: 'for tenants & landlords',
    };
    const K = {};
    K.sec = W(['Sekunden', 'seconds']).start;
    K.alert = W(['Ernstfall', 'counts']).start;
    const i3 = W(['Drei', 'Three'], 0); K.n3 = i3.start;
    const i2 = W(['Zwei', 'Two'], i3.i); K.n2 = i2.start;
    const i1 = W(['Eins', 'One'], i2.i); K.n1 = i1.start;
    const it = W(['Mit', 'With'], i1.i); K.turn = it.start;
    K.ort = W(['Ort', 'place'], it.i).start;
    K.roles = W(['Mieter', 'tenant'], it.i).start;
    K.find = W(['sofort', 'instantly'], it.i).start;
    const T = END + 2.1;
    const NT = [K.n3, K.n2, K.n1];
    el('div', 'x7bg', '<i class="g"></i>');
    const G = gl3(stage, { fov: 30, envTop: '#ffffff', envBot: '#8e9bb0', envInt: 1.0 });
    const { scene, cam } = G;
    const LOOK = new T3.Vector3(0, 0.5, 0);
    scene.add(new T3.HemisphereLight('#ffffff', '#9aa6ba', 0.75));
    const key = new T3.DirectionalLight('#ffffff', 2.1); key.position.set(-5, 9, 7); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 }); key.shadow.radius = 6; key.shadow.bias = -0.0004; scene.add(key);
    const floor = new T3.Mesh(new T3.PlaneGeometry(40, 40), new T3.ShadowMaterial({ opacity: 0.2 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -2.25; floor.receiveShadow = true; scene.add(floor);
    const COB = '#2f5bff';
    const steel = M.std('#d5dbe4', { metalness: 0.55, roughness: 0.32 }), metal = M.std('#c9ced4', { metalness: 1, roughness: 0.22 });
    // cabinet (top drawer) — body is open at the front, drawer slides out
    const CAB = new T3.Group(); scene.add(CAB);
    const bw = 3.5, bh = 1.5, bd = 2.6;
    mesh(new T3.BoxGeometry(bw, 0.08, bd), steel, CAB, [0, -bh / 2, 0]);
    mesh(new T3.BoxGeometry(bw, 0.08, bd), steel, CAB, [0, bh / 2, 0]);
    mesh(new T3.BoxGeometry(0.08, bh, bd), steel, CAB, [-bw / 2, 0, 0]);
    mesh(new T3.BoxGeometry(0.08, bh, bd), steel, CAB, [bw / 2, 0, 0]);
    mesh(new T3.BoxGeometry(bw, bh, 0.08), steel, CAB, [0, 0, -bd / 2]);
    mesh(new T3.BoxGeometry(bw, 2.2, bd), steel, CAB, [0, -bh / 2 - 1.1, 0]);
    mesh(rbox(3.3, 1.0, 0.1, 0.04), M.std('#c3cad4', { metalness: 0.5, roughness: 0.35 }), CAB, [0, -bh / 2 - 1.1, bd / 2 + 0.03]);
    mesh(rbox(1.0, 0.12, 0.12, 0.05), metal, CAB, [0, -bh / 2 - 1.0, bd / 2 + 0.12]);
    const DR = new T3.Group(); CAB.add(DR);
    const dw = 3.3, dh = 1.3, dd = 2.5;
    const front = mesh(rbox(dw + 0.1, dh + 0.1, 0.14, 0.05), M.phy('#f1f3f7', { roughness: 0.3 }), DR, [0, 0, dd / 2]);
    mesh(rbox(1.1, 0.16, 0.16, 0.07), M.phy(COB, { roughness: 0.3 }), DR, [0, -0.15, dd / 2 + 0.14]);
    const lab = textPlane((x, w, h) => { x.fillStyle = '#f7f9fc'; x.fillRect(0, 0, w, h); x.strokeStyle = '#9aa6ba'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6); x.font = '700 64px Clash'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#16213a'; x.fillText(de ? 'WOHNUNG 3' : 'UNIT 3', w / 2, h / 2 + 4); }, 512, 128, 0.9, 0.225);
    lab.position.set(0, 0.32, dd / 2 + 0.08); lab.material.depthWrite = true; DR.add(lab);
    mesh(new T3.BoxGeometry(dw, 0.05, dd), steel, DR, [0, -dh / 2 + 0.03, 0]);
    mesh(new T3.BoxGeometry(0.05, dh * 0.8, dd), steel, DR, [-dw / 2 + 0.03, -0.1, 0]);
    mesh(new T3.BoxGeometry(0.05, dh * 0.8, dd), steel, DR, [dw / 2 - 0.03, -0.1, 0]);
    mesh(new T3.BoxGeometry(dw, dh * 0.8, 0.05), steel, DR, [0, -0.1, -dd / 2 + 0.03]);
    const FCOL = ['#f2e6c9', '#e9eef6', '#f6d9cf', '#dfeadf', '#f2e6c9', '#e9eef6', '#ece3f5'];
    const folders = FCOL.map((c, i) => { const g = new T3.Group(); g.position.set(0, 0, -dd / 2 + 0.35 + i * 0.3); DR.add(g); mesh(new T3.BoxGeometry(dw - 0.2, 1.2, 0.025), M.std(c, { roughness: 0.85 }), g, [0, 0.05, 0]); mesh(new T3.BoxGeometry(0.6, 0.2, 0.026), M.std(i % 3 === 0 ? COB : i % 3 === 1 ? '#ffb31f' : '#1fbf72', { roughness: 0.6 }), g, [-1.1 + (i % 4) * 0.72, 0.72, 0]); return g; });
    // documents
    const rr = (x, X, Y, Wd, H, R) => { x.beginPath(); x.moveTo(X + R, Y); x.arcTo(X + Wd, Y, X + Wd, Y + H, R); x.arcTo(X + Wd, Y + H, X, Y + H, R); x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + Wd, Y, R); x.closePath(); };
    const line = (x, y, w0, c = '#dfe4ec') => { x.fillStyle = c; rr(x, 46, y, w0, 16, 8); x.fill(); };
    const docDraw = [
      (x, w, h) => {
        x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffb31f'; x.fillRect(0, 0, w, 18);
        x.font = '700 52px Clash'; x.fillStyle = '#16213a'; x.fillText(S.d0[0], 46, 100); x.fillText(S.d0[1], 46, 158);
        x.font = '700 26px Gothic'; x.fillStyle = '#7a879c'; x.fillText(de ? 'Wohnung 3 · 01.01.–31.12.2025' : 'Unit 3 · Jan 1 – Dec 31, 2025', 46, 204);
        S.rows0.forEach(([a, b], i) => { const y = 270 + i * 76; x.fillStyle = i % 2 ? '#ffffff' : '#f4f6fa'; x.fillRect(30, y - 46, w - 60, 72); x.font = '700 32px Gothic'; x.fillStyle = '#34405a'; x.fillText(a, 50, y); x.textAlign = 'right'; x.font = '700 34px Clash'; x.fillStyle = '#16213a'; x.fillText(b, w - 50, y); x.textAlign = 'left'; });
        x.fillStyle = '#16213a'; x.fillRect(30, 590, w - 60, 4);
        x.font = '700 36px Gothic'; x.fillText(S.tot0[0], 50, 650); x.textAlign = 'right'; x.font = '700 46px Clash'; x.fillStyle = COB; x.fillText(S.tot0[1], w - 50, 652); x.textAlign = 'left';
      },
      (x, w, h) => {
        x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = '#1fbf72'; x.fillRect(0, 0, w, 18);
        x.font = '700 52px Clash'; x.fillStyle = '#16213a'; x.fillText(S.d1[0], 46, 100); x.fillText(S.d1[1], 46, 158);
        S.rooms.forEach((r, i) => { const X = 46 + (i % 2) * 222, Y = 200 + Math.floor(i / 2) * 200; x.fillStyle = ['#d9cbb6', '#c4d3e6', '#d6e2cf', '#e6d5d0'][i]; rr(x, X, Y, 200, 150, 14); x.fill(); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(X + 30, Y + 90, 140, 10); x.font = '700 26px Gothic'; x.fillStyle = '#34405a'; x.fillText(r, X + 6, Y + 182); x.fillStyle = '#1fbf72'; x.beginPath(); x.arc(X + 176, Y + 26, 18, 0, 7); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 6; x.beginPath(); x.moveTo(X + 167, Y + 26); x.lineTo(X + 174, Y + 33); x.lineTo(X + 186, Y + 19); x.stroke(); });
        x.font = '700 30px Gothic'; x.fillStyle = '#34405a'; x.fillText(S.mtr, 46, 640);
        x.strokeStyle = '#16213a'; x.lineWidth = 3; x.beginPath(); x.moveTo(300, 650); x.bezierCurveTo(330, 600, 350, 670, 380, 630); x.bezierCurveTo(400, 610, 420, 660, 450, 630); x.stroke();
      },
      (x, w, h) => {
        x.fillStyle = '#fffdf8'; x.fillRect(0, 0, w, h); x.fillStyle = COB; x.fillRect(0, 0, w, 18);
        x.font = '700 58px Clash'; x.fillStyle = '#16213a'; x.textAlign = 'center'; x.fillText(S.d2[0], w / 2, 104); if (S.d2[1]) { x.font = '700 40px Clash'; x.fillText(S.d2[1], w / 2, 152); } x.textAlign = 'left';
        S.par.forEach((p, i) => { const y = 200 + i * 98; x.font = '700 28px Gothic'; x.fillStyle = '#16213a'; x.fillText(p, 46, y); line(x, y + 16, w - 92); line(x, y + 42, w - 160); });
        [46, 280].forEach((X, i) => { x.fillStyle = '#16213a'; x.fillRect(X, 640, 190, 3); x.font = '700 22px Gothic'; x.fillStyle = '#7a879c'; x.fillText(S.sig[i], X, 672); x.strokeStyle = COB; x.lineWidth = 3; x.beginPath(); x.moveTo(X + 10, 630); x.bezierCurveTo(X + 50, 580, X + 70, 650, X + 100, 610); x.bezierCurveTo(X + 120, 590, X + 140, 640, X + 175, 615); x.stroke(); });
        x.save(); x.translate(w - 90, 560); x.strokeStyle = COB; x.lineWidth = 5; x.beginPath(); x.arc(0, 0, 54, 0, 7); x.stroke(); x.beginPath(); x.arc(0, 0, 42, 0, 7); x.stroke(); x.font = '700 30px Clash'; x.fillStyle = COB; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('✓', 0, 2); x.restore();
      },
    ];
    const DOCS = docDraw.map((draw) => {
      const g = new T3.Group(); scene.add(g);
      const p = new T3.Group(); g.add(p);
      mesh(rbox(2.1, 2.9, 0.035, 0.015), M.std('#f4f5f7', { roughness: 0.9 }), p);
      const c = document.createElement('canvas'); c.width = 512; c.height = 708; const tex = new T3.CanvasTexture(c); tex.colorSpace = T3.SRGBColorSpace; tex.anisotropy = 8;
      READY.push(() => { draw(c.getContext('2d'), 512, 708); tex.needsUpdate = true; });
      const f = mesh(new T3.PlaneGeometry(2.04, 2.84), new T3.MeshStandardMaterial({ map: tex, roughness: 0.85 }), p, [0, 0, 0.019]); f.castShadow = false;
      return { g, p };
    });
    // giant numerals (3D type behind the docs)
    const NUM = ['3', '2', '1'].map((n) => { const m = textPlane((x, w, h) => { x.font = '700 900px Clash'; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = COB; x.fillText(n, w / 2, h - 110); }, 1024, 1024, 6.2, 6.2); m.position.set(-1.15, 1.75, -2.0); scene.add(m); return m; });
    const drawerOut = (t) => E.oc(seg(t, 0.15, 0.7)) * (1 - E.io(seg(t, K.turn + 0.1, 0.5)));
    perFrame((t) => {
      // cabinet entrance + drawer
      const ent = E.ob(seg(t, 0.0, 0.6), 1.2);
      CAB.position.set(0, -0.7 - (1 - ent) * 3 - 3.2 * E.ic(seg(t, K.turn + 0.45, 0.6)), 0);
      CAB.rotation.set(0, -0.28 + Math.sin(t * 0.5) * 0.03, 0);
      CAB.scale.setScalar(0.82);
      CAB.visible = t < K.turn + 1.1;
      DR.position.z = 1.45 * drawerOut(t);
      floor.position.y = -2.45;
      folders.forEach((f, i) => { f.rotation.x = -0.12 + 0.05 * Math.sin(t * 2 + i); });
      // documents
      DOCS.forEach((d, k) => {
        const t0 = NT[k] - 0.15, t1 = k < 2 ? NT[k + 1] - 0.2 : 1e9;
        const up = E.ob(seg(t, t0, 0.55), 1.3), back = E.io(seg(t, t1, 0.45));
        // inside drawer (local to world approx) -> presented -> filed back
        const base = { x: 0, y: -0.85, z: 1.3, rx: -1.45, ry: 0, rz: 0, s: 0.85 };
        const show = { x: 0.38, y: 1.4, z: 1.4, rx: -0.06, ry: -0.2 + Math.sin(t * 0.8 + k) * 0.05, rz: 0.03, s: 0.94 };
        let p = {};
        for (const q in base) p[q] = lerp(lerp(base[q], show[q], up), base[q], back);
        // fan after turn
        const fu = E.io(seg(t, K.turn - 0.05 + k * 0.06, 0.7));
        const fan = { x: (k - 1) * 1.35, y: 2.55 + (k === 1 ? 0.18 : 0), z: 1.2 + (k === 1 ? 0.3 : 0), rx: -0.04, ry: (1 - k) * 0.12, rz: (1 - k) * 0.12 + Math.sin(t * 1.1 + k) * 0.02, s: 0.56 };
        if (t > K.turn - 0.1) { const from = k < 2 ? base : show; for (const q in fan) p[q] = lerp(from[q], fan[q], fu); }
        apply(d.g, p);
        d.g.visible = (t > t0 && (back < 1 || t > K.turn - 0.1));
      });
      NUM.forEach((m, k) => {
        const a = E.oc(seg(t, NT[k] - 0.1, 0.35)) * (1 - E.ic(seg(t, (k < 2 ? NT[k + 1] : K.turn) - 0.25, 0.25)));
        m.visible = a > 0.01; m.material.opacity = a; m.scale.setScalar(0.7 + 0.3 * E.ob(seg(t, NT[k] - 0.1, 0.4), 2));
        m.rotation.y = -0.18;
      });
      const punch = NT.reduce((acc, nt) => acc + 0.35 * Math.exp(-Math.pow((t - nt) / 0.13, 2)), 0);
      cam.position.set(Math.sin(t * 0.3) * 0.35, 3.0, 15.5 - punch - 0.6 * E.oc(seg(t, 0.2, 3)));
      cam.lookAt(LOOK);
      G.r.render(scene, cam);
    });
    sfx('thud', 0.35, -8);
    sfx('binder', 0.3, -9);
    // hook: headline + stopwatch + alert
    const hk = el('div', 'x7hk', `<div class="h"><span>3</span>${S.head}</div><div class="s"><i class="sw"><i class="hd"></i></i><b>${S.sub}</b></div><div class="al">${S.alert}</div>`);
    tl.fromTo(hk.querySelector('.h'), { autoAlpha: 0, y: -50, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(2)' }, 0.1);
    tl.fromTo(hk.querySelector('.al'), { autoAlpha: 0, scale: 1.8, rotation: 6 }, { autoAlpha: 1, scale: 1, rotation: 3, duration: 0.22, ease: 'power4.in' }, K.alert - 0.05);
    tl.fromTo(hk.querySelector('.s'), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.4)' }, K.sec - 0.35);
    tl.fromTo(hk.querySelector('.hd'), { rotation: 0 }, { rotation: 720, duration: 2, ease: 'none' }, K.sec - 0.35);
    tl.to(hk, { autoAlpha: 0, y: -60, duration: 0.25, ease: 'power2.in' }, NT[0] - 0.3);
    sfx('sting', K.alert, -12);
    sfx('counter', K.sec - 0.3, -14);
    // context chips per number
    S.ctx.forEach((c, k) => {
      const ch = el('div', 'x7ctx', `<b>${3 - k}</b><span>${c}</span>`);
      tl.set(ch, { autoAlpha: 0, xPercent: -50 }, 0);
      tl.fromTo(ch, { autoAlpha: 0, y: -40, rotation: -4 }, { autoAlpha: 1, y: 0, rotation: -2, duration: 0.35, ease: 'back.out(2.2)', immediateRender: false }, NT[k] + 0.05);
      tl.to(ch, { autoAlpha: 0, y: -30, duration: 0.2 }, (k < 2 ? NT[k + 1] : K.turn) - 0.25);
      sfx('whoosh', NT[k] - 0.2, -11); sfx('unfold', NT[k] + 0.05, -12); sfx('pop', NT[k] + 0.1, -14);
    });
    // search card
    const card = el('div', 'x7card', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.card}</b><small>${S.cardS}</small></div></div><div class="bar"><i class="mg"></i><span class="q"></span><em class="cu"></em><b class="tm">⏱ ${S.tm}</b></div>` + S.res.map((r, i) => `<div class="rw r${i}"><span class="ic"></span><div><b>${r[0]}</b><small>${r[1]}</small></div><em>›</em></div>`).join('') + `<div class="ft"><span><i>✓</i>${S.r1}</span><span><i>✓</i>${S.r2}</span></div>`);
    tl.set(card, { autoAlpha: 0 }, 0);
    tl.fromTo(card, { autoAlpha: 0, y: 260, rotation: 3 }, { autoAlpha: 1, y: 0, rotation: 0, duration: 0.55, ease: 'power4.out', immediateRender: false }, K.turn + 0.2);
    sfx('whoosh', K.turn, -9);
    const rws = card.querySelectorAll('.rw');
    rws.forEach((r, i) => { tl.set(r, { autoAlpha: 0 }, 0); tl.fromTo(r, { autoAlpha: 0, x: 60 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power3.out', immediateRender: false }, K.turn + 0.55 + i * 0.14); sfx('pop', K.turn + 0.6 + i * 0.14, -15); });
    const fts = card.querySelectorAll('.ft span');
    tl.set(fts, { autoAlpha: 0 }, 0);
    tl.fromTo(fts, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', stagger: 0.2, immediateRender: false }, K.roles - 0.05);
    sfx('pop', K.roles, -12); sfx('pop', K.roles + 0.2, -12);
    const qEl = card.querySelector('.q'), cu = card.querySelector('.cu'), tm = card.querySelector('.tm');
    const tq0 = K.find - 0.45, tq1 = K.find + 0.25;
    perFrame((t) => { const n = Math.round(S.q.length * clamp((t - tq0) / (tq1 - tq0))); const s = S.q.slice(0, n); if (qEl.textContent !== s) qEl.textContent = s; cu.style.opacity = t > K.turn + 0.6 && Math.floor(t * 3) % 2 === 0 ? '1' : '0'; });
    sfx('typing', tq0, -14);
    tl.set(tm, { autoAlpha: 0 }, 0);
    tl.fromTo(tm, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, tq1 + 0.05);
    tl.to([rws[1], rws[2]], { opacity: 0.35, duration: 0.2 }, tq1);
    tl.fromTo(rws[0], { backgroundColor: 'rgba(47,91,255,0)' }, { backgroundColor: 'rgba(47,91,255,0.12)', duration: 0.2, immediateRender: false }, tq1);
    sfx('chime', tq1 + 0.05, -11);
    const lk = el('div', 'x7lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X8: heating 412 — kinetic: rolling number, statement line, tap, invoice behind it =================
  function X8() {
    const de = lang === 'de';
    // spoken amount -> one caption word ("412 €" / "$412")
    const mi = words.findIndex((w) => /^(vierhundertzwölf|four)$/i.test(w.text.replace(/[^a-zäöüß]/gi, '')));
    const mn = de ? 2 : 4;
    words.splice(mi, mn, { text: de ? '412 €.' : '$412.', start: words[mi].start, end: words[mi + mn - 1].end });
    const S = de ? {
      head: 'HEIZUNG', why: 'WOFÜR?', st: 'Nebenkostenabrechnung 2025', stS: 'Wohnung 3 · 01.01.–31.12.',
      rows: [['Grundsteuer', '210,40 €'], ['Müllabfuhr', '96,10 €'], ['Heizung', '412,00 €'], ['Wasser', '186,40 €'], ['Hausmeister', '140,00 €']], tot: ['Summe', '1.044,90 €'],
      inv: 'Rechnung · Wärme Nord GmbH', invS: 'Heizperiode 2025', il: [['Brennstoff (Gas)', '338,20 €'], ['Wartung Heizanlage', '41,30 €'], ['Messdienst', '32,50 €']], it: ['Anteil Wohnung 3', '412,00 €'],
      stamp: 'VOM VERMIETER GEPRÜFT', end: [['1', 'Zahl'], ['1', 'Beleg'], ['0', 'Streit']], tag: 'für Mieter & Vermieter',
    } : {
      head: 'HEATING', why: 'FOR WHAT?', st: 'Utility statement 2025', stS: 'Unit 3 · Jan 1 – Dec 31',
      rows: [['Property tax', '$210.40'], ['Trash', '$96.10'], ['Heating', '$412.00'], ['Water', '$186.40'], ['Caretaker', '$140.00']], tot: ['Total', '$1,044.90'],
      inv: 'Invoice · North Heat Co.', invS: 'Heating season 2025', il: [['Fuel (gas)', '$338.20'], ['Boiler service', '$41.30'], ['Metering', '$32.50']], it: ['Share for Unit 3', '$412.00'],
      stamp: 'CHECKED BY LANDLORD', end: [['1', 'number'], ['1', 'receipt'], ['0', 'fights']], tag: 'for tenants & landlords',
    };
    const K = {};
    K.num = words[mi].start;
    K.why = W(['wofür', 'what']).start;
    K.stat = W(['Abrechnung', 'statement']).start;
    K.zahl = W(['Zahl', 'number']).start;
    const it = W(['Mit', 'With']); K.turn = it.start;
    K.tap = W(['Position', 'line'], it.i).start;
    K.inv = W(['Rechnung', 'invoice'], it.i).start;
    K.chk = W(['geprüft', 'checked'], it.i).start;
    const ie = W(['Eine', 'One'], it.i); K.e1 = ie.start;
    K.e2 = W(['Beleg', 'receipt'], ie.i).start;
    K.e3 = W(['Streit', 'fight'], ie.i).start;
    const T = END + 2.1;
    const bg = el('div', 'x8bg', '<i class="c"></i><i class="r"></i><i class="fin"></i>');
    // HEIZUNG slam
    const hd = el('div', 'x8h', S.head);
    tl.set(hd, { xPercent: -50 }, 0);
    tl.fromTo(hd, { autoAlpha: 0, scale: 2.4 }, { autoAlpha: 1, scale: 1, duration: 0.28, ease: 'power4.in' }, 0.0);
    tl.to(hd, { y: -170, scale: 0.55, duration: 0.45, ease: 'power3.inOut' }, K.num - 0.35);
    tl.to(hd, { autoAlpha: 0, duration: 0.25 }, K.stat - 0.3);
    sfx('impact', 0.26, -8);
    // rolling number
    const H = 300, digs = [4, 1, 2];
    const col = (d) => `<span class="x8c"><span class="x8s">${[...Array(15)].map((_, k) => `<b>${k % 10}</b>`).join('')}</span></span>`;
    const num = el('div', 'x8n', `${de ? '' : '<span class="cur">$</span>'}${digs.map(col).join('')}${de ? '<span class="cur e">€</span>' : ''}`);
    const strips = num.querySelectorAll('.x8s');
    tl.set(num, { xPercent: -50 }, 0);
    tl.fromTo(num, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power3.out' }, K.num - 0.2);
    perFrame((t) => { strips.forEach((s, i) => { const u = E.o5(seg(t, K.num - 0.15 + i * 0.14, 0.95)); s.style.transform = `translateY(${-u * (10 + digs[i] - (digs[i] > 4 ? 10 : 0)) * H}px)`; }); });
    tl.to(num, { rotation: -4, scale: 1.04, duration: 0.25, ease: 'back.out(3)' }, K.why - 0.05);
    tl.to(num, { scale: 0.16, x: 250, y: 330, autoAlpha: 0, duration: 0.45, ease: 'power3.in' }, K.stat - 0.35);
    sfx('counter', K.num - 0.15, -10);
    sfx('thud', K.num + 0.85, -9);
    // WOFÜR? marquee rows
    const rows = [925, 1105, 1285].map((y, i) => el('div', 'x8why', Array(8).fill(S.why).join(' · '), stage, { top: `${y}px` }));
    rows.forEach((r, i) => { tl.set(r, { autoAlpha: 0 }, 0); tl.fromTo(r, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, immediateRender: false }, K.why - 0.1 + i * 0.06); tl.fromTo(r, { x: i % 2 ? -1500 : -300 }, { x: i % 2 ? -700 : -1100, duration: 2.4, ease: 'none', immediateRender: false }, K.why - 0.1); tl.to(r, { autoAlpha: 0, duration: 0.2 }, K.stat - 0.25); });
    sfx('sting', K.why - 0.05, -11);
    // statement card
    const st = el('div', 'x8st', `<div class="hd"><div><b>${S.st}</b><small>${S.stS}</small></div><span class="app"><img src="assets/logo.png">Tenance</span></div>` + S.rows.map((r, i) => `<div class="rw${i === 2 ? ' hz' : ''}"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('') + `<div class="tot"><span>${S.tot[0]}</span><b>${S.tot[1]}</b></div><svg class="x8rg" viewBox="0 0 400 140"><path pathLength="1" d="M 30 70 C 30 20, 360 10, 380 62 C 395 110, 120 135, 40 100 C 15 88, 20 60, 70 40"/></svg>`);
    const app = st.querySelector('.app'), ring = st.querySelector('.x8rg path'), hz = st.querySelector('.hz');
    tl.set(st, { autoAlpha: 0 }, 0);
    tl.fromTo(st, { autoAlpha: 0, scale: 1.3, y: -80 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: 'power3.out', immediateRender: false }, K.stat - 0.2);
    tl.fromTo(st.querySelectorAll('.rw,.tot'), { autoAlpha: 0, x: -40 }, { autoAlpha: 1, x: 0, duration: 0.25, stagger: 0.06, ease: 'power2.out', immediateRender: false }, K.stat);
    tl.set(st.querySelectorAll('.rw,.tot'), { autoAlpha: 0 }, 0);
    tl.set(app, { autoAlpha: 0 }, 0);
    tl.fromTo(app, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.5)', immediateRender: false }, K.turn + 0.05);
    tl.fromTo(ring, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' }, K.zahl - 0.2);
    tl.to(st.querySelector('.x8rg'), { autoAlpha: 0, duration: 0.2 }, K.turn);
    sfx('whoosh', K.stat - 0.25, -10); sfx('unfold', K.stat, -12); sfx('pop', K.zahl - 0.1, -11);
    // turn: background flips to calm cream
    tl.to(bg.querySelector('.r'), { autoAlpha: 0, duration: 0.35 }, K.turn - 0.1);
    tl.to(bg.querySelector('.fin'), { autoAlpha: 0.0, duration: 0.35 }, K.turn - 0.1);
    sfx('whoosh', K.turn - 0.15, -10);
    // tap
    const tap = el('div', 'x8tap', '<i class="rp"></i>');
    tl.set(tap, { autoAlpha: 0 }, 0);
    tl.fromTo(tap, { autoAlpha: 0, x: 760, y: 1500 }, { autoAlpha: 1, x: 720, y: 912, duration: 0.6, ease: 'power3.inOut', immediateRender: false }, K.tap - 0.65);
    tl.to(tap, { scale: 0.8, duration: 0.08, yoyo: true, repeat: 1 }, K.tap);
    tl.fromTo(tap.querySelector('.rp'), { scale: 0.3, autoAlpha: 0.9 }, { scale: 2.6, autoAlpha: 0, duration: 0.5, ease: 'power2.out' }, K.tap);
    tl.to(tap, { autoAlpha: 0, duration: 0.2 }, K.inv + 0.2);
    tl.fromTo(hz, { backgroundColor: 'rgba(255,90,31,0)' }, { backgroundColor: 'rgba(255,90,31,0.14)', duration: 0.2, immediateRender: false }, K.tap);
    sfx('pop', K.tap, -9);
    // invoice behind the line
    const inv = el('div', 'x8inv', `<div class="hd"><span class="pdf">PDF</span><div><b>${S.inv}</b><small>${S.invS}</small></div></div>` + S.il.map((l) => `<div class="ln"><span>${l[0]}</span><b>${l[1]}</b></div>`).join('') + `<div class="it"><span>${S.it[0]}</span><b>${S.it[1]}</b></div><div class="stp">✓ ${S.stamp}</div>`);
    tl.set(inv, { autoAlpha: 0 }, 0);
    tl.fromTo(inv, { autoAlpha: 0, rotationX: -88, transformPerspective: 1400 }, { autoAlpha: 1, rotationX: 0, duration: 0.55, ease: 'power3.out', immediateRender: false }, K.inv - 0.3);
    tl.fromTo(inv.querySelectorAll('.ln,.it'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.22, stagger: 0.09, immediateRender: false }, K.inv);
    tl.set(inv.querySelectorAll('.ln,.it'), { autoAlpha: 0 }, 0);
    sfx('receipts', K.inv - 0.3, -11);
    const stp = inv.querySelector('.stp');
    tl.set(stp, { autoAlpha: 0 }, 0);
    tl.fromTo(stp, { autoAlpha: 0, scale: 2.2, rotation: -2 }, { autoAlpha: 1, scale: 1, rotation: -7, duration: 0.22, ease: 'power4.in', immediateRender: false }, K.chk - 0.15);
    sfx('thud', K.chk + 0.06, -8); sfx('chime', K.chk + 0.1, -12);
    // ending: 1 number · 1 receipt · 0 fights
    tl.to([st, inv], { autoAlpha: 0, y: 160, scale: 0.92, duration: 0.35, ease: 'power2.in' }, K.e1 - 0.4);
    const ET = [K.e1, K.e2, K.e3];
    S.end.forEach((e, i) => {
      const ln = el('div', `x8end${i === 2 ? ' z' : ''}`, `<b>${e[0]}</b><span>${e[1]}</span>${i === 2 ? '<i>✓</i>' : ''}`, stage, { top: `${560 + i * 280}px` });
      tl.set(ln, { autoAlpha: 0, xPercent: -50 }, 0);
      tl.fromTo(ln, { autoAlpha: 0, scale: 1.8, y: -30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.24, ease: 'power4.in', immediateRender: false }, ET[i] - 0.12);
      sfx(i === 2 ? 'impact' : 'thud', ET[i] + 0.1, i === 2 ? -10 : -11);
    });
    const lk = el('div', 'x8lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('chime', END + 0.33, -12);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X9: dark stairwell — 3D cutaway at night, one report seen by all doors, lights back on =================
  function X9() {
    const de = lang === 'de';
    const S = de ? {
      clk: '17:00', dark: '🌑 stockdunkel', klick: 'KLICK.', tk: 'Treppenhaus-Licht defekt', tkS: 'gemeldet von Whg 4 · 17:04', known: 'Bekannt', care: '🔧 Hausmeister · morgen 8:00', done: '✓ Erledigt',
      seen: 'gesehen', doors: ['Whg 1', 'Whg 2', 'Whg 3', 'Whg 4', 'Whg 5', 'Whg 6'], dupA: '5×', dupB: '1×', dupL: 'Meldung', day: 'Mi · 17:00', tag: 'für Mieter & Vermieter',
    } : {
      clk: '5:00 PM', dark: '🌑 pitch dark', klick: 'CLICK.', tk: 'Stairwell light broken', tkS: 'reported by Unit 4 · 5:04 pm', known: 'Known', care: '🔧 Caretaker · tomorrow 8 am', done: '✓ Fixed',
      seen: 'seen', doors: ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5', 'Unit 6'], dupA: '5×', dupB: '1×', dupL: 'report', day: 'Wed · 5:00 PM', tag: 'for tenants & landlords',
    };
    const K = {};
    K.dark = W(['stockdunkel', 'pitch']).start;
    K.light = W(['Licht', 'light']).start;
    const it = W(['Mit', 'With']); K.turn = it.start;
    K.rep = W(['meldet', 'reports'], it.i).start;
    K.all = W(['alle', 'every'], it.i).start;
    K.known = W(['bekannt', 'known'], it.i).start;
    K.care = W(['Hausmeister', 'caretaker'], it.i).start;
    const ino = W(['Keine', 'No'], it.i); K.no = ino.start;
    K.dup = W(['Doppelmeldungen', 'duplicate'], ino.i).start;
    K.eve = W(['Abend', 'evening'], ino.i).start;
    K.hell = W(['hell', 'bright'], ino.i).start;
    const T = END + 2.1;
    el('div', 'x9bg', '<i class="st"></i>');
    const G = gl3(stage, { fov: 30, envTop: '#8a9ccc', envBot: '#1c2234', envInt: 0.45 });
    const { scene, cam, r } = G;
    r.shadowMap.enabled = false;
    const LOOK = new T3.Vector3(0, 3.25, 0);
    const hemi = new T3.HemisphereLight('#7f92c8', '#1a1f2e', 0.8); scene.add(hemi);
    const moon = new T3.DirectionalLight('#a9bcff', 1.35); moon.position.set(-5, 8, 9); scene.add(moon);
    const B = new T3.Group(); scene.add(B);
    const FH = 2.2, BW = 6.0;
    const wallM = M.std('#4a5470', { roughness: 0.95 }), slabM = M.std('#59617a', { roughness: 0.9 }), stepM = M.std('#6c7590', { roughness: 0.85 }), cutM = M.std('#1d2232', { roughness: 0.9 });
    const NIGHT = { wall: new T3.Color('#4a5470'), slab: new T3.Color('#646d88'), step: new T3.Color('#7a84a0') }, LIT = { wall: new T3.Color('#efe3cf'), slab: new T3.Color('#d8c8b0'), step: new T3.Color('#e6d7c0') };
    mesh(new T3.BoxGeometry(BW, FH * 3 + 0.3, 0.2), wallM, B, [0, FH * 1.5 - 0.1, -1.5]);
    [-1, 1].forEach((sg) => mesh(new T3.BoxGeometry(0.22, FH * 3 + 0.3, 2.9), cutM, B, [sg * (BW / 2 + 0.11), FH * 1.5 - 0.1, -0.15]));
    for (let f = 0; f <= 3; f++) mesh(new T3.BoxGeometry(BW, 0.22, f === 0 || f === 3 ? 2.9 : 1.7), f === 3 ? cutM : slabM, B, [0, f * FH - 0.11, f === 0 || f === 3 ? -0.15 : -0.75]);
    // stair flights (zig-zag) in the front strip
    for (let f = 0; f < 2; f++) {
      const dir = f % 2 ? 1 : -1, n = 12, run = (BW - 0.6) / n, rise = FH / n;
      for (let k = 0; k < n; k++) mesh(new T3.BoxGeometry(run + 0.04, 0.09, 1.0), stepM, B, [-dir * (BW / 2 - 0.3) + dir * (k + 0.5) * run, f * FH + rise * (k + 1) - 0.045, 0.6]);
      const str = mesh(new T3.BoxGeometry(Math.hypot(BW - 0.6, FH) + 0.1, 0.14, 0.9), cutM, B, [0, f * FH + FH / 2 - 0.16, 0.6]); str.rotation.z = dir * Math.atan2(FH, BW - 0.6);
      const rail = mesh(new T3.BoxGeometry(Math.hypot(BW - 0.6, FH) + 0.2, 0.06, 0.06), M.std('#c9ced4', { metalness: 0.8, roughness: 0.3 }), B, [0, f * FH + FH / 2 + 0.95, 1.08]);
      rail.rotation.z = dir * Math.atan2(FH, BW - 0.6);
    }
    // doors with plates, light switch, lamps, window
    const DOORS = [], LAMPS = [];
    const plate = (txt) => textPlane((x, w, h) => { x.fillStyle = '#f4f1ea'; x.fillRect(0, 0, w, h); x.font = '700 64px Clash'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#1d2232'; x.fillText(txt, w / 2, h / 2 + 4); }, 256, 96, 0.5, 0.19);
    for (let f = 0; f < 3; f++) {
      [-1.75, 1.75].forEach((x, j) => {
        const dm = mesh(rbox(0.95, 1.75, 0.1, 0.03), M.std(j ? '#7a4e36' : '#5c3b2a', { roughness: 0.6 }), B, [x, f * FH + 0.875, -1.36]);
        mesh(new T3.SphereGeometry(0.05, 12, 8), M.std('#d9c27a', { metalness: 1, roughness: 0.3 }), B, [x + (j ? -0.35 : 0.35), f * FH + 0.85, -1.29]);
        const p = plate(S.doors[f * 2 + j]); p.position.set(x, f * FH + 1.95, -1.39); B.add(p);
        DOORS.push(new T3.Vector3(x, f * FH + 2.05, -1.3));
      });
      const lm = new T3.MeshStandardMaterial({ color: '#2a2f3c', emissive: new T3.Color('#ffd9a0'), emissiveIntensity: 0, roughness: 0.4 });
      mesh(new T3.CylinderGeometry(0.32, 0.36, 0.1, 28), lm, B, [0, (f + 1) * FH - 0.27, -0.7]);
      const pl = new T3.PointLight('#ffcf8f', 0, 7, 1.6); pl.position.set(0, (f + 1) * FH - 0.6, -0.4); B.add(pl);
      LAMPS.push({ lm, pl });
    }
    const sw = new T3.Group(); sw.position.set(-1.0, FH + 1.15, -1.37); B.add(sw);
    mesh(new T3.BoxGeometry(0.16, 0.22, 0.04), M.std('#f2f2ee'), sw);
    const tog = mesh(new T3.BoxGeometry(0.06, 0.1, 0.05), M.std('#d9d9d4'), sw, [0, 0, 0.03]);
    [1, 2].forEach((f) => { mesh(new T3.BoxGeometry(0.7, 1.0, 0.06), new T3.MeshBasicMaterial({ color: '#1b2a5a' }), B, [0, f * FH - 1.25 + 0.0, -1.38]); mesh(new T3.CircleGeometry(0.08, 20), new T3.MeshBasicMaterial({ color: '#f3f0d8' }), B, [0.15, f * FH - 1.0, -1.34]); });
    // tenant with phone on floor 1
    const P = new T3.Group(); P.position.set(-0.55, FH, -0.7); B.add(P);
    mesh(new T3.CapsuleGeometry(0.2, 0.55, 6, 14), M.std('#e0603e', { roughness: 0.7 }), P, [0, 0.55, 0]);
    mesh(new T3.SphereGeometry(0.18, 20, 14), M.std('#f0c9a8', { roughness: 0.7 }), P, [0, 1.12, 0]);
    mesh(new T3.SphereGeometry(0.185, 20, 14, 0, Math.PI * 2, 0, 1.4), M.std('#3a2a22', { roughness: 0.8 }), P, [0, 1.15, -0.01]);
    const ph = mesh(new T3.BoxGeometry(0.12, 0.22, 0.02), new T3.MeshBasicMaterial({ color: '#cfe3ff' }), P, [0.12, 0.8, 0.22], [-0.5, -0.3, 0]);
    const glow = new T3.Sprite(new T3.SpriteMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(190,220,255,0.9)'); g.addColorStop(1, 'rgba(190,220,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T3.CanvasTexture(c); })(), blending: T3.AdditiveBlending, transparent: true, depthWrite: false })); glow.position.set(0.12, 0.85, 0.3); glow.scale.setScalar(0.9); P.add(glow);
    // seen badges anchored to doors
    const seen = DOORS.map((_, i) => (i === 3 ? null : el('div', 'x9seen', `<i>👁</i>${S.seen}`)));
    const v3 = new T3.Vector3();
    const proj = (p) => { v3.copy(p).applyMatrix4(B.matrixWorld).project(cam); return [(v3.x * 0.5 + 0.5) * 1080, (-v3.y * 0.5 + 0.5) * 1920]; };
    const lit = (t) => E.io(seg(t, K.hell - 0.55, 0.6));
    perFrame((t) => {
      // flicker on the switch press, then dark; next evening lamps on
      const press = t > K.light - 0.25 && t < K.light + 0.5;
      tog.rotation.x = press ? -0.5 : 0;
      const fl = (t > K.light - 0.2 && t < K.light - 0.1) || (t > K.light + 0.05 && t < K.light + 0.12) ? 0.6 : 0;
      const L = lit(t);
      LAMPS.forEach((l) => { l.lm.emissiveIntensity = Math.max(fl, L * 2.2); l.pl.intensity = Math.max(fl * 2, L * 9); });
      wallM.color.copy(NIGHT.wall).lerp(LIT.wall, L * 0.6); slabM.color.copy(NIGHT.slab).lerp(LIT.slab, L * 0.6); stepM.color.copy(NIGHT.step).lerp(LIT.step, L * 0.6);
      hemi.intensity = 0.8 + L * 0.2;
      // tenant: looks around, raises phone at report, leaves before next evening
      const up = E.io(seg(t, K.rep - 0.5, 0.4));
      ph.position.set(0.12, 0.8 + up * 0.3, 0.22); glow.position.set(0.12, 0.85 + up * 0.3, 0.3); glow.material.opacity = 0.5 + up * 0.5;
      P.rotation.y = -0.7 + Math.sin(t * 1.4) * 0.15 * (1 - up) + up * 0.7;
      P.visible = t < K.no - 0.2;
      // camera
      cam.position.set(Math.sin(t * 0.25) * 0.6, 4.6 + 0.3 * Math.sin(t * 0.2), 32 - 2.4 * E.oc(seg(t, 0, 4.5)) + 1.2 * E.io(seg(t, K.no - 0.3, 1.0)));
      cam.lookAt(LOOK);
      scene.updateMatrixWorld();
      seen.forEach((s, i) => { if (!s) return; const [x, y] = proj(DOORS[i]); s.style.left = `${x}px`; s.style.top = `${y}px`; });
      G.r.render(scene, cam);
    });
    // hook clock
    const clk = el('div', 'x9clk', `<b>${S.clk}</b><span>${S.dark}</span>`);
    tl.set(clk, { xPercent: -50 }, 0);
    tl.fromTo(clk.querySelector('b'), { autoAlpha: 0, y: -40, scale: 1.3 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'power3.out' }, 0.02);
    tl.fromTo(clk.querySelector('span'), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)' }, K.dark - 0.1);
    tl.to(clk, { autoAlpha: 0, y: -50, duration: 0.25 }, K.turn - 0.3);
    sfx('wind', 0.0, -18); sfx('impact', 0.05, -12);
    // click click
    const kl = [0, 1].map((i) => el('div', 'x9kl', S.klick, stage, { left: `${470 + i * 120}px`, top: `${790 - i * 70}px` }));
    kl.forEach((k, i) => { const tt = K.light - 0.25 + i * 0.32; tl.set(k, { autoAlpha: 0 }, 0); tl.fromTo(k, { autoAlpha: 0, scale: 1.6, rotation: -8 + i * 10 }, { autoAlpha: 1, scale: 1, duration: 0.12, ease: 'power3.out', immediateRender: false }, tt); tl.to(k, { autoAlpha: 0, duration: 0.25 }, K.turn - 0.2); sfx('pop', tt, -13); });
    sfx('buzz', K.light - 0.2, -16);
    // ticket card
    const tk = el('div', 'x9tk', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.tk}</b><small>${S.tkS}</small></div></div><div class="pl"><span class="kn">${S.known}</span><span class="cr">${S.care}</span><span class="dn">${S.done}</span></div>`);
    tl.set(tk, { autoAlpha: 0 }, 0);
    tl.fromTo(tk, { autoAlpha: 0, y: -220 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power4.out', immediateRender: false }, K.rep - 0.1);
    sfx('send', K.rep, -10);
    const kn = tk.querySelector('.kn'), cr = tk.querySelector('.cr'), dn = tk.querySelector('.dn');
    tl.set([kn, cr, dn], { autoAlpha: 0 }, 0);
    tl.fromTo(kn, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, K.known - 0.05);
    tl.fromTo(cr, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power3.out', immediateRender: false }, K.care - 0.05);
    tl.to([kn, cr], { autoAlpha: 0, duration: 0.2 }, K.hell - 0.3);
    tl.fromTo(dn, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, K.hell - 0.1);
    sfx('chime', K.known, -12); sfx('pop', K.care, -12);
    seen.forEach((s, i) => { if (!s) return; const tt = K.all - 0.1 + [0, 0.1, 0.2, 0, 0.3, 0.4][i]; tl.set(s, { autoAlpha: 0 }, 0); tl.fromTo(s, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(3)', immediateRender: false }, tt); tl.to(s, { autoAlpha: 0, duration: 0.2 }, K.no - 0.25); sfx('pop', tt, -16); });
    // 5x -> 1x
    const dup = el('div', 'x9dup', `<div class="a">${S.dupA}<i></i></div><div class="b">${S.dupB}</div><span>${S.dupL}</span>`);
    tl.set(dup, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(dup, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, K.no - 0.1);
    tl.fromTo(dup.querySelector('i'), { scaleX: 0 }, { scaleX: 1, duration: 0.2, ease: 'power2.out', immediateRender: false }, K.dup + 0.05);
    tl.set(dup.querySelector('i'), { scaleX: 0 }, 0);
    tl.set(dup.querySelector('.b'), { autoAlpha: 0 }, 0);
    tl.fromTo(dup.querySelector('.b'), { autoAlpha: 0, scale: 1.8 }, { autoAlpha: 1, scale: 1, duration: 0.22, ease: 'power4.in', immediateRender: false }, K.dup + 0.35);
    tl.to(dup, { autoAlpha: 0, y: -40, duration: 0.25 }, K.eve - 0.45);
    sfx('thud', K.dup + 0.1, -9); sfx('pop', K.dup + 0.45, -10);
    // next evening
    const day = el('div', 'x9day', S.day);
    tl.set(day, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(day, { autoAlpha: 0, rotationX: -90 }, { autoAlpha: 1, rotationX: 0, duration: 0.3, ease: 'power3.out', immediateRender: false }, K.eve - 0.3);
    sfx('refresh', K.eve - 0.3, -12); sfx('chime', K.hell, -10);
    const lk = el('div', 'x9lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X10: 5 winter deadlines — 3D flip calendar, pages flip 5..1, shared calendar card =================
  function X10() {
    const de = lang === 'de';
    const S = de ? {
      head: 'Winter-Fristen', miss: 'NICHT VERPASSEN', r1: 'Mieter', r2: 'Vermieter', cover: ['WINTER', '2026/27'],
      pages: [['OKT', '🔧', 'Heizungswartung', 'Vermieter'], ['NOV', '🍂', 'Dachrinne', 'Vermieter'], ['SCHNEE', '❄️', 'Winterdienst', 'laut Plan'], ['31.12.', '🔢', 'Zählerstand', 'Mieter'], ['2025', '📄', 'Nebenkosten-abrechnung', 'Vermieter']],
      card: 'Gemeinsamer Kalender', cardS: 'Wohnung 3 · Winter 2026/27', rows: [['Okt', 'Heizungswartung', 'Vermieter'], ['Nov', 'Dachrinne reinigen', 'Vermieter'], ['1. Schnee', 'Winterdienst-Plan', 'Alle'], ['31.12.', 'Zählerstand melden', 'Mieter'], ['bis 31.12.', 'Nebenkostenabrechnung', 'Vermieter']], tag: 'für Mieter & Vermieter',
    } : {
      head: 'winter deadlines', miss: "DON'T MISS", r1: 'Tenants', r2: 'Landlords', cover: ['WINTER', '2026/27'],
      pages: [['OCT', '🔧', 'Heating service', 'Landlord'], ['NOV', '🍂', 'Gutters', 'Landlord'], ['SNOW', '❄️', 'Snow duty', 'per rota'], ['12/31', '🔢', 'Meter reading', 'Tenant'], ['2025', '📄', 'Utility statement', 'Landlord']],
      card: 'Shared calendar', cardS: 'Unit 3 · Winter 2026/27', rows: [['Oct', 'Heating service', 'Landlord'], ['Nov', 'Clean gutters', 'Landlord'], ['1st snow', 'Snow duty rota', 'All'], ['Dec 31', 'Submit meter reading', 'Tenant'], ['by Dec 31', 'Utility statement', 'Landlord']], tag: 'for tenants & landlords',
    };
    const K = {};
    K.roles = W(['Mieter', 'tenants']).start;
    K.miss = W(['verpassen', 'miss']).start;
    const i5 = W(['Fünf', 'Five'], 0); K.n5 = i5.start;
    const i4 = W(['Vier', 'Four'], i5.i); K.n4 = i4.start;
    const i3 = W(['Drei', 'Three'], i4.i); K.n3 = i3.start;
    const i2 = W(['Zwei', 'Two'], i3.i); K.n2 = i2.start;
    const i1 = W(['Eins', 'One'], i2.i); K.n1 = i1.start;
    const it = W(['Mit', 'With'], i1.i); K.turn = it.start;
    K.all = W(['alle', 'every'], it.i).start;
    K.cal = W(['Kalender', 'calendar'], it.i).start;
    const T = END + 2.1;
    const NT = [K.n5, K.n4, K.n3, K.n2, K.n1];
    el('div', 'x10bg', '<i class="sn"></i>');
    const G = gl3(stage, { fov: 30, envTop: '#ffffff', envBot: '#9fb3c8', envInt: 1.0 });
    const { scene, cam } = G;
    const LOOK = new T3.Vector3(0, 0.35, 0);
    scene.add(new T3.HemisphereLight('#ffffff', '#a9bccf', 0.8));
    const key = new T3.DirectionalLight('#ffffff', 2.0); key.position.set(-4, 8, 7); key.castShadow = true; key.shadow.mapSize.set(1536, 1536);
    Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 25 }); key.shadow.radius = 6; key.shadow.bias = -0.0004; scene.add(key);
    const floor = new T3.Mesh(new T3.PlaneGeometry(40, 40), new T3.ShadowMaterial({ opacity: 0.2 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -2.05; floor.receiveShadow = true; scene.add(floor);
    const NAVY = '#0f2a4a', RED = '#ff5a3c';
    const CAL = new T3.Group(); scene.add(CAL);
    const PW = 3.0, PH = 3.375;
    mesh(rbox(3.3, 3.75, 0.9, 0.12), M.std('#f3f5f8', { roughness: 0.6 }), CAL, [0, 0, -0.05]);
    mesh(rbox(3.4, 0.5, 1.0, 0.16), M.phy(NAVY, { roughness: 0.35 }), CAL, [0, 1.95, -0.05]);
    [-1.0, -0.35, 0.35, 1.0].forEach((x) => mesh(new T3.TorusGeometry(0.13, 0.04, 10, 24), M.std('#c9ced4', { metalness: 1, roughness: 0.22 }), CAL, [x, 1.72, 0.42], [0, Math.PI / 2, 0]));
    const rr = (x, X, Y, Wd, H, R) => { x.beginPath(); x.moveTo(X + R, Y); x.arcTo(X + Wd, Y, X + Wd, Y + H, R); x.arcTo(X + Wd, Y + H, X, Y + H, R); x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + Wd, Y, R); x.closePath(); };
    const pageTex = (draw) => { const c = document.createElement('canvas'); c.width = 512; c.height = 576; const tex = new T3.CanvasTexture(c); tex.colorSpace = T3.SRGBColorSpace; tex.anisotropy = 8; READY.push(() => { draw(c.getContext('2d'), 512, 576); tex.needsUpdate = true; }); return tex; };
    const drawCover = (x, w, h) => { x.fillStyle = NAVY; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 40; i++) { x.beginPath(); x.arc((i * 97) % w, (i * 151) % h, 3 + (i % 4), 0, 7); x.fill(); } x.textAlign = 'center'; x.font = '120px "Noto Color Emoji"'; x.fillText('❄️', w / 2, 230); x.font = '700 96px Clash'; x.fillStyle = '#fff'; x.fillText(S.cover[0], w / 2, 380); x.font = '700 64px Clash'; x.fillStyle = '#9fc4ff'; x.fillText(S.cover[1], w / 2, 460); };
    const drawPage = (k) => (x, w, h) => {
      const [m, ic, ti, who] = S.pages[k];
      x.fillStyle = '#fffdf9'; x.fillRect(0, 0, w, h);
      x.fillStyle = RED; x.fillRect(0, 0, w, 96);
      x.font = '700 50px Clash'; x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.fillText((de ? 'FRIST ' : 'DEADLINE ') + (5 - k), 30, 52);
      x.textBaseline = 'alphabetic'; x.textAlign = 'center';
      if (/^[A-Z0-9./]+$/.test(m)) { x.font = '700 190px Clash'; const fs = Math.min(190, 190 * 380 / x.measureText(m).width); x.font = `700 ${fs}px Clash`; x.fillStyle = NAVY; x.fillText(m, w / 2, 300 - (190 - fs) * 0.3); }
      else { x.font = '170px "Noto Color Emoji"'; x.fillText(m, w / 2, 300); }
      if (ic) { x.font = '64px "Noto Color Emoji"'; x.fillText(ic, w - 70, 190); }
      const tl2 = ti.split('-'); x.fillStyle = NAVY; x.font = `700 ${tl2.length > 1 ? 50 : 56}px Clash`;
      if (tl2.length > 1) { x.fillText(tl2[0] + '-', w / 2, 390); x.fillText(tl2[1], w / 2, 444); } else x.fillText(ti, w / 2, 410);
      x.font = '700 30px Gothic'; const tw = x.measureText(who).width + 48; rr(x, w / 2 - tw / 2, 480, tw, 56, 28); x.fillStyle = '#e6eef7'; x.fill(); x.fillStyle = '#3d5878'; x.fillText(who, w / 2, 518);
    };
    const PAGES = [drawCover, ...[0, 1, 2, 3, 4].map(drawPage)].map((draw, k) => {
      const hinge = new T3.Group(); hinge.position.set(0, 1.62, 0.405 + (5 - k) * 0.006); CAL.add(hinge);
      const fm = new T3.MeshStandardMaterial({ map: pageTex(draw), roughness: 0.85, transparent: true });
      const f = new T3.Mesh(new T3.PlaneGeometry(PW, PH), fm); f.position.y = -PH / 2; f.receiveShadow = true; hinge.add(f);
      const bm = new T3.MeshStandardMaterial({ color: '#eef1f5', roughness: 0.9, transparent: true });
      const b = new T3.Mesh(new T3.PlaneGeometry(PW, PH), bm); b.position.y = -PH / 2; b.rotation.y = Math.PI; hinge.add(b);
      return { hinge, fm, bm };
    });
    const FT = [NT[0], NT[1], NT[2], NT[3], NT[4]].map((t) => t - 0.32);
    perFrame((t) => {
      const ent = E.ob(seg(t, 0.0, 0.6), 1.3);
      const tu = E.io(seg(t, K.turn - 0.05, 0.7));
      CAL.position.set(lerp(0, 0, tu), -0.25 + (1 - ent) * 4 + tu * 2.75, lerp(0, -1.0, tu));
      CAL.scale.setScalar(lerp(1, 0.5, tu));
      CAL.rotation.set(0.05, -0.26 + Math.sin(t * 0.6) * 0.04 + tu * 0.2, lerp(0, 0.06, tu));
      PAGES.forEach((p, k) => {
        if (k === 5) return;
        const u = E.io(seg(t, FT[k], 0.5));
        p.hinge.rotation.x = -u * Math.PI * 0.92;
        const away = E.ic(seg(t, FT[k] + 0.35, 0.4));
        p.hinge.position.y = 1.62 + away * 2.2; p.hinge.position.z = 0.405 + (5 - k) * 0.006 + away * 1.5;
        p.fm.opacity = p.bm.opacity = 1 - away;
        p.hinge.visible = away < 0.99;
      });
      const punch = NT.reduce((acc, nt) => acc + 0.3 * Math.exp(-Math.pow((t - nt) / 0.13, 2)), 0);
      cam.position.set(Math.sin(t * 0.3) * 0.3, 2.4, 15.5 - punch);
      cam.lookAt(LOOK);
      G.r.render(scene, cam);
    });
    sfx('thud', 0.45, -8);
    // hook
    const hk = el('div', 'x10hk', `<div class="h"><span>5</span>${S.head}</div><div class="rl"><span>${S.r1}</span><i>&amp;</i><span>${S.r2}</span></div><div class="ms">${S.miss}</div>`);
    tl.fromTo(hk.querySelector('.h'), { autoAlpha: 0, y: -50 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'back.out(2)' }, 0.1);
    tl.fromTo(hk.querySelectorAll('.rl > *'), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, stagger: 0.18, ease: 'back.out(2.4)' }, K.roles - 0.05);
    tl.fromTo(hk.querySelector('.ms'), { autoAlpha: 0, scale: 1.8, rotation: 6 }, { autoAlpha: 1, scale: 1, rotation: -3, duration: 0.22, ease: 'power4.in' }, K.miss - 0.05);
    tl.to(hk, { autoAlpha: 0, y: -60, duration: 0.25, ease: 'power2.in' }, NT[0] - 0.35);
    sfx('pop', K.roles, -13); sfx('pop', K.roles + 0.18, -13); sfx('sting', K.miss, -11);
    // progress dots 5..1
    const pr = el('div', 'x10pr', [5, 4, 3, 2, 1].map((n) => `<b>${n}</b>`).join(''));
    tl.set(pr, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(pr, { autoAlpha: 0, y: -30 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }, NT[0] - 0.2);
    tl.to(pr, { autoAlpha: 0, duration: 0.2 }, K.turn - 0.1);
    pr.querySelectorAll('b').forEach((b, k) => { tl.fromTo(b, { backgroundColor: 'rgba(15,42,74,0.12)', color: '#0f2a4a', scale: 1 }, { backgroundColor: RED, color: '#ffffff', scale: 1.15, duration: 0.2, immediateRender: false }, NT[k]); tl.to(b, { scale: 1, duration: 0.2 }, NT[k] + 0.25); sfx('unfold', FT[k], -10); sfx('pop', NT[k] + 0.05, -13); });
    // shared calendar card
    const card = el('div', 'x10card', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.card}</b><small>${S.cardS}</small></div><span class="av"><i>M</i><i>V</i></span></div>` + S.rows.map((r) => `<div class="rw"><span class="dt">${r[0]}</span><b>${r[1]}</b><em>${r[2]}</em><i class="x10bl">🔔</i></div>`).join(''));
    tl.set(card, { autoAlpha: 0 }, 0);
    tl.fromTo(card, { autoAlpha: 0, y: 240 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power4.out', immediateRender: false }, K.turn + 0.1);
    sfx('whoosh', K.turn - 0.1, -9);
    const rws = card.querySelectorAll('.rw');
    tl.set(rws, { autoAlpha: 0 }, 0);
    tl.fromTo(rws, { autoAlpha: 0, x: 50 }, { autoAlpha: 1, x: 0, duration: 0.28, stagger: 0.12, ease: 'power3.out', immediateRender: false }, K.all - 0.25);
    rws.forEach((r, i) => sfx('pop', K.all - 0.2 + i * 0.12, -16));
    const bls = card.querySelectorAll('.x10bl');
    tl.set(bls, { scale: 0 }, 0);
    tl.fromTo(bls, { scale: 0 }, { scale: 1, duration: 0.25, stagger: 0.06, ease: 'back.out(3)', immediateRender: false }, K.cal);
    sfx('chime', K.cal, -11);
    const lk = el('div', 'x10lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X22 (feature): repair sign-off — work order stamp, dripping tap, before/after slider =================
  function X22() {
    const de = lang === 'de';
    const S = de ? {
      wo: 'Auftrag #2417 · Wohnung 3', woT: 'Wasserhahn Küche tropft', woS: 'Müller Sanitär · heute 10:40', stamp: 'ERLEDIGT', q: 'WIRKLICH?',
      ph: 'Reparatur bestätigen', phS: 'Wasserhahn Küche · Wohnung 3', before: 'VORHER', after: 'NACHHER', btn: 'Bestätigen', ok: '✓ Bestätigt von Mieterin',
      tk: 'Ticket', open: 'Offen', closed: '🔒 Geschlossen', inv: 'Rechnung 148,00 €', paid: '✓ Bezahlt',
      e1: 'ERLEDIGT', e2: 'heißt', e3: 'WIRKLICH ERLEDIGT', tag: 'für Mieter & Vermieter',
    } : {
      wo: 'Work order #2417 · Unit 3', woT: 'Kitchen tap dripping', woS: 'Miller Plumbing · today 10:40 am', stamp: 'DONE', q: 'REALLY?',
      ph: 'Confirm repair', phS: 'Kitchen tap · Unit 3', before: 'BEFORE', after: 'AFTER', btn: 'Confirm', ok: '✓ Confirmed by tenant',
      tk: 'Ticket', open: 'Open', closed: '🔒 Closed', inv: 'Invoice $148.00', paid: '✓ Paid',
      e1: 'DONE', e2: 'means', e3: 'ACTUALLY DONE', tag: 'for tenants & landlords',
    };
    const K = {};
    K.done = W(['erledigt', 'done']).start;
    K.hw = W(['Handwerker', 'contractor']).start;
    K.aber = W(['Aber', 'But']).start;
    K.wirk = W(['wirklich', 'really']).start;
    const it = W(['Mit', 'With']); K.turn = it.start;
    K.conf = W(['bestätigt', 'confirms'], it.i).start;
    K.photo = W(['Vorher-Nachher-Foto', 'before'], it.i).start;
    K.close = W(['schließt', 'close'], it.i).start;
    K.ticket = W(['Ticket', 'ticket'], it.i).start;
    K.pay = W(['zahlt', 'pay'], it.i).start;
    K.inv = W(['Rechnung', 'invoice'], it.i).start;
    const ie = W(['Erledigt', 'Done'], it.i); K.e1 = ie.start;
    K.e2 = W(['wirklich', 'actually'], ie.i).start;
    K.e3 = W(['erledigt', 'done'], ie.i).start;
    const T = END + 2.1;
    el('div', 'x22bg', '<i class="pg"></i>');
    // tap illustration (SVG) used in the hook and in the before/after photos
    const tap = (wet) => `<svg viewBox="0 0 400 320" class="x22tap"><defs><linearGradient id="ch${wet ? 1 : 0}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f4f6f8"/><stop offset=".5" stop-color="#aab3bd"/><stop offset="1" stop-color="#7d8792"/></linearGradient></defs>
      <rect x="0" y="0" width="400" height="320" fill="${wet ? '#dfe7ee' : '#e9f2f6'}"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${(i % 3) * 134}" y="${Math.floor(i / 3) * 110}" width="132" height="108" fill="none" stroke="#c7d2db" stroke-width="3"/>`).join('')}
      <rect x="0" y="236" width="400" height="84" fill="#b9c3cc"/><rect x="60" y="236" width="280" height="22" rx="8" fill="#9aa6b2"/>
      <rect x="182" y="70" width="36" height="70" rx="10" fill="url(#ch${wet ? 1 : 0})"/><path d="M200 78 Q200 40 250 40 L300 40 Q318 40 318 58 L318 96 L292 96 L292 66 L250 66 Q226 66 226 88 Z" fill="url(#ch${wet ? 1 : 0})"/>
      <rect x="160" y="52" width="80" height="16" rx="8" fill="#8f99a4"/><rect x="286" y="96" width="38" height="12" rx="4" fill="#7d8792"/>
      ${wet ? '<path d="M0 0 Q70 30 60 110 Q50 170 110 236 L0 236Z" fill="#8a7d5a" opacity=".32"/><ellipse cx="300" cy="268" rx="130" ry="20" fill="#3d8ef0" opacity=".75"/><ellipse cx="270" cy="264" rx="60" ry="7" fill="#bfe0ff" opacity=".8"/><g fill="#3d8ef0"><ellipse cx="305" cy="140" rx="7" ry="10"/><ellipse cx="305" cy="185" rx="6" ry="9" opacity=".8"/><ellipse cx="305" cy="226" rx="5" ry="8" opacity=".6"/></g><rect x="14" y="180" width="150" height="44" rx="22" fill="#e8432d"/><text x="89" y="210" font-family="Gothic" font-weight="700" font-size="24" fill="#fff" text-anchor="middle">' + (de ? 'tropft' : 'dripping') + '</text>' : '<g stroke="#fff" stroke-width="10" opacity=".5"><path d="M40 20 L120 100"/><path d="M200 10 L260 70"/></g><g fill="#fff"><path d="M120 150 l9 -27 l9 27 l27 9 l-27 9 l-9 27 l-9 -27 l-27 -9z"/><path d="M335 165 l6 -18 l6 18 l18 6 l-18 6 l-6 18 l-6 -18 l-18 -6z"/><path d="M250 205 l4 -12 l4 12 l12 4 l-12 4 l-4 12 l-4 -12 l-12 -4z"/></g><circle cx="350" cy="44" r="30" fill="#1fbf72"/><path d="M336 44 l10 10 l20 -20" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/>'}</svg>`;
    // hook: work order with DONE stamp
    const wo = el('div', 'x22wo', `<small>${S.wo}</small><b>${S.woT}</b><span>${S.woS}</span><div class="stp">${S.stamp} <i>✓</i></div>`);
    const stp = wo.querySelector('.stp'), sti = stp.querySelector('i');
    tl.set(wo, { xPercent: -50 }, 0);
    tl.fromTo(wo, { autoAlpha: 0, y: 80, rotation: 3 }, { autoAlpha: 1, y: 0, rotation: -1.5, duration: 0.4, ease: 'power3.out' }, 0.02);
    tl.set(stp, { autoAlpha: 0 }, 0);
    tl.fromTo(stp, { autoAlpha: 0, scale: 2.6, rotation: -4 }, { autoAlpha: 1, scale: 1, rotation: -9, duration: 0.2, ease: 'power4.in', immediateRender: false }, K.done - 0.1);
    sfx('thud', K.done + 0.1, -7);
    tl.to(stp, { filter: 'grayscale(1)', opacity: 0.45, duration: 0.3 }, K.aber - 0.05);
    tl.to(sti, { rotationY: 90, duration: 0.15 }, K.wirk - 0.25);
    tl.call(() => {}, null, K.wirk - 0.1);
    const qm = el('div', 'x22q', S.q);
    tl.set(qm, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(qm, { autoAlpha: 0, scale: 2, rotation: 8 }, { autoAlpha: 1, scale: 1, rotation: 4, duration: 0.22, ease: 'power4.in', immediateRender: false }, K.wirk - 0.1);
    sfx('sting', K.wirk - 0.05, -11);
    // dripping tap (still broken)
    const drip = el('div', 'x22drip', `${tap(true)}<div class="dr">${[0, 1, 2].map(() => '<i></i>').join('')}</div>`);
    const drops = drip.querySelectorAll('.dr i');
    tl.set(drip, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(drip, { autoAlpha: 0, y: 120 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out', immediateRender: false }, K.aber - 0.1);
    perFrame((t) => { drops.forEach((d, i) => { const u = ((t * 1.3 + i / 3) % 1); d.style.transform = `translateY(${E.ic(u) * 150}px) scale(${0.6 + 0.4 * Math.min(1, u * 4)})`; d.style.opacity = u > 0.92 ? 0 : 1; }); });
    [0, 1, 2, 3].forEach((i) => sfx('drip', K.aber + 0.1 + i * 0.75, -12));
    tl.to([wo, qm, drip], { autoAlpha: 0, y: -160, duration: 0.35, ease: 'power2.in', stagger: 0.04 }, K.turn - 0.3);
    // phone panel with before/after slider
    const ph = el('div', 'x22ph', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.ph}</b><small>${S.phS}</small></div></div>
      <div class="ba"><div class="pb">${tap(true)}<em>${S.before}</em></div><div class="pa">${tap(false)}<em>${S.after}</em></div><div class="hn"><i></i></div></div>
      <div class="bt"><span class="b0">${S.btn}</span><span class="b1">${S.ok}</span></div>
      <div class="x22st"><div class="r"><span>${S.tk}</span><b class="o">${S.open}</b><b class="c">${S.closed}</b></div><div class="r"><span>${S.inv}</span><b class="o">—</b><b class="c pd">${S.paid}</b></div></div>`);
    const pa = ph.querySelector('.pa'), hn = ph.querySelector('.hn'), b0 = ph.querySelector('.b0'), b1 = ph.querySelector('.b1');
    tl.set(ph, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(ph, { autoAlpha: 0, y: 260, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.2, -9);
    const s0 = K.photo - 0.35, s1 = s0 + 1.3;
    perFrame((t) => { const u = E.io(seg(t, s0, s1 - s0)); const x = 4 + u * 92; pa.style.clipPath = `inset(0 0 0 ${100 - x}%)`; hn.style.left = `${100 - x}%`; hn.style.opacity = t > s0 - 0.3 && t < s1 + 0.6 ? 1 : 0; });
    sfx('unfold', s0, -12); sfx('shutter', K.conf, -9);
    tl.set(b1, { autoAlpha: 0 }, 0);
    tl.to(b0, { autoAlpha: 0, duration: 0.15 }, s1 + 0.15);
    tl.fromTo(b1, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.6)', immediateRender: false }, s1 + 0.2);
    sfx('chime', s1 + 0.25, -11);
    const rows = ph.querySelectorAll('.x22st .r');
    tl.set(rows, { autoAlpha: 0 }, 0);
    tl.fromTo(rows, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.3, stagger: 0.12, ease: 'power3.out', immediateRender: false }, K.close - 0.4);
    const flip = (r, tt) => { tl.set(r.querySelector('.c'), { autoAlpha: 0 }, 0); tl.to(r.querySelector('.o'), { autoAlpha: 0, duration: 0.12 }, tt); tl.fromTo(r.querySelector('.c'), { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, tt + 0.05); };
    flip(rows[0], K.ticket); flip(rows[1], K.inv);
    sfx('pop', K.ticket + 0.05, -10); sfx('kaching', K.inv, -9);
    // ending: DONE means ACTUALLY DONE
    tl.to(ph, { autoAlpha: 0, scale: 0.9, y: -80, duration: 0.35, ease: 'power2.in' }, K.e1 - 0.4);
    const end = el('div', 'x22end', `<b class="a">${S.e1}</b><span>${S.e2}</span><b class="c" style="font-size:${S.e3.length > 12 ? 70 : S.e3.length > 9 ? 86 : 104}px">${S.e3}<i>✓</i></b>`);
    const [ea, eb, ec] = end.children;
    tl.set(end, { xPercent: -50 }, 0);
    tl.set([ea, eb, ec], { autoAlpha: 0 }, 0);
    tl.fromTo(ea, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power3.out', immediateRender: false }, K.e1 - 0.1);
    tl.fromTo(eb, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, immediateRender: false }, K.e1 + 0.45);
    tl.fromTo(ec, { autoAlpha: 0, scale: 1.8 }, { autoAlpha: 1, scale: 1, duration: 0.24, ease: 'power4.in', immediateRender: false }, K.e2 - 0.1);
    tl.fromTo(ec.querySelector('i'), { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, K.e3);
    tl.set(ec.querySelector('i'), { scale: 0 }, 0);
    sfx('thud', K.e2 + 0.06, -9); sfx('impact', K.e3 + 0.05, -10);
    const lk = el('div', 'x22lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('chime', END + 0.33, -12);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X23 (feature): away / frost mode — postcard, frost creeping in, away card, thermostat to ❄ =================
  function X23() {
    const de = lang === 'de';
    const S = de ? {
      hd: '2 Wochen Skiurlaub', pc: 'Grüße aus Tirol', tmp: '−10 °C', apt: 'Wohnung 3 · leer', t0: 19, t1: 9, unit: '°C',
      app: 'Abwesenheit melden', appS: 'Wohnung 3', dates: '20.12. – 03.01.', away: 'Abwesend', ll: 'Vermieter informiert', seen: '✓ gesehen',
      rem: 'Erinnerung an beide', remT: 'Heizung auf Frostschutz ❄', dial: 'Frostschutz an', pipe: 'Rohrbruch', back: 'Willkommen zurück · 19 °C', tag: 'für Mieter & Vermieter',
    } : {
      hd: '2 weeks of ski vacation', pc: 'Greetings from the Alps', tmp: '14 °F', apt: 'Unit 3 · empty', t0: 66, t1: 48, unit: '°F',
      app: 'Report absence', appS: 'Unit 3', dates: 'Dec 20 – Jan 3', away: 'Away', ll: 'Landlord notified', seen: '✓ seen',
      rem: 'Reminder to both', remT: 'Heating on frost protection ❄', dial: 'Frost protection on', pipe: 'Burst pipe', back: 'Welcome back · 66 °F', tag: 'for tenants & landlords',
    };
    const K = {};
    K.ski = W(['Skiurlaub', 'ski']).start;
    K.minus = W(['minus', 'freezing']).start;
    K.leer = W(['Wohnung', 'apartment']).start;
    const it = W(['Mit', 'With']); K.turn = it.start;
    K.rep = W(['meldet', 'reports'], it.i).start;
    K.abs = W(['Abwesenheit', 'absence'], it.i).start;
    K.ll = W(['Vermieter', 'landlord'], it.i).start;
    K.both = W(['beide', 'both'], it.i).start;
    K.rem = W(['Erinnerung', 'reminder'], it.i).start;
    K.frost = W(['Frostschutz', 'frost'], it.i).start;
    K.pipe = W(['Rohre', 'pipes'], it.i).start;
    K.wake = W(['Erwachen', 'surprise'], it.i).start;
    const T = END + 2.1;
    const bg = el('div', 'x23bg', `<i class="fr">${[[60,140],[920,120],[40,700],[960,640],[80,1320],[930,1280],[500,60],[300,1560],[760,1580]].map(([x,y],i)=>`<b style="left:${x}px;top:${y}px;font-size:${60+(i%3)*24}px">❄</b>`).join('')}</i>`);
    const fr = bg.querySelector('.fr');
    tl.fromTo(fr, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out' }, K.minus - 0.1);
    tl.to(fr, { opacity: 0, duration: 1.0, ease: 'power2.inOut' }, K.frost);
    sfx('wind', K.minus - 0.2, -16); sfx('shiver', K.minus + 0.2, -12);
    // hook: headline + postcard
    const hd = el('div', 'x23hd', S.hd, stage, de ? {} : { fontSize: '76px' });
    tl.set(hd, { xPercent: -50 }, 0);
    tl.fromTo(hd, { autoAlpha: 0, y: -50 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'back.out(2)' }, 0.05);
    const pc = el('div', 'x23pc', `<svg viewBox="0 0 860 520"><defs><linearGradient id="x23sk" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5aa9f0"/><stop offset="1" stop-color="#cfe8ff"/></linearGradient></defs><rect width="860" height="520" fill="url(#x23sk)"/><circle cx="690" cy="110" r="56" fill="#ffe27a"/>
      <path d="M0 400 L180 170 L300 300 L450 120 L620 330 L720 230 L860 380 L860 520 L0 520Z" fill="#7d93b2"/><path d="M180 170 L225 228 L195 222 L160 250 L140 222Z M450 120 L505 190 L470 180 L440 205 L410 172Z M720 230 L760 278 L735 272 L705 290Z" fill="#fff"/>
      <path d="M0 450 Q300 360 860 470 L860 520 L0 520Z" fill="#f4f8fc"/><g transform="translate(470 380) rotate(-18)"><rect x="-60" y="18" width="120" height="8" rx="4" fill="#e8432d"/><circle cx="0" cy="-34" r="12" fill="#12315e"/><path d="M-8 -22 L10 -22 L16 14 L-12 14Z" fill="#e8432d"/><path d="M-12 14 L-22 20 M16 14 L24 20" stroke="#12315e" stroke-width="6"/></g></svg><b>${S.pc}</b><i class="x23stmp"></i>`);
    tl.set(pc, { xPercent: -50 }, 0);
    tl.fromTo(pc, { autoAlpha: 0, y: 260, rotation: 6 }, { autoAlpha: 1, y: 0, rotation: -3, duration: 0.55, ease: 'power3.out' }, 0.1);
    sfx('whoosh', 0.05, -10);
    const tmp = el('div', 'x23tmp', S.tmp);
    tl.set(tmp, { autoAlpha: 0 }, 0);
    tl.fromTo(tmp, { autoAlpha: 0, scale: 2, rotation: 8 }, { autoAlpha: 1, scale: 1, rotation: 4, duration: 0.25, ease: 'power4.in', immediateRender: false }, K.minus - 0.05);
    sfx('thud', K.minus + 0.2, -10);
    tl.to([hd, pc, tmp], { autoAlpha: 0, y: -200, duration: 0.4, ease: 'power2.in', stagger: 0.04 }, K.leer - 0.35);
    // empty apartment at night, temperature falling
    const apt = el('div', 'x23apt', `<svg viewBox="0 0 860 560"><rect width="860" height="560" fill="#1a2440"/><rect x="0" y="420" width="860" height="140" fill="#2a3556"/>
      <rect x="520" y="70" width="240" height="250" rx="8" fill="#0d1428" stroke="#3b4a72" stroke-width="12"/><circle cx="700" cy="120" r="22" fill="#e9eef8"/><g fill="#fff" opacity=".8"><circle cx="560" cy="110" r="3"/><circle cx="610" cy="160" r="2"/><circle cx="650" cy="250" r="3"/><circle cx="730" cy="210" r="2"/></g>
      <rect x="80" y="290" width="260" height="130" rx="14" fill="#5d6a8c"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${96 + i * 34}" y="300" width="22" height="110" rx="10" fill="#7884a6"/>`).join('')}
      <path d="M340 400 L460 400 L460 560" stroke="#8d97b3" stroke-width="18" fill="none"/><g fill="#d8ecff">${[0, 1, 2, 3].map((i) => `<path d="M${380 + i * 22} 392 l6 -10 l6 10z"/>`).join('')}</g></svg>
      <div class="th"><i class="lv"></i></div><div class="tv"></div><small>${S.apt}</small>`);
    const lv = apt.querySelector('.lv'), tv = apt.querySelector('.tv');
    tl.set(apt, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(apt, { autoAlpha: 0, y: 200 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out', immediateRender: false }, K.leer - 0.25);
    perFrame((t) => { const u = E.io(seg(t, K.leer, K.turn - K.leer)); const v = Math.round(lerp(S.t0, S.t1, u)); const txt = v + ' ' + S.unit; if (tv.textContent !== txt) tv.textContent = txt; lv.style.transform = `scaleY(${lerp(0.75, 0.32, u)})`; });
    tl.to(apt, { autoAlpha: 0, y: -160, duration: 0.35, ease: 'power2.in' }, K.turn - 0.25);
    // away card
    const app = el('div', 'x23app', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.app}</b><small>${S.appS}</small></div></div>
      <div class="rw dt"><span>📅</span><b>${S.dates}</b><em class="tg"><i></i></em><small>${S.away}</small></div>
      <div class="rw ll"><span>🏠</span><b>${S.ll}</b><em class="sn">${S.seen}</em></div>
      <div class="rw rm"><span>🔔</span><div><b>${S.rem}</b><small>${S.remT}</small></div><em class="av"><i>M</i><i>V</i></em></div>`);
    const tg = app.querySelector('.tg'), tgi = tg.querySelector('i');
    tl.set(app, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(app, { autoAlpha: 0, y: 240 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.2, -9);
    tl.fromTo(tgi, { x: 0 }, { x: 46, duration: 0.25, ease: 'power3.out', immediateRender: false }, K.abs);
    tl.fromTo(tg, { backgroundColor: '#cfd6e2' }, { backgroundColor: '#1fbf72', duration: 0.25, immediateRender: false }, K.abs);
    sfx('pop', K.abs + 0.05, -10);
    const ll = app.querySelector('.ll'), rm = app.querySelector('.rm');
    tl.set([ll, rm], { autoAlpha: 0 }, 0);
    tl.fromTo(ll, { autoAlpha: 0, x: 50 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power3.out', immediateRender: false }, K.ll - 0.1);
    sfx('send', K.ll, -11);
    tl.fromTo(rm, { autoAlpha: 0, x: 50 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power3.out', immediateRender: false }, K.both - 0.1);
    sfx('chime', K.rem, -11);
    // thermostat dial turns to frost protection
    const marks = ['❄', '1', '2', '3', '4', '5'];
    const dial = el('div', 'x23dial', `<div class="x23ring">${marks.map((m, i) => `<b style="transform:rotate(${-120 + i * 48}deg) translateY(-178px) rotate(${120 - i * 48}deg)">${m}</b>`).join('')}</div><div class="knob"><i></i></div><span>${S.dial}</span>`);
    const knob = dial.querySelector('.knob'), dl = dial.querySelector('span');
    tl.set(dial, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(dial, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2)', immediateRender: false }, K.rem - 0.3);
    tl.fromTo(knob, { rotation: 72 }, { rotation: -120, duration: 0.7, ease: 'power3.inOut', immediateRender: false }, K.frost - 0.45);
    tl.set(knob, { rotation: 72 }, 0);
    tl.set(dl, { autoAlpha: 0 }, 0);
    tl.fromTo(dl, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }, K.frost + 0.2);
    sfx('unfold', K.frost - 0.4, -10); sfx('pop', K.frost + 0.25, -10);
    // ending: no burst pipe, welcome back
    tl.to([app, dial], { autoAlpha: 0, y: -120, duration: 0.35, ease: 'power2.in', stagger: 0.05 }, K.pipe - 0.55);
    const pp = el('div', 'x23pipe', `<svg viewBox="0 0 420 260"><path d="M20 130 L170 130 Q210 130 210 90 L210 20" stroke="#8d97b3" stroke-width="44" fill="none" stroke-linecap="round"/><path d="M210 20 L210 0" stroke="#6d7893" stroke-width="56"/><path d="M20 130 L0 130" stroke="#6d7893" stroke-width="56"/><path d="M160 100 l18 30 l-22 10 l20 26" stroke="#e8432d" stroke-width="8" fill="none"/></svg><b>${S.pipe}</b><i class="x"></i>`);
    tl.set(pp, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(pp, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, K.pipe - 0.35);
    tl.fromTo(pp.querySelector('.x'), { scaleX: 0 }, { scaleX: 1, duration: 0.2, ease: 'power2.out', immediateRender: false }, K.pipe + 0.1);
    tl.set(pp.querySelector('.x'), { scaleX: 0 }, 0);
    sfx('thud', K.pipe + 0.15, -9);
    const bk = el('div', 'x23back', S.back);
    tl.set(bk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(bk, { autoAlpha: 0, y: 40, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2.4)', immediateRender: false }, K.wake - 0.15);
    sfx('chime', K.wake, -11);
    const lk = el('div', 'x23lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X24 (feature): requests + approval — question bubbles, fading hallway "yes", request card, years later =================
  function X24() {
    const de = lang === 'de';
    const S = de ? {
      q1: 'Darf ich eine Katze halten?', q2: 'Darf ich die Wand streichen?', ja: 'Ja, klar!', req: 'Anfrage · Wohnung 3', reqT: 'Katze halten', reqS: 'Mieterin · 14.10.2026', sent: 'gesendet',
      no: 'Ablehnen', yes: 'Zustimmen', ok: '✓ Zugestimmt', doc: 'Zusage_Katze.pdf', docS: 'für beide archiviert', stamp: 'DOKUMENTIERT', r1: 'Mieterin', r2: 'Vermieter', later: 'Zusage noch da ✓', tag: 'für Mieter & Vermieter',
    } : {
      q1: 'Can I get a cat?', q2: 'Can I paint the wall?', ja: 'Yeah, sure!', req: 'Request · Unit 3', reqT: 'Get a cat', reqS: 'Tenant · Oct 14, 2026', sent: 'sent',
      no: 'Decline', yes: 'Approve', ok: '✓ Approved', doc: 'Approval_cat.pdf', docS: 'archived for both', stamp: 'ON RECORD', r1: 'Tenant', r2: 'Landlord', later: 'approval still there ✓', tag: 'for tenants & landlords',
    };
    const K = {};
    K.q2 = W(['Darf', 'Can'], 0).start;
    K.ja = W(['Ja', 'yes']).start;
    K.verg = W(['vergessen', 'forgotten']).start;
    const it = W(['Mit', 'With']); K.turn = it.start;
    K.send = W(['stellt', 'sends'], it.i).start;
    K.app = W(['App', 'app'], it.i).start;
    K.ll = W(['Vermieter', 'landlord'], it.i).start;
    K.tap = W(['Tipp', 'tap'], it.i).start;
    K.ok = W(['Zusage', 'approval'], it.i).start;
    K.doc = W(['dokumentiert', 'record'], it.i).start;
    K.klar = W(['Klar', 'Clear'], it.i).start;
    K.yrs = W(['Jahren', 'years'], it.i).start;
    const T = END + 2.1;
    el('div', 'x24bg', '<i class="g"></i>');
    // hook: two question bubbles
    const b1 = el('div', 'x24bub l', `<i>🐱</i><b>${S.q1}</b>`), b2 = el('div', 'x24bub r', `<i>🎨</i><b>${S.q2}</b>`);
    tl.fromTo(b1, { autoAlpha: 0, scale: 0.4, y: 40 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(2.2)' }, 0.02);
    tl.fromTo(b2, { autoAlpha: 0, scale: 0.4, y: 40 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(2.2)' }, K.q2 - 0.08);
    sfx('pop', 0.05, -9); sfx('pop', K.q2 - 0.05, -9);
    tl.to([b1, b2], { autoAlpha: 0, y: -120, scale: 0.85, duration: 0.35, ease: 'power2.in', stagger: 0.05 }, K.ja - 0.55);
    // hallway yes that evaporates
    const ja = el('div', 'x24ja', `<b>${S.ja.split('').map((ch) => `<span>${ch === ' ' ? '&nbsp;' : ch}</span>`).join('')}</b><i>👋</i>`);
    const chars = ja.querySelectorAll('span');
    tl.set(ja, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(ja, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.6)', immediateRender: false }, K.ja - 0.1);
    sfx('pop', K.ja, -10);
    chars.forEach((c, i) => { tl.to(c, { autoAlpha: 0, y: -60 - (i % 3) * 30, x: (i % 2 ? 1 : -1) * (20 + i * 6), filter: 'blur(8px)', duration: 0.7, ease: 'power2.in' }, K.verg - 0.5 + i * 0.04); });
    tl.to(ja.querySelector('i'), { autoAlpha: 0, duration: 0.4 }, K.verg - 0.3);
    const qm = el('div', 'x24qm', '?');
    tl.set(qm, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(qm, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, K.verg + 0.2);
    tl.to([qm, ja], { autoAlpha: 0, duration: 0.2 }, K.turn - 0.2);
    sfx('vortex', K.verg - 0.45, -14);
    // request card
    const rq = el('div', 'x24req', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.req}</b><small>${S.reqS}</small></div><em class="sp">${S.sent}</em></div>
      <div class="tt"><i>🐱</i><b>${S.reqT}</b></div>
      <div class="bt"><span class="no">${S.no}</span><span class="yes">${S.yes}</span><span class="ok">${S.ok}</span></div>
      <div class="dc"><i>📎</i><div><b>${S.doc}</b><small>${S.docS}</small></div></div><div class="stp">${S.stamp}</div>`);
    tl.set(rq, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(rq, { autoAlpha: 0, y: 260 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.2, -9);
    const sp = rq.querySelector('.sp'), okb = rq.querySelector('.ok'), dc = rq.querySelector('.dc'), stp = rq.querySelector('.stp'), bt = rq.querySelector('.bt');
    tl.set([sp, okb, dc, stp, bt], { autoAlpha: 0 }, 0);
    tl.fromTo(sp, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, K.app);
    sfx('send', K.app, -10);
    tl.fromTo(bt, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power3.out', immediateRender: false }, K.ll - 0.1);
    const tapc = el('div', 'x24tap', '<i></i>');
    tl.set(tapc, { autoAlpha: 0 }, 0);
    tl.fromTo(tapc, { autoAlpha: 0, x: 900, y: 1300 }, { autoAlpha: 1, x: 750, y: 636, duration: 0.55, ease: 'power3.inOut', immediateRender: false }, K.tap - 0.6);
    tl.fromTo(tapc.querySelector('i'), { scale: 0.3, autoAlpha: 0.9 }, { scale: 2.6, autoAlpha: 0, duration: 0.5, immediateRender: false }, K.tap);
    tl.to(tapc, { autoAlpha: 0, duration: 0.2 }, K.tap + 0.45);
    tl.fromTo(okb, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.6)', immediateRender: false }, K.tap + 0.1);
    sfx('pop', K.tap, -9); sfx('chime', K.tap + 0.15, -11);
    tl.fromTo(dc, { autoAlpha: 0, x: 60 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power3.out', immediateRender: false }, K.ok - 0.1);
    tl.fromTo(stp, { autoAlpha: 0, scale: 2.2, rotation: -2 }, { autoAlpha: 1, scale: 1, rotation: -8, duration: 0.22, ease: 'power4.in', immediateRender: false }, K.doc - 0.1);
    sfx('thud', K.doc + 0.1, -8);
    // ending: clear for both, still there years later
    const roles = el('div', 'x24roles', `<span><i>✓</i>${S.r1}</span><span><i>✓</i>${S.r2}</span>`);
    tl.set(roles.children, { autoAlpha: 0 }, 0);
    tl.fromTo(roles.children, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.12, ease: 'back.out(2)', immediateRender: false }, K.klar - 0.05);
    sfx('pop', K.klar, -12); sfx('pop', K.klar + 0.12, -12);
    const yr = el('div', 'x24yr', `<b>2026</b><span>${S.later}</span>`);
    const yb = yr.querySelector('b'), ys = yr.querySelector('span');
    tl.set(yr, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(yr, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }, K.yrs - 0.6);
    perFrame((t) => { const v = String(Math.round(2026 + 5 * E.io(seg(t, K.yrs - 0.5, 0.9)))); if (yb.textContent !== v) yb.textContent = v; });
    tl.set(ys, { autoAlpha: 0 }, 0);
    tl.fromTo(ys, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, K.yrs + 0.45);
    sfx('counter', K.yrs - 0.5, -14); sfx('chime', K.yrs + 0.5, -12);
    const lk = el('div', 'x24lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X25 (feature): key register — 3D keys on a ring, key log card, signed handover, lost key, name tags =================
  function X25() {
    const de = lang === 'de';
    const S = de ? {
      hd: 'Schlüssel bei der Übergabe', keys: ['Haustür', 'Wohnung', 'Keller'], q: 'Wer hat ihn?',
      log: 'Schlüsselbuch', logS: 'Wohnung 3 · 4 Schlüssel', rows: [['🔴', 'Haustür', 'Mieterin'], ['🔵', 'Wohnung', 'Mieterin'], ['🟢', 'Keller', 'Mieterin'], ['🟡', 'Briefkasten', 'Mieterin']],
      sign: '✍ unterschrieben · 14.10.', lost: '⚠ Verloren · gemeldet 11:24', tags: ['Haustür · Mieterin', 'Wohnung · Mieterin', 'Keller · Mieterin'], tag: 'für Mieter & Vermieter',
    } : {
      hd: 'keys at handover', keys: ['Front door', 'Apartment', 'Basement'], q: 'Who has it?',
      log: 'Key log', logS: 'Unit 3 · 4 keys', rows: [['🔴', 'Front door', 'Tenant'], ['🔵', 'Apartment', 'Tenant'], ['🟢', 'Basement', 'Tenant'], ['🟡', 'Mailbox', 'Tenant']],
      sign: '✍ signed · Oct 14', lost: '⚠ Lost · reported 11:24 am', tags: ['Front door · Tenant', 'Apartment · Tenant', 'Basement · Tenant'], tag: 'for tenants & landlords',
    };
    const K = {};
    K.ho = W(['Übergabe', 'handover']).start;
    K.who = W(['wer', 'who']).start;
    K.cellar = W(['Kellerschlüssel', 'basement']).start;
    const it = W(['Mit', 'With']); K.turn = it.start;
    K.book = W(['Schlüsselbuch', 'log'], it.i).start;
    K.sign = W(['unterschrieben', 'signed'], it.i).start;
    K.lost = W(['verlorener', 'lost'], it.i).start;
    K.rep = W(['gemeldet', 'reported'], it.i).start;
    const ie = W(['Jeder', 'Every'], W(['gemeldet', 'reported'], it.i).i); K.name = ie.start;
    const T = END + 2.1;
    el('div', 'x25bg', '');
    const G = gl3(stage, { fov: 30, envTop: '#fff3df', envBot: '#2a2622', envInt: 1.1 });
    const { scene, cam } = G;
    G.r.shadowMap.enabled = false;
    const LOOK = new T3.Vector3(0, 0.25, 0);
    scene.add(new T3.HemisphereLight('#fff1dc', '#3a332c', 0.9));
    const key = new T3.DirectionalLight('#fff4e6', 2.4); key.position.set(-3, 5, 6); scene.add(key);
    const rim = new T3.DirectionalLight('#9fc4ff', 1.2); rim.position.set(4, 2, -3); scene.add(rim);
    const brass = M.std('#d6b25e', { metalness: 1, roughness: 0.28 }), steel = M.std('#c9ced4', { metalness: 1, roughness: 0.22 });
    const capCol = ['#e8432d', '#2f6fd6', '#1fbf72'];
    const bowShape = () => { const s = new T3.Shape(); s.absarc(0, 0, 0.62, 0, Math.PI * 2, false); const h = new T3.Path(); h.absarc(-0.18, 0, 0.2, 0, Math.PI * 2, true); s.holes.push(h); return s; };
    const bladeShape = () => { const b = new T3.Shape(); b.moveTo(0.5, 0.17); b.lineTo(2.55, 0.17); b.lineTo(2.68, 0.02); b.lineTo(2.55, -0.17); [[2.4, -0.17], [2.34, -0.4], [2.18, -0.4], [2.08, -0.17], [1.96, -0.32], [1.8, -0.32], [1.7, -0.17], [1.6, -0.44], [1.44, -0.44], [1.34, -0.17], [0.5, -0.17]].forEach(([x, y]) => b.lineTo(x, y)); b.closePath(); return b; };
    const ex = (shape, d) => { const g = new T3.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 28 }); g.translate(0, 0, -d / 2); return g; };
    const bowG = ex(bowShape(), 0.14), bladeG = ex(bladeShape(), 0.1);
    const ringG = new T3.TorusGeometry(0.75, 0.06, 12, 48);
    const RIG = new T3.Group(); scene.add(RIG);
    mesh(ringG, steel, RIG, [0, 2.1, 0]);
    const KEYS = [0, 1, 2].map((k) => {
      const piv = new T3.Group(); piv.position.set(-0.45 + k * 0.45, 1.45, (k - 1) * 0.12); RIG.add(piv);
      const g = new T3.Group(); g.rotation.z = -Math.PI / 2; piv.add(g);
      mesh(bowG, k === 1 ? steel : brass, g);
      mesh(bladeG, k === 1 ? steel : brass, g);
      const cap = mesh(new T3.TorusGeometry(0.5, 0.13, 14, 40), M.std(capCol[k], { roughness: 0.45 }), g); cap.scale.set(1, 1, 0.9);
      return { piv, g, tip: new T3.Vector3(1.55, 0, 0) };
    });
    perFrame((t) => {
      const drop = E.ob(seg(t, 0.0, 0.7), 1.2);
      const tu = E.io(seg(t, K.turn - 0.1, 0.6)), back = E.io(seg(t, K.name - 0.5, 0.7));
      const away = tu * (1 - back);
      RIG.position.set(0, (1 - drop) * 4 + away * 0.6 + back * 0.85, -away * 6);
      RIG.rotation.y = Math.sin(t * 0.6) * 0.25 + (t > K.name - 0.5 ? 0 : 0);
      KEYS.forEach((kk, k) => {
        const sw = Math.sin(t * 1.6 + k * 1.3) * 0.12 * (1 - 0.6 * tu) + (1 - drop) * 0.4 * Math.sin(k + t * 6);
        const spread = back * (k - 1) * 0.55;
        kk.piv.rotation.z = sw + spread;
        // basement key comes forward when asked about
        const hi = k === 2 ? E.io(seg(t, K.cellar - 0.25, 0.4)) * (1 - E.io(seg(t, K.turn - 0.2, 0.4))) : 0;
        kk.piv.position.z = (k - 1) * 0.12 + hi * 1.6;
        kk.g.scale.setScalar(1 + hi * 0.15);
      });
      cam.position.set(Math.sin(t * 0.3) * 0.4, 1.6, 16 - 1.0 * E.oc(seg(t, 0, 3)));
      cam.lookAt(LOOK);
      scene.updateMatrixWorld();
      G.r.render(scene, cam);
    });
    sfx('keys', 0.35, -6);
    // hook headline + who-has-it bubble
    const hd = el('div', 'x25hd', `<span>3</span>${S.hd}`, stage, de ? { fontSize: '58px' } : {});
    tl.set(hd, { xPercent: -50 }, 0);
    tl.fromTo(hd, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'back.out(2)' }, 0.05);
    tl.to(hd, { autoAlpha: 0, y: -40, duration: 0.25 }, K.turn - 0.3);
    const qb = el('div', 'x25q', `<i>🟢</i>${S.keys[2]}<b>?</b>`);
    tl.set(qb, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(qb, { autoAlpha: 0, scale: 0.6, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.3, ease: 'back.out(2.6)', immediateRender: false }, K.cellar - 0.1);
    tl.to(qb, { autoAlpha: 0, duration: 0.2 }, K.turn - 0.25);
    sfx('sting', K.cellar, -11);
    // key log card
    const card = el('div', 'x25card', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.log}</b><small>${S.logS}</small></div></div>` + S.rows.map((r, i) => `<div class="rw r${i}"><span class="c">${r[0]}</span><b>${r[1]}</b><em>${r[2]}</em>${i === 2 ? `<div class="sg"><svg viewBox="0 0 300 60"><path pathLength="1" d="M10 40 C40 5, 60 55, 90 30 S140 10, 160 38 S210 50, 230 22 S270 30, 290 26"/></svg><small>${S.sign}</small></div>` : ''}${i === 3 ? `<div class="ls">${S.lost}</div>` : ''}</div>`).join(''));
    tl.set(card, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(card, { autoAlpha: 0, y: 260 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power4.out', immediateRender: false }, K.turn + 0.05);
    sfx('whoosh', K.turn - 0.1, -9); sfx('binder', K.turn + 0.1, -12);
    const rws = card.querySelectorAll('.rw');
    tl.set(rws, { autoAlpha: 0 }, 0);
    tl.fromTo(rws, { autoAlpha: 0, x: 50 }, { autoAlpha: 1, x: 0, duration: 0.28, stagger: 0.12, ease: 'power3.out', immediateRender: false }, K.book - 0.5);
    rws.forEach((r, i) => sfx('pop', K.book - 0.45 + i * 0.12, -16));
    const sgp = card.querySelector('.sg path'), sgs = card.querySelector('.sg small'), sg = card.querySelector('.sg');
    tl.set(sg, { autoAlpha: 0 }, 0);
    tl.set(sg, { autoAlpha: 1 }, K.sign - 0.7);
    tl.fromTo(sgp, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: 'power1.inOut', immediateRender: false }, K.sign - 0.7);
    tl.set(sgs, { autoAlpha: 0 }, 0);
    tl.fromTo(sgs, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, immediateRender: false }, K.sign + 0.15);
    sfx('typing', K.sign - 0.65, -16); sfx('chime', K.sign + 0.2, -13);
    const ls = card.querySelector('.ls'), r3 = rws[3];
    tl.set(ls, { autoAlpha: 0 }, 0);
    tl.fromTo(r3, { backgroundColor: 'rgba(232,67,45,0)' }, { backgroundColor: 'rgba(232,67,45,0.1)', duration: 0.2, immediateRender: false }, K.lost);
    tl.fromTo(ls, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.6)', immediateRender: false }, K.rep - 0.1);
    sfx('buzz', K.lost + 0.05, -14); sfx('send', K.rep, -10);
    tl.to(card, { autoAlpha: 0, y: 200, duration: 0.4, ease: 'power2.in' }, K.name - 0.55);
    // name tags pinned to the 3D keys
    const tags = S.tags.map((s, k) => el('div', `x25tag t${k}`, s, stage, { top: `${1130 + k * 92}px` }));
    tags.forEach((tg, k) => { tl.set(tg, { autoAlpha: 0, xPercent: -50 }, 0); tl.fromTo(tg, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.6)', immediateRender: false }, K.name + 0.1 + k * 0.18); sfx('pop', K.name + 0.12 + k * 0.18, -13); });
    const lk = el('div', 'x25lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X26 (feature): insurance-ready report — rising water, insurer checklist, one-tap PDF export =================
  function X26() {
    const de = lang === 'de';
    const S = de ? {
      hd: 'WASSERSCHADEN', ins: 'Versicherung · Schadenmeldung', items: [['📷', 'Fotos'], ['📅', 'Datum'], ['🧾', 'Verlauf']], miss: 'fehlt',
      app: 'Meldung #318 · Wasserschaden Bad', appS: 'Wohnung 3 · seit 02.10.', tl: [['02.10. · 07:12', 'Fleck an der Decke, Foto'], ['02.10. · 07:40', 'Vermieter: Installateur kommt'], ['03.10. · 10:05', 'Leck gefunden, Foto']], btn: 'Als PDF exportieren',
      pdf: 'Schadensbericht', chips: ['Fotos', 'Zeitstempel', 'Nachrichten'], done: 'Alles drin ✓', r1: 'Mieter', r2: 'Vermieter', saved: 'Wochen gespart', tag: 'für Mieter & Vermieter',
    } : {
      hd: 'WATER DAMAGE', ins: 'Insurer · Damage claim', items: [['📷', 'Photos'], ['📅', 'Dates'], ['🧾', 'History']], miss: 'missing',
      app: 'Report #318 · Bathroom leak', appS: 'Unit 3 · since Oct 2', tl: [['Oct 2 · 7:12 am', 'Stain on the ceiling, photo'], ['Oct 2 · 7:40 am', 'Landlord: plumber on the way'], ['Oct 3 · 10:05 am', 'Leak found, photo']], btn: 'Export as PDF',
      pdf: 'Damage report', chips: ['Photos', 'Timestamps', 'Messages'], done: 'All included ✓', r1: 'Tenant', r2: 'Landlord', saved: 'weeks saved', tag: 'for tenants & landlords',
    };
    const K = {};
    K.ins = W(['Versicherung', 'insurer']).start;
    const IT = [W(['Fotos', 'photos']).start, W(['Datum', 'dates']).start, W(['Verlauf', 'history']).start];
    const it = W(['Mit', 'With']); K.turn = it.start;
    K.exp = W(['exportiert', 'exports'], it.i).start;
    K.tap = W(['Tipp', 'tap'], it.i).start;
    K.pdf = W(['PDF', 'PDF'], it.i).start;
    K.pdfAt = Math.max(K.pdf, K.tap + 0.2);
    const ip = W(['Fotos', 'photos'], it.i);
    const CT = [ip.start, W(['Zeitstempel', 'timestamps'], it.i).start, W(['Nachrichten', 'messages'], it.i).start];
    K.all = W(['alles', 'all'], it.i).start;
    const ir = W(['Mieter', 'Tenant'], it.i); K.roles = ir.start;
    K.weeks = W(['Wochen', 'weeks'], ir.i).start;
    const T = END + 2.1;
    el('div', 'x26bg', '');
    // rising water
    const wave = el('div', 'x26wave', `<svg viewBox="0 0 2160 200" preserveAspectRatio="none"><path d="M0 60 Q135 0 270 60 T540 60 T810 60 T1080 60 T1350 60 T1620 60 T1890 60 T2160 60 L2160 200 L0 200Z" fill="#4cc9f0" opacity=".55"/><path d="M0 90 Q135 40 270 90 T540 90 T810 90 T1080 90 T1350 90 T1620 90 T1890 90 T2160 90 L2160 200 L0 200Z" fill="#1f9ed1"/></svg><i></i>`);
    const wsvg = wave.querySelector('svg');
    perFrame((t) => { const h = 380 * E.oc(seg(t, 0.0, 1.6)) * (1 - E.io(seg(t, K.turn - 0.4, 0.7))) + 40; wave.style.height = `${h}px`; wsvg.style.transform = `translateX(${-((t * 260) % 1080)}px)`; });
    sfx('drip', 0.1, -8); sfx('wind', 0.2, -20);
    const hd = el('div', 'x26hd', S.hd, stage, { fontSize: de ? '98px' : '104px' });
    tl.set(hd, { xPercent: -50 }, 0);
    tl.fromTo(hd, { autoAlpha: 0, scale: 1.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power4.in' }, 0.02);
    sfx('impact', 0.3, -9);
    tl.to(hd, { autoAlpha: 0, y: -60, duration: 0.3 }, K.turn - 0.35);
    // insurer checklist with missing items
    const ins = el('div', 'x26ins', `<div class="hd"><i>🛡️</i><b>${S.ins}</b></div>` + S.items.map((x) => `<div class="rw"><span>${x[0]}</span><b>${x[1]}</b><em>${S.miss}</em></div>`).join(''));
    tl.set(ins, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(ins, { autoAlpha: 0, y: 160 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out', immediateRender: false }, K.ins - 0.25);
    ins.querySelectorAll('.rw').forEach((r, i) => { tl.set(r, { autoAlpha: 0 }, 0); tl.fromTo(r, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.25, ease: 'power3.out', immediateRender: false }, IT[i] - 0.1); tl.fromTo(r.querySelector('em'), { scale: 0 }, { scale: 1, duration: 0.25, ease: 'back.out(3)', immediateRender: false }, IT[i] + 0.15); tl.set(r.querySelector('em'), { scale: 0 }, 0); sfx('pop', IT[i] + 0.15, -12); });
    tl.to(ins, { autoAlpha: 0, y: -140, duration: 0.35, ease: 'power2.in' }, K.turn - 0.3);
    // app report card with timeline + export button
    const app = el('div', 'x26app', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.app}</b><small>${S.appS}</small></div></div>` + S.tl.map((x, i) => `<div class="ev"><i class="dot"></i><div><small>${x[0]}</small><b>${x[1]}</b></div>${i !== 1 ? '<span class="x26ph"></span>' : ''}</div>`).join('') + `<div class="x26btn">⤓ ${S.btn}</div>`);
    const btn = app.querySelector('.x26btn');
    tl.set(app, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(app, { autoAlpha: 0, y: 240 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    tl.fromTo(app.querySelectorAll('.ev'), { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.25, stagger: 0.12, immediateRender: false }, K.turn + 0.25);
    tl.set(app.querySelectorAll('.ev'), { autoAlpha: 0 }, 0);
    sfx('whoosh', K.turn - 0.2, -9);
    const tapc = el('div', 'x26tap', '<i></i>');
    tl.set(tapc, { autoAlpha: 0 }, 0);
    tl.fromTo(tapc, { autoAlpha: 0, x: 860, y: 1300 }, { autoAlpha: 1, x: 620, y: 772, duration: 0.5, ease: 'power3.inOut', immediateRender: false }, K.tap - 0.55);
    tl.to(tapc, { scale: 0.8, duration: 0.08, yoyo: true, repeat: 1 }, K.tap);
    tl.fromTo(tapc.querySelector('i'), { scale: 0.3, autoAlpha: 0.9 }, { scale: 2.6, autoAlpha: 0, duration: 0.5, immediateRender: false }, K.tap);
    tl.to(tapc, { autoAlpha: 0, duration: 0.2 }, K.tap + 0.4);
    tl.fromTo(btn, { backgroundColor: '#0b4f6c' }, { backgroundColor: '#1fbf72', duration: 0.2, immediateRender: false }, K.tap);
    sfx('pop', K.tap, -9);
    // the PDF flies out
    const pdf = el('div', 'x26pdf', `<div class="tp"><em>PDF</em><b>${S.pdf}</b></div><div class="gr"><i></i><i></i><i></i><i></i></div>${[0, 1, 2, 3, 4].map(() => '<p></p>').join('')}`);
    tl.set(pdf, { autoAlpha: 0 }, 0);
    tl.fromTo(pdf, { autoAlpha: 0, x: 120, y: 300, scale: 0.3, rotation: -12 }, { autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: -4, duration: 0.6, ease: 'back.out(1.6)', immediateRender: false }, K.pdfAt - 0.2);
    tl.to(app, { autoAlpha: 0.0, scale: 0.92, y: -40, duration: 0.4 }, K.pdfAt - 0.2);
    sfx('receipts', K.pdfAt - 0.15, -10); sfx('kaching', K.pdfAt + 0.2, -12);
    // included chips
    const chips = el('div', 'x26chips', S.chips.map((c) => `<span><i>✓</i>${c}</span>`).join('') + `<b>${S.done}</b>`);
    const cs = chips.querySelectorAll('span'), cd = chips.querySelector('b');
    tl.set([...cs, cd], { autoAlpha: 0 }, 0);
    cs.forEach((c, i) => { tl.fromTo(c, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(3)', immediateRender: false }, CT[i]); sfx('pop', CT[i] + 0.02, -12); });
    tl.fromTo(cd, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, K.all - 0.05);
    sfx('chime', K.all, -11);
    // ending: paper stack collapses, weeks saved
    tl.to([pdf, chips], { autoAlpha: 0, y: -100, duration: 0.35, ease: 'power2.in', stagger: 0.05 }, K.roles - 0.35);
    const stack = el('div', 'x26stack', [...Array(7)].map((_, i) => `<i style="transform:translate(${(i % 2 ? 1 : -1) * i * 7}px,${-i * 16}px) rotate(${(i % 3 - 1) * 5}deg)"></i>`).join('') + `<em>PDF</em>`);
    const sp = stack.querySelectorAll('i'), se = stack.querySelector('em');
    tl.set(stack, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.set(stack, { autoAlpha: 1 }, K.roles - 0.2);
    tl.fromTo(sp, { autoAlpha: 0, y: -80 }, { autoAlpha: 1, y: 0, duration: 0.25, stagger: 0.05, immediateRender: false }, K.roles - 0.2);
    tl.to(sp, { autoAlpha: 0, scale: 0.4, x: 0, y: 0, rotation: 0, duration: 0.3, stagger: 0.03, ease: 'power3.in' }, K.weeks - 0.2);
    tl.set(se, { autoAlpha: 0 }, 0);
    tl.fromTo(se, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.6)', immediateRender: false }, K.weeks + 0.15);
    sfx('binder', K.roles - 0.15, -12); sfx('whoosh', K.weeks - 0.15, -11);
    const roles = el('div', 'x26roles', `<span><i>✓</i>${S.r1}</span><span><i>✓</i>${S.r2}</span><b>${S.saved}</b>`);
    tl.set(roles.children, { autoAlpha: 0 }, 0);
    tl.fromTo(roles.children, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.15, ease: 'back.out(2)', immediateRender: false }, K.roles);
    const lk = el('div', 'x26lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X11: digital lease signing — lease stuck in the post for a week, both sign on screen, contract lands in both archives, Mon yes -> Fri keys =================
  function X11() {
    const de = lang === 'de';
    const S = de ? {
      found: 'Wohnung gefunden!', env: 'Mietvertrag', post: 'In Zustellung', day: (n) => `Tag ${n}`, still: 'noch unterwegs …',
      doc: 'Mietvertrag · Wohnung 3', docS: 'Lena & Herr Becker', r1: 'Mieterin', r2: 'Vermieter', stamp: 'DIGITAL UNTERSCHRIEBEN',
      arch: 'Archiv', fold: 'Mietvertrag', fold2: 'Übergabe', file: 'Mietvertrag_Whg3.pdf', now: 'sofort bei beiden ✓',
      week: 'Diese Woche', days: ['Mo', 'Di', 'Mi', 'Do', 'Fr'], yes: '✓ Zusage', key: '🔑 Schlüssel', tag: 'für Mieter & Vermieter',
    } : {
      found: 'Apartment found!', env: 'Lease', post: 'In transit', day: (n) => `Day ${n}`, still: 'still in the mail …',
      doc: 'Lease · Unit 3', docS: 'Lena & Mr. Becker', r1: 'Tenant', r2: 'Landlord', stamp: 'SIGNED DIGITALLY',
      arch: 'Archive', fold: 'Lease', fold2: 'Handover', file: 'Lease_Unit3.pdf', now: 'there for both ✓',
      week: 'This week', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], yes: '✓ Yes', key: '🔑 Keys', tag: 'for tenants & landlords',
    };
    const K = {};
    K.found = W(['gefunden', 'found']).start;
    const iv = W(['Vertrag', 'lease']); K.vertrag = iv.start;
    K.woche = W(['Woche', 'week'], iv.i).start;
    K.post = W(['Post', 'mail'], iv.i).start;
    const it = W(['Mit', 'With'], iv.i); K.turn = it.start;
    K.t1 = W(['Mieter', 'tenant'], it.i).start;
    K.t2 = W(['Vermieter', 'landlord'], it.i).start;
    K.dig = W(['digital', 'digitally'], it.i).start;
    K.both = W(['beide', 'both'], it.i).start;
    K.arch = W(['Archiv', 'archive'], it.i).start;
    K.now = W(['sofort', 'right'], it.i).start;
    K.yes = W(['Zusage', 'Yes'], it.i).start;
    K.mon = W(['Montag', 'Monday'], it.i).start;
    K.keys = W(['Schlüssel', 'keys'], it.i).start;
    K.fri = W(['Freitag', 'Friday'], it.i).start;
    const T = END + 2.1;
    el('div', 'x11bg', '<i class="g"></i>');
    // hook: apartment found ✓
    const fd = el('div', 'x11found', `<i>🏠</i><b>${S.found}</b><em>✓</em>`);
    tl.set(fd, { xPercent: -50 }, 0);
    tl.fromTo(fd, { autoAlpha: 0, scale: 0.5, y: 40 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(2.2)' }, 0.02);
    tl.fromTo(fd.querySelector('em'), { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, K.found);
    sfx('pop', 0.05, -9); sfx('chime', K.found + 0.05, -11);
    tl.to(fd, { y: -150, scale: 0.72, autoAlpha: 0.4, duration: 0.4, ease: 'power3.inOut' }, K.vertrag - 0.4);
    // envelope stuck in the post, day counter 1..7
    const env = el('div', 'x11env', `<div class="in"><i class="fl"></i><b>${S.env}</b><span class="stp">✉</span></div>`);
    const envIn = env.querySelector('.in');
    tl.set(env, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(env, { autoAlpha: 0, y: -520, rotation: -12 }, { autoAlpha: 1, y: 0, rotation: 0, duration: 0.5, ease: 'bounce.out', immediateRender: false }, K.vertrag - 0.3);
    sfx('thud', K.vertrag + 0.05, -8);
    perFrame((t) => { const a = seg(t, K.vertrag + 0.2, 1.5); envIn.style.transform = `translateY(${Math.sin(t * 2.4) * 10 * a}px) rotate(${Math.sin(t * 1.7) * 3 * a}deg)`; });
    const trk = el('div', 'x11trk', `<div class="rw"><i>📮</i><b>${S.post}</b><span class="d">${S.day(1)}</span></div><div class="dots">${'<i></i>'.repeat(7)}</div><em>${S.still}</em>`);
    const dd = trk.querySelector('.d'), dots = [...trk.querySelectorAll('.dots i')], still = trk.querySelector('em');
    tl.set(trk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(trk, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power3.out', immediateRender: false }, K.vertrag + 0.15);
    let lastN = 0;
    perFrame((t) => {
      const n = Math.max(1, Math.min(7, 1 + Math.floor(6.99 * seg(t, K.vertrag + 0.3, K.woche - K.vertrag))));
      if (n !== lastN) { lastN = n; dd.textContent = S.day(n); dots.forEach((d, i) => d.classList.toggle('on', i < n)); }
    });
    tl.set(still, { autoAlpha: 0 }, 0);
    tl.fromTo(still, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, K.post);
    sfx('counter', K.vertrag + 0.3, -14); sfx('buzz', K.post + 0.05, -16);
    tl.to([fd, env, trk], { autoAlpha: 0, y: '-=80', duration: 0.3, ease: 'power2.in', stagger: 0.04 }, K.turn - 0.32);
    // contract card, both sign on screen
    const sig1 = 'M8 70 C 14 30, 26 12, 30 30 C 34 50, 22 80, 30 82 C 40 84, 46 60, 56 58 C 66 56, 62 78, 72 76 C 82 74, 84 52, 92 54 C 100 56, 96 78, 106 76 C 116 74, 118 50, 128 52 C 138 54, 134 80, 146 74 C 160 66, 170 38, 186 44 C 200 50, 196 72, 212 66 C 226 60, 238 52, 252 50';
    const sig2 = 'M10 40 C 20 18, 36 20, 32 44 C 28 66, 12 80, 22 84 C 34 88, 50 54, 62 50 C 76 46, 70 76, 82 74 C 96 72, 98 44, 110 46 C 122 48, 112 76, 126 76 C 140 76, 150 38, 166 40 C 178 42, 172 72, 186 70 C 204 68, 212 34, 228 38 C 240 42, 236 70, 252 62';
    const ct = el('div', 'x11doc', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.doc}</b><small>${S.docS}</small></div></div>
      <div class="ln"><i style="width:92%"></i><i style="width:78%"></i><i style="width:86%"></i><i style="width:60%"></i></div>
      <div class="sg">${[[S.r1, sig1], [S.r2, sig2]].map(([rl, p]) => `<div class="bx"><svg viewBox="0 0 260 100" preserveAspectRatio="xMidYMid meet"><path d="${p}"/></svg><span>${rl}</span><em>✓</em></div>`).join('')}</div>
      <div class="stp">${S.stamp}</div>`);
    tl.set(ct, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(ct, { autoAlpha: 0, y: 300 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.2, -9);
    const paths = [...ct.querySelectorAll('path')], chk = [...ct.querySelectorAll('.bx em')], stp = ct.querySelector('.stp');
    [K.t1, K.t2].forEach((tt, i) => {
      const p = paths[i], L = Math.ceil(p.getTotalLength()) + 6;
      p.style.strokeDasharray = `${L}`;
      tl.set(p, { strokeDashoffset: L }, 0);
      tl.fromTo(p, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: 0.55, ease: 'power1.inOut', immediateRender: false }, tt - 0.05);
      tl.set(chk[i], { autoAlpha: 0 }, 0);
      tl.fromTo(chk[i], { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(3)', immediateRender: false }, tt + 0.5);
      sfx('whoosh', tt, -17); sfx('pop', tt + 0.5, -11);
    });
    tl.set(stp, { autoAlpha: 0 }, 0);
    tl.fromTo(stp, { autoAlpha: 0, scale: 2.2, rotation: 0 }, { autoAlpha: 1, scale: 1, rotation: -6, duration: 0.22, ease: 'power4.in', immediateRender: false }, K.dig - 0.05);
    sfx('thud', K.dig + 0.17, -8);
    tl.to(ct, { autoAlpha: 0, y: -140, scale: 0.8, duration: 0.35, ease: 'power2.in' }, K.both - 0.38);
    // both archives get the signed lease at once
    const ph = [S.r1, S.r2].map((rl, i) => el('div', `x11ph ${i ? 'r' : 'l'}`, `<div class="tp"><span>${i ? '🏠' : '👤'}</span><b>${rl}</b></div><div class="ti">${S.arch}</div>
      <div class="fo"><i>📁</i><b>${S.fold2}</b><small>2</small></div><div class="fo"><i>📁</i><b>${S.fold}</b><small>1</small></div><div class="fi"><i>📄</i><b>${S.file}</b><em>✓</em></div>`));
    const tFile = Math.min(K.arch, K.now), tNow = Math.max(K.arch, K.now);
    ph.forEach((p, i) => {
      tl.set(p, { autoAlpha: 0 }, 0);
      tl.fromTo(p, { autoAlpha: 0, y: 220, rotation: i ? 5 : -5 }, { autoAlpha: 1, y: 0, rotation: i ? 2 : -2, duration: 0.45, ease: 'back.out(1.6)', immediateRender: false }, K.both - 0.18 + i * 0.08);
      const fi = p.querySelector('.fi');
      tl.set(fi, { autoAlpha: 0 }, 0);
      tl.fromTo(fi, { autoAlpha: 0, x: i ? -180 : 180, scale: 0.6 }, { autoAlpha: 1, x: 0, scale: 1, duration: 0.4, ease: 'back.out(2)', immediateRender: false }, tFile - 0.2 + i * 0.06);
    });
    sfx('whoosh', K.both - 0.15, -11); sfx('send', tFile - 0.15, -10); sfx('chime', tNow + 0.1, -12);
    const now = el('div', 'x11now', S.now);
    tl.set(now, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(now, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.6)', immediateRender: false }, tNow + 0.05);
    tl.to([...ph, now], { autoAlpha: 0, y: '-=80', duration: 0.3, ease: 'power2.in', stagger: 0.04 }, K.yes - 0.38);
    // week strip: yes on Monday, keys on Friday
    const wk = el('div', 'x11wk', `<div class="h">${S.week}</div><div class="ds">${S.days.map((d) => `<span>${d}</span>`).join('')}<i class="hl"></i></div><div class="lb"><em class="y">${S.yes}</em><em class="k">${S.key}</em></div>`);
    const cells = [...wk.querySelectorAll('.ds span')], hl = wk.querySelector('.hl'), ly = wk.querySelector('.y'), lkk = wk.querySelector('.k');
    tl.set(wk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(wk, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power3.out', immediateRender: false }, K.yes - 0.22);
    tl.set([ly, lkk, hl], { autoAlpha: 0 }, 0);
    tl.fromTo(cells[0], { backgroundColor: '#ffffff', color: '#0f4c5c' }, { backgroundColor: '#1fbf72', color: '#ffffff', duration: 0.2, immediateRender: false }, K.yes);
    tl.fromTo(ly, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, K.yes + 0.05);
    tl.set(hl, { autoAlpha: 1, x: 0 }, K.mon + 0.2);
    tl.fromTo(hl, { x: 0 }, { x: 4 * 196, duration: Math.max(0.4, K.keys - K.mon - 0.3), ease: 'power2.inOut', immediateRender: false }, K.mon + 0.2);
    tl.fromTo(cells[4], { backgroundColor: '#ffffff', color: '#0f4c5c' }, { backgroundColor: '#ff6b4a', color: '#ffffff', duration: 0.2, immediateRender: false }, K.keys - 0.1);
    tl.fromTo(lkk, { autoAlpha: 0, y: 20, scale: 0.6 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(2.6)', immediateRender: false }, K.keys - 0.05);
    tl.fromTo(cells[4], { scale: 1 }, { scale: 1.14, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }, K.fri);
    sfx('pop', K.yes, -10); sfx('whoosh', K.mon + 0.25, -14); sfx('keys', K.keys, -6); sfx('chime', K.fri + 0.1, -10);
    const lk = el('div', 'x11lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X12: water from the flat above — 3D two-storey cutaway, drips into a bucket, ticket with photo, plumber slot, both units see status, sealed =================
  function X12() {
    const de = lang === 'de';
    const S = de ? {
      fam: 'Familie Yilmaz', famS: 'Whg 2 · 09:12', drip: 'tropf', up: '↑ Whg 4', upS: 'Wohnung darüber',
      tk: 'Wasserschaden · Whg 2', tkS: 'Familie Yilmaz · 09:12', foto: '📷 Foto', ll: 'an Vermieter ✓', pl: '🔧 Installateur', s1: '12:00', s2: '14:00',
      u: ['Whg 2', 'Whg 4'], seen: '👁 sieht den Stand', fix: '✓ Dicht', clk: '🕒 15:30', tag: 'für Mieter & Vermieter',
    } : {
      fam: 'The Millers', famS: 'Unit 2 · 9:12 am', drip: 'drip', up: '↑ Unit 4', upS: 'apartment above',
      tk: 'Water leak · Unit 2', tkS: 'The Millers · 9:12 am', foto: '📷 Photo', ll: 'to landlord ✓', pl: '🔧 Plumber', s1: '12 pm', s2: '2 pm',
      u: ['Unit 2', 'Unit 4'], seen: '👁 sees the status', fix: '✓ Sealed', clk: '🕒 3:30 pm', tag: 'for tenants & landlords',
    };
    const K = {};
    K.drop = W(['tropft', 'dripping']).start;
    K.above = W(['darüber', 'above']).start;
    const it = W(['Mit', 'With']); K.turn = it.start;
    K.rep = W(['Meldung', 'report'], it.i).start;
    K.foto = W(['Foto', 'photo'], it.i).start;
    K.ll = W(['Vermieter', 'landlord'], it.i).start;
    K.pl = W(['Installateur', 'plumber'], it.i).start;
    K.slot = W(['Termin', 'slot'], it.i).start;
    K.both = W(['beide', 'both'], it.i).start;
    K.stat = W(['Stand', 'status'], it.i).start;
    K.aft = W(['Nachmittag', 'afternoon'], it.i).start;
    K.fix = W(['dicht', 'sealed'], it.i).start;
    const T = END + 2.1;
    el('div', 'x12bg', '<i class="g"></i>');
    const G = gl3(stage, { fov: 30, envTop: '#ffffff', envBot: '#9fb0c6', envInt: 0.95 });
    const { scene, cam, r } = G;
    r.shadowMap.enabled = false;
    scene.add(new T3.HemisphereLight('#ffffff', '#8796ad', 0.95));
    const sun = new T3.DirectionalLight('#fff1dc', 1.5); sun.position.set(-5, 9, 10); scene.add(sun);
    const B = new T3.Group(); scene.add(B);
    const FH = 2.4, BW = 5.2, DP = 2.8, SL = 0.24;
    const cutM = M.std('#2b3445', { roughness: 0.9 });
    mesh(new T3.BoxGeometry(BW + 0.44, 0.3, DP + 0.1), cutM, B, [0, -0.15, -0.05]);
    mesh(new T3.BoxGeometry(BW + 0.44, SL, DP + 0.1), cutM, B, [0, FH - SL / 2, -0.05]);
    mesh(new T3.BoxGeometry(BW + 0.44, SL, DP + 0.1), cutM, B, [0, 2 * FH - SL / 2, -0.05]);
    [-1, 1].forEach((sg) => mesh(new T3.BoxGeometry(0.22, 2 * FH, DP + 0.1), cutM, B, [sg * (BW / 2 + 0.11), FH, -0.05]));
    mesh(new T3.BoxGeometry(BW, FH - SL, 0.12), M.std('#f3e5d2', { roughness: 0.95 }), B, [0, (FH - SL) / 2, -DP / 2]);
    mesh(new T3.BoxGeometry(BW, FH - SL, 0.12), M.std('#dbe7f2', { roughness: 0.95 }), B, [0, FH + (FH - SL) / 2, -DP / 2]);
    mesh(new T3.BoxGeometry(BW, 0.05, DP), M.std('#c8935f', { roughness: 0.7 }), B, [0, 0.025, 0]);
    mesh(new T3.BoxGeometry(BW, 0.05, DP), M.std('#c3ccd6', { roughness: 0.5 }), B, [0, FH + 0.025, 0]);
    [0, 1].forEach((f) => {
      mesh(new T3.BoxGeometry(1.1, 0.9, 0.04), new T3.MeshBasicMaterial({ color: '#bfe0ff' }), B, [-1.6, f * FH + 1.3, -DP / 2 + 0.08]);
      mesh(new T3.BoxGeometry(1.22, 0.07, 0.12), M.std('#ffffff'), B, [-1.6, f * FH + 0.83, -DP / 2 + 0.1]);
      mesh(new T3.BoxGeometry(0.05, 0.9, 0.06), M.std('#ffffff'), B, [-1.6, f * FH + 1.3, -DP / 2 + 0.11]);
    });
    // lower flat: sofa, bucket under the drip, wet stain on the wall under the ceiling
    const sofaM = M.std('#4f7aa6', { roughness: 0.8 });
    mesh(rbox(1.7, 0.42, 0.8, 0.12), sofaM, B, [-1.5, 0.26, -0.75]);
    mesh(rbox(1.7, 0.6, 0.22, 0.1), sofaM, B, [-1.5, 0.62, -1.1]);
    const BX = 0.95, BZ = -0.75;
    mesh(new T3.CylinderGeometry(0.27, 0.2, 0.42, 28, 1, true), M.std('#ff8a3d', { roughness: 0.5, side: T3.DoubleSide }), B, [BX, 0.26, BZ]);
    mesh(new T3.TorusGeometry(0.27, 0.025, 8, 28), M.std('#e0712a'), B, [BX, 0.47, BZ], [Math.PI / 2, 0, 0]);
    mesh(new T3.CircleGeometry(0.2, 24), M.std('#e0712a'), B, [BX, 0.06, BZ], [-Math.PI / 2, 0, 0]);
    const bw = mesh(new T3.CircleGeometry(0.21, 24), M.std('#6fb6ec', { roughness: 0.1, metalness: 0.1 }), B, [BX, 0.1, BZ], [-Math.PI / 2, 0, 0]);
    const stain = textPlane((x, w, h) => { const g = x.createRadialGradient(w / 2, h * 0.05, 8, w / 2, h * 0.2, w * 0.48); g.addColorStop(0, 'rgba(112,82,48,0.9)'); g.addColorStop(0.5, 'rgba(135,100,60,0.55)'); g.addColorStop(1, 'rgba(135,100,60,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 256, 256, 1.7, 1.7);
    stain.position.set(BX, FH - SL - 0.85, -DP / 2 + 0.065); B.add(stain);
    const drip = mesh(new T3.CylinderGeometry(0.035, 0.035, 0.5, 10), M.std('#7cc0f0', { roughness: 0.05, transparent: true, opacity: 0.6 }), B, [BX, FH - SL - 0.25, BZ]);
    const dropM = M.std('#7cc0f0', { roughness: 0.05, metalness: 0.1, emissive: new T3.Color('#2a6fa8'), emissiveIntensity: 0.3 });
    const drops = [0, 1].map(() => mesh(new T3.SphereGeometry(0.06, 14, 10), dropM, B, [BX, 2.1, BZ], null, [1, 1.35, 1]));
    // upper flat: washing machine with a leaking hose, puddle on the tiles
    const WX = 0.9;
    mesh(rbox(0.85, 0.9, 0.75, 0.06), M.std('#f4f4f1', { roughness: 0.35 }), B, [WX, FH + 0.5, -1.0]);
    mesh(new T3.CylinderGeometry(0.27, 0.27, 0.05, 32), M.std('#8a97a6', { roughness: 0.2, metalness: 0.7 }), B, [WX, FH + 0.48, -0.61], [Math.PI / 2, 0, 0]);
    mesh(new T3.CylinderGeometry(0.21, 0.21, 0.06, 32), M.std('#2a3b52', { roughness: 0.05, metalness: 0.3 }), B, [WX, FH + 0.48, -0.6], [Math.PI / 2, 0, 0]);
    const pipeM = M.std('#c9ced4', { metalness: 0.9, roughness: 0.3 });
    mesh(new T3.CylinderGeometry(0.05, 0.05, 1.4, 16), pipeM, B, [WX + 0.62, FH + 0.85, -1.3]);
    mesh(new T3.CylinderGeometry(0.07, 0.07, 0.12, 16), M.std('#e8432d'), B, [WX + 0.62, FH + 0.38, -1.3]);
    const LEAK = new T3.Vector3(WX + 0.62, FH + 0.38, -1.22);
    mesh(rbox(1.7, 0.9, 0.7, 0.04), M.std('#ece6dc', { roughness: 0.6 }), B, [-1.45, FH + 0.5, -1.0]);
    mesh(new T3.BoxGeometry(1.76, 0.06, 0.76), M.std('#5c6b7a', { roughness: 0.4 }), B, [-1.45, FH + 0.98, -1.0]);
    const pud = mesh(new T3.CircleGeometry(1, 40), new T3.MeshStandardMaterial({ color: '#5aa9e6', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.8 }), B, [WX + 0.2, FH + 0.057, -0.55], [-Math.PI / 2, 0, 0], 0.01);
    const spray = [...Array(10)].map(() => mesh(new T3.SphereGeometry(0.035, 10, 8), dropM, B, [LEAK.x, LEAK.y, LEAK.z]));
    // people
    const person = (col, hair, x, y, z, s = 1) => {
      const P = new T3.Group(); P.position.set(x, y, z); P.scale.setScalar(s); B.add(P);
      mesh(new T3.CapsuleGeometry(0.2, 0.55, 6, 14), M.std(col, { roughness: 0.7 }), P, [0, 0.55, 0]);
      mesh(new T3.SphereGeometry(0.18, 20, 14), M.std('#e8b98f', { roughness: 0.7 }), P, [0, 1.12, 0]);
      mesh(new T3.SphereGeometry(0.185, 20, 14, 0, Math.PI * 2, 0, 1.4), M.std(hair, { roughness: 0.8 }), P, [0, 1.15, -0.01]);
      return P;
    };
    const p1 = person('#e0603e', '#2b1d16', 0.1, 0.05, -0.25), p2 = person('#3f8fd2', '#2b1d16', 0.5, 0.05, 0.25, 0.72);
    const plum = person('#2f6fd1', '#3a2a22', -2.3, FH + 0.05, -0.3);
    mesh(new T3.CylinderGeometry(0.2, 0.21, 0.09, 20), M.std('#ffb020'), plum, [0, 1.3, 0]);
    mesh(rbox(0.42, 0.26, 0.2, 0.03), M.std('#d9342b'), plum, [0.32, 0.2, 0.12]);
    // camera: close on the lower flat, pan up to the source, pull back wide for the ticket
    const camT = track([
      [0, () => ({ x: 0.45, y: 1.2, z: 10.5, lx: 0.45, ly: 1.1 })],
      [K.above - 0.4, () => ({ x: 0.5, y: 1.25, z: 10.0, lx: 0.5, ly: 1.15 })],
      [K.above + 0.45, () => ({ x: 0.75, y: 3.5, z: 10.0, lx: 0.75, ly: 3.4 })],
      [K.turn - 0.15, () => ({ x: 0.75, y: 3.5, z: 9.6, lx: 0.75, ly: 3.4 })],
      [K.turn + 0.8, () => ({ x: 0, y: 3.1, z: 25.6, lx: 0, ly: 2.36 })],
      [T, () => ({ x: 0, y: 3.1, z: 24.8, lx: 0, ly: 2.36 })],
    ]);
    // overlays
    const fam = el('div', 'x12fam', `<i>💧</i><span><b>${S.fam}</b><small>${S.famS}</small></span>`);
    tl.set(fam, { xPercent: -50 }, 0);
    tl.fromTo(fam, { autoAlpha: 0, y: -40, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2)' }, 0.02);
    tl.to(fam, { autoAlpha: 0, y: -40, duration: 0.25 }, K.turn - 0.25);
    sfx('impact', 0.05, -13);
    const dripT = [0.6, 1.8, 3.0].filter((x) => x < K.turn - 0.3);
    const dripTx = dripT.map(() => el('div', 'x12drip', S.drip));
    dripTx.forEach((e, i) => { tl.set(e, { autoAlpha: 0 }, 0); tl.fromTo(e, { autoAlpha: 0, scale: 1.5 }, { autoAlpha: 1, scale: 1, duration: 0.12, ease: 'power3.out', immediateRender: false }, dripT[i]); tl.to(e, { autoAlpha: 0, duration: 0.35 }, dripT[i] + 0.5); });
    const up = el('div', 'x12up', `<b>${S.up}</b><small>${S.upS}</small>`);
    tl.set(up, { autoAlpha: 0 }, 0);
    tl.fromTo(up, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.6)', immediateRender: false }, K.above + 0.15);
    tl.to(up, { autoAlpha: 0, scale: 0.8, duration: 0.2 }, K.turn - 0.1);
    sfx('whoosh', K.above - 0.3, -12); sfx('sting', K.above + 0.15, -14);
    // ticket card
    const tk = el('div', 'x12tk', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.tk}</b><small>${S.tkS}</small></div><em class="dn">${S.fix}</em></div>
      <div class="pr"><div class="im"><i></i><i class="d"></i></div><b>${S.foto}</b><span class="ll">${S.ll}</span></div>
      <div class="sl"><b>${S.pl}</b><span class="a">${S.s1}<i></i></span><span class="b">${S.s2}</span></div>`);
    tl.set(tk, { autoAlpha: 0 }, 0);
    tl.fromTo(tk, { autoAlpha: 0, y: -260 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power4.out', immediateRender: false }, K.turn + 0.05);
    sfx('send', K.rep, -10);
    const im = tk.querySelector('.im'), fb = tk.querySelector('.pr b'), llb = tk.querySelector('.ll'), sl = tk.querySelector('.sl'), sa = tk.querySelector('.sl .a i'), sb = tk.querySelector('.sl .b'), st = tk.querySelector('.dn');
    tl.set([im, fb, llb, sl, st], { autoAlpha: 0 }, 0);
    tl.fromTo([im, fb], { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', stagger: 0.06, immediateRender: false }, K.foto - 0.1);
    sfx('shutter', K.foto - 0.05, -8);
    tl.fromTo(llb, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power3.out', immediateRender: false }, K.ll - 0.05);
    sfx('pop', K.ll, -11);
    tl.fromTo(sl, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power3.out', immediateRender: false }, K.pl - 0.1);
    tl.set(sa, { scaleX: 0 }, 0);
    tl.fromTo(sa, { scaleX: 0 }, { scaleX: 1, duration: 0.2, ease: 'power2.out', immediateRender: false }, K.slot - 0.35);
    tl.fromTo(sb, { backgroundColor: '#fff3d6', color: '#7a5200' }, { backgroundColor: '#1fbf72', color: '#ffffff', duration: 0.2, immediateRender: false }, K.slot);
    tl.fromTo(sb, { scale: 1 }, { scale: 1.15, duration: 0.14, yoyo: true, repeat: 1, immediateRender: false }, K.slot);
    sfx('pop', K.pl, -12); sfx('chime', K.slot + 0.05, -11);
    // both units see the status
    const seen = S.u.map((u) => el('div', 'x12seen', `<b>${u}</b><small>${S.seen}</small>`));
    seen.forEach((s, i) => { tl.set(s, { autoAlpha: 0 }, 0); tl.fromTo(s, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.28, ease: 'back.out(2.6)', immediateRender: false }, K.both - 0.05 + i * 0.25); tl.to(s, { autoAlpha: 0, duration: 0.2 }, K.aft - 0.2); sfx('pop', K.both + i * 0.25, -12); });
    // afternoon: sealed
    const clk = el('div', 'x12clk', S.clk);
    tl.set(clk, { autoAlpha: 0 }, 0);
    tl.fromTo(clk, { autoAlpha: 0, rotationX: -90 }, { autoAlpha: 1, rotationX: 0, duration: 0.3, ease: 'power3.out', immediateRender: false }, K.aft - 0.1);
    sfx('refresh', K.aft - 0.15, -13);
    const ok = el('div', 'x12ok', S.fix);
    tl.set(ok, { autoAlpha: 0 }, 0);
    tl.fromTo(ok, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.6)', immediateRender: false }, K.fix - 0.05);
    tl.fromTo(st, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, K.fix);
    sfx('chime', K.fix, -9);
    // drip sounds while it leaks
    for (let x = 0.6; x < K.aft; x += 0.6) sfx('drip', x, x < K.turn ? -12 : -22);
    const v3 = new T3.Vector3();
    const proj = (p) => { v3.copy(p).project(cam); return [(v3.x * 0.5 + 0.5) * 1080, (-v3.y * 0.5 + 0.5) * 1920]; };
    const A_LO = new T3.Vector3(-1.7, 1.95, 0.9), A_UP = new T3.Vector3(-1.7, FH + 1.95, 0.9), A_LEAK = new T3.Vector3(LEAK.x - 0.4, LEAK.y + 1.25, LEAK.z + 0.4), A_BUCK = new T3.Vector3(BX, 0.75, BZ);
    const leakOn = (t) => 1 - E.io(seg(t, K.aft + 0.15, 0.6));
    const grow = (t) => clamp(t / (K.aft + 0.2));
    perFrame((t) => {
      const L = leakOn(t), g = grow(t);
      drops.forEach((d, i) => { const p = (((t + i * 0.6) / 1.2) % 1 + 1) % 1; d.position.set(BX, 2.12 - 1.66 * p * p, BZ); d.visible = L > 0.5 && p < 0.97; });
      drip.visible = L > 0.5;
      bw.position.y = 0.1 + 0.28 * g; bw.scale.setScalar(0.95 + 0.25 * g);
      stain.material.opacity = (0.3 + 0.7 * clamp(g * 1.5)) * (1 - 0.4 * (1 - L));
      spray.forEach((s, k) => { const p = (t * 1.3 + k / spray.length) % 1; s.position.set(LEAK.x - 0.4 * p - 0.03 * (k % 3), LEAK.y + 0.16 * p - 0.48 * p * p, LEAK.z + 0.3 * p + 0.03 * (k % 4)); s.visible = L > 0.3; });
      const ps = (0.2 + 0.8 * clamp(g * 1.3)) * L; pud.scale.set(Math.max(1e-4, ps * 0.95), Math.max(1e-4, ps * 0.6), 1); pud.visible = ps > 0.01;
      p1.rotation.y = 0.4 + Math.sin(t * 1.2) * 0.12; p2.rotation.y = -0.3 + Math.sin(t * 1.5 + 1) * 0.15;
      const w = E.io(seg(t, K.slot + 0.25, 0.9)); plum.position.x = -2.3 + 2.45 * w; plum.visible = t > K.slot + 0.2;
      const c = camT(t); cam.position.set(c.x + Math.sin(t * 0.3) * 0.2, c.y, c.z); cam.lookAt(c.lx, c.ly, 0);
      scene.updateMatrixWorld(); cam.updateMatrixWorld();
      [[seen[0], A_LO], [seen[1], A_UP], [up, A_LEAK], [ok, A_LEAK]].forEach(([e, a]) => { const [x, y] = proj(a); e.style.left = `${x}px`; e.style.top = `${y}px`; });
      dripTx.forEach((e, i) => { const [x, y] = proj(A_BUCK); e.style.left = `${x + 70 + i * 20}px`; e.style.top = `${y - 200 - i * 40}px`; });
      G.r.render(scene, cam);
    });
    const lk = el('div', 'x12lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X13: New Year's meter reading — kinetic: midnight, empty note, January clash, entered once, both see same number =================
  function X13() {
    const de = lang === 'de';
    const S = de ? {
      nye: 'Silvester', meter: 'Zählerstand', note: 'Notiz', empty: '???', jan: 'Januar', a: '12.480', b: '12.840', r1: 'Mieter', r2: 'Vermieter',
      card: 'Zählerstand · Whg 3', cardS: 'Heizung · 31.12. 23:58', unit: 'kWh', entered: 'einmal eingetragen ✓', same: 'dieselbe Zahl ✓', seen: 'sofort sichtbar',
      bill: 'Abrechnung 2026', line: 'Heizung', zero: '0 Diskussionen', tag: 'für Mieter & Vermieter',
    } : {
      nye: "New Year's Eve", meter: 'Meter reading', note: 'Note', empty: '???', jan: 'January', a: '12,480', b: '12,840', r1: 'Tenant', r2: 'Landlord',
      card: 'Meter reading · Unit 3', cardS: 'Heating · Dec 31, 11:58 pm', unit: 'kWh', entered: 'entered once ✓', same: 'same number ✓', seen: 'visible instantly',
      bill: 'Statement 2026', line: 'Heating', zero: '0 debates', tag: 'for tenants & landlords',
    };
    const K = {};
    K.mid = W(['null', 'midnight']).start;
    K.note = W(['notiert', 'reading']).start;
    K.jan = W(['Januar', 'January']).start;
    K.argue = W(['streiten', 'argue']).start;
    K.zahl = W(['Zahl', 'number'], W(['streiten', 'argue']).i).start;
    const it = W(['Mit', 'With'], W(['streiten', 'argue']).i); K.turn = it.start;
    K.once = W(['einmal', 'once'], it.i).start;
    K.both = W(['beide', 'both'], it.i).start;
    K.same = W(['dieselbe', 'same'], it.i).start;
    K.bill = W(['Abrechnung', 'statement'], it.i).start;
    K.ohne = W(['ohne', 'without'], it.i).start;
    const T = END + 2.1;
    const digs = S.a.replace(/[^0-9]/g, '');
    const fmt = (s) => (de ? s.replace(/(\d{2})(\d{3})$/, '$1.$2') : s.replace(/(\d{2})(\d{3})$/, '$1,$2'));

    // ---- night sky with fireworks, fades to day at the turn ----
    const bg = el('div', 'x13bg', '<i class="n"></i><i class="d"></i>');
    const night = bg.querySelector('.n');
    const fw = [...Array(5)].map((_, i) => el('i', 'x13fw', null, bg));
    perFrame((t) => fw.forEach((f, i) => {
      const per = 1.7, ph = (t + i * 0.37) % per, k = ph / per;
      const on = t < K.jan - 0.3 ? 1 : 0;
      f.style.left = `${120 + ((i * 197) % 840)}px`; f.style.top = `${120 + ((i * 131) % 380)}px`;
      f.style.transform = `scale(${0.2 + 1.3 * E.oc(k)})`; f.style.opacity = `${on * (1 - k) * 0.9}`;
      f.style.borderColor = ['#ffd36b', '#ff6b4a', '#7fd6ff', '#c49bff', '#1fbf72'][i];
    }));
    tl.to(night, { autoAlpha: 0, duration: 0.6, ease: 'power2.inOut' }, K.jan - 0.3);
    // midnight clock
    const clk = el('div', 'x13clk', `<small>${S.nye}</small><b><span class="h">23</span>:<span class="m">59</span></b>`);
    const hh = clk.querySelector('.h'), mm = clk.querySelector('.m');
    tl.set(clk, { xPercent: -50 }, 0);
    tl.fromTo(clk, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, 0.02);
    tl.call(() => { hh.textContent = '00'; mm.textContent = '00'; }, null, K.mid);
    tl.call(() => { hh.textContent = '23'; mm.textContent = '59'; }, null, Math.max(0.01, K.mid - 0.02));
    tl.fromTo(clk, { scale: 1 }, { scale: 1.12, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }, K.mid);
    sfx('pop', 0.05, -10); sfx('impact', K.mid, -12);
    // meter with rolling odometer
    const mt = el('div', 'x13mt', `<div class="hd">🔥 ${S.meter}</div><div class="od">${digs.split('').map(() => '<span><b class="r"><i>' + [...'0123456789'].join('</i><i>') + '</i></b></span>').join('')}<em>${S.unit}</em></div>`);
    const cols = [...mt.querySelectorAll('.od span')];
    tl.set(mt, { xPercent: -50 }, 0);
    tl.fromTo(mt, { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.35);
    perFrame((t) => {
      const v = 12460 + Math.min(20, Math.floor(seg(t, 0.4, K.note - 0.4) * 20));
      const s = String(v);
      cols.forEach((c, i) => { c.firstChild.style.transform = `translateY(${-Number(s[i]) * 120}px)`; });
    });
    // empty note with question marks
    const nt = el('div', 'x13nt', `<div class="hd">📝 ${S.note}</div><div class="ln"><span>${S.meter}:</span><b>${S.empty}</b></div>`);
    const q = nt.querySelector('b');
    tl.set(nt, { xPercent: -50 }, 0);
    tl.fromTo(nt, { autoAlpha: 0, rotation: -8, y: 80 }, { autoAlpha: 1, rotation: -3, y: 0, duration: 0.4, ease: 'back.out(1.8)' }, K.note - 0.45);
    tl.fromTo(q, { scale: 0.3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, K.note + 0.05);
    sfx('whoosh', K.note - 0.45, -14); sfx('buzz', K.note + 0.1, -16);
    tl.to([clk, mt, nt], { autoAlpha: 0, y: '-=90', duration: 0.3, ease: 'power2.in', stagger: 0.04 }, K.jan - 0.35);
    // January: two different numbers clash
    const jn = el('div', 'x13jan', `📅 ${S.jan}`);
    tl.set(jn, { xPercent: -50 }, 0);
    tl.fromTo(jn, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, K.jan - 0.05);
    const bl = [[S.r1, S.a, 'l'], [S.r2, S.b, 'r']].map(([r, n, c]) => el('div', `x13bub ${c}`, `<small>${r}</small><b>${n}</b><em>${S.unit}</em>`));
    bl.forEach((b, i) => {
      tl.set(b, { autoAlpha: 0 }, 0);
      tl.fromTo(b, { autoAlpha: 0, x: i ? 260 : -260, rotation: i ? 8 : -8 }, { autoAlpha: 1, x: 0, rotation: i ? 3 : -3, duration: 0.4, ease: 'back.out(1.8)', immediateRender: false }, K.argue - 0.2 + i * 0.35);
      sfx('pop', K.argue - 0.15 + i * 0.35, -10);
    });
    const vs = el('div', 'x13vs', '⚡');
    tl.set(vs, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(vs, { autoAlpha: 0, scale: 0.2 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(3)', immediateRender: false }, K.zahl - 0.1);
    perFrame((t) => { const a = seg(t, K.zahl, 0.2) * (1 - seg(t, K.turn - 0.4, 0.1)); bl.forEach((b, i) => { b.style.translate = `${Math.sin(t * 40 + i) * 6 * a}px 0`; }); });
    sfx('sting', K.zahl - 0.1, -12);
    tl.to([jn, ...bl, vs], { autoAlpha: 0, y: '-=80', duration: 0.3, ease: 'power2.in', stagger: 0.03 }, K.turn - 0.32);
    // Tenance card: reading typed in once
    const cd = el('div', 'x13card', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.card}</b><small>${S.cardS}</small></div></div>
      <div class="in"><span class="v"></span><i class="cur"></i><em>${S.unit}</em></div><div class="ok">${S.entered}</div>`);
    const v = cd.querySelector('.v'), cur = cd.querySelector('.cur'), ok = cd.querySelector('.ok');
    tl.set(cd, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(cd, { autoAlpha: 0, y: 260 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.2, -9);
    const tType = K.turn + 0.45, dType = Math.max(0.6, K.once - tType);
    perFrame((t) => {
      const n = Math.round(digs.length * seg(t, tType, dType));
      v.textContent = n === digs.length ? fmt(digs) : digs.slice(0, n);
      cur.style.opacity = (t < K.once + 0.2 && Math.floor(t * 4) % 2 === 0) ? 1 : 0;
    });
    sfx('typing', tType, -10);
    tl.set(ok, { autoAlpha: 0 }, 0);
    tl.fromTo(ok, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.6)', immediateRender: false }, K.once + 0.1);
    sfx('chime', K.once + 0.15, -12);
    tl.to(cd, { autoAlpha: 0, y: -140, scale: 0.85, duration: 0.32, ease: 'power2.in' }, K.both - 0.35);
    // both phones show the same number
    const ph = [S.r1, S.r2].map((r, i) => el('div', `x13ph ${i ? 'r' : 'l'}`, `<div class="tp"><span>${i ? '🏠' : '👤'}</span><b>${r}</b></div><small>${S.meter}</small><div class="n">${S.a}<em>${S.unit}</em></div><i class="okc">✓</i>`));
    ph.forEach((p, i) => {
      tl.set(p, { autoAlpha: 0 }, 0);
      tl.fromTo(p, { autoAlpha: 0, y: 220, rotation: i ? 6 : -6 }, { autoAlpha: 1, y: 0, rotation: i ? 2 : -2, duration: 0.42, ease: 'back.out(1.6)', immediateRender: false }, K.both - 0.2 + i * 0.08);
      const ck = p.querySelector('.okc');
      tl.set(ck, { autoAlpha: 0 }, 0);
      tl.fromTo(ck, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(3)', immediateRender: false }, K.same + i * 0.08);
    });
    const eq = el('div', 'x13eq', '=');
    tl.set(eq, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(eq, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(3)', immediateRender: false }, K.same);
    const sm = el('div', 'x13same', S.same);
    tl.set(sm, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(sm, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.6)', immediateRender: false }, K.same + 0.2);
    sfx('whoosh', K.both - 0.15, -12); sfx('pop', K.same, -10); sfx('chime', K.same + 0.25, -11);
    tl.to([...ph, eq, sm], { autoAlpha: 0, y: '-=80', duration: 0.3, ease: 'power2.in', stagger: 0.03 }, K.bill - 0.35);
    // statement: line item with the agreed number, zero debates
    const bi = el('div', 'x13bill', `<div class="hd">🧾 ${S.bill}</div><div class="li"><span>🔥 ${S.line}</span><b>${S.a} ${S.unit}</b><em>✓</em></div><div class="li g"><span></span><b></b></div><div class="li g"><span></span><b></b></div><div class="z">${S.zero}</div>`);
    const z = bi.querySelector('.z'), lck = bi.querySelector('.li em');
    tl.set(bi, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(bi, { autoAlpha: 0, y: 200 }, { autoAlpha: 1, y: 0, duration: 0.42, ease: 'power4.out', immediateRender: false }, K.bill - 0.2);
    tl.set([z, lck], { autoAlpha: 0 }, 0);
    tl.fromTo(lck, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(3)', immediateRender: false }, K.bill + 0.35);
    tl.fromTo(z, { autoAlpha: 0, scale: 2, rotation: 0 }, { autoAlpha: 1, scale: 1, rotation: -5, duration: 0.22, ease: 'power4.in', immediateRender: false }, K.ohne);
    sfx('receipts', K.bill - 0.2, -12); sfx('pop', K.bill + 0.35, -11); sfx('thud', K.ohne + 0.18, -8);
    const lk = el('div', 'x13lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X14: cold bathroom radiator — 3D radiator (frost -> warm), plumber "next week?", tenant picks slot, landlord confirms, Thu 8:00 heat on =================
  function X14() {
    const de = lang === 'de';
    const S = de ? {
      room: 'Bad', cold: '16 °C', warm: '22 °C', plumb: 'Installateur', next: 'nächste Woche', when: 'wann genau?', days: ['Mo', 'Di', 'Mi', 'Do', 'Fr'],
      card: 'Termin wählen', cardS: 'Heizung Bad · Whg 3', times: ['08:00', '11:00', '14:00'], r1: 'Mieterin', r2: 'Vermieter', req: 'Do · 08:00 angefragt',
      conf: 'Bestätigen', done: '✓ Bestätigt', slot: 'Do · 08:00', on: 'Heizung läuft ✓', tag: 'für Mieter & Vermieter',
    } : {
      room: 'Bathroom', cold: '61 °F', warm: '72 °F', plumb: 'Plumber', next: 'next week', when: 'when exactly?', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      card: 'Pick a slot', cardS: 'Bathroom heating · Unit 3', times: ['8:00', '11:00', '2:00'], r1: 'Tenant', r2: 'Landlord', req: 'Thu · 8:00 a.m. requested',
      conf: 'Confirm', done: '✓ Confirmed', slot: 'Thu · 8:00 a.m.', on: 'heat is on ✓', tag: 'for tenants & landlords',
    };
    const K = {};
    K.kalt = W(['kalt', 'cold']).start;
    K.plumb = W(['Installateur', 'plumber']).start;
    K.week = W(['Woche', 'week']).start;
    K.when = W(['wann', 'when']).start;
    const it = W(['Mit', 'With'], W(['wann', 'when']).i); K.turn = it.start;
    K.pick = W(['wählt', 'picks'], it.i).start;
    K.slot = W(['Termin', 'slot'], it.i).start;
    K.ll = W(['Vermieter', 'landlord'], it.i).start;
    K.conf = W(['bestätigt', 'confirms'], it.i).start;
    K.tap = W(['Tipp', 'tap'], it.i).start;
    K.thu = W(['Donnerstag', 'Thursday'], it.i).start;
    K.heat = W(['läuft', 'back'], it.i).start;
    const T = END + 2.1;
    el('div', 'x14bg', '<i class="g"></i>');
    // ---- 3D radiator ----
    const G = gl3(stage, { fov: 30, envTop: '#ffffff', envBot: '#9fb3c4', envInt: 1.0 });
    const { r, scene, cam } = G;
    scene.add(new T3.HemisphereLight(0xffffff, 0x9fb3c4, 0.6));
    const key = new T3.DirectionalLight(0xffffff, 1.6); key.position.set(-3, 5, 6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key);
    const rig = new T3.Group(); scene.add(rig);
    const radMat = M.phy('#dfe8f0', { roughness: 0.35, clearcoat: 0.8, emissive: new T3.Color('#ff5a1f'), emissiveIntensity: 0 });
    const NC = 9, CW = 0.24;
    for (let i = 0; i < NC; i++) mesh(new T3.CapsuleGeometry(0.1, 1.25, 8, 20), radMat, rig, [-(NC - 1) * CW / 2 + i * CW, 0, 0]);
    mesh(new T3.CylinderGeometry(0.075, 0.075, NC * CW + 0.1, 20), radMat, rig, [0, 0.62, 0], [0, 0, Math.PI / 2]);
    mesh(new T3.CylinderGeometry(0.075, 0.075, NC * CW + 0.1, 20), radMat, rig, [0, -0.62, 0], [0, 0, Math.PI / 2]);
    const valve = mesh(new T3.CylinderGeometry(0.11, 0.11, 0.22, 24), M.std('#f4f6f8', { roughness: 0.3 }), rig, [(NC * CW) / 2 + 0.18, 0.62, 0.02], [0, 0, Math.PI / 2]);
    mesh(new T3.CylinderGeometry(0.035, 0.035, 0.9, 12), M.std('#b9c3cc', { metalness: 0.7, roughness: 0.3 }), rig, [-(NC * CW) / 2 - 0.1, -1.05, 0]);
    const wall = mesh(new T3.PlaneGeometry(14, 10), M.std('#eef3f6', { roughness: 0.9 }), scene, [0, 0, -0.35]);
    wall.castShadow = false;
    // tiles
    const tileTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#eef3f6'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#d3dde4'; x.lineWidth = 6; for (let i = 0; i <= 256; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); } const t = new T3.CanvasTexture(c); t.wrapS = t.wrapT = T3.RepeatWrapping; t.repeat.set(6, 4); t.colorSpace = T3.SRGBColorSpace; return t; })();
    wall.material.map = tileTex; wall.material.color.set('#ffffff');
    // frost + heat particles
    const mkTex = (inner, outer) => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, inner); g.addColorStop(1, outer); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T3.CanvasTexture(c); };
    const frostT = mkTex('rgba(200,230,255,1)', 'rgba(200,230,255,0)'), heatT = mkTex('rgba(255,120,50,0.55)', 'rgba(255,120,60,0)');
    const parts = [...Array(26)].map((_, i) => { const s = new T3.Sprite(new T3.SpriteMaterial({ map: frostT, transparent: true, depthWrite: false })); rig.add(s); return { s, ph: (i * 0.618) % 1, x: ((i * 37) % 23) / 23 - 0.5 }; });
    const heat = [...Array(18)].map((_, i) => { const s = new T3.Sprite(new T3.SpriteMaterial({ map: heatT, transparent: true, depthWrite: false })); rig.add(s); return { s, ph: (i * 0.618) % 1, x: ((i * 41) % 19) / 19 - 0.5 }; });
    const cold = new T3.Color('#bcd8f0'), hot = new T3.Color('#f3e6dc');
    const camT = track([
      [0, () => ({ x: 0.3, y: 0.15, z: 9.6, ry: -0.18, s: 1, py: 0.2 })],
      [K.plumb - 0.2, () => ({ x: 0, y: 0.1, z: 12, ry: 0.05, s: 1, py: -0.25 })],
      [K.turn - 0.1, () => ({ x: 0, y: 0.1, z: 12, ry: 0.05, s: 1, py: -0.25 })],
      [K.turn + 0.4, () => ({ x: 0, y: 0.1, z: 12, ry: 0.05, s: 0, py: -0.25 })],
      [K.thu - 0.2, () => ({ x: 0, y: 0.1, z: 12, ry: 0.05, s: 0, py: -0.25 })],
      [K.thu + 0.4, () => ({ x: -0.2, y: 0.1, z: 9.4, ry: 0.16, s: 1, py: 0.15 })],
      [T, () => ({ x: -0.35, y: 0.1, z: 8.8, ry: 0.22, s: 1, py: 0.15 })],
    ]);
    perFrame((t) => {
      const p = camT(t);
      cam.position.set(p.x, p.y, p.z); cam.lookAt(0, 0, 0);
      rig.rotation.y = p.ry; rig.position.y = p.py; rig.scale.setScalar(Math.max(1e-4, p.s)); rig.visible = p.s > 0.01; wall.visible = rig.visible;
      const w = E.io(seg(t, K.thu + 0.1, Math.max(0.8, K.heat - K.thu + 0.3)));
      radMat.color.copy(cold).lerp(hot, w); radMat.emissiveIntensity = 0.32 * w;
      valve.rotation.x = -2.2 * w;
      parts.forEach((P) => { const k = (t * 0.25 + P.ph) % 1; P.s.position.set(P.x * 2.4, -0.7 + k * 1.6, 0.25 + 0.1 * Math.sin(P.ph * 9)); P.s.scale.setScalar(0.08 + 0.06 * Math.sin(P.ph * 7 + t)); P.s.material.opacity = (1 - w) * 0.85 * Math.sin(Math.PI * k); });
      heat.forEach((P) => { const k = (t * 0.5 + P.ph) % 1; P.s.position.set(P.x * 2.2 + Math.sin(t * 2 + P.ph * 6) * 0.08, 0.7 + k * 1.4, 0.15); P.s.scale.setScalar(0.25 + 0.5 * k); P.s.material.opacity = w * 0.45 * Math.sin(Math.PI * k); });
      r.render(scene, cam);
    });
    // temp chip
    const tc = el('div', 'x14tmp', `<span>🛁 ${S.room}</span><b>${S.cold}</b>`);
    const tb = tc.querySelector('b');
    tl.set(tc, { xPercent: -50 }, 0);
    tl.fromTo(tc, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, 0.05);
    tl.fromTo(tb, { scale: 1 }, { scale: 1.2, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }, K.kalt);
    sfx('shiver', K.kalt - 0.1, -12);
    tl.to(tc, { autoAlpha: 0, y: -60, duration: 0.3, ease: 'power2.in' }, K.plumb - 0.35);
    // plumber calendar with question marks
    const pc = el('div', 'x14cal', `<div class="hd">🔧 ${S.plumb}</div><small>${S.next}</small><div class="ds">${S.days.map((d) => `<span><b>${d}</b><i>?</i></span>`).join('')}</div><em>${S.when}</em>`);
    const qs = [...pc.querySelectorAll('.ds i')], wh = pc.querySelector('em');
    tl.set(pc, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(pc, { autoAlpha: 0, y: -60 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'back.out(1.6)', immediateRender: false }, K.plumb - 0.15);
    tl.set(qs, { autoAlpha: 0 }, 0);
    tl.fromTo(qs, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(3)', stagger: 0.08, immediateRender: false }, K.week);
    tl.set(wh, { autoAlpha: 0 }, 0);
    tl.fromTo(wh, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, K.when);
    perFrame((t) => { const a = seg(t, K.when, 0.2); qs.forEach((q, i) => { q.style.translate = `0 ${Math.sin(t * 6 + i) * 6 * a}px`; }); });
    sfx('whoosh', K.plumb - 0.2, -13); sfx('pop', K.week, -12); sfx('buzz', K.when + 0.05, -16);
    tl.to(pc, { autoAlpha: 0, y: -80, duration: 0.3, ease: 'power2.in' }, K.turn - 0.32);
    // app: tenant picks a slot
    const ap = el('div', 'x14app', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.card}</b><small>${S.cardS}</small></div><em>👤 ${S.r1}</em></div>
      <div class="gr"><div class="c0"></div>${S.days.map((d) => `<div class="dh">${d}</div>`).join('')}
      ${S.times.map((tm, ri) => `<div class="th">${tm}</div>${S.days.map((d, ci) => `<div class="sl ${(ri + ci) % 3 === 1 ? 'x' : ''}" data-k="${ri}-${ci}"></div>`).join('')}`).join('')}</div>
      <div class="rqs">${S.req}</div><i class="tp"></i>`);
    const pickCell = ap.querySelector('[data-k="0-3"]'), rq = ap.querySelector('.rqs'), tp = ap.querySelector('.tp');
    pickCell.classList.remove('x');
    tl.set(ap, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(ap, { autoAlpha: 0, y: 260 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.2, -9);
    tl.set(tp, { autoAlpha: 0 }, 0);
    tl.fromTo(tp, { autoAlpha: 0, scale: 1.6, left: 820, top: 640 }, { autoAlpha: 1, scale: 1, left: 708, top: 242, duration: 0.45, ease: 'power3.out', immediateRender: false }, K.pick - 0.1);
    tl.to(tp, { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 }, K.slot - 0.1);
    tl.fromTo(pickCell, { backgroundColor: '#e8f3f5' }, { backgroundColor: '#2f8f9d', duration: 0.15, immediateRender: false }, K.slot - 0.05);
    tl.to(tp, { autoAlpha: 0, duration: 0.2 }, K.slot + 0.3);
    tl.set(rq, { autoAlpha: 0 }, 0);
    tl.fromTo(rq, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, K.slot + 0.15);
    sfx('pop', K.slot - 0.05, -9); sfx('send', K.slot + 0.2, -12);
    tl.to(ap, { autoAlpha: 0, y: -120, scale: 0.85, duration: 0.32, ease: 'power2.in' }, K.ll - 0.4);
    // landlord confirms with one tap
    const lc = el('div', 'x14ll', `<div class="tp"><span>🏠</span><b>${S.r2}</b></div><div class="rqs">🔧 ${S.slot}<small>${S.cardS}</small></div><div class="bt"><span class="a">${S.conf}</span><span class="b">${S.done}</span></div><i class="fgr"></i>`);
    const ba = lc.querySelector('.a'), bb = lc.querySelector('.b'), fg = lc.querySelector('.fgr'), btn = lc.querySelector('.bt');
    tl.set(lc, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(lc, { autoAlpha: 0, y: 240, rotation: 3 }, { autoAlpha: 1, y: 0, rotation: 0, duration: 0.42, ease: 'back.out(1.5)', immediateRender: false }, K.ll - 0.2);
    tl.set([bb, fg], { autoAlpha: 0 }, 0);
    tl.fromTo(fg, { autoAlpha: 0, scale: 1.6, x: 140, y: 160 }, { autoAlpha: 1, scale: 1, x: 0, y: 0, duration: 0.4, ease: 'power3.out', immediateRender: false }, K.conf - 0.1);
    const tTap = Math.max(K.conf + 0.35, K.tap - 0.1);
    tl.to(btn, { scale: 0.92, duration: 0.08, yoyo: true, repeat: 1 }, tTap);
    tl.to(ba, { autoAlpha: 0, duration: 0.12 }, tTap + 0.08);
    tl.fromTo(bb, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.28, ease: 'back.out(2.6)', immediateRender: false }, tTap + 0.08);
    tl.to(fg, { autoAlpha: 0, duration: 0.2 }, tTap + 0.35);
    sfx('pop', tTap, -8); sfx('chime', tTap + 0.12, -11);
    tl.to(lc, { autoAlpha: 0, y: -100, duration: 0.3, ease: 'power2.in' }, K.thu - 0.3);
    // Thursday 8:00, heat on
    const sb = el('div', 'x14slot', `📅 ${S.slot} <em>✓</em>`);
    tl.set(sb, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(sb, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, K.thu - 0.05);
    const tw = el('div', 'x14tmp w', `<span>🛁 ${S.room}</span><b>${S.cold}</b>`);
    const twb = tw.querySelector('b');
    tl.set(tw, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(tw, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, K.thu + 0.3);
    tl.call(() => { twb.textContent = S.warm; }, null, K.heat - 0.1);
    tl.call(() => { twb.textContent = S.cold; }, null, K.heat - 0.12);
    tl.fromTo(twb, { scale: 1 }, { scale: 1.25, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }, K.heat - 0.1);
    sfx('heater', K.thu + 0.3, -10); sfx('chime', K.heat, -11);
    const lk = el('div', 'x14lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X15: three problems lost in three chats -> three tickets with status both sides see: reported, seen, done =================
  function X15() {
    const de = lang === 'de';
    const S = de ? {
      p: [['🪟', 'Fenster zieht'], ['🔔', 'Klingel kaputt'], ['💡', 'Kellerlicht aus']], apps: [['💬', '#25d366'], ['✉️', '#2f7ff0'], ['📱', '#8e99a6']],
      n1: '3 Nachrichten', n2: '3 Chats', read: 'gelesen · vor 5 Tagen', none: 'nichts passiert …',
      board: 'Tickets · Lindenstr. 8', st: ['Gemeldet', 'Gesehen', 'Erledigt'], r1: 'Mieter', r2: 'Vermieter', vis: 'sichtbar für beide', tag: 'für Mieter & Vermieter',
    } : {
      p: [['🪟', 'Drafty window'], ['🔔', 'Doorbell broken'], ['💡', 'Basement light out']], apps: [['💬', '#25d366'], ['✉️', '#2f7ff0'], ['📱', '#8e99a6']],
      n1: '3 messages', n2: '3 chats', read: 'read · 5 days ago', none: 'nothing happens …',
      board: 'Tickets · Linden St', st: ['Reported', 'Seen', 'Done'], r1: 'Tenant', r2: 'Landlord', vis: 'visible to both', tag: 'for tenants & landlords',
    };
    const K = {};
    K.p = [W(['Fenster', 'window']).start, W(['Klingel', 'doorbell']).start, W(['Licht', 'basement']).start];
    const i3 = W(['drei', 'three']); K.msg = i3.start;
    K.chat = W(['drei', 'three'], i3.i).start;
    K.nix = W(['nichts', 'nothing']).start;
    const it = W(['Mit', 'With'], W(['nichts', 'nothing']).i); K.turn = it.start;
    K.ticket = W(['Ticket', 'ticket'], it.i).start;
    K.status = W(['Status', 'status'], it.i).start;
    K.t1 = W(['Mieter', 'tenant'], it.i).start;
    K.t2 = W(['Vermieter', 'landlord'], it.i).start;
    K.rep = W(['Gemeldet', 'reported'], it.i).start;
    K.seen = W(['gesehen', 'seen'], it.i).start;
    K.done = W(['erledigt', 'done'], it.i).start;
    const T = END + 2.1;
    el('div', 'x15bg', '<i class="g"></i>');
    // ---- hook: three chat bubbles from three apps ----
    const bub = S.p.map(([ic, tx], i) => el('div', `x15bub b${i}`, `<span class="ap" style="background:${S.apps[i][1]}">${S.apps[i][0]}</span><div class="tx"><b>${ic} ${tx}</b><small>${S.read}</small></div>`));
    bub.forEach((b, i) => {
      tl.set(b, { autoAlpha: 0 }, 0);
      tl.fromTo(b, { autoAlpha: 0, x: i % 2 ? 300 : -300, scale: 0.7 }, { autoAlpha: 1, x: 0, scale: 1, duration: 0.38, ease: 'back.out(1.8)', immediateRender: false }, Math.max(0.02, K.p[i] - 0.12));
      sfx('pop', Math.max(0.05, K.p[i] - 0.1), -9);
    });
    const ct = el('div', 'x15cnt', `<span>${S.n1}</span><span>${S.n2}</span>`);
    const cs = [...ct.querySelectorAll('span')];
    tl.set(ct, { xPercent: -50 }, 0);
    tl.set(cs, { autoAlpha: 0 }, 0);
    tl.fromTo(cs[0], { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.28, ease: 'back.out(2.6)', immediateRender: false }, K.msg);
    tl.fromTo(cs[1], { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.28, ease: 'back.out(2.6)', immediateRender: false }, K.chat);
    sfx('buzz', K.msg, -15); sfx('buzz', K.chat, -15);
    // nothing happens: bubbles grey out, "read 5 days ago", dust
    const smalls = bub.map((b) => b.querySelector('small'));
    tl.set(smalls, { autoAlpha: 0 }, 0);
    tl.fromTo(smalls, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, stagger: 0.08, immediateRender: false }, K.nix);
    tl.to(bub, { filter: 'grayscale(1)', opacity: 0.55, duration: 0.4, stagger: 0.06 }, K.nix + 0.1);
    const no = el('div', 'x15none', S.none);
    tl.set(no, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(no, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out', immediateRender: false }, K.nix + 0.15);
    sfx('sting', K.nix, -16);
    tl.to([ct, no], { autoAlpha: 0, duration: 0.25 }, K.turn - 0.3);
    // ---- turn: bubbles fly into the ticket board ----
    const bd = el('div', 'x15board', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.board}</b></div><span class="ey e1">👤 ${S.r1}</span><span class="ey e2">🏠 ${S.r2}</span></div>
      ${S.p.map(([ic, tx], i) => `<div class="tk"><span class="id">#${101 + i}</span><b>${ic} ${tx}</b><span class="pl"><i class="s0">${S.st[0]}</i><i class="s1">${S.st[1]}</i><i class="s2">${S.st[2]}</i></span></div>`).join('')}
      <div class="vs">👁 ${S.vis}</div>`);
    const tks = [...bd.querySelectorAll('.tk')], pls = [...bd.querySelectorAll('.pl')], eys = [...bd.querySelectorAll('.ey')], vs = bd.querySelector('.vs');
    tl.set(bd, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.to(bub, { autoAlpha: 0, y: 260, scale: 0.6, duration: 0.32, ease: 'power3.in', stagger: 0.05 }, K.turn - 0.25);
    tl.fromTo(bd, { autoAlpha: 0, y: 220 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power4.out', immediateRender: false }, K.turn + 0.05);
    sfx('whoosh', K.turn - 0.2, -9);
    tl.set(tks, { autoAlpha: 0 }, 0);
    tl.fromTo(tks, { autoAlpha: 0, x: -160 }, { autoAlpha: 1, x: 0, duration: 0.32, ease: 'back.out(1.8)', stagger: 0.12, immediateRender: false }, Math.min(K.ticket - 0.25, K.turn + 0.5));
    tks.forEach((_, i) => sfx('pop', Math.min(K.ticket - 0.2, K.turn + 0.55) + i * 0.12, -12));
    tl.set(pls, { autoAlpha: 0 }, 0);
    tl.fromTo(pls, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2.6)', stagger: 0.07, immediateRender: false }, K.status - 0.05);
    sfx('chime', K.status, -13);
    tl.set([...eys, vs], { autoAlpha: 0 }, 0);
    tl.fromTo(eys[0], { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'back.out(2.4)', immediateRender: false }, K.t1);
    tl.fromTo(eys[1], { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'back.out(2.4)', immediateRender: false }, K.t2);
    tl.fromTo(vs, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, K.t2 + 0.35);
    sfx('pop', K.t1, -12); sfx('pop', K.t2, -12);
    // status progression on every ticket: reported -> seen -> done
    const stepAt = [K.rep, K.seen, K.done];
    pls.forEach((p) => {
      const it3 = [...p.querySelectorAll('i')];
      tl.set(it3, { autoAlpha: 0 }, 0);
      tl.set(it3[0], { autoAlpha: 1 }, K.status - 0.05);
      [1, 2].forEach((k) => { tl.set(it3[k - 1], { autoAlpha: 0 }, stepAt[k] - 0.02); tl.fromTo(it3[k], { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.22, ease: 'back.out(3)', immediateRender: false }, stepAt[k] - 0.02); });
    });
    const tr = el('div', 'x15trk', `${S.st.map((s, i) => `<span class="k${i}"><i>${i + 1}</i><b>${s}</b></span>`).join('<em></em>')}`);
    const st = [...tr.querySelectorAll('span')], ln = [...tr.querySelectorAll('em')];
    tl.set(tr, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(tr, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power3.out', immediateRender: false }, K.rep - 0.25);
    st.forEach((s, i) => { tl.fromTo(s, { opacity: 0.35 }, { opacity: 1, duration: 0.2, immediateRender: false }, stepAt[i] - 0.02); tl.fromTo(s, { scale: 1 }, { scale: 1.15, duration: 0.12, yoyo: true, repeat: 1, immediateRender: false }, stepAt[i]); sfx(i === 2 ? 'chime' : 'pop', stepAt[i], i === 2 ? -9 : -11); });
    ln.forEach((l, i) => tl.fromTo(l, { scaleX: 0 }, { scaleX: 1, duration: Math.max(0.2, stepAt[i + 1] - stepAt[i] - 0.1), ease: 'none', immediateRender: false }, stepAt[i] + 0.05));
    tl.to(bd, { y: -40, duration: 0.3, ease: 'power2.out' }, K.rep - 0.3);
    const lk = el('div', 'x15lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X16: 3 utility line items countdown — statement with "?" lines, 3-2-1 item cards, then each line with receipt, ? -> ✓, no fights =================
  function X16() {
    const de = lang === 'de';
    const S = de ? {
      doc: 'Nebenkostenabrechnung 2025', sub: 'Wohnung 3 · Lindenstr. 8', items: [['🔥', 'Heizung', '1.240 €'], ['💧', 'Wasser', '386 €'], ['🧹', 'Hausmeister', '214 €']],
      q: '3 Fragen', card: 'Nebenkosten 2025', rec: 'Beleg', r1: 'Mieter', r2: 'Vermieter', stamp: '0 Streit', tag: 'für Mieter & Vermieter',
    } : {
      doc: 'Utility statement 2025', sub: 'Unit 3 · 8 Linden St', items: [['🔥', 'Heating', '$1,240'], ['💧', 'Water', '$386'], ['🧹', 'Caretaker', '$214']],
      q: '3 questions', card: 'Utilities 2025', rec: 'Receipt', r1: 'Tenant', r2: 'Landlord', stamp: '0 fights', tag: 'for tenants & landlords',
    };
    const K = {};
    K.q = W(['Fragen', 'questions']).start;
    const i3 = W(['Drei', 'Three'], W(['Fragen', 'questions']).i); K.n3 = i3.start;
    const i2 = W(['Zwei', 'Two'], i3.i); K.n2 = i2.start;
    const i1 = W(['Eins', 'One'], i2.i); K.n1 = i1.start;
    const it = W(['Mit', 'With'], i1.i); K.turn = it.start;
    K.t1 = W(['Mieter', 'tenant'], it.i).start;
    K.t2 = W(['Vermieter', 'landlord'], it.i).start;
    K.rec = W(['Beleg', 'receipt'], it.i).start;
    K.clear = W(['klären', 'answered'], it.i).start;
    K.fight = W(['Streit', 'fights'], it.i).start;
    const T = END + 2.1;
    const NT = [K.n3, K.n2, K.n1];
    el('div', 'x16bg', '<i class="g"></i>');
    // hook: long statement, three lines flagged with "?"
    const sd = el('div', 'x16doc', `<div class="hd"><b>🧾 ${S.doc}</b><small>${S.sub}</small></div>${[...Array(9)].map((_, i) => `<div class="ln ${[1, 4, 7].includes(i) ? 'f' : ''}"><i style="width:${40 + ((i * 23) % 35)}%"></i><em></em></div>`).join('')}`);
    const flags = [...sd.querySelectorAll('.ln.f')];
    tl.set(sd, { xPercent: -50 }, 0);
    tl.fromTo(sd, { autoAlpha: 0, y: 240, rotation: -4 }, { autoAlpha: 1, y: 0, rotation: -2, duration: 0.5, ease: 'power4.out' }, 0.02);
    sfx('receipts', 0.05, -12);
    flags.forEach((f, i) => {
      const qq = el('span', 'x16q', '?', f);
      tl.set(qq, { autoAlpha: 0 }, 0);
      tl.fromTo(qq, { autoAlpha: 0, scale: 0.2 }, { autoAlpha: 1, scale: 1, duration: 0.28, ease: 'back.out(3)', immediateRender: false }, K.q + i * 0.12);
      tl.fromTo(f, { backgroundColor: 'rgba(255,107,74,0)' }, { backgroundColor: 'rgba(255,107,74,0.14)', duration: 0.2, immediateRender: false }, K.q + i * 0.12);
      sfx('pop', K.q + i * 0.12, -12);
    });
    const qb = el('div', 'x16qb', S.q);
    tl.set(qb, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(qb, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.6)', immediateRender: false }, K.q + 0.45);
    tl.to([sd, qb], { autoAlpha: 0, y: '-=120', scale: 0.8, duration: 0.32, ease: 'power2.in' }, K.n3 - 0.35);
    // countdown 3-2-1: big number + item card
    const big = el('div', 'x16big', '<span>3</span>');
    const bn = big.querySelector('span');
    tl.set(big, { xPercent: -50, autoAlpha: 0 }, 0);
    const cards = S.items.map(([ic, nm, am], i) => el('div', `x16it c${i}`, `<i>${ic}</i><b>${nm}</b><span>${am}</span><em>?</em>`));
    NT.forEach((t0, i) => {
      tl.call(() => { bn.textContent = String(3 - i); }, null, t0 - 0.06);
      if (i) tl.call(() => { bn.textContent = String(4 - i); }, null, t0 - 0.08);
      tl.fromTo(big, { autoAlpha: 0, scale: 2.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power4.in', immediateRender: false }, t0 - 0.06);
      sfx('impact', t0 + 0.22, -9);
      const c = cards[i];
      tl.set(c, { autoAlpha: 0, xPercent: -50 }, 0);
      tl.fromTo(c, { autoAlpha: 0, y: 160, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.38, ease: 'back.out(1.7)', immediateRender: false }, t0 + 0.3);
      sfx('whoosh', t0 + 0.25, -14);
      if (i < 2) tl.to(c, { y: -260 + i * 0, scale: 0.62, autoAlpha: 0.0, duration: 0.3, ease: 'power2.in' }, NT[i + 1] - 0.32);
    });
    tl.to([big, cards[2]], { autoAlpha: 0, y: '-=100', duration: 0.3, ease: 'power2.in' }, K.turn - 0.32);
    // turn: Tenance statement, every line with its receipt, both roles see it
    const ap = el('div', 'x16app', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.card}</b><small>${S.sub}</small></div></div>
      <div class="rl"><span class="r1">👤 ${S.r1}</span><span class="r2">🏠 ${S.r2}</span></div>
      ${S.items.map(([ic, nm, am]) => `<div class="li"><i>${ic}</i><b>${nm}</b><span>${am}</span><u>📎 ${S.rec}</u><em class="qq">?</em><em class="ok">✓</em></div>`).join('')}
      <div class="st">${S.stamp}</div>`);
    const rows = [...ap.querySelectorAll('.li')], recs = [...ap.querySelectorAll('.li u')], qs = [...ap.querySelectorAll('.qq')], oks = [...ap.querySelectorAll('.ok')], rls = [...ap.querySelectorAll('.rl span')], st = ap.querySelector('.st');
    tl.set(ap, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(ap, { autoAlpha: 0, y: 240 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.2, -9);
    tl.set(rows, { autoAlpha: 0 }, 0);
    tl.fromTo(rows, { autoAlpha: 0, x: -120 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'back.out(1.8)', stagger: 0.1, immediateRender: false }, K.turn + 0.3);
    tl.set([...rls, ...recs, ...oks, st], { autoAlpha: 0 }, 0);
    tl.fromTo(rls[0], { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2.6)', immediateRender: false }, K.t1);
    tl.fromTo(rls[1], { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2.6)', immediateRender: false }, K.t2);
    sfx('pop', K.t1, -12); sfx('pop', K.t2, -12);
    tl.fromTo(recs, { autoAlpha: 0, x: 80, rotation: 8 }, { autoAlpha: 1, x: 0, rotation: 0, duration: 0.3, ease: 'back.out(2)', stagger: 0.12, immediateRender: false }, K.rec - 0.35);
    recs.forEach((_, i) => sfx('pop', K.rec - 0.3 + i * 0.12, -13));
    tl.to(qs, { autoAlpha: 0, scale: 0.3, duration: 0.15, stagger: 0.1 }, K.clear - 0.05);
    tl.fromTo(oks, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(3)', stagger: 0.1, immediateRender: false }, K.clear);
    sfx('chime', K.clear + 0.2, -11);
    tl.fromTo(st, { autoAlpha: 0, scale: 2.2, rotation: 0 }, { autoAlpha: 1, scale: 1, rotation: -6, duration: 0.22, ease: 'power4.in', immediateRender: false }, K.fight - 0.05);
    sfx('thud', K.fight + 0.17, -8);
    const lk = el('div', 'x16lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X17: building overview — 3D 8-unit building (cutaway grid), sticky notes chaos, overview card with unit status, broadcast to all tenants =================
  function X17() {
    const de = lang === 'de';
    const S = de ? {
      notes: ['Whg 2 zieht aus!', 'Besichtigung Do 17h', 'Whg 6 Kündigung', 'Schlüssel?', 'Zähler Whg 4'], cnt: ['8 Wohnungen', '2 Auszüge', '1 Besichtigung'],
      card: 'Hausüberblick', cardS: 'Lindenstr. 8 · 8 Einheiten', st: { ok: 'bewohnt', out: 'Auszug', view: 'Besichtigung' }, unit: (n) => `Whg ${n}`,
      msg: '📣 Info ans Haus', msgT: 'Wasser aus: Di 9–11 Uhr', got: 'an alle 8 ✓', one: 'Ein Haus · ein Stand', tag: 'für Mieter & Vermieter',
    } : {
      notes: ['Unit 2 moving out!', 'Viewing Thu 5pm', 'Unit 6 notice', 'Keys?', 'Meter unit 4'], cnt: ['8 units', '2 move-outs', '1 viewing'],
      card: 'Building overview', cardS: '8 Linden St · 8 units', st: { ok: 'occupied', out: 'move-out', view: 'viewing' }, unit: (n) => `Unit ${n}`,
      msg: '📣 Building update', msgT: 'Water off: Tue 9–11 am', got: 'sent to all 8 ✓', one: 'One building · one status', tag: 'for tenants & landlords',
    };
    const STAT = ['ok', 'out', 'ok', 'ok', 'view', 'out', 'ok', 'ok']; // units 1..8 (bottom-left first)
    const K = {};
    K.n8 = W(['Acht', 'Eight']).start;
    K.n2 = W(['zwei', 'two']).start;
    K.n1 = W(['eine', 'one']).start;
    K.jug = W(['jongliert', 'juggling']).start;
    const it = W(['Tenance', 'Tenance'], W(['jongliert', 'juggling']).i); K.turn = words[it.i - 1].start;
    K.ov = W(['Hausüberblick', 'overview'], it.i).start;
    K.glance = W(['Blick', 'glance'], it.i).start;
    K.ten = W(['Mieter', 'tenants'], it.i).start;
    K.info = W(['Info', 'update'], it.i).start;
    K.one = W(['Ein', 'One'], it.i).start;
    const T = END + 2.1;
    el('div', 'x17bg', '<i class="g"></i>');
    // ---- 3D building ----
    const G = gl3(stage, { fov: 30, envTop: '#ffffff', envBot: '#a7b6c6', envInt: 1.0 });
    const { r, scene, cam } = G;
    scene.add(new T3.HemisphereLight(0xffffff, 0xa7b6c6, 0.7));
    const key = new T3.DirectionalLight(0xffffff, 1.8); key.position.set(-5, 9, 8); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -6, right: 6, top: 7, bottom: -4, near: 1, far: 30 }); scene.add(key);
    const floor = new T3.Mesh(new T3.PlaneGeometry(40, 40), new T3.ShadowMaterial({ opacity: 0.18 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.02; floor.receiveShadow = true; scene.add(floor);
    const B = new T3.Group(); scene.add(B);
    const UW = 1.6, UH = 1.15, D = 1.6, SL = 0.12;
    const wallM = M.std('#f4efe6', { roughness: 0.8 }), slabM = M.std('#d9d2c4', { roughness: 0.7 });
    mesh(new T3.BoxGeometry(2 * UW + 0.24, SL, D + 0.2), slabM, B, [0, SL / 2, 0]);
    const COL = { ok: new T3.Color('#1fbf72'), out: new T3.Color('#ff8a3d'), view: new T3.Color('#4b6bff'), off: new T3.Color('#c8ccd2') };
    const units = [];
    for (let f = 0; f < 4; f++) for (let c = 0; c < 2; c++) {
      const u = new T3.Group(); B.add(u);
      const x = (c - 0.5) * UW, y = SL + f * (UH + SL);
      u.position.set(x, y, 0);
      mesh(new T3.BoxGeometry(UW, SL, D), slabM, u, [0, UH + SL / 2, 0]);
      mesh(new T3.BoxGeometry(0.06, UH, D), wallM, u, [c ? UW / 2 - 0.03 : -UW / 2 + 0.03, UH / 2, 0]);
      const glow = M.std('#f4efe6', { emissive: COL.off.clone(), emissiveIntensity: 0.0, roughness: 0.8 });
      mesh(new T3.BoxGeometry(UW, UH, 0.06), glow, u, [0, UH / 2, -D / 2 + 0.03]);
      const fl = mesh(new T3.BoxGeometry(UW - 0.1, 0.03, D - 0.1), M.std('#e9e1d2', { roughness: 0.7 }), u, [0, 0.02, 0]);
      mesh(new T3.BoxGeometry(0.62, 0.5, 0.03), M.std('#ffffff', { emissive: new T3.Color('#fff6dc'), emissiveIntensity: 0.5 }), u, [0, UH * 0.55, -D / 2 + 0.08]);
      // tiny furniture: sofa / table / bed by index
      const k = f * 2 + c;
      if (k % 3 === 0) mesh(rbox(0.6, 0.22, 0.28, 0.06), M.std('#7e9bb5'), u, [-0.3, 0.14, -0.4]);
      if (k % 3 === 1) mesh(new T3.CylinderGeometry(0.2, 0.2, 0.05, 20), M.std('#c49a6c'), u, [0.25, 0.32, 0.1]);
      if (k % 3 === 2) mesh(rbox(0.5, 0.14, 0.7, 0.05), M.std('#e9ecef'), u, [0.3, 0.1, -0.2]);
      if (STAT[k] === 'out') [0, 1].forEach((b) => mesh(rbox(0.26, 0.22, 0.26, 0.03), M.std('#c8a06e'), u, [-0.35 + b * 0.32, 0.13 + 0, 0.35]));
      units.push({ u, glow, k });
    }
    mesh(new T3.BoxGeometry(2 * UW + 0.24, 0.2, D + 0.24), M.std('#8f97a3', { roughness: 0.6 }), B, [0, SL + 4 * (UH + SL) + 0.1, 0]);
    const camT = track([
      [0, () => ({ x: 2.8, y: 3.2, z: 17.5, ly: 2.2, ry: -0.35 })],
      [K.jug, () => ({ x: 1.2, y: 3.2, z: 18, ly: 2.2, ry: -0.2 })],
      [K.turn + 0.3, () => ({ x: 0, y: 3.8, z: 19, ly: 1.4, ry: 0 })],
      [K.one - 0.3, () => ({ x: 0, y: 3.8, z: 19, ly: 1.4, ry: 0 })],
      [K.one + 0.5, () => ({ x: -1.6, y: 3.3, z: 17, ly: 2.2, ry: 0.28 })],
      [T, () => ({ x: -2.1, y: 3.3, z: 16.5, ly: 2.2, ry: 0.32 })],
    ]);
    perFrame((t) => {
      const p = camT(t);
      cam.position.set(p.x, p.y, p.z); cam.lookAt(0, p.ly, 0); B.rotation.y = p.ry;
      units.forEach(({ glow, k }) => {
        const on8 = seg(t, K.n8 + k * 0.06, 0.2);
        const st = STAT[k];
        const lit = st === 'out' ? seg(t, K.n2, 0.3) : st === 'view' ? seg(t, K.n1, 0.3) : 0;
        const c = COL.off.clone().lerp(st === 'ok' ? COL.off : COL[st], lit);
        const ovr = seg(t, K.ov, 0.4);
        if (ovr > 0) c.lerp(COL[st], ovr);
        const ping = Math.max(0, 1 - Math.abs(t - (K.info + 0.25 + k * 0.05)) * 4);
        glow.emissive.copy(c).lerp(new T3.Color('#ffd36b'), ping);
        glow.emissiveIntensity = 0.75 * Math.max(lit, ovr, ping); glow.color.set('#f4efe6').lerp(c, 0.55 * Math.max(lit, ovr, ping));
      });
      r.render(scene, cam);
    });
    // counters
    const ct = el('div', 'x17cnt', S.cnt.map((s) => `<span>${s}</span>`).join(''));
    const cs = [...ct.querySelectorAll('span')];
    tl.set(ct, { xPercent: -50 }, 0);
    tl.set(cs, { autoAlpha: 0 }, 0);
    [K.n8, K.n2, K.n1].forEach((t0, i) => { tl.fromTo(cs[i], { autoAlpha: 0, y: 30, scale: 0.6 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, Math.max(0.02, t0 - 0.05)); sfx('pop', Math.max(0.05, t0), -10); });
    // sticky notes juggling around the building
    const notes = S.notes.map((n, i) => el('div', `x17note n${i}`, n));
    notes.forEach((n, i) => {
      tl.set(n, { autoAlpha: 0 }, 0);
      tl.fromTo(n, { autoAlpha: 0, scale: 0.3, rotation: (i % 2 ? 1 : -1) * 30 }, { autoAlpha: 1, scale: 1, rotation: (i % 2 ? 1 : -1) * 6, duration: 0.3, ease: 'back.out(2.2)', immediateRender: false }, K.jug - 0.4 + i * 0.12);
      sfx('pop', K.jug - 0.35 + i * 0.12, -14);
    });
    perFrame((t) => { const a = seg(t, K.jug, 0.3); notes.forEach((n, i) => { n.style.translate = `${Math.sin(t * 2.4 + i * 1.7) * 26 * a}px ${Math.cos(t * 2.1 + i) * 22 * a}px`; }); });
    tl.to([...notes, ct], { autoAlpha: 0, scale: 0.4, duration: 0.28, ease: 'power2.in', stagger: 0.03 }, K.turn - 0.32);
    // overview card with 8 unit tiles
    const ov = el('div', 'x17ov', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.card}</b><small>${S.cardS}</small></div></div>
      <div class="gr">${[3, 2, 1, 0].map((f) => [0, 1].map((c) => { const k = f * 2 + c; return `<div class="u ${STAT[k]}"><b>${S.unit(k + 1)}</b><span>${S.st[STAT[k]]}</span></div>`; }).join('')).join('')}</div>`);
    const tiles = [...ov.querySelectorAll('.u')];
    tl.set(ov, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(ov, { autoAlpha: 0, y: -120 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.2, -9);
    tl.set(tiles, { autoAlpha: 0 }, 0);
    tl.fromTo(tiles, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2.2)', stagger: 0.05, immediateRender: false }, K.ov - 0.1);
    sfx('counter', K.ov, -14); sfx('chime', K.glance, -12);
    tl.to(ov, { autoAlpha: 0, y: -80, duration: 0.3, ease: 'power2.in' }, K.ten - 0.35);
    // broadcast to all tenants
    const ms = el('div', 'x17msg', `<small>${S.msg}</small><b>${S.msgT}</b><em>${S.got}</em>`);
    const got = ms.querySelector('em');
    tl.set(ms, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(ms, { autoAlpha: 0, y: -60, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.8)', immediateRender: false }, K.ten - 0.15);
    tl.set(got, { autoAlpha: 0 }, 0);
    tl.fromTo(got, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.28, ease: 'back.out(2.6)', immediateRender: false }, K.info + 0.6);
    sfx('send', K.info, -10); [0, 1, 2, 3].forEach((i) => sfx('pop', K.info + 0.3 + i * 0.1, -16)); sfx('chime', K.info + 0.65, -12);
    tl.to(ms, { autoAlpha: 0, y: -60, duration: 0.3, ease: 'power2.in' }, K.one - 0.35);
    const on = el('div', 'x17one', S.one);
    tl.set(on, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(on, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.2)', immediateRender: false }, K.one);
    sfx('impact', K.one + 0.05, -11);
    const lk = el('div', 'x17lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X18: notice in December -> empty January? one plan (move-out, viewings, next tenant), 3D key handed over 31st -> 1st, zero empty days =================
  function X18() {
    const de = lang === 'de';
    const S = de ? {
      notice: 'Kündigung', noticeS: 'Whg 3 · zum 31.12.', jan: 'Januar', empty: 'leer?', rent: '0 € Miete',
      card: 'Mieterwechsel · Whg 3', rows: [['📦', 'Auszug', '31.12.'], ['👀', 'Besichtigungen', '10. · 14. · 18.12.'], ['✍️', 'Nachmieter', 'unterschrieben ✓']], vis: 'für beide sichtbar', r1: 'Mieter', r2: 'Vermieter',
      out: 'Übergabe 31.12.', in: 'Einzug 1.1.', zero: '0 Tage Leerstand', days: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], tag: 'für Mieter & Vermieter',
    } : {
      notice: 'Notice', noticeS: 'Unit 3 · ends Dec 31', jan: 'January', empty: 'empty?', rent: '$0 rent',
      card: 'Tenant change · Unit 3', rows: [['📦', 'Move-out', 'Dec 31'], ['👀', 'Viewings', 'Dec 10 · 14 · 18'], ['✍️', 'Next tenant', 'signed ✓']], vis: 'visible to both', r1: 'Tenant', r2: 'Landlord',
      out: 'Handover Dec 31', in: 'Move-in Jan 1', zero: '0 empty days', days: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], tag: 'for tenants & landlords',
    };
    const K = {};
    K.dec = W(['Dezember', 'December']).start;
    K.empty = W(['leeren', 'empty']).start;
    K.jan = W(['Januar', 'January']).start;
    const it = W(['Tenance', 'Tenance'], W(['Januar', 'January']).i); K.turn = words[it.i - 1].start;
    K.out = W(['Auszug', 'move-out'], it.i).start;
    K.view = W(['Besichtigungen', 'viewings'], it.i).start;
    K.next = W(['Nachmieter', 'next'], it.i).start;
    K.both = W(['beide', 'both'], it.i).start;
    K.hand = W(['Übergabe', 'Handover'], it.i).start;
    K.d31 = W(['einunddreißigsten', 'thirty-first'], it.i).start;
    K.in = W(['Einzug', 'move-in'], it.i).start;
    K.d1 = W(['ersten', 'first'], W(['Einzug', 'move-in'], it.i).i).start;
    K.zero = W(['Null', 'Zero'], it.i).start;
    const T = END + 2.1;
    el('div', 'x18bg', '<i class="g"></i>');
    // ---- 3D key ----
    const G = gl3(stage, { fov: 30, envTop: '#ffffff', envBot: '#6d5a3a', envInt: 1.2 });
    const { r, scene, cam } = G;
    cam.position.set(0, 0, 12); cam.lookAt(0, 0, 0);
    scene.add(new T3.HemisphereLight(0xffffff, 0x8a7a5a, 0.8));
    const kl = new T3.DirectionalLight(0xffffff, 2.2); kl.position.set(-3, 5, 7); scene.add(kl);
    const gold = M.phy('#e2b23c', { metalness: 1, roughness: 0.22, clearcoat: 0.4 });
    const KEY = new T3.Group(); scene.add(KEY);
    mesh(new T3.TorusGeometry(0.42, 0.13, 20, 48), gold, KEY, [-1.0, 0, 0]);
    mesh(new T3.CylinderGeometry(0.1, 0.1, 1.7, 24), gold, KEY, [0.25, 0, 0], [0, 0, Math.PI / 2]);
    [[0.75, 0.22], [0.92, 0.16], [1.05, 0.26]].forEach(([x, h]) => mesh(new T3.BoxGeometry(0.11, h, 0.12), gold, KEY, [x, -0.1 - h / 2 + 0.05, 0]));
    const tagM = M.std('#ff6b4a', { roughness: 0.5 });
    const tag = mesh(rbox(0.7, 0.45, 0.06, 0.08), tagM, KEY, [-1.75, -0.35, 0], [0, 0, 0.4]);
    const keyT = track([
      [0, () => ({ x: 0, y: 3.5, z: 0, s: 0, ry: 0 })],
      [K.hand - 0.3, () => ({ x: -0.35, y: 0.2, z: 0, s: 0, ry: 0 })],
      [K.hand + 0.1, () => ({ x: -0.35, y: 0.2, z: 0, s: 0.72, ry: 0.3 })],
      [K.d31 + 0.3, () => ({ x: -0.3, y: 0.2, z: 0, s: 0.72, ry: 0.5 })],
      [K.in + 0.1, () => ({ x: 0.3, y: 0.2, z: 0.6, s: 0.72, ry: 2.6 })],
      [K.zero - 0.2, () => ({ x: 0.35, y: 0.2, z: 0, s: 0.72, ry: 3.0 })],
      [K.zero + 0.1, () => ({ x: 0.35, y: 0.2, z: 0, s: 0, ry: 3.4 })],
      [T, () => ({ x: 0.35, y: 0.2, z: 0, s: 0, ry: 3.4 })],
    ]);
    perFrame((t) => {
      const p = keyT(t);
      KEY.position.set(p.x, p.y + Math.sin(t * 2) * 0.06, p.z); KEY.scale.setScalar(Math.max(1e-4, p.s)); KEY.visible = p.s > 0.01;
      KEY.rotation.set(0.25, p.ry, Math.sin(t * 1.6) * 0.12);
      const arc = seg(t, K.d31 + 0.3, Math.max(0.3, K.in - K.d31 - 0.2));
      KEY.position.y += Math.sin(Math.PI * arc) * 0.8;
      r.render(scene, cam);
    });
    // hook: notice letter + empty January
    const nt = el('div', 'x18not', `<i>✉️</i><div><b>${S.notice}</b><small>${S.noticeS}</small></div>`);
    tl.set(nt, { xPercent: -50 }, 0);
    tl.fromTo(nt, { autoAlpha: 0, y: -80, rotation: -6 }, { autoAlpha: 1, y: 0, rotation: -2, duration: 0.45, ease: 'back.out(1.8)' }, 0.02);
    sfx('pop', 0.05, -9); sfx('thud', K.dec, -12);
    const cal = el('div', 'x18cal', `<div class="hd"><b>${S.jan}</b><em>${S.empty}</em></div><div class="dn">${S.days.map((d) => `<span>${d}</span>`).join('')}</div><div class="gr">${[...Array(31)].map((_, i) => `<i>${i + 1}</i>`).join('')}</div><div class="rn">${S.rent}</div><div class="z">${S.zero}</div>`);
    const cells = [...cal.querySelectorAll('.gr i')], em = cal.querySelector('.hd em'), rn = cal.querySelector('.rn'), zz = cal.querySelector('.z');
    tl.set(cal, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(cal, { autoAlpha: 0, y: 200 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power4.out', immediateRender: false }, K.empty - 0.35);
    tl.set([em, rn, zz], { autoAlpha: 0 }, 0);
    tl.fromTo(em, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.28, ease: 'back.out(2.6)', immediateRender: false }, K.jan);
    tl.fromTo(rn, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.28, ease: 'back.out(2)', immediateRender: false }, K.jan + 0.3);
    sfx('whoosh', K.empty - 0.3, -13); sfx('sting', K.jan, -14);
    tl.to([nt, cal], { autoAlpha: 0, y: '-=100', duration: 0.3, ease: 'power2.in', stagger: 0.04 }, K.turn - 0.32);
    // the plan card
    const pl = el('div', 'x18plan', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.card}</b></div></div>
      ${S.rows.map(([ic, nm, d]) => `<div class="rw"><i>${ic}</i><b>${nm}</b><span>${d}</span></div>`).join('')}<div class="vs"><span>👤 ${S.r1}</span><span>🏠 ${S.r2}</span><em>👁 ${S.vis}</em></div>`);
    const rws = [...pl.querySelectorAll('.rw')], vs = pl.querySelector('.vs');
    tl.set(pl, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(pl, { autoAlpha: 0, y: 240 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.2, -9);
    tl.set([...rws, vs], { autoAlpha: 0 }, 0);
    [K.out, K.view, K.next].forEach((t0, i) => { tl.fromTo(rws[i], { autoAlpha: 0, x: -140 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'back.out(1.8)', immediateRender: false }, t0 - 0.12); sfx('pop', t0 - 0.1, -11); });
    tl.fromTo(vs, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, K.both - 0.1);
    sfx('chime', K.both, -12);
    tl.to(pl, { autoAlpha: 0, y: -100, duration: 0.3, ease: 'power2.in' }, K.hand - 0.35);
    // handover tags, key travels
    const to = el('div', 'x18tag l', S.out), ti = el('div', 'x18tag r', S.in);
    tl.set([to, ti], { autoAlpha: 0 }, 0);
    tl.fromTo(to, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, K.hand - 0.05);
    tl.fromTo(ti, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, K.in - 0.05);
    sfx('keys', K.hand + 0.05, -7); sfx('whoosh', K.d31 + 0.3, -12); sfx('keys', K.in + 0.1, -7);
    tl.to([to, ti], { autoAlpha: 0, duration: 0.25 }, K.zero - 0.2);
    // zero empty days: January turns green
    tl.to(cal, { autoAlpha: 1, y: 0, duration: 0.01 }, K.zero - 0.25);
    tl.set([em, rn], { autoAlpha: 0 }, K.zero - 0.25);
    tl.fromTo(cal, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(1.6)', immediateRender: false }, K.zero - 0.2);
    tl.to(cells, { backgroundColor: '#1fbf72', color: '#ffffff', duration: 0.12, stagger: 0.012 }, K.zero);
    tl.fromTo(zz, { autoAlpha: 0, scale: 2, rotation: 0 }, { autoAlpha: 1, scale: 1, rotation: -5, duration: 0.22, ease: 'power4.in', immediateRender: false }, K.zero + 0.35);
    sfx('counter', K.zero, -12); sfx('thud', K.zero + 0.55, -8);
    const lk = el('div', 'x18lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X19: 3 a.m. smoke alarm chirp — night kinetic: chirping detector + 40s ring, dead battery, who to call?, one-tap report, caretaker swaps it in the morning =================
  function X19() {
    const de = lang === 'de';
    const S = de ? {
      clock: '03:00', chirp: 'PIEP!', every: 'alle 40 s', bat: 'Batterie leer', who: ['Vermieter?', 'Hausmeister?', 'Notdienst?'],
      card: 'Neue Meldung', cardS: 'Whg 5 · Flur', cat: '🔋 Rauchmelder piept', btn: 'Melden', sent: 'gemeldet ✓', r1: 'Mieterin',
      to: '🧰 Hausmeister', when: 'morgen · 08:30', done: 'Batterie getauscht ✓', calm: 'Ruhe für alle', tag: 'für Mieter & Vermieter',
    } : {
      clock: '3:00 am', chirp: 'CHIRP!', every: 'every 40 s', bat: 'Battery dead', who: ['Landlord?', 'Caretaker?', 'Hotline?'],
      card: 'New report', cardS: 'Unit 5 · Hallway', cat: '🔋 Smoke alarm chirping', btn: 'Report', sent: 'reported ✓', r1: 'Tenant',
      to: '🧰 Caretaker', when: 'tomorrow · 8:30 am', done: 'Battery replaced ✓', calm: 'Peace for everyone', tag: 'for tenants & landlords',
    };
    const K = {};
    K.alarm = W(['Rauchmelder', 'smoke']).start;
    K.every = W(['alle', 'every']).start;
    K.bat = W(['Batterie', 'battery']).start;
    K.who = W(['keiner', 'nobody']).start;
    const it = W(['Tenance', 'Tenance'], W(['keiner', 'nobody']).i); K.turn = words[it.i - 1].start;
    K.rep = W(['meldet', 'reports'], it.i).start;
    K.tap = W(['Tipp', 'tap'], it.i).start;
    K.care = W(['Hausmeister', 'caretaker'], it.i).start;
    K.swap = W(['tauscht', 'swaps'], it.i).start;
    K.morn = W(['Morgen', 'morning'], it.i).start;
    K.calm = W(['Ruhe', 'Peace'], it.i).start;
    const T = END + 2.1;
    const bg = el('div', 'x19bg', '<i class="d"></i><i class="n"></i>');
    const nb = bg.querySelector('.n');
    tl.to(nb, { autoAlpha: 0, duration: 0.6, ease: 'power2.inOut' }, K.turn - 0.3);
    // ceiling detector
    const det = el('div', 'x19det', '<i class="led"></i><i class="sl"></i>');
    const led = det.querySelector('.led');
    tl.set(det, { xPercent: -50 }, 0);
    tl.fromTo(det, { autoAlpha: 0, y: -120 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.02);
    const ck = el('div', 'x19clk', S.clock);
    tl.set(ck, { xPercent: -50 }, 0);
    tl.fromTo(ck, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, 0.1);
    sfx('pop', 0.12, -12);
    // chirps
    const chirps = [K.alarm + 0.35, K.every + 0.5, K.bat + 0.3, K.who + 0.6].filter((t) => t < K.turn - 0.4);
    const cb = el('div', 'x19chirp', S.chirp);
    tl.set(cb, { xPercent: -50, autoAlpha: 0 }, 0);
    chirps.forEach((t0) => {
      tl.fromTo(cb, { autoAlpha: 1, scale: 0.6 }, { autoAlpha: 0, scale: 1.4, duration: 0.55, ease: 'power2.out', immediateRender: false }, t0);
      tl.fromTo(det, { rotation: -3 }, { rotation: 3, duration: 0.05, yoyo: true, repeat: 5, immediateRender: false }, t0);
      sfx('buzz', t0, -11);
    });
    perFrame((t) => {
      const on = t < K.turn ? chirps.some((c) => t >= c && t < c + 0.25) : false;
      const ok = t > K.swap + 0.3;
      led.style.background = ok ? '#1fbf72' : on ? '#ff3b2f' : '#5a1a12';
      led.style.boxShadow = ok ? '0 0 30px #1fbf72' : on ? '0 0 50px 12px #ff3b2f' : 'none';
    });
    // 40-second ring
    const rg = el('div', 'x19ring', `<svg viewBox="0 0 200 200"><circle class="b" cx="100" cy="100" r="86"/><circle class="f" cx="100" cy="100" r="86"/></svg><b>40</b><small>${S.every}</small>`);
    const rf = rg.querySelector('.f'), rb = rg.querySelector('b');
    tl.set(rg, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(rg, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, K.every - 0.1);
    perFrame((t) => { const u = seg(t, K.every, 1.6); rf.style.strokeDashoffset = `${540 * u}`; rb.textContent = String(Math.max(0, Math.round(40 - 40 * u))); });
    sfx('counter', K.every, -14);
    tl.to(rg, { autoAlpha: 0, scale: 0.6, duration: 0.25 }, K.bat - 0.3);
    // dead battery
    const bt = el('div', 'x19bat', `<div class="ic"><i></i></div><b>${S.bat}</b>`);
    const bfill = bt.querySelector('.ic i');
    tl.set(bt, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(bt, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, K.bat - 0.1);
    tl.fromTo(bfill, { width: '60%' }, { width: '6%', duration: 0.5, ease: 'power2.in', immediateRender: false }, K.bat);
    tl.to(bt, { autoAlpha: 0, y: -40, duration: 0.25 }, K.who - 0.3);
    // who to call?
    const wh = S.who.map((w, i) => el('div', `x19who w${i}`, `<i>📞</i><b>${w}</b>`));
    wh.forEach((w, i) => { tl.set(w, { autoAlpha: 0 }, 0); tl.fromTo(w, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, K.who + i * 0.2); sfx('pop', K.who + i * 0.2, -12); });
    perFrame((t) => { const a = seg(t, K.who + 0.3, 0.3); wh.forEach((w, i) => { w.style.translate = `${Math.sin(t * 5 + i * 2) * 10 * a}px 0`; }); });
    tl.to([...wh, ck], { autoAlpha: 0, duration: 0.25 }, K.turn - 0.3);
    // turn: one-tap report
    const ap = el('div', 'x19app', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.card}</b><small>${S.cardS}</small></div><em>👤 ${S.r1}</em></div>
      <div class="cat">${S.cat}</div><div class="bt"><span class="a">${S.btn}</span><span class="b">${S.sent}</span></div><i class="fg"></i>
      <div class="rt"><b>${S.to}</b><span>${S.when}</span></div>`);
    const ba = ap.querySelector('.a'), bb = ap.querySelector('.b'), fg = ap.querySelector('.fg'), btn = ap.querySelector('.bt'), rt = ap.querySelector('.rt');
    tl.set(ap, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(ap, { autoAlpha: 0, y: 240 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.2, -9);
    tl.set([bb, fg, rt], { autoAlpha: 0 }, 0);
    tl.fromTo(fg, { autoAlpha: 0, scale: 1.6, x: 160, y: 140 }, { autoAlpha: 1, scale: 1, x: 0, y: 0, duration: 0.4, ease: 'power3.out', immediateRender: false }, K.rep);
    tl.to(btn, { scale: 0.92, duration: 0.08, yoyo: true, repeat: 1 }, K.tap - 0.1);
    tl.to(ba, { autoAlpha: 0, duration: 0.12 }, K.tap - 0.02);
    tl.fromTo(bb, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.28, ease: 'back.out(2.6)', immediateRender: false }, K.tap - 0.02);
    tl.to(fg, { autoAlpha: 0, duration: 0.2 }, K.tap + 0.25);
    sfx('pop', K.tap - 0.1, -8); sfx('send', K.tap + 0.05, -11);
    tl.fromTo(rt, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, K.care - 0.1);
    sfx('chime', K.care, -12);
    tl.to(ap, { autoAlpha: 0, y: -60, duration: 0.3, ease: 'power2.in' }, K.swap - 0.35);
    // morning: swapped, green LED
    const sun = el('div', 'x19sun');
    tl.set(sun, { autoAlpha: 0 }, 0);
    tl.fromTo(sun, { autoAlpha: 0, y: 120 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out', immediateRender: false }, K.morn - 0.3);
    const dn = el('div', 'x19done', S.done);
    tl.set(dn, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(dn, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.6)', immediateRender: false }, K.swap + 0.3);
    sfx('pop', K.swap + 0.3, -10);
    const cm = el('div', 'x19calm', `<span>💤</span>${S.calm}`);
    tl.set(cm, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(cm, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, K.calm - 0.05);
    sfx('chime', K.calm, -10);
    const lk = el('div', 'x19lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X20: move-in report — 3D room corner, scratch + stain get photographed with date, joint report in both archives, years later at move-out nothing to argue =================
  function X20() {
    const de = lang === 'de';
    const S = de ? {
      head: 'Einzug · Whg 3', p1: 'Kratzer Wand', p2: 'Fleck Boden', date: '01.12.2026',
      doc: 'Übergabeprotokoll', docS: 'Einzug · 01.12.2026', r1: 'Mieter', r2: 'Vermieter', arch: 'im Archiv ✓', yrs: 'Auszug', same: 'war schon da ✓', none: 'nichts zu diskutieren', tag: 'für Mieter & Vermieter',
    } : {
      head: 'Move-in · Unit 3', p1: 'Wall scratch', p2: 'Floor stain', date: '12/01/2026',
      doc: 'Move-in report', docS: 'Move-in · 12/01/2026', r1: 'Tenant', r2: 'Landlord', arch: 'in archive ✓', yrs: 'Move-out', same: 'already there ✓', none: 'nothing to argue', tag: 'for tenants & landlords',
    };
    const K = {};
    K.scr = W(['Kratzer', 'scratch']).start;
    K.stain = W(['Fleck', 'stain']).start;
    K.foto = W(['Foto', 'photo']).start;
    K.date = W(['Datum', 'date']).start;
    K.t1 = W(['Mieter', 'tenant']).start;
    K.tog = W(['gemeinsam', 'together']).start;
    const it = W(['Tenance', 'Tenance'], W(['gemeinsam', 'together']).i); K.turn = words[it.i - 1].start;
    K.both = W(['beide', 'both'], it.i).start;
    K.arch = W(['Archiv', 'archives'], it.i).start;
    K.out = W(['Auszug', 'move-out'], it.i).start;
    K.yrs = W(['Jahre', 'years'], it.i).start;
    K.none = W(['nichts', 'nothing'], it.i).start;
    const T = END + 2.1;
    el('div', 'x20bg', '<i class="g"></i>');
    // ---- 3D room corner ----
    const G = gl3(stage, { fov: 30, envTop: '#ffffff', envBot: '#b9a990', envInt: 1.0 });
    const { r, scene, cam } = G;
    scene.add(new T3.HemisphereLight(0xffffff, 0xb9a990, 0.7));
    const key = new T3.DirectionalLight(0xffffff, 1.7); key.position.set(4, 7, 6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 30 }); scene.add(key);
    const room = new T3.Group(); scene.add(room);
    const wallM = M.std('#f1ece3', { roughness: 0.9 }), floorM = M.std('#c9a27a', { roughness: 0.7 });
    mesh(new T3.BoxGeometry(5, 0.1, 5), floorM, room, [0, -0.05, 0]);
    mesh(new T3.BoxGeometry(5, 3.2, 0.1), wallM, room, [0, 1.6, -2.5]);
    mesh(new T3.BoxGeometry(0.1, 3.2, 5), wallM, room, [-2.5, 1.6, 0]);
    // floor boards
    for (let i = 0; i < 9; i++) mesh(new T3.BoxGeometry(0.02, 0.002, 5), M.std('#a9825c'), room, [-2.5 + i * 0.56, 0.002, 0]);
    // skirting + window
    mesh(new T3.BoxGeometry(5, 0.12, 0.04), M.std('#ffffff'), room, [0, 0.06, -2.43]);
    const winF = mesh(rbox(1.4, 1.6, 0.1, 0.04), M.std('#ffffff'), room, [0.9, 1.9, -2.42]);
    mesh(new T3.PlaneGeometry(1.2, 1.4), M.std('#bfe0ff', { emissive: new T3.Color('#dff0ff'), emissiveIntensity: 0.6 }), room, [0.9, 1.9, -2.36]);
    // a few boxes (move-in)
    [[-1.3, 0.25, -1.4, 0.6], [-0.75, 0.2, -1.6, 0.45], [-1.2, 0.68, -1.45, 0.4]].forEach(([x, y, z, s]) => mesh(rbox(s, s * 0.8, s, 0.03), M.std('#c8a06e'), room, [x, y, z], [0, 0.3, 0]));
    // scratch on wall + stain on floor (canvas planes)
    const scratch = textPlane((x, w, h) => { x.strokeStyle = 'rgba(90,70,50,0.85)'; x.lineWidth = 6; x.lineCap = 'round'; [[20, 80, 230, 40], [40, 100, 210, 70], [70, 70, 180, 52]].forEach(([a, b, c, d]) => { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke(); }); }, 256, 128, 0.7, 0.35);
    scratch.position.set(-0.6, 1.25, -2.44); room.add(scratch);
    const stain = textPlane((x, w, h) => { const g = x.createRadialGradient(128, 128, 10, 128, 128, 120); g.addColorStop(0, 'rgba(70,40,20,0.65)'); g.addColorStop(0.6, 'rgba(90,55,25,0.35)'); g.addColorStop(1, 'rgba(90,55,25,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(128, 128, 120, 90, 0.3, 0, Math.PI * 2); x.fill(); }, 256, 256, 0.9, 0.9);
    stain.rotation.x = -Math.PI / 2; stain.position.set(0.5, 0.012, 0.3); room.add(stain);
    const ring = (p) => { const m = new T3.Mesh(new T3.RingGeometry(0.42, 0.5, 48), new T3.MeshBasicMaterial({ color: '#ff6b4a', transparent: true, depthWrite: false, toneMapped: false })); m.position.copy(p); room.add(m); return m; };
    const r1 = ring(new T3.Vector3(-0.6, 1.25, -2.42)), r2 = ring(new T3.Vector3(0.5, 0.02, 0.3)); r2.rotation.x = -Math.PI / 2;
    const flash = el('div', 'x20flash');
    const camT = track([
      [0, () => ({ x: 4.6, y: 3.4, z: 8.8, lx: 0, ly: 1.0, lz: -0.6 })],
      [K.scr - 0.2, () => ({ x: 2.2, y: 2.2, z: 5.6, lx: -0.6, ly: 1.2, lz: -2.0 })],
      [K.stain + 0.1, () => ({ x: 2.4, y: 3.6, z: 5.8, lx: 0.4, ly: 0.2, lz: 0.2 })],
      [K.tog, () => ({ x: 4.2, y: 3.6, z: 8.6, lx: 0, ly: 0.9, lz: -0.6 })],
      [K.turn + 0.3, () => ({ x: 4.6, y: 4.2, z: 10.5, lx: 0, ly: 0.3, lz: -0.6 })],
      [T, () => ({ x: 5.0, y: 4.2, z: 10.5, lx: 0, ly: 0.3, lz: -0.6 })],
    ]);
    perFrame((t) => {
      const p = camT(t);
      cam.position.set(p.x, p.y, p.z); cam.lookAt(p.lx, p.ly, p.lz);
      const a1 = seg(t, K.scr + 0.1, 0.25) * (1 - seg(t, K.turn - 0.3, 0.2)), a2 = seg(t, K.stain + 0.1, 0.25) * (1 - seg(t, K.turn - 0.3, 0.2));
      const a3 = seg(t, K.out + 0.1, 0.25);
      r1.material.opacity = Math.max(a1, a3); r2.material.opacity = Math.max(a2, a3);
      const pul = 1 + 0.08 * Math.sin(t * 8); r1.scale.setScalar(pul); r2.scale.setScalar(pul);
      room.visible = t < K.turn + 0.2 || t > K.out - 0.4;
      r.render(scene, cam);
    });
    const hd = el('div', 'x20head', `📦 ${S.head}`);
    tl.set(hd, { xPercent: -50 }, 0);
    tl.fromTo(hd, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, 0.05);
    sfx('pop', 0.08, -11);
    // photos with date stamp
    const ph = [[S.p1, 'w'], [S.p2, 'f']].map(([lb, cl], i) => el('div', `x20pol ${cl}`, `<div class="im"></div><b>📸 ${lb}</b><small>${S.date}</small>`));
    const tPh = [Math.max(K.foto, K.scr + 0.6), K.foto + 0.5];
    ph.forEach((p, i) => {
      tl.set(p, { autoAlpha: 0 }, 0);
      tl.fromTo(p, { autoAlpha: 0, scale: 0.4, rotation: i ? 14 : -14 }, { autoAlpha: 1, scale: 1, rotation: i ? 5 : -5, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, tPh[i]);
      tl.fromTo(flash, { opacity: 0.85 }, { opacity: 0, duration: 0.35, immediateRender: false }, tPh[i] - 0.05);
      sfx('shutter', tPh[i] - 0.05, -8);
      const sm = p.querySelector('small');
      tl.set(sm, { autoAlpha: 0 }, 0);
      tl.fromTo(sm, { autoAlpha: 0, scale: 1.6 }, { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'power4.in', immediateRender: false }, K.date + i * 0.15);
    });
    tl.set(flash, { opacity: 0 }, 0);
    const rl = el('div', 'x20roles', `<span>👤 ${S.r1}</span><em>+</em><span>🏠 ${S.r2}</span>`);
    tl.set(rl, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(rl, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, K.t1 - 0.1);
    sfx('pop', K.t1, -12); sfx('chime', K.tog, -13);
    tl.to([hd, ...ph, rl], { autoAlpha: 0, y: '-=80', duration: 0.3, ease: 'power2.in', stagger: 0.03 }, K.turn - 0.32);
    // the report in both archives
    const doc = el('div', 'x20doc', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.doc}</b><small>${S.docS}</small></div></div>
      <div class="ps"><div class="t w"><i></i><span>${S.p1}</span></div><div class="t f"><i></i><span>${S.p2}</span></div></div>
      <div class="sg"><span>✍️ ${S.r1} ✓</span><span>✍️ ${S.r2} ✓</span></div>`);
    tl.set(doc, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(doc, { autoAlpha: 0, y: 240 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.2, -9);
    const ar = [S.r1, S.r2].map((rr, i) => el('div', `x20arch ${i ? 'r' : 'l'}`, `<i>📁</i><b>${rr}</b><span>${S.arch}</span>`));
    ar.forEach((a, i) => { tl.set(a, { autoAlpha: 0 }, 0); tl.fromTo(a, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, K.arch - 0.25 + i * 0.12); });
    sfx('send', K.both - 0.1, -11); sfx('chime', K.arch + 0.1, -11);
    tl.to([doc, ...ar], { autoAlpha: 0, y: '-=80', duration: 0.3, ease: 'power2.in', stagger: 0.03 }, K.out - 0.35);
    // years later: move-out, same marks -> already there
    const yr = el('div', 'x20yrs', `<b>${S.yrs}</b><span class="y">2026</span>`);
    const yy = yr.querySelector('.y');
    tl.set(yr, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(yr, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, K.out - 0.1);
    perFrame((t) => { yy.textContent = String(2026 + Math.round(4 * E.io(seg(t, K.yrs - 0.1, 0.7)))); });
    sfx('counter', K.yrs - 0.1, -12);
    const sm = el('div', 'x20same', S.same);
    tl.set(sm, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(sm, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.6)', immediateRender: false }, K.yrs + 0.75);
    const nn = el('div', 'x20none', S.none);
    tl.set(nn, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(nn, { autoAlpha: 0, scale: 2, rotation: 0 }, { autoAlpha: 1, scale: 1, rotation: -4, duration: 0.22, ease: 'power4.in', immediateRender: false }, K.none);
    sfx('chime', K.yrs + 0.8, -11); sfx('thud', K.none + 0.18, -8);
    const lk = el('div', 'x20lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X21: 3 winter messages countdown — snowy night, message bubbles 3-2-1, then each gets its place: ticket, airing reminder, snow duty plan =================
  function X21() {
    const de = lang === 'de';
    const S = de ? {
      head: 'Posteingang Vermieter', msgs: [['🥶', 'Die Heizung ist kalt!', 'Whg 2 · 06:12'], ['🍄', 'Schimmel in der Ecke …', 'Whg 5 · 18:40'], ['❄️', 'Wer räumt den Schnee?', 'Whg 7 · 07:05']],
      card: 'Alles hat seinen Platz', p: [['🎫', 'Ticket', 'Heizung Whg 2', 'in Arbeit'], ['💨', 'Lüft-Erinnerung', '3× täglich · 10 Min', 'aktiv'], ['🗓️', 'Winterdienst-Plan', 'KW 50: Whg 7', 'geteilt']], tag: 'für Mieter & Vermieter',
    } : {
      head: "Landlord's inbox", msgs: [['🥶', 'The heating is cold!', 'Unit 2 · 6:12 am'], ['🍄', "There's mold in the corner…", 'Unit 5 · 6:40 pm'], ['❄️', 'Who clears the snow?', 'Unit 7 · 7:05 am']],
      card: 'Everything has its place', p: [['🎫', 'Ticket', 'Heating unit 2', 'in progress'], ['💨', 'Airing reminder', '3× daily · 10 min', 'active'], ['🗓️', 'Snow duty plan', 'Week 50: unit 7', 'shared']], tag: 'for tenants & landlords',
    };
    const K = {};
    const i3 = W(['Drei', 'Three'], W(['bekommt', 'winter']).i); K.n3 = i3.start;
    const i2 = W(['Zwei', 'Two'], i3.i); K.n2 = i2.start;
    const i1 = W(['Eins', 'One'], i2.i); K.n1 = i1.start;
    const it = W(['Tenance', 'Tenance'], i1.i); K.turn = words[it.i - 1].start;
    K.place = W(['Platz', 'place'], it.i).start;
    K.p1 = W(['Ticket', 'ticket'], it.i).start;
    K.p2 = W(['Lüft-Erinnerung', 'airing'], it.i).start;
    K.p3 = W(['Winterdienst-Plan', 'snow'], it.i).start;
    const T = END + 2.1;
    const NT = [K.n3, K.n2, K.n1];
    el('div', 'x21bg', '<i class="g"></i>');
    const flakes = [...Array(36)].map((_, i) => el('i', 'x21sn', null));
    perFrame((t) => flakes.forEach((f, i) => { const sp = 60 + (i * 37) % 70, x0 = (i * 211) % 1080; f.style.transform = `translate(${x0 + Math.sin(t * 0.8 + i) * 30}px, ${((t * sp + i * 97) % 2000) - 60}px) scale(${0.5 + (i % 5) * 0.2})`; }));
    const hd = el('div', 'x21head', `📥 ${S.head} <em>3</em>`);
    tl.set(hd, { xPercent: -50 }, 0);
    tl.fromTo(hd, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, 0.05);
    sfx('buzz', 0.1, -14);
    const big = el('div', 'x21big', '<span>3</span>');
    const bn = big.querySelector('span');
    tl.set(big, { xPercent: -50, autoAlpha: 0 }, 0);
    const bub = S.msgs.map(([ic, tx, mt], i) => el('div', `x21msg m${i}`, `<i>${ic}</i><div><b>${tx}</b><small>${mt}</small></div>`));
    NT.forEach((t0, i) => {
      tl.call(() => { bn.textContent = String(3 - i); }, null, t0 - 0.06);
      if (i) tl.call(() => { bn.textContent = String(4 - i); }, null, t0 - 0.08);
      tl.fromTo(big, { autoAlpha: 0, scale: 2.2 }, { autoAlpha: 1, scale: 1, duration: 0.28, ease: 'power4.in', immediateRender: false }, t0 - 0.06);
      sfx('impact', t0 + 0.2, -10);
      tl.set(bub[i], { autoAlpha: 0 }, 0);
      tl.fromTo(bub[i], { autoAlpha: 0, x: i % 2 ? 260 : -260, scale: 0.8 }, { autoAlpha: 1, x: 0, scale: 1, duration: 0.38, ease: 'back.out(1.8)', immediateRender: false }, t0 + 0.35);
      sfx('pop', t0 + 0.4, -9);
    });
    tl.to(big, { autoAlpha: 0, duration: 0.2 }, K.n1 + 1.0);
    tl.to([hd, ...bub], { autoAlpha: 0, y: '-=60', scale: 0.9, duration: 0.3, ease: 'power2.in', stagger: 0.03 }, K.turn - 0.32);
    // turn: each one gets its place
    const ap = el('div', 'x21app', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.card}</b></div></div>
      ${S.p.map(([ic, nm, sb, st], i) => `<div class="pl p${i}"><i>${ic}</i><div><b>${nm}</b><small>${sb}</small></div><span>${st}</span></div>`).join('')}`);
    const pls = [...ap.querySelectorAll('.pl')];
    tl.set(ap, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(ap, { autoAlpha: 0, y: 240 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.2, -9);
    tl.set(pls, { autoAlpha: 0 }, 0);
    [K.p1, K.p2, K.p3].forEach((t0, i) => {
      tl.fromTo(pls[i], { autoAlpha: 0, x: -160 }, { autoAlpha: 0.35, x: 0, duration: 0.32, ease: 'back.out(1.8)', immediateRender: false }, K.turn + 0.45 + i * 0.12);
      tl.fromTo(pls[i], { autoAlpha: 0.35, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.2)', immediateRender: false }, t0 - 0.12);
      const sp = pls[i].querySelector('span');
      tl.fromTo(sp, { scale: 0.4 }, { scale: 1, duration: 0.25, ease: 'back.out(3)', immediateRender: false }, t0 + 0.2);
      sfx('pop', t0 - 0.1, -10); sfx('chime', t0 + 0.2, -15);
    });
    tl.fromTo(ap.querySelector('.hd'), { scale: 1 }, { scale: 1.05, duration: 0.15, yoyo: true, repeat: 1, immediateRender: false }, K.place);
    const lk = el('div', 'x21lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X27: foggy window at 7:15, humidity 78% → airing reminder, 5-min timer, window opens, gauge drops to 52%, no mold =================
  function X27() {
    const de = lang === 'de';
    const S = de ? {
      clock: '07:15', hum: 'Luftfeuchte', remT: 'Lüft-Erinnerung', remS: '5 Min stoßlüften', open: 'Fenster auf', ok: 'Kein Schimmel ✓', tag: 'für Mieter & Vermieter',
    } : {
      clock: '7:15 am', hum: 'Humidity', remT: 'Airing reminder', remS: '5 min of fresh air', open: 'Window open', ok: 'No mold ✓', tag: 'for tenants & landlords',
    };
    const K = {};
    K.fog = W(['Scheibe', 'window']).start;
    K.hum = W(['Luftfeuchte', 'humidity']).start;
    const it = W(['Tenance', 'Tenance']); K.turn = words[it.i - 1].start;
    K.rem = W(['Lüft-Erinnerung', 'airing'], it.i).start;
    K.five = W(['fünf', 'five'], it.i).start;
    K.drop = W(['fällt', 'drops'], it.i).start;
    K.no = W(['Kein', 'No'], it.i).start;
    const T = END + 2.1;
    el('div', 'x27bg', '<i class="g"></i>');
    const ck = el('div', 'x27clk', `☀️ ${S.clock}`);
    tl.set(ck, { xPercent: -50 }, 0);
    tl.fromTo(ck, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, 0.05);
    sfx('pop', 0.08, -12);
    // window with fog + droplets
    const drops = [...Array(14)].map((_, i) => `<i class="dr" style="left:${(i * 61) % 560 + 30}px;top:${(i * 137) % 420 + 40}px;height:${18 + (i % 4) * 10}px"></i>`).join('');
    const win = el('div', 'x27win', `<div class="sky"></div><div class="sash l"><div class="fog">${drops}</div></div><div class="sash r"><div class="fog">${drops}</div></div><i class="bar"></i>`);
    tl.set(win, { xPercent: -50 }, 0);
    tl.fromTo(win, { autoAlpha: 0, scale: 0.85, y: 40 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.15);
    const fogs = [...win.querySelectorAll('.fog')];
    tl.fromTo(fogs, { opacity: 0.35 }, { opacity: 0.95, duration: 1.2, ease: 'power1.in' }, Math.max(0.3, K.fog - 0.2));
    sfx('whoosh', K.fog - 0.1, -16);
    // humidity gauge
    const g = el('div', 'x27gau', `<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="84" class="tr"/><circle cx="100" cy="100" r="84" class="ar"/></svg><div class="v"><b>0</b><small>%</small></div><span>💧 ${S.hum}</span>`);
    const gv = g.querySelector('b'); const ar = g.querySelector('.ar'); const C = 2 * Math.PI * 84;
    tl.set(g, { autoAlpha: 0 }, 0);
    tl.fromTo(g, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2)', immediateRender: false }, K.hum - 0.15);
    sfx('chime', K.hum, -15);
    const t1 = K.hum, t2 = K.drop;
    perFrame((t) => {
      let v;
      if (t < t1) v = 0; else if (t < t1 + 0.9) v = 78 * E.o5(clamp((t - t1) / 0.9, 0, 1));
      else if (t < t2) v = 78; else v = lerp(78, 52, E.io(clamp((t - t2) / 1.4, 0, 1)));
      gv.textContent = Math.round(v);
      ar.style.strokeDasharray = `${C * v / 100} ${C}`;
      const hot = v > 60;
      ar.style.stroke = hot ? '#ff6b4a' : '#1fbf72'; gv.style.color = hot ? '#ff6b4a' : '#1fbf72';
    });
    tl.fromTo(g, { x: 0 }, { x: 14, duration: 0.06, yoyo: true, repeat: 5, immediateRender: false }, K.hum + 1.0);
    // turn: reminder notification
    const nt = el('div', 'x27not', `<span class="ai"><img src="assets/logo.png"></span><div><b>💨 ${S.remT}</b><small>${S.remS}</small></div><em>5:00</em>`);
    const em = nt.querySelector('em');
    tl.set(nt, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(nt, { autoAlpha: 0, y: -160 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'back.out(1.6)', immediateRender: false }, K.turn - 0.05);
    sfx('buzz', K.turn, -12); sfx('chime', K.rem, -13);
    tl.fromTo(ck, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, immediateRender: false }, K.turn - 0.1);
    // timer 5:00 -> 0:00 fast between five and drop
    const ta = K.five, tb = Math.max(K.five + 0.8, K.drop - 0.1);
    perFrame((t) => {
      const p = clamp((t - ta) / (tb - ta), 0, 1); const s = Math.round(300 * (1 - p));
      em.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    });
    // window opens, fog clears
    const sl = win.querySelector('.sash.l'), sr = win.querySelector('.sash.r');
    tl.to(sl, { rotationY: 58, duration: 0.7, ease: 'power3.inOut' }, K.five - 0.05);
    tl.to(sr, { rotationY: -58, duration: 0.7, ease: 'power3.inOut' }, K.five);
    tl.to(fogs, { opacity: 0, duration: 1.4, ease: 'power2.out' }, K.five + 0.2);
    sfx('whoosh', K.five, -10);
    const op = el('div', 'x27open', `🪟 ${S.open}`);
    tl.set(op, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(op, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, K.five + 0.35);
    // air streaks
    const air = [...Array(6)].map((_, i) => el('i', 'x27air', null));
    air.forEach((a, i) => {
      tl.set(a, { autoAlpha: 0, top: 380 + i * 60 }, 0);
      tl.fromTo(a, { autoAlpha: 0, x: -300 }, { autoAlpha: 0.8, x: 900, duration: 1.1, ease: 'none', immediateRender: false }, K.five + 0.3 + i * 0.18);
      tl.to(a, { autoAlpha: 0, duration: 0.2 }, K.five + 1.2 + i * 0.18);
    });
    // no mold stamp
    const st = el('div', 'x27ok', S.ok);
    tl.set(st, { xPercent: -50, autoAlpha: 0, rotation: -6 }, 0);
    tl.fromTo(st, { autoAlpha: 0, scale: 2 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power4.in', immediateRender: false }, K.no - 0.1);
    sfx('impact', K.no + 0.18, -9);
    const lk = el('div', 'x27lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)' }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }
  // ================= X28: Sunday 7:30 pm snow forecast → snow alert on phone (you're up, clear by 7) → 6:45 sidewalk cleared, whole building sees it =================
  function X28() {
    const de = lang === 'de';
    const S = de ? {
      day: 'Sonntag · 19:30', fc: 'Morgen', unit: 'cm Neuschnee', nT: 'Schneealarm ❄️', nS: 'Du bist dran · Gehweg bis 07:00', lockT: '19:31',
      walk: 'Gehweg', at: '06:45', free: 'Gehweg frei ✓', seen: 'gesehen', units: ['Whg 1', 'Whg 2', 'Whg 3', 'Whg 4'], tag: 'für Mieter & Vermieter',
    } : {
      day: 'Sunday · 7:30 pm', fc: 'Tomorrow', unit: 'in of fresh snow', nT: 'Snow alert ❄️', nS: "You're up · sidewalk by 7:00", lockT: '7:31',
      walk: 'Sidewalk', at: '6:45 am', free: 'Sidewalk clear ✓', seen: 'seen', units: ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4'], tag: 'for tenants & landlords',
    };
    const K = {};
    K.snow = W(['Neuschnee', 'snow']).start;
    const it = W(['Tenance', 'Tenance']); K.turn = words[it.i - 1].start;
    K.alarm = W(['Schneealarm', 'alert'], it.i).start;
    K.up = W(['dran', 'up'], it.i).start;
    K.at = W(['sechs', 'six'], it.i).start;
    K.all = W(['alle', 'everyone'], it.i).start;
    const T = END + 2.1;
    const bg = el('div', 'x28bg', '<i class="m"></i><i class="g"></i>');
    const mb = bg.querySelector('.m');
    tl.fromTo(mb, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.inOut', immediateRender: false }, K.at - 0.4);
    const flakes = [...Array(40)].map(() => el('i', 'x28sn', null));
    perFrame((t) => flakes.forEach((f, i) => { const sp = 70 + (i * 37) % 80, x0 = (i * 211) % 1080; f.style.transform = `translate(${x0 + Math.sin(t * 0.9 + i) * 26}px, ${((t * sp + i * 97) % 2000) - 60}px) scale(${0.45 + (i % 5) * 0.2})`; }));
    const dc = el('div', 'x28day', `🌙 ${S.day}`);
    tl.set(dc, { xPercent: -50 }, 0);
    tl.fromTo(dc, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, 0.05);
    sfx('pop', 0.08, -12);
    // forecast card with counting cm
    const n = de ? 8 : 3;
    const fc = el('div', 'x28fc', `<small>${S.fc}</small><div><b>0</b><span>❄️</span></div><em>${S.unit}</em>`);
    const fb = fc.querySelector('b');
    tl.set(fc, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(fc, { autoAlpha: 0, scale: 0.7, y: 60 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.8)', immediateRender: false }, Math.max(0.4, K.snow - 1.2));
    perFrame((t) => { fb.textContent = Math.round(n * E.o5(clamp((t - (K.snow - 0.9)) / 1.0, 0, 1))); });
    sfx('chime', K.snow, -14);
    tl.to([fc, dc], { autoAlpha: 0, y: -80, scale: 0.9, duration: 0.3, ease: 'power2.in' }, K.turn - 0.3);
    // phone with lock-screen alert
    const ph = el('div', 'x28ph', `<div class="scr"><b class="tm">${S.lockT}</b><div class="nt"><span class="ai"><img src="assets/logo.png"></span><div><b>${S.nT}</b><small>${S.nS}</small></div></div></div>`);
    const nt = ph.querySelector('.nt');
    tl.set(ph, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(ph, { autoAlpha: 0, y: 300 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.15, -10);
    tl.set(nt, { autoAlpha: 0 }, 0);
    tl.fromTo(nt, { autoAlpha: 0, y: -60, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(2)', immediateRender: false }, K.alarm - 0.1);
    sfx('buzz', K.alarm, -10);
    tl.fromTo(ph, { rotation: 0 }, { rotation: 2.5, duration: 0.05, yoyo: true, repeat: 7, immediateRender: false }, K.alarm);
    tl.fromTo(nt, { scale: 1 }, { scale: 1.06, duration: 0.15, yoyo: true, repeat: 1, immediateRender: false }, K.up);
    tl.to(ph, { autoAlpha: 0, y: -120, scale: 0.85, duration: 0.35, ease: 'power2.in' }, K.at - 0.4);
    // morning: sidewalk being cleared
    const tc = el('div', 'x28at', `☀️ ${S.at}`);
    tl.set(tc, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(tc, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, K.at - 0.1);
    const wk = el('div', 'x28walk', `<i class="pv"></i><i class="sn"></i><i class="sh">🧹</i><span>${S.walk}</span>`);
    const sn = wk.querySelector('.sn'), sh = wk.querySelector('.sh');
    tl.set(wk, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(wk, { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out', immediateRender: false }, K.at - 0.05);
    tl.fromTo(sn, { scaleX: 1 }, { scaleX: 0, duration: 1.3, ease: 'power1.inOut', immediateRender: false }, K.at + 0.35);
    tl.fromTo(sh, { x: 0 }, { x: 760, duration: 1.3, ease: 'power1.inOut', immediateRender: false }, K.at + 0.35);
    sfx('whoosh', K.at + 0.4, -12);
    const fr = el('div', 'x28free', S.free);
    tl.set(fr, { xPercent: -50, autoAlpha: 0, rotation: -5 }, 0);
    tl.fromTo(fr, { autoAlpha: 0, scale: 2 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power4.in', immediateRender: false }, K.at + 1.6);
    sfx('impact', K.at + 1.85, -10);
    // everyone sees it
    const row = el('div', 'x28row', S.units.map((u) => `<div><i>🏠</i><b>${u}</b><small>${S.seen} ✓</small></div>`).join(''));
    const cells = [...row.children];
    tl.set(row, { xPercent: -50 }, 0); tl.set(cells, { autoAlpha: 0 }, 0);
    cells.forEach((c, i) => {
      tl.fromTo(c, { autoAlpha: 0, y: 40, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, K.all - 0.1 + i * 0.12);
      sfx('pop', K.all + i * 0.12, -13);
    });
    const lk = el('div', 'x28lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)' }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }
  // ================= X29: rent paid but no receipt → payment detected → receipt prints itself (base/utilities/850 paid) → monthly history for tenant & landlord =================
  function X29() {
    const de = lang === 'de';
    const cur = (v) => (de ? `${v} €` : `$${v}`);
    const S = de ? {
      bank: 'Überweisung', bankS: 'Miete Oktober', done: 'ausgeführt ✓', q: 'Quittung?', det: 'Zahlungseingang erkannt', title: 'Quittung · Oktober',
      l1: 'Kaltmiete', l2: 'Nebenkosten', sum: 'Gesamt', paid: 'BEZAHLT', hist: 'Verlauf', months: ['Oktober', 'September', 'August'], who: 'Mieter ✓ · Vermieter ✓', tag: 'für Mieter & Vermieter',
    } : {
      bank: 'Transfer', bankS: 'October rent', done: 'completed ✓', q: 'Receipt?', det: 'Payment detected', title: 'Receipt · October',
      l1: 'Base rent', l2: 'Utilities', sum: 'Total', paid: 'PAID', hist: 'History', months: ['October', 'September', 'August'], who: 'Tenant ✓ · Landlord ✓', tag: 'for tenants & landlords',
    };
    const K = {};
    K.where = W(['Quittung', 'receipt']).start;
    const it = W(['Tenance', 'Tenance']); K.turn = words[it.i - 1].start;
    K.spot = W(['Eingang', 'payment'], it.i).start;
    K.rcpt = W(['Quittung', 'receipt'], it.i).start;
    K.base = W(['Kaltmiete', 'base'], it.i).start;
    K.util = W(['Nebenkosten', 'utilities'], it.i).start;
    K.amt = W(['achthundertfünfzig', 'eight'], it.i).start;
    K.paid = W(['bezahlt', 'paid'], it.i).start;
    K.month = W(['Monat', 'month'], it.i).start;
    const T = END + 2.1;
    el('div', 'x29bg', '<i class="g"></i>');
    // bank transfer card
    const bk = el('div', 'x29bank', `<i>🏦</i><div><b>${S.bank}</b><small>${S.bankS}</small></div><span>−${cur(850)}</span><em>${S.done}</em>`);
    tl.set(bk, { xPercent: -50 }, 0);
    tl.fromTo(bk, { autoAlpha: 0, y: -60, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.8)' }, 0.05);
    sfx('pop', 0.1, -12);
    const q = el('div', 'x29q', `<b>?</b><span>${S.q}</span>`);
    tl.set(q, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(q, { autoAlpha: 0, scale: 0.3, rotation: -20 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(2.2)', immediateRender: false }, K.where - 0.15);
    tl.fromTo(q, { y: 0 }, { y: -18, duration: 0.5, yoyo: true, repeat: 3, ease: 'sine.inOut', immediateRender: false }, K.where + 0.4);
    sfx('impact', K.where, -12);
    tl.to([bk, q], { autoAlpha: 0, y: -80, scale: 0.9, duration: 0.3, ease: 'power2.in', stagger: 0.04 }, K.turn - 0.3);
    // app: payment detected
    const ap = el('div', 'x29app', `<div class="hd"><span class="ai"><img src="assets/logo.png"></span><b>Tenance</b></div><div class="det"><i></i>${S.det} · ${cur(850)}</div>`);
    const det = ap.querySelector('.det'), dot = det.querySelector('i');
    tl.set(ap, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(ap, { autoAlpha: 0, y: 120 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.2, -10);
    tl.set(det, { autoAlpha: 0 }, 0);
    tl.fromTo(det, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, K.spot - 0.1);
    tl.fromTo(dot, { scale: 1 }, { scale: 1.6, opacity: 0.4, duration: 0.4, yoyo: true, repeat: 3, immediateRender: false }, K.spot);
    sfx('chime', K.spot, -12);
    // receipt prints out
    const rc = el('div', 'x29rc', `<div class="x29slot"></div><div class="x29clip"><div class="x29pp"><b class="x29t">🧾 ${S.title}</b>
      <p class="x29r x29r1"><span>${S.l1}</span><span>${cur(700)}</span></p><p class="x29r x29r2"><span>${S.l2}</span><span>${cur(150)}</span></p>
      <p class="x29r x29r3"><span>${S.sum}</span><span class="am">${cur(0)}</span></p><i class="x29st">${S.paid}</i></div></div>`);
    const pp = rc.querySelector('.x29pp'), am = rc.querySelector('.am'), st = rc.querySelector('.x29st');
    const rows = [rc.querySelector('.x29r1'), rc.querySelector('.x29r2'), rc.querySelector('.x29r3')];
    tl.set(rc, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(rc, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, immediateRender: false }, K.rcpt - 0.3);
    tl.fromTo(pp, { yPercent: -100 }, { yPercent: 0, duration: 0.9, ease: 'power2.out', immediateRender: false }, K.rcpt - 0.2);
    sfx('whoosh', K.rcpt - 0.1, -13);
    tl.set(rows, { autoAlpha: 0 }, 0);
    [K.base, K.util, K.amt].forEach((t0, i) => {
      tl.fromTo(rows[i], { autoAlpha: 0, x: -40 }, { autoAlpha: 1, x: 0, duration: 0.25, ease: 'power2.out', immediateRender: false }, t0 - 0.12);
      sfx('pop', t0 - 0.1, -13);
    });
    perFrame((t) => { am.textContent = cur(Math.round(850 * E.o5(clamp((t - K.amt + 0.1) / 0.8, 0, 1)))); });
    tl.set(st, { autoAlpha: 0, rotation: -12 }, 0);
    tl.fromTo(st, { autoAlpha: 0, scale: 2.4 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'power4.in', immediateRender: false }, K.paid - 0.08);
    sfx('impact', K.paid + 0.15, -9);
    // monthly history
    tl.to([ap, rc], { autoAlpha: 0, y: -60, duration: 0.3, ease: 'power2.in' }, K.month - 1.1);
    const hs = el('div', 'x29hist', `<b class="h">📂 ${S.hist}</b>` + S.months.map((m) => `<div class="it"><i>🧾</i><div><b>${m}</b><small>${S.who}</small></div><span>${cur(850)}</span></div>`).join(''));
    const its = [...hs.querySelectorAll('.it')];
    tl.set(hs, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(hs, { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out', immediateRender: false }, K.month - 0.85);
    tl.set(its, { autoAlpha: 0 }, 0);
    its.forEach((x, i) => { tl.fromTo(x, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(1.8)', immediateRender: false }, K.month - 0.6 + i * 0.22); sfx('pop', K.month - 0.55 + i * 0.22, -14); });
    const lk = el('div', 'x29lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)' }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }
  // ================= X30: landlord asks for the lease → 20 min digging through folders → Tenance search, 4 letters, 2 s → lease found → contract/report/invoices in one archive =================
  function X30() {
    const de = lang === 'de';
    const S = de ? {
      ask: 'Kannst du mir den Mietvertrag schicken?', who: 'Vermieter', min: 'Min. gesucht', q: 'Miet', ph: 'Dokumente durchsuchen', res: 'Mietvertrag.pdf', resS: 'Wohnung 2 · unterschrieben', sec: 's',
      send: 'Gesendet ✓', cats: [['📄', 'Vertrag'], ['📋', 'Protokoll'], ['🧾', 'Rechnungen']], arch: 'Ein Archiv', tag: 'für Mieter & Vermieter',
    } : {
      ask: 'Could you send me the lease?', who: 'Landlord', min: 'min searching', q: 'leas', ph: 'Search documents', res: 'Lease.pdf', resS: 'Apt 2 · signed', sec: 's',
      send: 'Sent ✓', cats: [['📄', 'Lease'], ['📋', 'Report'], ['🧾', 'Invoices']], arch: 'One archive', tag: 'for tenants & landlords',
    };
    const K = {};
    K.ask = W(['fragt', 'asks']).start;
    K.dig = W(['suchst', 'digging']).start;
    K.tw = W(['zwanzig', 'twenty']).start;
    const it = W(['Tenance', 'Tenance']); K.turn = words[it.i - 1].start;
    K.four = W(['vier', 'four'], it.i).start;
    const two = W(['zwei', 'two'], it.i); K.two = two.start;
    K.there = W(['da', 'there'], two.i).start;
    K.c1 = W(['Vertrag', 'lease'], two.i).start;
    K.c2 = W(['Protokoll', 'report'], two.i).start;
    K.c3 = W(['Rechnungen', 'invoices'], two.i).start;
    K.arch = W(['Archiv', 'archive'], two.i).start;
    const T = END + 2.1;
    el('div', 'x30bg', '<i class="x30g"></i>');
    // landlord message
    const msg = el('div', 'x30msg', `<span class="x30av">🏠</span><div><small>${S.who}</small><b>${S.ask}</b></div>`);
    tl.set(msg, { xPercent: -50 }, 0);
    tl.fromTo(msg, { autoAlpha: 0, y: -60, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.8)' }, 0.05);
    sfx('pop', 0.1, -12);
    // folder chaos: papers fly out of a binder
    const fd = el('div', 'x30fold', '<div class="x30bk"></div>' + Array.from({ length: 9 }, (_, i) => `<i class="x30pg" style="--h:${(i * 37) % 360}"></i>`).join('') + '<div class="x30fr"><b>📁</b></div>');
    const pgs = [...fd.querySelectorAll('.x30pg')];
    tl.set(fd, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(fd, { autoAlpha: 0, y: 100 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out', immediateRender: false }, K.dig - 0.4);
    pgs.forEach((p, i) => {
      const t0 = K.dig - 0.1 + i * 0.28, a = (i % 2 ? 1 : -1) * (120 + (i * 53) % 220);
      tl.fromTo(p, { x: 0, y: 0, rotation: 0, autoAlpha: 1 }, { x: a, y: -260 - (i * 41) % 200, rotation: a / 4, duration: 0.7, ease: 'power2.out', immediateRender: false }, t0);
      tl.to(p, { y: 500, autoAlpha: 0, duration: 0.9, ease: 'power1.in' }, t0 + 0.7);
    });
    sfx('binder', K.dig - 0.2, -12);
    // timer counting to 20 min
    const tm = el('div', 'x30tm', `<i>⏱️</i><b>0</b><span>${S.min}</span>`);
    const tb = tm.querySelector('b');
    tl.set(tm, { autoAlpha: 0 }, 0);
    tl.fromTo(tm, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.2)', immediateRender: false }, K.dig);
    perFrame((t) => { tb.textContent = Math.round(20 * E.io(clamp((t - K.dig) / (K.tw + 0.6 - K.dig), 0, 1))); });
    tl.fromTo(tm, { x: 0 }, { x: 12, duration: 0.06, yoyo: true, repeat: 7, immediateRender: false }, K.tw + 0.5);
    sfx('impact', K.tw + 0.45, -12);
    tl.to([msg, fd, tm], { autoAlpha: 0, y: -80, scale: 0.9, duration: 0.3, ease: 'power2.in', stagger: 0.04 }, K.turn - 0.3);
    // app search
    const ap = el('div', 'x30app', `<div class="x30hd"><span class="ai"><img src="assets/logo.png"></span><b>Tenance</b></div>
      <div class="x30sb"><i>🔍</i><span class="x30ph">${S.ph}</span><span class="x30q"></span><u></u></div>
      <div class="x30ld"><em></em><b class="x30s">0.0 ${S.sec}</b></div>
      <div class="x30rs"><i>📄</i><div><b>${S.res}</b><small>${S.resS}</small></div><em>${S.send}</em></div>`);
    const q = ap.querySelector('.x30q'), ph = ap.querySelector('.x30ph'), cur = ap.querySelector('u'), ld = ap.querySelector('.x30ld'), bar = ld.querySelector('em'), sc = ld.querySelector('.x30s'), rs = ap.querySelector('.x30rs'), sd = rs.querySelector('em');
    tl.set(ap, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(ap, { autoAlpha: 0, y: 120 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.2, -10);
    const tq = K.four - 0.1;
    perFrame((t) => {
      const n = clamp(Math.floor((t - tq) / 0.14) + 1, 0, 4);
      q.textContent = S.q.slice(0, n); ph.style.display = n ? 'none' : '';
      cur.style.opacity = (Math.floor(t * 3) % 2 && t < K.there) ? 0 : 1;
      const p = clamp((t - (tq + 0.6)) / (K.there - tq - 0.6), 0, 1);
      bar.style.transform = `scaleX(${p})`; sc.textContent = `${(2 * p).toFixed(1)} ${S.sec}`;
    });
    sfx('typing', tq, -12);
    tl.set([ld, rs, sd], { autoAlpha: 0 }, 0);
    tl.fromTo(ld, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, immediateRender: false }, tq + 0.55);
    tl.to(ld, { autoAlpha: 0, duration: 0.2 }, K.there + 0.1);
    tl.fromTo(rs, { autoAlpha: 0, y: 40, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, K.there - 0.05);
    sfx('chime', K.there, -11);
    tl.fromTo(sd, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2.4)', immediateRender: false }, K.there + 0.35);
    sfx('pop', K.there + 0.35, -13);
    // archive categories
    tl.to(ap, { autoAlpha: 0, y: -60, duration: 0.3, ease: 'power2.in' }, K.c1 - 0.35);
    const ar = el('div', 'x30arc', S.cats.map(([e, n]) => `<div class="x30cc"><i>${e}</i><b>${n}</b></div>`).join('') + `<div class="x30bx"><i>🗄️</i><b>${S.arch}</b></div>`);
    const ccs = [...ar.querySelectorAll('.x30cc')], bx = ar.querySelector('.x30bx');
    tl.set(ar, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(ar, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, immediateRender: false }, K.c1 - 0.2);
    tl.set([...ccs, bx], { autoAlpha: 0 }, 0);
    [K.c1, K.c2, K.c3].forEach((t0, i) => {
      tl.fromTo(ccs[i], { autoAlpha: 0, y: -120, rotation: (i - 1) * 10 }, { autoAlpha: 1, y: 0, rotation: (i - 1) * 4, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, t0 - 0.12);
      sfx('pop', t0 - 0.1, -13);
    });
    tl.fromTo(bx, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, K.arch - 0.6);
    tl.to(ccs, { y: 330, scale: 0.55, autoAlpha: 0, duration: 0.45, ease: 'power2.in', stagger: 0.07 }, K.arch - 0.35);
    tl.fromTo(bx, { scale: 1 }, { scale: 1.08, duration: 0.15, yoyo: true, repeat: 1, immediateRender: false }, K.arch + 0.1);
    sfx('impact', K.arch + 0.1, -10);
    const lk = el('div', 'x30lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)' }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X31: 1,500 deposit → move out → endless waiting → Tenance tracker both sides see: paid in / handover checked / refunded → deposit back, no chasing =================
  function X31() {
    const de = lang === 'de';
    const cur = (v) => (de ? `${v.toLocaleString('de-DE')} €` : `$${v.toLocaleString('en-US')}`);
    const S = de ? {
      dep: 'Kaution', out: 'Ausgezogen', day: 'Tag', chat: ['Und meine Kaution?', 'Gibt es schon was Neues?', 'Hallo??'], tr: 'Kaution', who: ['Mieter', 'Vermieter'],
      steps: ['Eingezahlt', 'Übergabe geprüft', 'Zurücküberwiesen'], back: 'zurück', no: '0 Nachfragen', tag: 'für Mieter & Vermieter',
    } : {
      dep: 'Deposit', out: 'Moved out', day: 'Day', chat: ['Any news on my deposit?', 'Hello? Any update?', 'Still waiting…'], tr: 'Deposit', who: ['Tenant', 'Landlord'],
      steps: ['Paid in', 'Handover checked', 'Refunded'], back: 'back', no: '0 follow-ups', tag: 'for tenants & landlords',
    };
    const K = {};
    K.move = W(['Auszug', 'moving']).start;
    K.wait = W(['warten', 'waiting']).start;
    const it = W(['Tenance', 'Tenance']); K.turn = words[it.i - 1].start;
    K.see = W(['sehen', 'see'], it.i).start;
    K.s1 = W(['eingezahlt', 'paid'], it.i).start;
    K.s2 = W(['Übergabe', 'handover'], it.i).start;
    const s3 = W(['zurücküberwiesen', 'refunded'], it.i); K.s3 = s3.start;
    K.back = W(['zurück', 'back'], s3.i).start;
    K.no = W(['ohne', 'no'], s3.i).start;
    const T = END + 2.1;
    el('div', 'x31bg', '<i class="x31g"></i>');
    // deposit card + moving box
    const dc = el('div', 'x31dep', `<small>${S.dep}</small><b>${cur(1500)}</b><i>${de ? '💶' : '💵'}</i>`);
    tl.set(dc, { xPercent: -50 }, 0);
    tl.fromTo(dc, { autoAlpha: 0, y: -60, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(2)' }, 0.02);
    sfx('kaching', 0.1, -12);
    const bx = el('div', 'x31box', `<i>📦</i><span>🔑 ${S.out}</span>`);
    tl.set(bx, { autoAlpha: 0 }, 0);
    tl.fromTo(bx, { autoAlpha: 0, x: -300 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power3.out', immediateRender: false }, K.move - 0.2);
    sfx('whoosh', K.move - 0.2, -12);
    // waiting: day counter + unanswered chat bubbles
    const dy = el('div', 'x31day', `<i>⏳</i><b>${S.day} 1</b>`);
    const db = dy.querySelector('b');
    tl.set(dy, { autoAlpha: 0 }, 0);
    tl.fromTo(dy, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.2)', immediateRender: false }, K.wait - 0.25);
    perFrame((t) => { db.textContent = `${S.day} ${1 + Math.round(46 * E.io(clamp((t - K.wait + 0.2) / 1.2, 0, 1)))}`; });
    const bs = S.chat.map((c, i) => el('div', 'x31ch', `${c}<em>✓✓</em>`, null, { top: `${1000 + i * 130}px` }));
    tl.set(bs, { autoAlpha: 0 }, 0);
    bs.forEach((b, i) => { tl.fromTo(b, { autoAlpha: 0, x: 120 }, { autoAlpha: 1, x: 0, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, K.wait - 0.1 + i * 0.32); sfx('send', K.wait - 0.1 + i * 0.32, -15); });
    tl.to([dc, bx, dy, ...bs], { autoAlpha: 0, y: -80, scale: 0.9, duration: 0.3, ease: 'power2.in', stagger: 0.03 }, K.turn - 0.3);
    // tracker app
    const ap = el('div', 'x31app', `<div class="x31hd"><span class="ai"><img src="assets/logo.png"></span><b>Tenance</b><em>${S.tr} · ${cur(1500)}</em></div>
      <div class="x31who">${S.who.map((w, i) => `<span><i>${i ? '🏠' : '🙂'}</i>${w} 👁️</span>`).join('')}</div>
      <div class="x31tr"><i class="x31ln"><u></u></i>${S.steps.map((s) => `<div class="x31st"><b class="x31dt"></b><span>${s}</span><em>✓</em></div>`).join('')}</div>`);
    const who = [...ap.querySelectorAll('.x31who span')], sts = [...ap.querySelectorAll('.x31st')], fill = ap.querySelector('.x31ln u');
    tl.set(ap, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(ap, { autoAlpha: 0, y: 120 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.2, -10);
    tl.set(who, { autoAlpha: 0 }, 0);
    who.forEach((w, i) => { tl.fromTo(w, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, K.see - 0.1 + i * 0.4); sfx('pop', K.see - 0.05 + i * 0.4, -13); });
    const ST = [K.s1, K.s2, K.s3];
    sts.forEach((s, i) => {
      tl.fromTo(s, { opacity: 0.35 }, { opacity: 1, duration: 0.2, immediateRender: false }, ST[i] - 0.1);
      tl.fromTo(s.querySelector('.x31dt'), { backgroundColor: '#d6dbe8', scale: 1 }, { backgroundColor: '#1fbf72', scale: 1.25, duration: 0.25, ease: 'back.out(3)', immediateRender: false }, ST[i] - 0.1);
      tl.fromTo(s.querySelector('em'), { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2.4)', immediateRender: false }, ST[i]);
      sfx('chime', ST[i], -13);
    });
    tl.set(sts.map((s) => s.querySelector('em')), { autoAlpha: 0 }, 0);
    tl.set(sts, { opacity: 0.35 }, 0);
    perFrame((t) => { fill.style.transform = `scaleY(${clamp((t - K.s1) / (K.s3 - K.s1), 0, 1)})`; });
    // money back
    const mb = el('div', 'x31back', `<b>+${cur(1500)}</b><span>${S.dep} ${S.back} ✓</span>`);
    tl.set(mb, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(mb, { autoAlpha: 0, scale: 2.2 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power4.in', immediateRender: false }, K.back - 0.25);
    sfx('kaching', K.back, -9);
    const nq = el('div', 'x31no', `<i>💬</i><b>${S.no}</b>`);
    tl.set(nq, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(nq, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, K.no - 0.1);
    sfx('pop', K.no, -12);
    const lk = el('div', 'x31lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)' }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= X32: March usage climbs → back payment looms → Tenance usage chart +18% → advance adjusted early 165 → 205 → back payment 0 =================
  function X32() {
    const de = lang === 'de';
    const cur = (v) => (de ? `${v} €` : `$${v}`);
    const S = de ? {
      mon: ['Jan', 'Feb', 'Mär'], use: 'Verbrauch', bill: 'Nachzahlung', next: 'nächstes Jahr', chart: 'Verbrauchskurve', adv: 'Abschlag / Monat', early: 'früh angepasst ✓', zero: 'Nachzahlung', tag: 'für Mieter & Vermieter',
    } : {
      mon: ['Jan', 'Feb', 'Mar'], use: 'Usage', bill: 'Back payment', next: 'next year', chart: 'Usage chart', adv: 'Monthly payment', early: 'adjusted early ✓', zero: 'Back payment', tag: 'for tenants & landlords',
    };
    const K = {};
    K.climb = W(['steigt', 'climbing']).start;
    K.bill = W(['Nachzahlung', 'back']).start;
    const it = W(['Tenance', 'Tenance']); K.turn = words[it.i - 1].start;
    K.chart = W(['Verbrauchskurve', 'chart'], it.i).start;
    K.plus = W(['plus', 'plus'], it.i).start;
    K.adj = W(['Abschlag', 'monthly'], it.i).start;
    K.early = W(['früh', 'early'], it.i).start;
    const fr = W(['von', 'from'], it.i); K.from = fr.start;
    K.to = W(['auf', 'to'], fr.i).start;
    K.zero = W(['null', 'zero'], fr.i).start;
    const T = END + 2.1;
    el('div', 'x32bg', '<i class="x32g"></i>');
    // bar chart: March bar shoots up red
    const bc = el('div', 'x32bars', `<b class="x32h">📈 ${S.use}</b><div class="x32row">` + S.mon.map((m, i) => `<div class="x32col"><i class="x32b${i === 2 ? ' x32hot' : ''}"></i><span>${m}</span></div>`).join('') + '</div>');
    const bars = [...bc.querySelectorAll('.x32b')];
    tl.set(bc, { xPercent: -50 }, 0);
    tl.fromTo(bc, { autoAlpha: 0, y: -60 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.02);
    tl.set(bars, { scaleY: 0 }, 0);
    tl.to(bars[0], { scaleY: 0.45, duration: 0.4, ease: 'back.out(1.6)' }, 0.25);
    tl.to(bars[1], { scaleY: 0.5, duration: 0.4, ease: 'back.out(1.6)' }, 0.4);
    tl.to(bars[2], { scaleY: 0.95, duration: 0.6, ease: 'back.out(1.6)' }, K.climb - 0.05);
    sfx('pop', 0.3, -14); sfx('sting', K.climb, -12);
    // looming bill
    const bl = el('div', 'x32bill', `<i>🧾</i><div><b>${S.bill}</b><small>${S.next}</small></div><span>${de ? '+ ??? €' : '+ $???'}</span>`);
    tl.set(bl, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(bl, { autoAlpha: 0, y: 200, rotation: 6 }, { autoAlpha: 1, y: 0, rotation: -2, duration: 0.4, ease: 'back.out(1.8)', immediateRender: false }, K.bill - 0.3);
    tl.fromTo(bl, { x: 0 }, { x: 14, duration: 0.06, yoyo: true, repeat: 7, immediateRender: false }, K.bill + 0.3);
    sfx('impact', K.bill, -11);
    tl.to([bc, bl], { autoAlpha: 0, y: -80, scale: 0.9, duration: 0.3, ease: 'power2.in', stagger: 0.04 }, K.turn - 0.3);
    // app: usage curve
    const ap = el('div', 'x32app', `<div class="x32hd"><span class="ai"><img src="assets/logo.png"></span><b>Tenance</b><em>${S.chart}</em></div>
      <svg viewBox="0 0 800 360"><path class="x32gr" d="M0 300 L800 300"/><path class="x32ln" d="M10 280 C120 270 200 260 300 250 S480 200 560 150 S720 70 790 50"/><circle class="x32pt" cx="790" cy="50" r="16"/></svg>
      <i class="x32pc">+18 %</i>`);
    const ln = ap.querySelector('.x32ln'), pt = ap.querySelector('.x32pt'), pc = ap.querySelector('.x32pc');
    const L = 900; ln.style.strokeDasharray = L;
    tl.set(ap, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(ap, { autoAlpha: 0, y: 120 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power4.out', immediateRender: false }, K.turn - 0.05);
    sfx('whoosh', K.turn - 0.2, -10);
    perFrame((t) => { ln.style.strokeDashoffset = L * (1 - E.io(clamp((t - K.chart + 0.1) / 0.9, 0, 1))); });
    tl.set([pt, pc], { autoAlpha: 0 }, 0);
    tl.fromTo(pt, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, transformOrigin: '50% 50%', duration: 0.25, ease: 'back.out(3)', immediateRender: false }, K.chart + 0.75);
    tl.fromTo(pc, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, K.plus - 0.05);
    sfx('pop', K.plus, -12);
    // advance payment card
    const ad = el('div', 'x32adv', `<small>${S.adv}</small><div class="x32nums"><s>${cur(165)}</s><i>→</i><b>${cur(165)}</b></div><em>${S.early}</em>`);
    const old = ad.querySelector('s'), arr = ad.querySelector('.x32nums i'), nv = ad.querySelector('b'), em = ad.querySelector('em');
    tl.set(ad, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(ad, { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'back.out(1.8)', immediateRender: false }, K.adj - 0.15);
    sfx('pop', K.adj, -13);
    tl.set([old, arr, em], { autoAlpha: 0 }, 0);
    tl.fromTo(em, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2.4)', immediateRender: false }, K.early - 0.05);
    sfx('chime', K.early, -12);
    tl.fromTo([old, arr], { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.25, stagger: 0.1, immediateRender: false }, K.from);
    perFrame((t) => { nv.textContent = cur(Math.round(165 + 40 * E.o5(clamp((t - K.to) / 0.7, 0, 1)))); });
    sfx('counter', K.to, -14);
    // zero
    const zr = el('div', 'x32zero', `<small>${S.zero}</small><b>${cur(0)}</b>`);
    tl.set(zr, { xPercent: -50, autoAlpha: 0, rotation: -6 }, 0);
    tl.fromTo(zr, { autoAlpha: 0, scale: 2.4 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'power4.in', immediateRender: false }, K.zero - 0.2);
    sfx('impact', K.zero + 0.05, -9);
    const lk = el('div', 'x32lock', `<span class="ai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${S.tag}</small></span>`);
    tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
    tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)' }, END + 0.3);
    sfx('impact', END + 0.33, -10);
    setCapHidden((t) => t > END + 0.3);
    return { T, K };
  }

  // ================= XK: shared card-scene kit for X33-X44 =================
  function XK(ink, acc, bg) {
    stage.style.setProperty('--ink', ink); stage.style.setProperty('--acc', acc);
    el('div', 'xkbg', '<i></i>').style.background = bg;
    const card = (cls, html, css) => { const e = el('div', 'xkc ' + cls, html, null, css); tl.set(e, { xPercent: -50, autoAlpha: 0 }, 0); return e; };
    const show = (e, t, o = {}) => {
      tl.fromTo(e, { autoAlpha: 0, y: o.y ?? 80, scale: o.s ?? 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.7)', immediateRender: false }, t);
      if (o.sfx !== false) sfx(o.sfx || 'pop', t + 0.05, -13);
    };
    const hide = (es, t) => tl.to(es, { autoAlpha: 0, y: -70, scale: 0.92, duration: 0.3, ease: 'power2.in', stagger: 0.03 }, t);
    const pops = (es, ts, sf = 'pop', db = -14) => {
      tl.set(es, { autoAlpha: 0 }, 0);
      es.forEach((e, i) => { tl.fromTo(e, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.28, ease: 'back.out(2.4)', immediateRender: false }, ts[i] - 0.08); if (sf) sfx(sf, ts[i], db); });
    };
    const hd = (sub) => `<div class="xkhd"><span class="xkai"><img src="assets/logo.png"></span><b>Tenance</b>${sub ? `<em>${sub}</em>` : ''}</div>`;
    const stamp = (txt, top, t) => {
      const e = el('div', 'xkst', txt, null, { top: top + 'px' });
      tl.set(e, { xPercent: -50, autoAlpha: 0, rotation: -5 }, 0);
      tl.fromTo(e, { autoAlpha: 0, scale: 2.4 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'power4.in', immediateRender: false }, t - 0.2);
      sfx('impact', t + 0.05, -10); return e;
    };
    const count = (node, a, b, t0, d, fmt = (v) => v) => perFrame((t) => { node.textContent = fmt(Math.round(a + (b - a) * E.o5(clamp((t - t0) / d, 0, 1)))); });
    const turn = () => { const it = W(['Tenance', 'Tenance']); return { t: words[it.i - 1].start, i: it.i }; };
    const end = (tag) => {
      const lk = el('div', 'xklock', `<span class="xkai"><img src="assets/logo.png"></span><span><b>Tenance</b><small>${tag}</small></span>`);
      tl.set(lk, { autoAlpha: 0, xPercent: -50 }, 0);
      tl.fromTo(lk, { autoAlpha: 0, y: 60, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)' }, END + 0.3);
      sfx('impact', END + 0.33, -10); setCapHidden((t) => t > END + 0.3);
    };
    const shake = (e, t) => tl.fromTo(e, { x: 0 }, { x: 12, duration: 0.06, yoyo: true, repeat: 7, immediateRender: false }, t);
    return { card, show, hide, pops, hd, stamp, count, turn, end, shake };
  }
  const TAG = () => (lang === 'de' ? 'für Mieter & Vermieter' : 'for tenants & landlords');

  // ================= X33: cold radiator at 10 pm → photo report → landlord sees → appointment 8:00 → warm by 9 =================
  function X33() {
    const de = lang === 'de';
    const S = de ? { night: '🌙 22:00', room: 'Wohnzimmer · Heizung kalt', rep: 'Meldung · Heizung', out: 'Gesendet', seen: 'Vermieter hat gesehen', appt: 'Morgen · 08:00 · Techniker', warm: '☀️ 09:00 · warm', end: ['Gemeldet', 'Gesehen', 'Erledigt'] }
      : { night: '🌙 10:00 pm', room: 'Living room · heating cold', rep: 'Report · Heating', out: 'Sent', seen: 'Landlord has seen it', appt: 'Tomorrow · 8:00 am · Technician', warm: '☀️ 9:00 am · warm', end: ['Reported', 'Seen', 'Fixed'] };
    const k = XK('#1f2a44', '#ff6b4a', 'linear-gradient(180deg,#1d2747 0%,#2c3a66 55%,#3c4c7e 100%)');
    const T0 = k.turn(), K = { turn: T0.t };
    K.cold = W(['kalt', 'cold']).start; K.photo = W(['Foto', 'photo'], T0.i).start; K.out = W(['raus', 'out'], T0.i).start;
    K.sees = W(['sieht', 'sees'], T0.i).start; K.appt = W(['Termin', 'appointment'], T0.i).start; K.warm = W(['warm', 'warm'], T0.i).start;
    const e1 = W(['Gemeldet', 'reported'], T0.i), e2 = W(['gesehen', 'seen'], e1.i), e3 = W(['erledigt', 'fixed'], e2.i);
    const ch = k.card('xkchip', S.night, { top: '140px' }); k.show(ch, 0.05);
    const rd = k.card('x33rad', `<i>♨️</i><b class="xkbig">15°</b><span class="xksm">${S.room}</span><u>❄️</u>`, { top: '320px' });
    const tv = rd.querySelector('b'); k.show(rd, 0.25);
    tl.to(tv, { color: '#3b8cff', duration: 0.3 }, K.cold - 0.1); k.shake(rd, K.cold); sfx('shiver', K.cold, -12);
    k.hide([ch, rd], K.turn - 0.3);
    const ap = k.card('x33app', k.hd(S.rep) + `<div class="x33ph"><i>♨️</i><em></em></div><div class="xkr x33a"><i>📤</i><span>${S.out}</span><em>✓</em></div><div class="xkr x33b"><i>👁️</i><span>${S.seen}</span><em>✓</em></div>`, { top: '150px' });
    k.show(ap, K.turn - 0.05, { sfx: 'whoosh' });
    const fl = ap.querySelector('.x33ph em');
    tl.fromTo(fl, { opacity: 0 }, { opacity: 1, duration: 0.05, yoyo: true, repeat: 1, immediateRender: false }, K.photo); sfx('shutter', K.photo, -10);
    k.pops([ap.querySelector('.x33a'), ap.querySelector('.x33b')], [K.out, K.sees], 'send');
    k.hide([ap], K.appt - 0.35);
    const am = k.card('x33appt', `<div class="xkr"><i>📅</i><span>${S.appt}</span><em>✓</em></div>`, { top: '170px' }); k.show(am, K.appt - 0.1, { sfx: 'chime' });
    const tc = k.card('x33rad', `<i>♨️</i><b class="xkbig">15°</b><span class="xksm">${S.warm}</span>`, { top: '420px' });
    const tn = tc.querySelector('b'); k.show(tc, K.warm - 0.45);
    k.count(tn, 15, 21, K.warm - 0.2, 0.8, (v) => v + '°'); tl.fromTo(tn, { color: '#3b8cff' }, { color: '#ff6b4a', duration: 0.6, immediateRender: false }, K.warm - 0.2);
    const pills = S.end.map((s, i) => k.card('xkchip x33p', `${s} ✓`, { top: `${830 + i * 110}px` }));
    k.pops(pills, [e1.start, e2.start, e3.start], 'pop', -12);
    k.end(TAG());
    return { T: END + 2.1, K };
  }

  // ================= X34: meter reading due → reminder → photo of the meter → value in → same number for both =================
  function X34() {
    const de = lang === 'de';
    const S = de ? { cal: '📅 31. Oktober', due: 'Zählerstand fällig', rem: 'Erinnerung · Zählerstand', snap: 'Foto erkannt', unit: 'kWh', val: 'eingetragen', who: ['Mieter', 'Vermieter'], no: 'Keine Schätzung ✓' }
      : { cal: '📅 October 31', due: 'Meter reading due', rem: 'Reminder · Meter reading', snap: 'Photo read', unit: 'kWh', val: 'saved', who: ['Tenant', 'Landlord'], no: 'No estimates ✓' };
    const k = XK('#1d2b3a', '#2f7ff0', 'linear-gradient(180deg,#eef3f8 0%,#dfe8f2 60%,#d0dcea 100%)');
    const T0 = k.turn(), K = { turn: T0.t };
    K.due = W(['Zählerstand', 'reading']).start; K.rem = W(['Erinnerung', 'reminder'], T0.i).start; K.snap = W(['fotografierst', 'snap'], T0.i).start;
    K.val = W(['Wert', 'number'], T0.i).start; K.same = W(['dieselbe', 'same'], T0.i).start; K.no = W(['Keine', 'no'], T0.i).start;
    const fmt = (v) => (de ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    const ch = k.card('xkchip', S.cal, { top: '140px' }); k.show(ch, 0.05);
    const mt = k.card('x34m', `<div class="x34d">? ? ? ?</div><span class="xksm">${S.due}</span>`, { top: '320px' }); k.show(mt, K.due - 0.3);
    k.shake(mt, K.due + 0.4);
    k.hide([ch, mt], K.turn - 0.3);
    const nt = k.card('x34n', `<span class="xkai"><img src="assets/logo.png"></span><div><b>${S.rem}</b><small>${S.cal.slice(3)}</small></div><em>⏰</em>`, { top: '150px' });
    k.show(nt, K.rem - 0.15, { sfx: 'chime' });
    const cam = k.card('x34cam', `<i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i><div class="x34d"><b>0</b> <small>${S.unit}</small></div><em></em>`, { top: '420px' });
    const dn = cam.querySelector('b'), fl = cam.querySelector('em');
    k.show(cam, K.snap - 0.35, { sfx: false });
    tl.fromTo(fl, { opacity: 0 }, { opacity: 1, duration: 0.05, yoyo: true, repeat: 1, immediateRender: false }, K.snap + 0.25); sfx('shutter', K.snap + 0.25, -10);
    k.count(dn, 0, 4512, K.snap + 0.3, 0.7, fmt);
    const ok = k.card('xkchip x34ok', `✓ ${fmt(4512)} ${S.unit} ${S.val}`, { top: '870px' }); k.show(ok, K.val - 0.1, { sfx: 'chime' });
    k.hide([nt, cam, ok], K.same - 0.6);
    const two = k.card('x34two', S.who.map((w, i) => `<div><i>${i ? '🏠' : '🙂'}</i><small>${w}</small><b>${fmt(4512)}</b></div>`).join('<u>=</u>'), { top: '260px' });
    k.show(two, K.same - 0.4, { sfx: 'pop' });
    k.stamp(S.no, 760, K.no);
    k.end(TAG());
    return { T: END + 2.1, K };
  }

  // ================= X35: water off Thursday → 8 units must know → one message to all → read receipts 8/8 =================
  function X35() {
    const de = lang === 'de';
    const S = de ? { day: '🚰 Donnerstag · 9–12 Uhr', off: 'Wasser abgestellt', msg: 'Do. 9–12 Uhr kein Wasser. Bitte vorher Wasser bereitstellen.', to: 'An alle · 8 Wohnungen', read: 'gelesen', u: 'Whg', no: 'Kein Zettel ✓' }
      : { day: '🚰 Thursday · 9–12', off: 'Water shut off', msg: 'Thu 9–12: no water. Please fill up beforehand.', to: 'To everyone · 8 units', read: 'read', u: 'Apt', no: 'No flyers ✓' };
    const k = XK('#13334a', '#1fa3c9', 'linear-gradient(180deg,#e8f5f9 0%,#d6ecf3 60%,#c4e2ec 100%)');
    const T0 = k.turn(), K = { turn: T0.t };
    K.water = W(['Wasser', 'water']).start; K.eight = W(['acht', 'eight']).start; K.msg = W(['Nachricht', 'message'], T0.i).start;
    const rd = W(['gelesen', 'read'], T0.i); K.read = rd.start; K.e8 = W(['Acht', 'eight'], rd.i).start; K.no = W(['Kein', 'no'], rd.i).start;
    const dc = k.card('x35day', `<b>${S.day}</b><span class="xksm">${S.off}</span>`, { top: '150px' }); k.show(dc, K.water - 0.3);
    const grid = (cls) => `<div class="x35g ${cls}">` + Array.from({ length: 8 }, (_, i) => `<div class="x35u"><i>🚪</i><small>${S.u} ${i + 1}</small><em>?</em></div>`).join('') + '</div>';
    const g1 = k.card('x35gc', grid(''), { top: '470px' }); k.show(g1, K.eight - 0.3);
    const q1 = [...g1.querySelectorAll('em')]; k.pops(q1, q1.map((_, i) => K.eight + 0.1 + i * 0.06), null);
    k.hide([dc, g1], K.turn - 0.3);
    const ap = k.card('x35app', k.hd(S.to) + `<div class="x35b">${S.msg}<em>➤</em></div>`, { top: '150px' }); k.show(ap, K.turn - 0.05, { sfx: 'whoosh' });
    const bb = ap.querySelector('.x35b'); tl.set(bb, { autoAlpha: 0 }, 0);
    tl.fromTo(bb, { autoAlpha: 0, x: 80 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, K.msg - 0.1); sfx('send', K.msg, -11);
    const g2 = k.card('x35gc', grid('ok') + `<div class="x35c"><b>0</b>/8 ${S.read}</div>`, { top: '600px' }); k.show(g2, K.msg + 0.3, { sfx: false });
    const ems = [...g2.querySelectorAll('em')]; ems.forEach((e) => { e.textContent = '✓'; });
    const span = Math.max(0.6, K.e8 - K.read);
    k.pops(ems, ems.map((_, i) => K.read + (i * span) / 8), 'pop', -16);
    k.count(g2.querySelector('.x35c b'), 0, 8, K.read, span + 0.1);
    k.stamp(S.no, 1060, K.no);
    k.end(TAG());
    return { T: END + 2.1, K };
  }

  // ================= X36: move-in, every scratch counts → room-by-room photos → both sign on phone → protocol in archive =================
  function X36() {
    const de = lang === 'de';
    const S = de ? { chip: '🔑 Einzug', sc: 'Kratzer?', rooms: ['Küche', 'Bad', 'Wohnzimmer', 'Schlafzimmer'], title: 'Übergabeprotokoll', who: ['Mieter', 'Vermieter'], arch: '🗄️ Protokoll im Archiv ✓' }
      : { chip: '🔑 Move-in', sc: 'Scratch?', rooms: ['Kitchen', 'Bathroom', 'Living room', 'Bedroom'], title: 'Handover report', who: ['Tenant', 'Landlord'], arch: '🗄️ Report in archive ✓' };
    const k = XK('#2b2418', '#c07a2c', 'linear-gradient(180deg,#f6efe4 0%,#efe3d1 60%,#e6d5bd 100%)');
    const T0 = k.turn(), K = { turn: T0.t };
    K.sc = W(['Kratzer', 'scratch']).start; K.room = W(['Raum', 'room'], T0.i).start; K.ph = W(['Fotos', 'photos'], T0.i).start;
    K.sign = W(['unterschreiben', 'sign'], T0.i).start; const ar = W(['Archiv', 'archive'], T0.i); K.arch = ar.start; K.for = W(['Für', 'for'], ar.i).start;
    const ch = k.card('xkchip', S.chip, { top: '140px' }); k.show(ch, 0.05);
    const fl = k.card('x36fl', `<svg viewBox="0 0 800 420"><path class="x36s" d="M180 260 L520 190"/></svg><b>🔍</b><em>${S.sc}</em>`, { top: '300px' }); k.show(fl, 0.3);
    const sp = fl.querySelector('.x36s'); sp.style.strokeDasharray = 400;
    perFrame((t) => { sp.style.strokeDashoffset = 400 * (1 - clamp((t - K.sc + 0.2) / 0.5, 0, 1)); });
    sfx('sting', K.sc, -14);
    k.hide([ch, fl], K.turn - 0.3);
    const ap = k.card('x36app', k.hd(S.title) + S.rooms.map((r) => `<div class="xkr"><i>📷</i><span>${r}</span><em>✓</em></div>`).join('') + '<div class="x36th">' + '<i></i>'.repeat(4) + '</div>', { top: '140px' });
    k.show(ap, K.turn - 0.05, { sfx: 'whoosh' });
    const rws = [...ap.querySelectorAll('.xkr em')], th = [...ap.querySelectorAll('.x36th i')];
    k.pops(rws, rws.map((_, i) => K.room + i * ((K.ph - K.room + 0.4) / 4)), 'pop', -15);
    k.pops(th, th.map((_, i) => K.ph + i * 0.12), 'shutter', -16);
    const sg = k.card('x36sg', S.who.map((w) => `<div><svg viewBox="0 0 300 110"><path d="M10 80 C40 20 60 100 90 50 S140 30 160 70 S220 90 290 30"/></svg><small>${w}</small></div>`).join(''), { top: '930px' });
    k.show(sg, K.sign - 0.2, { sfx: false });
    const sps = [...sg.querySelectorAll('path')]; sps.forEach((p) => { p.style.strokeDasharray = 500; });
    perFrame((t) => { sps.forEach((p, i) => { p.style.strokeDashoffset = 500 * (1 - E.io(clamp((t - K.sign - i * 0.5) / 0.6, 0, 1))); }); });
    sfx('unfold', K.sign, -14);
    k.hide([ap, sg], K.arch - 0.45);
    const ac = k.card('xkchip x36ar', S.arch, { top: '380px' }); k.show(ac, K.arch - 0.15, { sfx: 'chime' });
    const who = S.who.map((w, i) => k.card('xkchip x36w', `${i ? '🏠' : '🙂'} ${w} ✓`, { top: `${560 + i * 120}px` }));
    k.pops(who, [K.for, K.for + 0.35], 'pop', -12);
    k.end(TAG());
    return { T: END + 2.1, K };
  }

  // ================= X37: 3rd of the month, rent in? → landlord sees all units → 7 paid, 1 pending → friendly reminder =================
  function X37() {
    const de = lang === 'de';
    const S = de ? { day: '3.', mon: 'Oktober', q: 'Miete da?', title: 'Mieteingang · Oktober', u: 'Whg', paid: 'bezahlt', open: 'offen', rem: '👋 Kleine Erinnerung: Miete Oktober ist noch offen.', no: 'Kein Anruf nötig ✓' }
      : { day: '3rd', mon: 'October', q: 'Rent in?', title: 'Rent status · October', u: 'Apt', paid: 'paid', open: 'pending', rem: '👋 Friendly reminder: October rent is still open.', no: 'No awkward calls ✓' };
    const k = XK('#16323a', '#1fbf72', 'linear-gradient(180deg,#eaf6f1 0%,#d9eee4 60%,#c8e5d7 100%)');
    const T0 = k.turn(), K = { turn: T0.t };
    K.rent = W(['Miete', 'rent']).start; K.gl = W(['Blick', 'glance'], T0.i).start; K.seven = W(['Sieben', 'seven'], T0.i).start;
    K.one = W(['offen', 'pending'], T0.i).start; K.rem = W(['Erinnerung', 'reminder'], T0.i).start; K.no = W(['Keine', 'no'], T0.i).start;
    const cal = k.card('x37cal', `<small>${S.mon}</small><b>${S.day}</b>`, { top: '200px' }); k.show(cal, 0.05);
    const q = k.card('xkchip x37q', `💶 ${S.q} 🤔`, { top: '700px' }); k.show(q, K.rent - 0.2);
    k.shake(q, K.rent + 0.4);
    k.hide([cal, q], K.turn - 0.3);
    const ap = k.card('x37app', k.hd(S.title) + '<div class="x37g">' + Array.from({ length: 8 }, (_, i) => `<div class="x37u${i === 3 ? ' x37o' : ''}"><small>${S.u} ${i + 1}</small><b>…</b></div>`).join('') + '</div>', { top: '150px' });
    k.show(ap, K.turn - 0.05, { sfx: 'whoosh' });
    const us = [...ap.querySelectorAll('.x37u')];
    tl.set(us, { autoAlpha: 0 }, 0);
    us.forEach((u, i) => tl.fromTo(u, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.25, immediateRender: false }, K.gl - 0.3 + i * 0.05));
    const paid = us.filter((_, i) => i !== 3);
    paid.forEach((u, i) => {
      const t = K.seven + i * 0.09;
      tl.to(u, { backgroundColor: '#1fbf72', color: '#fff', duration: 0.2 }, t);
      u.querySelector('b').dataset.t = t;
      sfx('pop', t, -17);
    });
    perFrame((t) => { us.forEach((u, i) => { const b = u.querySelector('b'); if (i === 3) b.textContent = t > K.one - 0.1 ? S.open : '…'; else b.textContent = t > +b.dataset.t ? `✓ ${S.paid}` : '…'; }); });
    tl.to(us[3], { backgroundColor: '#ff9f43', color: '#fff', duration: 0.2 }, K.one - 0.1); sfx('buzz', K.one, -16);
    const rb = k.card('x37rem', `<span>${S.rem}</span><em>➤</em>`, { top: '760px' }); k.show(rb, K.rem - 0.1, { sfx: 'send' });
    k.stamp(S.no, 1020, K.no);
    k.end(TAG());
    return { T: END + 2.1, K };
  }

  // ================= X38: chimney inspector, nobody home → appointment to all tenants → confirm with one tap → all units checked =================
  function X38() {
    const de = lang === 'de';
    const S = de ? { who: '🧹 Schornsteinfeger', ring: 'Niemand da …', appt: 'Schornsteinfeger · Di 10:00', u: 'Whg', ok: 'bestätigt', all: '6/6 geprüft ✓', first: '1. Besuch' }
      : { who: '🧹 Chimney inspector', ring: 'Nobody home …', appt: 'Chimney inspection · Tue 10:00', u: 'Apt', ok: 'confirmed', all: '6/6 checked ✓', first: '1st visit' };
    const k = XK('#2d2233', '#8a5cf6', 'linear-gradient(180deg,#f1ecf8 0%,#e4dcf1 60%,#d5c9e9 100%)');
    const T0 = k.turn(), K = { turn: T0.t };
    K.nb = W(['keiner', "nobody's", 'nobodys']).start; K.appt = W(['Termin', 'appointment'], T0.i).start;
    const cf = W(['bestätigt', 'confirms'], T0.i); K.conf = cf.start; K.all = W(['Alle', 'every'], cf.i).start; K.first = W(['ersten', 'first'], cf.i).start;
    const ch = k.card('xkchip', S.who, { top: '140px' }); k.show(ch, 0.05);
    const dr = k.card('x38door', `<b>🚪</b><i>🔔</i><span>${S.ring}</span>`, { top: '300px' }); k.show(dr, 0.35);
    const bell = dr.querySelector('i'); tl.fromTo(bell, { rotation: -20 }, { rotation: 20, duration: 0.1, yoyo: true, repeat: 9, immediateRender: false }, 0.6); sfx('buzz', 0.7, -14);
    tl.set(dr.querySelector('span'), { autoAlpha: 0 }, 0); tl.to(dr.querySelector('span'), { autoAlpha: 1, duration: 0.3 }, K.nb - 0.1);
    k.hide([ch, dr], K.turn - 0.3);
    const nt = k.card('x34n', `<span class="xkai"><img src="assets/logo.png"></span><div><b>${S.appt}</b></div><em>📅</em>`, { top: '150px' }); k.show(nt, K.turn - 0.05, { sfx: 'chime' });
    const ls = k.card('x38ls', Array.from({ length: 6 }, (_, i) => `<div class="xkr"><i>🚪</i><span>${S.u} ${i + 1}</span><em>✓ ${S.ok}</em></div>`).join(''), { top: '360px' });
    k.show(ls, K.appt + 0.3, { sfx: false });
    const ems = [...ls.querySelectorAll('em')];
    k.pops(ems, ems.map((_, i) => K.conf + i * Math.min(0.15, (K.all - K.conf) / 6)), 'pop', -16);
    k.stamp(S.all, 1060, K.all + 0.1);
    const fc = k.card('xkchip x38f', S.first, { top: '200px' });
    k.hide([nt], K.first - 0.4); k.show(fc, K.first - 0.2, { sfx: false });
    k.end(TAG());
    return { T: END + 2.1, K };
  }

  // ================= X39: tax return, need every receipt → tap 2026 → all receipts in one list → 12 rents, utilities, one export =================
  function X39() {
    const de = lang === 'de';
    const S = de ? { tax: '📄 Steuererklärung 2026', q: 'Belege?', yrs: ['2024', '2025', '2026'], rent: 'Miete', util: 'Nebenkosten', inv: 'Rechnung', twelve: '12 × Miete', utilAll: 'Nebenkosten ✓', exp: '⬇️ PDF-Export', ok: 'Export fertig ✓', mon: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun'] }
      : { tax: '📄 Tax return 2026', q: 'Receipts?', yrs: ['2024', '2025', '2026'], rent: 'Rent', util: 'Utilities', inv: 'Invoice', twelve: '12 × rent', utilAll: 'Utilities ✓', exp: '⬇️ PDF export', ok: 'Export ready ✓', mon: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] };
    const k = XK('#23283a', '#5b6cf0', 'linear-gradient(180deg,#eef0fb 0%,#e0e3f6 60%,#d0d5ef 100%)');
    const T0 = k.turn(), K = { turn: T0.t };
    K.need = W(['Belege', 'receipt']).start; K.yr = W(['zweitausendsechsundzwanzig', 'twenty'], T0.i).start; K.list = W(['Liste', 'list'], T0.i).start;
    K.tw = W(['Zwölf', 'twelve'], T0.i).start; K.util = W(['Nebenkosten', 'utility'], T0.i).start; K.exp = W(['Export', 'export'], T0.i).start;
    const tx = k.card('x39tx', `<b>${S.tax}</b><div class="x39ps"><i></i><i></i><i></i></div><em>${S.q}</em>`, { top: '180px' }); k.show(tx, 0.05);
    const ps = [...tx.querySelectorAll('.x39ps i')];
    ps.forEach((p, i) => tl.fromTo(p, { y: -300, rotation: 0, autoAlpha: 0 }, { y: 0, rotation: (i - 1) * 14, autoAlpha: 1, duration: 0.4, ease: 'bounce.out', immediateRender: false }, K.need - 0.2 + i * 0.15));
    sfx('receipts', K.need, -12);
    k.hide([tx], K.turn - 0.3);
    const ap = k.card('x39app', k.hd() + `<div class="x39y">${S.yrs.map((y) => `<span>${y}</span>`).join('')}</div><div class="x39l">` +
      S.mon.map((m) => `<div class="xkr"><i>🧾</i><span>${S.rent} · ${m}</span><em>✓</em></div>`).join('') + `<div class="xkr"><i>📄</i><span>${S.util} · ${S.inv}</span><em>✓</em></div></div>`, { top: '140px' });
    k.show(ap, K.turn - 0.05, { sfx: 'whoosh' });
    const y3 = ap.querySelectorAll('.x39y span')[2];
    tl.to(y3, { backgroundColor: '#5b6cf0', color: '#fff', scale: 1.12, duration: 0.2 }, K.yr - 0.05); sfx('pop', K.yr, -12);
    const rows = [...ap.querySelectorAll('.x39l .xkr')];
    tl.set(rows, { autoAlpha: 0 }, 0);
    rows.forEach((r, i) => { tl.fromTo(r, { autoAlpha: 0, x: -50 }, { autoAlpha: 1, x: 0, duration: 0.2, immediateRender: false }, K.list - 0.2 + i * 0.08); });
    sfx('counter', K.list - 0.1, -15);
    const c1 = k.card('xkchip x39c', S.twelve, { top: '1000px', left: '30%' }); const c2 = k.card('xkchip x39c', S.utilAll, { top: '1000px', left: '70%' });
    k.pops([c1, c2], [K.tw, K.util], 'pop', -12);
    k.hide([ap, c1, c2], K.exp - 0.5);
    const ex = k.card('x39ex', `<b>${S.exp}</b><small>2026.pdf</small>`, { top: '380px' }); k.show(ex, K.exp - 0.3, { sfx: 'kaching' });
    k.stamp(S.ok, 760, K.exp + 0.4);
    k.end(TAG());
    return { T: END + 2.1, K };
  }

  // ================= X40: 47 scattered messages → one thread per issue: heating, window, basement → status + photos =================
  function X40() {
    const de = lang === 'de';
    const S = de ? { msgs: ['Heizung??', 'und das Fenster', 'Foto kommt', 'welcher Keller?', 'hab doch geschrieben', 'ok?'], th: [['♨️', 'Heizung', 'Erledigt', '#1fbf72'], ['🪟', 'Fenster', 'In Arbeit', '#ff9f43'], ['📦', 'Keller', 'Neu', '#2f7ff0']], title: 'Anliegen', one: 'Alles an einem Ort ✓', who: ['🙂 Mieter', '🏠 Vermieter'] }
      : { msgs: ['heating??', 'and the window', 'photo coming', 'which basement?', 'I already wrote', 'ok?'], th: [['♨️', 'Heating', 'Done', '#1fbf72'], ['🪟', 'Window', 'In progress', '#ff9f43'], ['📦', 'Basement', 'New', '#2f7ff0']], title: 'Issues', one: 'All in one place ✓', who: ['🙂 Tenant', '🏠 Landlord'] };
    const k = XK('#202634', '#2f7ff0', 'linear-gradient(180deg,#eef1f7 0%,#e1e6f0 60%,#d2d9e8 100%)');
    const T0 = k.turn(), K = { turn: T0.t };
    K.nb = W(['keiner', 'nobody']).start;
    const h = W(['Heizung', 'heating'], T0.i), f = W(['Fenster', 'window'], h.i), kk = W(['Keller', 'basement'], f.i);
    K.h = h.start; K.f = f.start; K.k = kk.start; K.st = W(['Status', 'status'], kk.i).start; K.ph = W(['Fotos', 'photos'], kk.i).start;
    K.one = W(['Ort', 'place'], kk.i).start; K.both = W(['beide', 'both'], kk.i).start;
    const badge = k.card('x40bd', '💬 <b>0</b>', { top: '140px' }); k.show(badge, 0.02); k.count(badge.querySelector('b'), 0, 47, 0.1, 1.4);
    const bs = S.msgs.map((m, i) => k.card('x40m', m, { top: `${300 + i * 125}px`, left: `${i % 2 ? 60 : 40}%` }));
    k.pops(bs, bs.map((_, i) => 0.2 + i * 0.22), 'send', -17);
    bs.forEach((b, i) => tl.to(b, { rotation: (i % 2 ? 1 : -1) * 4, duration: 0.3 }, K.nb));
    k.shake(badge, K.nb);
    k.hide([badge, ...bs], K.turn - 0.3);
    const ap = k.card('x40app', k.hd(S.title) + S.th.map(([i, n, s, c]) => `<div class="xkr x40t"><i>${i}</i><span>${n}<small class="x40ph"><u></u><u></u></small></span><em style="background:${c}">${s}</em></div>`).join(''), { top: '150px' });
    k.show(ap, K.turn - 0.05, { sfx: 'whoosh' });
    const nc = k.card('xkchip', `💬 47 → ${S.th.length} ${S.title}`, { top: '700px' }); k.show(nc, K.turn + 0.4); k.hide([nc], K.h - 0.3);
    const ts = [...ap.querySelectorAll('.x40t')];
    k.pops(ts, [K.h, K.f, K.k], 'pop', -13);
    const ems = [...ap.querySelectorAll('.x40t em')]; k.pops(ems, ems.map((_, i) => K.st + i * 0.1), 'chime', -18);
    const phs = [...ap.querySelectorAll('.x40ph')]; k.pops(phs, phs.map((_, i) => K.ph + i * 0.1), 'shutter', -18);
    k.stamp(S.one, 780, K.one);
    const who = S.who.map((w, i) => k.card('xkchip', w, { top: '960px', left: `${i ? 70 : 30}%` }));
    k.pops(who, [K.both, K.both + 0.25], 'pop', -12);
    k.end(TAG());
    return { T: END + 2.1, K };
  }

  // ================= X41: move-out scratch dispute → move-in photo next to today's → scratch was already there → deposit back =================
  function X41() {
    const de = lang === 'de';
    const S = de ? { chip: '📦 Auszug', a: 'Der Kratzer war vorher nicht da!', b: 'Doch, der war schon da.', p1: 'Einzug · 01.03.2023', p2: 'Heute', same: '= derselbe Kratzer', over: 'Diskussion beendet ✓', back: '💶 Kaution zurück' }
      : { chip: '📦 Move-out', a: "That scratch wasn't there before!", b: 'Yes it was, it was already there.', p1: 'Move-in · 03/01/2023', p2: 'Today', same: '= same scratch', over: 'Argument over ✓', back: '💵 Deposit back' };
    const k = XK('#2c2117', '#c07a2c', 'linear-gradient(180deg,#f7efe6 0%,#efe2d3 60%,#e5d2bd 100%)');
    const T0 = k.turn(), K = { turn: T0.t };
    K.sc = W(['Kratzer', 'scratch']).start; K.in = W(['Einzug', 'move-in'], T0.i).start; K.now = W(['heute', "today's", 'todays'], T0.i).start;
    const al = W(['schon', 'already'], T0.i); K.al = al.start; K.over = W(['beendet', 'over'], al.i).start; K.back = W(['zurück', 'back'], al.i).start;
    const ch = k.card('xkchip', S.chip, { top: '140px' }); k.show(ch, 0.05);
    const fl = k.card('x41fl', '<svg viewBox="0 0 800 300"><path d="M260 170 L520 120"/></svg>', { top: '300px' }); k.show(fl, K.sc - 0.35);
    const ba = k.card('x41bub', S.a, { top: '700px', left: '44%' }), bb = k.card('x41bub x41r', S.b, { top: '850px', left: '56%' });
    k.pops([ba, bb], [K.sc + 0.3, K.sc + 0.9], 'send', -14);
    k.hide([ch, fl, ba, bb], K.turn - 0.3);
    const cmp = k.card('x41cmp', k.hd() + `<div class="x41two"><div><div class="x41p"><svg viewBox="0 0 300 220"><path d="M90 130 L200 100"/></svg><i></i></div><small>${S.p1}</small></div><div><div class="x41p"><svg viewBox="0 0 300 220"><path d="M90 130 L200 100"/></svg><i></i></div><small>${S.p2}</small></div></div><div class="x41eq">${S.same}</div>`, { top: '150px' });
    k.show(cmp, K.turn - 0.05, { sfx: 'whoosh' });
    const pans = [...cmp.querySelectorAll('.x41two > div')]; k.pops(pans, [K.in, K.now], 'shutter', -14);
    const rings = [...cmp.querySelectorAll('.x41p i')], eq = cmp.querySelector('.x41eq');
    k.pops([...rings, eq], [K.al, K.al + 0.1, K.al + 0.3], 'chime', -14);
    k.stamp(S.over, 830, K.over);
    const bk = k.card('xkchip x41bk', S.back, { top: '1010px' }); k.show(bk, K.back - 0.15, { sfx: 'kaching' });
    k.end(TAG());
    return { T: END + 2.1, K };
  }

  // ================= X42: winter is coming → checklist with reminders (bleed radiators, windows, outside tap) → 3/3, landlord sees =================
  function X42() {
    const de = lang === 'de';
    const S = de ? { chip: '❄️ November', q: 'Wohnung winterfest?', title: 'Winter-Checkliste', it: [['♨️', 'Heizkörper entlüften'], ['🪟', 'Fenster prüfen'], ['🚰', 'Außenhahn zu']], three: '3/3 erledigt', sees: '🏠 Vermieter hat gesehen 👁️' }
      : { chip: '❄️ November', q: 'Winter-ready?', title: 'Winter checklist', it: [['♨️', 'Bleed the radiators'], ['🪟', 'Check the windows'], ['🚰', 'Shut the outside tap']], three: '3/3 done', sees: '🏠 Landlord has seen it 👁️' };
    const k = XK('#1c2f45', '#2f7ff0', 'linear-gradient(180deg,#dce9f7 0%,#c9dcf1 60%,#b6cfea 100%)');
    const T0 = k.turn(), K = { turn: T0.t };
    K.ready = W(['bereit', 'ready']).start; const ls = W(['Checkliste', 'checklist'], T0.i); K.list = ls.start;
    const a = W(['Heizkörper', 'bleed'], ls.i), b = W(['Fenster', 'check'], a.i), c = W(['Außenhahn', 'shut'], b.i);
    K.a = a.start; K.b = b.start; K.c = c.start; K.three = W(['Drei', 'three'], c.i).start; K.sees = W(['sieht', 'sees'], c.i).start;
    const sn = el('div', 'x42sn', Array.from({ length: 40 }, (_, i) => `<i style="left:${(i * 53) % 100}%;top:${(i * 37) % 100}%"></i>`).join(''));
    perFrame((t) => { sn.style.transform = `translateY(${(t * 40) % 60}px)`; });
    const ch = k.card('xkchip', S.chip, { top: '140px' }); k.show(ch, 0.05);
    const hs = k.card('x42h', `<b>🏠</b><span>${S.q}</span>`, { top: '320px' }); k.show(hs, K.ready - 0.3); k.shake(hs, K.ready + 0.3);
    k.hide([ch, hs], K.turn - 0.3);
    const ap = k.card('x42app', k.hd(S.title) + S.it.map(([i, n]) => `<div class="xkr"><i>${i}</i><span>${n}</span><b class="x42b"><u>✓</u></b></div>`).join(''), { top: '150px' });
    k.show(ap, K.list - 0.2, { sfx: 'whoosh' });
    const ticks = [...ap.querySelectorAll('.x42b u')], boxes = [...ap.querySelectorAll('.x42b')];
    k.pops(ticks, [K.a + 0.3, K.b + 0.3, K.c + 0.3], 'chime', -15);
    boxes.forEach((bx, i) => tl.to(bx, { backgroundColor: '#1fbf72', borderColor: '#1fbf72', duration: 0.15 }, [K.a, K.b, K.c][i] + 0.25));
    k.stamp(S.three, 760, K.three);
    const sc = k.card('xkchip', S.sees, { top: '980px' }); k.show(sc, K.sees - 0.15, { sfx: 'pop' });
    k.end(TAG());
    return { T: END + 2.1, K };
  }

  // ================= X43: Monday, 5 open reports → sorted by urgency (heating, window, light) → tenants see status → week planned =================
  function X43() {
    const de = lang === 'de';
    const S = de ? { chip: '☕ Mo · 08:00', tk: [['♨️', 'Heizung'], ['💡', 'Licht'], ['🪟', 'Fenster'], ['🚪', 'Tür'], ['🚿', 'Dusche']], title: 'Meldungen · nach Dringlichkeit', pr: ['Dringend', 'Hoch', 'Mittel', 'Normal', 'Normal'], sees: '👁️ Mieter sehen den Stand', days: ['Mo', 'Di', 'Mi', 'Do', 'Fr'], ok: 'Woche geplant ✓' }
      : { chip: '☕ Mon · 8:00 am', tk: [['♨️', 'Heating'], ['💡', 'Light'], ['🪟', 'Window'], ['🚪', 'Door'], ['🚿', 'Shower']], title: 'Reports · by urgency', pr: ['Urgent', 'High', 'Medium', 'Normal', 'Normal'], sees: '👁️ Tenants see the status', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], ok: 'Week planned ✓' };
    const k = XK('#2a2230', '#ff6b4a', 'linear-gradient(180deg,#f7eeee 0%,#efdfe0 60%,#e6cfd1 100%)');
    const T0 = k.turn(), K = { turn: T0.t };
    K.five = W(['fünf', 'five']).start;
    const h = W(['Heizung', 'heating'], T0.i), f = W(['Fenster', 'window'], h.i), l = W(['Licht', 'light'], f.i);
    K.sort = W(['sortiert', 'sorted'], T0.i).start; K.h = h.start; K.f = f.start; K.l = l.start; K.sees = W(['sieht', 'sees'], l.i).start; K.wk = W(['Woche', 'week'], l.i).start;
    const ch = k.card('xkchip', S.chip, { top: '140px' }); k.show(ch, 0.05);
    const sc = S.tk.map(([i, n], j) => k.card('x43t', `${i} ${n}`, { top: `${330 + (j * 137) % 560}px`, left: `${30 + (j * 23) % 45}%`, transform: `rotate(${(j % 2 ? 1 : -1) * (4 + j)}deg)` }));
    k.pops(sc, sc.map((_, j) => K.five - 0.2 + j * 0.12), 'pop', -15);
    k.hide([ch, ...sc], K.turn - 0.2);
    const order = [0, 2, 1, 3, 4], col = ['#ff4e3d', '#ff9f43', '#f5c542', '#b9c1d3', '#b9c1d3'];
    const ap = k.card('x43app', k.hd(S.title) + order.map((o, j) => `<div class="xkr"><b class="x43bar" style="background:${col[j]}"></b><i>${S.tk[o][0]}</i><span>${S.tk[o][1]}</span><em style="background:${col[j]}">${S.pr[j]}</em></div>`).join(''), { top: '150px' });
    k.show(ap, K.sort - 0.25, { sfx: 'whoosh' });
    const rws = [...ap.querySelectorAll('.xkr')];
    k.pops(rws, [K.h, K.f, K.l, K.l + 0.3, K.l + 0.45], 'pop', -14);
    const se = k.card('xkchip', S.sees, { top: '880px' }); k.show(se, K.sees - 0.15);
    const wk = k.card('x43wk', S.days.map((d) => `<div><small>${d}</small><i></i></div>`).join(''), { top: '1010px' });
    k.show(wk, K.wk - 0.25, { sfx: false });
    const dots = [...wk.querySelectorAll('i')]; k.pops(dots, dots.map((_, i) => K.wk + i * 0.1), 'pop', -17);
    k.end(TAG());
    return { T: END + 2.1, K };
  }

  // ================= X44: new tenant, a thousand questions → day one in the app: house rules, trash schedule, contacts → welcome home =================
  function X44() {
    const de = lang === 'de';
    const S = de ? { qs: ['🗑️ Wann kommt der Müll?', '🔧 Wer ist der Hausmeister?', '🔑 Wo ist der Keller?'], title: 'Dein Haus', tiles: [['📜', 'Hausordnung', 'Ruhezeiten · Treppenhaus'], ['🗓️', 'Müllplan', 'Di Restmüll · Fr Papier'], ['📞', 'Kontakte', 'Hausmeister · Vermieter']], wel: 'Willkommen zu Hause 🏡' }
      : { qs: ['🗑️ When is trash day?', "🔧 Who's the caretaker?", "🔑 Where's the basement?"], title: 'Your building', tiles: [['📜', 'House rules', 'Quiet hours · Hallway'], ['🗓️', 'Trash schedule', 'Tue trash · Fri paper'], ['📞', 'Contacts', 'Caretaker · Landlord']], wel: 'Welcome home 🏡' };
    const k = XK('#203a30', '#1fbf72', 'linear-gradient(180deg,#eef7ef 0%,#dcefdf 60%,#c9e6ce 100%)');
    const T0 = k.turn(), K = { turn: T0.t };
    K.q1 = W(['Müll', 'trash']).start; K.q2 = W(['Hausmeister', 'caretaker']).start; K.day = W(['ersten', 'one'], T0.i).start;
    const r = W(['Hausordnung', 'rules'], T0.i), t = W(['Müllplan', 'schedule'], r.i), c = W(['Kontakte', 'contacts'], t.i);
    K.r = r.start; K.t = t.start; K.c = c.start; K.wel = W(['Willkommen', 'welcome'], c.i).start;
    const bx = k.card('x44box', '📦', { top: '160px' }); k.show(bx, 0.05);
    const qs = S.qs.map((q, i) => k.card('x41bub x44q', q, { top: `${520 + i * 150}px`, left: `${[42, 58, 46][i]}%` }));
    k.pops(qs, [K.q1 - 0.2, K.q2 - 0.2, K.q2 + 0.6], 'pop', -13);
    qs.forEach((q, i) => tl.fromTo(q, { y: 0 }, { y: -14, duration: 0.6, yoyo: true, repeat: 3, ease: 'sine.inOut', immediateRender: false }, K.q1 + i * 0.2));
    k.hide([bx, ...qs], K.turn - 0.3);
    const ap = k.card('x44app', k.hd(S.title) + S.tiles.map(([i, n, s]) => `<div class="xkr x44t"><i>${i}</i><span>${n}<small>${s}</small></span><em>✓</em></div>`).join(''), { top: '150px' });
    k.show(ap, K.turn - 0.05, { sfx: 'whoosh' });
    const ts = [...ap.querySelectorAll('.x44t')]; k.pops(ts, [K.r, K.t, K.c], 'pop', -13);
    const wl = k.card('x44wel', S.wel, { top: '820px' }); k.show(wl, K.wel - 0.15, { sfx: 'chime', s: 0.6 });
    k.end(TAG());
    return { T: END + 2.1, K };
  }

  // ================= AIK: "Tenance AI" hero kit (X45+): living gradient bg, particle field, AI core orb, neural links, 3D glass cards, kinetic end title =================
  function AIK(turnT) {
    const de = lang === 'de';
    const cam = el('div', 'aicam');
    const bg = el('div', 'aibg', '<i class="b1"></i><i class="b2"></i><i class="b3"></i>', cam);
    const [b1, b2, b3] = [...bg.querySelectorAll('i')];
    perFrame((t) => {
      b1.style.transform = `translate(${Math.sin(t * 0.45) * 140}px,${Math.cos(t * 0.35) * 110}px)`;
      b2.style.transform = `translate(${Math.cos(t * 0.4) * 160}px,${Math.sin(t * 0.5) * 120}px)`;
      b3.style.transform = `translate(${Math.sin(t * 0.3 + 2) * 120}px,${Math.cos(t * 0.45 + 1) * 140}px)`;
    });
    // particle field: deterministic, warps forward at the AI moment
    const cv = el('canvas', 'aipt', null, cam); cv.width = 1080; cv.height = 1920;
    const cx = cv.getContext('2d');
    const P = Array.from({ length: 110 }, (_, i) => { const r = (k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }; return { x: r(1) * 1080, y: r(2) * 1920, v: 18 + r(3) * 50, s: 1 + r(4) * 3.2, a: 0.25 + r(5) * 0.6 }; });
    const warp = (t) => { const d = t - turnT; return d < 0 ? 0 : d < 0.8 ? d * d * 900 : 576 + (d - 0.8) * 80; };
    perFrame((t) => {
      cx.clearRect(0, 0, 1080, 1920);
      const w = warp(t), k = t >= turnT ? Math.max(0, 1 - (t - turnT) / 1.2) : 0;
      P.forEach((p) => {
        const y = (((p.y - p.v * t - w * (p.v / 40)) % 1920) + 1920) % 1920;
        cx.globalAlpha = p.a; cx.fillStyle = '#9fd8ff';
        cx.fillRect(p.x, y, p.s, p.s + k * 60 * (p.v / 60));
      });
    });
    const shake = (t, amp = 14) => tl.fromTo(cam, { x: 0, y: 0 }, { keyframes: [{ x: amp, y: -amp / 2 }, { x: -amp, y: amp / 2 }, { x: amp / 2, y: amp / 3 }, { x: 0, y: 0 }], duration: 0.32, immediateRender: false }, t);
    const card = (cls, html, css) => { const e = el('div', 'aic ' + cls, html, cam, css); tl.set(e, { xPercent: -50, autoAlpha: 0 }, 0); return e; };
    const flip = (e, t, o = {}) => {
      tl.fromTo(e, { autoAlpha: 0, rotationX: -75, y: 140, transformPerspective: 1400, transformOrigin: '50% 100%' }, { autoAlpha: 1, rotationX: 0, y: 0, duration: 0.6, ease: 'expo.out', immediateRender: false }, t);
      if (o.sfx !== false) sfx(o.sfx || 'whoosh', t, o.db ?? -14);
    };
    const pop = (e, t, sf = 'pop', db = -13) => { tl.set(e, { autoAlpha: 0 }, 0); tl.fromTo(e, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.6)', immediateRender: false }, t); if (sf) sfx(sf, t, db); };
    const out = (es, t) => tl.to(es, { autoAlpha: 0, scale: 0.85, y: -60, filter: 'blur(10px)', duration: 0.35, ease: 'power2.in', stagger: 0.04 }, t);
    // AI core orb with rotating rings, breathing glow and shockwave
    const orb = (x, y, t0, size = 360) => {
      const o = el('div', 'aiorb', '<em class="sw"></em><i class="r1"></i><i class="r2"></i><i class="r3"></i><b></b><span>AI</span>', cam, { left: x + 'px', top: y + 'px', width: size + 'px', height: size + 'px' });
      const [r1, r2, r3] = [...o.querySelectorAll('i')], core = o.querySelector('b'), sw = o.querySelector('.sw');
      tl.set(o, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0 }, 0);
      tl.to(o, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'elastic.out(1,0.55)' }, t0);
      tl.fromTo(sw, { scale: 0.3, opacity: 0.9 }, { scale: 3.2, opacity: 0, duration: 1.0, ease: 'power2.out', immediateRender: false }, t0 + 0.05);
      sfx('vortex', t0 - 0.25, -10); sfx('impact', t0 + 0.05, -9);
      perFrame((t) => {
        const d = t - t0;
        r1.style.transform = `rotate(${d * 90}deg)`; r2.style.transform = `rotate(${-d * 140}deg) scale(0.82)`; r3.style.transform = `rotate(${d * 60}deg) scale(1.16)`;
        core.style.transform = `scale(${1 + Math.sin(d * 4) * 0.05})`;
      });
      return o;
    };
    // neural link: curved svg path drawn from a to b, with a travelling glow dot
    const svg = el('div', 'ailinks', '<svg viewBox="0 0 1080 1920"></svg>', cam).querySelector('svg');
    const link = (a, b, t0, dur = 0.5) => {
      const ns = 'http://www.w3.org/2000/svg';
      const p = document.createElementNS(ns, 'path'), dot = document.createElementNS(ns, 'circle');
      const mx = (a[0] + b[0]) / 2 + (b[0] > a[0] ? -120 : 120), my = (a[1] + b[1]) / 2;
      p.setAttribute('d', `M${a[0]} ${a[1]} Q${mx} ${my} ${b[0]} ${b[1]}`); p.setAttribute('class', 'ail');
      dot.setAttribute('r', 11); dot.setAttribute('class', 'aid');
      svg.appendChild(p); svg.appendChild(dot);
      const L = p.getTotalLength(); p.style.strokeDasharray = L;
      perFrame((t) => {
        const k = clamp((t - t0) / dur, 0, 1); p.style.strokeDashoffset = L * (1 - E.io(k));
        const kk = ((t - t0) % 1.4) / 1.4; const pt = p.getPointAtLength(L * (t < t0 + dur ? E.io(k) : kk));
        dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); dot.style.opacity = t < t0 ? 0 : 1;
      });
      return p;
    };
    // end title: everything blurs away, kinetic "Tenance AI" + subtitle, captions hidden
    const title = (t0, tSub) => {
      const kids = [...cam.children].filter((c) => !c.classList.contains('aibg') && !c.classList.contains('aipt'));
      tl.to(kids, { autoAlpha: 0, scale: 0.9, filter: 'blur(14px)', duration: 0.4, ease: 'power2.in' }, t0 - 0.35);
      const word = 'Tenance AI';
      const tt = el('div', 'aititle', `<span class="ai"><img src="assets/logo.png"></span><h1>${[...word].map((c) => `<i>${c === ' ' ? '&nbsp;' : c}</i>`).join('')}</h1><h2>${de ? 'Dein KI-Hausverwalter' : 'Your AI property manager'}</h2><p>${de ? 'für Mieter & Vermieter' : 'for tenants & landlords'}</p>`);
      const ls = [...tt.querySelectorAll('h1 i')], lg = tt.querySelector('.ai'), h2 = tt.querySelector('h2'), pp = tt.querySelector('p'), h1 = tt.querySelector('h1');
      tl.set(tt, { autoAlpha: 0 }, 0); tl.set(tt, { autoAlpha: 1 }, t0 - 0.05);
      tl.fromTo(lg, { scale: 0, rotation: -120 }, { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2)', immediateRender: false }, t0 - 0.1);
      tl.fromTo(ls, { y: 160, rotationX: -90, autoAlpha: 0, transformPerspective: 800 }, { y: 0, rotationX: 0, autoAlpha: 1, duration: 0.55, ease: 'expo.out', stagger: 0.045, immediateRender: false }, t0);
      tl.fromTo([h2, pp], { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out', stagger: 0.15, immediateRender: false }, tSub - 0.1);
      perFrame((t) => { h1.style.backgroundPosition = `${((t - t0) * 60) % 400}% 50%`; });
      sfx('sting', t0 - 0.05, -10); sfx('impact', t0 + 0.1, -9);
      setCapHidden((t) => t > t0 - 0.2);
      tl.fromTo(cam, { scale: 1 }, { scale: 1.08, duration: 3.5, ease: 'sine.out', immediateRender: false }, t0);
    };
    return { cam, card, flip, pop, out, orb, link, title, shake };
  }

  // ================= X45: 2 a.m. leaking pipe → one message → Tenance AI takes over: damage identified, plumber booked, landlord informed — in 10 s =================
  function X45() {
    const de = lang === 'de';
    const S = de ? { clock: '🌙 02:00', msg: 'Im Bad tropft das Rohr 💧', you: 'Du', c1: ['Schaden erkannt', 'Wasserschaden · Bad · dringend'], c2: ['Handwerker gebucht', 'Heute 08:00 · Installateur'], c3: ['Vermieter informiert', 'gelesen ✓'], sec: 'Sek.' }
      : { clock: '🌙 2:00 am', msg: 'The bathroom pipe is leaking 💧', you: 'You', c1: ['Damage identified', 'Water leak · bathroom · urgent'], c2: ['Plumber booked', 'Today 8:00 am · plumber'], c3: ['Landlord informed', 'read ✓'], sec: 'sec' };
    const it = W(['Tenance', 'Tenance']), K = { turn: it.start };
    K.drip = W(['tropft', 'leaking']).start; K.msg = W(['Nachricht', 'message']).start;
    K.over = W(['übernimmt', 'over'], it.i).start; K.dmg = W(['Schaden', 'damage'], it.i).start; K.hw = W(['Handwerker', 'plumber'], it.i).start;
    K.vm = W(['Vermieter', 'landlord'], it.i).start; K.ten = W(['zehn', 'ten'], it.i).start;
    const t2 = W(['Tenance', 'Tenance'], it.i); K.title = t2.start; K.sub = W(['Dein', 'your'], t2.i).start;
    const k = AIK(K.turn);
    // night: pipe drips into a growing puddle
    const ck = k.card('aichip', S.clock, { top: '150px' }); k.pop(ck, 0.05, 'pop');
    const pipe = k.card('x45pipe', '<div class="x45p"><i class="j"></i></div>' + Array.from({ length: 5 }, () => '<b class="x45d"></b>').join('') + '<u class="x45pd"></u>', { top: '320px' });
    k.flip(pipe, 0.25, { sfx: false });
    const drops = [...pipe.querySelectorAll('.x45d')], pud = pipe.querySelector('.x45pd');
    perFrame((t) => {
      drops.forEach((d, i) => { const c = ((t * 1.3 + i * 0.37) % 1.85); const v = c < 1.4 ? c / 1.4 : 1; d.style.transform = `translateY(${v * v * 330}px) scale(${1 - (c > 1.4 ? (c - 1.4) * 2 : 0)})`; d.style.opacity = c > 1.6 ? 0 : 1; });
      pud.style.transform = `translateX(-50%) scaleX(${0.25 + 0.75 * clamp(t / 4, 0, 1)})`;
    });
    [0.5, 1.4, 2.2, 3.0].forEach((t) => sfx('drip', t, -12));
    // the message
    const ph = k.card('x45ph', `<div class="x45top"><span>${S.you}</span><em>●●●</em></div><div class="x45b">${S.msg}</div>`, { top: '820px' });
    k.flip(ph, K.msg - 0.9, { sfx: false });
    const typ = ph.querySelector('em'), bub = ph.querySelector('.x45b');
    tl.set(bub, { autoAlpha: 0 }, 0);
    tl.fromTo(typ, { opacity: 0.2 }, { opacity: 1, duration: 0.2, yoyo: true, repeat: 3, immediateRender: false }, K.msg - 0.6);
    tl.fromTo(bub, { autoAlpha: 0, scale: 0.5, x: 120 }, { autoAlpha: 1, scale: 1, x: 0, duration: 0.4, ease: 'back.out(2.2)', immediateRender: false }, K.msg);
    sfx('typing', K.msg - 0.6, -15); sfx('send', K.msg + 0.05, -10);
    k.out([ck, pipe, ph], K.turn - 0.35);
    // AI core + three tasks
    const o = k.orb(540, 470, K.turn - 0.05, 380); k.shake(K.turn + 0.05);
    const ys = [790, 1000, 1210], cs = [[S.c1, '🔍'], [S.c2, '📅'], [S.c3, '🏠']].map(([[a, b], ic], i) => k.card('x45c', `<i>${ic}</i><div><b>${a}</b><small>${b}</small></div><em>✓</em>`, { top: ys[i] + 'px' }));
    const tk = [K.dmg, K.hw, K.vm];
    ys.forEach((y, i) => k.link([540, 660], [110, y + 70], K.over - 0.1 + i * 0.12, 0.45));
    sfx('refresh', K.over, -14);
    cs.forEach((c, i) => {
      k.flip(c, tk[i] - 0.25, { sfx: 'whoosh', db: -16 });
      const ok = c.querySelector('em'); tl.set(ok, { autoAlpha: 0 }, 0);
      tl.fromTo(ok, { autoAlpha: 0, scale: 0.2, rotation: -90 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.35, ease: 'back.out(3)', immediateRender: false }, tk[i] + 0.35);
      sfx('chime', tk[i] + 0.35, -13);
    });
    // scan sweep on the damage card
    const scan = el('i', 'x45scan', null, cs[0]); tl.fromTo(scan, { xPercent: -100, opacity: 1 }, { xPercent: 600, opacity: 0.2, duration: 0.8, ease: 'power1.inOut', immediateRender: false }, K.dmg);
    // 10-second ring timer replaces the AI label
    const tm = k.card('x45tm', `<svg viewBox="0 0 200 200"><circle class="tr" cx="100" cy="100" r="86"/><circle class="ar" cx="100" cy="100" r="86"/></svg><b>0</b><small>${S.sec}</small>`, { top: '330px' });
    const ar = tm.querySelector('.ar'), tb = tm.querySelector('b'); const C = 2 * Math.PI * 86; ar.style.strokeDasharray = C;
    k.pop(tm, K.ten - 0.35, 'counter', -14);
    tl.to(o, { scale: 0.55, y: -40, duration: 0.4, ease: 'power3.inOut' }, K.ten - 0.4);
    perFrame((t) => { const p = clamp((t - K.ten + 0.3) / 0.9, 0, 1); ar.style.strokeDashoffset = C * (1 - p); tb.textContent = Math.round(10 * E.o5(p)); });
    k.title(K.title, K.sub);
    return { T: END + 2.2, K };
  }

  // ================= X46: Monday flood (23 messages, 4 repairs, 2 late rents) → AI absorbs it → 3 sorted lanes → approve all → Tenance AI =================
  function X46() {
    const de = lang === 'de';
    const S = de ? { clock: '☕ Mo · 08:00', st: [['💬', 'Nachrichten'], ['🔧', 'Reparaturen'], ['💶', 'offene Mieten']], notes: ['Heizung kalt?', 'Wann kommt der Techniker?', 'Schlüssel verloren', 'Miete Oktober', 'Fenster undicht', 'Licht im Keller', 'Paket abgegeben?', 'Rauchmelder piept', 'Termin Zähler?', 'Waschmaschine'], l: [['💬', 'Fragen beantwortet', 23], ['🔧', 'Reparaturen geplant', 4], ['💶', 'freundlich erinnert', 2]], ok: 'Alles freigeben', done: 'Freigegeben ✓' }
      : { clock: '☕ Mon · 8:00 am', st: [['💬', 'messages'], ['🔧', 'repairs'], ['💶', 'late rents']], notes: ['Heating cold?', 'When is the plumber coming?', 'Lost my key', 'October rent', 'Window leaking', 'Basement light', 'Package delivered?', 'Smoke alarm beeping', 'Meter reading?', 'Washing machine'], l: [['💬', 'Questions answered', 23], ['🔧', 'Repairs scheduled', 4], ['💶', 'Reminders sent', 2]], ok: 'Approve all', done: 'Approved ✓' };
    const it = W(['Tenance', 'Tenance']), K = { turn: it.start };
    K.n = W(['dreiundzwanzig', 'twenty-three']).start; K.r = W(['Reparaturen', 'repairs']).start; K.m = W(['Mieten', 'rents']).start;
    K.sort = W(['sortiert', 'sorted'], it.i).start; K.q = W(['Fragen', 'questions'], it.i).start; K.rp = W(['Reparaturen', 'repairs'], it.i).start;
    K.f = W(['freundlich', 'friendly'], it.i).start; K.ok = W(['frei', 'approve'], it.i).start;
    const t2 = W(['Tenance', 'Tenance'], it.i); K.title = t2.start; K.sub = W(['Dein', 'your'], t2.i).start;
    const k = AIK(K.turn);
    const ck = k.card('aichip', S.clock, { top: '150px' }); k.pop(ck, 0.05, 'pop');
    // stat counters
    const stats = S.st.map(([ic, n], i) => k.card('x46s', `<i>${ic}</i><b>0</b><small>${n}</small>`, { top: '300px', left: `${20 + i * 30}%` }));
    const vals = [23, 4, 2], ts = [K.n, K.r, K.m];
    stats.forEach((s, i) => { k.pop(s, ts[i] - 0.2, 'pop', -12); const b = s.querySelector('b'); perFrame((t) => { b.textContent = Math.round(vals[i] * E.o5(clamp((t - ts[i] + 0.1) / 0.6, 0, 1))); }); });
    // notification avalanche
    const notes = S.notes.map((n, i) => k.card('x46n', `<span class="ai"><img src="assets/logo.png"></span>${n}`, { top: `${560 + (i % 5) * 120}px`, left: `${i < 5 ? 34 : 66}%` }));
    notes.forEach((nn, i) => {
      const t = 0.9 + i * 0.32;
      tl.fromTo(nn, { autoAlpha: 0, y: -500, rotation: (i % 2 ? 1 : -1) * 18 }, { autoAlpha: 1, y: 0, rotation: (i % 2 ? 1 : -1) * (3 + (i % 3) * 2), duration: 0.5, ease: 'bounce.out', immediateRender: false }, t);
      sfx('buzz', t + 0.2, -21);
    });
    // AI swallows the chaos
    const o = k.orb(540, 560, K.turn + 0.1, 360); k.shake(K.turn + 0.15, 10);
    notes.forEach((nn, i) => tl.to(nn, { left: '50%', top: '470px', scale: 0, rotation: 360 + i * 30, autoAlpha: 0, duration: 0.7, ease: 'power3.in', immediateRender: false }, K.turn - 0.2 + i * 0.04));
    tl.to([ck, ...stats], { autoAlpha: 0, y: -60, duration: 0.3, ease: 'power2.in' }, K.turn - 0.3);
    tl.to(o, { top: '380px', scale: 0.7, duration: 0.5, ease: 'power3.inOut' }, K.sort - 0.2);
    // three sorted lanes
    const ys = [640, 820, 1000], tl3 = [K.q, K.rp, K.f];
    const lanes = S.l.map(([ic, n, v], i) => k.card('x46l', `<i>${ic}</i><div><b>${n}</b><u><s></s></u></div><em>0</em>`, { top: ys[i] + 'px' }));
    ys.forEach((y, i) => k.link([540, 500], [110, y + 70], K.sort + i * 0.1, 0.45));
    lanes.forEach((ln, i) => {
      k.flip(ln, tl3[i] - 0.25, { sfx: 'whoosh', db: -16 });
      const bar = ln.querySelector('s'), em = ln.querySelector('em');
      perFrame((t) => { const p = clamp((t - tl3[i]) / 0.8, 0, 1); bar.style.transform = `scaleX(${E.o5(p)})`; em.textContent = p >= 1 ? '✓' : Math.round(S.l[i][2] * E.o5(p)); });
      sfx('chime', tl3[i] + 0.8, -14);
    });
    // approve all: button press, ripple, confetti
    const btn = k.card('x46btn', `<b>${S.ok}</b><i class="rp"></i>`, { top: '1190px' });
    const lab = btn.querySelector('b'), rp = btn.querySelector('.rp');
    k.flip(btn, K.ok - 0.7, { sfx: false });
    tl.to(btn, { scale: 0.92, duration: 0.1, yoyo: true, repeat: 1 }, K.ok);
    tl.fromTo(rp, { scale: 0, opacity: 0.8 }, { scale: 4, opacity: 0, duration: 0.6, ease: 'power2.out', immediateRender: false }, K.ok);
    tl.call(() => {}, null, K.ok);
    perFrame((t) => { lab.textContent = t > K.ok + 0.1 ? S.done : S.ok; btn.classList.toggle('on', t > K.ok + 0.1); });
    sfx('kaching', K.ok + 0.05, -10);
    const cf = el('div', 'x46cf', Array.from({ length: 36 }, (_, i) => `<i style="background:hsl(${(i * 47) % 360},90%,62%)"></i>`).join(''), k.cam);
    const bits = [...cf.querySelectorAll('i')];
    tl.set(bits, { autoAlpha: 0 }, 0);
    bits.forEach((b, i) => { const a = (i / bits.length) * Math.PI * 2, r = 260 + (i % 5) * 70; tl.fromTo(b, { x: 0, y: 0, autoAlpha: 1, rotation: 0 }, { x: Math.cos(a) * r, y: Math.sin(a) * r + 160, rotation: 540, autoAlpha: 0, duration: 1.1, ease: 'power2.out', immediateRender: false }, K.ok + 0.08); });
    k.title(K.title, K.sub);
    return { T: END + 2.2, K };
  }

  // ================= TK: Tenance-brand kit (X47+): forest bg + moving dot grid, gold sparks, floating 3D phone with real app UI, in-app chat, kinetic gold headlines, waitlist CTA =================
  function TK() {
    const de = lang === 'de';
    const cam = el('div', 'tkcam');
    const bg = el('div', 'tkbg', '<i class="g1"></i><i class="g2"></i><b class="grid"></b><b class="beam bm1"></b><b class="beam bm2"></b><b class="floor"></b>', cam);
    const [g1, g2] = [...bg.querySelectorAll('i')], grid = bg.querySelector('.grid'), floor = bg.querySelector('.floor'), bm1 = bg.querySelector('.bm1'), bm2 = bg.querySelector('.bm2');
    // camera life: continuous drift + beat punches (CSS scale/rotate compose with GSAP transform)
    const punches = []; const punch = (t, a = 0.07) => punches.push([t, a]);
    perFrame((t) => {
      const p = punches.reduce((s, [t0, a]) => s + (t >= t0 ? a * Math.exp(-(t - t0) * 7) * Math.min(1, (t - t0) * 30) : 0), 0);
      cam.style.scale = String(1.02 + Math.sin(t * 0.7) * 0.02 + p);
      cam.style.rotate = `${Math.sin(t * 0.55) * 1.2 + p * 12 * Math.sin(t * 40) * 0.2}deg`;
      floor.style.backgroundPosition = `0px ${t * 160}px`;
      bm1.style.transform = `rotate(${-30 + Math.sin(t * 0.8) * 25}deg)`; bm2.style.transform = `rotate(${30 + Math.cos(t * 0.7) * 25}deg)`;
    });
    perFrame((t) => {
      g1.style.transform = `translate(${Math.sin(t * 0.5) * 160}px,${Math.cos(t * 0.4) * 120}px)`;
      g2.style.transform = `translate(${Math.cos(t * 0.45) * 140}px,${Math.sin(t * 0.35) * 160}px)`;
      grid.style.backgroundPosition = `${t * 14}px ${t * 26}px`;
    });
    // gold sparks rising
    const cv = el('canvas', 'tksp', null, cam); cv.width = 1080; cv.height = 1920;
    const cx = cv.getContext('2d');
    const P = Array.from({ length: 70 }, (_, i) => { const r = (k) => { const x = Math.sin(i * 91.7 + k * 47.3) * 43758.5453; return x - Math.floor(x); }; return { x: r(1) * 1080, y: r(2) * 1920, v: 25 + r(3) * 70, s: 1.5 + r(4) * 3, a: 0.15 + r(5) * 0.5, w: r(6) * 6 }; });
    let boost = []; const burst = (t) => boost.push(t);
    perFrame((t) => {
      cx.clearRect(0, 0, 1080, 1920);
      const b = boost.reduce((s, t0) => s + (t >= t0 ? Math.min(t - t0, 0.5) * 500 : 0), 0);
      P.forEach((p) => {
        const y = (((p.y - p.v * t - b * (p.v / 60)) % 1920) + 1920) % 1920, x = p.x + Math.sin(t * 1.3 + p.w) * 14;
        cx.globalAlpha = p.a; cx.fillStyle = '#e09b6b'; cx.beginPath(); cx.arc(x, y, p.s, 0, 6.283); cx.fill();
      });
    });
    const shake = (t, a = 12) => tl.fromTo(cam, { x: 0, y: 0 }, { keyframes: [{ x: a, y: -a / 2 }, { x: -a, y: a / 2 }, { x: a / 2, y: 0 }, { x: 0, y: 0 }], duration: 0.3, immediateRender: false }, t);
    const flash = (t) => { const f = el('div', 'tkflash', null, cam); tl.set(f, { opacity: 0 }, 0); tl.fromTo(f, { opacity: 0.35 }, { opacity: 0, duration: 0.35, ease: 'power2.out', immediateRender: false }, t); stripes(t - 0.42); ring(540, 820, t, 1.4); punch(t, 0.12); };
    // gold diagonal stripe wipe across the frame
    const stripes = (t) => {
      const w = el('div', 'tkwipe', Array.from({ length: 6 }, (_, i) => `<i style="top:${i * 360 - 300}px"></i>`).join(''));
      const bars = [...w.querySelectorAll('i')]; tl.set(bars, { xPercent: -180, autoAlpha: 0 }, 0);
      tl.set(bars, { autoAlpha: 1 }, t);
      tl.to(bars, { xPercent: 180, duration: 0.42, ease: 'power2.inOut', stagger: 0.02 }, t);
      tl.set(bars, { autoAlpha: 0 }, t + 0.42 + 0.02 * 6); sfx('whoosh', t, -12);
    };
    // expanding shockwave ring
    const ring = (x, y, t, s = 1) => { const r = el('i', 'tkring', null, cam, { left: x + 'px', top: y + 'px' }); tl.set(r, { autoAlpha: 0, xPercent: -50, yPercent: -50 }, 0); tl.fromTo(r, { autoAlpha: 1, scale: 0.1 }, { autoAlpha: 0, scale: 4 * s, duration: 0.7, ease: 'power2.out', immediateRender: false }, t); };
    // gold confetti burst
    const boom = (x, y, t, n = 18, big = 1) => {
      const b = el('div', 'tkboom', Array.from({ length: n }, (_, i) => `<i class="${i % 3 ? '' : 'c'}"></i>`).join(''), cam, { left: x + 'px', top: y + 'px' });
      [...b.children].forEach((e, i) => { const a = (i / n) * 6.283 + (i % 2) * 0.3, r = (120 + (i * 37) % 160) * big; tl.set(e, { autoAlpha: 0 }, 0); tl.fromTo(e, { autoAlpha: 1, x: 0, y: 0, rotation: 0, scale: 1 }, { autoAlpha: 0, x: Math.cos(a) * r, y: Math.sin(a) * r + 60 * big, rotation: 400 + i * 30, scale: 0.4, duration: 0.8 + (i % 4) * 0.08, ease: 'power3.out', immediateRender: false }, t); });
    };
    // motion-blur whip on the camera
    const whip = (t) => tl.fromTo(cam, { filter: 'blur(0px)', skewX: 0 }, { keyframes: [{ filter: 'blur(9px)', skewX: -6, duration: 0.12 }, { filter: 'blur(0px)', skewX: 0, duration: 0.25 }], immediateRender: false }, t);
    // kinetic headline: words masked, letters rise; *word* = gold
    const head = (txt, top, t0, o = {}) => {
      const h = el('div', 'tkhead' + (o.cls ? ' ' + o.cls : ''), txt.split(' ').map((w) => { const g = /^\*.*\*$/.test(w); w = w.replace(/\*/g, ''); return `<span class="w${g ? ' gold' : ''}">${[...w].map((c) => `<i>${c}</i>`).join('')}</span>`; }).join(' '), cam, { top: top + 'px' });
      const ls = [...h.querySelectorAll('i')];
      tl.set(h, { autoAlpha: 0 }, 0); tl.set(h, { autoAlpha: 1 }, t0);
      tl.fromTo(ls, { yPercent: 110, rotation: 8 }, { yPercent: 0, rotation: 0, duration: 0.45, ease: 'expo.out', stagger: o.st ?? 0.025, immediateRender: false }, t0);
      tl.fromTo(h, { scale: 1.9, filter: 'blur(14px)' }, { scale: 1, filter: 'blur(0px)', duration: 0.4, ease: 'expo.out', immediateRender: false }, t0);
      const es = [h]; perFrame(() => { if (h.dataset.fit) return; const rg = document.createRange(); rg.selectNodeContents(h); const hb = h.getBoundingClientRect().width, wd = hb > 0 ? rg.getBoundingClientRect().width * h.offsetWidth / hb : 0; if (!(wd > 0) || !isFinite(wd)) return; h.dataset.fit = 1; if (wd > 960) { const fs = Math.floor(parseFloat(getComputedStyle(h).fontSize) * 960 / wd) + 'px'; es.forEach((x) => { x.style.fontSize = fs; }); } });
      punch(t0 + 0.2, 0.05);
      if (o.sfx !== false) sfx(o.sfx || 'whoosh', t0, -15);
      if (o.out) tl.to(ls, { yPercent: -110, duration: 0.3, ease: 'power2.in', stagger: 0.01 }, o.out);
      return h;
    };
    // floating 3D phone with stacked screens
    let phTop = 400, zoneY = 1430; const PS = 1.1, PH = 978 * PS;
    const phone = (top, t0) => {
      phTop = top - 0.3 * 978 * (PS - 1); zoneY = Math.round(phTop + PH + 56);
      const ph = el('div', 'tkph', '<div class="bz"><div class="scr"></div><i class="notch"></i><b class="glare"></b></div>', cam, { top: top + 'px' });
      const scr = ph.querySelector('.scr'), glare = ph.querySelector('.glare');
      tl.set(ph, { xPercent: -50, autoAlpha: 0 }, 0);
      tl.fromTo(ph, { autoAlpha: 0, y: 900, rotationX: 50, rotationY: -540, rotationZ: -12, scale: 0.9, transformPerspective: 2200, transformOrigin: '50% 30%' }, { autoAlpha: 1, y: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scale: PS, duration: 1.1, ease: 'expo.out', immediateRender: false }, t0);
      sfx('whoosh', t0, -11);
      perFrame((t) => {
        const d = Math.max(0, t - t0 - 0.9);
        ph.querySelector('.bz').style.transform = `perspective(2200px) rotateY(${Math.sin(d * 0.8) * 9}deg) rotateX(${4 + Math.cos(d * 0.6) * 3}deg) translateY(${Math.sin(d * 1.1) * 10}px)`;
        glare.style.transform = `translateX(${-140 + ((t * 40) % 420)}%) rotate(20deg)`;
      });
      const screen = (html, cls = '') => { const s = el('div', 'tks ' + cls, html, scr); return s; };
      const swap = (from, to, t) => {
        tl.set(to, { autoAlpha: 0 }, 0);
        tl.fromTo(to, { autoAlpha: 1, xPercent: 100 }, { xPercent: 0, duration: 0.42, ease: 'expo.out', immediateRender: false }, t);
        if (from) tl.to(from, { xPercent: -30, filter: 'brightness(0.6)', duration: 0.42, ease: 'expo.out' }, t);
        tl.fromTo(ph, { rotationY: 0 }, { keyframes: [{ rotationY: -28, duration: 0.25, ease: 'power2.out' }, { rotationY: 0, duration: 0.45, ease: 'back.out(2.5)' }], immediateRender: false }, t);
        punch(t + 0.3, 0.05);
        sfx('whoosh', t, -17);
      };
      return { ph, scr, screen, swap };
    };
    const img = (f) => `<img class="tkimg" src="assets/ui/${f}.png">`;
    const hl = (s, box, t, label) => {
      const h = el('div', 'tkhl', label ? `<em>${label}</em>` : '', s, { top: box[0] + '%', height: box[1] + '%', left: (box[2] ?? 3) + '%', width: (box[3] ?? 94) + '%' });
      tl.set(h, { autoAlpha: 0 }, 0);
      tl.fromTo(h, { autoAlpha: 0, scale: 1.25 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, t);
      tl.to(h, { boxShadow: '0 0 0 10px rgba(224,155,107,0)', duration: 0.6, repeat: 2 }, t + 0.35);
      sfx('pop', t, -14);
      boom(540, phTop + PH * (box[0] + box[1] / 2) / 100, t, 12);
      return h;
    };
    // callout chip: one at a time in the zone under the phone; the previous one flies up and out
    let lastChip = null;
    const dropChip = (t) => { if (lastChip) { tl.to(lastChip, { autoAlpha: 0, y: -50, scale: 0.85, duration: 0.25, ease: 'power2.in' }, t - 0.2); lastChip = null; } };
    const chip = (html, t) => {
      dropChip(t);
      const c = el('div', 'tkchip', html, cam, { top: zoneY + 'px', left: '50%' });
      tl.set(c, { xPercent: -50, autoAlpha: 0 }, 0);
      tl.fromTo(c, { autoAlpha: 0, y: 70, scale: 0.4, rotation: -6 }, { autoAlpha: 1, y: 0, scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.8)', immediateRender: false }, t);
      boom(540, zoneY + 46, t + 0.1, 14); punch(t + 0.1, 0.04);
      sfx('chime', t + 0.1, -14); lastChip = c; return c;
    };
    // in-app chat screen (Tenance dark UI tokens)
    const chat = (name, sub) => {
      const s = el('div', 'tks tkchat', `<div class="hd"><b class="av">${name.split(' ').map((x) => x[0]).join('').slice(0, 2)}</b><div><b>${name}</b><small>${sub}</small></div></div><div class="body"></div>`);
      const body = s.querySelector('.body');
      const msg = (txt, who, t, o = {}) => {
        const m = el('div', 'tkm ' + who, (o.typing ? '<span class="tktyp"><i></i><i></i><i></i></span>' : '') + `<p>${txt}</p>`, body);
        tl.set(m, { autoAlpha: 0 }, 0);
        if (o.typing) {
          const tp = m.querySelector('.tktyp'), p = m.querySelector('p');
          tl.fromTo(tp.children, { y: 0 }, { y: -7, duration: 0.18, yoyo: true, repeat: Math.max(1, Math.floor(o.typing / 0.18) - 1), stagger: 0.09, ease: 'sine.inOut', immediateRender: false }, t - o.typing);
          tl.set(p, { display: 'none' }, 0); tl.set(m, { autoAlpha: 1 }, t - o.typing);
          tl.fromTo(m, { scale: 0.6, y: 30 }, { scale: 1, y: 0, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, t - o.typing);
          tl.set(tp, { display: 'none' }, t); tl.set(p, { display: 'block' }, t);
          tl.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, t);
        } else tl.fromTo(m, { autoAlpha: 0, scale: 0.5, y: 40 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(2.2)', immediateRender: false }, t);
        sfx(who === 'in' ? 'send' : 'pop', t, -13); punch(t, who === 'in' ? 0.03 : 0.06);
        return m;
      };
      return { s, msg };
    };
    // in-screen push notification
    const notif = (s, html, t) => { const n = el('div', 'tknot', html, s); tl.set(n, { autoAlpha: 0 }, 0); tl.fromTo(n, { autoAlpha: 0, yPercent: -150 }, { autoAlpha: 1, yPercent: 0, duration: 0.45, ease: 'back.out(1.6)', immediateRender: false }, t); sfx('chime', t, -12); return n; };
    // end: tagline (two lines) + waitlist CTA button with tap
    const end = (tLine1, tLine2, tCta, txt) => {
      dropChip(tLine1 - 0.3);
      const kids = [...cam.children].filter((c) => !c.classList.contains('tkbg') && !c.classList.contains('tksp'));
      tl.to(kids, { autoAlpha: 0, scale: 0.88, filter: 'blur(12px)', duration: 0.35, ease: 'power2.in' }, tLine1 - 0.35);
      setCapHidden((t) => t > tLine1 - 0.2);
      txt = txt || [de ? 'Dein Mieter schreibt.' : 'Your tenant writes.', de ? '*Tenance* antwortet.' : '*Tenance* answers.'];
      const l1 = head(txt[0], 560, tLine1, { cls: 'tktag', sfx: 'impact' });
      const l2 = txt[1] ? head(txt[1], 720, tLine2, { cls: 'tktag', sfx: 'impact' }) : l1;
      flash(tLine2); shake(tLine2 + 0.05, 10); burst(tLine2); boom(540, 780, tLine2 + 0.1, 30, 2);
      const cta = el('div', 'tkcta', `<span class="lg"><img src="assets/logo.png"></span><em class="wm">Tenance <i>${de ? 'KI' : 'AI'}</i></em><b class="btn">${de ? 'Jetzt auf die Warteliste' : 'Join the waitlist'}<i class="rp"></i></b><small>tenance.de</small><u class="cur"></u>`);
      const btn = cta.querySelector('.btn'), rp = cta.querySelector('.rp'), cur = cta.querySelector('.cur'), lg = cta.querySelector('.lg');
      tl.set(rp, { scale: 0, opacity: 0 }, 0); tl.set(cur, { autoAlpha: 0 }, 0);
      tl.set(cta, { autoAlpha: 0 }, 0); tl.set(cta, { autoAlpha: 1 }, tCta - 0.25);
      tl.to([l1, l2], { y: -260, scale: 0.8, duration: 0.5, ease: 'expo.inOut' }, tCta - 0.35);
      tl.fromTo(lg, { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)', immediateRender: false }, tCta - 0.25);
      tl.fromTo(cta.querySelector('.wm'), { autoAlpha: 0, y: 24, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(2)', immediateRender: false }, tCta - 0.2);
      tl.fromTo(btn, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.55, ease: 'elastic.out(1,0.6)', immediateRender: false }, tCta - 0.15);
      tl.fromTo(cta.querySelector('small'), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, tCta + 0.15);
      tl.fromTo(cur, { x: 260, y: 260, autoAlpha: 0 }, { x: 40, y: 20, autoAlpha: 1, duration: 0.45, ease: 'power3.out', immediateRender: false }, tCta + 0.3);
      tl.to(btn, { scale: 0.93, duration: 0.1, yoyo: true, repeat: 1 }, tCta + 0.8);
      tl.to(cur, { x: 300, y: 300, autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, tCta + 1.0);
      tl.fromTo(rp, { scale: 0, opacity: 0.9 }, { scale: 6, opacity: 0, duration: 0.7, ease: 'power2.out', immediateRender: false }, tCta + 0.8);
      perFrame((t) => { btn.style.boxShadow = `0 0 ${40 + Math.sin(t * 5) * 25}px rgba(224,155,107,${t > tCta ? 0.7 : 0})`; });
      boom(540, 1020, tCta - 0.1, 36, 2.2); ring(540, 1020, tCta - 0.1, 1.6); punch(tCta - 0.1, 0.1); boom(540, 1020, tCta + 0.8, 24, 1.6); ring(540, 1020, tCta + 0.8, 1.2);
      tl.to(lg, { rotationY: 360, duration: 0.9, ease: 'power2.inOut' }, tCta + 0.3);
      const sh = el('i', 'tkshine', null, btn); perFrame((t) => { sh.style.transform = `translateX(${-150 + (((t - tCta) * 120) % 400)}%) skewX(-20deg)`; });
      sfx('pop', tCta - 0.1, -11); sfx('kaching', tCta + 0.83, -12);
    };
    return { zone: () => zoneY, dropChip, cam, head, phone, img, hl, chip, chat, notif, end, flash, shake, burst, boom, ring, punch, whip, stripes };
  }

  // ================= X47: 2 a.m., tenant writes "pipe leaking" → Tenance answers, spots damage, books plumber, informs landlord (real maintenance + dashboard UI) → tagline + waitlist =================
  function X47() {
    const de = lang === 'de';
    const S = de ? { h: '*02:00* Uhr', name: 'Lena · Wohnung 3', sub: 'Mieterin', m1: 'Das Rohr im Bad tropft 💧', m2: 'Bin dran! Ich schicke sofort einen Installateur. Termin: heute 08:00 ✓', ai: 'Tenance AI', c1: '🔍 Wasserschaden erkannt', c2: '📅 Installateur · 08:00', c3: '✓ Vermieter informiert', n: '<b>Tenance AI</b>Wasserschaden in Wohnung 3, Installateur gebucht ✓', lb: 'dringend' }
      : { h: '*2:00* a.m.', name: 'Lena · Apt 3', sub: 'Tenant', m1: 'The bathroom pipe is leaking 💧', m2: "On it! Sending a plumber right away. Appointment: today 8:00 am ✓", ai: 'Tenance AI', c1: '🔍 Water damage spotted', c2: '📅 Plumber · 8:00 am', c3: '✓ Landlord informed', n: '<b>Tenance AI</b>Water leak in apt 3, plumber booked ✓', lb: 'urgent' };
    const K = {};
    const w1 = W(['Mieter', 'tenant']); K.writes = w1.start; K.drip = W(['tropft', 'leaking'], w1.i).start;
    const it = W(['Tenance', 'Tenance']); K.turn = it.start; K.ans = W(['antwortet', 'answers'], it.i - 1).start;
    K.dmg = W(['Schaden', 'damage'], it.i).start; K.hw = W(['Handwerker', 'plumber'], it.i).start; K.inf = W(['informiert', 'lets'], it.i).start;
    const l1 = W(['Dein', 'your'], it.i); K.l1 = l1.start; const t2 = W(['Tenance', 'Tenance'], l1.i); K.l2 = t2.start; K.cta = W(['Jetzt', 'join'], t2.i).start;
    const k = TK();
    const h = k.head(S.h, 120, 0.05, { st: 0.04, sfx: 'impact', out: K.turn - 0.2 });
    const P = k.phone(330, 0.25);
    const c = k.chat(S.name, S.sub); P.scr.appendChild(c.s);
    c.msg(S.m1, 'in', K.drip - 0.2, { typing: 0.9 });
    const ph = el('div', 'tkm in tkphoto', '<b>💧</b><span>IMG_0217</span>', c.s.querySelector('.body')); tl.set(ph, { autoAlpha: 0 }, 0);
    tl.fromTo(ph, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, K.drip + 0.3); sfx('shutter', K.drip + 0.3, -14);
    // Tenance answers: flash, burst, gold reply
    k.flash(K.turn); k.burst(K.turn); k.shake(K.turn + 0.05, 9);
    const hd2 = k.head(de ? 'Tenance *antwortet*' : 'Tenance *answers*', 120, K.turn, { sfx: 'impact' });
    c.msg(S.m2, 'out tkai', K.ans + 0.25, { typing: 0.5 });
    // real maintenance screen + damage highlight + chips
    const sm = P.screen(k.img('ll-maintenance'), 'tkimgs'); P.swap(c.s, sm, K.dmg - 0.35);
    k.hl(sm, [38.3, 12, 3, 94], K.dmg, S.lb);
    k.chip(S.c1, K.dmg + 0.1);
    k.chip(S.c2, K.hw);
    tl.to(hd2, { autoAlpha: 0, duration: 0.25 }, K.hw - 0.3);
    // real dashboard + push notification
    const sd = P.screen(k.img('ll-dashboard'), 'tkimgs'); P.swap(sm, sd, K.inf - 0.35);
    k.notif(sd, S.n, K.inf);
    k.chip(S.c3, K.inf + 0.2);
    k.end(K.l1, K.l2, K.cta);
    return { T: END + 0.9, K };
  }

  // ================= X48: 23 messages Monday → tenants write, Tenance answers (real tenants/maintenance UI) → approve → AI property manager → waitlist =================
  function X48() {
    const de = lang === 'de';
    const S = de ? { h: '*23* Nachrichten', mon: 'Montagmorgen', list: [['JS', 'James', 'Wann ist die nächste Abnahme?'], ['CB', 'Chandler', 'Der Wasserhahn tropft'], ['NP', 'Nicole', 'Klima macht Geräusche'], ['PR', 'Pamela', 'Wann läuft mein Vertrag aus?'], ['JK', 'Jack', 'Miete kommt Freitag']], done: 'beantwortet ✓', c1: '💬 23 Fragen geklärt', c2: '🔧 4 Reparaturen geplant', c3: '💶 2 Erinnerungen gesendet', ap: 'Alles freigeben', apd: 'Freigegeben ✓', mgr: 'Dein *KI-Hausverwalter.*', lb1: 'Termin ✓', lb2: 'erinnert ✓' }
      : { h: '*23* messages', mon: 'Monday morning', list: [['JS', 'James', 'When is the next inspection?'], ['CB', 'Chandler', 'The kitchen tap is dripping'], ['NP', 'Nicole', 'The AC is making noise'], ['PR', 'Pamela', 'When is my lease renewal?'], ['JK', 'Jack', 'Rent comes Friday']], done: 'answered ✓', c1: '💬 23 questions handled', c2: '🔧 4 repairs scheduled', c3: '💶 2 reminders sent', ap: 'Approve all', apd: 'Approved ✓', mgr: 'Your *AI* property manager.', lb1: 'booked ✓', lb2: 'reminded ✓' };
    const K = {};
    K.mon = W(['Montagmorgen', 'monday']).start;
    const it = W(['Tenance', 'Tenance']); K.turn = it.start; K.write = W(['Mieter', 'tenants']).start;
    K.q = W(['Fragen', 'questions'], it.i).start; K.r = W(['Reparaturen', 'repairs'], it.i).start; K.m = W(['Mieten', 'rent'], it.i).start; K.ok = W(['frei', 'approve'], it.i).start;
    const mg = W(['KI-Hausverwalter', 'property'], it.i); K.mgr = W(['Dein', 'your'], it.i).start;
    K.cta = W(['Jetzt', 'join'], mg.i).start;
    const k = TK();
    const h = k.head(S.h, 110, 0.0, { st: 0.035, sfx: 'impact', out: K.write - 0.2 });
    const h2 = k.head(S.mon, 250, K.mon - 0.1, { cls: 'tksub', sfx: false, out: K.write - 0.2 });
    const P = k.phone(380, 0.2);
    // inbox list inside phone
    const inbox = el('div', 'tks tkinbox', `<div class="ttl">${de ? 'Nachrichten' : 'Messages'}<em>23</em></div>` + S.list.map(([a, n, m], i) => `<div class="row"><b class="av c${i}">${a}</b><div><b>${n}</b><small>${m}</small></div><u>1</u><s>${S.done}</s></div>`).join(''), P.scr);
    const rows = [...inbox.querySelectorAll('.row')];
    tl.set(rows, { autoAlpha: 0 }, 0);
    rows.forEach((r, i) => { tl.fromTo(r, { autoAlpha: 0, x: 120 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'back.out(1.8)', immediateRender: false }, 0.5 + i * 0.32); sfx('buzz', 0.55 + i * 0.32, -20); });
    // red unread badges popping around the phone edges (no text to read, nothing covered)
    const BP = [[205, 520], [880, 600], [190, 860], [895, 940], [210, 1180], [870, 1260], [540, 1440]];
    const spill = BP.map(([x, y], i) => { const e = el('div', 'tkbadge', '+' + (i < 6 ? [4, 3, 5, 2, 6, 2][i] : 1), k.cam, { left: x + 'px', top: y + 'px' }); tl.set(e, { xPercent: -50, yPercent: -50, autoAlpha: 0 }, 0); tl.fromTo(e, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(3)', immediateRender: false }, 1.0 + i * 0.22); sfx('buzz', 1.0 + i * 0.22, -21); return e; });
    tl.to(spill, { autoAlpha: 0, scale: 0.2, x: (i) => 540 - BP[i][0], y: (i) => 860 - BP[i][1], duration: 0.4, ease: 'power3.in', stagger: 0.03 }, K.turn - 0.35);
    // Tenance answers: gold sweep across each row
    k.flash(K.turn); k.burst(K.turn); k.shake(K.turn + 0.05, 9);
    const hd = k.head(de ? 'Tenance *antwortet*' : 'Tenance *answers*', 140, K.turn, { sfx: 'impact' });
    rows.forEach((r, i) => { const s = r.querySelector('s'), u = r.querySelector('u'); tl.set(s, { autoAlpha: 0 }, 0); tl.to(u, { scale: 0, duration: 0.15 }, K.turn + 0.3 + i * 0.12); tl.fromTo(s, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.25, immediateRender: false }, K.turn + 0.35 + i * 0.12); sfx('pop', K.turn + 0.35 + i * 0.12, -19); });
    const cnt = inbox.querySelector('.ttl em'); perFrame((t) => { cnt.textContent = Math.max(0, Math.round(23 * (1 - clamp((t - K.turn - 0.3) / 1.0, 0, 1)))); });
    k.chip(S.c1, K.q);
    tl.to(hd, { autoAlpha: 0, duration: 0.25 }, K.q - 0.2);
    // real maintenance screen
    const sm = P.screen(k.img('ll-maintenance'), 'tkimgs'); P.swap(inbox, sm, K.r - 0.35);
    k.hl(sm, [26.5, 10.5, 3, 94], K.r + 0.05, S.lb1); k.hl(sm, [53, 9, 3, 94], K.r + 0.3, S.lb1);
    k.chip(S.c2, K.r + 0.1);
    // real tenants screen: overdue row
    const st = P.screen(k.img('ll-tenants'), 'tkimgs'); P.swap(sm, st, K.m - 0.35);
    k.hl(st, [79.5, 8.5, 3, 94], K.m + 0.05, S.lb2);
    k.chip(S.c3, K.m + 0.1);
    // approve button over the phone
    k.dropChip(K.ok - 0.6);
    const ap = el('div', 'tkap', `<b>${S.ap}</b><i class="rp"></i>`, k.cam, { top: k.zone() + 'px' }); const lab = ap.querySelector('b'), rp = ap.querySelector('.rp');
    tl.set(ap, { xPercent: -50, autoAlpha: 0 }, 0); tl.set(rp, { scale: 0, opacity: 0 }, 0);
    tl.fromTo(ap, { autoAlpha: 0, y: 120, scale: 0.6 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(2)', immediateRender: false }, K.ok - 0.6);
    tl.to(ap, { scale: 0.92, duration: 0.1, yoyo: true, repeat: 1 }, K.ok);
    tl.fromTo(rp, { scale: 0, opacity: 0.9 }, { scale: 5, opacity: 0, duration: 0.6, ease: 'power2.out', immediateRender: false }, K.ok);
    perFrame((t) => { lab.textContent = t > K.ok + 0.1 ? S.apd : S.ap; ap.classList.toggle('on', t > K.ok + 0.1); });
    k.burst(K.ok); k.boom(540, k.zone() + 65, K.ok + 0.02, 30, 1.8); k.ring(540, k.zone() + 65, K.ok, 1.3); k.punch(K.ok, 0.1); k.shake(K.ok + 0.05, 8); sfx('kaching', K.ok + 0.05, -11);
    // AI property manager line then tagline/CTA
    k.end(K.mgr, K.mgr, K.cta, [S.mgr, null]);
    return { T: END + 0.9, K };
  }

  // ================= X49: one apartment, 40 inquiries → every applicant writes, Tenance answers → viewings in the real calendar → "you just show up" → waitlist =================
  function X49tk() {
    const de = lang === 'de';
    const S = de ? { h: '*40* Anfragen', sub: 'für 1 Wohnung', ttl: 'Anfragen', list: [['LM', 'Lea M.', 'Ist die Wohnung noch frei?'], ['TK', 'Tom K.', 'Kann ich besichtigen?'], ['AS', 'Aylin S.', 'Sind Haustiere erlaubt?'], ['JB', 'Jonas B.', 'Ab wann ist sie frei?'], ['MR', 'Mia R.', 'Unterlagen anbei 📎']], done: 'beantwortet ✓', name: 'Lea M.', who: 'Interessentin · Apt 302', m1: 'Hallo! Ist die Wohnung noch frei? Kann ich sie besichtigen?', m2: 'Ja, noch frei! 🏡 Besichtigung am Di 17:00 oder Mi 18:30?', m3: 'Di 17:00 passt! 🙌', m4: 'Gebucht ✓ Bitte Selbstauskunft mitbringen.', c1: '💬 40 Fragen beantwortet', c2: '📄 12 Bewerbungen geprüft', c3: '📅 8 Besichtigungen gebucht', lb: 'Besichtigung ✓', end: 'Du kommst nur zum *Termin*.' }
      : { h: '*40* inquiries', sub: 'for 1 apartment', ttl: 'Inquiries', list: [['LM', 'Lea M.', 'Is the apartment still free?'], ['TK', 'Tom K.', 'Can I come see it?'], ['AS', 'Aylin S.', 'Are pets allowed?'], ['JB', 'Jonas B.', 'When can I move in?'], ['MR', 'Mia R.', 'Documents attached 📎']], done: 'answered ✓', name: 'Lea M.', who: 'Applicant · Apt 302', m1: 'Hi! Is the apartment still available? Can I see it?', m2: 'Yes, still free! 🏡 Viewing on Tue 5 pm or Wed 6:30 pm?', m3: 'Tue 5 pm works! 🙌', m4: 'Booked ✓ Please bring your ID and proof of income.', c1: '💬 40 questions answered', c2: '📄 12 applications checked', c3: '📅 8 viewings booked', lb: 'viewing ✓', end: 'You just *show up*.' };
    const K = {};
    K.v = W(['vierzig', 'forty']).start;
    K.write = W(['Jeder', 'Every']).start; K.wrEnd = W(['schreibt', 'writes']).start;
    const it = W(['Tenance']); K.turn = it.start; K.ans = W(['antwortet', 'answers'], it.i - 1).start;
    K.q = W(['Fragen', 'questions'], it.i).start; K.d = W(['Unterlagen', 'documents'], it.i).start; K.b = W(['Besichtigungen', 'viewings'], it.i).start; K.cal = W(['Kalender', 'calendar'], it.i).start;
    const du = W(['Du', 'You'], it.i); K.du = du.start; K.cta = W(['Jetzt', 'Join'], du.i).start;
    const k = TK();
    k.head(S.sub, 250, 0.05, { cls: 'tksub', sfx: false, out: K.turn - 0.2 });
    k.head(S.h, 110, Math.max(0.3, K.v - 0.1), { st: 0.035, sfx: 'impact', out: K.turn - 0.2 });
    const P = k.phone(380, 0.2);
    // inbox filling up: counter races to 40
    const inbox = el('div', 'tks tkinbox', `<div class="ttl">${S.ttl}<em>0</em></div>` + S.list.map(([a, n, m], i) => `<div class="row"><b class="av c${i}">${a}</b><div><b>${n}</b><small>${m}</small></div><u>1</u><s>${S.done}</s></div>`).join(''), P.scr);
    const rows = [...inbox.querySelectorAll('.row')]; tl.set(rows, { autoAlpha: 0 }, 0);
    rows.forEach((r, i) => { tl.fromTo(r, { autoAlpha: 0, x: 120 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'back.out(1.8)', immediateRender: false }, 0.5 + i * 0.32); sfx('buzz', 0.55 + i * 0.32, -20); });
    const cnt = inbox.querySelector('.ttl em'); perFrame((t) => { cnt.textContent = Math.round(40 * clamp((t - 0.45) / Math.max(0.5, K.write - 0.9), 0, 1)); });
    k.punch(K.v, 0.06);
    // one applicant's chat: Tenance answers and books the viewing
    const c = k.chat(S.name, S.who); P.scr.appendChild(c.s);
    P.swap(inbox, c.s, K.write - 0.35);
    c.msg(S.m1, 'in', K.wrEnd + 0.1, { typing: 0.6 });
    k.flash(K.turn); k.burst(K.turn); k.shake(K.turn + 0.05, 9);
    k.head(de ? 'Tenance *antwortet*' : 'Tenance *answers*', 130, K.turn, { sfx: 'impact' });
    c.msg(S.m2, 'out tkai', K.ans + 0.25, { typing: 0.45 });
    c.msg(S.m3, 'in', K.q + 0.4);
    c.msg(S.m4, 'out tkai', K.d + 0.35, { typing: 0.35 });
    k.chip(S.c1, K.q); k.chip(S.c2, K.d);
    // real calendar: the viewing lands in Upcoming Events
    const sc = P.screen(k.img('ll-calendar'), 'tkimgs'); P.swap(c.s, sc, K.b - 0.35);
    k.hl(sc, [64.6, 6.2, 4, 92], K.b + 0.45, S.lb);
    k.chip(S.c3, K.b + 0.1);
    k.end(K.du, K.du, K.cta, [S.end, null]);
    return { T: END + 0.9, K };
  }

  // ================= X50: tenant asks to extend the lease (real tenant app) → Tenance answers, prepares the renewal → landlord approves with one tap (real tenants screen) → waitlist =================
  function X50tk() {
    const de = lang === 'de';
    const S = de ? { h: 'Dein Mieter *schreibt*', name: 'James S.', who: 'Mieter · Palm Grove 1A', m1: 'Mein Vertrag läuft im Dezember aus. Kann ich verlängern? 🙏', m2: 'Klar! Ich bereite die Verlängerung vor und schicke sie deinem Vermieter zur Freigabe ✓', c1: '📄 Verlängerung vorbereitet', lbL: 'Dez. 2026', n: '<b>Tenance AI</b>Verlängerung für James S. bis Dez. 2027 bereit. Freigeben?', lbT: 'Verlängerung', ap: 'Freigeben', apd: 'Freigegeben ✓', end: 'Ein Klick. *Fertig.*' }
      : { h: 'Your tenant *writes*', name: 'James S.', who: 'Tenant · Palm Grove 1A', m1: 'My lease ends in December. Can I extend it? 🙏', m2: "Sure! I'm preparing the renewal and sending it to your landlord for approval ✓", c1: '📄 Renewal prepared', lbL: 'Dec 2026', n: '<b>Tenance AI</b>Renewal for James S. until Dec 2027 is ready. Approve?', lbT: 'renewal', ap: 'Approve', apd: 'Approved ✓', end: 'One tap. *Done.*' };
    const K = {};
    K.vert = W(['Vertrag', 'lease']).start; K.ask = W(['kann', 'can']).start; K.ext = W(['verlängern', 'extend']).start;
    const it = W(['Tenance']); K.turn = it.start; K.ans = W(['antwortet', 'answers'], it.i - 1).start;
    K.prep = W(['bereitet', 'prepares'], it.i).start; K.send = W(['schickt', 'sends'], it.i).start; K.fr = W(['Freigabe', 'approval'], it.i).start;
    const one = W(['Ein', 'One'], it.i); K.click = W(['Klick', 'tap'], one.i).start; K.done = W(['fertig', 'done'], one.i).start; K.cta = W(['Jetzt', 'Join'], one.i).start;
    const k = TK();
    k.head(S.h, 120, 0.05, { st: 0.035, sfx: 'impact', out: K.turn - 0.2 });
    const P = k.phone(330, 0.25);
    // tenant's own app: lease expires in December
    const sd = P.screen(k.img('tn-t-dashboard'), 'tkimgs');
    k.hl(sd, [11.2, 13.6, 51, 46], K.vert, S.lbL);
    // tenant writes
    const c = k.chat(S.name, S.who); P.scr.appendChild(c.s);
    P.swap(sd, c.s, K.ask - 0.35);
    c.msg(S.m1, 'in', K.ext + 0.2, { typing: 0.5 });
    k.flash(K.turn); k.burst(K.turn); k.shake(K.turn + 0.05, 9);
    k.head(de ? 'Tenance *antwortet*' : 'Tenance *answers*', 120, K.turn, { sfx: 'impact' });
    c.msg(S.m2, 'out tkai', K.ans + 0.25, { typing: 0.45 });
    k.chip(S.c1, K.prep);
    // landlord side: real tenants screen + approval
    const st = P.screen(k.img('ll-tenants'), 'tkimgs'); P.swap(c.s, st, K.send - 0.35);
    k.hl(st, [30.5, 8.5, 3, 94], K.send + 0.1, S.lbT);
    k.notif(st, S.n, K.fr - 0.25);
    k.dropChip(K.fr - 0.35);
    const ap = el('div', 'tkap', `<b>${S.ap}</b><i class="rp"></i>`, k.cam, { top: k.zone() + 'px' }); const lab = ap.querySelector('b'), rp = ap.querySelector('.rp');
    tl.set(ap, { xPercent: -50, autoAlpha: 0 }, 0); tl.set(rp, { scale: 0, opacity: 0 }, 0);
    tl.fromTo(ap, { autoAlpha: 0, y: 120, scale: 0.6 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(2)', immediateRender: false }, K.fr - 0.15);
    tl.to(ap, { scale: 0.92, duration: 0.1, yoyo: true, repeat: 1 }, K.click);
    tl.fromTo(rp, { scale: 0, opacity: 0.9 }, { scale: 5, opacity: 0, duration: 0.6, ease: 'power2.out', immediateRender: false }, K.click);
    perFrame((t) => { lab.textContent = t > K.click + 0.1 ? S.apd : S.ap; ap.classList.toggle('on', t > K.click + 0.1); });
    k.burst(K.click); k.boom(540, k.zone() + 55, K.click + 0.02, 30, 1.8); k.ring(540, k.zone() + 55, K.click, 1.3); k.punch(K.click, 0.1); k.shake(K.click + 0.05, 8); sfx('kaching', K.click + 0.05, -11);
    k.end(K.done, K.done, K.cta, [S.end, null]);
    return { T: END + 0.9, K };
  }

  // ================= TD: 3D diorama kit (winner style: W1/X3/X9/X12 — physical 3D world is the hero, UI only as a small card on top) + Tenance brand end card =================
  function TD(o = {}) {
    const k = TK();                       // brand end card + effects; its background stays hidden until the end
    const tkbg = k.cam.querySelector('.tkbg'), tksp = k.cam.querySelector('.tksp');
    tl.set([tkbg, tksp], { autoAlpha: 0 }, 0);
    const wrap = el('div', 'tdwrap');
    el('div', 'tdsky ' + (o.sky || 'night'), '<i class="moon"></i>', wrap);
    const G = gl3(wrap, { fov: o.fov || 30, envTop: o.envTop || '#c9d6f2', envBot: o.envBot || '#2a3348', envInt: o.envInt || 0.6, exposure: o.exposure || 1.0 });
    const { scene, cam } = G;
    const proj = (v) => { const p = v.clone().project(cam); return [(p.x + 1) / 2 * 1080, (1 - p.y) / 2 * 1920]; };
    const BR = lang === 'de' ? 'KI' : 'AI';
    // overlay elements live in the wrap so the whole 3D world fades out under the end card
    const ov = (cls, html) => el('div', cls, html, wrap);
    const glow = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,214,150,1)'); g.addColorStop(0.35, 'rgba(255,176,96,0.45)'); g.addColorStop(1, 'rgba(255,170,80,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; })();
    const person = (parent, col, x, y, z, s = 1, hair = '#2b1d16') => {
      const P = new T3.Group(); P.position.set(x, y, z); P.scale.setScalar(s); parent.add(P);
      mesh(new T3.CapsuleGeometry(0.2, 0.55, 6, 14), M.std(col, { roughness: 0.7 }), P, [0, 0.55, 0]);
      mesh(new T3.SphereGeometry(0.18, 20, 14), M.std('#e8b98f', { roughness: 0.7 }), P, [0, 1.12, 0]);
      mesh(new T3.SphereGeometry(0.185, 20, 14, 0, Math.PI * 2, 0, 1.4), M.std(hair, { roughness: 0.8 }), P, [0, 1.15, -0.01]);
      return P;
    };
    const phoneIn = (P) => { const g = new T3.Group(); g.position.set(0.2, 0.78, 0.2); P.add(g); mesh(rbox(0.13, 0.24, 0.03, 0.02), M.std('#111'), g); mesh(new T3.PlaneGeometry(0.11, 0.2), new T3.MeshBasicMaterial({ color: '#9fd0ff' }), g, [0, 0, 0.017]); return g; };
    const snowfall = (n = 700, box = [16, 14, 12], speed = 0.7) => {
      const geo = new T3.BufferGeometry(), pos = new Float32Array(n * 3), base = [];
      const rnd = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
      for (let i = 0; i < n; i++) base.push([(rnd(i, 1) - 0.5) * box[0], rnd(i, 2) * box[1], (rnd(i, 3) - 0.5) * box[2], 0.5 + rnd(i, 4)]);
      geo.setAttribute('position', new T3.BufferAttribute(pos, 3));
      const pts = new T3.Points(geo, new T3.PointsMaterial({ color: '#ffffff', size: 0.07, transparent: true, opacity: 0.85, depthWrite: false }));
      scene.add(pts);
      return (t) => { base.forEach(([x, y, z, sp], i) => { pos[i * 3] = x + Math.sin(t * 0.6 + i) * 0.25; pos[i * 3 + 1] = ((y - t * speed * sp) % box[1] + box[1]) % box[1]; pos[i * 3 + 2] = z; }); geo.attributes.position.needsUpdate = true; };
    };
    // small brand notification card at the top (the UI is never the hero)
    const card = (title, lines, t0) => {
      const c = ov('tdcard', `<div class="hd"><span class="lg"><img src="assets/logo.png"></span><b>${title}</b><small>Tenance ${BR}</small></div>` + lines.map((l) => `<div class="ln"><span>${l}</span><i>✓</i></div>`).join(''));
      tl.set(c, { autoAlpha: 0, xPercent: -50 }, 0);
      tl.fromTo(c, { autoAlpha: 0, y: -160, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.6)', immediateRender: false }, t0);
      sfx('chime', t0 + 0.05, -12);
      const ls = [...c.querySelectorAll('.ln')]; tl.set(ls, { autoAlpha: 0, height: 0, marginTop: 0 }, 0);
      return { c, line: (i, t) => { tl.to(ls[i], { autoAlpha: 1, height: 'auto', marginTop: 10, duration: 0.3, ease: 'power2.out' }, t); tl.fromTo(ls[i].querySelector('i'), { scale: 0 }, { scale: 1, duration: 0.35, ease: 'back.out(3)', immediateRender: false }, t + 0.15); sfx('pop', t + 0.15, -14); k.punch(t + 0.15, 0.03); } };
    };
    // brand moment: big "Tenance KI/AI" badge pops when the VO says "Tenance", then docks as a small corner mark
    const brand = (t, y = 806) => {
      const b = ov('tdbrand', `<span class="lg"><img src="assets/logo.png"></span><b>Tenance <i>${BR}</i></b>`);
      const wm = ov('tdwm', `<span class="lg"><img src="assets/logo.png"></span><b>Tenance <i>${BR}</i></b>`);
      tl.set(b, { xPercent: -50, yPercent: -50, left: 540, top: y, autoAlpha: 0 }, 0); tl.set(wm, { autoAlpha: 0 }, 0);
      tl.fromTo(b, { autoAlpha: 0, scale: 0.3, rotation: -6 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(2.2)', immediateRender: false }, t);
      tl.to(b, { left: 190, top: 64, scale: 0.4, autoAlpha: 0, duration: 0.45, ease: 'power3.in' }, t + 1.0);
      tl.fromTo(wm, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, t + 1.3);
      const sh = el('i', 'tdsh', null, b); perFrame((tt) => { sh.style.transform = `translateX(${-160 + Math.max(0, tt - t - 0.2) * 420}%) skewX(-20deg)`; });
      sfx('whoosh', t + 1.0, -18);
    };
    // end: 3D world fades, brand background + tagline + waitlist CTA
    const finish = (tLine, tCta, txt) => {
      tl.to(wrap, { autoAlpha: 0, scale: 1.08, filter: 'blur(10px)', duration: 0.45, ease: 'power2.in' }, tLine - 0.45);
      tl.to([tkbg, tksp], { autoAlpha: 1, duration: 0.4 }, tLine - 0.4);
      k.end(tLine, tLine, tCta, txt);
    };
    return Object.assign(k, { G, scene, cam, wrap, proj, ov, glow, person, phoneIn, snowfall, card, brand, finish });
  }

  // ================= X49 (3D): snowy evening, apartment house with one dark FOR RENT window → 40 inquiries fly in → applicants with phones on the sidewalk → Tenance answers all → window lights up, viewings booked, applicants walk in → landlord arrives with the key → waitlist =================
  function X49() {
    const de = lang === 'de';
    const S = de ? { chip: '🏠 1 Wohnung frei · Whg 4', rent: 'ZU VERMIETEN', booked: 'TERMIN ✓', ttl: '40 Anfragen', l1: '💬 40 Fragen beantwortet', l2: '📄 12 Bewerbungen geprüft', l3: '📅 8 Besichtigungen gebucht', tags: ['Di 17:00', 'Di 17:30', 'Mi 18:00', 'Mi 18:30', 'Do 17:00', 'Do 17:30'], typing: '💬', ans: '✓', key: '🔑', end: 'Du kommst nur zum *Termin*.' }
      : { chip: '🏠 1 apartment free · Unit 4', rent: 'FOR RENT', booked: 'VIEWING ✓', ttl: '40 inquiries', l1: '💬 40 questions answered', l2: '📄 12 applications checked', l3: '📅 8 viewings booked', tags: ['Tue 5:00', 'Tue 5:30', 'Wed 6:00', 'Wed 6:30', 'Thu 5:00', 'Thu 5:30'], typing: '💬', ans: '✓', key: '🔑', end: 'You just *show up*.' };
    const K = {};
    K.v = W(['vierzig', 'forty']).start;
    K.write = W(['Jeder', 'Every']).start;
    const it = W(['Tenance']); K.turn = it.start; K.ans = W(['antwortet', 'answers'], it.i - 1).start;
    K.q = W(['Fragen', 'questions'], it.i).start; K.d = W(['Unterlagen', 'documents'], it.i).start; K.b = W(['Besichtigungen', 'viewings'], it.i).start; K.cal = W(['Kalender', 'calendar'], it.i).start;
    const du = W(['Du', 'You'], it.i); K.du = du.start; K.cta = W(['Jetzt', 'Join'], du.i).start;
    const k = TD({ sky: 'night', envTop: '#9fb4e6', envBot: '#1c2438', envInt: 0.55 });
    const { scene, cam, proj, ov } = k;
    const hemi = new T3.HemisphereLight('#9fb6ff', '#2a2f40', 0.55); scene.add(hemi);
    const moon = new T3.DirectionalLight('#c9d8ff', 0.9); moon.position.set(-6, 10, 6); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
    Object.assign(moon.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 34 }); moon.shadow.radius = 4; moon.shadow.bias = -0.0005; scene.add(moon);
    const D = new T3.Group(); scene.add(D);
    const snow = M.std('#eef3ff', { roughness: 0.85 });
    mesh(rbox(11.4, 1.0, 9.0, 0.18), M.std('#232a3a', { roughness: 0.9 }), D, [0, -0.5, 0]);
    mesh(new T3.BoxGeometry(11.3, 0.12, 8.9), snow, D, [0, 0.06, 0]);
    mesh(new T3.BoxGeometry(11.3, 0.13, 1.6), M.std('#5f6672', { roughness: 0.8 }), D, [0, 0.07, 2.6]);
    const H = new T3.Group(); H.position.set(0, 0.12, -1.2); D.add(H);
    mesh(new T3.BoxGeometry(4.6, 5.0, 3.4), M.std('#e7d3b8', { roughness: 0.9 }), H, [0, 2.5, 0]);
    for (let f = 1; f < 3; f++) mesh(new T3.BoxGeometry(4.7, 0.12, 3.5), M.std('#c9a988', { roughness: 0.9 }), H, [0, f * 1.65, 0]);
    const rs = new T3.Shape(); rs.moveTo(-1.95, 0); rs.lineTo(1.95, 0); rs.lineTo(0, 1.4); rs.lineTo(-1.95, 0);
    const rg = new T3.ExtrudeGeometry(rs, { depth: 5.0, bevelEnabled: false }); rg.translate(0, 0, -2.5);
    mesh(rg, M.std('#1f4a36', { roughness: 0.7 }), H, [0, 5.0, 0], [0, Math.PI / 2, 0]);
    [-1, 1].forEach((sg) => { const m = mesh(new T3.BoxGeometry(5.1, 0.14, 2.45), snow, H, [0, 5.0 + 0.7 + 0.08, sg * 0.98]); m.rotation.x = sg * 0.62; });
    const front = 1.72, wins = [], VAC = 3;
    [[-1.15, 0.9], [1.15, 0.9], [-1.15, 2.55], [1.15, 2.55], [-1.15, 4.2], [1.15, 4.2]].forEach(([x, y], i) => {
      mesh(new T3.BoxGeometry(1.0, 1.05, 0.08), M.std('#eef1f5', { roughness: 0.6 }), H, [x, y, front]);
      const m = new T3.MeshStandardMaterial({ color: '#ffe2b0', emissive: new T3.Color('#ffb85c'), emissiveIntensity: 1.6, roughness: 0.25 });
      mesh(new T3.BoxGeometry(0.84, 0.88, 0.06), m, H, [x, y, front + 0.03]);
      mesh(new T3.BoxGeometry(0.05, 0.88, 0.07), M.std('#eef1f5'), H, [x, y, front + 0.05]);
      const g = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false })); g.position.set(x, y, front + 0.45); g.scale.setScalar(1.7); H.add(g);
      wins.push({ m, g, x, y });
    });
    // FOR RENT banner (flips to VIEWING ✓)
    const ban = new T3.Group(); ban.position.set(1.15, 1.83, front + 0.12); H.add(ban);
    const banner = (txt, bg, fg) => textPlane((x, w, h) => { x.fillStyle = bg; x.beginPath(); x.roundRect(4, 4, w - 8, h - 8, 26); x.fill(); x.fillStyle = fg; let fs = 64; x.font = `700 ${fs}px Clash`; while (x.measureText(txt).width > w - 64 && fs > 30) { fs -= 2; x.font = `700 ${fs}px Clash`; } x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, w / 2, h / 2 + 4); }, 512, 140, 1.5, 0.41);
    const bF = banner(S.rent, '#e09b6b', '#14261b'); ban.add(bF);
    const bB = banner(S.booked, '#5ac86a', '#0f2a17'); bB.rotation.x = Math.PI; bB.position.z = -0.002; ban.add(bB);
    // door (opens for the landlord) + warm light behind it
    const door = new T3.Group(); door.position.set(-0.45, 0.12, front + 0.02); H.add(door);
    mesh(new T3.BoxGeometry(0.9, 1.45, 0.08), M.std('#4b3428', { roughness: 0.6 }), door, [0.45, 0.72, 0]);
    mesh(new T3.SphereGeometry(0.05, 10, 8), M.std('#e09b6b', { metalness: 0.8, roughness: 0.3 }), door, [0.8, 0.72, 0.06]);
    mesh(new T3.BoxGeometry(0.88, 1.43, 0.02), new T3.MeshBasicMaterial({ color: '#ffcf8a' }), H, [0, 0.84, front - 0.03]);
    const doorLight = new T3.PointLight('#ffb76b', 0, 6); doorLight.position.set(0, 1.0, front + 0.6); H.add(doorLight);
    // street lamp + trees
    const lamp = new T3.Group(); lamp.position.set(-3.6, 0.12, 2.05); D.add(lamp);
    mesh(new T3.CylinderGeometry(0.06, 0.08, 3.0, 10), M.std('#2b313c', { metalness: 0.5 }), lamp, [0, 1.5, 0]);
    mesh(new T3.SphereGeometry(0.2, 16, 12), new T3.MeshBasicMaterial({ color: '#ffe0a8' }), lamp, [0, 3.05, 0]);
    const ll = new T3.PointLight('#ffcf8a', 2.2, 7); ll.position.set(-3.6, 3.0, 2.05); D.add(ll);
    const lg = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false })); lg.position.set(-3.6, 3.05, 2.05); lg.scale.setScalar(2.2); D.add(lg);
    const pine = (x, z, s) => { const g = new T3.Group(); g.position.set(x, 0.12, z); g.scale.setScalar(s); D.add(g); mesh(new T3.CylinderGeometry(0.12, 0.16, 0.6, 8), M.std('#4a3326'), g, [0, 0.3, 0]); [[0.95, 1.2, 0.9], [0.75, 1.0, 1.55], [0.5, 0.8, 2.15]].forEach(([r, h, y]) => { mesh(new T3.ConeGeometry(r, h, 10), M.std('#24463a', { roughness: 0.9 }), g, [0, y, 0]); mesh(new T3.ConeGeometry(r * 0.8, h * 0.42, 10), snow, g, [0, y + h * 0.24, 0]); }); };
    pine(-4.6, -1.0, 1.0); pine(4.4, -2.2, 1.2); pine(4.6, 0.6, 0.8); pine(-4.2, -3.2, 0.85);
    const snowT = k.snowfall(650, [16, 13, 12], 0.6);
    // applicants on the sidewalk, each with a phone
    const cols = ['#e0603e', '#3f8fd2', '#8a5cc7', '#2fa38a', '#d9a23a', '#c74f7a'];
    const ppl = cols.map((c, i) => { const P = k.person(D, c, -2.15 + i * 0.86, 0.13, 2.45 + (i % 2) * 0.35, 0.95); k.phoneIn(P); return { P, x0: P.position.x, z0: P.position.z }; });
    const appear = (i) => K.write - 0.15 + i * 0.12, walk = (i) => K.b + 0.2 + i * 0.28;
    const DOOR = new T3.Vector3(0, 0.13, -1.2 + front + 0.35);
    // landlord with the key
    const LL = k.person(D, '#1d4734', -5.2, 0.13, 2.4, 1.05, '#3a2a22');
    mesh(new T3.TorusGeometry(0.08, 0.025, 8, 16), M.std('#e09b6b', { metalness: 0.9, roughness: 0.25 }), LL, [0.26, 0.72, 0.18]);
    mesh(new T3.BoxGeometry(0.03, 0.16, 0.03), M.std('#e09b6b', { metalness: 0.9, roughness: 0.25 }), LL, [0.26, 0.6, 0.18]);
    const P = (a, r, h, tx, ty, tz) => () => ({ a, r, h, tx, ty, tz });
    const camT = track([
      [0, P(-0.5, 27, 11, 0, 2.6, -0.6)],
      [K.v + 0.2, P(-0.25, 19, 8.5, 0.8, 3.0, -0.8), E.io],
      [K.write + 0.3, P(-0.15, 24, 8.2, 0.2, 3.0, 0.4), E.io],
      [K.b, P(0.05, 23, 8.4, 0.3, 3.1, 0.2), E.lin],
      [K.du + 0.2, P(0.18, 15, 5.6, 0, 1.4, 0.6), E.io],
      [K.cta + 1, P(0.24, 14, 5.2, 0, 1.3, 0.6), E.lin],
    ]);
    const cWarm = new T3.Color('#ffb85c'), cDark = new T3.Color('#1a2236'), bWarm = new T3.Color('#ffe2b0'), bDark = new T3.Color('#2a3550');
    perFrame((t) => {
      snowT(t);
      const lit = E.io(seg(t, K.b - 0.1, 0.6));
      const w = wins[VAC]; w.m.emissive.copy(cDark).lerp(cWarm, lit); w.m.color.copy(bDark).lerp(bWarm, lit); w.m.emissiveIntensity = 0.3 + 1.3 * lit; w.g.material.opacity = 0.05 + 0.7 * lit;
      ban.rotation.x = Math.PI * E.io(seg(t, K.b, 0.5)); ban.position.y = 1.83 + 0.05 * Math.sin(t * 2);
      ppl.forEach(({ P, x0, z0 }, i) => {
        const a = E.ob(seg(t, appear(i), 0.35), 2.2), u = E.io(seg(t, walk(i), 0.9));
        P.visible = t > appear(i);
        P.position.set(lerp(x0, DOOR.x + (i - 2.5) * 0.08, u), 0.13 + Math.abs(Math.sin((t - walk(i)) * 9)) * 0.06 * (u > 0 && u < 1 ? 1 : 0), lerp(z0, DOOR.z, u));
        P.scale.setScalar(0.95 * a * (1 - E.io(seg(t, walk(i) + 0.8, 0.25))));
        P.rotation.y = u > 0 && u < 1 ? Math.atan2(DOOR.x - x0, DOOR.z - z0) : 0;
      });
      const lu = E.io(seg(t, K.du - 0.2, 1.1)); LL.visible = t > K.du - 0.35;
      LL.position.set(lerp(-5.2, DOOR.x - 0.55, lu), 0.13 + (lu > 0 && lu < 1 ? Math.abs(Math.sin(t * 9)) * 0.06 : 0), lerp(2.4, DOOR.z + 0.15, lu)); LL.rotation.y = lu < 1 ? Math.atan2(DOOR.x + 5.2, DOOR.z - 2.4) : 0;
      const op = E.io(seg(t, K.du + 0.7, 0.5)); door.rotation.y = -1.6 * op; doorLight.intensity = 3 * op;
      const c = camT(t);
      cam.position.set(c.tx + Math.sin(c.a) * c.r, c.h, c.tz + Math.cos(c.a) * c.r); cam.lookAt(c.tx, c.ty, c.tz);
      k.G.r.render(scene, cam);
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(chip, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'back.out(2)', immediateRender: false }, 0.15);
    tl.to(chip, { autoAlpha: 0, y: -40, duration: 0.3 }, K.turn);
    const winW = () => H.localToWorld(new T3.Vector3(wins[VAC].x, wins[VAC].y, front + 0.1));
    // 40 inquiries fly into the dark window
    const N = 40, env = [...Array(N)].map((_, i) => ov('tdenv', i % 3 ? '✉️' : '💬'));
    const ET = (i) => K.v - 0.15 + i * ((K.turn - 0.6 - K.v) / N);
    const from = env.map((_, i) => { const a = (i * 137.5) * Math.PI / 180; return [540 + Math.cos(a) * 760, 900 + Math.sin(a) * 1050]; });
    const badge = ov('tdbadge', '📩 0'); tl.set(badge, { autoAlpha: 0 }, 0); tl.to(badge, { autoAlpha: 1, duration: 0.2 }, K.v - 0.1); tl.to(badge, { autoAlpha: 0, duration: 0.25 }, K.turn + 0.1);
    perFrame((t) => {
      const [wx, wy] = proj(winW());
      let n = 0;
      env.forEach((e, i) => {
        const u = (t - ET(i)) / 0.55;
        if (u >= 1) n++;
        if (u < 0 || u >= 1) { e.style.visibility = 'hidden'; return; }
        const p = E.io(u); e.style.visibility = 'visible';
        e.style.transform = `translate(${lerp(from[i][0], wx, p) - 32}px, ${lerp(from[i][1], wy, p) - 32}px) scale(${1.25 - 0.8 * p}) rotate(${(1 - p) * (i % 2 ? 40 : -40)}deg)`;
      });
      const lbl = `📩 ${n}`; if (badge.textContent !== lbl) badge.textContent = lbl;
      badge.style.transform = `translate(${wx - 70}px, ${wy - 150}px) scale(${1 + 0.12 * Math.sin(t * 14) * (n > 0 && n < N ? 1 : 0)})`;
    });
    env.forEach((_, i) => { if (i % 4 === 0) sfx('buzz', ET(i) + 0.5, -20); });
    // bubbles above the applicants: typing → answered by Tenance → viewing time
    const head = (i) => { const p = ppl[i].P; return new T3.Vector3(p.position.x, p.position.y + 1.55 * p.scale.x, p.position.z); };
    const bub = ppl.map(() => ov('tdbub', `<span class="a">${S.typing}</span><span class="b">${S.ans}</span>`));
    const tag = ppl.map((_, i) => ov('tdtag', S.tags[i]));
    bub.forEach((b, i) => { tl.set(b, { autoAlpha: 0 }, 0); tl.fromTo(b, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.5)', immediateRender: false }, appear(i) + 0.2); tl.set(b, { className: 'tdbub ok' }, K.ans + 0.15 + i * 0.09); tl.to(b, { autoAlpha: 0, duration: 0.2 }, walk(i) - 0.1); sfx('pop', K.ans + 0.15 + i * 0.09, -17); });
    tag.forEach((g, i) => { tl.set(g, { autoAlpha: 0 }, 0); tl.fromTo(g, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.5)', immediateRender: false }, walk(i) - 0.05); tl.to(g, { autoAlpha: 0, duration: 0.15 }, walk(i) + 0.34); sfx('chime', walk(i), -19); });
    perFrame((t) => ppl.forEach((_, i) => { const [x, y] = proj(head(i)); bub[i].style.left = x + 'px'; bub[i].style.top = y + 'px'; tag[i].style.left = x + 'px'; tag[i].style.top = (y - (i % 2 ? 0 : 66)) + 'px'; }));
    // Tenance answers: brand pulse + small card on top
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulse = ov('tdpulse', ''); tl.set(pulse, { autoAlpha: 0 }, 0); tl.fromTo(pulse, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.turn + 0.15);
    cd.line(0, K.q); cd.line(1, K.d); cd.line(2, K.b + 0.15);
    tl.to(cd.c, { autoAlpha: 0, y: -80, duration: 0.3 }, K.du - 0.1);
    // the landlord's key
    const keyT = ov('tdtag key', `${S.key}`); tl.set(keyT, { autoAlpha: 0 }, 0); tl.fromTo(keyT, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.5)', immediateRender: false }, K.du); tl.to(keyT, { autoAlpha: 0, duration: 0.2 }, K.cta - 0.5);
    perFrame(() => { const [x, y] = proj(new T3.Vector3(LL.position.x, 1.75, LL.position.z)); keyT.style.left = x + 'px'; keyT.style.top = y + 'px'; });
    sfx('kaching', K.du + 0.75, -13);
    k.finish(K.cta - 0.15, K.cta + 0.25, [S.end, null]);
    return { T: END + 0.9, K };
  }

  // ================= X50 (3D): two floating islands — tenant's cozy flat (wall calendar flips to December) and the landlord's desk → chat → Tenance prepares the renewal (3D document) → flies along a gold arc to the landlord → one tap: gold stamp → waitlist =================
  function X50() {
    const de = lang === 'de';
    const S = de ? { chip: '🏠 Whg 1A · James S.', m1: 'Mein Vertrag läuft im Dezember aus. Kann ich verlängern? 🙏', m2: 'Klar! Ich bereite die Verlängerung vor ✓', ttl: 'Verlängerung · James S.', l1: '📄 Mietvertrag bis Dez. 2027', ap: 'Freigeben', apd: 'Freigegeben ✓', mon1: 'NOV', mon2: 'DEZ', end31: 'Vertragsende', doc: 'Mietvertrag', docS: 'Verlängerung bis Dez. 2027', ok: '🎉 Verlängert bis Dez. 2027!', end: 'Ein Klick. *Fertig.*' }
      : { chip: '🏠 Unit 1A · James S.', m1: 'My lease ends in December. Can I extend it? 🙏', m2: "Sure! I'm preparing your renewal ✓", ttl: 'Renewal · James S.', l1: '📄 Lease until Dec 2027', ap: 'Approve', apd: 'Approved ✓', mon1: 'NOV', mon2: 'DEC', end31: 'lease ends', doc: 'Lease', docS: 'Renewal until Dec 2027', ok: '🎉 Renewed until Dec 2027!', end: 'One tap. *Done.*' };
    const K = {};
    K.vert = W(['Vertrag', 'lease']).start; K.dec = W(['Dezember', 'December']).start; K.ask = W(['kann', 'can']).start; K.ext = W(['verlängern', 'extend']).start;
    const it = W(['Tenance']); K.turn = it.start; K.ans = W(['antwortet', 'answers'], it.i - 1).start;
    K.prep = W(['bereitet', 'prepares'], it.i).start; K.send = W(['schickt', 'sends'], it.i).start; K.fr = W(['Freigabe', 'approval'], it.i).start;
    const one = W(['Ein', 'One'], it.i); K.click = W(['Klick', 'tap'], one.i).start; K.done = W(['fertig', 'done'], one.i).start; K.cta = W(['Jetzt', 'Join'], one.i).start;
    const k = TD({ sky: 'dusk', envTop: '#e8dccb', envBot: '#2a3348', envInt: 0.75 });
    const { scene, cam, proj, ov } = k;
    scene.add(new T3.HemisphereLight('#ffe9d2', '#33405a', 0.8));
    const key = new T3.DirectionalLight('#fff1dc', 1.2); key.position.set(-4, 9, 8); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 }); key.shadow.radius = 4; key.shadow.bias = -0.0005; scene.add(key);
    const RX = 7.2;                         // landlord island offset
    const isl = (x, w, d) => { const g = new T3.Group(); g.position.set(x, 0, 0); scene.add(g); mesh(rbox(w + 0.4, 0.8, d + 0.4, 0.15), M.std('#23324a', { roughness: 0.9 }), g, [0, -0.4, 0]); mesh(new T3.BoxGeometry(w, 0.06, d), M.std('#c8935f', { roughness: 0.7 }), g, [0, 0.03, 0]); return g; };
    // tenant flat (cutaway: back + left wall)
    const A = isl(0, 5.0, 3.6);
    mesh(new T3.BoxGeometry(5.0, 3.0, 0.14), M.std('#f1e2cc', { roughness: 0.95 }), A, [0, 1.5, -1.8]);
    mesh(new T3.BoxGeometry(0.14, 3.0, 3.6), M.std('#e9d6bc', { roughness: 0.95 }), A, [-2.5, 1.5, 0]);
    // window with snowy night outside
    mesh(new T3.BoxGeometry(1.5, 1.2, 0.05), new T3.MeshBasicMaterial({ color: '#2b3c63' }), A, [1.1, 1.8, -1.72]);
    mesh(new T3.BoxGeometry(1.62, 0.08, 0.16), M.std('#ffffff'), A, [1.1, 1.18, -1.7]); mesh(new T3.BoxGeometry(0.06, 1.2, 0.08), M.std('#ffffff'), A, [1.1, 1.8, -1.69]);
    // sofa, lamp, plant, rug
    const sofaM = M.std('#2f5f4a', { roughness: 0.8 });
    mesh(rbox(1.9, 0.42, 0.85, 0.12), sofaM, A, [-1.1, 0.27, -1.1]); mesh(rbox(1.9, 0.6, 0.24, 0.1), sofaM, A, [-1.1, 0.62, -1.45]);
    mesh(new T3.CylinderGeometry(0.9, 0.9, 0.02, 40), M.std('#e09b6b', { roughness: 0.9 }), A, [-0.2, 0.065, 0.2]);
    mesh(new T3.CylinderGeometry(0.03, 0.03, 1.6, 10), M.std('#2b313c'), A, [-2.15, 0.8, -1.4]);
    mesh(new T3.ConeGeometry(0.28, 0.32, 20, 1, true), new T3.MeshStandardMaterial({ color: '#ffe0a8', emissive: new T3.Color('#ffb85c'), emissiveIntensity: 1.2, side: T3.DoubleSide }), A, [-2.15, 1.7, -1.4]);
    const lampL = new T3.PointLight('#ffb76b', 2.5, 6); lampL.position.set(-2.0, 1.6, -1.2); A.add(lampL);
    mesh(new T3.CylinderGeometry(0.2, 0.16, 0.36, 16), M.std('#c97b4a'), A, [2.1, 0.2, -1.3]);
    [0, 1, 2, 3, 4].forEach((i) => mesh(new T3.SphereGeometry(0.22, 12, 10), M.std('#3d7a52', { roughness: 0.8 }), A, [2.1 + Math.sin(i * 1.3) * 0.15, 0.55 + i * 0.12, -1.3 + Math.cos(i * 1.3) * 0.12], null, [1, 1.3, 1]));
    mesh(rbox(0.9, 0.35, 0.6, 0.05), M.std('#7a5a3f', { roughness: 0.6 }), A, [-0.2, 0.2, 0.2]);
    // wall calendar: NOV page flips up, DEC page with the red-circled 31
    const calG = new T3.Group(); calG.position.set(-1.55, 1.95, -1.72); A.add(calG);
    mesh(new T3.BoxGeometry(0.9, 1.0, 0.03), M.std('#ffffff', { roughness: 0.6 }), calG, [0, 0, 0]);
    const calPage = (mon, ring) => textPlane((x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = ring ? '#c0392b' : '#1d4734'; x.fillRect(0, 0, w, 120); x.fillStyle = '#fff'; x.font = '700 84px Clash'; x.textAlign = 'center'; x.fillText(mon, w / 2, 92); x.fillStyle = '#333'; x.font = '600 34px Gothic'; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) { const n = r * 7 + c + 1; if (n <= 31) x.fillText(String(n), 40 + c * 64, 180 + r * 62); } if (ring) { x.strokeStyle = '#e74c3c'; x.lineWidth = 9; x.beginPath(); x.arc(40 + 2 * 64, 180 + 4 * 62 - 12, 32, 0, 6.283); x.stroke(); } }, 470, 500, 0.86, 0.92);
    const pDec = calPage(S.mon2, true); pDec.position.z = 0.02; calG.add(pDec);
    const flipG = new T3.Group(); flipG.position.set(0, 0.46, 0.03); calG.add(flipG);
    const pNov = calPage(S.mon1, false); pNov.position.set(0, -0.46, 0.0); flipG.add(pNov);
    // tenant
    const TN = k.person(A, '#3f8fd2', 0.55, 0.06, 0.55, 1.0); const tph = k.phoneIn(TN);
    // landlord island: desk, laptop, chair, landlord
    const B = isl(RX, 3.6, 3.0);
    mesh(new T3.BoxGeometry(3.6, 2.2, 0.12), M.std('#dfe7ef', { roughness: 0.95 }), B, [0, 1.1, -1.5]);
    mesh(rbox(1.8, 0.08, 0.9, 0.03), M.std('#8a6446', { roughness: 0.5 }), B, [0, 0.82, -0.6]);
    [[-0.8, -0.95], [0.8, -0.95], [-0.8, -0.25], [0.8, -0.25]].forEach(([x, z]) => mesh(new T3.BoxGeometry(0.06, 0.78, 0.06), M.std('#5d4430'), B, [x, 0.4, z]));
    mesh(new T3.BoxGeometry(0.62, 0.03, 0.42), M.std('#c9ced4', { metalness: 0.7, roughness: 0.3 }), B, [-0.45, 0.88, -0.7]);
    const scr = mesh(new T3.BoxGeometry(0.62, 0.4, 0.02), new T3.MeshStandardMaterial({ color: '#1d4734', emissive: new T3.Color('#1d4734'), emissiveIntensity: 0.6 }), B, [-0.45, 1.08, -0.9], [-0.2, 0, 0]);
    const LLp = k.person(B, '#1d4734', 0.1, 0.06, 0.25, 1.0, '#3a2a22'); LLp.rotation.y = Math.PI;
    // gold arc + document
    const arc = new T3.QuadraticBezierCurve3(new T3.Vector3(-0.2, 1.4, 0.2), new T3.Vector3(RX / 2, 4.6, 0.6), new T3.Vector3(RX + 0.25, 0.9, -0.6));
    const dots = [...Array(26)].map((_, i) => mesh(new T3.SphereGeometry(0.05, 10, 8), new T3.MeshBasicMaterial({ color: '#e09b6b' }), scene, arc.getPoint(i / 25).toArray()));
    const DOC = new T3.Group(); scene.add(DOC);
    mesh(rbox(0.62, 0.84, 0.03, 0.02), M.std('#faf6ee', { roughness: 0.7 }), DOC);
    const face = textPlane((x, w, h) => { x.fillStyle = '#faf6ee'; x.fillRect(0, 0, w, h); x.fillStyle = '#1d4734'; x.fillRect(0, 0, w, 70); x.fillStyle = '#fff'; x.font = '700 40px Clash'; x.textAlign = 'center'; x.fillText(S.doc, w / 2, 50); x.fillStyle = '#1d4734'; x.font = '600 26px Gothic'; x.fillText(S.docS, w / 2, 120); x.fillStyle = '#cfc6b4'; for (let i = 0; i < 7; i++) x.fillRect(40, 160 + i * 34, w - 80 - (i % 3) * 40, 12); x.strokeStyle = '#1d4734'; x.lineWidth = 3; x.beginPath(); x.moveTo(w - 200, h - 50); x.lineTo(w - 40, h - 50); x.stroke(); }, 300, 410, 0.58, 0.79);
    face.position.z = 0.017; DOC.add(face);
    const stampG = new T3.Group(); scene.add(stampG);
    mesh(new T3.CylinderGeometry(0.22, 0.24, 0.12, 24), M.std('#e09b6b', { metalness: 0.8, roughness: 0.3 }), stampG, [0, 0, 0]);
    mesh(new T3.CylinderGeometry(0.06, 0.06, 0.32, 12), M.std('#7a4e3a'), stampG, [0, 0.22, 0]);
    mesh(new T3.SphereGeometry(0.12, 14, 10), M.std('#7a4e3a'), stampG, [0, 0.42, 0]);
    const seal = textPlane((x, w, h) => { x.fillStyle = 'rgba(90,200,106,0.95)'; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 6, 0, 6.283); x.fill(); x.fillStyle = '#fff'; x.font = '700 120px Clash'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('✓', w / 2, h / 2 + 6); }, 200, 200, 0.36, 0.36);
    seal.position.set(0.12, -0.2, 0.02); DOC.add(seal);
    const DESK = new T3.Vector3(RX + 0.25, 0.88, -0.6);
    const P = (a, r, h, tx, ty, tz) => () => ({ a, r, h, tx, ty, tz });
    const camT = track([
      [0, P(0.25, 13.5, 4.6, 0.0, 1.35, -0.2)],
      [K.dec, P(0.12, 10.5, 3.8, -0.4, 1.6, -0.6), E.io],
      [K.ext + 0.2, P(0.18, 11, 3.6, 0.2, 1.55, 0.0), E.io],
      [K.prep, P(0.18, 11.5, 3.8, 0.2, 1.5, 0.0), E.lin],
      [K.send + 1.0, P(0.0, 15.5, 6.0, RX / 2 + 0.4, 2.2, 0.0), E.io],
      [K.fr + 0.2, P(-0.15, 10.5, 3.6, RX + 0.1, 1.2, -0.3), E.io],
      [K.click + 0.35, P(-0.15, 10, 3.5, RX + 0.1, 1.15, -0.3), E.lin],
      [K.done + 0.3, P(0.05, 21, 7.5, RX / 2, 1.6, 0.0), E.io],
      [K.cta + 1, P(0.08, 22, 7.8, RX / 2, 1.6, 0.0), E.lin],
    ]);
    const docSpawn = K.prep - 0.1, flyA = K.send - 0.05, flyB = K.fr + 0.1;
    perFrame((t) => {
      flipG.rotation.x = -2.6 * E.io(seg(t, K.dec - 0.05, 0.45)); flipG.visible = flipG.rotation.x > -2.5;
      tph.rotation.x = -0.5 * E.io(seg(t, K.vert - 0.4, 0.4));
      const sp = E.ob(seg(t, docSpawn, 0.5), 1.8), f = E.io(seg(t, flyA, flyB - flyA));
      DOC.visible = t > docSpawn;
      if (f <= 0) { DOC.position.set(-0.2, 1.05 + 0.06 * Math.sin(t * 3), 0.3); DOC.rotation.set(0, Math.sin(t * 1.6) * 0.6, 0); DOC.scale.setScalar(Math.max(0.001, sp * 1.5)); }
      else if (f < 1) { DOC.position.copy(arc.getPoint(f)); DOC.rotation.set(-1.2 * f, (1 - f) * 6, 0); DOC.scale.setScalar(1.5 - 0.5 * f); }
      else { DOC.position.copy(DESK); DOC.rotation.set(-Math.PI / 2, 0, 0); DOC.scale.setScalar(1); }
      dots.forEach((d, i) => { const vis = E.io(seg(t, K.send - 0.3 + i * 0.02, 0.2)) * (1 - E.io(seg(t, K.done + 0.6, 0.4))); d.visible = vis > 0.01; d.scale.setScalar(Math.max(0.001, vis * (1 + 0.4 * Math.sin(t * 8 - i)))); });
      const st = seg(t, K.click - 0.35, 0.35), up = seg(t, K.click + 0.25, 0.3);
      stampG.visible = t > K.fr && t < K.click + 0.7;
      stampG.position.set(DESK.x + 0.12, DESK.y + 0.95 - 0.88 * E.ic(st) + 0.9 * E.io(up), DESK.z + 0.2);
      seal.visible = t > K.click; seal.scale.setScalar(E.ob(seg(t, K.click, 0.3), 2.5) + 0.0001);
      scr.material.emissiveIntensity = 0.6 + 1.2 * E.io(seg(t, K.click, 0.3));
      TN.position.y = 0.06 + (t > K.done ? Math.abs(Math.sin((t - K.done) * 8)) * 0.25 * (1 - seg(t, K.done + 0.8, 0.4)) : 0);
      const c = camT(t);
      cam.position.set(c.tx + Math.sin(c.a) * c.r, c.h, c.tz + Math.cos(c.a) * c.r); cam.lookAt(c.tx, c.ty, c.tz);
      k.G.r.render(scene, cam);
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(chip, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'back.out(2)', immediateRender: false }, 0.15);
    tl.to(chip, { autoAlpha: 0, y: -40, duration: 0.3 }, K.turn);
    const calLbl = ov('tdtag warn', `📅 31 · ${S.end31}`); tl.set(calLbl, { autoAlpha: 0 }, 0);
    tl.fromTo(calLbl, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.5)', immediateRender: false }, K.dec + 0.3); tl.to(calLbl, { autoAlpha: 0, duration: 0.2 }, K.turn); sfx('pop', K.dec + 0.3, -14); sfx('whoosh', K.dec - 0.05, -16);
    const m1 = ov('tdchat in', `<b>James S.</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { autoAlpha: 0 }, 0);
    tl.fromTo(m1, { autoAlpha: 0, y: 30, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, K.ask - 0.35); sfx('send', K.ask - 0.3, -13);
    tl.fromTo(m2, { autoAlpha: 0, y: 30, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, K.ans + 0.1); sfx('pop', K.ans + 0.1, -12);
    tl.to([m1, m2], { autoAlpha: 0, y: -40, duration: 0.3 }, K.send - 0.1);
    perFrame(() => { const [x, y] = proj(A.localToWorld(new T3.Vector3(TN.position.x, 1.65, TN.position.z))); const bx = clamp(x + 120, 330, 750) + 'px'; m1.style.left = bx; m1.style.top = (y - 380) + 'px'; m2.style.left = bx; m2.style.top = (y - 210) + 'px'; const cp = proj(A.localToWorld(new T3.Vector3(-1.55, 2.55, -1.7))); calLbl.style.left = Math.max(190, cp[0]) + 'px'; calLbl.style.top = (cp[1] - 20) + 'px'; });
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulse = ov('tdpulse', ''); tl.set(pulse, { autoAlpha: 0 }, 0); tl.fromTo(pulse, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1290);
    sfx('shutter', K.prep, -14); sfx('whoosh', K.send, -12);
    const cd = k.card(S.ttl, [S.l1], K.fr - 0.35); cd.line(0, K.fr);
    const ap = ov('tdbtn', `<b>${S.ap}</b><i class="rp"></i>`); const lab = ap.querySelector('b'), rp = ap.querySelector('.rp');
    tl.set(ap, { xPercent: -50, autoAlpha: 0 }, 0); tl.set(rp, { scale: 0, opacity: 0 }, 0);
    tl.fromTo(ap, { autoAlpha: 0, y: 100, scale: 0.6 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(2)', immediateRender: false }, K.fr - 0.1);
    tl.to(ap, { scale: 0.92, duration: 0.1, yoyo: true, repeat: 1 }, K.click);
    tl.fromTo(rp, { scale: 0, opacity: 0.9 }, { scale: 5, opacity: 0, duration: 0.6, ease: 'power2.out', immediateRender: false }, K.click);
    perFrame((t) => { lab.textContent = t > K.click + 0.1 ? S.apd : S.ap; ap.classList.toggle('on', t > K.click + 0.1); });
    tl.to([ap, cd.c], { autoAlpha: 0, y: -30, duration: 0.3 }, K.done + 0.1);
    k.boom(540, 1480, K.click + 0.02, 30, 1.8); k.punch(K.click, 0.1); sfx('impact', K.click, -10); sfx('kaching', K.click + 0.08, -11);
    const okB = ov('tdtag ok', S.ok); tl.set(okB, { autoAlpha: 0 }, 0); tl.fromTo(okB, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.5)', immediateRender: false }, K.done + 0.15); sfx('chime', K.done + 0.15, -12);
    perFrame(() => { const [x, y] = proj(A.localToWorld(new T3.Vector3(TN.position.x, 1.8, TN.position.z))); okB.style.left = clamp(x, 330, 750) + 'px'; okB.style.top = y + 'px'; });
    k.finish(K.cta + 0.3, K.cta + 0.6, [S.end, null]);
    return { T: END + 0.9, K };
  }

  // ================= X51 (3D): snowy midnight, cutaway apartment house — one flat's heating dies (radiator cools, frost, breath, blanket) → tenant writes → Tenance KI answers (brand moment) → first aid: emergency reset, radiator glows again → technician 08:00 booked → the landlord sleeps through it in the cottage next door → sunrise, service van arrives, all warm → waitlist =================
  function X51() {
    const de = lang === 'de';
    const S = de ? { chip: '🕛 00:00', temp: '🌡️ -5 °C', off: '⚠️ Heizung aus', m1: 'Die Heizung ist komplett aus, es ist eiskalt 🥶', m2: 'Bin dran! Erst der Notfall-Reset, um 08:00 kommt ein Techniker ✓', ttl: 'Heizung · Whg 2B', l1: '🔥 Soforthilfe: Reset läuft', l2: '🔧 Techniker morgen 08:00', l3: '🌙 Vermieter nicht geweckt', ok: '✓ Heizung läuft wieder', clock: '🕗 08:00 · Techniker da', van: 'HEIZUNGSDIENST', end: 'Du schläfst *weiter*.' }
      : { chip: '🕛 12:00 am', temp: '🌡️ -5 °C', off: '⚠️ Heating off', m1: "The heating is completely off, it's freezing 🥶", m2: 'On it! Emergency reset first, a technician comes at 8:00 am ✓', ttl: 'Heating · Apt 2B', l1: '🔥 First aid: reset running', l2: '🔧 Technician 8:00 am', l3: '🌙 Landlord not woken', ok: '✓ Heating back on', clock: '🕗 8:00 am · technician here', van: 'HEATING SERVICE', end: 'You sleep *through it*.' };
    const K = {};
    K.minus = W(['minus']).start;
    K.heat = W(['Heizung', 'heating']).start; K.off = W(['aus', 'dies']).start;
    K.write = W(['schreibt', 'writes']).start;
    const it = W(['Tenance']); K.turn = it.start; K.ans = W(['antwortet', 'answers'], it.i).start;
    K.aid = W(['Soforthilfe', 'first'], it.i).start; K.tech = W(['Techniker', 'technician'], it.i).start; K.eight = W(['acht', 'eight'], it.i).start;
    const du = W(['Du', 'You'], it.i); K.du = du.start; K.weiter = W(['weiter', 'it'], du.i).start; K.cta = W(['Jetzt', 'Join'], du.i).start;
    const k = TD({ sky: 'night', envTop: '#9fb4e6', envBot: '#1c2438', envInt: 0.5 });
    const { scene, cam, proj, ov } = k;
    // dawn sky fades in over the night sky for the morning reveal
    const dawn = el('div', 'tdsky dawn', '<i class="sun"></i>'); k.wrap.insertBefore(dawn, k.wrap.querySelector('canvas'));
    tl.set(dawn, { autoAlpha: 0 }, 0); tl.to(dawn, { autoAlpha: 1, duration: 0.75, ease: 'power1.inOut' }, K.du + 0.25);
    const hemi = new T3.HemisphereLight('#9fb6ff', '#2a2f40', 0.5); scene.add(hemi);
    const moon = new T3.DirectionalLight('#c9d8ff', 0.85); moon.position.set(-7, 11, 7); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
    Object.assign(moon.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 40 }); moon.shadow.radius = 4; moon.shadow.bias = -0.0005; scene.add(moon);
    const D = new T3.Group(); scene.add(D);
    const snow = M.std('#eef3ff', { roughness: 0.85 });
    mesh(rbox(15.4, 1.0, 9.6, 0.18), M.std('#232a3a', { roughness: 0.9 }), D, [0.6, -0.5, 0]);
    mesh(new T3.BoxGeometry(15.3, 0.12, 9.5), snow, D, [0.6, 0.06, 0]);
    mesh(new T3.BoxGeometry(15.3, 0.13, 1.7), M.std('#5f6672', { roughness: 0.8 }), D, [0.6, 0.07, 3.3]);
    // ---- cutaway apartment house (front wall removed) ----
    const H = new T3.Group(); H.position.set(-1.3, 0.12, -1.0); D.add(H);
    const facade = M.std('#e7d3b8', { roughness: 0.9 }), trim = M.std('#c9a988', { roughness: 0.9 });
    mesh(new T3.BoxGeometry(5.0, 5.1, 0.14), facade, H, [0, 2.55, -1.5]);
    [-2.5, 2.5].forEach((x) => mesh(new T3.BoxGeometry(0.14, 5.1, 3.0), facade, H, [x, 2.55, 0]));
    mesh(new T3.BoxGeometry(0.1, 5.1, 3.0), M.std('#d9c4a6', { roughness: 0.95 }), H, [0, 2.55, 0]);
    [0, 1.7, 3.4, 5.1].forEach((y) => mesh(new T3.BoxGeometry(5.14, 0.14, 3.04), trim, H, [0, y, 0]));
    const rs = new T3.Shape(); rs.moveTo(-1.62, 0); rs.lineTo(1.62, 0); rs.lineTo(0, 1.25); rs.lineTo(-1.62, 0);
    const rgeo = new T3.ExtrudeGeometry(rs, { depth: 5.4, bevelEnabled: false }); rgeo.translate(0, 0, -2.7);
    mesh(rgeo, M.std('#1f4a36', { roughness: 0.7 }), H, [0, 5.17, 0], [0, Math.PI / 2, 0]);
    [-1, 1].forEach((sg) => { const m = mesh(new T3.BoxGeometry(5.5, 0.14, 2.1), snow, H, [0, 5.17 + 0.62 + 0.08, sg * 0.8]); m.rotation.x = sg * 0.66; });
    const FX = -1.25, FY = 1.7;                // focus flat 2B: left column, middle floor
    const flats = [[-1.25, 0], [1.25, 0], [-1.25, 1.7], [1.25, 1.7], [-1.25, 3.4], [1.25, 3.4]];
    const walls = ['#cdbfae', '#c4c9d4', '#f1e2cc', '#cbd3c4', '#d4c4c8', '#c9c2b4'];
    flats.forEach(([x, y], i) => {
      const focus = x === FX && y === FY;
      mesh(new T3.PlaneGeometry(2.36, 1.52), M.std(walls[i], { roughness: 0.95 }), H, [x, y + 0.85, -1.42]);
      mesh(new T3.BoxGeometry(1.08, 0.74, 0.05), M.std('#eef1f5', { roughness: 0.6 }), H, [x, y + 1.08, -1.4]);
      mesh(new T3.BoxGeometry(0.96, 0.62, 0.04), new T3.MeshStandardMaterial({ color: '#1b2a4a', emissive: new T3.Color('#1b2a4a'), emissiveIntensity: 0.4, roughness: 0.2 }), H, [x, y + 1.08, -1.38]);
      if (!focus) {                           // everyone else is asleep: bed + sleeper in the dark
        const bx = x + (i % 2 ? 0.35 : -0.35);
        mesh(rbox(1.3, 0.34, 0.8, 0.05), M.std('#8a6a52', { roughness: 0.8 }), H, [bx, y + 0.24, -0.6]);
        mesh(rbox(1.0, 0.14, 0.78, 0.05), M.std(['#5b6f9a', '#7a5b8a', '#4f7f6a', '#9a6b4f', '#6b7a8a'][i % 5], { roughness: 0.9 }), H, [bx + 0.12, y + 0.47, -0.6]);
        mesh(new T3.SphereGeometry(0.15, 16, 12), M.std('#e8b98f', { roughness: 0.7 }), H, [bx - 0.42, y + 0.52, -0.6]);
      }
    });
    // a TV flickers in one flat (life in the building)
    const tvM = new T3.MeshBasicMaterial({ color: '#7fb2ff' }); mesh(new T3.BoxGeometry(0.6, 0.36, 0.04), tvM, H, [1.6, 0.75, -1.35]);
    const tvL = new T3.PointLight('#7fb2ff', 0.8, 3); tvL.position.set(1.4, 0.9, -0.6); H.add(tvL);
    // focus flat: radiator under the window, sofa, ceiling lamp, tenant
    const radM = new T3.MeshStandardMaterial({ color: '#efe9e0', emissive: new T3.Color('#ff6a2a'), emissiveIntensity: 1.5, roughness: 0.5 });
    const rad = new T3.Group(); rad.position.set(FX, FY + 0.42, -1.3); H.add(rad);
    for (let i = 0; i < 8; i++) mesh(rbox(0.1, 0.5, 0.16, 0.03), radM, rad, [-0.42 + i * 0.12, 0, 0]);
    mesh(new T3.BoxGeometry(0.98, 0.06, 0.12), radM, rad, [0, -0.24, 0]);
    const radG = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, color: '#ff8a4a' })); radG.position.set(FX, FY + 0.5, -1.0); radG.scale.setScalar(1.9); H.add(radG);
    const frost = textPlane((x, w, h) => {
      const g = x.createRadialGradient(w / 2, h / 2, h * 0.15, w / 2, h / 2, w * 0.62); g.addColorStop(0, 'rgba(230,242,255,0.15)'); g.addColorStop(1, 'rgba(240,248,255,0.95)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 2;
      for (let i = 0; i < 26; i++) { const a = i * 2.39, r0 = 40 + (i * 37) % 90, cx = w / 2 + Math.cos(a) * (w * 0.42), cy = h / 2 + Math.sin(a) * (h * 0.42); for (let j = 0; j < 6; j++) { const b = j * Math.PI / 3; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(b) * r0 * 0.4, cy + Math.sin(b) * r0 * 0.4); x.stroke(); } }
    }, 256, 160, 0.96, 0.62);
    frost.position.set(FX, FY + 1.08, -1.355); H.add(frost);
    mesh(rbox(1.0, 0.36, 0.56, 0.08), M.std('#2f5a44', { roughness: 0.8 }), H, [FX - 0.62, FY + 0.25, -0.75]);
    mesh(rbox(1.0, 0.42, 0.16, 0.06), M.std('#2f5a44', { roughness: 0.8 }), H, [FX - 0.62, FY + 0.5, -1.0]);
    mesh(new T3.SphereGeometry(0.08, 12, 10), new T3.MeshBasicMaterial({ color: '#ffe0a8' }), H, [FX, FY + 1.5, -0.2]);
    const roomL = new T3.PointLight('#ffb76b', 2.6, 5.5); roomL.position.set(FX, FY + 1.35, 0.1); H.add(roomL);
    const TN = k.person(H, '#3f8fd2', FX + 0.68, FY + 0.07, 0.2, 0.95); const tph = k.phoneIn(TN);
    const blanket = mesh(new T3.CylinderGeometry(0.25, 0.33, 0.78, 18, 1, true), M.std('#b3473b', { roughness: 0.9, side: T3.DoubleSide }), TN, [0, 0.52, 0]);
    const puffs = [0, 1, 2].map(() => mesh(new T3.SphereGeometry(0.07, 10, 8), new T3.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }), H, [0, 0, 0]));
    // ---- the landlord's cottage next door (front open): asleep, phone silent ----
    const C = new T3.Group(); C.position.set(4.3, 0.12, -1.2); D.add(C);
    mesh(new T3.BoxGeometry(2.6, 2.0, 0.12), facade, C, [0, 1.0, -1.1]);
    [-1.3, 1.3].forEach((x) => mesh(new T3.BoxGeometry(0.12, 2.0, 2.2), facade, C, [x, 1.0, 0]));
    mesh(new T3.BoxGeometry(2.72, 0.12, 2.24), trim, C, [0, 0.0, 0]); mesh(new T3.PlaneGeometry(2.48, 1.9), M.std('#d9cbb8', { roughness: 0.95 }), C, [0, 1.0, -1.03]);
    const cs = new T3.Shape(); cs.moveTo(-1.5, 0); cs.lineTo(1.5, 0); cs.lineTo(0, 1.0); cs.lineTo(-1.5, 0);
    const cgeo = new T3.ExtrudeGeometry(cs, { depth: 2.5, bevelEnabled: false }); cgeo.translate(0, 0, -1.25);
    const roofC = mesh(cgeo, M.std('#1f4a36', { roughness: 0.7 }), C, [0, 2.0, 0]);
    [-1, 1].forEach((sg) => { const m = mesh(new T3.BoxGeometry(1.75, 0.12, 2.6), snow, C, [sg * 0.72, 2.0 + 0.55, 0]); m.rotation.z = -sg * 0.59; });
    mesh(new T3.BoxGeometry(0.9, 0.56, 0.04), new T3.MeshStandardMaterial({ color: '#1b2a4a', emissive: new T3.Color('#1b2a4a'), emissiveIntensity: 0.4 }), C, [0.35, 1.3, -1.02]);
    mesh(rbox(1.7, 0.4, 1.0, 0.06), M.std('#8a6a52', { roughness: 0.8 }), C, [-0.25, 0.26, -0.45]);
    mesh(rbox(0.36, 0.14, 0.62, 0.05), M.std('#faf6ee', { roughness: 0.9 }), C, [-0.92, 0.52, -0.45]);
    const LLb = mesh(new T3.SphereGeometry(0.17, 18, 14), M.std('#e8b98f', { roughness: 0.7 }), C, [-0.88, 0.68, -0.45]);
    mesh(new T3.SphereGeometry(0.175, 18, 14, 0, Math.PI * 2, 0, 1.4), M.std('#3a2a22', { roughness: 0.8 }), C, [-0.93, 0.7, -0.45], [0, 0, 1.2]);
    const blanketC = mesh(rbox(1.25, 0.22, 0.98, 0.08), M.std('#1d4734', { roughness: 0.9 }), C, [0.0, 0.58, -0.45]);
    mesh(rbox(0.4, 0.46, 0.4, 0.04), M.std('#6b4f3c', { roughness: 0.8 }), C, [0.92, 0.25, -0.75]);
    const scrM = new T3.MeshStandardMaterial({ color: '#111', emissive: new T3.Color('#5ac86a'), emissiveIntensity: 0, roughness: 0.3 });
    mesh(rbox(0.14, 0.025, 0.24, 0.01), scrM, C, [0.92, 0.5, -0.72]);
    // street lamp, pines, the service van
    const lamp = new T3.Group(); lamp.position.set(2.0, 0.12, 2.2); D.add(lamp);
    mesh(new T3.CylinderGeometry(0.06, 0.08, 3.0, 10), M.std('#2b313c', { metalness: 0.5 }), lamp, [0, 1.5, 0]);
    mesh(new T3.SphereGeometry(0.2, 16, 12), new T3.MeshBasicMaterial({ color: '#ffe0a8' }), lamp, [0, 3.05, 0]);
    const ll = new T3.PointLight('#ffcf8a', 2.0, 7); ll.position.set(2.0, 3.0, 2.2); D.add(ll);
    const lg = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false })); lg.position.set(2.0, 3.05, 2.2); lg.scale.setScalar(2.2); D.add(lg);
    const pine = (x, z, s) => { const g = new T3.Group(); g.position.set(x, 0.12, z); g.scale.setScalar(s); D.add(g); mesh(new T3.CylinderGeometry(0.12, 0.16, 0.6, 8), M.std('#4a3326'), g, [0, 0.3, 0]); [[0.95, 1.2, 0.9], [0.75, 1.0, 1.55], [0.5, 0.8, 2.15]].forEach(([r, h, y]) => { mesh(new T3.ConeGeometry(r, h, 10), M.std('#24463a', { roughness: 0.9 }), g, [0, y, 0]); mesh(new T3.ConeGeometry(r * 0.8, h * 0.42, 10), snow, g, [0, y + h * 0.24, 0]); }); };
    pine(-5.2, -1.8, 1.1); pine(-5.6, 1.2, 0.85); pine(6.6, -2.6, 1.15); pine(6.7, 0.6, 0.8); pine(2.1, -3.2, 0.9);
    const snowT = k.snowfall(700, [18, 13, 12], 0.7);
    const V = new T3.Group(); V.position.set(-11, 0.12, 3.25); D.add(V);
    mesh(rbox(1.6, 0.95, 0.86, 0.08), M.std('#faf6ee', { roughness: 0.5 }), V, [-0.2, 0.68, 0]);
    mesh(rbox(0.62, 0.7, 0.84, 0.08), M.std('#faf6ee', { roughness: 0.5 }), V, [0.88, 0.56, 0]);
    mesh(new T3.BoxGeometry(0.05, 0.36, 0.7), M.std('#2a3550', { roughness: 0.2 }), V, [1.2, 0.72, 0]);
    mesh(new T3.BoxGeometry(2.2, 0.12, 0.88), M.std('#e09b6b', { roughness: 0.5 }), V, [0.1, 0.42, 0]);
    [[-0.6, 0.45], [0.8, 0.45], [-0.6, -0.45], [0.8, -0.45]].forEach(([x, z]) => mesh(new T3.CylinderGeometry(0.17, 0.17, 0.12, 16), M.std('#1a1a1a'), V, [x, 0.17, z], [Math.PI / 2, 0, 0]));
    const hl = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false })); hl.position.set(1.25, 0.5, 0.2); hl.scale.setScalar(0.9); V.add(hl);
    const vt = textPlane((x, w, h) => { x.fillStyle = '#14261b'; x.font = '700 64px Clash'; x.textAlign = 'center'; x.textBaseline = 'middle'; let fs = 64; while (x.measureText(S.van).width > w - 30 && fs > 30) { fs -= 2; x.font = `700 ${fs}px Clash`; } x.fillText(S.van, w / 2, h / 2 + 3); }, 512, 96, 1.4, 0.26);
    vt.position.set(-0.2, 0.8, 0.44); V.add(vt);
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz) => () => ({ a, r, h, tx, ty, tz });
    const camT = track([
      [0, P(-0.32, 23, 9.2, -1.1, 2.7, -0.9)],
      [K.heat - 0.2, P(-0.26, 19.5, 8.2, -1.6, 2.7, -0.9), E.io],
      [K.off + 0.55, P(-0.12, 9.6, 4.5, -2.35, 2.45, -0.8), E.io],
      [K.write + 0.4, P(-0.05, 9.0, 4.3, -2.4, 2.5, -0.8), E.lin],
      [K.turn + 0.25, P(0.0, 11.0, 4.9, -2.3, 2.55, -0.8), E.io],
      [K.aid + 0.45, P(0.08, 9.2, 4.2, -2.45, 2.35, -0.9), E.io],
      [K.tech + 0.45, P(0.05, 15, 6.4, -0.6, 2.6, -0.9), E.io],
      [K.du - 0.05, P(0.24, 8.6, 3.6, 4.2, 1.0, -1.0), E.io],
      [K.du + 0.35, P(0.2, 8.9, 3.7, 4.1, 1.05, -1.0), E.lin],
      [K.weiter + 0.45, P(-0.08, 33, 11.5, 0.9, 2.5, -0.6), E.io],
      [K.cta + 2, P(-0.04, 32, 11.2, 0.9, 2.5, -0.6), E.lin],
    ]);
    const cWarm = new T3.Color('#ffb76b'), cCold = new T3.Color('#8fb6ff'), mNight = new T3.Color('#c9d8ff'), mDawn = new T3.Color('#ffd2a0');
    const FOC = (y = 0) => H.localToWorld(new T3.Vector3(FX, FY + y, -0.6));
    perFrame((t) => {
      snowT(t);
      const cold = E.io(seg(t, K.heat + 0.1, 0.9)), aid = E.io(seg(t, K.aid + 0.15, 0.8)), morn = E.io(seg(t, K.du + 0.3, 0.7)), kick = Math.exp(-Math.pow((t - K.aid - 0.35) / 0.18, 2));
      const c = cold * (1 - 0.65 * aid) * (1 - morn);
      radM.emissiveIntensity = 1.5 * (1 - c) + 0.02 + 1.2 * kick; radG.material.opacity = Math.min(1, 0.8 * (1 - c) + kick); radG.scale.setScalar(1.9 + 1.4 * kick);
      frost.material.opacity = 0.9 * E.io(seg(t, K.off, 1.0)) * (1 - 0.55 * aid) * (1 - morn);
      roomL.color.copy(cWarm).lerp(cCold, c); roomL.intensity = 2.6 - 0.9 * c;
      const bl = E.ob(seg(t, K.off + 0.45, 0.45), 1.6); blanket.visible = bl > 0.01; blanket.scale.setScalar(Math.max(0.001, bl));
      TN.position.x = FX + 0.68 + Math.sin(t * 55) * 0.014 * c;
      tph.rotation.x = -0.6 * E.io(seg(t, K.write - 0.6, 0.4));
      puffs.forEach((p, i) => { const u = ((t * 0.9 + i / 3) % 1); p.position.set(FX + 0.68 + 0.05 + u * 0.12, FY + 1.2 + u * 0.35, 0.37 + u * 0.15); p.scale.setScalar(0.6 + u * 1.4); p.material.opacity = (c > 0.35 ? (1 - u) * 0.7 * c : 0); });
      tvM.color.setHSL(0.6, 0.6, 0.55 + 0.15 * Math.sin(t * 13) * Math.sin(t * 5.3)); tvL.intensity = (0.6 + 0.3 * Math.sin(t * 13)) * (1 - morn);
      LLb.position.y = 0.68 + 0.01 * Math.sin(t * 2.2); blanketC.scale.y = 1 + 0.06 * Math.sin(t * 2.2);
      scrM.emissiveIntensity = 1.4 * E.io(seg(t, K.weiter + 0.2, 0.3));
      moon.color.copy(mNight).lerp(mDawn, morn); moon.intensity = 0.85 + 0.9 * morn; hemi.intensity = 0.5 + 0.55 * morn; ll.intensity = 2.0 * (1 - morn); lg.material.opacity = 1 - morn;
      const vu = E.oc(seg(t, K.du + 0.45, 0.9)); V.position.x = lerp(-11, -2.0, vu); V.visible = t > K.du + 0.4;
      const cc = camT(t);
      cam.position.set(cc.tx + Math.sin(cc.a) * cc.r, cc.h, cc.tz + Math.cos(cc.a) * cc.r); cam.lookAt(cc.tx, cc.ty, cc.tz);
      k.G.r.render(scene, cam);
    });
    // ---- overlays ----
    const chip = ov('tdchip', `${S.chip} <span class="tp">${S.temp}</span>`); tl.set(chip, { xPercent: -50, autoAlpha: 0 }, 0);
    tl.fromTo(chip, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'back.out(2)', immediateRender: false }, 0.1);
    const tp = chip.querySelector('.tp'); tl.set(tp, { autoAlpha: 0 }, 0); tl.fromTo(tp, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(3)', immediateRender: false }, K.minus); sfx('pop', K.minus, -15);
    tl.to(chip, { autoAlpha: 0, y: -40, duration: 0.3 }, K.turn);
    const warn = ov('tdtag warn', S.off); tl.set(warn, { autoAlpha: 0 }, 0);
    tl.fromTo(warn, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.5)', immediateRender: false }, K.off + 0.1); tl.to(warn, { autoAlpha: 0, duration: 0.2 }, K.write - 0.35);
    sfx('impact', K.off, -14); sfx('whoosh', K.heat, -18);
    const m1 = ov('tdchat in', `<b>${de ? 'Mieter · Whg 2B' : 'Tenant · Apt 2B'}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { autoAlpha: 0 }, 0);
    tl.fromTo(m1, { autoAlpha: 0, y: 30, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, K.write - 0.3); sfx('send', K.write - 0.25, -13);
    tl.fromTo(m2, { autoAlpha: 0, y: 30, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, K.ans + 0.1); sfx('pop', K.ans + 0.1, -12);
    tl.to([m1, m2], { autoAlpha: 0, y: -40, duration: 0.3 }, K.aid - 0.15);
    perFrame(() => {
      const [x, y] = proj(H.localToWorld(new T3.Vector3(TN.position.x, FY + 1.25, TN.position.z))); const bx = clamp(x + 60, 330, 750) + 'px';
      m1.style.left = bx; m1.style.top = (y - 470) + 'px'; m2.style.left = bx; m2.style.top = (y - 290) + 'px';
      const [rx, ry] = proj(H.localToWorld(new T3.Vector3(FX, FY + 0.8, -1.2))); warn.style.left = clamp(rx, 200, 880) + 'px'; warn.style.top = ry + 'px';
    });
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulse = ov('tdpulse', ''); tl.set(pulse, { autoAlpha: 0 }, 0); tl.fromTo(pulse, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.aid - 0.1);
    cd.line(0, K.aid + 0.1); cd.line(1, K.eight - 0.1); cd.line(2, K.du + 0.15);
    tl.to(cd.c, { autoAlpha: 0, y: -80, duration: 0.25 }, K.weiter - 0.15);
    const zz = ov('tdbub zz', '💤'); tl.set(zz, { autoAlpha: 0 }, 0); tl.fromTo(zz, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.5)', immediateRender: false }, K.du - 0.4); tl.to(zz, { autoAlpha: 0, duration: 0.25 }, K.weiter + 0.1);
    const okT = ov('tdtag ok', S.ok); tl.set(okT, { autoAlpha: 0 }, 0); tl.fromTo(okT, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.5)', immediateRender: false }, K.weiter + 0.2); sfx('chime', K.weiter + 0.2, -12);
    const clk = ov('tdchip', S.clock); tl.set(clk, { xPercent: -50, autoAlpha: 0 }, 0); tl.fromTo(clk, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'back.out(2)', immediateRender: false }, K.weiter + 0.2); sfx('whoosh', K.du + 0.45, -14);
    perFrame((t) => {
      const [zx, zy] = proj(C.localToWorld(new T3.Vector3(-0.88, 1.0, -0.45))); zz.style.left = zx + 'px'; zz.style.top = (zy - 10 * Math.sin(t * 3)) + 'px';
      const [ox, oy] = proj(FOC(2.0)); okT.style.left = clamp(ox, 260, 820) + 'px'; okT.style.top = oy + 'px';
    });
    k.finish(K.cta + 0.3, K.cta + 0.6, [S.end, null]);
    return { T: END + 0.9, K };
  }

  // ================= TDX: TD kit + motion craft (Tue Oct 27+) =================
  // real motion blur + depth of field (sub-frame accumulation), anticipation/overshoot eases, damped springs,
  // follow-through wobbles, handheld camera, rigged pill figures with walk cycle / lean / squash / arm swing / head lag
  const MC = {
    // ease with anticipation (small backwards dip) and overshoot; s ~0.5 subtle .. 1.7 strong
    ant: (s = 1) => (x) => { const c1 = 1.70158 * s, c2 = c1 * 1.525; x = clamp(x); return x < 0.5 ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2 : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2; },
    // overshoot-only (no wind-up)
    out: (s = 1.4) => (x) => E.ob(clamp(x), s),
    // damped spring step response: 0 before t0, then rises past 1 and settles
    spring: (t, t0, f = 2.2, z = 0.32) => { const d = t - t0; if (d <= 0) return 0; const w = 2 * Math.PI * f; return 1 - Math.exp(-z * w * d) * Math.cos(w * Math.sqrt(1 - z * z) * d); },
    // decaying wobble impulse (impacts, follow-through)
    wob: (t, t0, f = 3, decay = 5) => { const d = t - t0; return d <= 0 ? 0 : Math.exp(-decay * d) * Math.sin(2 * Math.PI * f * d); },
    noise: (t, s = 1) => Math.sin(t * 1.3 * s + 1.7) * 0.5 + Math.sin(t * 2.9 * s + 0.4) * 0.3 + Math.sin(t * 5.1 * s + 2.2) * 0.2,
    rnd: (i, k = 0) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); },
  };
  // wind-up then move: value goes a -> slightly behind a -> past b -> b (anticipation + follow-through) over [t0, t0+d]
  const antMove = (t, t0, d, a, b, s = 1) => lerp(a, b, MC.ant(s)(seg(t, t0, d)));

  // soft contact-shadow texture (shared)
  let _blob = null;
  const blobTex = () => _blob || (_blob = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(0.35, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new T3.CanvasTexture(c); })());
  function TDX(o = {}) {
    const k = TD(o);
    const { scene, cam } = k; const r = k.G.r;
    const NS = Math.max(1, (window.MBN || o.mb || 6) | 0), SHUT = o.shutter || 1 / 50;
    const rtS = new T3.WebGLRenderTarget(1080 * (window.PR || 1), 1920 * (window.PR || 1), { type: T3.HalfFloatType, samples: 4 });
    const rtA = new T3.WebGLRenderTarget(1080 * (window.PR || 1), 1920 * (window.PR || 1), { type: T3.HalfFloatType, depthBuffer: false });
    const oc = new T3.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad = new T3.PlaneGeometry(2, 2);
    const accM = new T3.ShaderMaterial({
      uniforms: { tS: { value: rtS.texture }, w: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: 'uniform sampler2D tS; uniform float w; varying vec2 vUv; void main(){ vec4 c = texture2D(tS, vUv); if (!(c == c) || max(max(c.r, c.g), c.b) > 6e4) c = vec4(0.0, 0.0, 0.0, 1.0); gl_FragColor = c * w; }',
      blending: T3.CustomBlending, blendEquation: T3.AddEquation, blendSrc: T3.OneFactor, blendDst: T3.OneFactor, blendSrcAlpha: T3.OneFactor, blendDstAlpha: T3.OneFactor,
      depthTest: false, depthWrite: false, toneMapped: false,
    });
    const accS = new T3.Scene(); accS.add(new T3.Mesh(quad, accM));
    const outS = new T3.Scene(); outS.add(new T3.Mesh(quad, new T3.MeshBasicMaterial({ map: rtA.texture, depthTest: false, depthWrite: false })));
    // PRO: HDR bloom pyramid + ACES + cinematic grade (temperature, split-tone, saturation), vignette, lens fringing, film grain
    k.grade = { temp: 0, bloom: 0.55, th: 0.95, vig: 0.28, ca: 0.0035, grain: 0.016, sat: 1.06, exp: 1 };
    let post = null;
    if (o.pro) {
      const PX = window.PR || 1, VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
      const mk = (d) => new T3.WebGLRenderTarget(Math.round(1080 * PX / d), Math.round(1920 * PX / d), { type: T3.HalfFloatType, depthBuffer: false });
      const lv = [4, 8, 16].map((d) => ({ a: mk(d), b: mk(d), w: 1080 * PX / d, h: 1920 * PX / d }));
      const sm = (u, fs) => new T3.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: fs, depthTest: false, depthWrite: false, toneMapped: false });
      const brM = sm({ tI: { value: null }, th: { value: 1 } }, 'uniform sampler2D tI; uniform float th; varying vec2 vUv; void main(){ vec3 c = texture2D(tI, vUv).rgb; if (!(c == c)) c = vec3(0.0); c = min(c, vec3(64.0)); float l = max(c.r, max(c.g, c.b)); float kn = 0.5; float s = clamp(l - th + kn, 0.0, 2.0 * kn); s = s * s / (4.0 * kn + 1e-4); float w = max(s, l - th) / max(l, 1e-4); gl_FragColor = vec4(c * w, 1.0); }');
      const blM = sm({ tI: { value: null }, dir: { value: new T3.Vector2() } }, 'uniform sampler2D tI; uniform vec2 dir; varying vec2 vUv; void main(){ vec3 c = texture2D(tI, vUv).rgb * 0.227027; c += (texture2D(tI, vUv + dir * 1.3846).rgb + texture2D(tI, vUv - dir * 1.3846).rgb) * 0.316216; c += (texture2D(tI, vUv + dir * 3.2308).rgb + texture2D(tI, vUv - dir * 3.2308).rgb) * 0.070270; gl_FragColor = vec4(c, 1.0); }');
      const coM = sm({ tA: { value: rtA.texture }, b1: { value: lv[0].a.texture }, b2: { value: lv[1].a.texture }, b3: { value: lv[2].a.texture }, uT: { value: 0 }, uBloom: { value: 0.5 }, uExp: { value: 1 }, uTemp: { value: 0 }, uSat: { value: 1 }, uVig: { value: 0.3 }, uCA: { value: 0.003 }, uGrain: { value: 0.015 }, uRes: { value: new T3.Vector2(1080 * PX, 1920 * PX) } }, `
        uniform sampler2D tA, b1, b2, b3; uniform float uT, uBloom, uExp, uTemp, uSat, uVig, uCA, uGrain; uniform vec2 uRes; varying vec2 vUv;
        vec3 fit(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
        vec3 aces(vec3 c){ const mat3 I = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777)); const mat3 O = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602)); c *= uExp / 0.6; return clamp(O * fit(I * c), 0.0, 1.0); }
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main(){
          vec2 d = vUv - 0.5; float r2 = dot(d, d); vec2 off = d * uCA * (0.4 + 4.0 * r2);
          vec3 c = vec3(texture2D(tA, vUv - off).r, texture2D(tA, vUv).g, texture2D(tA, vUv + off).b); if (!(c == c)) c = vec3(0.0);
          c += (texture2D(b1, vUv).rgb * 0.55 + texture2D(b2, vUv).rgb * 0.75 + texture2D(b3, vUv).rgb * 1.0) * uBloom;
          c *= mix(vec3(1.0), uTemp < 0.0 ? vec3(0.80, 0.95, 1.22) : vec3(1.12, 1.0, 0.84), abs(uTemp));
          c = aces(c);
          float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
          c = mix(c, c * vec3(0.94, 1.0, 1.06), (1.0 - l) * 0.35); c = mix(c, c * vec3(1.05, 1.0, 0.95), l * 0.25);
          c = clamp(mix(vec3(l), c, uSat), 0.0, 1.0);
          c *= 1.0 - uVig * smoothstep(0.18, 0.62, length(d * vec2(1.0, 0.82)));
          vec3 s = mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
          s += (hash(floor(vUv * uRes / 1.5) + fract(uT * 7.31) * 113.0) - 0.5) * uGrain;
          gl_FragColor = vec4(s, 1.0);
        }`);
      const pS = new T3.Scene(), pQ = new T3.Mesh(quad, brM); pS.add(pQ);
      const pass = (m, rt) => { pQ.material = m; r.setRenderTarget(rt); r.render(pS, oc); };
      post = (t) => {
        const g = k.grade;
        brM.uniforms.th.value = g.th; brM.uniforms.tI.value = rtA.texture; pass(brM, lv[0].a);
        lv.forEach((L, i) => {
          if (i) { blM.uniforms.tI.value = lv[i - 1].a.texture; blM.uniforms.dir.value.set(0, 0); pass(blM, L.a); }
          blM.uniforms.tI.value = L.a.texture; blM.uniforms.dir.value.set(1 / L.w, 0); pass(blM, L.b);
          blM.uniforms.tI.value = L.b.texture; blM.uniforms.dir.value.set(0, 1 / L.h); pass(blM, L.a);
        });
        const u = coM.uniforms; u.uT.value = t; u.uBloom.value = g.bloom; u.uExp.value = g.exp * r.toneMappingExposure; u.uTemp.value = g.temp; u.uSat.value = g.sat; u.uVig.value = g.vig; u.uCA.value = g.ca; u.uGrain.value = g.grain;
        pQ.material = coM; r.setRenderTarget(null); r.clear(); r.render(pS, oc);
      };
    }
    const right = new T3.Vector3(), up = new T3.Vector3();
    let upd = null;
    k.dof = null;                                   // { focus: Vector3, ap: aperture in world units }
    k.frame = (fn) => { upd = fn; };
    perFrame((t) => {
      if (!upd) return;
      const ac = r.autoClear; r.autoClear = false;
      r.setRenderTarget(rtA); r.setClearColor(0x000000, 0); r.clear(true, false, false);
      for (let i = 0; i < NS; i++) {
        const ts = t + SHUT * ((i + 0.5) / NS - 0.5);           // shutter centred on t
        upd(ts);
        if (k.dof && k.dof.ap > 0 && NS > 1) {
          cam.updateMatrixWorld(); right.setFromMatrixColumn(cam.matrixWorld, 0); up.setFromMatrixColumn(cam.matrixWorld, 1);
          const a = i * 2.39996, rr = Math.sqrt((i + 0.5) / NS) * k.dof.ap;
          cam.position.addScaledVector(right, Math.cos(a) * rr).addScaledVector(up, Math.sin(a) * rr); cam.lookAt(k.dof.focus);
        }
        r.setRenderTarget(rtS); r.clear(); r.render(scene, cam);
        accM.uniforms.w.value = 1 / NS; r.setRenderTarget(rtA); r.render(accS, oc);
      }
      if (post) post(t); else { r.setRenderTarget(null); r.clear(); r.render(outS, oc); }
      r.autoClear = ac;
      upd(t);                                       // leave the world at t for overlay projection
    });
    // rigged pill figure
    k.fig = (parent, col, x, y, z, s = 1, hair = '#2b1d16', o2 = {}) => {
      const P = new T3.Group(); P.position.set(x, y, z); P.scale.setScalar(s); parent.add(P);
      const B = new T3.Group(); P.add(B);
      const mat = M.std(col, { roughness: 0.62 });
      mesh(new T3.CapsuleGeometry(0.2, 0.55, 8, 18), mat, B, [0, 0.55, 0]);
      if (o2.belt) mesh(new T3.CylinderGeometry(0.205, 0.205, 0.07, 20), M.std(o2.belt), B, [0, 0.42, 0]);
      const H = new T3.Group(); H.position.set(0, 0.98, 0); B.add(H);
      mesh(new T3.SphereGeometry(0.18, 24, 16), M.std('#e8b98f', { roughness: 0.7 }), H, [0, 0.15, 0]);
      mesh(new T3.SphereGeometry(0.186, 24, 16, 0, Math.PI * 2, 0, 1.35), M.std(hair, { roughness: 0.8 }), H, [0, 0.17, -0.012]);
      if (o2.cap) { mesh(new T3.SphereGeometry(0.19, 20, 12, 0, Math.PI * 2, 0, 1.2), M.std(o2.cap, { roughness: 0.6 }), H, [0, 0.2, 0]); mesh(new T3.CylinderGeometry(0.15, 0.15, 0.02, 20, 1, false, -Math.PI / 2, Math.PI), M.std(o2.cap), H, [0, 0.21, 0.1]); }
      const eyes = [-0.065, 0.065].map((ex) => mesh(new T3.SphereGeometry(0.022, 10, 8), M.std('#1a1a1a', { roughness: 0.25 }), H, [ex, 0.17, 0.162]));
      const mouthM = M.std('#5a2a22', { roughness: 0.6 });
      const smile = mesh(new T3.TorusGeometry(0.034, 0.008, 6, 16, Math.PI), mouthM, H, [0, 0.105, 0.165], [0.25, 0, Math.PI]);
      const oh = mesh(new T3.SphereGeometry(0.026, 12, 10), mouthM, H, [0, 0.09, 0.163]); oh.scale.set(0.8, 1, 0.35); oh.visible = false;
      const blob = new T3.Mesh(new T3.PlaneGeometry(0.9, 0.9), new T3.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: 0.55, color: '#000000' }));
      blob.rotation.x = -Math.PI / 2; blob.position.y = 0.006; blob.renderOrder = 1; P.add(blob);
      const arm = (sx) => { const A = new T3.Group(); A.position.set(sx * 0.215, 0.8, 0); B.add(A); mesh(new T3.CapsuleGeometry(0.058, 0.3, 6, 10), mat, A, [0, -0.18, 0]); mesh(new T3.SphereGeometry(0.06, 10, 8), M.std('#e8b98f', { roughness: 0.7 }), A, [0, -0.37, 0]); return A; };
      const AL = arm(-1), AR = arm(1);
      const hand = new T3.Group(); hand.position.set(0, -0.38, 0.03); AR.add(hand);
      P.userData = { B, H, AL, AR, hand, face: { eyes, smile, oh, seed: (x * 7.3 + z * 3.1) % 3.7 }, blob };
      return P;
    };
    // facial animation: auto blink + expressions. o3: { closed 0..1, wide 0..1, smile 0..1, o 0..1 }
    k.face = (P, t, o3 = {}) => {
      const f = P.userData.face; if (!f) return;
      const ph = (t + f.seed) % 3.7, bl = ph < 0.13 ? Math.sin(ph / 0.13 * Math.PI) : 0;
      const shut = Math.max(o3.closed || 0, bl), wd = 1 + 0.45 * (o3.wide || 0);
      f.eyes.forEach((e) => e.scale.set(wd, Math.max(0.1, 1 - shut) * wd, 1));
      const oo = o3.o || 0; f.oh.visible = oo > 0.15; f.oh.scale.set(0.8 * (0.5 + oo), 0.5 + oo, 0.35); f.smile.visible = oo <= 0.15; f.smile.scale.set(1, 0.25 + 0.95 * (o3.smile ?? 0.4), 1);
    };
    // drive a rigged figure along path(t) -> Vector3 (pure function of t): walk cycle, lean into acceleration,
    // bob + squash/stretch at foot contact, offset arm swing, head follow-through; o.face sets the yaw when standing
    k.drive = (P, t, path, o2 = {}) => {
      const { B, H, AL, AR } = P.userData, dt = 0.05;
      const p0 = path(t - dt), p1 = path(t), p2 = path(t + dt);
      const vx = (p2.x - p0.x) / (2 * dt), vz = (p2.z - p0.z) / (2 * dt), sp = Math.hypot(vx, vz);
      const ac = sp > 1e-3 ? (((p2.x - 2 * p1.x + p0.x) * vx + (p2.z - 2 * p1.z + p0.z) * vz) / (dt * dt * sp)) : 0;
      P.position.copy(p1);
      const kk = clamp(sp / 0.9), ph = (o2.phase || 0) + t * (o2.cad || 10);
      P.rotation.y = sp > 0.15 ? Math.atan2(vx, vz) : (o2.face !== undefined ? o2.face : P.rotation.y);
      const step = Math.abs(Math.sin(ph)), sq = (1 - step) * kk;
      B.position.y = step * 0.08 * kk + (o2.lift || 0);
      B.rotation.x = 0.16 * kk + clamp(ac * 0.035, -0.22, 0.22) + (o2.lean || 0);
      B.rotation.z = Math.sin(ph) * 0.05 * kk + (o2.tilt || 0);
      const sy = 1 - 0.07 * sq + (o2.squash || 0), sxz = 1 / Math.sqrt(Math.max(0.5, sy));
      B.scale.set(sxz, sy, sxz);
      AL.rotation.x = o2.armL !== undefined ? o2.armL : Math.sin(ph) * 0.75 * kk;
      AR.rotation.x = o2.armR !== undefined ? o2.armR : -Math.sin(ph) * 0.75 * kk;
      AL.rotation.z = -0.08 - (o2.armLz || 0); AR.rotation.z = 0.08 + (o2.armRz || 0);
      H.rotation.x = -B.rotation.x * 0.55 + Math.sin(ph - 0.7) * 0.06 * kk + (o2.nod || 0);   // head lags the body
      H.rotation.y = o2.look || 0;
      if (P.userData.blob) { const hgt = Math.max(0, B.position.y); P.userData.blob.scale.setScalar(1 - Math.min(0.5, hgt * 1.4)); P.userData.blob.material.opacity = 0.55 * (1 - Math.min(0.7, hgt * 2)); }
    };
    // handheld camera micro-motion + target lag (offset), applied after the track pose
    k.shoot = (c, t, hh = 1) => {
      const n1 = MC.noise(t * 0.9) * 0.035 * hh, n2 = MC.noise(t * 0.7 + 3) * 0.03 * hh, n3 = MC.noise(t * 0.8 + 7) * 0.02 * hh;
      cam.position.set(c.tx + Math.sin(c.a) * c.r + n1, c.h + n2, c.tz + Math.cos(c.a) * c.r + n3);
      cam.lookAt(c.tx + n2 * 0.5, c.ty + n1 * 0.4, c.tz);
      cam.rotation.z += MC.noise(t * 0.5 + 11) * 0.004 * hh + (c.roll || 0);
      if (c.fov && Math.abs(cam.fov - c.fov) > 1e-4) { cam.fov = c.fov; cam.updateProjectionMatrix(); }
    };
    // DOM entrance with anticipation + motion blur (blur while moving, crisp on landing)
    k.popIn = (e, t, o2 = {}) => {
      tl.set(e, { autoAlpha: 0 }, 0);
      tl.fromTo(e, { autoAlpha: 0, y: o2.y ?? 70, scale: o2.s0 ?? 0.7, filter: 'blur(14px)' }, { autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: o2.d || 0.42, ease: 'back.out(2.2)', immediateRender: false }, t);
    };
    k.popOut = (e, t, o2 = {}) => {
      tl.to(e, { y: o2.wind ?? 10, scale: 1.04, duration: 0.1, ease: 'power1.out' }, t - 0.1);           // anticipation
      tl.to(e, { autoAlpha: 0, y: o2.y ?? -90, scale: 0.85, filter: 'blur(12px)', duration: 0.26, ease: 'power3.in' }, t);
    };
    return Object.assign(k, { MC, antMove });
  }

  // ================= X52 (TDX): water drips through the ceiling → camera cranes up: burst pipe upstairs → tenant writes → Tenance KI answers →
  // upstairs neighbour's phone buzzes, he jumps up and runs to the main valve → valve spins shut, spray dies, last drip falls → plumber arrives, new pipe → damage stopped =================
  function X52() {
    const de = lang === 'de';
    const S = de ? { chip: '🕙 22:14 · Whg 1B', m1: 'Es tropft von der Decke! 💧', m2: 'Bin dran! Ich sage oben Bescheid und schicke einen Installateur ✓', who: 'Mieterin · Whg 1B', ttl: 'Wasserschaden · Whg 1B', l1: '📲 Nachbar oben informiert', l2: '🔧 Haupthahn zu', l3: '🧰 Installateur · 23:15', valve: 'Haupthahn', time: '🕚 23:15', ok: '✓ Schaden gestoppt', end: 'Schaden *gestoppt*.' }
      : { chip: '🕙 10:14 pm · Apt 1B', m1: 'Water is dripping from my ceiling! 💧', m2: "On it! I'm alerting upstairs and sending a plumber ✓", who: 'Tenant · Apt 1B', ttl: 'Water leak · Apt 1B', l1: '📲 Upstairs neighbor alerted', l2: '🔧 Main valve off', l3: '🧰 Plumber · 11:15 pm', valve: 'Main valve', time: '🕚 11:15 pm', ok: '✓ Damage stopped', end: 'Damage *stopped*.' };
    const K = {};
    K.drip = W(['tropft', 'dripping']).start; K.oben = W(['oben', 'upstairs']).start;
    K.write = W(['schreibt', 'writes']).start;
    const it = W(['Tenance']); K.turn = it.start; K.ans = W(['antwortet', 'answers'], it.i).start;
    K.nb = W(['Nachbar', 'neighbor'], it.i).start; K.hahn = W(['Haupthahn', 'main'], it.i).start; K.inst = W(['Installateur', 'plumber'], it.i).start;
    K.stop = W(['Schaden', 'Damage'], it.i).start; K.cta = W(['Jetzt', 'Join'], it.i).start;
    const k = TDX({ sky: 'night', envTop: '#8fa3d6', envBot: '#141b2c', envInt: 0.5, fov: 32 });
    const { scene, MC, ov } = k;
    const hemi = new T3.HemisphereLight('#8fa7e6', '#1d2232', 0.32); scene.add(hemi);
    const UYW = 2.34;
    const moon = new T3.DirectionalLight('#b9c8ff', 0.7); moon.position.set(-6, 12, 8); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
    Object.assign(moon.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 }); moon.shadow.radius = 4; moon.shadow.bias = -0.0005; scene.add(moon);
    const D = new T3.Group(); scene.add(D);
    // wet street, city backdrop
    mesh(new T3.PlaneGeometry(60, 40), M.std('#151b28', { roughness: 0.22, metalness: 0.35 }), D, [0, 0, -4], [-Math.PI / 2, 0, 0]);
    const city = new T3.Group(); D.add(city);
    const winM = new T3.MeshBasicMaterial({ color: '#ffd59a' }), winM2 = new T3.MeshBasicMaterial({ color: '#9fc4ff' });
    for (let i = 0; i < 16; i++) {
      const w = 1.4 + MC.rnd(i, 1) * 1.8, h = 3 + MC.rnd(i, 2) * 8, x = -16 + i * 2.2 + MC.rnd(i, 3) * 0.6, z = -13 - MC.rnd(i, 4) * 5;
      mesh(new T3.BoxGeometry(w, h, 1.5), M.std('#1b2236', { roughness: 0.9 }), city, [x, h / 2, z]);
      for (let j = 0; j < 7; j++) { if (MC.rnd(i * 7 + j, 5) < 0.45) continue; mesh(new T3.PlaneGeometry(0.22, 0.3), MC.rnd(i, j) < 0.7 ? winM : winM2, city, [x - w / 2 + 0.3 + MC.rnd(i * 9 + j, 6) * (w - 0.6), 0.6 + MC.rnd(i * 5 + j, 7) * (h - 1.2), z + 0.76]); }
    }
    // ---- the building section (front wall removed) ----
    const B = new T3.Group(); B.position.set(0, 0.12, -0.8); D.add(B);
    const facade = M.std('#c9a98c', { roughness: 0.9 }), trim = M.std('#e8dccb', { roughness: 0.85 });
    mesh(rbox(6.6, 0.24, 3.8, 0.06), M.std('#2a3142', { roughness: 0.8 }), B, [0, -0.12, 0]);
    mesh(new T3.BoxGeometry(6.3, 4.6, 0.16), facade, B, [0, 2.3, -1.66]);
    [-3.08, 3.08].forEach((x) => mesh(new T3.BoxGeometry(0.16, 4.6, 3.4), facade, B, [x, 2.3, 0]));
    mesh(new T3.BoxGeometry(6.3, 0.22, 3.42), trim, B, [0, 2.2, 0]);
    mesh(new T3.BoxGeometry(6.4, 0.22, 3.5), trim, B, [0, 4.5, 0]);
    mesh(new T3.BoxGeometry(6.0, 0.03, 3.2), M.std('#c8935f', { roughness: 0.6 }), B, [0, 0.015, 0]);
    mesh(new T3.BoxGeometry(6.0, 0.03, 3.2), M.std('#b07f55', { roughness: 0.6 }), B, [0, 2.325, 0]);
    mesh(new T3.PlaneGeometry(6.0, 2.08), M.std('#f4dfc0', { roughness: 0.95 }), B, [0, 1.06, -1.57]);
    mesh(new T3.PlaneGeometry(6.0, 2.06), M.std('#d7ecdf', { roughness: 0.95 }), B, [0, 3.37, -1.57]);
    [[-3.0, 1.06, 2.08], [-3.0, 3.37, 2.06]].forEach(([x, y, h], i) => mesh(new T3.PlaneGeometry(3.2, h), M.std(i ? '#cfe4d8' : '#efd6b4', { roughness: 0.95 }), B, [x + 0.08, y, 0], [0, Math.PI / 2, 0]));
    mesh(new T3.BoxGeometry(6.0, 0.12, 0.03), M.std('#fff7ea'), B, [0, 0.08, -1.55]); mesh(new T3.BoxGeometry(6.0, 0.12, 0.03), M.std('#fff7ea'), B, [0, UYW + 0.08, -1.55]);
    // pictures, plant, curtains (lower) / wall cabinets, fridge, pendant (upper)
    [[-0.2, 1.35, '#e09b6b'], [0.65, 1.5, '#1d4734'], [1.3, 1.3, '#7fa9d8']].forEach(([x, y, c]) => { mesh(new T3.BoxGeometry(0.46, 0.36, 0.03), M.std('#2b2b2b'), B, [x, y, -1.54]); mesh(new T3.PlaneGeometry(0.38, 0.28), M.std(c, { roughness: 0.7 }), B, [x, y, -1.52]); });
    const plant = (x, y, z, s) => { const g = new T3.Group(); g.position.set(x, y, z); g.scale.setScalar(s); B.add(g); mesh(new T3.CylinderGeometry(0.16, 0.12, 0.3, 16), M.std('#c86b3c'), g, [0, 0.15, 0]); [[0, 0.55, 0, 0.26], [0.13, 0.45, 0.06, 0.2], [-0.12, 0.47, -0.05, 0.19]].forEach(([a, b, c, r]) => mesh(new T3.SphereGeometry(r, 14, 10), M.std('#3d7a4f', { roughness: 0.8 }), g, [a, b, c])); };
    plant(-2.65, 0.02, 0.2, 1.1); plant(2.65, UYW, -1.25, 0.9);
    [-2.3, -1.1].forEach((x) => mesh(new T3.BoxGeometry(0.26, 1.0, 0.04), M.std('#b4533e', { roughness: 0.9 }), B, [x, 1.25, -1.48]));
    mesh(new T3.BoxGeometry(2.1, 0.55, 0.36), M.std('#f1ece3', { roughness: 0.6 }), B, [0.55, UYW + 1.55, -1.38]);
    mesh(rbox(0.75, 1.75, 0.66, 0.06), M.std('#e6e9ee', { metalness: 0.3, roughness: 0.35 }), B, [-1.75, UYW + 0.88, -1.18]);
    mesh(new T3.CylinderGeometry(0.005, 0.005, 0.6, 6), M.std('#222'), B, [0.4, UYW + 1.85, -0.3]);
    mesh(new T3.ConeGeometry(0.2, 0.18, 24, 1, true), M.std('#1d4734', { side: T3.DoubleSide }), B, [0.4, UYW + 1.5, -0.3]);
    const pendG = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.7 })); pendG.position.set(0.4, UYW + 1.42, -0.3); pendG.scale.setScalar(1.1); B.add(pendG);
    const fillL = new T3.PointLight('#ffcf98', 1.6, 7); fillL.position.set(0.5, 1.4, 0.8); B.add(fillL);
    const fillU = new T3.PointLight('#fff0d8', 1.2, 7); fillU.position.set(0.5, UYW + 1.4, 0.8); B.add(fillU);
    const nightWin = (x, y) => { mesh(new T3.BoxGeometry(1.1, 0.8, 0.05), M.std('#eef1f5'), B, [x, y, -1.55]); mesh(new T3.PlaneGeometry(0.96, 0.66), new T3.MeshBasicMaterial({ color: '#16233f' }), B, [x, y, -1.52]); };
    nightWin(-1.7, 1.25); nightWin(-1.7, 3.55);
    // lower flat: sofa, lamp, rug, tv
    mesh(rbox(1.5, 0.42, 0.7, 0.1), M.std('#2f5a44', { roughness: 0.8 }), B, [-1.95, 0.27, -0.95]);
    mesh(rbox(1.5, 0.5, 0.2, 0.08), M.std('#2f5a44', { roughness: 0.8 }), B, [-1.95, 0.55, -1.25]);
    mesh(new T3.CircleGeometry(1.1, 40), M.std('#d9b48a', { roughness: 0.95 }), B, [0.1, 0.035, 0.1], [-Math.PI / 2, 0, 0]);
    mesh(new T3.CylinderGeometry(0.02, 0.03, 1.5, 8), M.std('#2b313c', { metalness: 0.6 }), B, [-2.75, 0.75, -1.25]);
    mesh(new T3.ConeGeometry(0.2, 0.25, 20, 1, true), M.std('#f3e2c2', { side: T3.DoubleSide, emissive: new T3.Color('#ffcf8a'), emissiveIntensity: 0.6 }), B, [-2.75, 1.55, -1.25]);
    const lampL = new T3.PointLight('#ffc27a', 3.2, 7); lampL.position.set(-2.4, 1.6, -0.8); B.add(lampL);
    const lampG = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false })); lampG.position.set(-2.75, 1.5, -1.2); lampG.scale.setScalar(1.3); B.add(lampG);
    mesh(rbox(1.2, 0.5, 0.45, 0.04), M.std('#6b4f3c', { roughness: 0.7 }), B, [2.15, 0.25, -1.3]);
    const tvM = new T3.MeshBasicMaterial({ color: '#6fa8ff' }); mesh(new T3.BoxGeometry(1.0, 0.58, 0.04), tvM, B, [2.15, 0.85, -1.36]);
    // bucket, ceiling stain, drips, splash crowns, floor puddle
    const DX = 0.6, DZ = -0.25, WY0 = 0.12, WY1 = 0.3;
    const bucket = new T3.Group(); bucket.position.set(DX, 0.03, DZ); B.add(bucket);
    mesh(new T3.CylinderGeometry(0.25, 0.19, 0.42, 28, 1, true), M.std('#8d99a8', { metalness: 0.7, roughness: 0.3, side: T3.DoubleSide }), bucket, [0, 0.21, 0]);
    mesh(new T3.TorusGeometry(0.25, 0.012, 8, 32), M.std('#aab4c0', { metalness: 0.8, roughness: 0.25 }), bucket, [0, 0.42, 0], [Math.PI / 2, 0, 0]);
    const waterM = new T3.MeshStandardMaterial({ color: '#5d8fc9', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.85 });
    const water = mesh(new T3.CircleGeometry(0.21, 28), waterM, bucket, [0, 0.12, 0], [-Math.PI / 2, 0, 0]);
    const stainM = new T3.MeshStandardMaterial({ color: '#7a5a3a', roughness: 0.9, transparent: true, opacity: 0.85, depthWrite: false });
    const stain = mesh(new T3.CircleGeometry(1, 48), stainM, B, [DX, 2.087, DZ], [Math.PI / 2, 0, 0]);
    const stainRing = mesh(new T3.RingGeometry(0.92, 1, 48), new T3.MeshStandardMaterial({ color: '#4e3820', roughness: 0.9, transparent: true, opacity: 0.8, depthWrite: false }), B, [DX, 2.086, DZ], [Math.PI / 2, 0, 0]);
    const puddleM = new T3.MeshStandardMaterial({ color: '#7fa9d8', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.55, depthWrite: false });
    const puddle = mesh(new T3.CircleGeometry(1, 40), puddleM, B, [DX + 0.08, 0.034, DZ + 0.05], [-Math.PI / 2, 0, 0]);
    const dropM = new T3.MeshStandardMaterial({ color: '#cfe6ff', roughness: 0.02, metalness: 0.1, transparent: true, opacity: 0.9 });
    const drops = [0, 1, 2, 3].map(() => mesh(new T3.SphereGeometry(0.058, 16, 12), dropM, B, [DX, 2, DZ]));
    const crowns = [0, 1, 2, 3].map(() => mesh(new T3.TorusGeometry(1, 0.08, 6, 24), new T3.MeshStandardMaterial({ color: '#d8ecff', roughness: 0.05, transparent: true, opacity: 0.8 }), B, [DX, 0.3, DZ], [Math.PI / 2, 0, 0]));
    const splN = 24, spl = new T3.InstancedMesh(new T3.SphereGeometry(0.018, 6, 5), dropM, splN); B.add(spl);
    // drip schedule: drops form at the stain, fall, splash; the last one falls right after the valve closes
    const PER = 0.48, TF = Math.sqrt(2 * (2.05 - 0.4) / 9.8), FORM = 0.28;
    const dripEnd = K.hahn + 0.55, firstHit = K.drip + 0.15;
    const spawn = (n) => firstHit - TF - FORM + n * PER;            // n = 0,1,2...
    const nMax = Math.floor((dripEnd - spawn(0)) / PER);
    // ---- upper flat (the neighbour's kitchen): counter, sink, pipe under the sink, main valve, sofa + TV ----
    const UY = 2.34;
    const ctr = new T3.Group(); ctr.position.set(0.55, UY, -1.22); B.add(ctr);
    mesh(new T3.BoxGeometry(2.3, 0.84, 0.62), M.std('#e9e2d6', { roughness: 0.7 }), ctr, [0, 0.42, -0.02]);
    mesh(new T3.BoxGeometry(2.4, 0.06, 0.7), M.std('#3a3f48', { roughness: 0.35 }), ctr, [0, 0.87, 0]);
    mesh(new T3.BoxGeometry(0.7, 0.62, 0.05), M.std('#1e2228'), ctr, [0.05, 0.46, 0.3]);       // dark open cabinet (front cut away)
    mesh(new T3.BoxGeometry(0.56, 0.08, 0.4), M.std('#c7ccd3', { metalness: 0.7, roughness: 0.2 }), ctr, [0.05, 0.86, 0.02]);
    mesh(new T3.CylinderGeometry(0.02, 0.02, 0.36, 8), M.std('#c7ccd3', { metalness: 0.8, roughness: 0.2 }), ctr, [0.05, 1.05, -0.2]);
    const pipeM = M.std('#b8c0c8', { metalness: 0.8, roughness: 0.25 });
    mesh(new T3.CylinderGeometry(0.035, 0.035, 0.7, 12), pipeM, ctr, [0.05, 0.42, 0.18]);
    const newPipe = mesh(new T3.CylinderGeometry(0.05, 0.05, 0.14, 16), M.std('#d98c4a', { metalness: 0.9, roughness: 0.25, emissive: new T3.Color('#e09b6b'), emissiveIntensity: 0 }), ctr, [0.05, 0.45, 0.18]);
    const CRACK = new T3.Vector3(0.6, UY + 0.45, -1.0);                 // B-local spray origin
    const valve = new T3.Group(); valve.position.set(-0.75, UY + 0.62, -1.47); B.add(valve);
    mesh(new T3.CylinderGeometry(0.035, 0.035, 1.3, 12), pipeM, B, [-0.75, UY + 0.6, -1.5]);
    const wheel = new T3.Group(); wheel.position.z = 0.08; valve.add(wheel);
    mesh(new T3.TorusGeometry(0.12, 0.022, 10, 28), M.std('#d23b30', { roughness: 0.45 }), wheel, [0, 0, 0]);
    [0, 1, 2].forEach((i) => mesh(new T3.BoxGeometry(0.24, 0.02, 0.02), M.std('#d23b30', { roughness: 0.45 }), wheel, [0, 0, 0], [0, 0, i * Math.PI / 3]));
    mesh(new T3.CylinderGeometry(0.03, 0.03, 0.06, 12), M.std('#8f2620'), wheel, [0, 0, 0], [Math.PI / 2, 0, 0]);
    mesh(rbox(1.4, 0.38, 0.7, 0.1), M.std('#8a5c7a', { roughness: 0.8 }), B, [1.8, UY + 0.24, 0.25]);
    mesh(rbox(0.2, 0.5, 0.7, 0.08), M.std('#8a5c7a', { roughness: 0.8 }), B, [1.15, UY + 0.45, 0.25]);
    const tv2 = new T3.MeshBasicMaterial({ color: '#8fb8ff' }); mesh(new T3.BoxGeometry(0.04, 0.6, 1.0), tv2, B, [2.98, UY + 1.0, 0.25]);
    const tvL2 = new T3.PointLight('#8fb8ff', 1.2, 4); tvL2.position.set(2.4, UY + 1.0, 0.25); B.add(tvL2);
    const ceilL = new T3.PointLight('#ffd7a0', 1.8, 6); ceilL.position.set(0.2, UY + 1.7, -0.2); B.add(ceilL);
    const upPud = mesh(new T3.CircleGeometry(1, 44), puddleM, B, [0.65, UY + 0.012, -0.55], [-Math.PI / 2, 0, 0]);
    const sprN = 150, spr = new T3.InstancedMesh(new T3.SphereGeometry(0.016, 6, 5), dropM, sprN); B.add(spr);
    const mist = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, color: '#bfe0ff', transparent: true, depthWrite: false, opacity: 0.8 })); mist.position.copy(CRACK); mist.position.z += 0.25; mist.scale.setScalar(0.9); B.add(mist);
    // rain around the building
    const rainN = 520, rain = new T3.InstancedMesh(new T3.BoxGeometry(0.008, 0.45, 0.008), new T3.MeshBasicMaterial({ color: '#a9bfe6', transparent: true, opacity: 0.38 }), rainN); D.add(rain);
    const rainP = []; for (let i = 0; rainP.length < rainN && i < 6000; i++) { const x = (MC.rnd(i, 1) - 0.5) * 26, z = -12 + MC.rnd(i, 2) * 11; if (z > -3.1 && Math.abs(x) < 4.6) continue; rainP.push([x, z, MC.rnd(i, 3), 0.8 + MC.rnd(i, 4) * 0.4]); }
    // ---- people ----
    const TN = k.fig(B, '#d9734e', -0.05, 0, 0.6, 0.95, '#3a2418'); const phone = (() => { const g = new T3.Group(); g.position.set(0, 0, 0.04); TN.userData.hand.add(g); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), g, [0, 0.06, 0], [Math.PI / 2, 0, 0]); const scr = mesh(new T3.PlaneGeometry(0.11, 0.2), new T3.MeshBasicMaterial({ color: '#9fd0ff' }), g, [0, 0.074, 0], [-Math.PI / 2, 0, 0]); return g; })();
    const NB = k.fig(B, '#3f6fb5', 1.78, UY + 0.04, 0.25, 0.95, '#1d140f');
    const nbPh = new T3.Group(); nbPh.position.set(1.25, UY + 0.45, 0.62); B.add(nbPh); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), nbPh, [0, 0, 0], [-Math.PI / 2, 0, 0.3]);
    const nbScrM = new T3.MeshBasicMaterial({ color: '#0b0f18' }); mesh(new T3.PlaneGeometry(0.11, 0.2), nbScrM, nbPh, [0, 0.016, 0], [-Math.PI / 2, 0, 0.3]);
    const doorG = new T3.Group(); doorG.position.set(2.99, UY, 1.15); B.add(doorG);
    mesh(new T3.PlaneGeometry(0.9, 1.75), new T3.MeshBasicMaterial({ color: '#ffd9a0' }), B, [2.995, UY + 0.88, 0.7], [0, -Math.PI / 2, 0]);
    mesh(new T3.BoxGeometry(0.05, 1.75, 0.9), M.std('#6b4f3c', { roughness: 0.6 }), doorG, [0, 0.88, -0.45]);
    const PL = k.fig(B, '#e0782f', 3.6, UY, 0.6, 0.97, '#2b1d16', { cap: '#1d4734', belt: '#1d4734' });
    const tool = new T3.Group(); PL.userData.hand.add(tool); mesh(rbox(0.32, 0.18, 0.16, 0.03), M.std('#c0392b', { roughness: 0.4 }), tool, [0, -0.08, 0.05]);
    // neighbour path: sitting on the sofa → jump up (anticipation crouch) → run to the valve → turn it → step aside
    const vNB = (t) => {
      const sit = new T3.Vector3(1.78, UY + 0.04, 0.25), up0 = new T3.Vector3(1.6, UY, 0.55), at = new T3.Vector3(-0.42, UY, -1.05), aside = new T3.Vector3(-0.9, UY, -0.35);
      const j = K.nb + 0.35;
      if (t < j) return sit.clone();
      const u1 = seg(t, j, 0.25), u2 = E.io(seg(t, j + 0.2, K.hahn - 0.05 - (j + 0.2))), u3 = E.io(seg(t, K.inst - 0.2, 0.8));
      const p = sit.clone().lerp(up0, E.oc(u1)); p.lerp(at, u2); p.lerp(aside, u3);
      if (u1 > 0 && u1 < 1) p.y += Math.sin(u1 * Math.PI) * 0.18;           // hop off the sofa
      return p;
    };
    const vPL = (t) => { const a = new T3.Vector3(3.3, UY, 0.7), m = new T3.Vector3(2.4, UY, 0.55), b = new T3.Vector3(0.95, UY, -0.45); const u1 = E.io(seg(t, K.inst - 0.05, 0.45)), u2 = E.io(seg(t, K.inst + 0.35, 0.8)); return a.lerp(m, u1).lerp(b, u2); };
    // ---- camera (anticipation / overshoot eases on every big move) ----
    const P = (a, r, h, tx, ty, tz) => () => ({ a, r, h, tx, ty, tz });
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.4, 6.9, 1.2, 0.35, 1.5, -1.0)],
      [K.drip + 0.6, P(0.34, 6.0, 1.05, 0.45, 1.35, -0.95), A6],
      [K.oben - 0.05, P(0.3, 5.8, 1.1, 0.5, 1.4, -0.95), E.lin],
      [K.oben + 0.75, P(0.32, 7.8, 4.5, 0.95, 3.0, -0.95), A9],
      [K.write + 0.35, P(-0.14, 6.0, 1.9, -0.15, 1.15, -0.45), A9],
      [K.turn + 0.35, P(0.0, 12.6, 3.3, 0.2, 2.25, -0.8), A6],
      [K.nb + 0.25, P(0.22, 7.4, 4.1, 0.95, 3.05, -0.7), A9],
      [K.hahn - 0.05, P(-0.3, 6.4, 3.7, -0.4, 3.0, -1.2), E.io],
      [K.hahn + 0.7, P(-0.46, 6.4, 3.65, -0.5, 3.0, -1.25), A6],
      [K.inst + 0.35, P(0.2, 9.4, 4.0, 0.7, 2.9, -0.85), A9],
      [K.stop + 0.1, P(-0.18, 15.8, 4.3, 0.2, 2.3, -0.8), A6],
      [K.cta + 2.5, P(-0.1, 17.0, 4.6, 0.2, 2.3, -0.8), E.lin],
    ]);
    const FOC = new T3.Vector3(), dum = new T3.Object3D(), tmp = new T3.Vector3();
    const cWarm = new T3.Color('#ffd7a0'), tvC = new T3.Color();
    k.frame((t) => {
      // rain
      rainP.forEach(([x, z, ph, sp], i) => { const y = 9 - (((t * 1.4 * sp + ph) % 1) * 9.5); dum.position.set(x, y, z); dum.rotation.set(0, 0, 0.06); dum.scale.setScalar(1); dum.updateMatrix(); rain.setMatrixAt(i, dum.matrix); });
      rain.instanceMatrix.needsUpdate = true;
      // drips + splashes
      let lastHit = -9, hits = 0;
      drops.forEach((d) => { d.visible = false; });
      for (let n = 0; n <= nMax; n++) {
        const s0 = spawn(n), fall = s0 + FORM, hit = fall + TF;
        if (hit <= t) { hits++; lastHit = hit; }
        if (t < s0 || t > hit) continue;
        const d = drops[n % 4]; d.visible = true;
        if (t < fall) { const g = seg(t, s0, FORM); d.position.set(DX, 2.07 - 0.04 * g, DZ); d.scale.set(0.6 + 0.5 * g, 0.5 + 0.9 * g, 0.6 + 0.5 * g); }
        else { const a = t - fall, v = 9.8 * a; d.position.set(DX, 2.03 - 0.5 * 9.8 * a * a, DZ); d.scale.set(0.85, 1 + Math.min(1.6, v * 0.25), 0.85); }       // stretch with speed
      }
      const wl = WY0 + (WY1 - WY0) * clamp(hits / Math.max(1, nMax));
      water.position.y = wl; const wob = MC.wob(t, lastHit, 4, 6) * 0.004; water.position.y += wob;
      crowns.forEach((c, i) => { c.visible = false; });
      let ci = 0; for (let n = Math.max(0, hits - 2); n < hits; n++) { const hit = spawn(n) + FORM + TF, a = t - hit; if (a > 0.32) continue; const c = crowns[ci++ % 4]; c.visible = true; const u = a / 0.32; c.position.set(DX, 0.03 + wl + 0.02 + u * 0.05, DZ); c.scale.set(0.05 + 0.14 * E.oc(u), 0.05 + 0.14 * E.oc(u), 0.4 * (1 - u)); c.material.opacity = 0.85 * (1 - u); }
      for (let i = 0; i < splN; i++) {
        const n = hits - 1 - Math.floor(i / 6), hit = spawn(Math.max(0, n)) + FORM + TF, a = t - hit;
        if (n < 0 || a < 0 || a > 0.35) { dum.scale.setScalar(0); }
        else { const ang = (i % 6) / 6 * Math.PI * 2 + n, vh = 0.5 + MC.rnd(i, n) * 0.5, vy = 1.3 + MC.rnd(n, i) * 0.8; dum.position.set(DX + Math.cos(ang) * vh * a, 0.03 + wl + vy * a - 4.9 * a * a, DZ + Math.sin(ang) * vh * a); dum.scale.setScalar(1 - a / 0.35); }
        dum.updateMatrix(); spl.setMatrixAt(i, dum.matrix);
      }
      spl.instanceMatrix.needsUpdate = true;
      const stR = 0.25 + 0.45 * E.oc(seg(t, -1, K.hahn + 1)) * (1 - 0.12 * E.io(seg(t, K.stop, 0.8)));
      stain.scale.setScalar(stR); stainRing.scale.setScalar(stR); stainM.opacity = 0.85 * (1 - 0.45 * E.io(seg(t, K.stop, 0.9)));
      const pr = 0.12 + 0.5 * clamp(hits / Math.max(1, nMax)); puddle.scale.setScalar(pr);
      // spray from the burst pipe (dies when the valve closes)
      const flow = 1 - E.io(seg(t, K.hahn + 0.25, 0.6));
      for (let i = 0; i < sprN; i++) {
        const life = 0.42, ph = MC.rnd(i, 9), a = ((t / life + ph) % 1) * life, born = t - a;
        const alive = MC.rnd(i, Math.floor(t / life + ph)) < (born < K.hahn + 0.25 ? 1 : flow);
        if (!alive) { dum.scale.setScalar(0); }
        else { const sx = (MC.rnd(i, 1) - 0.5) * 2.0, sy = 0.6 + MC.rnd(i, 2) * 1.8, sz = 1.4 + MC.rnd(i, 3) * 1.6; dum.position.set(CRACK.x + sx * a, CRACK.y + sy * a - 4.9 * a * a, CRACK.z + sz * a); const v = Math.hypot(sx, sy - 9.8 * a, sz); dum.scale.set(0.9, 0.9, 1.2 + v * 0.9); dum.lookAt(B.localToWorld(tmp.set(CRACK.x + sx, CRACK.y + sy - 9.8 * a, CRACK.z + sz))); }
        dum.updateMatrix(); spr.setMatrixAt(i, dum.matrix);
      }
      spr.instanceMatrix.needsUpdate = true;
      upPud.scale.setScalar(0.5 + 0.75 * E.oc(seg(t, -1, K.hahn + 1.5)));
      mist.material.opacity = 0.75 * flow * (0.85 + 0.15 * Math.sin(t * 23)); mist.scale.setScalar(0.8 + 0.15 * Math.sin(t * 17));
      doorG.rotation.y = -antMove(t, K.inst - 0.25, 0.5, 0, 1.6, 0.8) * (1 - E.io(seg(t, K.inst + 1.2, 0.5)));
      // valve: wind back a little (anticipation), spin shut with overshoot
      wheel.rotation.z = -antMove(t, K.hahn, 0.9, 0, Math.PI * 3.2, 0.9);
      // neighbour phone buzz + people
      const buzz = t > K.nb - 0.05 && t < K.nb + 0.9;
      nbScrM.color.set(buzz ? '#9fd0ff' : '#0b0f18'); nbPh.position.y = UY + 0.45 + (buzz ? Math.abs(Math.sin(t * 60)) * 0.02 : 0); nbPh.rotation.z = buzz ? Math.sin(t * 70) * 0.08 : 0;
      const seated = t < K.nb + 0.35;
      const crouch = seated ? -0.12 * Math.exp(-Math.pow((t - (K.nb + 0.25)) / 0.08, 2)) : 0;           // anticipation squash before the jump
      k.drive(NB, t, vNB, { face: seated ? Math.PI / 2 : -Math.PI * 0.62, cad: 13, squash: crouch, lean: t > K.hahn - 0.1 && t < K.inst - 0.2 ? 0.35 : 0, armR: t > K.hahn - 0.15 && t < K.inst - 0.25 ? -1.4 + Math.sin(t * 9) * 0.25 : undefined, armL: t > K.hahn - 0.15 && t < K.inst - 0.25 ? -1.3 - Math.sin(t * 9) * 0.25 : undefined, look: seated && t < K.nb ? 0.2 * Math.sin(t * 0.8) : 0 });
      const phoneUp = MC.spring(t, K.write - 0.65, 2.0, 0.38);
      k.drive(TN, t, () => new T3.Vector3(-0.05, 0, 0.6), { face: 0.35 + 0.5 * E.io(seg(t, K.drip - 0.3, 0.6)) * (1 - phoneUp), armR: -0.25 - 1.15 * phoneUp, armL: -0.15 * phoneUp, nod: 0.35 * phoneUp - 0.25 * E.io(seg(t, K.drip - 0.2, 0.5)) * (1 - phoneUp), squash: 0.03 * MC.wob(t, K.drip + 0.15, 3, 5) });
      const plKneel = E.io(seg(t, K.inst + 0.95, 0.35));
      k.drive(PL, t, vPL, { face: -Math.PI * 0.85, lift: -0.22 * plKneel, lean: 0.55 * plKneel, armR: t > K.inst + 1.1 ? -1.5 + Math.sin(t * 14) * 0.35 : undefined, armL: -0.3 });
      PL.visible = t > K.inst - 0.1;
      newPipe.material.emissiveIntensity = 1.6 * E.io(seg(t, K.inst + 1.25, 0.3)) * (1 - 0.6 * E.io(seg(t, K.stop, 0.8)));
      // lights: TVs flicker, warm interior
      tvC.setHSL(0.6, 0.6, 0.55 + 0.12 * Math.sin(t * 11) * Math.sin(t * 4.3)); tvM.color.copy(tvC); tv2.color.copy(tvC); tvL2.intensity = 1.0 + 0.4 * Math.sin(t * 11);
      // camera + depth of field
      const c = camT(t); k.shoot(c, t, 1);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: 0.045 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    k.popIn(m1, K.write - 0.3); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.nb - 0.12); k.popOut(m2, K.nb - 0.06);
    sfx('send', K.write - 0.25, -13); sfx('pop', K.ans + 0.1, -12);
    const bx = (y0) => (t) => { const [x, y] = k.proj(B.localToWorld(new T3.Vector3(TN.position.x, 1.35, TN.position.z))); return [clamp(x + 90, 330, 750), y + y0]; };
    perFrame((t) => { const [x, y0] = bx(-560)(t), y = clamp(y0, 200, 900); m1.style.left = x + 'px'; m1.style.top = y + 'px'; m2.style.left = x + 'px'; m2.style.top = (y + 170) + 'px'; });
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulse = ov('tdpulse', ''); tl.set(pulse, { autoAlpha: 0 }, 0); tl.fromTo(pulse, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.nb - 0.15);
    cd.line(0, K.nb + 0.05); cd.line(1, K.hahn + 0.3); cd.line(2, K.inst + 0.2);
    k.popOut(cd.c, K.stop - 0.05, { y: -80 });
    // buzz rings on the neighbour's phone, valve tag, time tag, final tag
    const rings = [0, 1, 2].map(() => ov('tdring', '')); rings.forEach((g, i) => { tl.set(g, { autoAlpha: 0 }, 0); tl.fromTo(g, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 1.6, duration: 0.6, ease: 'power2.out', immediateRender: false }, K.nb + i * 0.18); });
    sfx('buzz', K.nb, -12); sfx('thud', K.nb + 0.45, -16); sfx('whoosh', K.oben, -15); sfx('drip', firstHit, -10); sfx('drip', firstHit + PER, -14); sfx('drip', firstHit + 2 * PER, -16);
    const vt = ov('tdtag warn', '🔴 ' + S.valve); k.popIn(vt, K.hahn - 0.05, { y: 30 }); k.popOut(vt, K.inst, { y: -40 });
    const tt = ov('tdtag', S.time); k.popIn(tt, K.inst + 0.1, { y: 30 }); k.popOut(tt, K.stop - 0.05, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.stop + 0.15, { y: 40 }); sfx('chime', K.stop + 0.15, -12); sfx('kaching', K.hahn + 0.85, -14);
    perFrame(() => {
      const [px, py] = k.proj(B.localToWorld(new T3.Vector3(1.25, UY + 0.5, 0.62))); rings.forEach((g) => { g.style.left = px + 'px'; g.style.top = py + 'px'; });
      const [vx, vy] = k.proj(B.localToWorld(new T3.Vector3(-0.75, UY + 0.95, -1.45))); vt.style.left = clamp(vx, 220, 860) + 'px'; vt.style.top = vy + 'px';
      const [lx, ly] = k.proj(B.localToWorld(new T3.Vector3(PL.position.x, UY + 1.65, PL.position.z))); tt.style.left = clamp(lx, 220, 860) + 'px'; tt.style.top = ly + 'px';
      const [ox, oy] = k.proj(B.localToWorld(new T3.Vector3(0.3, 4.75, 0))); okT.style.left = clamp(ox, 260, 820) + 'px'; okT.style.top = oy + 'px';
    });
    k.finish(K.cta + 0.3, K.cta + 0.6, [S.end, null]);
    return { T: END + 0.9, K };
  }

  // ================= X53 (TDX): 23:00, snow, tenant walks home (footprints), pats pockets, rattles the locked door → keys glint on the table inside →
  // writes → Tenance KI answers → locksmith van drives in (headlights, nose-dip brake) → door opens, warm light floods out → landlord sleeps on =================
  function X53() {
    const de = lang === 'de';
    const S = de ? { chip: '🕚 23:00 · -3 °C', m1: 'Ausgesperrt 🥶 Der Schlüssel liegt drinnen!', m2: 'Ich schicke dir einen Schlüsseldienst, Festpreis 89 € ✓', who: 'Mieter · Whg 2', ttl: 'Ausgesperrt · Whg 2', l1: '🔑 Schlüsseldienst · 89 € Festpreis', l2: '⏱️ In 20 Minuten da', l3: '🌙 Vermieter schläft weiter', key: '🔑 Schlüssel', paid: '✓ 89 € · kein Aufpreis', van: 'SCHLÜSSELDIENST', end: 'Keine *Abzocke*.' }
      : { chip: '🕚 11:00 pm · 27 °F', m1: "Locked out 🥶 My keys are inside!", m2: "I'm sending a locksmith, fixed price €89 ✓", who: 'Tenant · Apt 2', ttl: 'Locked out · Apt 2', l1: '🔑 Locksmith · €89 fixed price', l2: '⏱️ There in 20 minutes', l3: '🌙 Landlord keeps sleeping', key: '🔑 Keys', paid: '✓ €89 · no extras', van: 'LOCKSMITH', end: 'No *rip-off*.' };
    const K = {};
    K.snow = W(['Schnee', 'snow']).start; K.key = W(['Schlüssel', 'keys']).start; K.inside = W(['drinnen', 'inside']).start;
    K.write = W(['schreibt', 'writes']).start;
    const it = W(['Tenance']); K.turn = it.start; K.ans = W(['antwortet', 'answers'], it.i).start;
    K.ls = W(['Schlüsseldienst', 'locksmith'], it.i).start; K.price = W(['Festpreis', 'fixed'], it.i).start;
    const mn = W(['zwanzig', 'twenty'], it.i); K.min = mn.start; K.da = W(['Minuten', 'minutes'], mn.i - 1).end;
    K.nein = W(['Abzocke', 'rip-off'], it.i).start; K.call = W(['Anruf', 'call'], it.i).start; K.cta = W(['Jetzt', 'Join'], it.i).start;
    const k = TDX({ sky: 'night', envTop: '#9fb4e6', envBot: '#18203a', envInt: 0.5, fov: 32 });
    const { scene, MC, ov } = k;
    scene.add(new T3.HemisphereLight('#9fb6ff', '#2a2f40', 0.4));
    const moon = new T3.DirectionalLight('#c9d8ff', 0.75); moon.position.set(-7, 11, 9); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
    Object.assign(moon.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 45 }); moon.shadow.radius = 4; moon.shadow.bias = -0.0005; scene.add(moon);
    const D = new T3.Group(); scene.add(D);
    const snow = M.std('#eef3ff', { roughness: 0.85 });
    mesh(new T3.BoxGeometry(40, 0.12, 30), snow, D, [2, 0.06, -3]);
    mesh(new T3.BoxGeometry(40, 0.13, 1.5), M.std('#3f4552', { roughness: 0.55, metalness: 0.15 }), D, [2, 0.07, 2.95]);
    mesh(new T3.BoxGeometry(40, 0.14, 0.9), M.std('#c9d1de', { roughness: 0.8 }), D, [2, 0.075, 1.6]);
    // ---- the house: facade with a door opening and the tenant's window ----
    const H = new T3.Group(); H.position.set(0, 0.12, -1.0); D.add(H);
    const fac = M.std('#e5cfb2', { roughness: 0.9 }), FZ = 1.72;
    const fb = (x0, x1, y0, y1) => mesh(new T3.BoxGeometry(x1 - x0, y1 - y0, 0.16), fac, H, [(x0 + x1) / 2, (y0 + y1) / 2, FZ]);
    fb(-2.6, -1.05, 0, 5.0); fb(-0.15, 0.7, 0, 5.0); fb(1.9, 2.6, 0, 5.0); fb(-1.05, -0.15, 1.62, 5.0); fb(0.7, 1.9, 1.55, 5.0); fb(0.7, 1.9, 0, 0.55);
    mesh(new T3.BoxGeometry(5.2, 5.0, 0.16), fac, H, [0, 2.5, -1.7]);
    [-2.6, 2.6].forEach((x) => mesh(new T3.BoxGeometry(0.16, 5.0, 3.5), fac, H, [x, 2.5, 0]));
    mesh(new T3.BoxGeometry(5.3, 0.14, 3.6), M.std('#cbb498'), H, [0, 1.95, 0]);
    const rs = new T3.Shape(); rs.moveTo(-1.95, 0); rs.lineTo(1.95, 0); rs.lineTo(0, 1.4); rs.lineTo(-1.95, 0);
    const rg = new T3.ExtrudeGeometry(rs, { depth: 5.6, bevelEnabled: false }); rg.translate(0, 0, -2.8);
    mesh(rg, M.std('#1f4a36', { roughness: 0.7 }), H, [0, 5.0, 0], [0, Math.PI / 2, 0]);
    [-1, 1].forEach((sg) => { const m = mesh(new T3.BoxGeometry(5.7, 0.14, 2.45), snow, H, [0, 5.0 + 0.7 + 0.08, sg * 0.98]); m.rotation.x = sg * 0.62; });
    // upper windows (some lit)
    [[-1.6, 3.2, 1], [-0.25, 3.2, 0], [1.3, 3.2, 1], [-1.6, 4.3, 0], [1.3, 4.3, 1]].forEach(([x, y, on]) => { mesh(new T3.BoxGeometry(0.95, 0.85, 0.06), M.std('#eef1f5'), H, [x, y, FZ + 0.09]); mesh(new T3.PlaneGeometry(0.8, 0.7), new T3.MeshBasicMaterial({ color: on ? '#ffd59a' : '#1b2640' }), H, [x, y, FZ + 0.125]); if (on) { const g = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.6 })); g.position.set(x, y, FZ + 0.5); g.scale.setScalar(1.5); H.add(g); } });
    // tenant's room behind the window: warm lamp, table, KEYS
    mesh(new T3.PlaneGeometry(1.9, 1.85), M.std('#f2d9b3', { roughness: 0.95 }), H, [1.3, 0.95, 0.35]);
    mesh(new T3.PlaneGeometry(1.4, 1.85), M.std('#e9cda4', { roughness: 0.95 }), H, [0.42, 0.95, 1.0], [0, Math.PI / 2, 0]);
    mesh(new T3.PlaneGeometry(1.4, 1.85), M.std('#e9cda4', { roughness: 0.95 }), H, [2.2, 0.95, 1.0], [0, -Math.PI / 2, 0]);
    mesh(new T3.PlaneGeometry(1.9, 1.4), M.std('#a77a52', { roughness: 0.7 }), H, [1.3, 0.02, 1.0], [-Math.PI / 2, 0, 0]);
    mesh(new T3.CylinderGeometry(0.42, 0.42, 0.05, 28), M.std('#7a5338', { roughness: 0.5 }), H, [1.3, 0.62, 1.05]);
    mesh(new T3.CylinderGeometry(0.05, 0.08, 0.6, 12), M.std('#5a3d29'), H, [1.3, 0.3, 1.05]);
    const keys = new T3.Group(); keys.position.set(1.3, 0.66, 1.1); keys.scale.setScalar(1.7); H.add(keys);
    const gold = M.std('#e8b44f', { metalness: 0.95, roughness: 0.2, emissive: new T3.Color('#e09b6b'), emissiveIntensity: 0.25 });
    mesh(new T3.TorusGeometry(0.06, 0.012, 8, 24), gold, keys, [0, 0, 0], [Math.PI / 2, 0, 0]);
    [[0.06, 0.4], [0.03, -0.5]].forEach(([dx, r]) => { const kg = new T3.Group(); kg.position.set(dx, 0, 0.05); kg.rotation.y = r; keys.add(kg); mesh(new T3.CylinderGeometry(0.035, 0.035, 0.012, 16), gold, kg, [0, 0, 0]); mesh(new T3.BoxGeometry(0.02, 0.01, 0.14), gold, kg, [0, 0, 0.09]); });
    const glint = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, color: '#ffe6a8' })); glint.position.set(1.32, 0.72, 1.12); H.add(glint);
    const roomL = new T3.PointLight('#ffc27a', 2.2, 4); roomL.position.set(1.0, 1.5, 1.0); H.add(roomL);
    const wfm = M.std('#eef1f5'); [[1.3, 0.55, 1.28, 0.08], [1.3, 1.55, 1.28, 0.08], [0.7, 1.05, 0.08, 1.08], [1.9, 1.05, 0.08, 1.08]].forEach(([x, y, w, h]) => mesh(new T3.BoxGeometry(w, h, 0.1), wfm, H, [x, y, FZ + 0.02]));
    mesh(new T3.BoxGeometry(1.4, 0.06, 0.22), wfm, H, [1.3, 0.52, FZ + 0.1]); mesh(new T3.BoxGeometry(1.3, 0.05, 0.16), snow, H, [1.3, 0.57, FZ + 0.12]);
    mesh(new T3.PlaneGeometry(1.2, 1.0), new T3.MeshPhysicalMaterial({ color: '#cfe0ff', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false }), H, [1.3, 1.05, FZ + 0.07]);
    // door (pivot on its left edge) + hallway light behind it
    const door = new T3.Group(); door.position.set(-1.05, 0, FZ + 0.03); H.add(door);
    mesh(new T3.BoxGeometry(0.9, 1.6, 0.08), M.std('#4b3428', { roughness: 0.55 }), door, [0.45, 0.8, 0]);
    const handle = mesh(new T3.BoxGeometry(0.14, 0.035, 0.05), M.std('#e09b6b', { metalness: 0.85, roughness: 0.25 }), door, [0.78, 0.82, 0.07]);
    mesh(new T3.PlaneGeometry(0.9, 1.6), new T3.MeshBasicMaterial({ color: '#ffcf8a' }), H, [-0.6, 0.8, FZ - 0.06]);
    mesh(new T3.BoxGeometry(0.12, 0.2, 0.1), M.std('#2b313c', { metalness: 0.5 }), H, [-1.28, 1.75, FZ + 0.12]); mesh(new T3.SphereGeometry(0.07, 12, 8), new T3.MeshBasicMaterial({ color: '#ffe0a8' }), H, [-1.28, 1.72, FZ + 0.2]);
    const sc = new T3.PointLight('#ffc47e', 1.6, 4.5); sc.position.set(-1.28, 1.7, FZ + 0.45); H.add(sc); const scG = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.8 })); scG.position.set(-1.28, 1.72, FZ + 0.25); scG.scale.setScalar(0.9); H.add(scG);
    const hallL = new T3.PointLight('#ffb76b', 0, 5); hallL.position.set(-0.6, 1.3, FZ + 0.15); H.add(hallL);
    mesh(new T3.BoxGeometry(1.2, 0.08, 0.5), M.std('#cbb498'), H, [-0.6, 1.72, FZ + 0.2]);
    // street lamp, pines, landlord's house (dark), snowfall
    const lamp = new T3.Group(); lamp.position.set(-3.4, 0.12, 1.0); D.add(lamp);
    mesh(new T3.CylinderGeometry(0.06, 0.08, 3.0, 10), M.std('#2b313c', { metalness: 0.5 }), lamp, [0, 1.5, 0]);
    mesh(new T3.SphereGeometry(0.2, 16, 12), new T3.MeshBasicMaterial({ color: '#ffe0a8' }), lamp, [0, 3.05, 0]);
    const ll = new T3.PointLight('#ffcf8a', 2.4, 8); ll.position.set(-3.4, 3.0, 1.0); D.add(ll);
    const lg = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false })); lg.position.set(-3.4, 3.05, 1.0); lg.scale.setScalar(2.4); D.add(lg);
    const pine = (x, z, s) => { const g = new T3.Group(); g.position.set(x, 0.12, z); g.scale.setScalar(s); D.add(g); mesh(new T3.CylinderGeometry(0.12, 0.16, 0.6, 8), M.std('#4a3326'), g, [0, 0.3, 0]); [[0.95, 1.2, 0.9], [0.75, 1.0, 1.55], [0.5, 0.8, 2.15]].forEach(([r, h, y]) => { mesh(new T3.ConeGeometry(r, h, 10), M.std('#24463a', { roughness: 0.9 }), g, [0, y, 0]); mesh(new T3.ConeGeometry(r * 0.8, h * 0.42, 10), snow, g, [0, y + h * 0.24, 0]); }); };
    pine(-4.4, -1.2, 1.15); pine(-5.6, 0.6, 0.9); pine(3.6, -2.4, 1.0); pine(8.6, -2.0, 1.1); pine(9.6, 0.3, 0.8);
    const LH = new T3.Group(); LH.position.set(6.3, 0.12, -1.2); D.add(LH);
    mesh(new T3.BoxGeometry(3.0, 2.4, 2.6), M.std('#d8c6ad', { roughness: 0.9 }), LH, [0, 1.2, 0]);
    const ls2 = new T3.Shape(); ls2.moveTo(-1.65, 0); ls2.lineTo(1.65, 0); ls2.lineTo(0, 1.1); ls2.lineTo(-1.65, 0);
    const lrg = new T3.ExtrudeGeometry(ls2, { depth: 2.9, bevelEnabled: false }); lrg.translate(0, 0, -1.45);
    mesh(lrg, M.std('#1f4a36', { roughness: 0.7 }), LH, [0, 2.4, 0]);
    [-1, 1].forEach((sg) => { const m = mesh(new T3.BoxGeometry(1.95, 0.12, 3.0), snow, LH, [sg * 0.8, 2.4 + 0.6, 0]); m.rotation.z = -sg * 0.59; });
    [-0.7, 0.7].forEach((x) => { mesh(new T3.BoxGeometry(0.8, 0.7, 0.06), M.std('#eef1f5'), LH, [x, 1.3, 1.32]); mesh(new T3.PlaneGeometry(0.66, 0.56), new T3.MeshBasicMaterial({ color: x > 0 ? '#34508f' : '#141c30' }), LH, [x, 1.3, 1.36]); });
    const nl = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, color: '#6f8fe0', opacity: 0.45 })); nl.position.set(0.7, 1.3, 1.5); nl.scale.setScalar(1.1); LH.add(nl);
    mesh(new T3.BoxGeometry(0.7, 1.3, 0.06), M.std('#3a2a22'), LH, [0, 0.65, 1.32]);
    const snowT = k.snowfall(900, [26, 13, 16], 0.85);
    // footprints along the tenant's walk
    const fpM = new T3.MeshStandardMaterial({ color: '#b9c4d8', roughness: 0.9, transparent: true, opacity: 0.8, depthWrite: false });
    const fpN = 18, fps = [...Array(fpN)].map(() => mesh(new T3.CircleGeometry(0.07, 12), fpM, D, [0, 0.135, 0], [-Math.PI / 2, 0, 0]));
    // ---- van (drives in from the right, brakes with a nose dip) ----
    const V = new T3.Group(); V.position.set(16, 0.12, 2.95); V.rotation.y = Math.PI; D.add(V);
    const vb = new T3.Group(); V.add(vb);
    mesh(rbox(1.8, 1.0, 0.9, 0.08), M.std('#faf6ee', { roughness: 0.45 }), vb, [-0.25, 0.72, 0]);
    mesh(rbox(0.7, 0.74, 0.88, 0.08), M.std('#faf6ee', { roughness: 0.45 }), vb, [0.95, 0.58, 0]);
    mesh(new T3.BoxGeometry(0.05, 0.38, 0.72), M.std('#22304a', { roughness: 0.1, metalness: 0.4 }), vb, [1.31, 0.76, 0]);
    mesh(new T3.BoxGeometry(2.5, 0.13, 0.92), M.std('#e09b6b', { roughness: 0.5 }), vb, [0.1, 0.45, 0]);
    const wheels = [[-0.65, 0.47], [0.9, 0.47], [-0.65, -0.47], [0.9, -0.47]].map(([x, z]) => mesh(new T3.CylinderGeometry(0.18, 0.18, 0.13, 18), M.std('#1a1a1a'), V, [x, 0.18, z], [Math.PI / 2, 0, 0]));
    const vt = textPlane((x, w, h) => { x.fillStyle = '#14261b'; let fs = 62; x.font = `700 ${fs}px Clash`; while (x.measureText(S.van).width > w - 30 && fs > 28) { fs -= 2; x.font = `700 ${fs}px Clash`; } x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(S.van, w / 2, h / 2 + 3); }, 512, 96, 1.5, 0.28);
    vt.position.set(-0.25, 0.85, -0.47); vt.rotation.y = Math.PI; vb.add(vt);
    const hlG = [0.27, -0.27].map((z) => { const g = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, color: '#fff3d0' })); g.position.set(1.34, 0.5, z); g.scale.setScalar(0.9); vb.add(g); return g; });
    const beam = new T3.SpotLight('#fff1d0', 0, 14, 0.45, 0.6); beam.position.set(1.3, 0.55, 0); vb.add(beam); const bt = new T3.Object3D(); bt.position.set(6, -0.4, 0); vb.add(bt); beam.target = bt;
    // ---- people ----
    const TN = k.fig(D, '#3f8fd2', -2.7, 0.12, 1.75, 0.95, '#2b1d16');
    const scarf = mesh(new T3.TorusGeometry(0.17, 0.05, 8, 20), M.std('#c0392b', { roughness: 0.9 }), TN.userData.B, [0, 0.92, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const LS = k.fig(D, '#2c3e66', 2.1, 0.12, 2.3, 0.97, '#e09b6b', { cap: '#e09b6b', belt: '#e09b6b' });
    const kit = new T3.Group(); LS.userData.hand.add(kit); mesh(rbox(0.3, 0.2, 0.12, 0.03), M.std('#222831', { roughness: 0.4 }), kit, [0, -0.1, 0.04]);
    const puffs = [0, 1, 2].map(() => mesh(new T3.SphereGeometry(0.07, 10, 8), new T3.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }), D, [0, 0, 0]));
    const DOOR = new T3.Vector3(-0.6, 0.12, 1.05), WIN = new T3.Vector3(0.42, 0.12, 1.25);
    const tArr = Math.min(K.snow + 0.7, K.key - 0.6);
    const vTN = (t) => {
      const a = new T3.Vector3(-2.7, 0.12, 1.75), b = new T3.Vector3(DOOR.x + 0.1, 0.12, DOOR.z + 0.1);
      const p = a.lerp(b, E.io(seg(t, 0, tArr)));
      p.lerp(WIN, E.io(seg(t, K.key - 0.35, 0.6)));
      p.lerp(new T3.Vector3(-0.1, 0.12, 1.55), E.io(seg(t, K.min + 0.2, 0.7)));
      p.lerp(new T3.Vector3(DOOR.x, 0.12, DOOR.z - 0.9), E.io(seg(t, K.nein + 0.55, 0.9)));
      return p;
    };
    const stopX = 2.7, tStop = K.da - 0.15;
    const vVan = (t) => { const u = seg(t, K.ls + 0.2, tStop - (K.ls + 0.2)); return lerp(16, stopX, 1 - Math.pow(1 - u, 2.6)); };
    const vLS = (t) => { const a = new T3.Vector3(2.1, 0.12, 2.3), b = new T3.Vector3(DOOR.x + 0.25, 0.12, DOOR.z + 0.45); return a.lerp(b, E.io(seg(t, tStop + 0.35, K.nein - 0.05 - (tStop + 0.35)))); };
    const fpT = [...Array(fpN)].map((_, i) => 0.15 + i * (tArr - 0.2) / fpN);
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz) => () => ({ a, r, h, tx, ty, tz });
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(-0.26, 8.4, 1.7, -1.55, 1.2, 1.1)],
      [K.snow + 0.5, P(-0.18, 7.4, 1.9, -0.7, 1.3, 0.8), A6],
      [K.key - 0.05, P(0.08, 6.6, 1.75, 0.75, 1.15, 0.7), E.io],
      [K.inside + 0.35, P(0.09, 2.25, 1.22, 1.3, 0.8, 0.1), A9],
      [K.write + 0.25, P(-0.28, 6.0, 2.0, 0.6, 1.35, 0.9), A9],
      [K.turn + 0.3, P(0.0, 12.0, 3.4, 0.6, 1.8, 0.6), A6],
      [K.ls + 0.45, P(0.42, 14.0, 3.3, 3.6, 1.2, 2.2), A9],
      [tStop + 0.3, P(0.16, 10.8, 2.6, 1.0, 1.15, 1.8), E.io],
      [K.nein + 0.2, P(-0.18, 7.0, 2.1, -0.4, 1.35, 1.0), A6],
      [K.call + 0.2, P(0.32, 9.5, 3.0, 5.8, 1.45, -0.6), A9],
      [K.cta + 2.5, P(0.12, 19.0, 5.0, 2.6, 1.8, 0.0), A6],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3();
    k.frame((t) => {
      snowT(t);
      // tenant: walk, pat pockets (anticipation), rattle the door, peek, phone up, shiver
      const pat = t > tArr && t < K.key - 0.4 ? Math.sin((t - tArr) * 22) : 0;
      const phoneUp = MC.spring(t, K.write - 0.6, 1.9, 0.4) * (1 - E.io(seg(t, K.min + 0.15, 0.4)));
      const shiver = t > K.key && t < K.nein + 0.4 ? Math.sin(t * 52) * 0.02 : 0;
      k.drive(TN, t, vTN, { face: t < K.key - 0.35 ? Math.PI : (t < K.min + 0.2 ? Math.PI * 0.8 : (t < K.nein + 0.5 ? Math.PI * 0.95 : Math.PI)), armR: pat ? -0.5 + pat * 0.35 : -0.2 - 1.2 * phoneUp, armL: pat ? -0.5 - pat * 0.35 : undefined, tilt: shiver, nod: 0.35 * phoneUp + (t > K.key - 0.3 && t < K.write - 0.6 ? 0.25 : 0) });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      // door handle rattle (follow-through wobble), door swing with anticipation + overshoot, warm light floods out
      handle.rotation.z = 0.45 * MC.wob(t, tArr + 0.15, 7, 4) + 0.3 * MC.wob(t, tArr + 0.55, 7, 4);
      door.rotation.y = -antMove(t, K.nein + 0.05, 0.7, 0, 1.7, 1.1); door.position.x = -1.05 + 0.012 * MC.wob(t, tArr + 0.15, 9, 5);
      hallL.intensity = 2.0 * E.io(seg(t, K.nein + 0.1, 0.5));
      // keys glint + tiny swing
      glint.material.opacity = 0.35 + 0.65 * Math.max(0, Math.sin((t - K.key) * 6)) * E.io(seg(t, K.key - 0.2, 0.4)); glint.scale.setScalar(0.25 + 0.2 * Math.sin(t * 5));
      keys.rotation.y = 0.15 * Math.sin(t * 1.3);
      // breath puffs
      const tp = TN.position;
      puffs.forEach((p, i) => { const u = ((t * 0.8 + i / 3) % 1); p.position.set(tp.x + Math.sin(TN.rotation.y) * (0.2 + u * 0.25), 1.27 + u * 0.3, tp.z + Math.cos(TN.rotation.y) * (0.2 + u * 0.25)); p.scale.setScalar(0.5 + u * 1.6); p.material.opacity = t > 0.8 ? (1 - u) * 0.6 : 0; });
      // footprints appear behind each step and slowly fill with snow
      fps.forEach((f, i) => { const ti = fpT[i]; const p = vTN(ti); f.visible = t > ti; f.position.set(p.x + (i % 2 ? 0.09 : -0.09), 0.135, p.z); f.scale.set(1, 1.5, 1); fpM.opacity = 0.75; });
      // van: drive, decelerate, nose dip on braking (anticipation of the stop) and rebound
      const vx = vVan(t); V.position.x = vx; V.visible = t > K.ls;
      const brake = MC.wob(t, tStop, 1.6, 4.5); vb.rotation.z = 0.06 * brake; vb.position.y = -0.03 * Math.abs(brake);
      const spd = (vVan(t - 0.03) - vVan(t + 0.03)) / 0.06; wheels.forEach((w) => { w.rotation.y = -t * spd * 5; });
      const hlOn = t > K.ls ? 1 - E.io(seg(t, tStop + 0.5, 0.4)) : 0; beam.intensity = 18 * hlOn; hlG.forEach((g) => { g.material.opacity = hlOn; });
      // locksmith: hop out (squash anticipation), walk to the door, kneel at the lock
      const crouch = -0.12 * Math.exp(-Math.pow((t - (tStop + 0.22)) / 0.07, 2));
      const atDoor = E.io(seg(t, K.nein - 0.25, 0.25)) * (1 - E.io(seg(t, K.nein + 0.55, 0.3)));
      k.drive(LS, t, vLS, { face: Math.PI * 1.05, squash: crouch, lift: -0.2 * atDoor, lean: 0.4 * atDoor, armR: atDoor > 0.5 ? -1.4 + Math.sin(t * 16) * 0.2 : undefined });
      LS.visible = t > tStop + 0.15;
      // camera + DOF (keys sharp in the window shot)
      const c = camT(t); k.shoot(c, t, 1);
      const nearKeys = E.io(seg(t, K.key + 0.1, 0.4)) * (1 - E.io(seg(t, K.write - 0.1, 0.3)));
      FOC.set(c.tx, c.ty, c.tz).lerp(H.localToWorld(tmp.set(1.3, 0.7, 1.1)), nearKeys); k.dof = { focus: FOC, ap: 0.04 + 0.05 * nearKeys };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const keyT = ov('tdtag', S.key); k.popIn(keyT, K.inside + 0.1, { y: 30 }); k.popOut(keyT, K.write - 0.25, { y: -40 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    k.popIn(m1, K.write - 0.3); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.ls - 0.1); k.popOut(m2, K.ls - 0.04);
    sfx('send', K.write - 0.25, -13); sfx('pop', K.ans + 0.1, -12); sfx('keys', K.inside + 0.1, -12); sfx('thud', tArr + 0.15, -14); sfx('thud', tArr + 0.55, -16); sfx('shiver', K.write - 0.8, -16); sfx('wind', 0.1, -20);
    perFrame(() => {
      const [x, y0] = k.proj(D.localToWorld(new T3.Vector3(TN.position.x, 1.3, TN.position.z))), x1 = clamp(x + 60, 330, 750), y = clamp(y0 - 560, 200, 900);
      m1.style.left = x1 + 'px'; m1.style.top = y + 'px'; m2.style.left = x1 + 'px'; m2.style.top = (y + 170) + 'px';
      const [kx, ky] = k.proj(H.localToWorld(new T3.Vector3(1.3, 0.95, 1.1))); keyT.style.left = clamp(kx, 220, 860) + 'px'; keyT.style.top = ky + 'px';
    });
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulse = ov('tdpulse', ''); tl.set(pulse, { autoAlpha: 0 }, 0); tl.fromTo(pulse, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.ls - 0.05);
    cd.line(0, K.price); cd.line(1, K.min + 0.1); cd.line(2, K.call + 0.1);
    k.popOut(cd.c, K.cta - 0.05, { y: -80 });
    // 20-minute countdown ring (counts down while the van drives in)
    const tm = ov('tdtimer', '<i></i><b>20:00</b>'); tl.set(tm, { xPercent: -50 }, 0); k.popIn(tm, K.min - 0.05, { y: 40 }); k.popOut(tm, K.nein - 0.1, { y: -40 });
    const tmB = tm.querySelector('b'), tmI = tm.querySelector('i');
    perFrame((t) => { const u = seg(t, K.min, tStop - K.min); const sLeft = Math.round(1200 * (1 - u)); const lbl = u >= 1 ? '✓' : `${String(Math.floor(sLeft / 60)).padStart(2, '0')}:${String(sLeft % 60).padStart(2, '0')}`; if (tmB.textContent !== lbl) tmB.textContent = lbl; tmI.style.background = `conic-gradient(#e09b6b ${(1 - u) * 360}deg, rgba(255,255,255,.15) 0)`; });
    sfx('whoosh', K.ls + 0.3, -12); sfx('counter', K.min, -16); sfx('thud', tStop, -12);
    const paid = ov('tdtag ok', S.paid); k.popIn(paid, K.nein + 0.05, { y: 40 }); k.popOut(paid, K.call, { y: -40 }); sfx('kaching', K.nein + 0.1, -12);
    const zz = ov('tdbub zz', '💤'); k.popIn(zz, K.call + 0.25, { y: 20 }); sfx('chime', K.call + 0.3, -16);
    perFrame((t) => {
      const [px, py] = k.proj(D.localToWorld(new T3.Vector3(DOOR.x, 2.2, DOOR.z + 0.9))); paid.style.left = clamp(px, 260, 820) + 'px'; paid.style.top = py + 'px';
      const [zx, zy] = k.proj(LH.localToWorld(new T3.Vector3(0.7, 2.0, 1.3))); zz.style.left = zx + 'px'; zz.style.top = (zy - 10 * Math.sin(t * 3)) + 'px';
    });
    k.finish(K.cta + 0.3, K.cta + 0.6, [S.end, null]);
    return { T: END + 0.9, K };
  }

  // ================= X54 (TDX): bedroom cutaway at night, black mold spots creep out of the cold corner, window fogged with trickling drops → tenant wipes the glass,
  // photographs the corner (flash) → writes → Tenance KI answers → scan sweep over the corner, humidity 78 % → window swings open, fog clears, cold air flows in, humidity drops →
  // time-lapse to Thursday morning, specialist treats the corner, spots vanish → tenant + landlord share one report → waitlist =================
  function X54() {
    const de = lang === 'de';
    const S = de ? { chip: '🛏️ Schlafzimmer · Whg 3', m1: 'Schimmel in der Ecke 😟', m2: 'Foto geprüft ✓ Lüftungsplan kommt, Fachfirma ist gebucht', who: 'Mieter · Whg 3', ttl: 'Schimmel · Whg 3', l1: '🔍 Foto geprüft · Ursache Feuchte', l2: '🪟 Lüftungsplan · 3× täglich 10 Min.', l3: '🧰 Fachfirma · Do 10:00', scan: '🔍 Schimmel · 0,4 m²', hum: '💧', cal: '📅 Do · 10:00', ok: '✓ Ein Bericht für beide', rep: 'BERICHT', end: ['*Klarheit*', 'statt Streit.'] }
      : { chip: '🛏️ Bedroom · Apt 3', m1: 'Mold in the corner 😟', m2: 'Photo checked ✓ Airing plan sent, specialist booked', who: 'Tenant · Apt 3', ttl: 'Mold · Apt 3', l1: '🔍 Photo checked · cause: humidity', l2: '🪟 Airing plan · 3× daily, 10 min', l3: '🧰 Specialist · Thu 10:00 am', scan: '🔍 Mold · 0.4 m²', hum: '💧', cal: '📅 Thu · 10:00 am', ok: '✓ One report for both', rep: 'REPORT', end: ['*Clarity*,', 'not a fight.'] };
    const K = {};
    K.spot = W(['Flecken', 'spots']).start; K.corner = W(['Ecke', 'corner']).start; K.win = W(['Fenster', 'window']).start; K.fog = W(['beschlagen', 'fogged']).start;
    K.write = W(['schreibt', 'writes']).start;
    const it = W(['Tenance']); K.turn = it.start; K.ans = W(['antwortet', 'answers'], it.i).start;
    K.foto = W(['Foto', 'photo'], it.i).start; K.plan = W(['Lüftungsplan', 'airing'], it.i).start; K.firm = W(['Fachfirma', 'specialist'], it.i).start;
    K.thu = W(['Donnerstag', 'Thursday'], it.i).start; K.klar = W(['Klarheit', 'Clarity'], it.i).start; K.streit = W(['Streit', 'fight'], it.i).start; K.cta = W(['Jetzt', 'Join'], it.i).start;
    const k = TDX({ sky: 'night', envTop: '#a9b8e0', envBot: '#1a2033', envInt: 0.55, fov: 32 });
    const { scene, MC, ov } = k;
    const hemi = new T3.HemisphereLight('#a8b8ef', '#2a2632', 0.35); scene.add(hemi);
    const moon = new T3.DirectionalLight('#b9c8ff', 0.35); moon.position.set(-5, 9, 8); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
    Object.assign(moon.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 36 }); moon.shadow.radius = 4; moon.shadow.bias = -0.0005; scene.add(moon);
    const sun = new T3.DirectionalLight('#fff1d6', 0); sun.position.set(2.2, 5.0, -7.5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 }); sun.shadow.radius = 3; sun.shadow.bias = -0.0006; scene.add(sun);
    const D = new T3.Group(); scene.add(D);
    // ---- outside: sky backdrop (night → Thursday morning), far houses, light snow behind the window ----
    const skyM = new T3.MeshBasicMaterial({ color: '#16233f' }); mesh(new T3.PlaneGeometry(40, 20), skyM, D, [0, 4, -11]);
    const farWin = new T3.MeshBasicMaterial({ color: '#ffd59a' }), farM = M.std('#2a3350', { roughness: 0.9 });
    for (let i = 0; i < 9; i++) { const w = 1.4 + MC.rnd(i, 1) * 1.2, h = 2.5 + MC.rnd(i, 2) * 3, x = -6 + i * 1.6 + MC.rnd(i, 3) * 0.4, z = -7 - MC.rnd(i, 4) * 2; mesh(new T3.BoxGeometry(w, h, 1.2), farM, D, [x, h / 2 - 0.5, z]); for (let j = 0; j < 5; j++) { if (MC.rnd(i * 5 + j, 5) < 0.4) continue; mesh(new T3.PlaneGeometry(0.22, 0.3), farWin, D, [x - w / 2 + 0.3 + MC.rnd(i * 9 + j, 6) * (w - 0.6), 0.2 + MC.rnd(i * 5 + j, 7) * (h - 1.2), z + 0.61]); } }
    const snN = 160, snGeo = new T3.BufferGeometry(), snPos = new Float32Array(snN * 3); snGeo.setAttribute('position', new T3.BufferAttribute(snPos, 3));
    const snPts = new T3.Points(snGeo, new T3.PointsMaterial({ color: '#ffffff', size: 0.05, transparent: true, opacity: 0.85, depthWrite: false })); D.add(snPts);
    // ---- the room (front + right side cut away) ----
    const wallM = M.std('#efe4d2', { roughness: 0.95 }), extM = M.std('#c9b49a', { roughness: 0.9 });
    mesh(rbox(5.6, 0.24, 3.9, 0.06), M.std('#2a3142', { roughness: 0.8 }), D, [0, -0.12, 0]);
    mesh(new T3.BoxGeometry(5.2, 0.03, 3.4), M.std('#c8935f', { roughness: 0.6 }), D, [0, 0.015, 0]);
    const bw = (x0, x1, y0, y1) => mesh(new T3.BoxGeometry(x1 - x0, y1 - y0, 0.16), wallM, D, [(x0 + x1) / 2, (y0 + y1) / 2, -1.7]);
    bw(-2.68, -0.2, 0, 2.6); bw(1.0, 2.6, 0, 2.6); bw(-0.2, 1.0, 0, 0.95); bw(-0.2, 1.0, 2.05, 2.6);
    mesh(new T3.BoxGeometry(0.16, 2.6, 3.4), wallM, D, [-2.6, 1.3, 0]);
    mesh(new T3.BoxGeometry(5.36, 0.12, 0.24), extM, D, [0, 2.66, -1.7]); mesh(new T3.BoxGeometry(0.24, 0.12, 3.5), extM, D, [-2.6, 2.66, 0]);
    mesh(new T3.BoxGeometry(5.2, 0.1, 0.03), M.std('#fff7ea'), D, [0, 0.07, -1.61]); mesh(new T3.BoxGeometry(0.03, 0.1, 3.4), M.std('#fff7ea'), D, [-2.51, 0.07, 0]);
    // window: fixed frame + sill, sash hinged on the right (swings into the room), glass, fog layer, trickling drops
    const frM = M.std('#f6f3ee', { roughness: 0.5 });
    [[0.4, 0.95, 1.36, 0.08], [0.4, 2.05, 1.36, 0.08], [-0.2, 1.5, 0.08, 1.18], [1.0, 1.5, 0.08, 1.18]].forEach(([x, y, w, h]) => mesh(new T3.BoxGeometry(w, h, 0.2), frM, D, [x, y, -1.7]));
    mesh(new T3.BoxGeometry(1.5, 0.05, 0.3), frM, D, [0.4, 0.93, -1.5]);
    const sash = new T3.Group(); sash.position.set(0.98, 0, -1.66); D.add(sash);
    [[-0.58, 1.0, 1.12, 0.07], [-0.58, 2.0, 1.12, 0.07], [-1.12, 1.5, 0.06, 1.02], [-0.04, 1.5, 0.06, 1.02]].forEach(([x, y, w, h]) => mesh(new T3.BoxGeometry(w, h, 0.07), frM, sash, [x, y, 0]));
    mesh(new T3.BoxGeometry(0.04, 0.16, 0.05), M.std('#c7ccd3', { metalness: 0.8, roughness: 0.25 }), sash, [-1.06, 1.5, 0.06]);
    mesh(new T3.PlaneGeometry(1.04, 0.94), new T3.MeshPhysicalMaterial({ color: '#d6e6ff', roughness: 0.05, transparent: true, opacity: 0.14, depthWrite: false }), sash, [-0.58, 1.5, 0.0]);
    const fogC = document.createElement('canvas'); fogC.width = fogC.height = 256; const fx = fogC.getContext('2d');
    const fogBase = document.createElement('canvas'); fogBase.width = fogBase.height = 256; const fb = fogBase.getContext('2d');
    fb.fillStyle = 'rgba(226,236,248,0.62)'; fb.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) { const r = 1 + MC.rnd(i, 1) * 3.5; fb.fillStyle = `rgba(255,255,255,${0.15 + MC.rnd(i, 2) * 0.3})`; fb.beginPath(); fb.arc(MC.rnd(i, 3) * 256, MC.rnd(i, 4) * 256, r, 0, 7); fb.fill(); }
    const g0 = fb.createLinearGradient(0, 0, 0, 256); g0.addColorStop(0, 'rgba(255,255,255,0)'); g0.addColorStop(1, 'rgba(255,255,255,0.25)'); fb.fillStyle = g0; fb.fillRect(0, 0, 256, 256);
    const fogT = new T3.CanvasTexture(fogC); fogT.colorSpace = T3.SRGBColorSpace;
    const fogM = new T3.MeshBasicMaterial({ map: fogT, transparent: true, depthWrite: false, opacity: 1 });
    mesh(new T3.PlaneGeometry(1.04, 0.94), fogM, sash, [-0.58, 1.5, 0.02]);
    let wipeLast = -1;
    const drawFog = (w) => { fx.clearRect(0, 0, 256, 256); fx.globalCompositeOperation = 'source-over'; fx.drawImage(fogBase, 0, 0); if (w > 0) { fx.globalCompositeOperation = 'destination-out'; fx.lineWidth = 44; fx.lineCap = fx.lineJoin = 'round'; fx.strokeStyle = 'rgba(0,0,0,0.9)'; fx.beginPath(); const zz = [[40, 92], [150, 98], [44, 120], [158, 128], [48, 150], [150, 160], [56, 178]]; const n = w * (zz.length - 1); fx.moveTo(...zz[0]); for (let i = 1; i <= Math.ceil(n); i++) { const f = Math.min(1, n - (i - 1)); fx.lineTo(lerp(zz[i - 1][0], zz[i][0], f), lerp(zz[i - 1][1], zz[i][1], f)); } fx.stroke(); fx.globalCompositeOperation = 'source-over'; } fogT.needsUpdate = true; };
    drawFog(0);
    const dropM = new T3.MeshPhysicalMaterial({ color: '#f2f8ff', roughness: 0.0, metalness: 0.0, clearcoat: 1, transparent: true, opacity: 0.7 });
    const gd = [...Array(9)].map((_, i) => ({ m: mesh(new T3.SphereGeometry(0.006 + MC.rnd(i, 1) * 0.005, 8, 6), dropM, sash, [0, 0, 0.035]), x: -1.06 + 0.06 + MC.rnd(i, 2) * 0.92, ph: MC.rnd(i, 3) * 6, sp: 1.2 + MC.rnd(i, 4) * 1.4 }));
    const sillW = mesh(new T3.BoxGeometry(1.0, 0.006, 0.12), new T3.MeshStandardMaterial({ color: '#bcd8f5', roughness: 0.05, transparent: true, opacity: 0.6 }), D, [0.4, 0.958, -1.5]);
    // cold air wisps flowing in through the open window
    const wispTex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 32; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 128, 0); g.addColorStop(0, 'rgba(220,236,255,0)'); g.addColorStop(0.5, 'rgba(220,236,255,0.9)'); g.addColorStop(1, 'rgba(220,236,255,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(64, 16, 62, 6, 0, 0, 7); x.fill(); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; })();
    const wisps = [...Array(9)].map((_, i) => { const m = mesh(new T3.PlaneGeometry(0.9, 0.12), new T3.MeshBasicMaterial({ map: wispTex, transparent: true, depthWrite: false, opacity: 0, blending: T3.AdditiveBlending, side: T3.DoubleSide }), D, [0, 0, 0]); m.castShadow = false; return { m, ph: MC.rnd(i, 1), y: 1.1 + MC.rnd(i, 2) * 0.8, x: -0.05 + MC.rnd(i, 3) * 0.9, sw: (MC.rnd(i, 4) - 0.5) * 1.2 }; });
    // mold: soft dark spots creeping out of the cold corner (back + left wall), damp shadow behind them
    const spotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(48,56,42,0.5)'); g.addColorStop(1, 'rgba(48,56,42,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); for (let j = 0; j < 46; j++) { const rr = 40 * Math.pow(MC.rnd(j, 1), 0.8), an = MC.rnd(j, 2) * 6.283; x.fillStyle = `rgba(${16 + (j % 3) * 6},${22 + (j % 3) * 6},${18 + (j % 2) * 6},${0.75 + MC.rnd(j, 4) * 0.2})`; x.beginPath(); x.arc(64 + Math.cos(an) * rr, 64 + Math.sin(an) * rr, 2 + MC.rnd(j, 3) * 7 * (1 - rr / 50), 0, 7); x.fill(); } const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; })();
    const spotM = new T3.MeshStandardMaterial({ map: spotTex, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 });
    const damp = [[-2.12, 2.0, -1.612, 0], [-2.512, 2.0, -1.22, 1]].map(([x, y, z, w]) => { const m = mesh(new T3.PlaneGeometry(1.2, 1.3), new T3.MeshStandardMaterial({ map: spotTex, transparent: true, depthWrite: false, opacity: 0.32, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 }), D, [x, y, z], [0, w ? Math.PI / 2 : 0, 0]); m.castShadow = false; return m; });
    const spN = 170, spots = new T3.InstancedMesh(new T3.PlaneGeometry(1, 1), spotM, spN); spots.castShadow = false; D.add(spots);
    const spD = [...Array(spN)].map((_, i) => {
      const wl = i % 2, u = 0.95 * Math.pow(MC.rnd(i, 1), 1.5), v = 0.05 + 1.2 * Math.pow(MC.rnd(i, 2), 1.3), d = Math.hypot(u, v);
      const s = (0.06 + 0.16 * MC.rnd(i, 3)) * (1.15 - d / 1.6), tA = -1.0 + (d / 1.35) * (K.corner + 1.6) + MC.rnd(i, 4) * 0.25, tR = K.firm + 0.95 + MC.rnd(i, 5) * 0.5 + (1 - v / 1.3) * 0.3;
      return { p: wl ? [-2.511, 2.58 - v, -1.611 + u] : [-2.511 + u, 2.58 - v, -1.611], r: wl ? Math.PI / 2 : 0, s, tA, tR, rot: MC.rnd(i, 6) * 6 };
    });
    // scan: sweep line + bracket box over the corner
    const scanM = new T3.MeshBasicMaterial({ color: '#5ac86a', transparent: true, opacity: 0, blending: T3.AdditiveBlending, depthWrite: false });
    const scB = mesh(new T3.PlaneGeometry(1.0, 0.025), scanM, D, [-2.02, 2, -1.6]), scL = mesh(new T3.PlaneGeometry(0.95, 0.025), scanM, D, [-2.5, 2, -1.15], [0, Math.PI / 2, 0]);
    const boxM = new T3.MeshBasicMaterial({ color: '#5ac86a', transparent: true, opacity: 0, depthWrite: false });
    const brk = []; [[-2.04, 1.28, -1.605, 0, 0.98], [-2.505, 1.28, -1.16, 1, 0.92]].forEach(([x, y0, z, w, len]) => { [[0, y0], [0, 2.56]].forEach(([dx, y]) => brk.push(mesh(new T3.BoxGeometry(len, 0.018, 0.005), boxM, D, [x, y, z], [0, w ? Math.PI / 2 : 0, 0]))); });
    brk.forEach((b) => { b.castShadow = false; });
    // furniture: bed + nightstand (lamp, digital hygrometer), radiator, dresser, picture, plant, rug
    mesh(rbox(1.05, 0.34, 2.0, 0.05), M.std('#8a6a4f', { roughness: 0.6 }), D, [2.0, 0.22, -0.62]);
    mesh(rbox(1.0, 0.16, 1.9, 0.07), M.std('#f4f1ea', { roughness: 0.9 }), D, [2.0, 0.46, -0.62]);
    mesh(rbox(1.06, 0.1, 1.25, 0.05), M.std('#2f5a44', { roughness: 0.85 }), D, [2.0, 0.55, -0.25]);
    mesh(rbox(0.7, 0.14, 0.34, 0.06), M.std('#ffffff', { roughness: 0.9 }), D, [2.0, 0.6, -1.38]);
    mesh(rbox(1.1, 0.8, 0.08, 0.03), M.std('#8a6a4f', { roughness: 0.6 }), D, [2.0, 0.55, -1.6]);
    mesh(rbox(0.4, 0.5, 0.36, 0.03), M.std('#d8c3a5', { roughness: 0.7 }), D, [1.25, 0.25, -1.4]);
    mesh(new T3.CylinderGeometry(0.02, 0.05, 0.3, 10), M.std('#2b313c', { metalness: 0.5 }), D, [1.33, 0.65, -1.45]);
    mesh(new T3.ConeGeometry(0.11, 0.13, 20, 1, true), M.std('#f3e2c2', { side: T3.DoubleSide, emissive: new T3.Color('#ffcf8a'), emissiveIntensity: 0.6 }), D, [1.33, 0.82, -1.45]);
    const lampL = new T3.PointLight('#ffc27a', 2.6, 6); lampL.position.set(1.3, 0.95, -1.2); D.add(lampL);
    const lampG = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false })); lampG.position.set(1.33, 0.82, -1.4); lampG.scale.setScalar(0.9); D.add(lampG);
    const hyg = new T3.Group(); hyg.position.set(1.14, 0.5, -1.33); hyg.rotation.y = 0.35; D.add(hyg);
    mesh(rbox(0.16, 0.12, 0.05, 0.015), M.std('#f6f3ee', { roughness: 0.5 }), hyg, [0, 0.06, 0]);
    const hygScr = new T3.MeshBasicMaterial({ color: '#e74c3c' }); mesh(new T3.PlaneGeometry(0.12, 0.07), hygScr, hyg, [0, 0.065, 0.026]);
    const rad = new T3.Group(); rad.position.set(0.4, 0.12, -1.56); D.add(rad);
    for (let i = 0; i < 9; i++) mesh(new T3.BoxGeometry(0.1, 0.55, 0.08), M.std('#f6f3ee', { roughness: 0.4 }), rad, [-0.48 + i * 0.12, 0.28, 0]);
    mesh(rbox(0.42, 0.8, 0.9, 0.03), M.std('#b98c63', { roughness: 0.6 }), D, [-2.3, 0.4, 0.6]);
    mesh(new T3.BoxGeometry(0.03, 0.42, 0.52), M.std('#2b2b2b'), D, [-2.5, 1.55, 0.6]); mesh(new T3.PlaneGeometry(0.44, 0.34), M.std('#7fa9d8', { roughness: 0.7 }), D, [-2.48, 1.55, 0.6], [0, Math.PI / 2, 0]);
    mesh(new T3.BoxGeometry(0.4, 0.32, 0.03), M.std('#2b2b2b'), D, [-1.15, 1.55, -1.6]); mesh(new T3.PlaneGeometry(0.33, 0.25), M.std('#e09b6b', { roughness: 0.7 }), D, [-1.15, 1.55, -1.58]);
    const plant = (x, y, z, s) => { const g = new T3.Group(); g.position.set(x, y, z); g.scale.setScalar(s); D.add(g); mesh(new T3.CylinderGeometry(0.16, 0.12, 0.3, 16), M.std('#c86b3c'), g, [0, 0.15, 0]); [[0, 0.55, 0, 0.26], [0.13, 0.45, 0.06, 0.2], [-0.12, 0.47, -0.05, 0.19]].forEach(([a, b, c, r]) => mesh(new T3.SphereGeometry(r, 14, 10), M.std('#3d7a4f', { roughness: 0.8 }), g, [a, b, c])); };
    plant(-2.25, 0.8, 0.95, 0.6); plant(-2.1, 0.02, 1.35, 1.0);
    mesh(new T3.CircleGeometry(1.0, 40), M.std('#d9b48a', { roughness: 0.95 }), D, [0.1, 0.035, 0.15], [-Math.PI / 2, 0, 0]);
    const fillL = new T3.PointLight('#ffd9a8', 1.5, 8); fillL.position.set(0.2, 2.2, 1.4); D.add(fillL);
    const flashL = new T3.PointLight('#ffffff', 0, 6); D.add(flashL);
    // ---- people ----
    const TN = k.fig(D, '#8a5cc7', -1.1, 0, -0.85, 0.95, '#3a2418');
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const SP = k.fig(D, '#2a6f86', -1.8, 0, -0.95, 0.97, '#e09b6b', { cap: '#e09b6b', belt: '#e09b6b' });
    const bottle = new T3.Group(); SP.userData.hand.add(bottle); mesh(new T3.CylinderGeometry(0.045, 0.05, 0.2, 12), M.std('#f6f3ee', { roughness: 0.4 }), bottle, [0, -0.05, 0.06]); mesh(new T3.BoxGeometry(0.05, 0.06, 0.08), M.std('#e09b6b'), bottle, [0, 0.07, 0.09]);
    const sprN = 60, spr = new T3.InstancedMesh(new T3.SphereGeometry(0.012, 6, 5), new T3.MeshStandardMaterial({ color: '#e6f2ff', roughness: 0.1, transparent: true, opacity: 0.8 }), sprN); spr.castShadow = false; D.add(spr);
    const LL = k.fig(D, '#1d4734', 1.35, 0, 0.45, 1.02, '#9a9a9a');
    const rep = new T3.Group(); rep.position.set(0.85, 1.4, 0.48); D.add(rep);
    mesh(rbox(0.42, 0.3, 0.025, 0.03), M.std('#14261b', { roughness: 0.4 }), rep, [0, 0, 0]);
    const repT = textPlane((x, w, h) => { x.fillStyle = '#faf6ee'; x.beginPath(); x.roundRect(6, 6, w - 12, h - 12, 22); x.fill(); x.fillStyle = '#5ac86a'; x.beginPath(); x.arc(w / 2, 112, 62, 0, 7); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 18; x.lineCap = 'round'; x.beginPath(); x.moveTo(w / 2 - 28, 112); x.lineTo(w / 2 - 6, 136); x.lineTo(w / 2 + 32, 88); x.stroke(); x.fillStyle = '#14261b'; x.font = '700 44px Clash'; x.textAlign = 'center'; x.fillText(S.rep, w / 2, 236); x.fillStyle = '#c9b49a'; [262, 284].forEach((y) => x.fillRect(70, y, w - 140, 9)); }, 320, 300, 0.38, 0.27);
    repT.position.z = 0.014; rep.add(repT); const repG = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, color: '#bff0c4' })); repG.scale.setScalar(0.9); rep.add(repG);
    // tenant path: by the corner → window (wipe) → back to watch → middle of the room (time-lapse) → meets the landlord
    const A0 = new T3.Vector3(-1.1, 0, -0.85), Bw = new T3.Vector3(-0.25, 0, -1.02), Cm = new T3.Vector3(-0.75, 0, -0.45), Dm = new T3.Vector3(0.3, 0, 0.38);
    const vTN = (t) => { const p = A0.clone().lerp(Bw, E.io(seg(t, K.win - 0.5, 0.65))); p.lerp(Cm, E.io(seg(t, K.plan + 0.5, 0.45))); p.lerp(Dm, E.io(seg(t, K.klar - 0.6, 0.55))); return p; };
    const tF = K.write - 0.42;                       // camera flash
    const hum = (t) => lerp(78, 55, E.io(seg(t, K.plan + 0.45, 1.3)));
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz) => () => ({ a, r, h, tx, ty, tz });
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.42, 4.9, 1.7, -1.6, 1.5, -1.1)],
      [K.spot + 0.15, P(0.45, 4.5, 1.75, -1.75, 1.6, -1.15), E.lin],
      [K.corner + 0.3, P(0.62, 2.15, 2.0, -2.2, 2.0, -1.38), A9],
      [K.win + 0.3, P(-0.22, 3.6, 1.55, 0.15, 1.42, -1.4), A6],
      [tF - 0.6, P(-0.18, 3.2, 1.5, 0.12, 1.42, -1.4), E.lin],
      [tF - 0.25, P(1.27, 3.35, 1.5, -2.2, 1.65, -1.55), A9],
      [K.write + 0.35, P(0.75, 4.3, 1.7, -0.7, 1.4, -1.0), A9],
      [K.turn + 0.3, P(0.1, 9.2, 3.6, -0.1, 1.2, -0.4), A6],
      [K.foto + 0.1, P(0.6, 3.4, 1.9, -2.0, 1.85, -1.3), A9],
      [K.plan + 0.05, P(-0.14, 4.4, 1.5, 0.55, 1.3, -1.35), A9],
      [K.firm - 0.15, P(-0.08, 4.7, 1.5, 0.5, 1.3, -1.35), E.lin],
      [K.firm + 0.3, P(0.5, 5.2, 2.1, -1.6, 1.4, -1.1), A6],
      [K.klar - 0.1, P(0.38, 5.0, 2.0, -1.5, 1.4, -1.1), E.lin],
      [K.klar + 0.35, P(0.12, 4.3, 1.65, 0.82, 1.3, 0.42), A9],
      [K.cta + 2.5, P(0.05, 10.5, 3.7, 0.0, 1.2, -0.3), A6],
    ]);
    const FOC = new T3.Vector3(), dum = new T3.Object3D(), tmp = new T3.Vector3(), CORNER = new T3.Vector3(-2.35, 2.0, -1.45);
    const farN = new T3.Color('#2a3350'), farDy = new T3.Color('#d9c7ad'), skyN = new T3.Color('#16233f'), skyD = new T3.Color('#9cc6ef'), winN = new T3.Color('#ffd59a'), winD = new T3.Color('#3a4566'), red = new T3.Color('#e74c3c'), grn = new T3.Color('#5ac86a');
    k.frame((t) => {
      const day = E.io(seg(t, K.firm + 0.15, 0.75));
      skyM.color.copy(skyN).lerp(skyD, day); farWin.color.copy(winN).lerp(winD, day); farM.color.copy(farN).lerp(farDy, day);
      sun.intensity = 2.6 * day; hemi.intensity = 0.35 + 0.45 * day; lampL.intensity = 2.6 * (1 - 0.8 * day); lampG.material.opacity = 1 - 0.8 * day; moon.intensity = 0.35 * (1 - day);
      // snow outside
      for (let i = 0; i < snN; i++) { const sp = 0.5 + MC.rnd(i, 4) * 0.6; snPos[i * 3] = -2 + MC.rnd(i, 1) * 5 + Math.sin(t * 0.7 + i) * 0.15; snPos[i * 3 + 1] = (((MC.rnd(i, 2) * 4.5 - t * sp) % 4.5) + 4.5) % 4.5 - 0.3; snPos[i * 3 + 2] = -2.1 - MC.rnd(i, 3) * 2.2; }
      snGeo.attributes.position.needsUpdate = true; snPts.material.opacity = 0.85 * (1 - day);
      // mold spots: grow outward from the corner with overshoot, keep creeping, vanish under the treatment
      spD.forEach((d, i) => { const g = MC.out(1.8)(seg(t, d.tA, 0.4)) * (1 + 0.25 * seg(t, d.tA, 5)) * (1 - E.io(seg(t, d.tR, 0.3))); dum.position.set(...d.p); dum.rotation.set(0, d.r, d.rot); dum.scale.setScalar(Math.max(1e-4, d.s * g)); dum.updateMatrix(); spots.setMatrixAt(i, dum.matrix); });
      spots.instanceMatrix.needsUpdate = true;
      damp.forEach((m) => { m.material.opacity = 0.32 * E.io(seg(t, -0.5, 2.5)) * (1 - E.io(seg(t, K.firm + 1.0, 0.8))); });
      // window fog: wipe stroke, then clears once the window is open; drops trickle in stop-go steps
      const wipe = E.io(seg(t, K.fog + 0.05, 0.42)); const wq = Math.round(wipe * 40) / 40; if (wq !== wipeLast) { wipeLast = wq; drawFog(wq); }
      const open = antMove(t, K.plan + 0.1, 0.75, 0, 1.25, 1.2);
      sash.rotation.y = open;
      const fogO = 1 - E.io(seg(t, K.plan + 0.35, 1.2)); fogM.opacity = fogO;
      gd.forEach((g, i) => { const u = t * g.sp * 0.6 + g.ph, st = Math.floor(u) + Math.pow(u - Math.floor(u), 4); g.m.position.set(g.x, 1.95 - ((st * 0.07) % 0.9), 0.035); g.m.scale.set(1, 1 + 1.5 * Math.pow(u - Math.floor(u), 3), 1); g.m.visible = fogO > 0.05; });
      dropM.opacity = 0.7 * fogO; sillW.material.opacity = 0.6 * fogO;
      wisps.forEach((w, i) => { const a = (t * 0.55 + w.ph) % 1, on = E.io(seg(t, K.plan + 0.45, 0.4)) * (1 - E.io(seg(t, K.firm + 0.1, 0.3))); w.m.position.set(w.x + w.sw * a, w.y - 0.35 * a * a, -1.5 + a * 2.4); w.m.rotation.set(-0.3, -0.25 + w.sw * 0.4, 0); w.m.scale.set(0.6 + a, 1, 1); w.m.material.opacity = on * Math.sin(a * Math.PI) * 0.55; });
      // hygrometer screen red → green as humidity drops
      hygScr.color.copy(red).lerp(grn, clamp((78 - hum(t)) / 23));
      // scan sweep + brackets
      const sc = seg(t, K.foto - 0.05, 0.6); scanM.opacity = sc > 0 && sc < 1 ? 0.95 : 0; const sy = 2.56 - 1.28 * E.io(sc); scB.position.y = sy; scL.position.y = sy;
      boxM.opacity = 0.9 * E.io(seg(t, K.foto + 0.35, 0.25)) * (1 - E.io(seg(t, K.plan - 0.1, 0.3)));
      // tenant: look at the corner, step to the window and wipe the glass, turn + photo (flash), type, watch, time-lapse, meet the landlord
      const phoneUp = MC.spring(t, tF - 0.45, 2.2, 0.4) * (1 - E.io(seg(t, K.foto - 0.2, 0.4)));
      const wiping = t > K.fog && t < K.fog + 0.5 ? 1 : 0;
      const reach = E.io(seg(t, K.plan - 0.15, 0.25)) * (1 - E.io(seg(t, K.plan + 0.55, 0.3)));
      const shake = E.io(seg(t, K.streit - 0.25, 0.3));
      let face = -2.05;
      face = lerp(face, 2.5, E.io(seg(t, K.win - 0.5, 0.3)));
      face = lerp(face, -1.84, E.io(seg(t, tF - 0.75, 0.3)));
      face = lerp(face, 2.87, E.io(seg(t, K.plan - 0.3, 0.25)));
      face = lerp(face, -2.1, E.io(seg(t, K.plan + 0.9, 0.3)));
      face = lerp(face, Math.PI / 2, E.io(seg(t, K.klar - 0.2, 0.3)));
      k.drive(TN, t, vTN, { face, cad: 12, armR: wiping ? -1.75 + 0.15 * Math.sin(t * 13) : (reach > 0.01 ? -1.6 * reach : (shake > 0.01 ? -1.1 * shake + 0.12 * Math.sin(t * 16) * shake : -0.25 - 1.25 * phoneUp)), armRz: wiping ? 0.35 * Math.sin(t * 13) : 0.15 * shake, armL: -0.12 * phoneUp, nod: 0.3 * phoneUp - 0.3 * E.io(seg(t, -0.5, 0.8)) * (1 - E.io(seg(t, K.win - 0.5, 0.3))), tilt: 0.05 * Math.sin(t * 2.1) * (1 - phoneUp), squash: 0.04 * MC.wob(t, tF, 4, 5) });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      // flash: light spike at the phone
      TN.userData.hand.getWorldPosition(tmp); flashL.position.copy(tmp); flashL.intensity = t > tF - 0.02 ? 30 * Math.exp(-Math.pow((t - tF) / 0.06, 2)) : 0;
      // specialist: pops in for Thursday (time-lapse), kneels, sprays the corner in sweeps
      const spIn = MC.out(2.2)(seg(t, K.firm + 0.4, 0.35)) * (1 - E.io(seg(t, K.klar + 0.05, 0.3)));
      SP.visible = spIn > 0.01;
      const kneel = E.io(seg(t, K.firm + 0.65, 0.3));
      k.drive(SP, t, () => new T3.Vector3(-1.8, 0, -0.95), { face: -2.36, lift: -0.2 * kneel, lean: 0.35 * kneel, armR: -1.35 + 0.25 * Math.sin(t * 6) * kneel, armRz: 0.3 * Math.sin(t * 3.2) * kneel, armL: -0.3 * kneel, squash: 0 });
      SP.scale.setScalar(0.97 * Math.max(1e-3, spIn));
      SP.userData.hand.getWorldPosition(tmp); const spray = t > K.firm + 0.8 && t < K.klar - 0.1;
      for (let i = 0; i < sprN; i++) { const life = 0.3, ph = MC.rnd(i, 9), a = ((t / life + ph) % 1) * life; if (!spray) dum.scale.setScalar(0); else { const sx = -1.6 + MC.rnd(i, 1) * 0.6, sy = 0.9 + MC.rnd(i, 2) * 1.2 + 0.6 * Math.sin(t * 3.2), sz = -1.3 + MC.rnd(i, 3) * 0.6; dum.position.set(tmp.x + sx * a, tmp.y + 0.1 + sy * a - 2 * a * a, tmp.z + sz * a); dum.scale.setScalar(1 - a / life); dum.rotation.set(0, 0, 0); } dum.updateMatrix(); spr.setMatrixAt(i, dum.matrix); }
      spr.instanceMatrix.needsUpdate = true;
      // landlord pops in (time-lapse), report spins in between them, handshake
      const llIn = MC.out(2.0)(seg(t, K.klar - 0.25, 0.35)); LL.visible = llIn > 0.01;
      k.drive(LL, t, () => new T3.Vector3(1.38, 0, 0.45), { face: -Math.PI / 2, armR: -1.1 * shake - 0.12 * Math.sin(t * 16) * shake, armRz: 0.15 * shake, nod: 0.12 * MC.wob(t, K.streit + 0.1, 3, 4) });
      LL.scale.setScalar(1.02 * Math.max(1e-3, llIn));
      const rIn = seg(t, K.klar + 0.05, 0.6); rep.visible = rIn > 0; rep.scale.setScalar(Math.max(1e-3, MC.out(1.8)(rIn))); rep.rotation.y = -antMove(t, K.klar + 0.05, 0.7, -Math.PI, 0, 1.0) + 0.12 * Math.sin(t * 1.8); rep.position.y = 1.62 + 0.03 * Math.sin(t * 2.4);
      repG.material.opacity = 0.5 + 0.3 * Math.sin(t * 4);
      // camera + depth of field (corner sharp in the close-ups)
      const c = camT(t); k.shoot(c, t, 1);
      const nearC = E.io(seg(t, K.corner, 0.3)) * (1 - E.io(seg(t, K.win, 0.2)));
      FOC.set(c.tx, c.ty, c.tz).lerp(CORNER, nearC); k.dof = { focus: FOC, ap: 0.04 + 0.04 * nearC };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const flash = ov('tdflash', ''); tl.set(flash, { autoAlpha: 0 }, 0); tl.fromTo(flash, { autoAlpha: 0.9 }, { autoAlpha: 0, duration: 0.35, ease: 'power2.out', immediateRender: false }, tF);
    const photo = ov('tdphoto', '<i class="tdmold"></i>'); tl.set(photo, { autoAlpha: 0, left: 540, top: 900, xPercent: -50, yPercent: -50 }, 0);
    tl.fromTo(photo, { autoAlpha: 0, scale: 1.25, rotation: -8 }, { autoAlpha: 1, scale: 1, rotation: 4, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, tF + 0.05);
    tl.to(photo, { left: 330, top: 360, scale: 0.28, rotation: 0, autoAlpha: 0, filter: 'blur(6px)', duration: 0.42, ease: 'power3.in' }, K.write - 0.2);
    const m1 = ov('tdchat in', `<b>${S.who}</b><span class="tdth tdmold"></span>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 270 }, 0); tl.set(m2, { top: 470 }, 0);
    k.popIn(m1, K.write - 0.15); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.foto - 0.3); k.popOut(m2, K.foto - 0.24);
    sfx('shutter', tF, -10); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12); sfx('typing', K.write + 0.1, -18); sfx('whoosh', K.win + 0.05, -16); sfx('drip', K.fog + 0.1, -18);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulse = ov('tdpulse', ''); tl.set(pulse, { autoAlpha: 0 }, 0); tl.fromTo(pulse, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.foto - 0.15);
    cd.line(0, K.foto + 0.35); cd.line(1, K.plan + 0.3); cd.line(2, K.thu + 0.05);
    k.popOut(cd.c, K.klar - 0.05, { y: -80 });
    const scT = ov('tdtag warn', S.scan); k.popIn(scT, K.foto + 0.3, { y: 30 }); k.popOut(scT, K.plan - 0.1, { y: -40 });
    const hT = ov('tdtag hum', `${S.hum} <b>78 %</b>`); k.popIn(hT, K.foto + 0.45, { y: 30 }); k.popOut(hT, K.firm + 0.1, { y: -40 });
    const hB = hT.querySelector('b');
    const calT = ov('tdtag', S.cal); k.popIn(calT, K.thu, { y: 30 }); k.popOut(calT, K.klar - 0.05, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.klar + 0.3, { y: 40 });
    sfx('refresh', K.foto, -14); sfx('wind', K.plan + 0.2, -14); sfx('unfold', K.plan + 0.1, -16); sfx('whoosh', K.firm + 0.15, -14); sfx('chime', K.thu + 0.05, -14); sfx('kaching', K.klar + 0.3, -14);
    perFrame((t) => {
      const v = Math.round(hum(t)); const lbl = `${v} %`; if (hB.textContent !== lbl) hB.textContent = lbl; hT.classList.toggle('ok', v <= 60);
      const [sx, sy] = k.proj(tmp.set(-2.05, 2.75, -1.45)); scT.style.left = clamp(sx, 260, 820) + 'px'; scT.style.top = Math.max(330, sy) + 'px';
      const hp = t < K.plan ? tmp.set(-2.0, 1.15, -1.3) : tmp.set(1.14, 0.75, -1.33); const [hx, hy] = k.proj(hp); hT.style.left = clamp(hx, 220, 860) + 'px'; hT.style.top = clamp(hy, 360, 1400) + 'px';
      const [cx, cy] = k.proj(tmp.set(-1.8, 2.2, -0.95)); calT.style.left = clamp(cx, 240, 840) + 'px'; calT.style.top = clamp(cy, 380, 1300) + 'px';
      const [ox, oy] = k.proj(tmp.set(0.85, 2.05, 0.45)); okT.style.left = clamp(ox, 270, 810) + 'px'; okT.style.top = clamp(oy, 300, 1300) + 'px';
    });
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }

  // ================= X55 (TDX pro): 7:10 am, steamy hot shower → the water turns ice cold (frost races over the glass, steam collapses, grade goes blue,
  // dolly zoom, tenant leaps out, towel flies onto her) → boiler blinks F28 → photo → Tenance AI reads the code → two-step reset (RESET button, gas tap) →
  // ignition burst, hot water races back through the copper pipes (camera follows) → shower steams again, frost melts → no emergency call-out =================
  function X55() {
    const de = lang === 'de';
    const S = de ? { chip: '🕖 7:10 · Whg 2A', who: 'Mieterin · Whg 2A', m1: 'Kein warmes Wasser 🥶 Die Therme zeigt F28', m2: 'F28 ist eine Zündstörung. RESET 3 Sek. halten, dann den Gashahn öffnen ✓', ttl: 'Kein Warmwasser · Whg 2A', l1: '📸 Fehler F28 per Foto erkannt', l2: '🔧 Reset in 2 Schritten', l3: '🔥 Warmwasser zurück · 5 Min.', err: 'F28 · Zündstörung', s1: '① RESET 3 Sek. halten', s2: '② Gashahn öffnen', temp: '🔥 60 °C', ok: '✓ Kein teurer Notdienst', end: ['In *5 Minuten* gelöst.', null] }
      : { chip: '🕖 7:10 am · Apt 2A', who: 'Tenant · Apt 2A', m1: 'No hot water 🥶 The boiler says F28', m2: 'F28 is an ignition lockout. Hold RESET for 3 sec, then open the gas tap ✓', ttl: 'No hot water · Apt 2A', l1: '📸 Error F28 read from photo', l2: '🔧 Reset in 2 steps', l3: '🔥 Hot water back · 5 min', err: 'F28 · ignition lockout', s1: '① Hold RESET · 3 sec', s2: '② Open the gas tap', temp: '🔥 60 °C', ok: '✓ No emergency call-out', end: ['Fixed in *5 minutes*.', null] };
    const K = {};
    K.cold = W(['plötzlich', 'hot']).start + 0.12; K.dies = W(['Wasser', 'dies']).start;
    K.write = W(['schreibt', 'writes']).start;
    const it = W(['Tenance']); K.turn = it.start; K.ans = W(['antwortet', 'answers'], it.i).start;
    K.boiler = W(['Fehlercode', 'boiler'], it.i).start; K.photo = W(['Foto', 'photo'], it.i).start;
    K.reset = W(['Reset', 'reset'], it.i).start; K.steps = W(['Schritten', 'steps'], it.i).start;
    K.hot = W(['warmes', 'hot'], it.i).start; K.min = W(['Minuten', 'minutes'], it.i).start;
    K.no = W(['Kein', 'No'], it.i).start; K.cta = W(['Jetzt', 'Join'], it.i).start;
    const k = TDX({ sky: 'night', envTop: '#fff3e2', envBot: '#2d2a26', envInt: 0.75, fov: 30, pro: true });
    const { scene, MC, ov } = k;
    const SH = (window.PR || 1) >= 2 ? 4096 : 2048;
    scene.add(new T3.HemisphereLight('#fff3e6', '#3a3430', 0.32));
    const shadowed = (l, b = 6) => { l.castShadow = true; l.shadow.mapSize.set(SH, SH); Object.assign(l.shadow.camera, { left: -b, right: b, top: b, bottom: -b, near: 0.5, far: 40 }); l.shadow.radius = 3; l.shadow.bias = -0.0004; l.shadow.normalBias = 0.02; };
    const sun = new T3.DirectionalLight('#ffd6a0', 2.0); sun.position.set(6.5, 5.5, -7.5); sun.target.position.set(1.4, 0, 0); scene.add(sun.target); shadowed(sun); scene.add(sun);
    const keyL = new T3.DirectionalLight('#fff4ea', 0.7); keyL.position.set(-3.5, 6.5, 6.5); shadowed(keyL); scene.add(keyL);
    const fill = new T3.DirectionalLight('#d4e2ff', 0.3); fill.position.set(3, 2, 9); scene.add(fill);
    const D = new T3.Group(); scene.add(D);
    // ---- canvas textures ----
    const cvs = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 8; return t; };
    const tiles = (nx, ny, base, grout, jit) => cvs(512, 512, (x, w, h) => { x.fillStyle = grout; x.fillRect(0, 0, w, h); const tw = w / nx, th = h / ny; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const v = (MC.rnd(i * 31 + j, 3) - 0.5) * jit; const c = new T3.Color(base); c.offsetHSL(0, 0, v); x.fillStyle = '#' + c.getHexString(); x.fillRect(i * tw + 2, j * th + 2, tw - 4, th - 4); x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(i * tw + 3, j * th + 3, tw - 6, 3); } });
    const wood = cvs(512, 512, (x, w, h) => { for (let i = 0; i < 8; i++) { const c = new T3.Color('#b98a5e'); c.offsetHSL(0, 0, (MC.rnd(i, 7) - 0.5) * 0.08); x.fillStyle = '#' + c.getHexString(); x.fillRect(0, i * 64, w, 64); x.strokeStyle = 'rgba(60,35,20,0.35)'; x.lineWidth = 2; x.strokeRect(-2, i * 64, w + 4, 64); for (let g = 0; g < 9; g++) { x.strokeStyle = 'rgba(90,55,30,0.18)'; x.beginPath(); const y0 = i * 64 + 6 + MC.rnd(i * 9 + g, 2) * 52; x.moveTo(0, y0); x.bezierCurveTo(w * 0.3, y0 + 4, w * 0.6, y0 - 4, w, y0 + 2); x.stroke(); } } });
    const wallTile = tiles(10, 12, '#9fbdb2', '#7e968d', 0.05), floorTile = tiles(6, 6, '#4f5f66', '#36434a', 0.06);
    [wallTile, floorTile, wood].forEach((t) => { t.wrapS = t.wrapT = T3.RepeatWrapping; });
    const cloud = cvs(128, 128, (x) => { for (let i = 0; i < 7; i++) { const cx = 40 + MC.rnd(i, 1) * 48, cy = 40 + MC.rnd(i, 2) * 48, rr = 22 + MC.rnd(i, 3) * 26; const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); } });
    const frostT = cvs(512, 512, (x, w, h) => { x.fillStyle = 'rgba(235,245,255,0.16)'; x.fillRect(0, 0, w, h); x.lineCap = 'round'; for (let i = 0; i < 340; i++) { let px = MC.rnd(i, 1) * w, py = MC.rnd(i, 2) * h, an = MC.rnd(i, 3) * 6.28; x.strokeStyle = `rgba(255,255,255,${0.25 + MC.rnd(i, 4) * 0.5})`; x.lineWidth = 0.8 + MC.rnd(i, 5) * 1.6; x.beginPath(); x.moveTo(px, py); for (let s = 0; s < 7; s++) { an += (MC.rnd(i * 7 + s, 6) - 0.5) * 1.1; const L = 6 + MC.rnd(i * 7 + s, 7) * 18; px += Math.cos(an) * L; py += Math.sin(an) * L; x.lineTo(px, py); if (s % 2) { x.moveTo(px, py); x.lineTo(px + Math.cos(an + 1) * L * 0.5, py + Math.sin(an + 1) * L * 0.5); x.moveTo(px, py); } } x.stroke(); } });
    const fogT = cvs(256, 256, (x, w, h) => { x.fillStyle = 'rgba(232,240,248,0.7)'; x.fillRect(0, 0, w, h); for (let i = 0; i < 600; i++) { x.fillStyle = `rgba(255,255,255,${0.15 + MC.rnd(i, 2) * 0.3})`; x.beginPath(); x.arc(MC.rnd(i, 3) * w, MC.rnd(i, 4) * h, 1 + MC.rnd(i, 1) * 3, 0, 7); x.fill(); } });
    const grad = (stops, w = 8, h = 256) => cvs(w, h, (x) => { const g = x.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); });
    // ---- studio backdrop + base ----
    const bg = new T3.Mesh(new T3.SphereGeometry(40, 32, 16), new T3.MeshBasicMaterial({ map: grad([[0, '#0d1018'], [0.42, '#1d1c26'], [0.52, '#2b2730'], [1, '#121219']]), side: T3.BackSide, depthWrite: false })); scene.add(bg);
    mesh(rbox(7.2, 0.32, 3.7, 0.06), M.std('#26262e', { roughness: 0.85 }), D, [0.12, -0.16, -0.15]);
    // floors
    const fl = (tex, rep, x0, x1) => { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(...rep); t.wrapS = t.wrapT = T3.RepeatWrapping; return mesh(new T3.PlaneGeometry(x1 - x0, 3.3), M.std('#ffffff', { map: t, roughness: 0.55 }), D, [(x0 + x1) / 2, 0.002, -0.05], [-Math.PI / 2, 0, 0]); };
    fl(floorTile, [3, 3], -3.25, 0); const wf = fl(wood, [2.5, 3], 0, 3.45); wf.material.roughness = 0.62;
    // walls (cutaway: back + left + partition + right), tiles in the bathroom
    const wallM = M.std('#efe3d0', { roughness: 0.92 }), trimM = M.std('#f7f3ec', { roughness: 0.6 });
    const box = (w, h, d, mat, pos) => mesh(new T3.BoxGeometry(w, h, d), mat, D, pos);
    box(3.3, 2.65, 0.14, wallM, [-1.6, 1.325, -1.67]);                                                            // bathroom back
    box(1.7, 2.65, 0.14, wallM, [0.85, 1.325, -1.67]); box(0.85, 2.65, 0.14, wallM, [3.03, 1.325, -1.67]);       // kitchen back (window 1.7..2.6)
    box(0.9, 1.15, 0.14, wallM, [2.15, 0.575, -1.67]); box(0.9, 0.5, 0.14, wallM, [2.15, 2.4, -1.67]);
    box(0.14, 2.65, 3.3, wallM, [-3.32, 1.325, -0.05]);                                                            // left
    box(0.1, 2.65, 0.55, wallM, [0, 1.325, -1.325]);                                                                  // partition
    box(0.12, 2.65, 2.0, wallM, [3.51, 1.325, -0.65]);                                                             // right
    [[-1.6, -1.67, 3.4, 0.2], [1.8, -1.67, 3.6, 0.2]].forEach(([x, z, w, d]) => box(w, 0.07, d, trimM, [x, 2.68, z]));
    box(0.2, 0.07, 3.35, trimM, [-3.32, 2.68, -0.05]); box(0.14, 0.07, 0.59, trimM, [0, 2.68, -1.325]); box(0.16, 0.07, 2.04, trimM, [3.51, 2.68, -0.65]);
    const tw = (w, h, pos, rot, rep) => { const t = wallTile.clone(); t.needsUpdate = true; t.repeat.set(...rep); return mesh(new T3.PlaneGeometry(w, h), M.std('#ffffff', { map: t, roughness: 0.25, metalness: 0.0 }), D, pos, rot); };
    tw(3.25, 2.6, [-1.62, 1.3, -1.598], [0, 0, 0], [3.2, 2.6]); tw(3.3, 2.6, [-3.248, 1.3, -0.05], [0, Math.PI / 2, 0], [3.2, 2.6]);
    box(3.4, 0.09, 0.02, M.std('#e8dccb'), [1.75, 0.045, -1.595]);                                                 // skirting (kitchen)
    // ---- shower: tray, glass (with frost), chrome head + riser, mixer ----
    const chrome = M.std('#e8ecf0', { metalness: 1, roughness: 0.12 });
    mesh(rbox(1.2, 0.09, 1.08, 0.03), M.std('#f8f8f6', { roughness: 0.3 }), D, [-2.66, 0.045, -1.06]);
    mesh(new T3.CircleGeometry(0.05, 20), chrome, D, [-2.66, 0.092, -1.0], [-Math.PI / 2, 0, 0]);
    const glassM = new T3.MeshPhysicalMaterial({ color: '#e6f4ff', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, side: T3.DoubleSide, envMapIntensity: 1.6, clearcoat: 1 });
    const frostM = () => new T3.ShaderMaterial({ uniforms: { tF: { value: frostT }, uG: { value: 0 }, uM: { value: 0 } }, transparent: true, depthWrite: false, side: T3.DoubleSide,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D tF; uniform float uG, uM; varying vec2 vUv; void main(){ vec4 f = texture2D(tF, vUv); float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)) * 2.0; float a = f.a * smoothstep(uG, uG - 0.22, e) * (1.0 - uM); gl_FragColor = vec4(vec3(0.92, 0.97, 1.0) * 1.5, a * 0.95); }' });
    const panes = [[1.17, 2.0, [-2.03, 1.09, -0.98], [0, Math.PI / 2, 0]]].map(([w, h, pos, rot]) => {
      mesh(new T3.PlaneGeometry(w, h), glassM, D, pos, rot).castShadow = false;
      const fm = frostM(); const f = mesh(new T3.PlaneGeometry(w, h), fm, D, pos, rot); f.castShadow = false; f.renderOrder = 2;
      const g = new T3.Group(); g.position.set(...pos); g.rotation.set(...rot); D.add(g); [[0, h / 2], [0, -h / 2]].forEach(([dx, dy]) => mesh(new T3.BoxGeometry(w, 0.025, 0.025), chrome, g, [dx, dy, 0])); [[-w / 2], [w / 2]].forEach(([dx]) => mesh(new T3.BoxGeometry(0.025, h, 0.025), chrome, g, [dx, 0, 0]));
      return fm;
    });
    mesh(new T3.CylinderGeometry(0.018, 0.018, 1.0, 12), chrome, D, [-2.6, 1.6, -1.575]);                           // riser
    mesh(new T3.CylinderGeometry(0.016, 0.016, 0.34, 12), chrome, D, [-2.6, 2.08, -1.42], [Math.PI / 2, 0, 0]);       // arm
    const head = new T3.Group(); head.position.set(-2.6, 2.06, -1.24); head.rotation.x = 0.45; D.add(head);
    mesh(new T3.CylinderGeometry(0.12, 0.09, 0.035, 28), chrome, head, [0, 0, 0]);
    mesh(new T3.CircleGeometry(0.105, 28), M.std('#9aa3ad', { metalness: 0.8, roughness: 0.4 }), head, [0, -0.0185, 0], [Math.PI / 2, 0, 0]);
    mesh(rbox(0.16, 0.08, 0.06, 0.02), chrome, D, [-2.6, 1.1, -1.57]); mesh(new T3.CylinderGeometry(0.012, 0.012, 0.13, 8), chrome, D, [-2.55, 1.14, -1.53], [0, 0, 1.2]);
    // bath mat, vanity + basin + mirror (fog), wall light, towel hook + towel, plant
    mesh(rbox(0.62, 0.02, 0.42, 0.01), M.std('#7fb3a6', { roughness: 0.95 }), D, [-2.25, 0.012, -0.12]);
    mesh(rbox(0.82, 0.74, 0.46, 0.03), M.std('#c9a27a', { roughness: 0.6 }), D, [-1.05, 0.37, -1.35]);
    mesh(rbox(0.74, 0.07, 0.44, 0.03), M.std('#fbfbf9', { roughness: 0.25 }), D, [-1.05, 0.775, -1.35]);
    mesh(new T3.CylinderGeometry(0.012, 0.012, 0.16, 10), chrome, D, [-1.05, 0.86, -1.5]); mesh(new T3.CylinderGeometry(0.01, 0.01, 0.1, 8), chrome, D, [-1.05, 0.93, -1.46], [Math.PI / 2, 0, 0]);
    mesh(new T3.PlaneGeometry(0.7, 0.84), M.std('#c9d2db', { metalness: 1, roughness: 0.06 }), D, [-1.05, 1.58, -1.59]);
    const mirFog = mesh(new T3.PlaneGeometry(0.7, 0.84), new T3.MeshBasicMaterial({ map: fogT, transparent: true, depthWrite: false, opacity: 0.8 }), D, [-1.05, 1.58, -1.585]); mirFog.castShadow = false;
    mesh(rbox(0.5, 0.05, 0.05, 0.02), new T3.MeshBasicMaterial({ color: new T3.Color(2.2, 1.9, 1.5) }), D, [-1.05, 2.07, -1.56]);
    const wl = new T3.PointLight('#ffd7a8', 1.6, 5); wl.position.set(-1.05, 2.0, -1.2); D.add(wl);
    const showerL = new T3.PointLight('#ffe2c0', 1.2, 3.5); showerL.position.set(-2.5, 2.1, -0.8); D.add(showerL);
    mesh(new T3.CylinderGeometry(0.015, 0.015, 0.08, 8), chrome, D, [-1.75, 1.62, -1.56], [Math.PI / 2, 0, 0]);
    const towelM = M.std('#f0b84a', { roughness: 0.95 });
    const towelH = mesh(rbox(0.38, 0.62, 0.06, 0.03), towelM, D, [-1.75, 1.33, -1.53]);
    const towelF = mesh(rbox(0.38, 0.62, 0.06, 0.03), towelM, D, [0, 0, 0]); towelF.visible = false;
    const plant = (x, y, z, s) => { const g = new T3.Group(); g.position.set(x, y, z); g.scale.setScalar(s); D.add(g); mesh(new T3.CylinderGeometry(0.16, 0.12, 0.3, 16), M.std('#c86b3c'), g, [0, 0.15, 0]); [[0, 0.55, 0, 0.26], [0.13, 0.45, 0.06, 0.2], [-0.12, 0.47, -0.05, 0.19]].forEach(([a, b, c, rr]) => mesh(new T3.SphereGeometry(rr, 14, 10), M.std('#3d7a4f', { roughness: 0.8 }), g, [a, b, c])); return g; };
    plant(-0.38, 0, -1.3, 1.0);
    // ---- kitchen: window (winter morning outside), counter, kettle, fridge, clock ----
    const frameM = M.std('#f6f3ee', { roughness: 0.5 });
    [[2.15, 1.15, 0.92, 0.07], [2.15, 2.15, 0.92, 0.07], [1.7, 1.65, 0.07, 1.06], [2.6, 1.65, 0.07, 1.06], [2.15, 1.65, 0.04, 1.0]].forEach(([x, y, w, h]) => box(w, h, 0.16, frameM, [x, y, -1.67]));
    box(1.0, 0.05, 0.26, frameM, [2.15, 1.13, -1.56]);
    const sky = mesh(new T3.PlaneGeometry(9, 5), new T3.MeshBasicMaterial({ map: grad([[0, '#8fb6e0'], [0.55, '#d9d6dc'], [1, '#f6c79a']]) }), D, [2.4, 1.7, -6.2]); sky.castShadow = false;
    for (let i = 0; i < 7; i++) { const w = 0.8 + MC.rnd(i, 1) * 0.9, h = 0.5 + MC.rnd(i, 2) * 1.0, x = -0.4 + i * 0.85 + MC.rnd(i, 3) * 0.3, z = -3.6 - MC.rnd(i, 4) * 1.6; box(w, h, 0.9, M.std('#8a7f86', { roughness: 0.9 }), [x, 0.4 + h / 2, z]); box(w + 0.06, 0.07, 0.96, M.std('#f4f7fb', { roughness: 0.9 }), [x, 0.4 + h + 0.03, z]); }
    const sunG = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, color: new T3.Color(1.6, 1.2, 0.8) })); sunG.position.set(4.2, 2.3, -6.0); sunG.scale.setScalar(3.2); D.add(sunG);
    const shaftT = grad([[0, 'rgba(255,230,190,0.0)'], [0.15, 'rgba(255,230,190,0.55)'], [1, 'rgba(255,230,190,0.0)']], 8, 128);
    const sdir = new T3.Vector3().subVectors(sun.target.position, sun.position).normalize();
    [[-0.25, 0.85], [0.18, 0.7], [0.0, 1.0]].forEach(([dx, wv], i) => {
      const p0 = new T3.Vector3(2.15 + dx, 1.65 + (i - 1) * 0.15, -1.66), L = 1.9 / -sdir.y, mid = p0.clone().addScaledVector(sdir, L / 2);
      const m = new T3.Mesh(new T3.PlaneGeometry(wv * 0.55, L), new T3.MeshBasicMaterial({ map: shaftT, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, opacity: 0.12, side: T3.DoubleSide }));
      m.position.copy(mid); m.up.copy(sdir).negate(); m.lookAt(mid.clone().add(new T3.Vector3(0, 0, 1))); D.add(m);
    });
    mesh(rbox(1.0, 0.86, 0.6, 0.03), M.std('#2f5a44', { roughness: 0.55 }), D, [2.2, 0.43, -1.3]);
    mesh(rbox(1.06, 0.05, 0.64, 0.02), M.std('#dccab0', { roughness: 0.45 }), D, [2.2, 0.885, -1.3]);
    [1.95, 2.45].forEach((x) => mesh(new T3.BoxGeometry(0.16, 0.02, 0.02), chrome, D, [x, 0.75, -0.99]));
    const kettle = new T3.Group(); kettle.position.set(2.5, 0.91, -1.32); D.add(kettle); mesh(new T3.CylinderGeometry(0.085, 0.1, 0.2, 20), M.std('#d23b30', { roughness: 0.35, metalness: 0.2 }), kettle, [0, 0.1, 0]); mesh(new T3.TorusGeometry(0.05, 0.012, 8, 16, Math.PI), M.std('#2b2b2b'), kettle, [0, 0.22, 0]);
    mesh(new T3.CylinderGeometry(0.04, 0.035, 0.09, 16), M.std('#f4f1ea'), D, [1.95, 0.955, -1.25]);
    plant(2.05, 1.155, -1.56, 0.45);
    mesh(rbox(0.64, 1.86, 0.64, 0.05), M.std('#e9edf2', { roughness: 0.3, metalness: 0.15 }), D, [3.1, 0.93, -1.25]); mesh(new T3.BoxGeometry(0.03, 0.5, 0.04), chrome, D, [2.83, 1.25, -0.92]); mesh(new T3.BoxGeometry(0.64, 0.01, 0.01), M.std('#c5ccd4'), D, [3.1, 1.32, -0.93]);
    const clock = new T3.Group(); clock.position.set(2.95, 2.18, -1.585); D.add(clock);
    mesh(new T3.CylinderGeometry(0.15, 0.15, 0.03, 32), M.std('#1d4734'), clock, [0, 0, 0], [Math.PI / 2, 0, 0]); mesh(new T3.CircleGeometry(0.13, 32), M.std('#faf6ee'), clock, [0, 0, 0.016]);
    const hand = (L, wv, c) => { const g = new T3.Group(); g.position.z = 0.02; clock.add(g); mesh(new T3.BoxGeometry(wv, L, 0.005), M.std(c), g, [0, L / 2 - 0.015, 0]); return g; };
    const hH = hand(0.07, 0.012, '#14261b'), hM = hand(0.105, 0.008, '#14261b'), hS = hand(0.11, 0.004, '#e09b6b');
    hH.rotation.z = -(7 + 10 / 60) / 12 * Math.PI * 2; hM.rotation.z = -10 / 60 * Math.PI * 2;
    // ---- the boiler: body, LCD (canvas), flame window + flame, RESET button, LED, pipes + gas tap ----
    const BO = new T3.Group(); BO.position.set(1.15, 1.62, -1.43); D.add(BO);
    mesh(rbox(0.52, 0.74, 0.3, 0.05), M.std('#f4f2ee', { roughness: 0.35 }), BO, [0, 0, 0]);
    mesh(rbox(0.44, 0.3, 0.02, 0.02), M.std('#2b3036', { roughness: 0.4 }), BO, [0, -0.15, 0.152]);
    const lcdC = document.createElement('canvas'); lcdC.width = 256; lcdC.height = 96; const lcdX = lcdC.getContext('2d'); const lcdT = new T3.CanvasTexture(lcdC); lcdT.colorSpace = T3.SRGBColorSpace;
    const lcdM = new T3.MeshBasicMaterial({ map: lcdT, color: new T3.Color(1.6, 1.6, 1.6) }); mesh(new T3.PlaneGeometry(0.3, 0.1125), lcdM, BO, [0, 0.17, 0.158]).castShadow = false;
    mesh(rbox(0.33, 0.14, 0.012, 0.01), M.std('#d9dde2', { metalness: 0.6, roughness: 0.3 }), BO, [0, 0.17, 0.148]);
    let lcdKey = '';
    const lcd = (mode, on, p) => { const key = mode + (on ? 1 : 0) + Math.round(p * 4); if (key === lcdKey) return; lcdKey = key; const x = lcdX; x.fillStyle = '#0c1813'; x.fillRect(0, 0, 256, 96); x.textAlign = 'center'; x.textBaseline = 'middle';
      if (mode === 'hot') { x.fillStyle = '#ffb054'; x.font = '700 64px Clash'; x.fillText('60°', 108, 52); x.beginPath(); x.moveTo(206, 76); x.quadraticCurveTo(178, 58, 200, 22); x.quadraticCurveTo(206, 44, 216, 40); x.quadraticCurveTo(236, 60, 206, 76); x.fill(); }
      else if (mode === 'err') { x.fillStyle = on ? '#ff3b30' : '#4a1512'; x.font = '700 70px Clash'; x.fillText('F28', 128, 52); }
      else { x.fillStyle = '#e8f4ee'; x.font = '700 56px Clash'; x.fillText('- -', 128, 46); for (let i = 0; i < 4; i++) { x.fillStyle = i < Math.round(p * 4) ? '#5ac86a' : '#24402f'; x.fillRect(64 + i * 34, 76, 26, 8); } }
      lcdT.needsUpdate = true; };
    const flameWin = mesh(new T3.CircleGeometry(0.055, 28), M.std('#0e1216', { roughness: 0.1, metalness: 0.5 }), BO, [-0.09, -0.15, 0.164]);
    const FL = new T3.Group(); FL.position.set(-0.09, -0.17, 0.158); BO.add(FL);
    const flames = [[0, 0.06, '#5aa8ff', 1.0], [-0.022, 0.045, '#5aa8ff', 0.8], [0.022, 0.045, '#5aa8ff', 0.8], [0, 0.03, '#ffb054', 0.6]].map(([x, h, c, s]) => { const col = new T3.Color(c).multiplyScalar(1.5); const m = new T3.Mesh(new T3.ConeGeometry(0.014 * s + 0.004, h, 12), new T3.MeshBasicMaterial({ color: col, transparent: true, blending: T3.AdditiveBlending, depthWrite: false })); m.position.set(x, h / 2, 0.004); FL.add(m); return m; });
    const flameG = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, color: new T3.Color(0.9, 1.4, 3.0) })); flameG.position.set(-0.09, -0.14, 0.2); BO.add(flameG);
    const flameL = new T3.PointLight('#8cc4ff', 0, 2.2); flameL.position.set(-0.09, -0.12, 0.6); BO.add(flameL);
    const btn = new T3.Group(); btn.position.set(0.11, -0.15, 0.158); BO.add(btn); mesh(new T3.CylinderGeometry(0.035, 0.035, 0.012, 24), M.std('#c7ccd3', { metalness: 0.7, roughness: 0.3 }), BO, [0.11, -0.15, 0.158], [Math.PI / 2, 0, 0]);
    const btnCap = mesh(new T3.CylinderGeometry(0.026, 0.026, 0.02, 24), M.std('#d23b30', { roughness: 0.35, emissive: new T3.Color('#ff3b30'), emissiveIntensity: 0 }), btn, [0, 0, 0.012], [Math.PI / 2, 0, 0]);
    const ledM = new T3.MeshBasicMaterial({ color: '#5ac86a' }); mesh(new T3.SphereGeometry(0.012, 10, 8), ledM, BO, [0.19, 0.17, 0.156]);
    const copper = M.std('#c8794a', { metalness: 0.85, roughness: 0.32 });
    [[1.02, '#aab4bd'], [1.15, '#d9b23a']].forEach(([x, c]) => { mesh(new T3.CylinderGeometry(0.022, 0.022, 1.0, 12), copper, D, [x, 0.76, -1.51]); mesh(new T3.CylinderGeometry(0.026, 0.026, 0.06, 12), M.std(c, { roughness: 0.5 }), D, [x, 1.12, -1.51]); });
    const tap = new T3.Group(); tap.position.set(1.15, 0.98, -1.47); D.add(tap); mesh(rbox(0.06, 0.08, 0.06, 0.01), M.std('#c9a227', { metalness: 0.7, roughness: 0.3 }), D, [1.15, 0.98, -1.5]);
    mesh(rbox(0.16, 0.026, 0.026, 0.008), M.std('#f2c230', { roughness: 0.45 }), tap, [0.07, 0, 0.02]);
    // hot pipe: boiler → down → along the back wall → through the partition → up to the shower mixer (segments light up as hot water flows)
    const curve = new T3.CatmullRomCurve3([[1.28, 1.26], [1.28, 0.5], [1.22, 0.32], [1.0, 0.3], [-0.2, 0.3], [-1.7, 0.3], [-2.38, 0.31], [-2.5, 0.42], [-2.5, 0.92], [-2.56, 1.08]].map(([x, y]) => new T3.Vector3(x, y, -1.53)), false, 'centripetal', 0.3);
    const NSEG = 110, pts = curve.getSpacedPoints(NSEG), segs = [], up = new T3.Vector3(0, 1, 0), qq = new T3.Quaternion();
    for (let i = 0; i < NSEG; i++) { const a = pts[i], b = pts[i + 1], len = a.distanceTo(b); const mat = copper.clone(); mat.emissive = new T3.Color(0, 0, 0); const m = mesh(new T3.CylinderGeometry(0.027, 0.027, len * 1.04, 12, 1, true), mat, D, [0, 0, 0]); m.position.copy(a).lerp(b, 0.5); qq.setFromUnitVectors(up, b.clone().sub(a).normalize()); m.quaternion.copy(qq); segs.push(m); }
    mesh(new T3.CylinderGeometry(0.02, 0.02, 3.6, 10), M.std('#b9c6d3', { metalness: 0.8, roughness: 0.3 }), D, [-0.65, 0.2, -1.55], [0, 0, Math.PI / 2]);   // cold main
    const pulse = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, color: new T3.Color(2.4, 1.1, 0.4) })); pulse.scale.setScalar(0.35); D.add(pulse);
    // scan sweep on the LCD
    const scanM = new T3.MeshBasicMaterial({ color: new T3.Color(0.6, 3.0, 1.0), transparent: true, opacity: 0, blending: T3.AdditiveBlending, depthWrite: false });
    const scan = mesh(new T3.PlaneGeometry(0.34, 0.006), scanM, BO, [0, 0.17, 0.162]); scan.castShadow = false;
    const brkM = new T3.MeshBasicMaterial({ color: new T3.Color(0.5, 2.2, 0.8), transparent: true, opacity: 0, depthWrite: false });
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sy]) => { const g = new T3.Group(); g.position.set(sx * 0.18, 0.17 + sy * 0.075, 0.161); BO.add(g); mesh(new T3.BoxGeometry(0.04, 0.005, 0.002), brkM, g, [-sx * 0.02, 0, 0]); mesh(new T3.BoxGeometry(0.005, 0.04, 0.002), brkM, g, [0, -sy * 0.02, 0]); });
    // ---- shower water (stretched droplets) + splashes + steam ----
    const waterM = new T3.MeshStandardMaterial({ color: '#f2f7ff', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.6, emissive: new T3.Color('#ffffff'), emissiveIntensity: 0.35 });
    const WN = 520, wat = new T3.InstancedMesh(new T3.SphereGeometry(0.0088, 6, 5), waterM, WN); wat.castShadow = false; D.add(wat);
    const SPN = 90, spl = new T3.InstancedMesh(new T3.SphereGeometry(0.008, 5, 4), waterM, SPN); spl.castShadow = false; D.add(spl);
    const HP = new T3.Vector3(), dum = new T3.Object3D(), tmp = new T3.Vector3(), tmp2 = new T3.Vector3();
    const steam = [...Array(80)].map((_, i) => { const m = new T3.Sprite(new T3.SpriteMaterial({ map: cloud, transparent: true, depthWrite: false, opacity: 0 })); m.renderOrder = 4; D.add(m); return { m, ph: MC.rnd(i, 1), x0: -2.7 + (MC.rnd(i, 2) - 0.5) * 0.9, z0: -1.15 + (MC.rnd(i, 3) - 0.5) * 0.7, sp: 0.6 + MC.rnd(i, 4) * 0.5, sz: 0.3 + MC.rnd(i, 5) * 0.45, rot: (MC.rnd(i, 6) - 0.5) * 1.5 }; });
    // ---- tenant (skin pill in the shower; towel wraps on when she jumps out) ----
    const TN = k.fig(D, '#e8b98f', -2.66, 0.09, -1.0, 0.95, '#7a3b1e');
    const towelB = mesh(new T3.CylinderGeometry(0.212, 0.232, 0.5, 24, 1, true), towelM, TN.userData.B, [0, 0.47, 0]); towelB.visible = false;
    const towelR = mesh(new T3.TorusGeometry(0.212, 0.022, 8, 24), towelM, TN.userData.B, [0, 0.72, 0], [Math.PI / 2, 0, 0]); towelR.visible = false;
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const IN = new T3.Vector3(-2.66, 0.09, -1.0), OUT = new T3.Vector3(-2.2, 0, -0.3), MIDP = new T3.Vector3(-0.05, 0, -0.42), AT = new T3.Vector3(0.88, 0, -0.84);
    const tJ = K.cold + 0.45, tJ2 = tJ + 0.4, tW1 = tJ2 + 0.75, tW2 = K.write - 0.42, tB0 = K.hot + 0.35, tB1 = K.hot + 1.3, tB2 = tB1 + 0.32;
    const vTN = (t) => {
      if (t < tJ) return IN.clone();
      if (t < tJ2) { const u = E.oc(seg(t, tJ, tJ2 - tJ)); const p = IN.clone().lerp(OUT, u); p.y = lerp(0.09, 0, u) + Math.sin(u * Math.PI) * 0.28; return p; }
      if (t < tB0) { const p = OUT.clone().lerp(MIDP, E.io(seg(t, tJ2, tW1 - tJ2))); return p.lerp(AT, E.io(seg(t, tW1, tW2 - tW1))); }
      if (t < tB1) { const u = seg(t, tB0, tB1 - tB0); return u < 0.55 ? AT.clone().lerp(MIDP, E.io(u / 0.55)) : MIDP.clone().lerp(OUT, E.io((u - 0.55) / 0.45)); }
      const u = E.io(seg(t, tB1, tB2 - tB1)); const p = OUT.clone().lerp(IN, u); p.y = lerp(0, 0.09, u) + Math.sin(u * Math.PI) * 0.16; return p;
    };
    // ---- state curves ----
    const heat = (t) => t < K.cold ? 1 : (t < K.hot + 1.0 ? 1 - E.io(seg(t, K.cold, 0.32)) : E.io(seg(t, K.hot + 1.0, 0.55)));
    const flowOn = (t) => t < K.dies + 0.9 ? 1 : (t < tB1 - 0.05 ? 1 - E.io(seg(t, K.dies + 0.9, 0.25)) : E.io(seg(t, tB1 - 0.05, 0.2)));
    const coldFront = (t) => E.io(seg(t, K.cold - 0.3, 0.6)), hotFront = (t) => E.io(seg(t, K.hot + 0.2, tB1 - 0.05 - (K.hot + 0.2)));
    const lit = (t) => MC.out(1.6)(seg(t, K.hot - 0.04, 0.3));
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const PF = (t) => { const q = curve.getPointAt(clamp(hotFront(t), 0, 1)); return { a: 0.12, r: 1.9, h: 1.45, tx: q.x, ty: clamp(q.y, 0.3, 1.3) + 0.15, tz: -1.5, fov: 32, roll: 0 }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.95, 2.45, 1.36, -2.64, 1.13, -1.0)],
      [K.cold - 0.04, P(0.95, 1.95, 1.32, -2.64, 1.15, -1.0), E.lin],
      [K.cold + 0.42, PT(0.92, 3.35, 1.27, 1.06, 18.5, 0.035), A9],
      [K.dies + 0.05, PT(0.85, 3.45, 1.29, 1.02, 19, 0), E.lin],
      [K.dies + 0.62, P(-0.2, 3.1, 1.5, 0.95, 1.42, -1.25), A6],
      [K.write - 0.3, P(-0.52, 2.15, 1.6, 1.12, 1.6, -1.42), A9],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 0.1, 1.15, -0.55), A6],
      [K.boiler - 0.25, P(-0.04, 9.1, 2.6, 0.1, 1.15, -0.55), E.lin],
      [K.boiler + 0.25, P(-0.05, 1.22, 1.8, 1.15, 1.79, -1.28, 24), A9],
      [K.reset - 0.15, P(-0.02, 1.08, 1.8, 1.15, 1.77, -1.28, 24), E.lin],
      [K.reset + 0.35, P(0.6, 2.4, 1.75, 1.1, 1.6, -1.3), A6],
      [K.steps + 0.2, P(0.66, 2.2, 1.5, 1.1, 1.12, -1.35), E.io],
      [K.hot + 0.05, P(0.1, 1.6, 1.7, 1.1, 1.62, -1.3, 27, -0.02), A9],
      [K.hot + 0.32, P(0.07, 1.72, 1.66, 1.1, 1.6, -1.3, 27), E.lin],
      [K.hot + 0.5, PF, A6],
      [K.hot + 1.0, PF, E.lin],
      [tB1 - 0.05, P(-0.15, 2.7, 1.9, -2.5, 1.45, -1.4, 32), A6],
      [K.min + 0.6, P(0.8, 3.0, 1.62, -2.62, 1.42, -1.05), A6],
      [K.no + 0.35, P(0.5, 5.4, 1.9, -2.0, 1.2, -0.8), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), cWarm = new T3.Color('#f2f7ff'), cCold = new T3.Color('#8fd0ff'), hotE = new T3.Color(2.6, 0.8, 0.15), coldE = new T3.Color(0.02, 0.07, 0.16), black = new T3.Color(0, 0, 0);
    k.frame((t) => {
      const ht = heat(t), fo = flowOn(t), wc = t < K.cold ? 1 : (t < tB1 ? 0 : 1), lt = lit(t);
      // grade: warm → ice blue on the cold hit → neutral-cool → warm again at ignition
      const g = k.grade; g.temp = t < K.cold ? 0.3 : (t < K.hot ? lerp(-0.85, -0.3, E.io(seg(t, K.cold + 0.35, 2.4))) * E.io(seg(t, K.cold, 0.18)) + 0.3 * (1 - E.io(seg(t, K.cold, 0.18))) : lerp(-0.3, 0.42, E.io(seg(t, K.hot - 0.05, 0.6))));
      g.th = 1.6; g.bloom = 0.35 + 0.3 * Math.exp(-Math.pow((t - K.hot - 0.05) / 0.18, 2)); g.sat = 1.06 - 0.12 * (1 - ht) * (t < K.hot ? 1 : 0);
      // water droplets: emitted from the head disc, gravity, stretched along velocity
      head.updateMatrixWorld(); const hc = waterM.color; hc.copy(cCold).lerp(cWarm, wc);
      for (let i = 0; i < WN; i++) {
        const life = 0.5, ph = MC.rnd(i, 1), a = ((t / life + ph) % 1) * life, born = t - a;
        if (MC.rnd(i, Math.floor(t / life + ph)) > flowOn(born)) { dum.scale.setScalar(1e-4); dum.position.set(0, -5, 0); dum.updateMatrix(); wat.setMatrixAt(i, dum.matrix); continue; }
        const an = MC.rnd(i, 2) * 6.283, rr = Math.sqrt(MC.rnd(i, 3)) * 0.095;
        HP.set(Math.cos(an) * rr, -0.02, Math.sin(an) * rr).applyMatrix4(head.matrixWorld);
        const vx = Math.cos(an) * rr * 2.2, vz = 0.55 + Math.sin(an) * rr * 2.2, vy = -1.4 - MC.rnd(i, 4) * 0.5;
        let y = HP.y + vy * a - 4.9 * a * a; const hit = y < 0.1;
        if (hit) y = 0.1;
        dum.position.set(HP.x + vx * a, y, HP.z + vz * a * 0.6);
        const sp = Math.hypot(vx, vy - 9.8 * a, vz); tmp.set(dum.position.x + vx, dum.position.y + (vy - 9.8 * a), dum.position.z + vz * 0.6); dum.lookAt(tmp);
        dum.scale.set(hit ? 1e-4 : 1, hit ? 1e-4 : 1, hit ? 1e-4 : 1 + sp * 1.7); dum.updateMatrix(); wat.setMatrixAt(i, dum.matrix);
      }
      wat.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < SPN; i++) { const life = 0.3, ph = MC.rnd(i, 9), a = ((t / life + ph) % 1) * life; const on = fo > MC.rnd(i, Math.floor(t / life + ph) + 3); const an = MC.rnd(i, Math.floor(t / life + ph)) * 6.28, v = 0.4 + MC.rnd(i, 5) * 0.6; if (!on) dum.scale.setScalar(1e-4); else { dum.position.set(-2.62 + Math.cos(an) * (0.12 + v * a), 0.1 + 1.6 * a - 4.9 * a * a + 0.02, -0.98 + Math.sin(an) * (0.12 + v * a)); dum.scale.setScalar(1 - a / life); } dum.rotation.set(0, 0, 0); dum.updateMatrix(); spl.setMatrixAt(i, dum.matrix); }
      spl.instanceMatrix.needsUpdate = true;
      // steam: rises, swirls, drifts out of the shower; collapses on the cold hit and billows back with the hot water
      steam.forEach((s, i) => { const a = ((t * s.sp * 0.32 + s.ph) % 1), cold = 1 - ht; s.m.position.set(s.x0 + Math.sin(t * 0.8 + i) * 0.12 - a * 0.25, 1.45 + a * 1.4 - cold * 0.6 * a, s.z0 + a * 1.1); s.m.scale.setScalar(s.sz * (0.55 + a * 1.6)); s.m.material.rotation = s.rot * t * 0.2 + i; s.m.material.opacity = (t > tB1 ? 0.18 : 0.13) * ht * Math.sin(a * Math.PI); });
      mirFog.material.opacity = 0.85 * Math.max(heat(t - 0.6), 0) * (t > K.hot ? E.io(seg(t, K.hot + 1.2, 1.0)) : 1);
      // frost races in from the edges on the cold hit, melts when hot water returns
      panes.forEach((fm, i) => { fm.uniforms.uG.value = 0.62 * MC.out(1.2)(seg(t, K.cold + 0.04 + i * 0.06, 0.5)); fm.uniforms.uM.value = E.io(seg(t, tB1 + 0.05, 0.9)); });
      showerL.intensity = 1.2 * (0.4 + 0.6 * ht);
      // pipes: cold front drains the heat, then the hot front races boiler → shower
      const cf = coldFront(t), hf = hotFront(t);
      segs.forEach((m, i) => { const u = (i + 0.5) / NSEG; const hot = t < K.hot ? (u > cf ? 1 : 0) : (u < hf ? 1 : 0); const edge = t >= K.hot && hf > 0 && hf < 1 ? Math.exp(-Math.pow((u - hf) / 0.035, 2)) * 2 : 0; m.material.emissive.copy(hot ? hotE : coldE).multiplyScalar(hot ? (0.55 + edge) * (t > K.hot ? 1 - 0.6 * E.io(seg(t, tB1 + 0.3, 1.2)) : 1) : 1 - 0.7 * (t < K.cold ? 1 : 0)); if (!hot && t < K.cold - 0.3) m.material.emissive.copy(black); });
      const pu = t < K.hot ? cf : hf; pulse.visible = (t >= K.hot && hf > 0 && hf < 1); curve.getPointAt(clamp(pu, 0, 1), pulse.position); pulse.position.z += 0.04;
      // boiler: LCD, LED, flame, button, gas tap
      const errMode = t >= K.cold - 0.2 && t < K.reset + 0.32, rstMode = t >= K.reset + 0.32 && t < K.hot - 0.04;
      lcd(errMode ? 'err' : (rstMode ? 'rst' : 'hot'), Math.floor(t * 3) % 2 === 0, rstMode ? seg(t, K.reset + 0.32, K.hot - K.reset - 0.4) : 0);
      ledM.color.set(errMode ? (Math.floor(t * 3) % 2 ? '#ff3b30' : '#4a1512') : (rstMode ? '#f2c230' : '#5ac86a'));
      const fl = t < K.cold - 0.2 ? 1 : lt; FL.scale.setScalar(Math.max(1e-3, fl * (1 + 0.08 * MC.noise(t * 9)))); FL.visible = fl > 0.01;
      flames.forEach((m, i) => { m.scale.y = 1 + 0.25 * MC.noise(t * 14 + i * 3); });
      flameG.material.opacity = fl * (0.3 + 0.1 * MC.noise(t * 11)); flameG.scale.setScalar(0.1 + 0.12 * Math.exp(-Math.pow((t - K.hot) / 0.15, 2)) * (t > K.hot - 0.1 ? 1 : 0));
      flameL.intensity = fl * 0.12 + 0.5 * Math.exp(-Math.pow((t - K.hot - 0.02) / 0.1, 2)) * (t > K.hot - 0.1 ? 1 : 0);
      const press = antMove(t, K.reset + 0.18, 0.18, 0, 1, 1.4) * (1 - E.io(seg(t, K.reset + 0.75, 0.15)));
      btn.position.z = 0.158 - 0.009 * press; btnCap.material.emissiveIntensity = 1.5 * press;
      tap.rotation.z = -antMove(t, K.steps - 0.05, 0.45, 0, Math.PI / 2, 1.2);
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      // scan
      const sc = seg(t, K.boiler - 0.05, 0.55); scanM.opacity = sc > 0 && sc < 1 ? 1 : 0; scan.position.y = 0.17 + 0.055 - 0.11 * E.io(sc);
      brkM.opacity = E.io(seg(t, K.boiler + 0.1, 0.2)) * (1 - E.io(seg(t, K.reset - 0.1, 0.25)));
      // tenant: shower (eyes closed, washing hair) → cold shock (squash, eyes wide, O) → leap out → towel → hurry to the boiler → photo → RESET → gas tap → joy → back to the shower
      const shock = E.io(seg(t, K.cold, 0.08)) * (1 - E.io(seg(t, tJ2 + 0.6, 0.4)));
      const inShower = t < K.cold || t > tB2 - 0.05, cold = t > K.cold && t < tB2;
      const phoneUp = MC.spring(t, K.write - 0.75, 2.2, 0.4) * (1 - E.io(seg(t, K.reset - 0.15, 0.25)));
      const reach = antMove(t, K.reset - 0.08, 0.3, 0, 1, 1.2) * (1 - E.io(seg(t, K.reset + 0.8, 0.25)));
      const kneel = E.io(seg(t, K.steps - 0.4, 0.3)) * (1 - E.io(seg(t, K.hot - 0.15, 0.25)));
      const joy = MC.spring(t, K.hot + 0.05, 2.4, 0.35) * (1 - E.io(seg(t, tB0, 0.2)));
      const wash = inShower ? 1 : 0, shiver = cold ? Math.sin(t * 55) * 0.025 * (1 - joy) : 0;
      const sq = -0.14 * Math.exp(-Math.pow((t - (K.cold + 0.15)) / 0.07, 2)) + 0.06 * Math.exp(-Math.pow((t - (tJ + 0.12)) / 0.06, 2));
      const hug = cold && t < K.write - 0.8 && t > tJ ? 1 : 0;
      let face = 0; if (t > tJ2 - 0.1 && t < tB0) face = lerp(0, 2.72, E.io(seg(t, tW2 - 0.3, 0.3)));
      if (t >= tB0) face = 0;
      k.drive(TN, t, vTN, {
        face, cad: 15, squash: sq, tilt: shiver + (wash ? 0.04 * Math.sin(t * 2.4) : 0), nod: wash ? -0.22 : 0.25 * phoneUp - 0.1 * shock,
        lift: -0.18 * kneel, lean: 0.35 * kneel - 0.12 * joy,
        armL: wash ? -2.6 + 0.18 * Math.sin(t * 9) : (hug ? -1.15 : (shock > 0.5 && t < tJ ? -2.9 : -0.2 - 0.3 * joy)),
        armR: wash ? -2.6 - 0.18 * Math.sin(t * 9 + 1) : (hug ? -1.15 : (shock > 0.5 && t < tJ ? -2.9 : (joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 1.2 * phoneUp - 1.35 * reach - 0.7 * kneel))),
        armLz: wash ? 0.3 : (hug ? -0.55 : 0), armRz: wash ? 0.3 : (hug ? -0.55 : 0.25 * kneel),
      });
      k.face(TN, t, { closed: wash ? 0.85 : 0, wide: shock + 0.3 * E.io(seg(t, K.hot - 0.05, 0.1)) * (1 - joy), o: shock * 0.9 + 0.5 * E.io(seg(t, K.hot - 0.05, 0.08)) * (1 - E.io(seg(t, K.hot + 0.2, 0.1))), smile: wash ? 1 : (joy > 0.1 ? 1 : 0.15) });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      // towel: hook → flies onto her as she runs out → flies back to the hook when she steps back into the shower
      const tOn = seg(t, tJ2 - 0.05, 0.32), tOff = seg(t, tB1 - 0.2, 0.3);
      const onBody = tOn >= 1 && tOff <= 0;
      towelB.visible = towelR.visible = onBody; towelH.visible = tOn <= 0 || tOff >= 1;
      if (tOn > 0 && tOn < 1 || tOff > 0 && tOff < 1) {
        const u = tOn > 0 && tOn < 1 ? E.io(tOn) : 1 - E.io(tOff); TN.userData.B.getWorldPosition(tmp2); tmp2.y += 0.5;
        towelF.visible = true; towelF.position.copy(towelH.position).lerp(tmp2, u); towelF.position.y += Math.sin(u * Math.PI) * 0.35; towelF.rotation.set(u * 2.5, u * 4.0, u * 1.2); towelF.scale.set(1 + 0.3 * Math.sin(u * Math.PI), 1 - 0.3 * Math.sin(u * Math.PI), 1);
      } else towelF.visible = false;
      // camera + DOF
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const flash = ov('tdflash', ''); tl.set(flash, { autoAlpha: 0 }, 0); const tF = K.write - 0.38; tl.fromTo(flash, { autoAlpha: 0.9 }, { autoAlpha: 0, duration: 0.35, ease: 'power2.out', immediateRender: false }, tF);
    const photo = ov('tdphoto boil', '<i class="tdboil"><b>F28</b></i>'); tl.set(photo, { autoAlpha: 0, left: 540, top: 900, xPercent: -50, yPercent: -50 }, 0);
    tl.fromTo(photo, { autoAlpha: 0, scale: 1.25, rotation: -8 }, { autoAlpha: 1, scale: 1, rotation: 4, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, tF + 0.05);
    tl.to(photo, { left: 760, top: 330, scale: 0.26, rotation: 0, autoAlpha: 0, filter: 'blur(6px)', duration: 0.42, ease: 'power3.in' }, K.write - 0.15);
    const m1 = ov('tdchat in', `<b>${S.who}</b><span class="tdth tdboil"><b>F28</b></span>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.boiler - 0.35); k.popOut(m2, K.boiler - 0.29);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.boiler - 0.2);
    cd.line(0, K.photo - 0.1); cd.line(1, K.steps - 0.05); cd.line(2, K.min - 0.3);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const eT = ov('tdtag warn', '⚠️ ' + S.err); k.popIn(eT, K.boiler + 0.3, { y: 30 }); k.popOut(eT, K.reset - 0.1, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.reset + 0.05, { y: 30 }); k.popOut(s1, K.steps - 0.12, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.steps - 0.1, { y: 30 }); k.popOut(s2, K.hot - 0.02, { y: -40 });
    const hT = ov('tdtag hotT', S.temp); k.popIn(hT, K.hot + 0.12, { y: 30, s0: 0.4 }); k.popOut(hT, tB1 - 0.15, { y: -40 });
    const tm = ov('tdtimer', '<i></i><b>5:00</b>'); tl.set(tm, { xPercent: -50 }, 0); k.popIn(tm, tB1 - 0.1, { y: 40 }); k.popOut(tm, K.no - 0.12, { y: -40 });
    const tmB = tm.querySelector('b'), tmI = tm.querySelector('i');
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      const u = seg(t, tB1 - 0.05, 0.6), sl = Math.round(300 * (1 - u)); const lbl = u >= 1 ? '✓' : `${Math.floor(sl / 60)}:${String(sl % 60).padStart(2, '0')}`; if (tmB.textContent !== lbl) tmB.textContent = lbl; tmI.style.background = `conic-gradient(#e09b6b ${(1 - u) * 360}deg, rgba(255,255,255,.15) 0)`;
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(eT, new T3.Vector3(1.15, 2.06, -1.3)); at(s1, new T3.Vector3(1.26, 1.98, -1.3)); at(s2, new T3.Vector3(1.15, 1.32, -1.3));
      at(hT, new T3.Vector3(1.07, 1.8, -1.28)); at(okT, new T3.Vector3(-2.2, 2.55, -0.9));
    });
    sfx('shower', 0, -9, { dur: K.dies + 0.9 }); sfx('frost', K.cold + 0.02, -8); sfx('whoosh', tJ, -12); sfx('whoosh', K.dies + 0.12, -14);
    sfx('errbeep', K.dies + 0.55, -14); sfx('errbeep', K.write - 0.95, -17); sfx('shutter', tF, -10); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12);
    sfx('refresh', K.boiler, -14); sfx('click', K.reset + 0.2, -4); sfx('click', K.steps + 0.1, -6); sfx('ignite', K.hot - 0.55, -6); sfx('flow', K.hot + 0.3, -10);
    sfx('shower', tB1, -10, { dur: 2.2 }); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
  function X56() {
    const de = lang === 'de';
    const S = de ? { chip: '🕖 19:40 · Whg 2A', who: 'Mieterin · Whg 2A', m1: 'Strom weg 😱 Die ganze Küche ist dunkel', m2: 'Der Herd hat Sicherung B3 ausgelöst. Kasten öffnen und wieder hochschalten ✓', ttl: 'Stromausfall · Whg 2A', l1: '⚡ Ausgelöst: Sicherung B3 (Herd)', l2: '☝️ Wieder hochschalten', l3: '💡 Strom zurück · 2 Min.', err: 'B3 · Herd', s1: '☝️ Hochschalten', ok: '✓ Kein Elektriker nötig', end: ['In *2 Minuten* gelöst.', null] }
      : { chip: '🕖 7:40 pm · Apt 2A', who: 'Tenant · Apt 2A', m1: 'Power just went out 😱 The whole kitchen is dark', m2: 'The oven tripped breaker B3. Open the fuse box and flip it back up ✓', ttl: 'Power out · Apt 2A', l1: '⚡ Tripped: breaker B3 (oven)', l2: '☝️ Flip it back up', l3: '💡 Power back · 2 min', err: 'B3 · oven', s1: '☝️ Flip it up', ok: '✓ No electrician needed', end: ['Fixed in *2 minutes*.', null] };
    const K = {};
    K.dark = W(['dunkel', 'goes']).start - 0.04; K.write = W(['schreibt', 'writes']).start;
    const it = W(['Tenance']); K.turn = it.start; K.ans = W(['antwortet', 'answers'], it.i).start;
    K.trip = W(['Sicherung', 'breaker'], it.i).start; K.box = W(['Sicherungskasten', 'flip'], it.i).start; K.flip = W(['einschalten', 'box'], it.i).start;
    K.power = W(['Strom', 'power'], it.i).start; K.min = W(['Minuten', 'minutes'], it.i).start; K.no = W(['Kein', 'No'], it.i).start; K.cta = W(['Jetzt', 'Join'], it.i).start;
    const k = TDX({ sky: 'night', envTop: '#fff3e2', envBot: '#2d2a26', envInt: 0.75, fov: 30, pro: true });
    const { scene, MC, ov } = k;
    const SH = (window.PR || 1) >= 2 ? 4096 : 2048;
    const hemi = new T3.HemisphereLight('#fff3e6', '#3a3430', 0.32); scene.add(hemi);
    const shadowed = (l, b = 6) => { l.castShadow = true; l.shadow.mapSize.set(SH, SH); Object.assign(l.shadow.camera, { left: -b, right: b, top: b, bottom: -b, near: 0.5, far: 40 }); l.shadow.radius = 3; l.shadow.bias = -0.0004; l.shadow.normalBias = 0.02; };
    const sun = new T3.DirectionalLight('#ff9f6a', 0.5); sun.position.set(6.5, 5.5, -7.5); sun.target.position.set(1.4, 0, 0); scene.add(sun.target); shadowed(sun); scene.add(sun);
    const keyL = new T3.DirectionalLight('#fff4ea', 0.7); keyL.position.set(-3.5, 6.5, 6.5); shadowed(keyL); scene.add(keyL);
    const fill = new T3.DirectionalLight('#d4e2ff', 0.3); fill.position.set(3, 2, 9); scene.add(fill);
    const D = new T3.Group(); scene.add(D);
    // ---- canvas textures ----
    const cvs = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 8; return t; };
    const tiles = (nx, ny, base, grout, jit) => cvs(512, 512, (x, w, h) => { x.fillStyle = grout; x.fillRect(0, 0, w, h); const tw = w / nx, th = h / ny; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const v = (MC.rnd(i * 31 + j, 3) - 0.5) * jit; const c = new T3.Color(base); c.offsetHSL(0, 0, v); x.fillStyle = '#' + c.getHexString(); x.fillRect(i * tw + 2, j * th + 2, tw - 4, th - 4); x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(i * tw + 3, j * th + 3, tw - 6, 3); } });
    const wood = cvs(512, 512, (x, w, h) => { for (let i = 0; i < 8; i++) { const c = new T3.Color('#b98a5e'); c.offsetHSL(0, 0, (MC.rnd(i, 7) - 0.5) * 0.08); x.fillStyle = '#' + c.getHexString(); x.fillRect(0, i * 64, w, 64); x.strokeStyle = 'rgba(60,35,20,0.35)'; x.lineWidth = 2; x.strokeRect(-2, i * 64, w + 4, 64); for (let g = 0; g < 9; g++) { x.strokeStyle = 'rgba(90,55,30,0.18)'; x.beginPath(); const y0 = i * 64 + 6 + MC.rnd(i * 9 + g, 2) * 52; x.moveTo(0, y0); x.bezierCurveTo(w * 0.3, y0 + 4, w * 0.6, y0 - 4, w, y0 + 2); x.stroke(); } } });
    const wallTile = tiles(10, 12, '#9fbdb2', '#7e968d', 0.05), floorTile = tiles(6, 6, '#4f5f66', '#36434a', 0.06);
    [wallTile, floorTile, wood].forEach((t) => { t.wrapS = t.wrapT = T3.RepeatWrapping; });
    const cloud = cvs(128, 128, (x) => { for (let i = 0; i < 7; i++) { const cx = 40 + MC.rnd(i, 1) * 48, cy = 40 + MC.rnd(i, 2) * 48, rr = 22 + MC.rnd(i, 3) * 26; const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); } });
    const frostT = cvs(512, 512, (x, w, h) => { x.fillStyle = 'rgba(235,245,255,0.16)'; x.fillRect(0, 0, w, h); x.lineCap = 'round'; for (let i = 0; i < 340; i++) { let px = MC.rnd(i, 1) * w, py = MC.rnd(i, 2) * h, an = MC.rnd(i, 3) * 6.28; x.strokeStyle = `rgba(255,255,255,${0.25 + MC.rnd(i, 4) * 0.5})`; x.lineWidth = 0.8 + MC.rnd(i, 5) * 1.6; x.beginPath(); x.moveTo(px, py); for (let s = 0; s < 7; s++) { an += (MC.rnd(i * 7 + s, 6) - 0.5) * 1.1; const L = 6 + MC.rnd(i * 7 + s, 7) * 18; px += Math.cos(an) * L; py += Math.sin(an) * L; x.lineTo(px, py); if (s % 2) { x.moveTo(px, py); x.lineTo(px + Math.cos(an + 1) * L * 0.5, py + Math.sin(an + 1) * L * 0.5); x.moveTo(px, py); } } x.stroke(); } });
    const fogT = cvs(256, 256, (x, w, h) => { x.fillStyle = 'rgba(232,240,248,0.7)'; x.fillRect(0, 0, w, h); for (let i = 0; i < 600; i++) { x.fillStyle = `rgba(255,255,255,${0.15 + MC.rnd(i, 2) * 0.3})`; x.beginPath(); x.arc(MC.rnd(i, 3) * w, MC.rnd(i, 4) * h, 1 + MC.rnd(i, 1) * 3, 0, 7); x.fill(); } });
    const grad = (stops, w = 8, h = 256) => cvs(w, h, (x) => { const g = x.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); });
    // ---- studio backdrop + base ----
    const bg = new T3.Mesh(new T3.SphereGeometry(40, 32, 16), new T3.MeshBasicMaterial({ map: grad([[0, '#0d1018'], [0.42, '#1d1c26'], [0.52, '#2b2730'], [1, '#121219']]), side: T3.BackSide, depthWrite: false })); scene.add(bg);
    mesh(rbox(7.2, 0.32, 3.7, 0.06), M.std('#26262e', { roughness: 0.85 }), D, [0.12, -0.16, -0.15]);
    // floors
    const fl = (tex, rep, x0, x1) => { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(...rep); t.wrapS = t.wrapT = T3.RepeatWrapping; return mesh(new T3.PlaneGeometry(x1 - x0, 3.3), M.std('#ffffff', { map: t, roughness: 0.55 }), D, [(x0 + x1) / 2, 0.002, -0.05], [-Math.PI / 2, 0, 0]); };
    fl(floorTile, [3, 3], -3.25, 0); const wf = fl(wood, [2.5, 3], 0, 3.45); wf.material.roughness = 0.62;
    // walls (cutaway: back + left + partition + right), tiles in the bathroom
    const wallM = M.std('#efe3d0', { roughness: 0.92 }), trimM = M.std('#f7f3ec', { roughness: 0.6 });
    const box = (w, h, d, mat, pos) => mesh(new T3.BoxGeometry(w, h, d), mat, D, pos);
    box(3.3, 2.65, 0.14, wallM, [-1.6, 1.325, -1.67]);                                                            // bathroom back
    box(1.7, 2.65, 0.14, wallM, [0.85, 1.325, -1.67]); box(0.85, 2.65, 0.14, wallM, [3.03, 1.325, -1.67]);       // kitchen back (window 1.7..2.6)
    box(0.9, 1.15, 0.14, wallM, [2.15, 0.575, -1.67]); box(0.9, 0.5, 0.14, wallM, [2.15, 2.4, -1.67]);
    box(0.14, 2.65, 3.3, wallM, [-3.32, 1.325, -0.05]);                                                            // left
    box(0.1, 2.65, 0.55, wallM, [0, 1.325, -1.325]);                                                                  // partition
    box(0.12, 2.65, 2.0, wallM, [3.51, 1.325, -0.65]);                                                             // right
    [[-1.6, -1.67, 3.4, 0.2], [1.8, -1.67, 3.6, 0.2]].forEach(([x, z, w, d]) => box(w, 0.07, d, trimM, [x, 2.68, z]));
    box(0.2, 0.07, 3.35, trimM, [-3.32, 2.68, -0.05]); box(0.14, 0.07, 0.59, trimM, [0, 2.68, -1.325]); box(0.16, 0.07, 2.04, trimM, [3.51, 2.68, -0.65]);
    const tw = (w, h, pos, rot, rep) => { const t = wallTile.clone(); t.needsUpdate = true; t.repeat.set(...rep); return mesh(new T3.PlaneGeometry(w, h), M.std('#ffffff', { map: t, roughness: 0.25, metalness: 0.0 }), D, pos, rot); };
    tw(3.25, 2.6, [-1.62, 1.3, -1.598], [0, 0, 0], [3.2, 2.6]); tw(3.3, 2.6, [-3.248, 1.3, -0.05], [0, Math.PI / 2, 0], [3.2, 2.6]);
    box(3.4, 0.09, 0.02, M.std('#e8dccb'), [1.75, 0.045, -1.595]);                                                 // skirting (kitchen)
    // ---- shower: tray, glass (with frost), chrome head + riser, mixer ----
    const chrome = M.std('#e8ecf0', { metalness: 1, roughness: 0.12 });
    mesh(rbox(1.2, 0.09, 1.08, 0.03), M.std('#f8f8f6', { roughness: 0.3 }), D, [-2.66, 0.045, -1.06]);
    mesh(new T3.CircleGeometry(0.05, 20), chrome, D, [-2.66, 0.092, -1.0], [-Math.PI / 2, 0, 0]);
    const glassM = new T3.MeshPhysicalMaterial({ color: '#e6f4ff', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, side: T3.DoubleSide, envMapIntensity: 1.6, clearcoat: 1 });
    const frostM = () => new T3.ShaderMaterial({ uniforms: { tF: { value: frostT }, uG: { value: 0 }, uM: { value: 0 } }, transparent: true, depthWrite: false, side: T3.DoubleSide,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D tF; uniform float uG, uM; varying vec2 vUv; void main(){ vec4 f = texture2D(tF, vUv); float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)) * 2.0; float a = f.a * smoothstep(uG, uG - 0.22, e) * (1.0 - uM); gl_FragColor = vec4(vec3(0.92, 0.97, 1.0) * 1.5, a * 0.95); }' });
    const panes = [[1.17, 2.0, [-2.03, 1.09, -0.98], [0, Math.PI / 2, 0]]].map(([w, h, pos, rot]) => {
      mesh(new T3.PlaneGeometry(w, h), glassM, D, pos, rot).castShadow = false;
      const fm = frostM(); const f = mesh(new T3.PlaneGeometry(w, h), fm, D, pos, rot); f.castShadow = false; f.renderOrder = 2;
      const g = new T3.Group(); g.position.set(...pos); g.rotation.set(...rot); D.add(g); [[0, h / 2], [0, -h / 2]].forEach(([dx, dy]) => mesh(new T3.BoxGeometry(w, 0.025, 0.025), chrome, g, [dx, dy, 0])); [[-w / 2], [w / 2]].forEach(([dx]) => mesh(new T3.BoxGeometry(0.025, h, 0.025), chrome, g, [dx, 0, 0]));
      return fm;
    });
    mesh(new T3.CylinderGeometry(0.018, 0.018, 1.0, 12), chrome, D, [-2.6, 1.6, -1.575]);                           // riser
    mesh(new T3.CylinderGeometry(0.016, 0.016, 0.34, 12), chrome, D, [-2.6, 2.08, -1.42], [Math.PI / 2, 0, 0]);       // arm
    const head = new T3.Group(); head.position.set(-2.6, 2.06, -1.24); head.rotation.x = 0.45; D.add(head);
    mesh(new T3.CylinderGeometry(0.12, 0.09, 0.035, 28), chrome, head, [0, 0, 0]);
    mesh(new T3.CircleGeometry(0.105, 28), M.std('#9aa3ad', { metalness: 0.8, roughness: 0.4 }), head, [0, -0.0185, 0], [Math.PI / 2, 0, 0]);
    mesh(rbox(0.16, 0.08, 0.06, 0.02), chrome, D, [-2.6, 1.1, -1.57]); mesh(new T3.CylinderGeometry(0.012, 0.012, 0.13, 8), chrome, D, [-2.55, 1.14, -1.53], [0, 0, 1.2]);
    // bath mat, vanity + basin + mirror (fog), wall light, towel hook + towel, plant
    mesh(rbox(0.62, 0.02, 0.42, 0.01), M.std('#7fb3a6', { roughness: 0.95 }), D, [-2.25, 0.012, -0.12]);
    mesh(rbox(0.82, 0.74, 0.46, 0.03), M.std('#c9a27a', { roughness: 0.6 }), D, [-1.05, 0.37, -1.35]);
    mesh(rbox(0.74, 0.07, 0.44, 0.03), M.std('#fbfbf9', { roughness: 0.25 }), D, [-1.05, 0.775, -1.35]);
    mesh(new T3.CylinderGeometry(0.012, 0.012, 0.16, 10), chrome, D, [-1.05, 0.86, -1.5]); mesh(new T3.CylinderGeometry(0.01, 0.01, 0.1, 8), chrome, D, [-1.05, 0.93, -1.46], [Math.PI / 2, 0, 0]);
    mesh(new T3.PlaneGeometry(0.7, 0.84), M.std('#c9d2db', { metalness: 1, roughness: 0.06 }), D, [-1.05, 1.58, -1.59]);
    const mirFog = mesh(new T3.PlaneGeometry(0.7, 0.84), new T3.MeshBasicMaterial({ map: fogT, transparent: true, depthWrite: false, opacity: 0.8 }), D, [-1.05, 1.58, -1.585]); mirFog.castShadow = false;
    const mirBar = mesh(rbox(0.5, 0.05, 0.05, 0.02), new T3.MeshBasicMaterial({ color: new T3.Color(2.2, 1.9, 1.5) }), D, [-1.05, 2.07, -1.56]);
    const wl = new T3.PointLight('#ffd7a8', 1.6, 5); wl.position.set(-1.05, 2.0, -1.2); D.add(wl);
    const showerL = new T3.PointLight('#ffe2c0', 1.2, 3.5); showerL.position.set(-2.5, 2.1, -0.8); D.add(showerL);
    mesh(new T3.CylinderGeometry(0.015, 0.015, 0.08, 8), chrome, D, [-1.75, 1.62, -1.56], [Math.PI / 2, 0, 0]);
    const towelM = M.std('#f0b84a', { roughness: 0.95 });
    const towelH = mesh(rbox(0.38, 0.62, 0.06, 0.03), towelM, D, [-1.75, 1.33, -1.53]);
    const towelF = mesh(rbox(0.38, 0.62, 0.06, 0.03), towelM, D, [0, 0, 0]); towelF.visible = false;
    const plant = (x, y, z, s) => { const g = new T3.Group(); g.position.set(x, y, z); g.scale.setScalar(s); D.add(g); mesh(new T3.CylinderGeometry(0.16, 0.12, 0.3, 16), M.std('#c86b3c'), g, [0, 0.15, 0]); [[0, 0.55, 0, 0.26], [0.13, 0.45, 0.06, 0.2], [-0.12, 0.47, -0.05, 0.19]].forEach(([a, b, c, rr]) => mesh(new T3.SphereGeometry(rr, 14, 10), M.std('#3d7a4f', { roughness: 0.8 }), g, [a, b, c])); return g; };
    plant(-0.38, 0, -1.3, 1.0);
    // ---- kitchen: window (winter morning outside), counter, kettle, fridge, clock ----
    const frameM = M.std('#f6f3ee', { roughness: 0.5 });
    [[2.15, 1.15, 0.92, 0.07], [2.15, 2.15, 0.92, 0.07], [1.7, 1.65, 0.07, 1.06], [2.6, 1.65, 0.07, 1.06], [2.15, 1.65, 0.04, 1.0]].forEach(([x, y, w, h]) => box(w, h, 0.16, frameM, [x, y, -1.67]));
    box(1.0, 0.05, 0.26, frameM, [2.15, 1.13, -1.56]);
    const sky = mesh(new T3.PlaneGeometry(9, 5), new T3.MeshBasicMaterial({ map: grad([[0, '#1d2a4a'], [0.55, '#5a4a6e'], [1, '#e08a5a']]) }), D, [2.4, 1.7, -6.2]); sky.castShadow = false;
    for (let i = 0; i < 7; i++) { const w = 0.8 + MC.rnd(i, 1) * 0.9, h = 0.5 + MC.rnd(i, 2) * 1.0, x = -0.4 + i * 0.85 + MC.rnd(i, 3) * 0.3, z = -3.6 - MC.rnd(i, 4) * 1.6; box(w, h, 0.9, M.std('#8a7f86', { roughness: 0.9 }), [x, 0.4 + h / 2, z]); box(w + 0.06, 0.07, 0.96, M.std('#f4f7fb', { roughness: 0.9 }), [x, 0.4 + h + 0.03, z]); }
    const sunG = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, color: new T3.Color(1.6, 1.2, 0.8) })); sunG.position.set(4.2, 2.3, -6.0); sunG.scale.setScalar(3.2); D.add(sunG);
    const shaftT = grad([[0, 'rgba(255,230,190,0.0)'], [0.15, 'rgba(255,230,190,0.55)'], [1, 'rgba(255,230,190,0.0)']], 8, 128);
    const sdir = new T3.Vector3().subVectors(sun.target.position, sun.position).normalize();
    [[-0.25, 0.85], [0.18, 0.7], [0.0, 1.0]].forEach(([dx, wv], i) => {
      const p0 = new T3.Vector3(2.15 + dx, 1.65 + (i - 1) * 0.15, -1.66), L = 1.9 / -sdir.y, mid = p0.clone().addScaledVector(sdir, L / 2);
      const m = new T3.Mesh(new T3.PlaneGeometry(wv * 0.55, L), new T3.MeshBasicMaterial({ map: shaftT, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, opacity: 0.0, side: T3.DoubleSide }));
      m.position.copy(mid); m.up.copy(sdir).negate(); m.lookAt(mid.clone().add(new T3.Vector3(0, 0, 1))); D.add(m);
    });
    mesh(rbox(1.0, 0.86, 0.6, 0.03), M.std('#2f5a44', { roughness: 0.55 }), D, [2.2, 0.43, -1.3]);
    mesh(rbox(1.06, 0.05, 0.64, 0.02), M.std('#dccab0', { roughness: 0.45 }), D, [2.2, 0.885, -1.3]);
    [1.95, 2.45].forEach((x) => mesh(new T3.BoxGeometry(0.16, 0.02, 0.02), chrome, D, [x, 0.75, -0.99]));
    const kettle = new T3.Group(); kettle.position.set(2.56, 0.91, -1.4); D.add(kettle); mesh(new T3.CylinderGeometry(0.085, 0.1, 0.2, 20), M.std('#d23b30', { roughness: 0.35, metalness: 0.2 }), kettle, [0, 0.1, 0]); mesh(new T3.TorusGeometry(0.05, 0.012, 8, 16, Math.PI), M.std('#2b2b2b'), kettle, [0, 0.22, 0]);
    
    plant(2.05, 1.155, -1.56, 0.45);
    mesh(rbox(0.64, 1.86, 0.64, 0.05), M.std('#e9edf2', { roughness: 0.3, metalness: 0.15 }), D, [3.1, 0.93, -1.25]); mesh(new T3.BoxGeometry(0.03, 0.5, 0.04), chrome, D, [2.83, 1.25, -0.92]); mesh(new T3.BoxGeometry(0.64, 0.01, 0.01), M.std('#c5ccd4'), D, [3.1, 1.32, -0.93]);
    const clock = new T3.Group(); clock.position.set(2.95, 2.18, -1.585); D.add(clock);
    mesh(new T3.CylinderGeometry(0.15, 0.15, 0.03, 32), M.std('#1d4734'), clock, [0, 0, 0], [Math.PI / 2, 0, 0]); mesh(new T3.CircleGeometry(0.13, 32), M.std('#faf6ee'), clock, [0, 0, 0.016]);
    const hand = (L, wv, c) => { const g = new T3.Group(); g.position.z = 0.02; clock.add(g); mesh(new T3.BoxGeometry(wv, L, 0.005), M.std(c), g, [0, L / 2 - 0.015, 0]); return g; };
    const hH = hand(0.07, 0.012, '#14261b'), hM = hand(0.105, 0.008, '#14261b'), hS = hand(0.11, 0.004, '#e09b6b');
    hH.rotation.z = -(7 + 10 / 60) / 12 * Math.PI * 2; hM.rotation.z = -10 / 60 * Math.PI * 2;
    // ---- X56: hob + pan, pendant lamp, fuse box, cable from the box to the lamp ----
    mirFog.visible = false;
    const hob = new T3.Group(); hob.position.set(2.0, 0.912, -1.25); D.add(hob);
    mesh(rbox(0.56, 0.02, 0.4, 0.01), M.std('#15171a', { roughness: 0.15, metalness: 0.3 }), hob, [0, 0, 0]);
    const ringM = new T3.MeshBasicMaterial({ color: new T3.Color(2.4, 0.5, 0.15) });
    [[-0.13, 0.04], [0.14, -0.05]].forEach(([x, z]) => { mesh(new T3.TorusGeometry(0.08, 0.008, 6, 32), ringM, hob, [x, 0.012, z], [Math.PI / 2, 0, 0]).castShadow = false; });
    const pan = new T3.Group(); pan.position.set(-0.13, 0.02, 0.04); hob.add(pan);
    const panM = M.std('#2b2b2e', { metalness: 0.6, roughness: 0.35 }); panM.side = T3.DoubleSide;
    mesh(new T3.CylinderGeometry(0.12, 0.1, 0.05, 28, 1, true), panM, pan, [0, 0.025, 0]); mesh(new T3.CylinderGeometry(0.1, 0.1, 0.006, 28), panM, pan, [0, 0.003, 0]);
    mesh(new T3.CylinderGeometry(0.012, 0.012, 0.2, 8), M.std('#1a1a1a'), pan, [0.2, 0.045, 0], [0, 0, Math.PI / 2 - 0.15]);
    const food = [...Array(9)].map((_, i) => mesh(new T3.SphereGeometry(0.02 + MC.rnd(i, 2) * 0.012, 10, 8), M.std(i % 3 ? '#e0913f' : '#5a9a3c', { roughness: 0.6 }), pan, [(MC.rnd(i, 3) - 0.5) * 0.14, 0.022, (MC.rnd(i, 4) - 0.5) * 0.14]));
    const panSteam = [...Array(16)].map((_, i) => { const m = new T3.Sprite(new T3.SpriteMaterial({ map: cloud, transparent: true, depthWrite: false, opacity: 0 })); m.renderOrder = 4; D.add(m); return { m, ph: MC.rnd(i, 1), sp: 0.5 + MC.rnd(i, 2) * 0.4, dx: (MC.rnd(i, 3) - 0.5) * 0.12 }; });
    const lampG = new T3.Group(); lampG.position.set(2.1, 0, -0.95); D.add(lampG);
    mesh(new T3.CylinderGeometry(0.006, 0.006, 0.6, 6), M.std('#222'), lampG, [0, 2.37, 0]);
    const shadeM = M.std('#1d4734', { roughness: 0.45, metalness: 0.2 }); shadeM.side = T3.DoubleSide;
    mesh(new T3.ConeGeometry(0.2, 0.18, 32, 1, true), shadeM, lampG, [0, 2.0, 0]);
    const bulbM = new T3.MeshBasicMaterial({ color: new T3.Color(3, 2.4, 1.6) }); mesh(new T3.SphereGeometry(0.045, 16, 12), bulbM, lampG, [0, 1.93, 0]).castShadow = false;
    const lampGl = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, color: new T3.Color(1.4, 1.0, 0.6) })); lampGl.position.set(2.1, 1.92, -0.95); lampGl.scale.setScalar(0.5); D.add(lampGl);
    const lampL = new T3.PointLight('#ffd09a', 2.2, 6); lampL.position.set(2.1, 1.82, -0.95); D.add(lampL);
    // fuse box: body, door (hinged left), 2 rows x 6 breakers; B3 (top row, 3rd) has tripped
    const FB = new T3.Group(); FB.position.set(0.8, 1.5, -1.55); D.add(FB);
    mesh(rbox(0.5, 0.64, 0.1, 0.02), M.std('#e9e6df', { roughness: 0.45 }), FB, [0, 0, 0]);
    mesh(new T3.PlaneGeometry(0.44, 0.58), M.std('#bdb7ac', { roughness: 0.8 }), FB, [0, 0, 0.051]);
    [0.12, -0.12].forEach((y) => mesh(new T3.BoxGeometry(0.42, 0.02, 0.01), chrome, FB, [0, y, 0.056]));
    const levers = []; let B3 = null;
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {
      const g = new T3.Group(); g.position.set(-0.165 + i * 0.066, 0.12 - r * 0.24, 0.085); FB.add(g);
      mesh(rbox(0.058, 0.13, 0.05, 0.006), M.std('#f7f6f2', { roughness: 0.4 }), g, [0, 0, 0]);
      const trip = r === 0 && i === 2; const lv = mesh(rbox(0.03, 0.04, 0.03, 0.006), M.std(trip ? '#d23b30' : '#2b3036', { roughness: 0.4 }), g, [0, trip ? -0.025 : 0.025, 0.03]);
      const ind = mesh(new T3.PlaneGeometry(0.036, 0.01), new T3.MeshBasicMaterial({ color: trip ? '#ff3b30' : '#5ac86a' }), g, [0, -0.05, 0.026]);
      levers.push(lv); if (trip) B3 = { g, lv, ind };
    }
    const door = new T3.Group(); door.position.set(-0.25, 0, 0.06); FB.add(door);
    mesh(rbox(0.5, 0.64, 0.02, 0.02), M.std('#efece6', { roughness: 0.4 }), door, [0.25, 0, 0]); mesh(rbox(0.02, 0.1, 0.02, 0.006), M.std('#9aa3ad', { metalness: 0.6 }), door, [0.46, 0, 0.018]);
    mesh(new T3.PlaneGeometry(0.06, 0.06), new T3.MeshBasicMaterial({ color: '#f2c230' }), door, [0.25, 0.2, 0.011]);
    const brkM = new T3.MeshBasicMaterial({ color: new T3.Color(0.5, 2.2, 0.8), transparent: true, opacity: 0, depthWrite: false });
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sy]) => { const g = new T3.Group(); g.position.set(B3.g.position.x + sx * 0.045, B3.g.position.y + sy * 0.08, 0.12); FB.add(g); mesh(new T3.BoxGeometry(0.024, 0.004, 0.002), brkM, g, [-sx * 0.012, 0, 0]); mesh(new T3.BoxGeometry(0.004, 0.024, 0.002), brkM, g, [0, -sy * 0.012, 0]); });
    const scanM = new T3.MeshBasicMaterial({ color: new T3.Color(0.6, 3.0, 1.0), transparent: true, opacity: 0, blending: T3.AdditiveBlending, depthWrite: false });
    const scan = mesh(new T3.PlaneGeometry(0.46, 0.006), scanM, FB, [0, 0, 0.12]); scan.castShadow = false;
    // cable: box → up the wall → along the top → out to the pendant (lights up as power flows)
    const curve = new T3.CatmullRomCurve3([[0.8, 1.83, -1.58], [0.8, 2.45, -1.58], [0.95, 2.56, -1.58], [1.95, 2.56, -1.58], [2.1, 2.58, -1.45], [2.1, 2.62, -1.0], [2.1, 2.66, -0.95]].map((p) => new T3.Vector3(...p)), false, 'centripetal', 0.3);
    const NSEG = 70, pts = curve.getSpacedPoints(NSEG), segs = [], up = new T3.Vector3(0, 1, 0), qq = new T3.Quaternion(), cabM = M.std('#f4f1ea', { roughness: 0.5 });
    for (let i = 0; i < NSEG; i++) { const a = pts[i], b = pts[i + 1], len = a.distanceTo(b); const mat = cabM.clone(); mat.emissive = new T3.Color(0, 0, 0); const m = mesh(new T3.CylinderGeometry(0.012, 0.012, len * 1.04, 8, 1, true), mat, D, [0, 0, 0]); m.position.copy(a).lerp(b, 0.5); qq.setFromUnitVectors(up, b.clone().sub(a).normalize()); m.quaternion.copy(qq); segs.push(m); }
    const pulse = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, color: new T3.Color(0.9, 1.7, 3.2) })); pulse.scale.setScalar(0.3); D.add(pulse);
    // ---- tenant (apron) with phone + phone flashlight ----
    const TN = k.fig(D, '#e8b98f', 1.45, 0, -0.95, 0.95, '#7a3b1e');
    const shirtM = M.std('#2f6b8f', { roughness: 0.85 }); mesh(new T3.CylinderGeometry(0.214, 0.236, 0.56, 24, 1, true), shirtM, TN.userData.B, [0, 0.48, 0]); mesh(new T3.TorusGeometry(0.2, 0.03, 8, 24), shirtM, TN.userData.B, [0, 0.76, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const flash = new T3.SpotLight('#eef4ff', 0, 8, 0.42, 0.55, 1.4); D.add(flash); D.add(flash.target);
    const beamG = new T3.Group(); D.add(beamG); const beamM = new T3.MeshBasicMaterial({ color: new T3.Color(0.55, 0.6, 0.7), transparent: true, opacity: 0, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide });
    const beam = mesh(new T3.ConeGeometry(0.42, 1.7, 28, 1, true), beamM, beamG, [0, 0, 0.85], [-Math.PI / 2, 0, 0]); beam.castShadow = false; beam.renderOrder = 5;
    const STOVE = new T3.Vector3(1.45, 0, -0.95), BOXP = new T3.Vector3(0.36, 0, -1.0);
    const tW2 = K.trip - 0.2, tW1 = Math.min(K.ans + 0.15, tW2 - 0.9), tB0 = K.power + 0.5, tB1 = tB0 + 0.8;
    const vTN = (t) => t < tW1 ? STOVE.clone() : (t < tB0 ? STOVE.clone().lerp(BOXP, E.io(seg(t, tW1, tW2 - tW1))) : BOXP.clone().lerp(STOVE, E.io(seg(t, tB0, tB1 - tB0))));
    // ---- light state: on → flicker off at K.dark → dark → flicker back on when the power front reaches the lamp ----
    const offF = (u) => u < 0 ? 1 : (u < 0.04 ? 0.3 : (u < 0.08 ? 0.8 : (u < 0.12 ? 0.15 : 0)));
    const onF = (u) => u < 0 ? 0 : (u < 0.05 ? 0.8 : (u < 0.1 ? 0.05 : (u < 0.14 ? 0.9 : (u < 0.2 ? 0.1 : Math.min(1, 0.6 + (u - 0.2) * 3)))));
    const pw = (t) => t < K.power ? offF(t - K.dark) : onF(t - K.power);
    const pfront = (t) => E.io(seg(t, K.flip + 0.2, Math.max(0.3, K.power - K.flip - 0.2)));
    const flashOn = (t) => E.io(seg(t, K.dark + 0.6, 0.12)) * (1 - E.io(seg(t, K.power + 0.35, 0.2)));
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.75, 2.2, 1.42, 1.72, 1.05, -1.05)],
      [K.dark - 0.05, P(0.7, 1.8, 1.38, 1.65, 1.08, -1.0), E.lin],
      [K.dark + 0.4, PT(0.45, 2.4, 1.32, 1.08, 20, 0.03), A9],
      [K.write - 0.5, PT(0.45, 2.5, 1.3, 1.05, 21), E.lin],
      [K.write + 0.15, PT(0.5, 1.7, 1.42, 1.0, 26), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 0.1, 1.15, -0.55), A6],
      [K.trip - 0.3, P(0.0, 9.2, 2.6, 0.1, 1.15, -0.55), E.lin],
      [K.trip + 0.15, P(0.3, 2.3, 1.6, 0.8, 1.5, -1.5), A9],
      [K.flip - 0.1, P(0.35, 1.7, 1.55, 0.8, 1.55, -1.5, 28), E.io],
      [K.flip + 0.12, P(0.38, 1.6, 1.55, 0.8, 1.57, -1.5, 28), E.lin],
      [K.flip + 0.32, P(0.25, 4.4, 2.3, 1.45, 2.05, -1.3, 34), A6],
      [K.power + 0.1, P(0.25, 4.3, 2.25, 1.45, 2.0, -1.3, 34), E.lin],
      [K.power + 0.55, P(0.3, 4.2, 2.0, 1.6, 1.6, -1.1, 32), E.io],
      [K.min + 0.25, P(0.75, 2.3, 1.42, 1.7, 1.05, -1.05), A6],
      [K.no + 0.35, P(0.4, 4.6, 1.9, 1.6, 1.15, -0.8), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3(), tmp2 = new T3.Vector3(), elecE = new T3.Color(0.9, 1.8, 3.4), black = new T3.Color(0, 0, 0), moon = new T3.Color('#7f9cff'), fillC = new T3.Color('#d4e2ff');
    k.frame((t) => {
      const p = pw(t), fo = flashOn(t);
      const g = k.grade; g.temp = lerp(-0.6, 0.38, p); g.exp = lerp(0.5, 1.0, p); scene.environmentIntensity = 0.1 + 0.9 * p; g.vig = 0.28 + 0.3 * (1 - p); g.th = 1.6; g.bloom = 0.35 + 0.35 * Math.exp(-Math.pow((t - K.power - 0.2) / 0.2, 2)); g.sat = lerp(0.85, 1.06, p);
      keyL.intensity = 0.7 * (0.05 + 0.95 * p); hemi.intensity = 0.32 * (0.1 + 0.9 * p); fill.intensity = 0.3 + 0.1 * (1 - p); fill.color.copy(fillC).lerp(moon, 1 - p);
      lampL.intensity = 2.2 * p; bulbM.color.setRGB(0.15 + 2.85 * p, 0.12 + 2.28 * p, 0.1 + 1.5 * p); lampGl.material.opacity = p;
      wl.intensity = 1.6 * p; showerL.intensity = 0.5 * p; mirBar.material.color.setRGB(0.2 + 2.0 * p, 0.2 + 1.7 * p, 0.2 + 1.3 * p);
      const hobOn = t < K.dark ? 1 : (t < K.power + 0.2 ? Math.max(0, 1 - (t - K.dark) / 1.5) : E.io(seg(t, K.power + 0.2, 0.8)));
      ringM.color.setRGB(0.12 + 2.3 * hobOn, 0.05 + 0.45 * hobOn, 0.05 + 0.1 * hobOn);
      panSteam.forEach((s, i) => { const a = (t * s.sp * 0.6 + s.ph) % 1; s.m.position.set(1.87 + s.dx + Math.sin(t * 1.3 + i) * 0.03, 1.0 + a * 0.7, -1.21); s.m.scale.setScalar(0.12 + a * 0.3); s.m.material.opacity = 0.16 * hobOn * Math.sin(a * Math.PI); });
      food.forEach((m, i) => { m.position.y = 0.022 + Math.abs(Math.sin(t * 9 + i * 1.7)) * 0.012 * hobOn; });
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      // fuse box: door opens, scan finds B3, lever snaps up with anticipation + overshoot
      door.rotation.y = -antMove(t, K.trip - 0.32, 0.38, 0, 1.95, 1.2);
      const sc = seg(t, K.trip + 0.02, 0.45); scanM.opacity = sc > 0 && sc < 1 ? 1 : 0; scan.position.y = 0.3 - 0.6 * E.io(sc);
      brkM.opacity = E.io(seg(t, K.trip + 0.25, 0.2)) * (1 - E.io(seg(t, K.flip + 0.2, 0.25)));
      B3.lv.position.y = antMove(t, K.flip - 0.06, 0.14, -0.025, 0.025, 1.6); B3.lv.material.color.set(t > K.flip + 0.04 ? '#2b3036' : '#d23b30'); B3.ind.material.color.set(t > K.flip + 0.04 ? '#5ac86a' : '#ff3b30');
      // cable: electric front runs box → lamp
      const pf = pfront(t), live = t > K.flip + 0.2;
      segs.forEach((m, i) => { const u = (i + 0.5) / NSEG; const on = live && u < pf; const edge = live && pf < 1 ? Math.exp(-Math.pow((u - pf) / 0.05, 2)) * 2.2 : 0; m.material.emissive.copy(on || edge > 0.05 ? elecE : black).multiplyScalar((on ? 0.35 * (1 - E.io(seg(t, K.power + 0.3, 0.6))) : 0) + edge); });
      pulse.visible = live && pf > 0 && pf < 1; curve.getPointAt(clamp(pf, 0, 1), pulse.position); pulse.position.z += 0.03;
      // tenant: cooking (stir, hum) → shock → phone + flashlight → walk to the box → flip with the left hand → joy → back to cooking
      const shock = E.io(seg(t, K.dark, 0.08)) * (1 - E.io(seg(t, K.dark + 0.7, 0.3)));
      const cook = t < K.dark || t > tB1 - 0.1 ? 1 : 0;
      const phoneUp = MC.spring(t, K.dark + 0.45, 2.2, 0.4) * (1 - E.io(seg(t, K.power + 0.3, 0.25)));
      const reach = antMove(t, K.flip - 0.3, 0.26, 0, 1, 1.2) * (1 - E.io(seg(t, K.flip + 0.35, 0.25)));
      const openD = antMove(t, K.trip - 0.45, 0.25, 0, 1, 1.2) * (1 - E.io(seg(t, K.trip - 0.05, 0.25)));
      const joy = MC.spring(t, K.power + 0.15, 2.4, 0.35) * (1 - E.io(seg(t, tB0, 0.2)));
      const sq = -0.13 * Math.exp(-Math.pow((t - (K.dark + 0.12)) / 0.07, 2));
      let face = lerp(2.13, 0.45, antMove(t, K.dark + 0.05, 0.25, 0, 1, 1.2)); if (t >= tB1 - 0.1) face = 2.13; if (t > tW2 - 0.3 && t < tB0) face = 2.54;
      k.drive(TN, t, vTN, {
        face, cad: 14, squash: sq, tilt: cook ? 0.04 * Math.sin(t * 3) : 0, nod: cook ? 0.12 + 0.06 * Math.sin(t * 6) : 0.25 * phoneUp - 0.1 * shock,
        lean: -0.12 * joy,
        armL: shock > 0.5 ? -2.7 : (joy > 0.02 ? -0.4 - 2.4 * joy : -0.2 - 1.5 * Math.max(reach, openD)),
        armR: cook ? -1.15 + 0.22 * Math.sin(t * 7) : (shock > 0.5 ? -2.7 : (joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 1.2 * phoneUp)),
        armLz: 0.15 * Math.max(reach, openD), armRz: cook ? 0.35 + 0.15 * Math.cos(t * 7) : 0,
      });
      k.face(TN, t, { wide: shock + 0.3 * E.io(seg(t, K.power, 0.1)) * (1 - joy), o: shock * 0.9, smile: cook ? 1 : (joy > 0.1 ? 1 : 0.15), closed: cook && t < K.dark ? 0.5 * (Math.sin(t * 2) > 0.6 ? 1 : 0) : 0 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      // flashlight from the phone, pointing where she faces
      phone.getWorldPosition(tmp); const yaw = TN.rotation.y; tmp2.set(tmp.x + Math.sin(yaw) * 2, tmp.y - 0.8, tmp.z + Math.cos(yaw) * 2);
      if (t > tW2 - 0.3 && t < K.power + 0.5) tmp2.set(0.8, 1.45, -1.55);
      flash.position.copy(tmp); flash.target.position.copy(tmp2); flash.intensity = 7 * fo;
      beamG.position.copy(tmp); beamG.lookAt(tmp2); beamM.opacity = 0.07 * fo;
      // camera + DOF
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.trip - 0.45); k.popOut(m2, K.trip - 0.39);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.trip - 0.3);
    cd.line(0, K.trip + 0.2); cd.line(1, K.flip + 0.05); cd.line(2, K.min - 0.3);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const eT = ov('tdtag warn', '⚡ ' + S.err); k.popIn(eT, K.trip + 0.25, { y: 30 }); k.popOut(eT, K.flip + 0.1, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, Math.max(K.box, K.flip - 0.45), { y: 30 }); k.popOut(s1, K.power - 0.05, { y: -40 });
    const tm = ov('tdtimer', '<i></i><b>2:00</b>'); tl.set(tm, { xPercent: -50 }, 0); k.popIn(tm, K.power + 0.35, { y: 40 }); k.popOut(tm, K.no - 0.12, { y: -40 });
    const tmB = tm.querySelector('b'), tmI = tm.querySelector('i');
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      const u = seg(t, K.power + 0.4, 0.6), sl = Math.round(120 * (1 - u)); const lbl = u >= 1 ? '✓' : `${Math.floor(sl / 60)}:${String(sl % 60).padStart(2, '0')}`; if (tmB.textContent !== lbl) tmB.textContent = lbl; tmI.style.background = `conic-gradient(#e09b6b ${(1 - u) * 360}deg, rgba(255,255,255,.15) 0)`;
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(eT, new T3.Vector3(0.8, 1.92, -1.45)); at(s1, new T3.Vector3(0.8, 1.12, -1.45)); at(okT, new T3.Vector3(1.6, 2.45, -0.9));
    });
    sfx('sizzle', 0, -13, { dur: K.dark + 0.15 }); sfx('powerdown', K.dark - 0.05, -5); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12);
    sfx('click', K.trip - 0.3, -9); sfx('refresh', K.trip + 0.02, -14); sfx('breaker', K.flip - 0.02, -3); sfx('powerup', K.power - 0.08, -6);
    sfx('sizzle', K.power + 0.4, -15, { dur: 2.4 }); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
  function X57() {
    const de = lang === 'de';
    const S = de ? { chip: '🕖 13:30 · Whg 2A', who: 'Mieterin · Whg 2A', m1: 'Spüle verstopft 😩 Das Wasser steigt', m2: 'Fett im Siphon. Eimer drunter, Siphon abschrauben, ausspülen ✓', ttl: 'Spüle verstopft · Whg 2A', l1: '🧽 Ursache: Fett im Siphon', l2: '🪣 Abschrauben + ausspülen', l3: '💧 Wasser läuft wieder ab', err: 'Fett im Siphon', s1: '① Eimer drunter', s2: '② Abschrauben + ausspülen', ok: '✓ Kein Klempner nötig', end: ['*Ohne* Klempner gelöst.', null] }
      : { chip: '🕖 1:30 pm · Apt 2A', who: 'Tenant · Apt 2A', m1: 'Sink is blocked 😩 The water keeps rising', m2: 'Grease in the trap. Bucket under it, unscrew the trap, rinse it out ✓', ttl: 'Blocked sink · Apt 2A', l1: '🧽 Cause: grease in the trap', l2: '🪣 Unscrew + rinse the trap', l3: '💧 Draining again', err: 'Grease in the trap', s1: '① Bucket under it', s2: '② Unscrew + rinse', ok: '✓ No plumber needed', end: ['Fixed *without* a plumber.', null] };
    const K = {};
    K.rise = W(['steigt', 'rising']).start; K.write = W(['schreibt', 'writes']).start;
    const it = W(['Tenance']); K.turn = it.start; K.ans = W(['antwortet', 'answers'], it.i).start;
    K.trap = W(['Siphon', 'trap'], it.i).start; K.s1 = W(['Eimer', 'unscrew'], it.i).start; K.s2 = W(['abschrauben', 'bucket'], it.i).start;
    K.rinse = W(['ausspülen', 'rinse'], it.i).start; K.drain = W(['läuft', 'drains'], it.i).start; K.no = W(['Kein', 'No'], it.i).start; K.cta = W(['Jetzt', 'Join'], it.i).start;
    const k = TDX({ sky: 'night', envTop: '#fff3e2', envBot: '#2d2a26', envInt: 0.75, fov: 30, pro: true });
    const { scene, MC, ov } = k;
    const SH = (window.PR || 1) >= 2 ? 4096 : 2048;
    scene.add(new T3.HemisphereLight('#fff3e6', '#3a3430', 0.32));
    const shadowed = (l, b = 6) => { l.castShadow = true; l.shadow.mapSize.set(SH, SH); Object.assign(l.shadow.camera, { left: -b, right: b, top: b, bottom: -b, near: 0.5, far: 40 }); l.shadow.radius = 3; l.shadow.bias = -0.0004; l.shadow.normalBias = 0.02; };
    const sun = new T3.DirectionalLight('#ffd6a0', 2.0); sun.position.set(6.5, 5.5, -7.5); sun.target.position.set(1.4, 0, 0); scene.add(sun.target); shadowed(sun); scene.add(sun);
    const keyL = new T3.DirectionalLight('#fff4ea', 0.7); keyL.position.set(-3.5, 6.5, 6.5); shadowed(keyL); scene.add(keyL);
    const fill = new T3.DirectionalLight('#d4e2ff', 0.3); fill.position.set(3, 2, 9); scene.add(fill);
    const D = new T3.Group(); scene.add(D);
    // ---- canvas textures ----
    const cvs = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 8; return t; };
    const tiles = (nx, ny, base, grout, jit) => cvs(512, 512, (x, w, h) => { x.fillStyle = grout; x.fillRect(0, 0, w, h); const tw = w / nx, th = h / ny; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const v = (MC.rnd(i * 31 + j, 3) - 0.5) * jit; const c = new T3.Color(base); c.offsetHSL(0, 0, v); x.fillStyle = '#' + c.getHexString(); x.fillRect(i * tw + 2, j * th + 2, tw - 4, th - 4); x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(i * tw + 3, j * th + 3, tw - 6, 3); } });
    const wood = cvs(512, 512, (x, w, h) => { for (let i = 0; i < 8; i++) { const c = new T3.Color('#b98a5e'); c.offsetHSL(0, 0, (MC.rnd(i, 7) - 0.5) * 0.08); x.fillStyle = '#' + c.getHexString(); x.fillRect(0, i * 64, w, 64); x.strokeStyle = 'rgba(60,35,20,0.35)'; x.lineWidth = 2; x.strokeRect(-2, i * 64, w + 4, 64); for (let g = 0; g < 9; g++) { x.strokeStyle = 'rgba(90,55,30,0.18)'; x.beginPath(); const y0 = i * 64 + 6 + MC.rnd(i * 9 + g, 2) * 52; x.moveTo(0, y0); x.bezierCurveTo(w * 0.3, y0 + 4, w * 0.6, y0 - 4, w, y0 + 2); x.stroke(); } } });
    const wallTile = tiles(10, 12, '#9fbdb2', '#7e968d', 0.05), floorTile = tiles(6, 6, '#4f5f66', '#36434a', 0.06);
    [wallTile, floorTile, wood].forEach((t) => { t.wrapS = t.wrapT = T3.RepeatWrapping; });
    const cloud = cvs(128, 128, (x) => { for (let i = 0; i < 7; i++) { const cx = 40 + MC.rnd(i, 1) * 48, cy = 40 + MC.rnd(i, 2) * 48, rr = 22 + MC.rnd(i, 3) * 26; const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); } });
    const frostT = cvs(512, 512, (x, w, h) => { x.fillStyle = 'rgba(235,245,255,0.16)'; x.fillRect(0, 0, w, h); x.lineCap = 'round'; for (let i = 0; i < 340; i++) { let px = MC.rnd(i, 1) * w, py = MC.rnd(i, 2) * h, an = MC.rnd(i, 3) * 6.28; x.strokeStyle = `rgba(255,255,255,${0.25 + MC.rnd(i, 4) * 0.5})`; x.lineWidth = 0.8 + MC.rnd(i, 5) * 1.6; x.beginPath(); x.moveTo(px, py); for (let s = 0; s < 7; s++) { an += (MC.rnd(i * 7 + s, 6) - 0.5) * 1.1; const L = 6 + MC.rnd(i * 7 + s, 7) * 18; px += Math.cos(an) * L; py += Math.sin(an) * L; x.lineTo(px, py); if (s % 2) { x.moveTo(px, py); x.lineTo(px + Math.cos(an + 1) * L * 0.5, py + Math.sin(an + 1) * L * 0.5); x.moveTo(px, py); } } x.stroke(); } });
    const fogT = cvs(256, 256, (x, w, h) => { x.fillStyle = 'rgba(232,240,248,0.7)'; x.fillRect(0, 0, w, h); for (let i = 0; i < 600; i++) { x.fillStyle = `rgba(255,255,255,${0.15 + MC.rnd(i, 2) * 0.3})`; x.beginPath(); x.arc(MC.rnd(i, 3) * w, MC.rnd(i, 4) * h, 1 + MC.rnd(i, 1) * 3, 0, 7); x.fill(); } });
    const grad = (stops, w = 8, h = 256) => cvs(w, h, (x) => { const g = x.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); });
    // ---- studio backdrop + base ----
    const bg = new T3.Mesh(new T3.SphereGeometry(40, 32, 16), new T3.MeshBasicMaterial({ map: grad([[0, '#0d1018'], [0.42, '#1d1c26'], [0.52, '#2b2730'], [1, '#121219']]), side: T3.BackSide, depthWrite: false })); scene.add(bg);
    mesh(rbox(7.2, 0.32, 3.7, 0.06), M.std('#26262e', { roughness: 0.85 }), D, [0.12, -0.16, -0.15]);
    // floors
    const fl = (tex, rep, x0, x1) => { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(...rep); t.wrapS = t.wrapT = T3.RepeatWrapping; return mesh(new T3.PlaneGeometry(x1 - x0, 3.3), M.std('#ffffff', { map: t, roughness: 0.55 }), D, [(x0 + x1) / 2, 0.002, -0.05], [-Math.PI / 2, 0, 0]); };
    fl(floorTile, [3, 3], -3.25, 0); const wf = fl(wood, [2.5, 3], 0, 3.45); wf.material.roughness = 0.62;
    // walls (cutaway: back + left + partition + right), tiles in the bathroom
    const wallM = M.std('#efe3d0', { roughness: 0.92 }), trimM = M.std('#f7f3ec', { roughness: 0.6 });
    const box = (w, h, d, mat, pos) => mesh(new T3.BoxGeometry(w, h, d), mat, D, pos);
    box(3.3, 2.65, 0.14, wallM, [-1.6, 1.325, -1.67]);                                                            // bathroom back
    box(1.7, 2.65, 0.14, wallM, [0.85, 1.325, -1.67]); box(0.85, 2.65, 0.14, wallM, [3.03, 1.325, -1.67]);       // kitchen back (window 1.7..2.6)
    box(0.9, 1.15, 0.14, wallM, [2.15, 0.575, -1.67]); box(0.9, 0.5, 0.14, wallM, [2.15, 2.4, -1.67]);
    box(0.14, 2.65, 3.3, wallM, [-3.32, 1.325, -0.05]);                                                            // left
    box(0.1, 2.65, 0.55, wallM, [0, 1.325, -1.325]);                                                                  // partition
    box(0.12, 2.65, 2.0, wallM, [3.51, 1.325, -0.65]);                                                             // right
    [[-1.6, -1.67, 3.4, 0.2], [1.8, -1.67, 3.6, 0.2]].forEach(([x, z, w, d]) => box(w, 0.07, d, trimM, [x, 2.68, z]));
    box(0.2, 0.07, 3.35, trimM, [-3.32, 2.68, -0.05]); box(0.14, 0.07, 0.59, trimM, [0, 2.68, -1.325]); box(0.16, 0.07, 2.04, trimM, [3.51, 2.68, -0.65]);
    const tw = (w, h, pos, rot, rep) => { const t = wallTile.clone(); t.needsUpdate = true; t.repeat.set(...rep); return mesh(new T3.PlaneGeometry(w, h), M.std('#ffffff', { map: t, roughness: 0.25, metalness: 0.0 }), D, pos, rot); };
    tw(3.25, 2.6, [-1.62, 1.3, -1.598], [0, 0, 0], [3.2, 2.6]); tw(3.3, 2.6, [-3.248, 1.3, -0.05], [0, Math.PI / 2, 0], [3.2, 2.6]);
    box(3.4, 0.09, 0.02, M.std('#e8dccb'), [1.75, 0.045, -1.595]);                                                 // skirting (kitchen)
    // ---- shower: tray, glass (with frost), chrome head + riser, mixer ----
    const chrome = M.std('#e8ecf0', { metalness: 1, roughness: 0.12 });
    mesh(rbox(1.2, 0.09, 1.08, 0.03), M.std('#f8f8f6', { roughness: 0.3 }), D, [-2.66, 0.045, -1.06]);
    mesh(new T3.CircleGeometry(0.05, 20), chrome, D, [-2.66, 0.092, -1.0], [-Math.PI / 2, 0, 0]);
    const glassM = new T3.MeshPhysicalMaterial({ color: '#e6f4ff', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, side: T3.DoubleSide, envMapIntensity: 1.6, clearcoat: 1 });
    const frostM = () => new T3.ShaderMaterial({ uniforms: { tF: { value: frostT }, uG: { value: 0 }, uM: { value: 0 } }, transparent: true, depthWrite: false, side: T3.DoubleSide,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D tF; uniform float uG, uM; varying vec2 vUv; void main(){ vec4 f = texture2D(tF, vUv); float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)) * 2.0; float a = f.a * smoothstep(uG, uG - 0.22, e) * (1.0 - uM); gl_FragColor = vec4(vec3(0.92, 0.97, 1.0) * 1.5, a * 0.95); }' });
    const panes = [[1.17, 2.0, [-2.03, 1.09, -0.98], [0, Math.PI / 2, 0]]].map(([w, h, pos, rot]) => {
      mesh(new T3.PlaneGeometry(w, h), glassM, D, pos, rot).castShadow = false;
      const fm = frostM(); const f = mesh(new T3.PlaneGeometry(w, h), fm, D, pos, rot); f.castShadow = false; f.renderOrder = 2;
      const g = new T3.Group(); g.position.set(...pos); g.rotation.set(...rot); D.add(g); [[0, h / 2], [0, -h / 2]].forEach(([dx, dy]) => mesh(new T3.BoxGeometry(w, 0.025, 0.025), chrome, g, [dx, dy, 0])); [[-w / 2], [w / 2]].forEach(([dx]) => mesh(new T3.BoxGeometry(0.025, h, 0.025), chrome, g, [dx, 0, 0]));
      return fm;
    });
    mesh(new T3.CylinderGeometry(0.018, 0.018, 1.0, 12), chrome, D, [-2.6, 1.6, -1.575]);                           // riser
    mesh(new T3.CylinderGeometry(0.016, 0.016, 0.34, 12), chrome, D, [-2.6, 2.08, -1.42], [Math.PI / 2, 0, 0]);       // arm
    const head = new T3.Group(); head.position.set(-2.6, 2.06, -1.24); head.rotation.x = 0.45; D.add(head);
    mesh(new T3.CylinderGeometry(0.12, 0.09, 0.035, 28), chrome, head, [0, 0, 0]);
    mesh(new T3.CircleGeometry(0.105, 28), M.std('#9aa3ad', { metalness: 0.8, roughness: 0.4 }), head, [0, -0.0185, 0], [Math.PI / 2, 0, 0]);
    mesh(rbox(0.16, 0.08, 0.06, 0.02), chrome, D, [-2.6, 1.1, -1.57]); mesh(new T3.CylinderGeometry(0.012, 0.012, 0.13, 8), chrome, D, [-2.55, 1.14, -1.53], [0, 0, 1.2]);
    // bath mat, vanity + basin + mirror (fog), wall light, towel hook + towel, plant
    mesh(rbox(0.62, 0.02, 0.42, 0.01), M.std('#7fb3a6', { roughness: 0.95 }), D, [-2.25, 0.012, -0.12]);
    mesh(rbox(0.82, 0.74, 0.46, 0.03), M.std('#c9a27a', { roughness: 0.6 }), D, [-1.05, 0.37, -1.35]);
    mesh(rbox(0.74, 0.07, 0.44, 0.03), M.std('#fbfbf9', { roughness: 0.25 }), D, [-1.05, 0.775, -1.35]);
    mesh(new T3.CylinderGeometry(0.012, 0.012, 0.16, 10), chrome, D, [-1.05, 0.86, -1.5]); mesh(new T3.CylinderGeometry(0.01, 0.01, 0.1, 8), chrome, D, [-1.05, 0.93, -1.46], [Math.PI / 2, 0, 0]);
    mesh(new T3.PlaneGeometry(0.7, 0.84), M.std('#c9d2db', { metalness: 1, roughness: 0.06 }), D, [-1.05, 1.58, -1.59]);
    const mirFog = mesh(new T3.PlaneGeometry(0.7, 0.84), new T3.MeshBasicMaterial({ map: fogT, transparent: true, depthWrite: false, opacity: 0.8 }), D, [-1.05, 1.58, -1.585]); mirFog.castShadow = false;
    mesh(rbox(0.5, 0.05, 0.05, 0.02), new T3.MeshBasicMaterial({ color: new T3.Color(2.2, 1.9, 1.5) }), D, [-1.05, 2.07, -1.56]);
    const wl = new T3.PointLight('#ffd7a8', 1.6, 5); wl.position.set(-1.05, 2.0, -1.2); D.add(wl);
    const showerL = new T3.PointLight('#ffe2c0', 1.2, 3.5); showerL.position.set(-2.5, 2.1, -0.8); D.add(showerL);
    mesh(new T3.CylinderGeometry(0.015, 0.015, 0.08, 8), chrome, D, [-1.75, 1.62, -1.56], [Math.PI / 2, 0, 0]);
    const towelM = M.std('#f0b84a', { roughness: 0.95 });
    const towelH = mesh(rbox(0.38, 0.62, 0.06, 0.03), towelM, D, [-1.75, 1.33, -1.53]);
    const towelF = mesh(rbox(0.38, 0.62, 0.06, 0.03), towelM, D, [0, 0, 0]); towelF.visible = false;
    const plant = (x, y, z, s) => { const g = new T3.Group(); g.position.set(x, y, z); g.scale.setScalar(s); D.add(g); mesh(new T3.CylinderGeometry(0.16, 0.12, 0.3, 16), M.std('#c86b3c'), g, [0, 0.15, 0]); [[0, 0.55, 0, 0.26], [0.13, 0.45, 0.06, 0.2], [-0.12, 0.47, -0.05, 0.19]].forEach(([a, b, c, rr]) => mesh(new T3.SphereGeometry(rr, 14, 10), M.std('#3d7a4f', { roughness: 0.8 }), g, [a, b, c])); return g; };
    plant(-0.38, 0, -1.3, 1.0);
    // ---- kitchen: window (winter morning outside), counter, kettle, fridge, clock ----
    const frameM = M.std('#f6f3ee', { roughness: 0.5 });
    [[2.15, 1.15, 0.92, 0.07], [2.15, 2.15, 0.92, 0.07], [1.7, 1.65, 0.07, 1.06], [2.6, 1.65, 0.07, 1.06], [2.15, 1.65, 0.04, 1.0]].forEach(([x, y, w, h]) => box(w, h, 0.16, frameM, [x, y, -1.67]));
    box(1.0, 0.05, 0.26, frameM, [2.15, 1.13, -1.56]);
    const sky = mesh(new T3.PlaneGeometry(9, 5), new T3.MeshBasicMaterial({ map: grad([[0, '#8fb6e0'], [0.55, '#d9d6dc'], [1, '#f6c79a']]) }), D, [2.4, 1.7, -6.2]); sky.castShadow = false;
    for (let i = 0; i < 7; i++) { const w = 0.8 + MC.rnd(i, 1) * 0.9, h = 0.5 + MC.rnd(i, 2) * 1.0, x = -0.4 + i * 0.85 + MC.rnd(i, 3) * 0.3, z = -3.6 - MC.rnd(i, 4) * 1.6; box(w, h, 0.9, M.std('#8a7f86', { roughness: 0.9 }), [x, 0.4 + h / 2, z]); box(w + 0.06, 0.07, 0.96, M.std('#f4f7fb', { roughness: 0.9 }), [x, 0.4 + h + 0.03, z]); }
    const sunG = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, color: new T3.Color(1.6, 1.2, 0.8) })); sunG.position.set(4.2, 2.3, -6.0); sunG.scale.setScalar(3.2); D.add(sunG);
    const shaftT = grad([[0, 'rgba(255,230,190,0.0)'], [0.15, 'rgba(255,230,190,0.55)'], [1, 'rgba(255,230,190,0.0)']], 8, 128);
    const sdir = new T3.Vector3().subVectors(sun.target.position, sun.position).normalize();
    [[-0.25, 0.85], [0.18, 0.7], [0.0, 1.0]].forEach(([dx, wv], i) => {
      const p0 = new T3.Vector3(2.15 + dx, 1.65 + (i - 1) * 0.15, -1.66), L = 1.9 / -sdir.y, mid = p0.clone().addScaledVector(sdir, L / 2);
      const m = new T3.Mesh(new T3.PlaneGeometry(wv * 0.55, L), new T3.MeshBasicMaterial({ map: shaftT, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, opacity: 0.12, side: T3.DoubleSide }));
      m.position.copy(mid); m.up.copy(sdir).negate(); m.lookAt(mid.clone().add(new T3.Vector3(0, 0, 1))); D.add(m);
    });
    const kettle = new T3.Group(); kettle.position.set(2.63, 0.91, -1.42); D.add(kettle); mesh(new T3.CylinderGeometry(0.085, 0.1, 0.2, 20), M.std('#d23b30', { roughness: 0.35, metalness: 0.2 }), kettle, [0, 0.1, 0]); mesh(new T3.TorusGeometry(0.05, 0.012, 8, 16, Math.PI), M.std('#2b2b2b'), kettle, [0, 0.22, 0]);
    mesh(new T3.CylinderGeometry(0.04, 0.035, 0.09, 16), M.std('#f4f1ea'), D, [1.95, 0.955, -1.25]);
    plant(2.05, 1.155, -1.56, 0.45);
    mesh(rbox(0.64, 1.86, 0.64, 0.05), M.std('#e9edf2', { roughness: 0.3, metalness: 0.15 }), D, [3.1, 0.93, -1.25]); mesh(new T3.BoxGeometry(0.03, 0.5, 0.04), chrome, D, [2.83, 1.25, -0.92]); mesh(new T3.BoxGeometry(0.64, 0.01, 0.01), M.std('#c5ccd4'), D, [3.1, 1.32, -0.93]);
    const clock = new T3.Group(); clock.position.set(2.95, 2.18, -1.585); D.add(clock);
    mesh(new T3.CylinderGeometry(0.15, 0.15, 0.03, 32), M.std('#1d4734'), clock, [0, 0, 0], [Math.PI / 2, 0, 0]); mesh(new T3.CircleGeometry(0.13, 32), M.std('#faf6ee'), clock, [0, 0, 0.016]);
    const hand = (L, wv, c) => { const g = new T3.Group(); g.position.z = 0.02; clock.add(g); mesh(new T3.BoxGeometry(wv, L, 0.005), M.std(c), g, [0, L / 2 - 0.015, 0]); return g; };
    const hH = hand(0.07, 0.012, '#14261b'), hM = hand(0.105, 0.008, '#14261b'), hS = hand(0.11, 0.004, '#e09b6b');
    hH.rotation.z = -(7 + 10 / 60) / 12 * Math.PI * 2; hM.rotation.z = -10 / 60 * Math.PI * 2;
    // ---- X57: sink cabinet (doors), inset basin, faucet, murky water, trap (x-ray) + bucket ----
    mirFog.visible = false;
    const cabM = M.std('#2f5a44', { roughness: 0.55 }), inM = M.std('#24372d', { roughness: 0.8 }), topM = M.std('#dccab0', { roughness: 0.45 }), steel = M.std('#c9d0d6', { metalness: 0.85, roughness: 0.25 });
    box(0.03, 0.86, 0.6, cabM, [1.715, 0.43, -1.3]); box(0.03, 0.86, 0.6, cabM, [2.685, 0.43, -1.3]); box(0.97, 0.86, 0.02, inM, [2.2, 0.43, -1.59]); box(0.97, 0.03, 0.58, inM, [2.2, 0.06, -1.3]);
    [[1.875, -1.3, 0.41, 0.64], [2.625, -1.3, 0.21, 0.64], [2.3, -1.54, 0.44, 0.16], [2.3, -1.05, 0.44, 0.14]].forEach(([x, z, w, d]) => box(w, 0.05, d, topM, [x, 0.885, z]));
    box(0.44, 0.012, 0.34, steel, [2.3, 0.704, -1.29]); [[2.3, -1.455, 0.44, 0.012], [2.3, -1.125, 0.44, 0.012], [2.084, -1.29, 0.012, 0.34], [2.516, -1.29, 0.012, 0.34]].forEach(([x, z, w, d]) => box(w, 0.18, d, steel, [x, 0.795, z]));
    mesh(new T3.CircleGeometry(0.035, 24), M.std('#1b1d20'), D, [2.3, 0.712, -1.29], [-Math.PI / 2, 0, 0]); mesh(new T3.TorusGeometry(0.035, 0.006, 6, 24), chrome, D, [2.3, 0.712, -1.29], [Math.PI / 2, 0, 0]);
    const doors = [[1.72, 1], [2.68, -1]].map(([x, sgn]) => { const g = new T3.Group(); g.position.set(x, 0.47, -0.99); D.add(g); mesh(rbox(0.47, 0.76, 0.025, 0.012), cabM, g, [sgn * 0.237, 0, 0]); mesh(new T3.BoxGeometry(0.02, 0.16, 0.02), chrome, g, [sgn * 0.43, 0.2, 0.02]); return { g, sgn }; });
    // faucet + stream
    mesh(new T3.CylinderGeometry(0.018, 0.022, 0.3, 14), chrome, D, [2.3, 1.06, -1.55]);
    mesh(new T3.TorusGeometry(0.1, 0.014, 10, 24, Math.PI), chrome, D, [2.3, 1.21, -1.45], [0, Math.PI / 2, 0]);
    mesh(new T3.CylinderGeometry(0.04, 0.04, 0.02, 12), chrome, D, [2.3, 0.92, -1.55]); mesh(rbox(0.03, 0.02, 0.1, 0.008), chrome, D, [2.3, 1.22, -1.6]);
    const strM = new T3.MeshStandardMaterial({ color: '#dfeefa', transparent: true, opacity: 0.55, roughness: 0.05, emissive: new T3.Color('#ffffff'), emissiveIntensity: 0.25 });
    const stream = mesh(new T3.CylinderGeometry(0.008, 0.01, 1, 10, 1, true), strM, D, [2.3, 1.0, -1.35]); stream.castShadow = false;
    // water: murky surface + grease specks + bubbles; vortex swirl for the drain
    const watM = new T3.MeshStandardMaterial({ color: '#a9b49b', roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0.88 });
    const wat = mesh(new T3.PlaneGeometry(0.43, 0.33), watM, D, [2.3, 0.78, -1.29], [-Math.PI / 2, 0, 0]); wat.castShadow = false;
    const specks = [...Array(10)].map((_, i) => mesh(new T3.CircleGeometry(0.008 + MC.rnd(i, 1) * 0.012, 10), M.std('#d8c26a', { roughness: 0.4 }), D, [2.12 + MC.rnd(i, 2) * 0.36, 0.78, -1.43 + MC.rnd(i, 3) * 0.28], [-Math.PI / 2, 0, 0]));
    const plate = mesh(new T3.CylinderGeometry(0.1, 0.07, 0.015, 24), M.std('#f4f1ea', { roughness: 0.3 }), D, [2.2, 0.76, -1.32], [0.35, 0, 0.2]);
    const bub = [...Array(18)].map((_, i) => mesh(new T3.SphereGeometry(0.006 + MC.rnd(i, 1) * 0.008, 8, 6), new T3.MeshStandardMaterial({ color: '#eef6ff', transparent: true, opacity: 0.7, roughness: 0.05 }), D, [0, -5, 0]));
    const swirlT = cvs(256, 256, (x, w) => { x.translate(w / 2, w / 2); for (let a = 0; a < 3; a++) { x.rotate(Math.PI * 2 / 3); x.beginPath(); for (let i = 0; i < 60; i++) { const r = 4 + i * 2, an = i * 0.16; x.lineTo(Math.cos(an) * r, Math.sin(an) * r); } x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 6; x.stroke(); } });
    const swM = new T3.MeshBasicMaterial({ map: swirlT, transparent: true, opacity: 0, blending: T3.AdditiveBlending, depthWrite: false });
    const swirl = mesh(new T3.PlaneGeometry(0.3, 0.3), swM, D, [2.3, 0.78, -1.29], [-Math.PI / 2, 0, 0]); swirl.castShadow = false;
    // under the sink: tailpiece (fixed), U-trap (removable, x-ray), arm to the wall (fixed)
    const pvc = M.std('#ecebe4', { roughness: 0.35 }); pvc.transparent = true;
    mesh(new T3.CylinderGeometry(0.02, 0.02, 0.14, 14), steel, D, [2.3, 0.63, -1.29]);
    mesh(new T3.CylinderGeometry(0.02, 0.02, 0.17, 14), pvc, D, [2.3, 0.56, -1.495], [Math.PI / 2, 0, 0]); mesh(new T3.CylinderGeometry(0.04, 0.04, 0.01, 16), chrome, D, [2.3, 0.56, -1.578], [Math.PI / 2, 0, 0]);
    const TR = new T3.Group(); TR.position.set(2.3, 0.56, -1.29); D.add(TR);
    const leg = (z) => mesh(new T3.CylinderGeometry(0.021, 0.021, 0.1, 14, 1, true), pvc, TR, [0, -0.05, z]);
    leg(0); leg(-0.12); mesh(new T3.TorusGeometry(0.06, 0.021, 12, 24, Math.PI), pvc, TR, [0, -0.1, -0.06], [0, Math.PI / 2, Math.PI]);
    const nutM = M.std('#f2f2ec', { roughness: 0.3 }); const nuts = [0, -0.12].map((z) => { const n = new T3.Group(); n.position.set(0, -0.004, z); TR.add(n); mesh(new T3.CylinderGeometry(0.03, 0.03, 0.026, 8), nutM, n, [0, 0, 0]); return n; });
    const gunkM = M.std('#5b4a2a', { roughness: 0.9 }); const gunk = new T3.Group(); TR.add(gunk);
    [[0, -0.14, -0.03, 0.022], [0, -0.155, -0.06, 0.02], [0.004, -0.14, -0.09, 0.02], [0, -0.12, -0.01, 0.015], [0, -0.12, -0.11, 0.016]].forEach(([x, y, z, r]) => mesh(new T3.SphereGeometry(r, 10, 8), gunkM, gunk, [x, y, z]));
    const ringM2 = new T3.MeshBasicMaterial({ color: new T3.Color(2.6, 0.9, 0.4), transparent: true, opacity: 0, depthWrite: false, blending: T3.AdditiveBlending }); const hiRing = mesh(new T3.TorusGeometry(0.11, 0.004, 6, 40), ringM2, D, [2.3, 0.46, -1.26]); hiRing.castShadow = false;
    const fallW = mesh(new T3.CylinderGeometry(0.012, 0.016, 1, 10, 1, true), strM, D, [2.3, 0.4, -1.29]); fallW.castShadow = false; fallW.visible = false;
    // bucket
    const BK = new T3.Group(); D.add(BK); const bkM = M.std('#2f6b8f', { roughness: 0.5 }); bkM.side = T3.DoubleSide;
    mesh(new T3.CylinderGeometry(0.14, 0.115, 0.24, 24, 1, true), bkM, BK, [0, 0.12, 0]); mesh(new T3.CylinderGeometry(0.115, 0.115, 0.01, 24), bkM, BK, [0, 0.005, 0]); mesh(new T3.TorusGeometry(0.14, 0.006, 6, 24, Math.PI), M.std('#1d1d1d'), BK, [0, 0.24, 0], [0, 0, 0]);
    const bkW = mesh(new T3.CircleGeometry(0.12, 24), watM, BK, [0, 0.02, 0], [-Math.PI / 2, 0, 0]); bkW.visible = false;
    const BIN = new T3.Vector3(1.95, 0.075, -0.45), BAT = new T3.Vector3(2.3, 0.075, -1.27);
    // ---- tenant (shirt) + phone ----
    const TN = k.fig(D, '#e8b98f', 1.92, 0, -0.58, 0.95, '#7a3b1e');
    const shirtM = M.std('#c2563a', { roughness: 0.85 }); mesh(new T3.CylinderGeometry(0.214, 0.236, 0.56, 24, 1, true), shirtM, TN.userData.B, [0, 0.48, 0]); mesh(new T3.TorusGeometry(0.2, 0.03, 8, 24), shirtM, TN.userData.B, [0, 0.76, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const POS = new T3.Vector3(1.84, 0, -0.6); const vTN = () => POS.clone();
    // ---- state ----
    const tapOn = (t) => t < K.rise + 0.35 ? 1 : 0;
    const lev = (t) => t < K.s2 + 0.3 ? 0.5 + 0.38 * E.io(seg(t, 0, K.rise + 0.4)) : (t < K.drain - 0.05 ? lerp(0.88, 0.55, E.io(seg(t, K.s2 + 0.3, 0.6))) : 0.55 * (1 - E.ic(seg(t, K.drain - 0.05, 1.0))));
    const xray = (t) => E.io(seg(t, K.trap - 0.05, 0.3)) * (1 - E.io(seg(t, K.rinse + 0.5, 0.3)));
    const drop = (t) => antMove(t, K.s2 + 0.18, 0.25, 0, 1, 1.2) * (1 - antMove(t, K.rinse + 0.3, 0.3, 0, 1, 1.2));
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.5, 1.6, 1.6, 2.28, 0.84, -1.3, 27)],
      [K.rise - 0.1, P(0.45, 1.3, 1.5, 2.3, 0.82, -1.3, 24), E.io],
      [K.rise + 0.45, PT(0.9, 2.3, 1.3, 1.05, 21, 0.03), A9],
      [K.write - 0.3, PT(0.9, 2.4, 1.28, 1.03, 22), E.lin],
      [K.write + 0.2, PT(0.85, 1.7, 1.42, 1.0, 26), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 0.1, 1.15, -0.55), A6],
      [K.trap - 0.3, P(0.0, 9.2, 2.6, 0.1, 1.15, -0.55), E.lin],
      [K.trap + 0.15, P(0.35, 1.7, 0.85, 2.3, 0.45, -1.25, 28), A9],
      [K.s1 + 0.1, P(0.3, 1.6, 0.8, 2.3, 0.42, -1.25, 28), E.io],
      [K.s2 + 0.1, P(0.28, 1.25, 0.62, 2.3, 0.42, -1.28, 26), A6],
      [K.rinse + 0.5, P(0.32, 1.35, 0.7, 2.3, 0.45, -1.25, 26), E.io],
      [K.drain - 0.05, P(0.3, 1.5, 1.95, 2.3, 0.72, -1.3, 26), A6],
      [K.no + 0.35, P(0.6, 2.6, 1.5, 2.1, 1.0, -1.0), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3(), tmp2 = new T3.Vector3(), gunkW = new T3.Vector3();
    k.frame((t) => {
      const g = k.grade; g.temp = 0.22 - 0.25 * E.io(seg(t, K.rise, 0.3)) * (1 - E.io(seg(t, K.drain, 0.5))); g.th = 1.6; g.bloom = 0.35; g.sat = 1.04;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      // water + faucet
      const L = lev(t), wy = 0.71 + 0.16 * L, on = tapOn(t);
      wat.position.y = wy; wat.visible = L > 0.02; swirl.position.y = wy + 0.002; specks.forEach((m, i) => { m.position.y = wy + 0.001; m.visible = L > 0.05; m.position.x += 0; m.rotation.z = t * 0.3 + i; });
      const sp = 0.6 + 0.4 * E.io(seg(t, K.drain, 0.3)); specks.forEach((m, i) => { const a0 = MC.rnd(i, 4) * 6.28 + (t > K.drain ? (t - K.drain) * (3 + 6 * (t - K.drain)) : 0), r0 = (0.03 + MC.rnd(i, 5) * 0.12) * (t > K.drain ? Math.max(0, 1 - (t - K.drain) * 0.9) : 1); m.position.x = 2.3 + Math.cos(a0) * r0; m.position.z = -1.29 + Math.sin(a0) * r0 * 0.8; });
      plate.position.y = Math.max(0.715, wy - 0.025);
      stream.visible = on > 0; const sTop = 1.2, sBot = wy; stream.scale.y = sTop - sBot; stream.position.y = (sTop + sBot) / 2;
      swM.opacity = t > K.drain - 0.05 ? 0.7 * Math.min(1, (t - K.drain + 0.05) * 4) * (L > 0.03 ? 1 : 0) : 0; swirl.rotation.z = -(t > K.drain ? (t - K.drain) * 9 : 0);
      // gurgle bubbles while blocked
      const gurg = t > K.rise - 0.3 && t < K.s2 + 0.3 ? 1 : 0;
      bub.forEach((m, i) => { const life = 0.7, a = ((t / life + MC.rnd(i, 1)) % 1); if (!gurg || L < 0.1) { m.position.y = -5; return; } m.position.set(2.3 + (MC.rnd(i, 2) - 0.5) * 0.08, 0.715 + a * (wy - 0.715), -1.29 + (MC.rnd(i, 3) - 0.5) * 0.06); m.scale.setScalar(a > 0.92 ? 1.6 : 1); });
      // doors, x-ray, trap, gunk, bucket
      doors.forEach((d) => { d.g.rotation.y = -d.sgn * antMove(t, K.trap - 0.42, 0.34, 0, 1.9, 1.2); });
      const xr = xray(t); pvc.opacity = 1 - 0.62 * xr; ringM2.opacity = xr * (0.6 + 0.4 * Math.sin(t * 10)) * (1 - E.io(seg(t, K.s2 - 0.1, 0.2)));
      const spin = antMove(t, K.s2 - 0.05, 0.25, 0, 1, 1.1) - antMove(t, K.rinse + 0.55, 0.22, 0, 1, 1.1);
      nuts.forEach((n) => { n.rotation.y = spin * Math.PI * 3; });
      const dr = drop(t); TR.position.y = 0.56 - 0.1 * dr; TR.rotation.x = 0.55 * dr * (t < K.rinse ? 1 : 0.4) + (t > K.rinse - 0.05 && t < K.rinse + 0.3 ? 0.12 * Math.sin((t - K.rinse) * 50) : 0);
      // gunk falls out of the trap into the bucket
      const gf = seg(t, K.s2 + 0.38, 0.32);
      if (gf <= 0) { gunk.visible = true; gunk.position.set(0, 0, 0); }
      else { gunk.visible = gf < 1; gunk.position.set(0, -0.6 * gf * gf, 0.02 * gf); }
      bkW.visible = t > K.s2 + 0.5; bkW.position.y = 0.02 + 0.06 * E.io(seg(t, K.s2 + 0.45, 0.5));
      fallW.visible = t > K.s2 + 0.3 && t < K.s2 + 0.95; fallW.position.y = 0.42; fallW.scale.y = 0.24;
      BK.position.copy(BIN).lerp(BAT, antMove(t, K.s1 - 0.05, 0.4, 0, 1, 1.15));
      // tenant: washing → shock at the rising water → phone → kneel at the cabinet → work on the trap → joy
      const wash = t < K.rise ? 1 : 0;
      const shock = E.io(seg(t, K.rise, 0.08)) * (1 - E.io(seg(t, K.rise + 0.8, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.trap - 0.5, 0.25)));
      const kneel = E.io(seg(t, K.trap - 0.55, 0.3)) * (1 - E.io(seg(t, K.drain + 0.1, 0.3)));
      const work = kneel * (t > K.s1 - 0.1 && t < K.rinse + 0.8 ? 1 : 0);
      const joy = MC.spring(t, K.drain + 0.5, 2.4, 0.35);
      const sq = -0.13 * Math.exp(-Math.pow((t - (K.rise + 0.12)) / 0.07, 2));
      const face = lerp(lerp(2.66, 0.9, antMove(t, K.rise + 0.02, 0.25, 0, 1, 1.2)), 2.75, E.io(seg(t, K.trap - 0.6, 0.3))) + (t > K.drain + 0.3 ? lerp(0, 0.9 - 2.75, E.io(seg(t, K.drain + 0.3, 0.35))) : 0);
      k.drive(TN, t, vTN, {
        face, squash: sq, tilt: wash ? 0.03 * Math.sin(t * 3) : 0, nod: wash ? 0.2 : 0.25 * phoneUp - 0.1 * shock + 0.25 * kneel,
        lift: -0.2 * kneel, lean: 0.4 * kneel - 0.12 * joy,
        armL: shock > 0.5 ? -2.7 : (joy > 0.02 ? -0.4 - 2.4 * joy : (wash ? -1.0 + 0.2 * Math.sin(t * 8) : -0.2 - 0.95 * work + 0.15 * work * Math.sin(t * 13))),
        armR: shock > 0.5 ? -2.7 : (joy > 0.02 ? -0.4 - 2.4 * joy : (wash ? -1.0 - 0.2 * Math.sin(t * 8) : -0.25 - 1.2 * phoneUp - 0.95 * work - 0.15 * work * Math.sin(t * 13))),
        armLz: wash ? 0.3 : 0, armRz: wash ? 0.3 : 0,
      });
      k.face(TN, t, { wide: shock, o: shock * 0.9, smile: wash || joy > 0.1 ? 1 : 0.15 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      // camera + DOF
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.trap - 0.45); k.popOut(m2, K.trap - 0.39);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.trap - 0.3);
    cd.line(0, K.trap + 0.2); cd.line(1, K.rinse + 0.05); cd.line(2, K.drain + 0.25);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const eT = ov('tdtag warn', '⚠️ ' + S.err); k.popIn(eT, K.trap + 0.25, { y: 30 }); k.popOut(eT, K.s1 - 0.1, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.s1 - 0.05, { y: 30 }); k.popOut(s1, K.s2 + 0.35, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.s2 + 0.4, { y: 30 }); k.popOut(s2, K.drain - 0.12, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(eT, new T3.Vector3(2.3, 0.62, -1.2), 240, 840, -140); at(s1, new T3.Vector3(2.3, 0.36, -1.15), 240, 840, 90); at(s2, new T3.Vector3(2.3, 0.62, -1.2), 240, 840, -140); at(okT, new T3.Vector3(2.0, 2.3, -0.9));
    });
    sfx('flow', 0, -15, { dur: K.rise + 0.35 }); sfx('gurgle', K.rise - 0.2, -7); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12);
    sfx('click', K.trap - 0.42, -10); sfx('refresh', K.trap, -14); sfx('gurgle', K.trap + 0.1, -16); sfx('thud', K.s1 + 0.3, -11);
    sfx('unscrew', K.s2 - 0.05, -6); sfx('plop', K.s2 + 0.62, -5); sfx('shower', K.rinse, -17, { dur: 0.6 }); sfx('unscrew', K.rinse + 0.5, -10);
    sfx('drain', K.drain - 0.08, -4); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
  function X58() {
    const de = lang === 'de';
    const S = de ? { chip: '🕖 7:20 · Whg 2A', who: 'Mieterin · Whg 2A', m1: 'Heizung an, aber der Heizkörper ist oben kalt 🥶', m2: 'Luft im Heizkörper. Mit dem Schlüssel entlüften, bis Wasser kommt ✓', ttl: 'Heizkörper kalt · Whg 2A', l1: '🫧 Ursache: Luft im Heizkörper', l2: '🔑 Entlüften, bis Wasser kommt', l3: '🔥 Wieder warm · 10 Min.', cold: '🥶 18 °C', hot: '🔥 55 °C', err: '🫧 Luftpolster', s1: '🔑 ¼ Umdrehung auf', ok: '✓ Kein Heizungsbauer nötig', end: ['In *10 Minuten* wieder warm.', null] }
      : { chip: '🕖 7:20 am · Apt 2A', who: 'Tenant · Apt 2A', m1: 'Heating is on but the radiator is cold at the top 🥶', m2: 'Air in the radiator. Bleed it with the key until water drips ✓', ttl: 'Cold radiator · Apt 2A', l1: '🫧 Cause: air in the radiator', l2: '🔑 Bleed until water drips', l3: '🔥 Warm again · 10 min', cold: '🥶 18 °C', hot: '🔥 55 °C', err: '🫧 Air pocket', s1: '🔑 Open ¼ turn', ok: '✓ No heating engineer needed', end: ['Warm again in *10 minutes*.', null] };
    const K = {};
    K.cold = W(['kalt', 'cold']).start; K.write = W(['schreibt', 'writes']).start;
    const it = W(['Tenance']); K.turn = it.start; K.ans = W(['antwortet', 'answers'], it.i).start;
    K.air = W(['Luft', 'air'], it.i).start; K.bleed = W(['entlüften', 'bleed'], it.i).start; K.drip = W(['Wasser', 'drips'], it.i).start; K.warm = W(['warm'], it.i).start;
    K.min = W(['Minuten', 'minutes'], it.i).start; K.no = W(['Kein', 'No'], it.i).start; K.cta = W(['Jetzt', 'Join'], it.i).start;
    const k = TDX({ sky: 'night', envTop: '#fff3e2', envBot: '#2d2a26', envInt: 0.75, fov: 30, pro: true });
    const { scene, MC, ov } = k;
    const SH = (window.PR || 1) >= 2 ? 4096 : 2048;
    scene.add(new T3.HemisphereLight('#fff3e6', '#3a3430', 0.32));
    const shadowed = (l, b = 6) => { l.castShadow = true; l.shadow.mapSize.set(SH, SH); Object.assign(l.shadow.camera, { left: -b, right: b, top: b, bottom: -b, near: 0.5, far: 40 }); l.shadow.radius = 3; l.shadow.bias = -0.0004; l.shadow.normalBias = 0.02; };
    const sun = new T3.DirectionalLight('#ffd6a0', 2.0); sun.position.set(6.5, 5.5, -7.5); sun.target.position.set(1.4, 0, 0); scene.add(sun.target); shadowed(sun); scene.add(sun);
    const keyL = new T3.DirectionalLight('#fff4ea', 0.7); keyL.position.set(-3.5, 6.5, 6.5); shadowed(keyL); scene.add(keyL);
    const fill = new T3.DirectionalLight('#d4e2ff', 0.3); fill.position.set(3, 2, 9); scene.add(fill);
    const D = new T3.Group(); scene.add(D);
    // ---- canvas textures ----
    const cvs = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 8; return t; };
    const tiles = (nx, ny, base, grout, jit) => cvs(512, 512, (x, w, h) => { x.fillStyle = grout; x.fillRect(0, 0, w, h); const tw = w / nx, th = h / ny; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const v = (MC.rnd(i * 31 + j, 3) - 0.5) * jit; const c = new T3.Color(base); c.offsetHSL(0, 0, v); x.fillStyle = '#' + c.getHexString(); x.fillRect(i * tw + 2, j * th + 2, tw - 4, th - 4); x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(i * tw + 3, j * th + 3, tw - 6, 3); } });
    const wood = cvs(512, 512, (x, w, h) => { for (let i = 0; i < 8; i++) { const c = new T3.Color('#b98a5e'); c.offsetHSL(0, 0, (MC.rnd(i, 7) - 0.5) * 0.08); x.fillStyle = '#' + c.getHexString(); x.fillRect(0, i * 64, w, 64); x.strokeStyle = 'rgba(60,35,20,0.35)'; x.lineWidth = 2; x.strokeRect(-2, i * 64, w + 4, 64); for (let g = 0; g < 9; g++) { x.strokeStyle = 'rgba(90,55,30,0.18)'; x.beginPath(); const y0 = i * 64 + 6 + MC.rnd(i * 9 + g, 2) * 52; x.moveTo(0, y0); x.bezierCurveTo(w * 0.3, y0 + 4, w * 0.6, y0 - 4, w, y0 + 2); x.stroke(); } } });
    const wallTile = tiles(10, 12, '#9fbdb2', '#7e968d', 0.05), floorTile = tiles(6, 6, '#4f5f66', '#36434a', 0.06);
    [wallTile, floorTile, wood].forEach((t) => { t.wrapS = t.wrapT = T3.RepeatWrapping; });
    const cloud = cvs(128, 128, (x) => { for (let i = 0; i < 7; i++) { const cx = 40 + MC.rnd(i, 1) * 48, cy = 40 + MC.rnd(i, 2) * 48, rr = 22 + MC.rnd(i, 3) * 26; const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); } });
    const frostT = cvs(512, 512, (x, w, h) => { x.fillStyle = 'rgba(235,245,255,0.16)'; x.fillRect(0, 0, w, h); x.lineCap = 'round'; for (let i = 0; i < 340; i++) { let px = MC.rnd(i, 1) * w, py = MC.rnd(i, 2) * h, an = MC.rnd(i, 3) * 6.28; x.strokeStyle = `rgba(255,255,255,${0.25 + MC.rnd(i, 4) * 0.5})`; x.lineWidth = 0.8 + MC.rnd(i, 5) * 1.6; x.beginPath(); x.moveTo(px, py); for (let s = 0; s < 7; s++) { an += (MC.rnd(i * 7 + s, 6) - 0.5) * 1.1; const L = 6 + MC.rnd(i * 7 + s, 7) * 18; px += Math.cos(an) * L; py += Math.sin(an) * L; x.lineTo(px, py); if (s % 2) { x.moveTo(px, py); x.lineTo(px + Math.cos(an + 1) * L * 0.5, py + Math.sin(an + 1) * L * 0.5); x.moveTo(px, py); } } x.stroke(); } });
    const fogT = cvs(256, 256, (x, w, h) => { x.fillStyle = 'rgba(232,240,248,0.7)'; x.fillRect(0, 0, w, h); for (let i = 0; i < 600; i++) { x.fillStyle = `rgba(255,255,255,${0.15 + MC.rnd(i, 2) * 0.3})`; x.beginPath(); x.arc(MC.rnd(i, 3) * w, MC.rnd(i, 4) * h, 1 + MC.rnd(i, 1) * 3, 0, 7); x.fill(); } });
    const grad = (stops, w = 8, h = 256) => cvs(w, h, (x) => { const g = x.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); });
    // ---- studio backdrop + base ----
    const bg = new T3.Mesh(new T3.SphereGeometry(40, 32, 16), new T3.MeshBasicMaterial({ map: grad([[0, '#0d1018'], [0.42, '#1d1c26'], [0.52, '#2b2730'], [1, '#121219']]), side: T3.BackSide, depthWrite: false })); scene.add(bg);
    mesh(rbox(7.2, 0.32, 3.7, 0.06), M.std('#26262e', { roughness: 0.85 }), D, [0.12, -0.16, -0.15]);
    // floors
    const fl = (tex, rep, x0, x1) => { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(...rep); t.wrapS = t.wrapT = T3.RepeatWrapping; return mesh(new T3.PlaneGeometry(x1 - x0, 3.3), M.std('#ffffff', { map: t, roughness: 0.55 }), D, [(x0 + x1) / 2, 0.002, -0.05], [-Math.PI / 2, 0, 0]); };
    fl(floorTile, [3, 3], -3.25, 0); const wf = fl(wood, [2.5, 3], 0, 3.45); wf.material.roughness = 0.62;
    // walls (cutaway: back + left + partition + right), tiles in the bathroom
    const wallM = M.std('#efe3d0', { roughness: 0.92 }), trimM = M.std('#f7f3ec', { roughness: 0.6 });
    const box = (w, h, d, mat, pos) => mesh(new T3.BoxGeometry(w, h, d), mat, D, pos);
    box(3.3, 2.65, 0.14, wallM, [-1.6, 1.325, -1.67]);                                                            // bathroom back
    box(1.7, 2.65, 0.14, wallM, [0.85, 1.325, -1.67]); box(0.85, 2.65, 0.14, wallM, [3.03, 1.325, -1.67]);       // kitchen back (window 1.7..2.6)
    box(0.9, 1.15, 0.14, wallM, [2.15, 0.575, -1.67]); box(0.9, 0.5, 0.14, wallM, [2.15, 2.4, -1.67]);
    box(0.14, 2.65, 3.3, wallM, [-3.32, 1.325, -0.05]);                                                            // left
    box(0.1, 2.65, 0.55, wallM, [0, 1.325, -1.325]);                                                                  // partition
    box(0.12, 2.65, 2.0, wallM, [3.51, 1.325, -0.65]);                                                             // right
    [[-1.6, -1.67, 3.4, 0.2], [1.8, -1.67, 3.6, 0.2]].forEach(([x, z, w, d]) => box(w, 0.07, d, trimM, [x, 2.68, z]));
    box(0.2, 0.07, 3.35, trimM, [-3.32, 2.68, -0.05]); box(0.14, 0.07, 0.59, trimM, [0, 2.68, -1.325]); box(0.16, 0.07, 2.04, trimM, [3.51, 2.68, -0.65]);
    const tw = (w, h, pos, rot, rep) => { const t = wallTile.clone(); t.needsUpdate = true; t.repeat.set(...rep); return mesh(new T3.PlaneGeometry(w, h), M.std('#ffffff', { map: t, roughness: 0.25, metalness: 0.0 }), D, pos, rot); };
    tw(3.25, 2.6, [-1.62, 1.3, -1.598], [0, 0, 0], [3.2, 2.6]); tw(3.3, 2.6, [-3.248, 1.3, -0.05], [0, Math.PI / 2, 0], [3.2, 2.6]);
    box(3.4, 0.09, 0.02, M.std('#e8dccb'), [1.75, 0.045, -1.595]);                                                 // skirting (kitchen)
    // ---- shower: tray, glass (with frost), chrome head + riser, mixer ----
    const chrome = M.std('#e8ecf0', { metalness: 1, roughness: 0.12 });
    mesh(rbox(1.2, 0.09, 1.08, 0.03), M.std('#f8f8f6', { roughness: 0.3 }), D, [-2.66, 0.045, -1.06]);
    mesh(new T3.CircleGeometry(0.05, 20), chrome, D, [-2.66, 0.092, -1.0], [-Math.PI / 2, 0, 0]);
    const glassM = new T3.MeshPhysicalMaterial({ color: '#e6f4ff', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, side: T3.DoubleSide, envMapIntensity: 1.6, clearcoat: 1 });
    const frostM = () => new T3.ShaderMaterial({ uniforms: { tF: { value: frostT }, uG: { value: 0 }, uM: { value: 0 } }, transparent: true, depthWrite: false, side: T3.DoubleSide,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D tF; uniform float uG, uM; varying vec2 vUv; void main(){ vec4 f = texture2D(tF, vUv); float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)) * 2.0; float a = f.a * smoothstep(uG, uG - 0.22, e) * (1.0 - uM); gl_FragColor = vec4(vec3(0.92, 0.97, 1.0) * 1.5, a * 0.95); }' });
    const panes = [[1.17, 2.0, [-2.03, 1.09, -0.98], [0, Math.PI / 2, 0]]].map(([w, h, pos, rot]) => {
      mesh(new T3.PlaneGeometry(w, h), glassM, D, pos, rot).castShadow = false;
      const fm = frostM(); const f = mesh(new T3.PlaneGeometry(w, h), fm, D, pos, rot); f.castShadow = false; f.renderOrder = 2;
      const g = new T3.Group(); g.position.set(...pos); g.rotation.set(...rot); D.add(g); [[0, h / 2], [0, -h / 2]].forEach(([dx, dy]) => mesh(new T3.BoxGeometry(w, 0.025, 0.025), chrome, g, [dx, dy, 0])); [[-w / 2], [w / 2]].forEach(([dx]) => mesh(new T3.BoxGeometry(0.025, h, 0.025), chrome, g, [dx, 0, 0]));
      return fm;
    });
    mesh(new T3.CylinderGeometry(0.018, 0.018, 1.0, 12), chrome, D, [-2.6, 1.6, -1.575]);                           // riser
    mesh(new T3.CylinderGeometry(0.016, 0.016, 0.34, 12), chrome, D, [-2.6, 2.08, -1.42], [Math.PI / 2, 0, 0]);       // arm
    const head = new T3.Group(); head.position.set(-2.6, 2.06, -1.24); head.rotation.x = 0.45; D.add(head);
    mesh(new T3.CylinderGeometry(0.12, 0.09, 0.035, 28), chrome, head, [0, 0, 0]);
    mesh(new T3.CircleGeometry(0.105, 28), M.std('#9aa3ad', { metalness: 0.8, roughness: 0.4 }), head, [0, -0.0185, 0], [Math.PI / 2, 0, 0]);
    mesh(rbox(0.16, 0.08, 0.06, 0.02), chrome, D, [-2.6, 1.1, -1.57]); mesh(new T3.CylinderGeometry(0.012, 0.012, 0.13, 8), chrome, D, [-2.55, 1.14, -1.53], [0, 0, 1.2]);
    // bath mat, vanity + basin + mirror (fog), wall light, towel hook + towel, plant
    mesh(rbox(0.62, 0.02, 0.42, 0.01), M.std('#7fb3a6', { roughness: 0.95 }), D, [-2.25, 0.012, -0.12]);
    mesh(rbox(0.82, 0.74, 0.46, 0.03), M.std('#c9a27a', { roughness: 0.6 }), D, [-1.05, 0.37, -1.35]);
    mesh(rbox(0.74, 0.07, 0.44, 0.03), M.std('#fbfbf9', { roughness: 0.25 }), D, [-1.05, 0.775, -1.35]);
    mesh(new T3.CylinderGeometry(0.012, 0.012, 0.16, 10), chrome, D, [-1.05, 0.86, -1.5]); mesh(new T3.CylinderGeometry(0.01, 0.01, 0.1, 8), chrome, D, [-1.05, 0.93, -1.46], [Math.PI / 2, 0, 0]);
    mesh(new T3.PlaneGeometry(0.7, 0.84), M.std('#c9d2db', { metalness: 1, roughness: 0.06 }), D, [-1.05, 1.58, -1.59]);
    const mirFog = mesh(new T3.PlaneGeometry(0.7, 0.84), new T3.MeshBasicMaterial({ map: fogT, transparent: true, depthWrite: false, opacity: 0.8 }), D, [-1.05, 1.58, -1.585]); mirFog.castShadow = false;
    mesh(rbox(0.5, 0.05, 0.05, 0.02), new T3.MeshBasicMaterial({ color: new T3.Color(2.2, 1.9, 1.5) }), D, [-1.05, 2.07, -1.56]);
    const wl = new T3.PointLight('#ffd7a8', 1.6, 5); wl.position.set(-1.05, 2.0, -1.2); D.add(wl);
    const showerL = new T3.PointLight('#ffe2c0', 1.2, 3.5); showerL.position.set(-2.5, 2.1, -0.8); D.add(showerL);
    mesh(new T3.CylinderGeometry(0.015, 0.015, 0.08, 8), chrome, D, [-1.75, 1.62, -1.56], [Math.PI / 2, 0, 0]);
    const towelM = M.std('#f0b84a', { roughness: 0.95 });
    const towelH = mesh(rbox(0.38, 0.62, 0.06, 0.03), towelM, D, [-1.75, 1.33, -1.53]);
    const towelF = mesh(rbox(0.38, 0.62, 0.06, 0.03), towelM, D, [0, 0, 0]); towelF.visible = false;
    const plant = (x, y, z, s) => { const g = new T3.Group(); g.position.set(x, y, z); g.scale.setScalar(s); D.add(g); mesh(new T3.CylinderGeometry(0.16, 0.12, 0.3, 16), M.std('#c86b3c'), g, [0, 0.15, 0]); [[0, 0.55, 0, 0.26], [0.13, 0.45, 0.06, 0.2], [-0.12, 0.47, -0.05, 0.19]].forEach(([a, b, c, rr]) => mesh(new T3.SphereGeometry(rr, 14, 10), M.std('#3d7a4f', { roughness: 0.8 }), g, [a, b, c])); return g; };
    plant(-0.38, 0, -1.3, 1.0);
    // ---- kitchen: window (winter morning outside), counter, kettle, fridge, clock ----
    const frameM = M.std('#f6f3ee', { roughness: 0.5 });
    [[2.15, 1.15, 0.92, 0.07], [2.15, 2.15, 0.92, 0.07], [1.7, 1.65, 0.07, 1.06], [2.6, 1.65, 0.07, 1.06], [2.15, 1.65, 0.04, 1.0]].forEach(([x, y, w, h]) => box(w, h, 0.16, frameM, [x, y, -1.67]));
    box(1.0, 0.05, 0.26, frameM, [2.15, 1.13, -1.56]);
    const sky = mesh(new T3.PlaneGeometry(9, 5), new T3.MeshBasicMaterial({ map: grad([[0, '#8fb6e0'], [0.55, '#d9d6dc'], [1, '#f6c79a']]) }), D, [2.4, 1.7, -6.2]); sky.castShadow = false;
    for (let i = 0; i < 7; i++) { const w = 0.8 + MC.rnd(i, 1) * 0.9, h = 0.5 + MC.rnd(i, 2) * 1.0, x = -0.4 + i * 0.85 + MC.rnd(i, 3) * 0.3, z = -3.6 - MC.rnd(i, 4) * 1.6; box(w, h, 0.9, M.std('#8a7f86', { roughness: 0.9 }), [x, 0.4 + h / 2, z]); box(w + 0.06, 0.07, 0.96, M.std('#f4f7fb', { roughness: 0.9 }), [x, 0.4 + h + 0.03, z]); }
    const sunG = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, color: new T3.Color(1.6, 1.2, 0.8) })); sunG.position.set(4.2, 2.3, -6.0); sunG.scale.setScalar(3.2); D.add(sunG);
    const shaftT = grad([[0, 'rgba(255,230,190,0.0)'], [0.15, 'rgba(255,230,190,0.55)'], [1, 'rgba(255,230,190,0.0)']], 8, 128);
    const sdir = new T3.Vector3().subVectors(sun.target.position, sun.position).normalize();
    [[-0.25, 0.85], [0.18, 0.7], [0.0, 1.0]].forEach(([dx, wv], i) => {
      const p0 = new T3.Vector3(2.15 + dx, 1.65 + (i - 1) * 0.15, -1.66), L = 1.9 / -sdir.y, mid = p0.clone().addScaledVector(sdir, L / 2);
      const m = new T3.Mesh(new T3.PlaneGeometry(wv * 0.55, L), new T3.MeshBasicMaterial({ map: shaftT, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, opacity: 0.12, side: T3.DoubleSide }));
      m.position.copy(mid); m.up.copy(sdir).negate(); m.lookAt(mid.clone().add(new T3.Vector3(0, 0, 1))); D.add(m);
    });
    mesh(rbox(1.0, 0.86, 0.6, 0.03), M.std('#2f5a44', { roughness: 0.55 }), D, [2.2, 0.43, -1.3]);
    mesh(rbox(1.06, 0.05, 0.64, 0.02), M.std('#dccab0', { roughness: 0.45 }), D, [2.2, 0.885, -1.3]);
    [1.95, 2.45].forEach((x) => mesh(new T3.BoxGeometry(0.16, 0.02, 0.02), chrome, D, [x, 0.75, -0.99]));
    const kettle = new T3.Group(); kettle.position.set(2.5, 0.91, -1.32); D.add(kettle); mesh(new T3.CylinderGeometry(0.085, 0.1, 0.2, 20), M.std('#d23b30', { roughness: 0.35, metalness: 0.2 }), kettle, [0, 0.1, 0]); mesh(new T3.TorusGeometry(0.05, 0.012, 8, 16, Math.PI), M.std('#2b2b2b'), kettle, [0, 0.22, 0]);
    mesh(new T3.CylinderGeometry(0.04, 0.035, 0.09, 16), M.std('#f4f1ea'), D, [1.95, 0.955, -1.25]);
    plant(2.05, 1.155, -1.56, 0.45);
    mesh(rbox(0.64, 1.86, 0.64, 0.05), M.std('#e9edf2', { roughness: 0.3, metalness: 0.15 }), D, [3.1, 0.93, -1.25]); mesh(new T3.BoxGeometry(0.03, 0.5, 0.04), chrome, D, [2.83, 1.25, -0.92]); mesh(new T3.BoxGeometry(0.64, 0.01, 0.01), M.std('#c5ccd4'), D, [3.1, 1.32, -0.93]);
    const clock = new T3.Group(); clock.position.set(2.95, 2.18, -1.585); D.add(clock);
    mesh(new T3.CylinderGeometry(0.15, 0.15, 0.03, 32), M.std('#1d4734'), clock, [0, 0, 0], [Math.PI / 2, 0, 0]); mesh(new T3.CircleGeometry(0.13, 32), M.std('#faf6ee'), clock, [0, 0, 0.016]);
    const hand = (L, wv, c) => { const g = new T3.Group(); g.position.z = 0.02; clock.add(g); mesh(new T3.BoxGeometry(wv, L, 0.005), M.std(c), g, [0, L / 2 - 0.015, 0]); return g; };
    const hH = hand(0.07, 0.012, '#14261b'), hM = hand(0.105, 0.008, '#14261b'), hS = hand(0.11, 0.004, '#e09b6b');
    hH.rotation.z = -(7 + 10 / 60) / 12 * Math.PI * 2; hM.rotation.z = -10 / 60 * Math.PI * 2;
    // ---- X58: panel radiator with thermal overlay, air pocket, bleed valve + key ----
    mirFog.visible = false;
    const RAD = new T3.Group(); RAD.position.set(0.85, 0.47, -1.5); D.add(RAD);
    const radM = M.std('#f6f5f1', { roughness: 0.35 });
    mesh(rbox(0.7, 0.56, 0.08, 0.02), radM, RAD, [0, 0, 0]);
    for (let i = 0; i < 11; i++) mesh(new T3.BoxGeometry(0.012, 0.5, 0.01), M.std('#e4e2dc', { roughness: 0.4 }), RAD, [-0.3 + i * 0.06, 0, 0.042]);
    [[-0.33, -0.36], [0.33, -0.36]].forEach(([x, y]) => mesh(new T3.CylinderGeometry(0.012, 0.012, 0.22, 10), chrome, RAD, [x, y + 0.04, 0.0]));
    const trv = mesh(new T3.CylinderGeometry(0.03, 0.03, 0.09, 18), M.std('#fbfbf8', { roughness: 0.3 }), RAD, [0.39, -0.2, 0.02], [0, 0, Math.PI / 2]);
    const brass = M.std('#c9a227', { metalness: 0.8, roughness: 0.3 });
    mesh(new T3.CylinderGeometry(0.012, 0.012, 0.03, 10), brass, RAD, [-0.37, 0.24, 0.0], [0, 0, Math.PI / 2]);
    const VALVE = new T3.Vector3(0.85 - 0.39, 0.47 + 0.24, -1.5);
    const key = new T3.Group(); D.add(key); mesh(new T3.BoxGeometry(0.03, 0.012, 0.012), brass, key, [-0.015, 0, 0]); mesh(new T3.BoxGeometry(0.012, 0.05, 0.012), brass, key, [-0.036, 0, 0]);
    const thM = new T3.ShaderMaterial({ uniforms: { uLev: { value: 0.45 }, uT: { value: 0 }, uTime: { value: 0 } }, transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uLev, uT, uTime; varying vec2 vUv; vec3 ramp(float x){ x = clamp(x, 0.0, 1.0); vec3 a = vec3(0.03, 0.01, 0.3), b = vec3(0.05, 0.35, 0.95), c = vec3(1.0, 0.7, 0.05), d = vec3(0.95, 0.12, 0.02); return x < 0.33 ? mix(a, b, x / 0.33) : (x < 0.66 ? mix(b, c, (x - 0.33) / 0.33) : mix(c, d, (x - 0.66) / 0.34)); } void main(){ float n = sin(vUv.x * 40.0 + uTime * 2.0) * 0.015 + sin(vUv.x * 13.0 - uTime) * 0.02; float hot = 1.0 - smoothstep(uLev - 0.1, uLev + 0.06, vUv.y + n); float tt = 0.12 + 0.85 * hot - 0.1 * abs(vUv.x - 0.5); gl_FragColor = vec4(ramp(tt) * 0.9, uT * 0.96); }' });
    const thP = mesh(new T3.PlaneGeometry(0.72, 0.58), thM, RAD, [0, 0, 0.05]); thP.castShadow = false; thP.renderOrder = 3;
    const airM = new T3.MeshBasicMaterial({ color: new T3.Color(1.6, 1.8, 2.0), transparent: true, opacity: 0, depthWrite: false });
    const air = [...Array(14)].map((_, i) => { const m = mesh(new T3.SphereGeometry(0.008 + MC.rnd(i, 1) * 0.01, 12, 10), airM, RAD, [-0.3 + MC.rnd(i, 2) * 0.6, 0.16 + MC.rnd(i, 3) * 0.1, 0.055]); m.renderOrder = 4; m.castShadow = false; return { m, x0: m.position.x, y0: m.position.y }; });
    const puffs = [...Array(14)].map((_, i) => { const m = new T3.Sprite(new T3.SpriteMaterial({ map: cloud, transparent: true, depthWrite: false, opacity: 0 })); m.renderOrder = 5; D.add(m); return { m, ph: MC.rnd(i, 1), dz: MC.rnd(i, 2), dy: MC.rnd(i, 3) }; });
    const drops = [...Array(6)].map((_, i) => mesh(new T3.SphereGeometry(0.008, 8, 6), new T3.MeshStandardMaterial({ color: '#bfe0ff', roughness: 0.05, transparent: true, opacity: 0.85 }), D, [0, -5, 0]));
    mesh(new T3.CylinderGeometry(0.04, 0.035, 0.08, 16, 1, true), new T3.MeshStandardMaterial({ color: '#e8f2ff', transparent: true, opacity: 0.35, roughness: 0.05, side: T3.DoubleSide }), D, [VALVE.x - 0.02, 0.04, -1.36]);
    // ---- tenant (sweater + scarf) + phone ----
    const TN = k.fig(D, '#e8b98f', 0.1, 0, -0.85, 0.95, '#7a3b1e');
    const swM = M.std('#6f5bb5', { roughness: 0.9 }); mesh(new T3.CylinderGeometry(0.218, 0.24, 0.58, 24, 1, true), swM, TN.userData.B, [0, 0.48, 0]); mesh(new T3.TorusGeometry(0.2, 0.034, 8, 24), swM, TN.userData.B, [0, 0.77, 0], [Math.PI / 2, 0, 0]);
    mesh(new T3.TorusGeometry(0.17, 0.045, 10, 24), M.std('#d23b30', { roughness: 0.9 }), TN.userData.B, [0, 0.82, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const POS = new T3.Vector3(0.1, 0, -0.85); const vTN = () => POS.clone();
    // ---- state ----
    const lev = (t) => t < K.bleed + 0.2 ? 0.45 : lerp(0.45, 1.12, E.io(seg(t, K.bleed + 0.2, Math.max(0.6, K.warm - K.bleed + 0.2))));
    const thermal = (t) => Math.max(E.io(seg(t, 0, 0.01)) * (1 - E.io(seg(t, K.cold - 0.3, 0.3))), E.io(seg(t, K.air - 0.1, 0.3)) * (1 - E.io(seg(t, K.no - 0.2, 0.3))));
    const keyIn = (t) => antMove(t, K.bleed - 0.35, 0.3, 0, 1, 1.2) * (1 - E.io(seg(t, K.warm + 0.2, 0.3)));
    const keyTurn = (t) => antMove(t, K.bleed - 0.02, 0.2, 0, 1, 1.3) - antMove(t, K.drip + 0.35, 0.2, 0, 1, 1.3);
    const hiss = (t) => t > K.bleed + 0.15 && t < K.drip + 0.1 ? 1 : 0;
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.3, 2.8, 1.05, 0.86, 0.5, -1.45)],
      [K.cold - 0.05, P(0.35, 1.7, 1.1, 0.72, 0.72, -1.45, 26), E.io],
      [K.cold + 0.45, PT(0.55, 2.3, 1.3, 1.05, 21, 0.03), A9],
      [K.write - 0.3, PT(0.55, 2.4, 1.28, 1.03, 22), E.lin],
      [K.write + 0.2, PT(0.6, 1.7, 1.42, 1.0, 26), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 0.1, 1.15, -0.55), A6],
      [K.air - 0.3, P(0.0, 9.2, 2.6, 0.1, 1.15, -0.55), E.lin],
      [K.air + 0.15, P(0.35, 2.4, 1.0, 0.86, 0.5, -1.45, 28), A9],
      [K.bleed + 0.1, P(0.45, 1.15, 0.9, 0.5, 0.7, -1.45, 24), A6],
      [K.drip + 0.3, P(0.48, 1.05, 0.86, 0.48, 0.66, -1.45, 24), E.lin],
      [K.warm - 0.05, P(0.35, 2.8, 1.1, 0.86, 0.5, -1.45), A6],
      [K.no + 0.35, P(0.45, 3.2, 1.5, 0.7, 0.9, -1.1), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3();
    k.frame((t) => {
      const L = lev(t), th = thermal(t), warm = E.io(seg(t, K.warm - 0.1, 0.8));
      const g = k.grade; g.temp = lerp(-0.45, 0.42, warm); g.th = 1.6; g.bloom = 0.35 + 0.15 * th; g.sat = 1.04;
      thM.uniforms.uLev.value = L; thM.uniforms.uT.value = th; thM.uniforms.uTime.value = t;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      // air pocket: bubbles crowd the top, then stream to the valve while bleeding
      const bl = E.io(seg(t, K.bleed + 0.1, Math.max(0.5, K.drip - K.bleed)));
      airM.opacity = 0.55 * th * (1 - bl);
      air.forEach((a, i) => { a.m.position.x = lerp(a.x0, -0.36, bl) + Math.sin(t * 3 + i) * 0.006; a.m.position.y = lerp(a.y0, 0.24, bl) + Math.sin(t * 4 + i * 2) * 0.006; a.m.scale.setScalar(Math.max(1e-3, 1 - 0.7 * bl)); });
      // key: slides in, quarter turn, hiss of air, then water drips, key closes
      const ki = keyIn(t); key.position.set(VALVE.x - 0.05 - 0.12 * (1 - ki), VALVE.y + 0.04 * (1 - ki), VALVE.z + 0.05 * (1 - ki)); key.rotation.x = keyTurn(t) * Math.PI / 2; key.visible = ki > 0.01;
      const hs = hiss(t);
      puffs.forEach((p, i) => { const a = ((t * 2.2 + p.ph) % 1); p.m.position.set(VALVE.x - 0.06 - a * 0.25, VALVE.y + (p.dy - 0.3) * 0.08 * a + a * 0.05, VALVE.z + 0.05 + (p.dz - 0.2) * 0.2 * a); p.m.scale.setScalar(0.04 + a * 0.16); p.m.material.opacity = 0.35 * hs * Math.sin(a * Math.PI); });
      drops.forEach((m, i) => { const life = 0.45, a = ((t / life + i / drops.length) % 1); const on = t > K.drip - 0.05 && t < K.drip + 0.45; if (!on) { m.position.y = -5; return; } m.position.set(VALVE.x - 0.045, VALVE.y - 0.02 - 0.65 * a * a, VALVE.z + 0.03); });
      // tenant: touches the cold top → shiver + turns to camera → phone → kneels at the valve → joy → warms hands
      const touch = antMove(t, 0.5, 0.3, 0, 1, 1.2) * (1 - E.io(seg(t, K.cold + 0.05, 0.15)));
      const shock = E.io(seg(t, K.cold, 0.08)) * (1 - E.io(seg(t, K.cold + 0.8, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.air - 0.5, 0.25)));
      const kneel = E.io(seg(t, K.air - 0.4, 0.3)) * (1 - E.io(seg(t, K.warm + 0.3, 0.3)));
      const work = kneel * (t > K.bleed - 0.4 && t < K.drip + 0.5 ? 1 : 0);
      const joy = MC.spring(t, K.warm + 0.2, 2.4, 0.35) * (1 - E.io(seg(t, K.no - 0.2, 0.3)));
      const hands = E.io(seg(t, K.no - 0.2, 0.3));
      const shiver = t < K.warm ? Math.sin(t * 55) * 0.02 * (1 - kneel) : 0;
      const face = lerp(lerp(2.45, 0.6, antMove(t, K.cold + 0.02, 0.25, 0, 1, 1.2)), 2.6, E.io(seg(t, K.air - 0.5, 0.3)));
      k.drive(TN, t, vTN, {
        face, squash: -0.12 * Math.exp(-Math.pow((t - (K.cold + 0.12)) / 0.07, 2)), tilt: shiver, nod: 0.25 * phoneUp - 0.1 * shock + 0.2 * kneel,
        lift: -0.2 * kneel, lean: 0.4 * kneel - 0.12 * joy,
        armL: shock > 0.5 ? -1.3 : (joy > 0.02 ? -0.4 - 2.4 * joy : -0.2 - 1.1 * hands - 0.9 * work),
        armR: shock > 0.5 ? -1.3 : (joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 1.15 * touch - 1.2 * phoneUp - 1.1 * work - 1.1 * hands + 0.12 * work * Math.sin(t * 12)),
        armLz: shock > 0.5 ? -0.6 : 0, armRz: shock > 0.5 ? -0.6 : 0,
      });
      k.face(TN, t, { wide: shock, o: shock * 0.6, smile: joy > 0.1 || hands > 0.5 ? 1 : 0.1, closed: hands > 0.5 ? 0.8 : 0 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.air - 0.45); k.popOut(m2, K.air - 0.39);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.air - 0.3);
    cd.line(0, K.air + 0.2); cd.line(1, K.drip + 0.1); cd.line(2, K.min - 0.2);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const tC = ov('tdtag step', S.cold), tH = ov('tdtag hotT', S.hot);
    k.popIn(tC, 0.3, { y: 30 }); k.popOut(tC, K.cold + 0.3, { y: -40 }); k.popIn(tH, 0.45, { y: 30 }); k.popOut(tH, K.cold + 0.35, { y: -40 });
    const eT = ov('tdtag warn', S.err); k.popIn(eT, K.air + 0.25, { y: 30 }); k.popOut(eT, K.bleed - 0.1, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.bleed - 0.05, { y: 30 }); k.popOut(s1, K.warm - 0.15, { y: -40 });
    const tW = ov('tdtag hotT', S.hot); k.popIn(tW, K.warm + 0.25, { y: 30, s0: 0.4 }); k.popOut(tW, K.no - 0.15, { y: -40 });
    const tm = ov('tdtimer', '<i></i><b>10:00</b>'); tl.set(tm, { xPercent: -50 }, 0); k.popIn(tm, K.warm + 0.05, { y: 40 }); k.popOut(tm, K.no - 0.12, { y: -40 });
    const tmB = tm.querySelector('b'), tmI = tm.querySelector('i');
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      const u = seg(t, K.warm + 0.1, Math.max(0.25, Math.min(0.7, K.no - K.warm - 0.4))), sl = Math.round(600 * (1 - u)); const lbl = u >= 1 ? '✓' : `${Math.floor(sl / 60)}:${String(sl % 60).padStart(2, '0')}`; if (tmB.textContent !== lbl) tmB.textContent = lbl; tmI.style.background = `conic-gradient(#e09b6b ${(1 - u) * 360}deg, rgba(255,255,255,.15) 0)`;
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(tC, new T3.Vector3(0.85, 0.78, -1.45), 240, 840, -40); at(tH, new T3.Vector3(0.85, 0.22, -1.45), 240, 840, 40); at(eT, new T3.Vector3(0.85, 0.8, -1.45), 240, 840, -60);
      at(s1, new T3.Vector3(0.46, 0.85, -1.45), 240, 840, -50); at(tW, new T3.Vector3(0.85, 0.8, -1.45), 240, 840, -40); at(okT, new T3.Vector3(0.7, 1.9, -1.0));
    });
    sfx('shiver', K.cold + 0.05, -10); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12); sfx('refresh', K.air, -14);
    sfx('click', K.bleed - 0.05, -6); sfx('wind', K.bleed + 0.15, -12, { dur: Math.max(0.5, K.drip - K.bleed) }); sfx('drip', K.drip, -8); sfx('heater', K.warm - 0.1, -12); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
  function X59() {
    const de = lang === 'de';
    const S = de ? { chip: '🕑 2:00 · Whg 2A', who: 'Mieterin · Whg 2A', m1: 'Die Toilette läuft ununterbrochen 😩 Ich kann nicht schlafen', m2: 'Die Dichtung schließt nicht. Deckel ab, Kette etwas lockern ✓', ttl: 'Toilette läuft · Whg 2A', l1: '🔍 Ursache: Dichtung undicht', l2: '⛓️ Kette gerichtet', l3: '💧 Wasser gestoppt', err: '⚠️ Dichtung hängt offen', s1: '① Deckel ab', s2: '② Kette lockern', lit: 'L verschwendet', ok: '✓ Kein Klempner nötig', end: ['In *2 Minuten* wieder Ruhe.', null] }
      : { chip: '🕑 2:00 am · Apt 2A', who: 'Tenant · Apt 2A', m1: 'The toilet won’t stop running 😩 I can’t sleep', m2: 'The flapper isn’t sealing. Lift the lid and give the chain some slack ✓', ttl: 'Running toilet · Apt 2A', l1: '🔍 Cause: flapper not sealing', l2: '⛓️ Chain fixed', l3: '💧 Water stopped', err: '⚠️ Flapper stuck open', s1: '① Lift the lid', s2: '② Slack in the chain', lit: 'L wasted', ok: '✓ No plumber needed', end: ['Quiet again in *2 minutes*.', null] };
    const K = {};
    K.run = W(['läuft', 'running']).start; K.write = W(['schreibt', 'writes']).start;
    const it = W(['Tenance']); K.turn = it.start; K.ans = W(['antwortet', 'answers'], it.i).start;
    K.flap = W(['Dichtung', 'flapper'], it.i).start; K.lid = W(['Deckel', 'lid'], it.i).start; K.chain = W(['Kette', 'chain'], it.i).start; K.stop = W(['stoppt', 'stops'], it.i).start;
    K.no = W(['Kein', 'No'], it.i).start; K.cta = W(['Jetzt', 'Join'], it.i).start;
    const k = TDX({ sky: 'night', envTop: '#fff3e2', envBot: '#2d2a26', envInt: 0.75, fov: 30, pro: true });
    const { scene, MC, ov } = k;
    const SH = (window.PR || 1) >= 2 ? 4096 : 2048;
    scene.add(new T3.HemisphereLight('#c9d6ff', '#2a2a33', 0.18));
    const shadowed = (l, b = 6) => { l.castShadow = true; l.shadow.mapSize.set(SH, SH); Object.assign(l.shadow.camera, { left: -b, right: b, top: b, bottom: -b, near: 0.5, far: 40 }); l.shadow.radius = 3; l.shadow.bias = -0.0004; l.shadow.normalBias = 0.02; };
    const sun = new T3.DirectionalLight('#9fb4ff', 0.3); sun.position.set(6.5, 5.5, -7.5); sun.target.position.set(1.4, 0, 0); scene.add(sun.target); shadowed(sun); scene.add(sun);
    const keyL = new T3.DirectionalLight('#dfe6ff', 0.35); keyL.position.set(-3.5, 6.5, 6.5); shadowed(keyL); scene.add(keyL);
    const fill = new T3.DirectionalLight('#d4e2ff', 0.3); fill.position.set(3, 2, 9); scene.add(fill);
    const D = new T3.Group(); scene.add(D);
    // ---- canvas textures ----
    const cvs = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 8; return t; };
    const tiles = (nx, ny, base, grout, jit) => cvs(512, 512, (x, w, h) => { x.fillStyle = grout; x.fillRect(0, 0, w, h); const tw = w / nx, th = h / ny; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const v = (MC.rnd(i * 31 + j, 3) - 0.5) * jit; const c = new T3.Color(base); c.offsetHSL(0, 0, v); x.fillStyle = '#' + c.getHexString(); x.fillRect(i * tw + 2, j * th + 2, tw - 4, th - 4); x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(i * tw + 3, j * th + 3, tw - 6, 3); } });
    const wood = cvs(512, 512, (x, w, h) => { for (let i = 0; i < 8; i++) { const c = new T3.Color('#b98a5e'); c.offsetHSL(0, 0, (MC.rnd(i, 7) - 0.5) * 0.08); x.fillStyle = '#' + c.getHexString(); x.fillRect(0, i * 64, w, 64); x.strokeStyle = 'rgba(60,35,20,0.35)'; x.lineWidth = 2; x.strokeRect(-2, i * 64, w + 4, 64); for (let g = 0; g < 9; g++) { x.strokeStyle = 'rgba(90,55,30,0.18)'; x.beginPath(); const y0 = i * 64 + 6 + MC.rnd(i * 9 + g, 2) * 52; x.moveTo(0, y0); x.bezierCurveTo(w * 0.3, y0 + 4, w * 0.6, y0 - 4, w, y0 + 2); x.stroke(); } } });
    const wallTile = tiles(10, 12, '#9fbdb2', '#7e968d', 0.05), floorTile = tiles(6, 6, '#4f5f66', '#36434a', 0.06);
    [wallTile, floorTile, wood].forEach((t) => { t.wrapS = t.wrapT = T3.RepeatWrapping; });
    const cloud = cvs(128, 128, (x) => { for (let i = 0; i < 7; i++) { const cx = 40 + MC.rnd(i, 1) * 48, cy = 40 + MC.rnd(i, 2) * 48, rr = 22 + MC.rnd(i, 3) * 26; const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); } });
    const frostT = cvs(512, 512, (x, w, h) => { x.fillStyle = 'rgba(235,245,255,0.16)'; x.fillRect(0, 0, w, h); x.lineCap = 'round'; for (let i = 0; i < 340; i++) { let px = MC.rnd(i, 1) * w, py = MC.rnd(i, 2) * h, an = MC.rnd(i, 3) * 6.28; x.strokeStyle = `rgba(255,255,255,${0.25 + MC.rnd(i, 4) * 0.5})`; x.lineWidth = 0.8 + MC.rnd(i, 5) * 1.6; x.beginPath(); x.moveTo(px, py); for (let s = 0; s < 7; s++) { an += (MC.rnd(i * 7 + s, 6) - 0.5) * 1.1; const L = 6 + MC.rnd(i * 7 + s, 7) * 18; px += Math.cos(an) * L; py += Math.sin(an) * L; x.lineTo(px, py); if (s % 2) { x.moveTo(px, py); x.lineTo(px + Math.cos(an + 1) * L * 0.5, py + Math.sin(an + 1) * L * 0.5); x.moveTo(px, py); } } x.stroke(); } });
    const fogT = cvs(256, 256, (x, w, h) => { x.fillStyle = 'rgba(232,240,248,0.7)'; x.fillRect(0, 0, w, h); for (let i = 0; i < 600; i++) { x.fillStyle = `rgba(255,255,255,${0.15 + MC.rnd(i, 2) * 0.3})`; x.beginPath(); x.arc(MC.rnd(i, 3) * w, MC.rnd(i, 4) * h, 1 + MC.rnd(i, 1) * 3, 0, 7); x.fill(); } });
    const grad = (stops, w = 8, h = 256) => cvs(w, h, (x) => { const g = x.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); });
    // ---- studio backdrop + base ----
    const bg = new T3.Mesh(new T3.SphereGeometry(40, 32, 16), new T3.MeshBasicMaterial({ map: grad([[0, '#0d1018'], [0.42, '#1d1c26'], [0.52, '#2b2730'], [1, '#121219']]), side: T3.BackSide, depthWrite: false })); scene.add(bg);
    mesh(rbox(7.2, 0.32, 3.7, 0.06), M.std('#26262e', { roughness: 0.85 }), D, [0.12, -0.16, -0.15]);
    // floors
    const fl = (tex, rep, x0, x1) => { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(...rep); t.wrapS = t.wrapT = T3.RepeatWrapping; return mesh(new T3.PlaneGeometry(x1 - x0, 3.3), M.std('#ffffff', { map: t, roughness: 0.55 }), D, [(x0 + x1) / 2, 0.002, -0.05], [-Math.PI / 2, 0, 0]); };
    fl(floorTile, [3, 3], -3.25, 0); const wf = fl(wood, [2.5, 3], 0, 3.45); wf.material.roughness = 0.62;
    // walls (cutaway: back + left + partition + right), tiles in the bathroom
    const wallM = M.std('#efe3d0', { roughness: 0.92 }), trimM = M.std('#f7f3ec', { roughness: 0.6 });
    const box = (w, h, d, mat, pos) => mesh(new T3.BoxGeometry(w, h, d), mat, D, pos);
    box(3.3, 2.65, 0.14, wallM, [-1.6, 1.325, -1.67]);                                                            // bathroom back
    box(1.7, 2.65, 0.14, wallM, [0.85, 1.325, -1.67]); box(0.85, 2.65, 0.14, wallM, [3.03, 1.325, -1.67]);       // kitchen back (window 1.7..2.6)
    box(0.9, 1.15, 0.14, wallM, [2.15, 0.575, -1.67]); box(0.9, 0.5, 0.14, wallM, [2.15, 2.4, -1.67]);
    box(0.14, 2.65, 3.3, wallM, [-3.32, 1.325, -0.05]);                                                            // left
    box(0.1, 2.65, 0.55, wallM, [0, 1.325, -1.325]);                                                                  // partition
    box(0.12, 2.65, 2.0, wallM, [3.51, 1.325, -0.65]);                                                             // right
    [[-1.6, -1.67, 3.4, 0.2], [1.8, -1.67, 3.6, 0.2]].forEach(([x, z, w, d]) => box(w, 0.07, d, trimM, [x, 2.68, z]));
    box(0.2, 0.07, 3.35, trimM, [-3.32, 2.68, -0.05]); box(0.14, 0.07, 0.59, trimM, [0, 2.68, -1.325]); box(0.16, 0.07, 2.04, trimM, [3.51, 2.68, -0.65]);
    const tw = (w, h, pos, rot, rep) => { const t = wallTile.clone(); t.needsUpdate = true; t.repeat.set(...rep); return mesh(new T3.PlaneGeometry(w, h), M.std('#ffffff', { map: t, roughness: 0.25, metalness: 0.0 }), D, pos, rot); };
    tw(3.25, 2.6, [-1.62, 1.3, -1.598], [0, 0, 0], [3.2, 2.6]); tw(3.3, 2.6, [-3.248, 1.3, -0.05], [0, Math.PI / 2, 0], [3.2, 2.6]);
    box(3.4, 0.09, 0.02, M.std('#e8dccb'), [1.75, 0.045, -1.595]);                                                 // skirting (kitchen)
    // ---- shower: tray, glass (with frost), chrome head + riser, mixer ----
    const chrome = M.std('#e8ecf0', { metalness: 1, roughness: 0.12 });
    mesh(rbox(1.2, 0.09, 1.08, 0.03), M.std('#f8f8f6', { roughness: 0.3 }), D, [-2.66, 0.045, -1.06]);
    mesh(new T3.CircleGeometry(0.05, 20), chrome, D, [-2.66, 0.092, -1.0], [-Math.PI / 2, 0, 0]);
    const glassM = new T3.MeshPhysicalMaterial({ color: '#e6f4ff', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, side: T3.DoubleSide, envMapIntensity: 1.6, clearcoat: 1 });
    const frostM = () => new T3.ShaderMaterial({ uniforms: { tF: { value: frostT }, uG: { value: 0 }, uM: { value: 0 } }, transparent: true, depthWrite: false, side: T3.DoubleSide,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D tF; uniform float uG, uM; varying vec2 vUv; void main(){ vec4 f = texture2D(tF, vUv); float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)) * 2.0; float a = f.a * smoothstep(uG, uG - 0.22, e) * (1.0 - uM); gl_FragColor = vec4(vec3(0.92, 0.97, 1.0) * 1.5, a * 0.95); }' });
    const panes = [[1.17, 2.0, [-2.03, 1.09, -0.98], [0, Math.PI / 2, 0]]].map(([w, h, pos, rot]) => {
      mesh(new T3.PlaneGeometry(w, h), glassM, D, pos, rot).castShadow = false;
      const fm = frostM(); const f = mesh(new T3.PlaneGeometry(w, h), fm, D, pos, rot); f.castShadow = false; f.renderOrder = 2;
      const g = new T3.Group(); g.position.set(...pos); g.rotation.set(...rot); D.add(g); [[0, h / 2], [0, -h / 2]].forEach(([dx, dy]) => mesh(new T3.BoxGeometry(w, 0.025, 0.025), chrome, g, [dx, dy, 0])); [[-w / 2], [w / 2]].forEach(([dx]) => mesh(new T3.BoxGeometry(0.025, h, 0.025), chrome, g, [dx, 0, 0]));
      return fm;
    });
    mesh(new T3.CylinderGeometry(0.018, 0.018, 1.0, 12), chrome, D, [-2.6, 1.6, -1.575]);                           // riser
    mesh(new T3.CylinderGeometry(0.016, 0.016, 0.34, 12), chrome, D, [-2.6, 2.08, -1.42], [Math.PI / 2, 0, 0]);       // arm
    const head = new T3.Group(); head.position.set(-2.6, 2.06, -1.24); head.rotation.x = 0.45; D.add(head);
    mesh(new T3.CylinderGeometry(0.12, 0.09, 0.035, 28), chrome, head, [0, 0, 0]);
    mesh(new T3.CircleGeometry(0.105, 28), M.std('#9aa3ad', { metalness: 0.8, roughness: 0.4 }), head, [0, -0.0185, 0], [Math.PI / 2, 0, 0]);
    mesh(rbox(0.16, 0.08, 0.06, 0.02), chrome, D, [-2.6, 1.1, -1.57]); mesh(new T3.CylinderGeometry(0.012, 0.012, 0.13, 8), chrome, D, [-2.55, 1.14, -1.53], [0, 0, 1.2]);
    // bath mat, vanity + basin + mirror (fog), wall light, towel hook + towel, plant
    mesh(rbox(0.62, 0.02, 0.42, 0.01), M.std('#7fb3a6', { roughness: 0.95 }), D, [-2.25, 0.012, -0.12]);
    mesh(rbox(0.82, 0.74, 0.46, 0.03), M.std('#c9a27a', { roughness: 0.6 }), D, [-1.05, 0.37, -1.35]);
    mesh(rbox(0.74, 0.07, 0.44, 0.03), M.std('#fbfbf9', { roughness: 0.25 }), D, [-1.05, 0.775, -1.35]);
    mesh(new T3.CylinderGeometry(0.012, 0.012, 0.16, 10), chrome, D, [-1.05, 0.86, -1.5]); mesh(new T3.CylinderGeometry(0.01, 0.01, 0.1, 8), chrome, D, [-1.05, 0.93, -1.46], [Math.PI / 2, 0, 0]);
    mesh(new T3.PlaneGeometry(0.7, 0.84), M.std('#c9d2db', { metalness: 1, roughness: 0.06 }), D, [-1.05, 1.58, -1.59]);
    const mirFog = mesh(new T3.PlaneGeometry(0.7, 0.84), new T3.MeshBasicMaterial({ map: fogT, transparent: true, depthWrite: false, opacity: 0.8 }), D, [-1.05, 1.58, -1.585]); mirFog.castShadow = false;
    mesh(rbox(0.5, 0.05, 0.05, 0.02), new T3.MeshBasicMaterial({ color: new T3.Color(2.2, 1.9, 1.5) }), D, [-1.05, 2.07, -1.56]);
    const wl = new T3.PointLight('#ffd7a8', 1.6, 5); wl.position.set(-1.05, 2.0, -1.2); D.add(wl);
    const showerL = new T3.PointLight('#ffe2c0', 1.2, 3.5); showerL.position.set(-2.5, 2.1, -0.8); D.add(showerL);
    mesh(new T3.CylinderGeometry(0.015, 0.015, 0.08, 8), chrome, D, [-1.75, 1.62, -1.56], [Math.PI / 2, 0, 0]);
    const towelM = M.std('#f0b84a', { roughness: 0.95 });
    const towelH = mesh(rbox(0.38, 0.62, 0.06, 0.03), towelM, D, [-1.75, 1.33, -1.53]);
    const towelF = mesh(rbox(0.38, 0.62, 0.06, 0.03), towelM, D, [0, 0, 0]); towelF.visible = false;
    const plant = (x, y, z, s) => { const g = new T3.Group(); g.position.set(x, y, z); g.scale.setScalar(s); D.add(g); mesh(new T3.CylinderGeometry(0.16, 0.12, 0.3, 16), M.std('#c86b3c'), g, [0, 0.15, 0]); [[0, 0.55, 0, 0.26], [0.13, 0.45, 0.06, 0.2], [-0.12, 0.47, -0.05, 0.19]].forEach(([a, b, c, rr]) => mesh(new T3.SphereGeometry(rr, 14, 10), M.std('#3d7a4f', { roughness: 0.8 }), g, [a, b, c])); return g; };
    plant(-0.38, 0, -1.3, 1.0);
    // ---- kitchen: window (winter morning outside), counter, kettle, fridge, clock ----
    const frameM = M.std('#f6f3ee', { roughness: 0.5 });
    [[2.15, 1.15, 0.92, 0.07], [2.15, 2.15, 0.92, 0.07], [1.7, 1.65, 0.07, 1.06], [2.6, 1.65, 0.07, 1.06], [2.15, 1.65, 0.04, 1.0]].forEach(([x, y, w, h]) => box(w, h, 0.16, frameM, [x, y, -1.67]));
    box(1.0, 0.05, 0.26, frameM, [2.15, 1.13, -1.56]);
    const sky = mesh(new T3.PlaneGeometry(9, 5), new T3.MeshBasicMaterial({ map: grad([[0, '#060a1a'], [0.55, '#121a36'], [1, '#26305a']]) }), D, [2.4, 1.7, -6.2]); sky.castShadow = false;
    for (let i = 0; i < 7; i++) { const w = 0.8 + MC.rnd(i, 1) * 0.9, h = 0.5 + MC.rnd(i, 2) * 1.0, x = -0.4 + i * 0.85 + MC.rnd(i, 3) * 0.3, z = -3.6 - MC.rnd(i, 4) * 1.6; box(w, h, 0.9, M.std('#8a7f86', { roughness: 0.9 }), [x, 0.4 + h / 2, z]); box(w + 0.06, 0.07, 0.96, M.std('#f4f7fb', { roughness: 0.9 }), [x, 0.4 + h + 0.03, z]); }
    const sunG = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, color: new T3.Color(0.5, 0.55, 0.8) })); sunG.position.set(4.2, 2.3, -6.0); sunG.scale.setScalar(3.2); D.add(sunG);
    const shaftT = grad([[0, 'rgba(255,230,190,0.0)'], [0.15, 'rgba(255,230,190,0.55)'], [1, 'rgba(255,230,190,0.0)']], 8, 128);
    const sdir = new T3.Vector3().subVectors(sun.target.position, sun.position).normalize();
    [[-0.25, 0.85], [0.18, 0.7], [0.0, 1.0]].forEach(([dx, wv], i) => {
      const p0 = new T3.Vector3(2.15 + dx, 1.65 + (i - 1) * 0.15, -1.66), L = 1.9 / -sdir.y, mid = p0.clone().addScaledVector(sdir, L / 2);
      const m = new T3.Mesh(new T3.PlaneGeometry(wv * 0.55, L), new T3.MeshBasicMaterial({ map: shaftT, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, opacity: 0.0, side: T3.DoubleSide }));
      m.position.copy(mid); m.up.copy(sdir).negate(); m.lookAt(mid.clone().add(new T3.Vector3(0, 0, 1))); D.add(m);
    });
    mesh(rbox(1.0, 0.86, 0.6, 0.03), M.std('#2f5a44', { roughness: 0.55 }), D, [2.2, 0.43, -1.3]);
    mesh(rbox(1.06, 0.05, 0.64, 0.02), M.std('#dccab0', { roughness: 0.45 }), D, [2.2, 0.885, -1.3]);
    [1.95, 2.45].forEach((x) => mesh(new T3.BoxGeometry(0.16, 0.02, 0.02), chrome, D, [x, 0.75, -0.99]));
    const kettle = new T3.Group(); kettle.position.set(2.5, 0.91, -1.32); D.add(kettle); mesh(new T3.CylinderGeometry(0.085, 0.1, 0.2, 20), M.std('#d23b30', { roughness: 0.35, metalness: 0.2 }), kettle, [0, 0.1, 0]); mesh(new T3.TorusGeometry(0.05, 0.012, 8, 16, Math.PI), M.std('#2b2b2b'), kettle, [0, 0.22, 0]);
    mesh(new T3.CylinderGeometry(0.04, 0.035, 0.09, 16), M.std('#f4f1ea'), D, [1.95, 0.955, -1.25]);
    plant(2.05, 1.155, -1.56, 0.45);
    mesh(rbox(0.64, 1.86, 0.64, 0.05), M.std('#e9edf2', { roughness: 0.3, metalness: 0.15 }), D, [3.1, 0.93, -1.25]); mesh(new T3.BoxGeometry(0.03, 0.5, 0.04), chrome, D, [2.83, 1.25, -0.92]); mesh(new T3.BoxGeometry(0.64, 0.01, 0.01), M.std('#c5ccd4'), D, [3.1, 1.32, -0.93]);
    const clock = new T3.Group(); clock.position.set(2.95, 2.18, -1.585); D.add(clock);
    mesh(new T3.CylinderGeometry(0.15, 0.15, 0.03, 32), M.std('#1d4734'), clock, [0, 0, 0], [Math.PI / 2, 0, 0]); mesh(new T3.CircleGeometry(0.13, 32), M.std('#faf6ee'), clock, [0, 0, 0.016]);
    const hand = (L, wv, c) => { const g = new T3.Group(); g.position.z = 0.02; clock.add(g); mesh(new T3.BoxGeometry(wv, L, 0.005), M.std(c), g, [0, L / 2 - 0.015, 0]); return g; };
    const hH = hand(0.07, 0.012, '#14261b'), hM = hand(0.105, 0.008, '#14261b'), hS = hand(0.11, 0.004, '#e09b6b');
    hH.rotation.z = -(7 + 10 / 60) / 12 * Math.PI * 2; hM.rotation.z = -10 / 60 * Math.PI * 2;
    // ---- X59: toilet with x-ray cistern (flapper, chain, float, fill valve), running water in the bowl ----
    mirFog.visible = false;
    const TO = new T3.Group(); TO.position.set(-1.7, 0, -1.32); D.add(TO);
    const cer = M.std('#fbfbf9', { roughness: 0.18 });
    mesh(new T3.CylinderGeometry(0.17, 0.12, 0.36, 28), cer, TO, [0, 0.18, 0]); mesh(new T3.TorusGeometry(0.16, 0.028, 10, 32), cer, TO, [0, 0.38, 0], [Math.PI / 2, 0, 0]);
    mesh(new T3.TorusGeometry(0.155, 0.022, 10, 32), M.std('#f2f0ea', { roughness: 0.3 }), TO, [0, 0.415, 0.0], [Math.PI / 2, 0, 0]);
    const bwM = new T3.MeshStandardMaterial({ color: '#6fb8ec', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.92 });
    mesh(new T3.CircleGeometry(0.125, 28), bwM, TO, [0, 0.335, 0.01], [-Math.PI / 2, 0, 0]).castShadow = false;
    const ripM = new T3.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false });
    const rips = [0, 1, 2].map(() => { const m = mesh(new T3.TorusGeometry(1, 0.06, 6, 32), ripM.clone(), TO, [0, 0.337, -0.04], [Math.PI / 2, 0, 0]); m.castShadow = false; return m; });
    const strM = new T3.MeshStandardMaterial({ color: '#e6f4ff', transparent: true, opacity: 0, roughness: 0.05, emissive: new T3.Color('#ffffff'), emissiveIntensity: 0.3, side: T3.DoubleSide });
    const sheet = mesh(new T3.PlaneGeometry(0.06, 0.09), strM, TO, [0, 0.37, -0.115], [-0.5, 0, 0]); sheet.castShadow = false;
    // cistern (x-ray capable) + lid + button
    const ciM = M.std('#fbfbf9', { roughness: 0.2 }); ciM.transparent = true;
    const cist = mesh(rbox(0.4, 0.36, 0.16, 0.02), ciM, TO, [0, 0.68, -0.2]); cist.renderOrder = 3;
    const lid = new T3.Group(); TO.add(lid); mesh(rbox(0.42, 0.03, 0.18, 0.012), cer, lid, [0, 0, 0]); mesh(new T3.CylinderGeometry(0.03, 0.03, 0.012, 20), chrome, lid, [0, 0.02, 0]);
    const LID0 = new T3.Vector3(0, 0.875, -0.2), LID1 = new T3.Vector3(0.36, 0.95, 0.05);
    const inner = new T3.Group(); TO.add(inner);
    const cwM = new T3.MeshStandardMaterial({ color: '#4aa3e6', transparent: true, opacity: 0, roughness: 0.1, depthWrite: false });
    const cw = mesh(new T3.BoxGeometry(0.36, 1, 0.13), cwM, inner, [0, 0.6, -0.2]); cw.castShadow = false;
    const partM = (c) => { const m = M.std(c, { roughness: 0.4 }); m.transparent = true; return m; };
    const pFl = partM('#f08a2c'), pTb = partM('#dfe3e8'), pFp = partM('#b8322a'), pCh = partM('#9aa3ad');
    const floatG = new T3.Group(); floatG.position.set(0.13, 0.7, -0.2); inner.add(floatG); mesh(new T3.SphereGeometry(0.035, 16, 12), pFl, floatG, [-0.09, 0, 0]); mesh(new T3.BoxGeometry(0.09, 0.008, 0.008), pTb, floatG, [-0.045, 0, 0]);
    mesh(new T3.CylinderGeometry(0.012, 0.012, 0.3, 10), pTb, inner, [0.13, 0.67, -0.2]); mesh(new T3.CylinderGeometry(0.014, 0.014, 0.24, 10), pTb, inner, [-0.12, 0.64, -0.2]);
    const flap = new T3.Group(); flap.position.set(0, 0.52, -0.25); inner.add(flap); mesh(new T3.CylinderGeometry(0.045, 0.045, 0.014, 20), pFp, flap, [0, 0, 0.05]);
    mesh(new T3.BoxGeometry(0.14, 0.01, 0.01), pTb, inner, [-0.02, 0.82, -0.2]);
    const links = [...Array(9)].map(() => mesh(new T3.TorusGeometry(0.007, 0.0025, 6, 10), pCh, inner, [0, 0, 0]));
    const leakM = new T3.MeshBasicMaterial({ color: new T3.Color(1.2, 1.6, 2.0), transparent: true, opacity: 0, depthWrite: false });
    const leak = [...Array(12)].map((_, i) => mesh(new T3.SphereGeometry(0.006, 8, 6), leakM, inner, [0, -5, 0]));
    const brkM = new T3.MeshBasicMaterial({ color: new T3.Color(0.5, 2.2, 0.8), transparent: true, opacity: 0, depthWrite: false });
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sy]) => { const g = new T3.Group(); g.position.set(sx * 0.07, 0.53 + sy * 0.05, -0.11); TO.add(g); mesh(new T3.BoxGeometry(0.03, 0.004, 0.002), brkM, g, [-sx * 0.015, 0, 0]); mesh(new T3.BoxGeometry(0.004, 0.03, 0.002), brkM, g, [0, -sy * 0.015, 0]); });
    // ---- tenant (pyjamas) + phone ----
    const TN = k.fig(D, '#e8b98f', -1.12, 0, -0.8, 0.95, '#7a3b1e');
    const pjM = M.std('#8fb6e0', { roughness: 0.9 }); mesh(new T3.CylinderGeometry(0.218, 0.24, 0.62, 24, 1, true), pjM, TN.userData.B, [0, 0.45, 0]); mesh(new T3.TorusGeometry(0.2, 0.03, 8, 24), pjM, TN.userData.B, [0, 0.76, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const P0 = new T3.Vector3(-1.12, 0, -0.8), P1 = new T3.Vector3(-1.32, 0, -0.98);
    const vTN = (t) => P0.clone().lerp(P1, E.io(seg(t, K.lid - 0.55, 0.4)) * (1 - E.io(seg(t, K.stop + 0.4, 0.4))));
    // ---- state ----
    const running = (t) => t < K.stop + 0.1 ? 1 : Math.max(0, 1 - (t - K.stop - 0.1) / 0.5);
    const xray = (t) => E.io(seg(t, K.flap - 0.1, 0.3)) * (1 - E.io(seg(t, K.no - 0.3, 0.3)));
    const flapOpen = (t) => 0.38 * (1 - antMove(t, K.chain + 0.15, 0.25, 0, 1, 1.3));
    const lidUp = (t) => antMove(t, K.lid - 0.05, 0.35, 0, 1, 1.2) * (1 - E.io(seg(t, K.no - 0.1, 0.35)));
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.15, 1.6, 1.05, -1.7, 0.45, -1.3, 28)],
      [K.run - 0.05, P(0.12, 1.15, 0.95, -1.7, 0.4, -1.28, 24), E.io],
      [K.run + 0.45, PT(0.2, 2.3, 1.3, 1.05, 21, 0.03), A9],
      [K.write - 0.3, PT(0.2, 2.4, 1.28, 1.03, 22), E.lin],
      [K.write + 0.2, PT(0.3, 1.7, 1.42, 1.0, 26), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 0.1, 1.15, -0.55), A6],
      [K.flap - 0.3, P(0.0, 9.2, 2.6, 0.1, 1.15, -0.55), E.lin],
      [K.flap + 0.15, P(-0.2, 1.45, 0.98, -1.7, 0.66, -1.5, 26), A9],
      [K.chain - 0.1, P(-0.22, 1.25, 0.92, -1.7, 0.62, -1.5, 24), E.io],
      [K.chain + 0.5, P(-0.25, 1.1, 0.88, -1.7, 0.6, -1.5, 24), E.lin],
      [K.stop + 0.05, P(0.12, 1.4, 1.05, -1.7, 0.42, -1.3, 26), A6],
      [K.no + 0.35, P(0.3, 3.0, 1.5, -1.45, 0.9, -1.0), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3(), A = new T3.Vector3(), B = new T3.Vector3();
    k.frame((t) => {
      const run = running(t), xr = xray(t), fo = flapOpen(t), fixed = E.io(seg(t, K.chain + 0.1, 0.3));
      const g = k.grade; g.temp = -0.3 + 0.35 * E.io(seg(t, K.stop, 0.6)); g.th = 1.6; g.bloom = 0.35; g.vig = 0.4; g.exp = 0.9; g.sat = 1.0;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      // bowl: ripples + trickle sheet while running
      rips.forEach((m, i) => { const a = ((t * 0.9 + i / 3) % 1); m.scale.setScalar(0.02 + a * 0.09); m.material.opacity = 0.85 * run * (1 - a); });
      strM.opacity = 0.55 * run * (0.8 + 0.2 * Math.sin(t * 30));
      // cistern x-ray: shell fades, parts appear; flapper held open by the short chain → leak → chain slack → seals
      ciM.opacity = 1 - 0.78 * xr; cist.material.depthWrite = xr < 0.5;
      [pFl, pTb, pFp, pCh].forEach((m) => { m.opacity = xr; }); inner.visible = xr > 0.02;
      const lvl = 0.62 + 0.14 * E.io(seg(t, K.chain + 0.3, 0.8)); cwM.opacity = 0.35 * xr; cw.scale.y = (lvl - 0.51) ; cw.position.y = 0.51 + (lvl - 0.51) / 2;
      floatG.rotation.z = -0.25 + 0.25 * E.io(seg(t, K.chain + 0.3, 0.8)); floatG.position.y = lvl - 0.02;
      flap.rotation.x = -fo;
      A.set(0.05, 0.815, -0.2); B.set(0, 0.52 + Math.sin(fo) * 0.1, -0.25 + Math.cos(fo) * 0.09);
      links.forEach((m, i) => { const u = i / (links.length - 1); m.position.lerpVectors(A, B, u); m.position.z += Math.sin(u * Math.PI) * 0.035 * fixed; m.position.y -= Math.sin(u * Math.PI) * 0.03 * fixed; m.rotation.set(i % 2 ? Math.PI / 2 : 0, 0, 0); });
      leakM.opacity = xr * Math.min(1, fo * 4);
      leak.forEach((m, i) => { const a = ((t * 1.6 + i / leak.length) % 1); m.position.set((MC.rnd(i, 1) - 0.5) * 0.06, 0.51 - a * 0.12, -0.2 + a * 0.08); });
      brkM.opacity = E.io(seg(t, K.flap + 0.2, 0.2)) * (1 - E.io(seg(t, K.chain + 0.3, 0.25)));
      const lu = lidUp(t); lid.position.copy(LID0).lerp(LID1, lu); lid.rotation.z = -0.5 * lu;
      // tenant: sleepy at the toilet → annoyed → phone → steps in, lifts lid, fixes chain → relief → yawn
      const annoy = E.io(seg(t, K.run, 0.1)) * (1 - E.io(seg(t, K.run + 0.9, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.flap - 0.5, 0.25)));
      const lift = antMove(t, K.lid - 0.15, 0.3, 0, 1, 1.2) * (1 - E.io(seg(t, K.lid + 0.4, 0.25)));
      const reach = antMove(t, K.chain - 0.2, 0.25, 0, 1, 1.2) * (1 - E.io(seg(t, K.chain + 0.5, 0.25)));
      const joy = MC.spring(t, K.stop + 0.15, 2.4, 0.35) * (1 - E.io(seg(t, K.no, 0.3)));
      const yawn = E.io(seg(t, K.no + 0.2, 0.3));
      const face = t < K.run + 0.05 ? -2.3 : lerp(lerp(-2.3, 0.15, antMove(t, K.run + 0.05, 0.25, 0, 1, 1.2)), -2.45, E.io(seg(t, K.flap - 0.5, 0.3))) + (t > K.stop + 0.3 ? lerp(0, 2.6, E.io(seg(t, K.stop + 0.3, 0.35))) : 0);
      k.drive(TN, t, vTN, {
        face, squash: -0.08 * Math.exp(-Math.pow((t - (K.run + 0.12)) / 0.07, 2)), nod: 0.25 * phoneUp + 0.15 * reach - 0.1 * yawn,
        lean: 0.25 * reach - 0.1 * joy,
        armL: joy > 0.02 ? -0.4 - 2.2 * joy : (t < K.run ? -2.2 + 0.15 * Math.sin(t * 6) : -0.2 - 1.9 * lift - 1.2 * reach - 2.4 * yawn),
        armR: joy > 0.02 ? -0.4 - 2.2 * joy : -0.25 - 1.2 * phoneUp - 1.9 * lift - 1.0 * reach,
        armLz: t < K.run ? 0.6 : 0,
      });
      k.face(TN, t, { wide: 0.5 * annoy, o: 0.3 * annoy + 0.9 * yawn, smile: joy > 0.1 ? 1 : 0.1, closed: (t < K.run ? 0.55 : 0) + 0.9 * yawn });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.flap - 0.45); k.popOut(m2, K.flap - 0.39);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.flap - 0.3);
    cd.line(0, K.flap + 0.2); cd.line(1, K.chain + 0.3); cd.line(2, K.stop + 0.15);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const lit = ov('tdtag warn', ''); k.popIn(lit, 0.6, { y: 30 }); k.popOut(lit, K.write - 0.3, { y: -40 });
    const eT = ov('tdtag warn', S.err); k.popIn(eT, K.flap + 0.25, { y: 30 }); k.popOut(eT, K.lid - 0.1, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.lid - 0.05, { y: 30 }); k.popOut(s1, K.chain - 0.12, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.chain - 0.05, { y: 30 }); k.popOut(s2, K.stop + 0.4, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      const n = Math.round(Math.min(t, K.stop) * 23); const lbl = `💧 ${n} ${S.lit}`; if (lit.textContent !== lbl) lit.textContent = lbl;
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(lit, new T3.Vector3(-1.7, 0.95, -1.3), 240, 840, -40); at(eT, new T3.Vector3(-1.7, 0.95, -1.4), 240, 840, -50); at(s1, new T3.Vector3(-1.7, 0.95, -1.4), 240, 840, -50); at(s2, new T3.Vector3(-1.7, 0.95, -1.4), 240, 840, -50); at(okT, new T3.Vector3(-1.5, 2.0, -1.0));
    });
    sfx('flow', 0, -14, { dur: K.stop + 0.2 }); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12); sfx('refresh', K.flap, -14);
    sfx('thud', K.lid + 0.25, -12); sfx('keys', K.chain - 0.05, -12); sfx('click', K.chain + 0.22, -8); sfx('chime', K.stop + 0.1, -16); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
  function X60() {
    const de = lang === 'de';
    const S = de ? { chip: '🕗 8:05 · Whg 2A', who: 'Mieterin · Whg 2A', m1: 'Gerade ist eine Maus durch die Küche gerannt 😱', m2: 'Foto geprüft. Kammerjäger morgen um 9:00 gebucht, die Lücke wird abgedichtet ✓', ttl: 'Maus in der Küche · Whg 2A', l1: '📸 Foto geprüft: Mäusekot', l2: '📅 Kammerjäger: morgen 9:00', l3: '🔧 Lücke hinter dem Kühlschrank zu', cal: '📅 Morgen 9:00 · Kammerjäger', gap: '⚠️ Lücke hinter dem Kühlschrank', sealed: '✓ Lücke abgedichtet', ok: '🏠 Vermieter informiert ✓', end: ['Mit *einer Nachricht* erledigt.', null] }
      : { chip: '🕗 8:05 am · Apt 2A', who: 'Tenant · Apt 2A', m1: 'A mouse just ran through the kitchen 😱', m2: 'Photo checked. Pest control booked for tomorrow at 9:00, the gap gets sealed ✓', ttl: 'Mouse in the kitchen · Apt 2A', l1: '📸 Photo checked: mouse droppings', l2: '📅 Pest control: tomorrow 9:00', l3: '🔧 Gap behind the fridge sealed', cal: '📅 Tomorrow 9:00 · Pest control', gap: '⚠️ Gap behind the fridge', sealed: '✓ Gap sealed', ok: '🏠 Landlord informed ✓', end: ['Sorted *in one message*.', null] };
    const K = {};
    K.write = W(['schreibt', 'writes']).start;
    const it = W(['Tenance']); K.turn = it.start; K.ans = W(['antwortet', 'answers'], it.i).start;
    K.photo = W(['Foto', 'photo'], it.i).start; K.pest = W(['Kammerjäger', 'pest'], it.i).start; K.nine = W(['neun', 'nine'], it.i).start; K.gap = W(['Lücke', 'gap'], it.i).start; K.seal = W(['abgedichtet', 'sealed'], it.i).start;
    K.land = W(['Vermieter', 'Landlord'], it.i).start; K.cta = W(['Jetzt', 'Join'], it.i).start;
    const k = TDX({ sky: 'night', envTop: '#fff3e2', envBot: '#2d2a26', envInt: 0.75, fov: 30, pro: true });
    const { scene, MC, ov } = k;
    const SH = (window.PR || 1) >= 2 ? 4096 : 2048;
    scene.add(new T3.HemisphereLight('#fff3e6', '#3a3430', 0.32));
    const shadowed = (l, b = 6) => { l.castShadow = true; l.shadow.mapSize.set(SH, SH); Object.assign(l.shadow.camera, { left: -b, right: b, top: b, bottom: -b, near: 0.5, far: 40 }); l.shadow.radius = 3; l.shadow.bias = -0.0004; l.shadow.normalBias = 0.02; };
    const sun = new T3.DirectionalLight('#ffd6a0', 2.0); sun.position.set(6.5, 5.5, -7.5); sun.target.position.set(1.4, 0, 0); scene.add(sun.target); shadowed(sun); scene.add(sun);
    const keyL = new T3.DirectionalLight('#fff4ea', 0.7); keyL.position.set(-3.5, 6.5, 6.5); shadowed(keyL); scene.add(keyL);
    const fill = new T3.DirectionalLight('#d4e2ff', 0.3); fill.position.set(3, 2, 9); scene.add(fill);
    const D = new T3.Group(); scene.add(D);
    // ---- canvas textures ----
    const cvs = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 8; return t; };
    const tiles = (nx, ny, base, grout, jit) => cvs(512, 512, (x, w, h) => { x.fillStyle = grout; x.fillRect(0, 0, w, h); const tw = w / nx, th = h / ny; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const v = (MC.rnd(i * 31 + j, 3) - 0.5) * jit; const c = new T3.Color(base); c.offsetHSL(0, 0, v); x.fillStyle = '#' + c.getHexString(); x.fillRect(i * tw + 2, j * th + 2, tw - 4, th - 4); x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(i * tw + 3, j * th + 3, tw - 6, 3); } });
    const wood = cvs(512, 512, (x, w, h) => { for (let i = 0; i < 8; i++) { const c = new T3.Color('#b98a5e'); c.offsetHSL(0, 0, (MC.rnd(i, 7) - 0.5) * 0.08); x.fillStyle = '#' + c.getHexString(); x.fillRect(0, i * 64, w, 64); x.strokeStyle = 'rgba(60,35,20,0.35)'; x.lineWidth = 2; x.strokeRect(-2, i * 64, w + 4, 64); for (let g = 0; g < 9; g++) { x.strokeStyle = 'rgba(90,55,30,0.18)'; x.beginPath(); const y0 = i * 64 + 6 + MC.rnd(i * 9 + g, 2) * 52; x.moveTo(0, y0); x.bezierCurveTo(w * 0.3, y0 + 4, w * 0.6, y0 - 4, w, y0 + 2); x.stroke(); } } });
    const wallTile = tiles(10, 12, '#9fbdb2', '#7e968d', 0.05), floorTile = tiles(6, 6, '#4f5f66', '#36434a', 0.06);
    [wallTile, floorTile, wood].forEach((t) => { t.wrapS = t.wrapT = T3.RepeatWrapping; });
    const cloud = cvs(128, 128, (x) => { for (let i = 0; i < 7; i++) { const cx = 40 + MC.rnd(i, 1) * 48, cy = 40 + MC.rnd(i, 2) * 48, rr = 22 + MC.rnd(i, 3) * 26; const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); } });
    const frostT = cvs(512, 512, (x, w, h) => { x.fillStyle = 'rgba(235,245,255,0.16)'; x.fillRect(0, 0, w, h); x.lineCap = 'round'; for (let i = 0; i < 340; i++) { let px = MC.rnd(i, 1) * w, py = MC.rnd(i, 2) * h, an = MC.rnd(i, 3) * 6.28; x.strokeStyle = `rgba(255,255,255,${0.25 + MC.rnd(i, 4) * 0.5})`; x.lineWidth = 0.8 + MC.rnd(i, 5) * 1.6; x.beginPath(); x.moveTo(px, py); for (let s = 0; s < 7; s++) { an += (MC.rnd(i * 7 + s, 6) - 0.5) * 1.1; const L = 6 + MC.rnd(i * 7 + s, 7) * 18; px += Math.cos(an) * L; py += Math.sin(an) * L; x.lineTo(px, py); if (s % 2) { x.moveTo(px, py); x.lineTo(px + Math.cos(an + 1) * L * 0.5, py + Math.sin(an + 1) * L * 0.5); x.moveTo(px, py); } } x.stroke(); } });
    const fogT = cvs(256, 256, (x, w, h) => { x.fillStyle = 'rgba(232,240,248,0.7)'; x.fillRect(0, 0, w, h); for (let i = 0; i < 600; i++) { x.fillStyle = `rgba(255,255,255,${0.15 + MC.rnd(i, 2) * 0.3})`; x.beginPath(); x.arc(MC.rnd(i, 3) * w, MC.rnd(i, 4) * h, 1 + MC.rnd(i, 1) * 3, 0, 7); x.fill(); } });
    const grad = (stops, w = 8, h = 256) => cvs(w, h, (x) => { const g = x.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); });
    // ---- studio backdrop + base ----
    const bg = new T3.Mesh(new T3.SphereGeometry(40, 32, 16), new T3.MeshBasicMaterial({ map: grad([[0, '#0d1018'], [0.42, '#1d1c26'], [0.52, '#2b2730'], [1, '#121219']]), side: T3.BackSide, depthWrite: false })); scene.add(bg);
    mesh(rbox(7.2, 0.32, 3.7, 0.06), M.std('#26262e', { roughness: 0.85 }), D, [0.12, -0.16, -0.15]);
    // floors
    const fl = (tex, rep, x0, x1) => { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(...rep); t.wrapS = t.wrapT = T3.RepeatWrapping; return mesh(new T3.PlaneGeometry(x1 - x0, 3.3), M.std('#ffffff', { map: t, roughness: 0.55 }), D, [(x0 + x1) / 2, 0.002, -0.05], [-Math.PI / 2, 0, 0]); };
    fl(floorTile, [3, 3], -3.25, 0); const wf = fl(wood, [2.5, 3], 0, 3.45); wf.material.roughness = 0.62;
    // walls (cutaway: back + left + partition + right), tiles in the bathroom
    const wallM = M.std('#efe3d0', { roughness: 0.92 }), trimM = M.std('#f7f3ec', { roughness: 0.6 });
    const box = (w, h, d, mat, pos) => mesh(new T3.BoxGeometry(w, h, d), mat, D, pos);
    box(3.3, 2.65, 0.14, wallM, [-1.6, 1.325, -1.67]);                                                            // bathroom back
    box(1.7, 2.65, 0.14, wallM, [0.85, 1.325, -1.67]); box(0.85, 2.65, 0.14, wallM, [3.03, 1.325, -1.67]);       // kitchen back (window 1.7..2.6)
    box(0.9, 1.15, 0.14, wallM, [2.15, 0.575, -1.67]); box(0.9, 0.5, 0.14, wallM, [2.15, 2.4, -1.67]);
    box(0.14, 2.65, 3.3, wallM, [-3.32, 1.325, -0.05]);                                                            // left
    box(0.1, 2.65, 0.55, wallM, [0, 1.325, -1.325]);                                                                  // partition
    box(0.12, 2.65, 2.0, wallM, [3.51, 1.325, -0.65]);                                                             // right
    [[-1.6, -1.67, 3.4, 0.2], [1.8, -1.67, 3.6, 0.2]].forEach(([x, z, w, d]) => box(w, 0.07, d, trimM, [x, 2.68, z]));
    box(0.2, 0.07, 3.35, trimM, [-3.32, 2.68, -0.05]); box(0.14, 0.07, 0.59, trimM, [0, 2.68, -1.325]); box(0.16, 0.07, 2.04, trimM, [3.51, 2.68, -0.65]);
    const tw = (w, h, pos, rot, rep) => { const t = wallTile.clone(); t.needsUpdate = true; t.repeat.set(...rep); return mesh(new T3.PlaneGeometry(w, h), M.std('#ffffff', { map: t, roughness: 0.25, metalness: 0.0 }), D, pos, rot); };
    tw(3.25, 2.6, [-1.62, 1.3, -1.598], [0, 0, 0], [3.2, 2.6]); tw(3.3, 2.6, [-3.248, 1.3, -0.05], [0, Math.PI / 2, 0], [3.2, 2.6]);
    box(3.4, 0.09, 0.02, M.std('#e8dccb'), [1.75, 0.045, -1.595]);                                                 // skirting (kitchen)
    // ---- shower: tray, glass (with frost), chrome head + riser, mixer ----
    const chrome = M.std('#e8ecf0', { metalness: 1, roughness: 0.12 });
    mesh(rbox(1.2, 0.09, 1.08, 0.03), M.std('#f8f8f6', { roughness: 0.3 }), D, [-2.66, 0.045, -1.06]);
    mesh(new T3.CircleGeometry(0.05, 20), chrome, D, [-2.66, 0.092, -1.0], [-Math.PI / 2, 0, 0]);
    const glassM = new T3.MeshPhysicalMaterial({ color: '#e6f4ff', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, side: T3.DoubleSide, envMapIntensity: 1.6, clearcoat: 1 });
    const frostM = () => new T3.ShaderMaterial({ uniforms: { tF: { value: frostT }, uG: { value: 0 }, uM: { value: 0 } }, transparent: true, depthWrite: false, side: T3.DoubleSide,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D tF; uniform float uG, uM; varying vec2 vUv; void main(){ vec4 f = texture2D(tF, vUv); float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)) * 2.0; float a = f.a * smoothstep(uG, uG - 0.22, e) * (1.0 - uM); gl_FragColor = vec4(vec3(0.92, 0.97, 1.0) * 1.5, a * 0.95); }' });
    const panes = [[1.17, 2.0, [-2.03, 1.09, -0.98], [0, Math.PI / 2, 0]]].map(([w, h, pos, rot]) => {
      mesh(new T3.PlaneGeometry(w, h), glassM, D, pos, rot).castShadow = false;
      const fm = frostM(); const f = mesh(new T3.PlaneGeometry(w, h), fm, D, pos, rot); f.castShadow = false; f.renderOrder = 2;
      const g = new T3.Group(); g.position.set(...pos); g.rotation.set(...rot); D.add(g); [[0, h / 2], [0, -h / 2]].forEach(([dx, dy]) => mesh(new T3.BoxGeometry(w, 0.025, 0.025), chrome, g, [dx, dy, 0])); [[-w / 2], [w / 2]].forEach(([dx]) => mesh(new T3.BoxGeometry(0.025, h, 0.025), chrome, g, [dx, 0, 0]));
      return fm;
    });
    mesh(new T3.CylinderGeometry(0.018, 0.018, 1.0, 12), chrome, D, [-2.6, 1.6, -1.575]);                           // riser
    mesh(new T3.CylinderGeometry(0.016, 0.016, 0.34, 12), chrome, D, [-2.6, 2.08, -1.42], [Math.PI / 2, 0, 0]);       // arm
    const head = new T3.Group(); head.position.set(-2.6, 2.06, -1.24); head.rotation.x = 0.45; D.add(head);
    mesh(new T3.CylinderGeometry(0.12, 0.09, 0.035, 28), chrome, head, [0, 0, 0]);
    mesh(new T3.CircleGeometry(0.105, 28), M.std('#9aa3ad', { metalness: 0.8, roughness: 0.4 }), head, [0, -0.0185, 0], [Math.PI / 2, 0, 0]);
    mesh(rbox(0.16, 0.08, 0.06, 0.02), chrome, D, [-2.6, 1.1, -1.57]); mesh(new T3.CylinderGeometry(0.012, 0.012, 0.13, 8), chrome, D, [-2.55, 1.14, -1.53], [0, 0, 1.2]);
    // bath mat, vanity + basin + mirror (fog), wall light, towel hook + towel, plant
    mesh(rbox(0.62, 0.02, 0.42, 0.01), M.std('#7fb3a6', { roughness: 0.95 }), D, [-2.25, 0.012, -0.12]);
    mesh(rbox(0.82, 0.74, 0.46, 0.03), M.std('#c9a27a', { roughness: 0.6 }), D, [-1.05, 0.37, -1.35]);
    mesh(rbox(0.74, 0.07, 0.44, 0.03), M.std('#fbfbf9', { roughness: 0.25 }), D, [-1.05, 0.775, -1.35]);
    mesh(new T3.CylinderGeometry(0.012, 0.012, 0.16, 10), chrome, D, [-1.05, 0.86, -1.5]); mesh(new T3.CylinderGeometry(0.01, 0.01, 0.1, 8), chrome, D, [-1.05, 0.93, -1.46], [Math.PI / 2, 0, 0]);
    mesh(new T3.PlaneGeometry(0.7, 0.84), M.std('#c9d2db', { metalness: 1, roughness: 0.06 }), D, [-1.05, 1.58, -1.59]);
    const mirFog = mesh(new T3.PlaneGeometry(0.7, 0.84), new T3.MeshBasicMaterial({ map: fogT, transparent: true, depthWrite: false, opacity: 0.8 }), D, [-1.05, 1.58, -1.585]); mirFog.castShadow = false;
    mesh(rbox(0.5, 0.05, 0.05, 0.02), new T3.MeshBasicMaterial({ color: new T3.Color(2.2, 1.9, 1.5) }), D, [-1.05, 2.07, -1.56]);
    const wl = new T3.PointLight('#ffd7a8', 1.6, 5); wl.position.set(-1.05, 2.0, -1.2); D.add(wl);
    const showerL = new T3.PointLight('#ffe2c0', 1.2, 3.5); showerL.position.set(-2.5, 2.1, -0.8); D.add(showerL);
    mesh(new T3.CylinderGeometry(0.015, 0.015, 0.08, 8), chrome, D, [-1.75, 1.62, -1.56], [Math.PI / 2, 0, 0]);
    const towelM = M.std('#f0b84a', { roughness: 0.95 });
    const towelH = mesh(rbox(0.38, 0.62, 0.06, 0.03), towelM, D, [-1.75, 1.33, -1.53]);
    const towelF = mesh(rbox(0.38, 0.62, 0.06, 0.03), towelM, D, [0, 0, 0]); towelF.visible = false;
    const plant = (x, y, z, s) => { const g = new T3.Group(); g.position.set(x, y, z); g.scale.setScalar(s); D.add(g); mesh(new T3.CylinderGeometry(0.16, 0.12, 0.3, 16), M.std('#c86b3c'), g, [0, 0.15, 0]); [[0, 0.55, 0, 0.26], [0.13, 0.45, 0.06, 0.2], [-0.12, 0.47, -0.05, 0.19]].forEach(([a, b, c, rr]) => mesh(new T3.SphereGeometry(rr, 14, 10), M.std('#3d7a4f', { roughness: 0.8 }), g, [a, b, c])); return g; };
    plant(-0.38, 0, -1.3, 1.0);
    // ---- kitchen: window (winter morning outside), counter, kettle, fridge, clock ----
    const frameM = M.std('#f6f3ee', { roughness: 0.5 });
    [[2.15, 1.15, 0.92, 0.07], [2.15, 2.15, 0.92, 0.07], [1.7, 1.65, 0.07, 1.06], [2.6, 1.65, 0.07, 1.06], [2.15, 1.65, 0.04, 1.0]].forEach(([x, y, w, h]) => box(w, h, 0.16, frameM, [x, y, -1.67]));
    box(1.0, 0.05, 0.26, frameM, [2.15, 1.13, -1.56]);
    const sky = mesh(new T3.PlaneGeometry(9, 5), new T3.MeshBasicMaterial({ map: grad([[0, '#8fb6e0'], [0.55, '#d9d6dc'], [1, '#f6c79a']]) }), D, [2.4, 1.7, -6.2]); sky.castShadow = false;
    for (let i = 0; i < 7; i++) { const w = 0.8 + MC.rnd(i, 1) * 0.9, h = 0.5 + MC.rnd(i, 2) * 1.0, x = -0.4 + i * 0.85 + MC.rnd(i, 3) * 0.3, z = -3.6 - MC.rnd(i, 4) * 1.6; box(w, h, 0.9, M.std('#8a7f86', { roughness: 0.9 }), [x, 0.4 + h / 2, z]); box(w + 0.06, 0.07, 0.96, M.std('#f4f7fb', { roughness: 0.9 }), [x, 0.4 + h + 0.03, z]); }
    const sunG = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, color: new T3.Color(1.6, 1.2, 0.8) })); sunG.position.set(4.2, 2.3, -6.0); sunG.scale.setScalar(3.2); D.add(sunG);
    const shaftT = grad([[0, 'rgba(255,230,190,0.0)'], [0.15, 'rgba(255,230,190,0.55)'], [1, 'rgba(255,230,190,0.0)']], 8, 128);
    const sdir = new T3.Vector3().subVectors(sun.target.position, sun.position).normalize();
    [[-0.25, 0.85], [0.18, 0.7], [0.0, 1.0]].forEach(([dx, wv], i) => {
      const p0 = new T3.Vector3(2.15 + dx, 1.65 + (i - 1) * 0.15, -1.66), L = 1.9 / -sdir.y, mid = p0.clone().addScaledVector(sdir, L / 2);
      const m = new T3.Mesh(new T3.PlaneGeometry(wv * 0.55, L), new T3.MeshBasicMaterial({ map: shaftT, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, opacity: 0.12, side: T3.DoubleSide }));
      m.position.copy(mid); m.up.copy(sdir).negate(); m.lookAt(mid.clone().add(new T3.Vector3(0, 0, 1))); D.add(m);
    });
    mesh(rbox(1.0, 0.86, 0.6, 0.03), M.std('#2f5a44', { roughness: 0.55 }), D, [2.2, 0.43, -1.3]);
    mesh(rbox(1.06, 0.05, 0.64, 0.02), M.std('#dccab0', { roughness: 0.45 }), D, [2.2, 0.885, -1.3]);
    [1.95, 2.45].forEach((x) => mesh(new T3.BoxGeometry(0.16, 0.02, 0.02), chrome, D, [x, 0.75, -0.99]));
    const kettle = new T3.Group(); kettle.position.set(2.5, 0.91, -1.32); D.add(kettle); mesh(new T3.CylinderGeometry(0.085, 0.1, 0.2, 20), M.std('#d23b30', { roughness: 0.35, metalness: 0.2 }), kettle, [0, 0.1, 0]); mesh(new T3.TorusGeometry(0.05, 0.012, 8, 16, Math.PI), M.std('#2b2b2b'), kettle, [0, 0.22, 0]);
    mesh(new T3.CylinderGeometry(0.04, 0.035, 0.09, 16), M.std('#f4f1ea'), D, [1.95, 0.955, -1.25]);
    plant(2.05, 1.155, -1.56, 0.45);
    const fridgeM = M.std('#e9edf2', { roughness: 0.3, metalness: 0.15 }); mesh(rbox(0.64, 1.86, 0.64, 0.05), fridgeM, D, [3.1, 0.93, -1.25]); mesh(new T3.BoxGeometry(0.03, 0.5, 0.04), chrome, D, [2.83, 1.25, -0.92]); mesh(new T3.BoxGeometry(0.64, 0.01, 0.01), M.std('#c5ccd4'), D, [3.1, 1.32, -0.93]);
    const clock = new T3.Group(); clock.position.set(2.95, 2.18, -1.585); D.add(clock);
    mesh(new T3.CylinderGeometry(0.15, 0.15, 0.03, 32), M.std('#1d4734'), clock, [0, 0, 0], [Math.PI / 2, 0, 0]); mesh(new T3.CircleGeometry(0.13, 32), M.std('#faf6ee'), clock, [0, 0, 0.016]);
    const hand = (L, wv, c) => { const g = new T3.Group(); g.position.z = 0.02; clock.add(g); mesh(new T3.BoxGeometry(wv, L, 0.005), M.std(c), g, [0, L / 2 - 0.015, 0]); return g; };
    const hH = hand(0.07, 0.012, '#14261b'), hM = hand(0.105, 0.008, '#14261b'), hS = hand(0.11, 0.004, '#e09b6b');
    hH.rotation.z = -(7 + 10 / 60) / 12 * Math.PI * 2; hM.rotation.z = -10 / 60 * Math.PI * 2;
    // ---- X60: mouse, droppings, chair, x-ray fridge with a gap in the skirting that gets sealed ----
    mirFog.visible = false;
    fridgeM.transparent = true;
    const mouse = new T3.Group(); D.add(mouse); const mB = new T3.Group(); mouse.add(mB);
    const furM = M.std('#8a8f99', { roughness: 0.85 }), pinkM = M.std('#e8a3a3', { roughness: 0.6 });
    mesh(new T3.SphereGeometry(1, 16, 12), furM, mB, [0, 0.045, 0]).scale.set(0.05, 0.042, 0.085);
    mesh(new T3.SphereGeometry(0.034, 14, 10), furM, mB, [0, 0.06, 0.08]); mesh(new T3.SphereGeometry(0.008, 8, 6), pinkM, mB, [0, 0.058, 0.115]);
    [-1, 1].forEach((sx) => { mesh(new T3.CircleGeometry(0.022, 16), pinkM, mB, [sx * 0.026, 0.095, 0.07], [0, sx * 0.4, 0]); mesh(new T3.SphereGeometry(0.0055, 8, 6), M.std('#111'), mB, [sx * 0.017, 0.07, 0.105]); });
    const tail = mesh(new T3.TubeGeometry(new T3.CatmullRomCurve3([[0, 0.04, -0.08], [0.02, 0.03, -0.15], [-0.03, 0.025, -0.21], [0.01, 0.03, -0.26]].map((p) => new T3.Vector3(...p))), 20, 0.004, 6), pinkM, mB, [0, 0, 0]);
    const GAP = new T3.Vector3(2.73, 0, -1.3), RUN1 = new T3.Vector3(2.45, 0, -0.75), RUN2 = new T3.Vector3(1.95, 0, -0.5), STOP = new T3.Vector3(1.55, 0, -0.42);
    const mpath = new T3.CatmullRomCurve3([GAP, RUN1, RUN2, STOP]);
    const tR0 = 0.15, tR1 = 1.2, tR2 = K.write - 0.55, tR3 = tR2 + 0.55;
    const mp = (t) => t < tR0 ? GAP.clone() : (t < tR1 ? mpath.getPointAt(E.io(seg(t, tR0, tR1 - tR0))) : (t < tR2 ? STOP.clone() : mpath.getPointAt(1 - E.ic(seg(t, tR2, tR3 - tR2)))));
    [[2.62, -1.02], [2.66, -0.98], [2.58, -0.95], [2.7, -1.06], [2.64, -0.91]].forEach(([x, z], i) => mesh(new T3.SphereGeometry(1, 8, 6), M.std('#2a2018'), D, [x, 0.006, z]).scale.set(0.006, 0.005, 0.012));
    // chair
    const woodM = M.std('#b98a5e', { roughness: 0.6 });
    mesh(rbox(0.42, 0.04, 0.42, 0.01), woodM, D, [0.68, 0.45, -0.42]); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => mesh(new T3.BoxGeometry(0.03, 0.45, 0.03), woodM, D, [0.68 + a * 0.18, 0.225, -0.42 + b * 0.18]));
    mesh(rbox(0.42, 0.4, 0.03, 0.01), woodM, D, [0.68, 0.68, -0.62]);
    // gap behind the fridge (revealed by x-ray) + seal plate
    const hole = mesh(new T3.CircleGeometry(0.05, 20), new T3.MeshBasicMaterial({ color: '#0b0b0d' }), D, [2.95, 0.06, -1.596]); hole.scale.set(1.4, 1, 1);
    const ringM = new T3.MeshBasicMaterial({ color: new T3.Color(2.6, 0.9, 0.4), transparent: true, opacity: 0, depthWrite: false, blending: T3.AdditiveBlending });
    mesh(new T3.TorusGeometry(0.1, 0.004, 6, 40), ringM, D, [2.95, 0.06, -1.59]).castShadow = false;
    const plate = mesh(rbox(0.2, 0.12, 0.012, 0.004), M.std('#aab3bd', { metalness: 0.85, roughness: 0.3 }), D, [2.95, 0.6, -1.585]);
    const spark = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, color: new T3.Color(1.4, 2.2, 1.4), opacity: 0 })); spark.position.set(2.95, 0.07, -1.55); spark.scale.setScalar(0.35); D.add(spark);
    // ---- tenant + phone ----
    const TN = k.fig(D, '#e8b98f', 1.05, 0, -0.7, 0.95, '#7a3b1e');
    const shM = M.std('#3f8f6b', { roughness: 0.85 }); mesh(new T3.CylinderGeometry(0.214, 0.236, 0.56, 24, 1, true), shM, TN.userData.B, [0, 0.48, 0]); mesh(new T3.TorusGeometry(0.2, 0.03, 8, 24), shM, TN.userData.B, [0, 0.76, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const FLOOR = new T3.Vector3(1.05, 0, -0.7), CHAIR = new T3.Vector3(0.68, 0.47, -0.42);
    const tJ = tR1 + 0.1, tJ2 = tJ + 0.4, tD = K.land - 0.2, tD2 = tD + 0.4;
    const vTN = (t) => { if (t < tJ) return FLOOR.clone(); if (t < tJ2) { const u = E.oc(seg(t, tJ, tJ2 - tJ)); const p = FLOOR.clone().lerp(CHAIR, u); p.y += Math.sin(u * Math.PI) * 0.3; return p; } if (t < tD) return CHAIR.clone(); const u = E.io(seg(t, tD, tD2 - tD)); const p = CHAIR.clone().lerp(FLOOR, u); p.y += Math.sin(u * Math.PI) * 0.12; return p; };
    // ---- state ----
    const xray = (t) => E.io(seg(t, K.gap - 0.1, 0.3)) * (1 - E.io(seg(t, K.land + 0.1, 0.3)));
    const sealU = (t) => E.oc(seg(t, K.seal - 0.1, 0.35));
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const PM = (a, r, h, fov = 28) => (t) => { const p = mp(t); return { a, r, h, tx: p.x, ty: 0.06, tz: p.z, fov, roll: 0 }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.1, 1.2, 0.3, 2.7, 0.08, -1.3, 30)],
      [tR0 + 0.2, PM(0.45, 1.3, 0.32), A6],
      [tR1, PM(0.6, 1.2, 0.3, 26), E.lin],
      [tJ + 0.15, PT(0.35, 2.6, 1.3, 1.0, 24, 0.03), A9],
      [K.write - 0.3, PT(0.4, 2.5, 1.3, 1.0, 24), E.lin],
      [K.write + 0.2, PT(0.45, 1.8, 1.42, 1.0, 26), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 0.1, 1.15, -0.55), A6],
      [K.pest - 0.2, P(0.0, 9.2, 2.6, 0.1, 1.15, -0.55), E.lin],
      [K.gap - 0.05, P(-0.15, 2.4, 0.8, 2.9, 0.35, -1.35, 28), A9],
      [K.seal - 0.1, P(0.25, 1.3, 0.42, 2.92, 0.1, -1.45, 26), E.io],
      [K.seal + 0.4, P(0.28, 1.2, 0.4, 2.93, 0.1, -1.47, 26), E.lin],
      [K.land + 0.15, P(0.45, 3.0, 1.5, 1.4, 0.9, -0.7), A6],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3(), prev = new T3.Vector3();
    k.frame((t) => {
      const g = k.grade; g.temp = 0.25 - 0.4 * E.io(seg(t, tR1, 0.15)) * (1 - E.io(seg(t, K.turn, 0.4))); g.th = 1.6; g.bloom = 0.35; g.sat = 1.04;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      // mouse: scurry with fast bob, heading from velocity, sniff while stopped, gone after tR3
      const p = mp(t), p2 = mp(t + 0.03); mouse.position.copy(p); mouse.visible = t < tR3 - 0.02;
      const vx = p2.x - p.x, vz = p2.z - p.z, sp = Math.hypot(vx, vz) / 0.03;
      if (sp > 0.05) mouse.rotation.y = Math.atan2(vx, vz); else if (t > tR1 && t < tR2) mouse.rotation.y = lerp(mouse.rotation.y, -2.2, 0.2);
      mB.position.y = sp > 0.05 ? Math.abs(Math.sin(t * 60)) * 0.012 : 0; mB.rotation.x = sp > 0.05 ? 0.08 : -0.12 + 0.05 * Math.sin(t * 25);
      tail.rotation.y = Math.sin(t * 18) * 0.3;
      // x-ray: fridge fades, gap + ring show, plate slides down and seals
      const xr = xray(t); fridgeM.opacity = 1 - 0.75 * xr; fridgeM.depthWrite = xr < 0.5;
      ringM.opacity = xr * (0.6 + 0.4 * Math.sin(t * 10)) * (1 - sealU(t));
      const su = sealU(t); plate.position.y = lerp(0.6, 0.06, su); plate.visible = t > K.seal - 0.15;
      spark.material.opacity = Math.exp(-Math.pow((t - K.seal - 0.25) / 0.12, 2));
      // tenant: sipping → sees the mouse, leaps onto the chair → phone (photo) → relieved, climbs down
      const shock = E.io(seg(t, tR1 - 0.05, 0.08)) * (1 - E.io(seg(t, K.write - 0.2, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.6, 2.2, 0.4) * (1 - E.io(seg(t, K.seal - 0.2, 0.25)));
      const joy = MC.spring(t, K.land + 0.25, 2.4, 0.35);
      const face = t < tR1 ? 1.2 : (t < tD2 ? 1.0 : 0.5);
      k.drive(TN, t, vTN, {
        face, squash: -0.13 * Math.exp(-Math.pow((t - (tR1 + 0.05)) / 0.07, 2)), tilt: shock * Math.sin(t * 40) * 0.02, nod: 0.25 * phoneUp - 0.15 * shock,
        lean: -0.12 * joy,
        armL: shock > 0.5 && t < tJ2 + 0.3 ? -2.7 : (joy > 0.02 ? -0.4 - 2.2 * joy : (shock > 0.5 ? -1.2 : -0.2)),
        armR: shock > 0.5 && t < tJ2 + 0.3 ? -2.7 : (joy > 0.02 ? -0.4 - 2.2 * joy : -0.25 - 1.2 * phoneUp),
        armLz: shock > 0.5 && t >= tJ2 + 0.3 ? -0.5 : 0,
      });
      k.face(TN, t, { wide: shock, o: shock * 0.9, smile: t < tR1 || joy > 0.1 ? 1 : 0.1 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const flash = ov('tdflash', ''); tl.set(flash, { autoAlpha: 0 }, 0); const tF = K.write - 0.38; tl.fromTo(flash, { autoAlpha: 0.9 }, { autoAlpha: 0, duration: 0.35, ease: 'power2.out', immediateRender: false }, tF);
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.pest - 0.45); k.popOut(m2, K.pest - 0.39);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.pest - 0.3);
    cd.line(0, K.pest - 0.1); cd.line(1, K.nine + 0.05); cd.line(2, K.seal + 0.2);
    k.popOut(cd.c, K.cta - 0.12, { y: -80 });
    const cal = ov('tdtag step', S.cal); k.popIn(cal, K.pest + 0.05, { y: 30 }); k.popOut(cal, K.gap - 0.1, { y: -40 });
    const gT = ov('tdtag warn', S.gap); k.popIn(gT, K.gap + 0.2, { y: 30 }); k.popOut(gT, K.seal + 0.1, { y: -40 });
    const sT = ov('tdtag ok', S.sealed); k.popIn(sT, K.seal + 0.25, { y: 30 }); k.popOut(sT, K.land - 0.1, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.land + 0.05, { y: 40 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(cal, new T3.Vector3(2.9, 1.0, -1.3)); at(gT, new T3.Vector3(2.95, 0.22, -1.55), 240, 840, -60); at(sT, new T3.Vector3(2.95, 0.22, -1.55), 240, 840, -60); at(okT, new T3.Vector3(1.2, 2.0, -0.8));
    });
    sfx('squeak', 0.3, -10); sfx('scurry', tR0, -8); sfx('sting', tR1 - 0.02, -10); sfx('whoosh', tJ, -12); sfx('shutter', tF, -10); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12);
    sfx('scurry', tR2, -12); sfx('chime', K.nine, -14); sfx('refresh', K.gap, -14); sfx('seal', K.seal + 0.15, -6); sfx('kaching', K.land + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
  const GR = {
    X29: [[2, 4, 1, 4, 3, 4, 2, 1, 1, 2, 1, 4, 4], [2, 4, 2, 4, 4, 2, 2, 1, 4, 1, 4, 4, 1]],
    X30: [[4, 2, 4, 4, 4, 2, 4, 3, 1, 1, 1, 4], [4, 2, 4, 4, 1, 2, 4, 4, 2, 1, 1, 1, 4]],
    X31: [[3, 4, 3, 4, 4, 1, 2, 1, 2, 2], [3, 4, 3, 2, 4, 2, 2, 2, 1, 2, 2]],
    X32: [[4, 1, 4, 3, 4, 4, 4, 2, 4, 1, 1, 1], [2, 3, 4, 3, 2, 4, 3, 4, 3, 3, 4, 2, 1]],
    X33: [[2, 4, 1, 4, 2, 4, 4, 2, 4, 4, 1, 1, 1, 1], [2, 4, 1, 2, 4, 4, 4, 3, 4, 3, 1, 1, 1]],
    X34: [[1, 3, 2, 4, 1, 4, 4, 2, 4, 2, 2, 2], [4, 4, 2, 2, 4, 4, 4, 1, 4, 3, 2, 2]],
    X35: [[4, 1, 4, 2, 4, 3, 3, 4, 3, 2, 2], [4, 2, 3, 3, 2, 4, 4, 3, 4, 2, 2]],
    X36: [[1, 4, 4, 4, 2, 3, 3, 4, 2, 4], [2, 4, 2, 4, 2, 2, 4, 3, 4, 3, 4]],
    X37: [[4, 4, 1, 4, 4, 2, 2, 2, 3, 3, 3], [4, 2, 4, 2, 4, 4, 2, 2, 4, 2, 4]],
    X38: [[3, 4, 1, 4, 3, 3, 4, 2, 3, 3], [4, 1, 3, 2, 4, 1, 3, 4, 1, 3, 4]],
    X39: [[1, 4, 3, 4, 2, 3, 4, 2, 2, 2, 2], [2, 4, 4, 2, 4, 4, 4, 1, 3, 3, 2]],
    X40: [[2, 4, 3, 4, 4, 1, 1, 1, 4, 4, 3], [2, 4, 3, 2, 4, 2, 1, 1, 1, 4, 4, 3]],
    X41: [[1, 4, 4, 1, 4, 4, 4, 1, 4, 1, 2, 2], [2, 4, 4, 2, 2, 4, 4, 1, 4, 1, 2, 2]],
    X42: [[3, 4, 2, 4, 4, 2, 2, 2, 2, 4, 2], [3, 4, 2, 2, 4, 2, 3, 3, 4, 2, 4, 2]],
    X43: [[1, 4, 3, 4, 3, 2, 2, 2, 4, 1, 4, 1], [2, 4, 3, 2, 4, 2, 3, 3, 4, 1, 4, 1]],
    X44: [[2, 3, 4, 4, 4, 4, 2, 1, 1, 1, 3], [2, 4, 4, 3, 2, 4, 4, 2, 2, 1, 2]],
    X45: [[3, 3, 4, 4, 2, 2, 2, 4, 2, 2], [2, 4, 4, 4, 1, 2, 2, 2, 4, 2, 4]],
    X46: [[1, 2, 2, 3, 4, 1, 2, 2, 2, 4, 1, 2, 2], [2, 2, 2, 3, 4, 2, 2, 2, 3, 3, 2, 4]],
    X47: [[3, 3, 3, 3, 3, 3, 3, 3, 2, 4], [2, 3, 4, 3, 3, 4, 3, 3, 2, 4]],
    X48: [[4, 3, 2, 2, 2, 2, 4, 1, 2, 4], [4, 1, 3, 2, 2, 2, 3, 3, 4, 4]],
    X49: [[2, 2, 3, 2, 2, 2, 4, 1, 4, 2, 4], [2, 2, 3, 2, 2, 2, 4, 2, 4, 4]],
    X50: [[3, 4, 2, 3, 3, 3, 4, 3, 2, 1, 4], [3, 4, 1, 3, 4, 4, 4, 2, 2, 1, 4]],
    X51: [[1, 3, 4, 3, 3, 1, 4, 4, 4], [1, 2, 3, 3, 3, 4, 4, 2, 3, 3]],
    X52: [[4, 1, 4, 1, 3, 3, 2, 2, 4, 1, 2, 4], [4, 2, 4, 1, 3, 3, 2, 3, 4, 1, 2, 3]], X53: [[3, 1, 4, 1, 3, 3, 3, 4, 2, 4, 4], [2, 1, 4, 1, 3, 3, 4, 2, 4, 2, 4, 2, 3]], X54: [[4, 1, 3, 3, 3, 2, 2, 3, 1, 3, 4], [4, 1, 4, 2, 3, 3, 2, 3, 4, 4, 1, 3]], X55: [[4, 4, 3, 3, 4, 4, 4, 2, 3, 4], [1, 4, 1, 3, 3, 4, 2, 4, 4, 2, 3, 3]], X56: [[4, 1, 4, 1, 3, 3, 4, 2, 4, 4, 1, 3, 4], [4, 4, 1, 3, 3, 4, 1, 4, 4, 4, 1, 3, 3]], X57: [[4, 4, 3, 3, 3, 4, 1, 4, 2, 3, 4], [4, 4, 1, 3, 3, 4, 4, 1, 3, 4, 1, 3, 3]], X58: [[3, 3, 3, 3, 3, 3, 4, 3, 4, 1, 3, 4], [4, 4, 4, 3, 3, 4, 4, 4, 4, 1, 4, 3]], X59: [[3, 4, 2, 3, 3, 4, 2, 2, 2, 4, 2, 3, 4], [2, 4, 2, 3, 3, 4, 1, 3, 3, 4, 2, 3, 3]], X60: [[4, 2, 3, 3, 2, 4, 2, 4, 3, 2, 4], [4, 4, 3, 3, 2, 4, 3, 4, 4, 2, 3]],
    X28: [[1, 2, 4, 1, 4, 4, 1, 3, 4, 4, 2, 4], [2, 2, 4, 2, 2, 4, 4, 2, 4, 3, 2, 4, 1]],
    X27: [[3, 4, 3, 4, 1, 3, 4, 2, 2, 4], [3, 4, 1, 3, 1, 2, 4, 1, 4, 1, 4, 2, 2, 4]],
    X21: [[2, 4, 2, 1, 4, 1, 3, 2, 1, 4, 4, 2, 1, 1, 1], [3, 4, 1, 4, 1, 3, 2, 1, 4, 2, 2, 3, 2, 3, 4]],
    X20: [[3, 4, 4, 3, 2, 3, 3, 2, 4, 3, 2, 3, 2], [4, 4, 4, 4, 2, 3, 2, 4, 2, 3, 2, 4, 2]],
    X19: [[3, 4, 3, 4, 3, 4, 3, 3, 3, 4, 4, 3], [2, 4, 4, 4, 4, 2, 2, 4, 3, 3, 3, 3, 3]],
    X18: [[3, 4, 4, 4, 3, 3, 3, 3, 3, 3], [3, 4, 4, 2, 2, 4, 4, 4, 4, 4, 3]],
    X17: [[2, 2, 2, 4, 2, 4, 3, 3, 4, 2, 3, 2, 2], [2, 2, 2, 4, 3, 2, 3, 3, 3, 4, 3, 2, 2]],
    X16: [[2, 4, 3, 2, 2, 2, 4, 4, 2, 4, 3], [4, 4, 2, 2, 2, 3, 2, 4, 2, 3, 4, 2, 3]],
    X13: [[3, 4, 2, 3, 3, 3, 4, 3, 4, 2, 3], [3, 1, 4, 3, 2, 4, 3, 2, 3, 2, 4, 3, 2, 3]],
    X14: [[4, 2, 3, 3, 2, 3, 3, 2, 3, 3, 4, 3, 3], [3, 2, 4, 3, 3, 2, 4, 2, 4, 3, 1, 2, 2, 3]],
    X15: [[2, 2, 4, 2, 2, 3, 3, 2, 4, 4, 1, 1, 1, 1], [2, 2, 3, 2, 2, 3, 2, 3, 2, 3, 4, 2, 1, 1, 1]],
    X26: [[1, 4, 2, 4, 2, 3, 2, 3, 2, 1, 1, 2, 2, 3, 2, 2], [2, 4, 2, 4, 2, 3, 5, 3, 1, 1, 2, 2, 3, 4]],
    X12: [[3, 2, 3, 4, 4, 2, 3, 2, 4, 2, 3, 3, 3, 2, 3], [3, 4, 3, 4, 2, 4, 3, 3, 2, 3, 3, 3, 2, 2]],
    X11: [[2, 4, 3, 3, 3, 3, 1, 3, 3, 2, 3, 3], [2, 4, 2, 3, 3, 2, 3, 2, 3, 2, 3, 2, 3, 3]],
    X25: [[2, 3, 4, 2, 2, 3, 2, 2, 3, 4, 3, 2, 3], [4, 4, 3, 2, 4, 4, 2, 3, 4, 4, 2, 3]],
    X24: [[5, 5, 3, 2, 3, 2, 3, 5, 3, 3, 3, 2, 3, 4], [5, 5, 3, 3, 3, 2, 3, 5, 3, 3, 3, 3, 3, 4]],
    X23: [[3, 4, 5, 2, 3, 2, 4, 3, 2, 3, 3, 3], [5, 3, 3, 2, 2, 3, 2, 2, 4, 3, 2, 2, 2, 3, 3]],
    X22: [[4, 3, 5, 2, 3, 2, 3, 4, 4, 4, 2, 2], [4, 3, 4, 2, 5, 3, 3, 3, 3, 3, 4, 2, 2]],
    X10: [[2, 4, 3, 1, 3, 1, 3, 1, 1, 4, 1, 3, 1, 2, 3, 2, 3], [3, 3, 2, 1, 4, 1, 3, 1, 2, 4, 1, 2, 3, 1, 3, 2, 3, 4]],
    X9: [[2, 2, 4, 3, 4, 3, 4, 1, 3, 1, 3, 4, 4], [2, 3, 4, 2, 2, 4, 4, 1, 3, 1, 4, 4, 3]],
    X8: [[1, 1, 3, 4, 3, 2, 3, 3, 4, 1, 3, 2, 2, 2], [1, 1, 3, 1, 4, 2, 2, 3, 4, 4, 4, 2, 2, 2]],
    X7: [[2, 4, 4, 1, 3, 1, 2, 1, 2, 4, 3, 4, 2], [4, 4, 2, 1, 4, 1, 3, 1, 2, 2, 4, 4, 2, 2]],
    X6: [[4, 4, 5, 2, 4, 2, 2, 3, 2, 2], [5, 4, 5, 2, 3, 5, 2, 3, 2, 4]],
    X5: [[3, 4, 3, 2, 3, 2, 4, 1, 1, 1, 2, 2], [3, 4, 3, 3, 2, 5, 2, 1, 2, 2, 2]],
    X4: [[3, 2, 3, 3, 1, 2, 1, 3, 1, 3, 1, 1, 3, 2, 4, 4], [3, 3, 4, 4, 1, 4, 1, 3, 1, 5, 1, 4, 2, 3, 3, 3]],
    X3: [[1, 3, 4, 3, 3, 2, 3, 4, 2, 3, 2, 4, 4], [2, 3, 4, 3, 3, 2, 4, 3, 2, 3, 4, 4, 4]],
    X2: [[3, 3, 3, 3, 2, 4, 2, 3, 2, 4, 2, 3, 3, 3, 2, 3], [2, 2, 3, 4, 2, 5, 2, 4, 2, 3, 2, 3, 3, 3, 3, 5]],
    X1: [[2, 4, 4, 1, 3, 4, 1, 3, 3, 1, 3, 2, 3, 2, 4, 3, 3, 3], [3, 4, 4, 1, 5, 5, 1, 2, 3, 1, 3, 2, 3, 2, 4, 2, 3, 3]],
    W1: [[3, 3, 4, 3, 2, 2, 2, 1, 4, 3, 3, 3, 2, 3], [3, 2, 2, 3, 2, 2, 4, 4, 2, 3, 3, 3, 2, 3]],
    W2: [[2, 3, 4, 3, 3, 1, 2, 3, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 3, 2, 3], [3, 4, 3, 3, 3, 3, 3, 2, 2, 2, 2, 3, 2, 3, 3, 2, 2, 2, 2]],
    W3: [[2, 4, 4, 1, 2, 2, 1, 2, 1, 2, 2, 1, 2, 1, 2, 2, 2, 3, 2], [3, 4, 4, 1, 3, 3, 1, 3, 1, 4, 1, 4, 1, 3, 3, 2, 3, 2]],
  };
  const out = { W1, W2, W3, X1, X2, X3, X4, X5, X6, X7, X8, X9, X10, X11, X12, X13, X14, X15, X16, X17, X18, X19, X20, X21, X22, X23, X24, X25, X26, X27, X28, X29, X30, X31, X32, X33, X34, X35, X36, X37, X38, X39, X40, X41, X42, X43, X44, X45, X46, X47, X48, X49, X50, X51, X52, X53, X54, X55, X56, X57, X58, X59, X60 }[C]();
  captions(GR[C][lang === 'de' ? 0 : 1]);
  stage.appendChild(document.getElementById('cap'));
  stage.appendChild(document.querySelector('.grain'));
  const r0 = window.ready;
  window.ready = async () => {
    await Promise.all(['700 100px Clash', '600 100px Clash', '700 40px Gothic', '600 40px Gothic'].map((f) => document.fonts.load(f)));
    READY.forEach((f) => f());
    await r0();
  };
  window.T = out.T;
  window.K = out.K;
})();
