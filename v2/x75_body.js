    // ---- X75: toilet full to the rim, plunger seated and pumped, water drains away ----
    mirFog.visible = false;
    const TO = new T3.Group(); TO.position.set(-1.7, 0, -1.32); D.add(TO);
    const cerD = new T3.MeshStandardMaterial({ color: '#fbfbf9', roughness: 0.18, side: T3.DoubleSide });
    mesh(new T3.CylinderGeometry(0.17, 0.115, 0.36, 28, 1, true), cerD, TO, [0, 0.18, 0]);
    mesh(new T3.CylinderGeometry(0.133, 0.09, 0.3, 28, 1, true), new T3.MeshStandardMaterial({ color: '#eef0f0', roughness: 0.2, side: T3.DoubleSide }), TO, [0, 0.215, 0]);
    mesh(new T3.CircleGeometry(0.09, 24), M.std('#e4e8ea', { roughness: 0.3 }), TO, [0, 0.07, 0], [-Math.PI / 2, 0, 0]);
    mesh(new T3.TorusGeometry(0.155, 0.028, 10, 32), M.std('#fbfbf9', { roughness: 0.18 }), TO, [0, 0.375, 0], [Math.PI / 2, 0, 0]);
    mesh(new T3.CylinderGeometry(0.1, 0.12, 0.04, 24), cerD, TO, [0, 0.02, 0]);
    mesh(rbox(0.4, 0.36, 0.16, 0.02), M.std('#fbfbf9', { roughness: 0.2 }), TO, [0, 0.68, -0.2]); mesh(rbox(0.42, 0.03, 0.18, 0.012), M.std('#fbfbf9', { roughness: 0.18 }), TO, [0, 0.875, -0.2]); mesh(new T3.CylinderGeometry(0.03, 0.03, 0.012, 20), chrome, TO, [0, 0.895, -0.2]);
    mesh(rbox(0.2, 0.2, 0.12, 0.02), M.std('#f4f4f1', { roughness: 0.25 }), TO, [0, 0.14, -0.14]);
    const waterM = new T3.MeshStandardMaterial({ color: '#5fb2ea', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.78, emissive: new T3.Color('#1c5a8a'), emissiveIntensity: 0.25, side: T3.DoubleSide });
    const water = mesh(new T3.CylinderGeometry(0.132, 0.095, 1, 28), waterM, TO, [0, 0.2, 0]); water.castShadow = false;
    const ripM = new T3.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false });
    const rips = [0, 1, 2].map(() => { const m = mesh(new T3.TorusGeometry(1, 0.05, 6, 32), ripM.clone(), TO, [0, 0.3, 0], [Math.PI / 2, 0, 0]); m.castShadow = false; return m; });
    const drops = [...Array(12)].map(() => { const m = mesh(new T3.SphereGeometry(0.012, 8, 6), new T3.MeshStandardMaterial({ color: '#cbe9ff', roughness: 0.05, transparent: true, opacity: 0.9 }), D, [0, -5, 0]); m.castShadow = false; return m; });
    // plunger
    const PL = new T3.Group(); D.add(PL);
    const rubber = M.std('#c8352c', { roughness: 0.55 });
    mesh(new T3.SphereGeometry(0.078, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), rubber, PL, [0, 0, 0]).material.side = T3.DoubleSide;
    mesh(new T3.CylinderGeometry(0.022, 0.032, 0.05, 14), rubber, PL, [0, 0.09, 0]); mesh(new T3.CylinderGeometry(0.011, 0.011, 0.55, 10), M.std('#c9a06a', { roughness: 0.7 }), PL, [0, 0.4, 0]);
    // ---- tenant (pyjamas) + phone ----
    const TN = k.fig(D, '#e8b98f', -1.12, 0, -0.8, 0.95, '#7a3b1e');
    const pjM = M.std('#8fb6e0', { roughness: 0.9 }); mesh(new T3.CylinderGeometry(0.218, 0.24, 0.62, 24, 1, true), pjM, TN.userData.B, [0, 0.45, 0]); mesh(new T3.TorusGeometry(0.2, 0.03, 8, 24), pjM, TN.userData.B, [0, 0.76, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const P0 = new T3.Vector3(-1.12, 0, -0.8), P1 = new T3.Vector3(-1.4, 0, -0.85);
    const vTN = (t) => P0.clone().lerp(P1, E.io(seg(t, K.seat - 0.6, 0.4)));
    // ---- state ----
    const FULL = 0.362, NORM = 0.17, PERIOD = 0.5, PT0 = K.seat + 0.35;
    const pumping = (t) => t > PT0 && t < K.drain + 0.1 ? 1 : 0;
    const stroke = (t) => pumping(t) * Math.abs(Math.sin((t - PT0) / PERIOD * Math.PI));
    const lvl = (t) => lerp(0.27, FULL, E.io(seg(t, 0.2, 1.9))) - (FULL - NORM) * E.io(seg(t, K.drain, Math.max(0.9, K.free - K.drain + 0.5)));
    const fly = (t) => antMove(t, K.seat - 0.6, 0.5, 0, 1, 1.1), sink = (t) => antMove(t, K.seat - 0.1, 0.35, 0, 1, 1.1) * (1 - antMove(t, K.free - 0.05, 0.35, 0, 1, 1.1));
    const back = (t) => antMove(t, K.free + 0.5, 0.5, 0, 1, 1.1);
    const RST = new T3.Vector3(-2.15, 0, -1.0), HOV = new T3.Vector3(-1.7, 0.6, -1.3);
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.15, 1.7, 1.5, -1.7, 0.3, -1.3, 28)],
      [K.full - 0.05, P(0.12, 1.25, 1.5, -1.7, 0.3, -1.28, 26), E.io],
      [K.full + 0.55, PT(0.2, 2.3, 1.3, 1.05, 21, 0.03), A9],
      [K.write - 0.3, PT(0.2, 2.4, 1.28, 1.03, 22), E.lin],
      [K.write + 0.2, PT(0.3, 1.7, 1.42, 1.0, 26), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 0.1, 1.15, -0.55), A6],
      [K.seat - 0.9, P(0.0, 9.2, 2.6, 0.1, 1.15, -0.55), E.lin],
      [K.seat - 0.2, P(-0.25, 1.9, 1.15, -1.7, 0.45, -1.3, 28), A9],
      [K.pump, P(-0.25, 1.6, 1.0, -1.7, 0.38, -1.3, 25), E.io],
      [K.free, P(-0.22, 1.55, 0.95, -1.7, 0.33, -1.3, 25), A6],
      [K.no + 0.35, P(0.3, 3.0, 1.5, -1.45, 0.9, -1.0), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3();
    k.frame((t) => {
      const g = k.grade; g.temp = -0.3 + 0.35 * E.io(seg(t, K.free, 0.6)); g.th = 1.6; g.bloom = 0.35; g.vig = 0.4; g.exp = 0.9; g.sat = 1.0;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      // water: rises to the rim, wobbles under the plunger, swirls down
      const st = stroke(t), L = lvl(t) + 0.013 * st + 0.003 * Math.sin(t * 6);
      water.scale.y = Math.max(1e-3, L - 0.08); water.position.y = 0.08 + (L - 0.08) / 2;
      const sw = E.io(seg(t, K.drain, 0.2)) * (1 - E.io(seg(t, K.free + 0.3, 0.3)));
      rips.forEach((m, i) => { const a = ((t * 1.1 + i / 3) % 1); const r = 0.12 * (1 - a * 0.8); m.position.y = L + 0.002; m.scale.setScalar(Math.max(1e-3, r)); m.rotation.z = t * 3 + i * 2.1; m.material.opacity = 0.7 * sw * Math.sin(a * Math.PI); });
      drops.forEach((m, i) => { const a = (((t - PT0) / PERIOD + i / drops.length) % 1 + 1) % 1, on = pumping(t) && a < 0.7; if (!on) { m.position.y = -5; return; } const ang = i * 2.4, rr = 0.03 + 0.13 * a; m.position.set(TO.position.x + Math.cos(ang) * rr, 0.37 + 0.14 * Math.sin(a / 0.7 * Math.PI), TO.position.z + Math.sin(ang) * rr); });
      // plunger: grabbed, carried over the bowl, seated, pumped, withdrawn
      const f = fly(t), s = sink(t), bk = back(t);
      const yDown = lerp(HOV.y, 0.11, s) + 0.075 * st * s;
      if (bk > 0.001) PL.position.set(lerp(HOV.x, RST.x, bk), lerp(HOV.y, 0, bk), lerp(HOV.z, RST.z, bk));
      else PL.position.set(lerp(RST.x, HOV.x, f), lerp(0, yDown, f), lerp(RST.z, HOV.z, f));
      PL.rotation.z = 0.06 * Math.sin(t * 12) * st;
      // tenant: sleepy → annoyed → phone → grabs the plunger and works → relief
      const annoy = E.io(seg(t, K.full, 0.1)) * (1 - E.io(seg(t, K.full + 0.9, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.seat - 0.9, 0.25)));
      const work = E.io(seg(t, K.seat - 0.4, 0.3)) * (1 - E.io(seg(t, K.free + 0.2, 0.3)));
      const joy = MC.spring(t, K.free + 0.3, 2.4, 0.35) * (1 - E.io(seg(t, K.no, 0.3)));
      const face = lerp(lerp(-2.3, 0.15, antMove(t, K.full + 0.05, 0.25, 0, 1, 1.2)), -2.5, E.io(seg(t, K.seat - 0.9, 0.3)));
      k.drive(TN, t, vTN, {
        face, squash: -0.08 * Math.exp(-Math.pow((t - (K.full + 0.12)) / 0.07, 2)), nod: 0.25 * phoneUp + 0.3 * work, lean: 0.3 * work - 0.1 * joy, lift: -0.1 * work * st,
        armL: joy > 0.02 ? -0.4 - 2.2 * joy : (t < K.full ? -2.0 + 0.15 * Math.sin(t * 6) : -0.2 - 1.15 * work),
        armR: joy > 0.02 ? -0.4 - 2.2 * joy : -0.25 - 1.2 * phoneUp - 1.15 * work,
        armLz: t < K.full ? 0.6 : 0,
      });
      k.face(TN, t, { wide: 0.5 * annoy, o: 0.3 * annoy, smile: joy > 0.1 ? 1 : 0.1, closed: t < K.full ? 0.3 : 0 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.seat - 0.45); k.popOut(m2, K.seat - 0.39);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.seat - 0.3);
    cd.line(0, K.seat + 0.1); cd.line(1, K.pump); cd.line(2, K.drain);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const eT = ov('tdtag warn', S.err); k.popIn(eT, 0.55, { y: 30 }); k.popOut(eT, K.write - 0.3, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.seat - 0.05, { y: 30 }); k.popOut(s1, K.pump - 0.12, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.pump - 0.05, { y: 30 }); k.popOut(s2, K.drain - 0.12, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(eT, new T3.Vector3(-1.7, 0.7, -1.3), 240, 840, -60); at(s1, new T3.Vector3(-1.7, 0.95, -1.4), 240, 840, -50); at(s2, new T3.Vector3(-1.7, 0.95, -1.4), 240, 840, -50); at(okT, new T3.Vector3(-1.5, 2.0, -1.0));
    });
    sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12); sfx('refresh', K.seat - 0.5, -14);
    sfx('thud', K.seat + 0.25, -11); for (let tc = PT0 + PERIOD * 0.5; tc < K.drain + 0.05; tc += PERIOD) sfx('plop', tc, -9);
    sfx('gurgle', K.pump, -12, { dur: Math.max(0.8, K.drain - K.pump) }); sfx('drain', K.drain, -9, { dur: 1.6 }); sfx('chime', K.free + 0.1, -12); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
