"""
Upscale Service — Image upscaling using Pillow-based algorithms.
Uses advanced interpolation for 2x/4x upscaling without cloud APIs.
For production, Real-ESRGAN can be integrated as an optional enhancement.
"""
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np
import logging

logger = logging.getLogger(__name__)


def upscale_image(
    img: Image.Image,
    scale: int = 2,
    method: str = "lanczos",
    sharpen: bool = True,
    denoise: bool = False,
) -> Image.Image:
    """
    Upscale image using high-quality interpolation.
    
    Args:
        img: Input PIL Image
        scale: Scale factor (2 or 4)
        method: Upscaling method (lanczos, bicubic, enhanced)
        sharpen: Apply sharpening after upscale
        denoise: Apply light denoising
    
    Returns:
        Upscaled PIL Image
    """
    if scale not in (2, 3, 4):
        raise ValueError("Scale must be 2, 3, or 4")

    # Convert palette/grayscale modes to RGB
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")

    new_w = img.size[0] * scale
    new_h = img.size[1] * scale

    if method == "lanczos":
        result = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    elif method == "bicubic":
        result = img.resize((new_w, new_h), Image.Resampling.BICUBIC)
    elif method == "enhanced":
        # Multi-step upscale for better quality
        result = _enhanced_upscale(img, scale)
    else:
        result = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Post-processing
    if denoise:
        result = _denoise(result)

    if sharpen:
        result = _adaptive_sharpen(result, scale)

    return result


def _enhanced_upscale(img: Image.Image, scale: int) -> Image.Image:
    """
    Multi-step enhanced upscaling:
    1. Upscale in 2x steps using LANCZOS
    2. Apply unsharp mask between steps
    3. Final detail enhancement
    """
    result = img.copy()
    remaining_scale = scale

    while remaining_scale > 1:
        step_scale = min(2, remaining_scale)
        new_w = int(result.size[0] * step_scale)
        new_h = int(result.size[1] * step_scale)

        # Upscale with LANCZOS
        result = result.resize((new_w, new_h), Image.Resampling.LANCZOS)

        # Apply subtle unsharp mask between steps
        if remaining_scale > 2:
            result = result.filter(ImageFilter.UnsharpMask(radius=1.5, percent=30, threshold=2))

        remaining_scale = remaining_scale // step_scale if step_scale > 1 else 1

    # Final detail enhancement
    enhancer = ImageEnhance.Contrast(result)
    result = enhancer.enhance(1.05)

    return result


def _adaptive_sharpen(img: Image.Image, scale: int) -> Image.Image:
    """Apply adaptive sharpening based on scale factor."""
    if scale >= 4:
        return img.filter(ImageFilter.UnsharpMask(radius=2.0, percent=80, threshold=2))
    elif scale >= 2:
        return img.filter(ImageFilter.UnsharpMask(radius=1.5, percent=50, threshold=2))
    return img


def _denoise(img: Image.Image) -> Image.Image:
    """Apply light denoising using median filter."""
    # Convert to numpy for processing
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")
    
    # Use a very gentle smooth to reduce noise without losing detail
    return img.filter(ImageFilter.MedianFilter(size=3))


def get_available_methods() -> list:
    """Return available upscale methods."""
    return [
        {"key": "lanczos", "label": "Lanczos", "desc": "High-quality standard upscaling"},
        {"key": "bicubic", "label": "Bicubic", "desc": "Fast, smooth results"},
        {"key": "enhanced", "label": "Enhanced", "desc": "Multi-step with detail preservation"},
    ]
