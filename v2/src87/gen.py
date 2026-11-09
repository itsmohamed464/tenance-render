import sys
V='/home/user/tenance-render/v2/'
hand=open(V+'src87/hand.js').read().rstrip('\n')
for n in sys.argv[1:]:
    s=open(f'{V}src87/x{n}_src.js').read()
    assert '    //@HAND' in s
    open(f'{V}x{n}_body.js','w').write(s.replace('    //@HAND',hand))
    print('gen',n)
