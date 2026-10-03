"""Check brand exports and package the exact optical favicon sizes as ICO."""

from pathlib import Path
import json
import shutil
import xml.etree.ElementTree as ET
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "static/brand/v1"
NS = "{http://www.w3.org/2000/svg}"
pngs = list(OUT.glob("*.png"))
assert len(pngs) == 52
for file in OUT.glob("*.svg"):
    tree = ET.parse(file).getroot()
    assert tree.tag == NS + "svg", file
    assert not any(tree.iter(NS + "image")), file
    assert not any(tree.iter(NS + "script")), file
    if file.stem.startswith(("symbol-", "signature-", "wordmark-")):
        assert not any(tree.iter(NS + "text")), file
    for node in tree.iter():
        for key, value in node.attrib.items():
            if key.endswith("href"):
                assert value.startswith("#"), (file, value)

for file in pngs:
    with Image.open(file) as image:
        transparent = file.stem.startswith(("symbol-", "signature-", "wordmark-", "booster-", "card-back-"))
        assert (image.mode == "RGBA" if transparent else image.mode in ("RGB", "RGBA")), file
        assert image.convert("RGBA").getchannel("A").getextrema() == ((0, 255) if transparent else (255, 255)), file
        if file.stem.startswith(("icon-", "favicon-")):
            expected = int(file.stem.split("-")[-1])
            assert image.size == (expected, expected), file
        if file.stem == "social-card":
            assert image.size == (1200, 630)

images = [Image.open(OUT / f"favicon-{size}.png").convert("RGBA") for size in (48, 32, 16)]
target = OUT / "favicon.ico"
images[0].save(target, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)], append_images=images[1:])
with Image.open(target) as icon:
    assert icon.ico.sizes() == {(16, 16), (32, 32), (48, 48)}
    for image in images:
        assert icon.ico.getimage(image.size).tobytes() == image.tobytes()
        image.close()
shutil.copyfile(target, ROOT / "static/favicon.ico")
shutil.copyfile(OUT / "icon-180.png", ROOT / "static/apple-touch-icon.png")
for name in ("barlow-OFL.txt", "barlowcondensed-OFL.txt"):
    shutil.copyfile(ROOT / "static/fonts/arcade" / name, OUT / name)
manifest = json.loads((ROOT / "static/site.webmanifest").read_text(encoding="utf-8"))
for icon in manifest["icons"]:
    assert (ROOT / "static" / icon["src"].lstrip("/")).is_file()
inventory = json.loads((OUT / "inventory.json").read_text(encoding="utf-8"))
inventory["files"] = sorted(file.name for file in OUT.iterdir() if file.is_file())
(OUT / "inventory.json").write_text(json.dumps(inventory, ensure_ascii=False, indent="\t") + "\n", encoding="utf-8")
print(f"Validated {len(pngs)} PNGs, standalone vectors, manifest references and ICO 16/32/48.")
