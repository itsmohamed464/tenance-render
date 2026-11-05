    // ---- X76: limescale shower head: thin crooked spray, vinegar bag over the head, wait, rinse, strong spray ----
    mirFog.visible = false;
    D.children.forEach((o) => { if (Math.abs(o.position.x + 2.6) < 1e-3 && Math.abs(o.position.y - 2.08) < 1e-3) o.visible = false; }); // old arm stub
    head.position.set(-2.6, 1.5, -1.3); head.rotation.x = 0.25;
    mesh(new T3.CylinderGeometry(0.016, 0.016, 0.3, 12), chrome, D, [-2.6, 1.5, -1.44], [Math.PI / 2, 0, 0]);
    const HP = new T3.Vector3(-2.6, 1.46, -1.28), TILT = 0.25, JL = 1.4;
    // water jets: weak + crooked at first, dense and straight after the fix
    const jetM = () => new T3.MeshBasicMaterial({ color: new T3.Color(0.9, 1.5, 2.0), transparent: true, opacity: 0, depthWrite: false });
    const mkJet = (ax, az, w) => { const g = new T3.Group(); g.position.copy(HP); g.rotation.set(TILT + ax, 0, az); D.add(g); const m = mesh(new T3.CylinderGeometry(w, w * 0.7, JL, 6), jetM(), g, [0, -JL / 2, 0]); m.castShadow = false; return m; };
    const weak = [[0.0, 0.04, 0.004], [0.28, -0.22, 0.003], [-0.1, 0.3, 0.003]].map(([a, b, w]) => mkJet(a, b, w));
    const strong = [...Array(16)].map((_, i) => { const r = 0.09 + 0.06 * (i % 3), an = i * 2.4; return mkJet(Math.cos(an) * r, Math.sin(an) * r, 0.0055); });
    // limescale crust on the head face
    const crustM = M.std('#ece6da', { roughness: 0.95 });
    const crust = [...Array(14)].map((_, i) => { const an = i * 2.4, r = 0.02 + 0.085 * ((i * 0.37) % 1); const m = mesh(new T3.SphereGeometry(0.014 + 0.01 * MC.rnd(i, 1), 8, 6), crustM, head, [Math.cos(an) * r, -0.03, Math.sin(an) * r]); m.scale.y = 0.6; return m; });
    // vinegar bag around the head
    const BG = new T3.Group(); D.add(BG);
    const bagM = new T3.MeshPhysicalMaterial({ color: '#f1f7ff', roughness: 0.1, transparent: true, opacity: 0.28, depthWrite: false, side: T3.DoubleSide, clearcoat: 1 });
    const bag = mesh(new T3.SphereGeometry(0.17, 22, 16), bagM, BG, [0, -0.02, 0]); bag.scale.set(1, 1.25, 1); bag.castShadow = false;
    const liq = mesh(new T3.SphereGeometry(0.15, 22, 16, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58), new T3.MeshStandardMaterial({ color: '#ead48a', roughness: 0.1, transparent: true, opacity: 0.5, side: T3.DoubleSide }), BG, [0, -0.04, 0]); liq.scale.set(1, 1.15, 1); liq.castShadow = false;
    mesh(new T3.TorusGeometry(0.03, 0.008, 8, 16), M.std('#d23b30'), BG, [0, 0.22, 0], [Math.PI / 2, 0, 0]);
    const bub = [...Array(9)].map((_, i) => { const m = mesh(new T3.SphereGeometry(0.008, 8, 6), new T3.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 }), BG, [0, 0, 0]); m.castShadow = false; return m; });
    // ---- tenant (pyjamas) + phone ----
    const TN = k.fig(D, '#e8b98f', -2.1, 0.09, -0.8, 0.95, '#7a3b1e');
    const pjM = M.std('#c98fd0', { roughness: 0.9 }); mesh(new T3.CylinderGeometry(0.218, 0.24, 0.6, 24, 1, true), pjM, TN.userData.B, [0, 0.46, 0]); mesh(new T3.TorusGeometry(0.2, 0.03, 8, 24), pjM, TN.userData.B, [0, 0.76, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const POS = new T3.Vector3(-2.1, 0.09, -0.8); const vTN = () => POS.clone();
    // ---- state ----
    const onWeak = (t) => (t > 0.25 && t < K.bag - 0.45 ? 1 : 0) * (1 - E.io(seg(t, K.bag - 0.6, 0.2)));
    const onStrong = (t) => E.io(seg(t, K.rinse + 0.2, 0.2));
    const rinsing = (t) => t > K.rinse - 0.05 && t < K.strong - 0.2 ? 1 : 0;
    const bagIn = (t) => MC.spring(t, K.bag - 0.1, 2.2, 0.45) * (1 - antMove(t, K.rinse - 0.05, 0.3, 0, 1, 1.1));
    const clean = (t) => E.io(seg(t, K.rinse, 0.5));
    const cooking = (t) => (t > K.wait && t < K.rinse ? 1 : 0);
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(-0.1, 2.5, 1.2, -2.6, 1.0, -1.3, 28)],
      [K.spray - 0.3, P(-0.15, 1.6, 1.3, -2.6, 1.0, -1.3, 24), E.io],
      [K.spray + 0.7, PT(0.4, 2.4, 1.3, 1.05, 21, 0.03), A9],
      [K.write - 0.3, PT(0.4, 2.4, 1.28, 1.03, 22), E.lin],
      [K.write + 0.2, PT(0.45, 1.8, 1.42, 1.0, 26), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, -0.8, 1.15, -0.55), A6],
      [K.scale - 0.3, P(0.0, 9.2, 2.6, -0.8, 1.15, -0.55), E.lin],
      [K.scale + 0.15, P(-0.25, 1.6, 1.4, -2.6, 1.3, -1.3, 26), A9],
      [K.bag + 0.1, P(-0.25, 1.5, 1.4, -2.6, 1.35, -1.3, 24), A6],
      [K.rinse + 0.5, P(-0.2, 1.9, 1.15, -2.6, 0.95, -1.3, 28), A6],
      [K.no + 0.35, P(0.3, 3.0, 1.5, -2.2, 0.9, -1.0), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3();
    k.frame((t) => {
      const g = k.grade; g.temp = 0.05; g.th = 1.6; g.bloom = 0.4; g.sat = 1.04;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      const w = onWeak(t), st = onStrong(t), rn = rinsing(t) * (1 - st);
      weak.forEach((m, i) => { m.material.opacity = (0.55 * w + 0.5 * rn * (i === 0 ? 1 : 0)) * (0.8 + 0.2 * Math.sin(t * 30 + i * 2)); });
      strong.forEach((m, i) => { m.material.opacity = (0.5 * st + 0.35 * rn) * (0.8 + 0.2 * Math.sin(t * 36 + i)); });
      const cl = clean(t); crust.forEach((m, i) => { m.scale.setScalar(Math.max(1e-3, 1 - cl)); });
      const bg = bagIn(t); BG.visible = bg > 0.02; BG.position.set(HP.x, HP.y - 0.02, HP.z); BG.scale.setScalar(Math.max(1e-3, bg));
      bub.forEach((m, i) => { const a = (((t * 0.8 + i / bub.length) % 1) + 1) % 1; m.position.set((MC.rnd(i, 1) - 0.5) * 0.14, -0.14 + a * 0.18, (MC.rnd(i, 2) - 0.5) * 0.14); m.visible = cooking(t) > 0; });
      // tenant: ears -> phone -> reaches up, hangs the bag -> waits -> removes it -> joy
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.scale - 0.5, 0.25)));
      const reach = (E.io(seg(t, K.bag - 0.45, 0.3)) * (1 - E.io(seg(t, K.wait - 0.1, 0.3)))) + (E.io(seg(t, K.rinse - 0.5, 0.3)) * (1 - E.io(seg(t, K.rinse + 0.4, 0.3))));
      const joy = MC.spring(t, K.strong + 0.1, 2.4, 0.35) * (1 - E.io(seg(t, K.no, 0.3)));
      const face = lerp(lerp(-2.36, 0.4, E.io(seg(t, K.spray + 0.3, 0.4))), -2.36, E.io(seg(t, K.scale - 0.5, 0.3)));
      k.drive(TN, t, vTN, {
        face, nod: 0.25 * phoneUp - 0.25 * reach, lean: -0.1 * reach - 0.1 * joy, squash: 0,
        armL: joy > 0.02 ? -0.4 - 2.4 * joy : -0.2 - 2.0 * reach,
        armR: joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 1.2 * phoneUp - 2.1 * reach,
      });
      k.face(TN, t, { wide: 0, o: 0, smile: joy > 0.1 ? 1 : 0.1 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.bag - 0.5); k.popOut(m2, K.bag - 0.44);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.bag - 0.3);
    cd.line(0, K.bag + 0.1); cd.line(1, K.wait); cd.line(2, K.strong);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const eT = ov('tdtag warn', S.err); k.popIn(eT, 0.55, { y: 30 }); k.popOut(eT, K.write - 0.3, { y: -40 });
    const lT = ov('tdtag warn', S.lime); k.popIn(lT, K.scale + 0.05, { y: 30 }); k.popOut(lT, K.bag - 0.5, { y: -40 });
    const s1 = ov('tdtag step', S.s1); k.popIn(s1, K.bag - 0.05, { y: 30 }); k.popOut(s1, K.wait - 0.12, { y: -40 });
    const tm = ov('tdtimer', '<i></i><b>60:00</b>'); tl.set(tm, { xPercent: -50 }, 0); k.popIn(tm, K.wait - 0.05, { y: 40 }); k.popOut(tm, K.rinse - 0.1, { y: -40 });
    const tmB = tm.querySelector('b');
    const s3 = ov('tdtag step', S.s3); k.popIn(s3, K.rinse - 0.05, { y: 30 }); k.popOut(s3, K.strong - 0.15, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.strong + 0.05, { y: 40 }); k.popOut(okT, K.no - 0.1, { y: -40 });
    const ok2 = ov('tdtag ok', S.ok2); k.popIn(ok2, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      const u = seg(t, K.wait, Math.max(0.4, K.rinse - K.wait - 0.2)), sl = Math.round(3600 * (1 - u)); const lbl = u >= 1 ? '✓' : `${Math.floor(sl / 60)}:${String(sl % 60).padStart(2, '0')}`; if (tmB.textContent !== lbl) tmB.textContent = lbl;
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(eT, new T3.Vector3(-2.6, 1.5, -1.3), 240, 840, -60); at(lT, new T3.Vector3(-2.6, 1.5, -1.3), 240, 840, -80); at(s1, new T3.Vector3(-2.6, 1.6, -1.3), 240, 840, -90); at(s3, new T3.Vector3(-2.6, 1.6, -1.3), 240, 840, -90);
      at(okT, new T3.Vector3(-2.6, 1.1, -1.0), 240, 840, 0); at(ok2, new T3.Vector3(-2.0, 2.0, -1.0));
    });
    sfx('shower', 0.25, -16, { dur: Math.max(0.8, K.bag - 0.6) }); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12); sfx('refresh', K.scale, -14);
    sfx('plop', K.bag + 0.05, -8); sfx('gurgle', K.wait, -14, { dur: Math.max(0.6, K.rinse - K.wait - 0.1) }); sfx('whoosh', K.rinse - 0.05, -12);
    sfx('shower', K.rinse + 0.15, -11, { dur: 2.4 }); sfx('chime', K.strong, -11); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
