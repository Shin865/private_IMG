"""
Crop Service — Image cropping with coordinates, aspect ratio, and percentage.
"""
from PIL import Image
from typing import Optional, Tuple


# Common aspect ratios
ASPECT_RATIOS = {
    "free": None,
    "1:1": (1, 1),
    "4:3": (4, 3),
    "3:4": (3, 4),
    "16:9": (16, 9),
    "9:16": (9, 16),
    "3:2": (3, 2),
    "2:3": (2, 3),
    "5:4": (5, 4),
    "4:5": (4, 5),
}


def crop_image(
    img: Image.Image,
    x: int,
    y: int,
    width: int,
    height: int,
) -> Image.Image:
    """
    Crop image by coordinates.

    Args:
        img: PIL Image
        x: Left offset
        y: Top offset
        width: Crop width
        height: Crop height

    Returns:
        Cropped PIL Image
    """
    img_w, img_h = img.size

    # Clamp values to image bounds
    x = max(0, min(x, img_w - 1))
    y = max(0, min(y, img_h - 1))
    x2 = min(x + width, img_w)
    y2 = min(y + height, img_h)

    if x2 <= x or y2 <= y:
        raise ValueError("Invalid crop area: resulting size would be zero")

    return img.crop((x, y, x2, y2))


def crop_center(
    img: Image.Image,
    width: int,
    height: int,
) -> Image.Image:
    """Crop from center of image."""
    img_w, img_h = img.size
    x = max(0, (img_w - width) // 2)
    y = max(0, (img_h - height) // 2)
    return crop_image(img, x, y, width, height)


def crop_by_aspect_ratio(
    img: Image.Image,
    ratio_w: int,
    ratio_h: int,
) -> Image.Image:
    """Crop to a specific aspect ratio from center."""
    img_w, img_h = img.size
    target_ratio = ratio_w / ratio_h
    current_ratio = img_w / img_h

    if current_ratio > target_ratio:
        # Image is wider, crop width
        new_w = int(img_h * target_ratio)
        new_h = img_h
    else:
        # Image is taller, crop height
        new_w = img_w
        new_h = int(img_w / target_ratio)

    return crop_center(img, new_w, new_h)


def crop_by_percentage(
    img: Image.Image,
    top: float = 0,
    bottom: float = 0,
    left: float = 0,
    right: float = 0,
) -> Image.Image:
    """
    Crop by percentage from each edge.
    Values are 0-100 representing percentage to remove.
    """
    img_w, img_h = img.size
    x = int(img_w * left / 100)
    y = int(img_h * top / 100)
    w = img_w - int(img_w * right / 100) - x
    h = img_h - int(img_h * bottom / 100) - y

    if w <= 0 or h <= 0:
        raise ValueError("Crop percentages too large: resulting size would be zero")

    return crop_image(img, x, y, w, h)


def get_aspect_ratios() -> dict:
    """Return available aspect ratios."""
    return ASPECT_RATIOS
