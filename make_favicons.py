from PIL import Image
from pathlib import Path

src = Path("Log_blue.png")     # está en la raíz
out = Path(".")               # salida en la raíz

img = Image.open(src).convert("RGBA")

def save_png(size, filename):
    im = img.resize((size, size), Image.LANCZOS)
    im.save(out / filename, "PNG", optimize=True)

# PNGs recomendados
save_png(32,  "favicon-32x32.png")
save_png(192, "favicon-192x192.png")
save_png(180, "apple-touch-icon.png")

# ICO multi-size (lo ideal para compatibilidad)
img.save(out / "favicon.ico", format="ICO", sizes=[(16,16),(32,32),(48,48),(64,64)])

print("Listo: favicon.ico, favicon-32x32.png, favicon-192x192.png, apple-touch-icon.png")
