# Heizkoerper bleibt kalt: Ventilstift haengt. Kappe ab, Stift loesen. Landlord asleep.
import bpy, math
from shell import Shell

def build(L, K, T, lang):
    sh = Shell(L, K, T, 'night', wall='#ece6dc', van='yellow', vprop='wrench'); M, B, sph = sh.M, sh.B, sh.sph; sh.living(); X = 0.55; lerp = L.lerp; seg = L.seg; eio = L.eio
    radM = M('rad', '#6fa8e8', 0.4, emit='#5a98e8', es=0.6); B('radb', (0.9, 0.1, 0.62), (X, 1.7, 0.62), radM, 0.02); [B('radf%d' % i, (0.025, 0.12, 0.62), (X - 0.4 + i * 0.1, 1.69, 0.62), M('radfM', '#e8ecf0', 0.4), 0.004) for i in range(9)]
    L.cyl('vpipe', 0.02, 0.12, (X + 0.5, 1.7, 0.4), sh.steel, (0, math.pi / 2, 0), 12); L.cyl('vbody', 0.035, 0.07, (X + 0.55, 1.7, 0.4), sh.steel, (0, math.pi / 2, 0), 16); L.cyl('vstem', 0.008, 0.05, (X + 0.6, 1.7, 0.4), sh.steel, (0, math.pi / 2, 0), 8)
    cap = L.empty('cap', (X + 0.63, 1.7, 0.4)); L.cyl('capc', 0.045, 0.07, (0, 0, 0), M('capM', '#f4f4f0', 0.35), (0, math.pi / 2, 0), 24, parent=cap); L.cyl('capn', 0.03, 0.02, (0.04, 0, 0), M('capnM', '#d0d4da', 0.3), (0, math.pi / 2, 0), 20, parent=cap)
    pin = L.cyl('pin', 0.006, 0.05, (X + 0.64, 1.7, 0.4), M('pinM', '#9aa0aa', 0.3, 1.0), (0, math.pi / 2, 0), 8); coin = L.empty('coin', (0, 0, -9), sh.TN.hands[0]); L.cyl('coinc', 0.03, 0.006, (0, 0, -0.03), M('coinM', '#e6b422', 0.25, 1.0), (math.pi / 2, 0, 0), 20, parent=coin)
    glow = L.point('radL', (X, 1.4, 0.7), 0, '#ff8a3a', 0.3); glow.data.use_shadow = False; fa = L.empty('fa', (X + 0.6, 1.7, 0.4)); fb = L.empty('fb', (X, 1.6, 0.7)); sh.cx.key(cap, pin, coin); sh.cx.prop(glow.data, 'energy')
    bsd = lambda m: m.node_tree.nodes['Principled BSDF'].inputs
    for q in (bsd(radM)['Base Color'], bsd(radM)['Emission Color'], bsd(radM)['Emission Strength']): sh.cx.prop(q, 'default_value')
    def act(t, ph):
        s1, s2, fx, h = ph['s1'], ph['s2'], ph['fx'], ph['fix']
        off = eio(seg(t, s1, 0.6)) * (1 - eio(seg(t, fx - 0.3, 0.5))); cap.location = (X + 0.63 + 0.12 * off, 1.7 - 0.2 * off, 0.4 + 0.1 * off); cap.rotation_euler = (0, 0, 0.8 * off)
        on = s2 - 0.3 < t < fx; coin.scale = (1, 1, 1) if on else (0.001,) * 3; coin.location = (0, -0.05, 0.0); coin.rotation_euler = (0.0, 0.0, 0.5 * math.sin((t - s2) * 10))
        pin.location = (X + 0.64 + 0.01 * math.sin((t - s2) * 14) * (1 if s2 < t < fx - 0.2 else 0), 1.7, 0.4)
        c4 = (0.35 + 0.65 * h, 0.55 + 0.1 * h, 0.95 - 0.75 * h, 1); bsd(radM)['Base Color'].default_value = c4; bsd(radM)['Emission Color'].default_value = c4; bsd(radM)['Emission Strength'].default_value = 0.6 + 2.2 * h; glow.data.energy = 40 * h
    return sh.finish(spot=(0.5, 1.0), spot_yaw=3.95, reach=0.9, focus=((0.2, -2.5, 0.9), (0.95, 1.6, 0.45), 42), anchors={'focus': fa, 'focus2': fb}, act=act, opener='face', shiver=0.0, work_lean=0.55)
