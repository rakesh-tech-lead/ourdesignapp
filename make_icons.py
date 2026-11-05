"""Draw the JEF Maker icon: an embroidery hoop with a swirl flower and a stitched line."""
import math, os
from PIL import Image, ImageDraw

BG = (43, 36, 32)
HOOP = (217, 163, 95)
FABRIC = (244, 238, 228)
BLADES = [(180, 67, 42), (171, 90, 150), (30, 119, 172)]
GREEN = (47, 89, 51)


def draw(size, full_bleed=False, transparent=False):
    S = 4 * size
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0) if transparent else BG + (255,))
    d = ImageDraw.Draw(im)
    if not full_bleed and not transparent:
        im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=BG + (255,))
    scale = 0.62 if full_bleed or transparent else 0.80   # maskable/adaptive: keep inside safe zone
    c, R = S / 2, S / 2 * scale
    d.ellipse([c - R, c - R, c + R, c + R], fill=HOOP)                       # outer hoop
    r2 = R * 0.86
    d.ellipse([c - r2, c - r2, c + r2, c + r2], fill=FABRIC)                 # fabric
    # swirl flower: 6 blades between two spirals
    rf = R * 0.55
    n, alpha = 6, 2.3
    for i in range(n):
        t0 = i * 2 * math.pi / n
        t1 = t0 + 2 * math.pi / n * 0.82
        pts = []
        for k in range(40):
            r = rf * (0.12 + 0.88 * k / 39)
            pts.append((c + r * math.cos(t0 + alpha * k / 39), c - R * 0.06 + r * math.sin(t0 + alpha * k / 39)))
        for k in range(1, 12):  # round outer edge
            a = t0 + alpha + (t1 - t0) * k / 12
            pts.append((c + rf * math.cos(a), c - R * 0.06 + rf * math.sin(a)))
        for k in range(39, -1, -1):
            r = rf * (0.12 + 0.88 * k / 39)
            pts.append((c + r * math.cos(t1 + alpha * k / 39), c - R * 0.06 + r * math.sin(t1 + alpha * k / 39)))
        d.polygon(pts, fill=BLADES[i % 3])
    d.ellipse([c - rf * 0.16, c - R * 0.06 - rf * 0.16, c + rf * 0.16, c - R * 0.06 + rf * 0.16], fill=GREEN)
    # running stitch line across the bottom
    y = c + R * 0.62
    x = c - R * 0.55
    while x < c + R * 0.5:
        d.rounded_rectangle([x, y - S * 0.008, x + R * 0.12, y + S * 0.008], radius=S * 0.008, fill=GREEN)
        x += R * 0.18
    # hoop screw
    d.rounded_rectangle([c - R * 0.12, c - R - R * 0.14, c + R * 0.12, c - R + R * 0.06], radius=R * 0.04, fill=HOOP)
    return im.resize((size, size), Image.LANCZOS)


def main(out):
    os.makedirs(out, exist_ok=True)
    for s in (192, 512):
        draw(s).save(os.path.join(out, f"icon-{s}.png"))
    draw(512, full_bleed=True).save(os.path.join(out, "icon-maskable-512.png"))
    draw(1024).save(os.path.join(out, "icon-1024.png"))


def android(res_dir):
    """Launcher icons for an Android project (legacy + adaptive foreground)."""
    sizes = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
    for dens, s in sizes.items():
        d = os.path.join(res_dir, f"mipmap-{dens}")
        os.makedirs(d, exist_ok=True)
        draw(s).save(os.path.join(d, "ic_launcher.png"))
        rnd = draw(s, full_bleed=True)
        mask = Image.new("L", (s, s), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, s - 1, s - 1], fill=255)
        rnd.putalpha(mask)
        rnd.save(os.path.join(d, "ic_launcher_round.png"))
        fg = int(s * 108 / 48)
        draw(fg, transparent=True).save(os.path.join(d, "ic_launcher_foreground.png"))


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 2 and sys.argv[1] == "android":
        android(sys.argv[2])
    else:
        main(sys.argv[1] if len(sys.argv) > 1 else "icons")
