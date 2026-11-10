# Blender helper library (runs inside Blender 4.2+/5.x, also via the bpy module). Everything is baked from pure functions of time.
import bpy, bmesh, math, json, os, sys
from mathutils import Vector, Euler, noise

def hexc(h, a=1.0):
    h = h.lstrip('#'); r, g, b = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    f = lambda c: (c / 12.92) if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (f(r), f(g), f(b), a)

def lerp(a, b, u): return a + (b - a) * u
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def seg(t, t0, d): return clamp((t - t0) / max(1e-6, d))
def eio(u): u = clamp(u); return u * u * (3 - 2 * u)
def eout(u, k=2.2): u = clamp(u); return 1 - (1 - u) ** k
def spring(t, t0, f=2.4, z=0.35):               # damped overshoot 0->1 after t0
    if t < t0: return 0.0
    x = t - t0; return 1 - math.exp(-x * 7 * z) * math.cos(x * f * 6.283 * 0.9)
def ant(t, t0, d, back=0.12):                    # anticipation: dips slightly negative, then eases to 1
    u = clamp((t - t0) / d)
    return eio(u) - back * math.sin(min(u * 2, 1) * math.pi) * (1 - u)

class Ctx:
    def __init__(s, sc): s.sc = sc; s.keyed = []; s.props = []; s.anch = {}; s.upd = []
    def key(s, *objs): s.keyed += [o for o in objs if o not in s.keyed]; return objs[0] if objs else None
    def prop(s, idb, path): s.props.append((idb, path))

def setup(sc, W, H, fps, T, q='final'):
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = W, H, 100
    sc.render.fps = fps; sc.frame_start = 0; sc.frame_end = int(round(T * fps)) - 1
    for e in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        try: sc.render.engine = e; break
        except TypeError: pass
    ee = sc.eevee; fin = q == 'final'
    for k, v in {'taa_render_samples': 64 if fin else 6, 'use_raytracing': True, 'ray_tracing_method': 'SCREEN', 'use_shadows': True, 'shadow_ray_count': 2, 'shadow_step_count': 6, 'use_gtao': True, 'gtao_distance': 0.8,
                 'fast_gi_method': 'GLOBAL_ILLUMINATION', 'use_fast_gi': True}.items():
        try: setattr(ee, k, v)
        except Exception: pass
    try: ee.ray_tracing_options.resolution_scale = '1' if fin else '4'
    except Exception: pass
    try: sc.render.use_motion_blur = fin; sc.render.motion_blur_shutter = 0.45
    except Exception: pass
    vs = sc.view_settings
    try: vs.view_transform = 'AgX'
    except Exception: pass
    try:
        opts = [o.identifier for o in vs.bl_rna.properties['look'].enum_items]
        vs.look = next((o for o in opts if 'Punchy' in o), vs.look)
    except Exception: pass
    sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 95
    sc.render.use_overwrite = False; sc.render.use_placeholder = True
    sc.render.film_transparent = False

def mat(name, col, rough=0.5, metal=0.0, emit=None, es=0.0, alpha=1.0, spec=0.5):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']; I = b.inputs
    I['Base Color'].default_value = hexc(col); I['Roughness'].default_value = rough; I['Metallic'].default_value = metal
    try: I['Emission Color'].default_value = hexc(emit or col); I['Emission Strength'].default_value = es
    except KeyError: pass
    if alpha < 1: I['Alpha'].default_value = alpha
    return m

def _fin(o, m, bevel, parent, smooth=True):
    if m: o.data.materials.append(m)
    if bevel:
        bv = o.modifiers.new('bv', 'BEVEL'); bv.width = bevel; bv.segments = 3; bv.limit_method = 'ANGLE'
    if smooth:
        o.data.polygons.foreach_set('use_smooth', [True] * len(o.data.polygons)); o.data.update()
    if parent: o.parent = parent
    return o

def box(name, size, loc, m, bevel=0.012, rot=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.active_object; o.name = name
    o.scale = size; bpy.ops.object.transform_apply(scale=True)
    return _fin(o, m, bevel, parent, smooth=False)

def cyl(name, r, h, loc, m, rot=(0, 0, 0), verts=32, bevel=0.0, parent=None):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=verts, location=loc, rotation=rot); o = bpy.context.active_object; o.name = name
    return _fin(o, m, bevel, parent)

def sph(name, r, loc, m, scale=(1, 1, 1), parent=None, seg_=32):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg_, ring_count=seg_ // 2, location=loc); o = bpy.context.active_object; o.name = name; o.scale = scale
    return _fin(o, m, 0, parent)

