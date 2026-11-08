    // ---- X85: shower water stands around the ankles, hair clogs the drain: lift the cover, pull out the hair, rinse, it drains ----
    kettle.visible = false;
    D.children.filter((o) => o.isMesh && o.geometry.type === 'PlaneGeometry' && o.material.blending === T3.AdditiveBlending).forEach((o) => { o.visible = false; });
    // drain cover with hair poking through, hair clump under it, standing water, swirl, shower spray
    const DRN = new T3.Vector3(-2.66, 0.1, -1.0), ASD = new T3.Vector3(-2.25, 0.11, -0.7);
    const COVR = new T3.Group(); COVR.position.copy(DRN); D.add(COVR);
    mesh(new T3.CylinderGeometry(0.075, 0.075, 0.012, 24), chrome, COVR, [0, 0, 0]);
    [0, 1, 2, 3, 4].forEach((i) => mesh(new T3.BoxGeometry(0.1, 0.004, 0.008), M.std('#2a2d31'), COVR, [0, 0.007, -0.03 + i * 0.015]));
    const hairM = M.std('#3b2a1e', { roughness: 0.8 });
    const strands = new T3.Group(); COVR.add(strands);
    for (let i = 0; i < 9; i++) { const m = mesh(new T3.CylinderGeometry(0.0035, 0.0035, 0.05 + MC.rnd(i, 3) * 0.04, 5), hairM, strands, [(MC.rnd(i, 1) - 0.5) * 0.09, 0.016, (MC.rnd(i, 2) - 0.5) * 0.09]); m.rotation.set(Math.PI / 2 + (MC.rnd(i, 4) - 0.5) * 0.5, 0, (MC.rnd(i, 5) - 0.5) * 3.0); }
    const HC = new T3.Group(); D.add(HC); HC.visible = false;
    for (let i = 0; i < 12; i++) mesh(new T3.SphereGeometry(0.018 + MC.rnd(i, 6) * 0.018, 8, 6), hairM, HC, [(MC.rnd(i, 1) - 0.5) * 0.06, (MC.rnd(i, 2) - 0.5) * 0.05, (MC.rnd(i, 3) - 0.5) * 0.06]);
    for (let i = 0; i < 14; i++) { const m = mesh(new T3.CylinderGeometry(0.0032, 0.0032, 0.11 + MC.rnd(i, 8) * 0.08, 5), hairM, HC, [(MC.rnd(i, 1) - 0.5) * 0.05, -0.05 - MC.rnd(i, 9) * 0.03, (MC.rnd(i, 2) - 0.5) * 0.05]); m.rotation.set((MC.rnd(i, 4) - 0.5) * 0.6, 0, (MC.rnd(i, 5) - 0.5) * 0.6); }
    const WL = mesh(new T3.BoxGeometry(1.1, 1, 0.98), new T3.MeshStandardMaterial({ color: '#9fd3f0', roughness: 0.08, transparent: true, opacity: 0.5, depthWrite: false }), D, [-2.66, 0.13, -1.06]); WL.castShadow = false;
    const swirlT = cvs(256, 256, (x, w) => { x.translate(w / 2, w / 2); for (let a = 0; a < 3; a++) { x.rotate((Math.PI * 2) / 3); x.beginPath(); for (let i = 0; i < 60; i++) { const r = 4 + i * 2, an = i * 0.16; x.lineTo(Math.cos(an) * r, Math.sin(an) * r); } x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 6; x.stroke(); } });
    const swM = new T3.MeshBasicMaterial({ map: swirlT, transparent: true, opacity: 0, blending: T3.AdditiveBlending, depthWrite: false });
    const swirl = mesh(new T3.PlaneGeometry(0.34, 0.34), swM, D, [-2.66, 0.14, -1.0], [-Math.PI / 2, 0, 0]); swirl.castShadow = false;
    const spray = [...Array(30)].map((_, i) => { const m = mesh(new T3.CylinderGeometry(0.0035, 0.0035, 0.16, 5), new T3.MeshBasicMaterial({ color: '#d8efff', transparent: true, opacity: 0.7, depthWrite: false }), D, [-2.6 + (MC.rnd(i, 1) - 0.5) * 0.34, 1.0, -1.18 + (MC.rnd(i, 2) - 0.5) * 0.22]); m.castShadow = false; return m; });
    // ---- tenant in a bathrobe, standing in the tray; phone ----
    const TN = k.fig(D, '#e8b98f', -3.1, 0.09, -0.95, 0.95, '#7a3b1e');
    const swM2 = M.std('#eef4f2', { roughness: 0.95 }); mesh(new T3.CylinderGeometry(0.218, 0.24, 0.58, 24, 1, true), swM2, TN.userData.B, [0, 0.48, 0]); mesh(new T3.TorusGeometry(0.2, 0.034, 8, 24), swM2, TN.userData.B, [0, 0.77, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    // ---- timing / state ----
    const vTN = () => new T3.Vector3(-3.1, 0.09, -0.95);
    const level = (t) => 0.075 * (1 - E.io(seg(t, K.rinse + 0.35, K.drains - K.rinse + 0.7)));
    const sprayOn = (t) => (t < K.write - 0.3 ? 1 : (t > K.rinse - 0.15 && t < K.rinse + 1.0 ? 1 : 0));
    const coverU = (t) => E.io(seg(t, K.lift, 0.7)) - E.io(seg(t, K.drains - 0.2, 0.6));
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(-0.05, 4.6, 1.3, -2.65, 0.95, -1.0, 28)],
      [K.stand + 0.5, P(-0.05, 4.4, 1.3, -2.65, 0.95, -1.0, 28), E.lin],
      [K.ankles - 0.1, P(0.2, 2.0, 0.6, -2.7, 0.2, -1.0, 24), A9],
      [K.write - 0.1, P(0.2, 2.0, 0.6, -2.7, 0.2, -1.0, 24), E.lin],
      [K.write + 0.4, PT(0.35, 2.2, 1.3, 0.95, 25), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, -1.0, 1.0, -0.4), A6],
      [K.hair - 0.5, P(0.0, 9.2, 2.6, -1.0, 1.0, -0.4), E.lin],
      [K.hair + 0.2, P(0.3, 2.4, 1.2, -2.85, 0.35, -1.0, 24), A9],
      [K.rinse - 0.3, P(0.3, 2.4, 1.2, -2.85, 0.35, -1.0, 24), E.lin],
      [K.rinse + 0.4, P(0.1, 3.0, 1.2, -2.7, 0.6, -1.0, 27), A6],
      [K.no + 0.35, P(0.3, 3.2, 1.35, -2.7, 0.9, -1.0), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, -1.0, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3(), HW = new T3.Vector3();
    k.frame((t) => {
      const g = k.grade; g.temp = 0.02; g.th = 1.6; g.bloom = 0.4; g.sat = 1.04;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      // water + swirl + spray
      const lv = level(t); WL.scale.y = Math.max(0.001, lv); WL.position.y = 0.09 + lv / 2; WL.visible = lv > 0.004;
      swM.opacity = 0.9 * E.io(seg(t, K.rinse + 0.3, 0.3)) * (1 - E.io(seg(t, K.drains + 0.7, 0.5))); swirl.position.y = 0.09 + lv + 0.005; swirl.rotation.z = -t * 6; swirl.scale.setScalar(0.4 + 0.6 * lv / 0.075);
      const so = sprayOn(t); spray.forEach((m, i) => { const u = ((t * (1.8 + MC.rnd(i, 3)) + MC.rnd(i, 4)) % 1); m.visible = so > 0; m.position.y = 2.0 - u * 1.85; });
      // cover lifts aside, hair clump follows the hand, cover returns
      const cu = coverU(t); COVR.position.set(lerp(DRN.x, ASD.x, cu), lerp(DRN.y, ASD.y, cu) + 0.14 * Math.sin(cu * Math.PI), lerp(DRN.z, ASD.z, cu)); strands.visible = cu < 0.15 && t < K.drains;
      const pull = E.io(seg(t, K.pull, 0.6)), held = t > K.pull - 0.05 && t < K.drains + 0.2;
      TN.userData.hand.getWorldPosition(HW);
      HC.visible = t > K.lift + 0.3 && t < K.drains + 0.2; HC.position.set(lerp(DRN.x, HW.x, pull), lerp(DRN.y + 0.02, HW.y - 0.03, pull), lerp(DRN.z, HW.z, pull));
      // tenant: stands in the water, phone, lifts the cover, pulls hair (grossed out), rinses, relief
      const look = E.io(seg(t, K.stand - 0.3, 0.3)) * (1 - E.io(seg(t, K.write - 0.9, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.hair - 0.9, 0.25)));
      const kneel = E.io(seg(t, K.hair - 0.5, 0.4)) * (1 - E.io(seg(t, K.rinse + 0.2, 0.5)));
      const yuck = E.io(seg(t, K.pull + 0.2, 0.3)) * (1 - E.io(seg(t, K.rinse - 0.1, 0.3)));
      const joy = MC.spring(t, K.drains + 0.5, 2.4, 0.35) * (1 - E.io(seg(t, K.no, 0.3)));
      const face = lerp(lerp(0.15, 0.3, E.io(seg(t, K.write - 1.0, 0.4))), Math.PI * 0.5, E.io(seg(t, K.hair - 0.9, 0.3)));
      k.drive(TN, t, vTN, {
        face, nod: 0.3 * phoneUp + 0.2 * look + 0.25 * kneel, lean: 0.18 * kneel - 0.1 * joy, lift: -0.12 * kneel, squash: 0,
        armL: joy > 0.02 ? -0.4 - 2.4 * joy : -0.2 - 0.9 * kneel,
        armR: joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 1.2 * phoneUp - 1.5 * kneel - 0.5 * yuck + 0.2 * kneel * Math.sin(t * 8),
      });
      k.face(TN, t, { wide: 0.5 * yuck + 0.2 * look, o: 0.3 * yuck, smile: joy > 0.1 ? 1 : 0.05, closed: 0 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.8 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.hair - 0.5); k.popOut(m2, K.hair - 0.44);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.hair - 0.3);
    cd.line(0, K.hair + 0.1); cd.line(1, K.lift); cd.line(2, K.drains);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const wT = ov('tdtag warn', S.wat); k.popIn(wT, K.stand + 0.2, { y: 30 }); k.popOut(wT, K.write - 0.5, { y: -40 });
    const hT = ov('tdtag warn', S.hr); k.popIn(hT, K.hair + 0.05, { y: 30 }); k.popOut(hT, K.lift - 0.2, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.lift - 0.05, { y: 30 }); k.popOut(s1, K.pull - 0.12, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.pull - 0.05, { y: 30 }); k.popOut(s2, K.rinse - 0.12, { y: -40 });
    const s3 = ov('tdtag step', S.s3); k.popIn(s3, K.rinse - 0.05, { y: 30 }); k.popOut(s3, K.drains - 0.2, { y: -40 });
    const dT = ov('tdtag ok', S.dr); k.popIn(dT, K.drains + 0.05, { y: 40 }); k.popOut(dT, K.no - 0.1, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(wT, new T3.Vector3(-2.66, 0.15, -1.0), 300, 780, -150); at(hT, new T3.Vector3(-2.66, 0.12, -1.0), 300, 780, -160);
      [s1, s2, s3].forEach((e) => at(e, new T3.Vector3(-2.66, 0.12, -1.0), 300, 780, -160)); at(dT, new T3.Vector3(-2.66, 0.12, -1.0), 300, 780, -160); at(okT, new T3.Vector3(-2.2, 1.6, -1.0));
    });
    sfx('errbeep', K.stand + 0.1, -16); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12); sfx('refresh', K.hair - 0.1, -14);
    sfx('click', K.lift + 0.1, -8); sfx('thud', K.pull + 0.4, -13); sfx('refresh', K.rinse, -10); sfx('chime', K.drains, -9); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
