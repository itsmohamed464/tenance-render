# Rauchmelder piept nachts: Batterie leer. Landlord asleep.
import bpy, math
from shell import Shell

def build(L, K, T, lang):
    sh = Shell(L, K, T, 'night'); M, B, sph = sh.M, sh.B, sh.sph; sh.living()
    wm = M('wood2', '#8a6a44', 0.6)
    for sx in (-1, 1): B('lad', (0.05, 0.05, 1.0), (-0.5 + sx * 0.22, 0.95, 0.5), wm, 0.01, rot=(0.12 * sx * 0, 0.0, 0))
    for i in range(4): B('step', (0.5, 0.2, 0.04), (-0.5, 0.95, 0.22 + i * 0.22), wm, 0.01)
    det = L.empty('det', (-0.2, 1.7, 2.0)); L.cyl('dB', 0.13, 0.05, (0, 0, 0), M('dm', '#f4f4f0', 0.4), (math.pi / 2, 0, 0), 32, parent=det)
    cover = L.empty('cover', (0, -0.03, 0), det); L.cyl('dC', 0.1, 0.02, (0, 0, 0), M('dc', '#ececE6', 0.4), (math.pi / 2, 0, 0), 32, parent=cover)
    ledM = M('led', '#ff2a2a', 0.2, emit='#ff2a2a', es=6.0); led = sph('led', 0.012, (0.06, -0.035, 0.05), ledM, parent=det)
    bat = L.empty('bat', (0, 0.0, 0), det); B('bt', (0.04, 0.02, 0.06), (0, 0.0, 0), M('batt', '#222222', 0.4), 0.004, parent=bat); B('bt2', (0.03, 0.022, 0.02), (0, 0, 0.04), M('batg', '#e0b050', 0.3, 1.0), 0.002, parent=bat)
    rings = [L.torus('chirp%d' % i, 0.16, 0.007, (-0.2, 1.6, 2.0), M('chM', '#ffb0a0', 0.2, emit='#ff6a5a', es=3.0), (math.pi / 2, 0, 0)) for i in range(3)]
    sh.cx.key(det, cover, bat, led, *rings); fa = L.empty('fa', (-0.2, 1.6, 2.15)); handB = L.empty('handB', (0, 0, 0), sh.TN.hands[0])
    bsd = lambda m: m.node_tree.nodes['Principled BSDF'].inputs
    for q in (bsd(ledM)['Base Color'], bsd(ledM)['Emission Color'], bsd(ledM)['Emission Strength']): sh.cx.prop(q, 'default_value')
    sm = L.lerp; seg = L.seg; eio = L.eio
    def act(t, ph):
        h = ph['fix']; s1, s2 = ph['s1'], ph['s2']; chirp = 1 - h
        for i, r in enumerate(rings):
            u = ((t * 1.4 + i / 3) % 1); r.scale = ((0.4 + 1.6 * u),) * 3 if (chirp > 0.5 and t > 0.8) else (0.001,) * 3
        off = eio(seg(t, s1, 0.5)) * (1 - eio(seg(t, s2 + 0.5, 0.5))); cover.location = (0.0, -0.03 - 0.5 * off, -0.35 * off); cover.rotation_euler = (0, 0, 4.0 * off)
        bat.location = (0, -0.01 - 0.4 * (1 - eio(seg(t, s2 - 0.3, 0.7))) * (1 if t < s2 + 0.4 else 0), -0.1 * (1 - eio(seg(t, s2 - 0.3, 0.7)))) if t >= s1 + 0.3 else (0, 0, -9)
        bat.scale = (1, 1, 1) if t >= s1 + 0.3 else (0.001,) * 3
        c = (1 - h, h, 0.05, 1); bsd(ledM)['Base Color'].default_value = c; bsd(ledM)['Emission Color'].default_value = c; bsd(ledM)['Emission Strength'].default_value = 6.0 * ((1 if int(t * 2.2) % 2 == 0 else 0.1) * (1 - h) + h * 0.8)
    return sh.finish(spot=(-0.5, 0.62), spot_yaw=3.14, reach=2.6, focus=((1.1, -2.2, 2.3), (-0.2, 1.6, 1.95), 30), anchors={'focus': fa, 'focus2': fa}, act=act, shiver=0.0, spot_z=0.9)
