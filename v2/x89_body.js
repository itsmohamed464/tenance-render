    // ---- X89: water pools under the fridge drawer: the defrost drain at the back wall is blocked. Poke it clear with a cotton swab, flush with warm water, the water runs off ----
    kettle.visible = false;
    const SLEEVE = M.std('#7a5bc7', { roughness: 0.9 });
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
    // hide the plain base fridge (box, door line, handle) and build an open one
    D.children.filter((o) => o.isMesh && ((Math.abs(o.position.x - 3.1) < 1e-3 && (Math.abs(o.position.y - 0.93) < 1e-3 || Math.abs(o.position.y - 1.32) < 1e-3)) || (Math.abs(o.position.x - 2.83) < 1e-3 && Math.abs(o.position.y - 1.25) < 1e-3))).forEach((o) => { o.visible = false; });
    const FR = new T3.Group(); FR.position.set(3.1, 0, -1.25); D.add(FR);
    const frM = M.std('#eef1f5', { metalness: 0.15, roughness: 0.3 }), inW = M.std('#f7f9fb', { roughness: 0.5 });
    const fb = (w, h, d, m, x, y, z, par = FR) => mesh(new T3.BoxGeometry(w, h, d), m, par, [x, y, z]);
    fb(0.03, 1.86, 0.64, frM, -0.305, 0.93, 0); fb(0.03, 1.86, 0.64, frM, 0.305, 0.93, 0); fb(0.64, 1.86, 0.03, inW, 0, 0.93, -0.305); fb(0.64, 0.04, 0.64, frM, 0, 1.84, 0); fb(0.64, 0.05, 0.64, inW, 0, 0.025, 0);
    const glass = new T3.MeshPhysicalMaterial({ color: '#dff1ff', roughness: 0.05, transparent: true, opacity: 0.28, depthWrite: false, clearcoat: 1 });
    [0.62, 0.95, 1.28, 1.6].forEach((y) => { const s = fb(0.58, 0.012, 0.58, glass, 0, y, 0.0); s.castShadow = false; });
    // items on the shelves
    fb(0.08, 0.2, 0.08, M.std('#f4f6fa', { roughness: 0.4 }), -0.18, 0.73, -0.12); fb(0.082, 0.05, 0.082, M.std('#3a7bd5'), -0.18, 0.78, -0.12);
    mesh(new T3.CylinderGeometry(0.04, 0.04, 0.1, 16), M.std('#c0392b', { roughness: 0.4 }), FR, [0.1, 0.0 + 0.68, -0.15]); mesh(new T3.CylinderGeometry(0.03, 0.03, 0.18, 16), M.std('#e8943a', { roughness: 0.3 }), FR, [0.2, 1.05, -0.1]);
    fb(0.2, 0.08, 0.14, M.std('#f0d36a', { roughness: 0.5 }), -0.1, 1.0, -0.05); mesh(new T3.CylinderGeometry(0.035, 0.035, 0.07, 14), M.std('#7fb3a6'), FR, [0.15, 1.015, 0.1]);
    mesh(new T3.CylinderGeometry(0.03, 0.03, 0.22, 14), M.std('#2d6fd0', { roughness: 0.3 }), FR, [-0.2, 1.4, -0.1]); fb(0.18, 0.1, 0.12, M.std('#e6e0d0'), 0.1, 1.34, -0.1);
    // pulled-out crisper drawer (veg), puddle + blocked drain on the floor behind it
    const DRW = new T3.Group(); DRW.position.set(0, 0.07, 0.5); FR.add(DRW);
    const drwM = new T3.MeshPhysicalMaterial({ color: '#bfe3cc', roughness: 0.1, transparent: true, opacity: 0.5, depthWrite: false, clearcoat: 1 });
    fb(0.54, 0.01, 0.55, drwM, 0, 0.005, 0, DRW); fb(0.01, 0.2, 0.55, drwM, -0.265, 0.1, 0, DRW); fb(0.01, 0.2, 0.55, drwM, 0.265, 0.1, 0, DRW); fb(0.54, 0.2, 0.01, drwM, 0, 0.1, -0.27, DRW); fb(0.56, 0.2, 0.02, drwM, 0, 0.1, 0.275, DRW);
    [[-0.14, 0.0, 0.0, '#5aa84a', 0.04], [-0.04, 0.0, 0.05, '#6fbf5a', 0.045], [0.07, 0.0, 0.0, '#4a9a42', 0.04], [0.16, 0.0, 0.06, '#e5532b', 0.03], [0.02, 0.0, -0.1, '#e5532b', 0.03]].forEach(([x, y, z, c, r]) => mesh(new T3.SphereGeometry(r, 14, 10), M.std(c, { roughness: 0.6 }), DRW, [x, y + 0.04, z]));
    [[-0.17, 0.1], [-0.12, 0.14]].forEach(([x, z]) => mesh(new T3.ConeGeometry(0.018, 0.14, 10), M.std('#f08a2a'), DRW, [x, 0.06, z], [Math.PI / 2, 0, 0.3]));
    const HOLE = new T3.Vector3(0, 0.13, -0.29);
    mesh(new T3.CircleGeometry(0.022, 20), M.std('#14161a'), FR, [HOLE.x, HOLE.y, -0.2895]); mesh(new T3.TorusGeometry(0.022, 0.004, 6, 20), M.std('#d9dde2', { roughness: 0.4 }), FR, [HOLE.x, HOLE.y, -0.288]);
    const plug = mesh(new T3.SphereGeometry(0.02, 12, 8), M.std('#6b5a3c', { roughness: 0.95 }), FR, [HOLE.x, HOLE.y, -0.284]); plug.scale.set(1, 1, 0.55);
    const pudM = new T3.MeshStandardMaterial({ color: '#4fa8ee', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.9, depthWrite: false, emissive: new T3.Color('#1c5fa6'), emissiveIntensity: 0.5 });
    const pud = mesh(new T3.CircleGeometry(0.2, 32), pudM, FR, [0, 0.053, -0.09], [-Math.PI / 2, 0, 0]); pud.castShadow = false;
    const bits = [0, 1, 2, 3].map(() => { const m = mesh(new T3.SphereGeometry(0.01, 8, 6), M.std('#6b5a3c', { roughness: 0.95 }), FR, [HOLE.x, HOLE.y, -0.28]); m.visible = false; return m; });
    const frL = new T3.PointLight('#fff6e8', 1.6, 3); frL.position.set(0, 1.0, 0.1); FR.add(frL);
    // door on the right hinge, swung open; shelves with bottles on the inside
    const FD = new T3.Group(); FD.position.set(0.32, 0, 0.32); FD.rotation.y = 1.5; FR.add(FD);
    mesh(rbox(0.64, 1.84, 0.06, 0.02), frM, FD, [-0.32, 0.93, 0]); mesh(new T3.BoxGeometry(0.03, 0.4, 0.04), chrome, FD, [-0.58, 0.95, 0.05]);
    [0.5, 0.9, 1.3].forEach((y, i) => { mesh(new T3.BoxGeometry(0.5, 0.02, 0.07), inW, FD, [-0.32, y, -0.06]); [[-0.45, '#2d6fd0'], [-0.32, '#e8943a'], [-0.19, '#c0392b']].forEach(([x, c]) => mesh(new T3.CylinderGeometry(0.028, 0.028, 0.16 + 0.03 * i, 14), M.std(c, { roughness: 0.4 }), FD, [x, y + 0.09 + 0.015 * i, -0.06])); });
    // cotton swab + warm-water bottle (origin at the tip)
    const SW = new T3.Group(); FR.add(SW); SW.visible = false;
    mesh(new T3.CylinderGeometry(0.004, 0.004, 0.24, 8), M.std('#f4f4f0'), SW, [0, 0, 0], [Math.PI / 2, 0, 0]);
    [0.122, -0.122].forEach((z) => mesh(new T3.SphereGeometry(0.0095, 10, 8), M.std('#f6f1e4', { roughness: 0.95 }), SW, [0, 0, z]));
    const BT = new T3.Group(); FR.add(BT); BT.visible = false;
    mesh(new T3.CylinderGeometry(0.004, 0.009, 0.05, 10), M.std('#ff9d2e'), BT, [0, 0, 0.025], [Math.PI / 2, 0, 0]);
    mesh(new T3.CylinderGeometry(0.032, 0.032, 0.13, 18), new T3.MeshPhysicalMaterial({ color: '#cfe7f5', roughness: 0.1, transparent: true, opacity: 0.7, clearcoat: 1 }), BT, [0, 0, 0.12], [Math.PI / 2, 0, 0]);
    mesh(new T3.CylinderGeometry(0.0335, 0.0335, 0.06, 18), M.std('#ff9d2e', { roughness: 0.4 }), BT, [0, 0, 0.155], [Math.PI / 2, 0, 0]);
    const sM = new T3.MeshStandardMaterial({ color: '#dfeefa', transparent: true, opacity: 0.6, roughness: 0.05, emissive: new T3.Color('#ffffff'), emissiveIntensity: 0.25 });
    const stream = mesh(new T3.CylinderGeometry(0.004, 0.004, 1, 8, 1, true), sM, FR, [0, 0.15, -0.2]); stream.castShadow = false; stream.visible = false;
    const steam = [...Array(5)].map(() => { const s = new T3.Sprite(new T3.SpriteMaterial({ map: cloud, color: '#ffffff', transparent: true, depthWrite: false, opacity: 0 })); s.scale.setScalar(0.1); FR.add(s); return s; });
    const ring = mesh(new T3.TorusGeometry(0.05, 0.003, 6, 32), new T3.MeshBasicMaterial({ color: new T3.Color(2.6, 1.3, 0.2), transparent: true, opacity: 0, depthWrite: false, blending: T3.AdditiveBlending }), FR, [HOLE.x, HOLE.y, -0.27]); ring.castShadow = false;
    const sparks = [...Array(6)].map(() => { const s = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, color: new T3.Color(1.6, 1.4, 0.8) })); s.scale.setScalar(0.001); FR.add(s); return s; });
    // ---- tenant + phone ----
    const TN = k.fig(D, '#7a5bc7', 2.4, 0, -0.6, 0.95, '#3a2418');
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    // ---- timing / state ----
    const vTN = () => new T3.Vector3(2.4, 0, -0.6);
    const tP0 = K.pick + 0.35, tP1 = Math.max(K.flush - 0.2, tP0 + 0.9), tF0 = K.flush - 0.4, tF1 = K.runs + 0.35;
    const _a = new T3.Vector3(), _s = new T3.Vector3(), _u = new T3.Vector3(), _nz = new T3.Vector3(0, 0, -1), dBT = new T3.Vector3(0.75, -0.25, -0.6).normalize(), bDir = dBT.clone().negate();
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(-0.06, 3.9, 1.5, 3.0, 0.9, -1.2, 30)],
      [K.write - 0.1, P(-0.05, 3.8, 1.5, 3.0, 0.9, -1.2, 30), E.lin],
      [K.write + 0.5, P(-0.1, 3.7, 1.5, 2.85, 0.85, -1.0, 29), A6],
      [K.turn + 0.3, P(0.06, 9.4, 2.7, 1.6, 1.0, -0.6), A6],
      [K.drain - 0.5, P(0.0, 9.2, 2.6, 1.6, 1.0, -0.6), E.lin],
      [K.drain + 0.2, P(-0.2, 2.1, 0.85, 3.05, 0.16, -1.45, 22), A9],
      [K.flush + 0.0, P(-0.2, 2.1, 0.85, 3.05, 0.16, -1.45, 22), E.lin],
      [K.runs + 0.2, P(-0.1, 2.0, 0.9, 3.05, 0.12, -1.4, 23), A9],
      [K.runs + 1.2, P(-0.1, 2.0, 0.9, 3.05, 0.12, -1.4, 23), E.lin],
      [K.save + 0.5, P(-0.3, 3.8, 1.3, 3.0, 0.5, -1.1, 27), A6],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, -0.5, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3();
    k.frame((t) => {
      const g = k.grade; g.temp = 0.03; g.th = 1.6; g.bloom = 0.4; g.sat = 1.04;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      // puddle: grows a little, drains after the flush
      const pud0 = 0.75 + 0.25 * E.io(seg(t, 0, K.write)), drain = E.io(seg(t, K.runs - 0.1, 1.4)), pv = pud0 * (1 - drain);
      pud.scale.set(pv * 1.2, pv, 1); pudM.opacity = 0.9 * Math.min(1, pv * 3); pud.visible = pv > 0.02;
      // swab: arrives, pokes the hole (z oscillation), plug breaks free, leaves
      const swIn = E.io(seg(t, K.pick - 0.1, 0.45)), swOut = E.io(seg(t, tP1, 0.35));
      const pk = 0.5 + 0.5 * Math.sin(2 * Math.PI * 2.2 * (t - tP0)), act = E.io(seg(t, tP0, 0.2)) * (1 - E.io(seg(t, tP1 - 0.1, 0.2)));
      SW.visible = swIn > 0.01 && swOut < 0.99;
      _s.set(HOLE.x - 0.0, HOLE.y, lerp(-0.2, -0.3, pk * act) + 0.12);
      _s.x += (-0.28) * (1 - swIn) + (-0.3) * swOut; _s.y += 0.18 * (1 - swIn) + 0.2 * swOut; _s.z += 0.12 * (1 - swIn) + 0.1 * swOut;
      SW.position.copy(_s);
      const plugGone = E.io(seg(t, tP0 + 0.45, 0.25)); plug.scale.set(1 - plugGone, 1 - plugGone, 0.55 * (1 - plugGone)); plug.visible = plugGone < 0.98;
      bits.forEach((m, i) => { const u = seg(t, tP0 + 0.5 + i * 0.05, 0.6); m.visible = u > 0 && u < 1; m.position.set(HOLE.x + (MC.rnd(i, 1) - 0.5) * 0.12 * u, HOLE.y - 0.3 * u * u + 0.05 * u, -0.28 + 0.12 * u); });
      // warm-water bottle: nozzle above the hole, thin stream, steam
      const btIn = E.io(seg(t, tF0, 0.35)), btOut = E.io(seg(t, tF1, 0.35)), pour = btIn * (1 - btOut);
      BT.visible = btIn > 0.01 && btOut < 0.99;
      BT.position.set(HOLE.x - 0.09 - 0.25 * (1 - btIn) - 0.2 * btOut, HOLE.y + 0.07 + 0.12 * (1 - btIn) + 0.15 * btOut, -0.2 + 0.1 * (1 - btIn) + 0.1 * btOut); BT.quaternion.setFromUnitVectors(_nz, dBT);
      stream.visible = pour > 0.6 && t < K.runs + 0.2;
      if (stream.visible) { _a.set(HOLE.x - 0.09, HOLE.y + 0.07, -0.2); _u.set(HOLE.x, HOLE.y + 0.01, -0.285).sub(_a); const L = _u.length(); stream.position.copy(_a).addScaledVector(_u, 0.5); stream.scale.set(1, L, 1); stream.quaternion.setFromUnitVectors(new T3.Vector3(0, 1, 0), _u.multiplyScalar(1 / L)); }
      steam.forEach((s, i) => { const u = (t * 0.7 + i / 5) % 1; s.position.set(HOLE.x + (MC.rnd(i, 4) - 0.5) * 0.08, HOLE.y + 0.14 + u * 0.18, -0.2); s.scale.setScalar(0.05 + u * 0.1); s.material.opacity = pour * 0.5 * Math.sin(Math.PI * u); });
      const rg = E.io(seg(t, K.drain, 0.3)) * (1 - E.io(seg(t, K.pick - 0.3, 0.25))); ring.material.opacity = 0.9 * rg * (0.6 + 0.4 * Math.sin(t * 9));
      // hand follows whichever tool is in use
      const useSw = SW.visible, useBt = BT.visible;
      HD.visible = useSw || useBt;
      if (useSw) handAt(FR.localToWorld(_w.set(SW.position.x, SW.position.y, SW.position.z + 0.13)), -0.5, 0.45, 0.75);
      else if (useBt) handAt(FR.localToWorld(_w.copy(BT.position).addScaledVector(bDir, 0.13)), -0.85, 0.3, 0.45);
      const cl = E.io(seg(t, K.runs + 0.9, 0.4));
      sparks.forEach((s, i) => { const u = seg(t, K.runs + 1.0 + i * 0.06, 0.6); s.position.set(-0.2 + 0.4 * MC.rnd(i, 1), 0.1 + 0.2 * MC.rnd(i, 2), -0.05 + 0.3 * MC.rnd(i, 3)); s.scale.setScalar(0.001 + 0.13 * Math.sin(Math.PI * u)); });
      // tenant: worried, texts, watches, relief
      const wor = E.io(seg(t, 0.15, 0.3)) * (1 - E.io(seg(t, K.write - 1.0, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.ans + 0.9, 0.25)));
      const joy = MC.spring(t, K.runs + 1.0, 2.4, 0.35) * (1 - E.io(seg(t, K.save + 0.4, 0.3)));
      const face = lerp(lerp(2.5, 0.2, E.io(seg(t, K.write - 1.0, 0.4))), 2.28, E.io(seg(t, K.ans + 0.9, 0.3)));
      k.drive(TN, t, vTN, { face, nod: 0.25 * phoneUp + 0.1 * wor, lean: 0.05 * wor - 0.1 * joy, squash: 0, armL: joy > 0.02 ? -0.4 - 2.4 * joy : -0.2, armR: joy > 0.02 ? -0.4 - 2.4 * joy : (-0.25 - 1.6 * wor - 1.2 * phoneUp) });
      k.face(TN, t, { wide: 0.4 * wor, o: 0.3 * wor, smile: joy > 0.1 ? 1 : 0.05, closed: 0 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 2.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const hook = ov('tdhook', S.hook); tl.set(hook, { xPercent: -50, autoAlpha: 1 }, 0); tl.fromTo(hook, { scale: 1.12 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' }, 0); k.popOut(hook, K.write - 0.12, { y: -60 });
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.drain - 0.5); k.popOut(m2, K.drain - 0.44);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.drain - 0.3);
    cd.line(0, K.drain + 0.1); cd.line(1, K.pick + 0.3); cd.line(2, K.runs);
    k.popOut(cd.c, K.save - 0.12, { y: -80 });
    const wT = ov('tdtag warn', S.pool); k.popIn(wT, K.water + 0.05, { y: 30 }); k.popOut(wT, K.write - 0.45, { y: -40 });
    const dT = ov('tdtag warn', S.dr); k.popIn(dT, K.drain + 0.05, { y: 30 }); k.popOut(dT, K.pick - 0.15, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.pick - 0.05, { y: 30 }); k.popOut(s1, K.flush - 0.2, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.flush - 0.05, { y: 30 }); k.popOut(s2, K.runs - 0.15, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.runs + 0.05, { y: 40 }); k.popOut(okT, K.save - 0.1, { y: -40 });
    const sv = ov('tdsave', S.sv); tl.set(sv, { xPercent: -50, rotation: -3 }, 0); k.popIn(sv, K.save + 0.05, { y: 60 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(FR.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 450, 1450) + 'px'; };
      at(wT, new T3.Vector3(0, 0.2, -0.1), 300, 780, -110); at(dT, new T3.Vector3(0, 0.15, -0.29), 300, 780, -170);
      at(s1, new T3.Vector3(0, 0.15, -0.29), 300, 780, -190); at(s2, new T3.Vector3(0, 0.15, -0.29), 300, 780, -190); at(okT, new T3.Vector3(0, 0.2, -0.2), 300, 780, -150);
    });
    sfx('drip', 0.3, -12); sfx('drip', K.water + 0.3, -12); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12);
    sfx('click', K.drain + 0.15, -10); sfx('whoosh', K.pick - 0.1, -15); [0, 0.45, 0.9, 1.35].forEach((d) => sfx('click', tP0 + d, -14));
    sfx('flow', K.flush, -10); sfx('gurgle', K.runs, -9); sfx('drain', K.runs + 0.2, -10); sfx('chime', K.runs + 1.0, -9); sfx('kaching', K.save + 0.1, -12);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
