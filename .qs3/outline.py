import json, struct, sys, math

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
    out = []
    for i in range(acc['count']):
        o = base + i * stride
        out.append(struct.unpack_from('<' + ch * n, b, o))
    return out

path = sys.argv[1]
rotate = len(sys.argv) > 2 and sys.argv[2] == 'rotate'
g, b = load(path)
prim = g['meshes'][0]['primitives'][0]
pos = read(g, b, prim['attributes']['POSITION'])
idx = [i[0] for i in read(g, b, prim['indices'])] if 'indices' in prim else range(len(pos))

if rotate:  # -90 deg about y: (x,y,z) -> (-z, y, x)
    pos = [(-p[2], p[1], p[0]) for p in pos]

pts = []
for t in range(0, len(idx) - 2, 3):
    tri = [pos[idx[t + k]] for k in range(3)]
    for k in range(3):
        a, c = tri[k], tri[(k + 1) % 3]
        if (a[0] >= 0) != (c[0] >= 0):
            s = a[0] / (a[0] - c[0])
            pts.append((a[1] + (c[1] - a[1]) * s, a[2] + (c[2] - a[2]) * s))

print('outline points:', len(pts))
ys = [p[0] for p in pts]; zs = [p[1] for p in pts]
print('y %.3f..%.3f   z %.3f..%.3f' % (min(ys), max(ys), min(zs), max(zs)))

# star-convexity check: does an angular sort around the centroid give a sane loop?
cy, cz = sum(ys) / len(ys), sum(zs) / len(zs)
print('centroid y=%.3f z=%.3f' % (cy, cz))

W, H = 62, 34
grid = [[' '] * W for _ in range(H)]
for y, z in pts:
    col = int((z - min(zs)) / (max(zs) - min(zs) + 1e-9) * (W - 1))
    row = int((max(ys) - y) / (max(ys) - min(ys) + 1e-9) * (H - 1))
    grid[row][col] = '#'
cc = int((cz - min(zs)) / (max(zs) - min(zs) + 1e-9) * (W - 1))
cr = int((max(ys) - cy) / (max(ys) - min(ys) + 1e-9) * (H - 1))
grid[cr][cc] = '+'
print('   (z across, y up; + = centroid)')
for r in grid:
    print('   |' + ''.join(r) + '|')
