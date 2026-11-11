# Ausgesperrt: Zweitschluessel im Schluesselsafe. Landlord asleep.
import bpy, math
from shell import Shell

def build(L, K, T, lang):
    sh = Shell(L, K, T, 'night'); M, B, sph = sh.M, sh.B, sh.sph; sh.living(); DX, SX = -1.0, -0.3; fy = 1.74; lerp = L.lerp; seg = L.seg; eio = L.eio
    B('hall', (0.9, 0.02, 2.0), (DX, 1.768, 1.0), M('hallM', '#ffd9a0', 0.4, emit='#ffc27a', es=1.4), 0); dP = L.empty('doorP', (DX - 0.45, fy, 0.0)); B('door', (0.9, 0.06, 2.0), (0.45, 0, 1.0), M('doorM', '#6b4a32', 0.55), 0.01, parent=dP)
    B('dfr', (1.05, 0.04, 0.06), (DX, fy + 0.0, 2.03), sh.trim, 0.004); L.cyl('hdl', 0.018, 0.12, (0.78, -0.06, 1.0), sh.steel, (0, math.pi / 2, 0), 12, parent=dP); L.cyl('lock', 0.03, 0.02, (0.78, -0.035, 1.0), sh.steel, (math.pi / 2, 0, 0), 16, parent=dP)
    B('sbox', (0.24, 0.07, 0.36), (SX, 1.74, 1.3), M('safeM', '#8b9099', 0.35, 0.8), 0.012); B('spad', (0.18, 0.01, 0.17), (SX, 1.703, 1.38), M('padM', '#1d2027', 0.4), 0.004)
    btn = [B('kb%d' % i, (0.035, 0.01, 0.035), (SX - 0.04 + (i % 2) * 0.08, 1.698, 1.42 - (i // 2) * 0.06), M('kbM%d' % i, '#d5d9de', 0.3), 0.004) for i in range(4)]
    ledM = M('led', '#ff2a2a', 0.2, emit='#ff2a2a', es=6.0); sph('sled', 0.014, (SX + 0.07, 1.698, 1.47), ledM); B('srec', (0.18, 0.004, 0.11), (SX, 1.703, 1.18), M('recM', '#101216', 0.5), 0)
    hP = L.empty('flapP', (SX, 1.699, 1.12)); B('flap', (0.2, 0.012, 0.12), (0, 0, 0.06), M('flapM', '#a5abb4', 0.35, 0.8), 0.004, parent=hP)
    key = L.empty('key', (0, 0, -9)); gm = M('gold', '#e6b422', 0.25, 1.0); L.torus('kr', 0.028, 0.008, (0, 0, 0.05), gm, (math.pi / 2, 0, 0), key); L.cyl('ks', 0.008, 0.1, (0, 0, -0.02), gm, verts=10, parent=key); B('kt', (0.03, 0.008, 0.02), (0.015, 0, -0.06), gm, 0.002, parent=key)
    glow = L.point('hallL', (DX, 1.2, 1.1), 0, '#ffb870', 0.3); glow.data.use_shadow = False; fa = L.empty('fa', (SX, 1.7, 1.3)); fb = L.empty('fb', (DX + 0.35, 1.7, 1.2)); sh.cx.key(dP, hP, key, *btn); sh.cx.prop(glow.data, 'energy')
    bsd = lambda m: m.node_tree.nodes['Principled BSDF'].inputs
    for q in (bsd(ledM)['Base Color'], bsd(ledM)['Emission Color'], bsd(ledM)['Emission Strength']): sh.cx.prop(q, 'default_value')
    def act(t, ph):
        s1, s2, fx = ph['s1'], ph['s2'], ph['fx']
        for i, b in enumerate(btn): p = eio(seg(t, s1 + 0.25 * i, 0.08)) * (1 - eio(seg(t, s1 + 0.25 * i + 0.1, 0.08))); b.location = (SX - 0.04 + (i % 2) * 0.08, 1.698 + 0.008 * p, 1.42 - (i // 2) * 0.06)
        e = eio(seg(t, s1 + 1.0, 0.2)); c4 = (1 - e, e, 0.1 * (1 - e), 1); bsd(ledM)['Base Color'].default_value = c4; bsd(ledM)['Emission Color'].default_value = c4; bsd(ledM)['Emission Strength'].default_value = 6.0 * (0.5 + 0.5 * e)
        hP.rotation_euler = (1.4 * eio(seg(t, s2, 0.5)), 0, 0); k = eio(seg(t, s2 + 0.6, max(0.3, fx - s2 - 0.9)))
        if s2 + 0.3 < t < fx: key.location = (lerp(SX, DX + 0.32, k), lerp(1.69, 1.69, k), lerp(1.17, 1.0, k) + 0.25 * math.sin(math.pi * k)); key.scale = (1, 1, 1); key.rotation_euler = (0, 0, 6.0 * k)
        else: key.scale = (0.001,) * 3
        o = eio(seg(t, fx, 0.7)); dP.rotation_euler = (0, 0, 1.5 * o); glow.data.energy = 60 * o
    return sh.finish(spot=(0.3, 1.0), spot_yaw=3.95, reach=2.0, focus=((-0.9, -2.5, 1.4), (-0.3, 1.7, 1.2), 30), anchors={'focus': fa, 'focus2': fb}, act=act, shiver=0.0, work_lean=0.15)
