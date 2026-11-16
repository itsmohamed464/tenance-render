# Vermieter-Buero: calm daylight desk diorama for the Sie-form admin topics (Nebenkosten, Anlage V, Mieteingang, Indexmiete).
# One shared room; `topic` picks the hero props. Problem (paper chaos, red cell, leaking coins) until the cue 'turn' ("Tenance"),
# the Tenance orb flies in, tidies everything, the landlord leans back. All motion is a pure function of t.
import bpy, math

def build(L, K, T, lang, topic='neben'):
    STY = {'neben': ('calendar', '#9dbca9'), 'anlagev': ('rows', '#d9c7a3'), 'miete': ('rows', '#a9bfd6'), 'index': ('bars', '#cdb694')}; style, wcol = STY[topic]
    sc = bpy.context.scene; cx = L.Ctx(sc); M, B, sph = L.mat, L.box, L.sph; lerp, seg, eio, eout, sp = L.lerp, L.seg, L.eio, L.eout, L.spring
    kk = lambda n, d: K.get(n, d); turn, ans, step1, step2, fix, sleep_, save = kk('turn', 3.9), kk('ans', 4.9), kk('step1', 7.0), kk('step2', 8.2), kk('fix', 9.4), kk('sleep', 10.5), kk('save', 11.9)
    L.world(sc, '#dfeaff', 1.0)
    wall, trim, wood, woodD = M('wall', wcol, 0.9), M('trim', '#faf6ee', 0.5), M('wood', '#b58a5c', 0.5), M('woodD', '#7d5e3c', 0.5)
    green, gold, steel, dark = M('green', '#1f5a42', 0.55), M('gold', '#e6b422', 0.25, 1.0), M('steel', '#cfd6dd', 0.25, 1.0), M('dark', '#1b1f27', 0.4)
    paperM, red = M('paper', '#fbf8ef', 0.85), M('red', '#d33a2c', 0.5, emit='#d33a2c', es=0.4)
    B('floor', (7, 5, 0.1), (0, 0.4, -0.05), wood, 0.004); B('bw', (7, 0.15, 3.4), (0, 2.1, 1.7), wall); B('lw', (0.15, 5, 3.4), (-2.7, 0.4, 1.7), wall); B('skirt', (7, 0.03, 0.12), (0, 2.01, 0.06), trim, 0.004)
    B('win', (1.25, 0.02, 1.45), (1.25, 2.01, 1.9), M('winM', '#cfe6ff', 0.1, emit='#cfe6ff', es=2.6), 0)
    for dx in (-0.65, 0.0, 0.65): B('winf', (0.05, 0.04, 1.5), (1.25 + dx, 2.0, 1.9), trim, 0.004)
    for dz in (-0.72, 0.0, 0.72): B('wing', (1.35, 0.04, 0.05), (1.25, 2.0, 1.9 + dz), trim, 0.004)
    # shelf with folders (left wall), plant
    B('shelf', (1.2, 0.3, 0.05), (-1.3, 1.9, 1.5), woodD, 0.01)
    for i, c in enumerate(('#1f5a42', '#e6b422', '#7fa9d8', '#b5533c', '#1f5a42', '#d9b48a')): B('fold%d' % i, (0.09, 0.22, 0.32), (-1.75 + i * 0.12, 1.9, 1.7), M('fc%d' % i, c, 0.6), 0.008)
    L.cyl('pot', 0.1, 0.18, (-0.85, 1.9, 1.62), M('pot', '#b5533c', 0.7)); [sph('leaf%d' % i, 0.09, (-0.85 + 0.07 * math.cos(i * 2.1), 1.9 + 0.07 * math.sin(i * 2.1), 1.84 + 0.05 * i), M('leaf', '#3d9a4f', 0.7), (1, 1, 1.4)) for i in range(3)]
    # desk + chair
    B('desk', (2.0, 0.9, 0.06), (0.2, 1.4, 0.76), woodD, 0.01)
    for sx in (-1, 1):
        for sy in (-1, 1): B('dl', (0.06, 0.06, 0.74), (0.2 + sx * 0.93, 1.4 + sy * 0.4, 0.37), woodD, 0.006)
    B('seat', (0.55, 0.55, 0.07), (-0.45, 1.4, 0.45), green, 0.02); B('sback', (0.08, 0.55, 0.6), (-0.72, 1.4, 0.8), green, 0.02); L.cyl('sleg', 0.04, 0.4, (-0.45, 1.4, 0.22), steel)
    # laptop (screen faces the camera)
    B('lapb', (0.75, 0.5, 0.03), (0.2, 1.35, 0.805), steel, 0.01); hinge = L.empty('hinge', (0.2, 1.57, 0.82)); hinge.rotation_euler = (-0.08, 0, 0)
    B('lid', (0.75, 0.03, 0.5), (0, 0, 0.25), dark, 0.01, parent=hinge); scr = M('scr', '#f4f7fb', 0.3, emit='#f4f7fb', es=0.9); B('scrn', (0.69, 0.004, 0.44), (0, -0.0175, 0.25), scr, 0, parent=hinge)
    errM = M('err', '#d33a2c', 0.3, emit='#d33a2c', es=2.0); bsd = lambda m: m.node_tree.nodes['Principled BSDF'].inputs
    cells = []
    for r in range(6):
        for c in range(4):
            if (r, c) == (3, 2): continue
            col = '#cfd8e6' if r else '#1f5a42'; cells.append(B('cell', (0.15, 0.003, 0.05), (-0.255 + c * 0.17, -0.0205, 0.43 - r * 0.065), M('cl%d' % (r == 0), col, 0.5, emit=col, es=0.35), 0, parent=hinge))
    err = B('errc', (0.15, 0.004, 0.05), (-0.255 + 2 * 0.17, -0.0215, 0.43 - 3 * 0.065), errM, 0, parent=hinge)
    for q in (bsd(errM)['Base Color'], bsd(errM)['Emission Color'], bsd(errM)['Emission Strength']): cx.prop(q, 'default_value')
    # tray + jar (the tidy endpoint)
    B('tray', (0.46, 0.34, 0.05), (0.75, 1.3, 0.82), M('tray', '#1f5a42', 0.5), 0.012); L.cyl('jar', 0.09, 0.15, (0.55, 1.0, 0.87), M('jarM', '#2f6b55', 0.4)); stack = L.cyl('jarcoins', 0.07, 0.24, (0.55, 1.0, 0.95), gold, verts=24)
    # wall calendar (topic prop); red ring = the missed deadline
    cal = L.empty('cal', (0.2, 1.99, 1.95)); B('calb', (0.78, 0.04, 0.95), (0, 0, 0), paperM, 0.01, parent=cal); B('calh', (0.78, 0.05, 0.2), (0, -0.005, 0.37), red if topic != 'miete' else green, 0.01, parent=cal)
    rows, bars = [], []
    if style == 'calendar':
        for r in range(4):
            for c in range(5): B('cd', (0.1, 0.008, 0.08), (-0.28 + c * 0.14, -0.025, 0.14 - r * 0.14), M('cdm', '#d8dde6', 0.6), 0, parent=cal)
    elif style == 'rows':
        for r in range(6):
            B('rb', (0.4, 0.012, 0.045), (0.07, -0.025, 0.25 - r * 0.13), M('rbm', '#cfd6e2', 0.6), 0, parent=cal)
            rd = B('rr', (0.08, 0.014, 0.08), (-0.28, -0.03, 0.25 - r * 0.13), M('rrm', '#d33a2c', 0.5, emit='#d33a2c', es=1.0), 0.01, parent=cal)
            rg = B('rg', (0.08, 0.014, 0.08), (-0.28, -0.032, 0.25 - r * 0.13), M('rgm', '#2fb06a', 0.5, emit='#2fb06a', es=1.0), 0.01, parent=cal); rows.append((rd, rg))
    else:
        for i in range(5): bars.append(B('bar', (0.1, 0.02, 0.5), (-0.28 + i * 0.14, -0.03, -0.2), M('barm', '#e6b422' if i > 1 else '#cfd6e2', 0.5), 0.008, parent=cal))
    ring = L.torus('ring', 0.1, 0.012, (0.0, -0.03, -0.14), red, (math.pi / 2, 0, 0), cal)
    c1 = B('ck1', (0.09, 0.012, 0.03), (-0.04, -0.035, -0.17), M('ok', '#2fb06a', 0.4, emit='#2fb06a', es=1.2), 0.004, rot=(0, -0.8, 0), parent=cal); c2 = B('ck2', (0.18, 0.012, 0.03), (0.04, -0.035, -0.12), M('ok2', '#2fb06a', 0.4, emit='#2fb06a', es=1.2), 0.004, rot=(0, 0.8, 0), parent=cal)
    # papers (chaos -> tidy stack in the tray)
    NP = 16; pap = []; rnd = lambda i, a: (math.sin(i * 12.9898 + a * 78.233) * 43758.5453) % 1.0
    ink, hdr = M('ink', '#4a5568', 0.6), [M('hdr0', '#d33a2c', 0.5), M('hdr1', '#1f5a42', 0.5), M('hdr2', '#e6b422', 0.5)]
    for i in range(NP):
        pp_ = L.empty('p%d' % i, (0, 0, -9)); pap.append(pp_); B('pb', (0.27, 0.35, 0.006), (0, 0, 0), M('paperY', '#f2dc9a', 0.8), 0.002, parent=pp_); B('ph', (0.23, 0.05, 0.004), (0, 0.13, 0.004), hdr[i % 3], 0.001, parent=pp_)
        for j in range(3): B('pl', (0.2 - 0.04 * (j == 2), 0.014, 0.004), (0, 0.04 - 0.07 * j, 0.004), ink, 0.001, parent=pp_)
    def pstart(i): return (-0.35 + 1.1 * rnd(i, 1), 1.0 + 0.4 * rnd(i, 2), 0.95 + 0.9 * rnd(i, 4)), (rnd(i, 3) - 0.5) * 3.0
    # coins leaking off the desk
    coins = [L.cyl('coin%d' % i, 0.055, 0.014, (0, 0, -9), gold, (math.pi / 2, 0, 0), 20) for i in range(9)]
    # tenance orb
    mas = L.empty('mas', (0, 0, -9)); mm = M('masM', '#1d4734', 0.22, emit='#2fb06a', es=0.9); mg = M('masG', '#ffd27a', 0.2, emit='#ffcf6a', es=8.0)
    sph('masB', 0.15, (0, 0, 0), mm, (1, 1, 1), mas); [sph('masE%d' % i, 0.027, (x, -0.135, 0.035), mg, (1, 0.5, 1.2), mas) for i, x in enumerate((-0.055, 0.055))]; mring = L.torus('masR', 0.22, 0.016, (0, 0, 0), mg, (1.0, 0, 0), mas)
    mlight = L.point('masL', (0, 0, 0), 0, '#ffd27a', 0.1); mlight.parent = mas
    # landlord (grey hair), seated left of the desk, looking at the screen
    LL = L.Fig('ll', '#3a6ea8', '#b9b9b9', (-0.45, 1.4, 0.28), 1.0)
    # lights + camera
    kU = L.area('kU', (0.5, -3.0, 3.0), (0.3, 1.4, 0.9), 3.4, 620, '#fff0d8', 'RECTANGLE', 2.2); fl = L.area('fill', (-2.5, -3.5, 2.0), (0, 1.5, 1.0), 5.0, 260, '#dbe6ff', 'RECTANGLE', 5.0)
    sun = L.point('sun', (2.2, 0.8, 2.4), 260, '#ffe9c4', 0.6); lamp = L.point('lampL', (0.2, 1.1, 1.3), 30, '#ffffff', 0.3); lamp.data.use_shadow = False
    cam = L.camera(sc, 34); cx.key(cam); cx.prop(cam.data, 'lens'); cx.prop(cam.data.dof, 'focus_distance'); cx.prop(cam.data.dof, 'aperture_fstop')
    cx.key(hinge, ring, c1, c2, *[o for r_ in rows for o in r_], *bars, stack, mas, mring, *pap, *coins, *LL.objs()); cx.prop(mlight.data, 'energy'); cx.prop(lamp.data, 'energy')
    a_f, a_f2, a_ll, a_van = L.empty('a_f', (0.2, 1.57, 1.45)), L.empty('a_f2', (0.2, 1.9, 2.5)), L.empty('a_ll', (0, 0, 0), LL.head), L.empty('a_van', (0.7, 0.6, 0.55))
    a_ll.location = (0, 0, 0.5); cx.anch.update(focus=a_f, focus2=a_f2, ll=a_ll, van=a_van)
    P = lambda t, loc, tgt, fov: (t, loc, tgt, fov); WIDE = ((0.3, -2.3, 1.45), (0.1, 1.4, 1.2), 41)
    camf = L.track([P(0, (0.3, -1.9, 1.4), (0.05, 1.4, 1.2), 42), P(max(1.0, turn - 1.2), (0.25, -1.3, 1.3), (0.1, 1.5, 1.1), 36), P(turn + 0.4, (0.25, -1.0, 1.25), (0.2, 1.5, 1.05), 31), P(step1, (0.5, -1.4, 1.3), (0.45, 1.4, 0.95), 35),
                    P(fix - 0.2, (0.4, -1.7, 1.35), (0.2, 1.4, 1.0), 38), P(fix + 0.9, WIDE[0], WIDE[1], WIDE[2]), P(save, (0.3, -2.4, 1.5), (0.05, 1.4, 1.2), 42), P(T + 1, (0.3, -2.2, 1.45), (0.05, 1.4, 1.2), 40)])
    def upd(t):
        hz, hs = eio(seg(t, fix - 0.1, 0.6)), 0.0  # hz: 0 chaos -> 1 tidy
        at_m = eio(seg(t, turn - 0.2, 0.9)); orb_out = eio(seg(t, fix + 0.9, 0.8))
        # orb: arcs in from top-right to the laptop, circles the papers, then hovers over the landlord
        if t < turn - 0.2: mas.location = (0, 0, -9); ms = 0.001
        else:
            ph = (t - turn + 0.2); ms = min(1.0, ph * 3.0); home = (0.35, 1.1, 1.5); tgt_l = (-0.1, 1.0, 1.6)
            p = lerp(0.0, 1.0, eout(seg(t, turn - 0.2, 0.8))); pos = [lerp(2.2, home[0], p), lerp(0.6, home[1], p), lerp(2.8, home[2], p)]
            if t > step1 - 0.2: sw = eio(seg(t, step1 - 0.2, 0.7)); pos = [lerp(home[0], 0.75 + 0.2 * math.sin(t * 5), sw), home[1] + 0.12 * math.cos(t * 5) * sw, home[2] - 0.15 * sw]
            if t > fix + 0.6: sw = eio(seg(t, fix + 0.6, 0.8)); pos = [lerp(0.75, tgt_l[0], sw), 1.1, lerp(1.4, tgt_l[2], sw)]
            mas.location = (pos[0], pos[1], pos[2] + 0.04 * math.sin(t * 3.0))
        mas.scale = (ms * (0.001 if t < turn - 0.2 else 1.0),) * 3; mring.rotation_euler = (1.0 + 0.5 * math.sin(t * 2), t * 3.0, 0); mlight.data.energy = 0 if t < turn - 0.2 else 90
        # papers: floating/scattered until step1, then fly into the tray one by one (stagger), finally a neat stack
        for i, pp in enumerate(pap):
            (x0, y0, z0), rz = pstart(i); fl_ = 0.06 * math.sin(t * 1.3 + i) if t < turn else 0.0
            u = eio(seg(t, step1 + i * 0.055, 0.7)); tx, ty, tz = 0.75 + 0.008 * math.sin(i * 3.1), 1.3 + 0.008 * math.cos(i * 2.3), 0.85 + 0.0075 * i
            arc = 0.35 * math.sin(math.pi * u)
            pp.location = (lerp(x0, tx, u), lerp(y0, ty, u), lerp(z0 + 0.04 * (i % 5) * (1 - u) + fl_, tz, u) + arc)
            pp.rotation_euler = (lerp(1.15 + 0.3 * math.sin(i + t * 0.8), 0.0, u), lerp(0.1 * math.cos(i * 1.7), 0, u), lerp(rz + 0.2 * math.sin(t * 0.9 + i) * (1 - u), 0.04 * math.sin(i), u))
        # coins: leak off the desk edge toward the camera until the orb takes over; they vanish into the jar at fix
        for i, c in enumerate(coins):
            u = (t * 0.7 + i / len(coins)) % 1.0; live = t < step1 + 0.2
            if live: c.location = (lerp(0.5, 0.45 + 0.4 * math.sin(i * 2.0), u), lerp(1.15, 0.45, u * u), lerp(0.9, 0.03, u * u) + 0.4 * math.sin(math.pi * u) * (1 - u)); c.rotation_euler = (math.pi / 2 + t * 5 + i, t * 3, i)
            else: c.location = (0, 0, -9)
        stack.scale = (1, 1, max(0.02, 0.15 + 0.85 * eio(seg(t, step2, 1.6)))); stack.location = (0.55, 1.0, 0.82 + 0.12 * max(0.02, 0.15 + 0.85 * eio(seg(t, step2, 1.6))))
        # screen cell: red blink -> green
        h = eio(seg(t, step2, 0.8)); blink = 0.5 + 0.5 * math.sin(t * 9.0); col = (lerp(0.83, 0.1, h), lerp(0.23, 0.7, h), lerp(0.17, 0.35, h), 1.0)
        bsd(errM)['Base Color'].default_value = col; bsd(errM)['Emission Color'].default_value = col; bsd(errM)['Emission Strength'].default_value = (2.0 + 4.0 * blink * (1 - h)) if t < turn + 4.0 or h > 0 else 3.0
        # calendar: pulsing red ring -> green check
        pulse = 1.0 + 0.12 * math.sin(t * 7.0) * (1 - h); ring.scale = ((pulse * (1 - hz) + 0.001) if style == 'calendar' else 0.001,) * 3; ck = sp(t, fix + 0.1, 2.4, 0.4); c1.scale = c2.scale = (max(0.001, ck),) * 3
        for r, (rd, rg) in enumerate(rows):
            u = eio(seg(t, step1 + r * 0.35, 0.5)); rd.scale = (max(0.001, (1 + 0.2 * math.sin(t * 6 + r)) * (1 - u)),) * 3; rg.scale = (max(0.001, u),) * 3
        for i, b in enumerate(bars):
            hh = lerp(0.12 + 0.08 * i, 0.3, hz) * (1 + (0.25 * math.sin(t * 3.0 + i * 1.3)) * (1 - hz)) + 0.02; b.scale = (1, 1, hh / 0.5); b.location = (-0.28 + i * 0.14, -0.03, -0.42 + hh / 2)
        # landlord: worried at the screen, relaxed and smiling after the fix
        w = 1 - hz; sit = 0.5 + 0.5 * math.sin(t * 2.2); joy = eio(seg(t, fix, 0.3)) * (1 - eio(seg(t, fix + 0.9, 0.6)))
        LL.pose(pos=(-0.45, 1.4, 0.28), yaw=math.pi / 2 - 0.35, lean=lerp(-0.14, 0.2, w) + 0.03 * sit * w, nod=0.05 * w, turn=0.2 * math.sin(t * 1.1) * w, armL=lerp(0.25, 1.1 + 0.15 * sit, w) + 2.6 * joy,
                armR=lerp(0.25, 1.05 + 0.1 * math.sin(t * 9.0), w) + 2.6 * joy, armLz=0.3 * joy, armRz=0.3 * joy, smile=lerp(1.3, 0.0, w), wide=0.5 * w * (1 - seg(t, turn + 1.5, 0.5)), brow=0.35 * w, browY=0.02 * w, blink=L.blink(t))
        loc, tg, fov = camf(t); cam.rotation_euler = (0, 0, 0); L.aim(cam, loc, tg, fov, t, 0.6, 2.2, kick=L.punch(t, (turn, fix)), roll=0.01 * math.sin(t * 0.7))
        lamp.data.energy = 30 + 25 * hz
    return upd, cx
