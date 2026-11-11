# Toilette verstopft: Saugglocke. Landlord asleep.
import bpy, math
from shell import Shell

def build(L, K, T, lang):
    sh = Shell(L, K, T, 'night'); M, B, sph = sh.M, sh.B, sh.sph; white = M('porc', '#f6f6f2', 0.15); tile = M('tile', '#9fbdb2', 0.3)
    B('tilew', (2.4, 0.05, 2.5), (-0.9, 1.74, 1.25), tile, 0.01); L.cyl('tbase', 0.17, 0.36, (-1.0, 1.35, 0.23), white, verts=32); bowl = sph('bowl', 0.27, (-1.0, 1.22, 0.5), white, (1, 1.25, 0.55)); B('tank', (0.6, 0.22, 0.55), (-1.0, 1.66, 0.75), white, 0.04); B('lid', (0.64, 0.26, 0.04), (-1.0, 1.66, 1.05), white, 0.02)
    L.torus('seat', 0.2, 0.03, (-1.0, 1.2, 0.62), M('seat', '#fbfbf9', 0.3)).scale = (1, 1.25, 1)
    wat = L.cyl('wat', 0.2, 0.01, (-1.0, 1.2, 0.6), M('tw', '#8ccaf2', 0.05, emit='#8ccaf2', es=0.2, alpha=0.8), verts=32); wat.scale = (1, 1.25, 1)
    pl = L.empty('plunger', (0, 0, -9), sh.TN.hands[0]); L.cyl('ph', 0.012, 0.42, (0, 0, -0.1), M('pw', '#8a6a44', 0.6), parent=pl)
    bpy.ops.mesh.primitive_cone_add(radius1=0.09, radius2=0.01, depth=0.1, location=(0, 0, -0.34), rotation=(math.pi, 0, 0)); cup = bpy.context.active_object; cup.parent = pl; cup.data.materials.append(M('pcup', '#c0392b', 0.5))
    swirl = L.torus('swirl', 0.12, 0.01, (-1.0, 1.2, 0.61), M('swM', '#ffffff', 0.4, emit='#dff0ff', es=2.0)); bubs = [sph('bb%d' % i, 0.02, (0, 0, -9), M('bbM', '#dff0ff', 0.1, emit='#cfe8ff', es=0.8)) for i in range(6)]
    B('mat', (0.9, 0.6, 0.012), (-0.2, 0.5, 0.06), M('bmat', '#7fa9d8', 0.95), 0.003); fa = L.empty('fa', (-1.0, 1.2, 0.8)); fb = L.empty('fb', (-1.0, 1.2, 1.2))
    sh.cx.key(pl, swirl, *bubs); lerp = L.lerp; seg = L.seg; eio = L.eio
    def act(t, ph):
        s1, s2, fx = ph['s1'], ph['s2'], ph['fx']
        on = t > s1 - 0.4 and t < fx + 0.6; pl.scale = (1, 1, 1) if on else (0.001,) * 3
        pump = 0.5 + 0.5 * math.sin((t - s2) * 11) if s2 - 0.2 < t < fx + 0.2 else 0.0; pl.location = (0, -0.05 - 0.2 * ph['work'], 0.05 - 0.1 * pump * ph['work'])
        pl.rotation_euler = (0.5, 0, 0)
        d = eio(seg(t, fx - 0.2, 1.2)); wat.location = (-1.0, 1.2, lerp(0.6, 0.45, d)); u = seg(t, fx - 0.1, 1.4); swirl.scale = (0.1 + 1.0 * (1 - u),) * 3 if 0 < u < 1 else (0.001,) * 3; swirl.rotation_euler = (0, 0, t * 6.0); swirl.location = (-1.0, 1.2, wat.location[2] + 0.01)
        for i, b in enumerate(bubs):
            uu = (t - s2 - 0.1 * i) / 0.7; b.location = (-1.0 + 0.1 * math.sin(i * 2), 1.2 + 0.05 * math.cos(i * 3), 0.62 + 0.25 * uu) if 0 < uu < 1 and t < fx + 0.5 else (0, 0, -9); b.scale = (1,) * 3
    return sh.finish(spot=(-0.4, 1.15), spot_yaw=4.71, reach=0.4, focus=((-1.5, -3.4, 1.4), (-0.7, 1.2, 0.6), 30), anchors={'focus': fb, 'focus2': fa}, act=act, shiver=0.0, work_lean=0.5)
