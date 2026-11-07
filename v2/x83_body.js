    // ---- X83: windows fogged up, drops run down the glass: open the window wide, ventilate five minutes, the glass is clear (mold prevented) ----
    mirFog.visible = false;
    kettle.visible = false;
    D.children.filter((o) => o.isGroup && Math.abs(o.position.x - 2.05) < 0.01 && Math.abs(o.position.y - 1.155) < 0.01).forEach((o) => { o.visible = false; });
    // opening sash over the kitchen window (hinged at the left), with fog on the glass and running drops
    const SSH = new T3.Group(); SSH.position.set(1.74, 1.65, -1.585); D.add(SSH);
    const sashM = M.std('#f6f3ee', { roughness: 0.45 });
    mesh(rbox(0.84, 0.045, 0.05, 0.01), sashM, SSH, [0.42, 0.5, 0]); mesh(rbox(0.84, 0.045, 0.05, 0.01), sashM, SSH, [0.42, -0.5, 0]); mesh(rbox(0.045, 1.0, 0.05, 0.01), sashM, SSH, [0.0225, 0, 0]); mesh(rbox(0.045, 1.0, 0.05, 0.01), sashM, SSH, [0.8175, 0, 0]);
    mesh(new T3.PlaneGeometry(0.78, 0.95), glassM, SSH, [0.42, 0, 0]).castShadow = false;
    mesh(rbox(0.03, 0.12, 0.03, 0.01), chrome, SSH, [0.78, -0.06, 0.04]);
    const fogM = new T3.MeshBasicMaterial({ map: fogT, transparent: true, depthWrite: false, opacity: 0.9 }); const fogPl = mesh(new T3.PlaneGeometry(0.78, 0.95), fogM, SSH, [0.42, 0, 0.012]); fogPl.castShadow = false;
    const drips = [...Array(16)].map((_, i) => { const m = mesh(new T3.BoxGeometry(0.008, 0.05 + MC.rnd(i, 5) * 0.05, 0.002), new T3.MeshBasicMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.9, depthWrite: false }), SSH, [0.1 + MC.rnd(i, 1) * 0.64, 0, 0.016]); m.castShadow = false; return m; });
    const pud = mesh(new T3.CircleGeometry(0.05, 18), new T3.MeshStandardMaterial({ color: '#8ccaf2', roughness: 0.1, transparent: true, opacity: 0.75 }), D, [2.3, 1.157, -1.5], [-Math.PI / 2, 0, 0]); pud.castShadow = false; pud.scale.set(0.2, 0.2, 1);
    const coldA = [...Array(7)].map(() => { const sp = new T3.Sprite(new T3.SpriteMaterial({ map: cloud, transparent: true, depthWrite: false, opacity: 0, color: new T3.Color(0.7, 0.85, 1.0) })); D.add(sp); return sp; });
    // ---- tenant + phone ----
    const TN = k.fig(D, '#e8b98f', 1.25, 0, -0.9, 0.95, '#7a3b1e');
    const swM = M.std('#6f5bb5', { roughness: 0.9 }); mesh(new T3.CylinderGeometry(0.218, 0.24, 0.58, 24, 1, true), swM, TN.userData.B, [0, 0.48, 0]); mesh(new T3.TorusGeometry(0.2, 0.034, 8, 24), swM, TN.userData.B, [0, 0.77, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    // ---- timing / state ----
    const WPS = [[0, 1.25, -0.9], [K.open - 1.3, 1.25, -0.9], [K.open - 0.45, 2.3, -0.95], [K.clear + 0.1, 2.3, -0.95], [K.clear + 0.9, 1.95, -0.9], [1e3, 1.95, -0.9]];
    const vTN = (t) => { let i = 0; while (i < WPS.length - 2 && t > WPS[i + 1][0]) i++; const a = WPS[i], b = WPS[i + 1], u = E.io(clamp((t - a[0]) / Math.max(0.01, b[0] - a[0]))); return new T3.Vector3(lerp(a[1], b[1], u), 0, lerp(a[2], b[2], u)); };
    const sashO = (t) => antMove(t, K.open - 0.1, 0.8, 0, 1, 1.12);
    const fogLv = (t) => 1 - E.io(seg(t, K.open + 0.6, K.clear - K.open - 0.4));
    const draft = (t) => E.io(seg(t, K.open + 0.3, 0.5)) * (1 - E.io(seg(t, K.clear + 0.4, 0.8)));
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.12, 3.9, 1.4, 1.9, 1.45, -1.3, 28)],
      [K.fog + 0.1, P(0.12, 3.8, 1.4, 1.95, 1.5, -1.3, 28), E.lin],
      [K.drops - 0.1, P(0.0, 1.9, 1.6, 2.15, 1.6, -1.55, 24), A9],
      [K.write - 0.1, P(0.0, 1.9, 1.6, 2.15, 1.55, -1.55, 24), E.lin],
      [K.write + 0.4, PT(0.5, 2.1, 1.35, 0.95, 25), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 1.5, 1.0, -0.4), A6],
      [K.humid - 0.4, P(0.0, 9.2, 2.6, 1.5, 1.0, -0.4), E.lin],
      [K.humid + 0.2, P(0.0, 2.3, 1.6, 2.15, 1.6, -1.55, 25), A9],
      [K.open - 0.45, P(0.1, 3.2, 1.45, 2.1, 1.5, -1.4, 27), A9],
      [K.vent + 0.4, P(-0.2, 2.6, 1.5, 2.1, 1.55, -1.45, 25), A6],
      [K.clear + 0.3, P(0.1, 3.4, 1.4, 2.0, 1.4, -1.3, 28), A6],
      [K.mold + 0.4, P(0.25, 3.2, 1.45, 1.9, 1.2, -1.0), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3();
    k.frame((t) => {
      const g = k.grade; g.temp = lerp(-0.12, 0.05, E.io(seg(t, K.open, 2.0))); g.th = 1.6; g.bloom = 0.4; g.sat = 1.04;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      // sash opens wide, fog clears, drops stop, draft streams in
      SSH.rotation.y = -1.55 * sashO(t);
      const f = fogLv(t); fogM.opacity = 0.9 * f;
      drips.forEach((m, i) => { const sp = 0.07 + MC.rnd(i, 7) * 0.08, u = ((t * sp + MC.rnd(i, 9)) % 1); m.position.y = 0.42 - u * 0.84; m.material.opacity = 0.9 * f * (t > K.fog - 0.2 ? 1 : 0.3); m.visible = f > 0.05; });
      pud.scale.setScalar(0.2 + 0.9 * E.io(seg(t, K.drops, 3.0)) * (0.3 + 0.7 * f));
      const dr = draft(t); coldA.forEach((sp, i) => { const u = ((t * 0.6 + i * 0.15) % 1); sp.material.opacity = 0.5 * dr * Math.sin(u * Math.PI); sp.position.set(1.95 + 0.1 * i + 0.25 * u, 1.45 + 0.08 * i - 0.1 * u, -1.5 + 0.9 * u); sp.scale.setScalar(0.2 + u * 0.35); });
      // tenant: sees the wet glass, phone, walks to the window, opens it, relief
      const look = E.io(seg(t, K.fog - 0.5, 0.3)) * (1 - E.io(seg(t, K.write - 0.9, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.open - 1.3, 0.25)));
      const pull = E.io(seg(t, K.open - 0.45, 0.3)) * (1 - E.io(seg(t, K.open + 0.7, 0.3)));
      const joy = MC.spring(t, K.clear, 2.4, 0.35) * (1 - E.io(seg(t, K.mold + 0.3, 0.3)));
      const face = lerp(lerp(2.4, 0.2, E.io(seg(t, K.write - 1.0, 0.4))), 2.6, E.io(seg(t, K.open - 1.3, 0.3)));
      k.drive(TN, t, vTN, {
        face, nod: 0.25 * phoneUp - 0.1 * pull, lean: 0.1 * pull - 0.1 * joy, squash: 0,
        armL: joy > 0.02 ? -0.4 - 2.4 * joy : -0.2 - 0.5 * pull - 0.4 * look,
        armR: joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 1.2 * phoneUp - 1.9 * pull - 0.3 * look,
      });
      k.face(TN, t, { wide: 0.3 * look, o: 0, smile: joy > 0.1 ? 1 : 0.05, closed: 0 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.8 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.humid - 0.5); k.popOut(m2, K.humid - 0.44);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.humid - 0.3);
    cd.line(0, K.humid + 0.1); cd.line(1, K.open); cd.line(2, K.clear);
    k.popOut(cd.c, K.mold - 0.12, { y: -80 });
    const fT = ov('tdtag warn', S.fog); k.popIn(fT, K.fog + 0.15, { y: 30 }); k.popOut(fT, K.write - 0.5, { y: -40 });
    const hT = ov('tdtag warn', S.hum); k.popIn(hT, K.humid + 0.05, { y: 30 }); k.popOut(hT, K.open - 0.5, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.open - 0.05, { y: 30 }); k.popOut(s1, K.five - 0.12, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.five - 0.05, { y: 30 }); k.popOut(s2, K.clear - 0.3, { y: -40 });
    const cT = ov('tdtag ok', S.clr); k.popIn(cT, K.clear + 0.05, { y: 40 }); k.popOut(cT, K.mold - 0.1, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.mold + 0.05, { y: 40 });
    const tm = ov('tdtimer', '<i></i><b>5:00</b>'); tl.set(tm, { xPercent: -50 }, 0); k.popIn(tm, K.five - 0.1, { y: 40 }); k.popOut(tm, K.clear - 0.1, { y: -40 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(fT, new T3.Vector3(2.15, 2.0, -1.5), 240, 840, -100); at(hT, new T3.Vector3(2.15, 2.0, -1.5), 240, 840, -100);
      at(s1, new T3.Vector3(2.3, 1.7, -1.4), 300, 700, -130); at(s2, new T3.Vector3(2.3, 1.7, -1.4), 300, 700, -130);
      at(cT, new T3.Vector3(2.15, 1.45, -1.5), 300, 780, 60); at(okT, new T3.Vector3(1.9, 2.0, -1.0));
      const left = Math.max(0, Math.round(300 * (1 - clamp((t - (K.five + 0.2)) / (K.clear - K.five - 0.7))))), b = tm.querySelector('b'); if (b) b.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
      hT.textContent = hT.textContent.replace(/\d+ %/, Math.round(lerp(72, 45, clamp((t - K.open) / (K.clear - K.open))) ) + ' %');
    });
    sfx('errbeep', K.fog + 0.1, -17); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12); sfx('refresh', K.humid - 0.1, -14);
    sfx('click', K.open - 0.1, -9); sfx('thud', K.open + 0.6, -14); sfx('pop', K.five, -13); sfx('chime', K.clear, -9); sfx('kaching', K.mold + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
