# X90: 23:14, the landlord is asleep, the tenant's radiator is cold. Tenance AI answers for the landlord, the tenant bleeds the radiator, the landlord keeps sleeping.
import bpy, math
from mathutils import Vector

def build(L, K, T, lang):
    sc = bpy.context.scene; cx = L.Ctx(sc); lerp, seg, eio, eout, sp = L.lerp, L.seg, L.eio, L.eout, L.spring
    L.world(sc, '#0a0f1e', 0.35)
    M = L.mat; B = L.box; sph = L.sph; area = L.area; UZ = 2.85
    wall, wallU, trim, slab = M('wall', '#efe3d0', 0.9), M('wallU', '#cfd8ea', 0.9), M('trim', '#f7f3ec', 0.5), M('slab', '#2b2b33', 0.8)
    wood, woodU, teal, sofaM = M('wood', '#b98a5e', 0.55), M('woodU', '#9c7752', 0.55), M('teal', '#2f6b73', 0.8), M('sofa', '#2f5a44', 0.85)
    white, steel = M('white', '#f4f4f0', 0.35), M('steel', '#cfd6dd', 0.25, 1.0)
    # --- building cross-section: two floors ---
    B('base', (4.5, 3.9, 0.3), (0, 0, -0.15), slab); B('floorL', (3.9, 3.6, 0.05), (0, 0, 0.025), wood, 0.004)
    for z0, wm in ((0, wall), (UZ, wallU)):
        B('bw', (4.3, 0.15, 2.6), (0, 1.85, z0 + 1.3), wm); B('lw', (0.15, 3.85, 2.6), (-2.07, 0, z0 + 1.3), wm); B('rw', (0.15, 3.85, 2.6), (2.07, 0, z0 + 1.3), wm)
        B('skirt', (3.9, 0.03, 0.1), (0, 1.76, z0 + 0.08), trim, 0.004)
    B('mid', (4.3, 3.85, 0.25), (0, 0, 2.725), slab); B('floorU', (3.9, 3.6, 0.05), (0, 0, UZ + 0.025), woodU, 0.004)
    B('topcap', (4.3, 3.85, 0.1), (0, 0, UZ + 2.65), slab)
    # windows (night city / moon)
    def window(name, x, z0, col, es, dots):
        pane = M(name, col, 0.1, emit=col, es=es); B(name + 'p', (0.95, 0.02, 1.15), (x, 1.765, z0 + 1.55), pane, 0)
        for dx, dz in ((-0.5, 0), (0.5, 0)): B(name + 'f', (0.05, 0.05, 1.25), (x + dx, 1.76, z0 + 1.55), trim, 0.004)
        for dz in (-0.6, 0, 0.6): B(name + 'g', (1.05, 0.05, 0.05), (x, 1.76, z0 + 1.55 + dz), trim, 0.004)
        B(name + 'sill', (1.15, 0.16, 0.05), (x, 1.7, z0 + 0.93), trim, 0.006)
        dm = M(name + 'd', '#ffd27a', 0.2, emit='#ffd27a', es=7.0)
        for i in range(dots): B(name + 'c', (0.03, 0.01, 0.04), (x - 0.42 + 0.84 * ((i * 0.7548 + 0.13) % 1), 1.752, z0 + 1.05 + 0.85 * ((i * 0.5698 + 0.31) % 1)), dm, 0)
    window('winL', 0.95, 0, '#16254a', 0.9, 9); window('winU', 0.95, UZ, '#5a74c8', 1.6, 0)
    sph('moon', 0.085, (1.2, 1.755, UZ + 1.95), M('moon', '#f4f1dd', 0.3, emit='#f4f1dd', es=5.0))
    # lower flat: rug, sofa, lamp, table, radiator under the window
    L.cyl('rug', 0.8, 0.012, (-0.2, 0.3, 0.055), M('rug', '#d9b48a', 0.95))
    B('sofa', (1.15, 0.65, 0.32), (-1.3, 1.3, 0.21), sofaM, 0.04); B('sofab', (1.15, 0.16, 0.5), (-1.3, 1.62, 0.5), sofaM, 0.05); B('sofal', (0.14, 0.65, 0.5), (-1.84, 1.3, 0.33), sofaM, 0.04); B('sofar', (0.14, 0.65, 0.5), (-0.76, 1.3, 0.33), sofaM, 0.04)
    B('table', (0.55, 0.4, 0.16), (-0.3, 0.55, 0.13), M('tbl', '#c9a27a', 0.5), 0.015)
    L.cyl('lampP', 0.012, 1.1, (-1.75, 0.45, 0.6), steel, verts=12); lamp = sph('lampS', 0.16, (-1.75, 0.45, 1.2), M('lampM', '#ffe2b0', 0.4, emit='#ffcf88', es=1.2), (1, 1, 0.8))
    radM = M('rad', '#9db3cf', 0.35, emit='#ff8a3a', es=0.0); rbody = B('radB', (1.1, 0.06, 0.58), (0.95, 1.72, 0.55), radM, 0.01)
    for i in range(8): B('fin', (0.035, 0.05, 0.5), (0.95 - 0.49 + i * 0.14, 1.675, 0.55), radM, 0.01)
    B('radT', (1.1, 0.12, 0.03), (0.95, 1.7, 0.86), radM, 0.01)
    L.cyl('bleed', 0.018, 0.05, (0.45, 1.68, 0.9), steel, verts=16); L.cyl('bleedCap', 0.012, 0.025, (0.45, 1.68, 0.93), M('red', '#c0392b', 0.4), verts=12)
    L.cyl('valveL', 0.02, 0.07, (1.4, 1.68, 0.3), steel, (0, math.pi / 2, 0), 12)
    # upper flat: bed, nightstand + phone, wardrobe
    B('bedF', (1.1, 1.9, 0.3), (-1.2, 0.85, UZ + 0.19), woodU, 0.02); B('mat', (1.0, 1.8, 0.2), (-1.2, 0.85, UZ + 0.44), white, 0.04); B('head', (1.2, 0.1, 0.9), (-1.2, 1.78, UZ + 0.6), woodU, 0.02)
    B('pillow', (0.55, 0.32, 0.12), (-1.2, 1.5, UZ + 0.6), white, 0.05); B('blank', (1.02, 1.0, 0.1), (-1.2, 0.35, UZ + 0.6), teal, 0.04)
    B('ns', (0.4, 0.4, 0.45), (-0.3, 1.55, UZ + 0.25), woodU, 0.015); L.cyl('lampB', 0.05, 0.18, (-0.3, 1.62, UZ + 0.55), M('lampb', '#3a3a44', 0.4)); sph('lampSh', 0.1, (-0.3, 1.62, UZ + 0.72), M('lampsh', '#ffe2b0', 0.5, emit='#ffcf88', es=0.15), (1, 1, 0.8))
    B('ward', (0.6, 0.5, 1.8), (1.5, 1.5, UZ + 0.95), woodU, 0.02); B('rugU', (1.2, 1.0, 0.012), (0.4, 0.3, UZ + 0.06), M('rugU', '#7fa9d8', 0.95), 0.003)
    # phones (screens glow)
    def phone(name, parent=None, loc=(0, 0, 0), rot=(0, 0, 0)):
        p = empty = L.empty(name, loc, parent); p.rotation_euler = rot
        B(name + 'b', (0.1, 0.2, 0.012), (0, 0, 0), M(name + 'bm', '#111111', 0.3), 0.01, parent=p)
        sm = M(name + 's', '#9fd0ff', 0.2, emit='#9fd0ff', es=0.0); B(name + 'sc', (0.088, 0.18, 0.002), (0, 0, 0.007), sm, 0, parent=p)
        return p, sm.node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
    phU, phUes = phone('phU', None, (-0.3, 1.45, UZ + 0.495), (0, 0, 0.4))
    # figures
    LL = L.Fig('ll', '#3a6ea8', '#4a3b30', (-1.2, 0.5, UZ + 0.62)); TN = L.Fig('tn', '#d9734e', '#3a2418', (-0.2, 0.2, 0.05))
    phL, phLes = phone('phL', LL.hands[1], (0, -0.03, -0.02), (math.pi / 2, 0, 0)); phT, phTes = phone('phT', TN.hands[1], (0, -0.03, -0.02), (math.pi / 2, 0, 0))
    keyT = B('keyT', (0.025, 0.05, 0.02), (0, 0, -0.03), M('keyM', '#caa24a', 0.3, 1.0), 0.004, parent=TN.hands[0])
    # effects: message orbs, air puffs, water drops
    orbM = M('orb', '#ffd27a', 0.2, emit='#ffcf6a', es=12.0); orbs = [sph('orb%d' % i, 0.05 - 0.01 * i, (0, 0, -9), orbM) for i in range(4)]
    puffM = M('puff', '#ffffff', 0.5, emit='#dfeeff', es=1.5); puffs = [sph('puff%d' % i, 0.04, (0, 0, -9), puffM) for i in range(6)]
    dropM = M('drop', '#8cc8ff', 0.05, emit='#8cc8ff', es=0.6); drops = [sph('drop%d' % i, 0.018, (0, 0, -9), dropM) for i in range(5)]
    # lights
    A = L.area; kU = A('kU', (0.0, -3.0, UZ + 2.6), (-0.3, 1.0, UZ + 0.5), 2.4, 260, '#9fb4ff', 'RECTANGLE', 1.6)
    kL = A('kL', (0.2, -3.0, 2.3), (0.2, 1.0, 0.6), 2.6, 260, '#7aa2ff', 'RECTANGLE', 1.6)
    fl = A('fill', (0.0, -8.0, 3.0), (0, 1.0, 2.8), 6.0, 300, '#c9d6ff', 'RECTANGLE', 7.0)
    moonL = A('moonL', (1.2, 0.9, UZ + 1.9), (-0.8, 1.2, UZ + 0.6), 1.2, 180, '#7f9be8', 'RECTANGLE', 1.6)
    lampL = L.point('lampL', (-1.75, 0.45, 1.15), 60, '#ffcf88', 0.12); radL = L.point('radL', (0.95, 1.3, 0.5), 0, '#ff9a4a', 0.2)
    phoneL = L.point('phoneL', (-0.3, 1.4, UZ + 0.7), 0, '#9fd0ff', 0.05)
    for lt in (kU, kL, fl, moonL, lampL, radL, phoneL): cx.prop(lt.data, 'energy'); cx.prop(lt.data, 'color')
    for s_ in (phUes, phLes, phTes, radM.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'], radM.node_tree.nodes['Principled BSDF'].inputs['Base Color']): cx.prop(s_, 'default_value')
    cam = L.camera(sc, 32); cx.key(cam); cx.prop(cam.data, 'lens'); cx.prop(cam.data.dof, 'focus_distance'); cx.prop(cam.data.dof, 'aperture_fstop')
    cx.key(*LL.objs(), *TN.objs(), phU, phL, phT, *orbs, *puffs, *drops, keyT)
    anch = {'zzz': LL.head, 'valve': L.empty('aV', (0.45, 1.62, 0.95)), 'll': LL.head, 'tn': TN.head, 'rad': L.empty('aR', (0.95, 1.6, 0.9)), 'rad2': L.empty('aR2', (0.95, 1.6, 0.4)), 'ph': L.empty('aP', (-0.3, 1.4, UZ + 0.9))}
    cx.anch.update(anch)
    # camera track (cues)
    n_, w_, tu, an, ai, va, wa, wr, sl, sv = [K[x] for x in ('night', 'write', 'turn', 'ans', 'air', 'valve', 'water', 'warm', 'sleep', 'save')]
    WIDE = ((0, -12.4, 2.9), (0, 0.4, 2.85), 32); UP = ((-0.45, -5.6, 4.1), (-0.65, 1.0, 3.8), 31); LO = ((0.45, -5.8, 1.5), (0.0, 0.9, 1.1), 30); RD = ((1.0, -2.8, 1.35), (0.33, 1.6, 0.95), 28); MID = ((0.4, -7.5, 1.7), (0.0, 0.9, 1.45), 31)
    P = lambda t, p: (t, p[0], p[1], p[2])
    camf = L.track([P(0, WIDE), P(n_ + 0.1, WIDE), P(n_ + 1.0, UP), P(w_ - 0.1, UP), P(w_ + 0.6, LO), P(tu + 0.1, LO), P(tu + 1.0, WIDE), P(ai - 0.3, WIDE), P(ai + 0.5, RD), P(wa + 1.0, RD), P(wr + 0.2, MID), P(sl - 0.2, MID), P(sl + 0.7, UP), P(sv + 0.2, UP), P(sv + 1.0, WIDE), P(T + 1, WIDE)])
    sp_ = lambda t, a, b: eio(seg(t, a, b - a))
    def upd(t):
        # ---- camera
        loc, tg, fov = camf(t); L.aim(cam, loc, tg, fov, t, 0.8, 2.8 if loc[1] < -9 else 1.6)
        # ---- landlord: asleep, phone buzzes, wakes, reads, gets answered for, lies back, sleeps
        wake = sp_(t, n_ + 0.6, n_ + 1.4); back = sp_(t, sl - 0.8, sl + 0.4)
        sit = wake * (1 - back); lean = lerp(-1.42, -0.42, sit)
        LL.pose(pos=(-1.2, lerp(0.42, 0.95, sit), UZ + lerp(0.64, 0.62, sit)), yaw=0, lean=lean, nod=0.18 * sit, armR=1.45 * sp_(t, n_ + 1.0, n_ + 1.6) * (1 - sp_(t, an + 1.0, an + 1.5)), armL=0.2 * sit, blink=1.0 - sit if wake < 1 or back > 0 else 0.0 + L.blink(t), smile=0.15 + 0.5 * back, wide=0.3 * sit * (1 - back))
        buz = (1.0 if n_ + 0.1 < t < n_ + 1.2 else 0.0) * (0.5 + 0.5 * math.sin(t * 60))
        hold = sp_(t, n_ + 1.4, n_ + 1.7) * (1 - sp_(t, an + 1.0, an + 1.3))
        phU.scale = (1, 1, 1) if hold < 0.5 else (0.001,) * 3; phL.scale = (1, 1, 1) if hold >= 0.5 else (0.001,) * 3
        phU.location = (-0.3 + 0.004 * math.sin(t * 90) * buz, 1.45, UZ + 0.495); phU.rotation_euler = (0, 0, 0.4)
        phUes.default_value = 7.0 * (buz * 0.9 + 0.1 * (1 - hold) * (1.0 if t > n_ else 0.0)); phLes.default_value = 6.0
        phoneL.data.energy = 20 * buz + 25 * hold; phoneL.data.color = (0.62, 0.82, 1.0)
        # ---- tenant: shivers, texts, reads, goes to the radiator, bleeds it, cheers
        walk = sp_(t, ai - 0.3, ai + 0.7); atR = walk * (1 - sp_(t, wr + 1.0, wr + 1.8))
        pos = (lerp(-0.2, 0.0, walk), lerp(0.2, 1.5, walk), 0.05)
        tp = 1.0 - sp_(t, wr + 1.0, wr + 1.8) if walk > 0.99 else 1.0 - walk
        phn = sp(t, w_ - 0.7, 2.2, 0.4) * (1 - sp_(t, an + 1.0, an + 1.4)); phT.scale = (1, 1, 1) if phn > 0.05 else (0.001,) * 3
        sh = 0.02 * math.sin(t * 38) * (1 - sp_(t, wr, wr + 0.8)); cold = 1 - sp_(t, wr, wr + 0.8)
        reach = sp_(t, va - 0.5, va + 0.1) * (1 - sp_(t, wa + 0.9, wa + 1.3)); twist = math.sin(t * 9) * 0.18 * (1 if va + 0.1 < t < wa + 0.9 else 0)
        joy = sp(t, wr + 0.2, 2.4, 0.35) * (1 - sp_(t, sl + 0.2, sl + 0.8))
        yawT = lerp(lerp(0.9, 0.0, sp_(t, w_ - 1.0, w_ - 0.4)), 0.9, sp_(t, an + 1.0, an + 1.5))
        yawT = lerp(yawT, 2.27, walk); yawT = lerp(yawT, 0.0, sp_(t, wr + 0.6, wr + 1.2) * (1 if walk > 0.99 else 0))
        arm = joy if joy > 0.02 else 0
        TN.pose(pos=pos, yaw=yawT + sh, lean=0.06 * cold - 0.1 * joy + 0.12 * reach, roll=sh, nod=0.2 * phn, armR=(0.4 + 2.4 * joy) if joy > 0.02 else (0.25 + 1.1 * phn + 0.9 * cold * (1 - phn) * (1 - reach)), armL=(0.4 + 2.4 * joy) if joy > 0.02 else (0.2 + 1.7 * reach + 0.9 * cold * (1 - reach)), armLz=twist, blink=L.blink(t, 1.3), smile=0.05 + 0.9 * (1 if joy > 0.1 else 0), wide=0.2 * cold, o=0.0)
        keyT.scale = (1, 1, 1) if reach > 0.3 else (0.001,) * 3
        # ---- message orbs (tenant -> landlord at write, answer back at ans)
        def orbpos(o, i, t0, a, b):
            u = (t - t0 - i * 0.07) / 0.55
            if 0 < u < 1: e = eio(u); o.location = (lerp(a[0], b[0], e), lerp(a[1], b[1], e) - 0.5 * math.sin(math.pi * e), lerp(a[2], b[2], e)); o.scale = (1,) * 3
            else: o.location = (0, 0, -9)
        for i, o in enumerate(orbs):
            orbpos(o, i, w_ + 0.1, (-0.2, 0.2, 1.0), (-0.9, 0.9, UZ + 0.9)) if t < an else orbpos(o, i, an + 0.2, (-0.9, 0.9, UZ + 0.9), (-0.2, 0.2, 1.0))
        # ---- air puffs, water drops
        for i, p in enumerate(puffs):
            u = (t - va - 0.15 - i * 0.12) / 0.7
            if 0 < u < 1 and t < wa + 0.3: p.location = (0.45 + 0.05 * u * math.sin(i * 2.1), 1.62 - 0.12 * u, 0.95 + 0.14 * u); s_ = 0.4 + 1.1 * math.sin(math.pi * u); p.scale = (s_,) * 3
            else: p.location = (0, 0, -9)
        for i, d in enumerate(drops):
            u = (t - wa - i * 0.18) / 0.5
            if 0 < u < 1 and t < wr + 0.6: d.location = (0.45, 1.64, 0.88 - 0.84 * u * u); d.scale = (1,) * 3
            else: d.location = (0, 0, -9)
        # ---- heat + lights
        h = sp_(t, wr - 0.1, wr + 1.3)
        rm = radM.node_tree.nodes['Principled BSDF'].inputs; rm['Emission Strength'].default_value = 3.2 * h
        c0, c1 = (0.34, 0.43, 0.6, 1), (1.0, 0.62, 0.35, 1); rm['Base Color'].default_value = tuple(lerp(c0[i], c1[i], h) for i in range(4))
        radL.data.energy = 70 * h; kL.data.color = (lerp(0.48, 1.0, h), lerp(0.63, 0.78, h), lerp(1.0, 0.55, h)); kL.data.energy = lerp(260, 340, h)
        kU.data.energy = lerp(260, 200, sit); moonL.data.energy = 180; lampL.data.energy = 60; fl.data.energy = 300
    return upd, cx
