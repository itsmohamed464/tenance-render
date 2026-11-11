# Dusche läuft nicht ab: Haare im Abfluss. Landlord on holiday.
import bpy, math
from shell import Shell

def build(L, K, T, lang):
    sh = Shell(L, K, T, 'beach'); M, B, sph = sh.M, sh.B, sh.sph; tile = M('tile', '#9fd6cf', 0.25); white = sh.white
    B('tilew', (2.3, 0.05, 2.5), (-1.0, 1.74, 1.25), tile, 0.01); B('tray', (1.3, 1.3, 0.1), (-1.1, 1.0, 0.1), white, 0.02)
    for sx in (-1, 1): B('trl', (0.06, 1.3, 0.16), (-1.1 + sx * 0.62, 1.0, 0.18), white, 0.01)
    B('trb', (1.3, 0.06, 0.16), (-1.1, 1.62, 0.18), white, 0.01); B('trf', (1.3, 0.06, 0.16), (-1.1, 0.38, 0.18), white, 0.01)
    L.cyl('riser', 0.018, 1.3, (-1.1, 1.7, 1.4), sh.steel, verts=12); L.cyl('arm', 0.016, 0.3, (-1.1, 1.55, 2.05), sh.steel, (math.pi / 2, 0, 0), 12); L.cyl('head', 0.12, 0.03, (-1.1, 1.38, 2.0), sh.steel, (0.3, 0, 0), 24)
    L.cyl('drainH', 0.07, 0.01, (-1.1, 0.95, 0.152), M('drainK', '#111114', 0.3), verts=24); cover = L.empty('cover', (-1.1, 0.95, 0.165)); L.cyl('dcv', 0.075, 0.012, (0, 0, 0), sh.steel, verts=24, parent=cover)
    for i in range(7): L.cyl('slit', 0.006, 0.015, (0.03 * math.cos(i * 0.9), 0.03 * math.sin(i * 0.9), 0.002), M('slitM', '#222', 0.4), verts=6, parent=cover)
    wat = B('water', (1.18, 1.18, 1.0), (-1.1, 1.0, 0.16), M('wat', '#4fa8ee', 0.05, emit='#2a7fd0', es=0.35, alpha=0.8), 0); hair = L.empty('hair', (-1.1, 0.95, 0.17))
    for i, (dx, dy) in enumerate(((0, 0), (0.03, 0.02), (-0.03, 0.01), (0.01, -0.03))): sph('hr', 0.03, (dx, dy, 0.0), M('hairM', '#2a1c14', 0.8), (1.4, 1.0, 0.5), hair)
    swirl = L.torus('swirl', 0.1, 0.008, (-1.1, 0.95, 0.17), M('swM', '#ffffff', 0.4, emit='#dff0ff', es=2.0)); drops = [sph('d%d' % i, 0.012, (0, 0, -9), M('dpM', '#8cc8ff', 0.05, emit='#8cc8ff', es=0.6)) for i in range(4)]
    L.cyl('sinkP', 0.05, 0.7, (0.9, 1.5, 0.35), white); B('sink', (0.6, 0.4, 0.12), (0.9, 1.5, 0.8), white, 0.03); B('mirror', (0.5, 0.02, 0.7), (0.9, 1.74, 1.5), M('mir', '#c9d2db', 0.05, 1.0), 0.01)
    L.cyl('mat', 0.4, 0.015, (0.0, 0.5, 0.06), M('bmat', '#e09b6b', 0.95)); fa = L.empty('fa', (-1.1, 0.95, 0.5)); fb = L.empty('fb', (-1.1, 0.95, 1.0))
    sh.cx.key(cover, hair, wat, swirl, *drops); sh.cx.prop(wat.data.materials[0].node_tree.nodes['Principled BSDF'].inputs['Alpha'], 'default_value')
    sm = L.lerp; seg = L.seg; eio = L.eio; lerp = L.lerp
    def act(t, ph):
        s1, s2, fx = ph['s1'], ph['s2'], ph['fx']
        off = eio(seg(t, s1, 0.6)); cover.location = (-1.1 + 0.25 * off, 0.95 - 0.1 * off, 0.165 + 0.07 * math.sin(math.pi * min(1, off * 1.3)) * (1 - off) + 0.0 * off); cover.rotation_euler = (0.3 * off, 0, 0.6 * off)
        pull = eio(seg(t, s2, 0.9)); hair.location = (-1.1 + 0.1 * pull, 0.95 - 0.35 * pull, 0.17 + 0.5 * math.sin(math.pi * 0.5 * pull)) if pull < 1 else (0, 0, -9)
        hair.scale = (1, 1, 1) if t < s2 + 1.0 else (0.001,) * 3
        d = eio(seg(t, fx - 0.2, 1.4)); lvl = lerp(0.13, 0.002, d) if t > s2 else 0.13; wat.scale = (1, 1, lvl); wat.location = (-1.1, 1.0, 0.1 + lvl / 2)
        u = seg(t, fx - 0.1, 1.5); swirl.scale = (0.1 + 1.0 * (1 - u),) * 3 if 0 < u < 1 else (0.001,) * 3; swirl.rotation_euler = (0, 0, t * 6.0); swirl.location = (-1.1, 0.95, 0.12 + lvl)
        for i, dp in enumerate(drops):
            uu = (t - s2 - 0.3 - 0.12 * i) / 0.6; dp.location = (-1.1 + 0.05 * i, 0.9, 0.2 + 0.3 * math.sin(math.pi * uu)) if 0 < uu < 1 else (0, 0, -9); dp.scale = (1,) * 3
    return sh.finish(spot=(-0.45, 0.95), spot_yaw=4.71, reach=0.25, focus=((-1.6, -3.4, 1.5), (-0.8, 0.95, 0.45), 30), anchors={'focus': fb, 'focus2': fa}, act=act, shiver=0.0, work_lean=0.6)
