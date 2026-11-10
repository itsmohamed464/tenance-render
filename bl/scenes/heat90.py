# X90 v2: 23:14. Landlord asleep, phone buzzes (macro opening). Tenant freezing, an emergency van races toward the building (money!),
# the Tenance AI mascot swoops in, stops the van, guides the tenant to bleed the radiator, warmth wave, landlord keeps sleeping.
import bpy, math
from mathutils import Vector

def build(L, K, T, lang):
    sc = bpy.context.scene; cx = L.Ctx(sc); lerp, seg, eio, eout, sp = L.lerp, L.seg, L.eio, L.eout, L.spring
    L.world(sc, '#080d1c', 0.3)
    M = L.mat; B = L.box; sph = L.sph; A = L.area; UZ = 2.85
    wall, wallU, trim, slab = M('wall', '#efe3d0', 0.9), M('wallU', '#cfd8ea', 0.9), M('trim', '#f7f3ec', 0.5), M('slab', '#262a36', 0.8)
    wood, woodU, teal, sofaM = M('wood', '#b98a5e', 0.5), M('woodU', '#9c7752', 0.5), M('teal', '#2f6b73', 0.8), M('sofa', '#2f5a44', 0.85)
    white, steel, gold = M('white', '#f4f4f0', 0.35), M('steel', '#cfd6dd', 0.25, 1.0), M('gold', '#e09b6b', 0.3, 0.8)
    # ---- building cross-section, road, two floors
    B('road', (14, 1.6, 0.1), (0, -2.75, -0.05), M('road', '#23252d', 0.9)); B('walk', (14, 0.5, 0.12), (0, -1.9, -0.04), M('walk', '#6d7080', 0.8))
    for x in (-5, -3, -1, 1, 3, 5): B('dash', (0.7, 0.07, 0.01), (x, -2.8, 0.006), M('dash', '#d9d9d0', 0.6), 0)
    B('base', (4.5, 3.9, 0.3), (0, 0, -0.15), slab); B('floorL', (3.9, 3.6, 0.05), (0, 0, 0.025), wood, 0.004)
    for z0, wm in ((0, wall), (UZ, wallU)):
        B('bw', (4.3, 0.15, 2.6), (0, 1.85, z0 + 1.3), wm); B('lw', (0.15, 3.85, 2.6), (-2.07, 0, z0 + 1.3), wm); B('rw', (0.15, 3.85, 2.6), (2.07, 0, z0 + 1.3), wm)
        B('skirt', (3.9, 0.03, 0.1), (0, 1.76, z0 + 0.08), trim, 0.004)
    B('mid', (4.3, 3.85, 0.25), (0, 0, 2.725), slab); B('floorU', (3.9, 3.6, 0.05), (0, 0, UZ + 0.025), woodU, 0.004); B('topcap', (4.3, 3.85, 0.1), (0, 0, UZ + 2.65), slab)
    def window(name, x, z0, col, es, dots):
        B(name + 'p', (0.95, 0.02, 1.15), (x, 1.765, z0 + 1.55), M(name, col, 0.1, emit=col, es=es), 0)
        for dx in (-0.5, 0.5): B(name + 'f', (0.05, 0.05, 1.25), (x + dx, 1.76, z0 + 1.55), trim, 0.004)
        for dz in (-0.6, 0, 0.6): B(name + 'g', (1.05, 0.05, 0.05), (x, 1.76, z0 + 1.55 + dz), trim, 0.004)
        B(name + 'sill', (1.15, 0.16, 0.05), (x, 1.7, z0 + 0.93), trim, 0.006)
        dm = M(name + 'd', '#ffd27a', 0.2, emit='#ffd27a', es=7.0)
        for i in range(dots): B(name + 'c', (0.03, 0.01, 0.04), (x - 0.42 + 0.84 * ((i * 0.7548 + 0.13) % 1), 1.752, z0 + 1.05 + 0.85 * ((i * 0.5698 + 0.31) % 1)), dm, 0)
        cm = M(name + 'cu', '#7a3b50', 0.9)
        B(name + 'cl', (0.22, 0.06, 1.35), (x - 0.62, 1.7, z0 + 1.5), cm, 0.03); B(name + 'cr', (0.22, 0.06, 1.35), (x + 0.62, 1.7, z0 + 1.5), cm, 0.03)
    window('winL', 0.95, 0, '#16254a', 0.9, 9); window('winU', 0.95, UZ, '#5a74c8', 1.6, 0)
    sph('moon', 0.085, (1.2, 1.755, UZ + 1.95), M('moon', '#f4f1dd', 0.3, emit='#f4f1dd', es=5.0))
    frostM = M('frost', '#dff0ff', 0.4, emit='#bfe3ff', es=0.7, alpha=0.6); frost = B('frost', (0.95, 0.01, 1.15), (0.95, 1.748, 1.55), frostM, 0)
    # ---- lower flat (tenant): rug, sofa, lamp, table, pictures, plant, pendant, radiator
    L.cyl('rug', 0.8, 0.012, (-0.2, 0.3, 0.055), M('rug', '#d9b48a', 0.95)); L.cyl('rug2', 0.55, 0.014, (-0.2, 0.3, 0.056), M('rug2', '#b5533c', 0.95))
    B('sofa', (1.15, 0.65, 0.32), (-1.3, 1.3, 0.21), sofaM, 0.04); B('sofab', (1.15, 0.16, 0.5), (-1.3, 1.62, 0.5), sofaM, 0.05); B('sofal', (0.14, 0.65, 0.5), (-1.84, 1.3, 0.33), sofaM, 0.04); B('sofar', (0.14, 0.65, 0.5), (-0.76, 1.3, 0.33), sofaM, 0.04)
    B('cush', (0.3, 0.12, 0.3), (-1.0, 1.45, 0.55), M('cush', '#e09b6b', 0.8), 0.05, rot=(0.2, 0, 0.3)); B('table', (0.55, 0.4, 0.16), (-0.3, 0.55, 0.13), M('tbl', '#c9a27a', 0.5), 0.015)
    L.cyl('mug', 0.035, 0.07, (-0.25, 0.5, 0.25), M('mug', '#c0392b', 0.3))
    for i, (px, pz, c) in enumerate(((-1.4, 1.9, '#e09b6b'), (-0.8, 1.7, '#7fa9d8'), (-1.1, 1.45, '#5aa84a'))): B('pic%d' % i, (0.3, 0.02, 0.38), (px, 1.76, pz), M('pc%d' % i, c, 0.6), 0.01); B('pf%d' % i, (0.34, 0.015, 0.42), (px, 1.768, pz), M('pfr', '#2b2b2b', 0.5), 0.005)
    L.cyl('lampP', 0.012, 1.1, (-1.75, 0.45, 0.6), steel, verts=12); sph('lampS', 0.16, (-1.75, 0.45, 1.2), M('lampM', '#ffe2b0', 0.4, emit='#ffcf88', es=1.2), (1, 1, 0.8))
    L.cyl('cord', 0.005, 0.5, (-0.3, 0.3, 2.35), steel, verts=8); sph('pend', 0.13, (-0.3, 0.3, 2.05), M('pendM', '#ffe9c4', 0.4, emit='#ffd9a0', es=1.4), (1, 1, 0.8))
    L.cyl('pot', 0.1, 0.18, (1.65, 1.35, 0.14), M('pot', '#c86b3c', 0.7)); [sph('leaf%d' % i, 0.13 - 0.02 * i, (1.65 + 0.05 * i - 0.05, 1.35, 0.36 + 0.14 * i), M('leaf', '#3d7a4f', 0.8)) for i in range(3)]
    radM = M('rad', '#9db3cf', 0.35, emit='#ff8a3a', es=0.0); B('radB', (1.1, 0.06, 0.58), (0.95, 1.72, 0.55), radM, 0.01)
    for i in range(8): B('fin', (0.035, 0.05, 0.5), (0.95 - 0.49 + i * 0.14, 1.675, 0.55), radM, 0.01)
    B('radT', (1.1, 0.12, 0.03), (0.95, 1.7, 0.86), radM, 0.01); L.cyl('bleed', 0.018, 0.05, (0.45, 1.68, 0.9), steel, verts=16); L.cyl('bleedCap', 0.012, 0.025, (0.45, 1.68, 0.93), M('red', '#c0392b', 0.4), verts=12)
    L.cyl('valveL', 0.02, 0.07, (1.4, 1.68, 0.3), steel, (0, math.pi / 2, 0), 12)
    # ---- upper flat (landlord): bed, nightstand + lamp, wardrobe, rug, pictures
    B('bedF', (1.1, 1.9, 0.3), (-1.2, 0.85, UZ + 0.19), woodU, 0.02); B('mat', (1.0, 1.8, 0.2), (-1.2, 0.85, UZ + 0.44), white, 0.04); B('head', (1.2, 0.1, 0.9), (-1.2, 1.78, UZ + 0.6), woodU, 0.02)
    B('pillow', (0.55, 0.32, 0.12), (-1.2, 1.5, UZ + 0.6), white, 0.05); B('blank', (1.02, 1.0, 0.1), (-1.2, 0.35, UZ + 0.6), teal, 0.04)
    B('ns', (0.4, 0.4, 0.45), (-0.3, 1.55, UZ + 0.25), woodU, 0.015); L.cyl('lampB', 0.05, 0.18, (-0.3, 1.62, UZ + 0.55), M('lampb', '#3a3a44', 0.4)); sph('lampSh', 0.1, (-0.3, 1.62, UZ + 0.72), M('lampsh', '#ffe2b0', 0.5, emit='#ffcf88', es=0.15), (1, 1, 0.8))
    B('ward', (0.6, 0.5, 1.8), (1.5, 1.5, UZ + 0.95), woodU, 0.02); B('rugU', (1.2, 1.0, 0.012), (0.4, 0.3, UZ + 0.06), M('rugU', '#7fa9d8', 0.95), 0.003)
    B('picU', (0.4, 0.02, 0.3), (-1.2, 1.76, UZ + 1.45), M('picU', '#e09b6b', 0.6), 0.01); B('picUf', (0.44, 0.015, 0.34), (-1.2, 1.768, UZ + 1.45), M('pfr2', '#2b2b2b', 0.5), 0.005)
    def phone(name, parent=None, loc=(0, 0, 0), rot=(0, 0, 0)):
        p = L.empty(name, loc, parent); p.rotation_euler = rot
        B(name + 'b', (0.1, 0.2, 0.012), (0, 0, 0), M(name + 'bm', '#111111', 0.3), 0.01, parent=p)
        sm = M(name + 's', '#9fd0ff', 0.2, emit='#9fd0ff', es=0.0); B(name + 'sc', (0.088, 0.18, 0.002), (0, 0, 0.007), sm, 0, parent=p)
        return p, sm.node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
    phU, phUes = phone('phU', None, (-0.3, 1.45, UZ + 0.495), (0, 0, 0.4))
    LL = L.Fig('ll', '#3a6ea8', '#4a3b30', (-1.2, 0.5, UZ + 0.62)); TN = L.Fig('tn', '#d9734e', '#3a2418', (-0.2, 0.2, 0.05))
    phL, phLes = phone('phL', LL.hands[1], (0, -0.03, -0.02), (math.pi / 2, 0, 0)); phT, phTes = phone('phT', TN.hands[1], (0, -0.03, -0.02), (math.pi / 2, 0, 0))
    keyT = B('keyT', (0.025, 0.05, 0.02), (0, 0, -0.03), M('keyM', '#caa24a', 0.3, 1.0), 0.004, parent=TN.hands[0])
    # ---- Tenance AI mascot (glowing forest-green orb with gold eyes + ring)
    mas = L.empty('mas', (0, 0, -9)); mm = M('masM', '#1d4734', 0.22, emit='#2fb06a', es=0.9); mg = M('masG', '#ffd27a', 0.2, emit='#ffcf6a', es=8.0)
    sph('masB', 0.17, (0, 0, 0), mm, (1, 1, 1), mas); meyes = [sph('masE%d' % i, 0.03, (x, -0.155, 0.04), mg, (1, 0.5, 1.2), mas) for i, x in enumerate((-0.06, 0.06))]
    mring = L.torus('masR', 0.25, 0.018, (0, 0, 0), mg, (1.0, 0, 0), mas); mlight = L.point('masL', (0, 0, 0), 0, '#ffd27a', 0.1); mlight.parent = mas
    # ---- emergency van (money on wheels) driving along the road
    van = L.empty('van', (6.5, -2.75, 0.0)); vy = M('vanY', '#f2c230', 0.45); vk = M('vanK', '#141414', 0.5); wheels = []
    B('vb', (0.95, 0.45, 0.4), (0.12, 0, 0.36), vy, 0.04, parent=van); B('vc', (0.34, 0.43, 0.3), (-0.52, 0, 0.31), vy, 0.04, parent=van); B('vw', (0.2, 0.02, 0.15), (-0.52, -0.215, 0.38), M('vwin', '#2a3a55', 0.1), 0.01, parent=van)
    B('vs', (0.9, 0.02, 0.07), (0.12, -0.226, 0.3), M('vstr', '#d33a2c', 0.5), 0.005, parent=van); vl = M('vlight', '#ff9a1a', 0.3, emit='#ff9a1a', es=0.0); B('vlb', (0.22, 0.07, 0.05), (-0.45, 0, 0.6), vl, 0.01, parent=van)
    B('vh', (0.03, 0.3, 0.06), (-0.7, 0, 0.24), M('vhead', '#fff4c0', 0.2, emit='#fff4c0', es=6.0), 0, parent=van)
    for wx in (-0.5, 0.45):
        for wy in (-0.21, 0.21): wheels.append(L.cyl('wh', 0.1, 0.07, (wx, wy, 0.1), vk, (math.pi / 2, 0, 0), 24, parent=van))
    vanA = L.empty('vanA', (0, 0, 0.85), van)
    # ---- effects
    orbM = M('orb', '#ffd27a', 0.2, emit='#ffcf6a', es=12.0); orbs = [sph('orb%d' % i, 0.05 - 0.01 * i, (0, 0, -9), orbM) for i in range(4)]
    puffM = M('puff', '#ffffff', 0.5, emit='#dfeeff', es=1.5); puffs = [sph('puff%d' % i, 0.04, (0, 0, -9), puffM) for i in range(6)]; breath = [sph('br%d' % i, 0.05, (0, 0, -9), puffM) for i in range(3)]
    dropM = M('drop', '#8cc8ff', 0.05, emit='#8cc8ff', es=0.6); drops = [sph('drop%d' % i, 0.018, (0, 0, -9), dropM) for i in range(5)]
    rings = [L.torus('ring%d' % i, 0.1, 0.006, (-0.3, 1.45, UZ + 0.52), M('ringM', '#9fd0ff', 0.2, emit='#9fd0ff', es=2.2), (0, 0, 0)) for i in range(3)]
    waveM = M('wave', '#ff9a4a', 0.4, emit='#ff8a3a', es=3.0, alpha=0.5); wave = L.cyl('wave', 1.0, 0.01, (0.95, 1.2, 0.07), waveM, verts=64)
    confs = [sph('cf%d' % i, 0.025, (0, 0, -9), M('cfm%d' % i, c, 0.3, emit=c, es=3.0)) for i, c in enumerate(['#ffd27a', '#ff7aa8', '#7fd8ff', '#8cff9a', '#ffd27a', '#ff7aa8', '#7fd8ff', '#8cff9a', '#ffd27a', '#ff7aa8', '#7fd8ff', '#8cff9a'])]
    # ---- lights
    kU = A('kU', (0.0, -3.0, UZ + 2.6), (-0.3, 1.0, UZ + 0.5), 2.4, 260, '#9fb4ff', 'RECTANGLE', 1.6); kL = A('kL', (0.2, -3.0, 2.3), (0.2, 1.0, 0.6), 2.6, 260, '#7aa2ff', 'RECTANGLE', 1.6)
    fl = A('fill', (0.0, -8.0, 3.0), (0, 1.0, 2.8), 6.0, 300, '#c9d6ff', 'RECTANGLE', 7.0); moonL = A('moonL', (1.2, 0.9, UZ + 1.9), (-0.8, 1.2, UZ + 0.6), 1.2, 180, '#7f9be8', 'RECTANGLE', 1.6)
    street = A('street', (3.0, -5.0, 1.2), (0.0, -2.7, 0.2), 2.0, 160, '#9fb4ff', 'RECTANGLE', 1.0)
    lampL = L.point('lampL', (-1.75, 0.45, 1.15), 60, '#ffcf88', 0.12); radL = L.point('radL', (0.95, 1.3, 0.5), 0, '#ff9a4a', 0.2); phoneL = L.point('phoneL', (-0.3, 1.4, UZ + 0.7), 0, '#9fd0ff', 0.05); pendL = L.point('pendL', (-0.3, 0.3, 1.95), 30, '#ffd9a0', 0.1)
    vlL = L.point('vlL', (6.5, -2.75, 0.9), 0, '#ff9a1a', 0.1); vlL.parent = van; vlL.location = (-0.45, 0, 0.7)
    for lt in (kU, kL, fl, moonL, street, lampL, radL, phoneL, pendL, vlL, mlight): cx.prop(lt.data, 'energy'); cx.prop(lt.data, 'color')
    for lt in (fl, street, lampL, radL, phoneL, pendL, vlL, mlight): lt.data.use_shadow = False
    bsdf = lambda m: m.node_tree.nodes['Principled BSDF'].inputs
    for s_ in (phUes, phLes, phTes, bsdf(radM)['Emission Strength'], bsdf(radM)['Base Color'], bsdf(frostM)['Alpha'], bsdf(waveM)['Alpha'], bsdf(vl)['Emission Strength']): cx.prop(s_, 'default_value')
    cam = L.camera(sc, 34); cx.key(cam); cx.prop(cam.data, 'lens'); cx.prop(cam.data.dof, 'focus_distance'); cx.prop(cam.data.dof, 'aperture_fstop')
    cx.key(*LL.objs(), *TN.objs(), phU, phL, phT, *orbs, *puffs, *breath, *drops, *rings, keyT, mas, mring, *meyes, van, *wheels, wave, *confs, frost)
    cx.anch.update({'zzz': LL.head, 'valve': L.empty('aV', (0.45, 1.62, 0.95)), 'll': LL.head, 'tn': TN.head, 'rad': L.empty('aR', (0.95, 1.6, 0.9)), 'rad2': L.empty('aR2', (0.95, 1.6, 0.4)), 'ph': L.empty('aP', (-0.3, 1.4, UZ + 0.9)), 'van': vanA, 'mas': mas})
    n_, w_, tu, an, ai, va, wa, wr, sl, sv = [K[x] for x in ('night', 'write', 'turn', 'ans', 'air', 'valve', 'water', 'warm', 'sleep', 'save')]
    WIDE = ((0, -12.4, 2.65), (0, 0.4, 2.55), 34); UP = ((-0.45, -5.6, 4.1), (-0.65, 1.0, 3.8), 31); LO = ((0.45, -5.8, 1.5), (0.0, 0.9, 1.1), 30); RD = ((1.0, -2.8, 1.35), (0.33, 1.6, 0.95), 28)
    MID = ((0.4, -7.5, 1.7), (0.0, 0.9, 1.45), 31); OPEN = ((-0.2, 0.78, UZ + 0.64), (-0.3, 1.45, UZ + 0.5), 21); UP2 = ((-0.9, -4.6, 4.0), (-0.8, 1.2, 3.6), 30)
    P = lambda t, p: (t, p[0], p[1], p[2])
    camf = L.track([P(0, OPEN), P(n_ + 0.5, OPEN), P(n_ + 1.2, UP), P(w_ - 0.1, UP), P(w_ + 0.5, LO), P(tu - 0.3, LO), P(tu + 0.6, WIDE), P(ai - 0.3, WIDE), P(ai + 0.5, RD), P(wa + 0.9, RD), P(wr + 0.1, MID), P(sl - 0.3, MID), P(sl + 0.7, UP2), P(sv + 0.1, UP2), P(sv + 0.9, WIDE), P(T + 1, WIDE)])
    # mascot flight plan: (t, pos, scale)
    LP, TP, RP = (-0.9, 0.9, UZ + 1.0), (-0.1, 0.0, 1.55), (1.0, 1.25, 1.35)
    mf = L.track([(0, (0, 0, -9), (0, 0, -9), 0), (tu - 0.01, LP, LP, 0), (tu + 0.35, LP, LP, 1), (tu + 1.0, (-1.0, 1.1, 2.4), (0, 0, 0), 1), (an, TP, TP, 1), (ai - 0.1, TP, TP, 1), (ai + 0.5, RP, RP, 1), (wr - 0.2, RP, RP, 1),
                  (wr + 0.5, (0.55, 0.8, 2.0), (0, 0, 0), 1), (sl - 0.4, (0.0, 0.6, 2.4), (0, 0, 0), 1), (sl + 0.6, (-0.9, 1.1, UZ + 1.55), (0, 0, 0), 1), (T + 1, (-0.9, 1.1, UZ + 1.55), (0, 0, 0), 1)])
    sp_ = lambda t, a, b: eio(seg(t, a, b - a))
    cues_kick = [n_ + 0.1, tu, va, wr, sv]
    def upd(t):
        loc, tg, fov = camf(t); L.aim(cam, loc, tg, fov, t, 0.8, 2.8 if loc[1] < -9 else 1.6, kick=L.punch(t, cues_kick), roll=0.025 * math.sin(t * 0.7))
        # ---- landlord
        wake = sp_(t, n_ + 0.6, n_ + 1.4); back = sp_(t, sl - 0.8, sl + 0.4); sit = wake * (1 - back); lean = lerp(-1.42, -0.42, sit)
        relief = sp_(t, an + 0.8, an + 1.6)
        LL.pose(pos=(-1.2, lerp(0.42, 0.95, sit), UZ + lerp(0.64, 0.62, sit)), lean=lean, nod=0.18 * sit, armR=1.45 * sp_(t, n_ + 1.0, n_ + 1.6) * (1 - sp_(t, an + 1.0, an + 1.5)), armL=0.2 * sit,
                blink=(1.0 - sit) if (wake < 1 or back > 0) else L.blink(t), smile=0.1 + 0.8 * relief * (1 - back * 0.5), wide=0.4 * sit * (1 - relief), o=0.7 * sit * (1 - relief) * (1 if t < tu else 0), brow=0.55 * sit * (1 - relief) - 0.3 * relief, browY=0.01 * sit)
        buz = (1.0 if n_ + 0.1 < t < n_ + 1.3 else 0.0) * (0.5 + 0.5 * math.sin(t * 60)); hold = sp_(t, n_ + 1.4, n_ + 1.7) * (1 - sp_(t, an + 1.0, an + 1.3))
        phU.scale = (1, 1, 1) if hold < 0.5 else (0.001,) * 3; phL.scale = (1, 1, 1) if hold >= 0.5 else (0.001,) * 3
        phU.location = (-0.3 + 0.006 * math.sin(t * 90) * buz, 1.45, UZ + 0.495); phU.rotation_euler = (0, 0, 0.4 + 0.05 * math.sin(t * 70) * buz)
        phUes.default_value = 1.1 * (buz * 0.9 + 0.1 * (1 - hold) * (1.0 if t > n_ else 0.0)); phLes.default_value = 6.0; phoneL.data.energy = 6 * buz + 25 * hold; phoneL.data.color = (0.62, 0.82, 1.0)
        for i, r in enumerate(rings):
            u = ((t - n_ - 0.1 - i * 0.28) % 0.84) / 0.84; on = 1 if n_ + 0.1 < t < n_ + 1.3 else 0; r.scale = (0.2 + 3.0 * u,) * 3 if on else (0.001,) * 3; r.location = (-0.3, 1.45, UZ + 0.52)
        # ---- tenant
        walk = sp_(t, ai - 0.3, ai + 0.7); pos = (lerp(-0.2, 0.0, walk), lerp(0.2, 1.5, walk), 0.05)
        phn = sp(t, w_ - 0.7, 2.2, 0.4) * (1 - sp_(t, an + 1.0, an + 1.4)); phT.scale = (1, 1, 1) if phn > 0.05 else (0.001,) * 3
        cold = 1 - sp_(t, wr, wr + 0.8); sh = 0.02 * math.sin(t * 38) * cold
        reach = sp_(t, va - 0.5, va + 0.1) * (1 - sp_(t, wa + 0.9, wa + 1.3)); twist = math.sin(t * 9) * 0.18 * (1 if va + 0.1 < t < wa + 0.9 else 0)
        joy = sp(t, wr + 0.2, 2.4, 0.35) * (1 - sp_(t, sl + 0.2, sl + 0.8))
        yawT = lerp(lerp(0.9, 0.0, sp_(t, w_ - 1.0, w_ - 0.4)), 0.9, sp_(t, an + 1.0, an + 1.5)); yawT = lerp(yawT, 2.27, walk); yawT = lerp(yawT, 0.0, sp_(t, wr + 0.6, wr + 1.2) * (1 if walk > 0.99 else 0))
        TN.pose(pos=pos, yaw=yawT + sh, lean=0.06 * cold - 0.1 * joy + 0.12 * reach, roll=sh, nod=0.2 * phn, armR=(0.4 + 2.4 * joy) if joy > 0.02 else (0.25 + 1.1 * phn + 0.9 * cold * (1 - phn) * (1 - reach)),
                armL=(0.4 + 2.4 * joy) if joy > 0.02 else (0.2 + 1.7 * reach + 0.9 * cold * (1 - reach)), armLz=twist, blink=L.blink(t, 1.3), smile=0.05 + 0.9 * (1 if joy > 0.1 else 0), wide=0.25 * cold, o=0.3 * cold * (1 - phn), brow=-0.45 * cold + 0.1 * joy)
        keyT.scale = (1, 1, 1) if reach > 0.3 else (0.001,) * 3
        for i, b in enumerate(breath):
            u = ((t * 0.9 + i / 3) % 1); b.location = (pos[0] + 0.06 * math.sin(i * 4), pos[1] - 0.3 - 0.3 * u, 1.0 + 0.05 * u); b.scale = ((0.25 + 0.8 * u) * math.sin(math.pi * u) * (1.0 if (cold > 0.5 and walk < 0.1) else 0.0) + 0.001,) * 3
        # ---- message orbs, air puffs, water drops
        def orbpos(o, i, t0, a, b):
            u = (t - t0 - i * 0.07) / 0.55
            if 0 < u < 1: e = eio(u); o.location = (lerp(a[0], b[0], e), lerp(a[1], b[1], e) - 0.5 * math.sin(math.pi * e), lerp(a[2], b[2], e)); o.scale = (1,) * 3
            else: o.location = (0, 0, -9)
        for i, o in enumerate(orbs): orbpos(o, i, w_ + 0.1, (-0.2, 0.2, 1.0), (-0.9, 0.9, UZ + 0.9)) if t < an else orbpos(o, i, an + 0.2, (-0.9, 0.9, UZ + 0.9), (-0.2, 0.2, 1.0))
        for i, p in enumerate(puffs):
            u = (t - va - 0.15 - i * 0.12) / 0.7
            if 0 < u < 1 and t < wa + 0.3: p.location = (0.45 + 0.05 * u * math.sin(i * 2.1), 1.62 - 0.12 * u, 0.95 + 0.14 * u); p.scale = ((0.4 + 1.1 * math.sin(math.pi * u)),) * 3
            else: p.location = (0, 0, -9)
        for i, d in enumerate(drops):
            u = (t - wa - i * 0.18) / 0.5
            if 0 < u < 1 and t < wr + 0.6: d.location = (0.45, 1.64, 0.88 - 0.84 * u * u); d.scale = (1,) * 3
            else: d.location = (0, 0, -9)
        # ---- mascot
        p_, _, sc_ = mf(t); bob = 0.05 * math.sin(t * 5.0); mas.location = (p_[0], p_[1], p_[2] + bob if p_[2] > -5 else p_[2]); k_ = 1 + 0.25 * sp(t, tu, 2.6, 0.3) - 0.25 * (t > tu)
        mas.scale = (max(0.001, sc_) * (1.0 + 0.0 * k_),) * 3 if t < tu + 0.6 else (max(0.001, sc_),) * 3
        if tu <= t < tu + 0.6: mas.scale = (max(0.001, sc_ * sp(t, tu, 2.2, 0.3)),) * 3
        mring.rotation_euler = (1.0 + 0.3 * math.sin(t * 2), t * 3.0, 0); mlight.data.energy = 35 * (1 if t > tu else 0); mlight.data.color = (1.0, 0.82, 0.48)
        for e in meyes: e.scale = (1, 0.5, max(0.15, 1.2 * (1 - L.blink(t, 0.7))))
        # ---- van: races in, brakes when the mascot appears, backs off
        vin = eout(seg(t, w_ + 0.15, tu + 0.5 - w_ - 0.15), 2.2); vout = eio(seg(t, an + 0.6, 1.5)); x = lerp(6.5, 0.9, vin) + 5.6 * vout
        van.location = (x if t > w_ + 0.1 else 8.0, -2.75, 0.0); van.rotation_euler = (0.0, 0.05 * seg(t, tu + 0.3, 0.3) * (1 - seg(t, tu + 0.6, 0.4)) - 0.04 * (vin < 0.98) * (1 - vin), math.pi * sp_(t, an + 0.5, an + 1.0))
        for w_o in wheels: w_o.rotation_euler = (math.pi / 2, 0, 0); w_o.rotation_euler = (math.pi / 2 + x * 10.0, 0, 0)
        bl = 0.5 + 0.5 * math.sin(t * 22); bsdf(vl)['Emission Strength'].default_value = 8.0 * bl * (1 if w_ + 0.1 < t < an + 1.5 else 0); vlL.data.energy = 120 * bl * (1 if w_ + 0.1 < t < an + 1.5 else 0)
        # ---- heat, frost, wave, confetti, lights
        h = sp_(t, wr - 0.1, wr + 1.3); rm = bsdf(radM); rm['Emission Strength'].default_value = 3.2 * h
        c0, c1 = (0.34, 0.43, 0.6, 1), (1.0, 0.62, 0.35, 1); rm['Base Color'].default_value = tuple(lerp(c0[i], c1[i], h) for i in range(4))
        bsdf(frostM)['Alpha'].default_value = 0.6 * (1 - sp_(t, wr + 0.2, wr + 1.4)); u = seg(t, wr, 1.1)
        wave.scale = (0.1 + 1.8 * eout(u),) * 2 + (1,) if 0 < u < 1 else (0.001,) * 3; bsdf(waveM)['Alpha'].default_value = 0.5 * (1 - u)
        for i, c in enumerate(confs):
            uu = (t - wr - 0.15 - 0.02 * i) / 1.4
            if 0 < uu < 1: a = i * 0.5236; c.location = (0.95 + 0.9 * math.cos(a) * uu, 1.0 + 0.4 * math.sin(a) * uu, 0.7 + 1.5 * uu - 1.6 * uu * uu); c.scale = (1,) * 3
            else: c.location = (0, 0, -9)
        radL.data.energy = 70 * h; kL.data.color = (lerp(0.48, 1.0, h), lerp(0.63, 0.78, h), lerp(1.0, 0.55, h)); kL.data.energy = lerp(260, 340, h); kU.data.energy = lerp(260, 200, sit); moonL.data.energy = 180; lampL.data.energy = 60; fl.data.energy = 300; street.data.energy = 160; pendL.data.energy = 30
    return upd, cx
