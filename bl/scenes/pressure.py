# Heizung wird nicht warm: Wasserdruck zu niedrig, nachfuellen. Landlord asleep.
import bpy, math
from shell import Shell

def build(L, K, T, lang):
    sh = Shell(L, K, T, 'night'); M, B, sph = sh.M, sh.B, sh.sph; sh.living(); X = 0.2; fy = 1.62 - 0.14; lerp = L.lerp; seg = L.seg; eio = L.eio
    B('tbox', (0.55, 0.28, 0.8), (X, 1.62, 1.3), M('therm', '#f1f2f4', 0.3), 0.03); B('tpan', (0.4, 0.01, 0.4), (X, fy - 0.003, 1.4), M('tpanM', '#22262e', 0.4), 0.004)
    L.cyl('gface', 0.1, 0.012, (X, fy - 0.012, 1.52), M('gfaceM', '#f4f4f0', 0.3), (math.pi / 2, 0, 0), 32); L.torus('gring', 0.105, 0.011, (X, fy - 0.014, 1.52), sh.steel, (math.pi / 2, 0, 0))
    for i, (col, a) in enumerate((('#d93a2c', -0.95), ('#d93a2c', -0.7), ('#e8b730', -0.4), ('#3fae5a', -0.05), ('#3fae5a', 0.3))): B('gz%d' % i, (0.03, 0.004, 0.018), (X + 0.075 * math.sin(a), fy - 0.02, 1.52 + 0.075 * math.cos(a)), M('gzM%d' % i, col, 0.4), 0, (0, -a, 0))
    nP = L.empty('needleP', (X, fy - 0.024, 1.52)); B('needle', (0.008, 0.004, 0.08), (0, 0, 0.04), M('needleM', '#1a1a1a', 0.3), 0.001, parent=nP)
    vP = L.empty('valveP', (X + 0.1, fy - 0.03, 1.27)); L.torus('vwheel', 0.04, 0.008, (0, 0, 0), M('vwM', '#2f7de0', 0.35), (math.pi / 2, 0, 0), vP)
    for j in range(3): B('vsp%d' % j, (0.075, 0.006, 0.008), (0, 0, 0), M('vwM', '#2f7de0', 0.35), 0.001, (0, j * math.pi / 3, 0), vP)
    L.cyl('pipe', 0.016, 0.25, (X + 0.1, fy + 0.1, 1.14), sh.steel, verts=12)
    radM = M('rad', '#6fa8e8', 0.4, emit='#5a98e8', es=0.6); B('radb', (0.8, 0.1, 0.5), (1.15, 1.7, 0.5), radM, 0.02); [B('radf%d' % i, (0.025, 0.12, 0.5), (0.8 + i * 0.1, 1.69, 0.5), M('radfM', '#e8ecf0', 0.4), 0.004) for i in range(7)]
    glow = L.point('radL', (1.15, 1.4, 0.7), 0, '#ff8a3a', 0.3); glow.data.use_shadow = False; fa = L.empty('fa', (X, fy, 1.52)); fb = L.empty('fb', (1.15, 1.6, 0.6)); sh.cx.key(nP, vP); sh.cx.prop(glow.data, 'energy')
    bsd = lambda m: m.node_tree.nodes['Principled BSDF'].inputs
    for q in (bsd(radM)['Base Color'], bsd(radM)['Emission Color'], bsd(radM)['Emission Strength']): sh.cx.prop(q, 'default_value')
    def act(t, ph):
        s1, s2, fx, h = ph['s1'], ph['s2'], ph['fx'], ph['fix']
        vP.rotation_euler = (0, 7.0 * eio(seg(t, s1, max(0.5, fx - s1 - 0.2))), 0); g = eio(seg(t, s2, max(0.5, fx - s2 - 0.1))); nP.rotation_euler = (0, lerp(-0.95, 0.1, g), 0)
        c4 = (0.35 + 0.65 * h, 0.55 + 0.1 * h, 0.95 - 0.75 * h, 1); bsd(radM)['Base Color'].default_value = c4; bsd(radM)['Emission Color'].default_value = c4; bsd(radM)['Emission Strength'].default_value = 0.6 + 2.2 * h; glow.data.energy = 40 * h
    return sh.finish(spot=(-0.45, 1.0), spot_yaw=2.2, reach=2.4, focus=((1.0, -2.5, 1.5), (0.15, 1.5, 1.25), 30), anchors={'focus': fa, 'focus2': fb}, act=act, shiver=0.0, work_lean=0.15)
