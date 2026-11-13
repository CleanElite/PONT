"""Build a seamless intro artwork without the logo printed in the source image.

The source is kept unchanged for the opening hold. The clean image is used
only by the two splitting curtain leaves, while the independent wordmark
moves to its permanent header position.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ASSETS = Path(__file__).resolve().parent / "assets"
SOURCE = ASSETS / "pont-intro-c3.jpg"
DEST = ASSETS / "pont-intro-clean.jpg"

with Image.open(SOURCE) as source:
    base = source.convert("RGB")

# Logo occupies the dark-sky area at approximately (300..565, 685..795)
# in the original 865 x 1536 image. Its replacement is reconstructed from
# the actual dark-sky pixels immediately to either side, for each scanline.
reference_w, reference_h = 865, 1536
w, h = base.size
scale_x, scale_y = w / reference_w, h / reference_h
left = round(250 * scale_x)
right = round(620 * scale_x)
top = round(610 * scale_y)
bottom = round(835 * scale_y)
mask = Image.new("L", (w, h), 0)
draw = ImageDraw.Draw(mask)
draw.rounded_rectangle(
    (round(265 * scale_x), round(625 * scale_y),
     round(605 * scale_x), round(815 * scale_y)),
    radius=round(34 * min(scale_x, scale_y)), fill=255
)
mask = mask.filter(ImageFilter.GaussianBlur(max(1, round(26 * min(scale_x, scale_y)))))
replacement = base.copy()
src = base.load()
dest = replacement.load()

# Linear interpolation between untouched neighboring columns creates a
# naturally changing dark background instead of a flat rectangle. The
# blurred alpha ensures no visible box-shaped boundary.
for y in range(max(0, top), min(h, bottom + 1)):
    a = src[max(0, left), y]
    b = src[min(w - 1, right), y]
    for x in range(max(0, left), min(w, right + 1)):
        t = (x - left) / max(1, right - left)
        dest[x, y] = tuple(round(a[channel] * (1 - t) + b[channel] * t) for channel in range(3))

base.paste(replacement, (0, 0), mask)
base.save(DEST, format="JPEG", quality=95, subsampling=0, optimize=True)
print(f"Created {DEST}: {w}x{h}")
