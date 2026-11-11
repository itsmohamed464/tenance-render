# Kein Warmwasser: Therme gestoert, Entstoertaste. Landlord asleep.
import bpy, math
from shell import Shell

def build(L, K, T, lang):
    sh = Shell(L, K, T, 'night'); M, B, sph = sh.M, sh.B, sh.sph; sh.living(); X = 0.2; fy = 1.62 - 0.14; lerp = L.lerp; seg = L.seg; eio = L.eio
    B('tbox', (0.55, 0.28, 0.8), (X, 1.62, 1.3), M('therm', '#f1f2f4', 0.3), 0.03); B('tpan', (0.4, 0.01, 0.2), (X, fy - 0.003, 1.5), M('tpanM', '#22262e', 0.4), 0.004)
    ledM = M('led', '#ff2a2a', 0.2, emit='#ff2a2a', es=6.0); B('tdisp', (0.14, 0.01, 0.07), (X - 0.08, fy - 0.01, 1.52), ledM, 0.003); sph('tled', 0.014, (X + 0.12, fy - 0.012, 1.52), ledM)
    btnM = M('tbtn', '#d93a2c', 0.3, emit='#d93a2c', es=2.0); btn = L.cyl('tbutton', 0.04, 0.02, (X, fy - 0.01, 1.3), btnM, (math.pi / 2, 0, 0), 20)
    hP = L.empty('flapP', (X, fy - 0.01, 1.14)); B('flap', (0.4, 0.016, 0.28), (0, 0, 0.14), M('flapM', '#e4e6ea', 0.35), 0.004, parent=hP)
    B('basin', (0.7, 0.42, 0.1), (1.0, 1.5, 0.88), sh.white, 0.03); B('bcab', (0.7, 0.4, 0.8), (1.0, 1.52, 0.4), M('bcabM', '#c9b79a', 0.6), 0.02); L.cyl('tapN', 0.016, 0.22, (1.0, 1.68, 1.05), sh.steel, verts=12)
    L.cyl('tapS', 0.014, 0.2, (1.0, 1.58, 1.16), sh.steel, (math.pi / 2, 0, 0), 12); strM = M('stream', '#5aa8ff', 0.05, emit='#4aa0ff', es=2.0, alpha=0.8); stream = L.cyl('strm', 0.012, 0.2, (1.0, 1.49, 1.05), strM, verts=10)
    steam = [sph('st%d' % i, 0.04, (0, 0, -9), M('steam', '#ffffff', 0.5, emit='#eef6ff', es=1.2)) for i in range(5)]
    glow = L.point('thermL', (X, fy - 0.2, 1.4), 0, '#ff8a3a', 0.2); glow.data.use_shadow = False; fa = L.empty('fa', (X, fy, 1.5)); fb = L.empty('fb', (1.0, 1.45, 1.1)); sh.cx.key(hP, btn, *steam); sh.cx.prop(glow.data, 'energy')
    bsd = lambda m: m.node_tree.nodes['Principled BSDF'].inputs
    for q in (bsd(ledM)['Base Color'], bsd(ledM)['Emission Color'], bsd(ledM)['Emission Strength'], bsd(strM)['Base Color'], bsd(strM)['Emission Color']): sh.cx.prop(q, 'default_value')
    def act(t, ph):
        s1, s2, fx, h = ph['s1'], ph['s2'], ph['fx'], ph['fix']
        hP.rotation_euler = (1.4 * eio(seg(t, s1, 0.5)), 0, 0); pr = eio(seg(t, s2, 0.25)) * (1 - eio(seg(t, s2 + 0.9, 0.25))); btn.location = (X, fy - 0.01 + 0.012 * pr, 1.3)
        c4 = (1 - h, h, 0.1 * (1 - h), 1); bsd(ledM)['Base Color'].default_value = c4; bsd(ledM)['Emission Color'].default_value = c4; bsd(ledM)['Emission Strength'].default_value = 6.0 * (0.4 + 0.6 * (0.5 + 0.5 * math.sin(t * 14)) * (1 - h) + h)
        sc = (0.35 + 0.6 * h, 0.55 + 0.1 * h, 1.0 - 0.7 * h, 1); bsd(strM)['Base Color'].default_value = sc; bsd(strM)['Emission Color'].default_value = sc; glow.data.energy = 30 * h * (1 if t < fx + 3 else 1)
        for i, st in enumerate(steam):
            u = (t - fx - 0.3 - i * 0.25) / 1.1; st.location = (1.0 + 0.03 * math.sin(i * 2), 1.45, 1.1 + 0.35 * u) if 0 < u < 1 else (0, 0, -9); st.scale = ((0.5 + 1.2 * u) * math.sin(math.pi * u),) * 3 if 0 < u < 1 else (0.001,) * 3
    return sh.finish(spot=(-0.45, 1.0), spot_yaw=2.2, reach=2.4, focus=((1.0, -2.5, 1.5), (0.15, 1.5, 1.25), 30), anchors={'focus': fa, 'focus2': fb}, act=act, shiver=0.0, work_lean=0.15)
