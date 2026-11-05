    // ---- X77: musty sink: x-ray cabinet shows the dry U-trap, gas rises, water poured in seals it ----
    mirFog.visible = false;
    const SX = 2.2, SZ = -1.3;
    const ghostM = M.std('#2f5a44', { roughness: 0.55 }); ghostM.transparent = true; ghostM.opacity = 0.16; ghostM.depthWrite = false;
    mesh(new T3.BoxGeometry(1.0, 0.86, 0.6), ghostM, D, [SX, 0.43, SZ]).castShadow = false;
    box(1.04, 0.05, 0.64, M.std('#dccab0', { roughness: 0.45 }), [SX, 0.885, SZ]);
    // vessel basin + faucet
    const basinM = new T3.MeshStandardMaterial({ color: '#fafaf8', roughness: 0.2, side: T3.DoubleSide });
    mesh(new T3.CylinderGeometry(0.2, 0.15, 0.1, 32, 1, true), basinM, D, [SX, 0.96, SZ]); mesh(new T3.CircleGeometry(0.15, 28), basinM, D, [SX, 0.912, SZ], [-Math.PI / 2, 0, 0]);
    mesh(new T3.TorusGeometry(0.2, 0.012, 8, 32), basinM, D, [SX, 1.01, SZ], [Math.PI / 2, 0, 0]); mesh(new T3.TorusGeometry(0.032, 0.008, 8, 16), chrome, D, [SX, 0.914, SZ], [Math.PI / 2, 0, 0]);
    mesh(new T3.CylinderGeometry(0.03, 0.036, 0.16, 18), chrome, D, [SX, 1.0, SZ - 0.2]); mesh(new T3.CylinderGeometry(0.014, 0.014, 0.2, 12), chrome, D, [SX, 1.07, SZ - 0.1], [Math.PI / 2, 0, 0]); mesh(new T3.BoxGeometry(0.09, 0.016, 0.02), chrome, D, [SX, 1.1, SZ - 0.2]);
    // pipe + U-trap (plastic, see-through) and the water seal inside it
    const pts = [[SX, 0.9, SZ], [SX, 0.62, SZ], [SX, 0.44, SZ], [SX - 0.02, 0.35, SZ], [SX - 0.08, 0.3, SZ], [SX - 0.14, 0.35, SZ], [SX - 0.16, 0.44, SZ], [SX - 0.16, 0.52, SZ], [SX - 0.16, 0.54, SZ - 0.08], [SX - 0.16, 0.54, SZ - 0.2]].map((p) => new T3.Vector3(...p));
    const pipeC = new T3.CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
    const plasticM = new T3.MeshPhysicalMaterial({ color: '#e9eef2', roughness: 0.15, transparent: true, opacity: 0.3, depthWrite: false, clearcoat: 1, side: T3.DoubleSide });
    mesh(new T3.TubeGeometry(pipeC, 80, 0.03, 14, false), plasticM, D, [0, 0, 0]).castShadow = false;
    [[0.0, 0.88], [0.97, 1.0]].forEach(([a, b]) => { const p = pipeC.getPoint(a === 0 ? 0.0 : 0.985); mesh(new T3.TorusGeometry(0.032, 0.007, 8, 16), M.std('#cfd6dc'), D, [p.x, p.y + (a === 0 ? -0.02 : 0), p.z], a === 0 ? [Math.PI / 2, 0, 0] : [0, 0, 0]); });
    const wp = [[SX - 0.005, 0.47, SZ], [SX - 0.02, 0.36, SZ], [SX - 0.08, 0.31, SZ], [SX - 0.14, 0.36, SZ], [SX - 0.155, 0.47, SZ]].map((p) => new T3.Vector3(...p));
    const wGeo = new T3.TubeGeometry(new T3.CatmullRomCurve3(wp, false, 'catmullrom', 0.3), 40, 0.022, 12, false); const wTot = wGeo.index.count;
    const wMesh = mesh(wGeo, new T3.MeshStandardMaterial({ color: '#4aa8ec', roughness: 0.05, transparent: true, opacity: 0.85, emissive: new T3.Color('#1c5a8a'), emissiveIntensity: 0.3 }), D, [0, 0, 0]); wMesh.castShadow = false;
    // wall pipe stub
    mesh(new T3.CylinderGeometry(0.034, 0.034, 0.05, 14), M.std('#cfd6dc'), D, [SX - 0.16, 0.54, SZ - 0.28], [Math.PI / 2, 0, 0]);
    // sewer gas puffs (green) travel along the pipe and out of the drain
    const puffM = () => new T3.SpriteMaterial({ map: cloud, transparent: true, depthWrite: false, opacity: 0, color: new T3.Color('#a6cf4e') });
    const puffs = [...Array(16)].map((_, i) => { const m = new T3.Sprite(puffM()); m.renderOrder = 5; D.add(m); return { m, ph: MC.rnd(i, 1), dx: MC.rnd(i, 2) - 0.5 }; });
    // water jug + stream + flow dots
    const JG = new T3.Group(); D.add(JG);
    mesh(new T3.CylinderGeometry(0.06, 0.05, 0.17, 20), new T3.MeshPhysicalMaterial({ color: '#dff0ff', roughness: 0.05, transparent: true, opacity: 0.4, depthWrite: false, clearcoat: 1 }), JG, [0, 0, 0]).castShadow = false;
    mesh(new T3.CylinderGeometry(0.052, 0.046, 0.12, 20), new T3.MeshStandardMaterial({ color: '#58b0ee', transparent: true, opacity: 0.8, roughness: 0.05 }), JG, [0, -0.02, 0]).castShadow = false;
    mesh(new T3.TorusGeometry(0.04, 0.008, 8, 16, Math.PI), M.std('#f3f3ef'), JG, [0.07, 0, 0], [0, 0, -Math.PI / 2]);
    const streamM = new T3.MeshBasicMaterial({ color: new T3.Color(0.7, 1.5, 2.2), transparent: true, opacity: 0, depthWrite: false });
    const stream = mesh(new T3.CylinderGeometry(0.006, 0.006, 1, 8), streamM, D, [SX, 1, SZ]); stream.castShadow = false;
    const dots = [...Array(10)].map(() => { const m = mesh(new T3.SphereGeometry(0.013, 8, 6), new T3.MeshBasicMaterial({ color: new T3.Color(0.5, 1.4, 2.4) }), D, [0, -5, 0]); m.castShadow = false; return m; });
    const stars = [...Array(8)].map((_, i) => { const m = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, color: new T3.Color(2.0, 2.2, 1.6), opacity: 0 })); m.scale.setScalar(0.08); D.add(m); return m; });
    // ---- tenant (pyjamas) + phone ----
    const TN = k.fig(D, '#e8b98f', 1.3, 0, -0.75, 0.95, '#7a3b1e');
    const pjM = M.std('#e0a05a', { roughness: 0.9 }); mesh(new T3.CylinderGeometry(0.218, 0.24, 0.6, 24, 1, true), pjM, TN.userData.B, [0, 0.46, 0]); mesh(new T3.TorusGeometry(0.2, 0.03, 8, 24), pjM, TN.userData.B, [0, 0.76, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const POS = new T3.Vector3(1.3, 0, -0.75); const vTN = () => POS.clone();
    // ---- state ----
    const pour = (t) => antMove(t, K.liter - 0.35, 0.45, 0, 1, 1.1) * (1 - antMove(t, K.seal + 0.2, 0.4, 0, 1, 1.1));
    const fillT = (t) => E.io(seg(t, K.liter + 0.3, Math.max(0.9, K.seal - K.liter + 0.2)));
    const gas = (t) => (1 - E.io(seg(t, K.seal + 0.25, 0.35)));
    const fresh = (t) => E.io(seg(t, K.fresh - 0.1, 0.3)) * (1 - E.io(seg(t, K.no + 0.3, 0.4)));
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.3, 2.2, 1.1, SX - 0.05, 0.75, SZ, 27)],
      [K.smell - 0.3, P(0.3, 1.7, 1.25, SX, 1.05, SZ, 25), E.io],
      [K.smell + 0.9, PT(0.4, 2.4, 1.3, 1.05, 21, 0.03), A9],
      [K.write - 0.3, PT(0.4, 2.4, 1.28, 1.03, 22), E.lin],
      [K.write + 0.2, PT(0.45, 1.8, 1.42, 1.0, 26), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 0.1, 1.15, -0.55), A6],
      [K.dry - 0.3, P(0.0, 9.2, 2.6, 0.1, 1.15, -0.55), E.lin],
      [K.dry + 0.1, P(0.3, 2.5, 1.25, SX - 0.05, 0.88, SZ, 28), A9],
      [K.seal + 0.3, P(0.35, 2.4, 1.2, SX - 0.05, 0.9, SZ, 28), E.io],
      [K.no + 0.35, P(0.3, 3.0, 1.5, 1.7, 0.9, -1.0), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3(), V3 = new T3.Vector3();
    k.frame((t) => {
      const g = k.grade; g.temp = -0.1 + 0.25 * fresh(t); g.th = 1.6; g.bloom = 0.35 + 0.1 * fresh(t); g.sat = 1.04;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      // water seal fills the U
      const fl = fillT(t); wGeo.setDrawRange(0, Math.round(wTot * fl / 3) * 3); wMesh.visible = fl > 0.01;
      // gas: travels up the dry pipe and out of the sink; blocked at the U once water sits in it
      const gs = gas(t), blk = lerp(1.0, 0.3, fl);
      puffs.forEach((p, i) => {
        const s = ((t * 0.45 + p.ph) % 1) * 1.3; let a = 0;
        if (s < 1) { pipeC.getPoint(1 - s, V3); p.m.position.copy(V3); a = s < 0.12 ? s / 0.12 : 1; if (s > blk) a = 0; } else { p.m.position.set(SX + p.dx * 0.2 * (s - 1) * 3, 0.95 + (s - 1) * 1.6, SZ + (p.dx) * 0.1); a = (1 - (s - 1) / 0.3); if (fl > 0.4) a = 0; }
        p.m.scale.setScalar(0.06 + 0.12 * Math.max(0, s - 0.6)); p.m.material.opacity = 0.55 * a * gs;
      });
      // jug pours into the drain
      const pr = pour(t); JG.visible = pr > 0.02; JG.position.set(SX + 0.14 - 0.0, 1.28 - 0.1 * (1 - pr), SZ); JG.rotation.z = 1.15 * pr; JG.scale.setScalar(Math.max(1e-3, Math.min(1, pr * 3)));
      const sp = (JG.localToWorld(V3.set(-0.075, 0.07, 0)));
      const strm = pr > 0.5 ? 1 : 0; const top = sp.y, bot = 0.93; stream.visible = strm > 0; stream.scale.y = Math.max(1e-3, top - bot); stream.position.set(sp.x, (top + bot) / 2, sp.z); streamM.opacity = 0.85 * strm * (0.8 + 0.2 * Math.sin(t * 40));
      dots.forEach((m, i) => { const on = pr > 0.5 && fl < 0.98; const s = (((t * 0.9 + i / dots.length) % 1) * 0.55); if (!on) { m.position.y = -5; return; } pipeC.getPoint(s, V3); m.position.copy(V3); });
      stars.forEach((m, i) => { const f = fresh(t); const a = ((t * 0.7 + i / stars.length) % 1); m.position.set(SX - 0.3 + 0.6 * MC.rnd(i, 1), 1.0 + 0.5 * a, SZ + 0.3 * (MC.rnd(i, 2) - 0.5)); m.material.opacity = f * Math.sin(a * Math.PI); });
      // tenant: pinches nose -> phone -> pours -> breathes in
      const nose = E.io(seg(t, K.smell, 0.2)) * (1 - E.io(seg(t, K.write - 0.8, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.dry - 0.5, 0.25)));
      const work = pr;
      const joy = MC.spring(t, K.fresh + 0.1, 2.4, 0.35) * (1 - E.io(seg(t, K.no, 0.3)));
      const face = lerp(lerp(2.1, 0.45, E.io(seg(t, K.write - 1.0, 0.4))), 2.1, E.io(seg(t, K.dry - 0.5, 0.3)));
      k.drive(TN, t, vTN, {
        face, nod: 0.25 * phoneUp + 0.15 * work, lean: 0.12 * work - 0.1 * joy, squash: 0,
        armL: joy > 0.02 ? -0.4 - 2.4 * joy : -0.2 - 1.3 * work,
        armR: joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 1.2 * phoneUp - 2.3 * nose - 1.3 * work,
      });
      k.face(TN, t, { wide: 0.35 * nose, o: 0.5 * nose, smile: joy > 0.1 ? 1 : 0.05, closed: 0.7 * nose });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.liter - 0.5); k.popOut(m2, K.liter - 0.44);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.liter - 0.3);
    cd.line(0, K.liter); cd.line(1, K.liter + 0.5); cd.line(2, K.fresh);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const eT = ov('tdtag warn', S.err); k.popIn(eT, 0.55, { y: 30 }); k.popOut(eT, K.write - 0.3, { y: -40 });
    const dT = ov('tdtag warn', S.dry); k.popIn(dT, K.dry + 0.2, { y: 30 }); k.popOut(dT, K.liter - 0.5, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.liter - 0.05, { y: 30 }); k.popOut(s1, K.seal - 0.12, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.seal - 0.05, { y: 30 }); k.popOut(s2, K.fresh - 0.15, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(eT, new T3.Vector3(SX, 1.15, SZ), 240, 840, -80); at(dT, new T3.Vector3(SX - 0.08, 0.32, SZ), 240, 840, 70); at(s1, new T3.Vector3(SX - 0.08, 0.32, SZ), 240, 840, 70); at(s2, new T3.Vector3(SX - 0.08, 0.32, SZ), 240, 840, 70); at(okT, new T3.Vector3(1.7, 1.9, -0.9));
    });
    sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12); sfx('refresh', K.dry, -14);
    sfx('flow', K.liter - 0.1, -13, { dur: Math.max(1.0, K.seal - K.liter + 0.3) }); sfx('gurgle', K.liter + 0.5, -14, { dur: 1.0 }); sfx('plop', K.seal + 0.1, -9); sfx('chime', K.fresh, -11); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
