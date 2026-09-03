"""
Resize Service — Image resizing with multiple algorithms and presets.
"""
from PIL import Image
from typing import Optional, Tuple

from app.config import RESIZE_PRESETS

# Algorithm mapping
RESIZE_ALGORITHMS = {
    "lanczos": Image.Resampling.LANCZOS,
    "bicubic": Image.Resampling.BICUBIC,
    "bilinear": Image.Resampling.BILINEAR,
    "nearest": Image.Resampling.NEAREST,
}


def resize_image(
    img: Image.Image,
    width: Optional[int] = None,
    height: Optional[int] = None,
    maintain_aspect_ratio: bool = True,
    algorithm: str = "lanczos",
    preset: Optional[str] = None,
) -> Image.Image:
    """
    Resize image with various options.

    Args:
        img: PIL Image
        width: Target width (pixels)
        height: Target height (pixels)
        maintain_aspect_ratio: Lock aspect ratio
        algorithm: Resampling algorithm
        preset: Use a preset (overrides width/height)

    Returns:
        Resized PIL Image
    """
    # Use preset if specified
    if preset and preset in RESIZE_PRESETS:
        p = RESIZE_PRESETS[preset]
        width = p["width"]
        height = p["height"]
        maintain_aspect_ratio = False  # Presets are exact sizes

    if width is None and height is None:
        raise ValueError("Either width or height must be specified")

    orig_w, orig_h = img.size
    resample = RESIZE_ALGORITHMS.get(algorithm.lower(), Image.Resampling.LANCZOS)

    if maintain_aspect_ratio:
        if width and height:
            # Fit within the box while maintaining ratio
            ratio = min(width / orig_w, height / orig_h)
            new_w = int(orig_w * ratio)
            new_h = int(orig_h * ratio)
        elif width:
            ratio = width / orig_w
            new_w = width
            new_h = int(orig_h * ratio)
        else:
            ratio = height / orig_h  # type: ignore
            new_w = int(orig_w * ratio)
            new_h = height  # type: ignore
    else:
        new_w = width or orig_w
        new_h = height or orig_h

    # Clamp minimum
    new_w = max(1, new_w)
    new_h = max(1, new_h)

    return img.resize((new_w, new_h), resample)


def get_presets() -> dict:
    """Return all available resize presets."""
    return RESIZE_PRESETS


def get_algorithms() -> list:
    """Return available resize algorithms."""
    return list(RESIZE_ALGORITHMS.keys())
