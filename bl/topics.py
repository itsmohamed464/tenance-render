# Topic definitions -> specs (bl/specs/<id>.json) + V entries. One entry per video concept (id X9x). Cue words are [DE, EN] candidates.
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); V = HERE + '/../v2/'
def groups(id_, lang):
    w = json.load(open(f'{V}words/{id_}_{lang}.json')); segs = []; cur = 0
    for x in w:
        cur += 1
        if re.search(r'[.,:]$', x['text']): segs.append(cur); cur = 0
    if cur: segs.append(cur)
    out = []
    for n in segs:
        if n <= 4: out.append(n)
        elif n == 5: out += [3, 2]
        elif n == 6: out += [3, 3]
        elif n == 7: out += [4, 3]
        elif n == 8: out += [4, 4]
        else:
            while n > 4: out.append(3); n -= 3
            out.append(n)
    assert sum(out) == len(w), (id_, lang, sum(out), len(w)); return out
CUEKEYS = ['night', 'write', 'ans', 'cause', 'step1', 'step2', 'fix', 'sleep', 'save', 'cta']
def spec(t):
    c = t['cues']; pre = [[k, c[k]] for k in ('night', 'write')]; post = [[k, c[k]] for k in CUEKEYS[2:]]
    tags = [dict(k='bad', cls='warn', anchor='focus2', dy=-210, **{'in': ['write', 0.3], 'out': ['turn', 0.5]}), dict(k='van', cls='warn', anchor='van', dy=-90, **{'in': ['write', 0.5], 'out': ['ans', 0.2]}),
            dict(k='cancel', cls='ok', anchor='van', dy=-90, **{'in': ['ans', 0.5], 'out': ['ans', 2.2]}), dict(k='cause', cls='warn', anchor='focus', dy=-200, **{'in': ['cause', 0.05], 'out': ['step1', -0.15]}),
            dict(k='s1', cls='step', anchor='focus', dy=-200, **{'in': ['step1', -0.05], 'out': ['step2', -0.15]}), dict(k='s2', cls='step', anchor='focus', dy=-200, **{'in': ['step2', -0.05], 'out': ['fix', -0.25]}),
            dict(k='ok', cls='ok', anchor='focus2', dy=-190, **{'in': ['fix', 0.05], 'out': ['sleep', -0.4]}), dict(k='sl', cls='ok', anchor='ll', dy=-170, **{'in': ['sleep', 0.2], 'out': ['save', -0.1]})]
    sfx = [['buzz', 'night', 0.1, -10], ['send', 'write', -0.1, -13], ['pop', 'ans', 0.1, -12], ['chime', 'fix', 0.3, -11], ['kaching', 'save', 0.1, -12]] + t.get('sfx', [])
    def S(x): return {k: v for k, v in x.items() if k not in ('bad', 'van', 'cancel', 'cause', 's1', 's2', 'ok', 'sl')} | {'tags': {k: x[k] for k in ('bad', 'van', 'cancel', 'cause', 's1', 's2', 'ok', 'sl')}}
    return dict(scene=t['scene'], fps=30, de=S(t['de']), en=S(t['en']), pre=pre, post=post, hook={'out': ['write', -0.15]}, chat={'in1': ['write', -0.12], 'in2': ['ans', 0.08], 'out1': ['cause', -0.5], 'out2': ['cause', -0.44]},
                card={'t': ['cause', -0.3], 'lines': [['cause', 0.1], ['step1', 0], ['fix', 0]], 'out': ['save', -0.12]}, tags=tags, save=['save', 0.05], sfx=sfx)
MUSIC = "{ f: 'm3E3.mp3', segs: [{ f: 'm2A2.mp3', src: 0, at: 0, db: -4 }, { src: 6.0, at: 'turn', lead: -0.05 }], db: -16, boost: 0.9 }"
def write(id_, t):
    s = spec(t); s['gr'] = [groups(id_, 'de'), groups(id_, 'en')]; json.dump(s, open(f'{HERE}/specs/{id_}.json', 'w'), ensure_ascii=False, indent=1)
def addv(id_, t, jobid):
    p = V + 'r2.mjs'; r = open(p).read()
    if f"  {id_}: {{ f:" not in r: j = r.index('\n', r.index('  X71: { f:')); r = r[:j + 1] + f"  {id_}: {MUSIC},\n" + r[j + 1:]
    for l in ('de', 'en'):
        key = f"  '{jobid}-{l}': {{"
        if key not in r: j = r.index('\n', r.index("  'X71-en': {")); r = r[:j + 1] + f"{key} name: '{t['names'][l]}', concept: '{id_}', lang: '{l}', tempo: 1.07, off: 0.15, mb: 1, pr: 1, crf: 16, bl: '{t['scene']}', fps: 30 }},\n" + r[j + 1:]
    open(p, 'w').write(r)
TOPICS = {}
exec(open(HERE + '/topic_defs.py').read())
if __name__ == '__main__':
    for id_ in sys.argv[1:]:
        t = TOPICS[id_]; write(id_, t); addv(id_, t, t.get('job', id_)); print('spec + V', id_)
