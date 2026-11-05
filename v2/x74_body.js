    // ---- X74: move-in handover: scratch in the parquet, photo + date, protocol, both sign, handshake ----
    mirFog.visible = false;
    box(1.0, 0.86, 0.6, M.std('#2f5a44', { roughness: 0.55 }), [2.2, 0.43, -1.3]); box(1.04, 0.05, 0.64, M.std('#dccab0', { roughness: 0.45 }), [2.2, 0.885, -1.3]);
    // scratch in the parquet + pulsing ring
    const SC = new T3.Vector3(1.15, 0.006, -0.1);
    const scrM2 = new T3.MeshBasicMaterial({ color: '#241308' });
    [[0.56, 0.012, 0.35, 0, 0], [0.28, 0.008, 0.45, 0.07, 0.03], [0.2, 0.007, 0.2, -0.1, -0.04]].forEach(([L, w, r, dx, dz]) => { const m = mesh(new T3.BoxGeometry(L, 0.002, w), scrM2, D, [SC.x + dx, SC.y, SC.z + dz], [0, r, 0]); m.castShadow = false; });
    const ringM = new T3.MeshBasicMaterial({ color: new T3.Color(2.4, 0.6, 0.35), transparent: true, opacity: 0, depthWrite: false, blending: T3.AdditiveBlending });
    const ring = mesh(new T3.TorusGeometry(0.4, 0.012, 6, 48), ringM, D, [SC.x, 0.012, SC.z], [Math.PI / 2, 0, 0]); ring.castShadow = false;
    // flash
    const flashL = new T3.PointLight('#ffffff', 0, 4); D.add(flashL);
    const flashS = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, color: new T3.Color(2.6, 2.6, 2.6), opacity: 0 })); flashS.scale.setScalar(0.7); D.add(flashS);
    // clipboard (appears in front of the landlord when the protocol is mentioned)
    const CB = new T3.Group(); D.add(CB);
    mesh(rbox(0.26, 0.36, 0.02, 0.01), M.std('#8b5e3c', { roughness: 0.7 }), CB, [0, 0, 0]);
    mesh(new T3.PlaneGeometry(0.22, 0.31), M.std('#fbfaf6', { roughness: 0.9 }), CB, [0, -0.005, 0.0115]).castShadow = false;
    mesh(rbox(0.08, 0.03, 0.025, 0.006), chrome, CB, [0, 0.17, 0.012]);
    const bar = (y, w, c) => { const m = new T3.Mesh(new T3.PlaneGeometry(1, 0.016), new T3.MeshBasicMaterial({ color: c })); m.position.set(-0.09, y, 0.013); m.scale.x = 1e-3; m.userData.w = w; CB.add(m); return m; };
    const bars = [bar(0.1, 0.15, '#3a4650'), bar(0.06, 0.12, '#3a4650'), bar(0.02, 0.15, '#3a4650'), bar(-0.08, 0.07, '#2f7fd0'), bar(-0.08, 0.07, '#d25a30')];
    bars[3].position.x = -0.1; bars[4].position.x = 0.01;
    // ---- tenant + landlord ----
    const TN = k.fig(D, '#d9a47c', 0.7, 0, 0.25, 0.95, '#3b2a20');
    const swM = M.std('#2f8f6a', { roughness: 0.9 }); mesh(new T3.CylinderGeometry(0.218, 0.24, 0.58, 24, 1, true), swM, TN.userData.B, [0, 0.48, 0]); mesh(new T3.TorusGeometry(0.2, 0.034, 8, 24), swM, TN.userData.B, [0, 0.77, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const LL = k.fig(D, '#3d4a5c', 1.75, 0, 0.2, 0.98, '#8d8d92');
    mesh(new T3.CylinderGeometry(0.205, 0.225, 0.5, 24, 1, true), M.std('#3d4a5c', { roughness: 0.8 }), LL.userData.B, [0, 0.5, 0]);
    mesh(new T3.BoxGeometry(0.06, 0.38, 0.02), M.std('#e8e6e0'), LL.userData.B, [0, 0.52, 0.215]); mesh(new T3.BoxGeometry(0.035, 0.3, 0.02), M.std('#b4352c'), LL.userData.B, [0, 0.5, 0.225]);
    const TP = new T3.Vector3(0.7, 0, 0.25), LP = new T3.Vector3(1.75, 0, 0.2), vT = () => TP.clone(), vL = () => LP.clone();
    // ---- state ----
    const ptr = (t) => E.io(seg(t, K.scr - 0.4, 0.4)) * (1 - E.io(seg(t, K.write - 0.5, 0.3)));
    const crouch = (t) => antMove(t, K.photo - 0.25, 0.4, 0, 1, 1.1) * (1 - antMove(t, K.date + 0.5, 0.4, 0, 1, 1.1));
    const shot = (t) => Math.exp(-Math.pow((t - (K.photo + 0.45)) / 0.07, 2));
    const cbIn = (t) => MC.spring(t, K.proto - 0.15, 2.2, 0.45);
    const sig1 = (t) => E.io(seg(t, K.sign - 0.1, 0.5)), sig2 = (t) => E.io(seg(t, K.sign + 0.5, 0.5));
    const shake = (t) => antMove(t, K.dep - 0.5, 0.45, 0, 1, 1.1);
    const bump = (t) => E.io(seg(t, K.dep - 0.9, 0.5));
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vT(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.25, 3.2, 1.3, 1.2, 0.5, -0.1, 26)],
      [K.scr - 0.4, P(0.3, 1.9, 1.0, 1.15, 0.05, -0.1, 24), E.io],
      [K.scr + 0.7, PT(0.3, 2.4, 1.3, 1.0, 22, 0.03), A9],
      [K.write + 0.2, PT(0.35, 1.8, 1.42, 1.0, 26), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 0.8, 1.15, -0.2), A6],
      [K.photo - 0.4, P(0.0, 9.2, 2.6, 0.8, 1.15, -0.2), E.lin],
      [K.photo + 0.1, P(0.35, 2.0, 1.0, 0.95, 0.35, 0.0, 26), A9],
      [K.proto - 0.15, P(0.3, 2.6, 1.3, 1.3, 0.8, 0.2, 26), A6],
      [K.sign + 0.2, P(0.15, 2.3, 1.25, 1.35, 0.85, 0.25, 24), A6],
      [K.dep - 0.1, P(0.2, 3.0, 1.35, 1.25, 0.8, 0.2, 28), A6],
      [K.dep + 0.6, P(0.25, 3.2, 1.4, 1.25, 0.9, 0.2, 28), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.8, 1.2, -0.2), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3();
    k.frame((t) => {
      const g = k.grade; g.temp = 0.1; g.th = 1.6; g.bloom = 0.35; g.sat = 1.04;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      const pt = ptr(t); ringM.opacity = pt * (0.5 + 0.35 * Math.sin(t * 7)); ring.scale.setScalar(1 + 0.08 * Math.sin(t * 7));
      // clipboard pops up in front of the landlord, lines fill in, two signatures
      const cb = cbIn(t); CB.visible = cb > 0.02; CB.scale.setScalar(Math.max(1e-3, cb)); CB.position.set(1.55, 0.95 + 0.05 * cb, 0.55); CB.rotation.set(-0.15, -0.25, 0);
      const bt = [E.io(seg(t, K.photo + 0.1, 0.3)), E.io(seg(t, K.date, 0.3)), E.io(seg(t, K.proto + 0.1, 0.3)), sig1(t), sig2(t)];
      bars.forEach((b, i) => { b.scale.x = Math.max(1e-3, b.userData.w * bt[i]); b.position.x = (i < 3 ? -0.09 : i === 3 ? -0.1 : 0.01); b.position.x += b.scale.x / 2 - (i < 3 ? 0 : 0); });
      // tenant / landlord positions (walk together for the handshake)
      const bp = bump(t); TP.set(lerp(0.7, 1.0, bp), 0, 0.25); LP.set(lerp(1.75, 1.45, bp), 0, 0.2);
      // tenant: looks at the scratch -> phone -> crouches, photo -> signs -> handshake
      const cr = crouch(t), phoneUp = (MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.photo - 0.5, 0.25)))) + cr;
      const joy = MC.spring(t, K.dep + 0.2, 2.4, 0.35);
      const faceT = lerp(lerp(lerp(2.23, 0.5, E.io(seg(t, K.write - 1.0, 0.4))), 2.23, E.io(seg(t, K.photo - 0.6, 0.3))), 1.5, E.io(seg(t, K.sign + 0.9, 0.4)));
      const writeT = sig2(t) * (1 - E.io(seg(t, K.dep - 0.5, 0.3))), sh = shake(t);
      k.drive(TN, t, vT, {
        face: faceT, nod: 0.2 * pt + 0.25 * phoneUp + 0.35 * cr, lift: -0.25 * cr, lean: 0.35 * cr - 0.1 * joy,
        armL: joy > 0.02 ? -0.4 - 2.4 * joy : -0.2,
        armR: joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 1.2 * phoneUp - 0.9 * writeT - 1.3 * sh + 0.08 * writeT * Math.sin(t * 14),
      });
      k.face(TN, t, { wide: 0.3 * pt, o: 0, smile: joy > 0.1 || sh > 0.5 ? 1 : 0.1 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      // landlord: waits, holds the clipboard, signs, handshake
      const wL = sig1(t) * (1 - sig2(t)), lj = joy;
      k.drive(LL, t, vL, {
        face: lerp(4.71, 4.6, bp), nod: 0.1 + 0.1 * wL, lean: -0.05 * lj,
        armL: -0.3 - 1.1 * cb * (1 - sh),
        armR: lj > 0.02 ? -0.4 - 2.2 * lj : -0.25 - 0.8 * wL - 1.3 * sh + 0.08 * wL * Math.sin(t * 14),
      });
      k.face(LL, t, { wide: 0, o: 0, smile: lj > 0.1 || sh > 0.5 ? 1 : 0.15 });
      // phone flash
      const fl = shot(t), hp = TN.userData.hand.localToWorld(tmp.set(0, 0.1, 0.1)); D.worldToLocal(hp);
      flashL.position.copy(hp); flashL.intensity = 14 * fl; flashS.position.copy(hp); flashS.material.opacity = fl;
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.date - 0.25); k.popOut(m2, K.date - 0.19);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.date - 0.2);
    cd.line(0, K.date); cd.line(1, K.proto); cd.line(2, K.sign + 0.1);
    k.popOut(cd.c, K.dep - 0.3, { y: -80 });
    const eT = ov('tdtag warn', S.err); k.popIn(eT, 0.5, { y: 30 }); k.popOut(eT, K.write - 0.5, { y: -40 });
    const t1 = ov('tdtag step', S.s1); k.popIn(t1, K.photo - 0.05, { y: 30 }); k.popOut(t1, K.date - 0.12, { y: -40 });
    const t2 = ov('tdtag step', S.s2); k.popIn(t2, K.date - 0.05, { y: 30 }); k.popOut(t2, K.proto - 0.12, { y: -40 });
    const t3 = ov('tdtag step', S.s3); k.popIn(t3, K.proto - 0.05, { y: 30 }); k.popOut(t3, K.sign - 0.12, { y: -40 });
    const t4 = ov('tdtag step', S.s4); k.popIn(t4, K.sign - 0.05, { y: 30 }); k.popOut(t4, K.dep - 0.3, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.dep + 0.05, { y: 40 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(eT, new T3.Vector3(SC.x, 0.2, SC.z), 240, 840, -80);
      [t1, t2].forEach((e) => at(e, new T3.Vector3(SC.x, 0.25, SC.z), 240, 840, -120)); [t3, t4].forEach((e) => at(e, new T3.Vector3(1.55, 1.3, 0.55), 240, 840, -80));
      at(okT, new T3.Vector3(1.25, 1.9, 0.2));
    });
    sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12); sfx('refresh', K.photo - 0.4, -14);
    sfx('shutter', K.photo + 0.45, -6); sfx('click', K.date + 0.1, -10); sfx('whoosh', K.proto - 0.15, -14); sfx('typing', K.sign, -10, { dur: 1.0 });
    sfx('thud', K.dep - 0.05, -12); sfx('kaching', K.dep + 0.1, -12);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
