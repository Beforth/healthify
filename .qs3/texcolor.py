from PIL import Image
import colorsys

for name in ['chocolate', 'pineapple']:
    im = Image.open('.qs3/%s-tex.png' % name).convert('RGB')
    px = list(im.resize((160, 160)).getdata())
    # sort by luminance and report percentiles, so shadow/mid/highlight are clear
    px.sort(key=lambda c: 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2])
    print('==', name)
    for label, q in [('p10 shadow', 0.10), ('p35', 0.35), ('median', 0.50), ('p75', 0.75), ('p92 lit', 0.92)]:
        c = px[int(len(px) * q)]
        print('   %-11s #%02x%02x%02x  rgb%s' % (label, c[0], c[1], c[2], c))

    # dominant hues, to separate flesh from leaf on the pineapple
    buckets = {}
    for c in px:
        h, s, v = colorsys.rgb_to_hsv(c[0] / 255, c[1] / 255, c[2] / 255)
        if s < 0.2 or v < 0.15:
            continue
        key = int(h * 360) // 15 * 15
        buckets.setdefault(key, []).append(c)
    top = sorted(buckets.items(), key=lambda kv: -len(kv[1]))[:4]
    for hue, group in top:
        r = sum(c[0] for c in group) // len(group)
        g = sum(c[1] for c in group) // len(group)
        b = sum(c[2] for c in group) // len(group)
        print('   hue %3d-%3d  %5.1f%%  #%02x%02x%02x' % (hue, hue + 15, 100 * len(group) / len(px), r, g, b))
