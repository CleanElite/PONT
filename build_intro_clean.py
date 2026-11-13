"""Reconstruct the dark-sky area behind the printed PONT logo.

The original artwork remains intact for the intro hold. During the curtain
split, a clean version of the same background is used. The animated wordmark
is independent. All masked pixels are rebuilt, including blurred edges.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ASSETS = Path(__file__).resolve().parent / "assets"
SOURCE = ASSETS / "pont-intro-c3.jpg"
DEST = ASSETS / "pont-intro-clean.jpg"

with Image.open(SOURCE) as source:
    base = source.convert("RGB")

reference_w, reference_h = 865, 1536
w, h = base.size
sx, sy = w / reference_w, h / reference_h
unit = min(sx, sy)

# Deliberately cover the full glowing arc, lettering, and pale reflections
# above the waterline. The mask's feathered edges extend beyond this shape.
mask = Image.new("L", (w, h), 0)
draw = ImageDraw.Draw(mask)
draw.rounded_rectangle(
    (round(226 * sx), round(557 * sy), round(647 * sx), round(815 * sy)),
    radius=round(35 * unit), fill=255
)
mask = mask.filter(ImageFilter.GaussianBlur(max(1, round(31 * unit))))
# Gaussian blur lowers the alpha even in the center (about 250/255).
# That leaked 1–3% of the original white letters as a visible shadow on
# the near-black sky. Restore completely opaque coverage over all logo
# strokes while retaining a smooth, narrower gradient at the perimeter.
mask = mask.point([min(255, round(v * 255 / 155)) for v in range(256)])

# The surrounding sky is a smooth, dark blue gradient. Reconstruct every
# pixel touched by the *blurred* mask from unaffected scanline boundaries.
# Unlike the previous implementation, interpolation is not clipped to an
# inner rectangle: doing so left ghost fragments at the faded mask edges.
left_sample = round(161 * sx)
right_sample = round(709 * sx)
source = base.load()
replacement = base.copy()
output = replacement.load()
alpha = mask.load()

mask_bounds = mask.getbbox()
assert mask_bounds is not None
for y in range(mask_bounds[1], mask_bounds[3]):
    a = source[max(0, left_sample), y]
    b = source[min(w - 1, right_sample), y]
    for x in range(max(0, left_sample), min(w, right_sample + 1)):
        if alpha[x, y] == 0:
            continue
        t = (x - left_sample) / max(1, right_sample - left_sample)
        output[x, y] = tuple(round(a[c] * (1 - t) + b[c] * t) for c in range(3))

# Composite against the original with a wide feather. The full mask footprint
# now uses reconstructed pixels, eliminating leftover glow at mask boundaries.
base.paste(replacement, (0, 0), mask)

# Sanity check: no high-brightness logo strokes remain in the former wordmark.
# Cyan highlights near the horizon and blue ribbons elsewhere are preserved.
check = base.crop((round(315*sx), round(666*sy),
                   round(558*sx), round(787*sy))).convert("L")
assert check.getextrema()[1] < 125, "Residual bright logo detected in cleaned sky"
base.save(DEST, format="JPEG", quality=96, subsampling=0, optimize=True)
(ASSETS / "pont-intro-build-info.txt").write_text(
    f"size={w}x{h}; mask_bbox={mask_bounds}; "
    f"sample_left={left_sample}; sample_right={right_sample}; "
    f"mask_at_center={alpha[round(.5*w),round(.49*h)]}; "
    f"original_center={source[round(.5*w),round(.49*h)]}; "
    f"clean_center={base.getpixel((round(.5*w),round(.49*h)))}\\n",
    encoding="utf-8"
)
print(f"Generated clean curtain image: {w} x {h}, no stationary PONT logo")
