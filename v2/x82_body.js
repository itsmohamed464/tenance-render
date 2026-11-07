    // ---- X82: radiator gurgles and stays cold at the top: air inside; open the bleed valve until water comes, close it, the heating warms up ----
    mirFog.visible = false;
    D.children.filter((o) => o.isMesh && o.geometry.type === 'PlaneGeometry' && o.material.blending === T3.AdditiveBlending).forEach((o) => { o.visible = false; });
    kettle.visible = false;
    D.children.filter((o) => o.isMesh && Math.abs(o.position.x - 1.95) < 0.01 && Math.abs(o.position.y - 0.955) < 0.01).forEach((o) => { o.visible = false; });
    // radiator (column type) under the kitchen window
    const RAD = new T3.Group(); RAD.position.set(2.15, 0, -1.5); D.add(RAD);
    const radM = M.std('#f4f1ea', { roughness: 0.4 });
    for (let i = 0; i < 10; i++) mesh(rbox(0.06, 0.62, 0.09, 0.025), radM, RAD, [-0.38 + i * 0.0845, 0.58, 0.05]);
    mesh(rbox(0.9, 0.045, 0.1, 0.02), radM, RAD, [0, 0.9, 0.05]); mesh(rbox(0.9, 0.045, 0.1, 0.02), radM, RAD, [0, 0.27, 0.05]);
    [-0.34, 0.34].forEach((x) => mesh(new T3.CylinderGeometry(0.012, 0.012, 0.14, 8), chrome, RAD, [x, 0.22, -0.02]));
    // bleed valve at the top right (points at the camera) + key
    const VAL = new T3.Group(); VAL.position.set(0.47, 0.9, 0.09); RAD.add(VAL);
    mesh(new T3.CylinderGeometry(0.026, 0.03, 0.05, 14), M.std('#c9a24a', { metalness: 0.8, roughness: 0.3 }), VAL, [0, 0, 0.02], [Math.PI / 2, 0, 0]);
    mesh(new T3.BoxGeometry(0.03, 0.006, 0.008), M.std('#5a4a20'), VAL, [0, 0, 0.047]);
    const KEY = new T3.Group(); VAL.add(KEY); mesh(new T3.BoxGeometry(0.02, 0.02, 0.07), chrome, KEY, [0, 0, 0.03]); mesh(rbox(0.07, 0.016, 0.016, 0.005), chrome, KEY, [0, 0, 0.065]); KEY.visible = false;
    // little side table + cup under the valve, collects the water
    mesh(rbox(0.3, 0.025, 0.3, 0.01), M.std('#c9a27a', { roughness: 0.6 }), D, [2.62, 0.6, -1.28]); [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]].forEach(([dx, dz]) => mesh(new T3.CylinderGeometry(0.012, 0.012, 0.6, 8), M.std('#a98660'), D, [2.62 + dx, 0.3, -1.28 + dz]));
    mesh(new T3.CylinderGeometry(0.05, 0.04, 0.09, 18, 1, true), M.std('#f4f1ea', { roughness: 0.3 }), D, [2.62, 0.66, -1.34]);
    const wlv = mesh(new T3.CircleGeometry(0.043, 18), new T3.MeshStandardMaterial({ color: '#6fb7e6', roughness: 0.1, transparent: true, opacity: 0.9 }), D, [2.62, 0.62, -1.34], [-Math.PI / 2, 0, 0]); wlv.castShadow = false;
    // heat overlays (warm lower part / cold top), trapped air bubbles, valve hiss + droplets
    const warmP = mesh(new T3.PlaneGeometry(0.92, 1), new T3.MeshBasicMaterial({ color: '#ff8a3a', transparent: true, opacity: 0.4, depthWrite: false }), RAD, [0, 0.5, 0.1]); warmP.castShadow = false;
    const coldP = mesh(new T3.PlaneGeometry(0.92, 1), new T3.MeshBasicMaterial({ color: '#4f9bff', transparent: true, opacity: 0.4, depthWrite: false }), RAD, [0, 0.8, 0.1]); coldP.castShadow = false;
    const airB = [...Array(7)].map((_, i) => mesh(new T3.SphereGeometry(0.014 + MC.rnd(i, 1) * 0.012, 8, 6), new T3.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 }), RAD, [-0.35 + i * 0.12, 0.8, 0.1])); airB.forEach((b) => { b.castShadow = false; });
    const hiss = [0, 1, 2, 3].map(() => { const sp = new T3.Sprite(new T3.SpriteMaterial({ map: cloud, transparent: true, depthWrite: false, opacity: 0 })); D.add(sp); return sp; });
    const drops = [...Array(6)].map(() => { const m = mesh(new T3.SphereGeometry(0.012, 8, 6), new T3.MeshStandardMaterial({ color: '#8ccaf2', roughness: 0.1, transparent: true, opacity: 0.9 }), D, [0, -5, 0]); m.castShadow = false; return m; });
    const rl = new T3.PointLight('#ff9a50', 0, 3); rl.position.set(2.15, 0.5, -1.1); D.add(rl);
    // ---- tenant + phone ----
    const TN = k.fig(D, '#e8b98f', 1.2, 0, -0.85, 0.95, '#7a3b1e');
    const swM = M.std('#6f5bb5', { roughness: 0.9 }); mesh(new T3.CylinderGeometry(0.218, 0.24, 0.58, 24, 1, true), swM, TN.userData.B, [0, 0.48, 0]); mesh(new T3.TorusGeometry(0.2, 0.034, 8, 24), swM, TN.userData.B, [0, 0.77, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    // ---- timing / state ----
    const heat = (t) => 0.5 + 0.5 * E.io(seg(t, K.close + 0.15, 1.3));
    const WPS = [[0, 1.2, -0.85], [K.open - 1.1, 1.2, -0.85], [K.open - 0.35, 2.15, -0.95], [K.close + 0.7, 2.15, -0.95], [K.close + 1.5, 1.85, -0.9], [1e3, 1.85, -0.9]];
    const vTN = (t) => { let i = 0; while (i < WPS.length - 2 && t > WPS[i + 1][0]) i++; const a = WPS[i], b = WPS[i + 1], u = E.io(clamp((t - a[0]) / Math.max(0.01, b[0] - a[0]))); return new T3.Vector3(lerp(a[1], b[1], u), 0, lerp(a[2], b[2], u)); };
    const keyIn = (t) => antMove(t, K.open - 0.2, 0.35, 0, 1, 1.15) * (1 - antMove(t, K.close + 0.35, 0.3, 0, 1, 1.1));
    const turn = (t) => E.io(seg(t, K.open, 0.5)) - E.io(seg(t, K.close, 0.5));
    const spit = (t) => (t > K.open + 0.25 && t < K.water + 0.15 ? 1 : 0), flow = (t) => (t > K.water + 0.1 && t < K.close + 0.05 ? 1 : 0);
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.15, 4.3, 1.25, 1.75, 0.8, -1.3, 28)],
      [K.cold - 0.7, P(0.15, 4.1, 1.25, 1.85, 0.8, -1.3, 28), E.lin],
      [K.cold - 0.2, P(0.1, 2.3, 1.0, 2.15, 0.7, -1.45, 25), A9],
      [K.write - 0.1, P(0.1, 2.3, 1.0, 2.15, 0.7, -1.45, 25), E.lin],
      [K.write + 0.4, PT(0.5, 2.1, 1.3, 0.95, 25), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 1.5, 1.0, -0.4), A6],
      [K.air - 0.5, P(0.0, 9.2, 2.6, 1.5, 1.0, -0.4), E.lin],
      [K.air + 0.2, P(0.15, 2.0, 1.1, 2.2, 0.75, -1.45, 23), A9],
      [K.open - 0.5, P(0.15, 1.25, 1.05, 2.6, 0.85, -1.45, 20), A9],
      [K.close + 0.5, P(0.15, 1.25, 1.05, 2.6, 0.8, -1.45, 20), E.lin],
      [K.warm - 0.2, P(0.1, 3.2, 1.2, 2.1, 0.75, -1.3, 27), A6],
      [K.no + 0.35, P(0.25, 3.2, 1.4, 1.9, 0.9, -1.0), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3(), VW = new T3.Vector3();
    k.frame((t) => {
      const g = k.grade; g.temp = 0.02 + 0.1 * heat(t) * E.io(seg(t, K.close, 1.5)); g.th = 1.6; g.bloom = 0.4; g.sat = 1.04;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      // radiator: gurgles (shakes) until the air is out; warm bottom, cold top, heat climbs after the bleed
      const gur = E.io(seg(t, K.gur - 0.1, 0.2)) * (1 - E.io(seg(t, K.air + 0.6, 0.3))) * (1 - E.io(seg(t, K.write - 0.6, 0.4)) * 0.6);
      RAD.position.x = 2.15 + 0.004 * Math.sin(t * 38) * gur; RAD.rotation.z = 0.004 * Math.sin(t * 27) * gur;
      const h = heat(t), hh = Math.max(0.001, h);
      warmP.scale.y = 0.62 * hh; warmP.position.y = 0.27 + 0.31 * hh; coldP.visible = h < 0.995; coldP.scale.y = Math.max(0.001, 0.62 * (1 - h)); coldP.position.y = 0.89 - 0.31 * (1 - h);
      coldP.material.opacity = 0.4 * (1 - E.io(seg(t, K.close, 0.8)));
      rl.intensity = 1.8 * E.io(seg(t, K.close + 0.2, 1.4));
      airB.forEach((b, i) => { const air = 1 - E.io(seg(t, K.open + 0.3 + i * 0.05, 0.5)); b.visible = air > 0.02 && t > K.gur; b.position.set(-0.35 + i * 0.12 + 0.01 * Math.sin(t * 6 + i), 0.82 + 0.03 * Math.sin(t * 4 + i * 2) + 0.02 * air, 0.1); b.scale.setScalar(0.5 + 0.5 * air); });
      // key + valve
      const ki = keyIn(t); KEY.visible = ki > 0.02; KEY.position.z = 0.03 * (1 - ki) + 0.0; KEY.rotation.z = turn(t) * 1.6;
      VAL.getWorldPosition(VW);
      hiss.forEach((sp, i) => { const u = ((t * 1.6 + i * 0.25) % 1), a = spit(t) * Math.sin(u * Math.PI) * 0.6; sp.material.opacity = a; sp.position.set(VW.x + 0.02 + u * 0.12, VW.y + 0.02 + u * 0.05 - 0.02 * i, VW.z + 0.08 + u * 0.1); sp.scale.setScalar(0.04 + u * 0.1); });
      drops.forEach((m, i) => { const u = ((t * 2.4 + i / drops.length) % 1), on = flow(t); m.visible = on > 0; m.position.set(VW.x + 0.01, VW.y - 0.01 - u * (VW.y - 0.64), VW.z + 0.05 - 0.02 * u); });
      wlv.position.y = 0.62 + 0.035 * E.io(seg(t, K.water + 0.1, K.close - K.water));
      // tenant: tests the radiator top (cold hand), phone, walks to the valve, works, hand on the warm radiator
      const feel = E.io(seg(t, K.cold - 0.6, 0.3)) * (1 - E.io(seg(t, K.write - 0.9, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.open - 1.2, 0.25)));
      const work = E.io(seg(t, K.open - 0.4, 0.3)) * (1 - E.io(seg(t, K.close + 0.8, 0.3)));
      const joy = MC.spring(t, K.warm - 0.1, 2.4, 0.35) * (1 - E.io(seg(t, K.no, 0.3)));
      const face = lerp(lerp(lerp(Math.PI * 0.8, 0.2, E.io(seg(t, K.write - 1.0, 0.4))), 2.45, E.io(seg(t, K.open - 1.1, 0.3))), Math.PI, E.io(seg(t, K.close + 0.9, 0.4)));
      k.drive(TN, t, vTN, {
        face, nod: 0.25 * phoneUp - 0.12 * work, lean: 0.08 * work - 0.1 * joy, squash: 0,
        armL: joy > 0.02 ? -0.4 - 2.4 * joy : -0.2 - 0.6 * work - 1.1 * feel,
        armR: joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 1.2 * phoneUp - 2.0 * work + 0.15 * work * Math.sin(t * 9) - 0.4 * feel,
      });
      k.face(TN, t, { wide: 0.3 * feel, o: 0, smile: joy > 0.1 ? 1 : 0.05, closed: 0 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.8 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.air - 0.5); k.popOut(m2, K.air - 0.44);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.air - 0.3);
    cd.line(0, K.air + 0.1); cd.line(1, K.open); cd.line(2, K.warm);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const cT = ov('tdtag warn', S.cold); k.popIn(cT, K.cold + 0.05, { y: 30 }); k.popOut(cT, K.write - 0.5, { y: -40 });
    const aT = ov('tdtag warn', S.air); k.popIn(aT, K.air + 0.05, { y: 30 }); k.popOut(aT, K.open - 0.55, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.open - 0.05, { y: 30 }); k.popOut(s1, K.water - 0.12, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.water - 0.05, { y: 30 }); k.popOut(s2, K.warm - 0.2, { y: -40 });
    const wT = ov('tdtag ok', S.hot); k.popIn(wT, K.warm + 0.05, { y: 40 }); k.popOut(wT, K.no - 0.1, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(cT, new T3.Vector3(2.15, 0.9, -1.4), 240, 840, -120); at(aT, new T3.Vector3(2.15, 0.9, -1.4), 240, 840, -120);
      at(s1, new T3.Vector3(2.6, 0.9, -1.4), 240, 840, -150); at(s2, new T3.Vector3(2.6, 0.9, -1.4), 240, 840, -150);
      at(wT, new T3.Vector3(2.15, 0.9, -1.4), 240, 840, -120); at(okT, new T3.Vector3(1.8, 1.6, -1.0));
    });
    sfx('errbeep', K.cold + 0.05, -16); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12); sfx('refresh', K.air - 0.1, -14);
    sfx('click', K.open - 0.2, -9); sfx('unscrew', K.open, -8); sfx('refresh', K.open + 0.3, -12); sfx('thud', K.water + 0.1, -14); sfx('unscrew', K.close, -8); sfx('click', K.close + 0.55, -8); sfx('chime', K.warm, -9); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
