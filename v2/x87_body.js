    // ---- X87: dishwasher stinks + dishes stay dirty: clogged filter. Twist it out, rinse it under the tap, put it back (clean again, saves a call-out) ----
    kettle.visible = false;
    const SLEEVE = M.std('#3f8fd2', { roughness: 0.9 });
    // ---- POV hand + forearm for close-ups, keyframe + arc helpers ----
    const skinM = M.std('#e8b98f', { roughness: 0.7 });
    const HD = new T3.Group(); D.add(HD); HD.visible = false;
    mesh(new T3.CapsuleGeometry(0.032, 1.0, 6, 14), SLEEVE, HD, [0, 0.58, 0]);
    mesh(new T3.CylinderGeometry(0.036, 0.036, 0.03, 14), skinM, HD, [0, 0.07, 0]);
    mesh(new T3.SphereGeometry(0.05, 16, 12), skinM, HD, [0, 0, 0]).scale.set(1, 0.85, 1.1);
    mesh(new T3.CapsuleGeometry(0.016, 0.04, 4, 8), skinM, HD, [0.052, -0.012, 0.02], [0, 0, 0.7]);
    [-0.028, 0, 0.028].forEach((fx) => mesh(new T3.CapsuleGeometry(0.014, 0.04, 4, 8), skinM, HD, [fx, -0.055, 0.012]));
    const _bk = new T3.Vector3(), _up = new T3.Vector3(0, 1, 0), _w = new T3.Vector3();
    const handAt = (p, bx, by, bz) => { HD.position.copy(p); HD.quaternion.setFromUnitVectors(_up, _bk.set(bx, by, bz).normalize()); };
    const arcV = (out, a, b, u, h) => { out.lerpVectors(a, b, u); out.y += h * Math.sin(Math.PI * u); return out; };
    // ---- counter run, cabinets, sink ----
    const cabM = M.std('#2f5a44', { roughness: 0.55 }), inM = M.std('#24372d', { roughness: 0.8 }), topM = M.std('#dccab0', { roughness: 0.45 }), steel = M.std('#c9d0d6', { metalness: 0.85, roughness: 0.25 });
    box(1.18, 0.05, 0.64, topM, [1.49, 0.885, -1.3]); box(0.21, 0.05, 0.64, topM, [2.625, 0.885, -1.3]);
    [[2.3, -1.54, 0.44, 0.16], [2.3, -1.05, 0.44, 0.14]].forEach(([x, z, w, d]) => box(w, 0.05, d, topM, [x, 0.885, z]));
    box(0.55, 0.78, 0.03, cabM, [1.175, 0.43, -0.985]); box(0.6, 0.78, 0.03, cabM, [2.385, 0.43, -0.985]);
    box(0.03, 0.82, 0.62, cabM, [2.685, 0.43, -1.3]); box(0.03, 0.82, 0.62, cabM, [0.915, 0.43, -1.3]); box(1.8, 0.07, 0.02, inM, [1.8, 0.035, -0.975]);
    [1.38, 2.14].forEach((x) => mesh(new T3.BoxGeometry(0.02, 0.16, 0.02), chrome, D, [x, 0.7, -0.955]));
    box(0.44, 0.012, 0.34, steel, [2.3, 0.704, -1.29]); [[2.3, -1.455, 0.44, 0.012], [2.3, -1.125, 0.44, 0.012], [2.084, -1.29, 0.012, 0.34], [2.516, -1.29, 0.012, 0.34]].forEach(([x, z, w, d]) => box(w, 0.18, d, steel, [x, 0.795, z]));
    mesh(new T3.CircleGeometry(0.035, 24), M.std('#1b1d20'), D, [2.3, 0.712, -1.29], [-Math.PI / 2, 0, 0]);
    mesh(new T3.CylinderGeometry(0.018, 0.022, 0.3, 14), chrome, D, [2.3, 1.06, -1.55]); mesh(new T3.TorusGeometry(0.1, 0.014, 10, 24, Math.PI), chrome, D, [2.3, 1.21, -1.45], [0, Math.PI / 2, 0]);
    mesh(new T3.CylinderGeometry(0.04, 0.04, 0.02, 12), chrome, D, [2.3, 0.92, -1.55]);
    const wM = new T3.MeshStandardMaterial({ color: '#dfeefa', transparent: true, opacity: 0.55, roughness: 0.05, emissive: new T3.Color('#ffffff'), emissiveIntensity: 0.25 });
    const stream = mesh(new T3.CylinderGeometry(0.008, 0.01, 1, 10, 1, true), wM, D, [2.3, 1.12, -1.35]); stream.castShadow = false;
    const dropMs = [...Array(8)].map(() => new T3.MeshStandardMaterial({ color: '#7a5a2a', transparent: true, opacity: 0.9, roughness: 0.1 }));
    const dropsW = dropMs.map((m) => { const s = mesh(new T3.SphereGeometry(0.009, 8, 6), m, D, [2.3, 0.9, -1.35]); s.castShadow = false; return s; });
    // ---- dishwasher: open tub, door lying forward, rack pulled out with dirty dishes, filter at the front of the tub floor ----
    const DW = new T3.Group(); DW.position.set(1.75, 0, -1.3); D.add(DW);
    const tubM = M.std('#e6eaee', { metalness: 0.35, roughness: 0.4 }), dwM = M.std('#dfe3e8', { metalness: 0.6, roughness: 0.3 });
    const db = (w, h, d, m, x, y, z) => mesh(new T3.BoxGeometry(w, h, d), m, DW, [x, y, z]);
    db(0.02, 0.8, 0.58, tubM, -0.29, 0.43, 0); db(0.02, 0.8, 0.58, tubM, 0.29, 0.43, 0); db(0.6, 0.8, 0.02, tubM, 0, 0.43, -0.28); db(0.6, 0.02, 0.58, tubM, 0, 0.06, 0);
    const HG = new T3.Group(); HG.position.set(0, 0.08, 0.29); HG.rotation.x = 1.53; DW.add(HG);
    mesh(rbox(0.6, 0.76, 0.045, 0.01), dwM, HG, [0, 0.38, 0]); mesh(rbox(0.5, 0.62, 0.01, 0.005), steel, HG, [0, 0.38, -0.028]); mesh(rbox(0.12, 0.08, 0.012, 0.004), M.std('#9aa3ad', { metalness: 0.7, roughness: 0.4 }), HG, [0.14, 0.52, -0.036]);
    const RK = new T3.Group(); RK.position.set(1.75, 0.135, -0.66); D.add(RK);
    const wire = M.std('#5d6670', { metalness: 0.8, roughness: 0.35 });
    [-0.22, -0.11, 0, 0.11, 0.22].forEach((x) => mesh(new T3.BoxGeometry(0.008, 0.008, 0.5), wire, RK, [x, 0, 0]));
    [-0.25, -0.125, 0, 0.125, 0.25].forEach((z) => mesh(new T3.BoxGeometry(0.46, 0.008, 0.008), wire, RK, [0, 0, z]));
    [-0.23, 0.23].forEach((x) => { mesh(new T3.BoxGeometry(0.008, 0.008, 0.5), wire, RK, [x, 0.09, 0]); [-0.25, 0.25].forEach((z) => mesh(new T3.BoxGeometry(0.008, 0.09, 0.008), wire, RK, [x, 0.045, z])); });
    const dirtA = new T3.MeshStandardMaterial({ color: '#6b4318', roughness: 0.85, transparent: true }), dirtB = new T3.MeshStandardMaterial({ color: '#b08a3c', roughness: 0.8, transparent: true });
    [[-0.16, 0.0], [0.0, -0.1], [0.16, 0.0]].forEach(([x, z]) => {
      const G = new T3.Group(); G.position.set(x, 0.1, z); G.rotation.x = 1.05; RK.add(G);
      mesh(new T3.CylinderGeometry(0.095, 0.07, 0.012, 24), M.std('#fbfaf6', { roughness: 0.25 }), G, [0, 0, 0]); mesh(new T3.CylinderGeometry(0.06, 0.06, 0.004, 20), M.std('#eef0ea', { roughness: 0.3 }), G, [0, 0.0065, 0]);
      for (let i = 0; i < 7; i++) { const a = MC.rnd(i + x * 10, 5) * 6.28, r = MC.rnd(i + x * 10, 6) * 0.055; mesh(new T3.CircleGeometry(0.008 + MC.rnd(i + x * 10, 7) * 0.012, 10), i % 2 ? dirtA : dirtB, G, [Math.cos(a) * r, 0.0092, Math.sin(a) * r], [-Math.PI / 2, 0, 0]); }
    });
    mesh(new T3.CylinderGeometry(0.04, 0.034, 0.09, 18), M.std('#c0392b', { roughness: 0.3 }), RK, [0, 0.055, 0.15]); mesh(new T3.CircleGeometry(0.032, 16), dirtA, RK, [0, 0.1, 0.15], [-Math.PI / 2, 0, 0]);
    const sludgeM = new T3.MeshStandardMaterial({ color: '#5b4a2c', roughness: 0.2, transparent: true, opacity: 0.8, depthWrite: false });
    const sludge = mesh(new T3.CircleGeometry(0.21, 28), sludgeM, D, [1.75, 0.073, -1.2], [-Math.PI / 2, 0, 0]); sludge.castShadow = false;
    const bits = [[-0.1, -0.1], [0.12, -0.04], [-0.14, 0.06], [0.08, 0.1], [0.0, -0.16]].map(([x, z]) => { const m = mesh(new T3.SphereGeometry(0.02, 8, 6), M.std('#4a3416', { roughness: 0.9 }), D, [1.75 + x, 0.078, -1.2 + z]); m.scale.set(1, 0.4, 1); return m; });
    const F = new T3.Group(); D.add(F);
    mesh(new T3.CylinderGeometry(0.05, 0.05, 0.05, 20), M.std('#9fb8c9', { roughness: 0.5 }), F, [0, 0, 0]);
    mesh(new T3.TorusGeometry(0.05, 0.006, 8, 24), M.std('#ff9d2e', { roughness: 0.4 }), F, [0, 0.025, 0], [Math.PI / 2, 0, 0]); mesh(rbox(0.07, 0.016, 0.02, 0.005), M.std('#ff9d2e', { roughness: 0.4 }), F, [0, 0.045, 0]);
    const gunk = mesh(new T3.SphereGeometry(0.046, 14, 10), M.std('#3a2810', { roughness: 0.9 }), F, [0, 0.026, 0]); gunk.scale.set(1, 0.4, 1);
    const ring = mesh(new T3.TorusGeometry(0.075, 0.004, 6, 32), new T3.MeshBasicMaterial({ color: new T3.Color(2.6, 1.3, 0.2), transparent: true, opacity: 0, depthWrite: false, blending: T3.AdditiveBlending }), D, [1.75, 0.09, -1.2], [Math.PI / 2, 0, 0]); ring.castShadow = false;
    const tubL = new T3.PointLight('#fff4e0', 1.4, 3); tubL.position.set(1.75, 0.6, -1.0); D.add(tubL);
    const stinks = [...Array(7)].map(() => { const s = new T3.Sprite(new T3.SpriteMaterial({ map: cloud, color: '#8fb83a', transparent: true, depthWrite: false, opacity: 0 })); s.scale.setScalar(0.3); D.add(s); return s; });
    const sparks = [...Array(9)].map(() => { const s = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, color: new T3.Color(1.6, 1.4, 0.8) })); s.scale.setScalar(0.001); D.add(s); return s; });
    // ---- tenant + phone ----
    const TN = k.fig(D, '#3f8fd2', 2.45, 0, -0.5, 0.95, '#2b1d16');
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    // ---- timing / state ----
    const vTN = () => new T3.Vector3(2.45, 0, -0.5);
    const B0 = new T3.Vector3(1.75, 0.095, -1.2), L0 = new T3.Vector3(1.75, 0.36, -1.2), S0 = new T3.Vector3(2.3, 0.99, -1.35);
    const tG = K.twist, tL = K.twist + 0.55, tR = Math.max(K.rinse - 0.35, tL + 0.4), tRo = Math.max(K.back - 0.55, tR + 0.75), tB = tRo + 0.5, tD = tB + 0.45;
    const _f = new T3.Vector3(); let fry = 0;
    const filt = (t) => {
      if (t < tG) { _f.copy(B0); fry = 0; }
      else if (t < tL) { const u = E.io(seg(t, tG, tL - tG)); _f.lerpVectors(B0, L0, u); fry = -2.1 * u; }
      else if (t < tR) { arcV(_f, L0, S0, E.io(seg(t, tL, tR - tL)), 0.22); fry = -2.1; }
      else if (t < tRo) { _f.copy(S0); _f.x += 0.01 * Math.sin(t * 9); fry = -2.1 + 0.4 * Math.sin(t * 6); }
      else if (t < tB) { arcV(_f, S0, L0, E.io(seg(t, tRo, tB - tRo)), 0.22); fry = -2.1; }
      else if (t < tD) { const u = E.io(seg(t, tB, tD - tB)); _f.lerpVectors(L0, B0, u); fry = -2.1 * (1 - u); }
      else { _f.copy(B0); fry = 0; }
    };
    const _a = new T3.Vector3();
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(-0.12, 5.0, 1.4, 2.15, 0.62, -1.0, 29)],
      [K.write - 0.1, P(-0.1, 4.8, 1.4, 2.15, 0.62, -1.0, 29), E.lin],
      [K.write + 0.5, P(-0.05, 3.7, 1.5, 2.3, 0.8, -0.9, 27), A6],
      [K.turn + 0.3, P(0.06, 9.4, 2.6, 1.6, 1.0, -0.6), A6],
      [K.filter - 0.5, P(0.0, 9.2, 2.6, 1.6, 1.0, -0.6), E.lin],
      [K.filter + 0.2, P(0.12, 2.5, 1.55, 1.75, 0.3, -1.15, 24), A9],
      [tL, P(0.12, 2.5, 1.55, 1.75, 0.3, -1.15, 24), E.lin],
      [tR + 0.1, P(-0.05, 1.9, 1.35, 2.3, 0.95, -1.3, 24), A6],
      [tRo - 0.05, P(-0.05, 1.9, 1.35, 2.3, 0.95, -1.3, 24), E.lin],
      [tB + 0.1, P(0.12, 2.5, 1.55, 1.75, 0.3, -1.15, 24), A9],
      [K.clean - 0.2, P(0.12, 2.5, 1.55, 1.75, 0.3, -1.15, 24), E.lin],
      [K.clean + 0.6, P(0.12, 3.8, 1.5, 1.9, 0.6, -1.1, 27), A6],
      [K.save + 0.5, P(0.3, 3.9, 1.5, 2.1, 0.8, -0.9), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, -0.5, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3();
    k.frame((t) => {
      const g = k.grade; g.temp = 0.03; g.th = 1.6; g.bloom = 0.4; g.sat = 1.04;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      const cl = E.io(seg(t, K.clean - 0.1, 0.5));
      dirtA.opacity = dirtB.opacity = 1 - cl; sludgeM.opacity = 0.8 * (1 - cl); bits.forEach((m) => { m.visible = cl < 0.99; });
      // filter, hand, gunk, stream
      filt(t); F.position.copy(_f); F.rotation.y = fry;
      const wash = E.io(seg(t, tR + 0.15, Math.max(0.3, tRo - tR - 0.2))); gunk.scale.set(1 - wash, 0.4 * (1 - wash), 1 - wash); gunk.visible = wash < 0.98;
      const appear = E.io(seg(t, tG - 0.4, 0.4)), leave = E.io(seg(t, tD, 0.4)), off = (1 - appear) + leave;
      HD.visible = t > tG - 0.4 && t < tD + 0.45;
      if (HD.visible) { _a.copy(_f); _a.y += 0.085; _a.x += 0.45 * off; _a.y += 0.3 * off; _a.z += 0.5 * off; handAt(_a, 0.5, 0.62, 0.6); }
      const rin = E.io(seg(t, tR, 0.2)) * (1 - E.io(seg(t, tRo, 0.2)));
      stream.visible = rin > 0.02; stream.scale.set(1, 0.16, 1);
      dropsW.forEach((m, i) => { const u = (t * 2.6 + i / 8) % 1; m.visible = rin > 0.02; m.position.set(2.3 + (MC.rnd(i, 2) - 0.5) * 0.06, 0.95 - u * 0.17, -1.35 + (MC.rnd(i, 3) - 0.5) * 0.04); const c = dropMs[i].color; c.setRGB(lerp(0.48, 0.8, wash), lerp(0.35, 0.9, wash), lerp(0.16, 1, wash)); });
      const rg = E.io(seg(t, K.filter, 0.3)) * (1 - E.io(seg(t, K.twist - 0.1, 0.25))); ring.material.opacity = 0.9 * rg * (0.6 + 0.4 * Math.sin(t * 9));
      // stink clouds drift out of the tub; sparkles on the clean machine
      const st = 1 - E.io(seg(t, K.back + 0.1, 0.9));
      stinks.forEach((s, i) => { const u = (t * 0.35 + i / 7) % 1; s.position.set(1.75 + 0.18 * Math.sin(t * 1.7 + i * 2.3), 0.5 + u * 0.5, -1.0 + u * 0.8); s.scale.setScalar(0.25 + u * 0.35); s.material.opacity = st * 0.34 * Math.sin(Math.PI * u); });
      sparks.forEach((s, i) => { const u = seg(t, K.clean + i * 0.06, 0.6); s.position.set(1.35 + 0.8 * MC.rnd(i, 1), 0.3 + 0.5 * MC.rnd(i, 2), -1.2 + 0.9 * MC.rnd(i, 3)); s.scale.setScalar(0.001 + 0.22 * Math.sin(Math.PI * u)); });
      // tenant: pinches the nose, texts, watches, cheers
      const dis = E.io(seg(t, 0.15, 0.3)) * (1 - E.io(seg(t, K.write - 1.0, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.ans + 0.9, 0.25)));
      const joy = MC.spring(t, K.clean + 0.1, 2.4, 0.35) * (1 - E.io(seg(t, K.save + 0.4, 0.3)));
      const face = lerp(lerp(-2.36, 0.2, E.io(seg(t, K.write - 1.0, 0.4))), -2.36, E.io(seg(t, K.ans + 0.9, 0.3)));
      k.drive(TN, t, vTN, { face, nod: 0.25 * phoneUp - 0.1 * dis, lean: -0.08 * dis - 0.1 * joy, squash: 0, armL: joy > 0.02 ? -0.4 - 2.4 * joy : -0.2, armR: joy > 0.02 ? -0.4 - 2.4 * joy : (-0.25 - 1.9 * dis - 1.2 * phoneUp) });
      k.face(TN, t, { wide: 0.1, o: 0.6 * dis, smile: joy > 0.1 ? 1 : 0.05, closed: 0.6 * dis });
      TN.visible = !(t > K.filter + 0.25 && t < K.clean - 0.1);
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 2.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const hook = ov('tdhook', S.hook); tl.set(hook, { xPercent: -50, autoAlpha: 1 }, 0); tl.fromTo(hook, { scale: 1.12 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' }, 0); k.popOut(hook, K.write - 0.12, { y: -60 });
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.filter - 0.5); k.popOut(m2, K.filter - 0.44);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.filter - 0.3);
    cd.line(0, K.filter + 0.1); cd.line(1, K.twist); cd.line(2, K.clean);
    k.popOut(cd.c, K.save - 0.12, { y: -80 });
    const t1 = ov('tdtag warn', S.t1); k.popIn(t1, K.stinks + 0.05, { y: 30 }); k.popOut(t1, K.write - 0.45, { y: -40 });
    const t2 = ov('tdtag warn', S.t2); k.popIn(t2, K.dirty + 0.05, { y: 30 }); k.popOut(t2, K.write - 0.45, { y: -40 });
    const fT = ov('tdtag warn', S.f); k.popIn(fT, K.filter + 0.05, { y: 30 }); k.popOut(fT, K.twist - 0.2, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.twist - 0.05, { y: 30 }); k.popOut(s1, tR - 0.1, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, tR + 0.05, { y: 30 }); k.popOut(s2, tRo - 0.1, { y: -40 });
    const s3 = ov('tdtag step', S.s3); k.popIn(s3, tB, { y: 30 }); k.popOut(s3, K.clean - 0.2, { y: -40 });
    const okT = ov('tdtag ok', S.cln); k.popIn(okT, K.clean + 0.05, { y: 40 }); k.popOut(okT, K.save - 0.1, { y: -40 });
    const sv = ov('tdsave', S.sv); tl.set(sv, { xPercent: -50, rotation: -3 }, 0); k.popIn(sv, K.save + 0.05, { y: 60 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 450, 1450) + 'px'; };
      at(t1, new T3.Vector3(1.75, 0.75, -0.9), 300, 780, -140); at(t2, new T3.Vector3(1.75, 0.3, -0.6), 300, 780, -60);
      at(fT, new T3.Vector3(1.75, 0.3, -1.2), 300, 780, -170); at(s1, new T3.Vector3(1.75, 0.4, -1.2), 300, 780, -190);
      at(s2, new T3.Vector3(2.3, 1.1, -1.3), 300, 780, -190); at(s3, new T3.Vector3(1.75, 0.4, -1.2), 300, 780, -190); at(okT, new T3.Vector3(1.75, 0.5, -1.0), 300, 780, -150);
    });
    sfx('gurgle', 0.1, -15); sfx('errbeep', K.stinks + 0.1, -16); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12);
    sfx('click', K.filter + 0.15, -10); sfx('unscrew', K.twist + 0.05, -6); sfx('whoosh', tL, -15); sfx('flow', tR + 0.05, -9); sfx('whoosh', tRo + 0.05, -15);
    sfx('click', tD - 0.1, -8); sfx('chime', K.clean, -9); sfx('kaching', K.save + 0.1, -12);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
