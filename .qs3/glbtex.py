import json, struct, sys, os

def load(path):
    with open(path, 'rb') as f:
        data = f.read()
    magic, version, length = struct.unpack('<III', data[:12])
    off = 12
    chunks = {}
    while off < length:
        clen, ctype = struct.unpack('<II', data[off:off+8])
        chunks[ctype] = data[off+8:off+8+clen]
        off += 8 + clen + ((4 - clen % 4) % 4 if clen % 4 else 0)
    return json.loads(chunks[0x4E4F534A].decode('utf-8')), chunks.get(0x004E4942, b'')

for path in sys.argv[1:]:
    g, b = load(path)
    im = g['images'][0]
    bv = g['bufferViews'][im['bufferView']]
    start = bv.get('byteOffset', 0)
    blob = b[start:start + bv['byteLength']]
    out = os.path.join('.qs3', os.path.splitext(os.path.basename(path))[0] + '-tex.png')
    with open(out, 'wb') as f:
        f.write(blob)
    print('wrote', out, len(blob))
