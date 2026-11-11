# Herd geht nicht an: Kindersicherung. Landlord on the beach.
import bpy, math
from shell import Shell

def build(L, K, T, lang):
    sh = Shell(L, K, T, 'beach'); M, B, sph = sh.M, sh.B, sh.sph; sh.living()
    ck = M('counter', '#e9e4d8', 0.5); B('cnt', (1.3, 0.8, 0.92), (0.95, 1.4, 0.46), ck, 0.02); B('cook', (1.2, 0.7, 0.02), (0.95, 1.4, 0.93), M('glass', '#15151a', 0.12), 0.004)
    burners = []; bm = M('burn', '#3a3a40', 0.4, emit='#ff3a10', es=0.0)
    for bx, by in ((0.65, 1.2), (1.2, 1.2), (0.65, 1.6), (1.2, 1.6)): burners.append(L.torus('b', 0.1, 0.014, (bx, by, 0.945), bm))
    L.cyl('potB', 0.11, 0.14, (1.2, 1.6, 1.02), M('pot', '#c9ced6', 0.3, 1.0)); L.cyl('potL', 0.115, 0.02, (1.2, 1.6, 1.1), M('pot2', '#aab0b8', 0.3, 1.0)); sph('potK', 0.02, (1.2, 1.6, 1.13), M('potk', '#222', 0.4))
    B('panel', (0.5, 0.02, 0.1), (0.7, 0.995, 0.8), M('panel', '#2a2a30', 0.4), 0.01); btn = [B('btn%d' % i, (0.05, 0.02, 0.05), (0.52 + i * 0.09, 0.985, 0.8), M('bt%d' % i, '#cfd3d8', 0.3), 0.006) for i in range(4)]
    ledM = M('led', '#ff2a2a', 0.2, emit='#ff2a2a', es=6.0); led = sph('led', 0.018, (0.9, 0.985, 0.8), ledM); lockP = M('lock', '#ff5a3a', 0.3, emit='#ff3a1a', es=2.0); L.cyl('lockI', 0.025, 0.01, (0.88, 0.982, 0.86), lockP, (math.pi / 2, 0, 0), 12)
    steam = [sph('st%d' % i, 0.035, (0, 0, -9), M('steam', '#ffffff', 0.5, emit='#eef6ff', es=1.2)) for i in range(5)]
    hand_glow = L.point('stoveL', (0.95, 1.2, 1.1), 0, '#ff5a2a', 0.2); hand_glow.data.use_shadow = False; fa = L.empty('fa', (0.7, 0.98, 0.95)); fb = L.empty('fb', (0.95, 1.0, 1.3))
    sh.cx.key(*steam, *btn); sh.cx.prop(hand_glow.data, 'energy')
    for q in (burners[0].data.materials[0].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'], ledM.node_tree.nodes['Principled BSDF'].inputs['Base Color'], ledM.node_tree.nodes['Principled BSDF'].inputs['Emission Color'], ledM.node_tree.nodes['Principled BSDF'].inputs['Emission Strength']): sh.cx.prop(q, 'default_value')
    bsd = lambda m: m.node_tree.nodes['Principled BSDF'].inputs
    def act(t, ph):
        h = ph['fix']; bsd(bm)['Emission Strength'].default_value = 3.0 * h; hand_glow.data.energy = 40 * h
        press = L.eio(L.seg(t, ph['s1'], 0.2)) * (1 - L.eio(L.seg(t, ph['s2'] + 0.6, 0.2))); btn[3].scale = (1, 1 - 0.5 * press, 1) if False else (1, 1, 1)
        c = (1 - h, h, 0.1 * (1 - h), 1) if True else (1, 0, 0, 1); bsd(ledM)['Base Color'].default_value = c; bsd(ledM)['Emission Color'].default_value = c; bsd(ledM)['Emission Strength'].default_value = 6.0 * (0.4 + 0.6 * (0.5 + 0.5 * math.sin(t * 14)) * (1 - h) + h)
        for i, st in enumerate(steam):
            u = (t - ph['fx'] - 0.3 - i * 0.25) / 1.1
            st.location = (1.2 + 0.03 * math.sin(i * 2), 1.6, 1.15 + 0.3 * u) if 0 < u < 1 else (0, 0, -9); st.scale = ((0.5 + 1.2 * u) * math.sin(math.pi * u),) * 3 if 0 < u < 1 else (0.001,) * 3
    return sh.finish(spot=(-0.05, 0.82), spot_yaw=2.27, reach=1.7, focus=((1.0, -2.6, 1.3), (0.55, 1.0, 0.85), 28), anchors={'focus': fa, 'focus2': fb}, act=act, shiver=0.0)
