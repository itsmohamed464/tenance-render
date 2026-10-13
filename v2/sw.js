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
    r.setPixelRatio(1);
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

  const GR = {
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
  const out = { W1, W2, W3, X1, X2, X3, X4, X5, X6, X7, X8, X9, X10, X22, X23 }[C]();
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
