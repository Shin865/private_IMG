"""
Border Service — Add borders, padding, and canvas resize.
"""
from PIL import Image
from typing import Optional, Tuple


def add_border(
    img: Image.Image,
    top: int = 20,
    bottom: int = 20,
    left: int = 20,
    right: int = 20,
    color: str = "#FFFFFF",
) -> Image.Image:
    """Add border/padding around image."""
    r, g, b = _parse_color(color)
    new_w = img.size[0] + left + right
    new_h = img.size[1] + top + bottom

    if img.mode in ("RGBA", "LA"):
        canvas = Image.new("RGBA", (new_w, new_h), (r, g, b, 255))
        canvas.paste(img, (left, top), img if img.mode == "RGBA" else None)
    else:
        canvas = Image.new("RGB", (new_w, new_h), (r, g, b))
        canvas.paste(img, (left, top))

    return canvas


def canvas_resize(
    img: Image.Image,
    canvas_width: int,
    canvas_height: int,
    position: str = "center",
    color: str = "#FFFFFF",
) -> Image.Image:
    """Resize canvas (expand/shrink) and position image."""
    r, g, b = _parse_color(color)

    if img.mode in ("RGBA", "LA"):
        canvas = Image.new("RGBA", (canvas_width, canvas_height), (r, g, b, 255))
    else:
        canvas = Image.new("RGB", (canvas_width, canvas_height), (r, g, b))

    # Calculate position
    iw, ih = img.size
    positions = {
        "center": ((canvas_width - iw) // 2, (canvas_height - ih) // 2),
        "top-left": (0, 0),
        "top-center": ((canvas_width - iw) // 2, 0),
        "top-right": (canvas_width - iw, 0),
        "center-left": (0, (canvas_height - ih) // 2),
        "center-right": (canvas_width - iw, (canvas_height - ih) // 2),
        "bottom-left": (0, canvas_height - ih),
        "bottom-center": ((canvas_width - iw) // 2, canvas_height - ih),
        "bottom-right": (canvas_width - iw, canvas_height - ih),
    }
    px, py = positions.get(position, positions["center"])

    if img.mode == "RGBA":
        canvas.paste(img, (px, py), img)
    else:
        canvas.paste(img, (px, py))

    return canvas


def _parse_color(color: str) -> Tuple[int, int, int]:
    """Parse hex color to RGB."""
    color = color.lstrip("#")
    if len(color) == 6:
        return int(color[0:2], 16), int(color[2:4], 16), int(color[4:6], 16)
    return 255, 255, 255
