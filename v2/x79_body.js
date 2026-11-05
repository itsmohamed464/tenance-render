    // ---- X79: balcony floods in the rain, drain strainer full of leaves: remove leaves, clean strainer, flush with water ----
    mirFog.visible = false; sky.visible = false; sunG.visible = false;
    const BX = 1.5, BZ = -0.1;
    mesh(rbox(2.0, 0.08, 1.1, 0.02), M.std('#9d9d98', { roughness: 0.85 }), D, [BX, 0.04, BZ + 0.1]);
    mesh(rbox(2.0, 1.3, 0.08, 0.02), M.std('#e9dfcf', { roughness: 0.9 }), D, [BX, 0.65, -0.56]);
    mesh(rbox(0.06, 1.3, 1.1, 0.02), M.std('#e9dfcf', { roughness: 0.9 }), D, [BX - 1.0, 0.65, BZ + 0.1]);
    [0, 5].forEach((i) => mesh(new T3.CylinderGeometry(0.016, 0.016, 0.9, 8), chrome, D, [BX - 0.95 + i * 0.38, 0.53, 0.55]));
    mesh(new T3.PlaneGeometry(1.9, 0.82), new T3.MeshPhysicalMaterial({ color: '#e6f4ff', roughness: 0.04, transparent: true, opacity: 0.1, depthWrite: false, side: T3.DoubleSide, clearcoat: 1 }), D, [BX, 0.49, 0.55]).castShadow = false;
    mesh(new T3.CylinderGeometry(0.02, 0.02, 1.9, 10), chrome, D, [BX, 0.98, 0.55], [0, 0, Math.PI / 2]);
    const pot = new T3.Group(); pot.position.set(BX + 0.8, 0.08, -0.35); D.add(pot); mesh(new T3.CylinderGeometry(0.1, 0.075, 0.18, 16), M.std('#c86b3c'), pot, [0, 0.09, 0]); mesh(new T3.SphereGeometry(0.11, 12, 10), M.std('#3f7d4a', { roughness: 0.9 }), pot, [0, 0.26, 0]);
    // drain + strainer + puddle
    const DR = new T3.Vector3(BX, 0.09, BZ);
    const strM = M.std('#6b6258', { roughness: 0.8 }); const strainer = mesh(new T3.CylinderGeometry(0.08, 0.08, 0.02, 24), strM, D, [DR.x, DR.y, DR.z]);
    const puddleM = new T3.MeshStandardMaterial({ color: '#8fb8d8', roughness: 0.05, transparent: true, opacity: 0.6, depthWrite: false });
    const puddle = mesh(new T3.CircleGeometry(0.55, 40), puddleM, D, [DR.x, 0.086, DR.z], [-Math.PI / 2, 0, 0]); puddle.castShadow = false;
    const rip = [0, 1, 2].map(() => { const m = mesh(new T3.TorusGeometry(1, 0.03, 6, 32), new T3.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }), D, [DR.x, 0.09, DR.z], [Math.PI / 2, 0, 0]); m.castShadow = false; return m; });
    // leaves (pile on the strainer + scattered), bucket
    const LC = ['#c8602a', '#d9962b', '#a8442a', '#c9a227', '#8a5a2b'];
    const leaves = [...Array(26)].map((_, i) => { const r = i < 18 ? 0.02 + 0.09 * MC.rnd(i, 1) : 0.15 + 0.3 * MC.rnd(i, 1), an = MC.rnd(i, 2) * 6.28; const m = mesh(new T3.BoxGeometry(0.075, 0.004, 0.05), M.std(LC[i % 5], { roughness: 0.9 }), D, [DR.x + Math.cos(an) * r, 0.1 + (i < 18 ? 0.012 * (i % 4) : 0), DR.z + Math.sin(an) * r], [0, an, 0.1 * (i % 3)]); m.userData = { x0: m.position.x, y0: m.position.y, z0: m.position.z, i }; return m; });
    const bucket = new T3.Group(); bucket.position.set(BX - 0.55, 0.08, BZ + 0.15); D.add(bucket); mesh(new T3.CylinderGeometry(0.14, 0.1, 0.22, 20, 1, true), new T3.MeshStandardMaterial({ color: '#2f7fd0', roughness: 0.5, side: T3.DoubleSide }), bucket, [0, 0.11, 0]); mesh(new T3.CircleGeometry(0.1, 20), M.std('#2f7fd0'), bucket, [0, 0.01, 0], [-Math.PI / 2, 0, 0]);
    // rain streaks
    const rain = [...Array(46)].map((_, i) => { const m = mesh(new T3.CylinderGeometry(0.0025, 0.0025, 0.22, 4), new T3.MeshBasicMaterial({ color: new T3.Color(0.6, 0.9, 1.4), transparent: true, opacity: 0, depthWrite: false }), D, [BX - 0.95 + MC.rnd(i, 1) * 1.9, 1, -0.5 + MC.rnd(i, 2) * 1.0]); m.castShadow = false; m.userData.ph = MC.rnd(i, 3); return m; });
    // jug + stream
    const JG = new T3.Group(); D.add(JG);
    mesh(new T3.CylinderGeometry(0.06, 0.05, 0.17, 20), new T3.MeshPhysicalMaterial({ color: '#dff0ff', roughness: 0.05, transparent: true, opacity: 0.4, depthWrite: false, clearcoat: 1 }), JG, [0, 0, 0]).castShadow = false;
    mesh(new T3.CylinderGeometry(0.052, 0.046, 0.12, 20), new T3.MeshStandardMaterial({ color: '#58b0ee', transparent: true, opacity: 0.8, roughness: 0.05 }), JG, [0, -0.02, 0]).castShadow = false;
    mesh(new T3.TorusGeometry(0.04, 0.008, 8, 16, Math.PI), M.std('#f3f3ef'), JG, [0.07, 0, 0], [0, 0, -Math.PI / 2]);
    const sM = new T3.MeshBasicMaterial({ color: new T3.Color(0.7, 1.5, 2.2), transparent: true, opacity: 0, depthWrite: false }); const stream = mesh(new T3.CylinderGeometry(0.007, 0.007, 1, 8), sM, D, [DR.x, 0.5, DR.z]); stream.castShadow = false;
    // ---- tenant (raincoat) + phone ----
    const TN = k.fig(D, '#f0b84a', 0.9, 0.08, 0.2, 0.95, '#7a3b1e');
    const coat = M.std('#f0b84a', { roughness: 0.6 }); mesh(new T3.CylinderGeometry(0.222, 0.245, 0.58, 24, 1, true), coat, TN.userData.B, [0, 0.48, 0]); mesh(new T3.TorusGeometry(0.2, 0.034, 8, 24), coat, TN.userData.B, [0, 0.77, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const POS = new T3.Vector3(0.9, 0.08, 0.2); const vTN = () => POS.clone();
    // ---- state ----
    const rainOn = (t) => 1 - E.io(seg(t, K.flush, 0.5));
    const pudS = (t) => lerp(0.3, 1.0, E.io(seg(t, 0.3, 1.8))) * (1 - E.io(seg(t, K.flush + 0.3, Math.max(0.9, K.dry - K.flush - 0.1))));
    const pour = (t) => antMove(t, K.flush - 0.35, 0.45, 0, 1, 1.1) * (1 - antMove(t, K.dry - 0.3, 0.4, 0, 1, 1.1));
    const dryF = (t) => E.io(seg(t, K.dry - 0.1, 0.6));
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.3, 2.5, 1.0, BX, 0.3, BZ, 27)],
      [K.leaves - 0.3, P(0.25, 1.4, 0.8, BX, 0.12, BZ, 24), E.io],
      [K.leaves + 1.0, PT(0.4, 2.4, 1.3, 1.05, 21, 0.03), A9],
      [K.write - 0.3, PT(0.4, 2.4, 1.28, 1.03, 22), E.lin],
      [K.write + 0.2, PT(0.45, 1.8, 1.42, 1.0, 26), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 0.8, 1.15, -0.3), A6],
      [K.remove - 0.8, P(0.0, 9.2, 2.6, 0.8, 1.15, -0.3), E.lin],
      [K.remove - 0.2, P(0.3, 1.7, 0.95, BX - 0.1, 0.18, BZ, 25), A9],
      [K.flush + 0.1, P(0.3, 2.0, 1.1, BX - 0.05, 0.38, BZ, 27), A6],
      [K.dry + 0.2, P(0.2, 2.7, 1.3, BX, 0.3, BZ, 28), E.io],
      [K.no + 0.35, P(0.3, 3.0, 1.5, 1.2, 0.9, -0.3), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3();
    k.frame((t) => {
      const df = dryF(t), g = k.grade; g.temp = -0.35 + 0.6 * df; g.th = 1.6; g.bloom = 0.35; g.sat = 0.98 + 0.08 * df;
      sun.intensity = lerp(0.35, 1.9, df); keyL.intensity = lerp(0.35, 0.7, df);
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      const ps = pudS(t); puddle.scale.setScalar(Math.max(1e-3, ps)); puddle.visible = ps > 0.01;
      const ro = rainOn(t); rain.forEach((m) => { const a = (((t * 1.7 + m.userData.ph) % 1) + 1) % 1; m.position.y = 1.5 - a * 1.42; m.material.opacity = 0.55 * ro; });
      rip.forEach((m, i) => { const a = ((t * 0.9 + i / 3) % 1); m.scale.setScalar(Math.max(1e-3, (0.05 + a * 0.4) * ps)); m.material.opacity = 0.35 * ro * (1 - a) * (ps > 0.05 ? 1 : 0); m.position.y = 0.09; });
      // leaves are scooped into the bucket one after another
      leaves.forEach((m) => { const i = m.userData.i, t0 = K.remove + 0.05 + i * ((K.strainer - K.remove - 0.5) / 26), a = clamp((t - t0) / 0.5, 0, 1);
        if (a <= 0) { m.visible = true; return; } if (a >= 1) { m.visible = false; return; }
        m.visible = true; const e = E.io(a); m.position.set(lerp(m.userData.x0, bucket.position.x, e), m.userData.y0 + 0.28 * Math.sin(a * Math.PI) + (bucket.position.y + 0.2 - m.userData.y0) * e, lerp(m.userData.z0, bucket.position.z, e)); m.rotation.z = a * 5; });
      strainer.material = strM; strM.color.set('#6b6258').lerp(new T3.Color('#e3e8ec'), E.io(seg(t, K.strainer + 0.1, 0.5)));
      // jug flushes water through the strainer
      const pr = pour(t); JG.visible = pr > 0.02; JG.position.set(BX + 0.12, 0.5 - 0.1 * (1 - pr), BZ); JG.rotation.z = 1.15 * pr; JG.scale.setScalar(Math.max(1e-3, Math.min(1, pr * 3)));
      const sp = JG.localToWorld(tmp.set(-0.075, 0.07, 0)); const top = sp.y, bot = 0.1; stream.visible = pr > 0.5; stream.scale.y = Math.max(1e-3, top - bot); stream.position.set(sp.x, (top + bot) / 2, sp.z); sM.opacity = pr > 0.5 ? 0.85 * (0.8 + 0.2 * Math.sin(t * 40)) : 0;
      // tenant: reads the puddle -> phone -> kneels, scoops leaves, cleans, flushes -> relief
      const worry = E.io(seg(t, 0.4, 0.3)) * (1 - E.io(seg(t, K.write - 0.8, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.remove - 0.9, 0.25)));
      const kneel = E.io(seg(t, K.remove - 0.5, 0.3)) * (1 - E.io(seg(t, K.dry - 0.2, 0.3)));
      const joy = MC.spring(t, K.dry + 0.1, 2.4, 0.35) * (1 - E.io(seg(t, K.no, 0.3)));
      const face = lerp(lerp(2.09, 0.45, E.io(seg(t, K.write - 1.0, 0.4))), 2.09, E.io(seg(t, K.remove - 0.9, 0.3)));
      k.drive(TN, t, vTN, {
        face, nod: 0.25 * phoneUp + 0.25 * kneel, lean: 0.4 * kneel - 0.1 * joy, lift: -0.2 * kneel, squash: 0,
        armL: joy > 0.02 ? -0.4 - 2.4 * joy : -0.2 - 1.9 * worry - 1.1 * kneel + 0.12 * kneel * Math.sin(t * 9),
        armR: joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 1.2 * phoneUp - 1.9 * worry - 1.2 * kneel,
      });
      k.face(TN, t, { wide: 0.4 * worry, o: 0.2 * worry, smile: joy > 0.1 ? 1 : 0.05 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.remove - 0.5); k.popOut(m2, K.remove - 0.44);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.remove - 0.3);
    cd.line(0, K.remove + 0.1); cd.line(1, K.strainer); cd.line(2, K.dry);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const eT = ov('tdtag warn', S.err); k.popIn(eT, 0.55, { y: 30 }); k.popOut(eT, K.write - 0.3, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.remove - 0.05, { y: 30 }); k.popOut(s1, K.strainer - 0.12, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.strainer - 0.05, { y: 30 }); k.popOut(s2, K.flush - 0.12, { y: -40 });
    const s3 = ov('tdtag step', S.s3); k.popIn(s3, K.flush - 0.05, { y: 30 }); k.popOut(s3, K.dry - 0.15, { y: -40 });
    const dT = ov('tdtag ok', S.dry); k.popIn(dT, K.dry + 0.05, { y: 40 }); k.popOut(dT, K.no - 0.1, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(eT, new T3.Vector3(BX, 0.2, BZ), 240, 840, -80); at(s1, new T3.Vector3(BX, 0.3, BZ), 240, 840, -110); at(s2, new T3.Vector3(BX, 0.3, BZ), 240, 840, -110); at(s3, new T3.Vector3(BX, 0.3, BZ), 240, 840, -110); at(dT, new T3.Vector3(BX, 0.4, BZ), 240, 840, -60); at(okT, new T3.Vector3(1.2, 1.9, -0.3));
    });
    sfx('shower', 0.2, -20, { dur: Math.max(1, K.flush - 0.2) }); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12); sfx('refresh', K.remove - 0.5, -14);
    for (let i = 0; i < 6; i++) sfx('whoosh', K.remove + 0.1 + i * 0.18, -17);
    sfx('squeak', K.strainer + 0.1, -11); sfx('flow', K.flush - 0.1, -12, { dur: 1.3 }); sfx('drain', K.flush + 0.3, -10, { dur: 1.4 }); sfx('chime', K.dry, -11); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
