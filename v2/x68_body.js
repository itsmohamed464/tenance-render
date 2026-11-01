    // ---- X68: shower tray water, drain cover, hair clog, drain strip, hot rinse ----
    mirFog.visible = false;
    const DR = new T3.Vector3(-2.66, 0.092, -1.0);
    const strM = new T3.MeshStandardMaterial({ color: '#dfeefa', transparent: true, opacity: 0.45, roughness: 0.05, emissive: new T3.Color('#ffffff'), emissiveIntensity: 0.25 });
    const stream = mesh(new T3.CylinderGeometry(0.075, 0.03, 1, 16, 1, true), strM, D, [-2.6, 1.0, -1.12]); stream.castShadow = false;
    const drops = [...Array(26)].map(() => { const m = mesh(new T3.SphereGeometry(0.009, 6, 4), strM, D, [0, -5, 0]); m.castShadow = false; return m; });
    const watM = new T3.MeshStandardMaterial({ color: '#b6c6cf', roughness: 0.06, metalness: 0.25, transparent: true, opacity: 0.8 });
    const wat = mesh(new T3.PlaneGeometry(1.12, 1.0), watM, D, [-2.66, 0.096, -1.06], [-Math.PI / 2, 0, 0]); wat.castShadow = false;
    const foam = [...Array(16)].map((_, i) => mesh(new T3.CircleGeometry(0.01 + MC.rnd(i, 1) * 0.022, 10), M.std('#ffffff', { roughness: 0.6 }), D, [-3.15 + MC.rnd(i, 2) * 0.95, 0.1, -1.5 + MC.rnd(i, 3) * 0.9], [-Math.PI / 2, 0, 0]));
    const edgeW = mesh(new T3.PlaneGeometry(1.12, 0.07), watM, D, [-2.66, 0.055, -0.513]); edgeW.castShadow = false;
    const puddle = mesh(new T3.CircleGeometry(0.42, 32), watM, D, [-2.5, 0.004, -0.28], [-Math.PI / 2, 0, 0]); puddle.castShadow = false;
    const swirlT = cvs(256, 256, (x, w) => { x.translate(w / 2, w / 2); for (let a = 0; a < 3; a++) { x.rotate(Math.PI * 2 / 3); x.beginPath(); for (let i = 0; i < 60; i++) { const r = 4 + i * 2, an = i * 0.16; x.lineTo(Math.cos(an) * r, Math.sin(an) * r); } x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 6; x.stroke(); } });
    const swM = new T3.MeshBasicMaterial({ map: swirlT, transparent: true, opacity: 0, blending: T3.AdditiveBlending, depthWrite: false });
    const swirl = mesh(new T3.PlaneGeometry(0.36, 0.36), swM, D, [DR.x, 0.1, DR.z], [-Math.PI / 2, 0, 0]); swirl.castShadow = false;
    // drain cover (lifts off), dark hole, hair clump, green drain strip
    const cover = new T3.Group(); D.add(cover);
    mesh(new T3.CylinderGeometry(0.066, 0.066, 0.012, 28), chrome, cover, [0, 0.006, 0]);
    for (let i = 0; i < 5; i++) mesh(new T3.BoxGeometry(0.09, 0.014, 0.008), M.std('#2a2e33'), cover, [0, 0.009, -0.04 + i * 0.02]);
    mesh(new T3.CircleGeometry(0.052, 24), M.std('#101214'), D, [DR.x, DR.y + 0.002, DR.z], [-Math.PI / 2, 0, 0]);
    const hairM = M.std('#3b2a1e', { roughness: 0.95 });
    const hair = new T3.Group(); D.add(hair);
    [[0, 0, 0, 0.03], [0.02, -0.01, 0.01, 0.025], [-0.02, 0.005, -0.01, 0.024], [0.01, 0.02, -0.015, 0.02], [-0.01, -0.025, 0.012, 0.022]].forEach(([x, y, z, r]) => mesh(new T3.SphereGeometry(r, 10, 8), hairM, hair, [x, y, z]));
    for (let i = 0; i < 14; i++) mesh(new T3.CylinderGeometry(0.0022, 0.0022, 0.08 + MC.rnd(i, 4) * 0.09, 4), hairM, hair, [(MC.rnd(i, 1) - 0.5) * 0.05, -0.04 - MC.rnd(i, 2) * 0.04, (MC.rnd(i, 3) - 0.5) * 0.05], [MC.rnd(i, 5) - 0.5, 0, MC.rnd(i, 6) - 0.5]);
    const strip = new T3.Group(); D.add(strip); const stripM = M.std('#3ec46b', { roughness: 0.4 });
    mesh(new T3.BoxGeometry(0.026, 0.56, 0.004), stripM, strip, [0, 0.28, 0]);
    for (let i = 0; i < 9; i++) mesh(new T3.BoxGeometry(0.042, 0.006, 0.004), stripM, strip, [0, 0.02 + i * 0.03, 0], [0, 0, i % 2 ? 0.5 : -0.5]);
    mesh(new T3.TorusGeometry(0.03, 0.006, 6, 16), stripM, strip, [0, 0.59, 0]);
    const ringM2 = new T3.MeshBasicMaterial({ color: new T3.Color(2.6, 0.9, 0.4), transparent: true, opacity: 0, depthWrite: false, blending: T3.AdditiveBlending });
    const hiRing = mesh(new T3.TorusGeometry(0.11, 0.005, 6, 40), ringM2, D, [DR.x, DR.y + 0.012, DR.z], [Math.PI / 2, 0, 0]); hiRing.castShadow = false;
    const steam = [...Array(10)].map(() => { const s = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, transparent: true, depthWrite: false, opacity: 0, color: new T3.Color(1.1, 1.1, 1.15) })); D.add(s); return s; });
    // ---- tenant (bathrobe) + phone ----
    const TN = k.fig(D, '#e8b98f', -2.95, 0, -0.3, 0.95, '#2b1d16');
    const robeM = M.std('#f3f1ea', { roughness: 0.92 }); mesh(new T3.CylinderGeometry(0.22, 0.25, 0.6, 24, 1, true), robeM, TN.userData.B, [0, 0.46, 0]); mesh(new T3.TorusGeometry(0.205, 0.035, 8, 24), robeM, TN.userData.B, [0, 0.76, 0], [Math.PI / 2, 0, 0]);
    mesh(new T3.TorusGeometry(0.235, 0.018, 6, 24), M.std('#7fb3a6'), TN.userData.B, [0, 0.4, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const POS = new T3.Vector3(-2.95, 0, -0.3); const vTN = () => POS.clone();
    // ---- state ----
    const lev = (t) => t < K.drain - 0.05 ? 0.2 + 0.8 * E.io(seg(t, 0, K.rise + 0.4)) : 1 - E.ic(seg(t, K.drain - 0.05, 1.1));
    const showerOn = (t) => t < K.rise + 0.5 || (t > K.rinse - 0.05 && t < K.drain + 0.7);
    const lift = (t) => antMove(t, K.s1 - 0.05, 0.35, 0, 1, 1.2) * (1 - antMove(t, K.drain + 0.5, 0.3, 0, 1, 1.2));
    const sIn = (t) => antMove(t, K.s2 - 0.6, 0.3, 0, 1, 1.1), sPull = (t) => antMove(t, K.s2 + 0.05, 0.4, 0, 1, 1.2);
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.35, 2.0, 1.55, -2.62, 0.3, -1.0, 28)],
      [K.rise - 0.1, P(0.3, 1.45, 0.9, -2.65, 0.12, -0.9, 24), E.io],
      [K.rise + 0.45, PT(0.55, 2.4, 1.3, 1.0, 22, 0.03), A9],
      [K.write - 0.3, PT(0.55, 2.5, 1.28, 1.0, 22), E.lin],
      [K.write + 0.2, PT(0.5, 1.8, 1.42, 1.0, 26), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 0.1, 1.15, -0.55), A6],
      [K.hair - 0.3, P(0.0, 9.2, 2.6, 0.1, 1.15, -0.55), E.lin],
      [K.hair + 0.15, P(0.25, 1.25, 0.95, -2.66, 0.1, -1.0, 28), A9],
      [K.s1 + 0.1, P(0.2, 1.1, 0.85, -2.66, 0.12, -1.0, 28), E.io],
      [K.s2 + 0.1, P(0.3, 1.15, 0.85, -2.66, 0.3, -1.0, 26), A6],
      [K.rinse + 0.4, P(0.35, 1.7, 1.35, -2.65, 0.4, -1.0, 28), E.io],
      [K.drain - 0.05, P(0.3, 1.35, 1.05, -2.66, 0.1, -1.0, 26), A6],
      [K.no + 0.35, P(0.5, 2.8, 1.6, -2.8, 0.95, -0.45), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3();
    k.frame((t) => {
      const g = k.grade; g.temp = 0.18 - 0.22 * E.io(seg(t, K.rise, 0.3)) * (1 - E.io(seg(t, K.drain, 0.5))); g.th = 1.6; g.bloom = 0.35; g.sat = 1.04;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      // water level in the tray, overflow at the edge, puddle on the floor
      const L = lev(t), wy = 0.094 + 0.006 * L;
      wat.position.y = wy; watM.opacity = 0.25 + 0.6 * L; wat.visible = L > 0.02; wat.scale.set(0.35 + 0.65 * Math.min(1, L * 1.6), 0.35 + 0.65 * Math.min(1, L * 1.6), 1);
      foam.forEach((m, i) => { m.visible = L > 0.3; m.position.y = wy + 0.001; const a0 = MC.rnd(i, 4) * 6.28 + (t > K.drain ? (t - K.drain) * (3 + 6 * (t - K.drain)) : t * 0.1), r0 = (0.08 + MC.rnd(i, 5) * 0.4) * (t > K.drain ? Math.max(0, 1 - (t - K.drain) * 0.8) : 1); m.position.x = DR.x + Math.cos(a0) * r0; m.position.z = DR.z - 0.05 + Math.sin(a0) * r0 * 0.9; });
      const over = E.io(seg(t, K.rise - 0.2, 0.5)) * (1 - E.io(seg(t, K.drain + 0.2, 0.6)));
      edgeW.visible = over > 0.02; edgeW.scale.y = over; puddle.visible = over > 0.02; puddle.scale.setScalar(0.3 + 0.7 * E.io(seg(t, K.rise - 0.1, 1.2)));
      // shower stream + splash drops
      const on = showerOn(t); stream.visible = on; stream.scale.y = 2.0 - wy; stream.position.y = (2.04 + wy) / 2;
      drops.forEach((m, i) => { const life = 0.45, a = ((t / life + MC.rnd(i, 1)) % 1); if (!on) { m.position.y = -5; return; } const an = MC.rnd(i, 2) * 6.28, r0 = 0.05 + a * 0.25; m.position.set(-2.6 + Math.cos(an) * r0, wy + 0.02 + Math.sin(a * Math.PI) * 0.18, -1.1 + Math.sin(an) * r0); });
      steam.forEach((s, i) => { const a = ((t * 0.5 + MC.rnd(i, 1)) % 1), hot = t > K.rinse - 0.05 && t < K.drain + 1.2 ? 1 : 0; s.material.opacity = hot * 0.22 * Math.sin(a * Math.PI); s.position.set(-2.66 + (MC.rnd(i, 2) - 0.5) * 0.7, 0.2 + a * 1.4, -1.05 + (MC.rnd(i, 3) - 0.5) * 0.6); s.scale.setScalar(0.35 + a * 0.6); });
      swM.opacity = t > K.drain - 0.05 ? 0.7 * Math.min(1, (t - K.drain + 0.05) * 4) * (L > 0.03 ? 1 : 0) : 0; swirl.rotation.z = -(t > K.drain ? (t - K.drain) * 9 : 0); swirl.position.y = wy + 0.002;
      // cover lifts and lands beside the drain; strip goes in and pulls the hair out
      const lf = lift(t); cover.position.set(DR.x + 0.2 * lf, DR.y + 0.16 * Math.sin(lf * Math.PI), DR.z + 0.16 * lf); cover.rotation.z = 0.6 * Math.sin(lf * Math.PI);
      ringM2.opacity = E.io(seg(t, K.hair - 0.05, 0.3)) * (0.6 + 0.4 * Math.sin(t * 10)) * (1 - E.io(seg(t, K.s2 - 0.2, 0.2)));
      const si = sIn(t), sp = sPull(t), sVis = t > K.s2 - 0.65 && t < K.rinse + 0.15;
      strip.visible = sVis; strip.position.set(DR.x, DR.y + 0.55 - 0.62 * si + 0.62 * sp, DR.z); strip.rotation.z = 0.05 * Math.sin(t * 7) * sp;
      if (t < K.s2 + 0.05) { hair.position.set(DR.x, DR.y - 0.005, DR.z); hair.visible = lf > 0.3; hair.rotation.set(0, t * 0.2, 0); }
      else { hair.visible = t < K.rinse + 0.15; hair.position.set(DR.x + 0.01 * Math.sin(t * 9), strip.position.y - 0.02, DR.z); hair.rotation.z = 0.25 * Math.sin(t * 8); }
      // tenant: watching the water → shock → phone → kneel at the tray → work → joy
      const shock = E.io(seg(t, K.rise, 0.08)) * (1 - E.io(seg(t, K.rise + 0.8, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.hair - 0.5, 0.25)));
      const kneel = 0;
      const work = kneel * (t > K.s1 - 0.1 && t < K.rinse + 0.5 ? 1 : 0);
      const joy = MC.spring(t, K.drain + 0.5, 2.4, 0.35);
      const sq = -0.13 * Math.exp(-Math.pow((t - (K.rise + 0.12)) / 0.07, 2));
      const face = lerp(lerp(2.75, 0.45, antMove(t, K.rise + 0.02, 0.25, 0, 1, 1.2)), 2.75, E.io(seg(t, K.hair - 0.6, 0.3))) + (t > K.drain + 0.3 ? lerp(0, 0.45 - 2.75, E.io(seg(t, K.drain + 0.3, 0.35))) : 0);
      k.drive(TN, t, vTN, {
        face, squash: sq, tilt: t < K.rise ? 0.03 * Math.sin(t * 2) : 0, nod: t < K.rise ? 0.35 : 0.25 * phoneUp - 0.1 * shock + 0.3 * kneel,
        lift: -0.22 * kneel, lean: 0.45 * kneel - 0.12 * joy,
        armL: shock > 0.5 ? -2.7 : (joy > 0.02 ? -0.4 - 2.4 * joy : -0.2 - 1.0 * work + 0.15 * work * Math.sin(t * 11)),
        armR: shock > 0.5 ? -2.7 : (joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 1.2 * phoneUp - 1.1 * work - 0.2 * work * Math.sin(t * 11)),
      });
      k.face(TN, t, { wide: shock, o: shock * 0.9, smile: joy > 0.1 ? 1 : 0.15 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.hair - 0.45); k.popOut(m2, K.hair - 0.39);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.hair - 0.3);
    cd.line(0, K.hair + 0.2); cd.line(1, K.s2 + 0.1); cd.line(2, K.drain + 0.25);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const eT = ov('tdtag warn', '⚠️ ' + S.err); k.popIn(eT, K.hair + 0.25, { y: 30 }); k.popOut(eT, K.s1 - 0.1, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.s1 - 0.05, { y: 30 }); k.popOut(s1, K.s2 - 0.15, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.s2 - 0.1, { y: 30 }); k.popOut(s2, K.drain - 0.12, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(eT, new T3.Vector3(DR.x, 0.2, DR.z), 240, 840, -140); at(s1, new T3.Vector3(DR.x + 0.2, 0.3, DR.z + 0.15), 240, 840, -120); at(s2, new T3.Vector3(DR.x, 0.75, DR.z), 240, 840, -60); at(okT, new T3.Vector3(-2.95, 2.25, -0.3));
    });
    sfx('shower', 0, -14, { dur: K.rise + 0.5 }); sfx('gurgle', K.rise - 0.2, -7); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12);
    sfx('refresh', K.hair, -14); sfx('click', K.s1, -9); sfx('gurgle', K.s1 + 0.2, -15); sfx('plop', K.s2 + 0.25, -5);
    sfx('shower', K.rinse - 0.05, -15, { dur: K.drain - K.rinse + 0.7 }); sfx('drain', K.drain - 0.08, -4); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
