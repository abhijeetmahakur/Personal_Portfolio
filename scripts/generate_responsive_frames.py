import os
import sys
from PIL import Image
import concurrent.futures

SRC_DIR = "frames_24fps_webp"
OUT_MOBILE = os.path.join("public", "frames_24fps_mobile")
OUT_TABLET = os.path.join("public", "frames_24fps_tablet")

os.makedirs(OUT_MOBILE, exist_ok=True)
os.makedirs(OUT_TABLET, exist_ok=True)

frames = [f for f in os.listdir(SRC_DIR) if f.endswith(".webp")]
frames.sort()

print(f"Found {len(frames)} frames to process.")

def process_frame(filename):
    src_path = os.path.join(SRC_DIR, filename)
    mob_path = os.path.join(OUT_MOBILE, filename)
    tab_path = os.path.join(OUT_TABLET, filename)

    with Image.open(src_path) as img:
        # Tablet: 960 x 540
        tab_img = img.resize((960, 540), Image.Resampling.LANCZOS)
        tab_img.save(tab_path, "WEBP", quality=82, method=4)

        # Mobile: 640 x 360
        mob_img = img.resize((640, 360), Image.Resampling.LANCZOS)
        mob_img.save(mob_path, "WEBP", quality=78, method=4)

    return filename

with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
    results = list(executor.map(process_frame, frames))

print(f"Successfully generated {len(results)} mobile and tablet frames.")
