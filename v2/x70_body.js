    // ---- X70: fridge with a working door, dial on 0, vent blocked by containers, sour milk ----
    mirFog.visible = false;
    const cabM = M.std('#2f5a44', { roughness: 0.55 }), topM = M.std('#dccab0', { roughness: 0.45 });
    box(1.0, 0.86, 0.6, cabM, [2.2, 0.43, -1.3]); box(1.04, 0.05, 0.64, topM, [2.2, 0.885, -1.3]);
    const frM = M.std('#e9edf2', { roughness: 0.3, metalness: 0.15 }), linM = M.std('#f5f7f9', { roughness: 0.5 });
    box(0.64, 1.86, 0.03, frM, [3.1, 0.93, -1.555]); box(0.03, 1.86, 0.64, frM, [2.795, 0.93, -1.25]); box(0.03, 1.86, 0.64, frM, [3.405, 0.93, -1.25]);
    box(0.64, 0.03, 0.64, frM, [3.1, 1.845, -1.25]); box(0.64, 0.06, 0.64, frM, [3.1, 0.03, -1.25]);
    box(0.58, 1.76, 0.01, linM, [3.1, 0.93, -1.535]);
    const shelfM = new T3.MeshPhysicalMaterial({ color: '#e8f4fb', roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false });
    [0.55, 0.95, 1.35].forEach((y) => box(0.57, 0.012, 0.56, shelfM, [3.1, y, -1.25]));
    // vent grille on the back wall (blocked by containers until cleared)
    for (let i = 0; i < 5; i++) box(0.22, 0.012, 0.01, M.std('#5a636b'), [3.1, 1.02 + i * 0.035, -1.528]);
    const tubs = [[3.0, 1.02, 0.2, 0.13, '#e2d6c2'], [3.2, 1.03, 0.18, 0.15, '#c9d9c4'], [3.1, 1.13, 0.24, 0.06, '#e6b8a2']].map(([x, y, w, h, c]) => { const m = mesh(rbox(w, h, 0.16, 0.02), M.std(c, { roughness: 0.5 }), D, [x, y, -1.45]); return m; });
    // milk carton + stink lines, bottles, cheese
    const milk = new T3.Group(); milk.position.set(2.95, 0.96, -1.08); D.add(milk);
    mesh(rbox(0.09, 0.2, 0.09, 0.01), M.std('#ffffff', { roughness: 0.6 }), milk, [0, 0.1, 0]); mesh(new T3.BoxGeometry(0.092, 0.05, 0.092), M.std('#3d6fb0'), milk, [0, 0.08, 0]);
    mesh(new T3.ConeGeometry(0.065, 0.06, 4), M.std('#ffffff'), milk, [0, 0.23, 0], [0, Math.PI / 4, 0]);
    const stinkM = new T3.MeshBasicMaterial({ color: new T3.Color(0.7, 1.6, 0.4), transparent: true, opacity: 0, depthWrite: false, blending: T3.AdditiveBlending, side: T3.DoubleSide });
    const stink = [0, 1, 2].map((i) => { const m = mesh(new T3.TorusGeometry(0.03, 0.004, 6, 16, Math.PI * 1.2), stinkM, D, [0, -5, 0]); m.castShadow = false; return m; });
    [[3.25, 0.56, '#2d7a3e'], [3.33, 0.56, '#7a2d2d'], [2.92, 0.56, '#d9b23a']].forEach(([x, y, c]) => mesh(new T3.CylinderGeometry(0.03, 0.035, 0.26, 14), M.std(c, { roughness: 0.2, metalness: 0.1 }), D, [x, y + 0.13, -1.3]));
    mesh(rbox(0.16, 0.07, 0.11, 0.015), M.std('#f2c14e', { roughness: 0.5 }), D, [3.22, 1.39, -1.15]);
    // thermostat dial on the right inner wall
    const dial = new T3.Group(); dial.position.set(3.37, 1.66, -1.05); D.add(dial);
    mesh(new T3.CylinderGeometry(0.034, 0.038, 0.03, 24), M.std('#2c343c', { roughness: 0.4 }), dial, [0, 0, 0], [0, 0, Math.PI / 2]);
    mesh(new T3.BoxGeometry(0.008, 0.03, 0.007), new T3.MeshBasicMaterial({ color: new T3.Color(2.2, 0.5, 0.3) }), dial, [-0.017, 0.014, 0]);
    const dialT = cvs(256, 256, (x, w) => { const c = w / 2; x.fillStyle = '#f5f7f9'; x.fillRect(0, 0, w, w); x.fillStyle = '#e3edf5'; x.beginPath(); x.arc(c, c, 124, 0, 7); x.fill(); x.strokeStyle = '#9fb3c4'; x.lineWidth = 4; x.stroke(); x.font = '800 40px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; for (let n = 0; n <= 5; n++) { const f = n * 2.2 / 4; x.fillStyle = n === 4 ? '#1f6fd1' : (n === 0 ? '#d23b2d' : '#24303a'); x.fillText(String(n), c - Math.sin(f) * 96, c - Math.cos(f) * 96); } });
    mesh(new T3.PlaneGeometry(0.15, 0.15), M.std('#ffffff', { map: dialT, roughness: 0.5 }), D, [3.388, 1.66, -1.05], [0, -Math.PI / 2, 0]).castShadow = false;
    const ringM2 = new T3.MeshBasicMaterial({ color: new T3.Color(2.6, 0.9, 0.4), transparent: true, opacity: 0, depthWrite: false, blending: T3.AdditiveBlending });
    const hiRing = mesh(new T3.TorusGeometry(0.07, 0.004, 6, 32), ringM2, D, [3.35, 1.66, -1.05], [0, Math.PI / 2, 0]); hiRing.castShadow = false;
    // interior light (warm while broken, cold blue when fixed) + frost + vent airflow
    const inL = new T3.PointLight('#ffcf8a', 0.9, 1.6); inL.position.set(3.1, 1.7, -1.15); D.add(inL);
    const bulbM = new T3.MeshBasicMaterial({ color: new T3.Color(2.2, 1.9, 1.4) }); mesh(new T3.BoxGeometry(0.12, 0.02, 0.05), bulbM, D, [3.1, 1.82, -1.2]);
    const frost = [...Array(14)].map(() => { const s = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, transparent: true, depthWrite: false, opacity: 0, color: new T3.Color(0.9, 1.2, 1.6) })); D.add(s); return s; });
    const airM = new T3.MeshBasicMaterial({ color: new T3.Color(0.6, 0.9, 1.6), transparent: true, opacity: 0, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide });
    const air = [...Array(7)].map(() => { const m = mesh(new T3.PlaneGeometry(0.012, 0.35), airM, D, [0, -5, 0], [Math.PI / 2, 0, 0]); m.castShadow = false; return m; });
    // door (hinge on the right), handle, door shelves with bottles
    const door = new T3.Group(); door.position.set(3.42, 0, -0.93); D.add(door);
    mesh(rbox(0.64, 1.84, 0.045, 0.02), frM, door, [-0.32, 0.93, 0.023]); mesh(new T3.BoxGeometry(0.03, 0.5, 0.04), chrome, door, [-0.6, 1.25, 0.07]);
    [0.6, 1.1].forEach((y) => { mesh(new T3.BoxGeometry(0.5, 0.06, 0.012), shelfM, door, [-0.32, y + 0.03, -0.075]); });
    [[-0.45, 0.6, '#c0563a'], [-0.32, 0.6, '#f2f2ee'], [-0.2, 1.1, '#3ec46b']].forEach(([x, y, c]) => mesh(new T3.CylinderGeometry(0.025, 0.028, 0.18, 12), M.std(c, { roughness: 0.3 }), door, [x, y + 0.09, -0.04]));
    // ---- tenant (hoodie) + phone ----
    const TN = k.fig(D, '#c98f6a', 2.25, 0, -0.5, 0.95, '#161011');
    const shirtM = M.std('#7a4b8a', { roughness: 0.9 }); mesh(new T3.CylinderGeometry(0.214, 0.236, 0.56, 24, 1, true), shirtM, TN.userData.B, [0, 0.48, 0]); mesh(new T3.TorusGeometry(0.2, 0.03, 8, 24), shirtM, TN.userData.B, [0, 0.76, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const POS = new T3.Vector3(2.25, 0, -0.5); const vTN = () => POS.clone();
    // ---- state ----
    const doorA = (t) => 1 * (1 - antMove(t, K.no + 0.15, 0.45, 0, 1, 1.1));
    const coldK = (t) => E.io(seg(t, K.s2 + 0.3, Math.max(0.8, K.cold - K.s2)));
    const temp = (t) => Math.round(lerp(14, 4, coldK(t)));
    const slide = (t) => antMove(t, K.s2 - 0.05, 0.4, 0, 1, 1.15);
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(-0.35, 1.95, 1.4, 3.05, 1.05, -1.1, 28)],
      [K.warm - 0.1, P(-0.2, 1.3, 1.25, 3.0, 1.08, -1.15, 24), E.io],
      [K.warm + 0.45, PT(-0.45, 2.4, 1.3, 1.0, 22, 0.03), A9],
      [K.write - 0.3, PT(-0.45, 2.5, 1.28, 1.0, 22), E.lin],
      [K.write + 0.2, PT(-0.4, 1.8, 1.42, 1.0, 26), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 0.1, 1.15, -0.55), A6],
      [K.dial - 0.3, P(0.0, 9.2, 2.6, 0.1, 1.15, -0.55), E.lin],
      [K.dial + 0.15, P(-0.85, 0.8, 1.75, 3.37, 1.64, -1.05, 26), A9],
      [K.s1 + 0.1, P(-0.78, 0.68, 1.72, 3.37, 1.65, -1.05, 26), E.io],
      [K.s2 + 0.1, P(-0.2, 1.4, 1.2, 3.1, 1.08, -1.3, 26), A6],
      [K.cold - 0.05, P(-0.3, 1.75, 1.3, 3.1, 1.0, -1.2, 28), A6],
      [K.no + 0.35, P(-0.45, 2.8, 1.6, 2.4, 0.95, -0.55), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3();
    k.frame((t) => {
      const ck = coldK(t), g = k.grade; g.temp = 0.22 - 0.5 * ck; g.th = 1.6; g.bloom = 0.35; g.sat = 1.04;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      door.rotation.y = 1.45 * doorA(t);
      inL.color.setRGB(lerp(1.0, 0.65, ck), lerp(0.8, 0.85, ck), lerp(0.55, 1.0, ck)); inL.intensity = 0.9 + 0.5 * ck;
      bulbM.color.setRGB(lerp(2.2, 1.4, ck), lerp(1.9, 1.8, ck), lerp(1.4, 2.4, ck));
      stink.forEach((m, i) => { const a = ((t * 0.6 + i / 3) % 1), on = 1 - E.io(seg(t, K.cold - 0.2, 0.5)); stinkM.opacity = 0.55 * on; m.position.set(2.95 + 0.03 * Math.sin(t * 4 + i), 1.22 + a * 0.3, -1.08); m.rotation.z = Math.sin(t * 3 + i) * 0.6; m.scale.setScalar(0.7 + a * 0.6); });
      ringM2.opacity = E.io(seg(t, K.dial - 0.05, 0.3)) * (0.6 + 0.4 * Math.sin(t * 10)) * (1 - E.io(seg(t, K.s1 + 0.4, 0.2)));
      dial.rotation.x = -2.2 * antMove(t, K.s1 - 0.05, 0.4, 0, 1, 1.15);
      const sl = slide(t); tubs.forEach((m, i) => { m.position.z = -1.45 + 0.28 * sl * (i === 2 ? 0.8 : 1); m.position.x += 0; });
      airM.opacity = 0.4 * E.io(seg(t, K.s2 + 0.25, 0.4)) * (1 - E.io(seg(t, K.no + 0.1, 0.4)));
      air.forEach((m, i) => { const a = ((t * 0.8 + MC.rnd(i, 1)) % 1); m.position.set(2.99 + MC.rnd(i, 2) * 0.22, 1.02 + MC.rnd(i, 3) * 0.16, -1.5 + a * 0.45); });
      frost.forEach((s, i) => { const a = ((t * 0.35 + MC.rnd(i, 1)) % 1); s.material.opacity = ck * 0.2 * Math.sin(a * Math.PI); s.position.set(2.85 + MC.rnd(i, 2) * 0.5, 0.15 + MC.rnd(i, 3) * 1.6 - a * 0.2, -1.45 + MC.rnd(i, 4) * 0.5 + a * 0.3); s.scale.setScalar(0.15 + a * 0.3); });
      // tenant: opens the fridge, sniffs → disgust → phone → turns the dial → clears the back wall → joy
      const sniff = E.io(seg(t, 0.6, 0.4)) * (1 - E.io(seg(t, K.warm - 0.05, 0.15)));
      const shock = E.io(seg(t, K.warm, 0.08)) * (1 - E.io(seg(t, K.warm + 0.8, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.dial - 0.45, 0.25)));
      const reachUp = E.io(seg(t, K.s1 - 0.35, 0.3)) * (1 - E.io(seg(t, K.s1 + 0.6, 0.3)));
      const work = E.io(seg(t, K.s2 - 0.35, 0.3)) * (1 - E.io(seg(t, K.s2 + 0.8, 0.3)));
      const joy = MC.spring(t, K.cold + 0.3, 2.4, 0.35);
      const sq = -0.13 * Math.exp(-Math.pow((t - (K.warm + 0.12)) / 0.07, 2));
      const face = lerp(lerp(2.05, -0.4, antMove(t, K.warm + 0.02, 0.25, 0, 1, 1.2)), 2.05, E.io(seg(t, K.dial - 0.55, 0.3))) * (1 - E.io(seg(t, K.cold + 0.2, 0.35))) - 0.4 * E.io(seg(t, K.cold + 0.2, 0.35));
      k.drive(TN, t, vTN, {
        face, squash: sq, tilt: 0, nod: 0.3 * sniff + 0.25 * phoneUp - 0.15 * shock - 0.25 * reachUp + 0.2 * work,
        lean: 0.3 * sniff + 0.35 * work - 0.12 * joy - 0.15 * shock,
        armL: shock > 0.5 ? -2.4 : (joy > 0.02 ? -0.4 - 2.4 * joy : -0.2 - 1.3 * work + 0.2 * work * Math.sin(t * 9) - 0.6 * sniff),
        armR: shock > 0.5 ? -2.4 : (joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 1.2 * phoneUp - 2.3 * reachUp - 1.3 * work - 0.2 * work * Math.sin(t * 9)),
      });
      k.face(TN, t, { wide: shock, o: shock * 0.7, smile: joy > 0.1 ? 1 : 0.1 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.dial - 0.45); k.popOut(m2, K.dial - 0.39);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.dial - 0.3);
    cd.line(0, K.dial + 0.2); cd.line(1, K.s2 + 0.05); cd.line(2, K.cold + 0.2);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const thT = ov('tdtag warn', '🌡️ 14 °C'); k.popIn(thT, K.warm - 0.2, { y: 30 }); k.popOut(thT, K.turn - 0.1, { y: -40 }); k.popIn(thT, K.s2 + 0.2, { y: 30 }); k.popOut(thT, K.no - 0.1, { y: -40 });
    const eT = ov('tdtag warn', '⚠️ ' + S.err); k.popIn(eT, K.dial + 0.25, { y: 30 }); k.popOut(eT, K.s1 - 0.1, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.s1 - 0.05, { y: 30 }); k.popOut(s1, K.s2 - 0.12, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.s2 - 0.05, { y: 30 }); k.popOut(s2, K.cold - 0.12, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      const tc = temp(t); thT.textContent = '🌡️ ' + tc + ' °C'; thT.className = 'tdtag ' + (tc > 7 ? 'warn' : 'ok');
      at(thT, new T3.Vector3(3.1, 1.5, -1.0), 240, 840, -40); at(eT, new T3.Vector3(3.37, 1.66, -1.05), 240, 840, -380); at(s1, new T3.Vector3(3.37, 1.66, -1.05), 240, 840, -380); at(s2, new T3.Vector3(3.1, 1.25, -1.3), 240, 840, -80); at(okT, new T3.Vector3(2.25, 2.3, -0.5));
    });
    sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12);
    sfx('refresh', K.dial, -14); sfx('click', K.s1 + 0.15, -8); sfx('thud', K.s2 + 0.2, -11);
    sfx('kaching', K.no + 0.1, -14); sfx('click', K.no + 0.45, -10);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
