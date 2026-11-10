# usage: python3 bl/mkbl.py X90   -> writes bl/specs/X90.json (caption groups computed from the words files)
import json, re, sys, os
V = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'v2') + '/'
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
SPECS = {}
SPECS['X90'] = dict(
  scene='heat90', fps=30,
  de=dict(hook='23:14 Uhr: Dein Handy brummt 📱', chip='🕚 23:14 · Whg 2B', who='Mieter · Whg 2B', m1='Heizung kalt 🥶 Wohnung 2B', m2='Luft im Heizkörper. Ventil aufdrehen, bis Wasser kommt ✓', ttl='Heizung kalt · Whg 2B', l1='💨 Ursache: Luft im Heizkörper', l2='🔧 Ventil aufdrehen', l3='🔥 Heizung wieder warm',
          tags=dict(zz='💤 Du schläfst', cold='🥶 Heizkörper kalt', air='💨 Luft im Heizkörper', s1='① Ventil aufdrehen', s2='② Wasser kommt: zudrehen', warm='🔥 Warm', sl='😴 Du schläfst weiter'), sv='💶 Spart den Nachteinsatz', end=['Du *schläfst* weiter.', None]),
  en=dict(hook='11:14 pm: your phone buzzes 📱', chip='🕚 11:14 pm · Apt 2B', who='Tenant · Apt 2B', m1='Heating is cold 🥶 Apt 2B', m2='Air in the radiator. Open the valve until water comes ✓', ttl='No heat · Apt 2B', l1='💨 Cause: air in the radiator', l2='🔧 Open the valve', l3='🔥 Heating warm again',
          tags=dict(zz='💤 You sleep', cold='🥶 Radiator cold', air='💨 Air in the radiator', s1='① Open the valve', s2='② Water comes: close it', warm='🔥 Warm', sl='😴 You keep sleeping'), sv='💶 Saves the night call-out', end=['You *keep sleeping*.', None]),
  pre=[['night', ['Elf', 'Eleven']], ['write', ['schreibt', 'writes']]],
  post=[['ans', ['antwortet', 'answers']], ['air', ['Luft', 'air']], ['valve', ['Ventil', 'valve']], ['water', ['Wasser', 'water']], ['warm', ['warm']], ['sleep', ['schläfst', 'sleeping']], ['save', ['spart', 'saves']], ['cta', ['Jetzt', 'Join']]],
  hook={'out': ['write', -0.15]}, chat={'in1': ['write', -0.12], 'in2': ['ans', 0.08], 'out1': ['air', -0.5], 'out2': ['air', -0.44]},
  card={'t': ['air', -0.3], 'lines': [['air', 0.1], ['valve', 0], ['warm', 0]], 'out': ['save', -0.12]},
  tags=[dict(k='zz', cls='step', anchor='zzz', dy=-150, **{'in': ['night', 0.0], 'out': ['night', 0.8]}), dict(k='cold', cls='warn', anchor='rad2', dy=-210, **{'in': ['write', 0.4], 'out': ['turn', 0.6]}),
        dict(k='air', cls='warn', anchor='valve', dy=-200, **{'in': ['air', 0.05], 'out': ['valve', -0.15]}), dict(k='s1', cls='step', anchor='valve', dy=-200, **{'in': ['valve', -0.05], 'out': ['water', -0.15]}),
        dict(k='s2', cls='step', anchor='valve', dy=-200, **{'in': ['water', -0.05], 'out': ['warm', -0.25]}), dict(k='warm', cls='ok', anchor='rad', dy=-190, **{'in': ['warm', 0.05], 'out': ['sleep', -0.4]}),
        dict(k='sl', cls='ok', anchor='ll', dy=-170, **{'in': ['sleep', 0.2], 'out': ['save', -0.1]})],
  save=['save', 0.05],
  sfx=[['buzz', 'night', 0.1, -10], ['pop', 'ans', 0.1, -12], ['send', 'write', -0.1, -13], ['click', 'valve', 0.1, -9], ['wind', 'valve', 0.2, -17], ['drip', 'water', 0.1, -9], ['heater', 'warm', -0.1, -12], ['chime', 'warm', 0.3, -11], ['kaching', 'save', 0.1, -12]],
)
if __name__ == '__main__':
    for id_ in sys.argv[1:]:
        s = SPECS[id_]; s['gr'] = [groups(id_, 'de'), groups(id_, 'en')]
        json.dump(s, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'specs', id_ + '.json'), 'w'), ensure_ascii=False, indent=1); print('wrote', id_)
