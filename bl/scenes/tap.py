# Wasserhahn spritzt: Perlator verkalkt, abschrauben + Essig. Landlord asleep.
import bpy, math
from shell import Shell

def build(L, K, T, lang):
    sh = Shell(L, K, T, 'night', wall='#f3e9e0', van='blue', vprop='drop'); M, B, sph = sh.M, sh.B, sh.sph; sh.living(); X = 0.5; lerp = L.lerp; seg = L.seg; eio = L.eio
    B('cab', (0.9, 0.5, 0.85), (X, 1.5, 0.43), M('cabM', '#c9b79a', 0.6), 0.02); B('top', (0.94, 0.54, 0.04), (X, 1.5, 0.87), M('topM', '#e9e4d8', 0.4), 0.01); B('basin', (0.55, 0.34, 0.012), (X, 1.5, 0.895), sh.steel, 0.004)
    L.cyl('neck', 0.026, 0.26, (X, 1.7, 1.02), sh.steel, verts=12); L.cyl('spout', 0.022, 0.22, (X, 1.6, 1.15), sh.steel, (math.pi / 2, 0, 0), 12); L.cyl('tapH', 0.012, 0.1, (X + 0.08, 1.7, 0.95), sh.steel, (0, math.pi / 2, 0), 10)
    aer = L.empty('aer', (X, 1.49, 1.15)); L.cyl('aerc', 0.03, 0.035, (0, 0, 0), M('aerM', '#b9bec6', 0.3, 1.0), verts=16, parent=aer); lim = L.empty('lime', (0, 0, 0), aer)
    for i in range(5): sph('lm', 0.008, (0.014 * math.cos(i * 1.3), -0.016, 0.014 * math.sin(i * 1.3)), M('limeM', '#e8e2cf', 0.9), (1, 0.6, 1), lim)
    strM = M('stream', '#8cc8ff', 0.05, emit='#6fb6f2', es=2.0, alpha=0.75); stream = L.cyl('strm', 0.02, 0.3, (X, 1.5, 1.0), strM, verts=8); sp = [sph('sp%d' % i, 0.012, (0, 0, -9), M('spM', '#cfe6ff', 0.05, emit='#cfe6ff', es=1.5, alpha=0.8)) for i in range(8)]
    gl = L.cyl('glass', 0.045, 0.11, (X + 0.32, 1.42, 0.955), M('glM', '#e8d27a', 0.1, emit='#d9b84a', es=0.3, alpha=0.5), verts=20); fa = L.empty('fa', (X, 1.5, 1.1)); fb = L.empty('fb', (X + 0.32, 1.45, 1.0)); sh.cx.key(aer, lim, stream, *sp)
    def act(t, ph):
        s1, s2, fx = ph['s1'], ph['s2'], ph['fx']; out = eio(seg(t, s1, 0.7)) * (1 - eio(seg(t, fx - 0.1, 0.6))); bend = 1 - eio(seg(t, fx - 0.1, 0.5))
        tilt = 0.7 * bend if t < s1 else (0.0 if t < fx - 0.1 else 0.7 * bend)
        stream.rotation_euler = (0, tilt, 0); stream.location = (X + 0.15 * math.sin(tilt), 1.5, 1.14 - 0.15 * math.cos(tilt)); stream.scale = (1, 1, 1) if (t < s1 + 0.2 or t > fx - 0.1) else (0.001,) * 3
        g = eio(seg(t, s2, 0.8)); back = eio(seg(t, fx - 0.5, 0.5)); pos = (lerp(X, X + 0.32, g), lerp(1.49, 1.42, g), lerp(1.15, 1.01, g)) if t < fx - 0.5 else (lerp(X + 0.32, X, back), lerp(1.42, 1.49, back), lerp(1.01, 1.15, back))
        aer.location = (X - 0.1 * out, 1.49 - 0.12 * out, 1.15 + 0.03 * out) if t < s2 else pos; lim.scale = (1, 1, 1) if t < s2 + 0.9 else (0.001,) * 3
        for i, s in enumerate(sp): u = (t * 2.2 + i / 8.0) % 1.0; on = t < s1 + 0.3; s.location = (X + 0.15 * u + 0.02 * math.sin(i), 1.5, 1.12 - 0.3 * u * u) if on else (0, 0, -9)
    return sh.finish(spot=(-0.45, 1.0), spot_yaw=2.2, reach=2.0, focus=((1.1, -2.5, 1.4), (0.3, 1.55, 1.05), 50), anchors={'focus': fa, 'focus2': fb}, act=act, opener='hero', shiver=0.0, work_lean=0.15)
