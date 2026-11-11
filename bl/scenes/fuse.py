# Strom weg: Sicherung. Landlord asleep. The lower flat goes dark until the breaker is flipped.
import bpy, math
from shell import Shell

def build(L, K, T, lang):
    sh = Shell(L, K, T, 'night'); M, B, sph = sh.M, sh.B, sh.sph; sh.living()
    B('box', (0.62, 0.1, 0.8), (0.45, 1.7, 1.35), M('fbox', '#cfd3d8', 0.4), 0.02); B('door', (0.56, 0.02, 0.74), (0.45, 1.64, 1.35), M('fdoor', '#e8ebee', 0.4), 0.01)
    brk = []; tripped = M('trip', '#d33a2c', 0.4, emit='#d33a2c', es=0.0)
    for i in range(5): brk.append(B('sw%d' % i, (0.06, 0.04, 0.16), (0.3 + i * 0.1, 1.62, 1.4), M('swm%d' % i, '#2a2f38', 0.4), 0.006))
    t_sw = B('swT', (0.06, 0.04, 0.16), (0.2, 1.62, 1.32), M('swT', '#e8503a', 0.4, emit='#e8503a', es=1.5), 0.006)
    B('cnt', (1.3, 0.55, 0.85), (1.15, 1.35, 0.43), M('cnt', '#e9e4d8', 0.5), 0.02); L.cyl('kett', 0.07, 0.16, (1.0, 1.35, 0.93), M('kettM', '#d23b30', 0.3, 0.2)); B('toast', (0.22, 0.14, 0.16), (1.35, 1.35, 0.93), M('toastM', '#b0b4ba', 0.3, 1.0), 0.02)
    dark = L.point('darkL', (0, 0, 0), 0, '#fff', 0.1); dark.data.use_shadow = False
    glow = M('lampGlow', '#ffe9c4', 0.4, emit='#ffd9a0', es=1.4)
    sh.cx.key(t_sw)
    def dk(t, ph):
        n_, fx = ph['n'], ph['fx']; flick = 0.5 + 0.5 * math.sin(t * 40)
        if t < n_ + 0.15: return 1.0
        if t < fx - 0.1: return 0.05 + (0.3 * flick if t < n_ + 0.5 else 0.0)
        return min(1.0, 0.05 + (t - fx + 0.1) / 0.5)
    fa = L.empty('fa', (0.45, 1.6, 1.45)); fb = L.empty('fb', (0.45, 1.6, 1.9)); lerp = L.lerp; seg = L.seg; eio = L.eio
    def act(t, ph):
        s1, s2, fx = ph['s1'], ph['s2'], ph['fx']
        flip = eio(seg(t, s2, 0.3)); t_sw.location = (0.2, 1.62, lerp(1.32, 1.4, flip))
    return sh.finish(spot=(-0.25, 0.85), spot_yaw=2.27, reach=1.9, focus=((1.4, -2.4, 1.6), (0.3, 1.6, 1.4), 30), anchors={'focus': fb, 'focus2': fa}, act=act, shiver=0.0, dark=dk)
