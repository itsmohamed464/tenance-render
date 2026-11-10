# usage (Blender):  blender -b --factory-startup -P bl/render.py -- scene=heat90 k=/path/k.json out=/path/dir fps=30 q=final [still=1.0,2.5] [res=1080x1920]
# usage (bpy module): python bl/render.py scene=... (same key=value args)
import sys, os, json, importlib
here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here); sys.path.insert(0, os.path.join(here, 'scenes'))
import bpy, lib as L
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
A = dict(a.split('=', 1) for a in args if '=' in a)
spec = json.load(open(A['k'])); K, T = spec['K'], spec['T']; fps = int(A.get('fps', 30)); q = A.get('q', 'final')
W, H = [int(x) for x in A.get('res', '1080x1920').split('x')]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; L.setup(sc, W, H, fps, T, q)
mod = importlib.import_module(A['scene']); upd, cx = mod.build(L, K, T, spec.get('lang', 'de'))
out = A['out']; os.makedirs(out, exist_ok=True)
if 'still' in A:
    for ts in A['still'].split(','):
        t = float(ts); f = int(round(t * fps)); sc.frame_set(f); upd(t); bpy.context.view_layer.update()
        sc.render.image_settings.file_format = 'JPEG'; sc.render.filepath = os.path.join(out, 'still_%s.jpg' % ts); bpy.ops.render.render(write_still=True)
    sys.exit(0)
anch = L.bake(sc, cx, upd, fps, T); json.dump(anch, open(os.path.join(out, 'anchors.json'), 'w'))
if 'bake' in A: sys.exit(0)
sc.render.filepath = os.path.join(out, 'f_'); bpy.ops.render.render(animation=True)
print('BLRENDER DONE', len(os.listdir(out)))
