"""
Watermark Service — Text and image watermarks.
"""
from PIL import Image, ImageDraw, ImageFont
from typing import Optional, Tuple
import math


POSITIONS = {
    "center": lambda iw, ih, tw, th: ((iw - tw) // 2, (ih - th) // 2),
    "top-left": lambda iw, ih, tw, th: (20, 20),
    "top-right": lambda iw, ih, tw, th: (iw - tw - 20, 20),
    "bottom-left": lambda iw, ih, tw, th: (20, ih - th - 20),
    "bottom-right": lambda iw, ih, tw, th: (iw - tw - 20, ih - th - 20),
}


def add_text_watermark(
    img: Image.Image,
    text: str = "SAMPLE",
    position: str = "center",
    opacity: int = 30,
    rotation: int = 0,
    font_size: int = 48,
    color: str = "#FFFFFF",
    tiled: bool = False,
) -> Image.Image:
    """Add text watermark to image."""
    base = img.convert("RGBA")
    txt_layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(txt_layer)

    # Parse color
    r, g, b = _parse_color(color)
    alpha = int(255 * opacity / 100)

    # Try to use a font, fallback to default
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except (OSError, IOError):
        try:
            font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size)
        except (OSError, IOError):
            font = ImageFont.load_default()

    if tiled:
        # Tiled watermark
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        spacing_x = tw + 60
        spacing_y = th + 60

        for y in range(-base.size[1], base.size[1] * 2, spacing_y):
            for x in range(-base.size[0], base.size[0] * 2, spacing_x):
                draw.text((x, y), text, fill=(r, g, b, alpha), font=font)

        if rotation != 0:
            txt_layer = txt_layer.rotate(rotation, expand=False, center=(base.size[0] // 2, base.size[1] // 2))
            txt_layer = txt_layer.crop((0, 0, base.size[0], base.size[1]))
    else:
        # Single watermark
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]

        if rotation != 0:
            temp = Image.new("RGBA", (tw + 20, th + 20), (0, 0, 0, 0))
            temp_draw = ImageDraw.Draw(temp)
            temp_draw.text((10, 10), text, fill=(r, g, b, alpha), font=font)
            temp = temp.rotate(rotation, expand=True, resample=Image.Resampling.BICUBIC)
            tw, th = temp.size
            pos_fn = POSITIONS.get(position, POSITIONS["center"])
            px, py = pos_fn(base.size[0], base.size[1], tw, th)
            txt_layer.paste(temp, (px, py), temp)
        else:
            pos_fn = POSITIONS.get(position, POSITIONS["center"])
            px, py = pos_fn(base.size[0], base.size[1], tw, th)
            draw.text((px, py), text, fill=(r, g, b, alpha), font=font)

    result = Image.alpha_composite(base, txt_layer)
    return result.convert("RGB")


def add_image_watermark(
    img: Image.Image,
    watermark: Image.Image,
    position: str = "center",
    opacity: int = 30,
    scale: float = 0.2,
) -> Image.Image:
    """Add image watermark."""
    base = img.convert("RGBA")

    # Scale watermark
    wm = watermark.convert("RGBA")
    wm_w = int(base.size[0] * scale)
    wm_h = int(wm.size[1] * (wm_w / wm.size[0]))
    wm = wm.resize((wm_w, wm_h), Image.Resampling.LANCZOS)

    # Apply opacity
    alpha_factor = opacity / 100
    wm_data = wm.split()
    if len(wm_data) == 4:
        alpha = wm_data[3].point(lambda p: int(p * alpha_factor))
        wm.putalpha(alpha)

    # Position
    pos_fn = POSITIONS.get(position, POSITIONS["center"])
    px, py = pos_fn(base.size[0], base.size[1], wm_w, wm_h)

    # Paste
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    layer.paste(wm, (px, py), wm)
    result = Image.alpha_composite(base, layer)
    return result.convert("RGB")


def _parse_color(color: str) -> Tuple[int, int, int]:
    """Parse hex color string to RGB tuple."""
    color = color.lstrip("#")
    if len(color) == 6:
        return int(color[0:2], 16), int(color[2:4], 16), int(color[4:6], 16)
    return 255, 255, 255
