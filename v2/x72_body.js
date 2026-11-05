    // ---- X72: cold radiator, stuck thermostat pin: unscrew the head, press the pin, screw it back on ----
    mirFog.visible = false;
    box(1.0, 0.86, 0.6, M.std('#2f5a44', { roughness: 0.55 }), [2.2, 0.43, -1.3]); box(1.04, 0.05, 0.64, M.std('#dccab0', { roughness: 0.45 }), [2.2, 0.885, -1.3]);
    hH.rotation.z = -(7 + 20 / 60) / 12 * Math.PI * 2; hM.rotation.z = -20 / 60 * Math.PI * 2;
    // ---- radiator with thermal overlay ----
    const RAD = new T3.Group(); RAD.position.set(0.85, 0.47, -1.5); D.add(RAD);
    mesh(rbox(0.7, 0.56, 0.08, 0.02), M.std('#f6f5f1', { roughness: 0.35 }), RAD, [0, 0, 0]);
    for (let i = 0; i < 11; i++) mesh(new T3.BoxGeometry(0.012, 0.5, 0.01), M.std('#e4e2dc', { roughness: 0.4 }), RAD, [-0.3 + i * 0.06, 0, 0.042]);
    [[-0.33, -0.36], [0.33, -0.36]].forEach(([x, y]) => mesh(new T3.CylinderGeometry(0.012, 0.012, 0.22, 10), chrome, RAD, [x, y + 0.04, 0.0]));
    const thM = new T3.ShaderMaterial({ uniforms: { uLev: { value: -0.3 }, uT: { value: 0 }, uTime: { value: 0 } }, transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uLev, uT, uTime; varying vec2 vUv; vec3 ramp(float x){ x = clamp(x, 0.0, 1.0); vec3 a = vec3(0.03, 0.01, 0.3), b = vec3(0.05, 0.35, 0.95), c = vec3(1.0, 0.7, 0.05), d = vec3(0.95, 0.12, 0.02); return x < 0.33 ? mix(a, b, x / 0.33) : (x < 0.66 ? mix(b, c, (x - 0.33) / 0.33) : mix(c, d, (x - 0.66) / 0.34)); } void main(){ float n = sin(vUv.x * 40.0 + uTime * 2.0) * 0.015 + sin(vUv.x * 13.0 - uTime) * 0.02; float hot = 1.0 - smoothstep(uLev - 0.1, uLev + 0.06, vUv.y + n); float tt = 0.12 + 0.85 * hot - 0.1 * abs(vUv.x - 0.5); gl_FragColor = vec4(ramp(tt) * 0.9, uT * 0.96); }' });
    const thP = mesh(new T3.PlaneGeometry(0.72, 0.58), thM, RAD, [0, 0, 0.05]); thP.castShadow = false; thP.renderOrder = 3;
    // ---- thermostatic valve: brass body, rusty pin, unscrewable head ----
    const brass = M.std('#c9a227', { metalness: 0.8, roughness: 0.3 });
    const TRV = new T3.Group(); TRV.position.set(-0.355, -0.2, 0.03); TRV.rotation.y = Math.PI; TRV.scale.setScalar(1.5); RAD.add(TRV);
    mesh(new T3.CylinderGeometry(0.02, 0.02, 0.07, 16), brass, TRV, [0.035, 0, 0], [0, 0, Math.PI / 2]);
    mesh(new T3.CylinderGeometry(0.027, 0.027, 0.012, 16), brass, TRV, [0.066, 0, 0], [0, 0, Math.PI / 2]);
    const pinM = M.std('#8a5a35', { metalness: 0.6, roughness: 0.5 }); const pin = mesh(new T3.CylinderGeometry(0.007, 0.007, 0.04, 10), pinM, TRV, [0.07, 0, 0], [0, 0, Math.PI / 2]);
    const rust = new T3.Color('#8a5a35'), steel = new T3.Color('#e3e8ec');
    const HEAD = new T3.Group(); HEAD.position.set(0.072, 0, 0); TRV.add(HEAD);
    mesh(new T3.CylinderGeometry(0.034, 0.034, 0.09, 28), M.std('#fbfbf8', { roughness: 0.3 }), HEAD, [0.045, 0, 0], [0, 0, Math.PI / 2]);
    mesh(new T3.CylinderGeometry(0.037, 0.037, 0.012, 28), M.std('#2b2f33', { roughness: 0.5 }), HEAD, [0.03, 0, 0], [0, 0, Math.PI / 2]);
    mesh(new T3.BoxGeometry(0.014, 0.01, 0.006), M.std('#d23b30'), HEAD, [0.03, 0.039, 0]);
    // fingertip that presses the pin
    const FING = new T3.Group(); TRV.add(FING); mesh(new T3.CapsuleGeometry(0.013, 0.05, 6, 12), M.std('#e8b98f', { roughness: 0.7 }), FING, [0, 0, 0], [0, 0, Math.PI / 2]);
    // ---- tenant (sweater + scarf) + phone ----
    const TN = k.fig(D, '#e8b98f', 0.1, 0, -0.85, 0.95, '#7a3b1e');
    const swM = M.std('#6f5bb5', { roughness: 0.9 }); mesh(new T3.CylinderGeometry(0.218, 0.24, 0.58, 24, 1, true), swM, TN.userData.B, [0, 0.48, 0]); mesh(new T3.TorusGeometry(0.2, 0.034, 8, 24), swM, TN.userData.B, [0, 0.77, 0], [Math.PI / 2, 0, 0]);
    mesh(new T3.TorusGeometry(0.17, 0.045, 10, 24), M.std('#d23b30', { roughness: 0.9 }), TN.userData.B, [0, 0.82, 0], [Math.PI / 2, 0, 0]);
    const phone = new T3.Group(); TN.userData.hand.add(phone); mesh(rbox(0.13, 0.24, 0.025, 0.02), M.std('#111'), phone, [0, 0.06, 0.03], [Math.PI / 2, 0, 0]); const scrM = new T3.MeshBasicMaterial({ color: '#9fd0ff' }); mesh(new T3.PlaneGeometry(0.11, 0.2), scrM, phone, [0, 0.074, 0.03], [-Math.PI / 2, 0, 0]);
    const POS = new T3.Vector3(0.1, 0, -0.85); const vTN = () => POS.clone();
    // ---- state ----
    const R1 = K.on - 0.15, TB = Math.max(R1 - 0.3, K.pin + 0.9);
    const lev = (t) => lerp(-0.3, 1.12, E.io(seg(t, K.on + 0.2, Math.max(0.8, K.warm - K.on + 0.7))));
    const thermal = (t) => Math.max(E.io(seg(t, 0, 0.01)) * (1 - E.io(seg(t, K.cold + 0.4, 0.3))), E.io(seg(t, K.stuck - 0.1, 0.3)) * (1 - E.io(seg(t, K.no - 0.2, 0.3))));
    const s1 = (t) => antMove(t, K.off, 0.5, 0, 1, 1.1), s2 = (t) => antMove(t, K.off + 0.55, 0.35, 0, 1, 1.1);
    const r2 = (t) => antMove(t, TB, 0.3, 0, 1, 1.1), r1 = (t) => antMove(t, R1, 0.45, 0, 1, 1.1);
    const fAppr = (t) => antMove(t, K.pin - 0.1, 0.35, 0, 1, 1.1) * (1 - antMove(t, K.pin + 0.75, 0.3, 0, 1, 1.1));
    const fPress = (t) => Math.exp(-Math.pow((t - (K.pin + 0.2)) / 0.07, 2)) + Math.exp(-Math.pow((t - (K.pin + 0.48)) / 0.07, 2));
    const freed = (t) => E.io(seg(t, K.pin + 0.5, 0.15));
    // ---- camera ----
    const P = (a, r, h, tx, ty, tz, fov = 30, roll = 0) => () => ({ a, r, h, tx, ty, tz, fov, roll });
    const PT = (a, r, h, dy, fov = 30, roll = 0) => (t) => { const p = vTN(t); return { a, r, h: h + p.y, tx: p.x, ty: p.y + dy, tz: p.z, fov, roll }; };
    const A6 = MC.ant(0.6), A9 = MC.ant(0.9);
    const camT = track([
      [0, P(0.3, 2.8, 1.05, 0.86, 0.5, -1.45)],
      [K.cold - 0.05, P(0.35, 1.7, 1.1, 0.72, 0.72, -1.45, 26), E.io],
      [K.cold + 0.45, PT(0.55, 2.3, 1.3, 1.05, 21, 0.03), A9],
      [K.write - 0.3, PT(0.55, 2.4, 1.28, 1.03, 22), E.lin],
      [K.write + 0.2, PT(0.6, 1.7, 1.42, 1.0, 26), A6],
      [K.turn + 0.3, P(0.06, 9.6, 2.7, 0.1, 1.15, -0.55), A6],
      [K.stuck - 0.3, P(0.0, 9.2, 2.6, 0.1, 1.15, -0.55), E.lin],
      [K.stuck + 0.15, P(0.35, 2.4, 1.0, 0.8, 0.45, -1.45, 28), A9],
      [K.off - 0.15, P(0.5, 1.2, 0.75, 0.42, 0.28, -1.45, 24), A6],
      [K.on + 0.55, P(0.45, 1.15, 0.72, 0.42, 0.28, -1.45, 24), E.lin],
      [K.warm - 0.05, P(0.35, 2.8, 1.1, 0.86, 0.5, -1.45), A6],
      [K.no + 0.35, P(0.45, 3.2, 1.5, 0.7, 0.9, -1.1), E.io],
      [K.cta + 2.5, P(0.06, 10.8, 3.0, 0.1, 1.2, -0.55), E.io],
    ]);
    const FOC = new T3.Vector3(), tmp = new T3.Vector3();
    k.frame((t) => {
      const L = lev(t), th = thermal(t), warm = E.io(seg(t, K.warm - 0.1, 0.8));
      const g = k.grade; g.temp = lerp(-0.45, 0.42, warm); g.th = 1.6; g.bloom = 0.35 + 0.15 * th; g.sat = 1.04;
      thM.uniforms.uLev.value = L; thM.uniforms.uT.value = th; thM.uniforms.uTime.value = t;
      hS.rotation.z = -((Math.floor(t) + MC.out(2.2)(seg(t % 1, 0, 0.18))) / 60) * Math.PI * 2 - 0.3;
      // head: unscrews (slides out while spinning), is held aside, comes back and screws on
      const a1 = s1(t) - r1(t), aside = s2(t) - r2(t);
      HEAD.position.set(0.072 + 0.15 * a1, 0.09 * aside, -0.2 * aside); HEAD.rotation.x = -4 * Math.PI * a1 + 0.5 * aside;
      // pin: stuck (sunk, rusty) until the finger frees it
      const pr = fPress(t), fr = freed(t), tip = lerp(0.088, 0.112, fr) - 0.014 * pr * (1 - fr * 0.6);
      pin.position.x = tip - 0.02; pinM.color.copy(rust).lerp(steel, fr);
      const fa = fAppr(t); FING.visible = fa > 0.02; FING.position.set(tip + 0.038 + 0.12 * (1 - fa), 0.03 * (1 - fa), -0.05 * (1 - fa));
      // tenant: touches the cold radiator → shock → phone → kneels at the valve → joy → warms hands
      const touch = antMove(t, 0.5, 0.3, 0, 1, 1.2) * (1 - E.io(seg(t, K.cold + 0.05, 0.15)));
      const shock = E.io(seg(t, K.cold, 0.08)) * (1 - E.io(seg(t, K.cold + 0.8, 0.3)));
      const phoneUp = MC.spring(t, K.write - 0.7, 2.2, 0.4) * (1 - E.io(seg(t, K.stuck - 0.5, 0.25)));
      const kneel = E.io(seg(t, K.stuck - 0.4, 0.3)) * (1 - E.io(seg(t, K.warm + 0.3, 0.3)));
      const work = kneel * (t > K.off - 0.3 && t < K.on + 0.5 ? 1 : 0);
      const joy = MC.spring(t, K.warm + 0.2, 2.4, 0.35) * (1 - E.io(seg(t, K.no - 0.2, 0.3)));
      const hands = E.io(seg(t, K.no - 0.2, 0.3));
      const shiver = t < K.warm ? Math.sin(t * 55) * 0.02 * (1 - kneel) : 0;
      const face = lerp(lerp(2.45, 0.6, antMove(t, K.cold + 0.02, 0.25, 0, 1, 1.2)), 2.6, E.io(seg(t, K.stuck - 0.5, 0.3)));
      k.drive(TN, t, vTN, {
        face, squash: -0.12 * Math.exp(-Math.pow((t - (K.cold + 0.12)) / 0.07, 2)), tilt: shiver, nod: 0.25 * phoneUp - 0.1 * shock + 0.2 * kneel,
        lift: -0.2 * kneel, lean: 0.4 * kneel - 0.12 * joy,
        armL: shock > 0.5 ? -1.3 : (joy > 0.02 ? -0.4 - 2.4 * joy : -0.2 - 1.1 * hands - 0.9 * work),
        armR: shock > 0.5 ? -1.3 : (joy > 0.02 ? -0.4 - 2.4 * joy : -0.25 - 1.15 * touch - 1.2 * phoneUp - 1.1 * work - 1.1 * hands + 0.12 * work * Math.sin(t * 12)),
        armLz: shock > 0.5 ? -0.6 : 0, armRz: shock > 0.5 ? -0.6 : 0,
      });
      k.face(TN, t, { wide: shock, o: shock * 0.6, smile: joy > 0.1 || hands > 0.5 ? 1 : 0.1, closed: hands > 0.5 ? 0.8 : 0 });
      phone.visible = phoneUp > 0.05; scrM.color.set(phoneUp > 0.5 ? '#9fd0ff' : '#33415c');
      const c = camT(t); k.shoot(c, t, 0.8);
      FOC.set(c.tx, c.ty, c.tz); k.dof = { focus: FOC, ap: c.r < 1.6 ? 0.012 : 0.03 };
    });
    // ---- overlays ----
    const chip = ov('tdchip', S.chip); tl.set(chip, { xPercent: -50 }, 0); k.popIn(chip, 0.12, { y: -50 }); k.popOut(chip, K.turn, { y: -60 });
    const m1 = ov('tdchat in', `<b>${S.who}</b>${S.m1}`), m2 = ov('tdchat out', `<b>Tenance ${de ? 'KI' : 'AI'}</b>${S.m2}`);
    tl.set([m1, m2], { left: 540 }, 0); tl.set(m1, { top: 260 }, 0); tl.set(m2, { top: 450 }, 0);
    k.popIn(m1, K.write - 0.12); k.popIn(m2, K.ans + 0.08); k.popOut(m1, K.off - 0.55); k.popOut(m2, K.off - 0.49);
    k.burst(K.turn); sfx('impact', K.turn, -13);
    const pulseR = ov('tdpulse', ''); tl.set(pulseR, { autoAlpha: 0 }, 0); tl.fromTo(pulseR, { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: 'power2.out', immediateRender: false }, K.turn);
    k.brand(K.turn, 1330);
    const cd = k.card(S.ttl, [S.l1, S.l2, S.l3], K.off - 0.3);
    cd.line(0, K.off + 0.2); cd.line(1, K.pin); cd.line(2, K.warm);
    k.popOut(cd.c, K.no - 0.12, { y: -80 });
    const tC = ov('tdtag step', S.cold), tW = ov('tdtag hotT', '🔥 19 °C');
    k.popIn(tC, 0.3, { y: 30 }); k.popOut(tC, K.cold + 0.4, { y: -40 });
    const t1 = ov('tdtag step', S.s1); k.popIn(t1, K.off - 0.05, { y: 30 }); k.popOut(t1, K.pin - 0.12, { y: -40 });
    const t2 = ov('tdtag step', S.s2); k.popIn(t2, K.pin - 0.05, { y: 30 }); k.popOut(t2, K.on - 0.12, { y: -40 });
    const t3 = ov('tdtag step', S.s3); k.popIn(t3, K.on - 0.05, { y: 30 }); k.popOut(t3, K.warm - 0.15, { y: -40 });
    k.popIn(tW, K.warm + 0.25, { y: 30, s0: 0.4 }); k.popOut(tW, K.no - 0.15, { y: -40 });
    const okT = ov('tdtag ok', S.ok); k.popIn(okT, K.no + 0.05, { y: 40 });
    perFrame((t) => {
      tW.textContent = '🔥 ' + Math.round(lerp(19, 58, clamp((lev(t) + 0.3) / 1.42, 0, 1))) + ' °C';
      const at = (el, v, lo = 240, hi = 840, dy = 0) => { const [x, y] = k.proj(D.localToWorld(tmp.copy(v))); el.style.left = clamp(x, lo, hi) + 'px'; el.style.top = clamp(y + dy, 330, 1450) + 'px'; };
      at(tC, new T3.Vector3(0.85, 0.78, -1.45), 240, 840, -40);
      [t1, t2, t3].forEach((e) => at(e, new T3.Vector3(0.4, 0.45, -1.4), 240, 840, -90));
      at(tW, new T3.Vector3(0.85, 0.8, -1.45), 240, 840, -40); at(okT, new T3.Vector3(0.9, 1.9, -1.0));
    });
    sfx('shiver', K.cold + 0.05, -10); sfx('send', K.write - 0.1, -13); sfx('pop', K.ans + 0.1, -12); sfx('refresh', K.stuck, -14);
    sfx('unscrew', K.off, -8); sfx('click', K.pin + 0.2, -7); sfx('click', K.pin + 0.48, -6); sfx('chime', K.pin + 0.55, -12);
    sfx('unscrew', R1, -8); sfx('heater', K.warm - 0.1, -12); sfx('kaching', K.no + 0.1, -14);
    k.finish(K.cta + 0.3, K.cta + 0.6, S.end);
    return { T: END + 0.9, K };
  }
