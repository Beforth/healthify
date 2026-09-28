import json, struct, sys, os

def load(path):
    with open(path, 'rb') as f:
        data = f.read()
    magic, version, length = struct.unpack('<III', data[:12])
    assert magic == 0x46546C67, 'not a glb'
    off = 12
    chunks = {}
    while off < length:
        clen, ctype = struct.unpack('<II', data[off:off+8])
        body = data[off+8:off+8+clen]
        chunks[ctype] = body
        off += 8 + clen + ((4 - clen % 4) % 4 if clen % 4 else 0)
    gltf = json.loads(chunks[0x4E4F534A].decode('utf-8'))
    bin_ = chunks.get(0x004E4942, b'')
    return gltf, bin_

for path in sys.argv[1:]:
    g, b = load(path)
    print('=' * 70)
    print(os.path.basename(path), '| bin bytes:', len(b))
    print('generator:', g.get('asset', {}).get('generator'))
    print('nodes:', len(g.get('nodes', [])), 'meshes:', len(g.get('meshes', [])),
          'materials:', len(g.get('materials', [])), 'images:', len(g.get('images', [])),
          'textures:', len(g.get('textures', [])))

    for i, n in enumerate(g.get('nodes', [])):
        print('  node[%d] %-24s mesh=%s children=%s scale=%s trans=%s' % (
            i, n.get('name', '?'), n.get('mesh'), n.get('children'),
            n.get('scale'), n.get('translation')))

    for i, m in enumerate(g.get('meshes', [])):
        print('  mesh[%d] %s' % (i, m.get('name', '?')))
        for p in m['primitives']:
            attrs = p['attributes']
            pos = g['accessors'][attrs['POSITION']]
            ntri = g['accessors'][p['index']]['count'] // 3 if 'index' in p else pos['count'] // 3
            idx = p.get('indices')
            ntri = g['accessors'][idx]['count'] // 3 if idx is not None else pos['count'] // 3
            print('     attrs=%s tris=%d mat=%s' % (sorted(attrs.keys()), ntri, p.get('material')))
            print('     POSITION min=%s max=%s' % (pos.get('min'), pos.get('max')))

    for i, m in enumerate(g.get('materials', [])):
        pbr = m.get('pbrMetallicRoughness', {})
        print('  mat[%d] %-20s base=%s metal=%s rough=%s baseTex=%s' % (
            i, m.get('name', '?'), pbr.get('baseColorFactor'),
            pbr.get('metallicFactor'), pbr.get('roughnessFactor'),
            (pbr.get('baseColorTexture') or {}).get('index')))

    for i, im in enumerate(g.get('images', [])):
        bv = g['bufferViews'][im['bufferView']]
        print('  image[%d] %s %s bytes=%d' % (i, im.get('name', '?'), im.get('mimeType'), bv['byteLength']))
