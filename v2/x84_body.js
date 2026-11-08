    // ---- X84: heating hardly warms, boiler pressure fell: open the filling valve until the needle reaches 2 bar, close it, the heating runs again ----
    mirFog.visible = false;
    kettle.visible = false;
    D.children.filter((o) => o.isMesh && o.geometry.type === 'PlaneGeometry' && o.material.blending === T3.AdditiveBlending).forEach((o) => { o.visible = false; });
    D.children.filter((o) => o.isMesh && Math.abs(o.position.x - 1.95) < 0.01 && Math.abs(o.position.y - 0.955) < 0.01).forEach((o) => { o.visible = false; });
    // wall boiler with a pressure gauge, status LED and a filling valve underneath
    const BO = new T3.Group(); BO.position.set(0.95, 1.55, -1.5); D.add(BO);
    mesh(rbox(0.46, 0.72, 0.3, 0.03), M.std('#f4f3ee', { roughness: 0.35 }), BO, [0, 0, 0]);
    mesh(rbox(0.3, 0.07, 0.01, 0.01), M.std('#1b2128'), BO, [0.06, 0.27, 0.152]);
    const ledB = new T3.MeshBasicMaterial({ color: new T3.Color(2.6, 0.25, 0.2) }); mesh(new T3.SphereGeometry(0.012, 10, 8), ledB, BO, [-0.1, 0.27, 0.158]).castShadow = false;
    const gaugeT = cvs(256, 256, (x, w) => {
      const c = w / 2, a = (p) => ((-135 + 67.5 * p) * Math.PI) / 180 - Math.PI / 2; x.fillStyle = '#fbfbf8'; x.beginPath(); x.arc(c, c, c - 4, 0, 7); x.fill();
      [[0, 0.8, '#d64545'], [1.0, 2.5, '#3bb273'], [2.5, 4, '#e0a43a']].forEach(([p0, p1, col]) => { x.strokeStyle = col; x.lineWidth = 16; x.beginPath(); x.arc(c, c, c - 28, a(p0), a(p1)); x.stroke(); });
      x.strokeStyle = '#222'; x.lineWidth = 4; x.fillStyle = '#222'; x.font = 'bold 26px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      for (let i = 0; i <= 8; i++) { const p = i * 0.5, an = a(p), r1 = c - 44, r2 = c - 56; x.beginPath(); x.moveTo(c + Math.cos(an) * r1, c + Math.sin(an) * r1); x.lineTo(c + Math.cos(an) * r2, c + Math.sin(an) * r2); x.stroke(); if (i % 2 === 0) x.fillText(String(p), c + Math.cos(an) * (c - 78), c + Math.sin(an) * (c - 78)); }
      x.font = 'bold 22px sans-serif'; x.fillText('bar', c, c + 62);
    });
    const GG = new T3.Group(); GG.position.set(-0.08, 0.02, 0.154); BO.add(GG); GG.scale.setScalar(1.5);
    mesh(new T3.CylinderGeometry(0.085, 0.085, 0.02, 32), chrome, GG, [0, 0, 0], [Math.PI / 2, 0, 0]);
    mesh(new T3.CircleGeometry(0.075, 32), new T3.MeshBasicMaterial({ map: gaugeT }), GG, [0, 0, 0.0115]).castShadow = false;
    const NDL = new T3.Group(); NDL.position.z = 0.016; GG.add(NDL); mesh(new T3.BoxGeometry(0.008, 0.07, 0.003), new T3.MeshBasicMaterial({ color: '#c0262d' }), NDL, [0, 0.03, 0]).castShadow = false; mesh(new T3.CylinderGeometry(0.01, 0.01, 0.004, 12), chrome, NDL, [0, 0, 0], [Math.PI / 2, 0, 0]);
    // filling valve + hose loop under the boiler
    const VLV = new T3.Group(); VLV.position.set(0.8, 1.02, -1.4); D.add(VLV);
    mesh(new T3.CylinderGeometry(0.02, 0.02, 0.25, 10), chrome, D, [0.8, 1.1, -1.4]); mesh(new T3.CylinderGeometry(0.03, 0.03, 0.06, 12), chrome, VLV, [0, 0, 0]);
    const LEV = new T3.Group(); LEV.position.z = 0.04; VLV.add(LEV); mesh(rbox(0.16, 0.025, 0.025, 0.008), M.std('#2d6fd0', { roughness: 0.4 }), LEV, [0.06, 0, 0]);
    const hoseC = new T3.CatmullRomCurve3([new T3.Vector3(0.8, 0.98, -1.4), new T3.Vector3(0.88, 0.88, -1.36), new T3.Vector3(1.02, 0.88, -1.36), new T3.Vector3(1.1, 0.98, -1.4), new T3.Vector3(1.1, 1.12, -1.42)]);
    mesh(new T3.TubeGeometry(hoseC, 24, 0.012, 8, false), M.std('#9aa6b2', { metalness: 0.7, roughness: 0.4 }), D, [0, 0, 0]);
    const flowD = [...Array(8)].map(() => { const m = mesh(new T3.SphereGeometry(0.011, 8, 6), new T3.MeshBasicMaterial({ color: new T3.Color(0.5, 1.6, 2.6) }), D, [0, -5, 0]); m.castShadow = false; return m; });
    // radiator under the window: cold (blue) at first, warm (orange) when the pressure is right
    const RAD = new T3.Group(); RAD.position.set(2.15, 0, -1.5); D.add(RAD);
    const radM = M.std('#f4f1ea', { roughness: 0.4 });
    for (let i = 0; i < 10; i++) mesh(rbox(0.06, 0.62, 0.09, 0.025), radM, RAD, [-0.38 + i * 0.0845, 0.58, 0.05]);
    mesh(rbox(0.9, 0.045, 0.1, 0.02), radM, RAD, [0, 0.9, 0.05]); mesh(rbox(0.9, 0.045, 0.1, 0.02), radM, RAD, [0, 0.27, 0.05]);
    const coldP = mesh(new T3.PlaneGeometry(0.92, 0.66), new T3.MeshBasicMaterial({ color: '#4f9bff', transparent: true, opacity: 0.42, depthWrite: false }), RAD, [0, 0.58, 0.1]); coldP.castShadow = false;
    const warmP = mesh(new T3.PlaneGeometry(0.92, 0.66), new T3.MeshBasicMaterial({ color: '#ff8a3a', transparent: true, opacity: 0, depthWrite: false }), RAD, [0, 0.58, 0.101]); warmP.castShadow = false;
    const rl = new T3.PointLight('#ff9a50', 0, 3); rl.position.set(2.15, 0.5, -1.1); D.add(rl);
    // ---- tenant + phone ----
    const TN = k.fig(D, '#e8b98f', 1.75, 0, -0.85, 0.95, '#7a3b1e');
    const swM = M.std('#6f5bb5', { roughness: 0.9 }); mesh(new T3.CylinderGeometry(0.218, 0.24, 0.58, 24, 1, true), swM, TN.userData.B, [0, 0.48, 0]); mesh(new T3.TorusGeometry(0.2, 0.034, 8, 24), swM, TN.userData.B, [0, 0.77, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    // ---- timing / state ----
    const WPS = [[0, 1.75, -0.85], [K.warm - 0.4, 1.75, -0.85], [K.write - 0.5, 1.35, -0.95], [K.open - 0.9, 1.35, -0.95], [K.open - 0.35, 1.2, -0.95], [K.runs + 0.3, 1.2, -0.95], [K.runs + 1.2, 1.75, -0.85], [1e3, 1.75, -0.85]];
    const vTN = (t) => { let i = 0; while (i < WPS.length - 2 && t > WPS[i + 1][0]) i++; const a = WPS[i], b = WPS[i + 1], u = E.io(clamp((t - a[0]) / Math.max(0.01, b[0] - a[0]))); return new T3.Vector3(lerp(a[1], b[1], u), 0, lerp(a[2], b[2], u)); };
    const opn = (t) => antMove(t, K.open, 0.4, 0, 1, 1.15) * (1 - antMove(t, K.close, 0.4, 0, 1, 1.15));
    const fillA = (t) => E.io(seg(t, K.open + 0.25, K.close - K.open - 0.3));
    const pres = (t) => 0.5 + 1.55 * fillA(t) + 0.04 * Math.sin(t * 17) * opn(t);
    const heat = (t) => E.io(seg(t, K.runs - 0.1, 1.4));
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.1, 5.6, 1.4, 1.5, 0.95, -1.3, 30)],
      [K.warm - 0.5, P(0.1, 5.4, 1.4, 1.55, 0.95, -1.3, 30), E.lin],
      [K.warm + 0.1, P(0.1, 2.3, 1.0, 2.15, 0.7, -1.45, 25), A9],
      [K.fell - 0.35, P(0.1, 2.3, 1.0, 2.15, 0.7, -1.45, 25), E.lin],
      [K.fell + 0.2, P(-0.15, 1.55, 1.4, 0.88, 1.4, -1.45, 22), A9],
      [K.write - 0.1, P(-0.15, 1.55, 1.4, 0.88, 1.4, -1.45, 22), E.lin],
      [K.write + 0.4, PT(0.5, 2.1, 1.35, 0.95, 25), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 1.5, 1.0, -0.4), A6],
      [K.water - 0.5, P(0.0, 9.2, 2.6, 1.5, 1.0, -0.4), E.lin],
      [K.water + 0.2, P(-0.2, 2.6, 1.3, 0.9, 1.25, -1.45, 25), A9],
      [K.open - 0.4, P(-0.2, 2.4, 1.4, 0.9, 1.45, -1.45, 25), A9],
      [K.close + 0.5, P(-0.2, 2.4, 1.4, 0.9, 1.45, -1.45, 25), E.lin],
      [K.runs - 0.1, P(0.1, 3.4, 1.2, 1.7, 0.85, -1.3, 27), A6],
      [K.no + 0.35, P(0.25, 3.2, 1.4, 1.7, 0.9, -1.0), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3(), _w = new T3.Vector3();
    k.frame((t) => {
      const g = k.grade; g.temp = 0.0 + 0.1 * heat(t); g.th = 1.6; g.bloom = 0.4; g.sat = 1.04;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      const p = pres(t); NDL.rotation.z = ((135 - 67.5 * p) * Math.PI) / 180;
      const ok = p > 1.0 && t > K.open, hv = heat(t);
      ledB.color.setRGB(ok ? 0.2 : 2.6 * (0.6 + 0.4 * Math.sin(t * 7)), ok ? 2.2 : 0.25, ok ? 0.35 : 0.2);
      LEV.rotation.z = (Math.PI / 2) * opn(t);
      const o = opn(t); flowD.forEach((m, i) => { const u = ((t * 1.6 + i / flowD.length) % 1); m.visible = o > 0.5; if (o > 0.5) { hoseC.getPoint(u, _w); m.position.copy(_w); } });
      coldP.material.opacity = 0.42 * (1 - hv); warmP.material.opacity = 0.4 * hv; rl.intensity = 1.6 * hv;
      // tenant: feels the cold radiator, phone, goes to the boiler, opens/closes the valve, relief
      const feel = E.io(seg(t, K.warm - 0.2, 0.3)) * (1 - E.io(seg(t, K.write - 0.9, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.open - 1.0, 0.25)));
      const work = E.io(seg(t, K.open - 0.4, 0.3)) * (1 - E.io(seg(t, K.close + 0.8, 0.3)));
      const joy = MC.spring(t, K.runs, 2.4, 0.35) * (1 - E.io(seg(t, K.no, 0.3)));
      const face = lerp(lerp(2.2, 0.15, E.io(seg(t, K.write - 1.0, 0.4))), Math.PI * 1.05, E.io(seg(t, K.open - 1.0, 0.3)));
      k.drive(TN, t, vTN, {
        face, nod: 0.25 * phoneUp - 0.12 * work, lean: 0.08 * work - 0.1 * joy, squash: 0,
        armL: joy > 0.02 ? -0.4 - 2.4 * joy : -0.2 - 0.5 * work - 1.1 * feel,
        armR: joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 1.2 * phoneUp - 1.9 * work + 0.1 * work * Math.sin(t * 9) - 0.3 * feel,
      });
      k.face(TN, t, { wide: 0.3 * feel, o: 0, smile: joy > 0.1 ? 1 : 0.05, closed: 0 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.8 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.water - 0.5); k.popOut(m2, K.water - 0.44);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.water - 0.3);
    cd.line(0, K.water + 0.1); cd.line(1, K.open); cd.line(2, K.runs);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const lT = ov('tdtag warn', S.low); k.popIn(lT, K.fell + 0.15, { y: 30 }); k.popOut(lT, K.write - 0.5, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.open - 0.05, { y: 30 }); k.popOut(s1, K.needle - 0.12, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.needle - 0.05, { y: 30 }); k.popOut(s2, K.runs - 0.2, { y: -40 });
    const hT = ov('tdtag ok', S.hot); k.popIn(hT, K.runs + 0.05, { y: 40 }); k.popOut(hT, K.no - 0.1, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(lT, new T3.Vector3(0.87, 1.5, -1.3), 300, 780, 230); at(s1, new T3.Vector3(0.85, 1.0, -1.3), 300, 780, -150); at(s2, new T3.Vector3(0.85, 1.0, -1.3), 300, 780, -150);
      at(hT, new T3.Vector3(2.15, 0.95, -1.4), 300, 780, -120); at(okT, new T3.Vector3(1.6, 1.6, -1.0));
      const pe = pres(t); lT.textContent = (de ? '🔻 ' : '🔻 ') + (de ? pe.toFixed(1).replace('.', ',') : pe.toFixed(1)) + ' bar';
    });
    sfx('errbeep', K.fell + 0.1, -15); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12); sfx('refresh', K.water - 0.1, -14);
    sfx('click', K.open - 0.1, -8); sfx('refresh', K.open + 0.3, -12); sfx('click', K.close + 0.2, -8); sfx('chime', K.runs, -9); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
