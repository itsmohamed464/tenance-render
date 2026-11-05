    // ---- X80: parcel courier rings, the chime stays silent: dead battery in the wireless button, swap it, bell rings again ----
    mirFog.visible = false;
    // door + frame
    mesh(rbox(0.96, 2.05, 0.05, 0.02), M.std('#7a4f2e', { roughness: 0.6 }), D, [0.9, 1.025, -1.55]);
    mesh(rbox(1.06, 0.06, 0.07, 0.01), M.std('#f3efe6'), D, [0.9, 2.08, -1.55]); mesh(rbox(0.06, 2.1, 0.07, 0.01), M.std('#f3efe6'), D, [0.4, 1.05, -1.55]); mesh(rbox(0.06, 2.1, 0.07, 0.01), M.std('#f3efe6'), D, [1.4, 1.05, -1.55]);
    mesh(new T3.CylinderGeometry(0.025, 0.025, 0.07, 14), chrome, D, [1.22, 1.0, -1.5], [Math.PI / 2, 0, 0]); mesh(new T3.BoxGeometry(0.12, 0.02, 0.02), chrome, D, [1.17, 1.0, -1.46]);
    // wireless button on the wall (scaled up a bit), with a removable battery cover
    const BT = new T3.Group(); BT.position.set(1.52, 1.3, -1.52); BT.scale.setScalar(2.2); D.add(BT);
    mesh(rbox(0.07, 0.13, 0.02, 0.008), M.std('#f7f7f4', { roughness: 0.3 }), BT, [0, 0, 0]);
    const cap = mesh(new T3.CylinderGeometry(0.022, 0.022, 0.012, 20), M.std('#2f7fd0', { roughness: 0.35 }), BT, [0, 0.025, 0.014], [Math.PI / 2, 0, 0]);
    const ledM = new T3.MeshBasicMaterial({ color: new T3.Color(0.15, 0.05, 0.05) }); mesh(new T3.SphereGeometry(0.006, 10, 8), ledM, BT, [0.022, 0.056, 0.012]).castShadow = false;
    const ledG = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, color: new T3.Color(2.4, 0.3, 0.2), opacity: 0 })); BT.add(ledG); ledG.position.set(0.022, 0.056, 0.02); ledG.scale.setScalar(0.07);
    mesh(new T3.BoxGeometry(0.05, 0.034, 0.006), M.std('#15181b'), BT, [0, -0.04, 0.011]);
    const COV = new T3.Group(); COV.position.set(0, -0.04, 0.016); BT.add(COV); mesh(rbox(0.055, 0.038, 0.007, 0.003), M.std('#e9ebee', { roughness: 0.35 }), COV, [0, 0, 0]); const scr = mesh(new T3.CylinderGeometry(0.006, 0.006, 0.006, 10), chrome, COV, [0, 0, 0.005], [Math.PI / 2, 0, 0]);
    const batOld = mesh(new T3.CylinderGeometry(0.016, 0.016, 0.004, 18), M.std('#8b9096', { metalness: 0.5, roughness: 0.6 }), BT, [0, -0.04, 0.013], [Math.PI / 2, 0, 0]);
    const batNew = mesh(new T3.CylinderGeometry(0.016, 0.016, 0.004, 18), M.std('#e6c04a', { metalness: 0.8, roughness: 0.25 }), BT, [0, -0.04, 0.013], [Math.PI / 2, 0, 0]); batNew.visible = false;
    // chime unit inside
    const CH = new T3.Group(); CH.position.set(0.22, 1.7, -1.52); D.add(CH);
    mesh(rbox(0.26, 0.17, 0.05, 0.02), M.std('#f7f7f4', { roughness: 0.3 }), CH, [0, 0, 0]);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) mesh(new T3.CylinderGeometry(0.006, 0.006, 0.004, 8), M.std('#3a4046'), CH, [-0.07 + c * 0.028, 0.03 - r * 0.028, 0.026], [Math.PI / 2, 0, 0]);
    const chLed = new T3.MeshBasicMaterial({ color: new T3.Color(0.1, 0.3, 0.1) }); mesh(new T3.SphereGeometry(0.008, 10, 8), chLed, CH, [0.1, -0.07, 0.027]).castShadow = false;
    const rings = [0, 1, 2].map(() => { const m = mesh(new T3.TorusGeometry(0.18, 0.006, 6, 40), new T3.MeshBasicMaterial({ color: new T3.Color(0.4, 2.2, 0.6), transparent: true, opacity: 0, depthWrite: false, blending: T3.AdditiveBlending }), CH, [0, 0, 0.04]); m.castShadow = false; return m; });
    // courier with parcel
    const DG = k.fig(D, '#7a5a3a', 2.15, 0, -1.15, 0.95, '#222222', { cap: '#7a5a3a' });
    mesh(new T3.CylinderGeometry(0.214, 0.236, 0.56, 24, 1, true), M.std('#7a5a3a', { roughness: 0.8 }), DG.userData.B, [0, 0.48, 0]);
    const parcel = mesh(rbox(0.3, 0.2, 0.22, 0.015), M.std('#c9a06a', { roughness: 0.8 }), DG.userData.B, [0, 0.52, 0.3]); mesh(new T3.BoxGeometry(0.31, 0.02, 0.06), M.std('#e7d9b8'), parcel, [0, 0, 0.0]);
    // ---- tenant + phone ----
    const TN = k.fig(D, '#e8b98f', 0.45, 0, -0.9, 0.95, '#7a3b1e');
    const swM = M.std('#6f5bb5', { roughness: 0.9 }); mesh(new T3.CylinderGeometry(0.218, 0.24, 0.58, 24, 1, true), swM, TN.userData.B, [0, 0.48, 0]); mesh(new T3.TorusGeometry(0.2, 0.034, 8, 24), swM, TN.userData.B, [0, 0.77, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const P0 = new T3.Vector3(0.45, 0, -0.9), P1 = new T3.Vector3(1.1, 0, -1.2);
    const vTN = (t) => P0.clone().lerp(P1, E.io(seg(t, K.unscr - 1.0, 0.5)) * (1 - E.io(seg(t, K.ring2 + 0.6, 0.5))));
    const DP = new T3.Vector3(2.15, 0, -1.15), vDG = () => DP.clone();
    // ---- state ----
    const press1 = (t) => Math.exp(-Math.pow((t - (K.rings + 0.15)) / 0.08, 2)), press2 = (t) => Math.exp(-Math.pow((t - (K.ring2 - 0.12)) / 0.08, 2));
    const ringing = (t) => t > K.ring2 && t < K.ring2 + 1.5;
    const coverOff = (t) => antMove(t, K.unscr, 0.5, 0, 1, 1.15) * (1 - antMove(t, K.back + 0.2, 0.4, 0, 1, 1.1));
    const swap = (t) => antMove(t, K.fresh - 0.2, 0.5, 0, 1, 1.1);
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.1, 3.3, 1.35, 1.1, 1.15, -1.4, 28)],
      [K.rings - 0.3, P(0.15, 2.0, 1.35, 1.7, 1.25, -1.4, 24), E.io],
      [K.silent - 0.4, P(-0.1, 2.1, 1.45, 0.7, 1.45, -1.4, 25), A9],
      [K.silent + 0.6, PT(0.5, 2.4, 1.3, 1.05, 22, 0.03), A9],
      [K.write + 0.2, PT(0.5, 1.8, 1.42, 1.0, 26), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 0.8, 1.15, -0.4), A6],
      [K.unscr - 0.9, P(0.0, 9.2, 2.6, 0.8, 1.15, -0.4), E.lin],
      [K.unscr - 0.3, P(0.1, 1.3, 1.3, 1.5, 1.3, -1.45, 22), A9],
      [K.back + 0.4, P(0.1, 1.25, 1.3, 1.5, 1.3, -1.45, 22), E.lin],
      [K.ring2 - 0.1, P(0.05, 3.4, 1.4, 1.0, 1.4, -1.4, 29), A6],
      [K.no + 0.35, P(0.25, 3.0, 1.5, 1.4, 1.0, -1.0), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3();
    k.frame((t) => {
      const g = k.grade; g.temp = 0.05; g.th = 1.6; g.bloom = 0.4; g.sat = 1.04;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      // button LED: dim red flash on press (dead), green after the swap
      const p1 = press1(t), p2 = press2(t), green = t > K.fresh;
      cap.position.z = 0.014 - 0.006 * Math.max(p1, p2);
      if (green) { ledM.color.setRGB(0.2, 2.2, 0.3); ledG.material.color.setRGB(0.3, 2.2, 0.4); ledG.material.opacity = 0.9 * Math.max(p2, 0.25); }
      else { const f = 0.12 + 0.3 * p1; ledM.color.setRGB(2.4 * f, 0.2 * f, 0.15 * f); ledG.material.color.setRGB(2.4, 0.3, 0.2); ledG.material.opacity = 0.35 * p1; }
      // cover off, old battery drops out, new one slides in
      const co = coverOff(t); COV.position.set(0, -0.04 - 0.01 * co, 0.016 + 0.12 * co); COV.rotation.set(-0.6 * co, 0, 3 * co * 0); scr.rotation.y = 12 * E.io(seg(t, K.unscr, 0.4)) - 12 * E.io(seg(t, K.back + 0.15, 0.4));
      const sw = swap(t); batOld.visible = t < K.fresh + 0.4; batOld.position.set(0.05 * sw, -0.04 - 0.1 * sw * sw, 0.013 + 0.03 * sw); batNew.visible = sw > 0.01 && co > 0.05 || t > K.fresh; batNew.position.set(0.05 * (1 - sw), -0.04, 0.013);
      // chime rings with expanding green rings
      const rg = ringing(t); chLed.color.setRGB(rg ? 0.2 : 0.1, rg ? 2.0 : 0.3, rg ? 0.3 : 0.1);
      CH.rotation.z = rg ? 0.05 * Math.sin(t * 40) * Math.exp(-(t - K.ring2) * 1.5) : 0;
      rings.forEach((m, i) => { const a = clamp(((t - K.ring2) / 1.0) - i * 0.18, 0, 1), on = rg && a > 0 && a < 1; m.material.opacity = on ? (1 - a) * 0.9 : 0; m.scale.setScalar(0.35 + a * 2.2); });
      // courier: presses, shrugs, waits, presses again, hands over the parcel
      const dPress = Math.max(antMove(t, K.rings - 0.2, 0.3, 0, 1, 1.2) * (1 - E.io(seg(t, K.rings + 0.3, 0.3))), antMove(t, K.ring2 - 0.45, 0.3, 0, 1, 1.2) * (1 - E.io(seg(t, K.ring2 + 0.2, 0.3))));
      const shrug = E.io(seg(t, K.rings + 0.5, 0.3)) * (1 - E.io(seg(t, K.ring2 - 0.55, 0.3)));
      const hand = E.io(seg(t, K.ring2 + 0.5, 0.4)) * (1 - E.io(seg(t, K.no + 0.2, 0.4)));
      parcel.position.set(0, 0.52, 0.3 + 0.1 * hand);
      k.drive(DG, t, vDG, { face: lerp(-1.5, -1.9, dPress), nod: 0.1 * shrug, lean: 0.12 * hand + 0.05 * Math.sin(t * 3) * shrug, armL: -0.9 - 0.2 * hand, armR: -0.9 - 1.5 * dPress + 0.5 * shrug - 0.5 * hand, armLz: 0.7 * shrug, armRz: 0 });
      k.face(DG, t, { wide: 0, o: 0, smile: hand > 0.3 ? 1 : 0.1 });
      // tenant: listens at the chime -> phone -> walks to the button, works -> relief
      const listen = E.io(seg(t, K.rings + 0.2, 0.3)) * (1 - E.io(seg(t, K.write - 0.8, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.unscr - 1.1, 0.25)));
      const work = E.io(seg(t, K.unscr - 0.5, 0.3)) * (1 - E.io(seg(t, K.back + 0.9, 0.3)));
      const joy = MC.spring(t, K.ring2 + 0.2, 2.4, 0.35) * (1 - E.io(seg(t, K.no, 0.3)));
      const face = lerp(lerp(-0.6, 0.45, E.io(seg(t, K.write - 1.0, 0.4))), 1.7, E.io(seg(t, K.unscr - 1.1, 0.3)));
      k.drive(TN, t, vTN, {
        face, nod: 0.25 * phoneUp - 0.1 * work, lean: 0.1 * work - 0.1 * joy, squash: 0,
        armL: joy > 0.02 ? -0.4 - 2.4 * joy : -0.2 - 0.9 * work,
        armR: joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 2.3 * listen - 1.2 * phoneUp - 1.5 * work + 0.1 * work * Math.sin(t * 11),
      });
      k.face(TN, t, { wide: 0.3 * listen, o: 0, smile: joy > 0.1 ? 1 : 0.05, closed: 0.3 * listen });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.unscr - 0.5); k.popOut(m2, K.unscr - 0.44);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.unscr - 0.3);
    cd.line(0, K.unscr + 0.1); cd.line(1, K.fresh); cd.line(2, K.ring2);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const eT = ov('tdtag warn', S.err); k.popIn(eT, K.rings + 0.35, { y: 30 }); k.popOut(eT, K.write - 0.5, { y: -40 });
    const bT = ov('tdtag warn', S.bat); k.popIn(bT, K.battery + 0.05, { y: 30 }); k.popOut(bT, K.unscr - 0.55, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.unscr - 0.05, { y: 30 }); k.popOut(s1, K.fresh - 0.12, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.fresh - 0.05, { y: 30 }); k.popOut(s2, K.back - 0.12, { y: -40 });
    const s3 = ov('tdtag step', S.s3); k.popIn(s3, K.back - 0.05, { y: 30 }); k.popOut(s3, K.ring2 - 0.2, { y: -40 });
    const rT = ov('tdtag ok', S.ring); k.popIn(rT, K.ring2 + 0.05, { y: 40 }); k.popOut(rT, K.no - 0.1, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(eT, new T3.Vector3(0.22, 1.7, -1.5), 240, 840, -110); at(bT, new T3.Vector3(1.52, 1.3, -1.5), 240, 840, -140); [s1, s2, s3].forEach((e) => at(e, new T3.Vector3(1.52, 1.3, -1.5), 240, 840, -140));
      at(rT, new T3.Vector3(0.22, 1.7, -1.5), 240, 840, -110); at(okT, new T3.Vector3(1.0, 2.2, -1.0));
    });
    sfx('errbeep', K.rings + 0.15, -14); sfx('errbeep', K.silent + 0.3, -16); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12); sfx('refresh', K.battery - 0.1, -14);
    sfx('unscrew', K.unscr, -8); sfx('thud', K.unscr + 0.7, -13); sfx('click', K.fresh + 0.1, -8); sfx('unscrew', K.back, -8);
    sfx('click', K.ring2 - 0.12, -8); sfx('chime', K.ring2, -7); sfx('chime', K.ring2 + 0.55, -9); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
