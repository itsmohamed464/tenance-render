    // ---- X88: the door squeaks every time: dry hinge. One drop of oil on the hinge, swing the door a few times, the squeak is gone (saves nerves + a call-out) ----
    kettle.visible = false;
    const SLEEVE = M.std('#d9734e', { roughness: 0.9 });
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
    // ---- door wall: wall pieces, frame, door leaf on 3 hinges, lever ----
    const wallX = (w, h, x, y) => box(w, h, 0.14, wallM, [x, y, -0.3]);
    wallX(0.9, 2.5, -0.7, 1.25); wallX(0.9, 2.5, 1.1, 1.25); wallX(0.9, 0.5, 0.2, 2.25);
    box(0.05, 2.0, 0.12, trimM, [-0.275, 1.0, -0.3]); box(0.05, 2.0, 0.12, trimM, [0.675, 1.0, -0.3]); box(1.0, 0.05, 0.12, trimM, [0.2, 2.025, -0.3]); box(0.9, 0.02, 0.14, M.std('#8a6f58'), [0.2, 0.01, -0.3]);
    const doorM = M.std('#c9a27a', { roughness: 0.55 }), panelM = M.std('#b98f66', { roughness: 0.6 });
    const DR = new T3.Group(); DR.position.set(-0.22, 0, -0.3); D.add(DR);
    mesh(rbox(0.86, 1.98, 0.045, 0.01), doorM, DR, [0.43, 1.0, 0]);
    [[1.5, 0.62, 0.72], [0.52, 0.62, 0.66]].forEach(([y, w, h]) => mesh(new T3.BoxGeometry(w, h, 0.01), panelM, DR, [0.43, y + 0.1, 0.025]));
    mesh(rbox(0.05, 0.16, 0.012, 0.004), chrome, DR, [0.78, 0.98, 0.026]); mesh(new T3.CylinderGeometry(0.009, 0.009, 0.14, 10), chrome, DR, [0.74, 0.98, 0.05], [0, 0, Math.PI / 2]);
    const pinM = new T3.MeshStandardMaterial({ color: '#8f7358', metalness: 0.6, roughness: 0.85 });
    [0.25, 1.0, 1.75].forEach((y) => { mesh(new T3.CylinderGeometry(0.016, 0.016, 0.13, 14), pinM, DR, [0, y, 0.022]); mesh(new T3.BoxGeometry(0.06, 0.13, 0.006), pinM, DR, [0.03, y, 0.0255]); });
    const rust = [[0.006, 1.03], [-0.004, 0.97], [0.01, 1.01], [-0.008, 1.045]].map(([dx, y]) => { const m = mesh(new T3.SphereGeometry(0.0065, 8, 6), new T3.MeshStandardMaterial({ color: '#6a3a1c', roughness: 0.9, transparent: true }), DR, [dx, y, 0.037]); m.scale.set(1, 0.6, 0.5); return m; });
    const filmM = new T3.MeshStandardMaterial({ color: '#e8a21f', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0, emissive: new T3.Color('#c07a10'), emissiveIntensity: 0.4 });
    const film = mesh(new T3.CylinderGeometry(0.0175, 0.0175, 0.012, 16), filmM, DR, [0, 1.068, 0.022]); film.castShadow = false;
    const trailM = new T3.MeshStandardMaterial({ color: '#e8a21f', roughness: 0.1, transparent: true, opacity: 0, emissive: new T3.Color('#c07a10'), emissiveIntensity: 0.4 });
    const trail = mesh(new T3.SphereGeometry(0.006, 8, 6), trailM, DR, [0, 1.06, 0.039]); trail.castShadow = false;
    const ring = mesh(new T3.TorusGeometry(0.06, 0.003, 6, 32), new T3.MeshBasicMaterial({ color: new T3.Color(2.6, 1.3, 0.2), transparent: true, opacity: 0, depthWrite: false, blending: T3.AdditiveBlending }), D, [-0.22, 1.0, -0.265]); ring.castShadow = false;
    // ---- oil can: origin at the spout tip, body above ----
    const OC = new T3.Group(); D.add(OC); OC.visible = false;
    mesh(new T3.CylinderGeometry(0.006, 0.006, 0.13, 8), chrome, OC, [0, 0.065, 0]); mesh(new T3.CylinderGeometry(0.03, 0.007, 0.05, 14), M.std('#d9d9d4', { metalness: 0.6, roughness: 0.35 }), OC, [0, 0.155, 0]);
    mesh(new T3.CylinderGeometry(0.036, 0.036, 0.12, 20), M.std('#e8b94a', { roughness: 0.35 }), OC, [0, 0.24, 0]); mesh(new T3.CylinderGeometry(0.0365, 0.0365, 0.035, 20), M.std('#c0392b', { roughness: 0.4 }), OC, [0, 0.24, 0]);
    mesh(new T3.CylinderGeometry(0.03, 0.036, 0.015, 20), M.std('#d9d9d4', { metalness: 0.6, roughness: 0.35 }), OC, [0, 0.305, 0]);
    const dropM = new T3.MeshStandardMaterial({ color: '#e8a21f', roughness: 0.05, metalness: 0.1, emissive: new T3.Color('#c07a10'), emissiveIntensity: 0.4 });
    const drop = mesh(new T3.SphereGeometry(0.0075, 12, 8), dropM, D, [-0.22, 1.1, -0.27]); drop.castShadow = false; drop.visible = false;
    // sound-wave rings at the hinge while it squeaks
    const waves = [0, 1, 2].map(() => { const m = mesh(new T3.TorusGeometry(0.08, 0.004, 6, 28), new T3.MeshBasicMaterial({ color: new T3.Color(2.4, 0.6, 0.4), transparent: true, opacity: 0, depthWrite: false, blending: T3.AdditiveBlending }), D, [-0.22, 1.0, -0.2]); m.castShadow = false; return m; });
    // ---- tenant + phone ----
    const TN = k.fig(D, '#d9734e', 0.5, 0, 0.2, 0.95, '#3a2418');
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    // ---- timing / state ----
    const bump = (t, t0, d, a) => { const u = seg(t, t0, d); return a * Math.sin(Math.PI * u) ** 2 * (u > 0 && u < 1 ? 1 : 0); };
    const sw0 = K.swing - 0.25, sw1 = sw0 + 2.0;
    const ang = (t) => {
      if (t < K.write) { let a = bump(t, 0.3, 0.9, 0.55) + bump(t, 1.2, 0.9, 0.55); if (K.write > 3.6) a += bump(t, 2.1, 0.9, 0.55); return a; }
      if (t >= sw0 && t < sw1) return 0.55 * (0.5 - 0.5 * Math.cos(2 * Math.PI * (t - sw0)));
      return 0;
    };
    const vTN = (t) => new T3.Vector3(0.5, 0, 0.2 - 0.38 * (ang(t) / 0.55));
    const tI = K.oil - 0.8, tO = K.oil + 0.9;
    const H1 = new T3.Vector3(-0.22, 1.12, -0.265), _a = new T3.Vector3();
    const oilK = (t) => E.io(seg(t, K.oil + 0.2, 0.9));
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.1, 5.0, 1.35, 0.25, 1.0, -0.3, 30)],
      [K.write - 0.1, P(0.1, 4.6, 1.35, 0.25, 1.0, -0.3, 30), E.lin],
      [K.write + 0.5, PT(0.35, 3.1, 1.4, 0.75, 27), A6],
      [K.turn + 0.3, P(0.06, 9.4, 2.7, 0.2, 1.1, -0.3), A6],
      [K.hinge - 0.5, P(0.0, 9.0, 2.6, 0.2, 1.1, -0.3), E.lin],
      [K.hinge + 0.25, P(0.45, 1.3, 1.12, -0.2, 1.02, -0.3, 22), A9],
      [tO + 0.2, P(0.45, 1.3, 1.12, -0.2, 1.02, -0.3, 22), E.lin],
      [K.swing + 0.1, PT(0.45, 4.0, 1.45, 0.8, 28), A6],
      [K.gone + 0.6, PT(0.3, 3.6, 1.4, 0.8, 27), E.lin],
      [K.save + 0.5, P(0.3, 3.8, 1.4, 0.3, 1.0, -0.2), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, -0.5, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3();
    k.frame((t) => {
      const g = k.grade; g.temp = 0.03; g.th = 1.6; g.bloom = 0.4; g.sat = 1.04;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      const a = ang(t); DR.rotation.y = a;
      // hinge: dull + rusty until the oil spreads, then bright
      const ox = oilK(t); pinM.color.lerpColors(new T3.Color('#8f7358'), new T3.Color('#dfe4ea'), ox); pinM.roughness = lerp(0.85, 0.2, ox); pinM.metalness = lerp(0.6, 1, ox);
      rust.forEach((m) => { m.material.opacity = 1 - ox; m.visible = ox < 0.98; });
      // squeak rings while the door moves before the oil
      const sq = t < K.oil ? Math.min(1, Math.abs(ang(t + 0.04) - ang(t - 0.04)) * 14) : 0;
      waves.forEach((m, i) => { const u = ((t * 2.2 + i / 3) % 1); m.material.opacity = sq * 0.8 * (1 - u); m.scale.set(0.4 + u * 1.4, 0.4 + u * 1.4, 1); });
      const rg = E.io(seg(t, K.hinge, 0.3)) * (1 - E.io(seg(t, K.oil - 0.8, 0.25))); ring.material.opacity = 0.8 * rg * (0.6 + 0.4 * Math.sin(t * 9));
      // oil can arrives, a drop forms, falls, spreads and runs down the pin
      const near = E.io(seg(t, tI, 0.6)) * (1 - E.io(seg(t, tO, 0.4)));
      OC.visible = near > 0.01; HD.visible = OC.visible;
      if (OC.visible) { _a.set(H1.x + 0.35 * (1 - near), H1.y + 0.3 * (1 - near), H1.z + 0.4 * (1 - near)); OC.position.copy(_a); OC.rotation.z = -0.25 * near; _a.y += 0.24; _a.x += 0.04; handAt(_a, 0.55, 0.5, 0.65); }
      const form = E.io(seg(t, K.oil - 0.3, 0.3)), fall = seg(t, K.oil, 0.2);
      drop.visible = form > 0.02 && fall < 1; drop.scale.setScalar(form); drop.position.set(-0.22, 1.12 - 0.005 - 0.048 * fall * fall, -0.27 + 0.0 * fall);
      filmM.opacity = 0.9 * ox; film.scale.set(1 + 0.15 * ox, 1, 1 + 0.15 * ox);
      trailM.opacity = ox * (1 - E.io(seg(t, K.oil + 0.9, 0.3))); trail.position.y = lerp(1.055, 0.97, E.io(seg(t, K.oil + 0.35, 0.8)));
      // tenant: pushes the door, texts, pushes it again, relief
      const push = (t < K.write - 0.8 ? 1 : 0) + (t >= sw0 - 0.2 && t < sw1 + 0.1 ? 1 : 0);
      const pushA = lerp(0, 1, E.io(seg(t, 0.15, 0.2))) * (t < K.write - 0.8 ? 1 : 0) + (t >= sw0 - 0.2 ? 1 : 0) * (t < sw1 + 0.1 ? 1 : 0);
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.ans + 0.9, 0.25)));
      const joy = MC.spring(t, K.gone + 0.1, 2.4, 0.35) * (1 - E.io(seg(t, K.save + 0.4, 0.3)));
      const face = lerp(lerp(Math.PI, 0.2, E.io(seg(t, K.write - 1.0, 0.4))), Math.PI, E.io(seg(t, K.ans + 0.9, 0.3)));
      const annoy = E.io(seg(t, 0.2, 0.3)) * (t < K.write - 0.8 ? 1 : 0);
      k.drive(TN, t, vTN, { face, nod: 0.25 * phoneUp - 0.05 * pushA, lean: 0.1 * pushA - 0.1 * joy, squash: 0, armL: joy > 0.02 ? -0.4 - 2.4 * joy : -0.2, armR: joy > 0.02 ? -0.4 - 2.4 * joy : (-0.25 - 1.65 * Math.min(1, pushA) - 1.2 * phoneUp) });
      k.face(TN, t, { wide: 0.15 * annoy, o: 0, smile: joy > 0.1 ? 1 : 0.05, closed: 0.5 * annoy });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 2.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const hook = ov('tdhook', S.hook); tl.set(hook, { xPercent: -50, autoAlpha: 1 }, 0); tl.fromTo(hook, { scale: 1.12 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' }, 0); k.popOut(hook, K.write - 0.12, { y: -60 });
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.hinge - 0.5); k.popOut(m2, K.hinge - 0.44);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.hinge - 0.3);
    cd.line(0, K.hinge + 0.1); cd.line(1, K.oil); cd.line(2, K.gone);
    k.popOut(cd.c, K.save - 0.12, { y: -80 });
    const qT = ov('tdtag warn', S.sq); k.popIn(qT, K.squeaks + 0.05, { y: 30 }); k.popOut(qT, K.write - 0.45, { y: -40 });
    const hT = ov('tdtag warn', S.hd); k.popIn(hT, K.hinge + 0.05, { y: 30 }); k.popOut(hT, K.oil - 0.35, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.oil - 0.3, { y: 30 }); k.popOut(s1, K.swing - 0.2, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.swing - 0.05, { y: 30 }); k.popOut(s2, K.gone - 0.15, { y: -40 });
    const okT = ov('tdtag ok', S.qt); k.popIn(okT, K.gone + 0.05, { y: 40 }); k.popOut(okT, K.save - 0.1, { y: -40 });
    const sv = ov('tdsave', S.sv); tl.set(sv, { xPercent: -50, rotation: -3 }, 0); k.popIn(sv, K.save + 0.05, { y: 60 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 450, 1450) + 'px'; };
      at(qT, new T3.Vector3(-0.1, 1.5, -0.2), 300, 780, -60); at(hT, new T3.Vector3(-0.2, 1.0, -0.25), 300, 780, -200);
      at(s1, new T3.Vector3(-0.2, 1.0, -0.25), 300, 780, -230); at(s2, new T3.Vector3(0.2, 1.4, -0.2), 300, 780, -130); at(okT, new T3.Vector3(0.2, 1.4, -0.2), 300, 780, -130);
    });
    [0.45, 0.85, 1.35, 1.75].forEach((x) => sfx('squeak', x, -7)); if (K.write > 3.6) { sfx('squeak', 2.25, -7); sfx('squeak', 2.65, -7); }
    sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12); sfx('click', K.hinge + 0.15, -10); sfx('whoosh', tI + 0.1, -15); sfx('drip', K.oil + 0.15, -8); sfx('whoosh', tO, -16);
    sfx('chime', K.gone, -9); sfx('kaching', K.save + 0.1, -12);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
