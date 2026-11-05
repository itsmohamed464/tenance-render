    // ---- X73: 2 am, dripping tap into a jug: shut-off valve, handle lifts, old washer out, new washer in ----
    mirFog.visible = false; sky.visible = false; sunG.visible = false;
    D.children.forEach((o) => { if (Math.abs(o.position.x - 1.95) < 1e-3 && Math.abs(o.position.y - 0.955) < 1e-3) o.visible = false; }); // set's mug stands where the jug goes
    box(1.0, 0.86, 0.6, M.std('#2f5a44', { roughness: 0.55 }), [2.2, 0.43, -1.3]); box(1.04, 0.05, 0.64, M.std('#dccab0', { roughness: 0.45 }), [2.2, 0.885, -1.3]);
    // faucet: body, spout, lifting handle with spindle + washer
    const FX = 1.95, FZ = -1.52;
    mesh(new T3.CylinderGeometry(0.036, 0.042, 0.04, 20), chrome, D, [FX, 0.93, FZ]);
    mesh(new T3.CylinderGeometry(0.028, 0.028, 0.09, 20), chrome, D, [FX, 0.99, FZ]);
    mesh(new T3.CylinderGeometry(0.014, 0.014, 0.2, 14), chrome, D, [FX, 1.02, FZ + 0.1], [Math.PI / 2, 0, 0]);
    mesh(new T3.CylinderGeometry(0.014, 0.014, 0.05, 14), chrome, D, [FX, 0.995, FZ + 0.2]);
    const HS = new T3.Group(); HS.position.set(FX, 1.045, FZ); D.add(HS);
    mesh(new T3.CylinderGeometry(0.012, 0.012, 0.05, 12), chrome, HS, [0, 0.015, 0]);
    const HND = new T3.Group(); HND.position.set(0, 0.05, 0); HS.add(HND);
    mesh(new T3.BoxGeometry(0.1, 0.018, 0.022), M.std('#2f7fd0', { roughness: 0.35 }), HND, [0, 0, 0]); mesh(new T3.CylinderGeometry(0.016, 0.016, 0.03, 14), chrome, HND, [0, 0.015, 0]);
    const oldW = new T3.Mesh(new T3.TorusGeometry(0.03, 0.012, 8, 20), M.std('#7d746c', { roughness: 0.9 }), ); oldW.rotation.x = Math.PI / 2; oldW.castShadow = true; D.add(oldW);
    const newW = new T3.Mesh(new T3.TorusGeometry(0.03, 0.012, 8, 20), M.std('#1c1c1f', { roughness: 0.5 })); newW.rotation.x = Math.PI / 2; newW.castShadow = true; D.add(newW);
    // jug with water
    const JX = FX, JZ = FZ + 0.2;
    mesh(new T3.CylinderGeometry(0.062, 0.054, 0.15, 28, 1, true), new T3.MeshPhysicalMaterial({ color: '#e6f4ff', roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false, side: T3.DoubleSide, clearcoat: 1 }), D, [JX, 0.91 + 0.075, JZ]).castShadow = false;
    const waterM = new T3.MeshStandardMaterial({ color: '#7fc4f0', roughness: 0.08, transparent: true, opacity: 0.8 });
    const water = mesh(new T3.CylinderGeometry(0.052, 0.047, 1, 28), waterM, D, [JX, 0.92, JZ]); water.castShadow = false;
    const dropM = new T3.MeshStandardMaterial({ color: '#bfe6ff', roughness: 0.05, transparent: true, opacity: 0.92 });
    const drop = mesh(new T3.SphereGeometry(0.011, 12, 10), dropM, D, [JX, -5, JZ]); drop.castShadow = false;
    const splash = mesh(new T3.TorusGeometry(0.02, 0.0025, 6, 24), new T3.MeshBasicMaterial({ color: '#e8f6ff', transparent: true, opacity: 0, depthWrite: false }), D, [JX, 0.93, JZ], [Math.PI / 2, 0, 0]); splash.castShadow = false;
    // shut-off valve on the wall (blue knob)
    const VX = 1.5, VY = 0.5, VZ = -1.5;
    mesh(new T3.CylinderGeometry(0.015, 0.015, 0.1, 12), chrome, D, [VX, VY, -1.55], [Math.PI / 2, 0, 0]);
    mesh(new T3.CylinderGeometry(0.026, 0.026, 0.07, 16), chrome, D, [VX, VY, VZ + 0.01], [0, 0, Math.PI / 2]);
    const knob = new T3.Group(); knob.position.set(VX, VY, VZ + 0.05); D.add(knob);
    mesh(new T3.CylinderGeometry(0.036, 0.036, 0.012, 20), M.std('#2f7fd0', { roughness: 0.35 }), knob, [0, 0, 0], [Math.PI / 2, 0, 0]); mesh(new T3.BoxGeometry(0.07, 0.012, 0.01), M.std('#f7f3ec'), knob, [0, 0, 0.008]);
    // ---- tenant (pajamas) + phone ----
    const TN = k.fig(D, '#d9a47c', 1.62, 0, -0.9, 0.95, '#3b2a20');
    const pjM = M.std('#5c78a8', { roughness: 0.9 }); mesh(new T3.CylinderGeometry(0.214, 0.236, 0.56, 24, 1, true), pjM, TN.userData.B, [0, 0.48, 0]); mesh(new T3.TorusGeometry(0.2, 0.03, 8, 24), pjM, TN.userData.B, [0, 0.76, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const POS = new T3.Vector3(1.62, 0, -0.9); const vTN = () => POS.clone();
    // ---- state ----
    const T0 = 0.3, PER = 0.62, TIP = 0.945;
    const dripping = (t) => t >= T0 && t < K.shut + 0.35;
    const lvl = (t) => lerp(0.12, 0.62, clamp(t / (K.shut + 0.3), 0, 1));
    const shut = (t) => antMove(t, K.shut, 0.45, 0, 1, 1.1) * (1 - antMove(t, K.over - 0.35, 0.4, 0, 1, 1.1));
    const hOpen = (t) => antMove(t, K.open, 0.4, 0, 1, 1.1);
    const lift = (t) => antMove(t, K.swap - 0.1, 0.4, 0, 1, 1.1) * (1 - antMove(t, K.swap + 0.8, 0.4, 0, 1, 1.1));
    const oldAway = (t) => antMove(t, K.swap + 0.35, 0.35, 0, 1, 1.0), newIn = (t) => antMove(t, K.swap + 0.5, 0.3, 0, 1, 1.1);
    const calm = (t) => E.io(seg(t, K.over + 0.1, 0.9));
    const count = (t) => Math.round(86400 * E.io(seg(t, K.sec + 0.15, Math.max(1.2, K.num + 0.6 - K.sec))));
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.3, 2.3, 1.35, 1.95, 1.0, -1.45, 26)],
      [K.sec - 0.3, P(0.3, 1.3, 1.15, 1.95, 0.98, -1.4, 24), E.io],
      [K.num + 0.5, PT(0.5, 2.4, 1.3, 1.0, 22, 0.03), A9],
      [K.write + 0.2, PT(0.45, 1.8, 1.42, 1.0, 26), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 0.1, 1.15, -0.55), A6],
      [K.shut - 0.3, P(0.0, 9.2, 2.6, 0.1, 1.15, -0.55), E.lin],
      [K.shut + 0.1, P(-0.5, 1.5, 0.8, 1.5, 0.5, -1.5, 24), A9],
      [K.open - 0.1, P(0.4, 1.6, 1.25, 1.95, 0.98, -1.4, 24), A6],
      [K.swap - 0.2, P(0.4, 1.9, 1.45, 1.95, 1.17, -1.4, 24), A6],
      [K.over + 0.1, P(0.35, 1.35, 1.2, 1.95, 0.98, -1.4, 24), E.lin],
      [K.no + 0.35, P(0.5, 2.8, 1.5, 1.5, 0.9, -1.0), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3();
    k.frame((t) => {
      const cm = calm(t), g = k.grade; g.temp = -0.4 + 0.65 * cm; g.th = 1.6; g.bloom = 0.4; g.sat = 1.04;
      sun.intensity = lerp(0.12, 1.9, cm); keyL.intensity = lerp(0.25, 0.7, cm);
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      // drop: swells at the spout, falls, splashes in the jug
      const hW = 0.13 * lvl(t), ys = 0.915 + hW; water.scale.y = Math.max(1e-3, hW); water.position.y = 0.915 + hW / 2;
      if (dripping(t)) {
        const a = (((t - T0) / PER) % 1 + 1) % 1, sw = Math.min(1, a / 0.55), fa = a > 0.55 ? (a - 0.55) / 0.45 : 0;
        drop.visible = true; drop.scale.setScalar(a < 0.55 ? 0.25 + 0.75 * sw : 1 - 0.3 * fa); drop.scale.y *= a < 0.55 ? 1 : 1.35;
        drop.position.set(JX, a < 0.55 ? TIP - 0.012 * sw + 0.012 : lerp(TIP, ys, fa * fa), JZ);
        const sp = a < 0.12 ? a / 0.12 : 1; splash.material.opacity = a < 0.3 ? 0.7 * (1 - a / 0.3) : 0; splash.scale.setScalar(0.4 + 2.2 * (a < 0.3 ? a / 0.3 : 1)); splash.position.y = ys + 0.001;
      } else { drop.visible = false; splash.material.opacity = 0; }
      // valve knob, tap handle, lifting spindle, washers
      knob.rotation.z = -Math.PI / 2 * shut(t);
      const lf = lift(t); HS.position.y = 1.045 + 0.15 * lf; HND.rotation.y = 0.9 * hOpen(t);
      const oa = oldAway(t), ni = newIn(t);
      oldW.visible = t < K.swap + 0.7; oldW.position.set(FX + 0.22 * oa, 1.02 + 0.15 * lf - 0.45 * oa * oa, FZ + 0.0 + 0.1 * oa); oldW.rotation.z = 5 * oa;
      newW.visible = t > K.swap + 0.45; newW.position.set(FX + 0.2 * (1 - ni), 1.02 + 0.15 * lf, FZ);
      // tenant: ears covered -> phone -> kneels at the valve -> reaches the tap -> relief
      const ears = E.io(seg(t, 0.3, 0.3)) * (1 - E.io(seg(t, K.write - 0.75, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.shut - 0.9, 0.25)));
      const kneel = E.io(seg(t, K.shut - 0.4, 0.3)) * (1 - E.io(seg(t, K.open - 0.2, 0.3)));
      const reach = E.io(seg(t, K.open - 0.3, 0.3)) * (1 - E.io(seg(t, K.over + 0.1, 0.3)));
      const joy = MC.spring(t, K.over + 0.3, 2.4, 0.35) * (1 - E.io(seg(t, K.no + 0.2, 0.3)));
      const face = lerp(lerp(lerp(2.4, 0.55, E.io(seg(t, K.write - 1.0, 0.4))), 3.34, E.io(seg(t, K.shut - 0.9, 0.3))), 2.65, E.io(seg(t, K.open - 0.35, 0.3)));
      k.drive(TN, t, vTN, {
        face, squash: -0.05 * (dripping(t) && ((t - T0) % PER) < 0.1 ? 1 : 0) * ears, tilt: 0.05 * Math.sin(t * 7) * ears, nod: 0.25 * phoneUp - 0.15 * reach + 0.2 * kneel,
        lift: -0.2 * kneel, lean: 0.35 * kneel - 0.12 * joy + 0.1 * reach,
        armL: joy > 0.02 ? -0.4 - 2.4 * joy : -0.2 - 2.0 * ears - 1.0 * kneel - 1.5 * reach,
        armR: joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 1.2 * phoneUp - 2.0 * ears - 1.1 * kneel - 1.7 * reach + 0.1 * kneel * Math.sin(t * 12),
      });
      k.face(TN, t, { wide: 0.5 * ears, o: 0, smile: joy > 0.1 ? 1 : 0.05 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.shut - 0.45); k.popOut(m2, K.shut - 0.39);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.shut - 0.3);
    cd.line(0, K.shut + 0.1); cd.line(1, K.swap); cd.line(2, K.over + 0.1);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const cT = ov('tdtag warn', '💧 0'); k.popIn(cT, K.sec - 0.1, { y: 30 }); k.popOut(cT, K.turn - 0.25, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.shut - 0.05, { y: 30 }); k.popOut(s1, K.open - 0.12, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.open - 0.05, { y: 30 }); k.popOut(s2, K.swap - 0.12, { y: -40 });
    const s3 = ov('tdtag step', S.s3); k.popIn(s3, K.swap - 0.05, { y: 30 }); k.popOut(s3, K.over - 0.12, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      cT.textContent = '💧 ' + String(count(t)).replace(/\B(?=(\d{3})+(?!\d))/g, de ? '.' : ',') + ' ' + S.per;
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(cT, new T3.Vector3(FX, 1.1, JZ), 240, 840, -120); at(s1, new T3.Vector3(VX, VY, VZ), 240, 840, -150);
      at(s2, new T3.Vector3(FX, 1.1, FZ + 0.1), 240, 840, -150); at(s3, new T3.Vector3(FX, 1.1, FZ + 0.1), 240, 840, -150); at(okT, new T3.Vector3(1.6, 1.9, -0.9));
    });
    for (let tc = T0 + PER * 0.97; tc < K.shut + 0.35; tc += PER) sfx('drip', tc, -14);
    sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12);
    sfx('refresh', K.shut - 0.4, -14); sfx('squeak', K.shut + 0.05, -10); sfx('click', K.open + 0.1, -9); sfx('unscrew', K.swap - 0.05, -9);
    sfx('plop', K.swap + 0.5, -8); sfx('thud', K.swap + 0.85, -12); sfx('chime', K.over, -10); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
