"""
Compression Service — Quality-based and target-size compression.
"""
import io
from PIL import Image
from typing import Optional, Tuple

from app.services.image_service import prepare_for_format


def compress_by_quality(
    img: Image.Image,
    quality: int = 85,
    output_format: str = "JPEG",
) -> Tuple[bytes, int]:
    """
    Compress image by quality setting.
    Returns (compressed_bytes, file_size).
    """
    quality = max(1, min(100, quality))
    buf = io.BytesIO()
    save_img = prepare_for_format(img, output_format)

    kwargs: dict = {"optimize": True}
    if output_format.upper() in ("JPEG", "JPG"):
        kwargs["quality"] = quality
    elif output_format.upper() == "WEBP":
        kwargs["quality"] = quality
        kwargs["method"] = 4
    elif output_format.upper() == "PNG":
        kwargs["optimize"] = True

    fmt = output_format.upper() if output_format.upper() != "JPG" else "JPEG"
    save_img.save(buf, format=fmt, **kwargs)
    data = buf.getvalue()
    return data, len(data)


def compress_to_target_size(
    img: Image.Image,
    target_size_kb: int,
    output_format: str = "JPEG",
    keep_dimensions: bool = True,
) -> Tuple[bytes, int, int]:
    """
    Binary search for quality that produces file closest to target size.
    Returns (compressed_bytes, file_size, quality_used).
    """
    target_bytes = target_size_kb * 1024

    # Only JPEG and WebP support quality-based compression
    if output_format.upper() not in ("JPEG", "JPG", "WEBP"):
        data, size = compress_by_quality(img, 95, output_format)
        return data, size, 95

    low, high = 1, 95
    best_data = None
    best_size = 0
    best_quality = 95

    for _ in range(15):  # Max 15 iterations of binary search
        mid = (low + high) // 2
        data, size = compress_by_quality(img, mid, output_format)

        if best_data is None or abs(size - target_bytes) < abs(best_size - target_bytes):
            best_data = data
            best_size = size
            best_quality = mid

        if size > target_bytes:
            high = mid - 1
        elif size < target_bytes:
            low = mid + 1
        else:
            break

        if low > high:
            break

    # If still too large even at quality 1, try reducing dimensions
    if best_size > target_bytes and not keep_dimensions:
        scale = (target_bytes / best_size) ** 0.5
        new_w = max(1, int(img.size[0] * scale))
        new_h = max(1, int(img.size[1] * scale))
        resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        data, size = compress_by_quality(resized, best_quality, output_format)
        if abs(size - target_bytes) < abs(best_size - target_bytes):
            best_data = data
            best_size = size

    return best_data, best_size, best_quality  # type: ignore


def get_compression_preset(preset: str) -> int:
    """Return quality value for preset name."""
    presets = {
        "low": 85,
        "medium": 60,
        "high": 30,
    }
    return presets.get(preset.lower(), 85)
