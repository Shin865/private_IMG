"""
Image Service — Core image reading, saving, and processing functions.
"""
import io
from pathlib import Path
from typing import Optional, Tuple

from PIL import Image, ImageOps
import numpy as np

from app.config import SUPPORTED_OUTPUT_FORMATS
from app.utils.temp_manager import (
    generate_file_id,
    get_output_path,
    get_file_size_str,
    find_file_by_id,
)


def read_image_from_bytes(file_content: bytes) -> Image.Image:
    """Open image from bytes."""
    return Image.open(io.BytesIO(file_content))


def read_image_from_path(file_path: Path) -> Image.Image:
    """Open image from file path."""
    return Image.open(file_path)


def read_image_from_file_id(file_id: str) -> Image.Image:
    """Open image from file ID (searches temp directories)."""
    path = find_file_by_id(file_id)
    if not path or not path.exists():
        raise FileNotFoundError(f"File not found: {file_id}")
    return Image.open(path)


def get_image_info(img: Image.Image, file_size: Optional[int] = None) -> dict:
    """Extract image information."""
    dpi = img.info.get("dpi", (72, 72))
    if isinstance(dpi, tuple):
        dpi_x, dpi_y = int(dpi[0]), int(dpi[1])
    else:
        dpi_x = dpi_y = int(dpi)

    info = {
        "width": img.size[0],
        "height": img.size[1],
        "format": img.format or "Unknown",
        "mode": img.mode,
        "dpi_x": dpi_x,
        "dpi_y": dpi_y,
        "has_alpha": img.mode in ("RGBA", "LA", "PA"),
        "is_animated": getattr(img, "is_animated", False),
        "n_frames": getattr(img, "n_frames", 1),
    }

    if file_size is not None:
        info["file_size"] = file_size
        info["file_size_str"] = get_file_size_str(file_size)

    return info


def save_image(
    img: Image.Image,
    format: str = "PNG",
    quality: int = 95,
    extension: Optional[str] = None,
    dpi: Optional[Tuple[int, int]] = None,
) -> Tuple[str, Path, int]:
    """
    Save image to output directory.
    Returns (file_id, file_path, file_size).
    """
    file_id = generate_file_id()

    # Determine extension
    if extension is None:
        fmt_exts = SUPPORTED_OUTPUT_FORMATS.get(format.upper(), [])
        extension = fmt_exts[0] if fmt_exts else ".png"

    output_path = get_output_path(file_id, extension)

    # Prepare image for saving
    save_img = prepare_for_format(img, format)

    # Build save kwargs
    save_kwargs: dict = {}
    if format.upper() in ("JPEG", "JPG"):
        save_kwargs["quality"] = quality
        save_kwargs["optimize"] = True
    elif format.upper() == "WEBP":
        save_kwargs["quality"] = quality
        save_kwargs["method"] = 4
    elif format.upper() == "PNG":
        save_kwargs["optimize"] = True

    if dpi:
        save_kwargs["dpi"] = dpi

    save_img.save(str(output_path), format=format.upper() if format.upper() != "JPG" else "JPEG", **save_kwargs)

    file_size = output_path.stat().st_size
    return file_id, output_path, file_size


def prepare_for_format(img: Image.Image, format: str) -> Image.Image:
    """
    Prepare image for a specific output format.
    Handles color mode conversions (e.g., RGBA -> RGB for JPEG).
    """
    fmt = format.upper()
    if fmt in ("JPEG", "JPG"):
        if img.mode in ("RGBA", "LA", "PA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            if "A" in img.mode or img.mode == "PA":
                background.paste(img, mask=img.split()[-1])
            else:
                background.paste(img)
            return background
        elif img.mode != "RGB":
            return img.convert("RGB")
    elif fmt == "PNG":
        if img.mode not in ("RGBA", "RGB", "L", "LA", "P"):
            return img.convert("RGBA")
    elif fmt in ("BMP", "ICO"):
        if img.mode == "RGBA":
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3])
            return background
        elif img.mode not in ("RGB", "L"):
            return img.convert("RGB")

    return img


def image_to_bytes(img: Image.Image, format: str = "PNG", quality: int = 95) -> bytes:
    """Convert PIL Image to bytes."""
    buf = io.BytesIO()
    save_img = prepare_for_format(img, format)

    save_kwargs: dict = {}
    if format.upper() in ("JPEG", "JPG"):
        save_kwargs["quality"] = quality
        save_kwargs["optimize"] = True
    elif format.upper() == "WEBP":
        save_kwargs["quality"] = quality
    elif format.upper() == "PNG":
        save_kwargs["optimize"] = True

    save_img.save(buf, format=format.upper() if format.upper() != "JPG" else "JPEG", **save_kwargs)
    buf.seek(0)
    return buf.getvalue()
