# Schwarze Flecken (Schimmel/Kondenswasser): lueften + Spiritus. Landlord on the beach.
import bpy, math, random
from shell import Shell

def build(L, K, T, lang):
    sh = Shell(L, K, T, 'beach', wall='#f5eed8', van='green'); M, B, sph = sh.M, sh.B, sh.sph; sh.living(); lerp = L.lerp; seg = L.seg; eio = L.eio; rnd = random.Random(7)
    mm = M('moldM', '#1c1f1a', 0.9); spots = []; sc0 = []
    for i in range(14): a = rnd.uniform(0, 6.28); r = rnd.uniform(0.0, 0.32); sc0.append((rnd.uniform(0.9, 1.6), 0.25, rnd.uniform(0.6, 1.1))); spots.append(sph('mold%d' % i, rnd.uniform(0.035, 0.085), (-0.2 + r * math.cos(a) * 1.3, 1.755, 1.75 + r * math.sin(a) * 0.8), mm, sc0[-1]))
    dm = M('dropM', '#9fd0ff', 0.05, emit='#7fb8f0', es=0.5, alpha=0.8); drops = [sph('drop%d' % i, 0.014, (-0.9 + 0.1 * i, 1.75, 1.45 + 0.07 * (i % 3)), dm, (1, 0.5, 1.6)) for i in range(10)]
    sP = L.empty('sashP', (0.45, 1.745, 1.55)); gl = M('sglass', '#cfe8ff', 0.05, alpha=0.2)
    B('sglassB', (0.9, 0.02, 1.1), (0.5, 0, 0), gl, 0, parent=sP)
    for dx, dz, sx, sz in ((0.5, 0.55, 1.0, 0.05), (0.5, -0.55, 1.0, 0.05), (0.02, 0, 0.05, 1.15), (0.98, 0, 0.05, 1.15)): B('sfr', (sx, 0.04, sz), (dx, 0, dz), sh.trim, 0.004, parent=sP)
    wind = [B('wnd%d' % i, (0.35, 0.01, 0.012), (0, 0, -9), M('windM', '#ffffff', 0.4, emit='#ffffff', es=1.5, alpha=0.6), 0) for i in range(6)]
    cl = L.empty('cloth', (0, 0, -9), sh.TN.hands[0]); sph('clM', 0.05, (0, 0, -0.04), M('clothM', '#f2f2ee', 0.9), (1, 0.4, 1), cl); fa = L.empty('fa', (-0.2, 1.7, 1.75)); fb = L.empty('fb', (0.9, 1.6, 1.6))
    sh.cx.key(*spots, *drops, sP, *wind, cl)
    def act(t, ph):
        s1, s2, fx = ph['s1'], ph['s2'], ph['fx']
        sP.rotation_euler = (0, 0, -1.4 * eio(seg(t, s1, 0.6)))
        for i, d in enumerate(drops): d.scale = (1, 0.5, 1.6) if t < s1 + 0.8 + 0.05 * i else (0.001,) * 3
        for i, s in enumerate(spots): v = 1 - eio(seg(t, s2 + 0.1 * i, 0.35)); s.scale = tuple(max(0.001, v * q) for q in sc0[i])
        for i, w in enumerate(wind):
            u = ((t - s1 - 0.5) * 0.7 + i / 6.0) % 1.0; on = s1 + 0.4 < t < fx + 0.5; w.location = (lerp(0.8, -1.4, u), 1.5, 1.2 + 0.18 * i) if on else (0, 0, -9)
        on2 = s2 - 0.2 < t < fx + 0.3; cl.scale = (1, 1, 1) if on2 else (0.001,) * 3; w2 = ph['work']; cl.location = (0.0, -0.1 - 0.15 * w2, 0.0 + 0.0); cl.rotation_euler = (0, 0, 0.8 * math.sin((t - s2) * 11) * w2)
    return sh.finish(spot=(0.35, 1.0), spot_yaw=3.95, reach=2.4, focus=((-0.7, -2.5, 1.5), (0.0, 1.7, 1.7), 30), anchors={'focus': fa, 'focus2': fb}, act=act, opener='landlord', shiver=0.0, work_lean=0.12)
