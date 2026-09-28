import json, struct, sys

def load(path):
    with open(path, 'rb') as f:
        data = f.read()
    length = struct.unpack('<III', data[:12])[2]
    off, chunks = 12, {}
    while off < length:
        clen, ctype = struct.unpack('<II', data[off:off+8])
        chunks[ctype] = data[off+8:off+8+clen]
        off += 8 + clen + ((4 - clen % 4) % 4 if clen % 4 else 0)
    return json.loads(chunks[0x4E4F534A].decode('utf-8')), chunks[0x004E4942]

FMT = {5126: ('f', 4), 5125: ('I', 4), 5123: ('H', 2), 5121: ('B', 1)}

def read(g, b, idx):
    acc = g['accessors'][idx]
    bv = g['bufferViews'][acc['bufferView']]
    base = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3}[acc['type']]
    ch, size = FMT[acc['componentType']]
    stride = bv.get('byteStride') or n * size
    return [struct.unpack_from('<' + ch * n, b, base + i * stride) for i in range(acc['count'])]

g, b = load(sys.argv[1])
prim = g['meshes'][0]['primitives'][0]
pos = read(g, b, prim['attributes']['POSITION'])
idx = [i[0] for i in read(g, b, prim['indices'])]

pts = []
for t in range(0, len(idx) - 2, 3):
    tri = [pos[idx[t + k]] for k in range(3)]
    for k in range(3):
        a, c = tri[k], tri[(k + 1) % 3]
        if (a[0] >= 0) != (c[0] >= 0):
            s = a[0] / (a[0] - c[0])
            pts.append((a[1] + (c[1] - a[1]) * s, a[2] + (c[2] - a[2]) * s))

ys = [p[0] for p in pts]
lo, hi = min(ys), max(ys)
N = 30
print('band      y        n   zmin    zmax    span  clusters')
for i in range(N):
    y0 = lo + (hi - lo) * i / N
    y1 = lo + (hi - lo) * (i + 1) / N
    band = sorted(p[1] for p in pts if y0 <= p[0] < y1)
    if not band:
        print('%2d  %7.3f    0' % (i, y0)); continue
    clusters = 1
    for a, c in zip(band, band[1:]):
        if c - a > 0.02:
            clusters += 1
    print('%2d  %7.3f %4d  %6.3f  %6.3f  %6.3f   %d' % (
        i, y0, len(band), band[0], band[-1], band[-1] - band[0], clusters))