def empty(name, loc=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(name, None); bpy.context.scene.collection.objects.link(o); o.location = loc
    if parent: o.parent = parent
    return o

def area(name, loc, target, size, energy, col='#ffffff', shape='RECTANGLE', sy=None):
    d = bpy.data.lights.new(name, 'AREA'); d.energy = energy; d.color = hexc(col)[:3]; d.shape = shape; d.size = size
    if shape == 'RECTANGLE': d.size_y = sy or size
    o = bpy.data.objects.new(name, d); bpy.context.scene.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); return o

def point(name, loc, energy, col='#ffffff', r=0.1):
    d = bpy.data.lights.new(name, 'POINT'); d.energy = energy; d.color = hexc(col)[:3]; d.shadow_soft_size = r
    o = bpy.data.objects.new(name, d); bpy.context.scene.collection.objects.link(o); o.location = loc; return o

def world(sc, col='#0b1020', strength=0.6):
    w = bpy.data.worlds.new('w'); w.use_nodes = True; sc.world = w
    bg = w.node_tree.nodes['Background']; bg.inputs['Color'].default_value = hexc(col); bg.inputs['Strength'].default_value = strength

def camera(sc, fov=30):
    cd = bpy.data.cameras.new('cam'); cd.sensor_fit = 'VERTICAL'; cd.angle = math.radians(fov); cd.clip_start = 0.05; cd.clip_end = 200
    cd.dof.use_dof = True; cd.dof.aperture_fstop = 2.8
    o = bpy.data.objects.new('cam', cd); sc.collection.objects.link(o); sc.camera = o; return o

def aim(cam, loc, tgt, fov, t, shake=0.8, fstop=2.8, kick=0.0, roll=0.0):
    n = lambda a, b: noise.noise(Vector((t * 0.9 + a, b, 0.0)))
    cam.location = (loc[0] + 0.03 * shake * n(0, 1), loc[1] + 0.03 * shake * n(5, 2), loc[2] + 0.03 * shake * n(9, 3))
    tg = Vector(tgt) + Vector((0.02 * shake * n(3, 4), 0, 0.02 * shake * n(7, 5)))
    cam.rotation_euler = (tg - Vector(cam.location)).to_track_quat('-Z', 'Y').to_euler()
    cam.rotation_euler.rotate_axis('Z', roll + 0.012 * kick * math.sin(t * 40)); fov = fov * (1 - 0.05 * min(kick, 1.5))
    cam.data.angle = math.radians(fov); cam.data.dof.focus_distance = (tg - Vector(cam.location)).length; cam.data.dof.aperture_fstop = fstop

