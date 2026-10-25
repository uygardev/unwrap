"""Writes the vector sources assets/icon.svg and assets/tray.svg.

The pilcrow keeps the proportions of the original 512 px icon (measured in its pixel grid);
the body follows Apple's macOS icon grid: an 824 px continuous-corner square on a 1024 px canvas.
Run `npm run build:icons` afterwards to render every PNG size and icon.icns.
"""
import json
import math
from pathlib import Path

ASSETS = Path(__file__).resolve().parent.parent / 'assets'
BACKGROUND = '#212121'
GLYPH = '#EAEAEA'

# Pilcrow in the original 512 px icon: (left, top, right, bottom, radii) with radii for the
# top-left, top-right, bottom-right and bottom-left corners.
BOWL = (192, 200, 77)  # centre x, centre y, radius
PARTS = [
    (190, 123, 206, 277, (0, 0, 0, 0)),     # fills the bowl up to the left stem, overlapping both
    (192, 123, 380, 166, (0, 9, 9, 0)),     # top bar
    (204, 123, 247, 388, (0, 0, 10, 10)),   # left stem
    (293, 123, 336, 388, (0, 0, 10, 10)),   # right stem
]
GLYPH_BOX = (115, 123, 380, 388)


def fmt(value):
    return f'{value:.2f}'.rstrip('0').rstrip('.')


def rect_path(left, top, right, bottom, radii):
    tl, tr, br, bl = radii
    d = [f'M{fmt(left + tl)} {fmt(top)}', f'H{fmt(right - tr)}']
    if tr: d.append(f'A{fmt(tr)} {fmt(tr)} 0 0 1 {fmt(right)} {fmt(top + tr)}')
    d.append(f'V{fmt(bottom - br)}')
    if br: d.append(f'A{fmt(br)} {fmt(br)} 0 0 1 {fmt(right - br)} {fmt(bottom)}')
    d.append(f'H{fmt(left + bl)}')
    if bl: d.append(f'A{fmt(bl)} {fmt(bl)} 0 0 1 {fmt(left)} {fmt(bottom - bl)}')
    d.append(f'V{fmt(top + tl)}')
    if tl: d.append(f'A{fmt(tl)} {fmt(tl)} 0 0 1 {fmt(left + tl)} {fmt(top)}')
    return ''.join(d) + 'Z'


def left_half_disc_path(cx, cy, r):
    # Only the left half: a full disc would bulge into the gap between the stems.
    # Clockwise like the rectangles, so the overlapping parts add up under the nonzero fill rule.
    return f'M{fmt(cx)} {fmt(cy + r)}A{fmt(r)} {fmt(r)} 0 0 1 {fmt(cx)} {fmt(cy - r)}Z'


def glyph_paths(scale, offset_x, offset_y):
    """The pilcrow scaled from the 512 px grid and moved so its box starts at the offset."""
    x0, y0 = GLYPH_BOX[0], GLYPH_BOX[1]
    tx = lambda x: offset_x + (x - x0) * scale
    ty = lambda y: offset_y + (y - y0) * scale
    cx, cy, r = BOWL
    paths = [left_half_disc_path(tx(cx), ty(cy), r * scale)]
    for left, top, right, bottom, radii in PARTS:
        paths.append(rect_path(tx(left), ty(top), tx(right), ty(bottom), tuple(c * scale for c in radii)))
    return paths


def squircle_path(left, top, size, exponent=5, steps=720):
    """Superellipse |x|^n + |y|^n = 1, close to the continuous corners of macOS icons."""
    half = size / 2
    cx, cy = left + half, top + half
    points = []
    for i in range(steps):
        t = 2 * math.pi * i / steps
        c, s = math.cos(t), math.sin(t)
        x = cx + half * math.copysign(abs(c) ** (2 / exponent), c)
        y = cy + half * math.copysign(abs(s) ** (2 / exponent), s)
        points.append(f'{fmt(x)} {fmt(y)}')
    return 'M' + 'L'.join(points) + 'Z'


def write_icon():
    canvas, body, inset = 1024, 824, 100
    original_body = 430  # size of the dark square in the 512 px icon
    scale = body / original_body
    width = (GLYPH_BOX[2] - GLYPH_BOX[0]) * scale
    height = (GLYPH_BOX[3] - GLYPH_BOX[1]) * scale
    paths = glyph_paths(scale, (canvas - width) / 2, (canvas - height) / 2)
    (ASSETS / 'icon.svg').write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{canvas}" height="{canvas}" '
        f'viewBox="0 0 {canvas} {canvas}">\n'
        f'  <path fill="{BACKGROUND}" d="{squircle_path(inset, inset, body)}"/>\n'
        + f'  <path fill="{GLYPH}" d="{"".join(paths)}"/>\n'
        + '</svg>\n')


def write_tray():
    # Menu bar template image: black glyph on transparency, 16 pt tall in an 18 pt square.
    canvas, glyph = 18, 16
    scale = glyph / (GLYPH_BOX[3] - GLYPH_BOX[1])
    offset = (canvas - glyph) / 2
    paths = glyph_paths(scale, offset, offset)
    (ASSETS / 'tray.svg').write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{canvas}" height="{canvas}" '
        f'viewBox="0 0 {canvas} {canvas}">\n'
        + f'  <path fill="#000" d="{"".join(paths)}"/>\n'
        + '</svg>\n')


def write_icon_composer():
    """Icon Composer document for macOS 26+: the system draws the shape and the glass, we give the
    background colour and the glyph layer. Without it, macOS shows .icns icons inside a grey square.
    The canvas is the icon shape itself (measured in Finder), so the glyph is sized against all of it."""
    canvas = 1024
    scale = canvas / 430
    width = (GLYPH_BOX[2] - GLYPH_BOX[0]) * scale
    height = (GLYPH_BOX[3] - GLYPH_BOX[1]) * scale
    paths = glyph_paths(scale, (canvas - width) / 2, (canvas - height) / 2)
    bundle = ASSETS / 'Unwrap.icon'
    (bundle / 'Assets').mkdir(parents=True, exist_ok=True)
    (bundle / 'Assets' / 'glyph.svg').write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{canvas}" height="{canvas}" '
        f'viewBox="0 0 {canvas} {canvas}">\n'
        f'  <path fill="{GLYPH}" d="{"".join(paths)}"/>\n'
        '</svg>\n')
    srgb = lambda hex_colour: 'srgb:' + ','.join(
        f'{int(hex_colour[i:i + 2], 16) / 255:.5f}' for i in (1, 3, 5)) + ',1.00000'
    (bundle / 'icon.json').write_text(json.dumps({
        'fill': {'solid': srgb(BACKGROUND)},
        'groups': [{
            'layers': [{'image-name': 'glyph.svg', 'name': 'glyph'}],
            'shadow': {'kind': 'neutral', 'opacity': 0.5},
            'translucency': {'enabled': True, 'value': 0.5}
        }],
        'supported-platforms': {'squares': 'shared'}
    }, indent=2) + '\n')


if __name__ == '__main__':
    write_icon()
    write_tray()
    write_icon_composer()
    print('Wrote assets/icon.svg, assets/tray.svg and assets/Unwrap.icon')
