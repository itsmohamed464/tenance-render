    // ---- X69: fogged kitchen window (sashes open inward), drips on the sill, hygrometer, radiator ----
    mirFog.visible = false;
    const cabM = M.std('#2f5a44', { roughness: 0.55 }), topM = M.std('#dccab0', { roughness: 0.45 });
    box(1.0, 0.86, 0.6, cabM, [2.2, 0.43, -1.3]); box(1.04, 0.05, 0.64, topM, [2.2, 0.885, -1.3]);
    // sashes: hinged at the outer jambs, glass + fog layer + droplets
    const glassW = new T3.MeshPhysicalMaterial({ color: '#e6f4ff', roughness: 0.04, transparent: true, opacity: 0.14, depthWrite: false, side: T3.DoubleSide, clearcoat: 1 });
    const sash = (hx, dir) => {
      const g = new T3.Group(); g.position.set(hx, 1.65, -1.64); D.add(g); const w = 0.4, cx = dir * w / 2;
      [[cx, 0.455, w, 0.04], [cx, -0.455, w, 0.04], [dir * 0.02, 0, 0.04, 0.95], [dir * (w - 0.02), 0, 0.04, 0.95]].forEach(([x, y, ww, hh]) => mesh(new T3.BoxGeometry(ww, hh, 0.05), frameM, g, [x, y, 0]));
      mesh(new T3.PlaneGeometry(w - 0.06, 0.89), glassW, g, [cx, 0, 0.005]).castShadow = false;
      const fm = frostM(); fm.uniforms.tF.value = fogT; const f = mesh(new T3.PlaneGeometry(w - 0.06, 0.89), fm, g, [cx, 0, 0.012]); f.castShadow = false; f.renderOrder = 2;
      mesh(new T3.BoxGeometry(0.02, 0.1, 0.03), chrome, g, [dir * (w - 0.03), 0, 0.04]);
      const dr = [...Array(9)].map((_, i) => mesh(new T3.SphereGeometry(0.008 + MC.rnd(i + hx * 7, 1) * 0.006, 8, 6), glassW.clone(), g, [cx + (MC.rnd(i + hx * 7, 2) - 0.5) * 0.3, 0.4, 0.02]));
      return { g, fm, dr, dir };
    };
    const sashes = [sash(1.735, 1), sash(2.565, -1)];
    const sillW = mesh(new T3.PlaneGeometry(0.9, 0.22), new T3.MeshStandardMaterial({ color: '#cfe2ef', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.75 }), D, [2.15, 1.157, -1.55], [-Math.PI / 2, 0, 0]); sillW.castShadow = false;
    const strM = new T3.MeshStandardMaterial({ color: '#dfeefa', transparent: true, opacity: 0.6, roughness: 0.05, emissive: new T3.Color('#ffffff'), emissiveIntensity: 0.25 });
    const fallD = [...Array(6)].map(() => { const m = mesh(new T3.SphereGeometry(0.01, 8, 6), strM, D, [0, -5, 0]); m.castShadow = false; return m; });
    // hygrometer on the sill
    const hyg = new T3.Group(); hyg.position.set(2.48, 1.16, -1.5); D.add(hyg);
    mesh(rbox(0.12, 0.09, 0.04, 0.012), M.std('#faf6ee', { roughness: 0.4 }), hyg, [0, 0.045, 0]);
    const hygScr = new T3.MeshBasicMaterial({ color: new T3.Color(2.2, 0.6, 0.4) }); mesh(new T3.PlaneGeometry(0.09, 0.05), hygScr, hyg, [0, 0.05, 0.021]);
    // radiator on the back wall + valve, heat shimmer
    const radM = M.std('#f4f2ee', { roughness: 0.45 });
    for (let i = 0; i < 9; i++) mesh(rbox(0.06, 0.5, 0.07, 0.02), radM, D, [0.7 + i * 0.075, 0.45, -1.58]);
    box(0.68, 0.04, 0.03, radM, [1.0, 0.68, -1.58]); box(0.68, 0.04, 0.03, radM, [1.0, 0.22, -1.58]);
    const valve = new T3.Group(); valve.position.set(1.4, 0.62, -1.56); D.add(valve); mesh(new T3.CylinderGeometry(0.035, 0.035, 0.09, 16), M.std('#f8f8f6'), valve, [0, 0, 0], [0, 0, Math.PI / 2]);
    const heatM = new T3.MeshBasicMaterial({ color: new T3.Color(2.4, 1.0, 0.4), transparent: true, opacity: 0, blending: T3.AdditiveBlending, depthWrite: false });
    const heatG = mesh(new T3.PlaneGeometry(0.75, 0.6), heatM, D, [1.0, 0.45, -1.535]); heatG.castShadow = false;
    const shimmer = [...Array(8)].map(() => { const s = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, transparent: true, depthWrite: false, opacity: 0, color: new T3.Color(1.6, 0.9, 0.5) })); D.add(s); return s; });
    // cold air streaks while the window is open
    const airM = new T3.MeshBasicMaterial({ color: new T3.Color(0.6, 0.9, 1.6), transparent: true, opacity: 0, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide });
    const air = [...Array(8)].map(() => { const m = mesh(new T3.PlaneGeometry(0.5, 0.012), airM, D, [0, -5, 0], [0, Math.PI / 2, 0]); m.castShadow = false; return m; });
    const ringM2 = new T3.MeshBasicMaterial({ color: new T3.Color(2.6, 0.9, 0.4), transparent: true, opacity: 0, depthWrite: false, blending: T3.AdditiveBlending });
    const hiRing = mesh(new T3.TorusGeometry(0.11, 0.004, 6, 40), ringM2, D, [2.48, 1.21, -1.47]); hiRing.castShadow = false;
    // ---- tenant (sweater) + phone ----
    const TN = k.fig(D, '#d9a47c', 1.45, 0, -0.55, 0.97, '#1f1712');
    const shirtM = M.std('#3d6fb0', { roughness: 0.9 }); mesh(new T3.CylinderGeometry(0.214, 0.236, 0.56, 24, 1, true), shirtM, TN.userData.B, [0, 0.48, 0]); mesh(new T3.TorusGeometry(0.2, 0.03, 8, 24), shirtM, TN.userData.B, [0, 0.76, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const POS = new T3.Vector3(1.45, 0, -0.55); const vTN = () => POS.clone();
    // ---- state ----
    const openA = (t) => antMove(t, K.open - 0.05, 0.45, 0, 1, 1.15) * (1 - antMove(t, K.clear - 0.75, 0.45, 0, 1, 1.15));
    const fogG = (t) => 0.55 + 0.75 * E.io(seg(t, 0, K.drip + 0.3));
    const melt = (t) => E.io(seg(t, K.open + 0.2, Math.max(0.8, K.clear - K.open - 0.3)));
    const hum = (t) => Math.round(lerp(78, 52, melt(t)));
    const heatOn = (t) => E.io(seg(t, K.heat - 0.05, 0.4));
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.25, 2.8, 1.6, 2.15, 1.35, -1.55, 28)],
      [K.drip - 0.1, P(0.25, 1.15, 1.35, 2.2, 1.22, -1.5, 24), E.io],
      [K.drip + 0.45, PT(0.45, 2.4, 1.3, 1.0, 22, 0.03), A9],
      [K.write - 0.3, PT(0.45, 2.5, 1.28, 1.0, 22), E.lin],
      [K.write + 0.2, PT(0.4, 1.8, 1.42, 1.0, 26), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 0.1, 1.15, -0.55), A6],
      [K.humid - 0.3, P(0.0, 9.2, 2.6, 0.1, 1.15, -0.55), E.lin],
      [K.humid + 0.15, P(0.2, 1.35, 1.45, 2.25, 1.35, -1.55, 28), A9],
      [K.open + 0.1, P(0.35, 2.2, 1.65, 2.05, 1.45, -1.3, 28), A6],
      [K.heat + 0.05, P(-0.2, 1.7, 1.05, 1.0, 0.5, -1.5, 28), A9],
      [K.clear - 0.05, P(0.18, 1.55, 1.65, 2.15, 1.62, -1.6, 26), A6],
      [K.no + 0.35, P(0.5, 2.8, 1.6, 1.6, 0.95, -0.65), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3();
    k.frame((t) => {
      const g = k.grade; g.temp = -0.15 + 0.3 * E.io(seg(t, K.clear - 0.2, 0.6)); g.th = 1.6; g.bloom = 0.35; g.sat = 1.03;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      const oa = openA(t), mlt = melt(t), fg = fogG(t);
      sashes.forEach((s) => {
        s.g.rotation.y = -s.dir * 1.35 * oa;
        s.fm.uniforms.uG.value = fg; s.fm.uniforms.uM.value = mlt;
        s.dr.forEach((m, i) => { const a = ((t * (0.18 + MC.rnd(i, 3) * 0.12) + MC.rnd(i, 4)) % 1); m.visible = mlt < 0.6 && t > 0.2; m.position.y = 0.42 - a * 0.86; m.material.opacity = 0.5 * (1 - mlt); });
      });
      sillW.scale.set(0.3 + 0.7 * E.io(seg(t, 0, K.drip + 0.5)), 1, 1); sillW.material.opacity = 0.75 * (1 - E.io(seg(t, K.clear - 0.3, 0.6)));
      fallD.forEach((m, i) => { const life = 0.6, a = ((t / life + MC.rnd(i, 1)) % 1), on = t > K.drip - 0.3 && t < K.open; if (!on) { m.position.y = -5; return; } m.position.set(1.85 + MC.rnd(i, 2) * 0.6, 1.14 - a * 0.23, -1.42); });
      hygScr.color.setRGB(lerp(2.2, 0.4, mlt), lerp(0.6, 2.0, mlt), lerp(0.4, 0.7, mlt));
      ringM2.opacity = E.io(seg(t, K.humid - 0.05, 0.3)) * (0.6 + 0.4 * Math.sin(t * 10)) * (1 - E.io(seg(t, K.open - 0.2, 0.2)));
      const ho = heatOn(t); heatM.opacity = 0.18 * ho; valve.rotation.x = -1.6 * antMove(t, K.heat - 0.1, 0.3, 0, 1, 1.2);
      shimmer.forEach((s, i) => { const a = ((t * 0.45 + MC.rnd(i, 1)) % 1); s.material.opacity = ho * 0.16 * Math.sin(a * Math.PI); s.position.set(0.72 + MC.rnd(i, 2) * 0.56, 0.7 + a * 0.9, -1.5); s.scale.setScalar(0.25 + a * 0.4); });
      air.forEach((m, i) => { const a = ((t * 0.9 + MC.rnd(i, 1)) % 1); m.material = airM; airM.opacity = 0.35 * oa; m.position.set(1.85 + MC.rnd(i, 2) * 0.6, 1.3 + MC.rnd(i, 3) * 0.7 - a * 0.25, -1.55 + a * 1.4); m.scale.x = 0.6 + a; });
      // tenant: wiping the glass → shock at the drip → phone → opens the window → turns to the radiator → joy
      const wipe = t < K.drip ? 1 : 0;
      const shock = E.io(seg(t, K.drip, 0.08)) * (1 - E.io(seg(t, K.drip + 0.8, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.humid - 0.4, 0.25)));
      const reach = E.io(seg(t, K.open - 0.35, 0.3)) * (1 - E.io(seg(t, K.open + 0.55, 0.3)));
      const point = E.io(seg(t, K.heat - 0.2, 0.25)) * (1 - E.io(seg(t, K.clear - 0.3, 0.3)));
      const joy = MC.spring(t, K.clear + 0.3, 2.4, 0.35);
      const sq = -0.13 * Math.exp(-Math.pow((t - (K.drip + 0.12)) / 0.07, 2));
      const face = lerp(lerp(lerp(2.53, 0.4, antMove(t, K.drip + 0.02, 0.25, 0, 1, 1.2)), 2.53, E.io(seg(t, K.open - 0.6, 0.3))), 3.58, point) * (1 - E.io(seg(t, K.clear + 0.1, 0.35))) + 0.4 * E.io(seg(t, K.clear + 0.1, 0.35));
      k.drive(TN, t, vTN, {
        face, squash: sq, tilt: wipe ? 0.04 * Math.sin(t * 5) : 0, nod: 0.25 * phoneUp - 0.1 * shock - 0.15 * reach,
        lean: 0.35 * reach - 0.12 * joy,
        armL: shock > 0.5 ? -2.7 : (joy > 0.02 ? -0.4 - 2.4 * joy : (wipe ? -1.7 + 0.25 * Math.sin(t * 7) : -0.2 - 2.0 * reach)),
        armR: shock > 0.5 ? -2.7 : (joy > 0.02 ? -0.4 - 2.4 * joy : (wipe ? -0.3 : -0.25 - 1.2 * phoneUp - 2.0 * reach - 1.4 * point)),
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
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.humid - 0.45); k.popOut(m2, K.humid - 0.39);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.humid - 0.3);
    cd.line(0, K.humid + 0.2); cd.line(1, K.open + 0.1); cd.line(2, K.heat + 0.15);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const hyT = ov('tdtag warn', '💧 78 %'); k.popIn(hyT, K.humid + 0.2, { y: 30 }); k.popOut(hyT, K.no - 0.1, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.open - 0.05, { y: 30 }); k.popOut(s1, K.heat - 0.12, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.heat + 0.05, { y: 30 }); k.popOut(s2, K.clear - 0.1, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      const h = hum(t); hyT.textContent = '💧 ' + h + ' %'; hyT.className = 'tdtag ' + (h > 60 ? 'warn' : 'ok');
      at(hyT, new T3.Vector3(2.48, 1.3, -1.5), 240, 840, -60); at(s1, new T3.Vector3(2.15, 2.25, -1.4), 240, 840, -20); at(s2, new T3.Vector3(1.0, 0.85, -1.5), 240, 840, -60); at(okT, new T3.Vector3(1.45, 2.3, -0.55));
    });
    sfx('drip', K.drip - 0.15, -9); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12);
    sfx('refresh', K.humid, -14); sfx('windowshut', K.open, -12); sfx('wind', K.open + 0.2, -18, { dur: Math.max(0.6, K.clear - K.open - 0.6) });
    sfx('click', K.heat - 0.05, -10); sfx('windowshut', K.clear - 0.7, -12); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
