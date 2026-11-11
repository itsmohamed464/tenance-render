# Balkon steht unter Wasser: Abfluss voller Laub. Landlord asleep. Rain streaks + growing puddle.
import bpy, math, random
from shell import Shell

def build(L, K, T, lang):
    sh = Shell(L, K, T, 'night'); M, B, sph = sh.M, sh.B, sh.sph; lerp = L.lerp; seg = L.seg; eio = L.eio; rnd = random.Random(11)
    B('btile', (3.8, 3.4, 0.02), (0, 0.0, 0.058), M('btileM', '#8c929c', 0.7), 0.004)
    L.cyl('pot', 0.14, 0.26, (1.5, 0.9, 0.2), M('potM', '#b8643c', 0.7)); sph('plant', 0.18, (1.5, 0.9, 0.5), M('plantM', '#2f8f4a', 0.8)); L.cyl('dgr', 0.07, 0.01, (-1.1, 0.95, 0.075), M('dgrM', '#1a1c20', 0.4), verts=24)
    for i in range(6): B('dsl', (0.12, 0.012, 0.01), (-1.1, 0.95 - 0.04 + 0.016 * i, 0.082), sh.steel, 0.002)
    gr = L.empty('grate', (-1.1, 0.95, 0.09)); L.cyl('grc', 0.075, 0.012, (0, 0, 0), sh.steel, verts=24, parent=gr)
    for i in range(5): B('grs', (0.1, 0.01, 0.014), (0, -0.04 + 0.02 * i, 0.008), M('grsM', '#555a63', 0.4), 0.002, parent=gr)
    lv = L.empty('leaves', (-1.1, 0.95, 0.11)); lc = ('#c0562b', '#d9a02c', '#8a5a2b')
    for i, (dx, dy) in enumerate(((0, 0), (0.04, 0.02), (-0.04, 0.01), (0.01, -0.04), (-0.02, 0.04))): sph('lf', 0.035, (dx, dy, 0.0), M('lfM%d' % i, lc[i % 3], 0.8), (1.4, 1.0, 0.3), lv)
    pud = L.cyl('pud', 0.6, 0.006, (-1.0, 0.95, 0.07), M('pudM', '#6fb6f2', 0.05, emit='#3a8fd8', es=0.4, alpha=0.7), verts=48); rain = [B('rn%d' % i, (0.014, 0.014, 0.5), (rnd.uniform(-1.8, 1.8), rnd.uniform(-1.4, 1.6), 3.0), M('rnM', '#dff0ff', 0.1, emit='#dff0ff', es=3.0, alpha=0.8), 0) for i in range(40)]
    fa = L.empty('fa', (-1.1, 0.95, 0.12)); fb = L.empty('fb', (-1.1, 0.95, 0.6)); sh.cx.key(gr, lv, pud, *rain); rx = [(r.location[0], r.location[1]) for r in rain]
    def act(t, ph):
        s1, s2, fx = ph['s1'], ph['s2'], ph['fx']
        for i, r in enumerate(rain): z = 3.2 - ((t * 5.0 + i * 0.173) % 1.0) * 3.2; r.location = (rx[i][0], rx[i][1], z) if t < fx + 0.6 else (0, 0, -9)
        o = eio(seg(t, s1, 0.6)); gr.location = (-1.1 + 0.25 * o, 0.95 - 0.1 * o, 0.09 + 0.07 * math.sin(math.pi * min(1, o * 1.3)) * (1 - o)); gr.rotation_euler = (0.3 * o, 0, 0.6 * o)
        pull = eio(seg(t, s2, 0.9)); lv.location = (-1.1 + 0.1 * pull, 0.95 - 0.35 * pull, 0.11 + 0.5 * math.sin(math.pi * 0.5 * pull)) if pull < 1 else (0, 0, -9); lv.scale = (1, 1, 1) if t < s2 + 1.0 else (0.001,) * 3
        g = eio(seg(t, 0.4, 3.0)); d = eio(seg(t, fx - 0.2, 1.4)); pud.scale = (max(0.001, (0.45 + 0.55 * g) * (1 - d)),) * 2 + (1,)
    return sh.finish(spot=(-0.45, 0.95), spot_yaw=4.71, reach=0.25, focus=((-1.6, -3.4, 1.5), (-0.8, 0.95, 0.45), 30), anchors={'focus': fb, 'focus2': fa}, act=act, shiver=0.0, work_lean=0.6)
