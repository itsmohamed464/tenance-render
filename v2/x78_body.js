    // ---- X78: washing machine will not drain: unplug, open the flap, unscrew the lint filter, clean it, water drains ----
    mirFog.visible = false;
    const MX = 0.85, MZ = -1.25;
    const whiteM = M.std('#f4f4f1', { roughness: 0.28 });
    mesh(rbox(0.56, 0.85, 0.58, 0.03), whiteM, D, [MX, 0.425, MZ]);
    mesh(rbox(0.56, 0.08, 0.5, 0.02), M.std('#e9ecef', { roughness: 0.3 }), D, [MX, 0.86, MZ]);
    // porthole door with water + clothes + level mask
    const PH = new T3.Group(); PH.position.set(MX, 0.5, MZ + 0.295); D.add(PH);
    mesh(new T3.TorusGeometry(0.15, 0.025, 12, 40), M.std('#d7dce1', { roughness: 0.25 }), PH, [0, 0, 0.0]);
    mesh(new T3.CircleGeometry(0.135, 36), M.std('#20262b', { roughness: 0.6 }), PH, [0, 0, -0.01]);
    const clothes = new T3.Group(); PH.add(clothes);
    ['#d23b30', '#2f7fd0', '#f0b84a', '#3a9d5d'].forEach((c, i) => { const m = mesh(new T3.SphereGeometry(0.045, 10, 8), M.std(c, { roughness: 0.9 }), clothes, [Math.cos(i * 1.6) * 0.07, Math.sin(i * 1.6) * 0.07, -0.002]); m.scale.set(1.2, 0.8, 0.6); });
    const wtr = mesh(new T3.CircleGeometry(0.135, 36), new T3.MeshBasicMaterial({ color: '#4aa8ec', transparent: true, opacity: 0.55, depthWrite: false }), PH, [0, 0, 0.004]); wtr.castShadow = false;
    const mask = mesh(new T3.PlaneGeometry(0.28, 1), new T3.MeshBasicMaterial({ color: '#20262b' }), PH, [0, 0.135, 0.008]); mask.castShadow = false; mask.renderOrder = 2;
    mesh(new T3.CircleGeometry(0.135, 36), new T3.MeshPhysicalMaterial({ color: '#e8f4ff', roughness: 0.03, transparent: true, opacity: 0.18, depthWrite: false, clearcoat: 1 }), PH, [0, 0, 0.02]).castShadow = false;
    // control knobs
    mesh(new T3.CylinderGeometry(0.03, 0.03, 0.02, 16), chrome, D, [MX - 0.12, 0.86, MZ + 0.27], [Math.PI / 2, 0, 0]); mesh(new T3.CylinderGeometry(0.02, 0.02, 0.02, 16), M.std('#2f7fd0'), D, [MX + 0.05, 0.86, MZ + 0.27], [Math.PI / 2, 0, 0]);
    // service flap bottom left, hinged at the bottom edge
    const FL = new T3.Group(); FL.position.set(MX - 0.17, 0.045, MZ + 0.295); D.add(FL);
    const flapM = mesh(rbox(0.14, 0.075, 0.012, 0.004), M.std('#e6e9ec', { roughness: 0.35 }), FL, [0, 0.0375, 0]);
    const slot = mesh(new T3.BoxGeometry(0.12, 0.07, 0.01), M.std('#1a1d20'), D, [MX - 0.17, 0.085, MZ + 0.29]);
    // lint filter (knob + ring of lint)
    const FLT = new T3.Group(); D.add(FLT);
    mesh(new T3.CylinderGeometry(0.03, 0.03, 0.05, 16), M.std('#c9ced4', { roughness: 0.5 }), FLT, [0, 0, 0.02], [Math.PI / 2, 0, 0]); mesh(new T3.CylinderGeometry(0.036, 0.036, 0.016, 16), M.std('#9aa3ad', { roughness: 0.4 }), FLT, [0, 0, 0.05], [Math.PI / 2, 0, 0]);
    const lint = mesh(new T3.IcosahedronGeometry(0.045, 1), M.std('#8c8a86', { roughness: 1 }), FLT, [0, 0.01, 0.0]); lint.scale.set(1.2, 0.9, 1);
    const lintBits = [...Array(7)].map((_, i) => mesh(new T3.SphereGeometry(0.014, 6, 5), M.std('#9d9a94', { roughness: 1 }), FLT, [Math.cos(i * 2.2) * 0.05, Math.sin(i * 2.2) * 0.04, 0.0]));
    // bowl + water stream + wall socket + plug with cable
    const bowl = new T3.Group(); D.add(bowl); mesh(new T3.CylinderGeometry(0.15, 0.11, 0.07, 28, 1, true), new T3.MeshStandardMaterial({ color: '#d9633a', roughness: 0.5, side: T3.DoubleSide }), bowl, [0, 0.035, 0]); mesh(new T3.CircleGeometry(0.11, 24), M.std('#d9633a'), bowl, [0, 0.0, 0], [-Math.PI / 2, 0, 0]);
    const bw = mesh(new T3.CylinderGeometry(0.135, 0.1, 1, 24), new T3.MeshStandardMaterial({ color: '#4aa8ec', roughness: 0.05, transparent: true, opacity: 0.85 }), bowl, [0, 0.01, 0]); bw.castShadow = false;
    const strM = new T3.MeshBasicMaterial({ color: new T3.Color(0.6, 1.4, 2.2), transparent: true, opacity: 0, depthWrite: false });
    const strm = mesh(new T3.CylinderGeometry(0.01, 0.01, 1, 8), strM, D, [0, 0.05, 0]); strm.castShadow = false;
    const SOCK = new T3.Vector3(MX + 0.5, 0.32, -1.585);
    mesh(rbox(0.09, 0.09, 0.014, 0.01), M.std('#f7f7f4'), D, [SOCK.x, SOCK.y, SOCK.z]);
    const plug = mesh(rbox(0.05, 0.04, 0.05, 0.008), M.std('#1f2226', { roughness: 0.5 }), D, [SOCK.x, SOCK.y, SOCK.z + 0.03]);
    const cable = mesh(new T3.CylinderGeometry(0.007, 0.007, 1, 8), M.std('#1f2226', { roughness: 0.6 }), D, [0, 0, 0]); cable.castShadow = false;
    const spark = new T3.Sprite(new T3.SpriteMaterial({ map: k.glow, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, color: new T3.Color(2.0, 1.8, 0.8), opacity: 0 })); spark.scale.setScalar(0.18); D.add(spark);
    // ---- tenant + phone ----
    const TN = k.fig(D, '#e8b98f', 1.55, 0, -0.7, 0.95, '#7a3b1e');
    const swM = M.std('#5aa07a', { roughness: 0.9 }); mesh(new T3.CylinderGeometry(0.218, 0.24, 0.58, 24, 1, true), swM, TN.userData.B, [0, 0.48, 0]); mesh(new T3.TorusGeometry(0.2, 0.034, 8, 24), swM, TN.userData.B, [0, 0.77, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const P0 = new T3.Vector3(1.55, 0, -0.7), P1 = new T3.Vector3(1.2, 0, -0.7);
    const vTN = (t) => P0.clone().lerp(P1, E.io(seg(t, K.plug - 0.45, 0.4)) * (1 - E.io(seg(t, K.drain + 0.2, 0.4))));
    // ---- state ----
    const lvl = (t) => 1 - 0.88 * E.io(seg(t, K.drain, 1.2));
    const flapOpen = (t) => antMove(t, K.flap - 0.05, 0.4, 0, 1, 1.15) * (1 - antMove(t, K.clean + 0.75, 0.35, 0, 1, 1.1));
    const pulled = (t) => antMove(t, K.unscr + 0.2, 0.45, 0, 1, 1.1) * (1 - antMove(t, K.clean + 0.5, 0.4, 0, 1, 1.1));
    const gush = (t) => t > K.unscr - 0.05 && t < K.unscr + 1.0 ? 1 : 0;
    const unplug = (t) => antMove(t, K.plug, 0.4, 0, 1, 1.2) * (1 - antMove(t, K.drain - 0.3, 0.3, 0, 1, 1.0));
    const lintLeft = (t) => 1 - E.io(seg(t, K.clean, 0.5));
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.2, 2.3, 1.0, MX, 0.5, MZ, 27)],
      [K.stuck - 0.2, P(0.15, 1.5, 0.75, MX, 0.5, MZ + 0.2, 25), E.io],
      [K.stuck + 1.0, PT(0.4, 2.4, 1.3, 1.05, 21, 0.03), A9],
      [K.write - 0.3, PT(0.4, 2.4, 1.28, 1.03, 22), E.lin],
      [K.write + 0.2, PT(0.45, 1.8, 1.42, 1.0, 26), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 0.5, 1.15, -0.55), A6],
      [K.plug - 0.5, P(0.0, 9.2, 2.6, 0.5, 1.15, -0.55), E.lin],
      [K.plug - 0.1, P(0.35, 1.9, 0.9, MX + 0.35, 0.45, MZ + 0.1, 28), A9],
      [K.flap + 0.1, P(-0.4, 1.4, 0.75, MX - 0.1, 0.18, MZ + 0.3, 26), A6],
      [K.clean + 0.6, P(-0.4, 1.35, 0.7, MX - 0.1, 0.16, MZ + 0.3, 24), E.lin],
      [K.drain - 0.1, P(0.2, 1.8, 0.85, MX, 0.45, MZ + 0.2, 26), A6],
      [K.no + 0.35, P(0.3, 3.0, 1.5, 0.3, 0.9, -1.0), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3(), A = new T3.Vector3(), B = new T3.Vector3(), UP = new T3.Vector3(0, 1, 0);
    const link = (m, a, b) => { A.copy(a); B.copy(b); const d = B.clone().sub(A); const L = d.length(); m.position.copy(A).addScaledVector(d, 0.5); m.scale.set(1, Math.max(1e-3, L), 1); m.quaternion.setFromUnitVectors(UP, d.normalize()); };
    k.frame((t) => {
      const g = k.grade; g.temp = 0.05; g.th = 1.6; g.bloom = 0.35; g.sat = 1.04;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      // porthole: water level + tumbling clothes after it drains
      const L = lvl(t); mask.scale.y = Math.max(1e-3, 0.27 * (1 - L)); mask.position.y = 0.135 - 0.27 * (1 - L) / 2; clothes.rotation.z = t * (t > K.drain ? 3 : 0.35);
      // plug + cable
      const up = unplug(t); plug.position.set(SOCK.x - 0.05 * up, SOCK.y - 0.06 * up * up, SOCK.z + 0.03 + 0.14 * up); plug.rotation.z = 0.5 * up;
      link(cable, new T3.Vector3(MX + 0.26, 0.5, MZ - 0.2), plug.position);
      spark.position.set(SOCK.x, SOCK.y, SOCK.z + 0.05); spark.material.opacity = Math.exp(-Math.pow((t - (K.plug + 0.12)) / 0.07, 2));
      // flap, filter, bowl, stream
      const fo = flapOpen(t); FL.rotation.x = -1.45 * fo; slot.visible = fo > 0.05;
      const pl = pulled(t); FLT.visible = fo > 0.05 && t < K.clean + 0.95;
      FLT.position.set(MX - 0.17 - 0.03 * pl, 0.085 + 0.09 * pl, MZ + 0.275 + 0.3 * pl); FLT.rotation.z = 4 * (E.io(seg(t, K.unscr, 0.5)) - E.io(seg(t, K.clean + 0.55, 0.4)));
      const ll = lintLeft(t); lint.scale.setScalar(Math.max(1e-3, 1.1 * ll)); lintBits.forEach((m) => m.scale.setScalar(Math.max(1e-3, ll)));
      const bo = E.io(seg(t, K.flap - 0.3, 0.3)) * (1 - E.io(seg(t, K.drain + 0.3, 0.4))); bowl.visible = bo > 0.02; bowl.position.set(MX - 0.2, 0.0, MZ + 0.5); bowl.scale.setScalar(Math.max(1e-3, bo));
      const bl = 0.02 + 0.045 * E.io(seg(t, K.unscr, 1.0)); bw.scale.y = bl; bw.position.y = 0.01 + bl / 2;
      const gs = gush(t); strm.visible = gs > 0; strm.scale.y = 0.2; strm.position.set(MX - 0.2, 0.12, MZ + 0.4); strM.opacity = 0.8 * gs * (0.8 + 0.2 * Math.sin(t * 40));
      // tenant: worried -> phone -> kneels at the machine -> joy
      const worry = E.io(seg(t, 0.4, 0.3)) * (1 - E.io(seg(t, K.write - 0.8, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.plug - 0.9, 0.25)));
      const kneel = E.io(seg(t, K.plug - 0.4, 0.3)) * (1 - E.io(seg(t, K.drain + 0.2, 0.3)));
      const work = kneel;
      const joy = MC.spring(t, K.drain + 0.4, 2.4, 0.35) * (1 - E.io(seg(t, K.no, 0.3)));
      const face = lerp(lerp(-2.24, 0.35, E.io(seg(t, K.write - 1.0, 0.4))), -2.02, E.io(seg(t, K.plug - 0.9, 0.3)));
      k.drive(TN, t, vTN, {
        face, nod: 0.25 * phoneUp + 0.2 * kneel, lean: 0.35 * kneel - 0.1 * joy, lift: -0.18 * kneel, squash: 0,
        armL: joy > 0.02 ? -0.4 - 2.4 * joy : -0.2 - 2.0 * worry - 1.0 * work,
        armR: joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 1.2 * phoneUp - 2.0 * worry - 1.1 * work + 0.1 * work * Math.sin(t * 10),
      });
      k.face(TN, t, { wide: 0.4 * worry, o: 0.2 * worry, smile: joy > 0.1 ? 1 : 0.05 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.plug - 0.5); k.popOut(m2, K.plug - 0.44);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.plug - 0.3);
    cd.line(0, K.plug + 0.1); cd.line(1, K.unscr); cd.line(2, K.drain);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const eT = ov('tdtag warn', S.err); k.popIn(eT, 0.55, { y: 30 }); k.popOut(eT, K.write - 0.3, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.plug - 0.05, { y: 30 }); k.popOut(s1, K.flap - 0.12, { y: -40 });
    const s2 = ov('tdtag step', S.s2); k.popIn(s2, K.flap - 0.05, { y: 30 }); k.popOut(s2, K.clean - 0.12, { y: -40 });
    const s3 = ov('tdtag step', S.s3); k.popIn(s3, K.clean - 0.05, { y: 30 }); k.popOut(s3, K.drain - 0.15, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(eT, new T3.Vector3(MX, 0.8, MZ + 0.2), 240, 840, -60); at(s1, new T3.Vector3(MX + 0.4, 0.5, MZ), 240, 840, -80); at(s2, new T3.Vector3(MX - 0.17, 0.3, MZ + 0.3), 240, 840, -110); at(s3, new T3.Vector3(MX - 0.17, 0.3, MZ + 0.3), 240, 840, -110); at(okT, new T3.Vector3(0.9, 1.9, -1.0));
    });
    sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12); sfx('refresh', K.plug - 0.5, -14);
    sfx('click', K.plug + 0.12, -8); sfx('thud', K.flap + 0.1, -11); sfx('unscrew', K.unscr, -8); sfx('flow', K.unscr + 0.05, -11, { dur: 1.0 });
    sfx('plop', K.clean, -9); sfx('thud', K.clean + 0.8, -11); sfx('gurgle', K.drain - 0.1, -12, { dur: 1.3 }); sfx('drain', K.drain, -10, { dur: 1.2 }); sfx('chime', K.drain + 0.8, -11); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
