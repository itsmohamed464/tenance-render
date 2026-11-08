    // ---- X86: toilet keeps running, the float sits too high: lift the lid, lower the float, the running stops (saves water and money) ----
    kettle.visible = false; towelH.visible = false;
    D.children.filter((o) => o.isMesh && o.geometry.type === 'PlaneGeometry' && o.material.blending === T3.AdditiveBlending).forEach((o) => { o.visible = false; });
    // toilet bowl
    const white = M.std('#f7f7f4', { roughness: 0.25 });
    mesh(new T3.CylinderGeometry(0.12, 0.15, 0.32, 24), white, D, [-1.75, 0.16, -1.28]);
    const bowl = mesh(new T3.SphereGeometry(0.2, 28, 18), white, D, [-1.75, 0.4, -1.2]); bowl.scale.set(1, 0.62, 1.35);
    const seat = mesh(new T3.TorusGeometry(0.19, 0.022, 10, 36), M.std('#fbfbf9', { roughness: 0.3 }), D, [-1.75, 0.505, -1.19], [Math.PI / 2, 0, 0]); seat.scale.set(1, 1.3, 1);
    const bw = mesh(new T3.CircleGeometry(0.15, 28), new T3.MeshStandardMaterial({ color: '#8ccaf2', roughness: 0.08, transparent: true, opacity: 0.85 }), D, [-1.75, 0.46, -1.19], [-Math.PI / 2, 0, 0]); bw.scale.set(1, 1.3, 1); bw.castShadow = false;
    const ripples = [0, 1].map(() => { const m = mesh(new T3.TorusGeometry(0.1, 0.004, 6, 28), new T3.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }), D, [-1.75, 0.463, -1.19], [Math.PI / 2, 0, 0]); m.castShadow = false; return m; });
    // cistern with a see-through front: walls, water, overflow tube, inlet valve + float, flapper, lid
    const CI = new T3.Group(); CI.position.set(-1.75, 0.75, -1.5); D.add(CI);
    [[0.025, 0.4, 0.18, -0.1775, 0, 0], [0.025, 0.4, 0.18, 0.1775, 0, 0], [0.38, 0.4, 0.02, 0, 0, -0.08], [0.38, 0.025, 0.18, 0, -0.1875, 0]].forEach(([w, h, d, x, y, z]) => mesh(rbox(w, h, d, 0.008), white, CI, [x, y, z]));
    mesh(new T3.BoxGeometry(0.38, 0.4, 0.008), new T3.MeshPhysicalMaterial({ color: '#dff1ff', roughness: 0.05, transparent: true, opacity: 0.16, depthWrite: false, clearcoat: 1 }), CI, [0, 0, 0.09]).castShadow = false;
    const wat = mesh(new T3.BoxGeometry(0.33, 1, 0.15), new T3.MeshStandardMaterial({ color: '#8ccaf2', roughness: 0.08, transparent: true, opacity: 0.55, depthWrite: false }), CI, [0, -0.1, 0.0]); wat.castShadow = false;
    mesh(new T3.CylinderGeometry(0.018, 0.018, 0.34, 10), M.std('#e9e9e4', { roughness: 0.4 }), CI, [0.1, -0.03, 0]);
    mesh(new T3.CylinderGeometry(0.012, 0.012, 0.3, 8), chrome, CI, [-0.12, -0.04, 0]); mesh(new T3.CylinderGeometry(0.03, 0.03, 0.05, 10), M.std('#2d6fd0', { roughness: 0.4 }), CI, [-0.12, 0.12, 0]);
    const flap = mesh(new T3.CylinderGeometry(0.035, 0.035, 0.012, 14), M.std('#c0392b', { roughness: 0.5 }), CI, [0.0, -0.18, 0]);
    const ball = mesh(new T3.SphereGeometry(0.045, 16, 12), M.std('#e8943a', { roughness: 0.35 }), CI, [-0.02, 0.1, 0]);
    const arm = mesh(new T3.CylinderGeometry(0.005, 0.005, 1, 6), chrome, CI, [0, 0, 0]);
    const inflow = mesh(new T3.CylinderGeometry(0.006, 0.006, 1, 6), new T3.MeshBasicMaterial({ color: new T3.Color(0.5, 1.6, 2.6) }), CI, [-0.12, 0, 0]); inflow.castShadow = false;
    const drops = [...Array(5)].map(() => { const m = mesh(new T3.SphereGeometry(0.008, 8, 6), new T3.MeshBasicMaterial({ color: new T3.Color(0.5, 1.6, 2.6) }), CI, [0.1, 0, 0]); m.castShadow = false; return m; });
    const trick = [...Array(4)].map(() => { const m = mesh(new T3.SphereGeometry(0.007, 8, 6), new T3.MeshBasicMaterial({ color: new T3.Color(0.5, 1.6, 2.6) }), D, [-1.75, 0.5, -1.35]); m.castShadow = false; return m; });
    const LID = new T3.Group(); LID.position.set(-1.75, 0.965, -1.5); D.add(LID); mesh(rbox(0.4, 0.03, 0.2, 0.01), white, LID, [0, 0, 0]); mesh(new T3.CylinderGeometry(0.022, 0.022, 0.012, 14), chrome, LID, [0, 0.02, 0]);
    const ring = mesh(new T3.TorusGeometry(0.07, 0.005, 6, 28), new T3.MeshBasicMaterial({ color: new T3.Color(2.6, 1.3, 0.2), transparent: true, opacity: 0, depthWrite: false, blending: T3.AdditiveBlending }), CI, [-0.02, 0.1, 0.06]); ring.castShadow = false;
    // ---- tenant + phone ----
    const TN = k.fig(D, '#e8b98f', -1.1, 0, -0.85, 0.95, '#7a3b1e');
    const swM = M.std('#6f5bb5', { roughness: 0.9 }); mesh(new T3.CylinderGeometry(0.218, 0.24, 0.58, 24, 1, true), swM, TN.userData.B, [0, 0.48, 0]); mesh(new T3.TorusGeometry(0.2, 0.034, 8, 24), swM, TN.userData.B, [0, 0.77, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    // ---- timing / state ----
    const vTN = () => new T3.Vector3(-1.1, 0, -0.85);
    const lowA = (t) => antMove(t, K.lower, 0.6, 0, 1, 1.12);
    const lidU = (t) => antMove(t, K.lid - 0.1, 0.6, 0, 1, 1.1);
    const running = (t) => (t < K.stops - 0.2 ? 1 : 0);
    const lvl = (t) => lerp(0.36, 0.26, E.io(seg(t, K.lower + 0.1, 0.8)));
    const _a = new T3.Vector3(), _b = new T3.Vector3(), _d = new T3.Vector3(), _up = new T3.Vector3(0, 1, 0);
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(-0.1, 4.4, 1.2, -1.55, 0.7, -1.2, 29)],
      [K.rush + 0.7, P(-0.1, 4.2, 1.2, -1.6, 0.7, -1.2, 29), E.lin],
      [K.rush + 1.4, P(-0.1, 2.0, 0.95, -1.75, 0.75, -1.5, 24), A9],
      [K.write - 0.1, P(-0.1, 2.0, 0.95, -1.75, 0.75, -1.5, 24), E.lin],
      [K.write + 0.4, PT(0.5, 2.0, 1.3, 0.95, 25), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, -1.2, 1.0, -0.4), A6],
      [K.float - 0.5, P(0.0, 9.2, 2.6, -1.2, 1.0, -0.4), E.lin],
      [K.float + 0.2, P(-0.1, 1.9, 1.1, -1.75, 0.8, -1.5, 22), A9],
      [K.stops + 0.6, P(-0.1, 1.9, 1.1, -1.75, 0.8, -1.5, 22), E.lin],
      [K.save - 0.1, P(0.1, 3.2, 1.2, -1.6, 0.7, -1.2, 27), A6],
      [K.save + 0.5, P(0.25, 3.0, 1.4, -1.6, 0.9, -1.0), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, -0.5, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3();
    k.frame((t) => {
      const g = k.grade; g.temp = 0.03; g.th = 1.6; g.bloom = 0.4; g.sat = 1.04;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      const run = running(t), L = lvl(t);
      // water level, float ball + arm, inflow stream, overflow drops, trickle into the bowl, ripples
      wat.scale.y = L; wat.position.y = -0.2 + L / 2;
      ball.position.set(-0.01, -0.2 + L - 0.005, 0); _a.set(-0.12, 0.12, 0); _b.copy(ball.position); _d.copy(_b).sub(_a); const len = _d.length(); arm.position.copy(_a).addScaledVector(_d, 0.5); arm.scale.set(1, len, 1); arm.quaternion.setFromUnitVectors(_up, _d.multiplyScalar(1 / len));
      inflow.visible = run > 0; inflow.scale.y = 0.1 + 0.28 * L; inflow.position.y = 0.1 - (0.1 + 0.28 * L) / 2 - 0.0;
      const spill = run * E.io(seg(t, 0, 0.2));
      drops.forEach((m, i) => { const u = ((t * 1.5 + i / drops.length) % 1); m.visible = spill > 0 && L > 0.34; m.position.set(0.1, 0.14 - u * 0.33, 0); });
      trick.forEach((m, i) => { const u = ((t * 2.2 + i / trick.length) % 1); m.visible = run > 0; m.position.set(-1.75 + (MC.rnd(i, 1) - 0.5) * 0.02, 0.56 - u * 0.1, -1.35); });
      ripples.forEach((m, i) => { const u = ((t * 1.2 + i * 0.5) % 1); m.material.opacity = run * 0.7 * (1 - u); m.scale.set(0.4 + u * 1.3, 0.4 + u * 1.3, 1); m.position.z = -1.19; });
      const rg = E.io(seg(t, K.float, 0.3)) * (1 - E.io(seg(t, K.lower + 0.2, 0.3))); ring.material.opacity = 0.8 * rg * (0.6 + 0.4 * Math.sin(t * 9));
      // lid lifts off and moves aside
      const lu = lidU(t); LID.position.set(-1.75 - 0.35 * lu, 0.965 + 0.4 * Math.sin(lu * Math.PI * 0.5) - 0.0 * lu, -1.5 + 0.1 * lu); LID.rotation.z = 0.5 * lu;
      // tenant: listens (annoyed), phone, lifts the lid, pushes the float down, relief
      const hear = E.io(seg(t, K.rush - 0.3, 0.3)) * (1 - E.io(seg(t, K.write - 0.9, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.lid - 1.1, 0.25)));
      const work = E.io(seg(t, K.lid - 0.5, 0.3)) * (1 - E.io(seg(t, K.stops + 0.5, 0.3)));
      const joy = MC.spring(t, K.stops + 0.2, 2.4, 0.35) * (1 - E.io(seg(t, K.save + 0.3, 0.3)));
      const face = lerp(lerp(3.84, 0.2, E.io(seg(t, K.write - 1.0, 0.4))), 3.84, E.io(seg(t, K.lid - 1.1, 0.3)));
      k.drive(TN, t, vTN, {
        face, nod: 0.25 * phoneUp - 0.1 * work + 0.1 * hear, lean: 0.12 * work - 0.1 * joy, squash: 0,
        armL: joy > 0.02 ? -0.4 - 2.4 * joy : -0.2 - 2.0 * work - 0.5 * hear,
        armR: joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 1.2 * phoneUp - 2.0 * work + 0.12 * work * Math.sin(t * 8),
      });
      k.face(TN, t, { wide: 0.2 * hear, o: 0, smile: joy > 0.1 ? 1 : 0.05, closed: 0.4 * hear });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.8 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.float - 0.5); k.popOut(m2, K.float - 0.44);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.float - 0.3);
    cd.line(0, K.float + 0.1); cd.line(1, K.lower); cd.line(2, K.stops);
    k.popOut(cd.c, K.save - 0.12, { y: -80 });
    const rT = ov('tdtag warn', S.rn); k.popIn(rT, K.rush + 0.4, { y: 30 }); k.popOut(rT, K.write - 0.5, { y: -40 });
    const fT = ov('tdtag warn', S.fl); k.popIn(fT, K.float + 0.05, { y: 30 }); k.popOut(fT, K.lid - 0.2, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.lid - 0.05, { y: 30 }); k.popOut(s1, K.lower - 0.12, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.lower - 0.05, { y: 30 }); k.popOut(s2, K.stops - 0.2, { y: -40 });
    const qT = ov('tdtag ok', S.qt); k.popIn(qT, K.stops + 0.05, { y: 40 }); k.popOut(qT, K.save - 0.1, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.save + 0.05, { y: 40 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(rT, new T3.Vector3(-1.75, 0.9, -1.4), 300, 780, -130); at(fT, new T3.Vector3(-1.9, 0.9, -1.4), 300, 780, -150);
      at(s1, new T3.Vector3(-1.75, 1.0, -1.4), 300, 780, -150); at(s2, new T3.Vector3(-1.75, 0.9, -1.4), 300, 780, -150); at(qT, new T3.Vector3(-1.75, 0.9, -1.4), 300, 780, -150); at(okT, new T3.Vector3(-1.4, 1.5, -1.0));
    });
    sfx('refresh', 0.3, -12); sfx('refresh', K.rush + 0.8, -13); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12);
    sfx('click', K.lid + 0.1, -8); sfx('thud', K.lid + 0.6, -13); sfx('click', K.lower + 0.3, -8); sfx('chime', K.stops, -9); sfx('kaching', K.save + 0.1, -12);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
