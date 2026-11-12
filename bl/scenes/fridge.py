# Kuehlschrank steht unter Wasser: Abtauloch verstopft. Landlord asleep.
import bpy, math
from shell import Shell

def build(L, K, T, lang):
    sh = Shell(L, K, T, 'night', wall='#f1e8f4', van='white', vprop='wrench'); M, B, sph = sh.M, sh.B, sh.sph; sh.living(); X, Y = 0.95, 1.35; fy = Y - 0.33; lerp = L.lerp; seg = L.seg; eio = L.eio
    B('fbody', (0.7, 0.66, 1.7), (X, Y, 0.85), M('fridge', '#e3e8ec', 0.3), 0.03); B('fin', (0.6, 0.01, 1.55), (X, fy - 0.001, 0.85), M('fint', '#f4f1e6', 0.5, emit='#fff1d0', es=0.5), 0)
    gl = M('fglass', '#b8e0f0', 0.1, alpha=0.5)
    for z in (0.4, 0.85, 1.25): B('fsh', (0.6, 0.14, 0.015), (X, fy - 0.07, z), gl, 0.003)
    sph('apple', 0.05, (X - 0.18, fy - 0.07, 0.94), M('appleM', '#d63a2c', 0.4)); L.cyl('jar', 0.045, 0.1, (X + 0.15, fy - 0.07, 0.91), M('jarM', '#d9a441', 0.4)); B('milk', (0.1, 0.08, 0.2), (X - 0.05, fy - 0.07, 1.36), M('milkM', '#f6f6f6', 0.5), 0.005); sph('lem', 0.05, (X + 0.18, fy - 0.07, 1.33), M('lemM', '#f2d33a', 0.5))
    L.cyl('hole', 0.025, 0.006, (X, fy - 0.004, 0.55), M('holeM', '#0b0b0e', 0.5), (math.pi / 2, 0, 0), 20); wat = B('fwat', (0.58, 0.12, 0.05), (X, fy - 0.07, 0.43), M('fwatM', '#6fb6f2', 0.05, emit='#3a8fd8', es=0.4, alpha=0.8), 0)
    dP = L.empty('fdoor', (X + 0.35, fy - 0.02, 0.85)); B('fdoorB', (0.68, 0.04, 1.66), (-0.34, 0, 0), M('fdoorM', '#eef1f4', 0.3), 0.02, parent=dP); B('fhan', (0.03, 0.04, 0.5), (-0.6, -0.04, 0.2), sh.steel, 0.01, parent=dP)
    pud = L.cyl('pud', 0.55, 0.004, (X - 0.1, fy - 0.45, 0.052), M('pudM', '#6fb6f2', 0.05, emit='#3a8fd8', es=0.3, alpha=0.7), verts=40)
    sw = L.empty('swab', (0, 0, -9), sh.TN.hands[0]); L.cyl('swh', 0.006, 0.22, (0, 0, -0.1), M('swM', '#e8d9b8', 0.6)); sph('swt', 0.012, (0, 0, -0.21), M('swT', '#ffffff', 0.9))
    lt = L.point('fridL', (X, fy - 0.15, 1.0), 0, '#fff1d0', 0.2); lt.data.use_shadow = False; fa = L.empty('fa', (X, fy, 0.55)); fb = L.empty('fb', (X, fy, 1.3)); sh.cx.key(dP, pud, wat, sw); sh.cx.prop(lt.data, 'energy')
    def act(t, ph):
        s1, s2, fx = ph['s1'], ph['s2'], ph['fx']
        o = eio(seg(t, s1, 0.6)); dP.rotation_euler = (0, 0, 1.9 * o); lt.data.energy = 25 * o; g = 0.3 + 0.7 * eio(seg(t, s1, 1.0)); d = eio(seg(t, fx - 0.2, 1.4))
        pud.scale = (max(0.001, g * (1 - 0.85 * d)),) * 2 + (1,); lv = max(0.001, 1 - d); wat.scale = (1, 1, lv); wat.location = (X, fy - 0.07, 0.405 + 0.025 * lv)
        on = t > s2 - 0.5 and t < fx + 0.3; sw.scale = (1, 1, 1) if on else (0.001,) * 3; sw.location = (0, -0.05 - 0.2 * ph['work'], 0.05 + 0.03 * math.sin((t - s2) * 14) * ph['work']); sw.rotation_euler = (1.2, 0, 0)
    return sh.finish(spot=(0.12, 0.92), spot_yaw=1.57, reach=1.0, focus=((0.9, -2.7, 0.95), (0.9, 1.0, 0.6), 30), anchors={'focus': fa, 'focus2': fb}, act=act, opener='wide', shiver=0.0, work_lean=0.5)
