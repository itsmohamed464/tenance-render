# Waschmaschine pumpt nicht ab: Flusensieb. Landlord on the beach.
import bpy, math
from shell import Shell

def build(L, K, T, lang):
    sh = Shell(L, K, T, 'beach', wall='#e2efe6', van='blue', vprop='drop'); M, B, sph = sh.M, sh.B, sh.sph; sh.living(); X, Y = 0.95, 1.4; fy = Y - 0.32; lerp = L.lerp; seg = L.seg; eio = L.eio
    B('wbody', (0.72, 0.64, 0.86), (X, Y, 0.43), M('wash', '#f2f3f4', 0.3), 0.03); B('wtop', (0.74, 0.66, 0.03), (X, Y, 0.875), M('wtop', '#dfe2e5', 0.3), 0.01); B('wpanel', (0.64, 0.02, 0.12), (X, fy - 0.005, 0.8), M('wpan', '#2b2f38', 0.35), 0.006)
    L.torus('wdoorR', 0.21, 0.035, (X, fy - 0.01, 0.46), M('wring', '#c9ced6', 0.25, 1.0), (math.pi / 2, 0, 0)); L.cyl('wglass', 0.2, 0.02, (X, fy - 0.005, 0.46), M('wglassM', '#9fd4ff', 0.05, emit='#4aa3e0', es=0.25, alpha=0.45), (math.pi / 2, 0, 0), 32)
    L.cyl('wdrum', 0.19, 0.01, (X, fy + 0.02, 0.46), M('wdrumM', '#20252d', 0.5), (math.pi / 2, 0, 0), 32)
    wat = B('wwat', (0.26, 0.02, 0.14), (X, fy + 0.005, 0.4), M('wwatM', '#4fa8ee', 0.05, emit='#2a7fd0', es=0.6, alpha=0.85), 0)
    clo = [sph('cl%d' % i, 0.05, (X, fy + 0.0, 0.46), M('clM%d' % i, c, 0.8), (1, 0.25, 1)) for i, c in enumerate(('#e8503a', '#3a7be8', '#f2c14e'))]
    ledM = M('led', '#ff2a2a', 0.2, emit='#ff2a2a', es=6.0); led = sph('wled', 0.016, (X + 0.25, fy - 0.017, 0.8), ledM); B('wdisp', (0.16, 0.01, 0.05), (X - 0.12, fy - 0.017, 0.8), ledM, 0.003)
    B('wrec', (0.22, 0.004, 0.1), (X, fy, 0.07), M('wrecM', '#16181d', 0.5), 0); hP = L.empty('hatchP', (X, fy - 0.004, 0.02)); B('hatch', (0.22, 0.016, 0.1), (0, -0.006, 0.05), M('hatchM', '#e1e4e8', 0.35), 0.004, parent=hP)
    fil = L.empty('fil', (X, fy + 0.035, 0.09)); L.cyl('filc', 0.035, 0.09, (0, 0, 0), M('filM', '#9aa0aa', 0.4), (math.pi / 2, 0, 0), 16, parent=fil); lint = L.empty('lint', (0, -0.05, 0), fil)
    for i, (dx, dz) in enumerate(((0, 0), (0.03, 0.02), (-0.03, 0.01), (0.01, -0.03))): sph('lnt', 0.03, (dx, 0, dz), M('lintM', '#5d6068', 0.9), (1.3, 0.8, 1.0), lint)
    pud = L.cyl('pud', 0.5, 0.004, (X - 0.1, fy - 0.35, 0.052), M('pudM', '#6fb6f2', 0.05, emit='#3a8fd8', es=0.3, alpha=0.7), verts=40)
    fa = L.empty('fa', (X, fy, 0.1)); fb = L.empty('fb', (X, fy, 0.82)); sh.cx.key(hP, fil, lint, wat, pud, *clo)
    bsd = lambda m: m.node_tree.nodes['Principled BSDF'].inputs
    for q in (bsd(ledM)['Base Color'], bsd(ledM)['Emission Color'], bsd(ledM)['Emission Strength']): sh.cx.prop(q, 'default_value')
    def act(t, ph):
        s1, s2, fx, h = ph['s1'], ph['s2'], ph['fx'], ph['fix']
        hP.rotation_euler = (1.3 * eio(seg(t, s1, 0.5)), 0, 0); g = 0.3 + 0.7 * eio(seg(t, s1 + 0.2, 1.0)); pud.scale = (max(0.001, g),) * 2 + (1,)
        pull = eio(seg(t, s2, 0.8)); fil.location = (lerp(X, X - 0.28, pull), lerp(fy + 0.035, fy - 0.5, pull), lerp(0.09, 0.32, pull) + 0.08 * math.sin(math.pi * pull)); fil.rotation_euler = (0.4 * pull, 0, 0)
        fil.scale = (1, 1, 1) if t < fx - 0.1 else (0.001,) * 3; lint.scale = (1, 1, 1) if t < s2 + 1.0 else (0.001,) * 3
        d = eio(seg(t, fx - 0.1, 1.4)); lv = max(0.001, 1 - d); wat.scale = (1, 1, lv); wat.location = (X, fy + 0.005, 0.33 + 0.07 * lv)
        a = (t - fx) * 7.0 * min(1, max(0, t - fx)) if t > fx else 0.0
        for i, c in enumerate(clo): c.location = (X + 0.1 * math.cos(a + i * 2.1), fy + 0.0, 0.46 + 0.1 * math.sin(a + i * 2.1))
        c4 = (1 - h, h, 0.1 * (1 - h), 1); bsd(ledM)['Base Color'].default_value = c4; bsd(ledM)['Emission Color'].default_value = c4; bsd(ledM)['Emission Strength'].default_value = 6.0 * (0.4 + 0.6 * (0.5 + 0.5 * math.sin(t * 14)) * (1 - h) + h)
    return sh.finish(spot=(0.12, 0.92), spot_yaw=1.57, reach=1.3, focus=((1.7, -2.7, 0.95), (0.85, 1.0, 0.4), 30), anchors={'focus': fb, 'focus2': fa}, act=act, opener='hero', shiver=0.0, work_lean=0.4)
