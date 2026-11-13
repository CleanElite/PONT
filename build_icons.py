from pathlib import Path
from io import BytesIO
import cairosvg
from PIL import Image

folder = Path(__file__).resolve().parent
svg = (folder / "pont-app-icon.svg").read_bytes()
for size in (180, 192, 512):
    png = cairosvg.svg2png(bytestring=svg, output_width=size, output_height=size)
    (folder / f"pont-{size}.png").write_bytes(png)
base = Image.new("RGBA", (512, 512), "#071b35")
fg = Image.open(BytesIO(cairosvg.svg2png(bytestring=svg, output_width=410, output_height=410))).convert("RGBA")
base.alpha_composite(fg, (51, 51))
base.save(folder / "pont-maskable-512.png")
for name in ("pont-180.png", "pont-192.png", "pont-512.png", "pont-maskable-512.png"):
    assert (folder / name).stat().st_size > 1000, name
print("PONT iOS and Android icons rendered successfully")
