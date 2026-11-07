    // ---- X81: kettle + toaster overload the circuit, the breaker trips, the kitchen goes dark: unplug the kettle, flip the breaker, lights return ----
    mirFog.visible = false; sky.visible = false; sunG.visible = false;
    D.children.filter((o) => o.isMesh && o.geometry.type === 'PlaneGeometry' && o.material.blending === T3.AdditiveBlending).forEach((o) => { o.visible = false; });
    // counter, wall socket, kitchen wall lamp
    const cabM2 = M.std('#2f5a44', { roughness: 0.55 }), top2 = M.std('#dccab0', { roughness: 0.45 });
    box(1.9, 0.86, 0.6, cabM2, [1.8, 0.43, -1.3]); box(1.96, 0.05, 0.64, top2, [1.8, 0.885, -1.3]);
    mesh(rbox(0.2, 0.1, 0.02, 0.008), M.std('#f4f4f0', { roughness: 0.4 }), D, [1.93, 1.03, -1.585]);
    [-0.045, 0.045].forEach((dx) => mesh(new T3.CylinderGeometry(0.02, 0.02, 0.008, 16), M.std('#d9dbd6'), D, [1.93 + dx, 1.03, -1.575], [Math.PI / 2, 0, 0]));
    const bulbM = new T3.MeshBasicMaterial({ color: new T3.Color(3, 2.5, 1.8) }); mesh(rbox(0.5, 0.05, 0.05, 0.02), bulbM, D, [1.0, 2.1, -1.56]).castShadow = false;
    const lampGl = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, color: new T3.Color(2.2, 1.7, 1.0), opacity: 0.5 })); lampGl.position.set(1.0, 2.05, -1.5); lampGl.scale.setScalar(1.3); D.add(lampGl);
    const pl = new T3.PointLight('#ffe2b8', 2.2, 6); pl.position.set(1.0, 2.0, -1.1); D.add(pl);
    const hemi = scene.children.find((o) => o.isHemisphereLight);
    const tP = new T3.PointLight('#cfe3ff', 0, 3); tP.position.set(0.55, 1.5, -1.0); D.add(tP); const tS = new T3.PointLight('#cfe3ff', 0, 3); tS.position.set(1.9, 1.2, -1.0); D.add(tS);
    // appliances: kettle (from the set, moved) + toaster
    kettle.position.set(2.3, 0.91, -1.38);
    const kLed = mesh(new T3.TorusGeometry(0.1, 0.007, 6, 28), new T3.MeshBasicMaterial({ color: new T3.Color(2.6, 0.8, 0.2) }), kettle, [0, 0.012, 0], [Math.PI / 2, 0, 0]); kLed.castShadow = false;
    const tstr = new T3.Group(); tstr.position.set(1.45, 0.91, -1.38); D.add(tstr);
    mesh(rbox(0.3, 0.17, 0.17, 0.03), M.std('#c9ced4', { metalness: 0.7, roughness: 0.3 }), tstr, [0, 0.085, 0]);
    [0.03, -0.03].forEach((z) => mesh(rbox(0.22, 0.012, 0.04, 0.004), M.std('#15181b'), tstr, [0, 0.172, z]));
    const elM = new T3.MeshBasicMaterial({ color: new T3.Color(2.6, 0.7, 0.2) }); [0.03, -0.03].forEach((z) => mesh(new T3.BoxGeometry(0.2, 0.004, 0.012), elM, tstr, [0, 0.176, z]).castShadow = false);
    [0.03, -0.03].forEach((z) => mesh(rbox(0.19, 0.07, 0.01, 0.004), M.std('#d9a15a', { roughness: 0.9 }), tstr, [0, 0.19, z]));
    const steam = [0, 1, 2, 3, 4].map(() => { const sp = new T3.Sprite(new T3.SpriteMaterial({ map: cloud, transparent: true, depthWrite: false, opacity: 0, color: new T3.Color(1, 1, 1) })); D.add(sp); return sp; });
    // cords (segmented, update every frame) + plugs
    const cordM = M.std('#f1f1ee', { roughness: 0.6 });
    const mkCord = () => [...Array(9)].map(() => mesh(new T3.CylinderGeometry(0.008, 0.008, 1, 6), cordM, D, [0, 0, 0]));
    const cK = mkCord(), cT = mkCord();
    const _v = new T3.Vector3(), _w = new T3.Vector3(), _d = new T3.Vector3(), _up = new T3.Vector3(0, 1, 0);
    const setCord = (segs, A, B, sag) => { _v.copy(A); segs.forEach((s, i) => { const u = (i + 1) / segs.length; _w.copy(A).lerp(B, u); _w.y -= sag * 4 * u * (1 - u); _d.copy(_w).sub(_v); const len = _d.length() || 1e-4; s.position.copy(_v).addScaledVector(_d, 0.5); s.scale.set(1, len, 1); s.quaternion.setFromUnitVectors(_up, _d.multiplyScalar(1 / len)); _v.copy(_w); }); };
    const mkPlug = () => { const g = new T3.Group(); D.add(g); mesh(rbox(0.05, 0.07, 0.035, 0.01), M.std('#f4f4f0', { roughness: 0.4 }), g, [0, 0, 0.018]); [-0.012, 0.012].forEach((dx) => mesh(new T3.CylinderGeometry(0.004, 0.004, 0.025, 6), chrome, g, [dx, 0, -0.012], [Math.PI / 2, 0, 0])); return g; };
    const plK = mkPlug(), plT = mkPlug();
    // breaker panel with a hinged door
    const PN = new T3.Group(); PN.position.set(0.55, 1.55, -1.585); D.add(PN);
    mesh(rbox(0.38, 0.52, 0.05, 0.012), M.std('#e8e9e4', { roughness: 0.5 }), PN, [0, 0, 0.025]);
    mesh(new T3.BoxGeometry(0.33, 0.46, 0.012), M.std('#262a30', { roughness: 0.7 }), PN, [0, 0, 0.052]);
    const TI = 2, lev = [], leds = [];
    for (let i = 0; i < 6; i++) {
      const x = -0.125 + i * 0.05;
      mesh(new T3.BoxGeometry(0.036, 0.15, 0.008), M.std('#12151a'), PN, [x, 0.02, 0.06]);
      lev.push(mesh(rbox(0.026, 0.06, 0.02, 0.006), M.std('#f4f4f0', { roughness: 0.4 }), PN, [x, 0.065, 0.07]));
      const lm = new T3.MeshBasicMaterial({ color: new T3.Color(0.15, 2.0, 0.3) }); leds.push(lm); mesh(new T3.SphereGeometry(0.008, 8, 6), lm, PN, [x, 0.17, 0.062]).castShadow = false;
      mesh(new T3.BoxGeometry(0.03, 0.012, 0.004), M.std('#cfd2cc'), PN, [x, -0.11, 0.06]);
    }
    const DR = new T3.Group(); DR.position.set(-0.19, 0, 0.062); PN.add(DR); mesh(rbox(0.37, 0.5, 0.012, 0.006), M.std('#f1f2ee', { roughness: 0.45 }), DR, [0.185, 0, 0]); mesh(new T3.BoxGeometry(0.02, 0.07, 0.016), chrome, DR, [0.33, 0, 0.012]);
    const panelGl = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, color: new T3.Color(2.6, 0.3, 0.2), opacity: 0 })); panelGl.position.set(-0.025, 0.17, 0.1); panelGl.scale.setScalar(0.22); PN.add(panelGl);
    // ---- tenant + phone (phone doubles as a torch in the dark) ----
    const TN = k.fig(D, '#e8b98f', 1.3, 0, -0.9, 0.95, '#7a3b1e');
    const swM = M.std('#6f5bb5', { roughness: 0.9 }); mesh(new T3.CylinderGeometry(0.218, 0.24, 0.58, 24, 1, true), swM, TN.userData.B, [0, 0.48, 0]); mesh(new T3.TorusGeometry(0.2, 0.034, 8, 24), swM, TN.userData.B, [0, 0.77, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const phoneL = new T3.PointLight('#cfe3ff', 0, 2.6); phone.add(phoneL); phoneL.position.set(0, 0.2, 0.1);
    // ---- timing / state ----
    const onT = Math.max(K.flip + 0.75, K.lights - 0.1), flipT = onT - 0.35;
    const lit = (t) => (t < K.dark ? 1 : t < K.dark + 0.1 ? 0.45 : t < onT ? 0 : t < onT + 0.1 ? 0.5 : 1);
    const WPS = [[0, 1.3, -0.9], [K.dark + 0.3, 1.3, -0.9], [K.trip - 0.2, 0.65, -0.95], [K.unplug - 0.9, 0.65, -0.95], [K.unplug - 0.15, 1.95, -0.95], [flipT - 0.5, 1.95, -0.95], [flipT - 0.1, 0.65, -0.95], [1e3, 0.65, -0.95]];
    const vTN = (t) => { let i = 0; while (i < WPS.length - 2 && t > WPS[i + 1][0]) i++; const a = WPS[i], b = WPS[i + 1], u = E.io(clamp((t - a[0]) / Math.max(0.01, b[0] - a[0]))); return new T3.Vector3(lerp(a[1], b[1], u), 0, lerp(a[2], b[2], u)); };
    const unp = (t) => antMove(t, K.unplug, 0.45, 0, 1, 1.2);
    const doorO = (t) => antMove(t, K.trip - 0.7, 0.55, 0, 1, 1.1);
    const flip = (t) => antMove(t, flipT, 0.3, 0, 1, 1.25);
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.1, 4.2, 1.45, 1.4, 1.1, -1.2, 29)],
      [K.dark + 0.25, P(0.08, 4.0, 1.45, 1.4, 1.1, -1.2, 29), E.io],
      [K.trip - 0.45, P(0.05, 3.4, 1.45, 0.9, 1.25, -1.3, 27), A6],
      [K.trip - 0.05, P(0.0, 1.55, 1.5, 0.58, 1.55, -1.55, 22), A9],
      [K.write - 0.6, P(0.0, 1.55, 1.5, 0.58, 1.55, -1.55, 22), E.lin],
      [K.write + 0.3, PT(-0.45, 2.6, 1.4, 0.95, 25), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 1.2, 1.15, -0.4), A6],
      [K.over - 0.5, P(0.0, 9.2, 2.6, 1.2, 1.15, -0.4), E.lin],
      [K.over + 0.2, P(0.1, 3.8, 1.3, 1.9, 1.0, -1.4, 28), A9],
      [K.unplug - 0.35, P(0.9, 1.4, 1.3, 1.975, 1.0, -1.55, 22), A9],
      [K.unplug + 0.9, P(0.9, 1.4, 1.3, 1.975, 1.0, -1.55, 22), E.lin],
      [flipT - 0.3, P(0.0, 1.45, 1.5, 0.58, 1.55, -1.55, 22), A9],
      [onT + 0.5, P(0.02, 4.2, 1.5, 1.2, 1.1, -1.2, 30), A6],
      [K.no + 0.35, P(0.25, 3.0, 1.5, 1.4, 1.0, -1.0), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const ovrG = new T3.SpriteMaterial({ map: k.glow, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, color: new T3.Color(2.6, 0.3, 0.2), opacity: 0 });
    [[2.3, 1.1, -1.35], [1.45, 1.05, -1.35]].forEach(([x, y, z]) => { const sp = new T3.Sprite(ovrG); sp.position.set(x, y, z); sp.scale.setScalar(0.6); D.add(sp); });
    const FOC = new T3.Vector3(), tmp = new T3.Vector3(), PA = new T3.Vector3();
    k.frame((t) => {
      const g = k.grade; g.th = 1.6; g.bloom = 0.45; g.sat = 1.04;
      const L = lit(t);
      sun.intensity = lerp(0.07, 1.0, L); keyL.intensity = lerp(0.08, 0.5, L); fill.intensity = lerp(0.04, 0.3, L);
      pl.intensity = 2.2 * L; wl.intensity = 1.6 * L; showerL.intensity = 1.2 * L; lampGl.material.opacity = 0.5 * L; bulbM.color.setRGB(3 * (0.08 + 0.92 * L), 2.5 * (0.08 + 0.92 * L), 1.8 * (0.08 + 0.92 * L));
      g.exp = lerp(0.5, 1.0, L); g.temp = lerp(-0.3, 0.05, L);
      if (hemi) hemi.intensity = lerp(0.03, 0.32, L); if ('environmentIntensity' in scene) scene.environmentIntensity = lerp(0.12, 1, L);
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      tP.intensity = 1.5 * (1 - L) * Math.max(E.io(seg(t, K.trip - 0.5, 0.2)) * (1 - E.io(seg(t, K.write - 0.3, 0.2))), E.io(seg(t, K.unplug + 0.5, 0.2)));
      tS.intensity = 1.5 * (1 - L) * E.io(seg(t, K.over - 0.2, 0.2)) * (1 - E.io(seg(t, K.unplug + 1.2, 0.3)));
      // appliances: running until the trip, kettle LED dies when unplugged
      const on = t < K.dark ? 1 : 0, kOn = t < K.dark ? 1 : 0;
      elM.color.setRGB(2.6 * (on ? 1 : 0.1), 0.7 * (on ? 1 : 0.1), 0.2 * (on ? 1 : 0.1)); kLed.material.color.setRGB(2.6 * (kOn ? 1 : 0.1), 0.8 * (kOn ? 1 : 0.1), 0.2 * (kOn ? 1 : 0.1));
      steam.forEach((sp, i) => { const u = ((t * 0.55 + i * 0.2) % 1), a = t < K.dark + 0.6 ? Math.sin(u * Math.PI) * 0.55 : 0; sp.material.opacity = a; sp.position.set(2.2 + 0.015 * i, 1.18 + u * 0.45, -1.3); sp.scale.setScalar(0.09 + u * 0.16); });
      kettle.rotation.z = 0.02 * Math.sin(t * 30) * (t < K.dark ? 1 : 0);
      // overload glow (red pulse on both appliances)
      const ovr = E.io(seg(t, K.over - 0.1, 0.25)) * (1 - E.io(seg(t, K.unplug, 0.3)));
      // plugs + cords
      const u = unp(t);
      plT.position.set(1.885, 1.03, -1.56); plT.rotation.set(0, 0, 0);
      plK.position.set(1.975 + 0.1 * u, lerp(1.03, 0.935, u), -1.56 + 0.2 * u); plK.rotation.set(0.9 * u * (1 - u) * 0 + 0.5 * u, 0, 0);
      PA.set(2.21, 0.95, -1.42); setCord(cK, PA, plK.position, lerp(0.03, 0.12, u));
      PA.set(1.6, 0.96, -1.42); setCord(cT, PA, plT.position, 0.03);
      // breaker: door opens, lever flips back up (tripped one starts down with a red LED)
      DR.rotation.y = -1.95 * doorO(t);
      const fl = flip(t);
      lev.forEach((m, i) => { m.position.y = i === TI ? lerp(-0.025, 0.065, fl) : 0.065; });
      const red = fl < 0.5; leds[TI].color.setRGB(red ? 2.6 : 0.15, red ? 0.25 : 2.0, red ? 0.2 : 0.3);
      panelGl.material.opacity = red ? 0.5 * doorO(t) * (0.6 + 0.4 * Math.sin(t * 9)) : 0;
      // tenant: stands at the toaster, turns to the panel, phone, unplugs, flips the lever, relief
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.unplug - 1.1, 0.25)));
      const reachK = E.io(seg(t, K.unplug - 0.1, 0.25)) * (1 - E.io(seg(t, K.unplug + 0.7, 0.3)));
      const reachP = E.io(seg(t, flipT - 0.3, 0.25)) * (1 - E.io(seg(t, flipT + 0.6, 0.3)));
      const joy = MC.spring(t, K.lights, 2.4, 0.35) * (1 - E.io(seg(t, K.no, 0.3)));
      const faceP = E.io(seg(t, K.write - 0.9, 0.4)) * (1 - E.io(seg(t, K.unplug - 1.2, 0.35))), face = lerp(t < K.dark + 0.3 ? Math.PI * 0.9 : Math.PI, Math.PI * 2 - 0.45, faceP);
      k.drive(TN, t, vTN, {
        face, nod: 0.25 * phoneUp - 0.1 * reachP, lean: 0.08 * (reachK + reachP) - 0.1 * joy, squash: 0,
        armL: joy > 0.02 ? -0.4 - 2.4 * joy : -0.2 - 1.2 * reachK,
        armR: joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 1.2 * phoneUp - 2.2 * reachP - 0.4 * reachK,
      });
      k.face(TN, t, { wide: 0.5 * (t > K.dark && t < K.trip ? 1 : 0), o: 0, smile: joy > 0.1 ? 1 : 0.05, closed: 0 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c'); phoneL.intensity = phoneUp > 0.2 ? 1.6 * (1 - L) : 0;
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.8 ? 0.012 : 0.03 };
      ovrG.opacity = 0.6 * ovr * (0.6 + 0.4 * Math.sin(t * 12));
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.over - 0.5); k.popOut(m2, K.over - 0.44);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.over - 0.3);
    cd.line(0, K.over + 0.1); cd.line(1, K.unplug); cd.line(2, K.lights);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const dkT = ov('tdtag warn', S.dk); k.popIn(dkT, K.trip + 0.1, { y: 30 }); k.popOut(dkT, K.write - 0.5, { y: -40 });
    const ovT = ov('tdtag warn', S.ov); k.popIn(ovT, K.over + 0.05, { y: 30 }); k.popOut(ovT, K.unplug - 0.4, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.unplug - 0.05, { y: 30 }); k.popOut(s1, K.flip - 0.12, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.flip - 0.05, { y: 30 }); k.popOut(s2, onT - 0.05, { y: -40 });
    const lT = ov('tdtag ok', S.lit); k.popIn(lT, onT + 0.05, { y: 40 }); k.popOut(lT, K.no - 0.1, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(dkT, new T3.Vector3(0.55, 1.55, -1.5), 240, 840, -150); at(ovT, new T3.Vector3(1.9, 1.1, -1.4), 240, 840, -150);
      at(s1, new T3.Vector3(1.975, 1.03, -1.5), 240, 840, -140); at(s2, new T3.Vector3(0.55, 1.55, -1.5), 240, 840, -150);
      at(lT, new T3.Vector3(1.2, 1.7, -1.5), 240, 840, 0); at(okT, new T3.Vector3(1.0, 2.2, -1.0));
    });
    sfx('thud', K.dark, -8); sfx('errbeep', K.dark + 0.1, -14); sfx('click', K.trip - 0.5, -10); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12); sfx('refresh', K.over - 0.1, -14);
    sfx('click', K.unplug + 0.1, -8); sfx('thud', K.unplug + 0.45, -13); sfx('click', flipT + 0.1, -7); sfx('chime', onT, -8); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