# ---- pill figure (forward = -Y; yaw 0 faces the camera) ----
class Fig:
    def __init__(s, name, col, hair, pos, scale=1.0):
        s.root = empty(name, pos); s.root.scale = (scale,) * 3
        sk = mat(name + 'sk', '#e8b98f', 0.55); bm = mat(name + 'b', col, 0.55); hm = mat(name + 'h', hair, 0.7); dk = mat('dk' + name, '#161616', 0.2); mo = mat(name + 'm', '#5a2a22', 0.5)
        s.body = empty(name + 'bd', (0, 0, 0), s.root); sph(name + 'torso', 0.2, (0, 0, 0.47), bm, (1, 0.85, 2.15), s.body)
        s.head = empty(name + 'hd', (0, 0, 1.0), s.body); sph(name + 'skull', 0.185, (0, 0, 0.15), sk, (1, 1, 1), s.head); sph(name + 'hair', 0.195, (0, 0.025, 0.19), hm, (1, 1, 0.82), s.head)
        s.eyes = [sph(name + 'e%d' % i, 0.024, (x, -0.165, 0.17), dk, (1, 0.6, 1), s.head) for i, x in enumerate((-0.065, 0.065))]
        s.mouth = sph(name + 'mo', 0.03, (0, -0.172, 0.095), mo, (1, 0.35, 0.5), s.head)
        s.brows = [sph(name + 'br%d' % i, 0.03, (x, -0.168, 0.225), hm, (1.7, 0.35, 0.3), s.head) for i, x in enumerate((-0.065, 0.065))]
        wh = mat('wh' + name, '#ffffff', 0.2, emit='#ffffff', es=0.6)
        for i, x in enumerate((-0.065, 0.065)): sph(name + 'hl%d' % i, 0.008, (x + 0.01, -0.186, 0.18), wh, (1, 0.5, 1), s.head)
        s.arms = []
        for i, sx in enumerate((-1, 1)):
            p = empty(name + 'ar%d' % i, (sx * 0.215, 0, 0.8), s.body); sph(name + 'arm%d' % i, 0.06, (0, 0, -0.17), bm, (1, 1, 2.7), p)
            h = empty(name + 'hand%d' % i, (0, 0, -0.38), p); sph(name + 'hnd%d' % i, 0.058, (0, 0, 0), sk, (1, 1, 1), h); s.arms.append((p, h))
        s.hands = [a[1] for a in s.arms]
    def objs(s):
        return [s.root, s.body, s.head] + [a[0] for a in s.arms] + s.eyes + s.brows + [s.mouth]
    def pose(s, pos=None, yaw=0.0, lean=0.0, roll=0.0, nod=0.0, turn=0.0, armL=0.0, armR=0.0, armLz=0.0, armRz=0.0, squash=0.0, lift=0.0, blink=0.0, smile=0.4, wide=0.0, o=0.0, brow=0.0, browY=0.0):
        if pos is not None: s.root.location = pos
        s.root.rotation_euler = (0, 0, yaw)
        s.body.rotation_euler = (lean, roll, 0); s.body.location = (0, 0, lift)
        sy = 1 - squash; sxz = 1 / math.sqrt(max(0.5, sy)); s.body.scale = (sxz, sxz, sy)
        s.head.rotation_euler = (nod, 0, turn)
        for i, (p, h) in enumerate(s.arms): p.rotation_euler = (-(armL if i == 0 else armR), 0, (armLz if i == 0 else -armRz) * (1 if i == 0 else 1))
        k = max(0.12, 1 - max(blink, 0)) * (1 + 0.4 * wide)
        for e in s.eyes: e.scale = (1 + 0.4 * wide, 0.6, k)
        s.mouth.scale = (1 + 0.6 * smile, 0.35, 0.5 + 1.2 * o + 0.3 * smile)
        for i, b in enumerate(s.brows): b.rotation_euler = (0, brow if i == 0 else -brow, 0); b.location = ((-0.065, 0.065)[i], -0.168, 0.225 + browY)

def blink(t, seed=0.0):
    ph = (t + seed) % 3.7; return math.sin(ph / 0.13 * math.pi) if ph < 0.13 else 0.0

def bake(sc, cx, upd, fps, T, aname=None):
    """evaluate upd(t) per frame, key every registered object/property, export 2D anchors (px) per frame"""
    N = int(round(T * fps)); cam = sc.camera; anch = {k: [] for k in cx.anch}
    from bpy_extras.object_utils import world_to_camera_view
    W, H = sc.render.resolution_x, sc.render.resolution_y
    for f in range(N):
        t = f / fps; sc.frame_set(f); upd(t); bpy.context.view_layer.update()
        for o in cx.keyed:
            for p in ('location', 'rotation_euler', 'scale'): o.keyframe_insert(p, frame=f)
        for idb, path in cx.props: idb.keyframe_insert(path, frame=f)
        for k, o in cx.anch.items():
            c = world_to_camera_view(sc, cam, o.matrix_world.translation); anch[k].append([round(c.x * 1080, 1), round((1 - c.y) * 1920, 1)])
    for fc in ():  # (constant/linear handled by dense keys)
        pass
    return anch

def track(keys):
    """keys: [(t, loc, tgt, fov)] -> f(t) -> (loc, tgt, fov) with smooth ease between neighbours"""
    def f(t):
        if t <= keys[0][0]: k = keys[0]; return k[1], k[2], k[3]
        for a, b in zip(keys, keys[1:]):
            if t < b[0]:
                u = eio((t - a[0]) / max(1e-6, b[0] - a[0]))
                L3 = lambda p, q: tuple(lerp(p[i], q[i], u) for i in range(3))
                return L3(a[1], b[1]), L3(a[2], b[2]), lerp(a[3], b[3], u)
        k = keys[-1]; return k[1], k[2], k[3]
    return f

def torus(name, R, r, loc, m, rot=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=48, minor_segments=12, location=loc, rotation=rot); o = bpy.context.active_object; o.name = name
    return _fin(o, m, 0, parent)

def punch(t, cues, k=9.0):
    """decaying camera kick (0..1) after each cue time"""
    return sum(math.exp(-(t - c) * k) for c in cues if t >= c)
