# Shared "Vermieter series" shell: two-floor cutaway (landlord upstairs, tenant downstairs), phones, Tenance AI mascot, emergency van, orbs,
# lights, camera track and the whole story state machine. A topic file only adds the lower-flat props + the tenant's action.
import bpy, math
from mathutils import Vector

class Shell:
    def __init__(s, L, K, T, mode='night', wall=None, van='yellow', vprop=None, sofa=None, rug=None):
        s.L, s.K, s.T, s.mode = L, K, T, mode; s.kw = dict(sofa=sofa, rug=rug); vcol = van; s.sc = sc = bpy.context.scene; s.cx = L.Ctx(sc); s.UZ = UZ = 2.85
        s.M, s.B, s.sph, s.A = L.mat, L.box, L.sph, L.area; M, B, sph, A = s.M, s.B, s.sph, s.A; night = mode == 'night'
        L.world(sc, '#080d1c' if night else '#9fd0ff', 0.3 if night else 1.1)
        s.wall, s.trim, s.slab = M('wall', wall or '#efe3d0', 0.9), M('trim', '#f7f3ec', 0.5), M('slab', '#262a36', 0.8)
        s.wood, s.woodU = M('wood', '#b98a5e', 0.5), M('woodU', '#9c7752', 0.5); s.white, s.steel, s.teal = M('white', '#f4f4f0', 0.35), M('steel', '#cfd6dd', 0.25, 1.0), M('teal', '#2f6b73', 0.8)
        wallU = M('wallU', '#cfd8ea' if night else '#8fd0ff', 0.9); floorU = s.woodU if night else M('sand', '#e6cf9b', 0.95)
        B('road', (14, 1.6, 0.1), (0, -2.75, -0.05), M('road', '#23252d', 0.9)); B('walk', (14, 0.5, 0.12), (0, -1.9, -0.04), M('walk', '#6d7080', 0.8))
        for x in (-5, -3, -1, 1, 3, 5): B('dash', (0.7, 0.07, 0.01), (x, -2.8, 0.006), M('dash', '#d9d9d0', 0.6), 0)
        B('base', (4.5, 3.9, 0.3), (0, 0, -0.15), s.slab); B('floorL', (3.9, 3.6, 0.05), (0, 0, 0.025), s.wood, 0.004)
        for z0, wm in ((0, s.wall), (UZ, wallU)):
            B('bw', (4.3, 0.15, 2.6), (0, 1.85, z0 + 1.3), wm); B('lw', (0.15, 3.85, 2.6), (-2.07, 0, z0 + 1.3), wm); B('rw', (0.15, 3.85, 2.6), (2.07, 0, z0 + 1.3), wm); B('skirt', (3.9, 0.03, 0.1), (0, 1.76, z0 + 0.08), s.trim, 0.004)
        B('mid', (4.3, 3.85, 0.25), (0, 0, 2.725), s.slab); B('floorU', (3.9, 3.6, 0.05), (0, 0, UZ + 0.025), floorU, 0.004); B('topcap', (4.3, 3.85, 0.1), (0, 0, UZ + 2.65), s.slab)
        def window(name, x, z0, col, es, dots, cur=True):
            B(name + 'p', (0.95, 0.02, 1.15), (x, 1.765, z0 + 1.55), M(name, col, 0.1, emit=col, es=es), 0)
            for dx in (-0.5, 0.5): B(name + 'f', (0.05, 0.05, 1.25), (x + dx, 1.76, z0 + 1.55), s.trim, 0.004)
            for dz in (-0.6, 0, 0.6): B(name + 'g', (1.05, 0.05, 0.05), (x, 1.76, z0 + 1.55 + dz), s.trim, 0.004)
            B(name + 'sill', (1.15, 0.16, 0.05), (x, 1.7, z0 + 0.93), s.trim, 0.006); dm = M(name + 'd', '#ffd27a', 0.2, emit='#ffd27a', es=7.0)
            for i in range(dots): B(name + 'c', (0.03, 0.01, 0.04), (x - 0.42 + 0.84 * ((i * 0.7548 + 0.13) % 1), 1.752, z0 + 1.05 + 0.85 * ((i * 0.5698 + 0.31) % 1)), dm, 0)
            if cur: cm = M(name + 'cu', '#7a3b50', 0.9); B(name + 'cl', (0.22, 0.06, 1.35), (x - 0.62, 1.7, z0 + 1.5), cm, 0.03); B(name + 'cr', (0.22, 0.06, 1.35), (x + 0.62, 1.7, z0 + 1.5), cm, 0.03)
        s.window = window; window('winL', 0.95, 0, '#16254a', 0.9, 9)
        # ---- upper floor: bedroom (night) or beach holiday (day)
        s.phU_pos = (-0.3, 1.45, UZ + 0.495)
        if night:
            window('winU', 0.95, UZ, '#5a74c8', 1.6, 0); sph('moon', 0.085, (1.2, 1.755, UZ + 1.95), M('moon', '#f4f1dd', 0.3, emit='#f4f1dd', es=5.0))
            B('bedF', (1.1, 1.9, 0.3), (-1.2, 0.85, UZ + 0.19), s.woodU, 0.02); B('mat', (1.0, 1.8, 0.2), (-1.2, 0.85, UZ + 0.44), s.white, 0.04); B('head', (1.2, 0.1, 0.9), (-1.2, 1.78, UZ + 0.6), s.woodU, 0.02)
            B('pillow', (0.55, 0.32, 0.12), (-1.2, 1.5, UZ + 0.6), s.white, 0.05); B('blank', (1.02, 1.0, 0.1), (-1.2, 0.35, UZ + 0.6), s.teal, 0.04)
            B('ns', (0.4, 0.4, 0.45), (-0.3, 1.55, UZ + 0.25), s.woodU, 0.015); L.cyl('lampB', 0.05, 0.18, (-0.3, 1.62, UZ + 0.55), M('lampb', '#3a3a44', 0.4)); sph('lampSh', 0.1, (-0.3, 1.62, UZ + 0.72), M('lampsh', '#ffe2b0', 0.5, emit='#ffcf88', es=0.15), (1, 1, 0.8))
            B('ward', (0.6, 0.5, 1.8), (1.5, 1.5, UZ + 0.95), s.woodU, 0.02); B('rugU', (1.2, 1.0, 0.012), (0.4, 0.3, UZ + 0.06), M('rugU', '#7fa9d8', 0.95), 0.003)
            s.rest = dict(pos=lambda u: (-1.2, L.lerp(0.42, 0.95, u), UZ + L.lerp(0.64, 0.62, u)), lean=(-1.42, -0.42), tilt=0.0)
        else:
            sph('sun', 0.22, (1.35, 1.75, UZ + 1.95), M('sun', '#ffe08a', 0.3, emit='#ffd45a', es=6.0)); B('sea', (3.9, 0.02, 0.5), (0, 1.755, UZ + 0.6), M('sea', '#2f86d6', 0.2, emit='#2f86d6', es=0.3), 0)
            for i, (cx_, cz) in enumerate(((-0.9, 2.2), (0.2, 2.0), (-0.3, 2.3))): sph('cloud%d' % i, 0.22, (cx_, 1.74, UZ + cz), M('cloud', '#ffffff', 0.9), (1.8, 0.4, 0.8))
            L.cyl('palmT', 0.055, 1.7, (1.55, 1.3, UZ + 0.85), M('palmT', '#8a6a44', 0.8), (0.12, 0, 0.1))
            for i in range(5): B('leaf%d' % i, (0.6, 0.18, 0.02), (1.55 + 0.25 * math.cos(i * 1.256), 1.3 + 0.25 * math.sin(i * 1.256), UZ + 1.72), M('leaf', '#3d9a4f', 0.7), 0.005, rot=(0, 0.35 * (1 if i % 2 else -1), i * 1.256))
            B('chairB', (0.55, 0.95, 0.05), (-1.0, 0.8, UZ + 0.3), M('chairM', '#e8603c', 0.7), 0.01, rot=(-0.35, 0, 0)); B('chairS', (0.55, 0.35, 0.05), (-1.0, 0.1, UZ + 0.2), M('chairM2', '#f2f2f2', 0.7), 0.01)
            L.cyl('tbl', 0.28, 0.03, (-0.2, 1.3, UZ + 0.46), M('tblM', '#f4f4f0', 0.4)); L.cyl('tblP', 0.03, 0.42, (-0.2, 1.3, UZ + 0.24), s.steel, verts=12)
            L.cyl('umbP', 0.015, 1.5, (0.5, 0.7, UZ + 0.8), s.steel, verts=10); bpy.ops.mesh.primitive_cone_add(radius1=0.75, radius2=0.02, depth=0.3, location=(0.5, 0.7, UZ + 1.6)); um = bpy.context.active_object; um.data.materials.append(M('umb', '#d33a2c', 0.7))
            s.phU_pos = (-0.2, 1.3, UZ + 0.488)
            s.rest = dict(pos=lambda u: (-1.0, L.lerp(0.35, 0.5, u), UZ + L.lerp(0.5, 0.05, u)), lean=(-1.05, -0.08), tilt=0.0)
        # ---- phones, figures
        def phone(name, parent=None, loc=(0, 0, 0), rot=(0, 0, 0)):
            p = L.empty(name, loc, parent); p.rotation_euler = rot; B(name + 'b', (0.1, 0.2, 0.012), (0, 0, 0), M(name + 'bm', '#111111', 0.3), 0.01, parent=p)
            sm = M(name + 's', '#9fd0ff', 0.2, emit='#9fd0ff', es=0.0); B(name + 'sc', (0.088, 0.18, 0.002), (0, 0, 0.007), sm, 0, parent=p); return p, sm.node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
        s.phU, s.phUes = phone('phU', None, s.phU_pos, (0, 0, 0.4)); s.LL = L.Fig('ll', '#3a6ea8', '#4a3b30', (-1.2, 0.5, UZ + 0.62)); s.TN = L.Fig('tn', '#d9734e', '#3a2418', (-0.2, 0.2, 0.05))
        s.phL, s.phLes = phone('phL', s.LL.hands[1], (0, -0.03, -0.02), (math.pi / 2, 0, 0)); s.phT, s.phTes = phone('phT', s.TN.hands[1], (0, -0.03, -0.02), (math.pi / 2, 0, 0))
        if not night:
            s.shades = B('shades', (0.32, 0.05, 0.08), (0, -0.17, 0.2), M('shades', '#101010', 0.15), 0.02, parent=s.LL.head)
            s.drink = L.empty('drink', (0, -0.04, -0.04), s.LL.hands[0]); sph('glass', 0.05, (0, 0, 0.02), M('glass', '#ffb347', 0.2, emit='#ff9a2a', es=0.4), (1, 1, 1.3), s.drink); L.cyl('straw', 0.006, 0.12, (0.02, 0, 0.1), M('straw', '#ffffff', 0.5), (0, 0.3, 0)); s.cx.key(s.shades, s.drink)
        # ---- mascot, van, orbs
        mas = s.mas = L.empty('mas', (0, 0, -9)); mm = M('masM', '#1d4734', 0.22, emit='#2fb06a', es=0.9); mg = M('masG', '#ffd27a', 0.2, emit='#ffcf6a', es=8.0)
        sph('masB', 0.17, (0, 0, 0), mm, (1, 1, 1), mas); s.meyes = [sph('masE%d' % i, 0.03, (x, -0.155, 0.04), mg, (1, 0.5, 1.2), mas) for i, x in enumerate((-0.06, 0.06))]
        s.mring = L.torus('masR', 0.25, 0.018, (0, 0, 0), mg, (1.0, 0, 0), mas); s.mlight = L.point('masL', (0, 0, 0), 0, '#ffd27a', 0.1); s.mlight.parent = mas
        van = s.van = L.empty('van', (6.5, -2.75, 0.0)); vy = M('vanY', {'yellow': '#f2c230', 'blue': '#2f6fd0', 'red': '#d33a2c', 'green': '#2f8a5a', 'orange': '#f08a24', 'white': '#eceff2', 'purple': '#7a4fd0'}.get(vcol, vcol), 0.45); vk = M('vanK', '#141414', 0.5); s.wheels = []
        B('vb', (0.95, 0.45, 0.4), (0.12, 0, 0.36), vy, 0.04, parent=van); B('vc', (0.34, 0.43, 0.3), (-0.52, 0, 0.31), vy, 0.04, parent=van); B('vw', (0.2, 0.02, 0.15), (-0.52, -0.215, 0.38), M('vwin', '#2a3a55', 0.1), 0.01, parent=van)
        B('vs', (0.9, 0.02, 0.07), (0.12, -0.226, 0.3), M('vstr', '#d33a2c', 0.5), 0.005, parent=van); s.vl = M('vlight', '#ff9a1a', 0.3, emit='#ff9a1a', es=0.0); B('vlb', (0.22, 0.07, 0.05), (-0.45, 0, 0.6), s.vl, 0.01, parent=van)
        B('vh', (0.03, 0.3, 0.06), (-0.7, 0, 0.24), M('vhead', '#fff4c0', 0.2, emit='#fff4c0', es=6.0), 0, parent=van)
        for wx in (-0.5, 0.45):
            for wy in (-0.21, 0.21): s.wheels.append(L.cyl('wh', 0.1, 0.07, (wx, wy, 0.1), vk, (math.pi / 2, 0, 0), 24, parent=van))
        gold = M('vpg', '#e6b422', 0.25, 1.0); em = lambda c, e: M('vpe', c, 0.3, emit=c, es=e)
        if vprop == 'bolt':
            for i, (dx, dz, r) in enumerate(((0.05, 0.74, 0.5), (0.0, 0.66, -0.5), (0.05, 0.58, 0.5))): B('pb%d' % i, (0.04, 0.03, 0.14), (dx, 0, dz), em('#ffe14a', 4.0), 0.005, rot=(0, r, 0), parent=van)
        elif vprop == 'key': L.torus('pk', 0.07, 0.018, (0.1, 0, 0.8), gold, (math.pi / 2, 0, 0), van); B('pk2', (0.22, 0.03, 0.03), (0.28, 0, 0.8), gold, 0.005, parent=van); B('pk3', (0.03, 0.03, 0.07), (0.34, 0, 0.75), gold, 0.003, parent=van)
        elif vprop == 'wrench': L.cyl('pw', 0.018, 0.34, (0.1, 0, 0.78), M('pws', '#c9ced6', 0.3, 1.0), (0, math.pi / 2, 0), 10, parent=van); L.torus('pw2', 0.05, 0.016, (-0.08, 0, 0.78), M('pws', '#c9ced6', 0.3, 1.0), (math.pi / 2, 0, 0), van)
        elif vprop == 'flame': bpy.ops.mesh.primitive_cone_add(radius1=0.1, radius2=0.0, depth=0.3, location=(0.1, 0, 0.8)); fo = bpy.context.active_object; fo.parent = van; fo.data.materials.append(em('#ff7a1a', 5.0))
        elif vprop == 'drop': sph('pd', 0.09, (0.1, 0, 0.72), em('#5ab4ff', 3.0), (1, 0.6, 1.1), van); bpy.ops.mesh.primitive_cone_add(radius1=0.06, radius2=0.0, depth=0.14, location=(0.1, 0, 0.86)); do = bpy.context.active_object; do.parent = van; do.data.materials.append(em('#5ab4ff', 3.0))
        s.vanA = L.empty('vanA', (0, 0, 0.85), van)
        orbM = M('orb', '#ffd27a', 0.2, emit='#ffcf6a', es=12.0); s.orbs = [sph('orb%d' % i, 0.05 - 0.01 * i, (0, 0, -9), orbM) for i in range(4)]
        s.rings = [L.torus('ring%d' % i, 0.1, 0.006, s.phU_pos, M('ringM', '#9fd0ff', 0.2, emit='#9fd0ff', es=2.2)) for i in range(3)]
        # ---- lights
        if night: s.kU = A('kU', (0, -3, UZ + 2.6), (-0.3, 1, UZ + 0.5), 2.4, 260, '#9fb4ff', 'RECTANGLE', 1.6); s.moonL = A('moonL', (1.2, 0.9, UZ + 1.9), (-0.8, 1.2, UZ + 0.6), 1.2, 180, '#7f9be8', 'RECTANGLE', 1.6)
        else: s.kU = A('kU', (0.6, -3, UZ + 2.8), (-0.3, 1, UZ + 0.5), 3.0, 520, '#fff0d0', 'RECTANGLE', 2.0); s.moonL = A('moonL', (1.4, 0.0, UZ + 2.0), (-0.6, 1.2, UZ + 0.4), 1.5, 260, '#ffe9b0', 'RECTANGLE', 1.5)
        s.kL = A('kL', (0.2, -3, 2.3), (0.2, 1, 0.6), 2.6, 260, '#7aa2ff', 'RECTANGLE', 1.6); s.fl = A('fill', (0, -8, 3), (0, 1, 2.8), 6.0, 300 if night else 420, '#c9d6ff', 'RECTANGLE', 7.0)
        s.street = A('street', (3, -5, 1.2), (0, -2.7, 0.2), 2.0, 160, '#9fb4ff', 'RECTANGLE', 1.0); s.phoneL = L.point('phoneL', (-0.3, 1.4, UZ + 0.7), 0, '#9fd0ff', 0.05)
        s.vlL = L.point('vlL', (0, 0, 0), 0, '#ff9a1a', 0.1); s.vlL.parent = van; s.vlL.location = (-0.45, 0, 0.7)
        s.lights = [s.kU, s.kL, s.fl, s.moonL, s.street, s.phoneL, s.vlL, s.mlight]
        s.cam = L.camera(sc, 34); s.bs = lambda m: m.node_tree.nodes['Principled BSDF'].inputs
    def living(s, radiator=False):
        L, M, B, sph = s.L, s.M, s.B, s.sph; sofaM = M('sofa', s.kw.get('sofa') or '#2f5a44', 0.85)
        L.cyl('rug', 0.8, 0.012, (-0.2, 0.3, 0.055), M('rug', '#d9b48a', 0.95)); L.cyl('rug2', 0.55, 0.014, (-0.2, 0.3, 0.056), M('rug2', s.kw.get('rug') or '#b5533c', 0.95))
        B('sofa', (1.15, 0.65, 0.32), (-1.3, 1.3, 0.21), sofaM, 0.04); B('sofab', (1.15, 0.16, 0.5), (-1.3, 1.62, 0.5), sofaM, 0.05); B('sofal', (0.14, 0.65, 0.5), (-1.84, 1.3, 0.33), sofaM, 0.04); B('sofar', (0.14, 0.65, 0.5), (-0.76, 1.3, 0.33), sofaM, 0.04)
        B('cush', (0.3, 0.12, 0.3), (-1.0, 1.45, 0.55), M('cush', '#e09b6b', 0.8), 0.05, rot=(0.2, 0, 0.3)); B('table', (0.55, 0.4, 0.16), (-0.3, 0.55, 0.13), M('tbl', '#c9a27a', 0.5), 0.015)
        for i, (px, pz, c) in enumerate(((-1.4, 1.9, '#e09b6b'), (-0.8, 1.7, '#7fa9d8'), (-1.1, 1.45, '#5aa84a'))): B('pic%d' % i, (0.3, 0.02, 0.38), (px, 1.76, pz), M('pc%d' % i, c, 0.6), 0.01); B('pf%d' % i, (0.34, 0.015, 0.42), (px, 1.768, pz), M('pfr', '#2b2b2b', 0.5), 0.005)
        lampM = M('lampM', '#ffe2b0', 0.4, emit='#ffcf88', es=1.2); pendM = M('pendM', '#ffe9c4', 0.4, emit='#ffd9a0', es=1.4); s.lamp_socks = [lampM.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'], pendM.node_tree.nodes['Principled BSDF'].inputs['Emission Strength']]
        L.cyl('lampP', 0.012, 1.1, (-1.75, 0.45, 0.6), s.steel, verts=12); sph('lampS', 0.16, (-1.75, 0.45, 1.2), lampM, (1, 1, 0.8))
        L.cyl('cord', 0.005, 0.5, (-0.3, 0.3, 2.35), s.steel, verts=8); sph('pend', 0.13, (-0.3, 0.3, 2.05), pendM, (1, 1, 0.8))
        s.llights = []
        for nm, loc, en, col in (('lampL', (-1.75, 0.45, 1.15), 40, '#ffcf88'), ('pendL', (-0.3, 0.3, 1.95), 25, '#ffd9a0')):
            lt = L.point(nm, loc, en, col, 0.12); lt.data.use_shadow = False; lt.data.keyframe_insert('energy', frame=0) if False else None; s.llights.append((lt, en)); s.cx.prop(lt.data, 'energy')
        for q in s.lamp_socks: s.cx.prop(q, 'default_value')
    # ---- topic hooks -------------------------------------------------------------------------------------------------
    def finish(s, spot, spot_yaw, reach, focus, anchors, act, shiver=1.0, tenant_pos=(-0.2, 0.2), spot_z=0.05, work_lean=0.12, dark=None, opener='phone'):
        """spot: tenant (x,y) while working; reach: arm raise while working; focus: camera pose ((loc),(tgt),fov) for the topic close-up; act(t, ph): topic prop animation"""
        L, K, T, cx, UZ, sc = s.L, s.K, s.T, s.cx, s.UZ, s.sc; lerp, seg, eio, eout, sp = L.lerp, L.seg, L.eio, L.eout, L.spring; LL, TN, bs, night = s.LL, s.TN, s.bs, s.mode == 'night'
        n_, w_, tu, an, ca, s1, s2, fx, sl, sv = [K[x] for x in ('night', 'write', 'turn', 'ans', 'cause', 'step1', 'step2', 'fix', 'sleep', 'save')]
        for lt in (s.kU, s.kL, s.fl, s.moonL, s.street, s.phoneL, s.vlL, s.mlight): cx.prop(lt.data, 'energy'); cx.prop(lt.data, 'color')
        for lt in (s.fl, s.street, s.phoneL, s.vlL, s.mlight): lt.data.use_shadow = False
        for q in (s.phUes, s.phLes, s.phTes, s.bs(s.vl)['Emission Strength']): cx.prop(q, 'default_value')
        cam = s.cam; cx.key(cam); cx.prop(cam.data, 'lens'); cx.prop(cam.data.dof, 'focus_distance'); cx.prop(cam.data.dof, 'aperture_fstop')
        cx.key(*LL.objs(), *TN.objs(), s.phU, s.phL, s.phT, *s.orbs, *s.rings, s.mas, s.mring, *s.meyes, s.van, *s.wheels)
        cx.anch.update(dict(anchors, ll=LL.head, tn=TN.head, van=s.vanA, mas=s.mas))
        WIDE = ((0, -12.4, 2.65), (0, 0.4, 2.55), 34); UP = ((-0.45, -5.6, 4.1), (-0.65, 1.0, 3.8), 31); LO = ((0.45, -5.8, 1.5), (0.0, 0.9, 1.1), 30); MID = ((0.4, -7.5, 1.7), (0.0, 0.9, 1.45), 31); UP2 = ((-0.9, -4.6, 4.0), (-0.8, 1.2, 3.6), 30)
        px, py, pz = s.phU_pos; OPEN = ((px - 0.1, py - 0.67, pz + 0.14), (px, py, pz + 0.02), 21); P = lambda t, p: (t, p[0], p[1], p[2])
        LF = ((0.1, 0.8, UZ + 1.0), (-1.2, 1.5, UZ + 0.74), 34) if night else ((-0.5, -1.5, UZ + 1.6), (-1.0, 0.4, UZ + 1.2), 30)
        OPN = {'phone': (OPEN, OPEN, 0.5, 1.2), 'hero': (focus, focus, 0.7, 1.3), 'face': (((-0.2, -1.9, 1.3), (-0.2, 0.2, 1.2), 38), ((-0.2, -1.9, 1.3), (-0.2, 0.2, 1.2), 38), 0.7, 1.3),
               'wide': (((1.1, -13.4, 3.15), (0, 0.4, 2.55), 32), ((0.5, -11.2, 2.9), (0, 0.5, 2.55), 34), 0.2, 1.4), 'landlord': (LF, LF, 1.0, 1.7)}
        O0, O1, oh, ol = OPN[opener]
        camf = L.track([P(0, O0), P(n_ + oh, O1), P(n_ + ol, UP), P(w_ - 0.1, UP), P(w_ + 0.5, LO), P(tu - 0.3, LO), P(tu + 0.6, WIDE), P(ca - 0.3, WIDE), P(ca + 0.5, focus), P(s2 + 0.9, focus), P(fx + 0.1, MID), P(sl - 0.3, MID), P(sl + 0.7, UP2), P(sv + 0.1, UP2), P(sv + 0.9, WIDE), P(T + 1, WIDE)])
        LP, TP, RP = (-0.9, 0.9, UZ + 1.0), (-0.1, 0.0, 1.55), (focus[1][0] + 0.7, focus[1][1] - 0.4, focus[1][2] + 0.5)
        mf = L.track([(0, (0, 0, -9), (0, 0, -9), 0), (tu - 0.01, LP, LP, 0), (tu + 0.35, LP, LP, 1), (tu + 1.0, (-1.0, 1.1, 2.4), (0, 0, 0), 1), (an, TP, TP, 1), (ca - 0.1, TP, TP, 1), (ca + 0.5, RP, RP, 1), (fx - 0.2, RP, RP, 1),
                      (fx + 0.5, (0.55, 0.8, 2.0), (0, 0, 0), 1), (sl - 0.4, (0.0, 0.6, 2.4), (0, 0, 0), 1), (sl + 0.6, (-0.9, 1.1, UZ + 1.55), (0, 0, 0), 1), (T + 1, (-0.9, 1.1, UZ + 1.55), (0, 0, 0), 1)])
        sp_ = lambda t, a, b: eio(seg(t, a, b - a)); kicks = [n_ + 0.1, tu, s1, fx, sv]; rest = s.rest; mode = s.mode
        def upd(t):
            loc, tg, fov = camf(t); L.aim(cam, loc, tg, fov, t, 0.8, 2.8 if loc[1] < -9 else 1.6, kick=L.punch(t, kicks), roll=0.025 * math.sin(t * 0.7))
            # landlord: rests, phone buzzes, panics, is answered for, relaxes again
            wake = sp_(t, n_ + 0.6, n_ + 1.4); back = sp_(t, sl - 0.8, sl + 0.4); sit = wake * (1 - back); relief = sp_(t, an + 0.8, an + 1.6)
            LL.pose(pos=rest['pos'](sit), lean=lerp(rest['lean'][0], rest['lean'][1], sit), nod=0.18 * sit, armR=1.45 * sp_(t, n_ + 1.0, n_ + 1.6) * (1 - sp_(t, an + 1.0, an + 1.5)), armL=0.2 * sit if night else 0.9 * (1 - sit) + 0.2 * sit,
                    blink=(1.0 - sit) if (wake < 1 or back > 0) else L.blink(t), smile=0.1 + 0.8 * relief * (1 - back * 0.5), wide=0.4 * sit * (1 - relief), o=0.7 * sit * (1 - relief) * (1 if t < tu else 0), brow=0.55 * sit * (1 - relief) - 0.3 * relief, browY=0.01 * sit)
            buz = (1.0 if n_ + 0.1 < t < n_ + 1.3 else 0.0) * (0.5 + 0.5 * math.sin(t * 60)); hold = sp_(t, n_ + 1.4, n_ + 1.7) * (1 - sp_(t, an + 1.0, an + 1.3))
            s.phU.scale = (1, 1, 1) if hold < 0.5 else (0.001,) * 3; s.phL.scale = (1, 1, 1) if hold >= 0.5 else (0.001,) * 3; s.phU.location = (px + 0.006 * math.sin(t * 90) * buz, py, pz); s.phU.rotation_euler = (0, 0, 0.4 + 0.05 * math.sin(t * 70) * buz)
            s.phUes.default_value = 1.1 * (buz * 0.9 + 0.1 * (1 - hold) * (1.0 if t > n_ else 0.0)); s.phLes.default_value = 6.0; s.phoneL.data.energy = 6 * buz + 25 * hold; s.phoneL.data.color = (0.62, 0.82, 1.0)
            if not night:
                s.shades.scale = (1, 1, 1) if (sit < 0.3 or back > 0.5) else (0.001,) * 3; s.drink.scale = (1, 1, 1) if (t < n_ + 1.0 or back > 0.3) else (0.001,) * 3
            for i, r in enumerate(s.rings):
                u = ((t - n_ - 0.1 - i * 0.28) % 0.84) / 0.84; on = 1 if n_ + 0.1 < t < n_ + 1.3 else 0; r.scale = (0.2 + 3.0 * u,) * 3 if on else (0.001,) * 3; r.location = (px, py, pz + 0.02)
            # tenant: problem (shivers/annoyed), texts, walks to the spot, works, cheers
            walk = sp_(t, ca - 0.3, ca + 0.7); pos = (lerp(tenant_pos[0], spot[0], walk), lerp(tenant_pos[1], spot[1], walk), lerp(0.05, spot_z, walk))
            phn = sp(t, w_ - 0.7, 2.2, 0.4) * (1 - sp_(t, an + 1.0, an + 1.4)); s.phT.scale = (1, 1, 1) if phn > 0.05 else (0.001,) * 3
            bad = 1 - sp_(t, fx, fx + 0.8); sh = 0.02 * math.sin(t * 38) * bad * shiver; work = sp_(t, s1 - 0.5, s1 + 0.1) * (1 - sp_(t, s2 + 0.9, s2 + 1.3)); twist = math.sin(t * 9) * 0.18 * (1 if s1 + 0.1 < t < s2 + 0.9 else 0)
            joy = sp(t, fx + 0.2, 2.4, 0.35) * (1 - sp_(t, sl + 0.2, sl + 0.8))
            yawT = lerp(lerp(0.9, 0.0, sp_(t, w_ - 1.0, w_ - 0.4)), 0.9, sp_(t, an + 1.0, an + 1.5)); yawT = lerp(yawT, spot_yaw, walk); yawT = lerp(yawT, 0.0, sp_(t, fx + 0.6, fx + 1.2) * (1 if walk > 0.99 else 0))
            TN.pose(pos=pos, yaw=yawT + sh, lean=0.06 * bad - 0.1 * joy + work_lean * work, roll=sh, nod=0.2 * phn, armR=(0.4 + 2.4 * joy) if joy > 0.02 else (0.25 + 1.1 * phn + 0.9 * bad * (1 - phn) * (1 - work) * shiver),
                    armL=(0.4 + 2.4 * joy) if joy > 0.02 else (0.2 + reach * work + 0.9 * bad * (1 - work) * shiver), armLz=twist, blink=L.blink(t, 1.3), smile=0.05 + 0.9 * (1 if joy > 0.1 else 0), wide=0.25 * bad, o=0.3 * bad * (1 - phn), brow=-0.45 * bad + 0.1 * joy)
            # message orbs, mascot, van
            def orbpos(o, i, t0, a, b):
                u = (t - t0 - i * 0.07) / 0.55
                if 0 < u < 1: e = eio(u); o.location = (lerp(a[0], b[0], e), lerp(a[1], b[1], e) - 0.5 * math.sin(math.pi * e), lerp(a[2], b[2], e)); o.scale = (1,) * 3
                else: o.location = (0, 0, -9)
            for i, o in enumerate(s.orbs): orbpos(o, i, w_ + 0.1, (-0.2, 0.2, 1.0), (-0.9, 0.9, UZ + 0.9)) if t < an else orbpos(o, i, an + 0.2, (-0.9, 0.9, UZ + 0.9), (-0.2, 0.2, 1.0))
            p_, _, sc_ = mf(t); s.mas.location = (p_[0], p_[1], p_[2] + 0.05 * math.sin(t * 5.0) if p_[2] > -5 else p_[2])
            s.mas.scale = (max(0.001, sc_ * sp(t, tu, 2.2, 0.3)),) * 3 if tu <= t < tu + 0.6 else (max(0.001, sc_),) * 3
            s.mring.rotation_euler = (1.0 + 0.3 * math.sin(t * 2), t * 3.0, 0); s.mlight.data.energy = 35 * (1 if t > tu else 0); s.mlight.data.color = (1.0, 0.82, 0.48)
            for e in s.meyes: e.scale = (1, 0.5, max(0.15, 1.2 * (1 - L.blink(t, 0.7))))
            vin = eout(seg(t, w_ + 0.15, tu + 0.5 - w_ - 0.15), 2.2); vout = eio(seg(t, an + 0.6, 1.5)); x = lerp(6.5, 0.9, vin) + 5.6 * vout
            s.van.location = (x if t > w_ + 0.1 else 8.0, -2.75, 0.0); s.van.rotation_euler = (0.0, 0.05 * seg(t, tu + 0.3, 0.3) * (1 - seg(t, tu + 0.6, 0.4)) - 0.04 * (vin < 0.98) * (1 - vin), math.pi * sp_(t, an + 0.5, an + 1.0))
            for w_o in s.wheels: w_o.rotation_euler = (math.pi / 2 + x * 10.0, 0, 0)
            bl = 0.5 + 0.5 * math.sin(t * 22); on = 1 if w_ + 0.1 < t < an + 1.5 else 0; bs(s.vl)['Emission Strength'].default_value = 8.0 * bl * on; s.vlL.data.energy = 120 * bl * on
            h = sp_(t, fx - 0.1, fx + 1.3); ph_all = dict(walk=walk, work=work, twist=twist, fix=h, joy=joy, bad=bad, s1=s1, s2=s2, fx=fx, ca=ca, n=n_); act(t, ph_all)
            s.kL.data.color = (lerp(0.48, 1.0, h), lerp(0.63, 0.78, h), lerp(1.0, 0.55, h)) if night else (1.0, 0.93, 0.8); s.kL.data.energy = lerp(260, 340, h) if night else 420
            if dark:
                f = dark(t, ph_all); s.kL.data.energy *= f; s.fl.data.energy *= (0.08 + 0.92 * f); s.street.data.energy *= (0.3 + 0.7 * f); s.mlight.data.energy *= (0.5 + 0.5 * f); s.kL.data.color = (0.5, 0.6, 1.0) if f < 0.5 else s.kL.data.color
                for lt, base in getattr(s, 'llights', []): lt.data.energy = base * f
                for q, base in zip(getattr(s, 'lamp_socks', []), (1.2, 1.4)): q.default_value = base * f
            s.kU.data.energy = (lerp(260, 200, sit) if night else 520); s.moonL.data.energy = 180 if night else 260; s.fl.data.energy = (300 if night else 420) * ((0.08 + 0.92 * dark(t, ph_all)) if dark else 1); s.street.data.energy = 160 * ((0.3 + 0.7 * dark(t, ph_all)) if dark else 1)
        return upd, cx
